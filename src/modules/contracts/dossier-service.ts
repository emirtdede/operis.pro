/**
 * HMK m. 193 Legal Evidence & Mediation Dossier Service
 * Facade Entry Point
 *
 * Statutory Compliance:
 * - 6100 Sayılı HMK m. 193 (Münhasır Delil Sözleşmesi)
 * - 6100 Sayılı HMK m. 199 (Elektronik Belge) & m. 205 (Kriptografik İspat Gücü)
 * - 6325 Sayılı Hukuk Uyuşmazlıklarında Arabuluculuk Kanunu m. 18
 * - 6098 Sayılı TBK m. 470, 474, 477 (Eser Sözleşmesi ve Muayene Hükümleri)
 * - 5846 Sayılı FSEK m. 52 (Mali Hak Devri Şartları)
 */

import { DossierIntegrityService } from "./dossier/dossier-integrity.service";
import { DossierExportService } from "./dossier/dossier-export.service";
import { DossierCompilerService, type GenerateDossierOptions } from "./dossier/dossier-compiler.service";
import type {
  EvidenceFileItem,
  DossierPartyInfo,
  LegalDossierManifest,
  DossierExportResult,
} from "./dossier-types";

export * from "./dossier/dossier-integrity.service";
export * from "./dossier/dossier-export.service";
export * from "./dossier/dossier-compiler.service";
export type { GenerateDossierOptions };

export class DossierService {
  /**
   * Generates a deterministic SHA-256 hash from string or buffer content.
   */
  static sha256(content: string | Buffer): string {
    return DossierIntegrityService.sha256(content);
  }

  /**
   * Generates a Master Root Hash deterministically combining all document hashes.
   */
  static calculateMasterRootHash(documents: Array<{ path: string; sha256: string }>): string {
    return DossierIntegrityService.calculateMasterRootHash(documents);
  }

  /**
   * Generates official Markdown index and manifest for the evidentiary dossier.
   */
  static generateManifestMarkdown(data: {
    dossierRef: string;
    engagementId: string;
    listingTitle: string;
    client: DossierPartyInfo;
    contractor: DossierPartyInfo;
    generatedAt: string;
    locale: "tr" | "en";
    masterDossierSha256: string;
    documents: EvidenceFileItem[];
    disputeStatus: string;
  }): string {
    return DossierExportService.generateManifestMarkdown(data);
  }

  /**
   * Generates a unified court-ready print HTML document combining all exhibits.
   */
  static generateUnifiedDossierHtml(manifest: LegalDossierManifest): string {
    return DossierExportService.generateUnifiedDossierHtml(manifest);
  }

  /**
   * Builds the complete evidentiary dossier, compiling all records, generating
   * individual exhibits, checksums, unified HTML report, and PKZip archive.
   */
  static async buildDossier(options: GenerateDossierOptions): Promise<DossierExportResult> {
    return DossierCompilerService.compileDossier(options);
  }
}
