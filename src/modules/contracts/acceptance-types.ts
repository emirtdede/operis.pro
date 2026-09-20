/**
 * Operis Acceptance Engine & Scope Interview Types
 *
 * Types for deterministic requirements elicitation, domain archetype classification,
 * dual-layer acceptance criteria synthesis (Plain Turkish & Gherkin BDD),
 * and statutory TBK 470/474 milestone binding.
 */

export type ScopeArchetype =
  | "SAAS_B2B_DASHBOARD"
  | "E_COMMERCE_MARKETPLACE"
  | "MOBILE_ON_DEMAND"
  | "FINTECH_PAYMENTS"
  | "CONTENT_PORTFOLIO_LANDING"
  | "AI_AGENT_AUTOMATION"
  | "API_BACKEND_INTEGRATION"
  | "CUSTOM_GENERAL";

export interface ArchetypeProfile {
  archetype: ScopeArchetype;
  labelTr: string;
  labelEn: string;
  descriptionTr: string;
  descriptionEn: string;
  iconName: string;
  keywords: string[];
}

export interface ScopeInterviewOption {
  value: string;
  labelTr: string;
  labelEn: string;
  descriptionTr?: string;
  descriptionEn?: string;
  suggestedTags?: string[];
}

export interface ScopeInterviewQuestion {
  slotKey: string;
  titleTr: string;
  titleEn: string;
  subtitleTr: string;
  subtitleEn: string;
  options: ScopeInterviewOption[];
  defaultOptionValue: string;
}

export interface ScopeInterviewAnswers {
  [slotKey: string]: string;
}

export interface ContractAcceptanceCriterion {
  id: string;
  slotKey?: string;
  phaseNumber: number; // 1, 2, 3
  category: "AUTH_SECURITY" | "DATA_INTEGRATION" | "CORE_LOGIC" | "OUTPUT_REPORTING" | "DELIVERY_QUALITY";
  // Layer 1: Son Kullanıcı Sade Dili (Human-friendly plain Turkish)
  humanCriterionTr: string;
  humanCriterionEn: string;
  // Layer 2: BDD / Gherkin Sözleşme Kuralı (Given-When-Then specification)
  gherkinGivenTr: string;
  gherkinWhenTr: string;
  gherkinThenTr: string;
  gherkinGivenEn: string;
  gherkinWhenEn: string;
  gherkinThenEn: string;
  isMandatory: boolean;
}

export interface SynthesizedScopePackage {
  archetype: ScopeArchetype;
  archetypeLabel: string;
  detectedConfidence: number; // 0 to 100
  answers: ScopeInterviewAnswers;
  criteria: ContractAcceptanceCriterion[];
  suggestedMilestones: Array<{
    phase: number;
    titleTr: string;
    titleEn: string;
    percentage: number;
    criteriaCount: number;
    descriptionTr: string;
    descriptionEn: string;
  }>;
  summaryBulletPointsTr: string[];
  summaryBulletPointsEn: string[];
  contractAnnexMarkdownTr: string;
  contractAnnexMarkdownEn: string;
}

export interface EvaluateRevisionCriteriaInput {
  criteria: ContractAcceptanceCriterion[];
  evaluations: Record<string, { passed: boolean; failureReason?: string }>;
}

export interface EvaluateRevisionCriteriaResult {
  allPassed: boolean;
  totalCount: number;
  passedCount: number;
  failedCount: number;
  failedCriteria: Array<{
    id: string;
    humanCriterionTr: string;
    failureReason: string;
  }>;
  isValidForRevision: boolean;
  validationError?: string;
}
