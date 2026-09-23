import { and, eq, gte, ne, or } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { getDeterministicUuid } from "./service";

export interface MarketBenchmarkResult {
  hasBenchmark: boolean;
  sampleCount: number;
  timeWindowDays: number;
  currency: string;
  min?: number;
  median?: number;
  max?: number;
  formattedRangeTr?: string;
  formattedRangeEn?: string;
  messageTr: string;
  messageEn: string;
}

export const MIN_BENCHMARK_SAMPLE_SIZE = 3;

interface CacheEntry {
  result: MarketBenchmarkResult;
  expiresAt: number;
}

const benchmarkCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class CategoryBenchmarkService {
  /**
   * Clears in-memory benchmark cache (useful in testing or cache invalidation).
   */
  static clearCache() {
    benchmarkCache.clear();
  }

  /**
   * Calculates linear quantile (percentile) on a sorted numeric array.
   */
  static quantile(sorted: number[], q: number): number {
    if (sorted.length === 0) return 0;
    const first = sorted[0];
    if (first === undefined) return 0;
    if (sorted.length === 1) return first;
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    const baseVal = sorted[base] ?? 0;
    const nextVal = sorted[base + 1];
    if (nextVal !== undefined) {
      return baseVal + rest * (nextVal - baseVal);
    }
    return baseVal;
  }

  /**
   * Rounds raw numbers to clean human-friendly marketplace pricing brackets.
   */
  static roundClean(amount: number, currency: string): number {
    if (currency === "TRY") {
      if (amount < 10000) return Math.max(500, Math.round(amount / 250) * 250);
      if (amount < 50000) return Math.round(amount / 500) * 500;
      return Math.round(amount / 1000) * 1000;
    }
    if (amount < 1000) return Math.max(25, Math.round(amount / 25) * 25);
    return Math.round(amount / 50) * 50;
  }

  /**
   * Computes Tukey's IQR (P25 - P75) benchmark with outlier filtering.
   * If sample size is strictly below MIN_BENCHMARK_SAMPLE_SIZE, returns hasBenchmark = false.
   * ZERO mock/test data is ever returned.
   */
  static calculateIqrBenchmark(
    rates: number[],
    currency: string = "TRY",
    days: number = 30
  ): MarketBenchmarkResult {
    const validRates = rates.filter((r) => typeof r === "number" && !isNaN(r) && r > 0);

    if (validRates.length < MIN_BENCHMARK_SAMPLE_SIZE) {
      return {
        hasBenchmark: false,
        sampleCount: validRates.length,
        timeWindowDays: days,
        currency,
        messageTr: `Bu kategoride son ${days} günde henüz yeterli eşleşme verisi oluşmadı (Gerçek projeler eşleştikçe piyasa rehberi otomatik olarak açılacaktır).`,
        messageEn: `Insufficient matched project data in this category for the last ${days} days (Market benchmarks will activate as real projects are matched).`,
      };
    }

    const sorted = [...validRates].sort((a, b) => a - b);
    const q1 = this.quantile(sorted, 0.25);
    const q3 = this.quantile(sorted, 0.75);
    const iqr = q3 - q1;

    // Tukey's fences for extreme outlier removal
    const lowerFence = Math.max(0, q1 - 1.5 * iqr);
    const upperFence = q3 + 1.5 * iqr;

    const cleanRates = sorted.filter((r) => r >= lowerFence && r <= upperFence);
    const computationSet = cleanRates.length >= MIN_BENCHMARK_SAMPLE_SIZE ? cleanRates : sorted;

    const p25 = this.quantile(computationSet, 0.25);
    const p50 = this.quantile(computationSet, 0.5);
    const p75 = this.quantile(computationSet, 0.75);

    const min = this.roundClean(p25, currency);
    const median = this.roundClean(p50, currency);
    let max = this.roundClean(p75, currency);

    if (max <= min) {
      max = this.roundClean(min * 1.3, currency);
      if (max <= min) {
        max = min + (currency === "TRY" ? 1000 : 50);
      }
    }

    const symbolMap: Record<string, string> = {
      TRY: "₺",
      USD: "$",
      EUR: "€",
      GBP: "£",
    };
    const symbol = symbolMap[currency] || currency;

    const formattedRangeTr = `${min.toLocaleString("tr-TR")} ${symbol} - ${max.toLocaleString("tr-TR")} ${symbol}`;
    const formattedRangeEn =
      currency === "TRY"
        ? `${min.toLocaleString("en-US")} TRY - ${max.toLocaleString("en-US")} TRY`
        : `${symbol}${min.toLocaleString("en-US")} - ${symbol}${max.toLocaleString("en-US")}`;

    return {
      hasBenchmark: true,
      sampleCount: validRates.length,
      timeWindowDays: days,
      currency,
      min,
      median,
      max,
      formattedRangeTr,
      formattedRangeEn,
      messageTr: `Bu kategoride son ${days} günde eşleşen projelerin ortalama bütçe aralığı: ${formattedRangeTr}`,
      messageEn: `Typical market budget benchmark for matched projects in this category (last ${days} days): ${formattedRangeEn}`,
    };
  }

  /**
   * Fetches real matched engagement budgets for a category and computes the market benchmark.
   * Employs 5-minute TTL caching to avoid redundant heavy queries.
   */
  static async getCategoryMarketBenchmark(params: {
    categoryId?: string | null;
    categorySlug?: string | null;
    currency?: string;
    days?: number;
  }): Promise<MarketBenchmarkResult> {
    const currency = (params.currency || "TRY").toUpperCase().trim();
    const days = Math.min(Math.max(params.days || 30, 7), 180);

    const resolvedCatId = params.categoryId || (params.categorySlug ? getDeterministicUuid(params.categorySlug) : "");
    const cacheKey = `${resolvedCatId}:${params.categorySlug || ""}:${currency}:${days}`;

    const cached = benchmarkCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    try {
      const db = getDb();
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Build category match condition
      const categoryFilters = [];
      if (params.categoryId) {
        categoryFilters.push(eq(schema.listings.categoryId, params.categoryId));
      }
      if (params.categorySlug) {
        const catUuid = getDeterministicUuid(params.categorySlug);
        categoryFilters.push(eq(schema.listings.categoryId, catUuid));
      }

      // Query real matched engagements in the lookback window
      const query = db
        .select({
          engagementId: schema.engagements.id,
          offerBudgetMin: schema.offers.budgetMin,
          offerBudgetMax: schema.offers.budgetMax,
          offerBudgetCurrency: schema.offers.budgetCurrency,
          listingBudgetMin: schema.listings.budgetMin,
          listingBudgetMax: schema.listings.budgetMax,
          listingBudgetCurrency: schema.listings.budgetCurrency,
        })
        .from(schema.engagements)
        .innerJoin(schema.listings, eq(schema.engagements.listingId, schema.listings.id))
        .innerJoin(schema.offers, eq(schema.engagements.acceptedOfferId, schema.offers.id))
        .where(
          and(
            ne(schema.engagements.status, "CANCELLED"),
            gte(schema.engagements.matchedAt, cutoffDate),
            or(
              eq(schema.offers.budgetCurrency, currency),
              eq(schema.listings.budgetCurrency, currency)
            ),
            categoryFilters.length > 0 ? or(...categoryFilters) : undefined
          )
        );

      const rows = await query;

      const rates: number[] = [];
      for (const r of rows) {
        const oMin = r.offerBudgetMin ? Number(r.offerBudgetMin) : null;
        const oMax = r.offerBudgetMax ? Number(r.offerBudgetMax) : null;
        if (oMin !== null && oMin !== undefined && oMax !== null && oMax !== undefined && oMin > 0 && oMax > 0) {
          rates.push((oMin + oMax) / 2);
          continue;
        }
        if (oMin !== null && oMin !== undefined && oMin > 0) {
          rates.push(oMin);
          continue;
        }
        if (oMax !== null && oMax !== undefined && oMax > 0) {
          rates.push(oMax);
          continue;
        }

        // Fallback to listing budget bounds
        const lMin = r.listingBudgetMin ? Number(r.listingBudgetMin) : null;
        const lMax = r.listingBudgetMax ? Number(r.listingBudgetMax) : null;
        if (lMin !== null && lMin !== undefined && lMax !== null && lMax !== undefined && lMin > 0 && lMax > 0) {
          rates.push((lMin + lMax) / 2);
          continue;
        }
        if (lMin !== null && lMin !== undefined && lMin > 0) {
          rates.push(lMin);
          continue;
        }
        if (lMax !== null && lMax !== undefined && lMax > 0) {
          rates.push(lMax);
        }
      }

      const result = this.calculateIqrBenchmark(rates, currency, days);
      benchmarkCache.set(cacheKey, {
        result,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      return result;
    } catch {
      // If DB is offline or unseeded in tests, strictly return hasBenchmark = false
      const fallbackResult: MarketBenchmarkResult = {
        hasBenchmark: false,
        sampleCount: 0,
        timeWindowDays: days,
        currency,
        messageTr: `Bu kategoride son ${days} günde henüz yeterli eşleşme verisi oluşmadı (Gerçek projeler eşleştikçe piyasa rehberi otomatik olarak açılacaktır).`,
        messageEn: `Insufficient matched project data in this category for the last ${days} days (Market benchmarks will activate as real projects are matched).`,
      };
      return fallbackResult;
    }
  }
}
