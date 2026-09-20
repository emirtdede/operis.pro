/**
 * Operis Unified Single-Sign Hub & Ephemeral Signature Types
 *
 * Facilitates batch signing of all recommended and selected contracts on a single page,
 * managing ephemeral Cloudflare R2 signature assets with automated cleanup upon final execution.
 */

export type SigningPartyRole = "CLIENT" | "CONTRACTOR";

export type PackageSigningStatus =
  | "DRAFT"
  | "PENDING_SIGNATURES"
  | "PARTIALLY_SIGNED"
  | "FULLY_SIGNED"
  | "CANCELLED";

export interface PartySignatureData {
  signerUserId: string;
  signerName: string;
  role: SigningPartyRole;
  signedAt: string;
  ipHash: string;
  signatureType: "DRAWN" | "UPLOADED";
  signatureR2Key?: string;
  signatureDataUrl?: string; // Inlined image / SVG for document rendering
  legalAccepted: boolean;
}

export interface ContractPackageDetails {
  id: string;
  engagementId: string;
  status: PackageSigningStatus;
  selectedContracts: string[]; // e.g. ["CORE_SERVICE", "FSEK_IP_TRANSFER", "BILATERAL_NDA"]
  version: number;
  tamperResetCount: number;
  signaturesInvalidated?: boolean;
  clientSignature?: PartySignatureData | null;
  contractorSignature?: PartySignatureData | null;
  compiledMarkdown?: string | null;
  compiledHtml?: string | null;
  sha256Seal?: string | null;
  signedAt?: string | null;
  ephemeralCleanedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitSignatureInput {
  engagementId: string;
  userId: string;
  role: SigningPartyRole;
  signerName: string;
  signatureType: "DRAWN" | "UPLOADED";
  signatureDataUrl: string; // data:image/png;base64,... or webp
  clientIp?: string;
  legalAcknowledged: boolean; // Mandatory acknowledgment that Operis is not a party and disputes are bilateral
  selectedContracts?: string[];
  expectedVersion?: number;
}

export interface SubmitSignatureResponse {
  success: boolean;
  packageId: string;
  status: PackageSigningStatus;
  isFullySigned: boolean;
  version?: number;
  messageTr: string;
  messageEn: string;
  backupDownloadPrompt?: {
    showPrompt: boolean;
    titleTr: string;
    titleEn: string;
    descriptionTr: string;
    descriptionEn: string;
    downloadUrl: string;
    markdownUrl: string;
    htmlUrl: string;
  };
}
