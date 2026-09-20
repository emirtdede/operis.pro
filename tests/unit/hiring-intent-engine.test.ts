import { describe, it, expect } from "vitest";
import { HiringIntentEngine } from "@/src/modules/listings/hiring-intent/hiring-intent-engine";
import { HiringIntentService } from "@/src/modules/listings/hiring-intent/hiring-intent-service";
import {
  HiringIntentEvaluationInput,
  HiringIntentLevel,
} from "@/src/modules/listings/hiring-intent/hiring-intent-types";

describe("HiringIntentEngine (Hiring Intent Index & Client Trust Score)", () => {
  describe("1. Mathematical Bayesian Prior Calibration (Beta-Binomial)", () => {
    it("should calculate correct smoothed hire rates according to (k+2)/(n+3)", () => {
      // n=0, k=0 -> 2/3 = ~0.67
      const r00 = HiringIntentEngine.calculateBayesianHireRate(0, 0);
      expect(r00.bayesianRate).toBe(0.67);
      expect(r00.rawRate).toBe(0);

      // n=1, k=1 -> 3/4 = 0.75
      const r11 = HiringIntentEngine.calculateBayesianHireRate(1, 1);
      expect(r11.bayesianRate).toBe(0.75);
      expect(r11.rawRate).toBe(1.0);

      // n=1, k=0 -> 2/4 = 0.50
      const r01 = HiringIntentEngine.calculateBayesianHireRate(0, 1);
      expect(r01.bayesianRate).toBe(0.5);
      expect(r01.rawRate).toBe(0);

      // n=3, k=3 -> 5/6 = ~0.83
      const r33 = HiringIntentEngine.calculateBayesianHireRate(3, 3);
      expect(r33.bayesianRate).toBe(0.83);

      // n=5, k=5 -> 7/8 = ~0.88
      const r55 = HiringIntentEngine.calculateBayesianHireRate(5, 5);
      expect(r55.bayesianRate).toBe(0.88);

      // n=5, k=0 -> 2/8 = 0.25
      const r05 = HiringIntentEngine.calculateBayesianHireRate(0, 5);
      expect(r05.bayesianRate).toBe(0.25);
    });
  });

  describe("2. Cold-Start Dynamics (Zero Historical Listings, n=0)", () => {
    it("should award VERIFIED_NEW_CLIENT badge and score >= 88 for verified corporate client on first listing", () => {
      const input: HiringIntentEvaluationInput = {
        listingId: "listing-new-corp-1",
        title: "Next.js 15 ve PostgreSQL Tabanlı B2B Platformu",
        summary: "Kurumsal e-ticaret altyapısı için deneyimli Fullstack ekibi aranıyor.",
        scope: "Next.js 15 App Router, TypeScript ve PostgreSQL tabanlı e-ticaret platformu geliştirilecektir. 3 ana aşamada teslimat yapılacak: 1. Arayüz ve auth, 2. Sepet ve ödeme entegrasyonu, 3. Admin paneli ve testler. Figma tasarımları hazırdır.",
        clarityScore: 92,
        budgetMin: 50000,
        budgetMax: 70000,
        budgetCurrency: "TRY",
        categoryBenchmark: {
          hasBenchmark: true,
          sampleCount: 15,
          min: 40000,
          median: 55000,
          max: 80000,
        },
        ownerProfile: {
          isCompanyVerified: true,
          companyType: "AS",
          companyName: "İnovasyon Bilişim A.Ş.",
          taxOffice: "Maslak VD",
          websiteUrl: "https://inovasyon.com.tr",
          emailVerified: true,
          phoneVerified: true,
        },
        clientHistory: {
          totalListings: 0,
          closedListings: 0,
          matchedEngagements: 0,
          hireRateRaw: 0,
          hireRateBayesian: 0.67,
          isFirstTimeClient: true,
        },
      };

      const result = HiringIntentEngine.evaluateHiringIntent(input);

      expect(result.isFirstTimeClient).toBe(true);
      expect(result.level).toBe("VERIFIED_NEW_CLIENT" as HiringIntentLevel);
      expect(result.overallScore).toBeGreaterThanOrEqual(88);
      expect(result.badgeLabelTr).toContain("Yeni İşveren");
      expect(result.pillars.CORPORATE_VERIFICATION.score).toBe(30); // 20 + 5 (AS) + 5 (website)
      expect(result.pillars.BUDGET_BENCHMARK.score).toBe(25); // >= min (40,000)
      expect(result.pillars.SCOPE_CLARITY.score).toBe(23); // Math.round(92 / 100 * 25) = 23
      expect(result.pillars.HISTORICAL_RELIABILITY.score).toBe(18); // cold-start calibrated for verified
      expect(result.penaltiesApplied).toHaveLength(0);
    });

    it("should provide fair neutral baseline (60-75%) for unverified individual new employer without unfair penalties", () => {
      const input: HiringIntentEvaluationInput = {
        listingId: "listing-new-ind-1",
        title: "Flutter Mobil Prototip Tasarımı",
        summary: "MVP aşamasında mobil ekran prototipleri.",
        scope: "Bir mobil uygulama prototipi için Flutter arayüzü tasarlanacak. 5 ekran tasarlanması bekleniyor.",
        clarityScore: 65,
        budgetMin: 20000,
        budgetMax: 25000,
        budgetCurrency: "TRY",
        categoryBenchmark: {
          hasBenchmark: true,
          sampleCount: 10,
          min: 18000,
          median: 22000,
          max: 35000,
        },
        ownerProfile: {
          isCompanyVerified: false,
          emailVerified: true,
          phoneVerified: true,
        },
        clientHistory: {
          totalListings: 0,
          closedListings: 0,
          matchedEngagements: 0,
          hireRateRaw: 0,
          hireRateBayesian: 0.67,
          isFirstTimeClient: true,
        },
      };

      const result = HiringIntentEngine.evaluateHiringIntent(input);

      expect(result.isFirstTimeClient).toBe(true);
      expect(result.overallScore).toBeGreaterThanOrEqual(60);
      expect(result.overallScore).toBeLessThan(80);
      expect(result.level).toBe("MODERATE_INTENT" as HiringIntentLevel);
      expect(result.penaltiesApplied).toHaveLength(0);
    });
  });

  describe("3. Established Client Reliability & Proven High Intent", () => {
    it("should award PROVEN_HIGH_INTENT with score >= 90 for returning employer with high hire rate", () => {
      const input: HiringIntentEvaluationInput = {
        listingId: "listing-established-1",
        title: "Fintech Mobil Bankacılık Modülü",
        summary: "iOS Swift ve Kotlin mimarisi kurulacak.",
        scope: "Fintech mobil bankacılık modülü için iOS Swift ve Kotlin Multiplatform uzmanı aranıyor. Detaylı teknik şartname ve Figma tasarımları mevcuttur. 3 sprintlik MVP çalışması planlandı.",
        clarityScore: 95,
        budgetMin: 80000,
        budgetMax: 100000,
        budgetCurrency: "TRY",
        categoryBenchmark: {
          hasBenchmark: true,
          sampleCount: 22,
          min: 70000,
          median: 85000,
          max: 120000,
        },
        ownerProfile: {
          isCompanyVerified: true,
          companyType: "LTD",
          companyName: "PayTech Çözümleri Ltd. Şti.",
          websiteUrl: "https://paytech.com.tr",
          emailVerified: true,
          phoneVerified: true,
        },
        clientHistory: {
          totalListings: 4,
          closedListings: 4,
          matchedEngagements: 4,
          hireRateRaw: 1.0,
          hireRateBayesian: 0.86,
          isFirstTimeClient: false,
          unreviewedOffersCount: 0,
        },
      };

      const result = HiringIntentEngine.evaluateHiringIntent(input);

      expect(result.isFirstTimeClient).toBe(false);
      expect(result.level).toBe("PROVEN_HIGH_INTENT" as HiringIntentLevel);
      expect(result.overallScore).toBeGreaterThanOrEqual(92);
      expect(result.pillars.HISTORICAL_RELIABILITY.score).toBe(20);
      expect(result.pillars.CORPORATE_VERIFICATION.score).toBe(30);
      expect(result.pillars.BUDGET_BENCHMARK.score).toBe(25);
      expect(result.penaltiesApplied).toHaveLength(0);
    });
  });

  describe("4. Anti-Gaming Detection & Ghost Job Penalties", () => {
    it("should flag serial proposal abandoner and low hire rate client as PRICE_CHECK_RISK (< 50)", () => {
      const input: HiringIntentEvaluationInput = {
        listingId: "listing-ghost-1",
        title: "Web Sitesi Yapımı",
        summary: "Fiyat teklifi alalım.",
        scope: "Genel bir web sitesi yapılması lazım, fiyat teklifi alalım.",
        clarityScore: 35,
        budgetMin: 3000,
        budgetMax: 4000,
        budgetCurrency: "TRY",
        categoryBenchmark: {
          hasBenchmark: true,
          sampleCount: 20,
          min: 30000,
          median: 40000,
          max: 60000,
        },
        ownerProfile: {
          isCompanyVerified: false,
          emailVerified: false,
          phoneVerified: false,
        },
        clientHistory: {
          totalListings: 5,
          closedListings: 5,
          matchedEngagements: 0, // 0 hires out of 5!
          hireRateRaw: 0,
          hireRateBayesian: 0.25,
          isFirstTimeClient: false,
          unreviewedOffersCount: 9, // 9 proposals left unreviewed
        },
      };

      const result = HiringIntentEngine.evaluateHiringIntent(input);

      expect(result.isFirstTimeClient).toBe(false);
      expect(result.level).toBe("PRICE_CHECK_RISK" as HiringIntentLevel);
      expect(result.overallScore).toBeLessThan(50);
      expect(result.badgeLabelTr).toContain("Piyasa Yoklama Riski");

      const penaltyIds = result.penaltiesApplied.map((p) => p.id);
      expect(penaltyIds).toContain("SERIAL_GHOST_ABANDONMENT");
      expect(penaltyIds).toContain("EXTREME_LOWBALL_BUDGET");
    });

    it("should penalize extreme lowball budget (< 15% of median) with EXTREME_LOWBALL_BUDGET", () => {
      const input: HiringIntentEvaluationInput = {
        listingId: "listing-lowball-1",
        title: "Büyük Kurumsal CRM Sistemi",
        summary: "Mikroservis mimarisinde kurumsal CRM.",
        scope: "Büyük çaplı CRM sistemi kodlanacak, mikroservis mimarisi kurulacak, Kafka ve Redis kullanılacak.",
        clarityScore: 80,
        budgetMin: 2000,
        budgetMax: 2500, // Market median is 50,000 -> 2500 is only 5% of median!
        budgetCurrency: "TRY",
        categoryBenchmark: {
          hasBenchmark: true,
          sampleCount: 12,
          min: 40000,
          median: 50000,
          max: 70000,
        },
        ownerProfile: {
          isCompanyVerified: true,
          companyType: "LTD",
          companyName: "Test Ltd.",
        },
        clientHistory: {
          totalListings: 1,
          closedListings: 1,
          matchedEngagements: 1,
          hireRateRaw: 1.0,
          hireRateBayesian: 0.75,
          isFirstTimeClient: false,
        },
      };

      const result = HiringIntentEngine.evaluateHiringIntent(input);
      const lowballPenalty = result.penaltiesApplied.find((p) => p.id === "EXTREME_LOWBALL_BUDGET");
      expect(lowballPenalty).toBeDefined();
      expect(lowballPenalty?.pointsDeducted).toBe(15);
      expect(result.pillars.BUDGET_BENCHMARK.score).toBeLessThanOrEqual(5);
    });
  });

  describe("5. Platform Cold-Start & Sparse Benchmark Categories", () => {
    it("should award neutral high score (22/25) without penalty when category has < 3 projects", () => {
      const input: HiringIntentEvaluationInput = {
        listingId: "listing-sparse-1",
        title: "Kuantum Hesaplama Simülasyonu",
        summary: "Kuantum algoritmaları araştırma projesi.",
        scope: "Kuantum hesaplama algoritmaları üzerine araştırma ve simülasyon projesi. Qiskit kütüphanesi kullanılacaktır.",
        clarityScore: 88,
        budgetMin: 40000,
        budgetMax: 50000,
        budgetCurrency: "TRY",
        categoryBenchmark: {
          hasBenchmark: false, // Sparse category!
          sampleCount: 1,
        },
        ownerProfile: {
          isCompanyVerified: true,
          companyType: "AS",
          companyName: "Kuantum Lab A.Ş.",
          websiteUrl: "https://kuantumlab.com",
        },
        clientHistory: {
          totalListings: 0,
          closedListings: 0,
          matchedEngagements: 0,
          hireRateRaw: 0,
          hireRateBayesian: 0.67,
          isFirstTimeClient: true,
        },
      };

      const result = HiringIntentEngine.evaluateHiringIntent(input);

      expect(result.pillars.BUDGET_BENCHMARK.score).toBe(22);
      expect(result.penaltiesApplied).toHaveLength(0);
      expect(result.level).toBe("VERIFIED_NEW_CLIENT" as HiringIntentLevel);
      expect(result.overallScore).toBeGreaterThanOrEqual(88);
    });
  });

  describe("6. Corporate Verification Nuances & Legal Identity", () => {
    it("should score A.Ş. with corporate website higher than sole proprietorship or unverified individual", () => {
      const baseInput: HiringIntentEvaluationInput = {
        listingId: "test-corp",
        title: "Yazılım Geliştirme",
        summary: "Modül geliştirme işi.",
        scope: "Test scope description with clear requirements and milestone delivery.",
        clarityScore: 80,
        budgetMin: 35000,
        budgetMax: 45000,
        budgetCurrency: "TRY",
        categoryBenchmark: { hasBenchmark: true, sampleCount: 10, min: 30000, median: 35000, max: 45000 },
        clientHistory: { totalListings: 0, closedListings: 0, matchedEngagements: 0, hireRateRaw: 0, hireRateBayesian: 0.67, isFirstTimeClient: true },
      };

      const asResult = HiringIntentEngine.evaluateHiringIntent({
        ...baseInput,
        ownerProfile: {
          isCompanyVerified: true,
          companyType: "AS",
          websiteUrl: "https://example.com",
        },
      });

      const sahisResult = HiringIntentEngine.evaluateHiringIntent({
        ...baseInput,
        ownerProfile: {
          isCompanyVerified: true,
          companyType: "SAHIS",
        },
      });

      const unverifiedResult = HiringIntentEngine.evaluateHiringIntent({
        ...baseInput,
        ownerProfile: {
          isCompanyVerified: false,
        },
      });

      expect(asResult.pillars.CORPORATE_VERIFICATION.score).toBe(30); // 20 + 5 + 5
      expect(sahisResult.pillars.CORPORATE_VERIFICATION.score).toBe(23); // 20 + 3
      expect(unverifiedResult.pillars.CORPORATE_VERIFICATION.score).toBe(6); // unverified
      expect(asResult.overallScore).toBeGreaterThan(sahisResult.overallScore);
      expect(sahisResult.overallScore).toBeGreaterThan(unverifiedResult.overallScore);
    });
  });

  describe("7. Multi-language Localization (TR vs EN)", () => {
    it("should provide Turkish and English badge labels and summaries in the breakdown", () => {
      const input: HiringIntentEvaluationInput = {
        listingId: "listing-loc-tr",
        title: "Frontend Entegrasyon",
        summary: "Kurumsal panel frontend geliştirmesi.",
        scope: "Frontend kodlama ve entegrasyon çalışması. React ve Tailwind kullanılacaktır.",
        clarityScore: 60,
        budgetMin: 10000,
        budgetMax: 12000,
        budgetCurrency: "TRY",
        categoryBenchmark: { hasBenchmark: true, sampleCount: 10, min: 20000, median: 28000, max: 35000 },
        ownerProfile: { isCompanyVerified: false, emailVerified: true, phoneVerified: true },
        clientHistory: { totalListings: 0, closedListings: 0, matchedEngagements: 0, hireRateRaw: 0, hireRateBayesian: 0.67, isFirstTimeClient: true },
      };

      const result = HiringIntentEngine.evaluateHiringIntent(input);
      expect(result.badgeLabelTr).toContain("Niyet");
      expect(result.badgeLabelEn).toContain("Intent");
      expect(result.summaryTr.length).toBeGreaterThan(10);
      expect(result.summaryEn.length).toBeGreaterThan(10);
      expect(result.freelancerGuidanceTr.length).toBeGreaterThan(20);
      expect(result.freelancerGuidanceEn.length).toBeGreaterThan(20);
      expect(result.clientTipsTr.length).toBeGreaterThanOrEqual(1);
      expect(result.clientTipsEn.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("8. HiringIntentService Integration & Fallbacks", () => {
    it("should evaluate live input using HiringIntentService.evaluateLiveInput", () => {
      const input: HiringIntentEvaluationInput = {
        listingId: "live-test-1",
        title: "Test Fullstack Proje",
        summary: "Canlı test senaryosu",
        scope: "Uçtan uca test kapsamı",
        budgetMin: 30000,
        budgetMax: 40000,
      };

      const breakdown = HiringIntentService.evaluateLiveInput(input);
      expect(breakdown.listingId).toBe("live-test-1");
      expect(breakdown.overallScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.overallScore).toBeLessThanOrEqual(100);
      expect(breakdown.pillars).toBeDefined();
    });

    it("should safely compute client historical metrics with fallback", async () => {
      const metrics = await HiringIntentService.getClientHistoricalMetrics("user-test-fallback-999");
      expect(metrics.totalListings).toBe(0);
      expect(metrics.closedListings).toBe(0);
      expect(metrics.matchedEngagements).toBe(0);
      expect(metrics.isFirstTimeClient).toBe(true);
      expect(metrics.hireRateBayesian).toBe(0.67);
    });

    it("should safely evaluate listing hiring intent with fallback when listing does not exist", async () => {
      const breakdown = await HiringIntentService.getListingHiringIntent("non-existent-listing-id", "tr");
      expect(breakdown.listingId).toBe("non-existent-listing-id");
      expect(breakdown.overallScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.badgeLabelTr).toBeDefined();
    });
  });
});
