import type {
  ContractCatalogItem,
  ContractRecommendationInput,
  ContractRecommendationItem,
  ContractRecommendationResult,
} from "./recommendation-types";

export class ContractRecommendationEngine {
  /**
   * Master Catalog of All Legal Agreements & Addendums in Operis
   */
  static readonly MASTER_CATALOG: ContractCatalogItem[] = [
    {
      id: "CORE_SERVICE",
      titleTr: "Ana Yazılım & Teknoloji Hizmet Sözleşmesi",
      titleEn: "Core Software & Technology Service Agreement",
      categoryTr: "Temel Sözleşme",
      categoryEn: "Primary Agreement",
      descriptionTr: "İşin teknik kapsamını, bütçesini, teslimat kilometre taşlarını ve kabul şartlarını belirleyen iki taraflı temel eser sözleşmesi.",
      descriptionEn: "Primary bilateral contract for work defining scope, milestones, fees, inspection, and default remedies.",
      statutoryBasisTr: "6098 Sayılı TBK m. 470 vd. (Eser Sözleşmesi)",
      statutoryBasisEn: "Turkish Code of Obligations Art. 470 (Contract for Work)",
      isBaseAgreement: true,
      estimatedPages: 4,
    },
    {
      id: "FSEK_IP_TRANSFER",
      titleTr: "FSEK m. 52 Fikri Mülkiyet ve Telif Devir Protokolü",
      titleEn: "Statutory Intellectual Property & Copyright Assignment",
      categoryTr: "Fikri Mülkiyet",
      categoryEn: "Intellectual Property",
      descriptionTr: "Üretilen kaynak kod, tasarım, algoritma ve dijital varlıkların tüm mali haklarının işverene eksiksiz ve geri dönülemez devri.",
      descriptionEn: "Full irrevocable assignment of all statutory copyright and economic exploitation rights upon full payment.",
      statutoryBasisTr: "5846 Sayılı FSEK m. 52 (Mali Hak Devri Şartları)",
      statutoryBasisEn: "Law on Intellectual and Artistic Works No. 5846 Art. 52",
      isBaseAgreement: false,
      estimatedPages: 2,
    },
    {
      id: "BILATERAL_NDA",
      titleTr: "Karşılıklı Gizlilik ve Ticari Sır Koruma Protokolü (NDA)",
      titleEn: "Bilateral Non-Disclosure Agreement (NDA)",
      categoryTr: "Gizlilik & Güvenlik",
      categoryEn: "Confidentiality",
      descriptionTr: "Proje süresince paylaşılan kaynak kodları, API anahtarları, müşteri portföyü ve şirket içi sırların korunması taahhüdü.",
      descriptionEn: "Protects proprietary source code, secrets, API keys, and internal documents from third-party leakage.",
      statutoryBasisTr: "6102 Sayılı TTK m. 54-55 (Haksız Rekabet) & TBK m. 396",
      statutoryBasisEn: "Turkish Commercial Code Art. 54-55 & TBK Art. 396",
      isBaseAgreement: false,
      estimatedPages: 2,
    },
    {
      id: "KVKK_DPA",
      titleTr: "KVKK / GDPR Veri İşleme ve Bilgi Güvenliği Protokolü (DPA)",
      titleEn: "Data Processing Addendum (KVKK & GDPR Compliance)",
      categoryTr: "Veri Koruma",
      categoryEn: "Data Privacy",
      descriptionTr: "Projede gerçek kişilere ait verilerin (üye, müşteri, personel) işlenmesi durumunda veri işleyen ve veri sorumlusu yükümlülükleri.",
      descriptionEn: "Defines controller-processor privacy roles, technical security measures, and breach notification SLAs.",
      statutoryBasisTr: "6698 Sayılı KVKK m. 12 & AB GDPR Madde 28",
      statutoryBasisEn: "KVKK Art. 12 & EU GDPR Art. 28",
      isBaseAgreement: false,
      estimatedPages: 3,
    },
    {
      id: "SAFE_HARBOR",
      titleTr: "Bağımsız Yüklenici Güvenli Liman Sözleşmesi (İş Kanunu Muafiyeti)",
      titleEn: "Independent Contractor Safe Harbor Protocol",
      categoryTr: "İş Hukuku Koruması",
      categoryEn: "Labor Shield",
      descriptionTr: "Serbest çalışan ile işveren arasında bordrolu işçi-işveren ilişkisi doğmadığını; tam zaman, mekan ve araç özerkliğini tevsik eder.",
      descriptionEn: "Preempts labor reclassification risk by codifying scheduling autonomy, tool ownership, and independent status.",
      statutoryBasisTr: "4857 Sayılı İş Kanunu m. 8 & TBK m. 470",
      statutoryBasisEn: "Labor Law No. 4857 Art. 8 & TBK Art. 470",
      isBaseAgreement: false,
      estimatedPages: 2,
    },
    {
      id: "AI_GOVERNANCE",
      titleTr: "Yapay Zeka Yönetişimi, Lisans Saflığı ve Halüsinasyon Sorumluluğu",
      titleEn: "AI Governance, Code Purity & Hallucination Liability",
      categoryTr: "Yapay Zeka & Lisans",
      categoryEn: "AI Governance",
      descriptionTr: "Üretken yapay zeka kullanımı, zero-data-retention gizliliği, copyleft lisans bulaşması koruması ve kod doğrulama taahhüdü.",
      descriptionEn: "Regulates generative AI tooling, model hallucination review, zero-retention privacy, and license contamination.",
      statutoryBasisTr: "AB Yapay Zeka Yasası (EU AI Act) & TBK m. 474",
      statutoryBasisEn: "EU AI Act Transparency & Code Integrity Principles",
      isBaseAgreement: false,
      estimatedPages: 2,
    },
    {
      id: "SOFTWARE_EXPORT",
      titleTr: "Yazılım İhracatı ve Vergi İstisnası Şartnamesi (%0 KDV / GVK 89/13)",
      titleEn: "Cross-Border Software Export & Tax Exemption Addendum",
      categoryTr: "Vergi & İhracat",
      categoryEn: "Tax & Export",
      descriptionTr: "Yurt dışındaki müşteriler için üretilen yazılımlarda %0 KDV (GİB Kod 302) ve %80 Gelir Vergisi istisnası şartlarını belgeler.",
      descriptionEn: "Documents foreign client status, repatriation channels, 0% VAT export, and statutory tax exemption compliance.",
      statutoryBasisTr: "193 Sayılı GVK m. 89/13 & 3065 Sayılı KDVK m. 11/1-a",
      statutoryBasisEn: "Income Tax Law Art. 89/13 & VAT Law Art. 11/1-a (Code 302)",
      isBaseAgreement: false,
      estimatedPages: 2,
    },
    {
      id: "INFLATION_SHIELD",
      titleTr: "Enflasyon ve Kur Riskine Karşı Sözleşme Uyarlama Klozu",
      titleEn: "Inflation & Currency Hedging Adaptation Clause",
      categoryTr: "Finansal Koruma",
      categoryEn: "Finance Shield",
      descriptionTr: "Uzun vadeli projelerde öngörülemeyen enflasyon artışlarına karşı TÜİK TÜFE bazlı otomatik hakkaniyetli fiyat uyarlaması.",
      descriptionEn: "Automatic statutory adjustment formula guarding against unexpected macro inflation on multi-month milestones.",
      statutoryBasisTr: "6098 Sayılı TBK m. 138 (Aşırı İfa Güçlüğü ve Uyarlama)",
      statutoryBasisEn: "Turkish Code of Obligations Art. 138 (Hardship & Adaptation)",
      isBaseAgreement: false,
      estimatedPages: 1,
    },
    {
      id: "SMART_RETAINER_SLA",
      titleTr: "Akıllı Bakım, SLA & Sürekli Destek Protokolü",
      titleEn: "Smart Retainer, SLA & Ongoing Support Addendum",
      categoryTr: "Bakım & SLA",
      categoryEn: "Maintenance & SLA",
      descriptionTr: "Teslimat sonrası periyodik bakım saat havuzunu, yanıt sürelerini (SLA) ve fazla mesai ücret tarifesini güvenceye alır.",
      descriptionEn: "Defines ongoing monthly support pool, maximum incident response times (SLA), and rollover policies.",
      statutoryBasisTr: "6098 Sayılı TBK m. 502 (Vekalet) & m. 470",
      statutoryBasisEn: "TBK Art. 502 (Agency) & Art. 470 (Service)",
      isBaseAgreement: false,
      estimatedPages: 2,
    },
    {
      id: "SQUAD_CONSORTIUM",
      titleTr: "Squad & Konsorsiyum Adi Ortaklık Şartnamesi",
      titleEn: "Squad Consortium & Joint Venture Terms",
      categoryTr: "Kolektif Ekipler",
      categoryEn: "Squads & Teams",
      descriptionTr: "Birden fazla uzmandan oluşan Squad ekiplerinin işverene karşı müşterek taahhüdü ve iç işleyiş prensipleri.",
      descriptionEn: "Governs joint multi-contractor delivery squads under Turkish Code of Obligations Art. 620.",
      statutoryBasisTr: "6098 Sayılı TBK m. 620 (Adi Ortaklık)",
      statutoryBasisEn: "TBK Art. 620 (Ordinary Partnership)",
      isBaseAgreement: false,
      estimatedPages: 2,
    },
    {
      id: "CYBER_SECURITY_CLEAN_CODE",
      titleTr: "Temiz Kod, Arka Kapı İçermeme & Siber Güvenlik Taahhütnamesi",
      titleEn: "Clean Code, No-Backdoor & Supply Chain Security Warranty",
      categoryTr: "Siber Güvenlik",
      categoryEn: "Cyber Security",
      descriptionTr: "Kaynak kodda kasten arka kapı, casus yazılım, zararlı telemetri veya OWASP Top 10 zafiyetleri bulunmadığını taahhüt eder.",
      descriptionEn: "Warrants no covert backdoors, malicious logic, or OWASP Top 10 vulnerabilities under personal penal liability.",
      statutoryBasisTr: "5237 Sayılı TCK m. 243-245 & TBK m. 474-477",
      statutoryBasisEn: "Turkish Penal Code Arts. 243-245 & TBK Arts. 474-477",
      isBaseAgreement: false,
      estimatedPages: 2,
    },
    {
      id: "FOSS_LICENSE_COMPLIANCE",
      titleTr: "Açık Kaynak Lisans Saflığı ve Copyleft Bulaşmama Şartnamesi",
      titleEn: "FOSS & Open Source License Contamination Shield",
      categoryTr: "Lisans & Uyumluluk",
      categoryEn: "License Compliance",
      descriptionTr: "Projeye ticari kodu açık kaynak yapmaya zorlayacak viral copyleft (GPL/AGPL) lisansı bulaşmasını engeller; 14 günlük düzeltme güvencesi verir.",
      descriptionEn: "Guarantees permissible FOSS licenses and bars viral copyleft (GPL/AGPL) contamination with 14-day cure indemnity.",
      statutoryBasisTr: "5846 Sayılı FSEK m. 52 & TBK m. 475",
      statutoryBasisEn: "Copyright Law FSEK Art. 52 & TBK Art. 475",
      isBaseAgreement: false,
      estimatedPages: 2,
    },
    {
      id: "NON_SOLICITATION",
      titleTr: "Müşteri ve Personel Ayartmama & Platform Sadakat Protokolü",
      titleEn: "Non-Solicitation & Platform Integrity Protocol",
      categoryTr: "Ticari Rekabet",
      categoryEn: "Fair Competition",
      descriptionTr: "Tarafların 12 ay boyunca birbirlerinin müşterilerini veya kilit geliştirici ekibini doğrudan ayartmasını engeller (TTK m. 55).",
      descriptionEn: "Bars direct circumvention of client's customers or contractor squad members for 12 months under Commercial Code Art. 55.",
      statutoryBasisTr: "6102 Sayılı TTK m. 54-55 & TBK m. 444",
      statutoryBasisEn: "Turkish Commercial Code Arts. 54-55 & TBK Art. 444",
      isBaseAgreement: false,
      estimatedPages: 2,
    },
    {
      id: "MUTUAL_RELEASE_DISCHARGE",
      titleTr: "Sözleşme Sonu Karşılıklı İbraname ve Sulh Protokolü",
      titleEn: "Mutual Release, Settlement & Final Discharge Deed",
      categoryTr: "Kapanış & İbra",
      categoryEn: "Discharge & Settlement",
      descriptionTr: "Proje bittiğinde tüm hakedişlerin ödendiğini teyit eder; geleceğe dönük gecikme cezası, mesai veya tazminat davalarını kesin olarak sonlandırır.",
      descriptionEn: "Statutory release under TBK Art. 132 discharging all claims regarding fees, overtime, delay penalties, and litigation.",
      statutoryBasisTr: "6098 Sayılı TBK m. 132 & 6100 Sayılı HMK m. 313",
      statutoryBasisEn: "Turkish Code of Obligations Art. 132 & HMK Art. 313",
      isBaseAgreement: false,
      estimatedPages: 2,
    },
    {
      id: "TERMINATION_LIQUIDATION",
      titleTr: "Sözleşmenin Erken Feshi, İkâle ve Tasfiye Protokolü",
      titleEn: "Early Termination, Offboarding & Liquidation Deed",
      categoryTr: "Fesih & Tasfiye",
      categoryEn: "Termination & Liquidation",
      descriptionTr: "Projenin erken sonlandırılması durumunda ödenen hakedişlerin IP'sini korur, yarım kalan işleri tasfiye eder ve karşılıklı borçları sıfırlar.",
      descriptionEn: "Governs early contract termination (TBK Art. 484-486), settles completed work IP, returns assets, and liquidates claims.",
      statutoryBasisTr: "6098 Sayılı TBK m. 484-486 & TBK m. 132",
      statutoryBasisEn: "Turkish Code of Obligations Arts. 484-486 & Art. 132",
      isBaseAgreement: false,
      estimatedPages: 2,
    },
  ];

  /**
   * Deterministically evaluates listing metadata and recommends ONLY essential contracts.
   */
  static evaluateRecommendations(input: ContractRecommendationInput): ContractRecommendationResult {
    const textCorpus = [
      input.listingTitle || "",
      input.categorySlug || "",
      input.categoryName || "",
      input.scopeSummary || "",
      ...(input.tags || []),
    ]
      .join(" ")
      .toLowerCase();

    const currency = (input.budgetCurrency || "").toUpperCase();
    const isForeignCurrency = /[$€£]|USD|EUR|GBP/i.test(currency) || Boolean(input.hasForeignClient);
    const numBudget =
      typeof input.budgetMax === "number"
        ? input.budgetMax
        : parseFloat(String(input.budgetMax || input.budgetMin || 0)) || 0;
    const isCorporate = Boolean(input.isCorporateClient);
    const durationDays = input.timelineDays || (input.timelineMode === "DURATION_ESTIMATE" ? 30 : 14);

    const evaluatedContracts: ContractRecommendationItem[] = this.MASTER_CATALOG.map((item) => {
      let status: "RECOMMENDED" | "OPTIONAL" | "NOT_APPLICABLE" = "OPTIONAL";
      let reasonTr = "Bu sözleşme tarafların talebine bağlı olarak opsiyonel eklenebilir.";
      let reasonEn = "This agreement is optional and can be attached at either party's discretion.";
      let relevanceScore = 40;
      const tags: string[] = [];

      switch (item.id) {
        case "CORE_SERVICE": {
          status = "RECOMMENDED";
          relevanceScore = 100;
          reasonTr = "Temel Eser Sözleşmesi; projenin kapsamını, teslimat takvimini ve ödeme şartlarını belirleyen zorunlu omurgadır.";
          reasonEn = "Primary Contract for Work; sets deliverables, milestones, fee schedule, and inspection rules.";
          tags.push("Temel", "Zorunlu Omurga");
          break;
        }

        case "FSEK_IP_TRANSFER": {
          const isCreativeOrTech =
            /yazılım|kod|web|mobil|frontend|backend|tasarım|figma|logo|grafik|ui|ux|ui\/ux|api|react|next|app|mobile|design|software|developer|creative/i.test(
              textCorpus
            );
          if (isCreativeOrTech) {
            status = "RECOMMENDED";
            relevanceScore = 95;
            reasonTr = "Yazılım, tasarım ve teknik çıktılar içerdiği için telif ve fikri hakların işverene devri kanunen gereklidir.";
            reasonEn = "Intellectual creation involved; statutory copyright transfer is required under Art. 52.";
            tags.push("Fikri Haklar", "Telif Devri");
          } else {
            status = "OPTIONAL";
            relevanceScore = 45;
            reasonTr = "Danışmanlık ve operasyonel işlerde telif devri opsiyoneldir.";
            reasonEn = "Copyright assignment is optional for non-creative operational consulting.";
          }
          break;
        }

        case "BILATERAL_NDA": {
          const hasSecretKeywords =
            /gizli|nda|secret|confidential|api|token|database|veritabanı|backend|şifre|fintech|patent|özel|banka|ödeme/i.test(
              textCorpus
            );
          if (isCorporate || hasSecretKeywords || numBudget >= 30000) {
            status = "RECOMMENDED";
            relevanceScore = 88;
            reasonTr = isCorporate
              ? "Kurumsal işveren ve ticari varlıklar söz konusu olduğu için karşılıklı gizlilik önerilir."
              : "Hassas sistem erişimleri veya önemli bütçe içerdiği için ticari sır protokolü önerilir.";
            reasonEn = "Corporate client or confidential systems detected; bilateral NDA is strongly advised.";
            tags.push("Ticari Sır", "Gizlilik");
          } else {
            status = "OPTIONAL";
            relevanceScore = 35;
            reasonTr = "Açık ve kamuya açık arayüz işlerinde gizlilik sözleşmesi tarafların tercihine bırakılmıştır.";
            reasonEn = "NDA is optional for standard public-facing tasks.";
          }
          break;
        }

        case "KVKK_DPA": {
          const hasDataKeywords =
            /kvkk|gdpr|kişisel veri|kullanıcı|üye|personel|müşteri|auth|kimlik|tckn|crm|database|veritabanı|sql|mongo|postgresql/i.test(
              textCorpus
            );
          if (hasDataKeywords) {
            status = "RECOMMENDED";
            relevanceScore = 90;
            reasonTr = "İlanda kullanıcı, müşteri veya veritabanı işleme unsurları tespit edildiğinden KVKK m. 12 DPA şartnamesi gereklidir.";
            reasonEn = "Personal data or database access detected; statutory DPA protocol is required under KVKK Art. 12.";
            tags.push("KVKK", "Kişisel Veri");
          } else {
            const isDesignOnly = /logo|ikon|vektör|çizim|afiş|kartvizit|banner/i.test(textCorpus);
            status = isDesignOnly ? "NOT_APPLICABLE" : "OPTIONAL";
            relevanceScore = isDesignOnly ? 10 : 30;
            reasonTr = isDesignOnly
              ? "Kişisel veri işleme içermeyen grafik/tasarım işlerinde DPA sözleşmesi gerekmez."
              : "Kişisel veri erişimi olmayacaksa DPA eklenmesi gerekli değildir.";
            reasonEn = "DPA is not applicable when no personal user data or databases are handled.";
          }
          break;
        }

        case "SAFE_HARBOR": {
          if (isCorporate && (durationDays >= 30 || numBudget >= 50000)) {
            status = "RECOMMENDED";
            relevanceScore = 85;
            reasonTr = "Kurumsal işveren ve uzun vadeli proje sebebiyle işçi-işveren statüsü yanılsamasını önleyen bağımsızlık klozu önerilir.";
            reasonEn = "Long-term corporate engagement; independent contractor safe harbor is recommended against misclassification.";
            tags.push("İş Kanunu", "Güvenli Liman");
          } else {
            status = "OPTIONAL";
            relevanceScore = 35;
            reasonTr = "Kısa süreli serbest işlerde temel sözleşmedeki bağımsızlık maddesi genellikle yeterlidir.";
            reasonEn = "Base contract independent clause is typically sufficient for short tasks.";
          }
          break;
        }

        case "AI_GOVERNANCE": {
          const hasAiKeywords =
            /ai|yapay zeka|llm|chatgpt|openai|claude|gemini|makine öğrenimi|prompt|deep learning|nlp|model/i.test(
              textCorpus
            );
          if (hasAiKeywords) {
            status = "RECOMMENDED";
            relevanceScore = 92;
            reasonTr = "Projeyle ilgili yapay zeka araçları tespit edildiğinden telif saflığı ve lisans şartnamesi önerilir.";
            reasonEn = "AI / LLM tooling detected; code purity, human-in-the-loop review, and license terms recommended.";
            tags.push("Yapay Zeka", "Lisans Saflığı");
          } else {
            status = "OPTIONAL";
            relevanceScore = 25;
            reasonTr = "Geleneksel geliştirme işlerinde isteğe bağlı olarak eklenebilir.";
            reasonEn = "Optional add-on for standard conventional coding.";
          }
          break;
        }

        case "SOFTWARE_EXPORT": {
          if (isForeignCurrency) {
            status = "RECOMMENDED";
            relevanceScore = 98;
            reasonTr = "Dövizli veya yurt dışı müşteri eşleşmesi tespit edildi; %0 KDV ve vergi muafiyeti şartnamesi gereklidir.";
            reasonEn = "Foreign currency or international client; 0% VAT export addendum (GVK 89/13) is applicable.";
            tags.push("Vergi İstisnası", "İhracat");
          } else {
            status = "NOT_APPLICABLE";
            relevanceScore = 5;
            reasonTr = "Yurt içi Türk Lirası projelerde yazılım ihracatı istisnası uygulanamaz.";
            reasonEn = "Software export tax exemption is not applicable for domestic TRY projects.";
          }
          break;
        }

        case "INFLATION_SHIELD": {
          if (!isForeignCurrency && (durationDays >= 60 || numBudget >= 50000)) {
            status = "RECOMMENDED";
            relevanceScore = 80;
            reasonTr = "60 günden uzun vadeli veya 50.000 TL üzeri projelerde beklenmedik enflasyon dalgalanmalarına karşı uyarlama klozu önerilir.";
            reasonEn = "Projects over 60 days or >50,000 TRY benefit from inflation hedging adaptation under TBK Art. 138.";
            tags.push("Enflasyon", "Kur Riski");
          } else {
            status = "OPTIONAL";
            relevanceScore = isForeignCurrency ? 15 : 40;
            reasonTr = isForeignCurrency
              ? "Döviz bazlı projeler kur riskini doğal olarak telafi ettiğinden enflasyon klozu opsiyoneldir."
              : "Kısa vadeli projelerde enflasyon klozu isteğe bağlıdır.";
            reasonEn = isForeignCurrency
              ? "Foreign currency payments naturally hedge inflation."
              : "Inflation shield is optional for short duration milestones.";
          }
          break;
        }

        case "SMART_RETAINER_SLA": {
          const hasRetainerKeywords =
            /bakım|destek|aylık|sla|retainer|monitoring|uptime|süreklilik|periyodik/i.test(
              textCorpus
            );
          if (hasRetainerKeywords) {
            status = "RECOMMENDED";
            relevanceScore = 88;
            reasonTr = "Aylık bakım, SLA veya sürekli destek ifadeleri tespit edildiğinden Akıllı Retainer sözleşmesi önerilir.";
            reasonEn = "Maintenance, recurring support, or SLA detected; Retainer Addendum is recommended.";
            tags.push("SLA", "Aylık Destek");
          } else {
            status = "OPTIONAL";
            relevanceScore = 20;
            reasonTr = "Tek seferlik teslimatlı işlerde bakım protokolü opsiyoneldir.";
            reasonEn = "Optional for one-off delivery projects.";
          }
          break;
        }

        case "SQUAD_CONSORTIUM": {
          if (input.isSquadEngagement) {
            status = "RECOMMENDED";
            relevanceScore = 95;
            reasonTr = "Kolektif ekip veya Squad eşleşmesi olduğundan TBK m. 620 Adi Ortaklık / Konsorsiyum şartnamesi önerilir.";
            reasonEn = "Collective squad delivery detected; Joint Consortium / Ordinary Partnership terms recommended under TBK Art. 620.";
            tags.push("Squad", "Konsorsiyum");
          } else {
            status = "NOT_APPLICABLE";
            relevanceScore = 0;
            reasonTr = "Tekil serbest çalışan işlerinde Squad konsorsiyum sözleşmesi uygulanmaz.";
            reasonEn = "Squad consortium agreement is not applicable for individual engagements.";
          }
          break;
        }

        case "CYBER_SECURITY_CLEAN_CODE": {
          const isTech =
            /yazılım|kod|web|mobil|frontend|backend|api|react|next|app|software|developer|fullstack|node|python/i.test(
              textCorpus
            );
          if (isTech || isCorporate || numBudget >= 30000) {
            status = "RECOMMENDED";
            relevanceScore = 94;
            reasonTr = "Kaynak kod geliştirmesi ve kurumsal bilgi güvenliği standartları (TCK m. 243-245) gereği Temiz Kod & Arka Kapı içermeme taahhütnamesi önerilir.";
            reasonEn = "Code deliverables detected; Clean Code and No-Backdoor warranty is recommended under Penal Code Arts. 243-245.";
            tags.push("Siber Güvenlik", "TCK 243", "Temiz Kod");
          } else {
            status = "OPTIONAL";
            relevanceScore = 40;
            reasonTr = "Tasarım ve operasyonel işlerde siber güvenlik taahhütnamesi isteğe bağlıdır.";
            reasonEn = "Optional for non-code operational tasks.";
          }
          break;
        }

        case "FOSS_LICENSE_COMPLIANCE": {
          const isTech =
            /yazılım|kod|web|mobil|frontend|backend|api|react|next|app|software|developer|fullstack|node|python/i.test(
              textCorpus
            );
          if (isTech || isCorporate) {
            status = "RECOMMENDED";
            relevanceScore = 91;
            reasonTr = "Geliştirilen yazılımın ticari kod saflığını korumak ve viral copyleft (GPL/AGPL) kirlenmesini engellemek için lisans şartnamesi önerilir.";
            reasonEn = "Software development detected; FOSS license purity and copyleft protection recommended.";
            tags.push("Lisans Saflığı", "Copyleft Kalkanı");
          } else {
            status = "OPTIONAL";
            relevanceScore = 30;
            reasonTr = "Açık kaynak kütüphane kullanılmayan işlerde lisans saflığı şartnamesi opsiyoneldir.";
            reasonEn = "Optional for non-software projects.";
          }
          break;
        }

        case "NON_SOLICITATION": {
          if (isCorporate || input.isSquadEngagement || numBudget >= 50000) {
            status = "RECOMMENDED";
            relevanceScore = 87;
            reasonTr = "Yüksek bütçe veya kurumsal işveren sebebiyle müşteri çevresini ve geliştirici ekibini haksız ayartmaya karşı koruyan protokol önerilir (TTK m. 55).";
            reasonEn = "Corporate or high-value engagement; 12-month non-solicitation protocol recommended under Commercial Code Art. 55.";
            tags.push("Müşteri Koruma", "TTK 55", "Ayartmama");
          } else {
            status = "OPTIONAL";
            relevanceScore = 35;
            reasonTr = "Kısa süreli standart işlerde ayartmama protokolü tarafların tercihine bağlıdır.";
            reasonEn = "Optional for smaller individual tasks.";
          }
          break;
        }

        case "MUTUAL_RELEASE_DISCHARGE": {
          if (durationDays >= 30 || numBudget >= 30000 || isCorporate) {
            status = "RECOMMENDED";
            relevanceScore = 90;
            reasonTr = "Proje tamamlandığında tarafların birbirlerini gecikme tazminatı ve ek alacak iddialarından kayıtsız şartsız ibra etmesi (TBK m. 132) önerilir.";
            reasonEn = "Statutory discharge recommended upon completion to bar future claims under TBK Art. 132.";
            tags.push("İbraname", "TBK 132", "Sulh");
          } else {
            status = "OPTIONAL";
            relevanceScore = 40;
            reasonTr = "Sözleşme sonu karşılıklı ibra protokolü isteğe bağlı olarak aktifleştirilebilir.";
            reasonEn = "Optional discharge protocol.";
          }
          break;
        }

        case "TERMINATION_LIQUIDATION": {
          status = "OPTIONAL";
          relevanceScore = 20;
          reasonTr = "Sözleşmenin erken feshi ve tasfiyesi ihtiyacı durumunda (TBK m. 484-486) devreye alınan standby protokolüdür.";
          reasonEn = "Standby deed activated in case of early termination, ikale, or dispute settlement under TBK Art. 484.";
          tags.push("Fesih", "Tasfiye", "TBK 484");
          break;
        }
      }

      return {
        ...item,
        status,
        isSelectedByDefault: status === "RECOMMENDED",
        recommendationReasonTr: reasonTr,
        recommendationReasonEn: reasonEn,
        relevanceScore,
        tags,
      };
    });

    const recommendedContracts = evaluatedContracts.filter((c) => c.status === "RECOMMENDED");

    return {
      recommendedContracts,
      allContracts: evaluatedContracts,
      selectedCount: recommendedContracts.length,
      totalAvailableCount: evaluatedContracts.length,
      platformSafeHarborNoticeTr:
        "Operis Platformu işbu sözleşmelerin tarafı veya garantörü değildir; yalnızca bağımsız eşleştirme ortamı sağlar (5651 sayılı Kanun). Tüm sözleşmeler %100 opsiyoneldir (TBK m. 26). Taraflar arasındaki her türlü uyuşmazlık münhasıran İşveren ile Serbest Çalışan arasında görülür.",
      platformSafeHarborNoticeEn:
        "Operis Platform is solely an independent venue provider and is not a party, employer, or guarantor to these agreements. Contracts are 100% voluntary (TBK Art. 26). All claims and disputes remain strictly between Client and Freelancer.",
      isOptionalBilateralNoticeTr:
        "Sözleşme paketi zorunlu değildir. Sistem yalnızca projenize en uygun sözleşmeleri seçili getirmiştir; dilerseniz ek sözleşmeleri açıp kapatabilirsiniz.",
      isOptionalBilateralNoticeEn:
        "This contract package is optional. The engine selected only necessary agreements for your scope; you may freely toggle additional agreements.",
    };
  }
}
