/**
 * Operis AI Project Scope & PRD Architect Engine
 * 
 * Provides automated, high-fidelity Product Requirement Document (PRD) synthesis for employers:
 * 1. Domain Archetype Identification
 * 2. Agile User Stories (INVEST Model)
 * 3. Testable Acceptance Criteria (Given/When/Then & Verification Scenarios)
 * 4. External Infrastructure & API Integrations Detection (Payment, SMS, Maps, Storage)
 * 5. Parametric Freelance Market Budget & 3-Phase Delivery Roadmap
 * 6. Complete GitHub-Flavored PRD Markdown Generator
 */

export type ProjectDomainType =
  | "ON_DEMAND_DELIVERY_TAXI"
  | "E_COMMERCE_MARKETPLACE"
  | "SAAS_B2B_DASHBOARD"
  | "FINTECH_PAYMENTS"
  | "SOCIAL_COMMUNITY"
  | "AI_AGENT_AUTOMATION"
  | "GENERAL_CUSTOM";

export interface UserStoryItem {
  id: string;
  role: string;
  want: string;
  soThat: string;
  priority: "P0" | "P1" | "P2"; // P0: MVP/Core, P1: Critical, P2: Advanced
}

export interface AcceptanceCriterionItem {
  id: string;
  category: string;
  description: string;
}

export interface RequiredIntegrationItem {
  name: string;
  category: "PAYMENT" | "MAPS_LOCATION" | "SMS_AUTH" | "MEDIA_STORAGE" | "NOTIFICATION" | "DATABASE_CACHE";
  serviceExample: string;
  rationale: string;
}

export interface DeliveryPhasePlan {
  phase: number;
  percentage: number;
  title: string;
  deliverables: string[];
  durationWeeks: number;
}

export interface MarketEstimateResult {
  minBudget: number;
  maxBudget: number;
  currency: string;
  estimatedWeeksMin: number;
  estimatedWeeksMax: number;
  phases: DeliveryPhasePlan[];
}

export interface ProjectDomainAnalysis {
  domainType: ProjectDomainType;
  domainLabel: string;
  domainLabelEn: string;
  detectedFeatures: string[];
  complexityScore: number; // 1 to 10
}

export interface PrdArchitectInput {
  title: string;
  summary: string;
  categorySlug?: string;
  tags?: string[];
  locale?: "tr" | "en";
}

export interface PrdArchitectResult {
  analysis: ProjectDomainAnalysis;
  userStories: UserStoryItem[];
  acceptanceCriteria: AcceptanceCriterionItem[];
  integrations: RequiredIntegrationItem[];
  marketEstimate: MarketEstimateResult;
  synthesizedPrdMarkdown: string;
}

export class PrdArchitectService {
  /**
   * Identifies the project domain archetype and extracts functional entities.
   */
  static analyzeProjectDomain(
    title: string,
    summary: string,
    categorySlug?: string
  ): ProjectDomainAnalysis {
    const text = `${title} ${summary} ${categorySlug || ""}`.toLowerCase();

    // 1. On-Demand / Delivery / Taxi / Mobility
    if (
      text.includes("uber") ||
      text.includes("getir") ||
      text.includes("taksi") ||
      text.includes("kurye") ||
      text.includes("araç çağır") ||
      text.includes("transfer") ||
      text.includes("şoför") ||
      text.includes("teslimat") ||
      text.includes("canlı konum") ||
      text.includes("rota") ||
      text.includes("yemek sipariş")
    ) {
      return {
        domainType: "ON_DEMAND_DELIVERY_TAXI",
        domainLabel: "On-Demand Taşıma / Getir-Uber Tipi Hizmet Platformu",
        domainLabelEn: "On-Demand Mobility & Courier Platform",
        detectedFeatures: [
          "GPS Canlı Konum Takibi",
          "Müşteri & Kurye/Sürücü Çift Taraflı Uygulama",
          "Anlık Sipariş Eşleştirme Algoritması",
          "Mesafe / Rota Bazlı Otomatik Fiyatlandırma",
          "Mobil Push Bildirimler",
        ],
        complexityScore: 8,
      };
    }

    // 2. E-Commerce / Marketplace
    if (
      text.includes("e-ticaret") ||
      text.includes("sepet") ||
      text.includes("pazaryeri") ||
      text.includes("marketplace") ||
      text.includes("trendyol") ||
      text.includes("mağaza") ||
      text.includes("katalog") ||
      text.includes("stok") ||
      text.includes("kargo") ||
      text.includes("sipariş") ||
      text.includes("checkout")
    ) {
      return {
        domainType: "E_COMMERCE_MARKETPLACE",
        domainLabel: "E-Ticaret & Pazaryeri (Marketplace) Ekosistemi",
        domainLabelEn: "E-Commerce & Multi-Vendor Marketplace",
        detectedFeatures: [
          "Ürün Kataloğu & Varyant (Beden/Renk) Yönetimi",
          "Sepet ve 3D Secure Güvenli Ödeme Akışı",
          "Mağaza/Satıcı Paneli ve Komisyon Ayrıştırma",
          "Kargo Entegrasyonu & Takip Barkodu",
          "İade ve İptal Süreçleri Yönetimi",
        ],
        complexityScore: 7,
      };
    }

    // 3. SaaS / B2B Dashboard
    if (
      text.includes("saas") ||
      text.includes("b2b") ||
      text.includes("dashboard") ||
      text.includes("crm") ||
      text.includes("erp") ||
      text.includes("abonelik") ||
      text.includes("fatura") ||
      text.includes("raporlama") ||
      text.includes("multitenant") ||
      text.includes("rbac") ||
      text.includes("yetkilendirme")
    ) {
      return {
        domainType: "SAAS_B2B_DASHBOARD",
        domainLabel: "Kurumsal B2B SaaS & Yönetim Paneli",
        domainLabelEn: "B2B SaaS & Enterprise Analytics Platform",
        detectedFeatures: [
          "Çoklu Organizasyon (Multi-Tenant) İzolasyonu",
          "Rol Bazlı Yetkilendirme (RBAC - Admin/Editör/Görüntüleyici)",
          "Aylık/Yıllık Yinelenen Abonelik (Stripe Billing)",
          "Detaylı Analitik Grafikleri ve Excel/PDF Export",
          "İşlem Güvenlik Günlüğü (Audit Logs)",
        ],
        complexityScore: 7,
      };
    }

    // 4. Fintech / Wallet
    if (
      text.includes("cüzdan") ||
      text.includes("bakiye") ||
      text.includes("fintech") ||
      text.includes("para transfer") ||
      text.includes("kripto") ||
      text.includes("iban") ||
      text.includes("pos") ||
      text.includes("sanal kart") ||
      text.includes("qr ödeme")
    ) {
      return {
        domainType: "FINTECH_PAYMENTS",
        domainLabel: "Fintech Dijital Cüzdan & Ödeme Altyapısı",
        domainLabelEn: "Digital Wallet & Payment Infrastructure",
        detectedFeatures: [
          "Çift Girişli Muhasebe Defteri (Double-Entry Ledger)",
          "Anlık P2P Para Transferi & QR Ödeme",
          "2FA / SMS OTP İşlem Doğrulama Güvenliği",
          "Banka Havale/EFT ve Kart Saklama Entegrasyonu",
          "MASAK / Mevzuat Uyum Denetim Logları",
        ],
        complexityScore: 9,
      };
    }

    // 5. AI Agent / Automation (Evaluated before generic chat to capture AI chatbots)
    if (
      text.includes("yapay zeka") ||
      text.includes("ai agent") ||
      text.includes("chatbot") ||
      text.includes(" llm") ||
      text.includes("llm ") ||
      text.includes("otomasyon") ||
      text.includes("scraping") ||
      text.includes("rag") ||
      text.includes("prompt") ||
      text.includes("openai") ||
      text.includes("langchain") ||
      text.includes("ai")
    ) {
      return {
        domainType: "AI_AGENT_AUTOMATION",
        domainLabel: "Yapay Zeka (AI) Asistanı & Otomasyon Motoru",
        domainLabelEn: "AI Agent & Semantic Automation System",
        detectedFeatures: [
          "Doküman Yükleme & Vektör Veri Tabanı (RAG) Entegrasyonu",
          "Daktilo Efekti ile Akışkan (Streaming) Yanıt Arayüzü",
          "Özel Sistem Promptları ve Fonksiyon Çağrıları (Tool Use)",
          "Kullanıcı Bazlı Token ve Harcama Kotası Yönetimi",
          "Dış Sistemlere Webhook / API Otomasyonu",
        ],
        complexityScore: 7,
      };
    }

    // 6. Social / Community
    if (
      text.includes("sosyal") ||
      text.includes("topluluk") ||
      text.includes("community") ||
      text.includes("akış") ||
      text.includes("post") ||
      text.includes("takip") ||
      text.includes("mesajlaşma") ||
      text.includes("chat") ||
      text.includes("feed")
    ) {
      return {
        domainType: "SOCIAL_COMMUNITY",
        domainLabel: "Sosyal Ağ & Topluluk İletişim Platformu",
        domainLabelEn: "Social Networking & Community Platform",
        detectedFeatures: [
          "Zaman Tüneli / Akış (Feed) & İçerik Paylaşımı",
          "Kullanıcı Profilleri, Takipleşme ve Beğeni/Yorum",
          "WebSocket ile Gerçek Zamanlı Sohbet (Chat)",
          "Otomatik Spam & Küfür Moderasyon Filtresi",
          "Mobil Uyumlu Medya Galeri Görüntüleyici",
        ],
        complexityScore: 6,
      };
    }

    // 7. General Custom Platform
    return {
      domainType: "GENERAL_CUSTOM",
      domainLabel: "Özel Mimari Web & Mobil Çözümü",
      domainLabelEn: "Custom Full-Stack Solution",
      detectedFeatures: [
        "Modern ve Responsive Kullanıcı Arayüzü (UI/UX)",
        "RESTful / GraphQL Güvenli API Mimarisi",
        "İlişkisel Veri Tabanı Modellemesi ve İndeksleme",
        "Kimlik Doğrulama ve Oturum Yönetimi",
        "Üretim Ortamı (CI/CD) Dağıtım Yapılandırması",
      ],
      complexityScore: 5,
    };
  }

  /**
   * Generates INVEST-compliant user stories for the domain.
   */
  static generateUserStories(
    domain: ProjectDomainAnalysis,
    locale: "tr" | "en" = "tr"
  ): UserStoryItem[] {
    const isTr = locale === "tr";

    switch (domain.domainType) {
      case "ON_DEMAND_DELIVERY_TAXI":
        return [
          {
            id: "us-1",
            role: isTr ? "Müşteri (Yolcu / Sipariş Veren)" : "Customer / Passenger",
            want: isTr
              ? "Harita üzerinden teslimat/alınış noktamı seçip tek tıkla araç/kurye çağırabilmek"
              : "To select my pickup/drop-off point on an interactive map and request a ride with one click",
            soThat: isTr
              ? "Tahmini varış süresini ve sabit yolculuk ücretini önceden bilerek güvenle yola çıkabileyim"
              : "I know estimated arrival time and fare upfront before confirming",
            priority: "P0",
          },
          {
            id: "us-2",
            role: isTr ? "Sürücü / Kurye" : "Driver / Courier",
            want: isTr
              ? "Yakınımdaki çağrıları rota ve kazanç bilgisiyle görüp kabul veya reddedebilmek"
              : "To view incoming requests nearby with route and earning details to accept or decline",
            soThat: isTr
              ? "Kendi çalışma saatlerimi ve kazancımı bağımsız yönetebileyim"
              : "I can independently optimize my shifts and income",
            priority: "P0",
          },
          {
            id: "us-3",
            role: isTr ? "Müşteri" : "Customer",
            want: isTr
              ? "Kuryenin/aracın konumunu harita üzerinde canlı olarak saniyelik izleyebilmek"
              : "To track courier/vehicle movement on a live map in real time",
            soThat: isTr
              ? "Hizmetin ne zaman ulaşacağını bilip gereksiz beklemeler yaşamayayım"
              : "I know precisely when my service arrives without guessing",
            priority: "P1",
          },
          {
            id: "us-4",
            role: isTr ? "Platform Yöneticisi (Admin)" : "Platform Admin",
            want: isTr
              ? "Aktif tüm araçları, tamamlanan yolculukları ve komisyon gelirlerini canlı takip edebilmek"
              : "To monitor all active vehicles, completed rides, and commission margins live",
            soThat: isTr
              ? "Operasyonel darboğazları ve şikayetleri anında çözebileyim"
              : "I can instantly address operational bottlenecks and disputes",
            priority: "P1",
          },
        ];

      case "E_COMMERCE_MARKETPLACE":
        return [
          {
            id: "us-1",
            role: isTr ? "Müşteri (Alıcı)" : "Shopper / Buyer",
            want: isTr
              ? "Gelişmiş filtrelerle (kategori, fiyat, beden/renk) aradığım ürünü saniyeler içinde bulabilmek"
              : "To find products within seconds using faceted filtering (category, price, size)",
            soThat: isTr
              ? "Doğru ürünü en avantajlı fiyata hızlıca sepetime ekleyebileyim"
              : "I can quickly add the right item to my cart at the best price",
            priority: "P0",
          },
          {
            id: "us-2",
            role: isTr ? "Müşteri" : "Customer",
            want: isTr
              ? "Kayıtlı kredi kartımla veya 3D Secure ile tek adımda güvenli ödeme yapabilmek"
              : "To complete checkout in a single friction-free step with 3D Secure protection",
            soThat: isTr
              ? "Kart bilgilerim güvende kalarak siparişimi anında onaylayabileyim"
              : "My financial credentials remain safe while my order is verified",
            priority: "P0",
          },
          {
            id: "us-3",
            role: isTr ? "Mağaza / Satıcı" : "Merchant / Vendor",
            want: isTr
              ? "Gelen siparişleri paketleyip tek tıkla kargo takip barkodu üretebilmek"
              : "To package incoming orders and generate shipping tracking barcodes with one click",
            soThat: isTr
              ? "Müşteriye otomatik kargo takip SMS'i gidip operasyonum hızlansın"
              : "Customers receive instant dispatch notifications with automated courier sync",
            priority: "P1",
          },
          {
            id: "us-4",
            role: isTr ? "Finans Yöneticisi" : "Finance Officer",
            want: isTr
              ? "Pazaryeri komisyonunu kesip satıcı hakedişlerini otomatik banka transferine hazırlayabilmek"
              : "To deduct marketplace commissions and schedule vendor payouts automatically",
            soThat: isTr
              ? "Manuel muhasebe hatalarını sıfıra indirip yasal e-fatura akışını sağlayabileyim"
              : "Manual accounting errors are eliminated with full tax compliance",
            priority: "P1",
          },
        ];

      case "SAAS_B2B_DASHBOARD":
        return [
          {
            id: "us-1",
            role: isTr ? "Şirket Yöneticisi (Organization Owner)" : "Organization Owner",
            want: isTr
              ? "Ekip arkadaşlarımı e-posta ile davet edip rol ve departman bazlı yetkiler (RBAC) tanımlayabilmek"
              : "To invite team members via email and assign granular role-based permissions",
            soThat: isTr
              ? "Hassas kurumsal verilere sadece yetkili kişilerin erişmesini güvence altına alayım"
              : "Sensitive company records remain accessible only to authorized roles",
            priority: "P0",
          },
          {
            id: "us-2",
            role: isTr ? "Operasyon Kullanıcısı" : "Operations User",
            want: isTr
              ? "Departman performans metriklerini interaktif grafiklerle görüntüleyip tek tıkla Excel/PDF raporu alabilmek"
              : "To visualize operational KPI graphs and export them to Excel/PDF reports with one click",
            soThat: isTr
              ? "Yönetim kurulu ve haftalık toplantılar için veri odaklı kararlar sunabileyim"
              : "I can deliver data-backed insights for weekly executive meetings",
            priority: "P1",
          },
          {
            id: "us-3",
            role: isTr ? "Şirket Yöneticisi" : "Account Admin",
            want: isTr
              ? "Kullandıkça öde (Pay-as-you-go) veya aylık paket aboneliğimi kredi kartıyla sorunsuz yönetebilmek"
              : "To manage recurring subscription plans and download VAT tax invoices smoothly",
            soThat: isTr
              ? "Hizmet kesintisi yaşamadan fatura geçmişimi muhasebeme iletebileyim"
              : "Billing uninterrupted with automated corporate invoicing",
            priority: "P1",
          },
        ];

      default:
        return [
          {
            id: "us-1",
            role: isTr ? "Son Kullanıcı" : "End User",
            want: isTr
              ? "Mobil ve web üzerinden hızlıca hesap oluşturup doğrulanmış oturum açabilmek"
              : "To seamlessly create an account and sign in across web and mobile",
            soThat: isTr
              ? "Platformun temel özelliklerinden kişiselleştirilmiş olarak faydalanabileyim"
              : "I can securely access personalized features and workflows",
            priority: "P0",
          },
          {
            id: "us-2",
            role: isTr ? "Kullanıcı" : "User",
            want: isTr
              ? "Sistem üzerinden gerçekleştirdiğim işlemleri anlık durum bildirimleriyle takip edebilmek"
              : "To track transactions and workflow states with real-time status notifications",
            soThat: isTr
              ? "Sürecin hangi aşamada olduğunu şeffaf bir şekilde görebileyim"
              : "I maintain full visibility on process completion milestones",
            priority: "P1",
          },
          {
            id: "us-3",
            role: isTr ? "Sistem Yöneticisi" : "System Administrator",
            want: isTr
              ? "Kullanıcı aktivitelerini, sistem sağlığını ve güvenlik loglarını merkezi bir panelden denetleyebilmek"
              : "To audit user activity, system health, and security logs from a centralized dashboard",
            soThat: isTr
              ? "Yetkisiz erişimleri ve teknik aksaklıkları anında tespit edip önleyebileyim"
              : "I can detect and prevent unauthorized access or downtime proactively",
            priority: "P1",
          },
        ];
    }
  }

  /**
   * Generates concrete, testable acceptance criteria.
   */
  static generateAcceptanceCriteria(
    domain: ProjectDomainAnalysis,
    locale: "tr" | "en" = "tr"
  ): AcceptanceCriterionItem[] {
    const isTr = locale === "tr";

    switch (domain.domainType) {
      case "ON_DEMAND_DELIVERY_TAXI":
        return [
          {
            id: "ac-1",
            category: isTr ? "Konum & Harita Doğruluğu" : "Geolocation & Map Tracking",
            description: isTr
              ? "Müşteri konumu GPS ile en fazla 15 metre hata payıyla tespit edilmeli; rota mesafesi ve varış süresi Google Maps / Mapbox API ile hesaplanmalıdır."
              : "Customer GPS coordinates must resolve within 15m tolerance; route distance and ETA must calculate via Google Maps / Mapbox API.",
          },
          {
            id: "ac-2",
            category: isTr ? "Gerçek Zamanlı İletişim (WebSocket)" : "Real-time Telemetry",
            description: isTr
              ? "Sürücü / Kurye koordinatları harita üzerinde maksimum 3 saniye gecikmeyle (WebSocket/SSE) akıcı animasyonla güncellenmelidir."
              : "Driver/courier telemetry on live map must refresh within 3s latency using WebSockets with smooth marker interpolation.",
          },
          {
            id: "ac-3",
            category: isTr ? "Ödeme & Hakediş Güvenliği" : "Payment & Fare Settlement",
            description: isTr
              ? "Yolculuk veya teslimat tamamlandığında ön provizyon tutarı otomatik olarak tahsil edilmeli ve müşteriye e-posta makbuzu gönderilmelidir."
              : "Upon ride completion, pre-authorized payment must capture automatically with receipt dispatch.",
          },
          {
            id: "ac-4",
            category: isTr ? "Çağrı Algoritması & Eşleşme" : "Dispatch Logic",
            description: isTr
              ? "Bir çağrı açıldığında en yakın 3 aktif sürücüye sırayla 15'er saniyelik kabul penceresi tanınmalı; kabul edilmezse sonraki sürücüye geçmelidir."
              : "Requests must broadcast to nearest active drivers with sequential 15-second acceptance windows.",
          },
        ];

      case "E_COMMERCE_MARKETPLACE":
        return [
          {
            id: "ac-1",
            category: isTr ? "Ödeme & 3D Secure Standardı" : "Payment & 3D Secure",
            description: isTr
              ? "Kredi kartı ödemeleri İyzico / PayTR üzerinden 3D Secure doğrulaması ile alınmalı; kart bilgileri PCI-DSS uyumlu olarak sunucuda asla düz metin saklanmamalıdır."
              : "Card transactions must enforce 3D Secure; raw card credentials must never hit server storage (PCI-DSS compliant tokenization).",
          },
          {
            id: "ac-2",
            category: isTr ? "Stok Rezervasyonu & Eşzamanlılık" : "Stock Locking",
            description: isTr
              ? "Kullanıcı checkout adımına geçtiğinde ürün stoğu 15 dakika kilitlenmeli (Redis TTL); ödeme başarısız olursa stok otomatik serbest bırakılmalıdır."
              : "Product inventory must lock for 15 minutes during checkout; released automatically on payment abandonment.",
          },
          {
            id: "ac-3",
            category: isTr ? "Kargo & Bildirim Entegrasyonu" : "Shipping Logistics",
            description: isTr
              ? "Sipariş kargoya verildiğinde kargo takip numarası otomatik üretilmeli ve müşteriye SMS ile takip linki iletilmelidir."
              : "Dispatch must generate carrier tracking barcode and trigger SMS notification with tracking URL.",
          },
        ];

      case "SAAS_B2B_DASHBOARD":
        return [
          {
            id: "ac-1",
            category: isTr ? "Multi-Tenant Veri Güvenliği" : "Multi-Tenant Isolation",
            description: isTr
              ? "Her şirketin verisi organizasyon kimliği (organization_id) ile izole edilmeli; tenant dışı sorgular veritabanı seviyesinde RLS (Row Level Security) ile engellenmelidir."
              : "All database queries must enforce tenant isolation via Row Level Security (RLS) preventing cross-organization leaks.",
          },
          {
            id: "ac-2",
            category: isTr ? "Yetkilendirme (RBAC)" : "Granular RBAC",
            description: isTr
              ? "Admin, Standart Kullanıcı ve Muhasebe rolleri için API uç noktalarında middleware yetki denetimi 403 Forbidden ile sonuçlanmalıdır."
              : "API middleware must restrict endpoint access according to user role returning 403 on unauthorized actions.",
          },
          {
            id: "ac-3",
            category: isTr ? "Rapor Dışa Aktarımı" : "Export & Performance",
            description: isTr
              ? "10.000 satıra kadar olan veri setleri arka plan kuyruğunda Excel/PDF olarak 5 saniye altında derlenip güvenli indirme linki üretmelidir."
              : "Reports up to 10k rows must compile to Excel/PDF in background worker within 5 seconds.",
          },
        ];

      default:
        return [
          {
            id: "ac-1",
            category: isTr ? "Performans ve Yüklenme Hızı" : "Performance & Core Web Vitals",
            description: isTr
              ? "Tüm ana sayfalar mobil cihazlarda Google Lighthouse performans testinden en az 85 puan almalı ve ilk açılış süresi (FCP) 1.5 saniyenin altında olmalıdır."
              : "Core pages must score 85+ on Lighthouse Mobile with First Contentful Paint under 1.5 seconds.",
          },
          {
            id: "ac-2",
            category: isTr ? "Güvenlik & Oturum Koruması" : "Security & Auth Guard",
            description: isTr
              ? "Kullanıcı parolaları bcrypt / argon2id ile tuzlanarak hashlenmeli; oturumlar HttpOnly ve Secure çerezler üzerinden yönetilmelidir."
              : "Passwords must hash with argon2id/bcrypt; sessions managed via HttpOnly Secure SameSite cookies.",
          },
          {
            id: "ac-3",
            category: isTr ? "Test Kapsamı & Kararlılık" : "Automated Test Coverage",
            description: isTr
              ? "Kritik iş akışları (kayıt, ödeme/işlem akışı) için otomatik uçtan uca (E2E / Vitest) testler yazılmalı ve CI/CD hattında testler geçmeden canlıya çıkılmamalıdır."
              : "Critical user journeys must include automated unit/integration tests passing in CI/CD pipeline before release.",
          },
        ];
    }
  }

  /**
   * Identifies external third-party infrastructure and API requirements.
   */
  static detectRequiredIntegrations(
    domain: ProjectDomainAnalysis,
    locale: "tr" | "en" = "tr"
  ): RequiredIntegrationItem[] {
    const isTr = locale === "tr";
    const items: RequiredIntegrationItem[] = [];

    // Payment Integration
    if (
      domain.domainType === "E_COMMERCE_MARKETPLACE" ||
      domain.domainType === "ON_DEMAND_DELIVERY_TAXI" ||
      domain.domainType === "SAAS_B2B_DASHBOARD" ||
      domain.domainType === "FINTECH_PAYMENTS"
    ) {
      items.push({
        name: isTr ? "Sanal POS ve Kart Ödeme Geçidi" : "Payment Gateway & 3D Secure",
        category: "PAYMENT",
        serviceExample: isTr ? "İyzico / PayTR / Stripe" : "Stripe / Adyen / Braintree",
        rationale: isTr
          ? "3D Secure ile güvenli kart çekimi, pazaryeri hakediş ayrıştırması ve otomatik fatura tetikleme."
          : "Secure 3D card transactions, marketplace split payouts, and automated invoicing.",
      });
    }

    // Maps & Location
    if (domain.domainType === "ON_DEMAND_DELIVERY_TAXI") {
      items.push({
        name: isTr ? "Harita, Rota ve Geocoding API" : "Interactive Maps & Geocoding",
        category: "MAPS_LOCATION",
        serviceExample: "Google Maps API / Mapbox / OpenStreetMap",
        rationale: isTr
          ? "Adres arama (Autocomplete), rota optimizasyonu, km hesabı ve harita üzerinde araç takip görselleştirmesi."
          : "Address autocomplete, route calculation, mileage estimation, and live courier map markers.",
      });
    }

    // SMS & Phone OTP
    if (
      domain.domainType === "ON_DEMAND_DELIVERY_TAXI" ||
      domain.domainType === "FINTECH_PAYMENTS" ||
      domain.domainType === "E_COMMERCE_MARKETPLACE"
    ) {
      items.push({
        name: isTr ? "SMS OTP ile Telefon Doğrulama" : "SMS OTP Verification",
        category: "SMS_AUTH",
        serviceExample: isTr ? "Netgsm / İletiMerkezi / Twilio" : "Twilio / MessageBird",
        rationale: isTr
          ? "Sahte hesapları engellemek, kurye/yolcu doğrulaması ve kritik işlemlerde 2FA güvenlik kodu."
          : "Prevents fraudulent registrations with instant 2FA one-time passwords.",
      });
    }

    // Media & File Storage
    items.push({
      name: isTr ? "Bulut Medya ve Dosya Depolama" : "Cloud Object Storage & CDN",
      category: "MEDIA_STORAGE",
      serviceExample: "AWS S3 / Cloudflare R2 / Supabase Storage",
      rationale: isTr
        ? "Ürün fotoğrafları, faturalar ve kullanıcı belgelerinin yüksek hızlı CDN ile sunulması."
        : "High-performance CDN asset delivery for user uploads, receipts, and avatars.",
    });

    // Push Notifications
    if (
      domain.domainType === "ON_DEMAND_DELIVERY_TAXI" ||
      domain.domainType === "SOCIAL_COMMUNITY" ||
      domain.domainType === "E_COMMERCE_MARKETPLACE"
    ) {
      items.push({
        name: isTr ? "Anlık Mobil Bildirimler (Push)" : "Push Notification Service",
        category: "NOTIFICATION",
        serviceExample: "Firebase Cloud Messaging (FCM) / OneSignal",
        rationale: isTr
          ? "Kurye yaklaştığında, sipariş durumunda veya mesaj geldiğinde kullanıcı cihazını anlık uyarma."
          : "Real-time mobile wakeups for ride updates, delivery dispatches, and incoming chats.",
      });
    }

    // Database & Caching
    items.push({
      name: isTr ? "Veri Tabanı ve Önbellek Altyapısı" : "Primary Database & Caching Tier",
      category: "DATABASE_CACHE",
      serviceExample: "PostgreSQL + Redis",
      rationale: isTr
        ? "İlişkisel ACID veri güvenliği, Redis ile anlık sepet/konum önbellekleme ve rate-limiting koruması."
        : "ACID relational persistence paired with Redis for sub-millisecond session & token caching.",
    });

    return items;
  }

  /**
   * Calculates realistic freelance market budget ranges and 3-phase delivery roadmap.
   */
  static estimateMarketBudgetAndPhases(
    domain: ProjectDomainAnalysis,
    locale: "tr" | "en" = "tr"
  ): MarketEstimateResult {
    const isTr = locale === "tr";

    // Base multipliers
    const complexityMultiplier = Math.max(1, domain.complexityScore);

    // Realistic market base in TRY
    const minBudget = Math.round((complexityMultiplier * 6000 + 15000) / 1000) * 1000;
    const maxBudget = Math.round((complexityMultiplier * 10500 + 25000) / 1000) * 1000;

    const estimatedWeeksMin = Math.max(3, Math.round(complexityMultiplier * 0.7));
    const estimatedWeeksMax = Math.max(5, Math.round(complexityMultiplier * 1.1));

    const phase1Weeks = Math.max(1, Math.round(estimatedWeeksMin * 0.3));
    const phase2Weeks = Math.max(2, Math.round(estimatedWeeksMin * 0.45));
    const phase3Weeks = Math.max(1, Math.round(estimatedWeeksMin * 0.25));

    const phases: DeliveryPhasePlan[] = [
      {
        phase: 1,
        percentage: 30,
        title: isTr ? "Sistem Mimarisi, Veri Tabanı & Kimlik Altyapısı" : "System Architecture, Database & Auth",
        durationWeeks: phase1Weeks,
        deliverables: isTr
          ? [
              "Veri tabanı şema tasarımı, tablolar ve indeksleme",
              "Kullanıcı kimlik doğrulama, oturum ve rol (RBAC) yetkilendirmesi",
              "Temel UI tasarım sistemi ve iskelet bileşenlerin kurulumu",
            ]
          : [
              "Relational schema architecture, migrations, and indexing",
              "Authentication, session management, and RBAC security guard",
              "Component design system and foundational project scaffolding",
            ],
      },
      {
        phase: 2,
        percentage: 40,
        title: isTr ? "Çekirdek İş Akışı, Arayüzler & Dış Servis Entegrasyonları" : "Core Business Logic, UI & Integrations",
        durationWeeks: phase2Weeks,
        deliverables: isTr
          ? [
              "Ana iş mantığı fonksiyonları ve operasyonel ekranlar",
              "Harici servis entegrasyonları (Ödeme, Harita, SMS, S3)",
              "Kullanıcı deneyimi testleri ve çalışan fonksiyonel prototip demosu",
            ]
          : [
              "Primary application flows and interactive user dashboards",
              "Third-party external integrations (Payments, Maps, SMS, S3)",
              "Functional end-to-end demo and stakeholder feedback iteration",
            ],
      },
      {
        phase: 3,
        percentage: 30,
        title: isTr ? "Güvenlik Denetimi, Testler, Canlıya Alma & Devir" : "Security Hardening, Testing, Deployment & Handover",
        durationWeeks: phase3Weeks,
        deliverables: isTr
          ? [
              "Yük ve güvenlik testleri, hata yakalama (exception handling)",
              "Üretim ortamı (Production) dağıtımı, SSL ve alan adı kurulumu",
              "Eksiksiz kaynak kod teslimi, mimari dokümantasyon ve devir teslim protokolü",
            ]
          : [
              "Penetration sanity testing, load profiling, and error boundary audit",
              "Production domain deployment, CI/CD pipeline, and SSL configuration",
              "Clean repository handover with documentation and statutory IP transfer",
            ],
      },
    ];

    return {
      minBudget,
      maxBudget,
      currency: "TRY",
      estimatedWeeksMin,
      estimatedWeeksMax,
      phases,
    };
  }

  /**
   * Synthesizes all elements into an official, comprehensive PRD specification in Markdown.
   */
  static synthesizeFullPrdMarkdown(input: PrdArchitectInput): string {
    const isTr = input.locale !== "en";
    const analysis = this.analyzeProjectDomain(input.title, input.summary, input.categorySlug);
    const userStories = this.generateUserStories(analysis, isTr ? "tr" : "en");
    const acceptanceCriteria = this.generateAcceptanceCriteria(analysis, isTr ? "tr" : "en");
    const integrations = this.detectRequiredIntegrations(analysis, isTr ? "tr" : "en");
    const marketEstimate = this.estimateMarketBudgetAndPhases(analysis, isTr ? "tr" : "en");

    const lines: string[] = [];

    // 1. Title & Executive Summary
    lines.push(isTr ? "# ÜRÜN GEREKSİNİMLERİ DOKÜMANI (PRD)" : "# PRODUCT REQUIREMENTS DOCUMENT (PRD)");
    lines.push(isTr ? `**Proje Başlığı:** ${input.title}` : `**Project Title:** ${input.title}`);
    lines.push(isTr ? `**Tespit Edilen Alan:** ${analysis.domainLabel}` : `**Domain Archetype:** ${analysis.domainLabelEn}`);
    lines.push("");

    lines.push(isTr ? "## 1. Proje Özeti ve Kapsam Çerçevesi" : "## 1. Executive Summary & Problem Context");
    lines.push(input.summary.trim());
    lines.push("");

    if (analysis.detectedFeatures.length > 0) {
      lines.push(isTr ? "### Temel Fonksiyonel Nitelikler:" : "### Core Functional Highlights:");
      for (const feat of analysis.detectedFeatures) {
        lines.push(`- ${feat}`);
      }
      lines.push("");
    }

    // 2. Agile User Stories
    lines.push(isTr ? "## 2. Kullanıcı Hikayeleri (User Stories)" : "## 2. Agile User Stories (INVEST Model)");
    for (const us of userStories) {
      lines.push(
        isTr
          ? `- **[${us.priority}] ${us.role} olarak;** ${us.want} istiyorum; **böylece** ${us.soThat}.`
          : `- **[${us.priority}] As a ${us.role};** I want to ${us.want}; **so that** ${us.soThat}.`
      );
    }
    lines.push("");

    // 3. Acceptance Criteria
    lines.push(isTr ? "## 3. Kabul Kriterleri (Acceptance Criteria)" : "## 3. Testable Acceptance Criteria");
    for (const ac of acceptanceCriteria) {
      lines.push(`- **[ ] ${ac.category}:** ${ac.description}`);
    }
    lines.push("");

    // 4. External Integrations
    lines.push(isTr ? "## 4. Gerekli Dış Servisler ve Altyapı Entegrasyonları" : "## 4. Required External Integrations & Cloud Infrastructure");
    for (const it of integrations) {
      lines.push(`- **${it.name} (${it.serviceExample}):** ${it.rationale}`);
    }
    lines.push("");

    // 5. 3-Phase Roadmap & Delivery Milestones
    lines.push(isTr ? "## 5. Tavsiye Edilen 3 Aşamalı Teslimat Çizelgesi" : "## 5. Recommended 3-Phase Delivery Roadmap");
    for (const ph of marketEstimate.phases) {
      lines.push(
        isTr
          ? `### ${ph.phase}. Aşama (%${ph.percentage}): ${ph.title} (~${ph.durationWeeks} Hafta)`
          : `### Phase ${ph.phase} (${ph.percentage}%): ${ph.title} (~${ph.durationWeeks} Weeks)`
      );
      for (const d of ph.deliverables) {
        lines.push(`  - ${d}`);
      }
    }
    lines.push("");

    // 6. Realistic Budget Benchmark Notice
    lines.push(isTr ? "## 6. Piyasa Maliyet ve Süre Öngörüsü" : "## 6. Realistic Market Benchmark");
    lines.push(
      isTr
        ? `Bu kapsamdaki profesyonel bir çalışmanın Türkiye ve küresel pazar standartlarında tahmini bütçe aralığı **${marketEstimate.minBudget.toLocaleString("tr-TR")} TL - ${marketEstimate.maxBudget.toLocaleString("tr-TR")} TL**, öngörülen teslim süresi ise **${marketEstimate.estimatedWeeksMin}-${marketEstimate.estimatedWeeksMax} hafta** aralığındadır.`
        : `Expected freelance market benchmark for this specification: **${marketEstimate.minBudget.toLocaleString("en-US")} - ${marketEstimate.maxBudget.toLocaleString("en-US")} ${marketEstimate.currency}**, with an estimated duration of **${marketEstimate.estimatedWeeksMin}-${marketEstimate.estimatedWeeksMax} weeks**.`
    );

    return lines.join("\n");
  }

  /**
   * Main orchestrator combining all analysis and synthesis steps into a single result.
   */
  static architectProjectPrd(input: PrdArchitectInput): PrdArchitectResult {
    const locale = input.locale === "en" ? "en" : "tr";
    const analysis = this.analyzeProjectDomain(input.title, input.summary, input.categorySlug);
    const userStories = this.generateUserStories(analysis, locale);
    const acceptanceCriteria = this.generateAcceptanceCriteria(analysis, locale);
    const integrations = this.detectRequiredIntegrations(analysis, locale);
    const marketEstimate = this.estimateMarketBudgetAndPhases(analysis, locale);
    const synthesizedPrdMarkdown = this.synthesizeFullPrdMarkdown(input);

    return {
      analysis,
      userStories,
      acceptanceCriteria,
      integrations,
      marketEstimate,
      synthesizedPrdMarkdown,
    };
  }
}
