import type {
  ScopeArchetype,
  ArchetypeProfile,
  ScopeInterviewQuestion,
} from "../acceptance-types";

export const ARCHETYPE_PROFILES: Record<ScopeArchetype, ArchetypeProfile> = {
  SAAS_B2B_DASHBOARD: {
    archetype: "SAAS_B2B_DASHBOARD",
    labelTr: "B2B SaaS & Yönetim Paneli",
    labelEn: "B2B SaaS & Admin Dashboard",
    descriptionTr: "Yönetici panelleri, CRM, ERP, analitik ekranları ve rol bazlı kurumsal sistemler.",
    descriptionEn: "Enterprise admin portals, CRM, ERP, analytics dashboards, and role-based access.",
    iconName: "LayoutDashboard",
    keywords: [
      "panel",
      "yonetim",
      "dashboard",
      "crm",
      "erp",
      "admin",
      "raporlama",
      "rbac",
      "saas",
      "portal",
      "tablo",
      "grafik",
    ],
  },
  E_COMMERCE_MARKETPLACE: {
    archetype: "E_COMMERCE_MARKETPLACE",
    labelTr: "E-Ticaret & Pazaryeri",
    labelEn: "E-Commerce & Marketplace",
    descriptionTr: "Ürün kataloğu, sepet, ödeme adımları, kargo entegrasyonu ve satıcı panelleri.",
    descriptionEn: "Product catalog, shopping cart, checkout, cargo integrations, and vendor portals.",
    iconName: "ShoppingCart",
    keywords: [
      "e-ticaret",
      "eticaret",
      "sepet",
      "siparis",
      "pazaryeri",
      "marketplace",
      "magaza",
      "kargo",
      "urun",
      "odeme",
      "checkout",
      "fatura",
    ],
  },
  MOBILE_ON_DEMAND: {
    archetype: "MOBILE_ON_DEMAND",
    labelTr: "Mobil Hizmet & Canlı Kurye/Takip",
    labelEn: "Mobile On-Demand & Mobility",
    descriptionTr: "Kurye, araç çağırma, canlı harita takibi, anlık sipariş ve mobil uygulamalar.",
    descriptionEn: "Courier, taxi/ride-hailing, live GPS tracking, instant dispatch, and mobile apps.",
    iconName: "MapPin",
    keywords: [
      "kurye",
      "taksi",
      "canli konum",
      "harita",
      "mobil uygulama",
      "flutter",
      "react native",
      "gps",
      "rota",
      "teslimat",
      "surucu",
    ],
  },
  FINTECH_PAYMENTS: {
    archetype: "FINTECH_PAYMENTS",
    labelTr: "Fintech & Dijital Cüzdan",
    labelEn: "Fintech & Digital Wallet",
    descriptionTr: "Ödeme altyapısı, sanal POS, bakiye, para transferi ve çift girişli muhasebe defteri.",
    descriptionEn: "Payment gateways, virtual POS, balances, money transfers, and ledger accounting.",
    iconName: "Wallet",
    keywords: [
      "fintech",
      "cuzdan",
      "sanal pos",
      "pos",
      "para transferi",
      "iban",
      "bakiye",
      "kredi karti",
      "odeme",
      "tahsilat",
      "banka",
    ],
  },
  CONTENT_PORTFOLIO_LANDING: {
    archetype: "CONTENT_PORTFOLIO_LANDING",
    labelTr: "Kurumsal Web & Tanıtım / Landing",
    labelEn: "Corporate Web & Landing Page",
    descriptionTr: "Dönüşüm odaklı landing sayfaları, kurumsal vitrin siteleri, SEO ve blog altyapıları.",
    descriptionEn: "Conversion-optimized landing pages, corporate websites, SEO, and CMS blog.",
    iconName: "Globe",
    keywords: [
      "landing",
      "tanitim",
      "kurumsal web",
      "web sitesi",
      "seo",
      "blog",
      "vitrin",
      "tasarim",
      "figma",
      "portfolyo",
      "brosur",
    ],
  },
  AI_AGENT_AUTOMATION: {
    archetype: "AI_AGENT_AUTOMATION",
    labelTr: "Yapay Zeka & Otomasyon Botu",
    labelEn: "AI Agent & Workflow Automation",
    descriptionTr: "Veri kazıma (scraping), botlar, LLM/OpenAI entegrasyonu ve otomatik iş akışları.",
    descriptionEn: "Web scrapers, bots, LLM workflows, automated data processing pipelines, and webhooks.",
    iconName: "Cpu",
    keywords: [
      "bot",
      "otomasyon",
      "scraping",
      "yapay zeka",
      "ai",
      "llm",
      "agent",
      "webhook",
      "veri kazima",
      "entegrasyon",
      "cron",
    ],
  },
  API_BACKEND_INTEGRATION: {
    archetype: "API_BACKEND_INTEGRATION",
    labelTr: "Backend API & Veritabanı Mimarisi",
    labelEn: "Backend API & Cloud Architecture",
    descriptionTr: "RESTful/GraphQL API uç noktaları, veritabanı şemaları, mikroservisler ve Docker altyapısı.",
    descriptionEn: "REST/GraphQL endpoints, DB migrations, microservices, and Docker/cloud infrastructure.",
    iconName: "Server",
    keywords: [
      "api",
      "backend",
      "veritabani",
      "database",
      "postgresql",
      "sql",
      "mikroservis",
      "docker",
      "graphql",
      "rest",
      "sunucu",
    ],
  },
  CUSTOM_GENERAL: {
    archetype: "CUSTOM_GENERAL",
    labelTr: "Özel Yazılım & Teknoloji Projesi",
    labelEn: "Custom Software Engineering",
    descriptionTr: "Genel amaçlı yazılım geliştirme, entegrasyon ve teknik modernizasyon çalışmaları.",
    descriptionEn: "General purpose software engineering, system integration, and modernization.",
    iconName: "Code",
    keywords: ["yazilim", "proje", "gelistirme", "kod", "sistem", "uygulama"],
  },
};

/**
 * Returns human-friendly, 3-to-4 interactive scope questions for the given archetype.
 */
export function getInterviewQuestions(archetype: ScopeArchetype): ScopeInterviewQuestion[] {
  switch (archetype) {
    case "SAAS_B2B_DASHBOARD":
      return [
        {
          slotKey: "auth_roles",
          titleTr: "Bu paneli kimler kullanacak?",
          titleEn: "Who will access and manage this dashboard?",
          subtitleTr: "Kullanıcı yetki ve giriş sınırlarını belirleyin.",
          subtitleEn: "Define user roles and login permission boundaries.",
          defaultOptionValue: "multi_roles",
          options: [
            {
              value: "single_admin",
              labelTr: "Yalnızca Tek Yönetici (Sadece Ben)",
              labelEn: "Single Admin (Owner Only)",
              descriptionTr: "Tek bir e-posta ve şifre ile girilen sade panel.",
              descriptionEn: "Streamlined dashboard accessed by a single super-admin.",
            },
            {
              value: "multi_roles",
              labelTr: "Farklı Roller (Admin, Editör, Muhasebe)",
              labelEn: "Role-Based Access (Admin, Editor, Finance)",
              descriptionTr: "Her kullanıcının yetkisine göre menü ve işlem kısıtlaması.",
              descriptionEn: "Menu and action restrictions tailored to user permissions.",
            },
            {
              value: "client_multitenant",
              labelTr: "Müşteriler de Kendi Panelini Görecek (Çoklu Şirket)",
              labelEn: "Multi-Tenant Client Portal",
              descriptionTr: "Her kurumsal müşteri yalnızca kendi verilerini görür.",
              descriptionEn: "Isolated workspace where each company only views their records.",
            },
          ],
        },
        {
          slotKey: "data_source",
          titleTr: "Veriler nereden gelecek?",
          titleEn: "What is the primary data source?",
          subtitleTr: "Sistemin veritabanı veya API bağlantı yapısı.",
          subtitleEn: "Database setup or external API connection model.",
          defaultOptionValue: "scratch_db",
          options: [
            {
              value: "scratch_db",
              labelTr: "Sıfırdan Yeni Veritabanı Kurulacak",
              labelEn: "Fresh Greenfield Database",
              descriptionTr: "PostgreSQL / MySQL şeması ve modeller sıfırdan tasarlanır.",
              descriptionEn: "New PostgreSQL/MySQL relational schema designed from scratch.",
            },
            {
              value: "existing_api",
              labelTr: "Hazır REST / GraphQL API'mize Bağlanacak",
              labelEn: "Existing REST / GraphQL API",
              descriptionTr: "Mevcut backend servisleriyle JSON haberleşmesi kurulur.",
              descriptionEn: "Frontend communicates with existing client API endpoints.",
            },
            {
              value: "excel_csv_import",
              labelTr: "Excel / CSV Dosyaları Yüklenerek İşlenecek",
              labelEn: "Excel / CSV File Upload Pipeline",
              descriptionTr: "Kullanıcı dosya yükler, sistem satırları veritabanına aktarır.",
              descriptionEn: "Bulk spreadsheets uploaded and parsed into database records.",
            },
          ],
        },
        {
          slotKey: "reporting_output",
          titleTr: "Veriler nasıl dışa aktarılacak?",
          titleEn: "How should data reports be exported?",
          subtitleTr: "İşverenin ve kullanıcıların ihtiyaç duyduğu çıktı formatı.",
          subtitleEn: "Output formats required for business analytics.",
          defaultOptionValue: "excel_csv",
          options: [
            {
              value: "screen_only",
              labelTr: "Sadece Ekranda Tablo ve Grafikler",
              labelEn: "On-Screen Interactive Charts Only",
              descriptionTr: "Tarayıcı üzerinde filtreleme ve pagination.",
              descriptionEn: "Interactive UI filters, pagination, and sorting only.",
            },
            {
              value: "excel_csv",
              labelTr: "Excel (.xlsx) ve CSV İndirme Desteği",
              labelEn: "Excel (.xlsx) & CSV Downloads",
              descriptionTr: "Filtrelenmiş listenin tek tıkla Excel olarak indirilmesi.",
              descriptionEn: "Export active filtered rows directly to spreadsheet files.",
            },
            {
              value: "pdf_official",
              labelTr: "Resmi PDF Rapor ve Fatura/Makbuz Çıktısı",
              labelEn: "Print-Ready PDF Documents & Invoices",
              descriptionTr: "Şirket logolu, formatlanmış resmi PDF oluşturma.",
              descriptionEn: "Branded, formatted PDF document generation.",
            },
          ],
        },
      ];

    case "E_COMMERCE_MARKETPLACE":
      return [
        {
          slotKey: "store_model",
          titleTr: "Satış modeli nasıl olacak?",
          titleEn: "What is the storefront business model?",
          subtitleTr: "Tek mağaza mı yoksa çok satıcılı pazaryeri mi?",
          subtitleEn: "Single brand direct store vs multi-vendor marketplace.",
          defaultOptionValue: "single_brand",
          options: [
            {
              value: "single_brand",
              labelTr: "Tek Marka / Kendi Ürünlerimiz",
              labelEn: "Single Brand Direct Store",
              descriptionTr: "Yalnızca şirketimizin ürünleri listelenip satılacak.",
              descriptionEn: "Direct-to-consumer store for single company inventory.",
            },
            {
              value: "multi_vendor",
              labelTr: "Pazaryeri (Farklı Satıcılar Mağaza Açacak)",
              labelEn: "Multi-Vendor Marketplace",
              descriptionTr: "Dış satıcılar ürün ekler, komisyon otomatik ayrışır.",
              descriptionEn: "Independent vendors manage storefronts with commission splits.",
            },
          ],
        },
        {
          slotKey: "payment_system",
          titleTr: "Ödeme altyapısı ne olacak?",
          titleEn: "Which payment gateway will be integrated?",
          subtitleTr: "Kredi kartı tahsilat modeli.",
          subtitleEn: "Credit card and checkout payment flow.",
          defaultOptionValue: "vpos_iyzico",
          options: [
            {
              value: "vpos_iyzico",
              labelTr: "İyzico / PayTR / Param / Stripe ile 3D Secure",
              labelEn: "3D Secure Virtual POS (Iyzico, Stripe)",
              descriptionTr: "Kredi kartıyla güvenli anlık ödeme ve webhook bildirimi.",
              descriptionEn: "Instant secure credit card processing with 3D Secure webhooks.",
            },
            {
              value: "bank_transfer",
              labelTr: "Havale / EFT ve Dekont Onayı",
              labelEn: "Bank Wire Transfer & Slip Verification",
              descriptionTr: "Müşteri IBAN'a para gönderir, yönetici siparişi onaylar.",
              descriptionEn: "Manual bank wire confirmation with slip upload.",
            },
          ],
        },
        {
          slotKey: "cargo_integration",
          titleTr: "Kargo ve sipariş takibi nasıl işleyecek?",
          titleEn: "How will shipping and tracking operate?",
          subtitleTr: "Lojistik süreçlerin entegrasyon seviyesi.",
          subtitleEn: "Logistics and shipping label automation.",
          defaultOptionValue: "manual_code",
          options: [
            {
              value: "manual_code",
              labelTr: "Yönetici Kargo Takip Numarasını Elle Girecek",
              labelEn: "Manual Tracking Code Entry",
              descriptionTr: "Sipariş kargoya verildiğinde müşteriye SMS/e-posta gider.",
              descriptionEn: "Admin enters tracking code and triggers email to buyer.",
            },
            {
              value: "automated_api",
              labelTr: "Yurtiçi / Aras / MNG API ile Otomatik Barkod",
              labelEn: "Automated Carrier API & Label Barcode",
              descriptionTr: "Sipariş düşünce otomatik kargo barkodu ve fişi basılır.",
              descriptionEn: "Instant shipping label generation via courier API.",
            },
          ],
        },
      ];

    case "MOBILE_ON_DEMAND":
      return [
        {
          slotKey: "mobile_platform",
          titleTr: "Uygulama hangi platformlarda çalışacak?",
          titleEn: "Target mobile operating systems?",
          subtitleTr: "İşletim sistemi hedefi.",
          subtitleEn: "Supported client operating systems.",
          defaultOptionValue: "cross_platform",
          options: [
            {
              value: "cross_platform",
              labelTr: "Hem iOS (App Store) Hem Android (Google Play)",
              labelEn: "Both iOS & Android (Flutter / React Native)",
              descriptionTr: "Tek kod tabanıyla iki platformda da çalışır.",
              descriptionEn: "Single cross-platform build for App Store & Google Play.",
            },
            {
              value: "android_first",
              labelTr: "Yalnızca Android (Faz 1)",
              labelEn: "Android First",
              descriptionTr: "Hızlı MVP için yalnızca Google Play hedeflenir.",
              descriptionEn: "Focused on Google Play Store for initial fast release.",
            },
          ],
        },
        {
          slotKey: "location_tracking",
          titleTr: "Harita ve konum takibi nasıl olacak?",
          titleEn: "How will location tracking function?",
          subtitleTr: "GPS ve rota takip ihtiyacı.",
          subtitleEn: "GPS tracking and routing requirements.",
          defaultOptionValue: "live_gps",
          options: [
            {
              value: "live_gps",
              labelTr: "Canlı GPS Takibi (Haritada Kurye/Araç Hareketi)",
              labelEn: "Live GPS Tracking on Map",
              descriptionTr: "WebSocket / Firebase ile saniyelik konum güncellemesi.",
              descriptionEn: "Sub-second realtime vehicle movement via WebSockets/Firebase.",
            },
            {
              value: "static_pin",
              labelTr: "Sabit Adres Seçimi ve Mesafe Hesabı",
              labelEn: "Static Address Pin & Distance Calculation",
              descriptionTr: "Kullanıcı adresi haritadan seçer, mesafe ücreti hesaplanır.",
              descriptionEn: "Point-to-point pin drop with fixed distance pricing.",
            },
          ],
        },
      ];

    case "FINTECH_PAYMENTS":
      return [
        {
          slotKey: "fintech_core",
          titleTr: "Bakiye ve işlem kaydı nasıl tutulacak?",
          titleEn: "How will financial balances and records be stored?",
          subtitleTr: "Finansal doğruluk ve mutabakat mimarisi.",
          subtitleEn: "Financial integrity and ledger bookkeeping model.",
          defaultOptionValue: "double_entry",
          options: [
            {
              value: "double_entry",
              labelTr: "Çift Girişli Muhasebe Defteri (Double-Entry Ledger)",
              labelEn: "Double-Entry Ledger Architecture",
              descriptionTr: "Her işlemde borç/alacak dengesi kesinlikle eşit olmalıdır.",
              descriptionEn: "Zero-sum balanced debit/credit transactions for zero discrepancies.",
            },
            {
              value: "single_wallet",
              labelTr: "Kullanıcı Bazlı Tekil Cüzdan Bakiyesi",
              labelEn: "Single Wallet Available Balance",
              descriptionTr: "Kullanıcı yükleme yapar, harcadıkça bakiye düşer.",
              descriptionEn: "Simple top-up and spend wallet balance model.",
            },
          ],
        },
        {
          slotKey: "kyc_verification",
          titleTr: "Kimlik doğrulama (KYC) zorunlu mu?",
          titleEn: "Is identity verification (KYC) required?",
          subtitleTr: "Yasal mevzuat ve kullanıcı doğrulama seviyesi.",
          subtitleEn: "Statutory compliance and AML verification.",
          defaultOptionValue: "sms_otp",
          options: [
            {
              value: "sms_otp",
              labelTr: "Telefon Numarası ve SMS Doğrulaması Yeterli",
              labelEn: "Phone Number & SMS OTP Only",
              descriptionTr: "Kullanıcı SMS koduyla anında kayıt olur.",
              descriptionEn: "Frictionless onboarding via SMS 6-digit OTP code.",
            },
            {
              value: "tckn_gib_kyc",
              labelTr: "TCKN / VKN ve Kimlik Kartı Doğrulaması",
              labelEn: "Full Statutory KYC (National ID / Tax ID)",
              descriptionTr: "Nüfus / Vergi Dairesi teyidiyle kimlik doğrulanır.",
              descriptionEn: "Govt ID number validation and identity check.",
            },
          ],
        },
      ];

    case "CONTENT_PORTFOLIO_LANDING":
      return [
        {
          slotKey: "cms_model",
          titleTr: "İçerikleri kim ve nasıl güncelleyecek?",
          titleEn: "How will website content be managed?",
          subtitleTr: "Metin ve görsellerin yönetim modeli.",
          subtitleEn: "Content publishing workflow.",
          defaultOptionValue: "simple_admin_cms",
          options: [
            {
              value: "simple_admin_cms",
              labelTr: "Kolay Yönetim Paneli (Kod Bilmeden Değiştirme)",
              labelEn: "Admin CMS (No-Code Content Updates)",
              descriptionTr: "İşveren dilediği metni, fiyatı ve görseli panelden günceller.",
              descriptionEn: "Employer can edit headlines, copy, and images via admin dashboard.",
            },
            {
              value: "static_code",
              labelTr: "Sabit Kod (İçerik Seyrek Değişecek)",
              labelEn: "Static High-Speed Code",
              descriptionTr: "Maksimum hız ve SEO için statik olarak teslim edilir.",
              descriptionEn: "Blazing fast pre-rendered static site with zero database overhead.",
            },
          ],
        },
        {
          slotKey: "lead_conversion",
          titleTr: "Ziyaretçiler sizinle nasıl iletişim kuracak?",
          titleEn: "How should visitors submit inquiries?",
          subtitleTr: "Gelen müşteri taleplerinin toplanma yöntemi.",
          subtitleEn: "Lead capture and communication pipeline.",
          defaultOptionValue: "form_and_whatsapp",
          options: [
            {
              value: "form_and_whatsapp",
              labelTr: "İletişim Formu + Doğrudan WhatsApp Butonu",
              labelEn: "Contact Form & Direct WhatsApp Button",
              descriptionTr: "Form bilgisi e-postaya düşer, WhatsApp anında sohbet açar.",
              descriptionEn: "Form submits to notification inbox with 1-click WhatsApp chat.",
            },
            {
              value: "crm_integration",
              labelTr: "Harici CRM / E-Posta Pazarlama Entegrasyonu",
              labelEn: "CRM & Email Marketing Pipeline",
              descriptionTr: "Toplanan talepler HubSpot / Mailchimp'e aktarılır.",
              descriptionEn: "Inquiries synced directly to CRM/Mailchimp via webhook.",
            },
          ],
        },
      ];

    case "AI_AGENT_AUTOMATION":
      return [
        {
          slotKey: "automation_trigger",
          titleTr: "Otomasyon ne zaman ve nasıl çalışacak?",
          titleEn: "How will the automation workflow be triggered?",
          subtitleTr: "İş akışının başlama yöntemi.",
          subtitleEn: "Execution trigger for the automated agent.",
          defaultOptionValue: "webhook_event",
          options: [
            {
              value: "webhook_event",
              labelTr: "Olay Bazlı (Webhook Geldiğinde Anında)",
              labelEn: "Event-Driven (Instant Webhook Response)",
              descriptionTr: "Harici sistemden istek geldiğinde saniyeler içinde işler.",
              descriptionEn: "Sub-second execution upon receiving third-party webhook payload.",
            },
            {
              value: "scheduled_cron",
              labelTr: "Zaman Ayarlı (Örn: Her Gece 03:00'te)",
              labelEn: "Scheduled Periodic Cron Job",
              descriptionTr: "Belirli saatlerde otomatik toplu veri işleme yapar.",
              descriptionEn: "Runs automatically at scheduled intervals (e.g. nightly bulk batch).",
            },
          ],
        },
        {
          slotKey: "error_handling",
          titleTr: "Beklenmeyen bir hata olursa ne yapılmalı?",
          titleEn: "How should unexpected task errors be handled?",
          subtitleTr: "Hata dayanıklılığı ve bildirim stratejisi.",
          subtitleEn: "Resilience, retry policy, and notification strategy.",
          defaultOptionValue: "retry_and_alert",
          options: [
            {
              value: "retry_and_alert",
              labelTr: "3 Kez Tekrar Dene, Çözülmezse E-Posta / Telegram Uyarısı Gönder",
              labelEn: "3x Exponential Retry + Telegram/Email Alert",
              descriptionTr: "Sistem durmaz; log kaydeder ve sorumluya anında alarm verir.",
              descriptionEn: "Logs exception, retries 3 times, and dispatches urgent notification.",
            },
            {
              value: "silent_log",
              labelTr: "Hatalı Kaydı Atla, Günlük Dosyasına (Log) Kaydet",
              labelEn: "Skip Failed Row & Append to Audit Log",
              descriptionTr: "Hatalı satır pas geçilir, diğer işlemler aksatılmadan sürer.",
              descriptionEn: "Non-blocking execution; logs failure reason to report table.",
            },
          ],
        },
      ];

    case "API_BACKEND_INTEGRATION":
      return [
        {
          slotKey: "api_style",
          titleTr: "API mimarisi ve dokümantasyonu nasıl olmalı?",
          titleEn: "API design specification & documentation standard?",
          subtitleTr: "Frontend veya mobil ekiplerin entegrasyonu için.",
          subtitleEn: "Contract specifications for frontend/mobile consumers.",
          defaultOptionValue: "rest_swagger",
          options: [
            {
              value: "rest_swagger",
              labelTr: "RESTful JSON API + İnteraktif Swagger / OpenAPI Dokümanı",
              labelEn: "RESTful JSON + Interactive Swagger / OpenAPI Docs",
              descriptionTr: "Tüm uç noktalar Postman ve Swagger üzerinden test edilebilir.",
              descriptionEn: "Endpoints documented with runnable OpenAPI/Swagger UI.",
            },
            {
              value: "graphql_typed",
              labelTr: "GraphQL Şeması ve Tip Güvenli Uç Noktalar",
              labelEn: "Type-Safe GraphQL Schema",
              descriptionTr: "İstemci yalnızca ihtiyaç duyduğu alanları talep eder.",
              descriptionEn: "Unified typed GraphQL schema for dynamic data querying.",
            },
          ],
        },
        {
          slotKey: "deployment_target",
          titleTr: "Sistem nereye kurulup teslim edilecek?",
          titleEn: "Where should the backend system be deployed?",
          subtitleTr: "Canlıya alma ve barındırma ortamı.",
          subtitleEn: "Target runtime environment and orchestration.",
          defaultOptionValue: "docker_cloud",
          options: [
            {
              value: "docker_cloud",
              labelTr: "Docker Compose ile İşverenin Bulut Sunucusuna (VPS / AWS / Hetzner)",
              labelEn: "Dockerized on Client Cloud VPS (Hetzner, AWS, DigitalOcean)",
              descriptionTr: "Tek komutla `docker compose up -d` ile ayağa kalkan kurulum.",
              descriptionEn: "Containerized setup with 1-command startup and healthcheck.",
            },
            {
              value: "serverless_vercel_supabase",
              labelTr: "Serverless Altyapı (Vercel / Supabase / Cloudflare)",
              labelEn: "Serverless (Vercel, Supabase, Cloudflare Workers)",
              descriptionTr: "Sunucu yönetimi gerektirmeyen modern sunucusuz altyapı.",
              descriptionEn: "Fully managed serverless endpoints with zero DevOps maintenance.",
            },
          ],
        },
      ];

    case "CUSTOM_GENERAL":
    default:
      return [
        {
          slotKey: "ui_readiness",
          titleTr: "Arayüz tasarımı hazır mı?",
          titleEn: "Are UI / UX design assets prepared?",
          subtitleTr: "Tasarım ve görsel kaynakların başlangıç durumu.",
          subtitleEn: "Status of wireframes or design prototypes.",
          defaultOptionValue: "figma_ready",
          options: [
            {
              value: "figma_ready",
              labelTr: "Figma / Tasarım Dosyaları Tamamen Hazır",
              labelEn: "Figma / UI Specs Fully Prepared",
              descriptionTr: "Yazılımcı doğrudan tasarıma birebir sadık kalarak kodlar.",
              descriptionEn: "Developer strictly implements pixel-perfect design specs.",
            },
            {
              value: "dev_designs_ui",
              labelTr: "Arayüzü de Yazılımcı Modern Standartlara Göre Tasarlamalı",
              labelEn: "Developer Creates Clean Modern UI",
              descriptionTr: "Temiz, modern ve responsive standart bileşenler kullanılır.",
              descriptionEn: "Developer crafts responsive, aesthetic UI using clean component kit.",
            },
          ],
        },
        {
          slotKey: "testing_assurance",
          titleTr: "Teslimatta hangi teknik kontroller zorunlu olsun?",
          titleEn: "Which verification criteria are mandatory at delivery?",
          subtitleTr: "Hatasız ve eksiksiz teslimatın kanıtlanması.",
          subtitleEn: "Quality verification standards before sign-off.",
          defaultOptionValue: "responsive_and_tests",
          options: [
            {
              value: "responsive_and_tests",
              labelTr: "Tüm Cihazlarda (Mobil + Masaüstü) Kusursuz Çalışma & Birim Testler",
              labelEn: "Cross-Device Responsive & Automated Test Passing",
              descriptionTr: "Sıfır konsol hatası ve temel akışların testten geçmesi.",
              descriptionEn: "Zero runtime errors, cross-browser compatibility, and passing tests.",
            },
            {
              value: "functional_code_only",
              labelTr: "Çalışır Kaynak Kod ve Kolay Kurulum Dokümanı (README)",
              labelEn: "Functional Source Code & Clear README Runbook",
              descriptionTr: "Sistemin adımları takip edilerek kolayca çalıştırılabilmesi.",
              descriptionEn: "Code builds and runs smoothly by following documented steps.",
            },
          ],
        },
      ];
  }
}
