/**
 * AI-Assisted Code IP, License Cleanliness & Warranty Governance Types (EK-4)
 *
 * Statutory & Regulatory Compliance:
 * - 5846 Sayılı Fikir ve Sanat Eserleri Kanunu (FSEK) m. 1/B (Eser Tanımı ve Sahibinin Hususiyeti),
 *   m. 2 (İlim ve Edebiyat Eserleri - Bilgisayar Programları), m. 8 (Eser Sahibi) ve m. 52 (Mali Hakların Devri & Şekil Şartı)
 * - Avrupa Birliği Yapay Zeka Yasası (EU Artificial Intelligence Act - Regulation 2024/1689)
 *   m. 50 (Yapay Zeka Şeffaflık Yükümlülükleri) ve m. 53 (GPAI Modelleri Telif Hakkı Uyumu)
 * - 6098 Sayılı Türk Borçlar Kanunu (TBK) m. 474-477 (Eser Sözleşmesinde Ayıba Karşı Tekeffül & Halüsinasyon Sorumluluğu)
 * - 6100 Sayılı Hukuk Muhakemeleri Kanunu (HMK) m. 193 (Münhasır Delil Sözleşmesi & SHA-256 Merkle Damgalı Loglar)
 * - Uluslararası Telif Otoriteleri: US Copyright Office (USCO) Human Authorship Guidance & WIPO AI-IP Standards
 */

export type AiUsageLevel =
  | "AI_FREE_HUMAN_ONLY" // 0 Puan: %100 İnsan Eliyle Kodlama; Yapay zeka kodu üretilmemiştir (Maksimum FSEK koruması)
  | "AI_ASSISTED_HUMAN_REVIEWED" // 15 Puan: İnsan Mühendis Denetimli AI; AI yardımcı araç olarak kullanılmış, mimari ve kod insan tarafından denetlenmiştir
  | "HEAVY_AI_GENERATED"; // 35 Puan: Yoğun Yapay Zeka İskeleti; Kod blokları büyük oranda otonom üretilmiş olup sıkı inceleme gerektirir

export type AiToolProvider =
  | "CURSOR"
  | "GITHUB_COPILOT"
  | "CLAUDE_CODE"
  | "CHATGPT_ENTERPRISE"
  | "LOCAL_OFFLINE_LLM"
  | "CUSTOM_PROPRIETARY"
  | "NONE";

export type AiDataPrivacyTier =
  | "ENTERPRISE_ZERO_RETENTION" // 0 Puan: Kurumsal Sıfır Saklama (Zero Data Retention); Prompt ve kodlar model eğitimine dahil edilmez
  | "LOCAL_OFFLINE_EXECUTION" // 0 Puan: Yerel Çevrimdışı Çalıştırma; Kod ve veriler sunucu veya dış ağa çıkmaz
  | "CONSUMER_PUBLIC_TRAINING_RISK"; // 25 Puan: Halka Açık Tüketici Sürümü; Müşteri verilerinin ve kodların eğitime dahil edilme riski mevcuttur

export type AiIpRiskLevel =
  | "PRISTINE_IP_SAFE" // 0 - 24 Puan: Kusursuz Telif; FSEK m. 52 devri tam güvencede, copyleft riski yok
  | "COMMERCIALLY_VIABLE_MONITORED" // 25 - 54 Puan: Ticarileştirilebilir Standart; İnsan denetimli, ticari kullanıma uygun
  | "COPYRIGHT_CONTAMINATION_HAZARD"; // 55 - 100 Puan: Yüksek Telif ve Bulaşma Tehlikesi; Telif devri geçersizliği veya GPL virüsü şüphesi

export interface AiGovernanceFactorBreakdown {
  factor: string;
  labelTr: string;
  labelEn: string;
  points: number;
  maxPoints: number;
  isHighRisk: boolean;
  recommendationTr: string;
  recommendationEn: string;
}

export interface AiGovernanceConfig {
  enabled: boolean;
  usageLevel: AiUsageLevel;
  declaredTools: AiToolProvider[];
  customToolNames?: string[];
  dataPrivacyTier: AiDataPrivacyTier;
  humanInTheLoopAffirmed: boolean; // Yüklenici kodu bizzat mimari denetimden geçirip FSEK m. 1/B hususiyeti kazandırmıştır
  copyleftFreeWarranted: boolean; // Kodun GPL/AGPL copyleft açık kaynak virüsü içermediği garantisi
  zeroDataRetentionWarranted: boolean; // Müşterinin ticari sırlarının ve kodlarının AI eğitim havuzuna aktarılmadığı taahhüdü
  strictDefectLiabilityAccepted: boolean; // AI halüsinasyonu ve güvenlik açığının TBK m. 474 kapsamında yüklenici ayıbı sayılacağı kabulü
  codeReviewToolUsed?: boolean; // SonarQube, Snyk vb. otomatik statik analiz veya lisans taraması yapıldı
  repositoryBranchOrTag?: string; // Tutanakta veya sözleşmede referans verilen repo/dal
  additionalNotes?: string;
}

export interface AiGovernanceEvaluation {
  riskScore: number; // 0 - 100
  riskLevel: AiIpRiskLevel;
  factorBreakdown: AiGovernanceFactorBreakdown[];
  primaryRisksTr: string[];
  primaryRisksEn: string[];
  remedialMitigationsTr: string[];
  remedialMitigationsEn: string[];
  legalGroundTr: string;
  legalGroundEn: string;
  summaryTr: string;
  summaryEn: string;
}
