/**
 * Data Processing Addendum (DPA) Types & Enums
 *
 * Compliance:
 * - 6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) m. 12 (Veri Güvenliği Yükümlülükleri)
 * - Kişisel Verileri Koruma Kurumu "Kişisel Veri Güvenliği Rehberi (Teknik ve İdari Tedbirler)"
 * - Veri Silme, Yok Etme veya Anonim Hale Getirme Hakkında Yönetmelik
 * - Regulation (EU) 2016/679 (GDPR) Article 28 (Processor Obligations)
 */

export type DpaAccessLevel =
  | "NO_ACCESS_SYNTHETIC" // Yalnızca maskeli / sentetik test verisi
  | "READ_ONLY_STAGING" // Test ortamında salt-okunur gerçek/maskeli veri
  | "FULL_PRODUCTION_ACCESS"; // Canlı veritabanı veya üretim ortamına doğrudan erişim

export type DpaDataCategory =
  | "IDENTITY_CONTACT" // Ad-soyad, e-posta, telefon, TCKN/Pasaport
  | "CUSTOMER_ACCOUNT_LOGS" // Kullanıcı hesapları, şifre hashleri, IP logları, oturum kayıtları
  | "FINANCIAL_TRANSACTION" // Fatura bilgileri, ödeme geçmişi, siparişler, banka hesapları
  | "SPECIAL_HEALTH_BIOMETRIC" // KVKK m. 6: Sağlık, biyometrik, ceza mahkumiyeti, sendika
  | "EMPLOYEE_DATA" // Şirket içi personel, bordro ve İK kayıtları
  | "LOCATION_DEVICE"; // Canlı konum, GPS, cihaz donanım parmak izi

export type DpaSecurityMeasure =
  | "TLS_ENCRYPTION" // Uçtan uca TLS 1.3 şifreleme
  | "AES256_AT_REST" // Veritabanı ve disk seviyesinde AES-256 şifreleme
  | "MFA_ACCESS" // Çok faktörlü kimlik doğrulama (2FA/MFA)
  | "IP_RESTRICTION" // Sabit IP veya VPN kısıtlaması (Bastion Host)
  | "LOCAL_STORAGE_PROHIBITED" // Verilerin geliştirici yerel cihazına indirilmesi yasağı
  | "AUDIT_LOGGING" // Değiştirilemez işlem ve sorgu denetim kayıtları
  | "ANONYMIZATION_MASKING"; // Dinamik veri maskeleme ve sahte kimliklendirme

export type DpaRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface DpaContractConfig {
  enabled: boolean;
  accessLevel: DpaAccessLevel;
  dataCategories: DpaDataCategory[];
  securityMeasures: DpaSecurityMeasure[];
  breachNotificationHours?: number; // Varsayılan: 24 saat (KVKK 72 saatlik resmi kurul bildirimini karşılamak için)
  subProcessorAllowed?: boolean; // Varsayılan: false (İşveren yazılı onayı zorunlu)
  dataRetentionDaysAfterTermination?: number; // Varsayılan: 0 (Sözleşme bittiğinde derhal imha)
  dpoContactEmail?: string | null;
}

export interface DpaRiskEvaluation {
  riskScore: number; // 0 - 100
  riskLevel: DpaRiskLevel;
  requiresDpia: boolean; // KVKK / GDPR Veri Koruma Etki Değerlendirmesi zorunlu mu?
  mandatoryMeasures: DpaSecurityMeasure[];
  recommendedMeasures: DpaSecurityMeasure[];
  summaryTr: string;
  summaryEn: string;
}

export interface DataDestructionRecord {
  engagementId: string;
  contractorName: string;
  clientName: string;
  destructionDate: string;
  destructionMethod: "SECURE_OVERWRITE" | "CRYPTO_SHREDDING" | "PHYSICAL_DEGAUSSING";
  dataCategoriesDestroyed: DpaDataCategory[];
  sha256CertificateHash: string;
  signedByContractor: boolean;
}
