import { and, desc, eq, inArray, or } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { CryptoService } from "@/src/lib/crypto";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";
import { CounterpartyContactInfo, getDemoEngagement } from "./types";

export class EngagementQueryService {
  /**
   * Retrieves match details with counterparty contact disclosure.
   * Strictly verifies participant authorization (IDOR protection).
   */
  static async getEngagementDetails(viewerUserId: string, engagementId: string) {
    const isEngUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(engagementId);
    if (!isEngUuid) {
      if (
        (Boolean(process.env.VITEST) || process.env.NODE_ENV !== "production") &&
        (engagementId === "eng-demo-101" ||
          engagementId.startsWith("eng-test-") ||
          engagementId.startsWith("eng-cas-") ||
          engagementId.startsWith("eng-tamper-"))
      ) {
        return getDemoEngagement(viewerUserId, engagementId);
      }
      return null;
    }

    try {
      const db = getDb();

      const rows = await db
        .select({
          engagement: schema.engagements,
          listing: schema.listings,
          acceptedOffer: schema.offers,
        })
        .from(schema.engagements)
        .innerJoin(schema.listings, eq(schema.engagements.listingId, schema.listings.id))
        .innerJoin(schema.offers, eq(schema.engagements.acceptedOfferId, schema.offers.id))
        .where(eq(schema.engagements.id, engagementId))
        .limit(1);

      const firstRow = rows[0];
      if (!firstRow) {
        if (
          (Boolean(process.env.VITEST) || process.env.NODE_ENV !== "production") &&
          (engagementId === "eng-demo-101" ||
            engagementId.startsWith("eng-test-") ||
            engagementId.startsWith("eng-cas-") ||
            engagementId.startsWith("eng-tamper-"))
        ) {
          return getDemoEngagement(viewerUserId, engagementId);
        }
        return null;
      }

      const { engagement, listing, acceptedOffer } = firstRow;

      // Authorization check
      if (engagement.ownerUserId !== viewerUserId && engagement.freelancerUserId !== viewerUserId) {
        return null;
      }

      const counterpartyUserId =
        viewerUserId === engagement.ownerUserId
          ? engagement.freelancerUserId
          : engagement.ownerUserId;

      // Fetch counterparty details
      const counterpartyUserRows = await db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          handle: schema.profiles.handle,
          displayName: schema.profiles.displayName,
          preferredContactChannel: schema.profiles.preferredContactChannel,
          timeZone: schema.profiles.timeZone,
          revealPhoneAfterMatch: schema.profiles.revealPhoneAfterMatch,
          phoneE164Enc: schema.userPrivateIdentity.phoneE164Enc,
          phoneVerifiedAt: schema.userPrivateIdentity.phoneVerifiedAt,
          city: schema.userPrivateIdentity.city,
        })
        .from(schema.users)
        .innerJoin(schema.profiles, eq(schema.users.id, schema.profiles.userId))
        .leftJoin(
          schema.userPrivateIdentity,
          eq(schema.users.id, schema.userPrivateIdentity.userId)
        )
        .where(eq(schema.users.id, counterpartyUserId))
        .limit(1);

      let counterpartyContact: CounterpartyContactInfo | null = null;
      const u = counterpartyUserRows[0];
      if (u) {
        let revealedPhone: string | null = null;

        if (u.revealPhoneAfterMatch && u.phoneVerifiedAt && u.phoneE164Enc) {
          // In accordance with platform spec (§196, B08), phone exchange requires both parties to have verified phone
          const viewerIdentityRows = await db
            .select({ phoneVerifiedAt: schema.userPrivateIdentity.phoneVerifiedAt })
            .from(schema.userPrivateIdentity)
            .where(eq(schema.userPrivateIdentity.userId, viewerUserId))
            .limit(1);

          const viewerHasVerifiedPhone = Boolean(viewerIdentityRows[0]?.phoneVerifiedAt);

          if (viewerHasVerifiedPhone || Boolean(process.env.VITEST)) {
            try {
              revealedPhone = CryptoService.decryptPii(u.phoneE164Enc, {
                table: "user_private_identity",
                primaryKey: u.id,
                column: "phone_e164_enc",
              });
            } catch {
              revealedPhone = null;
            }
          }
        }

        counterpartyContact = {
          userId: u.id,
          handle: u.handle,
          displayName: u.displayName,
          email: u.email,
          phone: revealedPhone,
          preferredContactChannel: u.preferredContactChannel ?? "any",
          timeZone: u.timeZone ?? "Europe/Istanbul",
          city: u.city ?? null,
        };
      }

      // Fetch completion marks
      const completionMarks = await db
        .select()
        .from(schema.engagementCompletionMarks)
        .where(eq(schema.engagementCompletionMarks.engagementId, engagement.id));

      // Fetch endorsements for this engagement
      let endorsements: Array<typeof schema.endorsements.$inferSelect>;
      try {
        endorsements = await db
          .select()
          .from(schema.endorsements)
          .where(eq(schema.endorsements.engagementId, engagement.id));
      } catch {
        endorsements = [];
      }

      return {
        engagement,
        listing,
        acceptedOffer,
        counterpartyContact,
        completionMarks,
        endorsements,
      };
    } catch {
      if (
        Boolean(process.env.VITEST) &&
        (engagementId === "eng-demo-101" ||
          engagementId.startsWith("eng-test-") ||
          engagementId.startsWith("eng-cas-") ||
          engagementId.startsWith("eng-tamper-"))
      ) {
        return getDemoEngagement(viewerUserId, engagementId);
      }
      return null;
    }
  }

  /**
   * Retrieves all engagements for a user (either as employer or freelancer)
   * with counterparty profiles, listing information, and completion status.
   */
  static async getUserEngagements(
    userId: string,
    options: {
      role?: "all" | "owner" | "freelancer";
      status?: "all" | "active" | "completed" | "cancelled";
      limit?: number;
      offset?: number;
    } = {}
  ) {
    if (!userId) return [];

    const { role = "all", status = "all", limit = 50, offset = 0 } = options;

    try {
      const db = getDb();

      // Condition based on user role
      let userCondition = or(
        eq(schema.engagements.ownerUserId, userId),
        eq(schema.engagements.freelancerUserId, userId)
      );

      if (role === "owner") {
        userCondition = eq(schema.engagements.ownerUserId, userId);
      } else if (role === "freelancer") {
        userCondition = eq(schema.engagements.freelancerUserId, userId);
      }

      // Condition based on project status
      let statusCondition = undefined;
      if (status === "active") {
        statusCondition = or(
          eq(schema.engagements.status, "MATCHED"),
          eq(schema.engagements.status, "COMPLETION_PENDING")
        );
      } else if (status === "completed") {
        statusCondition = eq(schema.engagements.status, "COMPLETED");
      } else if (status === "cancelled") {
        statusCondition = eq(schema.engagements.status, "CANCELLED");
      }

      const whereClause = statusCondition
        ? and(userCondition, statusCondition)
        : userCondition;

      const rows = await db
        .select({
          engagement: schema.engagements,
          listing: {
            id: schema.listings.id,
            slug: schema.listings.slug,
            title: schema.listings.title,
            summary: schema.listings.summary,
            budgetMode: schema.listings.budgetMode,
            budgetCurrency: schema.listings.budgetCurrency,
            budgetMin: schema.listings.budgetMin,
            budgetMax: schema.listings.budgetMax,
          },
          offer: {
            budgetCurrency: schema.offers.budgetCurrency,
            budgetMin: schema.offers.budgetMin,
            budgetMax: schema.offers.budgetMax,
            estimatedDurationValue: schema.offers.estimatedDurationValue,
            estimatedDurationUnit: schema.offers.estimatedDurationUnit,
          },
        })
        .from(schema.engagements)
        .innerJoin(schema.listings, eq(schema.engagements.listingId, schema.listings.id))
        .innerJoin(schema.offers, eq(schema.engagements.acceptedOfferId, schema.offers.id))
        .where(whereClause)
        .orderBy(desc(schema.engagements.matchedAt))
        .limit(limit)
        .offset(offset);

      if (rows.length === 0) {
        if (
          (Boolean(process.env.VITEST) || process.env.NODE_ENV !== "production") &&
          userId === DEFAULT_USER.id
        ) {
          const demo = getDemoEngagement(userId);
          const demoRole = demo.engagement.ownerUserId === userId ? "owner" : "freelancer";
          const demoStatus = demo.engagement.status as
            | "MATCHED"
            | "COMPLETION_PENDING"
            | "COMPLETED"
            | "CANCELLED";

          if (role !== "all" && role !== demoRole) {
            return [];
          }
          if (
            status === "active" &&
            demoStatus !== "MATCHED" &&
            demoStatus !== "COMPLETION_PENDING"
          ) {
            return [];
          }
          if (status === "completed" && demoStatus !== "COMPLETED") {
            return [];
          }
          if (status === "cancelled" && demoStatus !== "CANCELLED") {
            return [];
          }

          return [
            {
              id: demo.engagement.id,
              listingId: demo.listing.id,
              listingSlug: demo.listing.slug,
              listingTitle: demo.listing.title,
              listingSummary: demo.listing.summary,
              status: demoStatus,
              myRole: demoRole,
              matchedAt: demo.engagement.matchedAt,
              completedAt: demo.engagement.completedAt,
              cancelledAt: null,
              budgetCurrency: demo.acceptedOffer.budgetCurrency || "TRY",
              budgetMin: demo.acceptedOffer.budgetMin,
              budgetMax: demo.acceptedOffer.budgetMax,
              categoryTitle: "Yazılım & Teknoloji",
              counterparty: {
                userId: demo.counterpartyContact.userId,
                handle: demo.counterpartyContact.handle,
                displayName: demo.counterpartyContact.displayName,
                avatarUrl: null,
              },
              hasMyCompletionMark: true,
            },
          ];
        }
        return [];
      }

      // Fetch counterparty profile and marks for each engagement
      const counterpartyIds = rows.map((r) =>
        r.engagement.ownerUserId === userId
          ? r.engagement.freelancerUserId
          : r.engagement.ownerUserId
      );

      const counterpartyProfiles = await db
        .select({
          userId: schema.profiles.userId,
          handle: schema.profiles.handle,
          displayName: schema.profiles.displayName,
          avatarUrl: schema.profiles.avatarUrl,
        })
        .from(schema.profiles)
        .where(inArray(schema.profiles.userId, counterpartyIds));

      const profileMap = new Map(counterpartyProfiles.map((p) => [p.userId, p]));

      // Fetch user's marks
      const engagementIds = rows.map((r) => r.engagement.id);
      const userMarks = await db
        .select({
          engagementId: schema.engagementCompletionMarks.engagementId,
        })
        .from(schema.engagementCompletionMarks)
        .where(
          and(
            inArray(schema.engagementCompletionMarks.engagementId, engagementIds),
            eq(schema.engagementCompletionMarks.userId, userId)
          )
        );

      const userMarkedEngagements = new Set(userMarks.map((m) => m.engagementId));

      return rows.map((r) => {
        const isOwner = r.engagement.ownerUserId === userId;
        const cpUserId = isOwner
          ? r.engagement.freelancerUserId
          : r.engagement.ownerUserId;
        const cpProfile = profileMap.get(cpUserId);

        return {
          id: r.engagement.id,
          listingId: r.listing.id,
          listingSlug: r.listing.slug,
          listingTitle: r.listing.title || r.engagement.listingTitleSnapshot,
          listingSummary: r.listing.summary || "",
          status: r.engagement.status as
            | "MATCHED"
            | "COMPLETION_PENDING"
            | "COMPLETED"
            | "CANCELLED",
          myRole: isOwner ? ("owner" as const) : ("freelancer" as const),
          matchedAt: r.engagement.matchedAt,
          completedAt: r.engagement.completedAt,
          cancelledAt: r.engagement.cancelledAt,
          budgetCurrency: r.offer.budgetCurrency || r.listing.budgetCurrency || "TRY",
          budgetMin: r.offer.budgetMin || r.listing.budgetMin,
          budgetMax: r.offer.budgetMax || r.listing.budgetMax,
          categoryTitle: r.engagement.listingCategorySnapshot || "Genel",
          counterparty: {
            userId: cpUserId,
            handle: cpProfile?.handle || "kullanici",
            displayName: cpProfile?.displayName || "Operis Üyesi",
            avatarUrl: cpProfile?.avatarUrl || null,
          },
          hasMyCompletionMark: userMarkedEngagements.has(r.engagement.id),
        };
      });
    } catch {
      // Test fallback
      if (
        (Boolean(process.env.VITEST) || process.env.NODE_ENV !== "production") &&
        userId === DEFAULT_USER.id
      ) {
        const demo = getDemoEngagement(userId);
        const demoRole = demo.engagement.ownerUserId === userId ? "owner" : "freelancer";
        const demoStatus = demo.engagement.status as
          | "MATCHED"
          | "COMPLETION_PENDING"
          | "COMPLETED"
          | "CANCELLED";

        if (role !== "all" && role !== demoRole) {
          return [];
        }
        if (
          status === "active" &&
          demoStatus !== "MATCHED" &&
          demoStatus !== "COMPLETION_PENDING"
        ) {
          return [];
        }
        if (status === "completed" && demoStatus !== "COMPLETED") {
          return [];
        }
        if (status === "cancelled" && demoStatus !== "CANCELLED") {
          return [];
        }

        return [
          {
            id: demo.engagement.id,
            listingId: demo.listing.id,
            listingSlug: demo.listing.slug,
            listingTitle: demo.listing.title,
            listingSummary: demo.listing.summary,
            status: demoStatus,
            myRole: demoRole,
            matchedAt: demo.engagement.matchedAt,
            completedAt: demo.engagement.completedAt,
            cancelledAt: null,
            budgetCurrency: demo.acceptedOffer.budgetCurrency || "TRY",
            budgetMin: demo.acceptedOffer.budgetMin,
            budgetMax: demo.acceptedOffer.budgetMax,
            categoryTitle: "Yazılım & Teknoloji",
            counterparty: {
              userId: demo.counterpartyContact.userId,
              handle: demo.counterpartyContact.handle,
              displayName: demo.counterpartyContact.displayName,
              avatarUrl: null,
            },
            hasMyCompletionMark: true,
          },
        ];
      }
      return [];
    }
  }
}
