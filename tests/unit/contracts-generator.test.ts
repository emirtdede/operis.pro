import { describe, it, expect } from "vitest";
import { ContractGeneratorService, DEFAULT_MILESTONES } from "@/src/modules/contracts/generator";
import type { ContractGeneratorInput } from "@/src/modules/contracts/types";

describe("Statutory Contract Generator Service (TBK 470 & FSEK 52 & NDA)", () => {
  const sampleInput: ContractGeneratorInput = {
    engagementId: "eng-test-789a1b2c",
    listingTitle: "FinTech Mobil Bankacılık iOS & Android Uygulaması",
    category: "Mobil Yazılım Geliştirme",
    matchedAt: "2026-09-15T12:00:00Z",
    scopeSummary: "React Native, TypeScript ve Node.js mikroservisleri ile tam teşekküllü mobil bankacılık frontend ve BFF katmanı.",
    budgetLabel: "75.000 TL",
    timelineLabel: "4 Hafta",
    client: {
      displayName: "Ayşe Kaya",
      email: "ayse@fintechventures.com",
      phone: "+905321112233",
      handle: "aysekaya",
      city: "İstanbul",
      role: "CLIENT",
    },
    contractor: {
      displayName: "Mehmet Demir",
      email: "mehmet@demiryazilim.com",
      phone: "+905429998877",
      handle: "mehmetdemir",
      city: "Ankara",
      role: "CONTRACTOR",
    },
    locale: "tr",
  };

  it("generates deterministic contract reference code and SHA-256 seal", () => {
    const result1 = ContractGeneratorService.generateContract(sampleInput);
    const result2 = ContractGeneratorService.generateContract(sampleInput);

    expect(result1.contractRef).toBe("OPR-CONTR-ENGTEST7");
    expect(result1.sha256Fingerprint).toBeDefined();
    expect(result1.sha256Fingerprint).toHaveLength(64);
    expect(result1.sha256Fingerprint).toBe(result2.sha256Fingerprint);
  });

  it("verifies SHA-256 integrity seal matches the canonical content", () => {
    const result = ContractGeneratorService.generateContract(sampleInput);
    const expectedHash = ContractGeneratorService.calculateSha256(result.markdown);

    expect(result.sha256Fingerprint).toBe(expectedHash);
    expect(result.metadata.sha256Verified).toBe(true);
  });

  it("complies strictly with FSEK m. 52 (individual enumeration of 5 economic rights conditioned on full payment)", () => {
    const result = ContractGeneratorService.generateContract(sampleInput);
    const text = result.plainText;

    expect(result.metadata.fsekClauseIncluded).toBe(true);
    expect(text).toContain("5846 SAYILI FSEK m. 52 UYARINCA MALİ VE FİKRİ MÜLKİYET HAKLARININ DEVRİ");
    // FSEK 52 mandatory separate enumeration:
    expect(text).toContain("İşleme Hakkı (FSEK m. 21)");
    expect(text).toContain("Çoğaltma Hakkı (FSEK m. 22)");
    expect(text).toContain("Yayma Hakkı (FSEK m. 23)");
    expect(text).toContain("Temsil Hakkı (FSEK m. 24)");
    expect(text).toContain("İşaret, Ses ve/veya Görüntü Nakline Yarayan Araçlarla Umuma İletim Hakkı (FSEK m. 25)");
    // Must be conditioned on full settlement:
    expect(text).toContain("eksiksiz ödenmesi şartına bağlı olarak");
  });

  it("complies with TBK 470 Eser Sözleşmesi and includes 30-day bug warranty and scope creep cap", () => {
    const result = ContractGeneratorService.generateContract(sampleInput);
    const text = result.plainText;

    expect(result.metadata.tbkClauseIncluded).toBe(true);
    expect(text).toContain("6098 sayılı Türk Borçlar Kanunu (TBK m. 470 vd.)");
    // Scope creep cap (2 revision rounds):
    expect(text).toContain("2 (iki) tur revizyon");
    // 30-day warranty:
    expect(text).toContain("30 (otuz) TAKVİM GÜNÜ");
    // 7 business days inspection period:
    expect(text).toContain("7 (yedi) iş günü");
  });

  it("includes statutory NDA and 6325 Law mediation clauses", () => {
    const result = ContractGeneratorService.generateContract(sampleInput);
    const text = result.plainText;

    expect(result.metadata.mediationIncluded).toBe(true);
    expect(text).toContain("GİZLİLİK VE TİCARİ SIRLARIN KORUNMASI (NDA)");
    expect(text).toContain("6325 sayılı Hukuk Uyuşmazlıklarında Arabuluculuk Kanunu");
    expect(text).toContain("doğrudan arabuluculuk yoluna başvurmayı peşinen taahhüt ederler");
  });

  it("enforces Operis zero-escrow immunity and platform disclaimer", () => {
    const result = ContractGeneratorService.generateContract(sampleInput);
    const text = result.plainText;

    expect(text).toContain("OPERİS PLATFORMUNUN HUKUKİ STATÜSÜ VE DAVA MUAFİYETİ");
    expect(text).toContain("Operis platformu hiçbir surette emanet hesabı (escrow) tutmaz");
    expect(text).toContain("münhasıran İş Sahibi ile Yüklenici arasında bağımsız olarak akdedilmiştir");
  });

  it("contains 3-stage milestone breakdown summing to 100%", () => {
    const result = ContractGeneratorService.generateContract(sampleInput);
    const totalPercentage = DEFAULT_MILESTONES.reduce((acc, m) => acc + m.percentage, 0);

    expect(totalPercentage).toBe(100);
    expect(result.plainText).toContain("1. Aşama (%30 Avans): Tasarım ve Mimari Altyapı Onayı");
    expect(result.plainText).toContain("2. Aşama (%40 Ara Hakediş): Fonksiyonel Demo ve Kullanıcı Kabul Testi");
    expect(result.plainText).toContain("3. Aşama (%30 Kapanış ve Devir): Kaynak Kod Teslimi");
  });

  it("generates high-fidelity English statutory contract when locale is en", () => {
    const enInput: ContractGeneratorInput = {
      ...sampleInput,
      locale: "en",
    };
    const result = ContractGeneratorService.generateContract(enInput);

    expect(result.locale).toBe("en");
    expect(result.plainText).toContain("INDEPENDENT SOFTWARE & TECHNOLOGY SERVICES AGREEMENT");
    expect(result.plainText).toContain("ARTICLE 5: STATUTORY INTELLECTUAL PROPERTY ASSIGNMENT (FSEK Art. 52)");
    expect(result.plainText).toContain("Right of Adaptation / Modification (FSEK Art. 21)");
    expect(result.plainText).toContain("Right of Reproduction (FSEK Art. 22)");
    expect(result.plainText).toContain("Right of Distribution (FSEK Art. 23)");
    expect(result.plainText).toContain("Right of Public Performance / Representation (FSEK Art. 24)");
    expect(result.plainText).toContain("Right of Communication to the Public via Wire/Wireless Means (FSEK Art. 25)");
    expect(result.plainText).toContain("The Operis platform does not hold escrow");
    expect(result.plainText).toContain("ARTICLE 10: DISPUTE RESOLUTION, ISTAC ARBITRATION & JURISDICTION");
    expect(result.htmlContent).toContain("Independent Software & Technology Services Agreement");
  });

  it("includes statutory GVK 94 withholding and gross fee clause in Article 3", () => {
    const trResult = ContractGeneratorService.generateContract(sampleInput);
    expect(trResult.plainText).toContain("Ödeme Şekli, Faturalandırma ve Vergi Rejimi");
    expect(trResult.plainText).toContain("193 sayılı Gelir Vergisi Kanunu");
    expect(trResult.plainText).toContain("BRÜT hizmet bedeli");

    const enResult = ContractGeneratorService.generateContract({
      ...sampleInput,
      locale: "en",
    });
    expect(enResult.plainText).toContain("Payment Method, Invoicing & Statutory Tax Regime");
    expect(enResult.plainText).toContain("GVK Art. 94");
    expect(enResult.plainText).toContain("GROSS service fee");
  });

  it("injects statutory itemized tax breakdown table when numeric budget is specified", () => {
    const result = ContractGeneratorService.generateContract(sampleInput);
    
    // Markdown table checks (75.000 TL Gross, 20% stopaj = 15.000, Net = 60.000, KDV = 15.000, Havale = 75.000, Client Cost = 90.000)
    expect(result.markdown).toContain("Yasal Dayanak & Finansal Kalem");
    expect(result.markdown).toContain("1. Kararlaştırılan Brüt Hizmet Bedeli");
    expect(result.markdown).toContain("75.000,00 ₺");
    expect(result.markdown).toContain("2. GVK m. 94/2-b Stopaj Tevkifatı");
    expect(result.markdown).toContain("-15.000,00 ₺");
    expect(result.markdown).toContain("3. Net Serbest Meslek Kazancı");
    expect(result.markdown).toContain("60.000,00 ₺");
    expect(result.markdown).toContain("4. Katma Değer Vergisi (KDVK)");
    expect(result.markdown).toContain("+15.000,00 ₺");
    expect(result.markdown).toContain("5. Banka Havalesi ile Yükleniciye Ödenecek");
    expect(result.markdown).toContain("6. İş Sahibinin Toplam Nakit Maliyeti");
    expect(result.markdown).toContain("90.000,00 ₺");

    // HTML table checks
    expect(result.htmlContent).toContain("YASAL VERGİ VE ÖDEME DAĞILIM TABLOSU (GVK m. 94 & KDVK)");
    expect(result.htmlContent).toContain("RESMİ HESAPLAMA");
    expect(result.htmlContent).toContain("75.000,00 ₺");
  });

  it("handles non-numeric budget gracefully without breaking the contract", () => {
    const nonNumericInput: ContractGeneratorInput = {
      ...sampleInput,
      budgetLabel: "Görüşülecektir",
    };
    const result = ContractGeneratorService.generateContract(nonNumericInput);
    expect(result.markdown).not.toContain("NaN");
    expect(result.markdown).toContain("3.1. **Kararlaştırılan Proje Bedeli:** Görüşülecektir");
    expect(result.sha256Fingerprint).toHaveLength(64);
  });

  it("compiles EK-6 (Clean Code), EK-7 (FOSS Shield), and EK-8 (Non-Solicitation) annexes when selected", () => {
    const customInput: ContractGeneratorInput = {
      ...sampleInput,
      selectedContracts: [
        "CORE_SERVICE",
        "CYBER_SECURITY_CLEAN_CODE",
        "FOSS_LICENSE_COMPLIANCE",
        "NON_SOLICITATION",
      ],
    };
    const result = ContractGeneratorService.generateContract(customInput);

    expect(result.metadata.cleanCodeWarrantyIncluded).toBe(true);
    expect(result.metadata.fossComplianceIncluded).toBe(true);
    expect(result.metadata.nonSolicitationIncluded).toBe(true);

    // EK-6 assertions
    expect(result.markdown).toContain("EK-6: TEMİZ KOD, ARKA KAPI İÇERMEME VE SİBER GÜVENLİK TAAHHÜTNAMESİ");
    expect(result.markdown).toContain("5237 s. TCK m. 243-245");
    expect(result.markdown).toContain("OWASP Top 10");

    // EK-7 assertions
    expect(result.markdown).toContain("EK-7: AÇIK KAYNAK LİSANS SAFLIĞI VE COPYLEFT BULAŞMAMA ŞARTNAMESİ");
    expect(result.markdown).toContain("GNU General Public License (GPL v2 / GPL v3)");
    expect(result.markdown).toContain("14 İş Günü");

    // EK-8 assertions
    expect(result.markdown).toContain("EK-8: MÜŞTERİ VE PERSONEL AYARTMAMA & PLATFORM SADAKAT PROTOKOLÜ");
    expect(result.markdown).toContain("6102 s. TTK m. 54-55");
    expect(result.markdown).toContain("12 Ay");

    // HTML assertions
    expect(result.htmlContent).toContain("EK-6: Temiz Kod ve Siber Güvenlik Taahhütnamesi");
    expect(result.htmlContent).toContain("EK-7: Açık Kaynak Lisans Saflığı ve Copyleft Bulaşmama Şartnamesi");
    expect(result.htmlContent).toContain("EK-8: Müşteri ve Personel Ayartmama Protokolü");
  });

  it("verifies standard mode (whiteLabel: false) retains Operis branding and statutory safe harbor", () => {
    const standardResult = ContractGeneratorService.generateContract({
      ...sampleInput,
      whiteLabel: false,
    });

    expect(standardResult.isWhiteLabel).toBe(false);
    expect(standardResult.contractRef).toMatch(/^OPR-CONTR-/);
    expect(standardResult.markdown).toContain("OPERİS PLATFORMUNUN HUKUKİ STATÜSÜ VE DAVA MUAFİYETİ");
    expect(standardResult.htmlContent).toContain('<div class="brand">OPERIS</div>');
    expect(standardResult.htmlContent).toContain("Operis platformu tarafından doğrulanabilir");
  });

  it("generates neutral White-Label contract without Operis branding when whiteLabel is true", () => {
    const whiteLabelResult = ContractGeneratorService.generateContract({
      ...sampleInput,
      whiteLabel: true,
    });

    expect(whiteLabelResult.isWhiteLabel).toBe(true);
    expect(whiteLabelResult.contractRef).toMatch(/^CTR-/);
    // Should NOT contain any brand mentions of Operis
    expect(whiteLabelResult.markdown).not.toContain("Operis");
    expect(whiteLabelResult.htmlContent).not.toContain('<div class="brand">OPERIS</div>');
    expect(whiteLabelResult.htmlContent).toContain('<div class="brand">SÖZLEŞME VE PROTOKOL METNİ</div>');
    expect(whiteLabelResult.markdown).toContain("TEKNOLOJİ VE İLETİŞİM ALTYAPISI SAĞLAYICISININ HUKUKİ STATÜSÜ");
    expect(whiteLabelResult.markdown).toContain("Doğrudan İki Taraflı Ödeme");

    // Cryptographic seal and FSEK protection are preserved
    expect(whiteLabelResult.sha256Fingerprint).toHaveLength(64);
    expect(whiteLabelResult.metadata.fsekClauseIncluded).toBe(true);
    expect(whiteLabelResult.metadata.isWhiteLabel).toBe(true);
  });

  it("generates clean bilingual White-Label contract with neutral infrastructure clauses", () => {
    const bilingualWlResult = ContractGeneratorService.generateContract({
      ...sampleInput,
      locale: "bilingual",
      whiteLabel: true,
    });

    expect(bilingualWlResult.isWhiteLabel).toBe(true);
    expect(bilingualWlResult.contractRef).toMatch(/^CTR-/);
    expect(bilingualWlResult.markdown).not.toContain("Operis");
    expect(bilingualWlResult.bilingualHtmlContent).toContain("CONTRACT & ACCORD");
    expect(bilingualWlResult.bilingualHtmlContent).toContain("Cryptographically Verified");
    expect(bilingualWlResult.bilingualHtmlContent).not.toContain("Operis Verified");

    const article9Clause = bilingualWlResult.bilingualClauses?.find(
      (c) => c.id === "article-9-platform-exemption"
    );
    expect(article9Clause).toBeDefined();
    expect(article9Clause?.titleTr).toContain("TEKNOLOJİ VE ALTYAPI SAĞLAYICISININ");
    expect(article9Clause?.titleEn).toContain("INFRASTRUCTURE PROVIDER EXEMPTION");
    expect(article9Clause?.bodyTr).not.toContain("Operis");
    expect(article9Clause?.bodyEn).not.toContain("Operis");
  });

  describe("WP-08: Raster Signature Validation & XSS/Injection Prevention", () => {
    const validPng =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    it("renders valid raster PNG signature safely without attribute break-out", () => {
      const result = ContractGeneratorService.generateContract({
        ...sampleInput,
        clientSignature: {
          signerName: "Alice Client",
          signedAt: new Date().toISOString(),
          ipHash: "hash-123",
          signatureDataUrl: validPng,
        },
      });

      expect(result.htmlContent).toContain('<img src="data:image/png;base64,');
      expect(result.htmlContent).not.toContain("onerror");
    });

    it("rejects and neutralizes SVG payloads and onerror event attributes", () => {
      const maliciousSvg = 'data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+PC9zdmc+';
      const maliciousPayload = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ" onerror="alert(document.cookie)';

      // Svg injection attempt
      const resultSvg = ContractGeneratorService.generateContract({
        ...sampleInput,
        clientSignature: {
          signerName: "Attacker Svg",
          signedAt: new Date().toISOString(),
          ipHash: "hash-123",
          signatureDataUrl: maliciousSvg,
        },
      });

      // Must NOT render malicious img tag
      expect(resultSvg.htmlContent).not.toContain("<img");
      expect(resultSvg.htmlContent).not.toContain("alert(1)");
      expect(resultSvg.htmlContent).toContain("✅ E-İmzalandı");

      // Attribute break-out attempt
      const resultPayload = ContractGeneratorService.generateContract({
        ...sampleInput,
        clientSignature: {
          signerName: "Attacker Breakout",
          signedAt: new Date().toISOString(),
          ipHash: "hash-123",
          signatureDataUrl: maliciousPayload,
        },
      });

      expect(resultPayload.htmlContent).not.toContain("onerror");
      expect(resultPayload.htmlContent).not.toContain("alert(document.cookie)");
      expect(resultPayload.htmlContent).not.toContain("<img");
    });
  });

  describe("WP-14: Cryptographic Seal Covers Signature Image Integrity", () => {
    const validPng1 =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    // 1x1 red PNG
    const validPng2 =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    it("produces different SHA-256 seal when signature image is changed even if text is identical", () => {
      const fixedTimestamp = "2026-09-23T10:00:00.000Z";

      const res1 = ContractGeneratorService.generateContract({
        ...sampleInput,
        clientSignature: {
          signerName: "Alice Client",
          signedAt: fixedTimestamp,
          ipHash: "hash-123",
          signatureDataUrl: validPng1,
        },
      });

      const res2 = ContractGeneratorService.generateContract({
        ...sampleInput,
        clientSignature: {
          signerName: "Alice Client",
          signedAt: fixedTimestamp,
          ipHash: "hash-123",
          signatureDataUrl: validPng2,
        },
      });

      // Both must include signature asset summary
      expect(res1.markdown).toContain("**İmza Varlık Özeti:**");
      expect(res2.markdown).toContain("**İmza Varlık Özeti:**");

      // The SHA-256 document fingerprint MUST differ because the signature image is different
      expect(res1.sha256Fingerprint).not.toBe(res2.sha256Fingerprint);
    });
  });
});

