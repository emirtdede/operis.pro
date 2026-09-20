/**
 * Operis Hiring Intent Index & Client Trust Score (HII) Types
 *
 * Designed to prevent "Ghost Jobs" (Hayalet İlanlar) where employers post
 * purely for price discovery, resume farming, or without real intent to hire.
 *
 * Features:
 * - Bayesian Beta-Binomial prior ((k+2)/(n+3)) to solve the marketplace cold-start problem.
 * - Dynamic adaptive weighting for new employers with verified VKN/TCKN status.
 * - Integration with Tukey IQR category market benchmarks and scope clarity scoring.
 */

export type HiringIntentLevel =
  | "PROVEN_HIGH_INTENT"       // 85-100: Established verified client with proven track record
  | "VERIFIED_NEW_CLIENT"     // 80-100 (Cold Start): Brand new client with verified VKN and market budget
  | "ACTIVE_HIRING_LIKELY"    // 70-84: Solid real job with good clarity and budget
  | "MODERATE_INTENT"         // 50-69: Missing details or vague budget, proceed with clarity
  | "PRICE_CHECK_RISK";       // 0-49: Suspicious ghost job, severe lowball or serial abandoner

export type PillarType =
  | "CORPORATE_VERIFICATION"
  | "BUDGET_BENCHMARK"
  | "SCOPE_CLARITY"
  | "HISTORICAL_RELIABILITY";

export type PillarStatus = "EXCELLENT" | "GOOD" | "FAIR" | "WARNING";

export interface PillarScore {
  pillar: PillarType;
  nameTr: string;
  nameEn: string;
  score: number;
  maxScore: number;
  weightPercentage: number;
  status: PillarStatus;
  explanationTr: string;
  explanationEn: string;
  signals: string[];
}

export interface ClientHistoricalMetrics {
  totalListings: number;
  closedListings: number;
  matchedEngagements: number;
  hireRateRaw: number;
  hireRateBayesian: number;
  isFirstTimeClient: boolean;
  unreviewedOffersCount?: number;
  daysOnPlatform?: number;
}

export interface HiringIntentEvaluationInput {
  listingId?: string;
  title: string;
  summary: string;
  scope: string;
  tags?: string[];
  answers?: Record<string, unknown>;
  budgetMode?: string;
  budgetCurrency?: string | null;
  budgetMin?: number | string | null;
  budgetMax?: number | string | null;
  categoryKey?: string;
  categoryBenchmark?: {
    min?: number;
    median?: number;
    max?: number;
    hasBenchmark: boolean;
    sampleCount?: number;
    currency?: string;
  } | null;
  ownerProfile?: {
    isCompanyVerified?: boolean;
    companyName?: string | null;
    companyType?: string | null;
    taxOffice?: string | null;
    vknMasked?: string | null;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    websiteUrl?: string | null;
  } | null;
  clientHistory?: ClientHistoricalMetrics | null;
  clarityScore?: number;
  locale?: string;
}

export interface HiringIntentPenalty {
  id: string;
  nameTr: string;
  nameEn: string;
  pointsDeducted: number;
  reasonTr: string;
  reasonEn: string;
}

export interface HiringIntentBreakdown {
  listingId?: string;
  overallScore: number; // 0 - 100
  level: HiringIntentLevel;
  isFirstTimeClient: boolean;
  pillars: Record<PillarType, PillarScore>;
  penaltiesApplied: HiringIntentPenalty[];
  badgeLabelTr: string;
  badgeLabelEn: string;
  shortBadgeLabelTr: string;
  shortBadgeLabelEn: string;
  badgeClass: string;
  dotColor: string;
  summaryTr: string;
  summaryEn: string;
  freelancerGuidanceTr: string;
  freelancerGuidanceEn: string;
  clientTipsTr: string[];
  clientTipsEn: string[];
}
