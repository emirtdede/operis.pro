import { describe, it, expect, beforeEach } from "vitest";
import {
  CategoryBenchmarkService,
  MIN_BENCHMARK_SAMPLE_SIZE,
} from "@/src/modules/categories/benchmark-service";

describe("Category Market Rate Benchmark Engine", () => {
  beforeEach(() => {
    CategoryBenchmarkService.clearCache();
  });

  describe("Zero-Mock / Cold-Start Policy (N < 3)", () => {
    it("returns hasBenchmark: false when rates array is empty", () => {
      const res = CategoryBenchmarkService.calculateIqrBenchmark([], "TRY", 30);
      expect(res.hasBenchmark).toBe(false);
      expect(res.sampleCount).toBe(0);
      expect(res.min).toBeUndefined();
      expect(res.max).toBeUndefined();
      expect(res.messageTr).toContain("yeterli eşleşme verisi oluşmadı");
      expect(res.messageEn).toContain("Insufficient matched project data");
    });

    it("returns hasBenchmark: false when sample size is 1 or 2", () => {
      const res1 = CategoryBenchmarkService.calculateIqrBenchmark([30000], "TRY", 30);
      expect(res1.hasBenchmark).toBe(false);
      expect(res1.sampleCount).toBe(1);

      const res2 = CategoryBenchmarkService.calculateIqrBenchmark([25000, 35000], "TRY", 30);
      expect(res2.hasBenchmark).toBe(false);
      expect(res2.sampleCount).toBe(2);
    });

    it("filters out invalid rates (zero, negative, NaN) before evaluating sample count", () => {
      const res = CategoryBenchmarkService.calculateIqrBenchmark([0, -5000, NaN, 25000], "TRY", 30);
      expect(res.hasBenchmark).toBe(false);
      expect(res.sampleCount).toBe(1);
    });

    it("activates benchmark when sample count reaches MIN_BENCHMARK_SAMPLE_SIZE (3)", () => {
      expect(MIN_BENCHMARK_SAMPLE_SIZE).toBe(3);
      const res = CategoryBenchmarkService.calculateIqrBenchmark([20000, 30000, 40000], "TRY", 30);
      expect(res.hasBenchmark).toBe(true);
      expect(res.sampleCount).toBe(3);
      expect(res.min).toBeDefined();
      expect(res.max).toBeDefined();
      expect(res.min).toBeLessThanOrEqual(res.max!);
    });
  });

  describe("Quantile Calculation & Linear Interpolation", () => {
    it("computes exact percentiles on ordered series", () => {
      const sorted = [100, 200, 300, 400, 500];
      expect(CategoryBenchmarkService.quantile(sorted, 0)).toBe(100);
      expect(CategoryBenchmarkService.quantile(sorted, 0.5)).toBe(300);
      expect(CategoryBenchmarkService.quantile(sorted, 1)).toBe(500);
      expect(CategoryBenchmarkService.quantile(sorted, 0.25)).toBe(200);
      expect(CategoryBenchmarkService.quantile(sorted, 0.75)).toBe(400);
    });

    it("handles single-element array without NaN", () => {
      expect(CategoryBenchmarkService.quantile([5000], 0.5)).toBe(5000);
      expect(CategoryBenchmarkService.quantile([], 0.5)).toBe(0);
    });
  });

  describe("Tukey IQR Outlier Trimming", () => {
    it("filters out extreme troll bids (e.g. 10,000,000 TRY) without corrupting benchmark", () => {
      // Normal project budget cluster around 20k - 40k, plus an absurd 10M outlier
      const rates = [20000, 22000, 25000, 28000, 32000, 35000, 40000, 10000000];
      const res = CategoryBenchmarkService.calculateIqrBenchmark(rates, "TRY", 30);

      expect(res.hasBenchmark).toBe(true);
      expect(res.sampleCount).toBe(8);
      // The outlier 10,000,000 should be rejected by upper fence
      expect(res.max).toBeLessThan(100000);
      expect(res.min).toBeGreaterThanOrEqual(15000);
      expect(res.median).toBeGreaterThanOrEqual(20000);
      expect(res.median).toBeLessThanOrEqual(35000);
    });

    it("ensures max is strictly greater than min even if all inputs are identical", () => {
      const identicalRates = [25000, 25000, 25000];
      const res = CategoryBenchmarkService.calculateIqrBenchmark(identicalRates, "TRY", 30);

      expect(res.hasBenchmark).toBe(true);
      expect(res.max).toBeGreaterThan(res.min!);
    });
  });

  describe("Clean Psychological Rounding", () => {
    it("rounds TRY amounts to clean increments", () => {
      // < 10,000 -> 250 steps
      expect(CategoryBenchmarkService.roundClean(7350, "TRY")).toBe(7250);
      expect(CategoryBenchmarkService.roundClean(7400, "TRY")).toBe(7500);
      expect(CategoryBenchmarkService.roundClean(200, "TRY")).toBe(500); // min floor 500

      // 10,000 - 50,000 -> 500 steps
      expect(CategoryBenchmarkService.roundClean(23200, "TRY")).toBe(23000);
      expect(CategoryBenchmarkService.roundClean(23350, "TRY")).toBe(23500);

      // >= 50,000 -> 1000 steps
      expect(CategoryBenchmarkService.roundClean(65400, "TRY")).toBe(65000);
      expect(CategoryBenchmarkService.roundClean(65800, "TRY")).toBe(66000);
    });

    it("rounds USD and EUR to clean increments", () => {
      // < 1,000 -> 25 steps
      expect(CategoryBenchmarkService.roundClean(412, "USD")).toBe(400);
      expect(CategoryBenchmarkService.roundClean(415, "USD")).toBe(425);
      expect(CategoryBenchmarkService.roundClean(10, "USD")).toBe(25); // min floor 25

      // >= 1,000 -> 50 steps
      expect(CategoryBenchmarkService.roundClean(2430, "USD")).toBe(2450);
      expect(CategoryBenchmarkService.roundClean(2420, "USD")).toBe(2400);
    });
  });

  describe("Formatting and Localization", () => {
    it("formats Turkish message with ₺ and tr-TR numbers", () => {
      const res = CategoryBenchmarkService.calculateIqrBenchmark([20000, 30000, 45000, 50000], "TRY", 30);
      expect(res.formattedRangeTr).toContain("₺");
      expect(res.messageTr).toContain("Bu kategoride son 30 günde eşleşen projelerin ortalama bütçe aralığı:");
    });

    it("formats English message with proper currency symbol", () => {
      const resUsd = CategoryBenchmarkService.calculateIqrBenchmark([1000, 1500, 2000, 2500], "USD", 30);
      expect(resUsd.formattedRangeEn).toContain("$");
      expect(resUsd.messageEn).toContain("Typical market budget benchmark");

      const resEur = CategoryBenchmarkService.calculateIqrBenchmark([1000, 1500, 2000, 2500], "EUR", 30);
      expect(resEur.formattedRangeEn).toContain("€");
    });
  });

  describe("Cache & Service Execution", () => {
    it("clears cache via clearCache() without errors", () => {
      expect(() => CategoryBenchmarkService.clearCache()).not.toThrow();
    });

    it("getCategoryMarketBenchmark returns zero-mock fallback when DB is disconnected or empty", async () => {
      const res = await CategoryBenchmarkService.getCategoryMarketBenchmark({
        categoryId: "non-existent-cat-uuid",
        currency: "TRY",
        days: 30,
      });

      expect(res).toBeDefined();
      expect(res.currency).toBe("TRY");
      expect(res.timeWindowDays).toBe(30);
      expect(typeof res.hasBenchmark).toBe("boolean");
      if (!res.hasBenchmark) {
        expect(res.sampleCount).toBeLessThan(MIN_BENCHMARK_SAMPLE_SIZE);
      }
    });
  });
});
