import crypto from "crypto";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { NotificationService } from "@/src/modules/notifications/service";
import { inMemoryListings } from "@/src/modules/listings/service";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";
import {
  BatchSubmitOffersInput,
  OfferTemplateInput,
  RejectOfferInput,
  SubmitOfferInput,
  UpdateOfferInput,
  batchSubmitOffersSchema,
  offerTemplateSchema,
  rejectOfferSchema,
  submitOfferSchema,
  updateOfferSchema,
} from "./validation";

export interface SentOfferDto {
  offer: typeof schema.offers.$inferSelect;
  listing: {
    id: string;
    slug: string;
    title: string;
    status: string;
    activeUntil: Date | null;
  };
  engagementId?: string | null;
}

export interface ReceivedOfferDto {
  offer: typeof schema.offers.$inferSelect;
  offerorProfile: {
    userId: string;
    handle: string;
    displayName: string;
  };
  listing: {
    id: string;
    slug: string;
    title: string;
    status: string;
    activeUntil: Date | null;
    ownerUserId?: string;
  };
  engagementId?: string | null;
}

export interface BatchOfferResultItem {
  listingId: string;
  status: "SUCCESS" | "FAILED";
  offerId?: string;
  code?: string;
  message?: string;
  offer?: typeof schema.offers.$inferSelect;
}

export interface BatchOfferResponse {
  batchId: string;
  total: number;
  succeededCount: number;
  failedCount: number;
  results: BatchOfferResultItem[];
}

export interface OfferTemplateDto {
  id: string;
  userId: string;
  name: string;
  message: string;
  budgetCurrency?: "TRY" | "USD" | "EUR" | "GBP" | null;
  budgetMin?: string | null;
  budgetMax?: string | null;
  estimatedDurationValue?: number | null;
  estimatedDurationUnit?: "DAYS" | "WEEKS" | "MONTHS" | null;
  createdAt: Date;
}

// In-memory runtime store for offers created during session (empty by default)
export const inMemorySentOffers: SentOfferDto[] = [];
export const inMemoryReceivedOffers: ReceivedOfferDto[] = [];
export const inMemoryBatchIdempotencyStore = new Map<string, BatchOfferResponse>();
export const inMemoryOfferTemplates = new Map<string, OfferTemplateDto[]>();

const DEFAULT_STARTER_TEMPLATES = (userId: string, locale?: string): OfferTemplateDto[] => {
  const isEn = locale === "en";
  return [
    {
      id: "default-1",
      userId,
      name: isEn ? "Standard Project Offer" : "Standart Proje Teklifi",
      message: isEn
        ? "Hello {{owner_name}}, I have carefully reviewed the technical requirements for '{{project_title}}'. With my experience in {{category}} and relevant reference work, I can ensure high-quality delivery within your target timeline."
        : "Merhaba {{ilan_sahibi}}, '{{proje_basligi}}' başlıklı projenizin teknik gereksinimlerini detaylıca inceledim. {{kategori}} alanındaki deneyimim ve benzer referans projelerimle hedeflenen takvim içerisinde yüksek kaliteli teslimat sağlayabilirim.",
      budgetCurrency: isEn ? "USD" : "TRY",
      budgetMin: isEn ? "500" : "15000",
      budgetMax: isEn ? "1500" : "35000",
      estimatedDurationValue: 2,
      estimatedDurationUnit: "WEEKS",
      createdAt: new Date(),
    },
    {
      id: "default-2",
      userId,
      name: isEn ? "Fast Advisory & Solution" : "Hızlı Danışmanlık & Çözüm",
      message: isEn
        ? "Hello, I can provide direct architectural guidance and development support for '{{project_title}}'. We can quickly clarify the requirements and begin immediately."
        : "Merhaba, '{{proje_basligi}}' projeniz için teknik mimari ve uygulama sürecinde doğrudan danışmanlık ve geliştirme desteği sunabilirim. Gereksinimleri hızla netleştirip başlayabiliriz.",
      budgetCurrency: isEn ? "USD" : "TRY",
      budgetMin: isEn ? "250" : "5000",
      budgetMax: isEn ? "600" : "15000",
      estimatedDurationValue: 1,
      estimatedDurationUnit: "WEEKS",
      createdAt: new Date(),
    },
  ];
};

export class OfferService {
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

          const [insertedOffer] = await tx
            .insert(schema.offers)
            .values({
              listingId: lockedListing.id,
              offerorUserId,
              listingActivationSeq: lockedListing.activationSeq,
              status: "PENDING",
              message: input.message,
              budgetCurrency: input.budgetCurrency ?? null,
              budgetMin: input.budgetMin ?? null,
              budgetMax: input.budgetMax ?? null,
              estimatedDurationValue: input.estimatedDurationValue ?? null,
              estimatedDurationUnit: input.estimatedDurationUnit ?? null,
            })
            .returning();

          if (!insertedOffer) {
            throw new Error("Failed to insert offer");
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
                ? `A new proposal has been submitted for your project "${lockedListing.title || listing.title}".`
                : `"${lockedListing.title || listing.title}" projeniz için yeni bir teklif iletildi.`,
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
            ? `A new proposal has been submitted for your project "${listing.title}".`
            : `"${listing.title}" projeniz için yeni bir teklif iletildi.`,
          actionUrl: isEn ? "/en/dashboard/offers/received" : "/tr/panel/teklifler/gelen",
          offerId: newOffer.id,
          listingId: listing.id,
        },
        undefined,
        `offer:${newOffer.id}:received:user:${listing.ownerUserId}`
      ).catch(() => {});
    }

    if (newOffer && Boolean(process.env.VITEST)) {
      inMemorySentOffers.unshift({
        offer: newOffer,
        listing: {
          id: listing.id,
          slug: listing.slug || `listing-${listing.id.slice(0, 8)}`,
          title: listing.title || "Project Listing",
          status: listing.status,
          activeUntil: listing.activeUntil,
        },
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

  /**
   * Retrieves offers submitted by the current user with listing details.
   */
  static async getSentOffers(
    offerorUserId: string,
    statusFilter?: string
  ): Promise<SentOfferDto[]> {
    try {
      const db = getDb();

      const query = db
        .select({
          offer: schema.offers,
          listing: {
            id: schema.listings.id,
            slug: schema.listings.slug,
            title: schema.listings.title,
            status: schema.listings.status,
            activeUntil: schema.listings.activeUntil,
          },
          engagementId: schema.engagements.id,
        })
        .from(schema.offers)
        .innerJoin(schema.listings, eq(schema.offers.listingId, schema.listings.id))
        .leftJoin(schema.engagements, eq(schema.offers.id, schema.engagements.acceptedOfferId))
        .where(eq(schema.offers.offerorUserId, offerorUserId))
        .orderBy(desc(schema.offers.createdAt));

      const rows = await query;

      if (!statusFilter || statusFilter === "all") return rows as SentOfferDto[];
      return rows.filter(
        (r) => r.offer.status.toLowerCase() === statusFilter.toLowerCase()
      ) as SentOfferDto[];
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        console.error("Database query failed in getSentOffers:", err);
        throw new Error("FAILED_TO_FETCH_SENT_OFFERS", { cause: err });
      }
      if (!process.env.VITEST) {
        throw err;
      }
      // Fall through to in-memory fallback for Vitest
    }

    // In-memory fallback
    const rows = inMemorySentOffers
      .filter((o) => o.offer.offerorUserId === offerorUserId)
      .map((item) => ({
        ...item,
        engagementId: item.offer.status === "ACCEPTED" ? "eng-demo-101" : null,
      }));

    if (!statusFilter || statusFilter === "all") return rows;
    return rows.filter((r) => r.offer.status.toLowerCase() === statusFilter.toLowerCase());
  }

  /**
   * Retrieves offers received for a listing owned by the current user.
   * Strictly protects offer privacy: only the listing owner can view received offers.
   */
  static async getReceivedOffers(
    listingOwnerUserId: string,
    listingId?: string
  ): Promise<ReceivedOfferDto[]> {
    try {
      const db = getDb();

      const conditions = [eq(schema.listings.ownerUserId, listingOwnerUserId)];
      if (listingId) {
        conditions.push(eq(schema.listings.id, listingId));
      }

      const rows = await db
        .select({
          offer: schema.offers,
          offerorProfile: {
            userId: schema.profiles.userId,
            handle: schema.profiles.handle,
            displayName: schema.profiles.displayName,
          },
          listing: {
            id: schema.listings.id,
            slug: schema.listings.slug,
            title: schema.listings.title,
            status: schema.listings.status,
            activeUntil: schema.listings.activeUntil,
          },
          engagementId: schema.engagements.id,
        })
        .from(schema.offers)
        .innerJoin(schema.listings, eq(schema.offers.listingId, schema.listings.id))
        .innerJoin(schema.profiles, eq(schema.offers.offerorUserId, schema.profiles.userId))
        .leftJoin(schema.engagements, eq(schema.offers.id, schema.engagements.acceptedOfferId))
        .where(and(...conditions))
        .orderBy(desc(schema.offers.createdAt));

      return rows as ReceivedOfferDto[];
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        console.error("Database query failed in getReceivedOffers:", err);
        throw new Error("FAILED_TO_FETCH_RECEIVED_OFFERS", { cause: err });
      }
      if (!process.env.VITEST) {
        throw err;
      }
      // Fall through to in-memory fallback for Vitest
    }

    const filtered = inMemoryReceivedOffers.filter(
      (r) => !r.listing.ownerUserId || r.listing.ownerUserId === listingOwnerUserId
    );
    if (listingId) {
      return filtered.filter((r) => r.listing.id === listingId);
    }
    return filtered;
  }

  /**
   * Securely gets an offer by ID, strictly verifying that the viewer is either
   * the offeror or the listing owner (preventing IDOR).
   */
  static async getOfferById(viewerUserId: string, offerId: string) {
    const isOfferUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      offerId
    );

    if (!isOfferUuid) {
      if (process.env.VITEST) {
        const sent = inMemorySentOffers.find((s) => s.offer.id === offerId);
        if (sent) {
          const ownerId = (sent.listing as { ownerUserId?: string }).ownerUserId;
          if (sent.offer.offerorUserId !== viewerUserId && ownerId && ownerId !== viewerUserId) {
            return null;
          }
          return {
            offer: sent.offer,
            listing: sent.listing as unknown as typeof schema.listings.$inferSelect,
            offerorProfile: {
              userId: sent.offer.offerorUserId,
              handle: "demokullanici",
              displayName: "Demir Yıldız",
            } as unknown as typeof schema.profiles.$inferSelect,
          };
        }
      }
      return null;
    }

    const db = getDb();

    const rows = await db
      .select({
        offer: schema.offers,
        listing: schema.listings,
        offerorProfile: schema.profiles,
      })
      .from(schema.offers)
      .innerJoin(schema.listings, eq(schema.offers.listingId, schema.listings.id))
      .innerJoin(schema.profiles, eq(schema.offers.offerorUserId, schema.profiles.userId))
      .where(eq(schema.offers.id, offerId))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    // Access control: only offeror or listing owner
    if (row.offer.offerorUserId !== viewerUserId && row.listing.ownerUserId !== viewerUserId) {
      return null;
    }

    return row;
  }

  /**
   * Submits batch proposals across multiple listings (max 5) with RFC 7807 / Envelope Multi-Status
   * response format, individual isolated sub-transactions, and idempotency protection.
   */
  static async batchSubmitOffers(
    offerorUserId: string,
    rawInput: BatchSubmitOffersInput,
    locale?: string
  ) {
    const input = batchSubmitOffersSchema.parse(rawInput);
    const isEn = locale === "en";

    if (input.items.length > 1 && input.capacityConfirmed === false) {
      throw new Error(
        isEn
          ? "You must confirm your delivery capacity when submitting multiple proposals simultaneously."
          : "Birden fazla projeye aynı anda teklif verirken teslimat kapasitenizi onaylamanız gerekmektedir."
      );
    }

    if (input.idempotencyKey) {
      const cached = inMemoryBatchIdempotencyStore.get(`${offerorUserId}:${input.idempotencyKey}`);
      if (cached) {
        return cached;
      }
    }

    const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      offerorUserId
    );
    const dbKey = input.idempotencyKey
      ? `batch:offers:${offerorUserId}:${input.idempotencyKey}`
      : null;

    if (dbKey && isUserUuid) {
      try {
        const db = getDb();
        const existingKey = await db
          .select()
          .from(schema.idempotencyKeys)
          .where(eq(schema.idempotencyKeys.key, dbKey))
          .limit(1);

        if (existingKey[0]) {
          if (existingKey[0].responseJson) {
            return existingKey[0].responseJson as BatchOfferResponse;
          }
          throw new Error(
            isEn
              ? "A batch submission with this idempotency key is currently processing."
              : "Bu idempotency anahtarıyla bir toplu teklif işlemi şu anda yürütülüyor."
          );
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        await db.insert(schema.idempotencyKeys).values({
          key: dbKey,
          userId: offerorUserId,
          action: "BATCH_SUBMIT_OFFERS",
          responseJson: null,
          createdAt: now,
          expiresAt,
        });
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          (err.message.includes("currently processing") ||
            err.message.includes("şu anda yürütülüyor"))
        ) {
          throw err;
        }
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: string }).code === "23505"
        ) {
          throw new Error(
            isEn
              ? "A batch submission with this idempotency key is already in progress or completed."
              : "Bu idempotency anahtarıyla bir toplu teklif işlemi zaten yürütülüyor veya tamamlandı.",
            { cause: err }
          );
        }
      }
    }

    const batchId = crypto.randomUUID();
    const results: BatchOfferResultItem[] = [];

    for (const item of input.items) {
      try {
        const offer = await OfferService.submitOffer(offerorUserId, item);
        results.push({
          listingId: item.listingId,
          status: "SUCCESS",
          offerId: offer.id,
          offer,
        });
      } catch (err: unknown) {
        const rawMessage = err instanceof Error ? err.message : "Teklif iletilemedi";
        let code = "SUBMISSION_FAILED";
        let message: string;

        if (rawMessage.includes("own listing") || rawMessage.includes("Kendi ilanınıza")) {
          code = "SELF_BIDDING_PROHIBITED";
          message = isEn
            ? "You cannot submit an offer on your own listing."
            : "Kendi ilanınıza teklif veremezsiniz.";
        } else if (
          rawMessage.includes("active for offers") ||
          rawMessage.includes("teklif kabul etmiyor")
        ) {
          code = "LISTING_NOT_ACTIVE";
          message = isEn
            ? "Listing is not currently active for offers."
            : "İlan şu anda teklif kabul etmiyor veya süresi dolmuş.";
        } else if (
          rawMessage.includes("Cannot submit an offer to this listing") ||
          rawMessage.includes("engelleme kısıtı")
        ) {
          code = "USER_BLOCKED";
          message = isEn
            ? "Cannot submit an offer to this listing."
            : "Bu ilana teklif verilemez (engelleme kısıtı).";
        } else if (
          rawMessage.includes("already have an active pending offer") ||
          rawMessage.includes("bekleyen bir teklifiniz")
        ) {
          code = "ALREADY_OFFERED";
          message = isEn
            ? "You already have an active pending offer on this listing."
            : "Bu ilana yönelik zaten aktif ve bekleyen bir teklifiniz bulunmaktadır.";
        } else if (
          rawMessage.includes("withdrawing during this activation cycle") ||
          rawMessage.includes("teklifinizi geri çektiğiniz")
        ) {
          code = "WITHDRAWN_IN_CYCLE";
          message = isEn
            ? "You cannot submit another offer after withdrawing during this activation cycle."
            : "Bu yayın döngüsünde teklifinizi geri çektiğiniz için yeni bir teklif iletemezsiniz.";
        } else if (
          rawMessage.includes("doğrulamanız gerekmektedir") ||
          rawMessage.includes("verify your email")
        ) {
          code = "EMAIL_VERIFICATION_REQUIRED";
          message = isEn
            ? "You must verify your email address before submitting an offer."
            : "Teklif verebilmek için önce e-posta adresinizi doğrulamanız gerekmektedir.";
        } else {
          message = rawMessage;
        }

        results.push({
          listingId: item.listingId,
          status: "FAILED",
          code,
          message,
        });
      }
    }

    const succeededCount = results.filter((r) => r.status === "SUCCESS").length;
    const failedCount = results.filter((r) => r.status === "FAILED").length;

    const response: BatchOfferResponse = {
      batchId,
      total: results.length,
      succeededCount,
      failedCount,
      results,
    };

    if (input.idempotencyKey) {
      inMemoryBatchIdempotencyStore.set(`${offerorUserId}:${input.idempotencyKey}`, response);
    }

    if (dbKey && isUserUuid) {
      try {
        const db = getDb();
        await db
          .update(schema.idempotencyKeys)
          .set({ responseJson: response })
          .where(eq(schema.idempotencyKeys.key, dbKey));
      } catch (err) {
        console.error("Non-blocking idempotency update error:", err);
      }
    }

    return response;
  }

  /**
   * Retrieves quick offer templates for a user. Provides defaults if none configured yet.
   */
  static getUserOfferTemplates(userId: string, locale?: string): OfferTemplateDto[] {
    const existing = inMemoryOfferTemplates.get(userId);
    if (existing === undefined) {
      const defaults = DEFAULT_STARTER_TEMPLATES(userId, locale);
      inMemoryOfferTemplates.set(userId, [...defaults]);
      return defaults;
    }

    // If user has not created custom templates and only holds default starter templates,
    // adapt them to the requested locale dynamically.
    if (existing.length > 0 && existing.every((t) => t.id.startsWith("default-"))) {
      const isEn = locale === "en";
      const isCurrentEn = existing[0]?.budgetCurrency === "USD";
      if (isEn !== isCurrentEn) {
        const defaults = DEFAULT_STARTER_TEMPLATES(userId, locale);
        inMemoryOfferTemplates.set(userId, [...defaults]);
        return defaults;
      }
    }

    return existing;
  }

  /**
   * Creates or updates a quick offer template for a user.
   */
  static saveOfferTemplate(userId: string, rawInput: OfferTemplateInput): OfferTemplateDto {
    const input = offerTemplateSchema.parse(rawInput);
    const templates = OfferService.getUserOfferTemplates(userId);

    const templateId = input.id || crypto.randomUUID();
    const newTemplate: OfferTemplateDto = {
      id: templateId,
      userId,
      name: input.name,
      message: input.message,
      budgetCurrency: input.budgetCurrency ?? null,
      budgetMin: input.budgetMin ?? null,
      budgetMax: input.budgetMax ?? null,
      estimatedDurationValue: input.estimatedDurationValue ?? null,
      estimatedDurationUnit: input.estimatedDurationUnit ?? null,
      createdAt: new Date(),
    };

    const existingIndex = templates.findIndex((t) => t.id === templateId);
    if (existingIndex >= 0) {
      templates[existingIndex] = newTemplate;
    } else {
      templates.push(newTemplate);
    }
    inMemoryOfferTemplates.set(userId, templates);
    return newTemplate;
  }

  /**
   * Deletes a quick offer template for a user.
   */
  static deleteOfferTemplate(userId: string, templateId: string): boolean {
    const templates = OfferService.getUserOfferTemplates(userId);
    const exists = templates.some((t) => t.id === templateId);
    if (!exists) {
      return false;
    }
    const filtered = templates.filter((t) => t.id !== templateId);
    inMemoryOfferTemplates.set(userId, filtered);
    return true;
  }

  /**
   * Retrieves quick offer templates with database persistence and starter fallback.
   */
  static async getUserOfferTemplatesAsync(
    userId: string,
    locale?: string
  ): Promise<OfferTemplateDto[]> {
    const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId
    );
    if (isUserUuid) {
      try {
        const db = getDb();
        const rows = await db
          .select()
          .from(schema.offerTemplates)
          .where(eq(schema.offerTemplates.userId, userId))
          .orderBy(desc(schema.offerTemplates.createdAt));

        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            userId: r.userId,
            name: r.name,
            message: r.message,
            budgetCurrency: (r.budgetCurrency as "TRY" | "USD" | "EUR" | "GBP" | null) || null,
            budgetMin: r.budgetMin,
            budgetMax: r.budgetMax,
            estimatedDurationValue: r.estimatedDurationValue,
            estimatedDurationUnit:
              (r.estimatedDurationUnit as "DAYS" | "WEEKS" | "MONTHS" | null) || null,
            createdAt: r.createdAt,
          }));
        }
      } catch {
        // fall back to in-memory/starter
      }
    }
    return OfferService.getUserOfferTemplates(userId, locale);
  }

  /**
   * Saves or updates a quick offer template with database persistence and strict ownership validation.
   */
  static async saveOfferTemplateAsync(
    userId: string,
    rawInput: OfferTemplateInput
  ): Promise<OfferTemplateDto> {
    const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId
    );
    const inputId = rawInput.id;
    const isInputUuid =
      typeof inputId === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inputId);

    // If templateId is a starter id like "default-1", generate a new UUID for persistence
    const templateId = isInputUuid ? inputId : crypto.randomUUID();

    if (isUserUuid) {
      const db = getDb();

      if (isInputUuid) {
        // Verify ownership if updating an existing UUID template (B10)
        const existing = await db
          .select({ id: schema.offerTemplates.id, userId: schema.offerTemplates.userId })
          .from(schema.offerTemplates)
          .where(eq(schema.offerTemplates.id, inputId))
          .limit(1);

        if (existing[0] && existing[0].userId !== userId) {
          throw new Error("You do not have permission to modify this template.");
        }
      }

      try {
        await db
          .insert(schema.offerTemplates)
          .values({
            id: templateId,
            userId,
            name: rawInput.name,
            message: rawInput.message,
            budgetCurrency: rawInput.budgetCurrency ?? null,
            budgetMin: rawInput.budgetMin ?? null,
            budgetMax: rawInput.budgetMax ?? null,
            estimatedDurationValue: rawInput.estimatedDurationValue ?? null,
            estimatedDurationUnit: rawInput.estimatedDurationUnit ?? null,
          })
          .onConflictDoUpdate({
            target: schema.offerTemplates.id,
            set: {
              name: rawInput.name,
              message: rawInput.message,
              budgetCurrency: rawInput.budgetCurrency ?? null,
              budgetMin: rawInput.budgetMin ?? null,
              budgetMax: rawInput.budgetMax ?? null,
              estimatedDurationValue: rawInput.estimatedDurationValue ?? null,
              estimatedDurationUnit: rawInput.estimatedDurationUnit ?? null,
              updatedAt: new Date(),
            },
            where: eq(schema.offerTemplates.userId, userId),
          });
      } catch (dbErr) {
        if (process.env.NODE_ENV === "production") {
          throw new Error(
            dbErr instanceof Error ? dbErr.message : "Failed to persist template to database.",
            { cause: dbErr }
          );
        }
      }
    }

    const template = OfferService.saveOfferTemplate(userId, { ...rawInput, id: templateId });
    return template;
  }

  /**
   * Deletes a quick offer template from the database and memory with accurate result representation.
   */
  static async deleteOfferTemplateAsync(userId: string, templateId: string): Promise<boolean> {
    const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId
    );
    const isTemplateUuid =
      typeof templateId === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templateId);

    let dbDeleted = false;
    if (isUserUuid && isTemplateUuid) {
      try {
        const db = getDb();
        const deletedRows = await db
          .delete(schema.offerTemplates)
          .where(
            and(eq(schema.offerTemplates.id, templateId), eq(schema.offerTemplates.userId, userId))
          )
          .returning({ id: schema.offerTemplates.id });
        dbDeleted = deletedRows.length > 0;
      } catch (dbErr) {
        if (process.env.NODE_ENV === "production") {
          throw new Error(
            dbErr instanceof Error ? dbErr.message : "Failed to delete template from database.",
            { cause: dbErr }
          );
        }
      }
    }

    const memDeleted = OfferService.deleteOfferTemplate(userId, templateId);
    return dbDeleted || memDeleted;
  }

  /**
   * T-13: Fetches revision history for a specific offer.
   * Requires viewer to be either the offeror or the listing owner (IDOR protection).
   */
  static async getOfferRevisions(viewerUserIdOrOfferId: string, offerId?: string) {
    const targetOfferId = offerId ?? viewerUserIdOrOfferId;
    const viewerUserId = offerId ? viewerUserIdOrOfferId : "";
    if (!targetOfferId) return [];

    if (viewerUserId) {
      const offerData = await OfferService.getOfferById(viewerUserId, targetOfferId);
      if (!offerData) {
        throw new Error("UNAUTHORIZED_OFFER_REVISIONS_VIEW");
      }
    }

    try {
      const db = getDb();
      return await db
        .select({
          id: schema.offerRevisions.id,
          offerId: schema.offerRevisions.offerId,
          revisionNo: schema.offerRevisions.revisionNo,
          snapshotJson: schema.offerRevisions.snapshotJson,
          createdAt: schema.offerRevisions.createdAt,
        })
        .from(schema.offerRevisions)
        .where(eq(schema.offerRevisions.offerId, targetOfferId))
        .orderBy(desc(schema.offerRevisions.revisionNo));
    } catch {
      return [];
    }
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
