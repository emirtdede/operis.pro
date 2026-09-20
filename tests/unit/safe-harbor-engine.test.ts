import { describe, it, expect } from "vitest";
import { SafeHarborEngine } from "@/src/modules/contracts/safe-harbor-engine";
import type { SafeHarborConfig } from "@/src/modules/contracts/safe-harbor-types";
import { ContractGeneratorService } from "@/src/modules/contracts/generator";
import { DossierService } from "@/src/modules/contracts/dossier-service";

describe("4857 Sayılı İş Kanunu m. 8 & TBK m. 470 Safe Harbor Engine Suite", () => {
  const safeDefaultConfig = SafeHarborEngine.getDefaultConfig();

  describe("1. evaluateMisclassificationRisk - Algorithm & Risk Scoring", () => {
    it("evaluates default independent configuration as SAFE_HARBOR (0 risk score)", () => {
      const evaluation = SafeHarborEngine.evaluateMisclassificationRisk(safeDefaultConfig);

      expect(evaluation.riskScore).toBe(0);
      expect(evaluation.riskLevel).toBe("SAFE_HARBOR");
      expect(evaluation.summaryTr).toContain("Güvenli Liman");
      expect(evaluation.summaryEn).toContain("Safe Harbor");
      expect(evaluation.legalGroundTr).toContain("4857");
      expect(evaluation.factorBreakdown).toHaveLength(6);
    });

    it("evaluates maximum subordination configuration as CRITICAL_HAZARD (100 risk score)", () => {
      const maximumRiskConfig: SafeHarborConfig = {
        enabled: true,
        scheduleAutonomy: "FIXED_BUSINESS_HOURS", // 25p
        equipmentOwnership: "EMPLOYER_MANDATORY_HARDWARE", // 15p
        managementHierarchy: "DIRECT_SUPERVISOR_SUBORDINATION", // 20p
        exclusivityStatus: "STRICT_EXCLUSIVITY_FULL_TIME", // 20p
        invoicingEntityStatus: "INDIVIDUAL_NO_TAX_ID", // 10p
        corporateIntegration: "INTERNAL_EMAIL_AND_TITLE", // 10p
        rightOfSubstitutionAllowed: false, // 0 discount -> Total: 100p
      };

      const evaluation = SafeHarborEngine.evaluateMisclassificationRisk(maximumRiskConfig);

      expect(evaluation.riskScore).toBe(100);
      expect(evaluation.riskLevel).toBe("CRITICAL_HAZARD");
      expect(evaluation.summaryTr).toContain("Yüksek Gizli İstihdam Tehlikesi");
      expect(evaluation.summaryEn).toContain("Critical Misclassification Hazard");
      expect(evaluation.primaryRisksTr.length).toBeGreaterThanOrEqual(4);
      expect(evaluation.remedialMitigationsTr.length).toBeGreaterThanOrEqual(4);
      expect(evaluation.factorBreakdown.every((f) => f.isHighRisk)).toBe(true);
    });

    it("evaluates moderate risk profile accurately (MODERATE_WARNING)", () => {
      const moderateConfig: SafeHarborConfig = {
        enabled: true,
        scheduleAutonomy: "CORE_HOURS_OVERLAP", // 10p
        equipmentOwnership: "MIXED_TOOLS", // 7p
        managementHierarchy: "COLLABORATIVE_AGILE", // 8p
        exclusivityStatus: "NON_COMPETE_ONLY", // 5p
        invoicingEntityStatus: "REGISTERED_COMPANY_INVOICE", // 0p
        corporateIntegration: "GUEST_ACCESS_SLACK_ONLY", // 3p
        rightOfSubstitutionAllowed: false, // Gross: 33p
      };

      const evaluation = SafeHarborEngine.evaluateMisclassificationRisk(moderateConfig);

      expect(evaluation.riskScore).toBe(33);
      expect(evaluation.riskLevel).toBe("MODERATE_WARNING");
      expect(evaluation.summaryTr).toContain("Orta Risk");
      expect(evaluation.summaryEn).toContain("Moderate Risk");
    });

    it("applies -5 point substitution discount properly", () => {
      const configWithSubstitution: SafeHarborConfig = {
        enabled: true,
        scheduleAutonomy: "CORE_HOURS_OVERLAP", // 10p
        equipmentOwnership: "MIXED_TOOLS", // 7p
        managementHierarchy: "COLLABORATIVE_AGILE", // 8p
        exclusivityStatus: "OPEN_MARKET_MULTIPLE_CLIENTS", // 0p
        invoicingEntityStatus: "REGISTERED_COMPANY_INVOICE", // 0p
        corporateIntegration: "EXTERNAL_CONSULTANT_IDENTITY", // 0p
        rightOfSubstitutionAllowed: true, // Gross: 25p - 5p = 20p
      };

      const evaluation = SafeHarborEngine.evaluateMisclassificationRisk(configWithSubstitution);

      expect(evaluation.riskScore).toBe(20);
      expect(evaluation.riskLevel).toBe("SAFE_HARBOR"); // Dropped from 25 (warning) to 20 (safe harbor)!
    });
  });

  describe("2. Annex-3 Markdown & HTML Generation", () => {
    it("generates comprehensive Turkish Markdown addendum with statutory articles", () => {
      const md = SafeHarborEngine.generateSafeHarborAnnexMarkdown(
        safeDefaultConfig,
        "tr",
        "Acme Corp",
        "Ahmet Yılmaz"
      );

      expect(md).toContain("### EK-3: 4857 SAYILI İŞ KANUNU m. 8 UYUMLU BAĞIMSIZ YÜKLENİCİ");
      expect(md).toContain("Acme Corp");
      expect(md).toContain("Ahmet Yılmaz");
      expect(md).toContain("MADDE 1: TARAFLARIN HUKUKİ SIFATI");
      expect(md).toContain("MADDE 2: ÇALIŞMA ZAMANI, YERİ VE METODOLOJİSİ SERBESTİSİ");
      expect(md).toContain("MADDE 3: ARAÇ, GEREÇ VE EKİPMAN BAĞIMSIZLIĞI (BYOD PRENSİBİ)");
      expect(md).toContain("MADDE 4: HİYERARŞİK AMİR VE TALİMAT YOKLUĞU");
      expect(md).toContain("MADDE 5: MÜNHASIRLIK YOKLUĞU VE ÇOKLU MÜŞTERİ ÖZGÜRLÜĞÜ");
      expect(md).toContain("MADDE 6: SOSYAL GÜVENLİK (SGK), VERGİ VE YASAL SORUMLULUKLAR");
      expect(md).toContain("MADDE 7: İKAME HAKKI");
      expect(md).toContain("MADDE 8: MÜNHASIR DELİL SÖZLEŞMESİ VE UYUŞMAZLIKLARIN ÇÖZÜMÜ");
      expect(md).toContain("HMK m. 193");
    });

    it("generates comprehensive English Markdown addendum with common law alignment", () => {
      const md = SafeHarborEngine.generateSafeHarborAnnexMarkdown(
        safeDefaultConfig,
        "en",
        "Global FinTech Ltd",
        "John Doe"
      );

      expect(md).toContain("### ANNEX-3: INDEPENDENT CONTRACTOR SAFE HARBOR & ANTI-MISCLASSIFICATION PROTOCOL");
      expect(md).toContain("Global FinTech Ltd");
      expect(md).toContain("John Doe");
      expect(md).toContain("SECTION 1: LEGAL STATUS & COMPLETE REJECTION OF EMPLOYMENT");
      expect(md).toContain("SECTION 2: AUTONOMY OF TIME, LOCATION & METHODOLOGY");
      expect(md).toContain("SECTION 3: TOOL & HARDWARE OWNERSHIP (BYOD PRINCIPLE)");
      expect(md).toContain("SECTION 4: ABSENCE OF MANAGERIAL HIERARCHY");
      expect(md).toContain("SECTION 5: NON-EXCLUSIVITY & CONCURRENT CLIENT FREEDOM");
      expect(md).toContain("SECTION 6: TAXES, SOCIAL SECURITY & REMUNERATION EXCLUSIONS");
      expect(md).toContain("SECTION 7: RIGHT OF SUBSTITUTION");
      expect(md).toContain("SECTION 8: EXCLUSIVE EVIDENCE & JURISDICTION");
      expect(md).toContain("HMK Art. 193");
    });

    it("generates printable styled HTML for Annex-3 with score badge", () => {
      const html = SafeHarborEngine.generateSafeHarborAnnexHtml(safeDefaultConfig, "tr");

      expect(html).toContain("safe-harbor-annex");
      expect(html).toContain("EK-3: 4857 Sayılı İş Kanunu m. 8 Uyumlu Bağımsız Yüklenici Güvenli Liman Şartnamesi");
      expect(html).toContain("GÜVENLİ LİMAN");
      expect(html).toContain("(0/100)");
      expect(html).toContain("BYOD");
    });
  });

  describe("3. ContractGeneratorService Integration", () => {
    const baseInput = {
      engagementId: "eng-safe-harbor-001",
      listingTitle: "FinTech Mobil Bankacılık Çekirdek Mimarisi",
      category: "Mobil Uygulama",
      matchedAt: "2026-09-10T10:00:00Z",
      scopeSummary: "React Native ve Node.js mikroservis çekirdek mimari geliştirmesi.",
      budgetLabel: "120.000 TL",
      timelineLabel: "6 Hafta",
      client: {
        displayName: "FinTech Yatırımları A.Ş.",
        email: "kurumsal@fintech.com.tr",
        role: "CLIENT" as const,
      },
      contractor: {
        displayName: "Mehmet Demir (Kıdemli Mimar)",
        email: "mehmet@demir.dev",
        role: "CONTRACTOR" as const,
      },
      locale: "tr" as const,
    };

    it("attaches Annex-3 when safeHarborConfig is enabled", () => {
      const result = ContractGeneratorService.generateContract({
        ...baseInput,
        safeHarborConfig: safeDefaultConfig,
      });

      expect(result.metadata.safeHarborIncluded).toBe(true);
      expect(result.safeHarborConfig).toEqual(safeDefaultConfig);
      expect(result.safeHarborEvaluation).not.toBeNull();
      expect(result.safeHarborEvaluation?.riskLevel).toBe("SAFE_HARBOR");

      // Verify Markdown includes EK-3
      expect(result.markdown).toContain("### EK-3: 4857 SAYILI İŞ KANUNU m. 8 UYUMLU BAĞIMSIZ YÜKLENİCİ");
      expect(result.markdown).toContain("MADDE 1: TARAFLARIN HUKUKİ SIFATI VE İŞÇİ-İŞVEREN İLİŞKİSİNİN KESİN REDDİ");

      // Verify HTML includes safe harbor container
      expect(result.htmlContent).toContain("safe-harbor-annex");

      // Verify SHA-256 seal is computed over the entire contract including EK-3
      expect(result.sha256Fingerprint).toMatch(/^[a-f0-9]{64}$/);
    });

    it("omits Annex-3 when safeHarborConfig is not provided or disabled", () => {
      const result = ContractGeneratorService.generateContract({
        ...baseInput,
        safeHarborConfig: null,
      });

      expect(result.metadata.safeHarborIncluded).toBe(false);
      expect(result.safeHarborConfig).toBeNull();
      expect(result.safeHarborEvaluation).toBeNull();
      expect(result.markdown).not.toContain("EK-3: 4857 SAYILI İŞ KANUNU");
      expect(result.htmlContent).not.toContain("safe-harbor-annex");
    });
  });

  describe("4. HMK 193 DossierService Integration", () => {
    it("includes EK-3 as an evidentiary exhibit when safeHarborConfig is active", async () => {
      const dossier = await DossierService.buildDossier({
        engagementId: "eng-test-safeharbor-99",
        requestingUserId: "usr-owner-1",
        locale: "tr",
        safeHarborConfig: safeDefaultConfig,
      });

      const safeHarborExhibit = dossier.manifest.documents.find(
        (d) => d.path === "01_ASIL_SOZLESME_VE_EKLERI/EK_3_IS_KANUNU_M8_GUVENLI_LIMAN.md"
      );

      expect(safeHarborExhibit).toBeDefined();
      expect(safeHarborExhibit?.title).toContain("EK-3");
      expect(safeHarborExhibit?.legalGroundTr).toContain("4857 s. İş K. m. 8");
      expect(safeHarborExhibit?.sha256).toMatch(/^[a-f0-9]{64}$/);

      // Verify that the manifest contains the safe harbor document checksum
      expect(dossier.zipBuffer.length).toBeGreaterThan(0);
      expect(dossier.manifest.checksumsSha256Content).toContain("EK_3_IS_KANUNU_M8_GUVENLI_LIMAN.md");
    });
  });
});
