import { describe, it, expect, beforeEach } from "vitest";
import {
  OfferService,
  inMemorySentOffers,
  inMemoryReceivedOffers,
  inMemoryCounterProposals,
} from "@/src/modules/offers/service";
import { inMemoryListings } from "@/src/modules/listings/service";
import type { InMemListing } from "@/src/modules/listings/services/types";

describe("Counter-Offer — Concurrency Safety & Race Conditions", () => {
  const listingOwnerId = "user-employer-conc";
  const freelancerId = "user-freelancer-conc";

  const listingId = "listing-test-conc-101";
  const offerId = "offer-test-conc-202";

  beforeEach(() => {
    inMemorySentOffers.length = 0;
    inMemoryReceivedOffers.length = 0;
    inMemoryCounterProposals.length = 0;
    inMemoryListings.length = 0;

    const listing = {
      id: listingId,
      ownerUserId: listingOwnerId,
      title: "Concurrent Negotiation Job",
      slug: "concurrent-negotiation-job",
      status: "ACTIVE",
      activeUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      activationSeq: 1,
    };
    inMemoryListings.push(listing as unknown as InMemListing);

    const initialOffer = {
      id: offerId,
      listingId,
      offerorUserId: freelancerId,
      listingActivationSeq: 1,
      status: "PENDING",
      message: "Initial offer for concurrency tests.",
      budgetCurrency: "TRY",
      budgetMin: "10000",
      budgetMax: "15000",
      estimatedDurationValue: 2,
      estimatedDurationUnit: "WEEKS",
      isCountered: false,
      currentTurnUserId: listingOwnerId,
      counterRound: 0,
      activeCounterProposalId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
      rejectionCode: null,
      rejectionNote: null,
      isSquadOffer: false,
      squadTitle: null,
    };

    inMemorySentOffers.push({
      offer: { ...initialOffer },
      listing: {
        id: listing.id,
        slug: listing.slug,
        title: listing.title,
        status: listing.status,
        activeUntil: listing.activeUntil,
      },
    });

    inMemoryReceivedOffers.push({
      offer: { ...initialOffer },
      offerorProfile: {
        userId: freelancerId,
        handle: "concurrency_tester",
        displayName: "Tester",
      },
      listing: {
        id: listing.id,
        slug: listing.slug,
        title: listing.title,
        status: listing.status,
        activeUntil: listing.activeUntil,
        ownerUserId: listingOwnerId,
      },
    });
  });

  it("detects and rejects stale expectedRound (Optimistic Locking Guard)", async () => {
    // Round 1 submitted by employer
    await OfferService.submitCounterOffer(listingOwnerId, {
      offerId,
      budgetMin: "11000",
      budgetMax: "13000",
      estimatedDurationValue: 2,
      estimatedDurationUnit: "WEEKS",
      message: "Round 1 proposal.",
      expectedRound: 1, // correct
    });

    // Freelancer tries to submit Round 2, but client had cached expectedRound: 1 instead of 2
    await expect(
      OfferService.submitCounterOffer(freelancerId, {
        offerId,
        budgetMin: "12000",
        budgetMax: "14000",
        estimatedDurationValue: 2,
        estimatedDurationUnit: "WEEKS",
        message: "Stale round proposal.",
        expectedRound: 1, // STALE! Expected is 2
      })
    ).rejects.toThrow("Pazarlık sırası güncel değil");
  });

  it("handles race condition: withdrawing after acceptance is blocked", async () => {
    // Employer submits counter-offer
    const counter = await OfferService.submitCounterOffer(listingOwnerId, {
      offerId,
      budgetMin: "12000",
      budgetMax: "14000",
      estimatedDurationValue: 2,
      estimatedDurationUnit: "WEEKS",
      message: "Take it or leave it proposal.",
    });

    // Freelancer accepts proposal
    await OfferService.acceptCounterOffer(freelancerId, {
      counterProposalId: counter.id,
    });

    // Employer tries to withdraw already ACCEPTED proposal -> MUST FAIL
    await expect(
      OfferService.withdrawCounterOffer(listingOwnerId, {
        counterProposalId: counter.id,
      })
    ).rejects.toThrow("Counter-offer is no longer pending");
  });

  it("handles race condition: accepting after withdrawal is blocked", async () => {
    // Employer submits counter-offer
    const counter = await OfferService.submitCounterOffer(listingOwnerId, {
      offerId,
      budgetMin: "12000",
      budgetMax: "14000",
      estimatedDurationValue: 2,
      estimatedDurationUnit: "WEEKS",
      message: "Proposal to be withdrawn.",
    });

    // Employer withdraws before freelancer acts
    await OfferService.withdrawCounterOffer(listingOwnerId, {
      counterProposalId: counter.id,
    });

    // Freelancer attempts to accept now WITHDRAWN proposal -> MUST FAIL
    await expect(
      OfferService.acceptCounterOffer(freelancerId, {
        counterProposalId: counter.id,
      })
    ).rejects.toThrow("Counter-offer is no longer pending");
  });
});
