/**
 * Comprehensive Legal Deeds & Warranties Types
 * 
 * Statutory Foundations:
 * - TBK m. 132 & m. 166, HMK m. 313: Mutual Discharge & Release (İbraname ve Sulh Senedi)
 * - TCK m. 243-245, TBK m. 474-477, ISO 27001 / SOC 2: Clean Code & No-Backdoor Warranty
 * - FSEK m. 52, TBK m. 475: FOSS / Open Source License Contamination Shield
 * - TTK m. 54-55, TBK m. 444-447: Non-Solicitation & Platform Integrity Protocol
 * - TBK m. 484-486, TBK m. 132: Early Termination, Offboarding & Liquidation Deed
 */

export interface ComprehensivePartyInfo {
  userId: string;
  displayName: string;
  email: string;
  phone?: string | null;
  taxOrIdNumber?: string | null;
  companyName?: string | null;
  address?: string | null;
  city?: string | null;
  role: "CLIENT" | "CONTRACTOR";
}

// ============================================================================
// 1. MUTUAL RELEASE & FINAL DISCHARGE DEED (TBK m. 132 / HMK m. 313)
// ============================================================================
export interface SettledMilestoneRecord {
  sequence: number;
  title: string;
  amount: number;
  currency: string;
  paymentReference?: string | null;
  paidConfirmedAt?: string | null;
  dualSeal?: string | null;
  ipDeedId?: string | null;
}

export interface GenerateMutualReleaseInput {
  engagementId: string;
  listingTitle: string;
  client: ComprehensivePartyInfo;
  contractor: ComprehensivePartyInfo;
  settledMilestones: SettledMilestoneRecord[];
  totalSettledAmount: number;
  currency: string;
  customDischargeNotes?: string | null;
  locale?: "tr" | "en";
}

export interface MutualReleaseDeed {
  deedId: string;
  engagementId: string;
  listingTitle: string;
  client: ComprehensivePartyInfo;
  contractor: ComprehensivePartyInfo;
  settledMilestones: SettledMilestoneRecord[];
  totalSettledAmount: number;
  currency: string;
  claimsWaivedTr: string[];
  claimsWaivedEn: string[];
  warrantyExclusionsTr: string[];
  warrantyExclusionsEn: string[];
  statutoryGroundTr: string;
  statutoryGroundEn: string;
  issuedAt: string;
  masterSha256: string;
}

// ============================================================================
// 2. CLEAN CODE & NO-BACKDOOR WARRANTY (TCK m. 243-245 / TBK m. 474)
// ============================================================================
export interface GenerateCleanCodeWarrantyInput {
  engagementId: string;
  listingTitle: string;
  contractor: ComprehensivePartyInfo;
  client: ComprehensivePartyInfo;
  repositoryUrl?: string | null;
  commitHash?: string | null;
  locale?: "tr" | "en";
}

export interface CleanCodeWarranty {
  warrantyId: string;
  engagementId: string;
  listingTitle: string;
  contractor: ComprehensivePartyInfo;
  client: ComprehensivePartyInfo;
  repositoryUrl?: string | null;
  commitHash?: string | null;
  owaspStandards: string[];
  noBackdoorDeclarationTr: string;
  noBackdoorDeclarationEn: string;
  penalLiabilityDeclarationTr: string;
  penalLiabilityDeclarationEn: string;
  liquidatedDamagesPercentage: number;
  statutoryGroundTr: string;
  statutoryGroundEn: string;
  issuedAt: string;
  sha256: string;
}

// ============================================================================
// 3. FOSS & OPEN SOURCE LICENSE CONTAMINATION SHIELD (FSEK m. 52 / TBK m. 475)
// ============================================================================
export interface GenerateFossComplianceInput {
  engagementId: string;
  listingTitle: string;
  contractor: ComprehensivePartyInfo;
  client: ComprehensivePartyInfo;
  repositoryUrl?: string | null;
  commitHash?: string | null;
  locale?: "tr" | "en";
}

export interface FossComplianceWarranty {
  warrantyId: string;
  engagementId: string;
  listingTitle: string;
  contractor: ComprehensivePartyInfo;
  client: ComprehensivePartyInfo;
  repositoryUrl?: string | null;
  commitHash?: string | null;
  permittedLicenses: string[];
  prohibitedLicenses: string[];
  licensePurityDeclarationTr: string;
  licensePurityDeclarationEn: string;
  curePeriodDays: number;
  indemnityClauseTr: string;
  indemnityClauseEn: string;
  statutoryGroundTr: string;
  statutoryGroundEn: string;
  issuedAt: string;
  sha256: string;
}

// ============================================================================
// 4. NON-SOLICITATION & PLATFORM INTEGRITY PROTOCOL (TTK m. 54-55 / TBK m. 444)
// ============================================================================
export interface GenerateNonSolicitationInput {
  engagementId: string;
  listingTitle: string;
  client: ComprehensivePartyInfo;
  contractor: ComprehensivePartyInfo;
  durationMonths?: number;
  locale?: "tr" | "en";
}

export interface NonSolicitationProtocol {
  protocolId: string;
  engagementId: string;
  listingTitle: string;
  client: ComprehensivePartyInfo;
  contractor: ComprehensivePartyInfo;
  durationMonths: number;
  customerProtectionTr: string;
  customerProtectionEn: string;
  antiPoachingTr: string;
  antiPoachingEn: string;
  platformIntegrityTr: string;
  platformIntegrityEn: string;
  statutoryGroundTr: string;
  statutoryGroundEn: string;
  issuedAt: string;
  sha256: string;
}

// ============================================================================
// 5. CONTRACT TERMINATION & ASSET LIQUIDATION DEED (TBK m. 484-486)
// ============================================================================
export type TerminationGround =
  | "MUTUAL_IKALE"
  | "CLIENT_TERMINATION_TBK484"
  | "IMPOSSIBILITY_TBK485"
  | "DISPUTE_SETTLEMENT";

export interface GenerateTerminationLiquidationInput {
  engagementId: string;
  listingTitle: string;
  client: ComprehensivePartyInfo;
  contractor: ComprehensivePartyInfo;
  ground: TerminationGround;
  groundDetailTr?: string;
  groundDetailEn?: string;
  settledMilestones: SettledMilestoneRecord[];
  unfulfilledMilestones: Array<{
    sequence: number;
    title: string;
    amount: number;
    currency: string;
  }>;
  totalSettledAmount: number;
  totalUnfulfilledAmount: number;
  currency: string;
  credentialsReturned?: boolean;
  sourceCodeTransferred?: boolean;
  documentationProvided?: boolean;
  locale?: "tr" | "en";
}

export interface TerminationLiquidationDeed {
  deedId: string;
  engagementId: string;
  listingTitle: string;
  client: ComprehensivePartyInfo;
  contractor: ComprehensivePartyInfo;
  ground: TerminationGround;
  groundDescriptionTr: string;
  groundDescriptionEn: string;
  settledMilestones: SettledMilestoneRecord[];
  unfulfilledMilestones: Array<{
    sequence: number;
    title: string;
    amount: number;
    currency: string;
  }>;
  totalSettledAmount: number;
  totalUnfulfilledAmount: number;
  currency: string;
  retainedIpTermsTr: string;
  retainedIpTermsEn: string;
  offboardingChecklist: {
    credentialsReturned: boolean;
    sourceCodeTransferred: boolean;
    documentationProvided: boolean;
  };
  mutualDischargeTr: string;
  mutualDischargeEn: string;
  statutoryGroundTr: string;
  statutoryGroundEn: string;
  issuedAt: string;
  masterSha256: string;
}
