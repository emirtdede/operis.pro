import { eq } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { HiringIntentEngine } from "./hiring-intent-engine";
import type {
  ClientHistoricalMetrics,
  HiringIntentBreakdown,
  HiringIntentEvaluationInput,
} from "./hiring-intent-types";
import { CategoryBenchmarkService } from "@/src/modules/categories/benchmark-service";
import { inMemoryListings } from "@/src/modules/listings/service";

export class HiringIntentService {
  /**
   * Evaluates Hiring Intent for an in-flight or draft listing input.
   */
  static evaluateLiveInput(input: HiringIntentEvaluationInput): HiringIntentBreakdown {
    return HiringIntentEngine.evaluateHiringIntent(input);
  }

  /**
   * Retrieves historical hiring stats for an employer account.
   */
  static async getClientHistoricalMetrics(userId: string): Promise<ClientHistoricalMetrics> {
    try {
      const db = getDb();

      // Query past listings by this owner
      const userListings = await db
        .select({
          id: schema.listings.id,
          status: schema.listings.status,
        })
        .from(schema.listings)
        .where(eq(schema.listings.ownerUserId, userId));

      const totalListings = userListings.length;
      const closedStatuses = ["MATCHED", "COMPLETED", "INACTIVE_EXPIRED", "CANCELLED_MATCH"];
      const matchedStatuses = ["MATCHED", "COMPLETED"];

      const closedListings = userListings.filter((l) => closedStatuses.includes(l.status)).length;
      const matchedEngagements = userListings.filter((l) => matchedStatuses.includes(l.status)).length;

      const { bayesianRate, rawRate } = HiringIntentEngine.calculateBayesianHireRate(
        matchedEngagements,
        closedListings
      );

      return {
        totalListings,
        closedListings,
        matchedEngagements,
        hireRateRaw: rawRate,
        hireRateBayesian: bayesianRate,
        isFirstTimeClient: totalListings === 0 || closedListings === 0,
      };
    } catch {
      // In-memory or testing fallback
      const inMem = inMemoryListings.filter((l) => l.ownerUserId === userId);
      const total = inMem.length;
      const matched = inMem.filter((l) => l.status === "MATCHED" || l.status === "COMPLETED").length;
      const closed = inMem.filter(
        (l) =>
          l.status === "MATCHED" ||
          l.status === "COMPLETED" ||
          l.status === "INACTIVE_EXPIRED"
      ).length;

      const { bayesianRate, rawRate } = HiringIntentEngine.calculateBayesianHireRate(matched, closed);

      return {
        totalListings: total,
        closedListings: closed,
        matchedEngagements: matched,
        hireRateRaw: rawRate,
        hireRateBayesian: bayesianRate,
        isFirstTimeClient: total === 0 || closed === 0,
      };
    }
  }

  /**
   * Fetches all signals for a persisted listing and evaluates its Hiring Intent Index.
   */
  static async getListingHiringIntent(
    listingId: string,
    locale: string = "tr"
  ): Promise<HiringIntentBreakdown> {
    try {
      const db = getDb();

      // 1. Fetch listing details
      const listingRows = await db
        .select()
        .from(schema.listings)
        .where(eq(schema.listings.id, listingId))
        .limit(1);

      const listing = listingRows[0];
      if (!listing) {
        // Check in-memory fallback
        const inMem = inMemoryListings.find((l) => l.id === listingId);
        if (inMem) {
          return this.evaluateLiveInput({
            listingId: inMem.id,
            title: inMem.title,
            summary: inMem.summary,
            scope: inMem.scope,
            tags: inMem.tags,
            budgetMin: inMem.budgetMin,
            budgetMax: inMem.budgetMax,
            budgetCurrency: inMem.budgetCurrency,
            budgetMode: inMem.budgetMode,
            locale,
          });
        }
        throw new Error("İlan bulunamadı.");
      }

      // 2. Fetch owner profile & company verification
      const profileRows = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, listing.ownerUserId))
        .limit(1);

      const profile = profileRows[0];

      // 3. Fetch client history
      const history = await this.getClientHistoricalMetrics(listing.ownerUserId);

      // 4. Fetch category market benchmark
      const benchmark = await CategoryBenchmarkService.getCategoryMarketBenchmark({
        categoryId: listing.categoryId,
        currency: listing.budgetCurrency || "TRY",
        days: 60,
      });

      // 5. Evaluate Hiring Intent Index
      return HiringIntentEngine.evaluateHiringIntent({
        listingId: listing.id,
        title: listing.title,
        summary: listing.summary,
        scope: listing.scope,
        tags: listing.tags,
        answers: (listing.answersJson as Record<string, unknown>) || {},
        budgetMode: listing.budgetMode,
        budgetCurrency: listing.budgetCurrency,
        budgetMin: listing.budgetMin,
        budgetMax: listing.budgetMax,
        categoryBenchmark: benchmark,
        ownerProfile: profile
          ? {
              isCompanyVerified: profile.isCompanyVerified,
              companyName: profile.companyName,
              companyType: profile.companyType,
              taxOffice: profile.taxOffice,
              vknMasked: profile.vknMasked,
            }
          : null,
        clientHistory: history,
        locale,
      });
    } catch {
      // Return safe standard evaluation if DB fails or in-memory testing
      return HiringIntentEngine.evaluateHiringIntent({
        listingId,
        title: "Yazılım ve Teknoloji Projesi",
        summary: "Proje detayları ve gereksinimleri.",
        scope: "Proje kapsamı ve teknik isterler.",
        locale,
      });
    }
  }
}
