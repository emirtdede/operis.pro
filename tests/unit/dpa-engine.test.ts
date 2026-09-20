import { describe, it, expect } from "vitest";
import { DpaEngine } from "@/src/modules/contracts/dpa-engine";
import { ContractGeneratorService } from "@/src/modules/contracts/generator";
import type { DpaContractConfig } from "@/src/modules/contracts/dpa-types";
import type { ContractGeneratorInput } from "@/src/modules/contracts/types";

describe("DPA Engine (6698 Sayılı KVKK m. 12 & GDPR Art. 28 Data Processing Addendum)", () => {
  const standardConfig: DpaContractConfig = {
    enabled: true,
    accessLevel: "FULL_PRODUCTION_ACCESS",
    dataCategories: ["IDENTITY_CONTACT", "CUSTOMER_ACCOUNT_LOGS"],
    securityMeasures: [
      "TLS_ENCRYPTION",
      "LOCAL_STORAGE_PROHIBITED",
      "MFA_ACCESS",
      "AUDIT_LOGGING",
    ],
    breachNotificationHours: 24,
    subProcessorAllowed: false,
    dataRetentionDaysAfterTermination: 0,
    dpoContactEmail: "dpo@company.com",
  };

  const sampleContractInput: ContractGeneratorInput = {
    engagementId: "eng-dpa-test-1234",
    listingTitle: "E-Ticaret & Ödeme Altyapısı Entegrasyonu",
    category: "Web Geliştirme",
    matchedAt: "2026-09-19T10:00:00Z",
    scopeSummary: "Stripe/Iyzico ödeme geçidi ve kullanıcı sepeti yönetimi.",
    budgetLabel: "80.000 TL",
    timelineLabel: "3 Hafta",
    client: {
      displayName: "Acme Teknoloji A.Ş.",
      email: "contact@acme.com",
      role: "CLIENT",
    },
    contractor: {
      displayName: "Ali Yılmaz",
      email: "ali@developer.com",
      role: "CONTRACTOR",
    },
    locale: "tr",
  };

  describe("Deterministic Risk Evaluation", () => {
    it("returns zero score and LOW risk when DPA is disabled", () => {
      const disabledConfig: DpaContractConfig = {
        ...standardConfig,
        enabled: false,
      };
      const result = DpaEngine.evaluateDpaRisk(disabledConfig);

      expect(result.riskScore).toBe(0);
      expect(result.riskLevel).toBe("LOW");
      expect(result.requiresDpia).toBe(false);
      expect(result.summaryTr).toContain("Kişisel veri işleme faaliyeti bulunmamaktadır");
    });

    it("evaluates risk score accurately based on category weights and multipliers", () => {
      // IDENTITY_CONTACT = 15, CUSTOMER_ACCOUNT_LOGS = 20 -> Sum = 35
      // FULL_PRODUCTION_ACCESS multiplier = 1.0 -> Score = 35
      const result = DpaEngine.evaluateDpaRisk(standardConfig);

      expect(result.riskScore).toBe(35);
      expect(result.riskLevel).toBe("MEDIUM");
      expect(result.requiresDpia).toBe(false);
      expect(result.mandatoryMeasures).toContain("TLS_ENCRYPTION");
      expect(result.mandatoryMeasures).toContain("LOCAL_STORAGE_PROHIBITED");
      expect(result.mandatoryMeasures).toContain("MFA_ACCESS");
    });

    it("applies 0.6 multiplier for staging access", () => {
      // 35 * 0.6 = 21 -> LOW
      const stagingConfig: DpaContractConfig = {
        ...standardConfig,
        accessLevel: "READ_ONLY_STAGING",
      };
      const result = DpaEngine.evaluateDpaRisk(stagingConfig);

      expect(result.riskScore).toBe(21);
      expect(result.riskLevel).toBe("LOW");
    });

    it("triggers CRITICAL risk and requiresDpia when SPECIAL_HEALTH_BIOMETRIC is present in production", () => {
      const sensitiveConfig: DpaContractConfig = {
        ...standardConfig,
        dataCategories: ["SPECIAL_HEALTH_BIOMETRIC", "IDENTITY_CONTACT"],
      };
      const result = DpaEngine.evaluateDpaRisk(sensitiveConfig);

      expect(result.requiresDpia).toBe(true);
      expect(result.riskLevel).toBe("CRITICAL");
      expect(result.riskScore).toBeGreaterThanOrEqual(60);
      expect(result.mandatoryMeasures).toContain("AES256_AT_REST");
      expect(result.mandatoryMeasures).toContain("AUDIT_LOGGING");
      expect(result.summaryTr).toContain("DPIA");
    });
  });

  describe("Statutory Annex-2 (EK-2) Content Generation", () => {
    it("generates comprehensive Turkish EK-2 with mandatory statutory clauses", () => {
      const annexTr = DpaEngine.generateAnnexMarkdown(standardConfig, "tr");

      // Statutory headings and laws
      expect(annexTr).toContain("EK-2: 6698 SAYILI KVKK m. 12 VE GDPR m. 28 UYARINCA BİLİŞİM VERİ İŞLEME VE BİLGİ GÜVENLİĞİ PROTOKOLÜ (DPA)");
      expect(annexTr).toContain("6698 sayılı Kişisel Verilerin Korunması Kanunu");
      expect(annexTr).toContain("Kişisel Veri Güvenliği Rehberi");

      // Mandatory statutory sections
      expect(annexTr).toContain("1. TARAFLARIN SIFATLARI VE TEMEL İLKE");
      expect(annexTr).toContain("Veri Sorumlusu (İş Sahibi)");
      expect(annexTr).toContain("Veri İşleyen (Yüklenici)");

      expect(annexTr).toContain("2. İŞLEMENİN KAPSAMI, AMACI VE ERİŞİM SEVİYESİ");
      expect(annexTr).toContain("Kimlik ve İletişim Bilgileri");
      expect(annexTr).toContain("Kullanıcı Hesap & Log Kayıtları");

      expect(annexTr).toContain("3. YÜKLENİCİNİN (VERİ İŞLEYEN) KANUNİ YÜKÜMLÜLÜKLERİ");
      expect(annexTr).toContain("Yalnızca Talimata Bağlılık");
      expect(annexTr).toContain("Süresiz Gizlilik Yükümlülüğü");
      expect(annexTr).toContain("Yetkisiz Alt İşleyen Yasağı");
      expect(annexTr).toContain("en geç 24 saat içinde");
      expect(annexTr).toContain("Kişisel Veri İmha Tutanağı");

      expect(annexTr).toContain("4. TAAHHÜT EDİLEN TEKNİK VE İDARİ TEDBİRLER");
      expect(annexTr).toContain("TLS 1.3");
      expect(annexTr).toContain("Yerel Cihaza Veri İndirme Yasağı");
    });

    it("generates comprehensive English ANNEX-2 with GDPR Art. 28 statutory clauses", () => {
      const annexEn = DpaEngine.generateAnnexMarkdown(standardConfig, "en");

      expect(annexEn).toContain("ANNEX-2: STATUTORY DATA PROCESSING ADDENDUM (KVKK ART. 12 & GDPR ART. 28 COMPLIANT)");
      expect(annexEn).toContain("GDPR Art. 28");
      expect(annexEn).toContain("Data Controller");
      expect(annexEn).toContain("Data Processor");
      expect(annexEn).toContain("within 24 hours");
      expect(annexEn).toContain("Data Destruction Certificate");
    });

    it("generates responsive print-ready HTML for ANNEX-2", () => {
      const html = DpaEngine.generateAnnexHtml(standardConfig, "tr");

      expect(html).toContain("EK-2: 6698 Sayılı KVKK m. 12 & GDPR m. 28 Bilişim Veri İşleme Protokolü (DPA)");
      expect(html).toContain("İhlal Bildirim Süresi: <strong>24 Saat</strong>");
      expect(html).toContain("Kimlik & İletişim");
      expect(html).toContain("TLS 1.3");
    });
  });

  describe("Certified Data Destruction Proof", () => {
    it("creates a cryptographically verifiable destruction certificate", () => {
      const cert = DpaEngine.generateDestructionCertificate({
        engagementId: "eng-dpa-test-1234",
        contractorName: "Ali Yılmaz",
        clientName: "Acme Teknoloji A.Ş.",
        destructionDate: "2026-09-19T12:00:00Z",
        destructionMethod: "CRYPTO_SHREDDING",
        dataCategoriesDestroyed: ["IDENTITY_CONTACT", "CUSTOMER_ACCOUNT_LOGS"],
        signedByContractor: true,
      });

      expect(cert.markdown).toContain("6698 SAYILI KVKK UYARINCA KİŞİSEL VERİ SİLME VE İMHA TUTANAĞI");
      expect(cert.markdown).toContain("eng-dpa-test-1234");
      expect(cert.markdown).toContain("Ali Yılmaz");
      expect(cert.markdown).toContain("Acme Teknoloji A.Ş.");
      expect(cert.markdown).toContain("CRYPTO_SHREDDING");
      expect(cert.sha256Hash).toBeDefined();
      expect(cert.sha256Hash).toHaveLength(64);
    });
  });

  describe("ContractGeneratorService Integration", () => {
    it("seamlessly attaches EK-2 to generated contract when dpaConfig is present", () => {
      const contractWithDpa = ContractGeneratorService.generateContract({
        ...sampleContractInput,
        dpaConfig: standardConfig,
      });

      expect(contractWithDpa.metadata.dpaIncluded).toBe(true);
      expect(contractWithDpa.dpaConfig).toBeDefined();
      expect(contractWithDpa.dpaEvaluation).toBeDefined();
      expect(contractWithDpa.dpaEvaluation?.riskScore).toBe(35);

      // Article 6 cross reference
      expect(contractWithDpa.plainText).toContain("Kişisel Verilerin Korunması (KVKK m. 12 & DPA)");
      expect(contractWithDpa.plainText).toContain("EK-2 Veri İşleme ve Bilgi Güvenliği Protokolü");

      // Appended EK-2
      expect(contractWithDpa.markdown).toContain("EK-2: 6698 SAYILI KVKK m. 12 VE GDPR m. 28 UYARINCA BİLİŞİM VERİ İŞLEME VE BİLGİ GÜVENLİĞİ PROTOKOLÜ (DPA)");
      expect(contractWithDpa.htmlContent).toContain("EK-2: 6698 Sayılı KVKK m. 12 & GDPR m. 28 Bilişim Veri İşleme Protokolü (DPA)");

      // SHA-256 seal is valid for the full document
      expect(contractWithDpa.sha256Fingerprint).toBeDefined();
      expect(contractWithDpa.metadata.sha256Verified).toBe(true);
    });

    it("supports English DPA when locale is en", () => {
      const contractEn = ContractGeneratorService.generateContract({
        ...sampleContractInput,
        locale: "en",
        dpaConfig: standardConfig,
      });

      expect(contractEn.metadata.dpaIncluded).toBe(true);
      expect(contractEn.plainText).toContain("Personal Data Processing (KVKK Art. 12 & GDPR Art. 28)");
      expect(contractEn.markdown).toContain("ANNEX-2: STATUTORY DATA PROCESSING ADDENDUM");
      expect(contractEn.htmlContent).toContain("ANNEX-2: Data Processing Addendum");
    });

    it("omits EK-2 when dpaConfig is not provided", () => {
      const regularContract = ContractGeneratorService.generateContract(sampleContractInput);

      expect(regularContract.metadata.dpaIncluded).toBe(false);
      expect(regularContract.dpaConfig).toBeFalsy();
      expect(regularContract.dpaEvaluation).toBeFalsy();
      expect(regularContract.markdown).not.toContain("EK-2: 6698 SAYILI KVKK");
      expect(regularContract.markdown).not.toContain("6.2. **Kişisel Verilerin Korunması");
    });
  });
});
