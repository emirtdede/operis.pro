import { describe, it, expect, vi, beforeEach } from "vitest";
import { CounterOfferService } from "@/src/modules/offers/services/counter-offer.service";
import * as dbModule from "@/src/lib/db";

describe("WP-27, WP-28, WP-29: Counter Offer Service Security Remediation", () => {
  const validCpUuid = "11111111-1111-4111-8111-111111111111";
  const validOfferUuid = "22222222-2222-4222-8222-222222222222";
  const validListingUuid = "33333333-3333-4333-8333-333333333333";
  const employerId = "usr_employer_123";
  const freelancerId = "usr_freelancer_456";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("WP-29: Counter-Offer Expiration Persistence without Rollback", () => {
    it("updates counter-proposal status to EXPIRED in database and commits before throwing", async () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: validCpUuid, status: "EXPIRED" }]),
        }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: validCpUuid,
                offerId: validOfferUuid,
                recipientUserId: freelancerId,
                status: "PENDING",
                round: 1,
                expiresAt: pastDate,
              },
            ]),
          }),
        }),
      });

      const mockTx = {
        select: mockSelect,
        update: mockUpdate,
        insert: vi.fn(),
        execute: vi.fn().mockResolvedValue([]),
      };

      const mockDb = {
        transaction: vi.fn().mockImplementation(async (callback) => {
          return await callback(mockTx);
        }),
      };

      vi.spyOn(dbModule, "getDb").mockReturnValue(
        mockDb as unknown as ReturnType<typeof dbModule.getDb>
      );

      await expect(
        CounterOfferService.acceptCounterOffer(freelancerId, {
          counterProposalId: validCpUuid,
        })
      ).rejects.toThrow("Bu karşı teklifin 48 saatlik süresi doldu.");

      // Check that EXPIRED update was called inside the transaction
      expect(mockUpdate).toHaveBeenCalledWith(dbModule.schema.offerCounterProposals);
    });
  });

  describe("WP-28: Canonical Lock Ordering (Listing FIRST, Offer SECOND)", () => {
    it("locks listing before locking offer during counter-offer acceptance", async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24);
      const lockCallSequence: string[] = [];

      const mockTx = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation((table) => {
            const tableName =
              table === dbModule.schema.listings
                ? "listings"
                : table === dbModule.schema.offers
                  ? "offers"
                  : table === dbModule.schema.offerCounterProposals
                    ? "counterProposals"
                    : table === dbModule.schema.users
                      ? "users"
                      : table === dbModule.schema.blocks
                        ? "blocks"
                        : table === dbModule.schema.engagements
                          ? "engagements"
                          : "unknown";

            return {
              where: vi.fn().mockReturnValue({
                for: vi.fn().mockImplementation(() => {
                  lockCallSequence.push(`lock_${tableName}`);
                  return {
                    limit: vi.fn().mockImplementation(() => {
                      if (tableName === "counterProposals") {
                        return Promise.resolve([
                          {
                            id: validCpUuid,
                            offerId: validOfferUuid,
                            recipientUserId: freelancerId,
                            proposerUserId: employerId,
                            status: "PENDING",
                            round: 1,
                            expiresAt: futureDate,
                            budgetMin: 5000,
                            budgetMax: 5000,
                            estimatedDurationValue: 7,
                            estimatedDurationUnit: "DAYS",
                          },
                        ]);
                      }
                      if (tableName === "listings") {
                        return Promise.resolve([
                          {
                            id: validListingUuid,
                            ownerUserId: employerId,
                            status: "ACTIVE",
                            activeUntil: futureDate,
                            activationSeq: 1,
                            title: "React Native Project",
                            categoryId: "mobile",
                          },
                        ]);
                      }
                      if (tableName === "offers") {
                        return Promise.resolve([
                          {
                            id: validOfferUuid,
                            listingId: validListingUuid,
                            offerorUserId: freelancerId,
                            status: "PENDING",
                            listingActivationSeq: 1,
                          },
                        ]);
                      }
                      return Promise.resolve([]);
                    }),
                  };
                }),
                limit: vi.fn().mockImplementation(() => {
                  if (tableName === "offers") {
                    return Promise.resolve([
                      {
                        id: validOfferUuid,
                        listingId: validListingUuid,
                        offerorUserId: freelancerId,
                      },
                    ]);
                  }
                  if (tableName === "listings") {
                    return Promise.resolve([
                      {
                        id: validListingUuid,
                        ownerUserId: employerId,
                      },
                    ]);
                  }
                  if (tableName === "blocks" || tableName === "engagements") {
                    return Promise.resolve([]);
                  }
                  return Promise.resolve([]);
                }),
              }),
            };
          }),
        })),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([
                {
                  id: validOfferUuid,
                  status: "ACCEPTED",
                },
              ]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: "eng-new-uuid",
                status: "MATCHED",
              },
            ]),
          }),
        }),
        execute: vi.fn().mockResolvedValue([]),
      };

      const mockDb = {
        transaction: vi.fn().mockImplementation(async (callback) => {
          return await callback(mockTx);
        }),
      };

      vi.spyOn(dbModule, "getDb").mockReturnValue(
        mockDb as unknown as ReturnType<typeof dbModule.getDb>
      );

      await CounterOfferService.acceptCounterOffer(freelancerId, {
        counterProposalId: validCpUuid,
      });

      // Verify that lock_listings was executed BEFORE lock_offers
      const listingLockIndex = lockCallSequence.indexOf("lock_listings");
      const offerLockIndex = lockCallSequence.indexOf("lock_offers");
      expect(listingLockIndex).toBeGreaterThan(-1);
      expect(offerLockIndex).toBeGreaterThan(-1);
      expect(listingLockIndex).toBeLessThan(offerLockIndex);
    });
  });

  describe("WP-27: User Blocking and Account Verification", () => {
    it("rejects counter-offer acceptance if active mutual block exists between users", async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24);

      const mockTx = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation((table) => {
            return {
              where: vi.fn().mockReturnValue({
                for: vi.fn().mockReturnValue({
                  limit: vi.fn().mockImplementation(() => {
                    if (table === dbModule.schema.offerCounterProposals) {
                      return Promise.resolve([
                        {
                          id: validCpUuid,
                          offerId: validOfferUuid,
                          recipientUserId: freelancerId,
                          status: "PENDING",
                          round: 1,
                          expiresAt: futureDate,
                        },
                      ]);
                    }
                    if (table === dbModule.schema.listings) {
                      return Promise.resolve([
                        {
                          id: validListingUuid,
                          ownerUserId: employerId,
                          status: "ACTIVE",
                          activeUntil: futureDate,
                        },
                      ]);
                    }
                    if (table === dbModule.schema.offers) {
                      return Promise.resolve([
                        {
                          id: validOfferUuid,
                          listingId: validListingUuid,
                          offerorUserId: freelancerId,
                          status: "PENDING",
                        },
                      ]);
                    }
                    return Promise.resolve([]);
                  }),
                }),
                limit: vi.fn().mockImplementation(() => {
                  if (table === dbModule.schema.offers) {
                    return Promise.resolve([
                      {
                        id: validOfferUuid,
                        listingId: validListingUuid,
                        offerorUserId: freelancerId,
                      },
                    ]);
                  }
                  if (table === dbModule.schema.listings) {
                    return Promise.resolve([
                      {
                        id: validListingUuid,
                        ownerUserId: employerId,
                      },
                    ]);
                  }
                  if (table === dbModule.schema.blocks) {
                    // Active block found!
                    return Promise.resolve([{ blockerUserId: employerId }]);
                  }
                  return Promise.resolve([]);
                }),
              }),
            };
          }),
        })),
        update: vi.fn(),
        insert: vi.fn(),
        execute: vi.fn().mockResolvedValue([]),
      };

      const mockDb = {
        transaction: vi.fn().mockImplementation(async (callback) => {
          return await callback(mockTx);
        }),
      };

      vi.spyOn(dbModule, "getDb").mockReturnValue(
        mockDb as unknown as ReturnType<typeof dbModule.getDb>
      );

      await expect(
        CounterOfferService.acceptCounterOffer(freelancerId, {
          counterProposalId: validCpUuid,
        })
      ).rejects.toThrow("Kullanıcılar arasında aktif engelleme bulunmaktadır.");
    });

    it("rejects counter-offer acceptance if listing activation sequence does not match offer sequence", async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24);

      const mockTx = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation((table) => {
            return {
              where: vi.fn().mockReturnValue({
                for: vi.fn().mockReturnValue({
                  limit: vi.fn().mockImplementation(() => {
                    if (table === dbModule.schema.offerCounterProposals) {
                      return Promise.resolve([
                        {
                          id: validCpUuid,
                          offerId: validOfferUuid,
                          recipientUserId: freelancerId,
                          status: "PENDING",
                          round: 1,
                          expiresAt: futureDate,
                        },
                      ]);
                    }
                    if (table === dbModule.schema.listings) {
                      return Promise.resolve([
                        {
                          id: validListingUuid,
                          ownerUserId: employerId,
                          status: "ACTIVE",
                          activeUntil: futureDate,
                          activationSeq: 2, // Listing has reactivation seq 2
                        },
                      ]);
                    }
                    if (table === dbModule.schema.offers) {
                      return Promise.resolve([
                        {
                          id: validOfferUuid,
                          listingId: validListingUuid,
                          offerorUserId: freelancerId,
                          status: "PENDING",
                          listingActivationSeq: 1, // Stale offer from cycle 1
                        },
                      ]);
                    }
                    return Promise.resolve([]);
                  }),
                }),
                limit: vi.fn().mockImplementation(() => {
                  if (table === dbModule.schema.offers) {
                    return Promise.resolve([
                      {
                        id: validOfferUuid,
                        listingId: validListingUuid,
                        offerorUserId: freelancerId,
                      },
                    ]);
                  }
                  if (table === dbModule.schema.listings) {
                    return Promise.resolve([
                      {
                        id: validListingUuid,
                        ownerUserId: employerId,
                      },
                    ]);
                  }
                  if (table === dbModule.schema.blocks) {
                    return Promise.resolve([]);
                  }
                  return Promise.resolve([]);
                }),
              }),
            };
          }),
        })),
        update: vi.fn(),
        insert: vi.fn(),
        execute: vi.fn().mockResolvedValue([]),
      };

      const mockDb = {
        transaction: vi.fn().mockImplementation(async (callback) => {
          return await callback(mockTx);
        }),
      };

      vi.spyOn(dbModule, "getDb").mockReturnValue(
        mockDb as unknown as ReturnType<typeof dbModule.getDb>
      );

      await expect(
        CounterOfferService.acceptCounterOffer(freelancerId, {
          counterProposalId: validCpUuid,
        })
      ).rejects.toThrow("OFFER_LIFECYCLE_MISMATCH");
    });
  });
});
