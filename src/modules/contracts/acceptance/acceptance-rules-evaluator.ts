import type {
  ScopeArchetype,
  ArchetypeProfile,
  ScopeInterviewAnswers,
  ContractAcceptanceCriterion,
  SynthesizedScopePackage,
  EvaluateRevisionCriteriaInput,
  EvaluateRevisionCriteriaResult,
} from "../acceptance-types";
import { ARCHETYPE_PROFILES, getInterviewQuestions } from "./archetype-templates";

export class AcceptanceRulesEvaluator {
  /**
   * Normalizes Turkish text to lowercase ASCII-compatible tokens for robust keyword matching.
   */
  static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Detects the project archetype from title, summary, category, and tags using token-weighted scoring.
   */
  static detectArchetype(
    title: string,
    summary: string = "",
    categorySlug: string = "",
    tags: string[] = []
  ): { archetype: ScopeArchetype; confidence: number; profile: ArchetypeProfile } {
    const rawTokens = `${title} ${summary} ${categorySlug} ${tags.join(" ")}`;
    const normalized = this.normalizeText(rawTokens);

    let bestArchetype: ScopeArchetype = "CUSTOM_GENERAL";
    let highestScore = 0;

    const archetypes = Object.keys(ARCHETYPE_PROFILES) as ScopeArchetype[];

    for (const arch of archetypes) {
      if (arch === "CUSTOM_GENERAL") continue;

      const profile = ARCHETYPE_PROFILES[arch];
      let score = 0;

      for (const kw of profile.keywords) {
        const normKw = this.normalizeText(kw);
        // Direct exact token match has high weight
        const regex = new RegExp(`\\b${normKw}\\b`, "i");
        if (regex.test(normalized)) {
          score += 20;
        } else if (normKw.length >= 5 && normalized.includes(normKw)) {
          score += 10;
        }
      }

      if (score > highestScore && score >= 15) {
        highestScore = score;
        bestArchetype = arch;
      }
    }

    // Calculate confidence percentage
    const confidence =
      highestScore === 0
        ? 40
        : Math.min(100, Math.max(65, highestScore * 2));

    return {
      archetype: bestArchetype,
      confidence,
      profile: ARCHETYPE_PROFILES[bestArchetype],
    };
  }

  /**
   * Synthesizes a comprehensive, dual-layer scope package based on the user's answers.
   */
  static synthesizeScopePackage(input: {
    archetype?: ScopeArchetype;
    title: string;
    summary?: string;
    answers?: ScopeInterviewAnswers;
    categorySlug?: string;
    tags?: string[];
  }): SynthesizedScopePackage {
    const detection = input.archetype
      ? { archetype: input.archetype, confidence: 95, profile: ARCHETYPE_PROFILES[input.archetype] }
      : this.detectArchetype(input.title, input.summary, input.categorySlug, input.tags);

    const archetype = detection.archetype;
    const questions = getInterviewQuestions(archetype);

    // Merge answers with defaults
    const answers: ScopeInterviewAnswers = {};
    for (const q of questions) {
      answers[q.slotKey] = input.answers?.[q.slotKey] || q.defaultOptionValue;
    }

    // Build dual-layer criteria tailored to selected slots
    const criteria: ContractAcceptanceCriterion[] = [];
    let criterionIndex = 1;

    // 1. Mandatory Baseline Criteria (Universal Quality & Delivery Assurance)
    criteria.push({
      id: `crit-${criterionIndex++}`,
      phaseNumber: 1,
      category: "DELIVERY_QUALITY",
      humanCriterionTr: "Kod tabanı temiz bir Git reposunda düzenli commit geçmişi ve kurulum kılavuzu (README) ile teslim edilmelidir.",
      humanCriterionEn: "Codebase must be delivered in a clean Git repository with meaningful commit history and a setup guide (README).",
      gherkinGivenTr: "Geliştirici projeyi tamamladığında",
      gherkinWhenTr: "Kaynak kod deposu klonlanıp 'README' adımları uygulandığında",
      gherkinThenTr: "Proje sıfır derleme/build hatası ile yerel ortamda başarıyla çalışmalıdır",
      gherkinGivenEn: "Given the developer finishes implementation",
      gherkinWhenEn: "When the repository is cloned and README setup instructions are run",
      gherkinThenEn: "Then the application builds and boots locally with zero compile or dependency errors",
      isMandatory: true,
    });

    // 2. Archetype & Slot-Specific Synthesized Criteria
    switch (archetype) {
      case "SAAS_B2B_DASHBOARD":
        if (answers.auth_roles === "multi_roles" || answers.auth_roles === "client_multitenant") {
          criteria.push({
            id: `crit-${criterionIndex++}`,
            slotKey: "auth_roles",
            phaseNumber: 1,
            category: "AUTH_SECURITY",
            humanCriterionTr: "Yönetici (Admin) yeni kullanıcı oluşturabilmeli ve kullanıcının rolüne göre (Editör, Muhasebe vb.) yetkisiz menüler gizlenmelidir.",
            humanCriterionEn: "Admin must be able to invite users and assign roles; restricted menu items must be hidden and inaccessible for unauthorized roles.",
            gherkinGivenTr: "Sistemde kısıtlı yetkili bir kullanıcı oturum açtığında",
            gherkinWhenTr: "Yalnızca adminlerin görebileceği bir URL'e doğrudan erişmeye çalıştığında",
            gherkinThenTr: "Sistem 403 Yetkisiz Erişim uyarısı vermeli veya kullanıcıyı ana sayfaya yönlendirmelidir",
            gherkinGivenEn: "Given a non-admin authenticated user",
            gherkinWhenEn: "When attempting direct navigation to restricted administrative routes",
            gherkinThenEn: "Then the application rejects access with 403 Forbidden or safe redirects",
            isMandatory: true,
          });
        }

        if (answers.data_source === "existing_api") {
          criteria.push({
            id: `crit-${criterionIndex++}`,
            slotKey: "data_source",
            phaseNumber: 2,
            category: "DATA_INTEGRATION",
            humanCriterionTr: "Panel, mevcut REST/GraphQL API'den verileri 2 saniye altında çekmeli ve bağlantı koptuğunda kullanıcıya anlaşılır hata mesajı göstermelidir.",
            humanCriterionEn: "Dashboard must fetch records from the external API within 2s and display user-friendly error banners upon network failure.",
            gherkinGivenTr: "Harici API uç noktası aktif durumdayken",
            gherkinWhenTr: "Kullanıcı veri listeleme sayfasını açtığında",
            gherkinThenTr: "Kayıtlar sayfalanmış (pagination) biçimde yüklenmeli ve sayfa donmamalıdır",
            gherkinGivenEn: "Given external API service is reachable",
            gherkinWhenEn: "When opening the data management view",
            gherkinThenEn: "Then records render with responsive pagination without thread blocking",
            isMandatory: true,
          });
        } else if (answers.data_source === "excel_csv_import") {
          criteria.push({
            id: `crit-${criterionIndex++}`,
            slotKey: "data_source",
            phaseNumber: 2,
            category: "DATA_INTEGRATION",
            humanCriterionTr: "Kullanıcı geçerli bir .xlsx veya .csv dosyası yüklediğinde, tüm satırlar veritabanına aktarılmalı ve hatalı satırlar raporlanmalıdır.",
            humanCriterionEn: "When uploading valid .xlsx or .csv files, rows must be parsed into the database with invalid lines clearly flagged.",
            gherkinGivenTr: "Kullanıcı dosya yükleme ekranındayken",
            gherkinWhenTr: "Örnek şablona uygun bir Excel dosyası seçip 'Yükle' butonuna bastığında",
            gherkinThenTr: "Sistem toplam aktarılan satır sayısını ve başarı bildirimini ekranda göstermelidir",
            gherkinGivenEn: "Given user is on the bulk import screen",
            gherkinWhenEn: "When uploading an Excel file compliant with the provided template",
            gherkinThenEn: "Then system validates rows and displays total imported records count",
            isMandatory: true,
          });
        }

        if (answers.reporting_output === "excel_csv") {
          criteria.push({
            id: `crit-${criterionIndex++}`,
            slotKey: "reporting_output",
            phaseNumber: 3,
            category: "OUTPUT_REPORTING",
            humanCriterionTr: "Tablodaki 'Excel İndir' butonuna basıldığında, aktif filtrelemelere uygun sipariş/veri listesi 3 saniye içinde .xlsx olarak indirilmelidir.",
            humanCriterionEn: "Clicking 'Export Excel' must trigger a browser download of an .xlsx file matching the active filter criteria within 3 seconds.",
            gherkinGivenTr: "Kullanıcı tarih veya kategori filtresi uygulamışken",
            gherkinWhenTr: "'Excel Dışa Aktar' butonuna tıkladığında",
            gherkinThenTr: "HTTP 200 ile geçerli .xlsx dosyası inmeli ve dosya içeriğinde filtrelenen kayıtlar eksiksiz yer almalıdır",
            gherkinGivenEn: "Given active search and date filters are applied",
            gherkinWhenEn: "When clicking 'Export Excel' button",
            gherkinThenEn: "Then browser receives valid .xlsx spreadsheet matching table count with HTTP 200",
            isMandatory: true,
          });
        } else if (answers.reporting_output === "pdf_official") {
          criteria.push({
            id: `crit-${criterionIndex++}`,
            slotKey: "reporting_output",
            phaseNumber: 3,
            category: "OUTPUT_REPORTING",
            humanCriterionTr: "Kayıt detayında 'PDF Yazdır / İndir' butonuna tıklandığında, şirket logolu ve standart şablonlu resmi PDF evrak oluşturulmalıdır.",
            humanCriterionEn: "Clicking 'Download PDF' must generate a branded, formatted official PDF document with proper headers and totals.",
            gherkinGivenTr: "Seçili bir işlem kaydı açıkken",
            gherkinWhenTr: "'PDF İndir' butonuna tıklandığında",
            gherkinThenTr: "A4 formatında, yazı tipleri düzgün ve toplam tutarlar doğru hesaplanmış PDF dosyası üretilmelidir",
            gherkinGivenEn: "Given an active transaction detail view",
            gherkinWhenEn: "When triggering 'Download PDF'",
            gherkinThenEn: "Then an A4 printable PDF document is generated with accurate calculations",
            isMandatory: true,
          });
        }
        break;

      case "E_COMMERCE_MARKETPLACE":
        criteria.push({
          id: `crit-${criterionIndex++}`,
          slotKey: "cart_checkout",
          phaseNumber: 1,
          category: "CORE_LOGIC",
          humanCriterionTr: "Kullanıcı sepete ürün ekleyip adet güncelleyebilmeli ve toplam tutar KDV dahil doğru hesaplanmalıdır.",
          humanCriterionEn: "Users must be able to add/update items in cart with accurate subtotal, tax, and shipping calculations.",
          gherkinGivenTr: "Kullanıcı ürün detay sayfasındayken",
          gherkinWhenTr: "'Sepete Ekle' butonuna basıp adeti 2 yaptığında",
          gherkinThenTr: "Sepet sayacında 2 görünmeli ve toplam tutar 2 katı olarak güncellenmelidir",
          gherkinGivenEn: "Given user is on a product detail page",
          gherkinWhenEn: "When adding to cart and increasing quantity to 2",
          gherkinThenEn: "Then cart counter shows 2 and subtotal reflects exact unit price multiplication",
          isMandatory: true,
        });

        if (answers.payment_system === "vpos_iyzico") {
          criteria.push({
            id: `crit-${criterionIndex++}`,
            slotKey: "payment_system",
            phaseNumber: 2,
            category: "AUTH_SECURITY",
            humanCriterionTr: "Ödeme adımında 3D Secure SMS şifresi doğru girildiğinde sipariş 'Ödendi' durumuna geçmeli, hatalı şifrede bakiye çekilmemelidir.",
            humanCriterionEn: "Successful 3D Secure OTP verification transitions order to 'PAID'; declined cards must display specific bank rejection message.",
            gherkinGivenTr: "Kullanıcı checkout adımında kart bilgilerini girdiğinde",
            gherkinWhenTr: "Banka 3D Secure onayını ilettiğinde",
            gherkinThenTr: "Sipariş veritabanında onaylanmalı, stoklar düşmeli ve müşteriye sipariş numarası gösterilmelidir",
            gherkinGivenEn: "Given customer enters card info on checkout",
            gherkinWhenEn: "When bank returns successful 3D Secure callback",
            gherkinThenEn: "Then order status sets to PAID, inventory decrements, and confirmation screen renders",
            isMandatory: true,
          });
        }
        break;

      case "MOBILE_ON_DEMAND":
        criteria.push({
          id: `crit-${criterionIndex++}`,
          slotKey: "location_tracking",
          phaseNumber: 2,
          category: "CORE_LOGIC",
          humanCriterionTr: "Harita ekranı açıldığında kullanıcının mevcut GPS konumu 3 saniye içinde tespit edilip haritada doğru pinlenmelidir.",
          humanCriterionEn: "Map view must accurately acquire device GPS coordinates within 3 seconds and place the marker on the viewport.",
          gherkinGivenTr: "Kullanıcı konum izni vermişken",
          gherkinWhenTr: "Uygulamada harita sekmesini açtığında",
          gherkinThenTr: "Mevcut enlem ve boylam harita merkezine yerleştirilmeli ve yakınlaştırma (zoom) ayarlanmalıdır",
          gherkinGivenEn: "Given location permission is granted",
          gherkinWhenEn: "When opening the mobile map view",
          gherkinThenEn: "Then device GPS lat/long centers the map viewport within 3s",
          isMandatory: true,
        });
        break;

      case "FINTECH_PAYMENTS":
        criteria.push({
          id: `crit-${criterionIndex++}`,
          slotKey: "fintech_core",
          phaseNumber: 1,
          category: "AUTH_SECURITY",
          humanCriterionTr: "Tüm finansal para giriş ve çıkışlarında çift girişli kayıt tutulmalı; sistem toplam borç ve alacak farkı daima sıfır olmalıdır.",
          humanCriterionEn: "All ledger balance updates must follow double-entry principles ensuring total credits equal total debits at all times.",
          gherkinGivenTr: "Kullanıcı cüzdanına bakiye yüklediğinde",
          gherkinWhenTr: "Banka transferi tamamlandığında",
          gherkinThenTr: "Kullanıcı cüzdan hesabı alacaklandırılırken sistem havuz hesabı borçlandırılmalı ve mutabakat logu oluşturulmalıdır",
          gherkinGivenEn: "Given user funds wallet with an amount",
          gherkinWhenEn: "When payment processor confirms transfer",
          gherkinThenEn: "Then user wallet credits and escrow debits by exact amount with SHA-256 ledger hash",
          isMandatory: true,
        });
        break;

      case "CONTENT_PORTFOLIO_LANDING":
        criteria.push({
          id: `crit-${criterionIndex++}`,
          slotKey: "lead_conversion",
          phaseNumber: 2,
          category: "DATA_INTEGRATION",
          humanCriterionTr: "İletişim formuna isim, telefon ve mesaj yazılıp gönderildiğinde, talep anında yönetici e-postasına iletilmeli ve ekranda teşekkür mesajı çıkmalıdır.",
          humanCriterionEn: "Submitting the contact inquiry form must trigger an instant email alert to the owner and render a clear success modal.",
          gherkinGivenTr: "Ziyaretçi iletişim formundaki tüm zorunlu alanları doldurmuşken",
          gherkinWhenTr: "'Gönder' butonuna tıkladığında",
          gherkinThenTr: "Form verileri kaydedilmeli, e-posta gönderilmeli ve form temizlenerek başarı mesajı görünmelidir",
          gherkinGivenEn: "Given visitor fills all mandatory contact inputs",
          gherkinWhenEn: "When clicking 'Submit'",
          gherkinThenEn: "Then payload persists to database, notification fires, and success prompt renders",
          isMandatory: true,
        });
        break;

      case "AI_AGENT_AUTOMATION":
        criteria.push({
          id: `crit-${criterionIndex++}`,
          slotKey: "error_handling",
          phaseNumber: 2,
          category: "CORE_LOGIC",
          humanCriterionTr: "Otomasyon görevi sırasında beklenmeyen bir ağ veya ayrıştırma hatası oluştuğunda, sistem çökmek yerine hatayı loglamalı ve 3 kez otomatik tekrar denemelidir.",
          humanCriterionEn: "Upon unexpected network or parsing exceptions, agent must log the error and retry up to 3 times before triggering an alert.",
          gherkinGivenTr: "Harici servis geçici olarak 503 yanıtı verdiğinde",
          gherkinWhenTr: "Otomasyon görevi çalıştığında",
          gherkinThenTr: "Sistem görevi sonlandırmadan önce 5 saniye aralıklarla 3 defa yeniden denemelidir",
          gherkinGivenEn: "Given third-party service temporarily responds with HTTP 503",
          gherkinWhenEn: "When automation workflow executes",
          gherkinThenEn: "Then agent performs 3 exponential retries before logging failure",
          isMandatory: true,
        });
        break;

      case "API_BACKEND_INTEGRATION":
        criteria.push({
          id: `crit-${criterionIndex++}`,
          slotKey: "api_style",
          phaseNumber: 1,
          category: "CORE_LOGIC",
          humanCriterionTr: "Tüm API uç noktaları için Swagger/OpenAPI interaktif arayüzü `/docs` altında çalışmalı ve her uç noktanın girdi/çıktı şeması doğrulanabilir olmalıdır.",
          humanCriterionEn: "All API endpoints must expose OpenAPI/Swagger UI at `/docs` with validated request and response JSON schemas.",
          gherkinGivenTr: "Backend servisi ayağa kaldırıldığında",
          gherkinWhenTr: "Tarayıcıdan `/docs` veya `/swagger` adresine gidildiğinde",
          gherkinThenTr: "Tüm uç noktalar, parametre tipleri ve örnek JSON yanıtları başarıyla görüntülenmelidir",
          gherkinGivenEn: "Given backend server is running",
          gherkinWhenEn: "When navigating to `/docs`",
          gherkinThenEn: "Then OpenAPI interactive documentation renders all active endpoints and models",
          isMandatory: true,
        });
        break;

      case "CUSTOM_GENERAL":
      default:
        criteria.push({
          id: `crit-${criterionIndex++}`,
          slotKey: "testing_assurance",
          phaseNumber: 2,
          category: "CORE_LOGIC",
          humanCriterionTr: "Sistem hem masaüstü hem de mobil ekranlarda bozulma olmadan responsive çalışmalı ve tarayıcı konsolunda kritik hata (error) üretmemelidir.",
          humanCriterionEn: "System must render responsively across desktop and mobile screens without UI overlap or breaking console errors.",
          gherkinGivenTr: "Kullanıcı mobil veya masaüstü tarayıcıdan uygulamayı açtığında",
          gherkinWhenTr: "Ana akış adımları (giriş, form doldurma, işlem tamamlama) gerçekleştirildiğinde",
          gherkinThenTr: "Arayüz düzgün görüntülenmeli ve tarayıcı konsolunda 'Uncaught Exception' oluşmamalıdır",
          gherkinGivenEn: "Given user opens application in mobile viewport",
          gherkinWhenEn: "When navigating core user journeys",
          gherkinThenEn: "Then elements layout responsively with zero fatal uncaught console exceptions",
          isMandatory: true,
        });
        break;
    }

    // 3. Mandatory Handover & Acceptance Criterion (Phase 3 Final Acceptance)
    criteria.push({
      id: `crit-${criterionIndex}`,
      phaseNumber: 3,
      category: "DELIVERY_QUALITY",
      humanCriterionTr: "Tüm kaynak kodlar, ortam değişkenleri (.env.example) ve varsa canlı yayın/deployment adımları eksiksiz teslim edilmelidir.",
      humanCriterionEn: "All source code, environment templates (.env.example), and live deployment instructions must be fully handed over.",
      gherkinGivenTr: "Geliştirici teslimat tutanağını doldurduğunda",
      gherkinWhenTr: "İşveren teslim edilen kodları incelediğinde",
      gherkinThenTr: "Geliştirme için gerekli tüm API anahtarı şablonları ve çalıştırma komutları eksiksiz mevcut olmalıdır",
      gherkinGivenEn: "Given developer submits formal handover package",
      gherkinWhenEn: "When employer reviews repository files",
      gherkinThenEn: "Then all configuration keys and deployment steps are fully documented",
      isMandatory: true,
    });

    // Generate Suggested Milestones (Phase 1, 2, 3)
    const phase1Criteria = criteria.filter((c) => c.phaseNumber === 1);
    const phase2Criteria = criteria.filter((c) => c.phaseNumber === 2);
    const phase3Criteria = criteria.filter((c) => c.phaseNumber === 3);

    const suggestedMilestones = [
      {
        phase: 1,
        titleTr: "Mimari Kurulum, Veritabanı & Yetkilendirme",
        titleEn: "System Architecture, Database & Baseline Setup",
        percentage: 30,
        criteriaCount: phase1Criteria.length,
        descriptionTr: "Proje iskeletinin kurulması, veri modelleri ve temel altyapı teslimatı.",
        descriptionEn: "Baseline scaffolding, database models, and core infrastructure handover.",
      },
      {
        phase: 2,
        titleTr: "Temel İş Mantığı, Entegrasyonlar & Fonksiyonel Akış",
        titleEn: "Core Business Logic, Integrations & User Journeys",
        percentage: 45,
        criteriaCount: phase2Criteria.length,
        descriptionTr: "Temel özelliklerin kodlanması, harici servis bağlantıları ve çalışan prototip.",
        descriptionEn: "Feature development, third-party integrations, and working prototype verification.",
      },
      {
        phase: 3,
        titleTr: "Raporlama, Testler, Canlıya Alma & Nihai Teslimat",
        titleEn: "Reporting, Quality Tests, Deployment & Final Handover",
        percentage: 25,
        criteriaCount: phase3Criteria.length,
        descriptionTr: "Çıktı formatları, hata testleri, canlı ortama kurulum ve FSEK m. 52 fikri hak devri.",
        descriptionEn: "Output generation, regression tests, production deployment, and IP transfer.",
      },
    ];

    // Summary bullet points
    const summaryBulletPointsTr = criteria.map((c) => c.humanCriterionTr);
    const summaryBulletPointsEn = criteria.map((c) => c.humanCriterionEn);

    // Contract Annex Markdown Generator
    const contractAnnexMarkdownTr = this.generateContractAnnexMarkdown(criteria, "tr");
    const contractAnnexMarkdownEn = this.generateContractAnnexMarkdown(criteria, "en");

    return {
      archetype,
      archetypeLabel: detection.profile.labelTr,
      detectedConfidence: detection.confidence,
      answers,
      criteria,
      suggestedMilestones,
      summaryBulletPointsTr,
      summaryBulletPointsEn,
      contractAnnexMarkdownTr,
      contractAnnexMarkdownEn,
    };
  }

  /**
   * Builds statutory markdown annex for TBK 470 / 474 contracts.
   */
  static generateContractAnnexMarkdown(
    criteria: ContractAcceptanceCriterion[],
    locale: "tr" | "en" = "tr"
  ): string {
    const isTr = locale === "tr";
    const lines: string[] = [];

    lines.push(
      isTr
        ? "### EK-1: TARAFLARCA KARARLAŞTIRILAN OBJEKTİF KABUL KRİTERLERİ (DEFINITION OF DONE)"
        : "### ANNEX-1: AGREED OBJECTIVE ACCEPTANCE CRITERIA (DEFINITION OF DONE)"
    );
    lines.push("");
    lines.push(
      isTr
        ? "İşbu sözleşme kapsamında teslim edilecek yazılım ve teknik eserlerin Türk Borçlar Kanunu (TBK) m. 470 ve m. 474 hükümleri uyarınca 'Ayıpsız ve Sözleşmeye Uygun İfası' taraflarca mutabık kalınan aşağıdaki objektif kriterlere bağlanmıştır. İşveren, aşağıdaki kriterlerin sağlandığı durumlarda keyfi ret hakkına sahip olmayıp, yalnızca bu maddelerdeki somut eksiklikleri gerekçe göstererek revizyon talep edebilir:"
        : "Pursuant to Turkish Code of Obligations (TBK) Articles 470 and 474, non-defective contractual fulfillment of the deliverables is tied to the following objective criteria. The client cannot reject deliverables subjectively and may only request revisions by referencing specific non-compliance with these clauses:"
    );
    lines.push("");

    const phases = [1, 2, 3];
    for (const phase of phases) {
      const phaseCriteria = criteria.filter((c) => c.phaseNumber === phase);
      if (phaseCriteria.length === 0) continue;

      const PHASE_TITLES = {
        tr: {
          1: "Faz 1: Altyapı & Yetkilendirme Kriterleri",
          2: "Faz 2: Çekirdek İş Mantığı & Entegrasyon Kriterleri",
          3: "Faz 3: Çıktı, Test & Nihai Teslimat Kriterleri",
        },
        en: {
          1: "Phase 1: Architecture & Auth Criteria",
          2: "Phase 2: Core Logic & Integration Criteria",
          3: "Phase 3: Output, Testing & Final Handover Criteria",
        },
      };
      const lang = isTr ? "tr" : "en";
      const phaseTitle = PHASE_TITLES[lang][phase as 1 | 2 | 3] ?? `Phase ${phase}`;

      lines.push(`#### ${phaseTitle}`);
      lines.push("");

      for (const item of phaseCriteria) {
        const text = isTr ? item.humanCriterionTr : item.humanCriterionEn;
        const given = isTr ? item.gherkinGivenTr : item.gherkinGivenEn;
        const when = isTr ? item.gherkinWhenTr : item.gherkinWhenEn;
        const then = isTr ? item.gherkinThenTr : item.gherkinThenEn;

        lines.push(`* [x] **${text}**`);
        lines.push(`  * *Teknik Doğrulama (BDD):* \`GIVEN ${given} | WHEN ${when} | THEN ${then}\``);
        lines.push("");
      }
    }

    return lines.join("\n");
  }

  /**
   * Evaluates revision request inputs against defined criteria to prevent subjective rejections.
   */
  static evaluateRevisionCriteria(input: EvaluateRevisionCriteriaInput): EvaluateRevisionCriteriaResult {
    const { criteria, evaluations } = input;
    const totalCount = criteria.length;

    if (totalCount === 0) {
      return {
        allPassed: true,
        totalCount: 0,
        passedCount: 0,
        failedCount: 0,
        failedCriteria: [],
        isValidForRevision: true,
      };
    }

    const failedCriteria: EvaluateRevisionCriteriaResult["failedCriteria"] = [];
    let passedCount = 0;

    for (const crit of criteria) {
      const evalItem = evaluations[crit.id];
      if (evalItem && !evalItem.passed) {
        failedCriteria.push({
          id: crit.id,
          humanCriterionTr: crit.humanCriterionTr,
          failureReason: evalItem.failureReason?.trim() || "Kriter sağlanamadı olarak işaretlendi.",
        });
      } else {
        passedCount++;
      }
    }

    const allPassed = failedCriteria.length === 0;
    const isValidForRevision = failedCriteria.length > 0;

    let validationError: string | undefined;
    if (!isValidForRevision) {
      validationError =
        "Revizyon talebinde bulunabilmek için sözleşmedeki kabul kriterlerinden en az birinin sağlanamadığını gerekçesiyle belirtmelisiniz. Keyfi genel ret yapılamaz.";
    }

    return {
      allPassed,
      totalCount,
      passedCount,
      failedCount: failedCriteria.length,
      failedCriteria,
      isValidForRevision,
      validationError,
    };
  }
}
