import { describe, it, expect } from "vitest";
import { SoftwareExportEngine } from "@/src/modules/finance/software-export-engine";
import type { SoftwareExportConfig } from "@/src/modules/finance/software-export-types";
import { calculateFreelanceTax } from "@/src/modules/finance/tax-calculator";
import { ContractGeneratorService } from "@/src/modules/contracts/generator";
import { DossierService } from "@/src/modules/contracts/dossier-service";

describe("GVK 89/13 & KDVK 11/1-a Software Export & Zero-VAT Engine Suite", () => {
  const defaultConfig = SoftwareExportEngine.getDefaultConfig();

  describe("1. evaluateExportEligibility - Statutory Qualification Matrix", () => {
    it("evaluates default valid configuration as FULLY_ELIGIBLE (100% Tax Deduction & 0% VAT)", () => {
      const evaluation = SoftwareExportEngine.evaluateExportEligibility(defaultConfig);

      expect(evaluation.status).toBe("FULLY_ELIGIBLE");
      expect(evaluation.isEligibleForFullTaxDeduction).toBe(true);
      expect(evaluation.isEligibleForVatZero).toBe(true);
      expect(evaluation.taxDeductionRate).toBe(100);
      expect(evaluation.vatRate).toBe(0);
      expect(evaluation.withholdingRate).toBe(0);
      expect(evaluation.gibInvoiceExemptionCode).toBe("302");
      expect(evaluation.missingRequirements.length).toBe(0);
      expect(evaluation.summaryTr).toContain("GVK 89/13 uyarınca %100");
      expect(evaluation.summaryEn).toContain("100% Tax Deduction");
      expect(evaluation.statutoryBasisTr).toContain("193 s. GVK m. 89/13");
      expect(evaluation.statutoryBasisTr).toContain("3065 s. KDVK m. 11/1-a");
      expect(evaluation.auditProtectionPointsTr.length).toBeGreaterThanOrEqual(4);
    });

    it("evaluates as CONDITIONALLY_ELIGIBLE when repatriationDeclared is false", () => {
      const pendingRepatriationConfig: SoftwareExportConfig = {
        ...defaultConfig,
        repatriationDeclared: false,
      };

      const evaluation = SoftwareExportEngine.evaluateExportEligibility(pendingRepatriationConfig);

      expect(evaluation.status).toBe("CONDITIONALLY_ELIGIBLE");
      expect(evaluation.isEligibleForVatZero).toBe(true); // VAT is zero at issuance
      expect(evaluation.isEligibleForFullTaxDeduction).toBe(false); // Tax deduction requires repatriation
      expect(evaluation.taxDeductionRate).toBe(0);
      expect(evaluation.missingRequirements.length).toBe(1);
      expect(evaluation.missingRequirements[0]).toContain("Döviz bedeli");
      expect(evaluation.summaryTr).toContain("Şartlı");
    });

    it("evaluates as NON_COMPLIANT when client is a domestic Turkish entity", () => {
      const domesticClientConfig: SoftwareExportConfig = {
        ...defaultConfig,
        clientCountry: "Türkiye",
        isForeignEntity: false,
      };

      const evaluation = SoftwareExportEngine.evaluateExportEligibility(domesticClientConfig);

      expect(evaluation.status).toBe("NON_COMPLIANT");
      expect(evaluation.isEligibleForVatZero).toBe(false);
      expect(evaluation.isEligibleForFullTaxDeduction).toBe(false);
      expect(evaluation.vatRate).toBe(20);
      expect(evaluation.taxDeductionRate).toBe(0);
      expect(evaluation.gibInvoiceExemptionCode).toBeNull();
      expect(evaluation.missingRequirements.length).toBeGreaterThanOrEqual(1);
    });

    it("evaluates as NON_COMPLIANT when deliverables are utilized inside Turkey", () => {
      const domesticUseConfig: SoftwareExportConfig = {
        ...defaultConfig,
        isServiceUtilizedAbroad: false,
      };

      const evaluation = SoftwareExportEngine.evaluateExportEligibility(domesticUseConfig);

      expect(evaluation.status).toBe("NON_COMPLIANT");
      expect(evaluation.isEligibleForVatZero).toBe(false);
      expect(evaluation.vatRate).toBe(20);
      expect(evaluation.missingRequirements.some((r) => r.includes("Türkiye dışında"))).toBe(true);
    });
  });

  describe("2. Statutory Text & Template Generators", () => {
    it("generates Turkish GİB e-Fatura / e-SMM exemption note with Code 302 and mandatory statutory clauses", () => {
      const note = SoftwareExportEngine.generateInvoiceNote(defaultConfig, "tr");

      expect(note).toContain("GİB İSTİSNA KODU: 302");
      expect(note).toContain("Hizmet İhracatı");
      expect(note).toContain("193 sayılı Gelir Vergisi Kanunu'nun 89/13. maddesi");
      expect(note).toContain("7491 sayılı Kanun");
      expect(note).toContain("3065 sayılı Katma Değer Vergisi Kanunu m. 11/1-a");
      expect(note).toContain("münhasıran yurt dışındaki müşteri için üretilmiş");
      expect(note).toContain("Türkiye dışında faydalanılmıştır");
      expect(note).toContain("KDV Oranı: %0");
      expect(note).toContain("Stopaj Kesintisi: %0");
    });

    it("generates English invoice exemption declaration note", () => {
      const note = SoftwareExportEngine.generateInvoiceNote(defaultConfig, "en");

      expect(note).toContain("EXEMPTION CODE: 302");
      expect(note).toContain("Cross-Border Service Export");
      expect(note).toContain("Income Tax Law (GVK) Art. 89/13");
      expect(note).toContain("Value Added Tax Law (KDVK) Art. 11/1-a");
      expect(note).toContain("exclusively consumed outside the Republic of Turkey");
      expect(note).toContain("VAT Rate: 0%");
    });

    it("generates ready-to-submit bank remittance repatriation declaration letter", () => {
      const letter = SoftwareExportEngine.generateBankRemittanceDeclaration(
        defaultConfig,
        "tr",
        "Apex Global Ventures Inc.",
        "Ahmet Yılmaz",
        "10,000 USD"
      );

      expect(letter).toContain("T.C. ZİRAAT BANKASI / İLGİLİ ŞUBE MÜDÜRLÜĞÜ'NE");
      expect(letter).toContain("Ahmet Yılmaz");
      expect(letter).toContain("Apex Global Ventures Inc.");
      expect(letter).toContain("10,000 USD");
      expect(letter).toContain("GVK 89/13");
      expect(letter).toContain("Yazılım Hizmet İhracatı Bedeli");
      expect(letter).toContain("TCMB İhracat Genelgesi");
      expect(letter).toContain("Döviz Alım Belgesi (DAB)");
    });

    it("generates EK-5 Contract Annex Markdown & HTML", () => {
      const annexMd = SoftwareExportEngine.generateExportAnnexMarkdown(
        defaultConfig,
        "tr",
        "Apex Global Ventures Inc.",
        "Ahmet Yılmaz"
      );

      expect(annexMd).toContain("EK-5: YAZILIM İHRACATI %100 GELİR VERGİSİ İNDİRİMİ");
      expect(annexMd).toContain("MADDE 1: HUKUKİ MEVZUAT DAYANAĞI");
      expect(annexMd).toContain("MADDE 2: MÜNHASIRAN YURT DIŞINDA FAYDALANMA GÜVENCESİ");
      expect(annexMd).toContain("MADDE 3: %0 KDV VE GİB E-FATURA İSTİSNA KODU (KOD 302)");
      expect(annexMd).toContain("MADDE 4: DÖVİZ BEDELİNİN TEVSİKİ");
      expect(annexMd).toContain("MADDE 5: 6100 SAYILI HMK m. 193 UYARINCA ADLİ VE MALİ DELİL NİTELİĞİ");

      const annexHtml = SoftwareExportEngine.generateExportAnnexHtml(defaultConfig, "tr");
      expect(annexHtml).toContain("EK-5: Yazılım İhracatı %100 Vergi İndirimi");
      expect(annexHtml).toContain("Kod 302");
    });
  });

  describe("3. Tax Calculator Integration (calculateFreelanceTax)", () => {
    it("applies 0% VAT and 0% Withholding when isSoftwareExport is enabled", () => {
      const taxResult = calculateFreelanceTax({
        amount: 100000,
        direction: "GROSS_TO_NET",
        clientType: "CORPORATE",
        documentType: "SMM",
        currency: "USD",
        isSoftwareExport: true,
        exportConfig: defaultConfig,
      });

      expect(taxResult.vatRate).toBe(0);
      expect(taxResult.vatAmount).toBe(0);
      expect(taxResult.withholdingRate).toBe(0);
      expect(taxResult.withholdingAmount).toBe(0);
      expect(taxResult.grossAmount).toBe(100000);
      expect(taxResult.netCashInHand).toBe(100000);
      expect(taxResult.invoiceTotal).toBe(100000);
      expect(taxResult.isSoftwareExport).toBe(true);
      expect(taxResult.proposalNoteTr).toContain("89/13");
      expect(taxResult.proposalNoteTr).toContain("302");
    });
  });

  describe("4. Contract Generator Integration (ContractGeneratorService)", () => {
    it("generates contract with cross-border software export provisions and EK-5 addendum", () => {
      const contract = ContractGeneratorService.generateContract({
        engagementId: "eng-export-101",
        listingTitle: "Cross-Border FinTech Core Engine",
        category: "Fintech Yazılımı",
        matchedAt: "2026-09-01T10:00:00Z",
        scopeSummary: "High-performance matching and payment routing infrastructure for EU clients.",
        budgetLabel: "$25,000 USD",
        timelineLabel: "8 Hafta",
        client: {
          displayName: "FinTech Global Ltd.",
          email: "legal@fintechglobal.co.uk",
          role: "CLIENT",
          city: "London",
        },
        contractor: {
          displayName: "Caner Yılmaz",
          email: "caner@devstudio.com",
          role: "CONTRACTOR",
          city: "İstanbul",
        },
        locale: "tr",
        softwareExportConfig: defaultConfig,
      });

      expect(contract.metadata.softwareExportIncluded).toBe(true);
      expect(contract.softwareExportConfig?.enabled).toBe(true);
      expect(contract.softwareExportEvaluation?.status).toBe("FULLY_ELIGIBLE");

      // Verify Madde 3.2 text modification
      expect(contract.markdown).toContain("Yazılım İhracatı");
      expect(contract.markdown).toContain("GİB İstisna Kodu: 302");
      expect(contract.markdown).toContain("EK-5 Yazılım İhracatı ve Vergi İstisnası Şartnamesi");

      // Verify EK-5 is attached
      expect(contract.markdown).toContain("EK-5: YAZILIM İHRACATI %100 GELİR VERGİSİ İNDİRİMİ");
      expect(contract.htmlContent).toContain("EK-5: Yazılım İhracatı %100 Vergi İndirimi");

      // Verify SHA-256 fingerprint was generated over the complete content
      expect(contract.sha256Fingerprint).toMatch(/^[a-f0-9]{64}$/);
    });

    it("generates English contract with ANNEX-5 when locale is en", () => {
      const contract = ContractGeneratorService.generateContract({
        engagementId: "eng-export-en-202",
        listingTitle: "Cloud Infrastructure Modernization",
        category: "Cloud Engineering",
        matchedAt: "2026-09-01T10:00:00Z",
        scopeSummary: "Kubernetes cluster orchestration and microservices deployment.",
        budgetLabel: "€18,000 EUR",
        client: {
          displayName: "Acme European Holdings BV",
          email: "ops@acme.nl",
          role: "CLIENT",
          city: "Amsterdam",
        },
        contractor: {
          displayName: "Burak Kaya",
          email: "burak@cloudexperts.io",
          role: "CONTRACTOR",
        },
        locale: "en",
        softwareExportConfig: {
          ...defaultConfig,
          clientCountry: "Netherlands",
          invoiceCurrency: "EUR",
        },
      });

      expect(contract.metadata.softwareExportIncluded).toBe(true);
      expect(contract.markdown).toContain("Cross-Border Software Export");
      expect(contract.markdown).toContain("ANNEX-5 Software Export & Tax Exemption Addendum");
      expect(contract.markdown).toContain("ANNEX-5: 100% CROSS-BORDER SOFTWARE EXPORT TAX INCENTIVE");
    });
  });

  describe("5. Dossier Service Integration (HMK m. 193 Evidentiary Package)", () => {
    it("includes EK-5, GİB invoice note, and bank remittance declaration in forensic dossier", async () => {
      const dossier = await DossierService.buildDossier({
        engagementId: "eng-test-export-303",
        requestingUserId: "user-test-contractor",
        locale: "tr",
        softwareExportConfig: defaultConfig,
      });

      expect(dossier.manifest.documents.length).toBeGreaterThanOrEqual(8);

      const ek5Doc = dossier.manifest.documents.find(
        (d) => d.path === "01_ASIL_SOZLESME_VE_EKLERI/EK_5_YAZILIM_IHRACATI_VE_VERGI_ISTISNASI.md"
      );
      expect(ek5Doc).toBeDefined();
      expect(ek5Doc?.legalGroundTr).toContain("193 s. GVK m. 89/13");
      expect(ek5Doc?.legalGroundTr).toContain("3065 s. KDVK m. 11/1-a");

      const invoiceNoteDoc = dossier.manifest.documents.find(
        (d) => d.path === "01_ASIL_SOZLESME_VE_EKLERI/EK_5A_GIB_E_FATURA_ISTISNA_METNI.txt"
      );
      expect(invoiceNoteDoc).toBeDefined();
      expect(invoiceNoteDoc?.content).toContain("GİB İSTİSNA KODU: 302");

      const bankLetterDoc = dossier.manifest.documents.find(
        (d) => d.path === "01_ASIL_SOZLESME_VE_EKLERI/EK_5B_BANKA_DOVIZ_BEYAN_TALEP_METNI.txt"
      );
      expect(bankLetterDoc).toBeDefined();
      expect(bankLetterDoc?.content).toContain("T.C. ZİRAAT BANKASI / İLGİLİ ŞUBE MÜDÜRLÜĞÜ'NE");

      // Verify ZIP archive generation & Master SHA-256 root
      expect(dossier.manifest.masterDossierSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(dossier.zipBuffer.length).toBeGreaterThan(1000);
      expect(dossier.manifest.checksumsSha256Content).toContain(
        "01_ASIL_SOZLESME_VE_EKLERI/EK_5_YAZILIM_IHRACATI_VE_VERGI_ISTISNASI.md"
      );
    });
  });
});
