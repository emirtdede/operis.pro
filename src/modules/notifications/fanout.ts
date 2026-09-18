import { getDb, schema } from "@/src/lib/db";
import { NotificationService } from "@/src/modules/notifications/service";
import { and, asc, eq, gt, sql } from "drizzle-orm";

export interface FanoutEventPayload {
  listingId: string;
  title: string;
  slug: string;
  tags?: string[];
  ownerUserId: string;
  categoryId?: string;
  activationSeq?: number;
}

export type FanoutResult = "COMPLETED" | "LEASE_LOST" | "ERROR";

/**
 * Processes broadcast/fan-out notification events (LISTING_PUBLISHED, LISTING_REACTIVATED)
 * using a persistent DB cursor (notification_fanout_progress), 50-user transactional chunks,
 * and lease-token fencing (B16).
 */
export async function processFanoutEvent(
  eventId: string,
  leaseToken: string,
  options?: { batchSize?: number }
): Promise<FanoutResult> {
  const db = getDb();
  const batchSize = options?.batchSize ?? 50;

  // 1. Ensure progress row exists
  await db
    .insert(schema.notificationFanoutProgress)
    .values({
      eventId,
      phase: "RADAR",
      lastUserId: null,
      updatedAt: new Date(),
    })
    .onConflictDoNothing({ target: schema.notificationFanoutProgress.eventId });

  let done = false;

  while (!done) {
    let pageResult: {
      phase: "RADAR" | "CATEGORY" | "DONE";
      leaseLost?: boolean;
    };

    try {
      pageResult = await db.transaction(async (tx) => {
        // Step A: Row-lock the outbox event and verify lease ownership
        let eventQuery = tx
          .select({
            id: schema.outboxEvents.id,
            status: schema.outboxEvents.status,
            leaseToken: schema.outboxEvents.leaseToken,
            leaseUntil: schema.outboxEvents.leaseUntil,
            payloadJson: schema.outboxEvents.payloadJson,
          })
          .from(schema.outboxEvents)
          .where(eq(schema.outboxEvents.id, eventId));

        if (typeof (eventQuery as { for?: unknown }).for === "function") {
          eventQuery = (eventQuery as { for: (mode: string) => typeof eventQuery }).for("update");
        }

        const [lockedEvent] = await eventQuery.limit(1);
        const now = new Date();

        if (
          !lockedEvent ||
          lockedEvent.status !== "PROCESSING" ||
          lockedEvent.leaseToken !== leaseToken ||
          !lockedEvent.leaseUntil ||
          lockedEvent.leaseUntil <= now
        ) {
          return { phase: "DONE", leaseLost: true };
        }

        // Extend leaseUntil by 60 seconds within each batch transaction
        await tx
          .update(schema.outboxEvents)
          .set({
            leaseUntil: new Date(Date.now() + 60000),
          })
          .where(
            and(
              eq(schema.outboxEvents.id, eventId),
              eq(schema.outboxEvents.leaseToken, leaseToken),
              eq(schema.outboxEvents.status, "PROCESSING")
            )
          );

        // Step B: Read current fanout progress
        const [progress] = await tx
          .select()
          .from(schema.notificationFanoutProgress)
          .where(eq(schema.notificationFanoutProgress.eventId, eventId))
          .limit(1);

        if (!progress || progress.phase === "DONE") {
          return { phase: "DONE" as const };
        }

        const payload = lockedEvent.payloadJson as FanoutEventPayload;
        const listingId = payload.listingId || lockedEvent.id;
        const activationSeq = payload.activationSeq ?? 1;
        const title = payload.title || "";
        const slug = payload.slug || "";
        const tags = payload.tags || [];
        const ownerUserId = payload.ownerUserId || "";
        const categoryId = payload.categoryId || "";

        if (progress.phase === "RADAR") {
          const lowerTags = tags.map((t) => t.toLowerCase().trim()).filter(Boolean);

          if (lowerTags.length === 0) {
            // No tags, transition immediately to CATEGORY
            await tx
              .update(schema.notificationFanoutProgress)
              .set({ phase: "CATEGORY", lastUserId: null, updatedAt: now })
              .where(eq(schema.notificationFanoutProgress.eventId, eventId));
            return { phase: "CATEGORY" as const };
          }

          const conditions = [
            sql`${schema.profiles.userId} != ${ownerUserId}`,
            sql`cardinality(${schema.profiles.trackedSkills}) > 0`,
            sql`EXISTS (
              SELECT 1 FROM unnest(${schema.profiles.trackedSkills}) AS s
              WHERE lower(s) = ANY(ARRAY[${sql.join(
                lowerTags.map((t) => sql`${t}`),
                sql`, `
              )}])
            )`,
            sql`NOT EXISTS (
              SELECT 1 FROM ${schema.blocks}
              WHERE (${schema.blocks.blockerUserId} = ${schema.profiles.userId} AND ${schema.blocks.blockedUserId} = ${ownerUserId})
                 OR (${schema.blocks.blockerUserId} = ${ownerUserId} AND ${schema.blocks.blockedUserId} = ${schema.profiles.userId})
            )`,
          ];

          if (progress.lastUserId) {
            conditions.push(sql`${schema.profiles.userId} > ${progress.lastUserId}`);
          }

          const candidates = await tx
            .select({
              userId: schema.profiles.userId,
              trackedSkills: schema.profiles.trackedSkills,
              locale: schema.profiles.locale,
            })
            .from(schema.profiles)
            .where(and(...conditions))
            .orderBy(asc(schema.profiles.userId))
            .limit(batchSize);

          for (const c of candidates) {
            const matchingTag = c.trackedSkills?.find((skill) =>
              lowerTags.includes(skill.toLowerCase().trim())
            );
            const isEn = c.locale === "en";
            const deliveryKey = `listing:${listingId}:act:${activationSeq}:radar:user:${c.userId}`;

            await NotificationService.createNotification(
              c.userId,
              "RADAR_MATCH",
              "listing",
              listingId,
              {
                listingId,
                activationSeq,
                title: isEn
                  ? `Radar Match: [${matchingTag || "Skill"}]`
                  : `Radarın Eşleşti: [${matchingTag || "Yetenek"}]`,
                message: isEn
                  ? `A new listing matching your tracked skill "${matchingTag || ""}" was published: "${title}"`
                  : `Takip ettiğin "${matchingTag || ""}" teknolojisiyle yeni bir ilan yayınlandı: "${title}"`,
                actionUrl: isEn ? `/en/listings/${slug}` : `/tr/ilanlar/${slug}`,
              },
              tx,
              deliveryKey
            );
          }

          if (candidates.length < batchSize) {
            // Radar complete, transition to CATEGORY
            await tx
              .update(schema.notificationFanoutProgress)
              .set({ phase: "CATEGORY", lastUserId: null, updatedAt: now })
              .where(eq(schema.notificationFanoutProgress.eventId, eventId));
            return { phase: "CATEGORY" as const };
          } else {
            // Advance cursor
            const lastId = candidates[candidates.length - 1]!.userId;
            await tx
              .update(schema.notificationFanoutProgress)
              .set({ lastUserId: lastId, updatedAt: now })
              .where(eq(schema.notificationFanoutProgress.eventId, eventId));
            return { phase: "RADAR" as const };
          }
        }

        if (progress.phase === "CATEGORY") {
          if (!categoryId) {
            // No category, transition to DONE
            await tx
              .update(schema.notificationFanoutProgress)
              .set({ phase: "DONE", lastUserId: null, updatedAt: now })
              .where(eq(schema.notificationFanoutProgress.eventId, eventId));
            return { phase: "DONE" as const };
          }

          const conditions = [
            eq(schema.categoryFollows.categoryId, categoryId),
            sql`${schema.categoryFollows.userId} != ${ownerUserId}`,
            sql`NOT EXISTS (
              SELECT 1 FROM ${schema.blocks}
              WHERE (${schema.blocks.blockerUserId} = ${schema.categoryFollows.userId} AND ${schema.blocks.blockedUserId} = ${ownerUserId})
                 OR (${schema.blocks.blockerUserId} = ${ownerUserId} AND ${schema.blocks.blockedUserId} = ${schema.categoryFollows.userId})
            )`,
          ];

          if (progress.lastUserId) {
            conditions.push(sql`${schema.categoryFollows.userId} > ${progress.lastUserId}`);
          }

          const followers = await tx
            .select({
              userId: schema.categoryFollows.userId,
              locale: schema.profiles.locale,
            })
            .from(schema.categoryFollows)
            .leftJoin(schema.profiles, eq(schema.categoryFollows.userId, schema.profiles.userId))
            .where(and(...conditions))
            .orderBy(asc(schema.categoryFollows.userId))
            .limit(batchSize);

          for (const f of followers) {
            const isEn = f.locale === "en";
            const deliveryKey = `listing:${listingId}:act:${activationSeq}:cat:user:${f.userId}`;

            await NotificationService.createNotification(
              f.userId,
              "CATEGORY_FOLLOW_MATCH",
              "listing",
              listingId,
              {
                listingId,
                activationSeq,
                title: isEn
                  ? "New Listing in Followed Category"
                  : "Takip Ettiğin Kategoride Yeni İlan",
                message: isEn
                  ? `A new listing was published in a category you follow: "${title}"`
                  : `Takip ettiğin kategoride yeni bir ilan yayınlandı: "${title}"`,
                actionUrl: isEn ? `/en/listings/${slug}` : `/tr/ilanlar/${slug}`,
              },
              tx,
              deliveryKey
            );
          }

          if (followers.length < batchSize) {
            // Category complete, transition to DONE
            await tx
              .update(schema.notificationFanoutProgress)
              .set({ phase: "DONE", lastUserId: null, updatedAt: now })
              .where(eq(schema.notificationFanoutProgress.eventId, eventId));
            return { phase: "DONE" as const };
          } else {
            // Advance cursor
            const lastId = followers[followers.length - 1]!.userId;
            await tx
              .update(schema.notificationFanoutProgress)
              .set({ lastUserId: lastId, updatedAt: now })
              .where(eq(schema.notificationFanoutProgress.eventId, eventId));
            return { phase: "CATEGORY" as const };
          }
        }

        return { phase: "DONE" as const };
      });
    } catch {
      return "ERROR";
    }

    if (pageResult.leaseLost) {
      return "LEASE_LOST";
    }

    if (pageResult.phase === "DONE") {
      done = true;
    }
  }

  // 3. Final step: mark outbox event SENT atomically verifying leaseToken
  const now = new Date();
  const completeResult = await db
    .update(schema.outboxEvents)
    .set({
      status: "SENT",
      leaseToken: null,
      leaseUntil: null,
      nextAttemptAt: now,
    })
    .where(
      and(
        eq(schema.outboxEvents.id, eventId),
        eq(schema.outboxEvents.leaseToken, leaseToken),
        eq(schema.outboxEvents.status, "PROCESSING"),
        gt(schema.outboxEvents.leaseUntil, sql`now()`)
      )
    )
    .returning({ id: schema.outboxEvents.id });

  if (completeResult.length === 0) {
    return "LEASE_LOST";
  }

  return "COMPLETED";
}
