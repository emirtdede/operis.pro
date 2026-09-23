/**
 * AI-Assisted Code IP, License Cleanliness & Warranty Governance Engine (EK-4)
 *
 * Statutory & Jurisprudential Compliance:
 * - 5846 Sayılı Fikir ve Sanat Eserleri Kanunu (FSEK) m. 1/B, m. 2, m. 8 ve m. 52
 * - Avrupa Birliği Yapay Zeka Yasası (EU Artificial Intelligence Act - Regulation (EU) 2024/1689) m. 50 ve m. 53
 * - 6098 Sayılı Türk Borçlar Kanunu (TBK) m. 474 vd. (Eser Sözleşmesinde Ayıba Karşı Tekeffül & Halüsinasyon Sorumluluğu)
 * - 6100 Sayılı Hukuk Muhakemeleri Kanunu (HMK) m. 193 (Münhasır Delil Sözleşmesi)
 * - US Copyright Office (USCO) Human Authorship Guidance & WIPO AI-IP Standards
 */

import type {
  AiDataPrivacyTier,
  AiGovernanceConfig,
  AiGovernanceEvaluation,
  AiGovernanceFactorBreakdown,
  AiIpRiskLevel,
  AiUsageLevel,
} from "./ai-governance-types";

const USAGE_LEVEL_TEXT: Record<"tr" | "en", Record<AiUsageLevel, string>> = {
  tr: {
    AI_FREE_HUMAN_ONLY: "%100 İnsan Eliyle Kodlama (Saf İnsani Eser)",
    AI_ASSISTED_HUMAN_REVIEWED: "İnsan Mühendis Denetimli Yapay Zeka (AI-Assisted Human-Reviewed)",
    HEAVY_AI_GENERATED: "Yoğun Yapay Zeka Üretimi (Heavy AI Prototyping & Scaffolding)",
  },
  en: {
    AI_FREE_HUMAN_ONLY: "100% Pure Human Creation (No Generative AI)",
    AI_ASSISTED_HUMAN_REVIEWED: "AI-Assisted with Human-in-the-Loop Architecture & Review",
    HEAVY_AI_GENERATED: "Heavy AI Generation & Scaffolding",
  },
};

const PRIVACY_TIER_TEXT: Record<"tr" | "en", Record<AiDataPrivacyTier, string>> = {
  tr: {
    ENTERPRISE_ZERO_RETENTION: "Kurumsal Sıfır Veri Saklama (Zero Data Retention / Model Eğitimine Kapalı)",
    LOCAL_OFFLINE_EXECUTION: "Yerel Çevrimdışı Çalıştırma (Local Air-Gapped LLM)",
    CONSUMER_PUBLIC_TRAINING_RISK: "Halka Açık Tüketici Sürümü (Genel Model Eğitimi Riski)",
  },
  en: {
    ENTERPRISE_ZERO_RETENTION: "Enterprise Zero Data Retention (Excluded from LLM Training)",
    LOCAL_OFFLINE_EXECUTION: "Local Offline Air-Gapped Execution",
    CONSUMER_PUBLIC_TRAINING_RISK: "Consumer Tier (Potential Model Training Risk)",
  },
};

const RISK_LEVEL_LABELS_TR: Record<string, string> = {
  PRISTINE_IP_SAFE: "KUSURSUZ TELİF GÜVENCESİ",
  COMMERCIALLY_VIABLE_MONITORED: "TİCARİLEŞTİRİLEBİLİR STANDART",
  ELEVATED_IP_RISK_DISCLOSED: "YÜKSEK RİSK BEYANI",
};

const RISK_LEVEL_BADGE_COLORS: Record<string, string> = {
  PRISTINE_IP_SAFE: "#059669",
  COMMERCIALLY_VIABLE_MONITORED: "#d97706",
  ELEVATED_IP_RISK_DISCLOSED: "#dc2626",
};

export class AiGovernanceEngine {
  /**
   * Returns a standard recommended baseline configuration for AI-assisted software development.
   */
  static getDefaultConfig(): AiGovernanceConfig {
    return {
      enabled: true,
      usageLevel: "AI_ASSISTED_HUMAN_REVIEWED",
      declaredTools: ["CURSOR", "GITHUB_COPILOT"],
      dataPrivacyTier: "ENTERPRISE_ZERO_RETENTION",
      humanInTheLoopAffirmed: true,
      copyleftFreeWarranted: true,
      zeroDataRetentionWarranted: true,
      strictDefectLiabilityAccepted: true,
      codeReviewToolUsed: true,
    };
  }

  /**
   * Evaluates the AI-IP Risk and License Contamination Score (0 to 100)
   * based on FSEK m. 52, EU AI Act Art. 50/53, and TBK m. 474 standards.
   */
  static evaluateAiGovernanceRisk(config: AiGovernanceConfig): AiGovernanceEvaluation {
    const factorBreakdown: AiGovernanceFactorBreakdown[] = [];
    const primaryRisksTr: string[] = [];
    const primaryRisksEn: string[] = [];
    const remedialMitigationsTr: string[] = [];
    const remedialMitigationsEn: string[] = [];

    // 1. AI Usage Intensity (Weight: 35)
    let usagePoints: number;
    switch (config.usageLevel) {
      case "HEAVY_AI_GENERATED":
        usagePoints = 35;
        primaryRisksTr.push(
          "Yoğun otonom AI üretimi FSEK m. 1/B kapsamında 'insan eseri/hususiyet' vasfını zedeleyebilir ve telif devrini tartışmalı kılabilir."
        );
        primaryRisksEn.push(
          "Heavy autonomous AI generation risks lacking human authorship under copyright doctrine, threatening public domain exposure."
        );
        remedialMitigationsTr.push(
          "Yüklenicinin mimari tasarım ve kod revizyon katkısını (Human-in-the-Loop) detaylı teslim tutanağı ile tevsik etmesi gerekir."
        );
        remedialMitigationsEn.push(
          "Document human architectural oversight and prompt engineering refactoring in handover logs to substantiate human authorship."
        );
        break;
      case "AI_ASSISTED_HUMAN_REVIEWED":
        usagePoints = 15;
        remedialMitigationsTr.push(
          "Yapay zeka araçları üretken yardımcı olarak kullanılmış olup insan mühendis denetimi esastır."
        );
        remedialMitigationsEn.push(
          "AI tools used as copilots; human engineer code review and validation must be continuously maintained."
        );
        break;
      case "AI_FREE_HUMAN_ONLY":
      default:
        usagePoints = 0;
        break;
    }
    factorBreakdown.push({
      factor: "AI_USAGE_INTENSITY",
      labelTr: "Yapay Zeka Kullanım Yoğunluğu",
      labelEn: "AI Usage Intensity & Tool Dependency",
      points: usagePoints,
      maxPoints: 35,
      isHighRisk: usagePoints >= 30,
      recommendationTr:
        usagePoints > 20
          ? "Yoğun AI kodlamasında insan mühendisin editoryal ve mimari katkısı mutlaka belgelenmelidir."
          : "Mükemmel: İnsan mühendis katkısı belirgin olup FSEK m. 52 devri için sağlam hukuki zemin mevcuttur.",
      recommendationEn:
        usagePoints > 20
          ? "In heavy AI workflows, actively document human architectural refactoring and validation."
          : "Optimal: Clear human engineer authorship establishes solid copyright assignment ground.",
    });

    // 2. Data Privacy & Zero Retention (Weight: 25)
    let dataPrivacyPoints: number;
    switch (config.dataPrivacyTier) {
      case "CONSUMER_PUBLIC_TRAINING_RISK":
        dataPrivacyPoints = 25;
        primaryRisksTr.push(
          "Halka açık tüketici yapay zeka modelleri müşteri kodunu ve veritabanı şemalarını model eğitimi için saklayabilir (Ticari sır ihlali)."
        );
        primaryRisksEn.push(
          "Consumer-tier public AI models may ingest client source code and database schemas into third-party training corpuses."
        );
        remedialMitigationsTr.push(
          "Geliştirici kurumsal sıfır saklama (Zero Data Retention) hesaplarına veya yerel çevrimdışı LLM kullanımına geçmelidir."
        );
        remedialMitigationsEn.push(
          "Upgrade to Enterprise Zero-Data-Retention agreements or switch to local/offline air-gapped LLM models."
        );
        break;
      case "LOCAL_OFFLINE_EXECUTION":
      case "ENTERPRISE_ZERO_RETENTION":
      default:
        dataPrivacyPoints = 0;
        break;
    }
    factorBreakdown.push({
      factor: "DATA_PRIVACY_TIER",
      labelTr: "Veri Gizliliği ve Sıfır Saklama (Zero-Training)",
      labelEn: "Data Privacy & Zero Data Retention Tier",
      points: dataPrivacyPoints,
      maxPoints: 25,
      isHighRisk: dataPrivacyPoints >= 20,
      recommendationTr:
        dataPrivacyPoints > 0
          ? "Müşteri kodlarının ve ticari sırlarının üçüncü taraf modellerin eğitimine kapatılması zorunlu tutulmalıdır."
          : "Mükemmel: Veriler model eğitimine dahil edilmemekte veya yerel makinede çevrimdışı işlenmektedir.",
      recommendationEn:
        dataPrivacyPoints > 0
          ? "Ensure client source code is strictly opted out of public foundation model training."
          : "Optimal: Proprietary code is processed under zero-retention enterprise terms or offline local engines.",
    });

    // 3. Human-in-the-Loop & FSEK m. 52 Hususiyet Beyanı (Weight: 20)
    let humanLoopPenalty = 0;
    if (config.usageLevel !== "AI_FREE_HUMAN_ONLY" && !config.humanInTheLoopAffirmed) {
      humanLoopPenalty = 20;
      primaryRisksTr.push(
        "İnsani mimari katkı (Human-in-the-Loop) beyan edilmediğinden kodun FSEK m. 1/B uyarınca kamu malı sayılma riski yüksektir."
      );
      primaryRisksEn.push(
        "Absence of human-in-the-loop affirmation leaves code susceptible to public domain determinations under USCO/WIPO rules."
      );
      remedialMitigationsTr.push(
        "Yüklenicinin kodu bizzat gözden geçirdiğine ve mimari hususiyet kazandırdığına dair FSEK m. 52 beyanı imzalanmalıdır."
      );
      remedialMitigationsEn.push(
        "Execute statutory human authorship assignment affidavit confirming developer's creative architectural direction."
      );
    }
    factorBreakdown.push({
      factor: "HUMAN_IN_THE_LOOP",
      labelTr: "İnsani Fikri Katkı (Human-in-the-Loop) Güvencesi",
      labelEn: "Human-in-the-Loop Authorship Warranty",
      points: humanLoopPenalty,
      maxPoints: 20,
      isHighRisk: humanLoopPenalty > 0,
      recommendationTr:
        humanLoopPenalty > 0
          ? "FSEK m. 52 kapsamında telifin geçerli devri için yüklenicinin insani hususiyet taahhüdü alınmalıdır."
          : "Mükemmel: Yüklenici insan mühendis denetimini ve fikri katkısını resmen taahhüt etmiştir.",
      recommendationEn:
        humanLoopPenalty > 0
          ? "Execute formal human authorship affirmation to ensure valid copyright transfer under IP statutes."
          : "Optimal: Contractor warrants human oversight, architectural direction, and creative contribution.",
    });

    // 4. Copyleft (GPL/AGPL) Lisans Bulaşma Yasağı (Weight: 15)
    let copyleftPenalty = 0;
    if (!config.copyleftFreeWarranted) {
      copyleftPenalty = 15;
      primaryRisksTr.push(
        "Yapay zekanın açık kaynak önerileri müşterinin ticarî kapalı kaynak yazılımına GPL/AGPL virüsü bulaştırabilir."
      );
      primaryRisksEn.push(
        "AI code snippet suggestions risk embedding copyleft (GPL/AGPL) licenses, threatening commercial proprietary status."
      );
      remedialMitigationsTr.push(
        "Sözleşmeye ve teslim tutanağına viral copyleft lisans bulaşması olmadığına dair kati garanti maddesi eklenmelidir."
      );
      remedialMitigationsEn.push(
        "Incorporate strict copyleft-free warranty clauses and perform automated package/snippet license audits."
      );
    }
    factorBreakdown.push({
      factor: "COPYLEFT_FREE_WARRANTY",
      labelTr: "Açık Kaynak (GPL/AGPL) Lisans Temizliği",
      labelEn: "Copyleft (GPL/AGPL) License Hygiene Warranty",
      points: copyleftPenalty,
      maxPoints: 15,
      isHighRisk: copyleftPenalty > 0,
      recommendationTr:
        copyleftPenalty > 0
          ? "Viral açık kaynak lisanslarının ticarî koda sızmasını önlemek için açık garanti istenmelidir."
          : "Mükemmel: Kod tabanında copyleft virüsü bulunmadığı garanti altına alınmıştır.",
      recommendationEn:
        copyleftPenalty > 0
          ? "Require express representations against viral copyleft license contamination."
          : "Optimal: Codebase is formally warranted free of unwanted copyleft liabilities.",
    });

    // 5. Halüsinasyon ve Ayıp Sorumluluğu (TBK m. 474) (Weight: 10)
    let defectPenalty = 0;
    if (!config.strictDefectLiabilityAccepted) {
      defectPenalty = 10;
      primaryRisksTr.push(
        "Yüklenicinin 'yapay zeka üretti' diyerek TBK m. 474 ayıba karşı tekeffül borcundan kaçınma riski mevcuttur."
      );
      primaryRisksEn.push(
        "Risk that contractor disclaims liability for AI hallucinations, functional defects, or hidden vulnerabilities."
      );
      remedialMitigationsTr.push(
        "Yapay zeka halüsinasyonlarının da yüklenicinin kusuru sayılacağı sözleşmeye açıkça dercedilmelidir."
      );
      remedialMitigationsEn.push(
        "Affirm that AI hallucinations and vulnerabilities constitute contractor defects under statutory warranties."
      );
    }
    factorBreakdown.push({
      factor: "DEFECT_HALLUCINATION_LIABILITY",
      labelTr: "Halüsinasyon & Güvenlik Açığı Sorumluluğu (TBK m. 474)",
      labelEn: "AI Hallucination & Defect Warranty (TBK Art. 474)",
      points: defectPenalty,
      maxPoints: 10,
      isHighRisk: defectPenalty > 0,
      recommendationTr:
        defectPenalty > 0
          ? "Yapay zeka çıktılarının profesyonel ayıpsız ifa sorumluluğu kapsamında olduğu teyit edilmelidir."
          : "Mükemmel: Yüklenici AI çıktılarından doğacak ayıplardan münhasıran sorumlu olduğunu kabul etmiştir.",
      recommendationEn:
        defectPenalty > 0
          ? "Enforce contractor defect liability for AI-generated code defects and vulnerabilities."
          : "Optimal: Contractor explicitly accepts full defect warranty over all AI-assisted outputs.",
    });

    // Total gross score
    let totalScore =
      usagePoints +
      dataPrivacyPoints +
      humanLoopPenalty +
      copyleftPenalty +
      defectPenalty;

    // Automated Code Review Bonus (-5 points)
    if (config.codeReviewToolUsed) {
      totalScore = Math.max(0, totalScore - 5);
      factorBreakdown.push({
        factor: "CODE_REVIEW_DISCOUNT",
        labelTr: "Otomatik Güvenlik & Lisans Taraması İndirimi",
        labelEn: "Automated Security & License Audit Discount",
        points: -5,
        maxPoints: 0,
        isHighRisk: false,
        recommendationTr: "Otomatik statik analiz ve lisans tarama araçları risk seviyesini düşürmektedir.",
        recommendationEn: "Automated static analysis and license screening tools mitigate contamination risks.",
      });
    }

    // Clamp score 0 - 100
    totalScore = Math.min(100, Math.max(0, totalScore));

    // Determine Risk Level
    let riskLevel: AiIpRiskLevel = "PRISTINE_IP_SAFE";
    if (totalScore >= 55) {
      riskLevel = "COPYRIGHT_CONTAMINATION_HAZARD";
    } else if (totalScore >= 25) {
      riskLevel = "COMMERCIALLY_VIABLE_MONITORED";
    }

    // Prepare summaries
    let summaryTr: string;
    let summaryEn: string;

    if (riskLevel === "PRISTINE_IP_SAFE") {
      summaryTr = `Kusursuz Telif Güvencesi (Risk Skoru: ${totalScore}/100): Kod tabanı 5846 sayılı FSEK m. 52, EU AI Act m. 50 ve ticari gizlilik standartlarıyla tam uyumludur. İnsani hususiyet ve sıfır veri saklama taahhütleri tamdır; telif devri hukuken eksiksizdir.`;
      summaryEn = `Pristine IP Safe (Score: ${totalScore}/100): Codebase strictly adheres to FSEK Art. 52, EU AI Act Art. 50, and zero-retention standards. Full human authorship and clean licensing ensure bulletproof IP assignment.`;
    } else if (riskLevel === "COMMERCIALLY_VIABLE_MONITORED") {
      summaryTr = `Ticarileştirilebilir Standart (Risk Skoru: ${totalScore}/100): Üretken yapay zeka araçları insan mühendis gözetiminde kullanılmıştır. Ticari kullanıma uygun olmakla birlikte sözleşmeye EK-4 şartnamesinin eklenmesi ve lisans tarama kayıtlarının saklanması tavsiye edilir.`;
      summaryEn = `Commercially Viable & Monitored (Score: ${totalScore}/100): Generative AI tools are deployed under human engineer supervision. Fully suitable for enterprise use with execution of Annex-4 AI Governance Protocol.`;
    } else {
      summaryTr = `Yüksek Telif ve Bulaşma Riski (Risk Skoru: ${totalScore}/100): Otonom AI kullanımı, eksik insani hususiyet beyanı veya copyleft/gizlilik riskleri mevcuttur. Kodun kamu malı kalma veya açık kaynak lisans virüsü kapma tehlikesi bulunmaktadır. EK-4 protokolü ile taahhütlerin netleştirilmesi şarttır.`;
      summaryEn = `Copyright & Contamination Hazard (Score: ${totalScore}/100): High reliance on autonomous AI without verified human authorship or copyleft warranties poses severe IP voidance and GPL contamination risks. Immediate execution of Annex-4 warranties required.`;
    }

    const legalGroundTr =
      "5846 sayılı FSEK m. 1/B, m. 2, m. 8, m. 52; AB Yapay Zeka Yasası (Regulation 2024/1689) m. 50/53; 6098 sayılı TBK m. 474; 6100 sayılı HMK m. 193";
    const legalGroundEn =
      "Turkish Law on Intellectual and Artistic Works No. 5846 Arts. 1/B, 2, 8, 52; EU AI Act (2024/1689) Arts. 50/53; TBK Art. 474; HMK Art. 193; USCO Human Authorship Guidance";

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
   * Generates official bilingual Markdown contract addendum (EK-4: AI Governance & IP Addendum).
   */
  static generateAiGovernanceAnnexMarkdown(
    config: AiGovernanceConfig,
    locale: "tr" | "en" = "tr",
    clientName = "İş Sahibi (Müşteri)",
    contractorName = "Yüklenici (Geliştirici)"
  ): string {
    const isTr = locale === "tr";
    const evalResult = this.evaluateAiGovernanceRisk(config);

    let toolsDisplay = "None Declared";
    if (config.declaredTools.length > 0) {
      toolsDisplay = config.declaredTools.join(", ");
    } else if (isTr) {
      toolsDisplay = "Beyan Edilmemiş / Yok";
    }

    const usageLevelTextTr = USAGE_LEVEL_TEXT.tr[config.usageLevel] ?? config.usageLevel;
    const usageLevelTextEn = USAGE_LEVEL_TEXT.en[config.usageLevel] ?? config.usageLevel;

    const privacyTierTextTr = PRIVACY_TIER_TEXT.tr[config.dataPrivacyTier] ?? config.dataPrivacyTier;
    const privacyTierTextEn = PRIVACY_TIER_TEXT.en[config.dataPrivacyTier] ?? config.dataPrivacyTier;

    const riskLabelTr = RISK_LEVEL_LABELS_TR[evalResult.riskLevel] ?? "YÜKSEK RİSK BEYANI";

    if (isTr) {
      return `### EK-4: 5846 SAYILI FSEK m. 52 VE AB YAPAY ZEKA YASASI (EU AI ACT) UYUMLU YAPAY ZEKA TELİF DEVRİ, LİSANS TEMİZLİĞİ VE HALÜSİNASYON SORUMLULUK ŞARTNAMESİ
*(AI-ASSISTED CODE INTELLECTUAL PROPERTY ASSIGNMENT, LICENSE INTEGRITY & WARRANTY ADDENDUM)*

**Mevzuat ve Uluslararası Dayanak:**
- 5846 Sayılı Fikir ve Sanat Eserleri Kanunu m. 1/B, m. 2, m. 8 ve m. 52 (Bilgisayar Programlarında Sahibinin Hususiyeti ve Mali Hak Devri)
- Avrupa Birliği Yapay Zeka Yasası (EU Artificial Intelligence Act - Regulation (EU) 2024/1689) m. 50 ve m. 53 (Şeffaflık ve GPAI Telif Uyumu)
- 6098 Sayılı Türk Borçlar Kanunu m. 474 vd. (Eser Sözleşmesinde Ayıba Karşı Tekeffül ve Mesleki Özen Borcu)
- 6100 Sayılı Hukuk Muhakemeleri Kanunu m. 193 (Münhasır Delil Sözleşmesi ve Log Kayıtları)
- WIPO ve US Copyright Office (USCO) Human Authorship (İnsani Müelliflik) Kılavuz İlkeleri

**Taraflar:**
- **İş Sahibi (Müşteri):** ${clientName}
- **Yüklenici (Geliştirici):** ${contractorName}
- **Operis AI-IP Telif Güvence Endeksi:** \`${evalResult.riskScore} / 100\` (${riskLabelTr})
- **Beyan Edilen AI Araçları:** \`${toolsDisplay}\`
- **Yapay Zeka Kullanım Modeli:** ${usageLevelTextTr}
- **Veri Gizliliği Güvence Düzeyi:** ${privacyTierTextTr}

İşbu Şartname, Ana Sözleşme'nin ayrılmaz bir eki olup projenin kaynak kodlarının telif geçerliliği, lisans saflığı ve teknik sorumluluklarını hüküm altına alır:

#### MADDE 1: ŞEFFAFLIK VE YASAL BEYAN YÜKÜMLÜLÜĞÜ (EU AI ACT m. 50 UYUMU)
1.1. Yüklenici, işbu sözleşme konusu yazılımın geliştirilmesi esnasında yapay zeka araçlarının kullanım derecesini yukarıda şeffafça beyan etmiştir.  
1.2. Yüklenici, projenin kaynak kodlarına entegre edilen bileşenlerde yapay zeka kullanım düzeyini ve araçlarını İş Sahibi'nden gizlemeyeceğini, gizlenen otonom kod parçalarından bizzat sorumlu olacağını kabul ve taahhüt eder.

#### MADDE 2: FSEK m. 52 UYARINCA İNSANİ HUSUSİYET (HUMAN-IN-THE-LOOP) VE TELİF DEVRİNİN GEÇERLİLİĞİ
2.1. Yüklenici; kod tabanında yapay zeka araçlarından faydalanılmış olsa dahi, projenin sistem mimarisi, veri modelleri, iş mantığı, fonksiyonel hiyerarşisi ve algoritmik akışının bizzat **insan mühendislik aklı ve fikri katkısıyla** tasarlandığını kabul ve beyan eder.  
2.2. Yüklenici, kodun salt bir yapay zeka çıktısı (raw machine generation) olmadığını, insan denetiminden (Human-in-the-Loop) geçirilerek şekillendirildiğini ve 5846 sayılı FSEK m. 1/B anlamında **"eser sahibinin hususiyetini"** taşıdığını tasdik eder.  
2.3. Yüklenici; işbu sözleşme ve FSEK m. 52 uyarınca yazılım üzerindeki tüm mali hakları (FSEK m. 21 İşleme, m. 22 Çoğaltma, m. 23 Yayma, m. 24 Temsil, m. 25 Umuma İletim Hakkı) yer, sayı ve süre kısıtlaması olmaksızın, münhasıran ve gayrikabili rücu İş Sahibi'ne devretmiştir. Hiçbir kod parçası kamu malı (public domain) bırakılmayacaktır.

#### MADDE 3: AÇIK KAYNAK VE COPYLEFT (GPL/AGPL) LİSANS BULAŞMA YASAĞI (LICENSE HYGIENE)
3.1. Yüklenici; yapay zeka modelleri tarafından önerilen veya kod tabanına dahil edilen hiçbir kod parçasının, projenin kapalı kaynak ticarî mahiyetini zedeleyecek viral copyleft açık kaynak lisansları (GPL v2/v3, AGPL, LGPL, SSPL vb.) ile lisanslanmış kod içermediğini **kesin ve gayrikabili rücu garanti eder**.  
3.2. Kod tabanına yalnızca permissive (MIT, Apache 2.0, BSD vb.) lisanslı açık kaynak paketler entegre edilebilir; işbu paketlerin lisans bildirimleri proje reposunda eksiksiz muhafaza edilir.

#### MADDE 4: MÜŞTERİ VERİ GİZLİLİĞİ VE SIFIR SAKLAMA (ZERO-DATA-RETENTION) TAAHHÜDÜ
4.1. Yüklenici; İş Sahibi'ne ait ticarî sırları, veri tabanı şemalarını, iş kurallarını, kullanıcı verilerini veya kaynak kodları, üçüncü taraf yapay zeka modellerinin genel eğitim havuzuna aktaracak şekilde halka açık tüketici araçlarına girmeyeceğini kabul eder.  
4.2. Geliştirme süreçlerinde kullanılan tüm yapay zeka ortamlarının kurumsal **"Sıfır Veri Saklama (Zero Data Retention - ZDR)"** politikasına tabi olduğu veya çevrimdışı yerel sistemlerde yürütüldüğü taahhüt edilir.

#### MADDE 5: HALÜSİNASYON, GÜVENLİK AÇIKLARI VE AYIP SORUMLULUĞU (TBK m. 474)
5.1. Yüklenici; kod bloklarının yapay zeka tarafından önerilmiş olmasını ileri sürerek 6098 sayılı TBK m. 474 kapsamında ayıba karşı tekeffül sorumluluğundan kurtulamaz.  
5.2. Yapay zeka halüsinasyonları, mantık hataları, bellek sızıntıları, OWASP Top 10 güvenlik açıkları ve performans kusurları doğrudan Yüklenici'nin mesleki özen borcunun ihlali ve ayıplı ifa sayılır. Yüklenici, işbu ayıpları derhal ve bila-ücret gidermekle mükelleftir.

#### MADDE 6: TEST VE STATİK ANALİZ DENETİMİ
6.1. Yüklenici; yapay zeka destekli üretilen tüm kodları birim testleri (unit tests), entegrasyon testleri ve statik analiz (linter/SAST) araçlarından geçirerek doğrulayacağını taahhüt eder.  
6.2. Teslim edilen kodların sözleşmede kararlaştırılan Tanımlanmış Tamamlanma Kriterleri'ne (DoD) ve BDD kabul testlerine tam uygunluğu aranır.

#### MADDE 7: FİKRİ MÜLKİYET İHLALİ TAZMİNATI (IP INDEMNIFICATION)
7.1. Üçüncü şahısların veya hak sahiplerinin, teslim edilen yazılımın yapay zeka çıktısı nedeniyle telif hakkını veya patentini ihlal ettiği iddiasıyla İş Sahibi aleyhine dava açması halinde; Yüklenici tüm dava masraflarını, avukatlık ücretlerini ve mahkemece hükmedilecek tazminatları tazmin etmeyi ve İş Sahibi'ni beri kılmayı kabul ve taahhüt eder.

#### MADDE 8: MÜNHASIR DELİL SÖZLEŞMESİ (HMK m. 193) VE YETKİLİ MAHKEME
8.1. Taraflar, Operis platformu üzerinde üretilen SHA-256 dijital mühürlü teslim tutanaklarının, AI kullanım beyanlarının ve Git commit loglarının 6100 sayılı HMK m. 193 uyarınca kesin ve bağlayıcı delil teşkil edeceğini kabul ederler.  
8.2. İşbu Şartname'den doğan uyuşmazlıklarda Ana Sözleşme'de kararlaştırılan Mahkemeler ve İcra Daireleri yetkilidir.`;
    }

    return `### ANNEX-4: AI-ASSISTED CODE INTELLECTUAL PROPERTY, LICENSE INTEGRITY & WARRANTY ADDENDUM
*(COMPLIANCE WITH EU AI ACT ART. 50/53 & STATUTORY COPYRIGHT DOCTRINES)*

**Statutory & International Foundations:**
- EU Artificial Intelligence Act (Regulation (EU) 2024/1689) Arts. 50 & 53 (Transparency & GPAI Copyright Compliance)
- Turkish Law on Intellectual and Artistic Works No. 5846 Arts. 1/B, 2, 8, and 52 (Human Authorship & Economic Rights Assignment)
- Turkish Code of Obligations No. 6098 Art. 474 et seq. (Defect Liability & Professional Duty of Care)
- Turkish Code of Civil Procedure No. 6100 Art. 193 (Exclusive Evidence Agreement)
- US Copyright Office (USCO) Human Authorship Guidance & WIPO AI-IP Standards

**Contracting Parties:**
- **Client (Principal):** ${clientName}
- **Contractor (Developer):** ${contractorName}
- **Operis AI-IP Risk Index:** \`${evalResult.riskScore} / 100\` (${evalResult.riskLevel})
- **Declared AI Tools:** \`${toolsDisplay}\`
- **AI Deployment Model:** ${usageLevelTextEn}
- **Data Privacy & Retention Tier:** ${privacyTierTextEn}

This Addendum constitutes an integral annex to the Principal Agreement and governs intellectual property ownership, license purity, and professional liability:

#### SECTION 1: TRANSPARENCY & STATUTORY DISCLOSURE (EU AI ACT ART. 50)
1.1. The Contractor has transparently declared the exact degree of generative AI tool deployment as set forth above.  
1.2. The Contractor warrants that no undisclosed autonomous AI generation has been introduced into proprietary deliverables and undertakes full personal liability for omitted AI tools.

#### SECTION 2: HUMAN-IN-THE-LOOP & VALIDITY OF COPYRIGHT ASSIGNMENT
2.1. Even where generative AI tools provided coding assistance, the software architecture, functional specifications, data models, and business logic originate from the **intellectual design and creative direction of the human engineer**.  
2.2. The Contractor certifies that the deliverables do not constitute raw autonomous machine outputs, but represent human-authored works imbued with the developer's creative intellect, satisfying statutory human authorship criteria under FSEK Art. 1/B and international copyright doctrines.  
2.3. The Contractor irrevocably assigns to the Client, exclusively and without temporal or territorial restriction, all economic exploitation rights (reproduction, modification, distribution, public transmission) pursuant to FSEK Art. 52. No proprietary deliverable shall remain in the public domain.

#### SECTION 3: LICENSE HYGIENE & ANTI-COPYLEFT (GPL/AGPL) WARRANTY
3.1. The Contractor **expressly warrants and guarantees** that no code generated or suggested by AI tools introduces viral copyleft open-source licenses (such as GPL v2/v3, AGPL, LGPL, or SSPL) into the Client's proprietary closed-source codebase.  
3.2. Only permissive open-source packages (MIT, Apache 2.0, BSD) may be incorporated, with all statutory copyright notices strictly preserved.

#### SECTION 4: CLIENT DATA CONFIDENTIALITY & ZERO DATA RETENTION
4.1. The Contractor shall not input the Client's trade secrets, database schemas, internal business algorithms, or proprietary source code into public consumer AI models that train on user prompts.  
4.2. All AI tool subscriptions utilized in the project must operate under verified **Enterprise Zero-Data-Retention (ZDR)** agreements or execute within offline air-gapped local environments.

#### SECTION 5: AI HALLUCINATIONS, SECURITY DEFECTS & WARRANTY (TBK ART. 474)
5.1. The Contractor shall not disclaim statutory defect warranties on the grounds that defects or security gaps were suggested by generative AI tools.  
5.2. AI hallucinations, algorithmic errors, memory leaks, OWASP vulnerabilities, and regression defects constitute contractor defects under TBK Art. 474. The Contractor shall rectify any such defects promptly at their sole expense.

#### SECTION 6: RIGOROUS TESTING & CODE AUDIT PROTOCOL
6.1. The Contractor undertakes to subject all AI-assisted code to comprehensive unit testing, automated linting, and static application security testing (SAST).  
6.2. All deliverables must strictly satisfy the agreed Definition of Done (DoD) and BDD acceptance criteria.

#### SECTION 7: INTELLECTUAL PROPERTY INDEMNIFICATION
7.1. In the event third parties assert copyright or patent infringement claims against the Client arising out of AI-generated code incorporated by the Contractor, the Contractor shall fully defend, indemnify, and hold harmless the Client from all resulting liabilities, legal fees, and judgments.

#### SECTION 8: EXCLUSIVE EVIDENCE CONTRACT (HMK ART. 193) & DISPUTE RESOLUTION
8.1. The parties agree that Operis SHA-256 digital seals, Git commit histories, and timestamped declarations constitute conclusive evidence pursuant to HMK Art. 193.  
8.2. Any dispute arising out of this Addendum shall be governed by the courts specified in the Principal Agreement.`;
  }

  /**
   * Generates official print-ready HTML for the AI Governance Addendum (EK-4).
   */
  static generateAiGovernanceAnnexHtml(
    config: AiGovernanceConfig,
    locale: "tr" | "en" = "tr"
  ): string {
    const isTr = locale === "tr";
    const evalResult = this.evaluateAiGovernanceRisk(config);

    let toolsDisplay = "None Declared";
    if (config.declaredTools.length > 0) {
      toolsDisplay = config.declaredTools.join(", ");
    } else if (isTr) {
      toolsDisplay = "Beyan Edilmemiş / Yok";
    }

    const badgeColor = RISK_LEVEL_BADGE_COLORS[evalResult.riskLevel] ?? "#dc2626";
    const badgeText = isTr
      ? (RISK_LEVEL_LABELS_TR[evalResult.riskLevel] ?? "YÜKSEK RİSK BEYANI")
      : evalResult.riskLevel;

    let hitlText = config.humanInTheLoopAffirmed ? "Affirmed (Valid Assignment)" : "Missing";
    if (isTr) {
      hitlText = config.humanInTheLoopAffirmed ? "Onaylandı (Geçerli Devir)" : "Eksik";
    }

    return `
    <div style="page-break-before: always; break-before: page; margin-top: 40px; padding-top: 24px; border-top: 2px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; break-after: avoid-page; page-break-after: avoid;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; break-after: avoid-page; page-break-after: avoid;">
          ${isTr ? "EK-4: YAPAY ZEKA TELİF DEVRİ VE LİSANS TEMİZLİĞİ ŞARTNAMESİ" : "ANNEX-4: AI-ASSISTED CODE IP & WARRANTY PROTOCOL"}
        </h3>
        <span style="background: ${badgeColor}; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; white-space: nowrap;">
          ${badgeText} (${evalResult.riskScore}/100)
        </span>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin-bottom: 20px; font-size: 12px; color: #334155; line-height: 1.6; break-after: avoid-page; page-break-after: avoid; break-inside: avoid; page-break-inside: avoid;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div><strong>${isTr ? "Mevzuat:" : "Statutory Bases:"}</strong> 5846 s. FSEK m. 52, EU AI Act m. 50/53, 6098 s. TBK m. 474</div>
          <div><strong>${isTr ? "Delil Statüsü:" : "Evidence Status:"}</strong> 6100 s. HMK m. 193 Münhasır Delil</div>
          <div><strong>${isTr ? "Beyan Edilen Araçlar:" : "Declared AI Tools:"}</strong> ${toolsDisplay}</div>
          <div><strong>${isTr ? "FSEK İnsani Hususiyet:" : "Human-in-the-Loop:"}</strong> ${hitlText}</div>
        </div>
      </div>

      <div class="ai-governance-clauses" style="font-size: 12px; color: #1e293b; line-height: 1.7;">
        <div class="ai-governance-item" style="break-inside: avoid; page-break-inside: avoid; margin-bottom: 12px;">
          <p style="margin: 0; text-align: justify;"><strong>${isTr ? "1. ŞEFFAFLIK VE YASAL BEYAN:" : "1. TRANSPARENCY & STATUTORY DISCLOSURE:"}</strong> ${
            isTr
              ? "Yüklenici, projede kullanılan yapay zeka araçlarını ve kullanım düzeyini şeffafça beyan etmiş olup EU AI Act m. 50 uyarınca makine tarafından üretilen bileşenlerin insan mimarisiyle denetlendiğini teyit eder."
              : "The Contractor warrants full disclosure of all generative AI tooling deployed in accordance with EU AI Act Art. 50 transparency obligations."
          }</p>
        </div>

        <div class="ai-governance-item" style="break-inside: avoid; page-break-inside: avoid; margin-bottom: 12px;">
          <p style="margin: 0; text-align: justify;"><strong>${isTr ? "2. FSEK m. 52 İNSANİ HUSUSİYET VE TELİF DEVRİ:" : "2. HUMAN-IN-THE-LOOP & VALID IP ASSIGNMENT:"}</strong> ${
            isTr
              ? "Yazılım mimarisi ve iş mantığı insan mühendis aklıyla şekillendirilmiş olup FSEK m. 1/B uyarınca sahibinin hususiyetini taşır. FSEK m. 52 uyarınca tüm mali haklar münhasıran İş Sahibi'ne devredilmiştir; kamu malı kod bırakılamaz."
              : "The architectural design and logic originate from human engineer intellect under FSEK Art. 1/B. All economic rights are irrevocably transferred pursuant to FSEK Art. 52."
          }</p>
        </div>

        <div class="ai-governance-item" style="break-inside: avoid; page-break-inside: avoid; margin-bottom: 12px;">
          <p style="margin: 0; text-align: justify;"><strong>${isTr ? "3. COPYLEFT (GPL/AGPL) LİSANS BULAŞMA YASAĞI:" : "3. ANTI-COPYLEFT LICENSE HYGIENE:"}</strong> ${
            isTr
              ? "Kod tabanına viral açık kaynak lisansları (GPL, AGPL) bulaştırılmadığı kesin olarak garanti edilmiştir."
              : "The Contractor warrants the proprietary codebase free of viral copyleft (GPL/AGPL) contamination."
          }</p>
        </div>

        <div class="ai-governance-item" style="break-inside: avoid; page-break-inside: avoid; margin-bottom: 12px;">
          <p style="margin: 0; text-align: justify;"><strong>${isTr ? "4. SIFIR VERİ SAKLAMA (ZERO-TRAINING):" : "4. ZERO DATA RETENTION (NO TRAINING):"}</strong> ${
            isTr
              ? "Müşteri verileri ve ticari sırları halka açık AI modellerinin genel eğitim havuzuna aktarılmamıştır."
              : "Client trade secrets and schemas are strictly excluded from public AI training corpuses."
          }</p>
        </div>

        <div class="ai-governance-item" style="break-inside: avoid; page-break-inside: avoid; margin-bottom: 6px;">
          <p style="margin: 0; text-align: justify;"><strong>${isTr ? "5. HALÜSİNASYON VE AYIP SORUMLULUĞU (TBK m. 474):" : "5. DEFECT & HALLUCINATION WARRANTY (TBK ART. 474):"}</strong> ${
            isTr
              ? "AI halüsinasyonları ve güvenlik açıkları doğrudan Yüklenici ayıbı sayılır; Yüklenici bila-ücret gidermekle mükelleftir."
              : "AI hallucinations and defects constitute contractor defects under statutory law, remediable at contractor cost."
          }</p>
        </div>
      </div>
    </div>
    `;
  }
}
