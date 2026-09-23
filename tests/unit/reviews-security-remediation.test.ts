import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReviewService } from "@/src/modules/reviews/service";
import * as dbModule from "@/src/lib/db";

describe("WP-30 & WP-31: Reviews Security and Concurrency Remediation", () => {
  const engagementId = "11111111-2222-4333-8444-555555555555";
  const employerId = "22222222-3333-4444-8555-666666666666";
  const freelancerId = "33333333-4444-4555-8666-777777777777";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("WP-31: Concurrency Lock on Engagement Row", () => {
    it("locks the engagement row with FOR UPDATE inside transaction to prevent concurrent hidden reviews", async () => {
      let engagementRowLocked = false;
      let reviewQueryCount = 0;

      const mockTx = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation((table) => {
            if (table === dbModule.schema.engagements) {
              return {
                where: vi.fn().mockReturnValue({
                  for: vi.fn().mockImplementation(() => {
                    engagementRowLocked = true;
                    return {
                      limit: vi.fn().mockResolvedValue([{ id: engagementId }]),
                    };
                  }),
                }),
              };
            }
            if (table === dbModule.schema.engagementReviews) {
              return {
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockImplementation(() => {
                    reviewQueryCount++;
                    if (reviewQueryCount === 1) {
                      return Promise.resolve([]); // No duplicate review
                    }
                    return Promise.resolve([
                      {
                        id: "review-counterparty-id",
                        isRevealed: false,
                      },
                    ]);
                  }),
                }),
              };
            }
            return { where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) };
          }),
        })),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockImplementation((val) => ({
            returning: vi.fn().mockResolvedValue([
              {
                id: "new-review-id",
                isRevealed: val.isRevealed,
                engagementId,
              },
            ]),
          })),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      };

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: engagementId,
                  status: "COMPLETED",
                  ownerUserId: employerId,
                  freelancerUserId: freelancerId,
                  completedAt: new Date(),
                },
              ]),
            }),
          }),
        }),
        transaction: vi.fn().mockImplementation(async (callback) => {
          return await callback(mockTx);
        }),
      };

      vi.spyOn(dbModule, "getDb").mockReturnValue(
        mockDb as unknown as ReturnType<typeof dbModule.getDb>
      );

      const review = await ReviewService.createReview({
        engagementId,
        authorUserId: freelancerId,
        overallRating: 5,
        communicationRating: 5,
        qualityRating: 5,
        comment: "Outstanding client to work with, clear requirements.",
      });

      // Engagement row MUST have been locked
      expect(engagementRowLocked).toBe(true);
      // Because counterparty had submitted, this review should be revealed
      expect(review.isRevealed).toBe(true);
      // And counterparty review updated to revealed
      expect(mockTx.update).toHaveBeenCalledWith(dbModule.schema.engagementReviews);
    });
  });

  describe("WP-30: Auto-reveal Expired Reviews Sweeper", () => {
    it("updates unrevealed expired reviews to revealed in database", async () => {
      const mockReturning = vi.fn().mockResolvedValue([
        { id: "rev-expired-1" },
        { id: "rev-expired-2" },
      ]);

      const mockDb = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: mockReturning,
            }),
          }),
        }),
      };

      vi.spyOn(dbModule, "getDb").mockReturnValue(
        mockDb as unknown as ReturnType<typeof dbModule.getDb>
      );

      // Temporarily unset VITEST to test the production PostgreSQL path
      const originalVitest = process.env.VITEST;
      delete process.env.VITEST;

      try {
        const count = await ReviewService.autoRevealExpiredReviews();
        expect(count).toBe(2);
        expect(mockDb.update).toHaveBeenCalledWith(dbModule.schema.engagementReviews);
      } finally {
        process.env.VITEST = originalVitest;
      }
    });
  });
});
