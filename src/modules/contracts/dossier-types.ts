/**
 * Legal Evidence & Mediation Dossier Types (HMK m. 193)
 *
 * Statutory Compliance:
 * - 6100 Sayılı Hukuk Muhakemeleri Kanunu (HMK) m. 193 (Delil Sözleşmesi)
 * - 6100 Sayılı HMK m. 199 (Elektronik Belge Niteliği) & m. 205 (Kriptografik İspat)
 * - 6325 Sayılı Hukuk Uyuşmazlıklarında Arabuluculuk Kanunu m. 18 (İlam Niteliğinde Belge)
 * - 6098 Sayılı TBK m. 470 vd. (Eser Sözleşmesi ve Ayıp Muayenesi)
 */

export type EvidenceDocumentCategory =
  | "CONTRACT_AND_ANNEXES"
  | "ACCEPTANCE_TESTS_DOD"
  | "SCOPE_CHANGE_REVISIONS"
  | "HANDOVER_PROTOCOL"
  | "MILESTONES_LEDGER"
  | "AUDIT_TRAIL_LOGS"
  | "IP_ASSIGNMENT_DEEDS"
  | "CLOSING_DISCHARGE_DEEDS";

export interface EvidenceFileItem {
  /** Relative filepath inside the dossier ZIP archive (e.g. "01_ASIL_SOZLESME_VE_EKLERI/SOZLESME.md") */
  path: string;
  title: string;
  category: EvidenceDocumentCategory;
  legalGroundTr: string;
  legalGroundEn: string;
  sha256: string;
  content: string | Buffer;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface DossierPartyInfo {
  displayName: string;
  email: string;
  phone?: string | null;
  role: "CLIENT" | "CONTRACTOR";
  handle?: string;
  city?: string | null;
  taxOrIdNumber?: string | null;
}

export interface LegalDossierManifest {
  dossierRef: string;
  engagementId: string;
  listingTitle: string;
  generatedAt: string;
  locale: "tr" | "en" | "bilingual";
  client: DossierPartyInfo;
  contractor: DossierPartyInfo;
  disputeStatus: "NO_DISPUTE" | "DISPUTED" | "COMPLETED" | "CANCELLED";
  disputeSummary?: string | null;
  totalDocumentsCount: number;
  /** Root Merkle/SHA-256 Digest calculated across all individual file hashes */
  masterDossierSha256: string;
  documents: EvidenceFileItem[];
  /** GNU/POSIX compliant checksums file content for terminal verification */
  checksumsSha256Content: string;
}

export interface DossierExportResult {
  manifest: LegalDossierManifest;
  manifestMarkdown: string;
  unifiedHtml: string;
  zipBuffer: Buffer;
}
