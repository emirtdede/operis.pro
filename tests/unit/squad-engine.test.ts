import { describe, it, expect } from "vitest";
import { SquadRevenueEngine, SquadMemberInput } from "@/src/modules/offers/squad-engine";

describe("SquadRevenueEngine", () => {
  describe("validateSquadDistribution", () => {
    it("should accept a valid 2-person squad summing to 100% with exactly 1 lead", () => {
      const members: SquadMemberInput[] = [
        {
          displayName: "Ahmet Yılmaz",
          roleTitle: "Lead Fullstack Dev",
          revenueSharePercentage: 60,
          isLead: true,
          scopeSummary: "Architecture and backend",
        },
        {
          displayName: "Mehmet Demir",
          roleTitle: "Frontend Dev",
          revenueSharePercentage: 40,
          isLead: false,
          scopeSummary: "UI and client application",
        },
      ];

      const result = SquadRevenueEngine.validateSquadDistribution(members);
      expect(result.isValid).toBe(true);
      expect(result.totalPercentage).toBe(100);
      expect(result.error).toBeUndefined();
    });

    it("should accept a valid 3-person squad (50/35/15)", () => {
      const members: SquadMemberInput[] = [
        {
          displayName: "Canan Kaya",
          roleTitle: "Backend Architect",
          revenueSharePercentage: 50,
          isLead: true,
        },
        {
          displayName: "Burak Öz",
          roleTitle: "Frontend Engineer",
          revenueSharePercentage: 35,
          isLead: false,
        },
        {
          displayName: "Selin Ak",
          roleTitle: "UI/UX Designer",
          revenueSharePercentage: 15,
          isLead: false,
        },
      ];

      const result = SquadRevenueEngine.validateSquadDistribution(members);
      expect(result.isValid).toBe(true);
      expect(result.totalPercentage).toBe(100);
    });

    it("should accept a valid 5-person squad summing to 100%", () => {
      const members: SquadMemberInput[] = [
        { displayName: "M1", roleTitle: "Lead", revenueSharePercentage: 20, isLead: true },
        { displayName: "M2", roleTitle: "Dev 1", revenueSharePercentage: 20, isLead: false },
        { displayName: "M3", roleTitle: "Dev 2", revenueSharePercentage: 20, isLead: false },
        { displayName: "M4", roleTitle: "QA", revenueSharePercentage: 20, isLead: false },
        { displayName: "M5", roleTitle: "DevOps", revenueSharePercentage: 20, isLead: false },
      ];

      const result = SquadRevenueEngine.validateSquadDistribution(members);
      expect(result.isValid).toBe(true);
    });

    it("should reject a squad with fewer than 2 members", () => {
      const members: SquadMemberInput[] = [
        { displayName: "Solo Dev", roleTitle: "Fullstack", revenueSharePercentage: 100, isLead: true },
      ];

      const result = SquadRevenueEngine.validateSquadDistribution(members);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("en az 2");
    });

    it("should reject a squad with more than 5 members", () => {
      const members: SquadMemberInput[] = [
        { displayName: "M1", roleTitle: "Lead", revenueSharePercentage: 20, isLead: true },
        { displayName: "M2", roleTitle: "Dev 1", revenueSharePercentage: 20, isLead: false },
        { displayName: "M3", roleTitle: "Dev 2", revenueSharePercentage: 20, isLead: false },
        { displayName: "M4", roleTitle: "Dev 3", revenueSharePercentage: 20, isLead: false },
        { displayName: "M5", roleTitle: "Dev 4", revenueSharePercentage: 10, isLead: false },
        { displayName: "M6", roleTitle: "Dev 5", revenueSharePercentage: 10, isLead: false },
      ];

      const result = SquadRevenueEngine.validateSquadDistribution(members);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("en fazla 5");
    });

    it("should reject a squad whose shares sum to less than 100%", () => {
      const members: SquadMemberInput[] = [
        { displayName: "Lead", roleTitle: "Lead", revenueSharePercentage: 50, isLead: true },
        { displayName: "Dev", roleTitle: "Dev", revenueSharePercentage: 35, isLead: false },
      ];

      const result = SquadRevenueEngine.validateSquadDistribution(members);
      expect(result.isValid).toBe(false);
      expect(result.totalPercentage).toBe(85);
      expect(result.error).toContain("%100");
    });

    it("should reject a squad whose shares sum to more than 100%", () => {
      const members: SquadMemberInput[] = [
        { displayName: "Lead", roleTitle: "Lead", revenueSharePercentage: 60, isLead: true },
        { displayName: "Dev", roleTitle: "Dev", revenueSharePercentage: 50, isLead: false },
      ];

      const result = SquadRevenueEngine.validateSquadDistribution(members);
      expect(result.isValid).toBe(false);
      expect(result.totalPercentage).toBe(110);
      expect(result.error).toContain("%100");
    });

    it("should reject a squad with 0 leads", () => {
      const members: SquadMemberInput[] = [
        { displayName: "Dev 1", roleTitle: "Dev", revenueSharePercentage: 50, isLead: false },
        { displayName: "Dev 2", roleTitle: "Dev", revenueSharePercentage: 50, isLead: false },
      ];

      const result = SquadRevenueEngine.validateSquadDistribution(members);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("1 adet Lider Yüklenici");
    });

    it("should reject a squad with multiple leads", () => {
      const members: SquadMemberInput[] = [
        { displayName: "Dev 1", roleTitle: "Lead 1", revenueSharePercentage: 50, isLead: true },
        { displayName: "Dev 2", roleTitle: "Lead 2", revenueSharePercentage: 50, isLead: true },
      ];

      const result = SquadRevenueEngine.validateSquadDistribution(members);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("yalnızca 1 adet");
    });

    it("should reject a squad member with 0 or negative percentage", () => {
      const members: SquadMemberInput[] = [
        { displayName: "Dev 1", roleTitle: "Lead", revenueSharePercentage: 100, isLead: true },
        { displayName: "Dev 2", roleTitle: "Intern", revenueSharePercentage: 0, isLead: false },
      ];

      const result = SquadRevenueEngine.validateSquadDistribution(members);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("arasında olmalıdır");
    });

    it("should reject empty displayName or roleTitle", () => {
      const members: SquadMemberInput[] = [
        { displayName: "", roleTitle: "Lead", revenueSharePercentage: 60, isLead: true },
        { displayName: "Dev", roleTitle: "", revenueSharePercentage: 40, isLead: false },
      ];

      const result = SquadRevenueEngine.validateSquadDistribution(members);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Ad Soyad ve Rol");
    });
  });

  describe("calculatePayouts", () => {
    it("should calculate exact cent-precision payouts for 200,000 TRY (50/35/15)", () => {
      const members: SquadMemberInput[] = [
        { displayName: "Backend Lead", roleTitle: "Backend Lead", revenueSharePercentage: 50, isLead: true },
        { displayName: "Frontend Dev", roleTitle: "Frontend", revenueSharePercentage: 35, isLead: false },
        { displayName: "UI/UX Designer", roleTitle: "Design", revenueSharePercentage: 15, isLead: false },
      ];

      const payouts = SquadRevenueEngine.calculatePayouts(200000, "TRY", members);
      expect(payouts).toHaveLength(3);

      expect(payouts[0]!.calculatedAmount).toBe(100000);
      expect(payouts[1]!.calculatedAmount).toBe(70000);
      expect(payouts[2]!.calculatedAmount).toBe(30000);

      const totalCalculated = payouts.reduce((acc, p) => acc + p.calculatedAmount, 0);
      expect(totalCalculated).toBe(200000);
    });

    it("should allocate rounding residue penny to Lead Contractor when splitting uneven amounts", () => {
      // 100.00 split 33.33% / 33.33% / 33.34%
      const members: SquadMemberInput[] = [
        { displayName: "Lead", roleTitle: "Lead", revenueSharePercentage: 33.34, isLead: true },
        { displayName: "Dev 1", roleTitle: "Dev", revenueSharePercentage: 33.33, isLead: false },
        { displayName: "Dev 2", roleTitle: "Dev", revenueSharePercentage: 33.33, isLead: false },
      ];

      const payouts = SquadRevenueEngine.calculatePayouts(100, "USD", members);
      const totalCalculated = payouts.reduce((acc, p) => acc + p.calculatedAmount, 0);

      // Must strictly equal total budget (100.00) without losing a single cent
      expect(Math.round(totalCalculated * 100) / 100).toBe(100);
    });
  });

  describe("suggestDefaultSquad", () => {
    it("should suggest mobile squad for mobile-related categories or titles", () => {
      const squad = SquadRevenueEngine.suggestDefaultSquad("software-dev", "Flutter & iOS E-ticaret Uygulaması");
      expect(squad.title).toContain("Mobil");
      expect(squad.members).toHaveLength(3);
      expect(squad.members.some((m) => m.roleTitle.includes("Mobil"))).toBe(true);
      expect(squad.members.reduce((acc, m) => acc + m.revenueSharePercentage, 0)).toBe(100);
    });

    it("should suggest AI squad for AI & data projects", () => {
      const squad = SquadRevenueEngine.suggestDefaultSquad("ai-ml", "RAG & LLM Entegrasyon Projesi");
      expect(squad.title).toContain("Yapay Zeka");
      expect(squad.members).toHaveLength(3);
      expect(squad.members.reduce((acc, m) => acc + m.revenueSharePercentage, 0)).toBe(100);
    });

    it("should default to fullstack squad when generic", () => {
      const squad = SquadRevenueEngine.suggestDefaultSquad("web-development", "Kurumsal Web Sitesi");
      expect(squad.title).toContain("Web");
      expect(squad.members).toHaveLength(3);
      expect(squad.members.reduce((acc, m) => acc + m.revenueSharePercentage, 0)).toBe(100);
    });
  });
});
