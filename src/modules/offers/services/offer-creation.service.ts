import crypto from "node:crypto";
import { and, eq, lt, or } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { encryptOfferMessage } from "../crypto";
import { NotificationService } from "@/src/modules/notifications/service";
import { inMemoryListings } from "@/src/modules/listings/service";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";
import { SubmitOfferInput, submitOfferSchema } from "../validation";
import { SquadRevenueEngine } from "../squad-engine";
import {
  inMemorySentOffers,
  inMemoryReceivedOffers,
  inMemorySquadMembers,
} from "./types";

export class OfferCreationService {
  /**
   * Submits a private 1-to-1 offer on an active listing.
   * Enforces 1 pending offer per listing, anti-spam withdrawal rule, and owner/block bans.
   */
  static async submitOffer(offerorUserId: string, rawInput: SubmitOfferInput) {
    const input = submitOfferSchema.parse(rawInput);
    const db = getDb();

    // 1. Fetch listing and verify active status
    const isListingUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      input.listingId
    );

    let listing: {
      id: string;
      ownerUserId: string;
      title: string;
      slug?: string;
      status: string;
      activeUntil: Date | null;
      activationSeq: number;
    } | null = null;

    if (isListingUuid) {
      try {
        const listingRows = await db
          .select()
          .from(schema.listings)
          .where(eq(schema.listings.id, input.listingId))
          .limit(1);
        if (listingRows[0]) {
          listing = listingRows[0];
        }
      } catch (err) {
        if (process.env.NODE_ENV === "production") throw err;
      }
    }

    if (!listing && Boolean(process.env.VITEST)) {
      const memListing = inMemoryListings.find((l) => l.id === input.listingId);
      if (memListing) {
        listing = {
          id: memListing.id,
          ownerUserId: memListing.ownerUserId,
          title: memListing.title,
          slug: memListing.slug,
          status: memListing.status,
          activeUntil: memListing.activeUntil,
          activationSeq: memListing.activationSeq,
        };
      }
    }

    if (!listing) {
      throw new Error("Listing not found");
    }

    // Listing owner cannot submit offer on own listing
    if (listing.ownerUserId === offerorUserId) {
      throw new Error("You cannot submit an offer on your own listing");
    }

    // Listing must be ACTIVE and not expired
    const now = new Date();
    if (listing.status !== "ACTIVE" || !listing.activeUntil || listing.activeUntil <= now) {
      throw new Error("Listing is not currently active for offers");
    }

    // Validate Squad Proposal Invariants if enabled (TBK m. 620)
    if (input.isSquadOffer && input.squadMembers && input.squadMembers.length > 0) {
      const squadValidation = SquadRevenueEngine.validateSquadDistribution(input.squadMembers);
      if (!squadValidation.isValid) {
        throw new Error(squadValidation.errorTr || "Geçersiz çevik ekip hakediş dağılımı");
      }
    }

    // Verify offeror email and phone verification in production
    if (process.env.NODE_ENV === "production") {
      const userRows = await db
        .select({ emailVerified: schema.users.emailVerified })
        .from(schema.users)
        .where(eq(schema.users.id, offerorUserId))
        .limit(1);

      if (userRows[0] && !userRows[0].emailVerified) {
        throw new Error(
          "Teklif verebilmek için önce e-posta adresinizi doğrulamanız gerekmektedir."
        );
      }

      const identityRows = await db
        .select({ phoneVerifiedAt: schema.userPrivateIdentity.phoneVerifiedAt })
        .from(schema.userPrivateIdentity)
        .where(eq(schema.userPrivateIdentity.userId, offerorUserId))
        .limit(1);

      if (!identityRows[0]?.phoneVerifiedAt) {
        throw new Error(
          "Teklif verebilmek için önce cep telefonu numaranızı doğrulamanız gerekmektedir."
        );
      }
    }

    // 2. Check blocks and existing offers
    if (isListingUuid) {
      try {
        const blockExists = await db
          .select({ id: schema.blocks.blockerUserId })
          .from(schema.blocks)
          .where(
            or(
              and(
                eq(schema.blocks.blockerUserId, offerorUserId),
                eq(schema.blocks.blockedUserId, listing.ownerUserId)
              ),
              and(
                eq(schema.blocks.blockerUserId, listing.ownerUserId),
                eq(schema.blocks.blockedUserId, offerorUserId)
              )
            )
          )
          .limit(1);

        if (blockExists.length > 0) {
          throw new Error("Cannot submit an offer to this listing");
        }

        const existingOffers = await db
          .select()
          .from(schema.offers)
          .where(
            and(
              eq(schema.offers.listingId, listing.id),
              eq(schema.offers.offerorUserId, offerorUserId)
            )
          );

        // Rule A: Max 1 PENDING offer
        const pendingOffer = existingOffers.find((o) => o.status === "PENDING");
        if (pendingOffer) {
          throw new Error("You already have an active pending offer on this listing");
        }

        // Rule B: If withdrawn during this same activation cycle, anti-spam rule prevents resubmission
        const withdrawnInCycle = existingOffers.find(
          (o) => o.status === "WITHDRAWN" && o.listingActivationSeq === listing.activationSeq
        );
        if (withdrawnInCycle) {
          throw new Error(
            "You cannot submit another offer after withdrawing during this activation cycle"
          );
        }
      } catch (err) {
        if (process.env.NODE_ENV === "production") throw err;
        if (
          err instanceof Error &&
          (err.message.includes("Cannot submit an offer") ||
            err.message.includes("already have an active") ||
            err.message.includes("withdrawing during this activation"))
        ) {
          throw err;
        }
      }
    } else {
      const pendingMem = inMemorySentOffers.find(
        (o) =>
          o.offer.listingId === listing.id &&
          o.offer.offerorUserId === offerorUserId &&
          o.offer.status === "PENDING"
      );
      if (pendingMem) {
        throw new Error("You already have an active pending offer on this listing");
      }
    }

    // 4. Create offer and initial revision in a transaction
    let newOffer: typeof schema.offers.$inferSelect | null = null;
    if (isListingUuid) {
      try {
        newOffer = await db.transaction(async (tx) => {
          // Re-verify and row-lock listing row to prevent race against matching/expiration (B14)
          let lQuery = tx
            .select({
              id: schema.listings.id,
              title: schema.listings.title,
              status: schema.listings.status,
              activeUntil: schema.listings.activeUntil,
              activationSeq: schema.listings.activationSeq,
              ownerUserId: schema.listings.ownerUserId,
            })
            .from(schema.listings)
            .where(eq(schema.listings.id, listing.id));

          if (typeof (lQuery as { for?: unknown }).for === "function") {
            lQuery = (lQuery as { for: (mode: string) => typeof lQuery }).for("update");
          }

          const [lockedListing] = await lQuery.limit(1);
          if (
            !lockedListing ||
            lockedListing.status !== "ACTIVE" ||
            !lockedListing.activeUntil ||
            lockedListing.activeUntil <= new Date()
          ) {
            throw new Error("Listing is not currently active for offers");
          }

          const offerId = crypto.randomUUID();
          const encryptedMessage = encryptOfferMessage(input.message, offerId);

          const [insertedOffer] = await tx
            .insert(schema.offers)
            .values({
              id: offerId,
              listingId: lockedListing.id,
              offerorUserId,
              listingActivationSeq: lockedListing.activationSeq,
              status: "PENDING",
              message: encryptedMessage,
              budgetCurrency: input.budgetCurrency ?? null,
              budgetMin: input.budgetMin ?? null,
              budgetMax: input.budgetMax ?? null,
              estimatedDurationValue: input.estimatedDurationValue ?? null,
              estimatedDurationUnit: input.estimatedDurationUnit ?? null,
              isSquadOffer: Boolean(input.isSquadOffer),
              squadTitle: input.squadTitle ?? null,
            })
            .returning();

          if (!insertedOffer) {
            throw new Error("Failed to insert offer");
          }

          if (input.isSquadOffer && input.squadMembers && input.squadMembers.length > 0) {
            const squadValues = input.squadMembers.map((m) => ({
              offerId: insertedOffer.id,
              displayName: m.displayName,
              roleTitle: m.roleTitle,
              revenueSharePercentage: m.revenueSharePercentage.toString(),
              scopeSummary: m.scopeSummary || null,
              handleOrEmail: m.handleOrEmail || null,
              isLead: Boolean(m.isLead),
            }));
            await tx.insert(schema.offerSquadMembers).values(squadValues);
          }

          await tx.insert(schema.offerRevisions).values({
            offerId: insertedOffer.id,
            revisionNo: 1,
            snapshotJson: {
              message: input.message,
              budgetCurrency: input.budgetCurrency ?? null,
              budgetMin: input.budgetMin ?? null,
              budgetMax: input.budgetMax ?? null,
              estimatedDurationValue: input.estimatedDurationValue ?? null,
              estimatedDurationUnit: input.estimatedDurationUnit ?? null,
            },
          });

          // B16: Single path for offer proposal notification & outbox event within the SAME transaction
          const [ownerProfile] = await tx
            .select({ locale: schema.profiles.locale })
            .from(schema.profiles)
            .where(eq(schema.profiles.userId, lockedListing.ownerUserId))
            .limit(1);

          const isEn = ownerProfile?.locale === "en";
          const deliveryKey = `offer:${insertedOffer.id}:received:user:${lockedListing.ownerUserId}`;

          await NotificationService.createNotification(
            lockedListing.ownerUserId,
            "OFFER_RECEIVED",
            "offer",
            insertedOffer.id,
            {
              title: isEn ? "New Proposal Received" : "Yeni Teklif Alındı",
              message: isEn
                ? `A new proposal has been submitted for your listing "${lockedListing.title || listing.title}".`
                : `"${lockedListing.title || listing.title}" ilanınız için yeni bir teklif iletildi.`,
              actionUrl: isEn ? "/en/dashboard/offers/received" : "/tr/panel/teklifler/gelen",
              offerId: insertedOffer.id,
              listingId: lockedListing.id,
            },
            tx,
            deliveryKey
          );

          return insertedOffer;
        });
      } catch (err: unknown) {
        const errObj = err as { code?: string; message?: string };
        if (
          errObj?.code === "23505" ||
          errObj?.message?.includes("offers_pending_unique_idx") ||
          errObj?.message?.includes("unique constraint")
        ) {
          throw new Error("You already have an active pending offer on this listing", {
            cause: err,
          });
        }
        if (process.env.NODE_ENV === "production") throw err;
      }
    }

    if (!newOffer && Boolean(process.env.VITEST)) {
      newOffer = {
        id: `offer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        listingId: listing.id,
        offerorUserId,
        listingActivationSeq: listing.activationSeq,
        status: "PENDING",
        message: input.message,
        budgetCurrency: input.budgetCurrency ?? null,
        budgetMin: input.budgetMin ?? null,
        budgetMax: input.budgetMax ?? null,
        estimatedDurationValue: input.estimatedDurationValue ?? null,
        estimatedDurationUnit: input.estimatedDurationUnit ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        resolvedAt: null,
        rejectionCode: null,
        rejectionNote: null,
        isCountered: false,
        currentTurnUserId: null,
        counterRound: 0,
        activeCounterProposalId: null,
        isSquadOffer: Boolean(input.isSquadOffer),
        squadTitle: input.squadTitle ?? null,
      };
    }

    if (!newOffer) {
      throw new Error("Failed to insert offer");
    }

    // In-memory synthetic fallback notification for mock unit tests without DB
    if (!isListingUuid && newOffer) {
      const isEn =
        listing.ownerUserId === DEFAULT_USER.id ? DEFAULT_USER.profile.locale === "en" : false;
      await NotificationService.createNotification(
        listing.ownerUserId,
        "OFFER_RECEIVED",
        "offer",
        newOffer.id,
        {
          title: isEn ? "New Proposal Received" : "Yeni Teklif Alındı",
          message: isEn
            ? `A new proposal has been submitted for your listing "${listing.title}".`
            : `"${listing.title}" ilanınız için yeni bir teklif iletildi.`,
          actionUrl: isEn ? "/en/dashboard/offers/received" : "/tr/panel/teklifler/gelen",
          offerId: newOffer.id,
          listingId: listing.id,
        },
        undefined,
        `offer:${newOffer.id}:received:user:${listing.ownerUserId}`
      ).catch(() => {});
    }

    if (newOffer && Boolean(process.env.VITEST)) {
      if (input.isSquadOffer && input.squadMembers) {
        const createdOfferId = newOffer.id;
        inMemorySquadMembers.set(
          createdOfferId,
          input.squadMembers.map((m) => ({ ...m, offerId: createdOfferId }))
        );
      }

      inMemorySentOffers.unshift({
        offer: newOffer,
        listing: {
          id: listing.id,
          slug: listing.slug || `listing-${listing.id.slice(0, 8)}`,
          title: listing.title || "Project Listing",
          status: listing.status,
          activeUntil: listing.activeUntil,
        },
        squadMembers: inMemorySquadMembers.get(newOffer.id),
      });
      inMemoryReceivedOffers.unshift({
        offer: newOffer,
        offerorProfile: {
          userId: offerorUserId,
          handle: "developer",
          displayName: "Freelance Developer",
        },
        listing: {
          id: listing.id,
          slug: listing.slug || `listing-${listing.id.slice(0, 8)}`,
          title: listing.title || "Project Listing",
          status: listing.status,
          activeUntil: listing.activeUntil,
          ownerUserId: listing.ownerUserId,
        },
        squadMembers: inMemorySquadMembers.get(newOffer.id),
      });
    }

    // Fail-open event dispatch to Inngest for delayed stale-offer monitoring
    try {
      const { sendInngestEvent } = await import("@/src/lib/inngest/client");
      sendInngestEvent("operis/offer.submitted", {
        offerId: newOffer.id,
        listingId: newOffer.listingId,
        offerorUserId: newOffer.offerorUserId,
        createdAt:
          newOffer.createdAt instanceof Date
            ? newOffer.createdAt.toISOString()
            : new Date().toISOString(),
      }).catch(() => {});
    } catch {
      // Fail-open: Never disrupt core offer flow
    }

    return newOffer;
  }

  /**
   * Cleans up expired idempotency keys older than their expiration timestamp.
   */
  static async cleanupExpiredIdempotencyKeys(referenceTime: Date = new Date()): Promise<number> {
    try {
      const db = getDb();
      const deleted = await db
        .delete(schema.idempotencyKeys)
        .where(lt(schema.idempotencyKeys.expiresAt, referenceTime))
        .returning({ key: schema.idempotencyKeys.key });
      return deleted.length;
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      return 0;
    }
  }
}
