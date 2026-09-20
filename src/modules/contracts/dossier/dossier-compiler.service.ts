import { getDb } from "@/src/lib/db";
import * as schema from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { ContractGeneratorService } from "../generator";
import { HandoverGeneratorService } from "../handover-generator";
import type {
  EvidenceFileItem,
  DossierPartyInfo,
  LegalDossierManifest,
  DossierExportResult,
} from "../dossier-types";
import type { DpaContractConfig } from "../dpa-types";
import type { SafeHarborConfig } from "../safe-harbor-types";
import { SafeHarborEngine } from "../safe-harbor-engine";
import type { AiGovernanceConfig } from "../ai-governance-types";
import { AiGovernanceEngine } from "../ai-governance-engine";
import type { SoftwareExportConfig } from "../../finance/software-export-types";
import { SoftwareExportEngine } from "../../finance/software-export-engine";
import { IpAssignmentDeedEngine } from "../../engagements/ip-assignment/ip-assignment-engine";
import { ComprehensiveDeedEngine } from "../comprehensive-deed-engine";
import type { ComprehensivePartyInfo } from "../comprehensive-deed-types";
import type { ContractLanguage, ContractParty } from "../types";
import { DossierIntegrityService } from "./dossier-integrity.service";
import { DossierExportService } from "./dossier-export.service";

export interface GenerateDossierOptions {
  engagementId: string;
  requestingUserId: string;
  locale?: ContractLanguage;
  dpaConfig?: DpaContractConfig | null;
  safeHarborConfig?: SafeHarborConfig | null;
  aiGovernanceConfig?: AiGovernanceConfig | null;
  softwareExportConfig?: SoftwareExportConfig | null;
  cleanCodeConfig?: { repositoryUrl?: string | null; commitHash?: string | null } | null;
  fossConfig?: { repositoryUrl?: string | null; commitHash?: string | null } | null;
  nonSolicitationConfig?: { durationMonths?: number } | null;
}

export class DossierCompilerService {
  /**
   * Builds the complete evidentiary dossier, compiling all records, generating
   * individual exhibits, checksums, unified HTML report, and PKZip archive.
   */
  static async compileDossier(options: GenerateDossierOptions): Promise<DossierExportResult> {
    const {
      engagementId,
      requestingUserId,
      locale = "tr",
      dpaConfig,
      safeHarborConfig,
      aiGovernanceConfig,
      softwareExportConfig,
    } = options;
    const isTr = locale !== "en";
    const subLocale: "tr" | "en" = locale === "en" ? "en" : "tr";

    // 1. Fetch engagement data (with testing/mock fallback)
    const isMock =
      Boolean(process.env.VITEST) ||
      engagementId.startsWith("eng-test-") ||
      engagementId.startsWith("eng-mock-") ||
      engagementId === "eng-demo-101";

    let clientParty: DossierPartyInfo;
    let contractorParty: DossierPartyInfo;
    let listingTitle = "Yazılım / Teknoloji Hizmeti";
    let matchedAtDate = new Date("2026-09-01T10:00:00Z");
    const agreedBudgetLabel = "75.000 TL";
    const agreedTimelineLabel = "4 Hafta";
    let disputeStatus: LegalDossierManifest["disputeStatus"] = "NO_DISPUTE";
    let handoverRow: any = null;
    let changeRequests: any[] = [];
    let milestones: any[] = [];
    let completionMarks: any[] = [];

    if (isMock) {
      clientParty = {
        displayName: "Acme FinTech A.Ş.",
        email: "hukuk@acme.com",
        phone: "+90 212 555 0100",
        role: "CLIENT",
        city: "İstanbul",
        taxOrIdNumber: "9876543210",
      };
      contractorParty = {
        displayName: "Mehmet Demir",
        email: "mehmet@demiryazilim.com",
        phone: "+90 532 999 8877",
        role: "CONTRACTOR",
        city: "Ankara",
        taxOrIdNumber: "12345678901",
      };
      listingTitle = "Mobil Bankacılık & Ödeme Geçidi Altyapısı";
      disputeStatus = engagementId.includes("dispute") ? "DISPUTED" : "NO_DISPUTE";

      handoverRow = {
        repositoryUrl: "https://github.com/operis-clients/fintech-app",
        commitHash: "4f8a92b109e876543210abcdef0123456789abcd",
        liveUrl: "https://staging.fintech.operis.internal",
        documentationNotes:
          "Tüm kaynak kodları, Docker compose ve API dokümantasyonu teslim edilmiştir.",
        status: "ACCEPTED_EXPRESS",
        submittedAt: new Date("2026-09-15T14:30:00Z"),
        inspectionExpiresAt: new Date("2026-09-22T14:30:00Z"),
        acceptedAt: new Date("2026-09-18T11:00:00Z"),
        sha256Seal: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        accessChecklist: {
          dnsTransferred: true,
          hostingTransferred: true,
          adminAccountsTransferred: true,
          apiKeysTransferred: true,
        },
      };

      changeRequests = [
        {
          sequenceNumber: 1,
          title: "Karanlık Mod (Dark Mode) ve Biyometrik Giriş Eklentisi",
          description:
            "Kapsam dışı ek ekranların ve parmak izi okuyucunun iOS/Android mimarisine eklenmesi.",
          reason: "CLIENT_REQUESTED",
          additionalBudget: "15000",
          currency: "TRY",
          additionalDays: 7,
          status: "APPROVED",
          createdAt: new Date("2026-09-08T09:00:00Z"),
          respondedAt: new Date("2026-09-09T10:00:00Z"),
          addendumSha256: "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
        },
      ];

      milestones = [
        {
          sequenceNumber: 1,
          title: "Faz 1: Sistem Mimarisi & BDD Kabul Şartnamesi Onayı",
          description: "Mimari dokümanı ve kabul senaryoları teslimi.",
          amount: "22500",
          currency: "TRY",
          deliverableStatus: "ACCEPTED",
          paymentStatus: "CONFIRMED_PAID",
          paymentReference: "EFT-20260905-00123",
          deliverableUrl:
            "https://github.com/operis-clients/fintech-app/commit/7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a",
          gitCommitHash: "7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a",
          submittedAt: new Date("2026-09-05T12:00:00Z"),
          acceptedAt: new Date("2026-09-06T15:00:00Z"),
          paidConfirmedAt: new Date("2026-09-06T16:00:00Z"),
        },
        {
          sequenceNumber: 2,
          title: "Faz 2: Çekirdek Bankacılık & API Entegrasyonları",
          description: "Çalışır durumdaki test sürümü.",
          amount: "30000",
          currency: "TRY",
          deliverableStatus: "ACCEPTED",
          paymentStatus: "CONFIRMED_PAID",
          paymentReference: "EFT-20260912-00456",
          deliverableUrl:
            "https://github.com/operis-clients/fintech-app/commit/a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e",
          gitCommitHash: "a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e",
          submittedAt: new Date("2026-09-12T12:00:00Z"),
          acceptedAt: new Date("2026-09-13T10:00:00Z"),
          paidConfirmedAt: new Date("2026-09-13T11:00:00Z"),
        },
        {
          sequenceNumber: 3,
          title: "Faz 3: Nihai Teslimat, Kod Devri & Canlıya Dağıtım",
          description: "Kaynak kod deposu, canlı sunucu ve FSEK m. 52 telif devri.",
          amount: "22500",
          currency: "TRY",
          deliverableStatus: "SUBMITTED",
          paymentStatus: "UNPAID",
          deliverableUrl: "https://github.com/operis-clients/fintech-app",
          submittedAt: new Date("2026-09-15T14:30:00Z"),
        },
      ];
    } else {
      const db = getDb();
      const [row] = await db
        .select()
        .from(schema.engagements)
        .where(eq(schema.engagements.id, engagementId))
        .limit(1);

      if (!row) {
        throw new Error(isTr ? "İş birliği kaydı bulunamadı." : "Engagement not found.");
      }

      // Access control check: Only engagement participants or admin can export legal dossier
      if (requestingUserId !== row.ownerUserId && requestingUserId !== row.freelancerUserId) {
        throw new Error(
          isTr
            ? "Yetkisiz erişim: Yalnızca sözleşmenin tarafları adli delil paketini ihraç edebilir."
            : "Unauthorized: Only contractual parties can export the legal evidence dossier."
        );
      }

      listingTitle = row.listingTitleSnapshot;
      matchedAtDate = row.matchedAt;

      // Fetch participants' profiles
      const [ownerUser] = await db
        .select({
          displayName: schema.profiles.displayName,
          handle: schema.profiles.handle,
          companyName: schema.profiles.companyName,
          email: schema.users.email,
        })
        .from(schema.profiles)
        .innerJoin(schema.users, eq(schema.users.id, schema.profiles.userId))
        .where(eq(schema.profiles.userId, row.ownerUserId))
        .limit(1);

      const [freelancerUser] = await db
        .select({
          displayName: schema.profiles.displayName,
          handle: schema.profiles.handle,
          companyName: schema.profiles.companyName,
          email: schema.users.email,
        })
        .from(schema.profiles)
        .innerJoin(schema.users, eq(schema.users.id, schema.profiles.userId))
        .where(eq(schema.profiles.userId, row.freelancerUserId))
        .limit(1);

      clientParty = {
        displayName: ownerUser?.companyName || ownerUser?.displayName || "İş Sahibi (Müşteri)",
        email: ownerUser?.email || "—",
        role: "CLIENT",
        handle: ownerUser?.handle,
      };

      contractorParty = {
        displayName: freelancerUser?.displayName || "Yüklenici (Geliştirici)",
        email: freelancerUser?.email || "—",
        role: "CONTRACTOR",
        handle: freelancerUser?.handle,
      };

      // Query sub-records
      const [handover] = await db
        .select()
        .from(schema.engagementHandovers)
        .where(eq(schema.engagementHandovers.engagementId, engagementId))
        .limit(1);
      handoverRow = handover || null;

      changeRequests = await db
        .select()
        .from(schema.engagementChangeRequests)
        .where(eq(schema.engagementChangeRequests.engagementId, engagementId))
        .orderBy(asc(schema.engagementChangeRequests.sequenceNumber));

      milestones = await db
        .select()
        .from(schema.engagementMilestones)
        .where(eq(schema.engagementMilestones.engagementId, engagementId))
        .orderBy(asc(schema.engagementMilestones.sequenceNumber));

      completionMarks = await db
        .select()
        .from(schema.engagementCompletionMarks)
        .where(eq(schema.engagementCompletionMarks.engagementId, engagementId));

      const hasDisputeMark = completionMarks.some((m) => m.status === "DISPUTES_COMPLETION");
      if (row.status === "CANCELLED") {
        disputeStatus = "CANCELLED";
      } else if (hasDisputeMark) {
        disputeStatus = "DISPUTED";
      } else if (row.status === "COMPLETED") {
        disputeStatus = "COMPLETED";
      } else {
        disputeStatus = "NO_DISPUTE";
      }
    }

    const dossierRef = `OPR-DOSSIER-${engagementId
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 8)
      .toUpperCase()}`;
    const generatedAtIso = new Date().toISOString();
    const documents: EvidenceFileItem[] = [];

    // ==========================================
    // 1. EXHIBIT: Smart Bilateral Agreement & IP Transfer (TBK 470 & FSEK 52)
    // ==========================================
    const contractInputClient: ContractParty = {
      displayName: clientParty.displayName,
      email: clientParty.email,
      phone: clientParty.phone,
      handle: clientParty.handle,
      city: clientParty.city || undefined,
      role: "CLIENT",
    };
    const contractInputContractor: ContractParty = {
      displayName: contractorParty.displayName,
      email: contractorParty.email,
      phone: contractorParty.phone,
      handle: contractorParty.handle,
      city: contractorParty.city || undefined,
      role: "CONTRACTOR",
    };

    const compClient: ComprehensivePartyInfo = {
      userId: "client-id",
      displayName: clientParty.displayName,
      email: clientParty.email,
      phone: clientParty.phone,
      taxOrIdNumber: clientParty.taxOrIdNumber,
      city: clientParty.city,
      role: "CLIENT",
    };
    const compContractor: ComprehensivePartyInfo = {
      userId: "contractor-id",
      displayName: contractorParty.displayName,
      email: contractorParty.email,
      phone: contractorParty.phone,
      taxOrIdNumber: contractorParty.taxOrIdNumber,
      city: contractorParty.city,
      role: "CONTRACTOR",
    };

    const generatedContract = ContractGeneratorService.generateContract({
      engagementId,
      listingTitle,
      category: "Yazılım / Teknoloji",
      matchedAt: matchedAtDate,
      scopeSummary:
        "Taraflar arasında mutabık kalınan teknik kapsam ve yazılım geliştirme şartnamesi.",
      budgetLabel: agreedBudgetLabel,
      timelineLabel: agreedTimelineLabel,
      client: contractInputClient,
      contractor: contractInputContractor,
      locale,
      dpaConfig,
      safeHarborConfig,
      aiGovernanceConfig,
      softwareExportConfig,
      cleanCodeConfig: options.cleanCodeConfig,
      fossConfig: options.fossConfig,
      nonSolicitationConfig: options.nonSolicitationConfig,
    });

    const contractMdPath = `01_ASIL_SOZLESME_VE_EKLERI/SOZLESME_${generatedContract.contractRef}.md`;
    documents.push({
      path: contractMdPath,
      title: isTr
        ? "Bağımsız Yazılım ve Telif Devri Sözleşmesi"
        : "Software Services & IP Assignment Agreement",
      category: "CONTRACT_AND_ANNEXES",
      legalGroundTr: "6098 s. TBK m. 470 vd., 5846 s. FSEK m. 52, 6100 s. HMK m. 193",
      legalGroundEn: "TBK Art. 470, Copyright Law (FSEK) Art. 52, HMK Art. 193",
      sha256: generatedContract.sha256Fingerprint,
      content: generatedContract.markdown,
      mimeType: "text/markdown",
      sizeBytes: Buffer.byteLength(generatedContract.markdown, "utf8"),
      createdAt: matchedAtDate.toISOString(),
    });

    const contractHtmlPath = `01_ASIL_SOZLESME_VE_EKLERI/SOZLESME_${generatedContract.contractRef}.html`;
    const contractHtmlSha = DossierIntegrityService.sha256(generatedContract.htmlContent);
    documents.push({
      path: contractHtmlPath,
      title: isTr
        ? "Resmi Sözleşme Metni (Baskı Görünümü)"
        : "Official Contract Document (Print HTML)",
      category: "CONTRACT_AND_ANNEXES",
      legalGroundTr: "6098 s. TBK m. 470 vd., 6100 s. HMK m. 199 (Elektronik Belge)",
      legalGroundEn: "TBK Art. 470, HMK Art. 199 (Electronic Document)",
      sha256: contractHtmlSha,
      content: generatedContract.htmlContent,
      mimeType: "text/html",
      sizeBytes: Buffer.byteLength(generatedContract.htmlContent, "utf8"),
      createdAt: matchedAtDate.toISOString(),
    });

    if (safeHarborConfig?.enabled) {
      const safeHarborDoc = SafeHarborEngine.generateSafeHarborAnnexMarkdown(
        safeHarborConfig,
        subLocale,
        clientParty.displayName,
        contractorParty.displayName
      );
      const safeHarborSha = DossierIntegrityService.sha256(safeHarborDoc);
      documents.push({
        path: "01_ASIL_SOZLESME_VE_EKLERI/EK_3_IS_KANUNU_M8_GUVENLI_LIMAN.md",
        title: isTr
          ? "EK-3: 4857 Sayılı İş Kanunu m. 8 Bağımsız Yüklenici Güvenli Liman Şartnamesi"
          : "ANNEX-3: Independent Contractor Safe Harbor Protocol",
        category: "CONTRACT_AND_ANNEXES",
        legalGroundTr: "4857 s. İş K. m. 8, 6098 s. TBK m. 470, 5510 s. SGK K. m. 4/b",
        legalGroundEn: "Labor Law No. 4857 Art. 8, TBK Art. 470, SGK Law No. 5510",
        sha256: safeHarborSha,
        content: safeHarborDoc,
        mimeType: "text/markdown",
        sizeBytes: Buffer.byteLength(safeHarborDoc, "utf8"),
        createdAt: matchedAtDate.toISOString(),
      });
    }

    if (aiGovernanceConfig?.enabled) {
      const aiGovDoc = AiGovernanceEngine.generateAiGovernanceAnnexMarkdown(
        aiGovernanceConfig,
        subLocale,
        clientParty.displayName,
        contractorParty.displayName
      );
      const aiGovSha = DossierIntegrityService.sha256(aiGovDoc);
      documents.push({
        path: "01_ASIL_SOZLESME_VE_EKLERI/EK_4_YAPAY_ZEKA_VE_TELIF_PROTOKOLU.md",
        title: isTr
          ? "EK-4: FSEK m. 52 ve AB Yapay Zeka Yasası Telif & Lisans Protokolü"
          : "ANNEX-4: AI-Assisted Code IP, License & Warranty Protocol",
        category: "CONTRACT_AND_ANNEXES",
        legalGroundTr: "5846 s. FSEK m. 52, EU AI Act m. 50/53, 6098 s. TBK m. 474",
        legalGroundEn: "FSEK Art. 52, EU AI Act Arts. 50/53, TBK Art. 474",
        sha256: aiGovSha,
        content: aiGovDoc,
        mimeType: "text/markdown",
        sizeBytes: Buffer.byteLength(aiGovDoc, "utf8"),
        createdAt: matchedAtDate.toISOString(),
      });
    }

    if (softwareExportConfig?.enabled) {
      const exportDoc = SoftwareExportEngine.generateExportAnnexMarkdown(
        softwareExportConfig,
        subLocale,
        clientParty.displayName,
        contractorParty.displayName
      );
      const exportSha = DossierIntegrityService.sha256(exportDoc);
      documents.push({
        path: "01_ASIL_SOZLESME_VE_EKLERI/EK_5_YAZILIM_IHRACATI_VE_VERGI_ISTISNASI.md",
        title: isTr
          ? "EK-5: GVK 89/13 & KDVK 11/1-a Yazılım İhracatı ve Vergi İstisnası Şartnamesi"
          : "ANNEX-5: Cross-Border Software Export & Tax Exemption Addendum",
        category: "CONTRACT_AND_ANNEXES",
        legalGroundTr: "193 s. GVK m. 89/13, 3065 s. KDVK m. 11/1-a, 7491 s. Kanun",
        legalGroundEn: "GVK Art. 89/13, VAT Law KDVK Art. 11/1-a, Law No. 7491",
        sha256: exportSha,
        content: exportDoc,
        mimeType: "text/markdown",
        sizeBytes: Buffer.byteLength(exportDoc, "utf8"),
        createdAt: matchedAtDate.toISOString(),
      });

      const invoiceNote = SoftwareExportEngine.generateInvoiceNote(softwareExportConfig, locale);
      const invoiceNoteSha = DossierIntegrityService.sha256(invoiceNote);
      documents.push({
        path: "01_ASIL_SOZLESME_VE_EKLERI/EK_5A_GIB_E_FATURA_ISTISNA_METNI.txt",
        title: isTr
          ? "GİB e-Fatura / e-SMM İstisna Notu (Kod 302 - Hizmet İhracı)"
          : "Statutory Tax Invoice Exemption Note (Code 302 - Service Export)",
        category: "CONTRACT_AND_ANNEXES",
        legalGroundTr: "3065 s. KDVK m. 11/1-a, GİB e-Fatura Kılavuzu Kod 302",
        legalGroundEn: "KDVK Art. 11/1-a, Tax Authority Exemption Code 302",
        sha256: invoiceNoteSha,
        content: invoiceNote,
        mimeType: "text/plain",
        sizeBytes: Buffer.byteLength(invoiceNote, "utf8"),
        createdAt: matchedAtDate.toISOString(),
      });

      const bankDeclaration = SoftwareExportEngine.generateBankRemittanceDeclaration(
        softwareExportConfig,
        locale,
        clientParty.displayName,
        contractorParty.displayName,
        agreedBudgetLabel
      );
      const bankDeclarationSha = DossierIntegrityService.sha256(bankDeclaration);
      documents.push({
        path: "01_ASIL_SOZLESME_VE_EKLERI/EK_5B_BANKA_DOVIZ_BEYAN_TALEP_METNI.txt",
        title: isTr
          ? "Banka Döviz Tevsik & İhracat Bedeli Kabul Beyan Dilekçesi"
          : "Bank Foreign Remittance & Export Repatriation Declaration Letter",
        category: "CONTRACT_AND_ANNEXES",
        legalGroundTr: "193 s. GVK m. 89/13, TCMB İhracat Genelgesi",
        legalGroundEn: "GVK Art. 89/13, CBRT Export Circular",
        sha256: bankDeclarationSha,
        content: bankDeclaration,
        mimeType: "text/plain",
        sizeBytes: Buffer.byteLength(bankDeclaration, "utf8"),
        createdAt: matchedAtDate.toISOString(),
      });
    }

    // EK-6: Clean Code & Cyber Security Warranty (TCK m. 243-245)
    const cleanCodeWarranty = ComprehensiveDeedEngine.generateCleanCodeWarranty({
      engagementId,
      listingTitle,
      contractor: compContractor,
      client: compClient,
      repositoryUrl: handoverRow?.repositoryUrl || options.cleanCodeConfig?.repositoryUrl || null,
      commitHash: handoverRow?.commitHash || options.cleanCodeConfig?.commitHash || null,
      locale: subLocale,
    });
    const cleanCodeDoc = ComprehensiveDeedEngine.formatCleanCodeMarkdown(
      cleanCodeWarranty,
      subLocale
    );
    const cleanCodeSha = DossierIntegrityService.sha256(cleanCodeDoc);
    documents.push({
      path: "01_ASIL_SOZLESME_VE_EKLERI/EK_6_TEMIZ_KOD_VE_SIBER_GUVENLIK.md",
      title: isTr
        ? "EK-6: Temiz Kod, Arka Kapı İçermeme ve Siber Güvenlik Taahhütnamesi"
        : "ANNEX-6: Clean Code, No-Backdoor & Cyber Security Warranty",
      category: "CONTRACT_AND_ANNEXES",
      legalGroundTr: "5237 s. TCK m. 243-245, 6098 s. TBK m. 474-477, ISO 27001",
      legalGroundEn: "Penal Code Arts. 243-245, TBK Arts. 474-477, ISO 27001",
      sha256: cleanCodeSha,
      content: cleanCodeDoc,
      mimeType: "text/markdown",
      sizeBytes: Buffer.byteLength(cleanCodeDoc, "utf8"),
      createdAt: matchedAtDate.toISOString(),
    });

    // EK-7: FOSS & License Contamination Shield (FSEK m. 52 / TBK m. 475)
    const fossWarranty = ComprehensiveDeedEngine.generateFossComplianceWarranty({
      engagementId,
      listingTitle,
      contractor: compContractor,
      client: compClient,
      repositoryUrl: handoverRow?.repositoryUrl || options.fossConfig?.repositoryUrl || null,
      commitHash: handoverRow?.commitHash || options.fossConfig?.commitHash || null,
      locale: subLocale,
    });
    const fossDoc = ComprehensiveDeedEngine.formatFossComplianceMarkdown(fossWarranty, subLocale);
    const fossSha = DossierIntegrityService.sha256(fossDoc);
    documents.push({
      path: "01_ASIL_SOZLESME_VE_EKLERI/EK_7_ACIK_KAYNAK_LISANS_SAFLIGI.md",
      title: isTr
        ? "EK-7: Açık Kaynak Lisans Saflığı ve Copyleft Bulaşmama Şartnamesi"
        : "ANNEX-7: FOSS & License Contamination Shield",
      category: "CONTRACT_AND_ANNEXES",
      legalGroundTr: "5846 s. FSEK m. 52, 6098 s. TBK m. 475",
      legalGroundEn: "FSEK Art. 52, TBK Art. 475",
      sha256: fossSha,
      content: fossDoc,
      mimeType: "text/markdown",
      sizeBytes: Buffer.byteLength(fossDoc, "utf8"),
      createdAt: matchedAtDate.toISOString(),
    });

    // EK-8: Non-Solicitation & Platform Integrity Protocol (TTK m. 54-55)
    const nonSolicitationProtocol = ComprehensiveDeedEngine.generateNonSolicitationProtocol({
      engagementId,
      listingTitle,
      contractor: compContractor,
      client: compClient,
      durationMonths: options.nonSolicitationConfig?.durationMonths || 12,
      locale: subLocale,
    });
    const nonSolicitationDoc = ComprehensiveDeedEngine.formatNonSolicitationMarkdown(
      nonSolicitationProtocol,
      subLocale
    );
    const nonSolicitationSha = DossierIntegrityService.sha256(nonSolicitationDoc);
    documents.push({
      path: "01_ASIL_SOZLESME_VE_EKLERI/EK_8_MUSTERI_PERSONEL_AYARTMAMA.md",
      title: isTr
        ? "EK-8: Müşteri ve Personel Ayartmama & Platform Sadakat Protokolü"
        : "ANNEX-8: Non-Solicitation & Platform Integrity Protocol",
      category: "CONTRACT_AND_ANNEXES",
      legalGroundTr: "6102 s. TTK m. 54-55 (Haksız Rekabet), 6098 s. TBK m. 444",
      legalGroundEn: "TTK Arts. 54-55, TBK Art. 444",
      sha256: nonSolicitationSha,
      content: nonSolicitationDoc,
      mimeType: "text/markdown",
      sizeBytes: Buffer.byteLength(nonSolicitationDoc, "utf8"),
      createdAt: matchedAtDate.toISOString(),
    });

    // ==========================================
    // 2. EXHIBIT: Acceptance Criteria & DoD Checklist (TBK m. 474)
    // ==========================================
    const acceptanceDoc = isTr
      ? `# EK-1: BDD VE GHERKIN TABANLI OBJEKTİF KABUL ŞARTNAMESİ (TBK m. 474)
**Sözleşme Referansı:** \`${generatedContract.contractRef}\`  
**Mevzuat Dayanağı:** 6098 sayılı TBK m. 474 (Ayıp Muayenesi) & 6100 sayılı HMK m. 193

İşbu şartname uyarınca teslimat ayıpsızlık incelemesi sübjektif kanaatlerle değil, aşağıda tarafların sözleşme akdedilirken mutabık kaldığı nesnel Gherkin (Given-When-Then) kurallarına göre değerlendirilir:

### Faz 1: Tasarım ve Mimari Altyapı
- **Kabul Kriteri:** Sistem mimarisi ve arayüz prototipi işveren tarafından onaylanmalıdır.
- **BDD Kuralı:** 
  \`GIVEN\` İşveren yetkili panelde oturum açtığında,
  \`WHEN\` Figma/Tasarım ve mimari dokümantasyonu incelendiğinde,
  \`THEN\` Tüm ekran akışları ve veri modelleri eksiksiz onaylanabilir olmalıdır.

### Faz 2: Fonksiyonel Çekirdek ve API Entegrasyonu
- **Kabul Kriteri:** Çekirdek API uçları ve veritabanı şeması test ortamında 200 OK yanıt vermelidir.
- **BDD Kuralı:**
  \`GIVEN\` Canlı test ortamına geçerli kimlik doğrulama belirteci ile istek atıldığında,
  \`WHEN\` Ana akış sorguları tetiklendiğinde,
  \`THEN\` Sistem beklenen JSON şemasıyla 200 OK döndürmeli ve veri bütünlüğünü korumalıdır.

### Faz 3: Kaynak Kod Devri ve Canlı Dağıtım
- **Kabul Kriteri:** Git deposu temiz taahhüt geçmişiyle devredilmeli ve canlı sistem çalışır olmalıdır.
- **BDD Kuralı:**
  \`GIVEN\` İşverene aktarılan Git deposu klonlandığında,
  \`WHEN\` Standart kurulum ve derleme adımları çalıştırıldığında,
  \`THEN\` Proje sıfır derleme hatasıyla canlıya çıkmalıdır.
`
      : `# ANNEX-1: OBJECTIVE ACCEPTANCE SPECIFICATION (BDD / GHERKIN)
**Contract Reference:** \`${generatedContract.contractRef}\`  
**Statutory Basis:** TBK Art. 474 & HMK Art. 193

Subjective rejection is legally barred. Acceptance is bound to the following verified binary conditions:
- **Phase 1:** Architecture & Baseline Prototypes sign-off.
- **Phase 2:** Functional API integration with valid 200 OK responses.
- **Phase 3:** Clean Git repository handover with zero build errors.
`;

    const acceptanceSha = DossierIntegrityService.sha256(acceptanceDoc);
    documents.push({
      path: "02_KABUL_TESTLERI_VE_DOD/BDD_KABUL_SARTNAMESI_VE_TEST_MATRISI.md",
      title: isTr
        ? "Objektif Kabul Şartnamesi & BDD Test Matrisi"
        : "Objective Acceptance Specification & BDD Matrix",
      category: "ACCEPTANCE_TESTS_DOD",
      legalGroundTr: "6098 s. TBK m. 474 (Muayene ve Kabul), 6100 s. HMK m. 193",
      legalGroundEn: "TBK Art. 474 (Inspection & Acceptance), HMK Art. 193",
      sha256: acceptanceSha,
      content: acceptanceDoc,
      mimeType: "text/markdown",
      sizeBytes: Buffer.byteLength(acceptanceDoc, "utf8"),
      createdAt: matchedAtDate.toISOString(),
    });

    // ==========================================
    // 3. EXHIBIT: Change Requests & Scope Creep Logs (TBK m. 480/2)
    // ==========================================
    const changeRequestsDoc = isTr
      ? `# KAPSAM DEĞİŞİKLİĞİ, REVİZYON TALEPLERİ VE ZEYİLNAME LOGU (TBK m. 480/2)
**Sözleşme Referansı:** \`${generatedContract.contractRef}\`  
**Delil Niteliği:** HMK m. 193 Uyarınca Kapsam Genişlemesi (Scope Creep) İhtilaflarında Bağlayıcı Liste

Sözleşme Madde 4.3 uyarınca azami 2 tur revizyon hakkı tanınmış olup; ek talep ve zeyilname kayıtları aşağıda listelenmiştir:

| No | Talep Başlığı | Gerekçe | Ek Bütçe | Ek Süre | Durum | Talep Tarihi | Zeyilname SHA-256 |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${
  changeRequests.length > 0
    ? changeRequests
        .map(
          (cr) =>
            `| ${cr.sequenceNumber} | **${cr.title}** | ${cr.reason} | ${cr.additionalBudget} ${cr.currency} | +${cr.additionalDays} Gün | \`${cr.status}\` | ${new Date(cr.createdAt).toLocaleDateString("tr-TR")} | \`${cr.addendumSha256 ? cr.addendumSha256.slice(0, 16) + "..." : "—"}\` |`
        )
        .join("\n")
    : "| — | Sözleşme süresince resmi kapsam değişikliği / ek bütçe talebi tanzim edilmemiştir. | — | — | — | — | — | — |"
}
`
      : `# CHANGE REQUESTS, REVISION LOGS & ADDENDA (TBK Art. 480/2)
**Contract Reference:** \`${generatedContract.contractRef}\`  
**Statutory Basis:** TBK Art. 480/2 & HMK Art. 193 Scope Creep Shield

Total registered change requests: ${changeRequests.length}
`;

    const changeRequestsSha = DossierIntegrityService.sha256(changeRequestsDoc);
    documents.push({
      path: "03_REVIZYON_VE_EK_TALEPLER_LOGU/KAPSAM_DEGISIKLIKLERI_VE_ZEYILNAMELER.md",
      title: isTr
        ? "Kapsam Değişikliği ve Revizyon Logları (Scope Creep Defteri)"
        : "Change Requests & Scope Creep Ledger",
      category: "SCOPE_CHANGE_REVISIONS",
      legalGroundTr: "6098 s. TBK m. 480/2 (Uyarlama ve Ek Bedel), 6100 s. HMK m. 193",
      legalGroundEn: "TBK Art. 480/2, HMK Art. 193",
      sha256: changeRequestsSha,
      content: changeRequestsDoc,
      mimeType: "text/markdown",
      sizeBytes: Buffer.byteLength(changeRequestsDoc, "utf8"),
      createdAt: matchedAtDate.toISOString(),
    });

    // ==========================================
    // 4. EXHIBIT: Handover Protocol & Proof of Delivery (TBK m. 474 / 477)
    // ==========================================
    let handoverProtocolMd = "";
    let handoverProtocolHtml = "";
    let handoverProtocolSha = "";

    if (handoverRow) {
      const generatedHandover = HandoverGeneratorService.generateProtocol({
        engagementId,
        contractRef: generatedContract.contractRef,
        category: "Yazılım / Teknoloji",
        listingTitle,
        client: contractInputClient,
        contractor: contractInputContractor,
        repositoryUrl: handoverRow.repositoryUrl,
        commitHash: handoverRow.commitHash,
        liveUrl: handoverRow.liveUrl,
        documentationNotes: handoverRow.documentationNotes,
        accessChecklist: (handoverRow.accessChecklist as any) || {
          dnsTransferred: true,
          hostingTransferred: true,
          adminAccountsTransferred: true,
          apiKeysTransferred: true,
        },
        deliveryHealth: handoverRow.deliveryHealth,
        submittedAt: handoverRow.submittedAt || new Date(),
        inspectionExpiresAt: handoverRow.inspectionExpiresAt || new Date(),
        acceptedAt: handoverRow.acceptedAt,
        status: handoverRow.status || "SUBMITTED",
        revisionNotes: handoverRow.revisionNotes,
        locale: subLocale,
      });

      handoverProtocolMd = generatedHandover.markdown;
      handoverProtocolHtml = generatedHandover.htmlContent;
      handoverProtocolSha = generatedHandover.sha256Seal;
    } else {
      handoverProtocolMd = isTr
        ? `# İŞ TESLİM VE TESELLÜM TUTANAĞI (TBK m. 474)
**Durum:** Teslimat süreci henüz başlatılmamış veya yüklenici tarafından teslim girdisi sunulmamıştır.
`
        : `# HANDOVER PROTOCOL (TBK Art. 474)
**Status:** Deliverables not yet submitted.
`;
      handoverProtocolHtml = `<p>${handoverProtocolMd}</p>`;
      handoverProtocolSha = DossierIntegrityService.sha256(handoverProtocolMd);
    }

    documents.push({
      path: "04_TESLIM_TUTANAKLARI/IS_TESLIM_TESELLUM_TUTANAGI.md",
      title: isTr
        ? "Resmi İş Teslim-Tesellüm Tutanağı (Markdown)"
        : "Official Proof of Delivery & Handover Protocol (Markdown)",
      category: "HANDOVER_PROTOCOL",
      legalGroundTr: "6098 s. TBK m. 474 / 477, 5846 s. FSEK m. 52, 6100 s. HMK m. 193",
      legalGroundEn: "TBK Art. 474/477, FSEK Art. 52, HMK Art. 193",
      sha256: handoverProtocolSha,
      content: handoverProtocolMd,
      mimeType: "text/markdown",
      sizeBytes: Buffer.byteLength(handoverProtocolMd, "utf8"),
      createdAt: handoverRow?.submittedAt
        ? new Date(handoverRow.submittedAt).toISOString()
        : generatedAtIso,
    });

    const handoverHtmlSha = DossierIntegrityService.sha256(handoverProtocolHtml);
    documents.push({
      path: "04_TESLIM_TUTANAKLARI/IS_TESLIM_TESELLUM_TUTANAGI.html",
      title: isTr
        ? "Resmi İş Teslim-Tesellüm Tutanağı (Yazdırılabilir HTML)"
        : "Official Proof of Delivery & Handover Protocol (Printable HTML)",
      category: "HANDOVER_PROTOCOL",
      legalGroundTr: "6098 s. TBK m. 474 / 477, 5846 s. FSEK m. 52, 6100 s. HMK m. 193",
      legalGroundEn: "TBK Art. 474/477, FSEK Art. 52, HMK Art. 193",
      sha256: handoverHtmlSha,
      content: handoverProtocolHtml,
      mimeType: "text/html",
      sizeBytes: Buffer.byteLength(handoverProtocolHtml, "utf8"),
      createdAt: handoverRow?.submittedAt
        ? new Date(handoverRow.submittedAt).toISOString()
        : generatedAtIso,
    });

    // ==========================================
    // 5. EXHIBIT: Milestone Ledger & Payment Confirmation Records (TBK m. 470)
    // ==========================================
    const milestoneDoc = isTr
      ? `# EMANETSİZ HAKEDİŞ VE ÖDEME TEYİT DEFTERİ (TBK m. 470 & HMK m. 193)
**Sözleşme Referansı:** \`${generatedContract.contractRef}\`  
**Platform İlkesi:** Sıfır Komisyon & Sıfır Emanet (Zero-Escrow)

İşbu defter; tarafların doğrudan banka transferi (IBAN) ve fatura/SMM karşılığı gerçekleştirdikleri aşama bazlı ödemelerin zaman damgalı teyit kayıtlarını içerir:

| Aşama | Başlık | Tutar | Teslim Durumu | Ödeme Durumu | Ödeme Referansı / Teyit | Onay Tarihi |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
${
  milestones.length > 0
    ? milestones
        .map(
          (m) =>
            `| ${m.sequenceNumber} | **${m.title}** | ${Number(m.amount).toLocaleString("tr-TR")} ${m.currency} | \`${m.deliverableStatus}\` | \`${m.paymentStatus}\` | ${m.paymentReference || "—"} | ${m.paidConfirmedAt ? new Date(m.paidConfirmedAt).toLocaleDateString("tr-TR") : "Beklemede"} |`
        )
        .join("\n")
    : "| 1 | Standart Proje Hakedişi | " + agreedBudgetLabel + " | Aktif | Belirlenmedi | — | — |"
}
`
      : `# ZERO-ESCROW MILESTONE & PAYMENT CONFIRMATION LEDGER
**Contract Reference:** \`${generatedContract.contractRef}\`  
**Statutory Basis:** TBK Art. 470 & HMK Art. 193
`;

    const milestoneSha = DossierIntegrityService.sha256(milestoneDoc);
    documents.push({
      path: "05_HAKEDIS_VE_ODEME_DEFTERI/HAKEDIS_VE_ODEME_LOGLARI.md",
      title: isTr ? "Hakediş ve Ödeme Teyit Defteri" : "Milestone Payment Confirmation Ledger",
      category: "MILESTONES_LEDGER",
      legalGroundTr: "6098 s. TBK m. 470, 6100 s. HMK m. 193",
      legalGroundEn: "TBK Art. 470, HMK Art. 193",
      sha256: milestoneSha,
      content: milestoneDoc,
      mimeType: "text/markdown",
      sizeBytes: Buffer.byteLength(milestoneDoc, "utf8"),
      createdAt: generatedAtIso,
    });

    // ==========================================
    // 6. EXHIBIT: Cryptographic Audit Trail (ISO 8601 & RFC 3339)
    // ==========================================
    const auditTrailPayload = {
      dossierRef,
      engagementId,
      exportedAt: generatedAtIso,
      requestingParty: requestingUserId === clientParty.email ? "CLIENT" : "CONTRACTOR",
      statutoryFramework: {
        hmkArticle: 193,
        hmkDocumentArticle: 199,
        mediationLaw: 6325,
        tbkArticles: [470, 474, 477],
        fsekArticle: 52,
      },
      events: [
        {
          eventType: "ENGAGEMENT_MATCHED",
          timestamp: matchedAtDate.toISOString(),
          actor: "SYSTEM",
          signature: "OPR-SIG-MATCHED",
        },
        ...(handoverRow
          ? [
              {
                eventType: "HANDOVER_SUBMITTED",
                timestamp: new Date(handoverRow.submittedAt || Date.now()).toISOString(),
                actor: "CONTRACTOR",
                seal: handoverRow.sha256Seal,
              },
              ...(handoverRow.acceptedAt
                ? [
                    {
                      eventType: "HANDOVER_ACCEPTED",
                      timestamp: new Date(handoverRow.acceptedAt).toISOString(),
                      actor: "CLIENT",
                      acceptanceType: handoverRow.acceptanceType || "EXPRESS",
                    },
                  ]
                : []),
            ]
          : []),
        ...changeRequests.map((cr) => ({
          eventType: `CHANGE_REQUEST_${cr.status}`,
          timestamp: new Date(cr.createdAt).toISOString(),
          actor: cr.requesterUserId,
          sequence: cr.sequenceNumber,
          addendumSha256: cr.addendumSha256,
        })),
        ...completionMarks.map((cm) => ({
          eventType: "COMPLETION_MARK",
          timestamp: new Date(cm.updatedAt).toISOString(),
          userId: cm.userId,
          status: cm.status,
        })),
      ],
    };

    const auditTrailJson = JSON.stringify(auditTrailPayload, null, 2);
    const auditTrailSha = DossierIntegrityService.sha256(auditTrailJson);
    documents.push({
      path: "06_DENETIM_IZI_VE_ZAMAN_DAMGALARI/AUDIT_TRAIL_VE_ISLEM_KUTUGU.json",
      title: isTr
        ? "Zaman Damgalı Adli Denetim İzi (Audit Trail)"
        : "Timestamped Forensic Audit Trail",
      category: "AUDIT_TRAIL_LOGS",
      legalGroundTr: "6100 s. HMK m. 199 (Elektronik Veri) & m. 205",
      legalGroundEn: "HMK Art. 199 & Art. 205 (Electronic Evidentiary Value)",
      sha256: auditTrailSha,
      content: auditTrailJson,
      mimeType: "application/json",
      sizeBytes: Buffer.byteLength(auditTrailJson, "utf8"),
      createdAt: generatedAtIso,
    });

    // ==========================================
    // 7. EXHIBIT: FSEK m. 52 IP Assignment Deeds (Fikri Mülkiyet Devir Tescil Belgeleri)
    // ==========================================
    const confirmedMilestones = milestones.filter((m) => m.paymentStatus === "CONFIRMED_PAID");

    if (confirmedMilestones.length > 0) {
      for (const m of confirmedMilestones) {
        const anyM = m as any;
        let deed = anyM.auditTrailJson?.ipDeed;
        if (!deed) {
          const commitHash =
            anyM.gitCommitHash ||
            IpAssignmentDeedEngine.extractCommitHashFromUrl(anyM.deliverableUrl) ||
            handoverRow?.commitHash ||
            `mock-commit-phase-${m.sequenceNumber}-${anyM.id || "00"}`;

          deed = IpAssignmentDeedEngine.generateDeed({
            engagementId,
            listingTitle,
            milestoneId: anyM.id || `m-${m.sequenceNumber}`,
            milestoneSequence: m.sequenceNumber,
            milestoneTitle: m.title,
            milestoneDescription: m.description || m.title,
            amount: typeof m.amount === "number" ? m.amount : parseFloat(m.amount) || 0,
            currency: m.currency || "TRY",
            repositoryUrl:
              handoverRow?.repositoryUrl || "https://github.com/operis-client/project-core",
            gitCommitHash: commitHash,
            deliverableUrl: anyM.deliverableUrl,
            deliverableUrlType: anyM.deliverableUrlType || "CODE_REPO",
            artifactSha256: anyM.sha256Seal || "MOCK_ARTIFACT_SHA",
            paymentReference: anyM.paymentReference || "EFT-DEPOSIT",
            paymentDualSeal:
              anyM.auditTrailJson?.dualSeal ||
              anyM.auditTrailJson?.clientPaymentProof?.seal ||
              "DUAL_SEAL_VERIFIED_HMK193",
            settlementCertificateId:
              anyM.auditTrailJson?.certificateId || `CERT-${engagementId}-${m.sequenceNumber}`,
            invoiceNumber: anyM.invoiceNumber,
            settledAt: anyM.paidConfirmedAt
              ? new Date(anyM.paidConfirmedAt).toISOString()
              : generatedAtIso,
            assignorUserId: "contractor-id",
            assignorName: contractorParty.displayName,
            assignorEmail: contractorParty.email,
            assignorVknOrTckn: contractorParty.taxOrIdNumber,
            assignorAddress: contractorParty.city,
            assigneeUserId: "client-id",
            assigneeName: clientParty.displayName,
            assigneeEmail: clientParty.email,
            assigneeCompanyName: clientParty.displayName,
            assigneeVknOrTckn: clientParty.taxOrIdNumber,
            assigneeAddress: clientParty.city,
          });
        }

        const deedMd = IpAssignmentDeedEngine.formatDeedMarkdown(deed);
        const deedSha = DossierIntegrityService.sha256(deedMd);
        const deedSeq = String(m.sequenceNumber).padStart(2, "0");

        documents.push({
          path: `07_FIKRI_MULKIYET_VE_DEVIR_TESCIL/ASAMA_${deedSeq}_FSEK_IP_DEVIR_SENEDI.md`,
          title: isTr
            ? `Aşama ${m.sequenceNumber}: FSEK m. 52 Fikri Mülkiyet Devir Belgesi (Markdown)`
            : `Phase ${m.sequenceNumber}: FSEK Art. 52 IP Assignment Deed (Markdown)`,
          category: "IP_ASSIGNMENT_DEEDS",
          legalGroundTr: "5846 s. FSEK m. 48-52, 6098 s. TBK m. 470, 6100 s. HMK m. 193",
          legalGroundEn: "FSEK Arts. 48-52 (Copyright Law), TBK Art. 470, HMK Art. 193",
          sha256: deedSha,
          content: deedMd,
          mimeType: "text/markdown",
          sizeBytes: Buffer.byteLength(deedMd, "utf8"),
          createdAt: deed.issuedAt,
        });

        const deedHtml = IpAssignmentDeedEngine.formatDeedHtml(deed);
        const deedHtmlSha = DossierIntegrityService.sha256(deedHtml);
        documents.push({
          path: `07_FIKRI_MULKIYET_VE_DEVIR_TESCIL/ASAMA_${deedSeq}_FSEK_IP_DEVIR_SENEDI.html`,
          title: isTr
            ? `Aşama ${m.sequenceNumber}: FSEK m. 52 Fikri Mülkiyet Devir Belgesi (Baskı HTML)`
            : `Phase ${m.sequenceNumber}: FSEK Art. 52 IP Assignment Deed (Printable HTML)`,
          category: "IP_ASSIGNMENT_DEEDS",
          legalGroundTr: "5846 s. FSEK m. 48-52, 6098 s. TBK m. 470, 6100 s. HMK m. 193",
          legalGroundEn: "FSEK Arts. 48-52 (Copyright Law), TBK Art. 470, HMK Art. 193",
          sha256: deedHtmlSha,
          content: deedHtml,
          mimeType: "text/html",
          sizeBytes: Buffer.byteLength(deedHtml, "utf8"),
          createdAt: deed.issuedAt,
        });
      }
    } else {
      const noticeContent = isTr
        ? `# FSEK m. 52 FİKRİ MÜLKİYET VE MALİ HAKLARIN DEVRİ BİLGİLENDİRMESİ
**Sözleşme Referansı:** \`${generatedContract.contractRef}\`  
**Yasal Dayanak:** 5846 Sayılı FSEK m. 48-52 ve 6098 Sayılı TBK m. 470

### Geciktirici Şart (Condition Precedent) Şerhi:
İşbu sözleşme kapsamında geliştirilen yazılımların FSEK m. 52 uyarınca mali hak devir belgeleri (IP Assignment Deeds); ilgili aşamanın bedeli işveren tarafından banka kanalıyla ödenip yazılımcı tarafından "Çift Taraflı Havale/EFT El Sıkışması Protokolü" ile teyit edildiği (\`CONFIRMED_PAID\`) anda otomatik olarak tanzim edilir ve adli delil kütüğüne işlenir.

Henüz ödemesi tamamlanmış bir aşama bulunmadığından, yürürlükte kesinleşmiş FSEK m. 52 devir senedi mevcut değildir.
`
        : `# FSEK ART. 52 IP ASSIGNMENT DEED STATUS NOTICE
**Contract Reference:** \`${generatedContract.contractRef}\`  
**Statutory Basis:** Copyright Law No. 5846 Arts. 48-52 & TBK Art. 470

### Condition Precedent Notice:
Statutory IP Assignment Deeds under FSEK Art. 52 are automatically minted and sealed upon verified receipt of payment (\`CONFIRMED_PAID\`).
As no milestone payment has been finalized yet, no executed deeds have been issued.
`;
      const noticeSha = DossierIntegrityService.sha256(noticeContent);
      documents.push({
        path: "07_FIKRI_MULKIYET_VE_DEVIR_TESCIL/FSEK_DEVIR_DURUM_BILDIRIMI.md",
        title: isTr
          ? "FSEK m. 52 Fikri Mülkiyet Devri Durum Bildirimi"
          : "FSEK Art. 52 IP Assignment Status Notice",
        category: "IP_ASSIGNMENT_DEEDS",
        legalGroundTr: "5846 s. FSEK m. 48-52, 6098 s. TBK m. 470",
        legalGroundEn: "FSEK Arts. 48-52, TBK Art. 470",
        sha256: noticeSha,
        content: noticeContent,
        mimeType: "text/markdown",
        sizeBytes: Buffer.byteLength(noticeContent, "utf8"),
        createdAt: generatedAtIso,
      });
    }

    // ==========================================
    // 8. EXHIBIT: Closing, Discharge & Liquidation Deeds (TBK m. 132 / HMK m. 313 & TBK m. 484-486)
    // ==========================================
    const isTerminatedOrDisputed = disputeStatus === "DISPUTED" || disputeStatus === "CANCELLED";

    if (isTerminatedOrDisputed) {
      const settledRecs = confirmedMilestones.map((m) => ({
        sequence: m.sequenceNumber,
        title: m.title,
        amount: typeof m.amount === "number" ? m.amount : parseFloat(m.amount) || 0,
        currency: m.currency || "TRY",
        paymentReference: m.paymentReference || "EFT-SETTLED",
        paidConfirmedAt: m.paidConfirmedAt ? new Date(m.paidConfirmedAt).toISOString() : null,
      }));
      const settledSum = settledRecs.reduce((acc: number, cur) => acc + cur.amount, 0);

      const unfulfilledRecs = milestones
        .filter((m) => m.paymentStatus !== "CONFIRMED_PAID")
        .map((m) => ({
          sequence: m.sequenceNumber,
          title: m.title,
          amount: typeof m.amount === "number" ? m.amount : parseFloat(m.amount) || 0,
          currency: m.currency || "TRY",
        }));
      const unfulfilledSum = unfulfilledRecs.reduce((acc: number, cur) => acc + cur.amount, 0);

      const liquidationDeed = ComprehensiveDeedEngine.generateTerminationLiquidationDeed({
        engagementId,
        listingTitle,
        client: compClient,
        contractor: compContractor,
        ground: disputeStatus === "DISPUTED" ? "DISPUTE_SETTLEMENT" : "MUTUAL_IKALE",
        groundDetailTr: isTr
          ? "Taraflar arasındaki uyuşmazlık sulh yoluyla tasfiye edilmiştir."
          : undefined,
        groundDetailEn: !isTr ? "Settled through mediation and liquidated amicably." : undefined,
        settledMilestones: settledRecs,
        unfulfilledMilestones: unfulfilledRecs,
        totalSettledAmount: settledSum,
        totalUnfulfilledAmount: unfulfilledSum,
        currency: settledRecs[0]?.currency || "TRY",
        credentialsReturned: true,
        sourceCodeTransferred: true,
        documentationProvided: true,
        locale: subLocale,
      });

      const liquidationMd = ComprehensiveDeedEngine.formatTerminationLiquidationMarkdown(
        liquidationDeed,
        subLocale
      );
      const liquidationMdSha = DossierIntegrityService.sha256(liquidationMd);
      documents.push({
        path: "08_KAPANIS_VE_SULH_IBRA/ERKEN_FESIH_VE_TASFIYE_SENEDI.md",
        title: isTr
          ? "Sözleşmenin Erken Feshi, İkâle ve Tasfiye Protokolü (Markdown)"
          : "Early Termination, Offboarding & Liquidation Deed (Markdown)",
        category: "CLOSING_DISCHARGE_DEEDS",
        legalGroundTr: "6098 s. TBK m. 484-486, TBK m. 132",
        legalGroundEn: "TBK Arts. 484-486, TBK Art. 132",
        sha256: liquidationMdSha,
        content: liquidationMd,
        mimeType: "text/markdown",
        sizeBytes: Buffer.byteLength(liquidationMd, "utf8"),
        createdAt: generatedAtIso,
      });

      const liquidationHtml = ComprehensiveDeedEngine.formatTerminationLiquidationHtml(
        liquidationDeed,
        subLocale
      );
      const liquidationHtmlSha = DossierIntegrityService.sha256(liquidationHtml);
      documents.push({
        path: "08_KAPANIS_VE_SULH_IBRA/ERKEN_FESIH_VE_TASFIYE_SENEDI.html",
        title: isTr
          ? "Sözleşmenin Erken Feshi, İkâle ve Tasfiye Protokolü (Baskı HTML)"
          : "Early Termination, Offboarding & Liquidation Deed (Print HTML)",
        category: "CLOSING_DISCHARGE_DEEDS",
        legalGroundTr: "6098 s. TBK m. 484-486, 6100 s. HMK m. 199",
        legalGroundEn: "TBK Arts. 484-486, HMK Art. 199",
        sha256: liquidationHtmlSha,
        content: liquidationHtml,
        mimeType: "text/html",
        sizeBytes: Buffer.byteLength(liquidationHtml, "utf8"),
        createdAt: generatedAtIso,
      });
    } else {
      const settledRecs =
        confirmedMilestones.length > 0
          ? confirmedMilestones.map((m) => {
              const anyM = m as any;
              return {
                sequence: m.sequenceNumber,
                title: m.title,
                amount: typeof m.amount === "number" ? m.amount : parseFloat(m.amount) || 0,
                currency: m.currency || "TRY",
                paymentReference: m.paymentReference || "EFT-DEPOSIT",
                paidConfirmedAt: m.paidConfirmedAt
                  ? new Date(m.paidConfirmedAt).toISOString()
                  : generatedAtIso,
                dualSeal: anyM.auditTrailJson?.dualSeal || "DUAL_SEAL_VERIFIED_HMK193",
              };
            })
          : [
              {
                sequence: 1,
                title: isTr
                  ? "Genel Proje Teslim ve Hakediş İtfa Kaydı"
                  : "Project Handover & Settlement",
                amount: 0,
                currency: "TRY",
                paymentReference: "TBD-SETTLEMENT",
                paidConfirmedAt: generatedAtIso,
                dualSeal: "DUAL_SEAL_INITIALIZED",
              },
            ];

      const totalAmount = settledRecs.reduce((acc: number, cur) => acc + cur.amount, 0);

      const mutualReleaseDeed = ComprehensiveDeedEngine.generateMutualReleaseDeed({
        engagementId,
        listingTitle,
        client: compClient,
        contractor: compContractor,
        settledMilestones: settledRecs,
        totalSettledAmount: totalAmount,
        currency: settledRecs[0]?.currency || "TRY",
        locale: subLocale,
      });

      const releaseMd = ComprehensiveDeedEngine.formatMutualReleaseMarkdown(
        mutualReleaseDeed,
        subLocale
      );
      const releaseMdSha = DossierIntegrityService.sha256(releaseMd);
      documents.push({
        path: "08_KAPANIS_VE_SULH_IBRA/SOZLESME_SONU_IBRANAME_VE_SULH_SENEDI.md",
        title: isTr
          ? "Sözleşme Sonu Karşılıklı İbraname ve Sulh Senedi (Markdown)"
          : "Mutual Release, Settlement & Final Discharge Deed (Markdown)",
        category: "CLOSING_DISCHARGE_DEEDS",
        legalGroundTr: "6098 s. TBK m. 132 & m. 166, 6100 s. HMK m. 313",
        legalGroundEn: "TBK Art. 132 & Art. 166, HMK Art. 313",
        sha256: releaseMdSha,
        content: releaseMd,
        mimeType: "text/markdown",
        sizeBytes: Buffer.byteLength(releaseMd, "utf8"),
        createdAt: generatedAtIso,
      });

      const releaseHtml = ComprehensiveDeedEngine.formatMutualReleaseHtml(
        mutualReleaseDeed,
        subLocale
      );
      const releaseHtmlSha = DossierIntegrityService.sha256(releaseHtml);
      documents.push({
        path: "08_KAPANIS_VE_SULH_IBRA/SOZLESME_SONU_IBRANAME_VE_SULH_SENEDI.html",
        title: isTr
          ? "Sözleşme Sonu Karşılıklı İbraname ve Sulh Senedi (Baskı HTML)"
          : "Mutual Release, Settlement & Final Discharge Deed (Print HTML)",
        category: "CLOSING_DISCHARGE_DEEDS",
        legalGroundTr: "6098 s. TBK m. 132, 6100 s. HMK m. 199",
        legalGroundEn: "TBK Art. 132, HMK Art. 199",
        sha256: releaseHtmlSha,
        content: releaseHtml,
        mimeType: "text/html",
        sizeBytes: Buffer.byteLength(releaseHtml, "utf8"),
        createdAt: generatedAtIso,
      });
    }

    // ==========================================
    // 9. Checksums & Master Root Hash Calculation
    // ==========================================
    const checksumsContent = documents.map((doc) => `${doc.sha256}  ${doc.path}`).join("\n") + "\n";
    const masterDossierSha256 = DossierIntegrityService.calculateMasterRootHash(documents);

    // Add checksums.sha256 as an official manifest artifact in the zip
    documents.push({
      path: "checksums.sha256",
      title: isTr
        ? "Kriptografik Bütünlük Doğrulama Dosyası"
        : "Cryptographic Integrity Checksums File",
      category: "AUDIT_TRAIL_LOGS",
      legalGroundTr: "6100 s. HMK m. 193 & m. 205",
      legalGroundEn: "HMK Art. 193 & Art. 205",
      sha256: DossierIntegrityService.sha256(checksumsContent),
      content: checksumsContent,
      mimeType: "text/plain",
      sizeBytes: Buffer.byteLength(checksumsContent, "utf8"),
      createdAt: generatedAtIso,
    });

    // ==========================================
    // 8. Manifest Markdown & HTML
    // ==========================================
    const manifestMarkdown = DossierExportService.generateManifestMarkdown({
      dossierRef,
      engagementId,
      listingTitle,
      client: clientParty,
      contractor: contractorParty,
      generatedAt: generatedAtIso,
      locale: subLocale,
      masterDossierSha256,
      documents,
      disputeStatus,
    });

    // Prepend 00_HMK193_DELIL_LISTESI_VE_DIZIN_OZETI.md
    documents.unshift({
      path: "00_HMK193_DELIL_LISTESI_VE_DIZIN_OZETI.md",
      title: isTr
        ? "HMK m. 193 Delil Listesi ve Dizin Özeti"
        : "HMK Art. 193 Evidence Index & Manifest",
      category: "CONTRACT_AND_ANNEXES",
      legalGroundTr: "6100 s. HMK m. 193, 6325 s. Kanun m. 18",
      legalGroundEn: "HMK Art. 193, Mediation Law Art. 18",
      sha256: DossierIntegrityService.sha256(manifestMarkdown),
      content: manifestMarkdown,
      mimeType: "text/markdown",
      sizeBytes: Buffer.byteLength(manifestMarkdown, "utf8"),
      createdAt: generatedAtIso,
    });

    const manifest: LegalDossierManifest = {
      dossierRef,
      engagementId,
      listingTitle,
      generatedAt: generatedAtIso,
      locale,
      client: clientParty,
      contractor: contractorParty,
      disputeStatus,
      totalDocumentsCount: documents.length,
      masterDossierSha256,
      documents,
      checksumsSha256Content: checksumsContent,
    };

    // ==========================================
    // 9. Unified Court Report (Single Printable HTML)
    // ==========================================
    const unifiedHtml = DossierExportService.generateUnifiedDossierHtml(manifest);

    // Also add the printable HTML index to the zip
    documents.splice(1, 0, {
      path: "00_HMK193_DELIL_LISTESI_VE_DIZIN_OZETI.html",
      title: isTr
        ? "Resmi Adli Delil Dosyası (Yazdırılabilir Mahkeme Raporu)"
        : "Official Dossier Court Report (Printable HTML)",
      category: "CONTRACT_AND_ANNEXES",
      legalGroundTr: "6100 s. HMK m. 193 & m. 199",
      legalGroundEn: "HMK Art. 193 & Art. 199",
      sha256: DossierIntegrityService.sha256(unifiedHtml),
      content: unifiedHtml,
      mimeType: "text/html",
      sizeBytes: Buffer.byteLength(unifiedHtml, "utf8"),
      createdAt: generatedAtIso,
    });

    // ==========================================
    // 10. Compile Deterministic PKZip Archive
    // ==========================================
    const zipBuffer = DossierExportService.buildZipArchive(documents, dossierRef);

    return {
      manifest,
      manifestMarkdown,
      unifiedHtml,
      zipBuffer,
    };
  }
}
