import type { ChangeRequestReason } from "@/src/modules/contracts/types";

export interface ScopeBaselineMilestone {
  title: string;
  description?: string;
}

export interface ScopeBaselineProfile {
  listingTitle: string;
  category?: string;
  technicalScopeSummary?: string; // Contract Madde 2
  acceptanceCriteria?: string[]; // Contract EK-1
  milestones?: ScopeBaselineMilestone[];
  approvedAddendums?: Array<{
    title: string;
    description: string;
  }>;
}

export interface ScopeSentinelAnalysisInput {
  candidateText: string;
  baseline: ScopeBaselineProfile;
  currency?: string; // default "TRY"
  locale?: "tr" | "en";
}

export interface DetectedCreepCapability {
  capabilityKey: string;
  titleTr: string;
  titleEn: string;
  estimatedDays: number;
  estimatedBudget: number; // In currency units
  matchedKeywords: string[];
  category:
    | "PAYMENT"
    | "INTEGRATION"
    | "UI_EXPANSION"
    | "SECURITY_AUTH"
    | "REALTIME"
    | "LOCALIZATION"
    | "INFRASTRUCTURE"
    | "GENERAL";
}

export interface QuickAddendumDraft {
  title: string;
  description: string;
  reason: ChangeRequestReason;
  additionalBudget: number;
  additionalDays: number;
  currency: string;
}

export interface ScopeSentinelResult {
  isScopeCreep: boolean;
  confidence: number; // 0 - 100
  expansionTriggerDetected: boolean;
  detectedTriggerPhrase?: string;
  detectedCapabilities: DetectedCreepCapability[];
  suggestedAdditionalDays: number;
  suggestedAdditionalBudget: number;
  currency: string;
  warningCardMessageTr: string;
  warningCardMessageEn: string;
  statutoryReferenceTr: string;
  statutoryReferenceEn: string;
  quickAddendumDraft: QuickAddendumDraft | null;
}
