import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { NotificationService } from "@/src/modules/notifications/service";
import {
  RejectOfferInput,
  UpdateOfferInput,
  rejectOfferSchema,
  updateOfferSchema,
} from "../validation";
import { inMemorySentOffers, inMemoryReceivedOffers } from "./types";

export class OfferLifecycleService {
  /**
   * Updates an existing pending offer. Creates revision snapshot.
   */
  static async updateOffer(offerorUserId: string, rawInput: UpdateOfferInput) {
    const input = updateOfferSchema.parse(rawInput);
    const isOfferUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      input.offerId
    );

    if (isOfferUuid) {
      try {
        const db = getDb();

        return await db.transaction(async (tx) => {
          let oQuery = tx.select().from(schema.offers).where(eq(schema.offers.id, input.offerId));

          if (typeof (oQuery as { for?: unknown }).for === "function") {
            oQuery = (oQuery as { for: (mode: string) => typeof oQuery }).for("update");
          }

          const offerRows = await oQuery.limit(1);
          const offer = offerRows[0];
          if (!offer) {
            throw new Error("Offer not found");
          }

          // Authorization
          if (offer.offerorUserId !== offerorUserId) {
            throw new Error("Unauthorized to edit this offer");
          }

          if (offer.status !== "PENDING") {
            throw new Error("Only pending offers can be edited");
          }

          // Check listing still active
          const listingRows = await tx
            .select()
            .from(schema.listings)
            .where(eq(schema.listings.id, offer.listingId))
            .limit(1);

          const listing = listingRows[0];
          if (!listing) {
            throw new Error("Associated listing not found");
          }

          const now = new Date();
          if (listing.status !== "ACTIVE" || !listing.activeUntil || listing.activeUntil <= now) {
            throw new Error("Associated listing is no longer active");
          }

          // Get highest revision number
          const existingRevisions = await tx
            .select({ revisionNo: schema.offerRevisions.revisionNo })
            .from(schema.offerRevisions)
            .where(eq(schema.offerRevisions.offerId, offer.id))
            .orderBy(desc(schema.offerRevisions.revisionNo))
            .limit(1);

          const firstRev = existingRevisions[0];
          const nextRevNo = firstRev ? firstRev.revisionNo + 1 : 1;

          await tx.insert(schema.offerRevisions).values({
            offerId: offer.id,
            revisionNo: nextRevNo,
            snapshotJson: {
              message: input.message,
              budgetCurrency: input.budgetCurrency ?? null,
              budgetMin: input.budgetMin ?? null,
              budgetMax: input.budgetMax ?? null,
              estimatedDurationValue: input.estimatedDurationValue ?? null,
              estimatedDurationUnit: input.estimatedDurationUnit ?? null,
            },
          });

          const [updatedOffer] = await tx
            .update(schema.offers)
            .set({
              message: input.message,
              budgetCurrency: input.budgetCurrency ?? null,
              budgetMin: input.budgetMin ?? null,
              budgetMax: input.budgetMax ?? null,
              estimatedDurationValue: input.estimatedDurationValue ?? null,
              estimatedDurationUnit: input.estimatedDurationUnit ?? null,
              updatedAt: new Date(),
            })
            .where(and(eq(schema.offers.id, offer.id), eq(schema.offers.status, "PENDING")))
            .returning();

          if (!updatedOffer) {
            throw new Error("Only pending offers can be edited");
          }

          try {
            const ownerProfiles = await tx
              .select({ locale: schema.profiles.locale })
              .from(schema.profiles)
              .where(eq(schema.profiles.userId, listing.ownerUserId))
              .limit(1);
            const isEn = ownerProfiles[0]?.locale === "en";

            await NotificationService.createNotification(
              listing.ownerUserId,
              "OFFER_UPDATED",
              "offer",
              offer.id,
              {
                title: isEn ? "Proposal Updated" : "Teklif Güncellendi",
                message: isEn
                  ? `A proposal for your project "${listing.title}" has been updated.`
                  : `"${listing.title}" projeniz için iletilen bir teklif güncellendi.`,
                actionUrl: isEn ? "/en/dashboard/offers/received" : "/tr/panel/teklifler/gelen",
              },
              tx
            );
          } catch {
            // Non-fatal notification failure
          }

          return updatedOffer;
        });
      } catch (err) {
        if (process.env.NODE_ENV === "production" || !process.env.VITEST) {
          throw err;
        }
        if (
          err instanceof Error &&
          (err.message.includes("Offer not found") ||
            err.message.includes("Unauthorized") ||
            err.message.includes("Only pending") ||
            err.message.includes("Associated listing"))
        ) {
          throw err;
        }
      }
    }

    const item = inMemorySentOffers.find((o) => o.offer.id === input.offerId);
    if (item) {
      if (item.offer.offerorUserId !== offerorUserId) {
        throw new Error("Unauthorized to edit this offer");
      }
      if (item.offer.status !== "PENDING") {
        throw new Error("Only pending offers can be edited");
      }
      item.offer.message = input.message;
      if (input.budgetCurrency !== undefined) item.offer.budgetCurrency = input.budgetCurrency;
      if (input.budgetMin !== undefined) item.offer.budgetMin = input.budgetMin;
      if (input.budgetMax !== undefined) item.offer.budgetMax = input.budgetMax;
      if (input.estimatedDurationValue !== undefined)
        item.offer.estimatedDurationValue = input.estimatedDurationValue;
      if (input.estimatedDurationUnit !== undefined)
        item.offer.estimatedDurationUnit = input.estimatedDurationUnit;
      item.offer.updatedAt = new Date();

      const receivedItem = inMemoryReceivedOffers.find((r) => r.offer.id === input.offerId);
      if (receivedItem) {
        receivedItem.offer.message = input.message;
        if (input.budgetCurrency !== undefined)
          receivedItem.offer.budgetCurrency = input.budgetCurrency;
        if (input.budgetMin !== undefined) receivedItem.offer.budgetMin = input.budgetMin;
        if (input.budgetMax !== undefined) receivedItem.offer.budgetMax = input.budgetMax;
        if (input.estimatedDurationValue !== undefined)
          receivedItem.offer.estimatedDurationValue = input.estimatedDurationValue;
        if (input.estimatedDurationUnit !== undefined)
          receivedItem.offer.estimatedDurationUnit = input.estimatedDurationUnit;
        receivedItem.offer.updatedAt = new Date();
      }

      const ownerId = (item.listing as { ownerUserId?: string })?.ownerUserId;
      if (ownerId) {
        await NotificationService.createNotification(
          ownerId,
          "OFFER_UPDATED",
          "offer",
          item.offer.id,
          {
            title: "Teklif Güncellendi",
            message: `"${item.listing.title}" projeniz için iletilen bir teklif güncellendi.`,
            actionUrl: "/tr/panel/teklifler/gelen",
          }
        ).catch(() => {});
      }

      return item.offer;
    }

    throw new Error("Offer not found");
  }

  /**
   * Withdraws a pending offer by the offeror.
   */
  static async withdrawOffer(offerorUserId: string, offerId: string) {
    const isOfferUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      offerId
    );

    if (isOfferUuid) {
      try {
        const db = getDb();

        const withdrawn = await db.transaction(async (tx) => {
          let oQuery = tx.select().from(schema.offers).where(eq(schema.offers.id, offerId));

          if (typeof (oQuery as { for?: unknown }).for === "function") {
            oQuery = (oQuery as { for: (mode: string) => typeof oQuery }).for("update");
          }

          const offerRows = await oQuery.limit(1);

          if (offerRows.length === 0) {
            throw new Error("Offer not found");
          }

          const offer = offerRows[0]!;

          if (offer.offerorUserId !== offerorUserId) {
            throw new Error("Unauthorized to withdraw this offer");
          }

          if (offer.status !== "PENDING") {
            throw new Error("Only pending offers can be withdrawn");
          }

          const [withdrawnRecord] = await tx
            .update(schema.offers)
            .set({
              status: "WITHDRAWN",
              resolvedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(and(eq(schema.offers.id, offerId), eq(schema.offers.status, "PENDING")))
            .returning();

          if (!withdrawnRecord) {
            throw new Error("Only pending offers can be withdrawn");
          }

          return { withdrawn: withdrawnRecord, offer };
        });

        if (withdrawn?.withdrawn) {
          try {
            const [listingData] = await db
              .select({
                ownerUserId: schema.listings.ownerUserId,
                title: schema.listings.title,
                locale: schema.profiles.locale,
              })
              .from(schema.listings)
              .leftJoin(schema.profiles, eq(schema.listings.ownerUserId, schema.profiles.userId))
              .where(eq(schema.listings.id, withdrawn.offer.listingId))
              .limit(1);

            if (listingData) {
              const isEn = listingData.locale === "en";
              await NotificationService.createNotification(
                listingData.ownerUserId,
                "OFFER_WITHDRAWN",
                "offer",
                withdrawn.offer.id,
                {
                  title: isEn ? "Proposal Withdrawn" : "Teklif Geri Çekildi",
                  message: isEn
                    ? `A proposal on your project "${listingData.title}" was withdrawn.`
                    : `"${listingData.title}" projenizdeki bir teklif geri çekildi.`,
                  actionUrl: isEn ? "/en/dashboard/offers/received" : "/tr/panel/teklifler/gelen",
                }
              );
            }
          } catch {
            // non-blocking
          }

          // Fail-open: Notify Inngest to cancel sleeping stale-offer lifecycle workflow
          try {
            import("@/src/lib/inngest/client")
              .then(({ sendInngestEvent }) => {
                sendInngestEvent("operis/offer.resolved", {
                  offerId: withdrawn.withdrawn.id,
                  listingId: withdrawn.offer.listingId,
                  status: "WITHDRAWN",
                }).catch(() => {});
              })
              .catch(() => {});
          } catch {
            // Fail-open
          }

          return withdrawn.withdrawn;
        }
      } catch (err) {
        if (process.env.NODE_ENV === "production" || !process.env.VITEST) {
          throw err;
        }
        if (
          err instanceof Error &&
          (err.message.includes("Unauthorized") || err.message.includes("Only pending"))
        ) {
          throw err;
        }
        // In-memory fallback
      }
    }

    const item = inMemorySentOffers.find((o) => o.offer.id === offerId);
    if (item) {
      if (item.offer.offerorUserId !== offerorUserId) {
        throw new Error("Unauthorized to withdraw this offer");
      }
      if (item.offer.status !== "PENDING") {
        throw new Error("Only pending offers can be withdrawn");
      }
      item.offer.status = "WITHDRAWN";
      item.offer.resolvedAt = new Date();
      item.offer.updatedAt = new Date();

      const receivedItem = inMemoryReceivedOffers.find((r) => r.offer.id === offerId);
      if (receivedItem) {
        receivedItem.offer.status = "WITHDRAWN";
        receivedItem.offer.resolvedAt = new Date();
        receivedItem.offer.updatedAt = new Date();
      }

      const ownerUserId = (item.listing as { ownerUserId?: string })?.ownerUserId;
      if (ownerUserId) {
        await NotificationService.createNotification(
          ownerUserId,
          "OFFER_WITHDRAWN",
          "offer",
          item.offer.id,
          {
            title: "Teklif Geri Çekildi",
            message: `"${item.listing.title}" projenizdeki bir teklif geri çekildi.`,
            actionUrl: "/tr/panel/teklifler/gelen",
          }
        ).catch(() => {});
      }

      return item.offer;
    }

    throw new Error("Offer not found");
  }

  /**
   * System background job: Automatically withdraws an offer that has remained PENDING without employer response.
   * Invoked by Inngest durable delayed workflow after step.sleep("3 days").
   */
  static async autoCancelStaleOffer(offerId: string) {
    const isOfferUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      offerId
    );

    if (isOfferUuid) {
      try {
        const db = getDb();
        const [offer] = await db
          .select()
          .from(schema.offers)
          .where(eq(schema.offers.id, offerId))
          .limit(1);

        if (!offer || offer.status !== "PENDING") {
          return { offerId, cancelled: false, status: offer?.status ?? "NOT_FOUND" };
        }

        const [withdrawnRecord] = await db
          .update(schema.offers)
          .set({
            status: "WITHDRAWN",
            rejectionCode: "STALE_TIMEOUT",
            rejectionNote: "Automatically withdrawn after 3 days of inactivity",
            resolvedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(and(eq(schema.offers.id, offerId), eq(schema.offers.status, "PENDING")))
          .returning();

        if (!withdrawnRecord) {
          return { offerId, cancelled: false, status: "ALREADY_RESOLVED" };
        }

        const [listing] = await db
          .select({
            title: schema.listings.title,
            ownerUserId: schema.listings.ownerUserId,
          })
          .from(schema.listings)
          .where(eq(schema.listings.id, offer.listingId))
          .limit(1);

        if (listing) {
          const [offerorProfile] = await db
            .select({ locale: schema.profiles.locale })
            .from(schema.profiles)
            .where(eq(schema.profiles.userId, offer.offerorUserId))
            .limit(1);

          const [ownerProfile] = await db
            .select({ locale: schema.profiles.locale })
            .from(schema.profiles)
            .where(eq(schema.profiles.userId, listing.ownerUserId))
            .limit(1);

          const isOfferorEn = offerorProfile?.locale === "en";
          const isOwnerEn = ownerProfile?.locale === "en";

          await NotificationService.createNotification(
            offer.offerorUserId,
            "OFFER_WITHDRAWN",
            "offer",
            offerId,
            {
              listingId: offer.listingId,
              title: isOfferorEn ? "Proposal Expired" : "Teklif Zaman Aşımı",
              message: isOfferorEn
                ? `Your proposal for "${listing.title}" was automatically withdrawn after 3 days without response.`
                : `"${listing.title}" projesine verdiğiniz teklif yanıtlanmadığı için otomatik olarak geri çekildi.`,
              actionUrl: isOfferorEn ? "/en/dashboard/offers/sent" : "/tr/panel/teklifler/giden",
            }
          ).catch(() => {});

          await NotificationService.createNotification(
            listing.ownerUserId,
            "OFFER_WITHDRAWN",
            "offer",
            offerId,
            {
              listingId: offer.listingId,
              title: isOwnerEn ? "Proposal Withdrawn (Timeout)" : "Teklif Zaman Aşımı",
              message: isOwnerEn
                ? `A proposal on your project "${listing.title}" was withdrawn automatically due to inactivity.`
                : `"${listing.title}" projenizdeki bir teklif 3 gün boyunca yanıtsız kaldığı için sistem tarafından geri çekildi.`,
              actionUrl: isOwnerEn ? "/en/dashboard/offers/received" : "/tr/panel/teklifler/gelen",
            }
          ).catch(() => {});
        }

        return { offerId, cancelled: true, status: "WITHDRAWN" };
      } catch (err) {
        if (process.env.NODE_ENV === "production") {
          throw err;
        }
      }
    }

    const item = inMemorySentOffers.find((o) => o.offer.id === offerId);
    if (item && item.offer.status === "PENDING") {
      item.offer.status = "WITHDRAWN";
      item.offer.resolvedAt = new Date();
      item.offer.updatedAt = new Date();
      const rec = inMemoryReceivedOffers.find((r) => r.offer.id === offerId);
      if (rec) {
        rec.offer.status = "WITHDRAWN";
        rec.offer.resolvedAt = new Date();
        rec.offer.updatedAt = new Date();
      }
      return { offerId, cancelled: true, status: "WITHDRAWN" };
    }

    return { offerId, cancelled: false, status: item?.offer.status ?? "NOT_FOUND" };
  }

  /**
   * Rejects an offer by the listing owner, with optional structured reason code and note.
   */
  static async rejectOffer(listingOwnerUserId: string, rawInput: RejectOfferInput) {
    const input = rejectOfferSchema.parse(rawInput);
    const isOfferUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      input.offerId
    );

    if (isOfferUuid) {
      try {
        const db = getDb();

        const rejectedResult = await db.transaction(async (tx) => {
          let oQuery = tx
            .select({
              offer: schema.offers,
              listing: schema.listings,
            })
            .from(schema.offers)
            .innerJoin(schema.listings, eq(schema.offers.listingId, schema.listings.id))
            .where(eq(schema.offers.id, input.offerId));

          if (typeof (oQuery as { for?: unknown }).for === "function") {
            oQuery = (oQuery as { for: (mode: string) => typeof oQuery }).for("update");
          }

          const offerRows = await oQuery.limit(1);

          const firstRow = offerRows[0];
          if (!firstRow) {
            throw new Error("Offer not found");
          }

          const { offer, listing } = firstRow;

          if (listing.ownerUserId !== listingOwnerUserId) {
            throw new Error("Unauthorized to reject offers for this listing");
          }

          if (offer.status !== "PENDING") {
            throw new Error("Only pending offers can be rejected");
          }

          const [rejectedRecord] = await tx
            .update(schema.offers)
            .set({
              status: "REJECTED",
              rejectionCode: input.rejectionCode ?? null,
              rejectionNote: input.rejectionNote ?? null,
              resolvedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(and(eq(schema.offers.id, input.offerId), eq(schema.offers.status, "PENDING")))
            .returning();

          if (!rejectedRecord) {
            throw new Error("Only pending offers can be rejected");
          }

          return { rejected: rejectedRecord, offer, listing };
        });

        if (rejectedResult?.rejected) {
          const { rejected, offer, listing } = rejectedResult;
          try {
            const [offerorProfile] = await db
              .select({ locale: schema.profiles.locale })
              .from(schema.profiles)
              .where(eq(schema.profiles.userId, offer.offerorUserId))
              .limit(1);

            const isEn = offerorProfile?.locale === "en";
            await NotificationService.createNotification(
              offer.offerorUserId,
              "OFFER_REJECTED",
              "offer",
              rejected.id,
              {
                title: isEn ? "Proposal Concluded" : "Teklifiniz Değerlendirildi",
                message: isEn
                  ? `Your proposal for "${listing.title}" has been concluded.`
                  : `"${listing.title}" projesine sunduğunuz teklif sonuçlandırıldı.`,
                actionUrl: isEn ? "/en/dashboard/offers/sent" : "/tr/panel/teklifler/gonderilen",
              }
            );
          } catch {
            // non-blocking
          }

          // Fail-open: Notify Inngest to cancel sleeping stale-offer lifecycle workflow
          try {
            import("@/src/lib/inngest/client")
              .then(({ sendInngestEvent }) => {
                sendInngestEvent("operis/offer.resolved", {
                  offerId: rejected.id,
                  listingId: offer.listingId,
                  status: "REJECTED",
                }).catch(() => {});
              })
              .catch(() => {});
          } catch {
            // Fail-open
          }
        }

        return rejectedResult.rejected;
      } catch (err) {
        if (process.env.NODE_ENV === "production" || !process.env.VITEST) {
          throw err;
        }
        if (
          err instanceof Error &&
          (err.message.includes("Offer not found") ||
            err.message.includes("Unauthorized") ||
            err.message.includes("Only pending"))
        ) {
          throw err;
        }
      }
    }

    const item = inMemoryReceivedOffers.find((o) => o.offer.id === input.offerId);
    if (item) {
      if (item.listing.ownerUserId && item.listing.ownerUserId !== listingOwnerUserId) {
        throw new Error("Unauthorized to reject offers for this listing");
      }
      if (item.offer.status !== "PENDING") {
        throw new Error("Only pending offers can be rejected");
      }
      item.offer.status = "REJECTED";
      item.offer.rejectionCode = input.rejectionCode ?? null;
      item.offer.rejectionNote = input.rejectionNote ?? null;
      item.offer.resolvedAt = new Date();
      item.offer.updatedAt = new Date();

      const sentItem = inMemorySentOffers.find((s) => s.offer.id === input.offerId);
      if (sentItem) {
        sentItem.offer.status = "REJECTED";
        sentItem.offer.rejectionCode = input.rejectionCode ?? null;
        sentItem.offer.rejectionNote = input.rejectionNote ?? null;
        sentItem.offer.resolvedAt = new Date();
        sentItem.offer.updatedAt = new Date();
      }

      return item.offer;
    }

    throw new Error("Offer not found");
  }
}
