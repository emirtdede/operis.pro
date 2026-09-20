import { describe, it, expect } from "vitest";
import { ContractRecommendationEngine } from "@/src/modules/contracts/recommendation-engine";
import { ContractGeneratorService } from "@/src/modules/contracts/generator";
import { ComprehensiveDeedEngine } from "@/src/modules/contracts/comprehensive-deed-engine";
import { DossierService } from "@/src/modules/contracts/dossier-service";
import type { ContractGeneratorInput } from "@/src/modules/contracts/types";

describe("360° Software Legal Lifecycle (HLLG-RM Architecture & Complete Matrix)", () => {
  const mockClient = {
    displayName: "FinTech Yatırımları A.Ş.",
    email: "hukuk@fintechyatirim.com",
    phone: "+90 212 444 0100",
    city: "İstanbul",
    taxOrIdNumber: "1234567890",
    role: "CLIENT" as const,
  };

  const mockContractor = {
    displayName: "Ali Geliştirici",
    email: "ali@aligelistirici.dev",
    phone: "+90 532 123 4567",
    city: "İzmir",
    taxOrIdNumber: "98765432101",
    role: "CONTRACTOR" as const,
  };

  describe("Phase 1: Discovery & Preparation (Tanışma & Hazırlık)", () => {
    it("recommends Bilateral NDA (TTK 54-55) and Non-Solicitation (TTK 55) for corporate client with secret scope", () => {
      const recs = ContractRecommendationEngine.evaluateRecommendations({
        engagementId: "eng-phase-1",
        listingTitle: "Fintech Core Banking API & Database",
        categorySlug: "backend-gelistirme",
        budgetCurrency: "TRY",
        budgetMin: 90000,
        scopeSummary: "Gizli veritabanı şeması ve ödeme geçidi entegrasyonu.",
        isCorporateClient: true,
        locale: "tr",
      });

      const ids = recs.recommendedContracts.map((c) => c.id);
      expect(ids).toContain("BILATERAL_NDA");
      expect(ids).toContain("NON_SOLICITATION");

      const solicitItem = recs.recommendedContracts.find((c) => c.id === "NON_SOLICITATION");
      expect(solicitItem?.statutoryBasisTr).toContain("TTK m. 54-55");
    });
  });

  describe("Phase 2: Contract Execution & Safe Harbor (Sözleşme Akdi & Statü Güvencesi)", () => {
    it("recommends Core Service (TBK 470), Safe Harbor (İş K. 8) and Squad Consortium (TBK 620)", () => {
      const recs = ContractRecommendationEngine.evaluateRecommendations({
        engagementId: "eng-phase-2",
        listingTitle: "Enterprise Squad Delivery",
        categorySlug: "yazilim-gelistirme",
        budgetCurrency: "TRY",
        budgetMin: 120000,
        timelineDays: 60,
        isCorporateClient: true,
        isSquadEngagement: true,
        locale: "tr",
      });

      const ids = recs.recommendedContracts.map((c) => c.id);
      expect(ids).toContain("CORE_SERVICE");
      expect(ids).toContain("SAFE_HARBOR");
      expect(ids).toContain("SQUAD_CONSORTIUM");
      expect(ids).toContain("INFLATION_SHIELD");
    });
  });

  describe("Phase 3: Regulation, Tax & AI Governance (Regülasyon, Vergi & Yapay Zeka)", () => {
    it("recommends KVKK DPA, EU AI Act Governance and Software Export for overseas client", () => {
      const recs = ContractRecommendationEngine.evaluateRecommendations({
        engagementId: "eng-phase-3",
        listingTitle: "AI-Powered Customer Data Analysis Tool",
        categorySlug: "yapay-zeka",
        budgetCurrency: "USD",
        budgetMin: 15000,
        scopeSummary: "Kişisel verileri işleyen LLM ve yapay zeka prompt mimarisi.",
        hasForeignClient: true,
        locale: "tr",
      });

      const ids = recs.recommendedContracts.map((c) => c.id);
      expect(ids).toContain("KVKK_DPA");
      expect(ids).toContain("AI_GOVERNANCE");
      expect(ids).toContain("SOFTWARE_EXPORT");
    });
  });

  describe("Phase 4: Development & Code Security (Geliştirme & Kod Güvenliği)", () => {
    it("generates Clean Code Warranty (TCK 243-245) with OWASP standards and penal liability", () => {
      const warranty = ComprehensiveDeedEngine.generateCleanCodeWarranty({
        engagementId: "eng-phase-4-sec",
        listingTitle: "Secure Banking Microservices",
        contractor: { ...mockContractor, userId: "c-1" },
        client: { ...mockClient, userId: "u-1" },
        commitHash: "abc123def456",
        locale: "tr",
      });

      expect(warranty.warrantyId).toContain("OPR-SEC-");
      expect(warranty.statutoryGroundTr).toContain("5237 s. TCK m. 243-245");
      expect(warranty.owaspStandards.length).toBeGreaterThanOrEqual(4);
      expect(warranty.liquidatedDamagesPercentage).toBe(100);

      const markdown = ComprehensiveDeedEngine.formatCleanCodeMarkdown(warranty, "tr");
      expect(markdown).toContain("TEMİZ KOD, ARKA KAPI İÇERMEME VE SİBER GÜVENLİK TAAHHÜTNAMESİ");
      expect(markdown).toContain("5237 s. TCK m. 243-245");
      expect(markdown).toContain("OWASP Top 10");
      expect(markdown).toContain(warranty.sha256);
    });

    it("generates FOSS License Contamination Shield with Permissive Whitelist and Copyleft Blacklist", () => {
      const fossWarranty = ComprehensiveDeedEngine.generateFossComplianceWarranty({
        engagementId: "eng-phase-4-foss",
        listingTitle: "Proprietary SaaS Platform",
        contractor: { ...mockContractor, userId: "c-1" },
        client: { ...mockClient, userId: "u-1" },
        locale: "tr",
      });

      expect(fossWarranty.warrantyId).toContain("OPR-FOSS-");
      expect(fossWarranty.permittedLicenses).toContain("MIT License");
      expect(fossWarranty.permittedLicenses).toContain("Apache License 2.0");
      expect(fossWarranty.prohibitedLicenses).toContain("GNU General Public License (GPL v2 / GPL v3)");
      expect(fossWarranty.prohibitedLicenses).toContain("GNU Affero General Public License (AGPL v3)");
      expect(fossWarranty.curePeriodDays).toBe(14);

      const markdown = ComprehensiveDeedEngine.formatFossComplianceMarkdown(fossWarranty, "tr");
      expect(markdown).toContain("AÇIK KAYNAK LİSANS SAFLIĞI VE COPYLEFT BULAŞMAMA ŞARTNAMESİ");
      expect(markdown).toContain("5846 s. FSEK m. 52");
      expect(markdown).toContain("14 İş Günü");
      expect(markdown).toContain(fossWarranty.sha256);
    });
  });

  describe("Phase 5: Handover, Payment & IP Transfer (Teslimat, Ödeme & IP Devri)", () => {
    it("compiles contract with FSEK m. 52, Clean Code, FOSS, and Non-Solicitation annexes", () => {
      const input: ContractGeneratorInput = {
        engagementId: "eng-phase-5-compile",
        listingTitle: "Fullstack Mobile App Platform",
        category: "Mobil Yazılım",
        matchedAt: "2026-09-18T10:00:00Z",
        scopeSummary: "Mobil ve backend API teslimatı.",
        budgetLabel: "60.000 TL",
        timelineLabel: "4 Hafta",
        client: mockClient,
        contractor: mockContractor,
        selectedContracts: [
          "CORE_SERVICE",
          "FSEK_IP_TRANSFER",
          "BILATERAL_NDA",
          "CYBER_SECURITY_CLEAN_CODE",
          "FOSS_LICENSE_COMPLIANCE",
          "NON_SOLICITATION",
        ],
        locale: "tr",
      };

      const result = ContractGeneratorService.generateContract(input);
      expect(result.metadata.cleanCodeWarrantyIncluded).toBe(true);
      expect(result.metadata.fossComplianceIncluded).toBe(true);
      expect(result.metadata.nonSolicitationIncluded).toBe(true);
      expect(result.metadata.fsekClauseIncluded).toBe(true);

      // Verify all 3 annexes are embedded in canonical markdown
      expect(result.markdown).toContain("EK-6: TEMİZ KOD, ARKA KAPI İÇERMEME VE SİBER GÜVENLİK TAAHHÜTNAMESİ");
      expect(result.markdown).toContain("EK-7: AÇIK KAYNAK LİSANS SAFLIĞI VE COPYLEFT BULAŞMAMA ŞARTNAMESİ");
      expect(result.markdown).toContain("EK-8: MÜŞTERİ VE PERSONEL AYARTMAMA & PLATFORM SADAKAT PROTOKOLÜ");

      // Verify HTML report has print sections for all 3 annexes
      expect(result.htmlContent).toContain("EK-6: Temiz Kod ve Siber Güvenlik Taahhütnamesi");
      expect(result.htmlContent).toContain("EK-7: Açık Kaynak Lisans Saflığı");
      expect(result.htmlContent).toContain("EK-8: Müşteri ve Personel Ayartmama");
    });
  });

  describe("Phase 6: Closing, Discharge & Forensics (Kapanış, Tasfiye & Adli İspat)", () => {
    it("generates Mutual Release & Discharge Deed (TBK m. 132 / HMK m. 313) on successful project completion", () => {
      const deed = ComprehensiveDeedEngine.generateMutualReleaseDeed({
        engagementId: "eng-phase-6-release",
        listingTitle: "Fintech Mobile App",
        client: { ...mockClient, userId: "u-client-1" },
        contractor: { ...mockContractor, userId: "u-dev-1" },
        settledMilestones: [
          {
            sequence: 1,
            title: "Tasarım ve Mimari",
            amount: 25000,
            currency: "TRY",
            paymentReference: "EFT-101",
            paidConfirmedAt: "2026-09-10T12:00:00Z",
            dualSeal: "SEAL-PHASE-1",
          },
          {
            sequence: 2,
            title: "Fonksiyonel Demo ve Kod",
            amount: 35000,
            currency: "TRY",
            paymentReference: "EFT-102",
            paidConfirmedAt: "2026-09-18T16:00:00Z",
            dualSeal: "SEAL-PHASE-2",
          },
        ],
        totalSettledAmount: 60000,
        currency: "TRY",
        locale: "tr",
      });

      expect(deed.deedId).toContain("OPR-DISCHARGE-");
      expect(deed.totalSettledAmount).toBe(60000);
      expect(deed.statutoryGroundTr).toContain("6098 s. TBK m. 132 & m. 166, 6100 s. HMK m. 313");
      expect(deed.masterSha256).toHaveLength(64);

      const markdown = ComprehensiveDeedEngine.formatMutualReleaseMarkdown(deed, "tr");
      expect(markdown).toContain("SÖZLEŞME SONU KARŞILIKLI İBRANAME VE SULH SENEDİ");
      expect(markdown).toContain("60.000 TRY");
      expect(markdown).toContain("Dava ve Takipten Feragat (HMK m. 313)");
      expect(markdown).toContain("TBK m. 477/2 uyarınca yüklenicinin kasten gizlediği hileli ve ağır kusurlu ayıplara karşı haklar saklıdır");
    });

    it("generates Early Termination & Liquidation Deed (TBK m. 484-486) on dispute or early offboarding", () => {
      const deed = ComprehensiveDeedEngine.generateTerminationLiquidationDeed({
        engagementId: "eng-phase-6-terminate",
        listingTitle: "AI Chat Platform",
        client: { ...mockClient, userId: "u-client-1" },
        contractor: { ...mockContractor, userId: "u-dev-1" },
        ground: "CLIENT_TERMINATION_TBK484",
        settledMilestones: [
          {
            sequence: 1,
            title: "Faz 1 UI Prototip",
            amount: 20000,
            currency: "TRY",
            paymentReference: "EFT-201",
          },
        ],
        unfulfilledMilestones: [
          { sequence: 2, title: "Faz 2 Backend", amount: 30000, currency: "TRY" },
        ],
        totalSettledAmount: 20000,
        totalUnfulfilledAmount: 30000,
        currency: "TRY",
        credentialsReturned: true,
        sourceCodeTransferred: true,
        documentationProvided: true,
        locale: "tr",
      });

      expect(deed.deedId).toContain("OPR-LIQUIDATION-");
      expect(deed.totalSettledAmount).toBe(20000);
      expect(deed.totalUnfulfilledAmount).toBe(30000);
      expect(deed.statutoryGroundTr).toContain("6098 s. TBK m. 484-486");

      const markdown = ComprehensiveDeedEngine.formatTerminationLiquidationMarkdown(deed, "tr");
      expect(markdown).toContain("ERKEN FESİH, İKÂLE VE TASFİYE PROTOKOLÜ");
      expect(markdown).toContain("6098 sayılı TBK m. 484");
      expect(markdown).toContain("20.000 TRY");
      expect(markdown).toContain("30.000 TRY");
      expect(markdown).toContain("Sunucu, API ve Bulut Yönetici Yetkileri İade Edildi: **EVET**");
    });

    it("compiles the complete 360-degree forensic evidentiary dossier (HMK m. 193) with all exhibits and master root hash", async () => {
      const result = await DossierService.buildDossier({
        engagementId: "eng-360-complete-test",
        requestingUserId: mockClient.email,
        locale: "tr",
      });

      expect(result.manifest).toBeDefined();
      expect(result.manifest.masterDossierSha256).toHaveLength(64);
      expect(result.manifest.totalDocumentsCount).toBeGreaterThanOrEqual(10);

      const paths = result.manifest.documents.map((d) => d.path);

      // Check all 8 exhibit categories are represented
      expect(paths.some((p) => p.startsWith("00_HMK193_DELIL_LISTESI_VE_DIZIN_OZETI"))).toBe(true);
      expect(paths.some((p) => p.startsWith("01_ASIL_SOZLESME_VE_EKLERI/"))).toBe(true);
      expect(paths.some((p) => p.startsWith("02_KABUL_TESTLERI_VE_DOD/"))).toBe(true);
      expect(paths.some((p) => p.startsWith("03_REVIZYON_VE_EK_TALEPLER_LOGU/"))).toBe(true);
      expect(paths.some((p) => p.startsWith("04_TESLIM_TUTANAKLARI/"))).toBe(true);
      expect(paths.some((p) => p.startsWith("05_HAKEDIS_VE_ODEME_DEFTERI/"))).toBe(true);
      expect(paths.some((p) => p.startsWith("06_DENETIM_IZI_VE_ZAMAN_DAMGALARI/"))).toBe(true);
      expect(paths.some((p) => p.startsWith("07_FIKRI_MULKIYET_VE_DEVIR_TESCIL/"))).toBe(true);
      expect(paths.some((p) => p.startsWith("08_KAPANIS_VE_SULH_IBRA/"))).toBe(true);

      // Check the 5 new 360 instruments in the dossier archive
      expect(paths.some((p) => p.includes("EK_6_TEMIZ_KOD_VE_SIBER_GUVENLIK.md"))).toBe(true);
      expect(paths.some((p) => p.includes("EK_7_ACIK_KAYNAK_LISANS_SAFLIGI.md"))).toBe(true);
      expect(paths.some((p) => p.includes("EK_8_MUSTERI_PERSONEL_AYARTMAMA.md"))).toBe(true);
      expect(paths.some((p) => p.includes("SOZLESME_SONU_IBRANAME_VE_SULH_SENEDI.md"))).toBe(true);

      // Verify GNU checksums file format
      expect(result.manifest.checksumsSha256Content).toContain("  08_KAPANIS_VE_SULH_IBRA/");

      // Verify ZIP archive is valid
      expect(result.zipBuffer.length).toBeGreaterThan(1000);
      expect(result.zipBuffer.readUInt32LE(0)).toBe(0x04034b50); // PK0304 magic
    });
  });
});
