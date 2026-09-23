/**
 * Independent Contractor Safe Harbor & Misclassification Engine
 *
 * Compliance:
 * - 4857 Sayılı İş Kanunu m. 8 (İş Sözleşmesi, Bağımlılık ve Ücret Unsurları)
 * - 6098 Sayılı Türk Borçlar Kanunu (TBK) m. 470 vd. (Eser Sözleşmesi ve Müteahhit Sıfatı)
 * - 6098 Sayılı TBK m. 502 vd. (Vekalet Sözleşmesi)
 * - 5510 Sayılı Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu m. 4/a vs m. 4/b
 * - Yargıtay 9. ve 22. Hukuk Daireleri Emsal Kararları (Hizmet ve Eser Sözleşmesi Ayrımı)
 * - 6100 Sayılı HMK m. 193 (Münhasır Delil Sözleşmesi)
 */

import type {
  SafeHarborRiskLevel,
  SafeHarborFactorBreakdown,
  SafeHarborConfig,
  SafeHarborEvaluation,
} from "./safe-harbor-types";

const SAFE_HARBOR_COLORS: Record<string, string> = {
  SAFE_HARBOR: "#059669",
  MODERATE_WARNING: "#d97706",
  CRITICAL_MISCLASSIFICATION: "#dc2626",
};

const SAFE_HARBOR_LABELS = {
  tr: {
    SAFE_HARBOR: "GÜVENLİ LİMAN (DÜŞÜK RİSK)",
    MODERATE_WARNING: "ORTA RİSK / DÜZELTİCİ ŞARTNAME",
    CRITICAL_MISCLASSIFICATION: "YÜKSEK GİZLİ İSTİHDAM TEHLİKESİ",
  },
  en: {
    SAFE_HARBOR: "SAFE HARBOR (LOW RISK)",
    MODERATE_WARNING: "MODERATE WARNING",
    CRITICAL_MISCLASSIFICATION: "CRITICAL MISCLASSIFICATION HAZARD",
  },
};

export class SafeHarborEngine {
  /**
   * Returns a standard safe-harbor baseline configuration (fully independent contractor).
   */
  static getDefaultConfig(): SafeHarborConfig {
    return {
      enabled: true,
      scheduleAutonomy: "FLEXIBLE_RESULT_ORIENTED",
      equipmentOwnership: "CONTRACTOR_OWN_TOOLS",
      managementHierarchy: "AUTONOMOUS_DELIVERABLE",
      exclusivityStatus: "OPEN_MARKET_MULTIPLE_CLIENTS",
      invoicingEntityStatus: "REGISTERED_COMPANY_INVOICE",
      corporateIntegration: "EXTERNAL_CONSULTANT_IDENTITY",
      rightOfSubstitutionAllowed: true,
      governingJurisdictionCity: "İstanbul",
    };
  }

  /**
   * Evaluates the misclassification hazard score (0 to 100) based on Yargıtay jurisprudence
   * and international common-law tests.
   */
  static evaluateMisclassificationRisk(config: SafeHarborConfig): SafeHarborEvaluation {
    const factorBreakdown: SafeHarborFactorBreakdown[] = [];
    const primaryRisksTr: string[] = [];
    const primaryRisksEn: string[] = [];
    const remedialMitigationsTr: string[] = [];
    const remedialMitigationsEn: string[] = [];

    // 1. Schedule Autonomy (Weight: 25)
    let schedulePoints: number;
    switch (config.scheduleAutonomy) {
      case "FIXED_BUSINESS_HOURS":
        schedulePoints = 25;
        primaryRisksTr.push("Sabit mesai saatleri (09:00-18:00) Yargıtay nezdinde en güçlü bağımlılık (hizmet akdi) karinesidir.");
        primaryRisksEn.push("Mandatory fixed working hours is the strongest indicator of employee subordination.");
        remedialMitigationsTr.push("Sözleşmede mesai saatleri kaldırılmalı, yalnızca sprint/teslimat teslim tarihleri belirlenmelidir.");
        remedialMitigationsEn.push("Remove daily schedule constraints; enforce deliverable deadlines only.");
        break;
      case "CORE_HOURS_OVERLAP":
        schedulePoints = 10;
        remedialMitigationsTr.push("Ortak iletişim pencereleri 2-3 saat ile sınırlandırılmalı, yoklama/devam zorunluluğu konulmamalıdır.");
        remedialMitigationsEn.push("Limit overlapping standups to 2-3 hours max without mandatory continuous presence.");
        break;
      case "FLEXIBLE_RESULT_ORIENTED":
      default:
        schedulePoints = 0;
        break;
    }
    factorBreakdown.push({
      factor: "SCHEDULE_AUTONOMY",
      labelTr: "Çalışma Saatleri & Zaman Serbestisi",
      labelEn: "Working Hours & Schedule Autonomy",
      points: schedulePoints,
      maxPoints: 25,
      isHighRisk: schedulePoints >= 20,
      recommendationTr:
        schedulePoints > 0
          ? "Teslimat bazlı çalışma modeline geçilmeli, günlük mesai takibi yapılmamalıdır."
          : "Mükemmel: Yüklenici saatlerini ve çalışma metodolojisini serbestçe belirlemektedir.",
      recommendationEn:
        schedulePoints > 0
          ? "Adopt deliverable-based management without daily attendance monitoring."
          : "Optimal: Contractor autonomously determines working hours and delivery pace.",
    });

    // 2. Equipment & Tools (Weight: 15)
    let equipmentPoints: number;
    switch (config.equipmentOwnership) {
      case "EMPLOYER_MANDATORY_HARDWARE":
        equipmentPoints = 15;
        primaryRisksTr.push("Müşterinin bilgisayar ve donanım zorunlu kılması işveren araç tahsisi olarak yorumlanabilir.");
        primaryRisksEn.push("Mandatory client-owned hardware strongly suggests traditional employee provisioning.");
        remedialMitigationsTr.push("BYOD (kendi bilgisayarını kullanma) esasına geçilmeli, kurumsal ortamlar yalnızca VPN/VDI ile sınırlandırılmalıdır.");
        remedialMitigationsEn.push("Transition to Bring-Your-Own-Device (BYOD) model with access-only cloud sandboxes.");
        break;
      case "MIXED_TOOLS":
        equipmentPoints = 7;
        remedialMitigationsTr.push("Şirket lisansları yalnızca proje erişimiyle sınırlandırılmalı, yazılımcının ana donanımına müdahale edilmemelidir.");
        remedialMitigationsEn.push("Restrict enterprise licenses strictly to project scope without controlling developer hardware.");
        break;
      case "CONTRACTOR_OWN_TOOLS":
      default:
        equipmentPoints = 0;
        break;
    }
    factorBreakdown.push({
      factor: "EQUIPMENT_OWNERSHIP",
      labelTr: "Araç, Donanım ve Lisans Sahipliği (BYOD)",
      labelEn: "Equipment & Hardware Ownership (BYOD)",
      points: equipmentPoints,
      maxPoints: 15,
      isHighRisk: equipmentPoints >= 10,
      recommendationTr:
        equipmentPoints > 0
          ? "Yüklenicinin kendi donanımını (BYOD) kullanması sözleşmeye açıkça yazılmalıdır."
          : "Mükemmel: Yüklenici kendi donanım ve yazılım araçlarını bağımsızca sağlamaktadır.",
      recommendationEn:
        equipmentPoints > 0
          ? "Explicitly document that the contractor supplies their own equipment (BYOD)."
          : "Optimal: Contractor provides their own development hardware and software stack.",
    });

    // 3. Management Hierarchy & Subordination (Weight: 20)
    let hierarchyPoints: number;
    switch (config.managementHierarchy) {
      case "DIRECT_SUPERVISOR_SUBORDINATION":
        hierarchyPoints = 20;
        primaryRisksTr.push("Yöneticinin doğrudan görev ataması ve performans değerlendirmesi hiyerarşik emir-talimat bağı kurar.");
        primaryRisksEn.push("Direct supervisor management and employee-style appraisals create legal subordination.");
        remedialMitigationsTr.push("İdari amir ilişkisi kaldırılmalı; değerlendirmeler yalnızca BDD/DoD kabul kriterleri üzerinden yapılmalıdır.");
        remedialMitigationsEn.push("Replace managerial supervision with objective BDD/DoD deliverable sign-offs.");
        break;
      case "COLLABORATIVE_AGILE":
        hierarchyPoints = 8;
        remedialMitigationsTr.push("Agile toplantıları iş takibi değil koordinasyon amaçlı tutulmalı, disiplin/sicil yaptırımı uygulanmamalıdır.");
        remedialMitigationsEn.push("Keep agile rituals collaborative rather than supervisory; avoid disciplinary protocols.");
        break;
      case "AUTONOMOUS_DELIVERABLE":
      default:
        hierarchyPoints = 0;
        break;
    }
    factorBreakdown.push({
      factor: "MANAGEMENT_HIERARCHY",
      labelTr: "Hiyerarşi ve Emir-Talimat İlişkisi",
      labelEn: "Managerial Hierarchy & Subordination",
      points: hierarchyPoints,
      maxPoints: 20,
      isHighRisk: hierarchyPoints >= 15,
      recommendationTr:
        hierarchyPoints > 0
          ? "İşverenin denetimi yalnızca teslim edilen 'esere' yönelik olmalı, sürece amir gibi müdahale edilmemelidir."
          : "Mükemmel: Yalnızca teknik kabul kriterleri denetlenmekte, hiyerarşik amirlik bulunmamaktadır.",
      recommendationEn:
        hierarchyPoints > 0
          ? "Client supervision must focus solely on deliverable acceptance, not day-to-day command."
          : "Optimal: Inspection is restricted to technical deliverables without administrative hierarchy.",
    });

    // 4. Exclusivity Status (Weight: 20)
    let exclusivityPoints: number;
    switch (config.exclusivityStatus) {
      case "STRICT_EXCLUSIVITY_FULL_TIME":
        exclusivityPoints = 20;
        primaryRisksTr.push("Yazılımcıya başka müşteri yasağı getirilmesi ekonomik bağımlılık ve tam zamanlı istihdam göstergesidir.");
        primaryRisksEn.push("Strict full-time exclusivity prevents independent trade and establishes economic dependence.");
        remedialMitigationsTr.push("Münhasırlık kaldırılmalı, yalnızca doğrudan proje bazlı gizlilik ve dar kapsamlı rekabet yasağı konmalıdır.");
        remedialMitigationsEn.push("Drop blanket exclusivity; use narrow project confidentiality and conflict clauses instead.");
        break;
      case "NON_COMPETE_ONLY":
        exclusivityPoints = 5;
        remedialMitigationsTr.push("Rekabet yasağının yalnızca birebir aynı ürün/müşteri odağında tutulduğu teyit edilmelidir.");
        remedialMitigationsEn.push("Ensure non-compete is strictly limited to direct competitive products, not general tech work.");
        break;
      case "OPEN_MARKET_MULTIPLE_CLIENTS":
      default:
        exclusivityPoints = 0;
        break;
    }
    factorBreakdown.push({
      factor: "EXCLUSIVITY_STATUS",
      labelTr: "Münhasırlık ve Başka Müşteri Özgürlüğü",
      labelEn: "Exclusivity & Concurrent Client Freedom",
      points: exclusivityPoints,
      maxPoints: 20,
      isHighRisk: exclusivityPoints >= 15,
      recommendationTr:
        exclusivityPoints > 0
          ? "Yüklenicinin serbest piyasada başka müşterilere hizmet verme hakkı sözleşmede açıkça vurgulanmalıdır."
          : "Mükemmel: Yüklenici bağımsız olarak diğer müşterilere hizmet vermekte tamamen serbesttir.",
      recommendationEn:
        exclusivityPoints > 0
          ? "Affirm in writing that the contractor retains the full right to serve other clients concurrently."
          : "Optimal: Contractor remains entirely free to provide commercial services to third parties.",
    });

    // 5. Invoicing & Tax Entity (Weight: 10)
    let invoicingPoints: number;
    switch (config.invoicingEntityStatus) {
      case "INDIVIDUAL_NO_TAX_ID":
        invoicingPoints = 10;
        primaryRisksTr.push("Vergi mükellefiyeti olmaması SGK müfettişlerinin bordrosuz kaçak işçi şüphesini tetikler.");
        primaryRisksEn.push("Lack of registered tax registration raises immediate tax audit and unregistered labor flags.");
        remedialMitigationsTr.push("GVK Mükerrer 20/B istisna belgesi alınmalı veya Gider Pusulası / Stopaj tevkifatı sözleşmeye bağlanmalıdır.");
        remedialMitigationsEn.push("Obtain GVK 20/B tax exemption or document legal withholding tax receipts.");
        break;
      case "FREELANCE_TAX_EXEMPT_OR_GVK20B":
        invoicingPoints = 4;
        remedialMitigationsTr.push("Banka dekontları üzerinde istisna kodu ve sözleşme referansı mutlaka belirtilmelidir.");
        remedialMitigationsEn.push("Ensure bank transfers cite the statutory tax exemption code and contract reference.");
        break;
      case "REGISTERED_COMPANY_INVOICE":
      default:
        invoicingPoints = 0;
        break;
    }
    factorBreakdown.push({
      factor: "INVOICING_ENTITY_STATUS",
      labelTr: "Vergi Mükellefiyeti ve Fatura Düzeni",
      labelEn: "Tax Registration & Invoicing Discipline",
      points: invoicingPoints,
      maxPoints: 10,
      isHighRisk: invoicingPoints >= 8,
      recommendationTr:
        invoicingPoints > 0
          ? "Yüklenicinin şahıs şirketi veya GVK 20/B istisna hesabı üzerinden e-SMM/e-Fatura kesmesi tavsiye edilir."
          : "Mükemmel: B2B fatura veya serbest meslek makbuzu (e-SMM) ile ticari ilişki tevsik edilmektedir.",
      recommendationEn:
        invoicingPoints > 0
          ? "Contractor is encouraged to operate through a registered entity or formal GVK 20/B tax account."
          : "Optimal: Commercial B2B invoices or e-SMM receipts formally substantiate business status.",
    });

    // 6. Corporate Integration & Email (Weight: 10)
    let integrationPoints: number;
    switch (config.corporateIntegration) {
      case "INTERNAL_EMAIL_AND_TITLE":
        integrationPoints = 10;
        primaryRisksTr.push("Kurumsal e-posta adresi (@sirket.com) ve iç unvan tahsisi işçi gibi gösterilme riskini artırır.");
        primaryRisksEn.push("Corporate domain email (@company.com) and organizational title create external appearance of employment.");
        remedialMitigationsTr.push("Yazılımcıya şirket içi unvan verilmemeli, e-posta yerine harici danışman misafir hesabı atanmalıdır.");
        remedialMitigationsEn.push("Use external contractor/consultant labels instead of internal corporate titles.");
        break;
      case "GUEST_ACCESS_SLACK_ONLY":
        integrationPoints = 3;
        remedialMitigationsTr.push("İletişim kanallarında '[Harici Danışman / Yüklenici]' ibaresi profil unvanında korunmalıdır.");
        remedialMitigationsEn.push("Maintain clear '[External Contractor]' badges across communication channels.");
        break;
      case "EXTERNAL_CONSULTANT_IDENTITY":
      default:
        integrationPoints = 0;
        break;
    }
    factorBreakdown.push({
      factor: "CORPORATE_INTEGRATION",
      labelTr: "Kurumsal Temsil ve E-Posta Entegrasyonu",
      labelEn: "Corporate Identity & Email Integration",
      points: integrationPoints,
      maxPoints: 10,
      isHighRisk: integrationPoints >= 7,
      recommendationTr:
        integrationPoints > 0
          ? "Üçüncü kişilere karşı dış danışman sıfatı korunmalı, şirket kartviziti veya unvanı kullanılmamalıdır."
          : "Mükemmel: Dış bağımsız yüklenici sıfatı net bir şekilde korunmaktadır.",
      recommendationEn:
        integrationPoints > 0
          ? "Preserve external contractor branding; avoid issuing corporate business cards or internal titles."
          : "Optimal: External independent contractor status is unmistakably preserved.",
    });

    // Calculate gross score
    let totalScore =
      schedulePoints +
      equipmentPoints +
      hierarchyPoints +
      exclusivityPoints +
      invoicingPoints +
      integrationPoints;

    // Right of substitution bonus: Ability to subcontract / bring squad assistants reduces subordination
    if (config.rightOfSubstitutionAllowed) {
      totalScore = Math.max(0, totalScore - 5);
    }

    // Clamp score
    totalScore = Math.min(100, Math.max(0, totalScore));

    // Determine Risk Level
    let riskLevel: SafeHarborRiskLevel = "SAFE_HARBOR";
    if (totalScore >= 55) {
      riskLevel = "CRITICAL_HAZARD";
    } else if (totalScore >= 25) {
      riskLevel = "MODERATE_WARNING";
    }

    // Prepare summaries
    let summaryTr: string;
    let summaryEn: string;

    if (riskLevel === "SAFE_HARBOR") {
      summaryTr = `Güvenli Liman (Skor: ${totalScore}/100): Taraflar arasındaki ilişki 6098 sayılı TBK m. 470 Eser Sözleşmesi ve bağımsız yüklenici standartlarıyla tam uyumludur. 4857 sayılı İş Kanunu m. 8 kapsamında gizli hizmet sözleşmesi iddiası riski asgari düzeydedir.`;
      summaryEn = `Safe Harbor (Score: ${totalScore}/100): The commercial relationship strictly conforms to TBK Art. 470 independent contract standards. Risk of disguised employment under Labor Law No. 4857 is minimal.`;
    } else if (riskLevel === "MODERATE_WARNING") {
      summaryTr = `Orta Risk (Skor: ${totalScore}/100): İlişki genel olarak ticari nitelikte olmakla birlikte, işaretlenen bazı unsurlar (mesai örtüşmesi, araç tahsisi veya şirket içi entegrasyon) SGK veya iş mahkemesi nezdinde tartışma yaratabilir. Sözleşmeye EK-3 Güvenli Liman Şartnamesi eklenmesi ve operasyonel tedbirlerin alınması tavsiye edilir.`;
      summaryEn = `Moderate Risk (Score: ${totalScore}/100): While fundamentally commercial, certain behavioral factors (schedule overlap, tool provisioning or corporate access) could trigger scrutiny during social security audits. Executing the Safe Harbor Addendum (Annex-3) is recommended.`;
    } else {
      summaryTr = `Yüksek Gizli İstihdam Tehlikesi (Skor: ${totalScore}/100): Mevcut çalışma şartları Yargıtay'ın yerleşik içtihatlarına göre fiili bir 'hizmet sözleşmesi' (işçi-işveren) karinesi oluşturmaktadır. Şirket aleyhine geriye dönük SGK prim borcu, idari para cezası ve kıdem/ihbar tazminatı riski mevcuttur. Çalışma koşullarının bağımsızlaştırılması veya resmi bordrolu istihdam tercih edilmelidir.`;
      summaryEn = `Critical Misclassification Hazard (Score: ${totalScore}/100): The parameters strongly indicate an employment relationship under Turkish Labor Law precedents. Significant risks of retroactive social security premiums, statutory penalties, and severance liabilities exist. Restructuring into deliverable-based autonomy or payroll employment is strongly advised.`;
    }

    const legalGroundTr =
      "4857 sayılı İş Kanunu m. 8, 6098 sayılı TBK m. 470 / 502, 5510 sayılı Sosyal Sigortalar Kanunu m. 4/a - 4/b, Yargıtay 9. HD 2017/22340 E. ve 22. HD 2016/18412 E. emsal kararları";
    const legalGroundEn =
      "Turkish Labor Law No. 4857 Art. 8, Code of Obligations No. 6098 Art. 470/502, Social Security Law No. 5510 Art. 4/a-4/b, Court of Cassation 9th & 22nd Civil Chambers Precedents";

    return {
      riskScore: totalScore,
      riskLevel,
      factorBreakdown,
      primaryRisksTr,
      primaryRisksEn,
      remedialMitigationsTr,
      remedialMitigationsEn,
      legalGroundTr,
      legalGroundEn,
      summaryTr,
      summaryEn,
    };
  }

  /**
   * Generates the official bilingual Markdown contract addendum (EK-3: Independent Contractor Safe Harbor Addendum).
   */
  static generateSafeHarborAnnexMarkdown(
    config: SafeHarborConfig,
    locale: "tr" | "en" = "tr",
    clientName = "İş Sahibi (Müşteri)",
    contractorName = "Yüklenici (Geliştirici)"
  ): string {
    const isTr = locale === "tr";
    const evalResult = this.evaluateMisclassificationRisk(config);
    const jurisdiction = config.governingJurisdictionCity || (isTr ? "İstanbul" : "Istanbul");

    if (isTr) {
      const SAFE_HARBOR_MARKDOWN_LABELS_TR: Record<string, string> = {
        SAFE_HARBOR: "DÜŞÜK RİSK / GÜVENLİ LİMAN",
        MODERATE_WARNING: "ORTA RİSK / TEDBİR PROTOKOLÜ",
        CRITICAL_HAZARD: "YÜKSEK RİSK BEYANI",
      };
      const riskLabelTr = SAFE_HARBOR_MARKDOWN_LABELS_TR[evalResult.riskLevel] ?? "YÜKSEK RİSK BEYANI";

      return `### EK-3: 4857 SAYILI İŞ KANUNU m. 8 UYUMLU BAĞIMSIZ YÜKLENİCİ GÜVENLİ LİMAN (SAFE HARBOR) ŞARTNAMESİ
*(INDEPENDENT CONTRACTOR STATUTORY COMPLIANCE & SAFE HARBOR ADDENDUM)*

**Yasal Dayanak ve İçtihatlar:**
- 4857 Sayılı İş Kanunu m. 8 (İş Sözleşmesi, Bağımlılık ve Ücret Unsurları)
- 6098 Sayılı Türk Borçlar Kanunu m. 470 vd. (Eser Sözleşmesi ve Sonuç Borcu) ve m. 502 vd. (Vekalet)
- 5510 Sayılı Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu m. 4/b (Kendi Adına Bağımsız Çalışan)
- Yargıtay 9. ve 22. Hukuk Daireleri Emsal İçtihatları (Fiili Bağımlılık Yokluğu)
- 6100 Sayılı HMK m. 193 (Münhasır Delil Sözleşmesi)

**Taraflar:**
- **Hizmet Alan / İş Sahibi:** ${clientName}
- **Bağımsız Yüklenici:** ${contractorName}
- **Operis Güvenli Liman Risk Endeksi:** \`${evalResult.riskScore} / 100\` (${riskLabelTr})

İşbu Şartname, Ana Sözleşme'nin ayrılmaz bir eki olup taraflar arasındaki hukuki ilişkinin vasfını ve sınırlarını tespit etmek üzere tanzim edilmiştir:

#### MADDE 1: TARAFLARIN HUKUKİ SIFATI VE İŞÇİ-İŞVEREN İLİŞKİSİNİN KESİN REDDİ
1.1. Taraflar, aralarındaki sözleşmesel ilişkinin münhasıran 6098 sayılı Türk Borçlar Kanunu m. 470 uyarınca bir **"Eser Sözleşmesi"** (ve/veya m. 502 uyarınca bağımsız danışmanlık/vekalet) mahiyetinde olduğunu, aralarında 4857 sayılı İş Kanunu anlamında hiçbir surette bir **hizmet sözleşmesi (işçi-işveren ilişkisi)** kurulmadığını ve kurulmasının amaçlanmadığını kabul, beyan ve taahhüt ederler.  
1.2. Yüklenici, işverenin organizasyonel şemasında yer alan bir personel veya işçi olmayıp, bağımsız bir ticari aktör ve harici teknoloji yüklenicisidir.

#### MADDE 2: ÇALIŞMA ZAMANI, YERİ VE METODOLOJİSİ SERBESTİSİ
2.1. Yüklenici; kararlaştırılan kilometre taşı teslim tarihlerine uymak kaydıyla, işi günün hangi saatlerinde, haftanın hangi günlerinde ve hangi mekanda gerçekleştireceğini **münhasıran ve tamamen kendisi** belirler.  
2.2. İşveren, Yüklenici'ye günlük mesai saati, asgari çalışma saati kotası, vardiya, mesai takip yazılımı (ekran/tuş kaydedici vb.) veya fiziksel/dijital yoklama zorunluluğu dayatamaz.

#### MADDE 3: ARAÇ, GEREÇ VE EKİPMAN BAĞIMSIZLIĞI (BYOD PRENSİBİ)
3.1. Yüklenici, taahhüt ettiği eseri meydana getirmek için gerekli olan bilgisayar, monitör, internet bağlantısı, geliştirme ortamı (IDE), lisanslar ve sair donanımları kendi imkanlarıyla temin eder (Bring Your Own Device - BYOD).  
3.2. İşveren tarafından sağlanan sunucu, API veya test ortamı erişimleri yalnızca eserin doğrulanması ve kabul testleri (BDD/DoD) maksatlı olup iş ekipmanı tahsisi niteliği taşımaz.

#### MADDE 4: HİYERARŞİK AMİR VE TALİMAT YOKLUĞU
4.1. İşveren, Yüklenici'ye bir işveren amiri sıfatıyla idari veya operasyonel emir ve talimat veremez; disiplin, performans sicili veya kurum içi yönetmelik hükümleri uygulayamaz.  
4.2. İşveren'in yetkisi, yalnızca sözleşmede kararlaştırılan teknik şartname, kabul kriterleri ve teslim edilen eserin ayıpsız olup olmadığını denetlemekten ibarettir.

#### MADDE 5: MÜNHASIRLIK YOKLUĞU VE ÇOKLU MÜŞTERİ ÖZGÜRLÜĞÜ
5.1. İşbu sözleşme Yüklenici'ye herhangi bir münhasırlık (tekel) yüklemez. Yüklenici, işbu sözleşmenin yürürlük süresi dahilinde serbest piyasada üçüncü kişilere, şirketlere veya platformlara bağımsız olarak yazılım, danışmanlık ve teknoloji hizmeti vermekte tamamen serbesttir.  
5.2. Müşteri, doğrudan sözleşme konusu projenin kaynak kodlarının gizliliği (NDA) haricinde Yüklenici'nin mesleki serbestisini engelleyici genel çalışma yasakları koyamaz.

#### MADDE 6: SOSYAL GÜVENLİK (SGK), VERGİ VE YASAL SORUMLULUKLAR
6.1. Yüklenici, 5510 sayılı Kanun m. 4/b (Bağ-Kur) veya kendi yasal vergi mükellefiyeti kapsamında tüm sigorta primleri, gelir vergisi, KDV ve sair mali yükümlülüklerinden bizzat ve münhasıran sorumludur.  
6.2. Yüklenici, İşveren'den kıdem tazminatı, ihbar tazminatı, yıllık ücretli izin alacağı, fazla mesai ücreti, resmi tatil ücreti veya iş güvencesi (işe iade) talebinde bulunamaz; bu haklardan peşinen ve gayrikabili rücu feragat etmiştir.

#### MADDE 7: İKAME HAKKI VE YARDIMCI KİŞİ ÇALIŞTIRMA SERBESTİSİ
7.1. ${config.rightOfSubstitutionAllowed ? "Yüklenici, işbu eserin ifasında işin niteliğine ve güvenlik protokollerine uygun olmak kaydıyla kendi nam ve hesabına alt yüklenici, yazılım uzmanı veya yardımcı kişi (TBK m. 471/3) istihdam etme ve görevlendirme hakkına haizdir." : "Yüklenici eseri şahsi teknik uzmanlığıyla yerine getirecek olup alt yüklenici görevlendirmesi İşveren'in yazılı onayına tabidir."}

#### MADDE 8: MÜNHASIR DELİL SÖZLEŞMESİ VE UYUŞMAZLIKLARIN ÇÖZÜMÜ
8.1. Taraflar arasındaki işbu sözleşme hükümleri ve Operis platform logları 6100 sayılı HMK m. 193 uyarınca münhasır delil teşkil eder.  
8.2. İşbu Şartname'den kaynaklanabilecek her türlü ihtilafta **${jurisdiction} Mahkemeleri ve İcra Daireleri** yetkilidir.`;
    }

    return `### ANNEX-3: INDEPENDENT CONTRACTOR SAFE HARBOR & ANTI-MISCLASSIFICATION PROTOCOL
*(COMPLIANCE WITH TURKISH LABOR LAW NO. 4857 ART. 8 & TBK ART. 470)*

**Statutory & Case Law Foundations:**
- Turkish Labor Law No. 4857 Article 8 (Definition of Employment & Subordination)
- Turkish Code of Obligations No. 6098 Article 470 et seq. (Contract for Work / Independent Contractor)
- Social Security Law No. 5510 Article 4/b (Self-Employed Registration)
- Court of Cassation (Yargıtay) 9th and 22nd Civil Chambers Precedents on Non-Subordination
- Turkish Code of Civil Procedure No. 6100 Article 193 (Exclusive Evidence Contract)

**Contracting Parties:**
- **Client (Principal):** ${clientName}
- **Independent Contractor:** ${contractorName}
- **Operis Misclassification Risk Index:** \`${evalResult.riskScore} / 100\` (${evalResult.riskLevel})

This Protocol constitutes an integral annex to the Principal Agreement and establishes the independent commercial status of the engagement:

#### SECTION 1: LEGAL STATUS & COMPLETE REJECTION OF EMPLOYMENT
1.1. The parties expressly confirm that this Agreement is strictly a **Contract for Work (Eser Sözleşmesi)** pursuant to TBK Art. 470. Under no circumstances does this relationship constitute an employment contract (Hizmet Sözleşmesi) under Labor Law No. 4857.  
1.2. The Contractor is an independent commercial contractor and not an employee, agent, or servant of the Client.

#### SECTION 2: AUTONOMY OF TIME, LOCATION & METHODOLOGY
2.1. Provided milestone deliverables meet agreed deadlines, the Contractor retains **complete and unilateral autonomy** to choose working hours, days, and physical locations.  
2.2. The Client shall not impose working hours, daily attendance logs, shift rotations, or keystroke/screen tracking software.

#### SECTION 3: TOOL & HARDWARE OWNERSHIP (BYOD PRINCIPLE)
3.1. The Contractor furnishes all computing devices, developer tools (IDEs), operating environments, and internet connectivity at their own cost (Bring Your Own Device - BYOD).  
3.2. Any client-provided staging environments, APIs, or sandbox credentials serve strictly for acceptance inspection (BDD/DoD) and do not constitute employer tooling.

#### SECTION 4: ABSENCE OF MANAGERIAL HIERARCHY
4.1. The Client holds no disciplinary authority, supervisory command, or administrative oversight over the Contractor.  
4.2. The Client's supervision is strictly limited to inspecting whether delivered milestones conform to agreed acceptance criteria (DoD).

#### SECTION 5: NON-EXCLUSIVITY & CONCURRENT CLIENT FREEDOM
5.1. The Contractor is expressly entitled to solicit, market, and perform commercial development and consulting services for third parties concurrently without restriction.  
5.2. No blanket exclusivity is created beyond the strict confidentiality of project-specific proprietary source code.

#### SECTION 6: TAXES, SOCIAL SECURITY & REMUNERATION EXCLUSIONS
6.1. The Contractor is solely responsible for all social security contributions (SGK 4/b Bağ-Kur), corporate/income taxes, VAT, and fiscal declarations.  
6.2. The Contractor has no claim to severance pay, notice pay, statutory paid leave, overtime pay, or reinstatement protections under labor legislation.

#### SECTION 7: RIGHT OF SUBSTITUTION
7.1. ${config.rightOfSubstitutionAllowed ? "The Contractor retains the right to engage assistants, squad collaborators, or qualified subcontractors (TBK Art. 471/3) under their own responsibility to perform portions of the work." : "The Contractor shall execute the deliverables personally unless prior written consent is obtained from the Client."}

#### SECTION 8: EXCLUSIVE EVIDENCE & JURISDICTION
8.1. This Protocol and platform timestamped logs constitute exclusive conclusive evidence under HMK Art. 193.  
8.2. Any disputes shall be submitted exclusively to the competent **Courts and Execution Offices of ${jurisdiction}**.`;
  }

  /**
   * Generates a printable, styled HTML version of Annex-3.
   */
  static generateSafeHarborAnnexHtml(config: SafeHarborConfig, locale: "tr" | "en" = "tr"): string {
    const isTr = locale === "tr";
    const evalResult = this.evaluateMisclassificationRisk(config);
    const jurisdiction = config.governingJurisdictionCity || (isTr ? "İstanbul" : "Istanbul");

    const badgeColor = SAFE_HARBOR_COLORS[evalResult.riskLevel] ?? "#dc2626";
    const lang = isTr ? "tr" : "en";
    const badgeLabel =
      SAFE_HARBOR_LABELS[lang][evalResult.riskLevel as keyof (typeof SAFE_HARBOR_LABELS)["tr"]] ??
      evalResult.riskLevel;

    return `
<div class="safe-harbor-annex" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; margin-top: 32px; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #ffffff;">
  <div class="safe-harbor-header" style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; break-after: avoid-page; page-break-after: avoid;">
    <div>
      <h3 style="margin: 0; font-size: 18px; color: #0f172a; break-after: avoid-page; page-break-after: avoid;">
        ${isTr ? "EK-3: 4857 Sayılı İş Kanunu m. 8 Uyumlu Bağımsız Yüklenici Güvenli Liman Şartnamesi" : "ANNEX-3: Independent Contractor Safe Harbor Protocol"}
      </h3>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">
        ${isTr ? "6098 s. TBK m. 470, 4857 s. İş K. m. 8, 5510 s. SGK K. m. 4/b & HMK m. 193 Uyumlu" : "Compliant with TBK Art. 470, Labor Law No. 4857 Art. 8 & SGK Law No. 5510"}
      </p>
    </div>
    <div style="background-color: ${badgeColor}; color: #ffffff; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-align: right; white-space: nowrap;">
      ${badgeLabel} (${evalResult.riskScore}/100)
    </div>
  </div>

  <div class="safe-harbor-summary" style="background-color: #f8fafc; border-left: 4px solid ${badgeColor}; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; line-height: 1.5; color: #334155; break-after: avoid-page; page-break-after: avoid; break-inside: avoid; page-break-inside: avoid;">
    <strong>${isTr ? "Yargıtay Risk Özeti:" : "Court of Cassation Risk Assessment:"}</strong> ${isTr ? evalResult.summaryTr : evalResult.summaryEn}
  </div>

  <div class="safe-harbor-clauses" style="font-size: 13px; line-height: 1.6; color: #334155;">
    <div class="safe-harbor-item" style="break-inside: avoid; page-break-inside: avoid; margin-bottom: 14px;">
      <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 14px; break-after: avoid-page; page-break-after: avoid;">
        ${isTr ? "1. Tarafların Hukuki Sıfatı ve Hizmet Akdinin Reddi" : "1. Legal Status & Rejection of Employment"}
      </h4>
      <p style="margin: 0; text-align: justify;">
        ${isTr ? "Taraflar, aralarındaki ilişkinin 6098 sayılı TBK m. 470 uyarınca bağımsız bir Eser Sözleşmesi olduğunu, 4857 sayılı İş Kanunu anlamında hiçbir surette işçi-işveren ilişkisi doğurmadığını peşinen kabul ve taahhüt ederler." : "The parties confirm this contract constitutes an independent Contract for Work under TBK Art. 470, strictly excluding any employment relationship under Labor Law No. 4857."}
      </p>
    </div>

    <div class="safe-harbor-item" style="break-inside: avoid; page-break-inside: avoid; margin-bottom: 14px;">
      <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 14px; break-after: avoid-page; page-break-after: avoid;">
        ${isTr ? "2. Zaman, Yer ve Çalışma Metodolojisi Serbestisi" : "2. Schedule, Location & Methodology Autonomy"}
      </h4>
      <p style="margin: 0; text-align: justify;">
        ${isTr ? "Yüklenici, işbu eseri günün hangi saatlerinde ve nerede yapacağını münhasıran kendisi belirler. İşveren mesai takibi, günlük devam kontrolü veya tuş kaydedici dayatamaz." : "The Contractor autonomously dictates working hours and physical location. The Client shall not mandate daily schedules or surveillance software."}
      </p>
    </div>

    <div class="safe-harbor-item" style="break-inside: avoid; page-break-inside: avoid; margin-bottom: 14px;">
      <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 14px; break-after: avoid-page; page-break-after: avoid;">
        ${isTr ? "3. Araç, Gereç ve Lisans Bağımsızlığı (BYOD)" : "3. Equipment & Tool Autonomy (BYOD)"}
      </h4>
      <p style="margin: 0; text-align: justify;">
        ${isTr ? "Yüklenici kendi donanım, bilgisayar ve yazılım lisanslarını bizzat temin eder (Bring Your Own Device). İşveren ortamları yalnızca kabul testi amacıyla erişime açılır." : "The Contractor provides all developer hardware and software independently (BYOD). Client environments serve exclusively for acceptance testing."}
      </p>
    </div>

    <div class="safe-harbor-item" style="break-inside: avoid; page-break-inside: avoid; margin-bottom: 14px;">
      <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 14px; break-after: avoid-page; page-break-after: avoid;">
        ${isTr ? "4. Hiyerarşik Amir Yokluğu ve Çıktı Odaklılık" : "4. Absence of Managerial Hierarchy"}
      </h4>
      <p style="margin: 0; text-align: justify;">
        ${isTr ? "İşveren, Yüklenici'ye idari amir sıfatıyla emir veremez. Denetim yalnızca teslim edilen eserin BDD/DoD kabul kriterlerine uygunluğuyla sınırlıdır." : "The Client possesses no supervisory hierarchy over the Contractor. Oversight is strictly confined to deliverable BDD/DoD acceptance criteria."}
      </p>
    </div>

    <div class="safe-harbor-item" style="break-inside: avoid; page-break-inside: avoid; margin-bottom: 14px;">
      <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 14px; break-after: avoid-page; page-break-after: avoid;">
        ${isTr ? "5. Münhasırlık Yokluğu ve Çoklu Müşteri Özgürlüğü" : "5. Non-Exclusivity & Concurrent Client Freedom"}
      </h4>
      <p style="margin: 0; text-align: justify;">
        ${isTr ? "Yüklenici üçüncü şahıslara serbestçe hizmet vermekte muhtardır. İşveren münhasırlık veya genel çalışma yasağı uygulayamaz." : "The Contractor is entirely free to perform technical services for third parties concurrently without restriction."}
      </p>
    </div>

    <div class="safe-harbor-item" style="break-inside: avoid; page-break-inside: avoid; margin-bottom: 14px;">
      <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 14px; break-after: avoid-page; page-break-after: avoid;">
        ${isTr ? "6. SGK 4/b, Vergi ve Sosyal Haklar Muafiyeti" : "6. Social Security (SGK 4/b) & Severance Exclusions"}
      </h4>
      <p style="margin: 0; text-align: justify;">
        ${isTr ? "Yüklenici 5510 sayılı Kanun m. 4/b (Bağ-Kur) ve vergi yükümlülüklerinden bizzat sorumludur. Kıdem tazminatı, ihbar tazminatı ve yıllık izin talebinde bulunulamaz." : "Contractor bears sole responsibility for SGK 4/b self-employed coverage and taxes. Claims for severance, notice pay, or paid leave are expressly waived."}
      </p>
    </div>

    <div class="safe-harbor-item" style="break-inside: avoid; page-break-inside: avoid; margin-bottom: 6px;">
      <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 14px; break-after: avoid-page; page-break-after: avoid;">
        ${isTr ? "7. Delil Sözleşmesi ve Yetkili Mahkeme" : "7. Evidence Agreement & Jurisdiction"}
      </h4>
      <p style="margin: 0; text-align: justify;">
        ${isTr ? `HMK m. 193 uyarınca münhasır delil teşkil eden işbu şartnameden doğan ihtilaflarda <strong>${jurisdiction} Mahkemeleri</strong> yetkilidir.` : `Pursuant to HMK Art. 193, disputes shall be submitted exclusively to the competent <strong>Courts of ${jurisdiction}</strong>.`}
      </p>
    </div>
  </div>
</div>
`;
  }
}
