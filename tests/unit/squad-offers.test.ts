import { describe, it, expect } from "vitest";
import { submitOfferSchema, updateOfferSchema } from "@/src/modules/offers/validation";
import { OfferService, inMemorySquadMembers } from "@/src/modules/offers/service";

describe("Squad Offer Validation & Service", () => {
  describe("submitOfferSchema validation", () => {
    it("should accept a standard solo offer without squad fields", () => {
      const parsed = submitOfferSchema.safeParse({
        listingId: "11111111-1111-1111-1111-111111111111",
        message: "This is a detailed proposal message explaining relevant skills and technical delivery approach.",
        budgetCurrency: "TRY",
        budgetMin: "10000",
        budgetMax: "20000",
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.isSquadOffer).toBeFalsy();
      }
    });

    it("should accept a valid squad offer with 100% distribution", () => {
      const parsed = submitOfferSchema.safeParse({
        listingId: "11111111-1111-1111-1111-111111111111",
        message: "This is a detailed consortium proposal message explaining our squad credentials and approach.",
        budgetCurrency: "TRY",
        budgetMin: "150000",
        budgetMax: "200000",
        isSquadOffer: true,
        squadTitle: "Mobil & Bulut Çevik Ekibi",
        squadMembers: [
          {
            displayName: "Ahmet Yılmaz",
            roleTitle: "Lead Architect",
            revenueSharePercentage: 50,
            isLead: true,
            scopeSummary: "Architecture & coordination",
          },
          {
            displayName: "Mehmet Demir",
            roleTitle: "Backend Engineer",
            revenueSharePercentage: 35,
            isLead: false,
          },
          {
            displayName: "Ayşe Kaya",
            roleTitle: "UI/UX Designer",
            revenueSharePercentage: 15,
            isLead: false,
          },
        ],
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.isSquadOffer).toBe(true);
        expect(parsed.data.squadMembers).toHaveLength(3);
      }
    });

    it("should reject squad offer if shares do not sum to 100%", () => {
      const parsed = submitOfferSchema.safeParse({
        listingId: "11111111-1111-1111-1111-111111111111",
        message: "This is a detailed consortium proposal message explaining our squad credentials and approach.",
        isSquadOffer: true,
        squadMembers: [
          {
            displayName: "Ahmet Yılmaz",
            roleTitle: "Lead Architect",
            revenueSharePercentage: 50,
            isLead: true,
          },
          {
            displayName: "Mehmet Demir",
            roleTitle: "Backend Engineer",
            revenueSharePercentage: 30, // total 80%
            isLead: false,
          },
        ],
      });

      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const errorMessages = parsed.error.issues.map((i) => i.message).join(" ");
        expect(errorMessages).toContain("100%");
      }
    });

    it("should reject squad offer if fewer than 2 members", () => {
      const parsed = submitOfferSchema.safeParse({
        listingId: "11111111-1111-1111-1111-111111111111",
        message: "This is a detailed consortium proposal message explaining our squad credentials and approach.",
        isSquadOffer: true,
        squadMembers: [
          {
            displayName: "Ahmet Yılmaz",
            roleTitle: "Lead Architect",
            revenueSharePercentage: 50,
            isLead: true,
          },
        ],
      });

      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const errorMessages = parsed.error.issues.map((i) => i.message).join(" ");
        expect(errorMessages).toContain("2 to 5 members");
      }
    });

    it("should reject squad offer if multiple leads are specified", () => {
      const parsed = submitOfferSchema.safeParse({
        listingId: "11111111-1111-1111-1111-111111111111",
        message: "This is a detailed consortium proposal message explaining our squad credentials and approach.",
        isSquadOffer: true,
        squadMembers: [
          {
            displayName: "Ahmet Yılmaz",
            roleTitle: "Lead Architect 1",
            revenueSharePercentage: 50,
            isLead: true,
          },
          {
            displayName: "Mehmet Demir",
            roleTitle: "Lead Architect 2",
            revenueSharePercentage: 50,
            isLead: true,
          },
        ],
      });

      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const errorMessages = parsed.error.issues.map((i) => i.message).join(" ");
        expect(errorMessages).toContain("Lider Yüklenici");
      }
    });
  });

  describe("updateOfferSchema validation", () => {
    it("should validate squad distribution updates on existing offers", () => {
      const parsed = updateOfferSchema.safeParse({
        offerId: "offer-test-123",
        message: "Updated proposal message with fresh technical estimations and timeline details.",
        isSquadOffer: true,
        squadTitle: "Yenilenen Ekip",
        squadMembers: [
          {
            displayName: "Lead",
            roleTitle: "Lead",
            revenueSharePercentage: 60,
            isLead: true,
          },
          {
            displayName: "Dev",
            roleTitle: "Dev",
            revenueSharePercentage: 40,
            isLead: false,
          },
        ],
      });

      expect(parsed.success).toBe(true);
    });
  });

  describe("OfferService Squad Registry", () => {
    it("should register and retrieve squad members for an offer", async () => {
      const offerId = "test-offer-squad-101";
      const members = [
        {
          displayName: "Selin Ak",
          roleTitle: "UI/UX & Lead",
          revenueSharePercentage: 55,
          isLead: true,
          scopeSummary: "Product design and user testing",
        },
        {
          displayName: "Burak Öz",
          roleTitle: "Frontend Engineer",
          revenueSharePercentage: 45,
          isLead: false,
          scopeSummary: "Next.js & Tailwind implementation",
        },
      ];

      // Seed in-memory store
      inMemorySquadMembers.set(offerId, members.map((m, idx) => ({
        id: `sm-${idx + 1}`,
        offerId,
        displayName: m.displayName,
        roleTitle: m.roleTitle,
        revenueSharePercentage: m.revenueSharePercentage,
        scopeSummary: m.scopeSummary,
        isLead: m.isLead,
        handleOrEmail: null,
      })));

      const retrieved = await OfferService.getOfferSquadMembers(offerId);
      expect(retrieved).toHaveLength(2);
      expect(retrieved[0]!.displayName).toBe("Selin Ak");
      expect(retrieved[0]!.revenueSharePercentage).toBe(55);
      expect(retrieved[0]!.isLead).toBe(true);
      expect(retrieved[1]!.displayName).toBe("Burak Öz");
      expect(retrieved[1]!.revenueSharePercentage).toBe(45);
    });
  });
});
