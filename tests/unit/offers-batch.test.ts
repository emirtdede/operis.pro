import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  batchOfferItemSchema,
  batchSubmitOffersSchema,
  offerTemplateSchema,
} from "@/src/modules/offers/validation";
import { OfferService, inMemoryBatchIdempotencyStore } from "@/src/modules/offers/service";

// Mock DB for isolated testing
const mockListingsMap = new Map<string, Record<string, unknown>>();
let mockBlocksRows: Array<Record<string, unknown>> = [];
let mockOffersRows: Array<Record<string, unknown>> = [];

vi.mock("@/src/lib/db", () => {
  return {
    getDb: () => ({
      select: () => ({
        from: (table: unknown) => ({
          innerJoin: () => ({
            innerJoin: () => ({
              where: () => ({
                limit: () => Promise.resolve(mockOffersRows),
                orderBy: () => Promise.resolve(mockOffersRows),
              }),
            }),
            where: () => ({
              limit: () => Promise.resolve(mockOffersRows),
              orderBy: () => Promise.resolve(mockOffersRows),
            }),
          }),
          where: () => ({
            limit: () => {
              const tbl = table as { id?: string; blockerUserId?: string } | string;
              if (tbl === "listings" || (typeof tbl === "object" && tbl?.id === "listings")) {
                // Return matching listing if found
                const values = Array.from(mockListingsMap.values());
                return Promise.resolve(values);
              }
              if (
                tbl === "blocks" ||
                (typeof tbl === "object" && tbl?.blockerUserId === "blocks")
              ) {
                return Promise.resolve(mockBlocksRows);
              }
              return Promise.resolve(mockOffersRows);
            },
          }),
        }),
      }),
      update: () => ({
        set: () => ({
          where: () => Promise.resolve([{ id: "mock-updated-id" }]),
        }),
      }),
      insert: () => ({
        values: () => Promise.resolve([{ id: "mock-inserted-id" }]),
      }),
      transaction: async (fn: (tx: unknown) => unknown) => {
        return fn({
          insert: () => ({
            values: () => ({
              returning: () =>
                Promise.resolve([{ id: "batch-offer-created-id", status: "PENDING" }]),
            }),
          }),
          select: () => ({
            from: () => ({
              where: () => ({
                orderBy: () => ({
                  limit: () => Promise.resolve([{ revisionNo: 1 }]),
                }),
              }),
            }),
          }),
          update: () => ({
            set: () => ({
              where: () => ({
                returning: () => Promise.resolve([{ id: "batch-offer-updated-id" }]),
              }),
            }),
          }),
        });
      },
    }),
    schema: {
      listings: "listings",
      offers: "offers",
      offerRevisions: "offer_revisions",
      offerTemplates: "offer_templates",
      idempotencyKeys: "idempotency_keys",
      blocks: "blocks",
      profiles: "profiles",
    },
  };
});

describe("Batch and Quick Offers Module — Architecture & Fallbacks", () => {
  const userA = "11111111-1111-1111-1111-111111111111";
  const userB = "22222222-2222-2222-2222-222222222222";
  const listing1 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const listing2 = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

  const validMessage =
    "Merhaba, projenizin teknik gereksinimlerini detaylıca inceledim. React ve Node.js alanındaki tecrübemle zamanında teslim edebilirim.";

  beforeEach(() => {
    mockListingsMap.clear();
    mockBlocksRows = [];
    mockOffersRows = [];
    inMemoryBatchIdempotencyStore.clear();

    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 5); // 5 days later

    mockListingsMap.set(listing1, {
      id: listing1,
      ownerUserId: userB,
      status: "ACTIVE",
      activationSeq: 1,
      activeUntil: futureDate,
    });

    mockListingsMap.set(listing2, {
      id: listing2,
      ownerUserId: userB,
      status: "ACTIVE",
      activationSeq: 1,
      activeUntil: futureDate,
    });
  });

  describe("Validation & Safeguards", () => {
    it("enforces minimum 1 and maximum 5 items per batch", () => {
      // 0 items
      const zeroItems = batchSubmitOffersSchema.safeParse({ items: [] });
      expect(zeroItems.success).toBe(false);

      // 1 item (valid)
      const oneItem = batchSubmitOffersSchema.safeParse({
        items: [
          {
            listingId: listing1,
            message: validMessage,
            budgetCurrency: "TRY",
            budgetMin: "10000",
            budgetMax: "20000",
          },
        ],
      });
      expect(oneItem.success).toBe(true);

      // 6 items (> 5, should be rejected)
      const sixItems = batchSubmitOffersSchema.safeParse({
        items: Array(6).fill({
          listingId: listing1,
          message: validMessage,
        }),
      });
      expect(sixItems.success).toBe(false);
    });

    it("rejects emojis in batch offer items and templates", () => {
      const emojiItem = batchOfferItemSchema.safeParse({
        listingId: listing1,
        message:
          "Merhaba projeye teklifim budur harika iş çıkaracağız 🚀👍 tecrübem çok yüksektir.",
      });
      expect(emojiItem.success).toBe(false);

      const emojiTemplate = offerTemplateSchema.safeParse({
        name: "Hızlı Teklif 🔥",
        message: validMessage,
      });
      expect(emojiTemplate.success).toBe(false);
    });

    it("validates offer template schema requirements", () => {
      const validTemplate = offerTemplateSchema.safeParse({
        name: "Fullstack Standart",
        message: validMessage,
        budgetCurrency: "USD",
        budgetMin: "1000",
        budgetMax: "2500",
        estimatedDurationValue: 2,
        estimatedDurationUnit: "WEEKS",
      });
      expect(validTemplate.success).toBe(true);
    });
  });

  describe("Batch Submission Execution & Envelope Pattern", () => {
    it("submits batch proposals and returns envelope response", async () => {
      // Spy on submitOffer
      const spySubmit = vi.spyOn(OfferService, "submitOffer").mockResolvedValue({
        id: "mock-offer-id",
        listingId: listing1,
        offerorUserId: userA,
        listingActivationSeq: 1,
        status: "PENDING",
        message: validMessage,
        budgetCurrency: "TRY",
        budgetMin: "10000",
        budgetMax: "20000",
        estimatedDurationValue: null,
        estimatedDurationUnit: null,
        rejectionCode: null,
        rejectionNote: null,
        isCountered: false,
        currentTurnUserId: null,
        counterRound: 0,
        activeCounterProposalId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        resolvedAt: null,
        isSquadOffer: false,
        squadTitle: null,
      });

      const res = await OfferService.batchSubmitOffers(userA, {
        items: [
          { listingId: listing1, message: validMessage },
          { listingId: listing2, message: validMessage },
        ],
      });

      expect(res.total).toBe(2);
      expect(res.succeededCount).toBe(2);
      expect(res.failedCount).toBe(0);
      expect(res.results.every((r) => r.status === "SUCCESS")).toBe(true);

      spySubmit.mockRestore();
    });

    it("handles partial failure without failing the entire batch (Graceful Degradation)", async () => {
      const spySubmit = vi
        .spyOn(OfferService, "submitOffer")
        .mockImplementation(async (userId, input) => {
          if (input.listingId === listing1) {
            return {
              id: "offer-1",
              listingId: listing1,
              offerorUserId: userId,
              listingActivationSeq: 1,
              status: "PENDING",
              message: validMessage,
              budgetCurrency: null,
              budgetMin: null,
              budgetMax: null,
              estimatedDurationValue: null,
              estimatedDurationUnit: null,
              rejectionCode: null,
              rejectionNote: null,
              isCountered: false,
              currentTurnUserId: null,
              counterRound: 0,
              activeCounterProposalId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              resolvedAt: null,
              isSquadOffer: false,
              squadTitle: null,
            };
          }
          throw new Error("You cannot submit an offer on your own listing");
        });

      const res = await OfferService.batchSubmitOffers(userA, {
        items: [
          { listingId: listing1, message: validMessage },
          { listingId: listing2, message: validMessage },
        ],
      });

      expect(res.total).toBe(2);
      expect(res.succeededCount).toBe(1);
      expect(res.failedCount).toBe(1);

      const successItem = res.results.find((r) => r.listingId === listing1);
      const failedItem = res.results.find((r) => r.listingId === listing2);

      expect(successItem?.status).toBe("SUCCESS");
      expect(failedItem?.status).toBe("FAILED");
      expect(failedItem?.code).toBe("SELF_BIDDING_PROHIBITED");

      spySubmit.mockRestore();
    });

    it("respects idempotency key and prevents duplicate execution", async () => {
      const spySubmit = vi.spyOn(OfferService, "submitOffer").mockResolvedValue({
        id: "mock-offer-id",
        listingId: listing1,
        offerorUserId: userA,
        listingActivationSeq: 1,
        status: "PENDING",
        message: validMessage,
        budgetCurrency: null,
        budgetMin: null,
        budgetMax: null,
        estimatedDurationValue: null,
        estimatedDurationUnit: null,
        rejectionCode: null,
        rejectionNote: null,
        isCountered: false,
        currentTurnUserId: null,
        counterRound: 0,
        activeCounterProposalId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        resolvedAt: null,
        isSquadOffer: false,
        squadTitle: null,
      });

      const idempotencyKey = "unique-key-12345";
      const payload = {
        items: [{ listingId: listing1, message: validMessage }],
        idempotencyKey,
      };

      const firstCall = await OfferService.batchSubmitOffers(userA, payload);
      expect(spySubmit).toHaveBeenCalledTimes(1);

      // Second call with same key should return cached response without re-executing
      const secondCall = await OfferService.batchSubmitOffers(userA, payload);
      expect(spySubmit).toHaveBeenCalledTimes(1);
      expect(secondCall.batchId).toBe(firstCall.batchId);

      spySubmit.mockRestore();
    });
  });

  describe("Quick Offer Templates Management", () => {
    it("provides default starter templates for new users", () => {
      const templates = OfferService.getUserOfferTemplates(userA);
      expect(templates.length).toBeGreaterThanOrEqual(2);
      expect(templates[0]?.name).toBe("Standart İlan Teklifi");
    });

    it("saves, retrieves, and deletes custom offer templates", () => {
      const newTemplate = OfferService.saveOfferTemplate(userA, {
        name: "Mobil Uygulama Paketi",
        message: validMessage,
        budgetCurrency: "USD",
        budgetMin: "3000",
        budgetMax: "6000",
      });

      expect(newTemplate.id).toBeDefined();
      expect(newTemplate.name).toBe("Mobil Uygulama Paketi");

      const listAfterSave = OfferService.getUserOfferTemplates(userA);
      expect(listAfterSave.some((t) => t.id === newTemplate.id)).toBe(true);

      const deleted = OfferService.deleteOfferTemplate(userA, newTemplate.id);
      expect(deleted).toBe(true);

      const listAfterDelete = OfferService.getUserOfferTemplates(userA);
      expect(listAfterDelete.some((t) => t.id === newTemplate.id)).toBe(false);
    });
  });
});
