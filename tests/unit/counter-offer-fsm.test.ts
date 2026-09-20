import { describe, it, expect, beforeEach } from "vitest";
import {
  createCounterOfferSchema,
  acceptCounterOfferSchema,
  rejectCounterOfferSchema,
  withdrawCounterOfferSchema,
} from "@/src/modules/offers/validation";
import {
  OfferService,
  inMemorySentOffers,
  inMemoryReceivedOffers,
  inMemoryCounterProposals,
} from "@/src/modules/offers/service";
import { inMemoryListings } from "@/src/modules/listings/service";

describe("Counter-Offer & Negotiation Cycle — State Machine & Business Invariants", () => {
  const listingOwnerId = "user-employer-001";
  const freelancerId = "user-freelancer-002";
  const thirdPartyId = "user-intruder-003";

  const listingId = "listing-test-fsm-101";
  const offerId = "offer-test-fsm-202";

  beforeEach(() => {
    // Reset in-memory stores
    inMemorySentOffers.length = 0;
    inMemoryReceivedOffers.length = 0;
    inMemoryCounterProposals.length = 0;
    inMemoryListings.length = 0;

    // Seed active listing
    const listing = {
      id: listingId,
      ownerUserId: listingOwnerId,
      title: "Full-Stack Web App Development",
      slug: "full-stack-web-app",
      status: "ACTIVE",
      activeUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days active
      activationSeq: 1,
    };
    inMemoryListings.push(listing as any);

    // Seed initial offer submitted by freelancer
    const initialOffer = {
      id: offerId,
      listingId,
      offerorUserId: freelancerId,
      listingActivationSeq: 1,
      status: "PENDING",
      message: "I can build this full-stack application within 3 weeks using Next.js and Postgres.",
      budgetCurrency: "TRY",
      budgetMin: "20000",
      budgetMax: "25000",
      estimatedDurationValue: 3,
      estimatedDurationUnit: "WEEKS",
      isCountered: false,
      currentTurnUserId: listingOwnerId, // turn initially with employer
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
        handle: "devpro",
        displayName: "Senior Dev",
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

  describe("Validation Schema Rules", () => {
    it("validates counter-offer budget and duration parameters", () => {
      const valid = createCounterOfferSchema.safeParse({
        offerId,
        budgetMin: "18000",
        budgetMax: "22000",
        estimatedDurationValue: 2,
        estimatedDurationUnit: "WEEKS",
        message: "Proje kapsamı ve bütçe aralığı dengesini gözeterek revize teklifimi sunuyorum.",
      });
      expect(valid.success).toBe(true);

      // Invalid: min > max
      const minExceedsMax = createCounterOfferSchema.safeParse({
        offerId,
        budgetMin: "25000",
        budgetMax: "20000",
        estimatedDurationValue: 2,
        estimatedDurationUnit: "WEEKS",
        message: "Gerekçe açıklaması bütçe optimizasyonu.",
      });
      expect(minExceedsMax.success).toBe(false);

      // Invalid: duration out of bounds
      const invalidDuration = createCounterOfferSchema.safeParse({
        offerId,
        budgetMin: "18000",
        budgetMax: "22000",
        estimatedDurationValue: 60, // max is 52
        estimatedDurationUnit: "WEEKS",
        message: "Gerekçe açıklaması bütçe optimizasyonu.",
      });
      expect(invalidDuration.success).toBe(false);
    });

    it("enforces anti-leak content moderation on counter-offer notes", () => {
      // Direct phone number
      const phoneLeak = createCounterOfferSchema.safeParse({
        offerId,
        budgetMin: "18000",
        budgetMax: "22000",
        estimatedDurationValue: 2,
        estimatedDurationUnit: "WEEKS",
        message: "Detayları konuşmak için beni arayın: 0532 111 22 33 veya WhatsApptan yazın.",
      });
      expect(phoneLeak.success).toBe(false);

      // Email address
      const emailLeak = createCounterOfferSchema.safeParse({
        offerId,
        budgetMin: "18000",
        budgetMax: "22000",
        estimatedDurationValue: 2,
        estimatedDurationUnit: "WEEKS",
        message: "Lütfen teklif detaylarını bana dev@externalmail.com adresinden iletiniz.",
      });
      expect(emailLeak.success).toBe(false);

      // External link (wa.me)
      const linkLeak = createCounterOfferSchema.safeParse({
        offerId,
        budgetMin: "18000",
        budgetMax: "22000",
        estimatedDurationValue: 2,
        estimatedDurationUnit: "WEEKS",
        message: "Pazarlık için wa.me/905321112233 linkinden ulaşabilirsiniz hemen konuşalım.",
      });
      expect(linkLeak.success).toBe(false);
    });

    it("validates accept, reject, and withdraw schema inputs", () => {
      const validAccept = acceptCounterOfferSchema.safeParse({
        counterProposalId: "cp-123",
        expectedRound: 2,
      });
      expect(validAccept.success).toBe(true);

      const invalidAccept = acceptCounterOfferSchema.safeParse({
        counterProposalId: "",
      });
      expect(invalidAccept.success).toBe(false);

      const validReject = rejectCounterOfferSchema.safeParse({
        counterProposalId: "cp-123",
        rejectionNote: "Bütçe uyuşmazlığı nedeniyle anlaşamadık.",
      });
      expect(validReject.success).toBe(true);

      const validWithdraw = withdrawCounterOfferSchema.safeParse({
        counterProposalId: "cp-123",
      });
      expect(validWithdraw.success).toBe(true);
    });
  });

  describe("Rubinstein Alternating Turn-Taking & State Machine", () => {
    it("prevents third-parties from participating in the negotiation", async () => {
      await expect(
        OfferService.submitCounterOffer(thirdPartyId, {
          offerId,
          budgetMin: "18000",
          budgetMax: "22000",
          estimatedDurationValue: 2,
          estimatedDurationUnit: "WEEKS",
          message: "Yetkisiz üçüncü taraf teklifi.",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("enforces strict alternating turns between employer and freelancer", async () => {
      // Step 1: Employer makes Round 1 counter-offer
      const round1 = await OfferService.submitCounterOffer(listingOwnerId, {
        offerId,
        budgetMin: "17000",
        budgetMax: "19000",
        estimatedDurationValue: 2,
        estimatedDurationUnit: "WEEKS",
        message: "Bütçemiz 19.000 TL ile sınırlı, bu şartlarda 2 haftada tamamlayabilir misiniz?",
        expectedRound: 1,
      });

      expect(round1.round).toBe(1);
      expect(round1.status).toBe("PENDING");
      expect(round1.proposerUserId).toBe(listingOwnerId);
      expect(round1.recipientUserId).toBe(freelancerId);

      // Verify offer state updated
      const sentOffer = inMemorySentOffers.find((s) => s.offer.id === offerId)!.offer;
      expect(sentOffer.isCountered).toBe(true);
      expect(sentOffer.counterRound).toBe(1);
      expect(sentOffer.currentTurnUserId).toBe(freelancerId); // turn passed to freelancer!

      // Step 2: Employer attempts to counter again out of turn -> MUST FAIL
      await expect(
        OfferService.submitCounterOffer(listingOwnerId, {
          offerId,
          budgetMin: "16000",
          budgetMax: "18000",
          estimatedDurationValue: 2,
          estimatedDurationUnit: "WEEKS",
          message: "Üst üste karşı teklif verilemez.",
        })
      ).rejects.toThrow("Sıra sizde değil");

      // Step 3: Freelancer counters back in Round 2
      const round2 = await OfferService.submitCounterOffer(freelancerId, {
        offerId,
        budgetMin: "18500",
        budgetMax: "20000",
        estimatedDurationValue: 2,
        estimatedDurationUnit: "WEEKS",
        message: "19.500 TL ortalama bütçe ile 2 haftada teslim edebilirim.",
        expectedRound: 2,
      });

      expect(round2.round).toBe(2);
      expect(round2.status).toBe("PENDING");
      expect(round2.proposerUserId).toBe(freelancerId);
      expect(round2.recipientUserId).toBe(listingOwnerId);

      expect(sentOffer.counterRound).toBe(2);
      expect(sentOffer.currentTurnUserId).toBe(listingOwnerId); // turn passed back to employer!
    });

    it("enforces max round limit (max 3 rounds per side / 6 moves total)", async () => {
      // Simulate moves up to round 6
      for (let r = 1; r <= 6; r++) {
        const actor = r % 2 === 1 ? listingOwnerId : freelancerId;
        await OfferService.submitCounterOffer(actor, {
          offerId,
          budgetMin: `${15000 + r * 500}`,
          budgetMax: `${18000 + r * 500}`,
          estimatedDurationValue: 2,
          estimatedDurationUnit: "WEEKS",
          message: `Pazarlık ${r}. tur revizesi iletilmiştir.`,
          expectedRound: r,
        });
      }

      const offer = inMemorySentOffers.find((s) => s.offer.id === offerId)!.offer;
      expect(offer.counterRound).toBe(6);

      // Attempting Round 7 MUST FAIL
      await expect(
        OfferService.submitCounterOffer(listingOwnerId, {
          offerId,
          budgetMin: "20000",
          budgetMax: "22000",
          estimatedDurationValue: 2,
          estimatedDurationUnit: "WEEKS",
          message: "Tur limitini aşan 7. hamle.",
          expectedRound: 7,
        })
      ).rejects.toThrow("Pazarlık tur limitine (maksimum 3 karşılıklı tur) ulaşıldı.");
    });

    it("allows the recipient to accept a counter-offer and forms an engagement", async () => {
      // Employer submits counter-offer
      const counter = await OfferService.submitCounterOffer(listingOwnerId, {
        offerId,
        budgetMin: "18000",
        budgetMax: "21000",
        estimatedDurationValue: 2,
        estimatedDurationUnit: "WEEKS",
        message: "21.000 TL ve 2 hafta olarak anlaşırsak hemen başlayalım.",
      });

      // Freelancer (recipient) accepts
      const acceptResult = await OfferService.acceptCounterOffer(freelancerId, {
        counterProposalId: counter.id,
        expectedRound: 1,
      });

      expect(acceptResult.counterProposal.status).toBe("ACCEPTED");
      expect(acceptResult.acceptedOffer?.status).toBe("ACCEPTED");
      expect(acceptResult.acceptedOffer?.budgetMin).toBe("18000");
      expect(acceptResult.acceptedOffer?.budgetMax).toBe("21000");
      expect(acceptResult.acceptedOffer?.estimatedDurationValue).toBe(2);

      // Verify listing updated to MATCHED
      const sentItem = inMemorySentOffers.find((s) => s.offer.id === offerId)!;
      expect(sentItem.listing.status).toBe("MATCHED");
    });

    it("prevents proposer from accepting their own counter-offer", async () => {
      const counter = await OfferService.submitCounterOffer(listingOwnerId, {
        offerId,
        budgetMin: "18000",
        budgetMax: "21000",
        estimatedDurationValue: 2,
        estimatedDurationUnit: "WEEKS",
        message: "Pazarlık gerekçesi açıklaması.",
      });

      // Proposer attempts to accept own proposal -> MUST FAIL
      await expect(
        OfferService.acceptCounterOffer(listingOwnerId, {
          counterProposalId: counter.id,
        })
      ).rejects.toThrow("yalnızca teklifin iletildiği taraf");
    });

    it("allows the recipient to reject a counter-offer, terminating the proposal", async () => {
      const counter = await OfferService.submitCounterOffer(listingOwnerId, {
        offerId,
        budgetMin: "12000",
        budgetMax: "14000",
        estimatedDurationValue: 1,
        estimatedDurationUnit: "WEEKS",
        message: "Çok düşük bütçeli karşı teklif.",
      });

      // Freelancer rejects
      const res = await OfferService.rejectCounterOffer(freelancerId, {
        counterProposalId: counter.id,
        rejectionNote: "Bütçe beklentilerimizin çok altında kaldığı için anlaşamadık.",
      });

      expect(res.rejected).toBe(true);

      const offer = inMemorySentOffers.find((s) => s.offer.id === offerId)!.offer;
      expect(offer.status).toBe("REJECTED");
      expect(offer.rejectionCode).toBe("COUNTER_OFFER_REJECTED");
    });

    it("allows proposer to withdraw a pending counter-offer before acceptance", async () => {
      const counter = await OfferService.submitCounterOffer(listingOwnerId, {
        offerId,
        budgetMin: "18000",
        budgetMax: "20000",
        estimatedDurationValue: 2,
        estimatedDurationUnit: "WEEKS",
        message: "Geri çekilecek karşı teklif.",
      });

      // Proposer withdraws
      const res = await OfferService.withdrawCounterOffer(listingOwnerId, {
        counterProposalId: counter.id,
      });

      expect(res.withdrawn).toBe(true);

      const proposal = inMemoryCounterProposals.find((c) => c.id === counter.id)!;
      expect(proposal.status).toBe("WITHDRAWN");

      const offer = inMemorySentOffers.find((s) => s.offer.id === offerId)!.offer;
      expect(offer.isCountered).toBe(false);
      expect(offer.counterRound).toBe(0);
      expect(offer.currentTurnUserId).toBe(listingOwnerId); // turn reverted back to employer
    });
  });

  describe("Negotiation Timeline Query & TTL Calculation", () => {
    it("returns chronological timeline with time remaining and permission flags", async () => {
      // Employer makes Round 1
      await OfferService.submitCounterOffer(listingOwnerId, {
        offerId,
        budgetMin: "18000",
        budgetMax: "20000",
        estimatedDurationValue: 2,
        estimatedDurationUnit: "WEEKS",
        message: "1. Tur karşı teklifimiz.",
      });

      // Freelancer views timeline
      const timelineFreelancer = await OfferService.getCounterNegotiationTimeline(freelancerId, offerId);

      expect(timelineFreelancer.offer.counterRound).toBe(1);
      expect(timelineFreelancer.isViewerTurn).toBe(true); // Freelancer's turn!
      expect(timelineFreelancer.canAccept).toBe(true);
      expect(timelineFreelancer.canCounter).toBe(true);
      expect(timelineFreelancer.canReject).toBe(true);
      expect(timelineFreelancer.canWithdraw).toBe(false);
      expect(timelineFreelancer.activeProposal).not.toBeNull();
      expect(timelineFreelancer.activeProposal?.timeRemainingMs).toBeGreaterThan(0);

      // Employer views timeline
      const timelineEmployer = await OfferService.getCounterNegotiationTimeline(listingOwnerId, offerId);
      expect(timelineEmployer.isViewerTurn).toBe(false); // Not employer's turn!
      expect(timelineEmployer.canAccept).toBe(false);
      expect(timelineEmployer.canWithdraw).toBe(true); // Employer is proposer, can withdraw
    });
  });
});
