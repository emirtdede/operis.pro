/**
 * Operis Smart Contract Recommendation Engine Types
 *
 * Evaluates listing and engagement properties to recommend only the necessary
 * bilateral agreements, avoiding contract bloat while allowing optional add-ons.
 *
 * Core Statutory Foundations:
 * - 6098 Sayılı TBK m. 26 (Sözleşme Özgürlüğü - Sözleşmeler tamamen opsiyoneldir)
 * - 6098 Sayılı TBK m. 470 vd. (Eser Sözleşmesi)
 * - 5846 Sayılı FSEK m. 52 (Fikri Mülkiyet ve Mali Hak Devri)
 * - 6698 Sayılı KVKK m. 12 & GDPR Art. 28 (Veri İşleme)
 * - 193 Sayılı GVK m. 89/13 & 3065 Sayılı KDVK m. 11/1-a (Yazılım İhracatı)
 * - 5651 Sayılı Kanun m. 8-9 (Yer Sağlayıcı Platform Sorumsuzluğu)
 */

export type ContractTypeId =
  | "CORE_SERVICE"
  | "FSEK_IP_TRANSFER"
  | "BILATERAL_NDA"
  | "KVKK_DPA"
  | "SAFE_HARBOR"
  | "AI_GOVERNANCE"
  | "SOFTWARE_EXPORT"
  | "INFLATION_SHIELD"
  | "SMART_RETAINER_SLA"
  | "SQUAD_CONSORTIUM"
  | "CYBER_SECURITY_CLEAN_CODE"
  | "FOSS_LICENSE_COMPLIANCE"
  | "NON_SOLICITATION"
  | "MUTUAL_RELEASE_DISCHARGE"
  | "TERMINATION_LIQUIDATION";

export type RecommendationStatus = "RECOMMENDED" | "OPTIONAL" | "NOT_APPLICABLE";

export interface ContractCatalogItem {
  id: ContractTypeId;
  titleTr: string;
  titleEn: string;
  categoryTr: string;
  categoryEn: string;
  descriptionTr: string;
  descriptionEn: string;
  statutoryBasisTr: string;
  statutoryBasisEn: string;
  isBaseAgreement: boolean;
  estimatedPages: number;
}

export interface ContractRecommendationItem extends ContractCatalogItem {
  status: RecommendationStatus;
  isSelectedByDefault: boolean;
  recommendationReasonTr: string;
  recommendationReasonEn: string;
  relevanceScore: number; // 0 to 100
  tags: string[];
}

export interface ContractRecommendationInput {
  engagementId?: string;
  listingTitle?: string;
  categorySlug?: string;
  categoryName?: string;
  budgetCurrency?: string | null;
  budgetMin?: number | string | null;
  budgetMax?: number | string | null;
  budgetMode?: string | null;
  timelineDays?: number | null;
  timelineMode?: string | null;
  scopeSummary?: string | null;
  tags?: string[];
  isCorporateClient?: boolean;
  companyType?: string | null;
  isSquadEngagement?: boolean;
  hasForeignClient?: boolean;
  answers?: Record<string, unknown>;
  locale?: string;
}

export interface ContractRecommendationResult {
  recommendedContracts: ContractRecommendationItem[];
  allContracts: ContractRecommendationItem[];
  selectedCount: number;
  totalAvailableCount: number;
  platformSafeHarborNoticeTr: string;
  platformSafeHarborNoticeEn: string;
  isOptionalBilateralNoticeTr: string;
  isOptionalBilateralNoticeEn: string;
}
