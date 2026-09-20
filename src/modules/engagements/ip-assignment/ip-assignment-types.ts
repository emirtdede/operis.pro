/**
 * Republic of Turkey Law on Intellectual and Artistic Works (FSEK)
 * Formal IP Assignment Deed & Statutory Economic Rights Transfer Types
 *
 * Statutory Compliance:
 * - 5846 Sayılı FSEK m. 48 (Tasarruf Muamelesi ve Devir Vaadi)
 * - 5846 Sayılı FSEK m. 52 (Mali Hakların Ayrı Ayrı Gösterilmesi ve Yazılı Şekil Şartı)
 * - 5846 Sayılı FSEK m. 21 (İşleme Hakkı)
 * - 5846 Sayılı FSEK m. 22 (Çoğaltma Hakkı)
 * - 5846 Sayılı FSEK m. 23 (Yayma Hakkı)
 * - 5846 Sayılı FSEK m. 24 (Temsil Hakkı)
 * - 5846 Sayılı FSEK m. 25 (Umuma İletim Hakkı)
 * - 6100 Sayılı HMK m. 193 (Münhasır Delil Sözleşmesi)
 * - 6098 Sayılı TBK m. 132 & m. 470
 */

export type FsekEconomicRightCode =
  | "ISLEME_M21"
  | "COGALTMA_M22"
  | "YAYMA_M23"
  | "TEMSIL_M24"
  | "UMUMA_ILETIM_M25";

export interface StatutoryEconomicRight {
  code: FsekEconomicRightCode;
  fsekArticle: string;
  nameTr: string;
  nameEn: string;
  scopeTr: string;
  scopeEn: string;
}

export interface DeedPartyInfo {
  userId: string;
  legalName: string;
  role: "ASSIGNOR" | "ASSIGNEE"; // ASSIGNOR = Specialist/Developer (Devreden), ASSIGNEE = Employer/Company (Devralan)
  vknOrTcknMasked: string;
  vknOrTcknHmac?: string;
  companyName?: string | null;
  taxOffice?: string | null;
  email: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}

export interface DeedPinnedWork {
  repositoryUrl: string;
  gitCommitHash: string;
  branchOrTag?: string | null;
  deliverableUrl?: string | null;
  deliverableUrlType?: string | null;
  artifactSha256?: string | null;
  milestoneSequence: number;
  milestoneTitle: string;
  milestoneDescription: string;
}

export interface DeedConsideration {
  amount: number;
  currency: string;
  paymentReference?: string | null;
  paymentDualSeal: string;
  settlementCertificateId: string;
  invoiceNumber?: string | null;
  settledAt: string;
}

export interface IpAssignmentDeed {
  deedId: string; // e.g. "OPR-IP-DEED-ENG999-M01-XXXX"
  engagementId: string;
  listingTitle: string;
  milestoneId: string;
  issuedAt: string;

  // Parties
  assignor: DeedPartyInfo; // Devreden Yazılımcı
  assignee: DeedPartyInfo; // Devralan İşveren / Şirket

  // Pinned software artifact
  pinnedWork: DeedPinnedWork;

  // Consideration & Handshake Dual-Seal
  consideration: DeedConsideration;

  // The 5 Individually Enumerated Economic Rights (FSEK m. 52)
  transferredRights: StatutoryEconomicRight[];

  // Scope & Terms
  territory: "WORLDWIDE";
  duration: "PERPETUAL_STATUTORY_COPYRIGHT";
  sublicensePermitted: true;
  thirdPartyTransferPermitted: true;

  // Moral Rights Authorizations & Waivers (FSEK m. 14, 15, 16)
  moralRightsWaiverTr: string;
  moralRightsWaiverEn: string;

  // Originality, Clean Title & Non-Infringement Warranty
  originalityWarrantyTr: string;
  originalityWarrantyEn: string;

  // Legal Evidentiary & Jurisdiction Clauses (HMK m. 193)
  evidentiaryClauseTr: string;
  evidentiaryClauseEn: string;
  governingLaw: "REPUBLIC_OF_TURKEY";

  // Master Document Fingerprint
  masterDeedSha256: string;
}

export interface GenerateIpDeedInput {
  engagementId: string;
  listingTitle: string;
  milestoneId: string;
  milestoneSequence: number;
  milestoneTitle: string;
  milestoneDescription: string;
  amount: number;
  currency: string;

  // Work artifact
  repositoryUrl?: string | null;
  gitCommitHash?: string | null;
  branchOrTag?: string | null;
  deliverableUrl?: string | null;
  deliverableUrlType?: string | null;
  artifactSha256?: string | null;

  // Consideration link
  paymentReference?: string | null;
  paymentDualSeal: string;
  settlementCertificateId: string;
  invoiceNumber?: string | null;
  settledAt?: string;

  // Assignor (Specialist)
  assignorUserId: string;
  assignorName: string;
  assignorEmail: string;
  assignorVknOrTckn?: string | null;
  assignorTaxOffice?: string | null;
  assignorAddress?: string | null;

  // Assignee (Employer)
  assigneeUserId: string;
  assigneeName: string;
  assigneeEmail: string;
  assigneeCompanyName?: string | null;
  assigneeVknOrTckn?: string | null;
  assigneeTaxOffice?: string | null;
  assigneeAddress?: string | null;
}

export interface IpDeedVerificationResult {
  isValid: boolean;
  deedId: string;
  masterDeedSha256: string;
  recomputedSha256: string;
  dualSealLinked: boolean;
  error?: string;
}
