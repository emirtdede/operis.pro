import { getDb, schema } from "../src/lib/db";
import { and, asc, eq, inArray } from "drizzle-orm";
import { runSequentially } from "../src/lib/async/concurrency";

interface GroupReconcileSummary {
  offerId: string;
  recipientUserId: string;
  retainedOutboxId: string;
  deletedOutboxIds: string[];
  retainedNotificationId?: string;
  deletedNotificationIds: string[];
}

export interface ReconcileResult {
  mode: "dry-run" | "apply";
  totalGroupsExamined: number;
  duplicateGroupsFound: number;
  outboxMergedCount: number;
  notificationsDeduplicatedCount: number;
  unresolvableGroupsCount: number;
  unresolvableDetails: Array<{ offerId: string; reason: string }>;
  summaries: GroupReconcileSummary[];
}

const STATUS_PRIORITY: Record<string, number> = {
  SENT: 5,
  PROCESSING: 4,
  PENDING: 3,
  FAILED: 2,
  DEAD: 1,
};

export async function reconcileOfferNotifications(options: {
  apply?: boolean;
}): Promise<ReconcileResult> {
  const db = getDb();
  const apply = options.apply ?? false;
  const mode = apply ? "apply" : "dry-run";

  const result: ReconcileResult = {
    mode,
    totalGroupsExamined: 0,
    duplicateGroupsFound: 0,
    outboxMergedCount: 0,
    notificationsDeduplicatedCount: 0,
    unresolvableGroupsCount: 0,
    unresolvableDetails: [],
    summaries: [],
  };

  // 1. Fetch ALL OFFER_RECEIVED outbox events (both null and populated delivery_key)
  const outboxRows = await db
    .select()
    .from(schema.outboxEvents)
    .where(eq(schema.outboxEvents.type, "OFFER_RECEIVED"))
    .orderBy(asc(schema.outboxEvents.createdAt));

  // Group by offerId + recipientUserId
  const groups = new Map<string, typeof outboxRows>();

  await runSequentially(outboxRows, async (row) => {
    const payload = (row.payloadJson as Record<string, unknown>) || {};
    // Skip already superseded events from prior reconcile runs for strict idempotency
    if (payload.error === "SUPERSEDED_DUPLICATE") {
      return;
    }

    const offerId = (payload.offerId as string) || (row.aggregateId as string);
    let recipientUserId = (payload.recipientUserId as string) || "";

    // If missing recipientUserId, attempt resolution via offer -> listing.ownerUserId
    if (!recipientUserId && offerId) {
      try {
        const resolved = await db
          .select({ ownerUserId: schema.listings.ownerUserId })
          .from(schema.offers)
          .innerJoin(schema.listings, eq(schema.offers.listingId, schema.listings.id))
          .where(eq(schema.offers.id, offerId))
          .limit(1);

        if (resolved[0]?.ownerUserId) {
          recipientUserId = resolved[0].ownerUserId;
        }
      } catch {
        // Non-fatal, fallback to unresolvable
      }
    }

    if (!offerId || !recipientUserId) {
      result.unresolvableGroupsCount++;
      result.unresolvableDetails.push({
        offerId: offerId || row.id,
        reason: "Missing offerId or recipientUserId could not be resolved",
      });
      return;
    }

    const groupKey = `${offerId}:${recipientUserId}`;
    const list = groups.get(groupKey) || [];
    list.push(row);
    groups.set(groupKey, list);
  });

  result.totalGroupsExamined = groups.size;

  await runSequentially(Array.from(groups.entries()), async ([groupKey, rows]) => {
    const [offerId, recipientUserId] = groupKey.split(":") as [string, string];
    const deliveryKey = `offer:${offerId}:received:user:${recipientUserId}`;

    // Rank events by status priority (SENT > PROCESSING > PENDING > FAILED > DEAD), then earliest createdAt
    const sorted = [...rows].sort((a, b) => {
      const pA = STATUS_PRIORITY[a.status] || 0;
      const pB = STATUS_PRIORITY[b.status] || 0;
      if (pA !== pB) return pB - pA;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const primaryOutbox = sorted[0];
    if (!primaryOutbox) return;
    const duplicateOutboxes = sorted.slice(1);

    // Find all notifications matching this offerId and recipient
    const notifRows = await db
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, recipientUserId),
          eq(schema.notifications.type, "OFFER_RECEIVED")
        )
      )
      .orderBy(asc(schema.notifications.createdAt));

    const matchingNotifs = notifRows.filter((n) => {
      const p = (n.payloadJson as Record<string, unknown>) || {};
      return p.offerId === offerId;
    });

    const primaryNotif = matchingNotifs[0];
    const duplicateNotifs = matchingNotifs.slice(1);

    const currentPrimaryPayload = (primaryOutbox.payloadJson as Record<string, unknown>) || {};
    const needsPayloadUpdate = currentPrimaryPayload.recipientUserId !== recipientUserId;
    const needsDeliveryKeyUpdate = primaryOutbox.deliveryKey !== deliveryKey;
    const needsNotifUpdate = Boolean(primaryNotif && primaryNotif.deliveryKey !== deliveryKey);

    if (
      duplicateOutboxes.length > 0 ||
      duplicateNotifs.length > 0 ||
      needsDeliveryKeyUpdate ||
      needsPayloadUpdate ||
      needsNotifUpdate
    ) {
      result.duplicateGroupsFound++;
      result.outboxMergedCount += duplicateOutboxes.length;
      result.notificationsDeduplicatedCount += duplicateNotifs.length;

      result.summaries.push({
        offerId,
        recipientUserId,
        retainedOutboxId: primaryOutbox.id,
        deletedOutboxIds: duplicateOutboxes.map((d) => d.id),
        retainedNotificationId: primaryNotif?.id,
        deletedNotificationIds: duplicateNotifs.map((d) => d.id),
      });

      if (apply) {
        await db.transaction(async (tx) => {
          // 0. Row-level lock on candidate outbox events FOR UPDATE and read fresh rows
          let lockQuery = tx
            .select()
            .from(schema.outboxEvents)
            .where(
              inArray(
                schema.outboxEvents.id,
                rows.map((r) => r.id)
              )
            );
          if (typeof (lockQuery as { for?: unknown }).for === "function") {
            lockQuery = (lockQuery as { for: (mode: string) => typeof lockQuery }).for("update");
          }
          const freshRows = await lockQuery;

          // Re-evaluate group decision from fresh locked rows
          const activeFreshRows = freshRows.filter((r) => {
            const p = (r.payloadJson as Record<string, unknown>) || {};
            return p.error !== "SUPERSEDED_DUPLICATE";
          });

          if (activeFreshRows.length === 0) return;

          const freshSorted = [...activeFreshRows].sort((a, b) => {
            const pA = STATUS_PRIORITY[a.status] || 0;
            const pB = STATUS_PRIORITY[b.status] || 0;
            if (pA !== pB) return pB - pA;
            return a.createdAt.getTime() - b.createdAt.getTime();
          });

          const lockedPrimary = freshSorted[0];
          if (!lockedPrimary) return;
          const lockedDuplicates = freshSorted.slice(1);

          // 1. Mark duplicate outbox events FAILED with error payload and cleared deliveryKey
          if (lockedDuplicates.length > 0) {
            await runSequentially(lockedDuplicates, async (dup) => {
              const currentPayload = (dup.payloadJson as Record<string, unknown>) || {};
              await tx
                .update(schema.outboxEvents)
                .set({
                  status: "FAILED",
                  deliveryKey: null,
                  payloadJson: { ...currentPayload, error: "SUPERSEDED_DUPLICATE" },
                  leaseToken: null,
                  leaseUntil: null,
                })
                .where(eq(schema.outboxEvents.id, dup.id));
            });
          }

          // 2. Set canonical deliveryKey and resolved recipientUserId on primary outbox if not already matching
          const freshPrimaryPayload = (lockedPrimary.payloadJson as Record<string, unknown>) || {};
          const primaryNeedsDeliveryKey = lockedPrimary.deliveryKey !== deliveryKey;
          const primaryNeedsPayload = freshPrimaryPayload.recipientUserId !== recipientUserId;

          if (primaryNeedsDeliveryKey || primaryNeedsPayload) {
            const updatedPayload = {
              ...freshPrimaryPayload,
              recipientUserId,
            };
            await tx
              .update(schema.outboxEvents)
              .set({
                deliveryKey,
                payloadJson: updatedPayload,
              })
              .where(eq(schema.outboxEvents.id, lockedPrimary.id));
          }

          // 3. Delete duplicate notifications
          if (duplicateNotifs.length > 0) {
            await tx.delete(schema.notifications).where(
              inArray(
                schema.notifications.id,
                duplicateNotifs.map((d) => d.id)
              )
            );
          }

          // 4. Update retained notification with deliveryKey
          if (primaryNotif && primaryNotif.deliveryKey !== deliveryKey) {
            await tx
              .update(schema.notifications)
              .set({ deliveryKey })
              .where(eq(schema.notifications.id, primaryNotif.id));
          }
        });
      }
    }
  });

  return result;
}

if (process.argv[1] && process.argv[1].endsWith("reconcile-offer-notifications.ts")) {
  const isApply = process.argv.includes("--apply");
  reconcileOfferNotifications({ apply: isApply })
    .then((res) => {
      console.info(`[reconcile-offer-notifications] Finished in ${res.mode.toUpperCase()} mode.`);
      console.info(`Examined groups: ${res.totalGroupsExamined}`);
      console.info(`Duplicate groups found: ${res.duplicateGroupsFound}`);
      console.info(`Outbox events to merge: ${res.outboxMergedCount}`);
      console.info(`Notifications to deduplicate: ${res.notificationsDeduplicatedCount}`);
      console.info(`Unresolvable groups: ${res.unresolvableGroupsCount}`);
      if (res.unresolvableDetails.length > 0) {
        console.error("Unresolvable details:", res.unresolvableDetails);
      }
      process.exit(res.unresolvableGroupsCount > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error("[reconcile-offer-notifications] Fatal error:", err);
      process.exit(1);
    });
}
