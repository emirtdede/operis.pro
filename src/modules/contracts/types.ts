import { ContractAcceptanceCriterion } from "./acceptance-types";
import type { InflationShieldConfig } from "../finance/inflation-hedging";
import type { DpaContractConfig, DpaRiskEvaluation } from "./dpa-types";
import type { SafeHarborConfig, SafeHarborEvaluation } from "./safe-harbor-types";
import type { AiGovernanceConfig, AiGovernanceEvaluation } from "./ai-governance-types";
import type {
  SoftwareExportConfig,
  SoftwareExportEvaluation,
} from "../finance/software-export-types";
export * from "./dpa-types";
export * from "./safe-harbor-types";
export * from "./ai-governance-types";
export * from "../finance/software-export-types";
export * from "./comprehensive-deed-types";

export type ContractLanguage = "tr" | "en" | "bilingual";

export interface BilingualClausePair {
  id: string;
  articleNumber?: string;
  titleTr: string;
  titleEn: string;
  bodyTr: string;
  bodyEn: string;
  badgeTr?: string;
  badgeEn?: string;
}

export interface BilingualContractDocument {
  contractRef: string;
  sha256Fingerprint: string;
  generatedAt: string;
  prevalenceLanguage: "tr" | "en";
  clauses: BilingualClausePair[];
  htmlContent: string;
  markdown: string;
  isWhiteLabel?: boolean;
}

export interface ContractParty {
  displayName: string;
  email: string;
  phone?: string | null;
  handle?: string;
  city?: string | null;
  role: "CLIENT" | "CONTRACTOR";
}

export interface ContractMilestone {
  phase: number;
  percentage: number;
  titleTr: string;
  titleEn: string;
  descriptionTr: string;
  descriptionEn: string;
  acceptanceCriteria?: ContractAcceptanceCriterion[];
}

export interface ContractSignatureBlock {
  signerName: string;
  signedAt: string;
  ipHash?: string;
  signatureDataUrl?: string;
  sealSha256?: string;
}

export interface ContractGeneratorInput {
  engagementId: string;
  listingTitle: string;
  category: string;
  matchedAt: Date | string;
  scopeSummary: string;
  budgetLabel?: string | null;
  timelineLabel?: string | null;
  client: ContractParty;
  contractor: ContractParty;
  locale?: ContractLanguage;
  revisionLimit?: number;
  inspectionPeriodDays?: number;
  warrantyPeriodDays?: number;
  ndaYears?: number;
  isSquadContract?: boolean;
  squadTitle?: string | null;
  squadMembers?: Array<{
    displayName: string;
    roleTitle: string;
    revenueSharePercentage: number;
    scopeSummary?: string | null;
    isLead?: boolean;
    handleOrEmail?: string | null;
  }> | null;
  milestones?: ContractMilestone[] | null;
  acceptanceCriteria?: ContractAcceptanceCriterion[] | null;
  inflationShield?: InflationShieldConfig | null;
  dpaConfig?: DpaContractConfig | null;
  safeHarborConfig?: SafeHarborConfig | null;
  aiGovernanceConfig?: AiGovernanceConfig | null;
  softwareExportConfig?: SoftwareExportConfig | null;
  cleanCodeConfig?: { repositoryUrl?: string | null; commitHash?: string | null } | null;
  fossConfig?: { repositoryUrl?: string | null; commitHash?: string | null } | null;
  nonSolicitationConfig?: { durationMonths?: number } | null;
  selectedContracts?: string[] | null;
  clientSignature?: ContractSignatureBlock | null;
  contractorSignature?: ContractSignatureBlock | null;
  prevalenceLanguage?: "tr" | "en";
  whiteLabel?: boolean;
}

export interface GeneratedContractResult {
  contractRef: string;
  sha256Fingerprint: string;
  generatedAt: string;
  locale: ContractLanguage;
  prevalenceLanguage?: "tr" | "en";
  isWhiteLabel?: boolean;
  markdown: string;
  plainText: string;
  htmlContent: string;
  bilingualHtmlContent?: string;
  bilingualMarkdown?: string;
  bilingualClauses?: BilingualClausePair[];
  isSquadContract?: boolean;
  squadTitle?: string | null;
  squadMembers?: ContractGeneratorInput["squadMembers"];
  acceptanceCriteria?: ContractAcceptanceCriterion[] | null;
  inflationShield?: InflationShieldConfig | null;
  dpaConfig?: DpaContractConfig | null;
  dpaEvaluation?: DpaRiskEvaluation | null;
  safeHarborConfig?: SafeHarborConfig | null;
  safeHarborEvaluation?: SafeHarborEvaluation | null;
  aiGovernanceConfig?: AiGovernanceConfig | null;
  aiGovernanceEvaluation?: AiGovernanceEvaluation | null;
  softwareExportConfig?: SoftwareExportConfig | null;
  softwareExportEvaluation?: SoftwareExportEvaluation | null;
  metadata: {
    fsekClauseIncluded: boolean;
    tbkClauseIncluded: boolean;
    mediationIncluded: boolean;
    sha256Verified: boolean;
    isWhiteLabel?: boolean;
    isSquadContract?: boolean;
    hasAcceptanceCriteria?: boolean;
    inflationShieldIncluded?: boolean;
    dpaIncluded?: boolean;
    safeHarborIncluded?: boolean;
    aiGovernanceIncluded?: boolean;
    softwareExportIncluded?: boolean;
    cleanCodeWarrantyIncluded?: boolean;
    fossComplianceIncluded?: boolean;
    nonSolicitationIncluded?: boolean;
    mutualReleaseIncluded?: boolean;
    terminationLiquidationIncluded?: boolean;
  };
}

export interface HandoverParty {
  displayName: string;
  email: string;
  phone?: string | null;
  handle?: string;
  city?: string | null;
}

export interface AccessTransferChecklist {
  dnsTransferred: boolean;
  hostingTransferred: boolean;
  adminAccountsTransferred: boolean;
  apiKeysTransferred: boolean;
}

export type ChangeRequestReason =
  "CLIENT_REQUESTED" | "TECHNICAL_NECESSITY" | "SCOPE_DISCOVERY" | "UNFORESEEN_COMPLICATION";

export interface AddendumGeneratorInput {
  engagementId: string;
  sequenceNumber: number;
  parentContractRef: string;
  parentContractSha256: string;
  listingTitle: string;
  client: ContractParty;
  contractor: ContractParty;
  title: string;
  description: string;
  reason: ChangeRequestReason;
  additionalBudget: number;
  currency: string;
  additionalDays: number;
  matchedAt: Date | string;
  locale?: ContractLanguage;
}

export interface GeneratedAddendumResult {
  addendumRef: string;
  parentContractRef: string;
  parentContractSha256: string;
  addendumSha256: string;
  sequenceNumber: number;
  generatedAt: string;
  locale: ContractLanguage;
  markdown: string;
  plainText: string;
  htmlContent: string;
}
