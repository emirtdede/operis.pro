/**
 * Independent Contractor Safe Harbor & Misclassification Shield Types
 *
 * Statutory & Jurisprudential Compliance:
 * - 4857 Sayılı İş Kanunu m. 8 (İş Sözleşmesi ve Bağımlılık Unsuru)
 * - 6098 Sayılı Türk Borçlar Kanunu (TBK) m. 470 (Eser Sözleşmesi), m. 502 (Vekalet Sözleşmesi)
 * - 5510 Sayılı Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu m. 4/a (Hizmet Akdi) vs m. 4/b (Bağımsız Çalışan)
 * - Yargıtay 9. Hukuk Dairesi ve 22. Hukuk Dairesi Emsal Kararları (Fiili Bağımlılık İndisleri)
 * - Uluslararası Emsal Standartlar: IRS Common Law 20-Factor Rules & California ABC Test
 */

export type ScheduleAutonomy =
  | "FLEXIBLE_RESULT_ORIENTED" // 0 Puan: Tam zaman ve yer serbestisi; teslim tarihine uymak kaydıyla saatleri serbestçe belirler
  | "CORE_HOURS_OVERLAP" // 10 Puan: Günlük 2-3 saatlik ortak iletişim/standup penceresi; geri kalan çalışma saatleri esnek
  | "FIXED_BUSINESS_HOURS"; // 25 Puan: Haftaiçi 09:00 - 18:00 veya sabit saatlerde kesintisiz çevrim içi olma zorunluluğu

export type EquipmentOwnership =
  | "CONTRACTOR_OWN_TOOLS" // 0 Puan: BYOD; Yüklenici kendi bilgisayarını, IDE'sini ve çalışma ekipmanını kullanır
  | "MIXED_TOOLS" // 7 Puan: Yüklenicinin kendi bilgisayarı ancak müşteri tarafından sağlanan lisans/kurumsal yazılım
  | "EMPLOYER_MANDATORY_HARDWARE"; // 15 Puan: Müşteri tarafından zimmetlenen dizüstü bilgisayar ve ekipman zorunluluğu

export type ManagementHierarchy =
  | "AUTONOMOUS_DELIVERABLE" // 0 Puan: İşveren yalnızca teslim edilen çıktıyı (DoD/BDD) denetler; işin yapılış tarzına karışmaz
  | "COLLABORATIVE_AGILE" // 8 Puan: Agile/Scrum sprintlerine ve planlamalara katılır ancak hiyerarşik amir denetimi yoktur
  | "DIRECT_SUPERVISOR_SUBORDINATION"; // 20 Puan: Müşterinin bir yöneticisi günlük görev atar, performans değerlendirmesi yapar

export type ExclusivityStatus =
  | "OPEN_MARKET_MULTIPLE_CLIENTS" // 0 Puan: Başka müşterilere serbestçe hizmet verebilir; münhasırlık veya tekel yoktur
  | "NON_COMPETE_ONLY" // 5 Puan: Yalnızca doğrudan rakip projelere hizmet vermeme kısıtı; diğer sektörlere açıktır
  | "STRICT_EXCLUSIVITY_FULL_TIME"; // 20 Puan: Başka hiçbir müşteriyle çalışamaz; tüm mesaisini münhasıran bu müşteriye tahsis eder

export type InvoicingEntityStatus =
  | "REGISTERED_COMPANY_INVOICE" // 0 Puan: Şahıs şirketi veya Ltd/A.Ş. mükellefi; e-Fatura veya e-SMM düzenler
  | "FREELANCE_TAX_EXEMPT_OR_GVK20B" // 4 Puan: GVK Mükerrer 20/B veya Vergi Muafiyet Belgesi ile banka stopajlı rejim
  | "INDIVIDUAL_NO_TAX_ID"; // 10 Puan: Vergi mükellefiyeti yok; doğrudan kişisel IBAN'a transfer ve stopaj tevkifatı

export type CorporateIntegration =
  | "EXTERNAL_CONSULTANT_IDENTITY" // 0 Puan: Dış yüklenici/danışman kimliğiyle hareket eder; şirket unvanı veya e-postası taşımaz
  | "GUEST_ACCESS_SLACK_ONLY" // 3 Puan: İletişim araçlarında (Slack/Teams) misafir hesabı; dışa dönük şirket e-postası yoktur
  | "INTERNAL_EMAIL_AND_TITLE"; // 10 Puan: Şirket alan adlı e-posta (@sirket.com), iç organizasyon şemasında unvan veya kartvizit tahsisi

export type SafeHarborRiskLevel =
  | "SAFE_HARBOR" // 0 - 24 Puan: Yüksek hukuki koruma; tam bağımsız yüklenici statüsü
  | "MODERATE_WARNING" // 25 - 54 Puan: Orta risk; bazı unsurlar bağımlılık şüphesi yaratabilir, düzeltici tedbir önerilir
  | "CRITICAL_HAZARD"; // 55 - 100 Puan: Yüksek tehlike; fiili hizmet sözleşmesi (işçi-işveren) sayılma ihtimali yüksektir

export interface SafeHarborFactorBreakdown {
  factor: string;
  labelTr: string;
  labelEn: string;
  points: number;
  maxPoints: number;
  isHighRisk: boolean;
  recommendationTr: string;
  recommendationEn: string;
}

export interface SafeHarborConfig {
  enabled: boolean;
  scheduleAutonomy: ScheduleAutonomy;
  equipmentOwnership: EquipmentOwnership;
  managementHierarchy: ManagementHierarchy;
  exclusivityStatus: ExclusivityStatus;
  invoicingEntityStatus: InvoicingEntityStatus;
  corporateIntegration: CorporateIntegration;
  rightOfSubstitutionAllowed?: boolean; // Yüklenicinin yerine başka bir uzman görevlendirebilme (ikame) serbestisi
  governingJurisdictionCity?: string; // Uyuşmazlık halinde yetkili mahkeme şehri
}

export interface SafeHarborEvaluation {
  riskScore: number; // 0 - 100
  riskLevel: SafeHarborRiskLevel;
  factorBreakdown: SafeHarborFactorBreakdown[];
  primaryRisksTr: string[];
  primaryRisksEn: string[];
  remedialMitigationsTr: string[];
  remedialMitigationsEn: string[];
  legalGroundTr: string;
  legalGroundEn: string;
  summaryTr: string;
  summaryEn: string;
}
