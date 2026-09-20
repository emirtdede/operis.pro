import { describe, it, expect } from "vitest";
import {
  InflationHedgingEngine,
  TUIK_INDEX_DATABASE,
} from "@/src/modules/finance/inflation-hedging";
import { ContractGeneratorService } from "@/src/modules/contracts/generator";
import type { ContractGeneratorInput } from "@/src/modules/contracts/types";

describe("TBK 138 & 32 Sayılı Karar Inflation & FX Hedging Engine", () => {
  describe("1. TÜİK Index Database & Normalization", () => {
    it("returns correct official index values for known historical months", () => {
      const tufe202401 = InflationHedgingEngine.getTuikIndex("2024-01", "TUFE");
      const yiUfe202401 = InflationHedgingEngine.getTuikIndex("2024-01", "YI_UFE");
      const hybrid202401 = InflationHedgingEngine.getTuikIndex("2024-01", "HYBRID");

      expect(tufe202401).toBe(TUIK_INDEX_DATABASE["2024-01"]!.tufe);
      expect(yiUfe202401).toBe(TUIK_INDEX_DATABASE["2024-01"]!.yiUfe);
      expect(hybrid202401).toBe(
        Math.round(((tufe202401 + yiUfe202401) / 2) * 100) / 100
      );
    });

    it("smoothly extrapolates future index values beyond 2026 without crashing", () => {
      const futureTufe = InflationHedgingEngine.getTuikIndex("2027-06", "TUFE");
      const base2026Dec = TUIK_INDEX_DATABASE["2026-12"]!.tufe;

      expect(futureTufe).toBeGreaterThan(base2026Dec);
      expect(Number.isFinite(futureTufe)).toBe(true);
    });

    it("normalizes invalid or missing month strings to current date YYYY-MM", () => {
      const normalized = InflationHedgingEngine.normalizeMonth("invalid-date");
      expect(normalized).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe("2. Inflation Adjustment Calculation (Formulas, Floor, Cap, and Moratorium)", () => {
    it("calculates positive inflation escalation accurately across period", () => {
      const result = InflationHedgingEngine.calculateAdjustment({
        baseAmount: 100000,
        baseMonth: "2024-01",
        targetMonth: "2024-06",
        indexType: "TUFE",
      });

      const baseIdx = TUIK_INDEX_DATABASE["2024-01"]!.tufe;
      const targetIdx = TUIK_INDEX_DATABASE["2024-06"]!.tufe;
      const expectedRate = (targetIdx - baseIdx) / baseIdx;
      const expectedAdjustedGross = Math.round(100000 * (1 + expectedRate) * 100) / 100;

      expect(result.rawInflationRate).toBeCloseTo(expectedRate, 3);
      expect(result.adjustedGrossAmount).toBe(expectedAdjustedGross);
      expect(result.inflationDeltaAmount).toBe(result.adjustedGrossAmount - 100000);
      expect(result.floorApplied).toBe(false);
      expect(result.capApplied).toBe(false);
    });

    it("enforces 0% Floor protection if inflation would be negative (deflation shield)", () => {
      // Reversing target and base to simulate price decline
      const result = InflationHedgingEngine.calculateAdjustment({
        baseAmount: 50000,
        baseMonth: "2024-06",
        targetMonth: "2024-01",
        indexType: "TUFE",
      });

      expect(result.rawInflationRate).toBeLessThan(0);
      expect(result.floorApplied).toBe(true);
      expect(result.finalAdjustmentRate).toBe(0);
      expect(result.adjustedGrossAmount).toBe(50000);
      expect(result.inflationDeltaAmount).toBe(0);
    });

    it("enforces Cap protection when inflation rate exceeds stipulated ceiling", () => {
      // 2024-01 to 2024-12 inflation is ~35%
      const result = InflationHedgingEngine.calculateAdjustment({
        baseAmount: 50000,
        baseMonth: "2024-01",
        targetMonth: "2024-12",
        indexType: "TUFE",
        capPercentage: 15, // Cap at +15%
      });

      expect(result.rawInflationRate).toBeGreaterThan(0.15);
      expect(result.capApplied).toBe(true);
      expect(result.finalAdjustmentRate).toBe(0.15);
      expect(result.adjustedGrossAmount).toBe(57500); // 50000 * 1.15
      expect(result.inflationDeltaAmount).toBe(7500);
    });

    it("enforces TBK m. 117 Contractor Moratorium: freezes index at original milestone date", () => {
      const result = InflationHedgingEngine.calculateAdjustment({
        baseAmount: 60000,
        baseMonth: "2024-01",
        targetMonth: "2024-12", // Actual late delivery
        originalTargetMonth: "2024-04", // Contractual deadline
        faultParty: "CONTRACTOR",
        indexType: "TUFE",
      });

      const baseIdx = TUIK_INDEX_DATABASE["2024-01"]!.tufe;
      const frozenIdx = TUIK_INDEX_DATABASE["2024-04"]!.tufe;
      const expectedFrozenRate = (frozenIdx - baseIdx) / baseIdx;

      expect(result.faultFrozenApplied).toBe(true);
      expect(result.effectiveTargetMonth).toBe("2024-04");
      expect(result.targetIndex).toBe(frozenIdx);
      expect(result.finalAdjustmentRate).toBeCloseTo(expectedFrozenRate, 3);
    });
  });

  describe("3. Statutory Tax Breakdown Integration", () => {
    it("computes accurate GVK 94 withholding and VAT on adjusted gross amount", () => {
      const result = InflationHedgingEngine.calculateAdjustment({
        baseAmount: 100000,
        baseMonth: "2024-01",
        targetMonth: "2024-06",
        indexType: "HYBRID",
      });

      const gross = result.adjustedGrossAmount;
      const tax = result.taxBreakdown;

      expect(tax.grossAmount).toBe(gross);
      expect(tax.withholdingAmount).toBe(Math.round(gross * 0.2 * 100) / 100);
      expect(tax.netTakeHome).toBe(Math.round((gross - tax.withholdingAmount) * 100) / 100);
      expect(tax.vatTotalAmount).toBe(Math.round(gross * 0.2 * 100) / 100);
      expect(tax.totalCashToFreelancer).toBe(
        Math.round((tax.netTakeHome + tax.vatTotalAmount) * 100) / 100
      );
    });
  });

  describe("4. Statutory Contract Clause Generation (Decree 32 & TBK 138)", () => {
    it("generates authoritative Turkish clause containing decree 32 and TBK 138 references", () => {
      const clause = InflationHedgingEngine.generateInflationClauseText(
        {
          enabled: true,
          indexType: "HYBRID",
          baseMonth: "2026-01",
          targetMonth: "2026-06",
          capPercentage: 20,
        },
        "tr",
        75000
      );

      expect(clause.markdown).toContain("32 SAYILI KARAR VE TBK m. 138");
      expect(clause.markdown).toContain("döviz cinsinden veya dövize endeksli değildir");
      expect(clause.markdown).toContain("Aşırı İfa Güçlüğü");
      expect(clause.markdown).toContain("TÜİK Karma Endeksi");
      expect(clause.markdown).toContain("Azami artış oranı **%20** ile sınırlandırılmıştır");
      expect(clause.markdown).toContain("Kusurlu Temerrüt Kuralı (TBK m. 117)");
      expect(clause.html).toContain("TBK m. 138 & 32 Sayılı Karar Uyumlu Enflasyon");
    });

    it("generates authoritative English clause for international contracts", () => {
      const clause = InflationHedgingEngine.generateInflationClauseText(
        {
          enabled: true,
          indexType: "TUFE",
          baseMonth: "2026-01",
          targetMonth: "2026-06",
          capPercentage: 25,
        },
        "en",
        75000
      );

      expect(clause.markdown).toContain("STATUTORY INFLATION HEDGING & PRICE ESCALATION CLAUSE");
      expect(clause.markdown).toContain("Decree No. 32");
      expect(clause.markdown).toContain("TBK Art. 138 & 480/2");
      expect(clause.markdown).toContain("TurkStat Consumer Price Index (CPI)");
      expect(clause.markdown).toContain("Maximum price escalation is capped at **%25**");
      expect(clause.html).toContain("Statutory Inflation Hedging Clause");
    });
  });

  describe("5. Scenario Simulations", () => {
    it("generates 4 realistic inflation projection scenarios adhering to cap", () => {
      const scenarios = InflationHedgingEngine.simulateScenarios(100000, 25, "CORPORATE");

      expect(scenarios).toHaveLength(4);
      // Scenario 1: +10%
      expect(scenarios[0]!.projectedRatePercent).toBe(10);
      expect(scenarios[0]!.adjustedGrossAmount).toBe(110000);
      // Scenario 4: +40% but capped at 25%
      expect(scenarios[3]!.adjustedGrossAmount).toBe(125000);
      expect(scenarios[3]!.deltaAmount).toBe(25000);
    });
  });

  describe("6. ContractGeneratorService Integration", () => {
    const baseInput: ContractGeneratorInput = {
      engagementId: "eng-infl-test-01",
      listingTitle: "FinTech Mobil Bankacılık iOS & Android Uygulaması",
      category: "Mobil Yazılım Geliştirme",
      matchedAt: "2026-03-15",
      scopeSummary: "Mobil uygulama frontend ve backend API servisleri.",
      budgetLabel: "100.000 TL",
      timelineLabel: "4 Ay",
      client: {
        displayName: "Ayşe Kaya",
        email: "ayse@example.com",
        role: "CLIENT",
      },
      contractor: {
        displayName: "Mehmet Demir",
        email: "mehmet@example.com",
        role: "CONTRACTOR",
      },
      locale: "tr",
    };

    it("injects Article 3.5 and updates metadata when inflationShield is enabled", () => {
      const inputWithShield: ContractGeneratorInput = {
        ...baseInput,
        inflationShield: {
          enabled: true,
          indexType: "HYBRID",
          baseMonth: "2026-03",
          targetMonth: "2026-07",
          capPercentage: 20,
        },
      };

      const result = ContractGeneratorService.generateContract(inputWithShield);

      expect(result.metadata.inflationShieldIncluded).toBe(true);
      expect(result.inflationShield?.enabled).toBe(true);
      expect(result.plainText).toContain("32 SAYILI KARAR VE TBK m. 138");
      expect(result.plainText).toContain("TÜİK Karma Endeksi");
      expect(result.htmlContent).toContain("TBK m. 138 & 32 Sayılı Karar Uyumlu Enflasyon");
      expect(result.htmlContent).toContain("Tavan Sınırı (Cap)");
    });

    it("omits Article 3.5 and sets metadata to false when inflationShield is omitted", () => {
      const result = ContractGeneratorService.generateContract(baseInput);

      expect(result.metadata.inflationShieldIncluded).toBe(false);
      expect(result.plainText).not.toContain("32 SAYILI KARAR VE TBK m. 138");
    });
  });
});
