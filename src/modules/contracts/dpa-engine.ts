/**
 * Data Processing Addendum (DPA) Engine
 *
 * Statutory Compliance:
 * - 6698 Sayılı KVKK m. 12 (Veri Güvenliği Yükümlülükleri ve Müşterek Sorumluluk)
 * - Kişisel Verileri Koruma Kurumu "Kişisel Veri Güvenliği Rehberi"
 * - Veri Silme, Yok Etme veya Anonim Hale Getirme Hakkında Yönetmelik (Resmi Gazete: 28.10.2017 / 30224)
 * - Regulation (EU) 2016/679 (GDPR) Article 28 & Article 32
 */

import { createHash } from "crypto";
import {
  DpaAccessLevel,
  DpaDataCategory,
  DpaSecurityMeasure,
  DpaRiskLevel,
  DpaContractConfig,
  DpaRiskEvaluation,
  DataDestructionRecord,
} from "./dpa-types";
import type { ContractLanguage } from "./types";

const CATEGORY_WEIGHTS: Record<DpaDataCategory, number> = {
  IDENTITY_CONTACT: 15,
  CUSTOMER_ACCOUNT_LOGS: 20,
  FINANCIAL_TRANSACTION: 30,
  SPECIAL_HEALTH_BIOMETRIC: 45,
  EMPLOYEE_DATA: 25,
  LOCATION_DEVICE: 20,
};

const ACCESS_LEVEL_MULTIPLIERS: Record<DpaAccessLevel, number> = {
  NO_ACCESS_SYNTHETIC: 0.2,
  READ_ONLY_STAGING: 0.6,
  FULL_PRODUCTION_ACCESS: 1.0,
};

export class DpaEngine {
  static evaluateRisk(config: DpaContractConfig): DpaRiskEvaluation {
    return this.evaluateDpaRisk(config);
  }

  static generateAnnexMarkdown(
    config: DpaContractConfig,
    locale: ContractLanguage = "tr",
    clientName?: string,
    contractorName?: string
  ): string {
    return this.generateDpaAnnexMarkdown(config, locale, clientName, contractorName);
  }

  static generateAnnexHtml(
    config: DpaContractConfig,
    locale: ContractLanguage = "tr"
  ): string {
    return this.generateDpaAnnexHtml(config, locale);
  }

  /**
   * Deterministically evaluates data security risk level (0 - 100),
   * identifying DPIA requirements and required baseline safeguards.
   */
  static evaluateDpaRisk(config: DpaContractConfig): DpaRiskEvaluation {
    if (!config.enabled || config.dataCategories.length === 0) {
      return {
        riskScore: 0,
        riskLevel: "LOW",
        requiresDpia: false,
        mandatoryMeasures: ["TLS_ENCRYPTION", "LOCAL_STORAGE_PROHIBITED"],
        recommendedMeasures: ["ANONYMIZATION_MASKING"],
        summaryTr: "Kişisel veri işleme faaliyeti bulunmamaktadır (Yalnızca sentetik/mock veri).",
        summaryEn: "No live personal data processing involved (Synthetic/mock data only).",
      };
    }

    const categories = config.dataCategories;
    const accessLevel = config.accessLevel;

    const baseWeightSum = categories.reduce(
      (acc, cat) => acc + (CATEGORY_WEIGHTS[cat] || 15),
      0
    );

    const multiplier = ACCESS_LEVEL_MULTIPLIERS[accessLevel] || 0.6;
    let rawScore = Math.round(baseWeightSum * multiplier);

    const hasSpecialCategory = categories.includes("SPECIAL_HEALTH_BIOMETRIC");
    let requiresDpia = false;

    // Special category data accessed in staging or prod triggers critical risk & DPIA
    if (hasSpecialCategory && accessLevel !== "NO_ACCESS_SYNTHETIC") {
      rawScore = Math.max(rawScore, 80);
      requiresDpia = true;
    }

    const riskScore = Math.min(100, Math.max(5, rawScore));

    let riskLevel: DpaRiskLevel = "LOW";
    if (riskScore > 75) {
      riskLevel = "CRITICAL";
    } else if (riskScore > 50) {
      riskLevel = "HIGH";
    } else if (riskScore > 25) {
      riskLevel = "MEDIUM";
    }

    // Determine mandatory measures based on risk level
    const mandatoryMeasures: DpaSecurityMeasure[] = ["TLS_ENCRYPTION", "LOCAL_STORAGE_PROHIBITED"];
    const recommendedMeasures: DpaSecurityMeasure[] = [];

    if (riskLevel === "MEDIUM") {
      mandatoryMeasures.push("MFA_ACCESS", "ANONYMIZATION_MASKING");
      recommendedMeasures.push("AUDIT_LOGGING");
    } else if (riskLevel === "HIGH") {
      mandatoryMeasures.push(
        "MFA_ACCESS",
        "ANONYMIZATION_MASKING",
        "AES256_AT_REST",
        "AUDIT_LOGGING"
      );
      recommendedMeasures.push("IP_RESTRICTION");
    } else if (riskLevel === "CRITICAL") {
      mandatoryMeasures.push(
        "MFA_ACCESS",
        "ANONYMIZATION_MASKING",
        "AES256_AT_REST",
        "AUDIT_LOGGING",
        "IP_RESTRICTION"
      );
    }

    const summaryTr = `KVKK m. 12 Risk Skoru: ${riskScore}/100 (${riskLevel}). ${
      requiresDpia
        ? "Özel nitelikli veri sebebiyle DPIA (Veri Koruma Etki Değerlendirmesi) ve AES-256 zorunludur."
        : "Standart bilişim güvenliği ve teknik tedbirler protokolü uygulanmaktadır."
    }`;

    const summaryEn = `KVKK Art. 12 & GDPR Art. 28 Risk Score: ${riskScore}/100 (${riskLevel}). ${
      requiresDpia
        ? "Special category data detected: DPIA and AES-256 encryption are mandatory."
        : "Standard data security baseline protocol active."
    }`;

    return {
      riskScore,
      riskLevel,
      requiresDpia,
      mandatoryMeasures,
      recommendedMeasures,
      summaryTr,
      summaryEn,
    };
  }

  /**
   * Generates formal statutory Contract Annex (EK-2: DPA) in Markdown format.
   */
  static generateDpaAnnexMarkdown(
    config: DpaContractConfig,
    locale: ContractLanguage = "tr",
    clientName: string = "İşveren (Veri Sorumlusu)",
    contractorName: string = "Yüklenici (Veri İşleyen)"
  ): string {
    const isTr = locale === "tr";
    const evaluation = this.evaluateDpaRisk(config);
    const breachHours = config.breachNotificationHours || 24;

    const accessLabels: Record<DpaAccessLevel, { tr: string; en: string }> = {
      NO_ACCESS_SYNTHETIC: {
        tr: "Sentetik / Maskeli Test Verisi (Canlı Veri Erişimi Yok)",
        en: "Synthetic / Masked Test Data (Zero Production Access)",
      },
      READ_ONLY_STAGING: {
        tr: "Staging / Test Ortamında Salt-Okunur Erişim",
        en: "Read-Only Staging / Sandbox Environment Access",
      },
      FULL_PRODUCTION_ACCESS: {
        tr: "Canlı Veritabanı ve Üretim Ortamına Doğrudan Erişim",
        en: "Direct Production Database & Environment Access",
      },
    };

    const categoryLabels: Record<DpaDataCategory, { tr: string; en: string }> = {
      IDENTITY_CONTACT: {
        tr: "Kimlik ve İletişim Bilgileri (Ad, Soyad, E-posta, Telefon, TCKN)",
        en: "Identity & Contact Data (Name, Email, Phone, National ID)",
      },
      CUSTOMER_ACCOUNT_LOGS: {
        tr: "Kullanıcı Hesap & Log Kayıtları (IP, Şifre Hashleri, Oturum Verisi)",
        en: "Customer Account & Log Data (IPs, Password Hashes, Session Logs)",
      },
      FINANCIAL_TRANSACTION: {
        tr: "Finans ve İşlem Verileri (Siparişler, Faturalar, Ödeme Kayıtları)",
        en: "Financial & Transactional Data (Orders, Invoices, Billing Records)",
      },
      SPECIAL_HEALTH_BIOMETRIC: {
        tr: "Özel Nitelikli Kişisel Veriler (KVKK m. 6: Sağlık, Biyometrik, Adli Sicil)",
        en: "Special Category Data (GDPR Art. 9 / KVKK Art. 6: Health, Biometric)",
      },
      EMPLOYEE_DATA: {
        tr: "Şirket İçi Personel ve Bordro Kayıtları",
        en: "Internal Employee & Payroll Records",
      },
      LOCATION_DEVICE: {
        tr: "Konum ve Cihaz Parmak İzi Verileri",
        en: "Geolocation & Device Fingerprint Data",
      },
    };

    const measureLabels: Record<DpaSecurityMeasure, { tr: string; en: string }> = {
      TLS_ENCRYPTION: { tr: "Uçtan Uca Şifreleme (TLS 1.3)", en: "End-to-End Encryption (TLS 1.3)" },
      AES256_AT_REST: { tr: "Durağan Veri Şifreleme (AES-256)", en: "Encryption at Rest (AES-256)" },
      MFA_ACCESS: { tr: "Çok Faktörlü Doğrulama (2FA/MFA)", en: "Multi-Factor Authentication (2FA/MFA)" },
      IP_RESTRICTION: { tr: "Sabit IP / VPN Kısıtlaması (Bastion)", en: "Dedicated IP / VPN Bastion Restriction" },
      LOCAL_STORAGE_PROHIBITED: {
        tr: "Yerel Cihaza Veri İndirme Yasağı",
        en: "Local Storage Prohibition",
      },
      AUDIT_LOGGING: { tr: "Değiştirilemez Denetim Logları", en: "Immutable Audit Trails" },
      ANONYMIZATION_MASKING: { tr: "Dinamik Veri Maskeleme", en: "Dynamic Data Masking & Pseudonymization" },
    };

    const categoriesList = config.dataCategories
      .map((c) => `- **${isTr ? categoryLabels[c].tr : categoryLabels[c].en}**`)
      .join("\n");

    const measuresList = config.securityMeasures
      .map((m) => `- [x] ${isTr ? measureLabels[m].tr : measureLabels[m].en}`)
      .join("\n");

    if (isTr) {
      return `### EK-2: 6698 SAYILI KVKK m. 12 VE GDPR m. 28 UYARINCA BİLİŞİM VERİ İŞLEME VE BİLGİ GÜVENLİĞİ PROTOKOLÜ (DPA)

İşbu Protokol; taraflar arasındaki Ana Yazılım Sözleşmesinin ayrılmaz bir eki olup, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun (KVKK) 12. maddesi ve Kişisel Veri Güvenliği Rehberi uyarınca akdedilmiştir.

#### 1. TARAFLARIN SIFATLARI VE TEMEL İLKE
- **Veri Sorumlusu (İş Sahibi):** ${clientName} — Kişisel verilerin işleme amaçlarını ve vasıtalarını belirleyen taraftır.
- **Veri İşleyen (Yüklenici):** ${contractorName} — Veri Sorumlusunun verdiği yetkiye dayanarak onun adına bilişim sistemleri üzerinde kişisel veri işleyen taraftır.

#### 2. İŞLEMENİN KAPSAMI, AMACI VE ERİŞİM SEVİYESİ
- **Tanımlanan Erişim Seviyesi:** ${accessLabels[config.accessLevel].tr}
- **İşlenen Kişisel Veri Kategorileri:**
${categoriesList}
- **Değerlendirilen Risk Seviyesi:** **${evaluation.riskLevel}** (Risk Skoru: ${evaluation.riskScore}/100)${evaluation.requiresDpia ? " — *Özel Nitelikli Veri Koruması (DPIA)*" : ""}

#### 3. YÜKLENİCİNİN (VERİ İŞLEYEN) KANUNİ YÜKÜMLÜLÜKLERİ
3.1. **Yalnızca Talimata Bağlılık:** Yüklenici, kişisel verileri münhasıran İş Sahibinin yazılı talimatları ve işbu sözleşmenin ifası amacıyla işleyebilir; kendi ticari veya şahsi amaçları için kopyalayamaz, işleyemez veya üçüncü taraflara aktaramaz.  
3.2. **Süresiz Gizlilik Yükümlülüğü:** Yüklenici ve projede görev alan uzmanlar, vakıf oldukları tüm kişisel veriler hakkında işbu sözleşme sona erse dahi süresiz bir sır saklama yükümlülüğü altındadır.  
3.3. **Yetkisiz Alt İşleyen Yasağı:** İş Sahibinin önceden verilmiş açık yazılı onayı olmaksızın hiçbir üçüncü taraf geliştirici, harici yapay zeka servisi veya bulut sağlayıcısı veriye erişemez.  
3.4. **Veri İhlali Bildirim Yükümlülüğü (SLA: ${breachHours} Saat):** Yüklenici, sistemlerinde veya yetkisi dahilindeki verilerde meydana gelebilecek herhangi bir sızıntı, yetkisiz erişim veya güvenlik şüphesini öğrendiği andan itibaren **en geç ${breachHours} saat içinde** İş Sahibine yazılı olarak bildirmekle yükümlüdür.  
3.5. **İlgili Kişi Hakları Desteği (KVKK m. 11):** İlgili kişilerin (kullanıcıların) veri silme, anonimleştirme veya bilgi taleplerinde Yüklenici teknik altyapıyı ivedilikle hazırlamakla yükümlüdür.  
3.6. **Sözleşme Sonu Veri İmhası:** İşbu sözleşmenin tamamlanması veya sona ermesi üzerine Yüklenici nezdindeki tüm yerel kopyalar, geçici veritabanları ve test verileri derhal silinecek ve İş Sahibine kanunen geçerli bir **"Kişisel Veri İmha Tutanağı"** teslim edilecektir.

#### 4. TAAHHÜT EDİLEN TEKNİK VE İDARİ TEDBİRLER
Yüklenici, KVKK m. 12 uyarınca aşağıdaki asgari güvenlik tedbirlerini eksiksiz uygulamayı taahhüt eder:
${measuresList}
`;
    }

    return `### ANNEX-2: STATUTORY DATA PROCESSING ADDENDUM (KVKK ART. 12 & GDPR ART. 28 COMPLIANT)

This Addendum constitutes an integral annex to the Principal Software Services Agreement pursuant to KVKK Art. 12 and GDPR Art. 28 governing personal data processing operations.

#### 1. STATUTORY ROLES OF THE PARTIES
- **Data Controller (Client):** ${clientName} — Determines purposes and means of processing personal data.
- **Data Processor (Contractor):** ${contractorName} — Processes personal data exclusively on behalf and under written instructions of the Controller.

#### 2. SCOPE, ACCESS LEVEL & RISK ASSESSMENT
- **Designated Access Tier:** ${accessLabels[config.accessLevel].en}
- **Categories of Processed Data:**
${categoriesList}
- **Assessed Risk Level:** **${evaluation.riskLevel}** (Score: ${evaluation.riskScore}/100)${evaluation.requiresDpia ? " — *Mandatory Special Category DPIA Active*" : ""}

#### 3. STATUTORY PROCESSOR OBLIGATIONS
3.1. **Documented Instructions Only:** The Processor shall process personal data exclusively on documented instructions from the Controller and never for personal or collateral commercial purposes.  
3.2. **Perpetual Confidentiality:** All authorized personnel processing data remain subject to strict statutory confidentiality persisting indefinitely beyond contract expiration.  
3.3. **Sub-processor Prohibition:** No third-party contractor, external AI API, or cloud infrastructure shall be engaged without prior written consent of the Controller.  
3.4. **Data Breach Notification (SLA: ${breachHours} Hours):** The Processor shall notify the Controller in writing **within ${breachHours} hours** of becoming aware of any actual or suspected personal data breach.  
3.5. **Data Subject Rights Assistance:** The Processor shall provide necessary technical capabilities to satisfy data subject requests under applicable privacy law.  
3.6. **Post-Termination Data Destruction:** Upon contract termination, the Processor shall irrevocably delete, wipe, or return all data copies and provide a formal **Data Destruction Certificate**.

#### 4. STIPULATED TECHNICAL & ORGANIZATIONAL MEASURES
The Processor strictly warrants implementation of the following security safeguards:
${measuresList}
`;
  }

  /**
   * Generates clean HTML table view of the DPA annex for @media print and web inspection.
   */
  static generateDpaAnnexHtml(
    config: DpaContractConfig,
    locale: ContractLanguage = "tr"
  ): string {
    const isTr = locale === "tr";
    const evaluation = this.evaluateDpaRisk(config);

    const categoryTextTr: Record<DpaDataCategory, string> = {
      IDENTITY_CONTACT: "Kimlik & İletişim",
      CUSTOMER_ACCOUNT_LOGS: "Hesap & Sistem Logları",
      FINANCIAL_TRANSACTION: "Finans & İşlem Geçmişi",
      SPECIAL_HEALTH_BIOMETRIC: "Özel Nitelikli (Sağlık/Biyometrik)",
      EMPLOYEE_DATA: "Personel & İK",
      LOCATION_DEVICE: "Konum & Cihaz Parmak İzi",
    };

    const categoryTextEn: Record<DpaDataCategory, string> = {
      IDENTITY_CONTACT: "Identity & Contact",
      CUSTOMER_ACCOUNT_LOGS: "Account & Logs",
      FINANCIAL_TRANSACTION: "Financial & Orders",
      SPECIAL_HEALTH_BIOMETRIC: "Special Category (Health/Biometric)",
      EMPLOYEE_DATA: "Employee & HR",
      LOCATION_DEVICE: "Location & Device",
    };

    const measureTextTr: Record<DpaSecurityMeasure, string> = {
      TLS_ENCRYPTION: "TLS 1.3 Şifreleme",
      AES256_AT_REST: "AES-256 Durağan Şifreleme",
      MFA_ACCESS: "2FA/MFA Doğrulama",
      IP_RESTRICTION: "IP / VPN Kısıtlaması",
      LOCAL_STORAGE_PROHIBITED: "Yerel İndirme Yasağı",
      AUDIT_LOGGING: "İşlem Denetim Logları",
      ANONYMIZATION_MASKING: "Dinamik Maskeleme",
    };

    const measureTextEn: Record<DpaSecurityMeasure, string> = {
      TLS_ENCRYPTION: "TLS 1.3 In-Transit",
      AES256_AT_REST: "AES-256 At-Rest",
      MFA_ACCESS: "2FA/MFA Required",
      IP_RESTRICTION: "IP/VPN Bastion",
      LOCAL_STORAGE_PROHIBITED: "No Local Copies",
      AUDIT_LOGGING: "Audit Logging",
      ANONYMIZATION_MASKING: "Data Masking",
    };

    return `
<div class="dpa-annex" style="margin: 20px 0; border: 1px solid #c7d2fe; background: #eef2ff; border-radius: 8px; padding: 14px; font-size: 8.5pt; break-inside: avoid; page-break-inside: avoid;">
  <div style="font-weight: 700; color: #3730a3; font-size: 10pt; margin-bottom: 6px; break-after: avoid-page; page-break-after: avoid;">
    🛡️ ${
      isTr
        ? "EK-2: 6698 Sayılı KVKK m. 12 & GDPR m. 28 Bilişim Veri İşleme Protokolü (DPA)"
        : "ANNEX-2: Data Processing Addendum (KVKK Art. 12 & GDPR Art. 28 Compliant)"
    }
  </div>
  <div style="font-size: 8pt; color: #4338ca; margin-bottom: 8px;">
    ${
      isTr
        ? `Risk Seviyesi: <strong>${evaluation.riskLevel} (${evaluation.riskScore}/100)</strong> | İhlal Bildirim Süresi: <strong>${config.breachNotificationHours || 24} Saat</strong> | Alt İşleyen İzni: <strong>Yazılı Onaya Tabi</strong>`
        : `Risk Tier: <strong>${evaluation.riskLevel} (${evaluation.riskScore}/100)</strong> | Breach SLA: <strong>${config.breachNotificationHours || 24}h</strong> | Sub-processor: <strong>Written Consent Required</strong>`
    }
  </div>
  <table style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 8pt; background: #ffffff;">
    <thead>
      <tr style="background: #e0e7ff; text-align: left;">
        <th style="border: 1px solid #c7d2fe; padding: 5px 8px; width: 45%;">${isTr ? "İşlenen Veri Kategorileri" : "Data Categories"}</th>
        <th style="border: 1px solid #c7d2fe; padding: 5px 8px; width: 55%;">${isTr ? "Uygulanacak Teknik & İdari Tedbirler" : "Technical Safeguards"}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border: 1px solid #c7d2fe; padding: 6px 8px; vertical-align: top;">
          ${config.dataCategories.map((c) => `• ${isTr ? categoryTextTr[c] : categoryTextEn[c]}`).join("<br>")}
        </td>
        <td style="border: 1px solid #c7d2fe; padding: 6px 8px; vertical-align: top;">
          ${config.securityMeasures.map((m) => `✓ ${isTr ? measureTextTr[m] : measureTextEn[m]}`).join("<br>")}
        </td>
      </tr>
    </tbody>
  </table>
</div>`;
  }

  /**
   * Generates a formal digital Data Destruction Certificate (Kişisel Veri İmha Tutanağı)
   * conforming to the Turkish Regulation on Data Deletion & Destruction.
   */
  static generateDestructionCertificate(
    record: Omit<DataDestructionRecord, "sha256CertificateHash">,
    locale: ContractLanguage = "tr"
  ): { markdown: string; sha256Hash: string } {
    const isTr = locale === "tr";
    const rawContent = `ENGAGEMENT:${record.engagementId}|DATE:${record.destructionDate}|METHOD:${record.destructionMethod}|CATEGORIES:${record.dataCategoriesDestroyed.join(",")}|CONTRACTOR:${record.contractorName}|CLIENT:${record.clientName}`;
    const sha256Hash = createHash("sha256").update(rawContent, "utf8").digest("hex");

    const markdown = isTr
      ? `# 6698 SAYILI KVKK UYARINCA KİŞİSEL VERİ SİLME VE İMHA TUTANAĞI
**Sözleşme / İş Referansı:** \`${record.engagementId}\`  
**İmha Tarihi ve Saati:** ${record.destructionDate}  
**Dijital Doğrulama Mührü (SHA-256):** \`${sha256Hash}\`

İşbu Tutanak; 6698 sayılı Kişisel Verilerin Korunması Kanunu ve "Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik" hükümleri gereğince düzenlenmiştir.

### 1. TARAFLAR
- **Veri Sorumlusu (İş Sahibi):** ${record.clientName}
- **Veri İşleyen (Yüklenici):** ${record.contractorName}

### 2. İMHA EDİLEN VERİ KAPSAMI VE YÖNTEMİ
- **İmha Edilen Veri Kategorileri:** ${record.dataCategoriesDestroyed.join(", ")}
- **Uygulanan İmha Yöntemi:** ${record.destructionMethod} (Güvenli Üzerine Yazma ve Kriptografik İmha)
- **Kapsam:** Yükleniciye ait yerel bilgisayarlar, geçici sunucular, test veritabanları, IDE önbellekleri ve taşınabilir disklerdeki tüm veriler geri döndürülemez biçimde yok edilmiştir.

### 3. TAAHHÜT VE BEYAN
Yüklenici; proje kapsamında elde ettiği veya işlediği hiçbir kişisel verinin kendi uhdesinde, yedeklerinde veya üçüncü taraflarda kalmadığını, verilerin tamamının kanuna uygun olarak imha edildiğini cezai ve hukuki sorumluluk altında beyan ve taahhüt eder.

| VERİ İŞLEYEN (YÜKLENİCİ) | VERİ SORUMLUSU (İŞ SAHİBİ) |
| :--- | :--- |
| **İsim / Unvan:** ${record.contractorName} | **İsim / Unvan:** ${record.clientName} |
| **İmza:** _________________________ | **İmza:** _________________________ |
`
      : `# STATUTORY DATA DESTRUCTION & DELETION CERTIFICATE (KVKK & GDPR)
**Engagement Reference:** \`${record.engagementId}\`  
**Destruction Timestamp:** ${record.destructionDate}  
**Cryptographic Verification Seal (SHA-256):** \`${sha256Hash}\`

Issued pursuant to statutory Personal Data Deletion and Destruction Regulations and GDPR Article 28(3)(g).

### 1. PARTIES
- **Data Controller:** ${record.clientName}
- **Data Processor:** ${record.contractorName}

### 2. DESTRUCTION SCOPE & METHOD
- **Destroyed Data Categories:** ${record.dataCategoriesDestroyed.join(", ")}
- **Applied Destruction Standard:** ${record.destructionMethod} (Cryptographic shredding & secure overwriting)
- **Scope:** All local repositories, database dumps, cache stores, and backups held by Processor have been irreversibly purged.

### 3. FORMAL UNDERTAKING
The Data Processor formally warrants that no residual personal data remains in its custody or sub-systems.

| DATA PROCESSOR | DATA CONTROLLER |
| :--- | :--- |
| **Name:** ${record.contractorName} | **Name:** ${record.clientName} |
| **Signature:** _________________________ | **Signature:** _________________________ |
`;

    return { markdown, sha256Hash };
  }
}
