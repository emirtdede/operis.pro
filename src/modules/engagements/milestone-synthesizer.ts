/**
 * Dynamic Milestone & WBS Synthesizer Engine (Operis Engagements Module)
 *
 * Automatically generates context-aware, deliverable-oriented milestone roadmaps
 * tailored to 10 industry sectors and 110 categories, analyzing listing title,
 * scope, tags, budget, and timeline intent.
 */

export type MilestoneDeliverableUrlType =
  | "CODE_REPO"
  | "DESIGN_PROTOTYPE"
  | "STAGING_URL"
  | "DOC_WORKSPACE"
  | "OTHER";

export interface SynthesizedMilestone {
  sequenceNumber: number;
  titleTr: string;
  titleEn: string;
  descriptionTr: string;
  descriptionEn: string;
  deliverableCriteriaTr: string;
  deliverableCriteriaEn: string;
  percentage: number; // e.g. 25.0
  amount: number;
  currency: string;
  targetDaysFromStart: number;
  suggestedUrlType: MilestoneDeliverableUrlType;
}

export interface SynthesizeMilestonesInput {
  sectorKey?: string | null;
  categoryKey?: string | null;
  categoryName?: string | null;
  title?: string | null;
  scope?: string | null;
  tags?: string[] | null;
  totalBudget?: number | null;
  budgetLabel?: string | null;
  currency?: string | null;
  durationDays?: number | null;
}

interface TemplateMilestoneBlueprint {
  titleTr: string;
  titleEn: string;
  descriptionTr: string;
  descriptionEn: string;
  criteriaTr: string;
  criteriaEn: string;
  defaultPercentage: number;
  suggestedUrlType: MilestoneDeliverableUrlType;
}

// 1. Sector & Category Blueprint Catalogs (10 Sectors)
const BLUEPRINTS_SOFTWARE_FULLSTACK: TemplateMilestoneBlueprint[] = [
  {
    titleTr: "Mimari İskelet, Veritabanı Şeması & API Tasarımı",
    titleEn: "System Architecture, DB Schema & API Specification",
    descriptionTr: "Veritabanı modellerinin, ORM/migration yapısının, Docker geliştirme ortamının ve API uç noktalarının kurulması.",
    descriptionEn: "Database schema design, ORM migrations, Dockerized environment, and initial REST/GraphQL endpoints scaffolding.",
    criteriaTr: "Git reposunda çalışan ilk commit, veritabanı migration'ları ve API Swagger/Postman dokümantasyonu.",
    criteriaEn: "Clean Git repo initial commit, runnable migrations, and interactive API documentation.",
    defaultPercentage: 25,
    suggestedUrlType: "CODE_REPO",
  },
  {
    titleTr: "Backend Çekirdek Servisleri, Auth & İş Mantığı",
    titleEn: "Core Backend Services, Auth Engine & Business Logic",
    descriptionTr: "Kullanıcı rolleri, yetkilendirme, veri işleme servisleri ve üçüncü taraf API entegrasyonlarının tamamlanması.",
    descriptionEn: "Authentication, authorization, core business services, background queues, and 3rd-party integrations.",
    criteriaTr: "API uç noktalarının birim ve entegrasyon testlerinin başarıyla geçmesi.",
    criteriaEn: "Automated test suite passing with healthy endpoint coverage.",
    defaultPercentage: 35,
    suggestedUrlType: "CODE_REPO",
  },
  {
    titleTr: "Frontend UI/UX Ekranları & API Entegrasyonu",
    titleEn: "Frontend UI Components, Responsive Screens & State Integration",
    descriptionTr: "Tüm ekranların responsive olarak kodlanması, backend API bağlantıları ve kullanıcı etkileşim akışları.",
    descriptionEn: "Complete responsive frontend layout, state management, and real-time backend API consumption.",
    criteriaTr: "Çalışır durumdaki arayüz ekranları ve uçtan uca veri akışının doğrulanması.",
    criteriaEn: "Fully interactive frontend UI consuming live backend endpoints.",
    defaultPercentage: 25,
    suggestedUrlType: "STAGING_URL",
  },
  {
    titleTr: "Staging Dağıtımı, UAT Testleri & Kaynak Kod Devri",
    titleEn: "Staging Deployment, UAT Acceptance & Code Handover",
    descriptionTr: "Staging/canlı dağıtımın yapılması, ortam değişkenlerinin teslimi ve FSEK m. 52 fikri hak devri.",
    descriptionEn: "Production/staging deployment, environment configuration handoff, and statutory IP assignment.",
    criteriaTr: "Canlı linkin 200 OK yanıt vermesi, temiz repo devri ve nihai kabul onayı.",
    criteriaEn: "Production deploy running live (HTTP 200), clean repo handover, and final sign-off.",
    defaultPercentage: 15,
    suggestedUrlType: "STAGING_URL",
  },
];

const BLUEPRINTS_SOFTWARE_MOBILE: TemplateMilestoneBlueprint[] = [
  {
    titleTr: "Mobil UI Kit, Proje İskeleti & Navigasyon Akışı",
    titleEn: "Mobile UI Kit, Scaffolding & Navigation Architecture",
    descriptionTr: "Temel mobil uygulama yapısının kurulması, navigasyon ağacı ve tema/bileşen kütüphanesinin hazırlanması.",
    descriptionEn: "Cross-platform/native project scaffolding, navigation graph, and reusable design system components.",
    criteriaTr: "Simülatör/cihazda koşan iskelet proje ve navigasyon akışı.",
    criteriaEn: "Runnable starter build on iOS simulator / Android emulator with working screen transitions.",
    defaultPercentage: 25,
    suggestedUrlType: "CODE_REPO",
  },
  {
    titleTr: "Çekirdek Ekranlar, API Bağlantıları & Yerel Yetenekler",
    titleEn: "Core Feature Screens, API Binding & Native Capabilities",
    descriptionTr: "Ana fonksiyonların kodlanması, backend API entegrasyonu, kamera/konum/depolama yetenekleri.",
    descriptionEn: "Core business screens, REST/GraphQL synchronization, and native device hardware integrations.",
    criteriaTr: "Gerçek veriyle çalışan ana ekran akışları ve form doğrulamaları.",
    criteriaEn: "Functional screens rendering dynamic API data with full form validations.",
    defaultPercentage: 35,
    suggestedUrlType: "CODE_REPO",
  },
  {
    titleTr: "Push Bildirimler, Çevrimdışı Önbellek & Testler",
    titleEn: "Push Notifications, Offline Storage & Integration Tests",
    descriptionTr: "FCM/APNS bildirim altyapısı, SQLite/Hive önbellekleme ve uçtan uca hata senaryoları.",
    descriptionEn: "Push notification setup, local persistent offline caching, and end-to-end edge-case testing.",
    criteriaTr: "Çevrimdışıyken veri kaybetmeme doğrulaması ve başarılı bildirim testi.",
    criteriaEn: "Verified push notification receipt and offline state recovery.",
    defaultPercentage: 25,
    suggestedUrlType: "STAGING_URL",
  },
  {
    titleTr: "TestFlight / Google Play Beta Dağıtımı & Mağaza Yayını",
    titleEn: "TestFlight / Play Store Beta Build & Release Handover",
    descriptionTr: "İmzalanmış binary build'lerin (IPA/AAB) mağaza test konsollarına yüklenmesi ve yayın devri.",
    descriptionEn: "Store-signed binary distribution via TestFlight and Google Play Console Internal Track.",
    criteriaTr: "TestFlight veya Google Play test bağlantısının işverene teslimi.",
    criteriaEn: "Working installable TestFlight / Internal Beta invitation delivered to client.",
    defaultPercentage: 15,
    suggestedUrlType: "STAGING_URL",
  },
];

const BLUEPRINTS_AI_DATA: TemplateMilestoneBlueprint[] = [
  {
    titleTr: "Veri Pipeline, Temizlik & Vektör Veritabanı Kurulumu",
    titleEn: "Data Ingestion, Cleaning & Vector Store Architecture",
    descriptionTr: "Ham verilerin toplanması, chunking/embedding pipeline'ının kurulması ve vektör veritabanı entegrasyonu.",
    descriptionEn: "Raw dataset curation, text chunking, embedding generation, and vector index configuration.",
    criteriaTr: "Vektör veritabanında başarıyla indekslenmiş veri kümesi ve arama doğrulaması.",
    criteriaEn: "Indexed vector collection with verifiable similarity search recall benchmarks.",
    defaultPercentage: 30,
    suggestedUrlType: "CODE_REPO",
  },
  {
    titleTr: "Model/RAG Pipeline, Prompt Mimarisi & API Servisleri",
    titleEn: "RAG Pipeline, Prompt Engineering & Model API Microservice",
    descriptionTr: "LLM orkestrasyonu (LangChain/LlamaIndex), prompt optimizasyonu, tool-calling ve FastAPI servisi.",
    descriptionEn: "LLM orchestration, contextual retrieval, structured JSON tool execution, and FastAPI microservice.",
    criteriaTr: "REST API üzerinden gönderilen sorgulara doğru ve halüsinasyonsuz yanıt üreten çalışan pipeline.",
    criteriaEn: "Live API endpoint generating grounded, deterministic outputs without hallucination.",
    defaultPercentage: 40,
    suggestedUrlType: "CODE_REPO",
  },
  {
    titleTr: "Doğruluk Metrikleri, Frontend Demo & Canlı Dağıtım",
    titleEn: "Evaluation Benchmarks, Interactive Web Demo & Deployment",
    descriptionTr: "RAGAS/BLEU metrik değerlendirmesi, Streamlit/Next.js arayüzü ve bulut sunucu dağıtımı.",
    descriptionEn: "Quantitative benchmark evaluation, interactive UI dashboard, and cloud container deployment.",
    criteriaTr: "Canlı çalışan etkileşimli yapay zeka arayüz linki ve doğruluk test raporu.",
    criteriaEn: "Live web demo URL allowing interactive testing alongside accuracy benchmark metrics.",
    defaultPercentage: 30,
    suggestedUrlType: "STAGING_URL",
  },
];

const BLUEPRINTS_DESIGN_CREATIVE: TemplateMilestoneBlueprint[] = [
  {
    titleTr: "Kullanıcı Araştırması, Bilgi Mimarisi & Wireframe Taslakları",
    titleEn: "User Research, Information Architecture & Low-Fi Wireframes",
    descriptionTr: "Rakip analizi, kullanıcı persona akışları, site haritası ve düşük sadakatli tel kafes (wireframe) çizimleri.",
    descriptionEn: "Competitive analysis, user journey mapping, sitemap, and structural low-fidelity wireframe flows.",
    criteriaTr: "Tüm ana ekranların iskelet yerleşimlerini içeren Figma linki.",
    criteriaEn: "Figma link detailing core UX flows and structural layouts for all critical views.",
    defaultPercentage: 30,
    suggestedUrlType: "DESIGN_PROTOTYPE",
  },
  {
    titleTr: "Tasarım Sistemi (Design Tokens) & Yüksek Sadakatli UI Ekranları",
    titleEn: "Design System, Design Tokens & High-Fidelity UI Screens",
    descriptionTr: "Tipografi, renk paleti, grid sistemi, ikon seti ve tüm responsive nihai ekranların tasarımı.",
    descriptionEn: "Color system, typography hierarchy, UI component library (Design Tokens), and pixel-perfect screens.",
    criteriaTr: "Masaüstü, tablet ve mobil boyutlarında eksiksiz yüksek sadakatli Figma ekranları.",
    criteriaEn: "Complete responsive high-fidelity screen mockups in desktop, tablet, and mobile breakpoints.",
    defaultPercentage: 40,
    suggestedUrlType: "DESIGN_PROTOTYPE",
  },
  {
    titleTr: "İnteraktif Prototip, Mikro-Animasyonlar & Geliştirici Teslimatı",
    titleEn: "Interactive Prototype, Micro-interactions & Developer Hand-off",
    descriptionTr: "Tıklanabilir Figma prototipi, buton hover/transition animasyonları ve yazılımcı için varlık ihracı.",
    descriptionEn: "Clickable prototype with micro-animations, interaction states, and developer hand-off asset export.",
    criteriaTr: "Tıklanabilir canlı prototip linki ve tüm SVG/ikon varlıklarının eksiksiz devri.",
    criteriaEn: "Clickable prototype link with exported production-ready vector SVG assets and CSS specs.",
    defaultPercentage: 30,
    suggestedUrlType: "DESIGN_PROTOTYPE",
  },
];

const BLUEPRINTS_SECURITY_DEVOPS: TemplateMilestoneBlueprint[] = [
  {
    titleTr: "Altyapı Analizi, Güvenlik Denetimi & Mimari Plan",
    titleEn: "Infrastructure Audit, Security Baseline & IaC Architecture",
    descriptionTr: "Mevcut sunucu/bulut altyapısının taranması, güvenlik zafiyetlerinin tespiti ve Terraform/IaC planı.",
    descriptionEn: "Cloud security scanning, vulnerability assessment, IAM role scoping, and Terraform/IaC blueprint.",
    criteriaTr: "Güvenlik zafiyet raporu ve onaylanmış altyapı mimari diyagramı.",
    criteriaEn: "Audited security assessment document and approved target architecture topology diagram.",
    defaultPercentage: 30,
    suggestedUrlType: "DOC_WORKSPACE",
  },
  {
    titleTr: "IaC Dağıtımı, CI/CD Otomasyonu & SSL/Güvenlik Duvarı",
    titleEn: "IaC Deployment, CI/CD Pipeline & WAF/SSL Hardening",
    descriptionTr: "Terraform ile sunucuların ayağa kaldırılması, GitHub Actions CI/CD ve Cloudflare/WAF güvenlik kural seti.",
    descriptionEn: "Automated provisioning via Terraform, automated CI/CD pipeline, and WAF/SSL/TLS hardening.",
    criteriaTr: "Otomatik çalışan CI/CD pipeline'ı ve SSL/güvenlik skor testleri.",
    criteriaEn: "Green passing CI/CD workflow and Grade-A SSL Labs / WAF benchmark verification.",
    defaultPercentage: 45,
    suggestedUrlType: "CODE_REPO",
  },
  {
    titleTr: "Yük Testi, Grafana/Prometheus İzleme & Acil Durum Kılavuzu",
    titleEn: "Load Testing, Observability Dashboard & Runbook Handover",
    descriptionTr: "K6 stres/yük testleri, CPU/RAM metrik alarmları ve sistem kurtarma dokümantasyonu.",
    descriptionEn: "K6 load testing simulations, Prometheus/Grafana metric alerts, and incident recovery runbook.",
    criteriaTr: "Canlı izleme dashboard linki ve acil durum kurtarma rehberinin teslimi.",
    criteriaEn: "Live Grafana dashboard access and disaster recovery runbook documentation delivered.",
    defaultPercentage: 25,
    suggestedUrlType: "STAGING_URL",
  },
];

const BLUEPRINTS_ECOMMERCE_NOCODE: TemplateMilestoneBlueprint[] = [
  {
    titleTr: "Mağaza Altyapısı, Tema Kurulumu & Ürün Bilgi Mimarisi",
    titleEn: "Store Setup, Theme Customization & Catalog Architecture",
    descriptionTr: "Shopify/Webflow/WooCommerce mağaza kurulumu, özel tema ayarları ve kategori hiyerarşisi.",
    descriptionEn: "Platform provisioning (Shopify/Webflow), custom theme styling, and taxonomy structure.",
    criteriaTr: "Önizleme erişimine açık, temel tema düzeni tamamlanmış test mağazası linki.",
    criteriaEn: "Password-protected preview store link with custom branded typography and homepage layout.",
    defaultPercentage: 35,
    suggestedUrlType: "STAGING_URL",
  },
  {
    titleTr: "Ödeme Ağ Geçidi, Kargo & Üçüncü Taraf Entegrasyonları",
    titleEn: "Payment Gateway, Shipping Matrix & 3rd-Party Integrations",
    descriptionTr: "İyzico/Stripe sanal POS entegrasyonu, kargo API bağlantıları ve e-posta bildirim şablonları.",
    descriptionEn: "Payment processor sandbox verification, dynamic shipping calculators, and transactional emails.",
    criteriaTr: "Başarıyla tamamlanan sandbox test siparişi ve kargo barkod çıktısı teyidi.",
    criteriaEn: "Verified end-to-end sandbox checkout transaction and automated order receipt email.",
    defaultPercentage: 40,
    suggestedUrlType: "STAGING_URL",
  },
  {
    titleTr: "UAT Kullanıcı Kabul Testleri, SEO Ayarları & Canlıya Alma",
    titleEn: "UAT Testing, Technical SEO & Production Domain Launch",
    descriptionTr: "Mobil uyumluluk testleri, schema markup/SEO optimizasyonu, özel alan adı yönlendirmesi ve devir.",
    descriptionEn: "Cross-device checkout verification, schema markup, DNS cutover to custom domain, and admin handoff.",
    criteriaTr: "Özel alan adında canlıya geçmiş, SSL sertifikalı ve çalışır durumdaki e-ticaret mağazası.",
    criteriaEn: "Live production store running on custom domain with active SSL and transferred ownership.",
    defaultPercentage: 25,
    suggestedUrlType: "STAGING_URL",
  },
];

const BLUEPRINTS_GENERIC_TASK: TemplateMilestoneBlueprint[] = [
  {
    titleTr: "1. Aşama: Mimari Hazırlık, Kapsam & Altyapı",
    titleEn: "Phase 1: Architecture, Scope Scaffolding & Setup",
    descriptionTr: "Gereksinimlerin netleştirilmesi, teknik iskeletin kurulması ve başlangıç teslimatları.",
    descriptionEn: "Requirement clarification, initial environment setup, and baseline technical deliverables.",
    criteriaTr: "İlk aşama çalışma çıktısının veya tasarım/kod taslağının paylaşılması.",
    criteriaEn: "Sharing of initial working draft, architecture specification, or codebase starter.",
    defaultPercentage: 30,
    suggestedUrlType: "CODE_REPO",
  },
  {
    titleTr: "2. Aşama: Çekirdek Geliştirme & Fonksiyonel Demo",
    titleEn: "Phase 2: Core Development & Functional Demo",
    descriptionTr: "Ana fonksiyonların kodlanması, ara entegrasyonlar ve incelenebilir çalışan demo sürümü.",
    descriptionEn: "Main feature implementation, core business logic, and functional intermediate demo.",
    criteriaTr: "İşverenin test edip geri bildirim verebileceği çalışan demo veya ara çıktının sunulması.",
    criteriaEn: "Interactive working demo or comprehensive intermediate deliverable ready for client review.",
    defaultPercentage: 40,
    suggestedUrlType: "STAGING_URL",
  },
  {
    titleTr: "3. Aşama: Final Testleri, Teslimat & FSEK Devri",
    titleEn: "Phase 3: Final Acceptance, Handover & IP Transfer",
    descriptionTr: "Son düzeltmeler, canlıya alma hazırlıkları, tüm kaynak dosyaların devri ve sözleşme kapanışı.",
    descriptionEn: "Final polish, production cutover, clean asset/repository handover, and statutory IP assignment.",
    criteriaTr: "Tüm kaynak dosyaların eksiksiz devri ve canlı doğrulaması.",
    criteriaEn: "Complete source deliverables handover and client acceptance sign-off.",
    defaultPercentage: 30,
    suggestedUrlType: "DOC_WORKSPACE",
  },
];

export class MilestoneSynthesizer {
  /**
   * Deterministically synthesizes an end-to-end WBS milestone roadmap tailored
   * to the listing's sector, category, title, scope, tags, and agreed budget.
   */
  static synthesizeMilestonesForListing(input: SynthesizeMilestonesInput): SynthesizedMilestone[] {
    let totalBudget = input.totalBudget && input.totalBudget > 0 ? input.totalBudget : 0;
    let currency = input.currency || "TRY";

    if (!totalBudget && input.budgetLabel) {
      const cleaned = input.budgetLabel.replace(/\s+/g, "");
      const digits = cleaned.replace(/[^\d]/g, "");
      if (digits) {
        totalBudget = parseInt(digits, 10);
      }
      if (input.budgetLabel.includes("$") || input.budgetLabel.toUpperCase().includes("USD")) {
        currency = "USD";
      } else if (input.budgetLabel.includes("€") || input.budgetLabel.toUpperCase().includes("EUR")) {
        currency = "EUR";
      }
    }
    if (!totalBudget) totalBudget = 30000;

    const durationDays = input.durationDays && input.durationDays > 0 ? input.durationDays : 30;

    const sectorKey = (input.sectorKey || "").toLowerCase();
    const categoryKey = (input.categoryKey || "").toLowerCase();
    const categoryName = (input.categoryName || "").toLowerCase();
    const title = (input.title || "").toLowerCase();
    const scope = (input.scope || "").toLowerCase();
    const tagsText = (input.tags || []).join(" ").toLowerCase();

    const combinedText = `${sectorKey} ${categoryKey} ${categoryName} ${title} ${scope} ${tagsText}`;

    // 1. Blueprint selection based on intent and sector heuristics
    let blueprints: TemplateMilestoneBlueprint[] = BLUEPRINTS_GENERIC_TASK;

    if (
      sectorKey.includes("design") ||
      sectorKey.includes("creative") ||
      categoryKey.includes("design") ||
      categoryKey.includes("creative") ||
      categoryKey.includes("ui") ||
      categoryKey.includes("ux")
    ) {
      blueprints = BLUEPRINTS_DESIGN_CREATIVE;
    } else if (
      sectorKey.includes("security") ||
      sectorKey.includes("devops") ||
      categoryKey.includes("security") ||
      categoryKey.includes("devops")
    ) {
      blueprints = BLUEPRINTS_SECURITY_DEVOPS;
    } else if (
      sectorKey.includes("ai") ||
      sectorKey.includes("data") ||
      categoryKey.includes("ai") ||
      categoryKey.includes("data")
    ) {
      blueprints = BLUEPRINTS_AI_DATA;
    } else if (
      sectorKey.includes("ecommerce") ||
      sectorKey.includes("no-code") ||
      categoryKey.includes("ecommerce") ||
      categoryKey.includes("no-code")
    ) {
      blueprints = BLUEPRINTS_ECOMMERCE_NOCODE;
    } else if (
      combinedText.includes("mobil") ||
      combinedText.includes("mobile") ||
      combinedText.includes("flutter") ||
      combinedText.includes("react native") ||
      combinedText.includes("ios") ||
      combinedText.includes("android") ||
      combinedText.includes("swift") ||
      combinedText.includes("kotlin")
    ) {
      blueprints = BLUEPRINTS_SOFTWARE_MOBILE;
    } else if (
      combinedText.includes("yapay zeka") ||
      combinedText.includes("llm") ||
      combinedText.includes("rag") ||
      combinedText.includes("embedding") ||
      combinedText.includes("makine öğrenimi") ||
      combinedText.includes("vektör")
    ) {
      blueprints = BLUEPRINTS_AI_DATA;
    } else if (
      combinedText.includes("figma") ||
      combinedText.includes("ui/ux") ||
      combinedText.includes("tasarım") ||
      combinedText.includes("wireframe") ||
      combinedText.includes("prototip")
    ) {
      blueprints = BLUEPRINTS_DESIGN_CREATIVE;
    } else if (
      combinedText.includes("docker") ||
      combinedText.includes("kubernetes") ||
      combinedText.includes("aws") ||
      combinedText.includes("ci/cd") ||
      combinedText.includes("terraform") ||
      combinedText.includes("sızma testi")
    ) {
      blueprints = BLUEPRINTS_SECURITY_DEVOPS;
    } else if (
      combinedText.includes("shopify") ||
      combinedText.includes("e-ticaret") ||
      combinedText.includes("woocommerce") ||
      combinedText.includes("webflow") ||
      combinedText.includes("sanal pos")
    ) {
      blueprints = BLUEPRINTS_ECOMMERCE_NOCODE;
    } else if (
      sectorKey.includes("software") ||
      combinedText.includes("web") ||
      combinedText.includes("next.js") ||
      combinedText.includes("react") ||
      combinedText.includes("backend") ||
      combinedText.includes("fullstack") ||
      combinedText.includes("api")
    ) {
      blueprints = BLUEPRINTS_SOFTWARE_FULLSTACK;
    }

    // 2. Budget and timeline apportionment
    const totalCount = blueprints.length;
    let distributedAmount = 0;

    return blueprints.map((bp, index) => {
      const isLast = index === totalCount - 1;
      const sequenceNumber = index + 1;

      // Exact currency rounding to kuruş (avoids floating point IEEE-754 drift)
      let milestoneAmount: number;
      if (isLast) {
        milestoneAmount = Math.round((totalBudget - distributedAmount) * 100) / 100;
      } else {
        milestoneAmount = Math.round((totalBudget * (bp.defaultPercentage / 100)) * 100) / 100;
        distributedAmount += milestoneAmount;
      }

      // Linear progression for target dates
      const targetDaysFromStart = Math.max(
        3,
        Math.round((durationDays * (sequenceNumber / totalCount)))
      );

      return {
        sequenceNumber,
        titleTr: bp.titleTr,
        titleEn: bp.titleEn,
        descriptionTr: bp.descriptionTr,
        descriptionEn: bp.descriptionEn,
        deliverableCriteriaTr: bp.criteriaTr,
        deliverableCriteriaEn: bp.criteriaEn,
        percentage: bp.defaultPercentage,
        amount: milestoneAmount,
        currency,
        targetDaysFromStart,
        suggestedUrlType: bp.suggestedUrlType,
      };
    });
  }
}
