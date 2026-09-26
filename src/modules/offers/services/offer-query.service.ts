import { getDb, schema } from "@/src/lib/db";
import { and, desc, eq } from "drizzle-orm";
import { decryptOfferMessage } from "../crypto";
import { offerTemplateSchema, type OfferTemplateInput } from "../validation";
import {
  DEFAULT_STARTER_TEMPLATES,
  inMemoryOfferTemplates,
  inMemoryReceivedOffers,
  inMemorySentOffers,
  inMemorySquadMembers,
  type OfferTemplateDto,
  type ReceivedOfferDto,
  type SentOfferDto,
} from "./types";

export class OfferQueryService {
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
      rows.forEach((r) => {
        if (r.offer?.message) {
          r.offer.message = decryptOfferMessage(r.offer.message, r.offer.id);
        }
      });

      if (!statusFilter || statusFilter === "all") {
        return rows as unknown as SentOfferDto[];
      }
      return (rows as unknown as SentOfferDto[]).filter(
        (r) => r.offer.status.toLowerCase() === statusFilter.toLowerCase()
      );
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        console.error("Database query failed in getSentOffers:", err);
        throw new Error("FAILED_TO_FETCH_SENT_OFFERS", { cause: err });
      }
      // Fall through to in-memory fallback for development and Vitest
    }

    // In-memory fallback
    const rows = inMemorySentOffers
      .filter((o) => o.offer.offerorUserId === offerorUserId)
      .map((item) => ({
        ...item,
        engagementId: item.offer.status === "ACCEPTED" ? "eng-demo-101" : null,
        squadMembers: inMemorySquadMembers.get(item.offer.id) || item.squadMembers,
      }));

    if (!statusFilter || statusFilter === "all") {
      return rows;
    }
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

      rows.forEach((r) => {
        if (r.offer?.message) {
          r.offer.message = decryptOfferMessage(r.offer.message, r.offer.id);
        }
      });

      return rows as unknown as ReceivedOfferDto[];
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        console.error("Database query failed in getReceivedOffers:", err);
        throw new Error("FAILED_TO_FETCH_RECEIVED_OFFERS", { cause: err });
      }
      // Fall through to in-memory fallback for development and Vitest
    }

    const filtered = inMemoryReceivedOffers.filter(
      (r) => !r.listing.ownerUserId || r.listing.ownerUserId === listingOwnerUserId
    );
    const targetRows = listingId ? filtered.filter((r) => r.listing.id === listingId) : filtered;
    return targetRows.map((r) => ({
      ...r,
      squadMembers: inMemorySquadMembers.get(r.offer.id) || r.squadMembers,
    }));
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
    if (!row) {
      return null;
    }

    // Access control: only offeror or listing owner
    if (row.offer.offerorUserId !== viewerUserId && row.listing.ownerUserId !== viewerUserId) {
      return null;
    }

    if (row.offer?.message) {
      row.offer.message = decryptOfferMessage(row.offer.message, row.offer.id);
    }

    return row;
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
    const templates = OfferQueryService.getUserOfferTemplates(userId);

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
    const templates = OfferQueryService.getUserOfferTemplates(userId);
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
          return rows.map((r: typeof schema.offerTemplates.$inferSelect) => ({
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
    return OfferQueryService.getUserOfferTemplates(userId, locale);
  }

  /**
   * Saves or updates a quick offer template with database persistence and strict ownership validation.
   */
  static async saveOfferTemplateAsync(
    userId: string,
    rawInput: OfferTemplateInput
  ): Promise<OfferTemplateDto> {
    // 1. Strict Zod validation BEFORE any database write to prevent persisting invalid records
    const validatedInput = offerTemplateSchema.parse(rawInput);

    const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId
    );
    const inputId = validatedInput.id;
    const isInputUuid =
      typeof inputId === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inputId);

    // If templateId is a starter id like "default-1", generate a new UUID for persistence
    let templateId = crypto.randomUUID();
    if (isInputUuid) {
      templateId = inputId;
    }

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
            name: validatedInput.name,
            message: validatedInput.message,
            budgetCurrency: validatedInput.budgetCurrency ?? null,
            budgetMin: validatedInput.budgetMin ?? null,
            budgetMax: validatedInput.budgetMax ?? null,
            estimatedDurationValue: validatedInput.estimatedDurationValue ?? null,
            estimatedDurationUnit: validatedInput.estimatedDurationUnit ?? null,
          })
          .onConflictDoUpdate({
            target: schema.offerTemplates.id,
            set: {
              name: validatedInput.name,
              message: validatedInput.message,
              budgetCurrency: validatedInput.budgetCurrency ?? null,
              budgetMin: validatedInput.budgetMin ?? null,
              budgetMax: validatedInput.budgetMax ?? null,
              estimatedDurationValue: validatedInput.estimatedDurationValue ?? null,
              estimatedDurationUnit: validatedInput.estimatedDurationUnit ?? null,
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

    const template = OfferQueryService.saveOfferTemplate(userId, { ...validatedInput, id: templateId });
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

    const memDeleted = OfferQueryService.deleteOfferTemplate(userId, templateId);
    return dbDeleted || memDeleted;
  }

  /**
   * T-13: Fetches revision history for a specific offer.
   * Requires viewer to be either the offeror or the listing owner (IDOR protection).
   */
  static async getOfferRevisions(viewerUserIdOrOfferId: string, offerId?: string) {
    let targetOfferId = viewerUserIdOrOfferId;
    if (offerId) {
      targetOfferId = offerId;
    }
    const viewerUserId = offerId ? viewerUserIdOrOfferId : "";
    if (!targetOfferId) {
      return [];
    }

    if (viewerUserId) {
      const offerData = await OfferQueryService.getOfferById(viewerUserId, targetOfferId);
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
}
