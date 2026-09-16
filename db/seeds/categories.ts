export interface SeedSector {
  key: string;
  sortOrder: number;
  icon: string;
  translations: {
    tr: { name: string; description: string };
    en: { name: string; description: string };
  };
}

export interface SeedCategory {
  key: string;
  sectorKey: string;
  sortOrder: number;
  translations: {
    tr: { name: string; description: string };
    en: { name: string; description: string };
  };
}

export const SEED_SECTORS: SeedSector[] = [
  {
    key: "sector-software-it",
    sortOrder: 1,
    icon: "Code2",
    translations: {
      tr: {
        name: "Yazılım ve Bilişim Teknolojileri",
        description: "Web, mobil, bulut, sistem mimarisi ve kurumsal yazılım çözümleri.",
      },
      en: {
        name: "Software & Information Technology",
        description: "Web, mobile, cloud, system architecture, and enterprise software solutions.",
      },
    },
  },
  {
    key: "sector-ai-data",
    sortOrder: 2,
    icon: "Cpu",
    translations: {
      tr: {
        name: "Yapay Zeka, Veri ve Otomasyon",
        description: "Büyük dil modelleri, veri mühendisliği, iş akışı otomasyonu ve analitik.",
      },
      en: {
        name: "AI, Data & Automation",
        description: "Large language models, data engineering, workflow automation, and analytics.",
      },
    },
  },
  {
    key: "sector-design-creative",
    sortOrder: 3,
    icon: "Palette",
    translations: {
      tr: {
        name: "Tasarım ve Yaratıcı Sanatlar",
        description: "Kullanıcı arayüzü, marka kimliği, illüstrasyon ve görsel iletişim tasarımı.",
      },
      en: {
        name: "Design & Creative Arts",
        description:
          "User interface, brand identity, illustration, and visual communication design.",
      },
    },
  },
  {
    key: "sector-marketing-growth",
    sortOrder: 4,
    icon: "TrendingUp",
    translations: {
      tr: {
        name: "Dijital Pazarlama, Reklam ve Büyüme",
        description: "SEO, performans reklamcılığı, sosyal medya yönetimi ve e-ticaret büyümesi.",
      },
      en: {
        name: "Digital Marketing & Growth",
        description:
          "SEO, performance advertising, social media management, and e-commerce growth.",
      },
    },
  },
  {
    key: "sector-video-audio",
    sortOrder: 5,
    icon: "Video",
    translations: {
      tr: {
        name: "Video, Animasyon ve Ses",
        description: "Video kurgu, hareketli grafikler, seslendirme ve podcast prodüksiyonu.",
      },
      en: {
        name: "Video, Motion & Audio",
        description: "Video editing, motion graphics, voice-over, and podcast audio production.",
      },
    },
  },
  {
    key: "sector-writing-translation",
    sortOrder: 6,
    icon: "PenTool",
    translations: {
      tr: {
        name: "Yazı, Çeviri ve İçerik Üretimi",
        description: "Teknik dokümantasyon, metin yazarlığı, çok dilli çeviri ve SEO içerikleri.",
      },
      en: {
        name: "Writing & Translation",
        description: "Technical writing, copywriting, multilingual translation, and SEO articles.",
      },
    },
  },
  {
    key: "sector-business-finance",
    sortOrder: 7,
    icon: "Briefcase",
    translations: {
      tr: {
        name: "İş Yönetimi, Finans ve Danışmanlık",
        description: "Finansal modelleme, muhasebe, iş stratejisi ve çevik proje yönetimi.",
      },
      en: {
        name: "Business, Finance & Consulting",
        description:
          "Financial modeling, accounting, startup strategy, and agile project management.",
      },
    },
  },
  {
    key: "sector-legal-compliance",
    sortOrder: 8,
    icon: "Scale",
    translations: {
      tr: {
        name: "Hukuk, Mevzuat ve Fikri Mülkiyet",
        description:
          "Sözleşmeler, KVKK/GDPR uyumu, marka tescili ve girişimler için yasal danışmanlık.",
      },
      en: {
        name: "Legal & Compliance",
        description:
          "Contract drafting, GDPR/privacy compliance, trademark filing, and startup advisory.",
      },
    },
  },
  {
    key: "sector-engineering-3d",
    sortOrder: 9,
    icon: "Box",
    translations: {
      tr: {
        name: "Mühendislik, Mimarlık ve 3D",
        description:
          "Mimari projeler, 3D görselleştirme, endüstriyel modelleme ve oyun mekanikleri.",
      },
      en: {
        name: "Engineering, Architecture & 3D",
        description:
          "Architectural blueprints, 3D visualization, CAD product modeling, and game engines.",
      },
    },
  },
  {
    key: "sector-operations-support",
    sortOrder: 10,
    icon: "Headphones",
    translations: {
      tr: {
        name: "Sanal Asistanlık ve Müşteri Destek",
        description: "Yönetici asistanlığı, müşteri hizmetleri, veri girişi ve CRM yönetimi.",
      },
      en: {
        name: "Virtual Assistance & Operations",
        description: "Executive assistance, customer support, data entry, and CRM operations.",
      },
    },
  },
];

export const SEED_CATEGORIES: SeedCategory[] = [
  // --- 1. Yazılım ve Bilişim Teknolojileri (sector-software-it) ---
  {
    key: "web-development",
    sectorKey: "sector-software-it",
    sortOrder: 1,
    translations: {
      tr: {
        name: "Web Geliştirme",
        description: "Kurumsal siteler, web uygulamaları, portallar ve e-ticaret çözümleri.",
      },
      en: {
        name: "Web Development",
        description: "Corporate websites, web applications, portals, and e-commerce solutions.",
      },
    },
  },
  {
    key: "frontend-ui",
    sectorKey: "sector-software-it",
    sortOrder: 2,
    translations: {
      tr: {
        name: "Frontend ve Arayüz Mühendisliği",
        description: "Modern web arayüzleri, performans optimizasyonu ve tasarım sistemleri.",
      },
      en: {
        name: "Frontend Engineering",
        description: "Modern web interfaces, performance optimization, and design systems.",
      },
    },
  },
  {
    key: "backend-api",
    sectorKey: "sector-software-it",
    sortOrder: 3,
    translations: {
      tr: {
        name: "Backend ve API Mühendisliği",
        description: "REST, GraphQL, microservice ve yüksek ölçekli sunucu sistemleri.",
      },
      en: {
        name: "Backend & API",
        description: "REST, GraphQL, microservices, and high-scale server infrastructure.",
      },
    },
  },
  {
    key: "mobile-development",
    sectorKey: "sector-software-it",
    sortOrder: 4,
    translations: {
      tr: {
        name: "Mobil Uygulama Geliştirme",
        description: "iOS, Android, React Native ve Flutter mobil uygulamaları.",
      },
      en: {
        name: "Mobile Development",
        description: "iOS, Android, React Native, and Flutter mobile applications.",
      },
    },
  },
  {
    key: "desktop-development",
    sectorKey: "sector-software-it",
    sortOrder: 5,
    translations: {
      tr: {
        name: "Masaüstü Yazılım Geliştirme",
        description: "Windows, macOS ve Linux için yerel ve platformlar arası uygulamalar.",
      },
      en: {
        name: "Desktop Development",
        description: "Native and cross-platform applications for Windows, macOS, and Linux.",
      },
    },
  },
  {
    key: "devops-cloud",
    sectorKey: "sector-software-it",
    sortOrder: 6,
    translations: {
      tr: {
        name: "DevOps ve Bulut Bilişim",
        description: "CI/CD, Kubernetes, Docker, AWS, GCP, Azure ve sunucu mimarileri.",
      },
      en: {
        name: "DevOps & Cloud",
        description: "CI/CD, Kubernetes, Docker, AWS, GCP, Azure, and cloud architecture.",
      },
    },
  },
  {
    key: "database",
    sectorKey: "sector-software-it",
    sortOrder: 7,
    translations: {
      tr: {
        name: "Veritabanı Mühendisliği",
        description: "Veritabanı mimarisi, sorgu optimizasyonu, PostgreSQL, MySQL ve NoSQL.",
      },
      en: {
        name: "Database Engineering",
        description: "Database architecture, query optimization, PostgreSQL, MySQL, and NoSQL.",
      },
    },
  },
  {
    key: "cybersecurity",
    sectorKey: "sector-software-it",
    sortOrder: 8,
    translations: {
      tr: {
        name: "Siber Güvenlik",
        description: "Yetkili güvenlik testleri, kod denetimi, sistem sıkılaştırma ve uyumluluk.",
      },
      en: {
        name: "Cybersecurity",
        description: "Authorized penetration testing, code review, hardening, and compliance.",
      },
    },
  },
  {
    key: "qa-testing",
    sectorKey: "sector-software-it",
    sortOrder: 9,
    translations: {
      tr: {
        name: "Yazılım Testi ve Kalite Güvencesi",
        description: "Manuel ve otomatik testler, E2E senaryoları ve yük testleri.",
      },
      en: {
        name: "QA & Testing",
        description: "Manual and automated testing, E2E test suites, and load testing.",
      },
    },
  },
  {
    key: "blockchain",
    sectorKey: "sector-software-it",
    sortOrder: 10,
    translations: {
      tr: {
        name: "Blokzincir Mühendisliği",
        description: "Akıllı sözleşmeler, EVM, Solana ve merkeziyetsiz uygulama mimarileri.",
      },
      en: {
        name: "Blockchain Engineering",
        description: "Smart contracts, EVM, Solana, and decentralized application architecture.",
      },
    },
  },
  {
    key: "embedded-iot",
    sectorKey: "sector-software-it",
    sortOrder: 11,
    translations: {
      tr: {
        name: "Gömülü Sistemler ve IoT",
        description:
          "Mikrodenetleyici programlama, Arduino, ESP32, Raspberry Pi ve donanım yazılımları.",
      },
      en: {
        name: "Embedded & IoT",
        description:
          "Microcontroller programming, firmware, Arduino, ESP32, and connected devices.",
      },
    },
  },
  {
    key: "it-systems-network",
    sectorKey: "sector-software-it",
    sortOrder: 12,
    translations: {
      tr: {
        name: "BT, Sistem ve Ağ Yönetimi",
        description: "Sunucu yönetimi, ağ güvenliği, VPN, Linux/Windows sunucu yapılandırması.",
      },
      en: {
        name: "IT, Systems & Network",
        description: "Server administration, network security, VPN, and infrastructure setup.",
      },
    },
  },
  {
    key: "computer-hardware",
    sectorKey: "sector-software-it",
    sortOrder: 13,
    translations: {
      tr: {
        name: "Bilgisayar Donanımı ve Teknik Destek",
        description: "Donanım teşhisi, sistem toplama, optimizasyon ve teknik danışmanlık.",
      },
      en: {
        name: "Computer Hardware & Technical Support",
        description:
          "Hardware diagnostics, custom builds, performance tuning, and technical support.",
      },
    },
  },
  {
    key: "other-technology",
    sectorKey: "sector-software-it",
    sortOrder: 14,
    translations: {
      tr: {
        name: "Diğer Teknoloji Hizmetleri",
        description:
          "Listelenen kategorilerin dışındaki özel teknoloji ve mühendislik gereksinimleri.",
      },
      en: {
        name: "Other Technology",
        description: "Specialized technology and engineering tasks outside listed categories.",
      },
    },
  },
  {
    key: "nocode-lowcode-development",
    sectorKey: "sector-software-it",
    sortOrder: 15,
    translations: {
      tr: {
        name: "No-Code & Low-Code Geliştirme",
        description:
          "Framer, Webflow, Bubble, Make, Zapier, Retool ve hızlı MVP ürün geliştirme çözümleri.",
      },
      en: {
        name: "No-Code & Low-Code Development",
        description:
          "Framer, Webflow, Bubble, Make, Zapier, Retool, and rapid visual MVP development.",
      },
    },
  },

  // --- 2. Yapay Zeka, Veri ve Otomasyon (sector-ai-data) ---
  {
    key: "ai-ml",
    sectorKey: "sector-ai-data",
    sortOrder: 15,
    translations: {
      tr: {
        name: "Yapay Zeka ve Makine Öğrenimi",
        description: "LLM entegrasyonu, model eğitimi, veri bilimi ve bilgisayarlı görü.",
      },
      en: {
        name: "AI & Machine Learning",
        description: "LLM integration, model training, data science, and computer vision.",
      },
    },
  },
  {
    key: "data-engineering",
    sectorKey: "sector-ai-data",
    sortOrder: 16,
    translations: {
      tr: {
        name: "Veri Mühendisliği ve Analitik",
        description: "Veri ambarı, ETL boru hatları, veri analitiği ve raporlama sistemleri.",
      },
      en: {
        name: "Data Engineering & Analytics",
        description: "Data warehousing, ETL pipelines, analytics, and business intelligence.",
      },
    },
  },
  {
    key: "automation-integrations",
    sectorKey: "sector-ai-data",
    sortOrder: 17,
    translations: {
      tr: {
        name: "Otomasyon ve Entegrasyonlar",
        description: "İş akışı otomasyonu, botlar, webhooklar ve üçüncü taraf API entegrasyonları.",
      },
      en: {
        name: "Automation & Integrations",
        description: "Workflow automation, custom bots, webhooks, and third-party integrations.",
      },
    },
  },
  {
    key: "ai-agents-workflows",
    sectorKey: "sector-ai-data",
    sortOrder: 18,
    translations: {
      tr: {
        name: "Yapay Zeka Ajanları ve İş Akışları",
        description: "LangChain, LlamaIndex, n8n AI ve otonom karar destek sistemleri.",
      },
      en: {
        name: "AI Agents & Autonomous Workflows",
        description: "LangChain, LlamaIndex, n8n AI, and autonomous decision support workflows.",
      },
    },
  },
  {
    key: "prompt-engineering",
    sectorKey: "sector-ai-data",
    sortOrder: 19,
    translations: {
      tr: {
        name: "Prompt Mühendisliği ve AI Danışmanlığı",
        description: "Doğru çıktı mimarisi, şirket içi prompt optimizasyonu ve AI adaptasyonu.",
      },
      en: {
        name: "Prompt Engineering & AI Advisory",
        description: "Output architecture, internal prompt optimization, and AI tool adoption.",
      },
    },
  },
  {
    key: "business-intelligence",
    sectorKey: "sector-ai-data",
    sortOrder: 20,
    translations: {
      tr: {
        name: "İş Zekası ve Dashboard Tasarımı",
        description: "Power BI, Tableau, Looker ve kurumsal veri görselleştirme panelleri.",
      },
      en: {
        name: "Business Intelligence & Dashboards",
        description: "Power BI, Tableau, Looker, and executive reporting dashboard systems.",
      },
    },
  },

  // --- 3. Tasarım ve Yaratıcı Sanatlar (sector-design-creative) ---
  {
    key: "ui-ux-design",
    sectorKey: "sector-design-creative",
    sortOrder: 21,
    translations: {
      tr: {
        name: "UI/UX Tasarım",
        description:
          "Kullanıcı deneyimi araştırması, tel kafes, prototip ve mobil/web arayüz tasarımı.",
      },
      en: {
        name: "UI/UX Design",
        description: "User experience research, wireframing, prototyping, and UI design.",
      },
    },
  },
  {
    key: "brand-identity-logo",
    sectorKey: "sector-design-creative",
    sortOrder: 22,
    translations: {
      tr: {
        name: "Logo ve Kurumsal Kimlik",
        description: "Logo tasarımı, marka kılavuzu, renk paleti ve kurumsal evrak setleri.",
      },
      en: {
        name: "Logo & Brand Identity",
        description: "Logo design, comprehensive brand guidelines, color palettes, and stationery.",
      },
    },
  },
  {
    key: "design-systems",
    sectorKey: "sector-design-creative",
    sortOrder: 23,
    translations: {
      tr: {
        name: "Tasarım Sistemleri (Design Systems)",
        description: "Figma bileşen kütüphaneleri, tokenlar ve çok platformlu UI kitleri.",
      },
      en: {
        name: "Design Systems & UI Kits",
        description: "Figma component libraries, design tokens, and multi-platform design systems.",
      },
    },
  },
  {
    key: "social-media-design",
    sectorKey: "sector-design-creative",
    sortOrder: 24,
    translations: {
      tr: {
        name: "Sosyal Medya ve Reklam Görselleri",
        description: "Instagram, LinkedIn, banner ve dijital reklam kreatif tasarımları.",
      },
      en: {
        name: "Social Media & Ad Creatives",
        description:
          "Instagram, LinkedIn banners, and high-converting digital advertising graphics.",
      },
    },
  },
  {
    key: "illustration-vector",
    sectorKey: "sector-design-creative",
    sortOrder: 25,
    translations: {
      tr: {
        name: "İllüstrasyon ve Vektörel Çizim",
        description: "Özel dijital çizimler, karakter tasarımı, vektör ikonlar ve maskotlar.",
      },
      en: {
        name: "Illustration & Vector Art",
        description: "Custom digital illustrations, character design, vector icons, and mascots.",
      },
    },
  },
  {
    key: "print-packaging-design",
    sectorKey: "sector-design-creative",
    sortOrder: 26,
    translations: {
      tr: {
        name: "Ambalaj, Etiket ve Baskı Tasarımı",
        description: "Ürün ambalajı, etiket tasarımı, katalog, broşür ve matbaa baskı hazırlığı.",
      },
      en: {
        name: "Packaging, Label & Print Design",
        description: "Product packaging, labels, catalogs, brochures, and prepress production.",
      },
    },
  },
  {
    key: "presentation-deck-design",
    sectorKey: "sector-design-creative",
    sortOrder: 27,
    translations: {
      tr: {
        name: "Yatırımcı Sunumu ve Pitch Deck",
        description: "Girişim sunumları, kurumsal slaytlar ve satış sunum tasarımları.",
      },
      en: {
        name: "Pitch Deck & Presentation Design",
        description: "Startup fundraising decks, corporate pitch decks, and sales presentations.",
      },
    },
  },

  // --- 4. Dijital Pazarlama, Reklam ve Büyüme (sector-marketing-growth) ---
  {
    key: "search-engine-optimization",
    sectorKey: "sector-marketing-growth",
    sortOrder: 28,
    translations: {
      tr: {
        name: "Arama Motoru Optimizasyonu (SEO)",
        description: "Teknik SEO, anahtar kelime stratejisi, backlink ve organik trafik artışı.",
      },
      en: {
        name: "Search Engine Optimization (SEO)",
        description: "Technical SEO, keyword research, backlink building, and organic growth.",
      },
    },
  },
  {
    key: "paid-search-sem",
    sectorKey: "sector-marketing-growth",
    sortOrder: 29,
    translations: {
      tr: {
        name: "Google Reklamları (SEM & PPC)",
        description: "Google Arama, Alışveriş, Display reklam kampanyaları ve dönüşüm kurulumu.",
      },
      en: {
        name: "Google Ads (SEM & PPC)",
        description: "Google Search, Shopping, Performance Max campaigns, and conversion tracking.",
      },
    },
  },
  {
    key: "paid-social-meta",
    sectorKey: "sector-marketing-growth",
    sortOrder: 30,
    translations: {
      tr: {
        name: "Sosyal Medya Reklamcılığı",
        description: "Meta (Facebook/Instagram), TikTok ve LinkedIn reklam optimizasyonu.",
      },
      en: {
        name: "Paid Social Media Advertising",
        description:
          "Meta Ads, TikTok, and LinkedIn performance media buying and campaign scaling.",
      },
    },
  },
  {
    key: "social-media-management",
    sectorKey: "sector-marketing-growth",
    sortOrder: 31,
    translations: {
      tr: {
        name: "Sosyal Medya Yönetimi ve Stratejisi",
        description: "Aylık içerik takvimi, hesap yönetimi, etkileşim artırma ve topluluk inşası.",
      },
      en: {
        name: "Social Media Management",
        description: "Content scheduling, account moderation, engagement growth, and community.",
      },
    },
  },
  {
    key: "email-marketing-automation",
    sectorKey: "sector-marketing-growth",
    sortOrder: 32,
    translations: {
      tr: {
        name: "E-Posta Pazarlaması ve CRM Akışları",
        description: "Klaviyo, Mailchimp otomasyonları, bülten kurgusu ve sepet terk akışları.",
      },
      en: {
        name: "Email Marketing & CRM Automation",
        description: "Klaviyo, lifecycle drip campaigns, newsletter design, and cart abandonment.",
      },
    },
  },
  {
    key: "ecommerce-growth-store",
    sectorKey: "sector-marketing-growth",
    sortOrder: 33,
    translations: {
      tr: {
        name: "E-Ticaret Yönetimi ve Büyüme",
        description: "Shopify mağaza kurulumu, Trendyol/Amazon entegrasyonu ve ciro ölçekleme.",
      },
      en: {
        name: "E-Commerce Management & Scaling",
        description: "Shopify store setup, Amazon/marketplace operations, and GMV growth.",
      },
    },
  },

  // --- 5. Video, Animasyon ve Ses (sector-video-audio) ---
  {
    key: "short-form-video",
    sectorKey: "sector-video-audio",
    sortOrder: 34,
    translations: {
      tr: {
        name: "Kısa Format Video (Reels, TikTok, Shorts)",
        description: "Dinamik altyazılı, kancalı dikey video kurgusu ve trend uyarlamaları.",
      },
      en: {
        name: "Short-Form Video (Reels & TikTok)",
        description: "Fast-paced, captioned vertical video editing optimized for viral retention.",
      },
    },
  },
  {
    key: "long-form-youtube",
    sectorKey: "sector-video-audio",
    sortOrder: 35,
    translations: {
      tr: {
        name: "YouTube ve Uzun Format Video Kurgusu",
        description: "Hikaye kurgusu, renk düzenleme, ses miksajı ve profesyonel YouTube montajı.",
      },
      en: {
        name: "YouTube & Long-Form Video Editing",
        description:
          "Narrative pacing, color grading, sound mixing, and high-retention YouTube editing.",
      },
    },
  },
  {
    key: "motion-graphics-2d-3d",
    sectorKey: "sector-video-audio",
    sortOrder: 36,
    translations: {
      tr: {
        name: "Hareketli Grafik (Motion Graphics)",
        description: "After Effects animasyonları, logo animasyonu ve açıklayıcı infografik video.",
      },
      en: {
        name: "Motion Graphics & 2D/3D Animation",
        description: "After Effects animations, kinetic typography, and animated explainer videos.",
      },
    },
  },
  {
    key: "voice-over-dubbing",
    sectorKey: "sector-video-audio",
    sortOrder: 37,
    translations: {
      tr: {
        name: "Seslendirme ve Dublaj",
        description:
          "Reklam filmi seslendirmesi, santral anonsları, podcast anlatımı ve ses miksi.",
      },
      en: {
        name: "Voice-Over & Dubbing",
        description: "Commercial voice-overs, narration, IVR greetings, and character dubbing.",
      },
    },
  },
  {
    key: "podcast-audio-editing",
    sectorKey: "sector-video-audio",
    sortOrder: 38,
    translations: {
      tr: {
        name: "Podcast Düzenleme ve Ses Mühendisliği",
        description: "Dip ses temizleme, mastering, müzik montajı ve podcast dağıtımı.",
      },
      en: {
        name: "Podcast Audio Editing & Mastering",
        description:
          "Background noise removal, audio mastering, intro/outro mixing, and loudness tuning.",
      },
    },
  },

  // --- 6. Yazı, Çeviri ve İçerik Üretimi (sector-writing-translation) ---
  {
    key: "technical-writing",
    sectorKey: "sector-writing-translation",
    sortOrder: 39,
    translations: {
      tr: {
        name: "Teknik Yazarlık ve Dokümantasyon",
        description: "API dokümanları, yazılım kılavuzları, mimari spesifikasyonlar ve PRD.",
      },
      en: {
        name: "Technical Writing & Docs",
        description: "API documentation, software user manuals, architectural specs, and PRD.",
      },
    },
  },
  {
    key: "copywriting-sales",
    sectorKey: "sector-writing-translation",
    sortOrder: 40,
    translations: {
      tr: {
        name: "Reklam ve Satış Metni Yazarlığı",
        description:
          "Açılış sayfası metinleri, reklam başlıkları, e-posta serileri ve satış metinleri.",
      },
      en: {
        name: "Copywriting & Landing Page Copy",
        description:
          "High-converting landing page copy, sales letters, and marketing email sequences.",
      },
    },
  },
  {
    key: "seo-blog-writing",
    sectorKey: "sector-writing-translation",
    sortOrder: 41,
    translations: {
      tr: {
        name: "SEO Uyumlu Blog ve Makale Yazarlığı",
        description:
          "Özgün araştırma, derinlemesine rehber yazılar ve arama motoru uyumlu makaleler.",
      },
      en: {
        name: "SEO Articles & Blog Posts",
        description:
          "Original research articles, authoritative blog posts, and topical cluster content.",
      },
    },
  },
  {
    key: "translation-localization",
    sectorKey: "sector-writing-translation",
    sortOrder: 42,
    translations: {
      tr: {
        name: "Profesyonel Çeviri ve Yerelleştirme",
        description:
          "Yazılım arayüzü yerelleştirmesi (i18n), hukuki/teknik çeviri ve yerelleştirme.",
      },
      en: {
        name: "Translation & Software Localization",
        description:
          "UI localization (i18n), technical translation, and contextual internationalization.",
      },
    },
  },
  {
    key: "proofreading-editing",
    sectorKey: "sector-writing-translation",
    sortOrder: 43,
    translations: {
      tr: {
        name: "Editoryal Düzeltme ve Redaksiyon",
        description: "İmla, akıcılık, anlatım bozukluğu düzeltme ve metin kalitesi denetimi.",
      },
      en: {
        name: "Proofreading & Copyediting",
        description: "Grammar, syntax, voice refinement, and rigorous quality assurance of text.",
      },
    },
  },

  // --- 7. İş Yönetimi, Finans ve Danışmanlık (sector-business-finance) ---
  {
    key: "technical-consulting",
    sectorKey: "sector-business-finance",
    sortOrder: 44,
    translations: {
      tr: {
        name: "Teknik Danışmanlık",
        description: "Mimari değerlendirme, kod denetimi, teknoloji seçimi ve fizibilite analizi.",
      },
      en: {
        name: "Technical Consulting",
        description:
          "Architecture review, code audit, technology stack evaluation, and feasibility.",
      },
    },
  },
  {
    key: "financial-modeling",
    sectorKey: "sector-business-finance",
    sortOrder: 45,
    translations: {
      tr: {
        name: "Finansal Modelleme ve Fizibilite",
        description:
          "Excel finansal modelleri, nakit akışı tahmini, değerleme ve senaryo analizleri.",
      },
      en: {
        name: "Financial Modeling & Valuation",
        description: "DCF models, pro forma projections, cash flow forecasting, and valuation.",
      },
    },
  },
  {
    key: "accounting-bookkeeping",
    sectorKey: "sector-business-finance",
    sortOrder: 46,
    translations: {
      tr: {
        name: "Muhasebe ve Ön Muhasebe Yönetimi",
        description: "Fatura takibi, banka mutabakatı, gelir-gider dengesi ve mali raporlama.",
      },
      en: {
        name: "Accounting & Bookkeeping",
        description:
          "Invoicing reconciliation, accounts payable/receivable, and financial hygiene.",
      },
    },
  },
  {
    key: "tax-consulting",
    sectorKey: "sector-business-finance",
    sortOrder: 47,
    translations: {
      tr: {
        name: "Vergi Planlaması ve Mali Müşavirlik",
        description:
          "Şirket kuruluşu, vergi avantajları, KDV/stopaj planlaması ve beyanname desteği.",
      },
      en: {
        name: "Tax Planning & Consulting",
        description: "Corporate tax strategy, international tax advisory, and fiscal compliance.",
      },
    },
  },
  {
    key: "startup-strategy-bizdev",
    sectorKey: "sector-business-finance",
    sortOrder: 48,
    translations: {
      tr: {
        name: "Girişim Stratejisi ve İş Planı",
        description: "Pazar giriş (GTM) stratejisi, iş modeli kanvası ve büyüme yol haritaları.",
      },
      en: {
        name: "Startup Strategy & Business Plan",
        description: "Go-to-market strategies, business model canvas, and growth roadmapping.",
      },
    },
  },
  {
    key: "project-management-agile",
    sectorKey: "sector-business-finance",
    sortOrder: 49,
    translations: {
      tr: {
        name: "Proje Yönetimi ve Çevik Danışmanlık",
        description: "Scrum/Agile koçluğu, Jira/ClickUp sistem kurulumu ve sprint operasyonları.",
      },
      en: {
        name: "Agile Project Management",
        description:
          "Scrum facilitation, Jira workflow design, roadmap execution, and sprint delivery.",
      },
    },
  },

  // --- 8. Hukuk, Mevzuat ve Fikri Mülkiyet (sector-legal-compliance) ---
  {
    key: "contract-drafting-review",
    sectorKey: "sector-legal-compliance",
    sortOrder: 50,
    translations: {
      tr: {
        name: "Sözleşme Hazırlama ve İnceleme",
        description:
          "Hizmet sözleşmeleri, gizlilik anlaşmaları (NDA), iş ortaklığı ve tedarik şartları.",
      },
      en: {
        name: "Contract Drafting & Review",
        description:
          "Master service agreements, NDAs, vendor terms, and customized commercial contracts.",
      },
    },
  },
  {
    key: "kvkk-gdpr-privacy",
    sectorKey: "sector-legal-compliance",
    sortOrder: 51,
    translations: {
      tr: {
        name: "KVKK, GDPR ve Veri Gizliliği Uyumu",
        description: "Aydınlatma metinleri, çerez politikası, veri envanteri ve regülasyon uyumu.",
      },
      en: {
        name: "GDPR & Privacy Compliance",
        description:
          "Privacy policies, cookie consent disclosures, and data protection impact assessments.",
      },
    },
  },
  {
    key: "trademark-ip-patent",
    sectorKey: "sector-legal-compliance",
    sortOrder: 52,
    translations: {
      tr: {
        name: "Marka Tescili ve Fikri Mülkiyet",
        description:
          "Marka araştırma ve başvuru süreci, patent, telif hakları ve itiraz savunmaları.",
      },
      en: {
        name: "Trademark, IP & Patent Filing",
        description:
          "Trademark filing, clearance searches, copyright protection, and IP portfolios.",
      },
    },
  },
  {
    key: "ecommerce-consumer-law",
    sectorKey: "sector-legal-compliance",
    sortOrder: 53,
    translations: {
      tr: {
        name: "E-Ticaret ve Tüketici Hukuku",
        description:
          "Mesafeli satış sözleşmeleri, iptal/iade prosedürleri ve pazar yeri yasal metinleri.",
      },
      en: {
        name: "E-Commerce & Consumer Terms",
        description:
          "Distance selling contracts, refund/cancellation policies, and platform terms.",
      },
    },
  },

  // --- 9. Mühendislik, Mimarlık ve 3D (sector-engineering-3d) ---
  {
    key: "game-development",
    sectorKey: "sector-engineering-3d",
    sortOrder: 54,
    translations: {
      tr: {
        name: "Oyun Geliştirme",
        description: "Unity, Unreal Engine, 2D/3D oyun mekanikleri ve grafik programlama.",
      },
      en: {
        name: "Game Development",
        description: "Unity, Unreal Engine, 2D/3D gameplay mechanics, and graphics programming.",
      },
    },
  },
  {
    key: "architectural-design-bim",
    sectorKey: "sector-engineering-3d",
    sortOrder: 55,
    translations: {
      tr: {
        name: "Mimari Proje, Plan ve BIM",
        description: "AutoCAD mimari çizimler, kat planları, Revit ve ruhsat projeleri.",
      },
      en: {
        name: "Architectural Design & BIM",
        description:
          "AutoCAD architectural plans, floor layouts, Revit modeling, and permit drawings.",
      },
    },
  },
  {
    key: "interior-design-rendering",
    sectorKey: "sector-engineering-3d",
    sortOrder: 56,
    translations: {
      tr: {
        name: "İç Mimari ve 3D Fotogerçekçi Render",
        description:
          "3ds Max, Corona, V-Ray ile mekan modelleme, aydınlatma ve gerçekçi görselleştirme.",
      },
      en: {
        name: "Interior Design & 3D Rendering",
        description:
          "Photorealistic 3D interior renders, lighting design, and material visualization.",
      },
    },
  },
  {
    key: "3d-product-modeling",
    sectorKey: "sector-engineering-3d",
    sortOrder: 57,
    translations: {
      tr: {
        name: "3D Ürün Modelleme ve CAD",
        description:
          "SolidWorks, Fusion 360 ile endüstriyel tasarım ve 3D baskıya uygun (STL) modelleme.",
      },
      en: {
        name: "3D Product Modeling & CAD",
        description: "Industrial CAD modeling, SolidWorks mechanical design, and 3D printing prep.",
      },
    },
  },

  // --- 10. Sanal Asistanlık ve Operasyon (sector-operations-support) ---
  {
    key: "executive-virtual-assistant",
    sectorKey: "sector-operations-support",
    sortOrder: 58,
    translations: {
      tr: {
        name: "Yönetici Asistanlığı ve Takvim Yönetimi",
        description:
          "E-posta yanıtlanması, toplantı organizasyonu, seyahat planlama ve günlük ajanda.",
      },
      en: {
        name: "Executive Virtual Assistant",
        description:
          "Calendar management, email triage, travel booking, and executive administrative tasks.",
      },
    },
  },
  {
    key: "customer-support-crm",
    sectorKey: "sector-operations-support",
    sortOrder: 59,
    translations: {
      tr: {
        name: "Müşteri Hizmetleri ve Canlı Destek",
        description: "Zendesk, Freshdesk, canlı sohbet yönetimi ve müşteri taleplerinin çözülmesi.",
      },
      en: {
        name: "Customer Support & Ticketing",
        description:
          "Helpdesk support, live chat resolution, SLA monitoring, and customer success.",
      },
    },
  },
  {
    key: "data-entry-web-research",
    sectorKey: "sector-operations-support",
    sortOrder: 60,
    translations: {
      tr: {
        name: "Veri Girişi ve Kapsamlı Web Araştırması",
        description:
          "Excel veri girişi, pazar araştırması, rakip listeleme ve veri zenginleştirme.",
      },
      en: {
        name: "Data Entry & Web Research",
        description:
          "Accurate spreadsheet data entry, web mining, lead list building, and data scrubbing.",
      },
    },
  },

  // --- 1. Yazılım ve Bilişim Teknolojileri Granular ---
  {
    key: "fullstack-development",
    sectorKey: "sector-software-it",
    sortOrder: 101,
    translations: {
      tr: {
        name: "Full Stack Web Geliştirme",
        description:
          "Next.js, Node.js, Python, PostgreSQL ile uçtan uca modern web ve SaaS mimarileri.",
      },
      en: {
        name: "Full Stack Web Development",
        description:
          "End-to-end modern web and SaaS architectures with Next.js, Node.js, and databases.",
      },
    },
  },
  {
    key: "ecommerce-development",
    sectorKey: "sector-software-it",
    sortOrder: 102,
    translations: {
      tr: {
        name: "E-Ticaret Sitesi Geliştirme",
        description:
          "Shopify, WooCommerce, Magento ve özel e-ticaret altyapısı geliştirme çözümleri.",
      },
      en: {
        name: "E-Commerce Development",
        description:
          "Custom e-commerce platforms, Shopify store setup, WooCommerce, and payment gateways.",
      },
    },
  },
  {
    key: "cms-nocode-development",
    sectorKey: "sector-software-it",
    sortOrder: 103,
    translations: {
      tr: {
        name: "CMS ve No-Code Geliştirme",
        description:
          "WordPress, Webflow, Bubble ve headless CMS sistemleri ile hızlı uygulama geliştirme.",
      },
      en: {
        name: "CMS & No-Code Development",
        description:
          "Rapid web development using WordPress, Webflow, Bubble, and headless CMS stacks.",
      },
    },
  },
  {
    key: "api-microservices",
    sectorKey: "sector-software-it",
    sortOrder: 104,
    translations: {
      tr: {
        name: "Mikroservis ve API Mimarisi",
        description:
          "RESTful, GraphQL, gRPC ve mesajlaşma kuyrukları ile ölçeklenebilir arka yüz servisleri.",
      },
      en: {
        name: "Microservices & API Architecture",
        description:
          "Scalable backend services, RESTful APIs, GraphQL schemas, gRPC, and message brokers.",
      },
    },
  },
  {
    key: "penetration-testing-security",
    sectorKey: "sector-software-it",
    sortOrder: 105,
    translations: {
      tr: {
        name: "Penetrasyon Testi ve Güvenlik Denetimi",
        description:
          "Web/mobil sızma testleri, OWASP güvenlik açığı taraması ve sistem sertleştirme.",
      },
      en: {
        name: "Penetration Testing & Security Audit",
        description:
          "Authorized penetration testing, OWASP vulnerability assessments, and remediation.",
      },
    },
  },
  {
    key: "cloud-infrastructure-aws-gcp",
    sectorKey: "sector-software-it",
    sortOrder: 106,
    translations: {
      tr: {
        name: "Bulut Mimarisi ve Altyapı Yönetimi",
        description:
          "AWS, Google Cloud, Azure, Terraform, Docker konteynerleri ve Kubernetes yönetimi.",
      },
      en: {
        name: "Cloud Infrastructure & Platform Engineering",
        description:
          "AWS, GCP, Azure infrastructure, Terraform IaC, Docker containers, and Kubernetes.",
      },
    },
  },

  // --- 2. Yapay Zeka, Veri ve Otomasyon Granular ---
  {
    key: "llm-app-development",
    sectorKey: "sector-ai-data",
    sortOrder: 201,
    translations: {
      tr: {
        name: "LLM ve GPT Uygulama Geliştirme",
        description:
          "OpenAI, Claude API, yerel açık kaynak LLM'ler, RAG mimarisi ve vektör veritabanları.",
      },
      en: {
        name: "LLM & Generative AI Applications",
        description:
          "Custom LLM integrations, OpenAI, Anthropic APIs, RAG pipelines, and vector databases.",
      },
    },
  },
  {
    key: "computer-vision-ai",
    sectorKey: "sector-ai-data",
    sortOrder: 202,
    translations: {
      tr: {
        name: "Bilgisayarlı Görü ve Görüntü İşleme",
        description:
          "Nesne algılama, görüntü sınıflandırma, OCR, yüz tanıma ve OpenCV derin öğrenme modelleri.",
      },
      en: {
        name: "Computer Vision & Image Processing",
        description:
          "Object detection, image segmentation, OCR, facial recognition, and OpenCV solutions.",
      },
    },
  },
  {
    key: "nlp-speech-voice",
    sectorKey: "sector-ai-data",
    sortOrder: 203,
    translations: {
      tr: {
        name: "Doğal Dil İşleme ve Ses Teknolojileri",
        description:
          "Metin sınıflandırma, duygu analizi, ses tanıma (STT) ve yapay zeka ses sentezi (TTS).",
      },
      en: {
        name: "NLP & Voice AI Technologies",
        description:
          "Text classification, sentiment analysis, speech-to-text, and voice synthesis (TTS).",
      },
    },
  },
  {
    key: "data-scraping-extraction",
    sectorKey: "sector-ai-data",
    sortOrder: 204,
    translations: {
      tr: {
        name: "Web Kazıma ve Veri Madenciliği",
        description:
          "Selenium, Playwright, Scrapy ile otomatik veri toplama, temizleme ve veri hatları.",
      },
      en: {
        name: "Web Scraping & Data Mining",
        description:
          "Automated web crawling, data mining pipelines, and data enrichment using modern scrapers.",
      },
    },
  },

  // --- 3. Tasarım ve Yaratıcı Sanatlar Granular ---
  {
    key: "web-ui-design",
    sectorKey: "sector-design-creative",
    sortOrder: 301,
    translations: {
      tr: {
        name: "Web Sitesi UI/UX Tasarımı",
        description:
          "Dönüşüm odaklı açılış sayfaları, kurumsal web siteleri ve web uygulaması arayüzleri.",
      },
      en: {
        name: "Website UI/UX Design",
        description:
          "High-converting landing pages, corporate websites, and responsive web interface designs.",
      },
    },
  },
  {
    key: "mobile-app-ui-ux",
    sectorKey: "sector-design-creative",
    sortOrder: 302,
    translations: {
      tr: {
        name: "Mobil Uygulama UI/UX Tasarımı",
        description:
          "iOS ve Android platformları için modern kullanıcı deneyimi, kullanıcı akışları ve Figma prototipleri.",
      },
      en: {
        name: "Mobile App UI/UX Design",
        description:
          "iOS and Android mobile app interfaces, user flow diagrams, and interactive Figma prototypes.",
      },
    },
  },
  {
    key: "icon-typography-design",
    sectorKey: "sector-design-creative",
    sortOrder: 303,
    translations: {
      tr: {
        name: "İkon ve Tipografi Tasarımı",
        description:
          "Özel vektörel ikon setleri, semboller, glif sistemleri ve marka tipografi kılavuzları.",
      },
      en: {
        name: "Icon & Typography Design",
        description:
          "Custom vector icon sets, glyph systems, custom lettering, and font pairing guidelines.",
      },
    },
  },
  {
    key: "character-concept-art",
    sectorKey: "sector-design-creative",
    sortOrder: 304,
    translations: {
      tr: {
        name: "Karakter Tasarımı ve Konsept Sanat",
        description:
          "Oyunlar, animasyonlar ve dijital medya için 2D/3D konsept görselleştirme ve karakter çizimleri.",
      },
      en: {
        name: "Character Design & Concept Art",
        description:
          "2D/3D concept art, environment design, and character visual development for creative media.",
      },
    },
  },

  // --- 4. Dijital Pazarlama, Reklam ve Büyüme Granular ---
  {
    key: "technical-seo-audit",
    sectorKey: "sector-marketing-growth",
    sortOrder: 401,
    translations: {
      tr: {
        name: "Teknik SEO ve Site Hızı Optimizasyonu",
        description:
          "Core Web Vitals, site mimarisi denetimi, taranabilirlik, şema işaretleme ve hız iyileştirmesi.",
      },
      en: {
        name: "Technical SEO & Speed Optimization",
        description:
          "Core Web Vitals optimization, crawlability audits, structured data schemas, and site speed.",
      },
    },
  },
  {
    key: "tiktok-video-ads",
    sectorKey: "sector-marketing-growth",
    sortOrder: 402,
    translations: {
      tr: {
        name: "TikTok ve Dikey Video Reklamcılığı",
        description:
          "TikTok Ads Manager kampanya kurgusu, trend kanca analizleri ve dönüşüm optimizasyonu.",
      },
      en: {
        name: "TikTok & Short Video Ads",
        description:
          "TikTok Ads campaigns, vertical video advertising, creative angle testing, and scaling.",
      },
    },
  },
  {
    key: "b2b-growth-linkedin",
    sectorKey: "sector-marketing-growth",
    sortOrder: 403,
    translations: {
      tr: {
        name: "B2B Büyüme ve LinkedIn Lead Generation",
        description:
          "B2B potansiyel müşteri kazanımı, LinkedIn reklamları, profil optimizasyonu ve temas stratejisi.",
      },
      en: {
        name: "B2B Growth & LinkedIn Lead Generation",
        description:
          "B2B customer acquisition, LinkedIn campaign management, executive positioning, and outreach.",
      },
    },
  },
  {
    key: "content-marketing-strategy",
    sectorKey: "sector-marketing-growth",
    sortOrder: 404,
    translations: {
      tr: {
        name: "İçerik Pazarlaması ve Dönüşüm Hunisi",
        description:
          "Organik trafik hunileri, e-kitaplar, vaka çalışmaları ve müşteri edinme stratejileri.",
      },
      en: {
        name: "Content Marketing & Funnel Strategy",
        description:
          "Top-of-funnel content strategy, lead magnets, case studies, and conversion funnel architecture.",
      },
    },
  },

  // --- 5. Video, Animasyon ve Ses Granular ---
  {
    key: "video-color-grading",
    sectorKey: "sector-video-audio",
    sortOrder: 501,
    translations: {
      tr: {
        name: "Video Renk Düzenleme (Color Grading)",
        description:
          "DaVinci Resolve ve Premiere ile sinematik renk uyumu, LUT geliştirme ve ton düzenleme.",
      },
      en: {
        name: "Video Color Grading & Finishing",
        description:
          "Professional DaVinci Resolve color grading, cinematic tone mapping, and broadcast finishing.",
      },
    },
  },
  {
    key: "product-3d-animation",
    sectorKey: "sector-video-audio",
    sortOrder: 502,
    translations: {
      tr: {
        name: "3D Ürün Animasyonu ve Tanıtım",
        description:
          "Blender ve Cinema 4D ile mekanik montaj animasyonları, patlatma görünümleri ve reklam videoları.",
      },
      en: {
        name: "3D Product Animation & Commercials",
        description:
          "Photorealistic 3D product animations, exploded-view technical videos, and commercials.",
      },
    },
  },
  {
    key: "subtitles-transcription",
    sectorKey: "sector-video-audio",
    sortOrder: 503,
    translations: {
      tr: {
        name: "Altyazı, Transkripsiyon ve Dinamik Metinler",
        description:
          "SRT altyazı üretimi, çok dilli çeviri altyazı ve sosyal medya videoları için dinamik yazı efektleri.",
      },
      en: {
        name: "Subtitles, Captions & Transcription",
        description:
          "SRT caption creation, dynamic animated text overlays, and multilingual subtitle localization.",
      },
    },
  },
  {
    key: "sound-design-sfx",
    sectorKey: "sector-video-audio",
    sortOrder: 504,
    translations: {
      tr: {
        name: "Ses Tasarımı ve Efektleri (SFX)",
        description:
          "Film, oyun ve animasyonlar için foley, atmosfer sesleri, geçiş efektleri ve özel ses tasarımı.",
      },
      en: {
        name: "Sound Design & Special Effects (SFX)",
        description:
          "Bespoke audio sound design, foley recording, ambient audio beds, and trailer impact effects.",
      },
    },
  },

  // --- 6. Yazı, Çeviri ve İçerik Üretimi Granular ---
  {
    key: "software-i18n-localization",
    sectorKey: "sector-writing-translation",
    sortOrder: 601,
    translations: {
      tr: {
        name: "Yazılım ve Arayüz Yerelleştirmesi (i18n)",
        description:
          "JSON, PO, XLIFF formatlarında yazılım metinlerinin kültürel ve teknik yerelleştirmesi.",
      },
      en: {
        name: "Software & UI Localization (i18n)",
        description:
          "Developer-friendly localization for software UI, JSON, PO files, and mobile app resources.",
      },
    },
  },
  {
    key: "academic-medical-translation",
    sectorKey: "sector-writing-translation",
    sortOrder: 602,
    translations: {
      tr: {
        name: "Hukuki, Tıbbi ve Akademik Çeviri",
        description:
          "Terminolojik hassasiyet gerektiren resmi dokümanlar, tıbbi raporlar ve akademik tez çevirileri.",
      },
      en: {
        name: "Legal, Medical & Academic Translation",
        description:
          "High-accuracy certified translations for legal contracts, medical reports, and scholarly papers.",
      },
    },
  },
  {
    key: "whitepaper-ebook-writing",
    sectorKey: "sector-writing-translation",
    sortOrder: 603,
    translations: {
      tr: {
        name: "Whitepaper ve E-Kitap Yazımı",
        description:
          "Teknoloji, finans ve blokzincir projeleri için derinlemesine araştırma raporları ve e-kitaplar.",
      },
      en: {
        name: "Whitepaper & E-Book Writing",
        description:
          "Authoritative whitepapers, technical research reports, and downloadable B2B guidebooks.",
      },
    },
  },
  {
    key: "ghostwriting-thought-leadership",
    sectorKey: "sector-writing-translation",
    sortOrder: 604,
    translations: {
      tr: {
        name: "Hayalet Yazarlık ve Liderlik Makaleleri",
        description:
          "Kurucular ve yöneticiler için LinkedIn paylaşımları, sektör analizleri ve köşe yazıları.",
      },
      en: {
        name: "Ghostwriting & Thought Leadership",
        description:
          "Executive ghostwriting, LinkedIn presence articles, keynote speeches, and industry op-eds.",
      },
    },
  },

  // --- 7. İş Yönetimi, Finans ve Danışmanlık Granular ---
  {
    key: "market-research-analysis",
    sectorKey: "sector-business-finance",
    sortOrder: 701,
    translations: {
      tr: {
        name: "Pazar ve Rakip Araştırması",
        description:
          "Pazar büyüklüğü analizi (TAM/SAM/SOM), rakip kıyaslama, SWOT ve stratejik fizibilite raporları.",
      },
      en: {
        name: "Market Research & Competitive Intelligence",
        description:
          "Comprehensive industry market sizing, competitor benchmarking, SWOT, and feasibility studies.",
      },
    },
  },
  {
    key: "pitch-deck-financials",
    sectorKey: "sector-business-finance",
    sortOrder: 702,
    translations: {
      tr: {
        name: "Girişim Değerleme ve Yatırımcı Metrikleri",
        description:
          "Cap table yönetimi, yatırımcı finansalları, değerleme modelleri ve nakit akış senaryoları.",
      },
      en: {
        name: "Startup Valuation & Pitch Financials",
        description:
          "Cap table architecture, pre-money valuation models, unit economics, and burn rate forecasts.",
      },
    },
  },
  {
    key: "operations-process-optimization",
    sectorKey: "sector-business-finance",
    sortOrder: 703,
    translations: {
      tr: {
        name: "Süreç ve Operasyon Optimizasyonu",
        description:
          "Standart operasyon prosedürleri (SOP), şirket içi iş akışları ve operasyonel verimlilik danışmanlığı.",
      },
      en: {
        name: "Operations & Business Process Optimization",
        description:
          "Standard operating procedures (SOPs), process mapping, workflow efficiency, and cost reduction.",
      },
    },
  },

  // --- 8. Hukuk, Mevzuat ve Fikri Mülkiyet Granular ---
  {
    key: "freelance-client-agreements",
    sectorKey: "sector-legal-compliance",
    sortOrder: 801,
    translations: {
      tr: {
        name: "Freelance ve Yazılım Hizmet Sözleşmeleri",
        description:
          "İş kapsamı, telif devri, teslim şartları ve ödeme güvencesi sağlayan iki taraflı sözleşmeler.",
      },
      en: {
        name: "Freelance & Software Service Agreements",
        description:
          "Custom freelance contracts, IP assignment, scope of work clauses, and payment protection terms.",
      },
    },
  },
  {
    key: "nda-confidentiality-drafting",
    sectorKey: "sector-legal-compliance",
    sortOrder: 802,
    translations: {
      tr: {
        name: "Gizlilik Sözleşmesi (NDA) ve Ticari Sır Koruma",
        description:
          "Karşılıklı veya tek taraflı gizlilik anlaşmaları, bilgi güvenliği ve ticari sır koruma protokolleri.",
      },
      en: {
        name: "NDA & Confidentiality Agreements",
        description:
          "Bilateral and unilateral non-disclosure agreements, trade secret protection, and covenants.",
      },
    },
  },
  {
    key: "terms-privacy-saas",
    sectorKey: "sector-legal-compliance",
    sortOrder: 803,
    translations: {
      tr: {
        name: "SaaS ve Uygulama Yasal Metinleri",
        description:
          "Kullanım şartları, çerez politikaları ve son kullanıcı lisans sözleşmeleri (EULA).",
      },
      en: {
        name: "SaaS Terms & Privacy Policies",
        description:
          "Comprehensive SaaS terms of service, acceptable use policies, and end-user license agreements.",
      },
    },
  },

  // --- 9. Mühendislik, Mimarlık ve 3D Granular (Oyun Geliştirme Ayrışımı) ---
  {
    key: "unity-game-development",
    sectorKey: "sector-engineering-3d",
    sortOrder: 901,
    translations: {
      tr: {
        name: "Unity ile Oyun Geliştirme",
        description:
          "C#, mobil, masaüstü, fizik motoru, 2D/3D oyun mekaniği, UI ve performans optimizasyonu.",
      },
      en: {
        name: "Unity Game Development",
        description:
          "Professional C# scripting in Unity, cross-platform physics, game loops, and optimization.",
      },
    },
  },
  {
    key: "unreal-engine-development",
    sectorKey: "sector-engineering-3d",
    sortOrder: 902,
    translations: {
      tr: {
        name: "Unreal Engine & C++ Oyun Geliştirme",
        description:
          "Blueprints, C++ çekirdek sistemleri, Lumen, Nanite, PC ve konsollar için AAA kalitede oyun mimarisi.",
      },
      en: {
        name: "Unreal Engine & C++ Game Development",
        description:
          "Unreal Engine 5 development, C++ gameplay systems, Blueprints, Lumen lighting, and consoles.",
      },
    },
  },
  {
    key: "mobile-casual-game-dev",
    sectorKey: "sector-engineering-3d",
    sortOrder: 903,
    translations: {
      tr: {
        name: "Mobil Oyun Geliştirme (Hypercasual / Casual)",
        description:
          "iOS ve Android için bağımlılık yapıcı oynanış, reklam SDK entegrasyonu ve oyun içi satın alma.",
      },
      en: {
        name: "Mobile Game Development (Casual & Hypercasual)",
        description:
          "Mobile games for iOS and Android, ad network monetization, in-app purchases, and analytics.",
      },
    },
  },
  {
    key: "game-2d-pixel-art",
    sectorKey: "sector-engineering-3d",
    sortOrder: 904,
    translations: {
      tr: {
        name: "2D Oyun Sanatı ve Piksel Çizim",
        description:
          "Sprite sayfaları, karo haritaları (tileset), piksel karakter animasyonları ve 2D oyun arayüzleri.",
      },
      en: {
        name: "2D Game Art & Pixel Art",
        description:
          "Handcrafted pixel art sprites, seamless tilesets, 2D character animations, and game UI.",
      },
    },
  },
  {
    key: "game-3d-assets-characters",
    sectorKey: "sector-engineering-3d",
    sortOrder: 905,
    translations: {
      tr: {
        name: "3D Oyun Varlıkları ve Karakter Modelleme",
        description:
          "Low-poly ve high-poly modeller, iskelet bağlama (rigging), PBR doku kaplama ve oyun motoru entegrasyonu.",
      },
      en: {
        name: "3D Game Assets & Character Modeling",
        description:
          "Game-ready 3D characters, environment props, rigging, PBR texturing, and engine exports.",
      },
    },
  },
  {
    key: "game-level-mechanics-design",
    sectorKey: "sector-engineering-3d",
    sortOrder: 906,
    translations: {
      tr: {
        name: "Oyun Mekaniği ve Seviye (Level) Tasarımı",
        description:
          "Oynanış dengesi, zorluk eğrisi, bölüm tasarımı ve kapsamlı oyun tasarım dokümantasyonu (GDD).",
      },
      en: {
        name: "Level Design & Gameplay Mechanics",
        description:
          "Engaging level geometry, gameplay pacing, puzzle mechanics, and comprehensive GDD documentation.",
      },
    },
  },
  {
    key: "game-audio-music",
    sectorKey: "sector-engineering-3d",
    sortOrder: 907,
    translations: {
      tr: {
        name: "Oyun Sesleri ve Müzik Prodüksiyonu",
        description:
          "Adaptif oyun müziği, atmosferik ses efektleri, menü sesleri ve FMOD/Wwise ses motoru entegrasyonu.",
      },
      en: {
        name: "Game Audio & Interactive Music",
        description:
          "Adaptive background music, interactive sound effects, Foley recording, and FMOD/Wwise integration.",
      },
    },
  },
  {
    key: "architectural-exterior-rendering",
    sectorKey: "sector-engineering-3d",
    sortOrder: 908,
    translations: {
      tr: {
        name: "Dış Cephe ve Peyzaj 3D Görselleştirme",
        description:
          "Bina dış cephesi, çevre düzenlemesi, aydınlatma senaryoları ve fotogerçekçi dış mekan renderları.",
      },
      en: {
        name: "Exterior Architectural 3D Rendering",
        description:
          "Photorealistic exterior visualization, landscape modeling, daylight simulations, and 3D walkthroughs.",
      },
    },
  },
  {
    key: "3d-printing-stl-modeling",
    sectorKey: "sector-engineering-3d",
    sortOrder: 909,
    translations: {
      tr: {
        name: "3D Baskı Modelleme ve STL Hazırlığı",
        description:
          "Katmanlı üretim için tolerans hesapları, destek yapısı, dilimleyici optimizasyonu ve su geçirmez modeller.",
      },
      en: {
        name: "3D Printing & STL Preparation",
        description:
          "Watertight mesh modeling, tolerance analysis, slice optimization, and print-ready STL exports.",
      },
    },
  },
  {
    key: "xr-spatial-computing-vr-ar",
    sectorKey: "sector-engineering-3d",
    sortOrder: 910,
    translations: {
      tr: {
        name: "Mekânsal Bilişim, VR & AR Geliştirme",
        description:
          "Apple Vision Pro, Meta Quest, WebXR, Three.js, Unity XR ve interaktif 3D mekânsal deneyimler.",
      },
      en: {
        name: "Spatial Computing, VR & AR Development",
        description:
          "Apple Vision Pro, Meta Quest, WebXR, Three.js, Unity XR, and interactive spatial experiences.",
      },
    },
  },

  // --- 10. Sanal Asistanlık ve Müşteri Destek Granular ---
  {
    key: "ecommerce-store-operations",
    sectorKey: "sector-operations-support",
    sortOrder: 1001,
    translations: {
      tr: {
        name: "E-Ticaret Mağaza ve Sipariş Operasyon Desteği",
        description:
          "Sipariş işleme, kargo takibi, iade yönetimi, ürün katalog girişi ve müşteri iletişimi.",
      },
      en: {
        name: "E-Commerce Store & Order Operations",
        description:
          "Order processing, inventory updates, tracking dispatch, returns management, and store support.",
      },
    },
  },
  {
    key: "lead-data-enrichment",
    sectorKey: "sector-operations-support",
    sortOrder: 1002,
    translations: {
      tr: {
        name: "Potansiyel Müşteri ve Veri Zenginleştirme",
        description:
          "B2B iletişim bilgileri, doğrulanmış e-posta listeleri, LinkedIn araştırması ve şirket profilleme.",
      },
      en: {
        name: "Lead Generation & Data Enrichment",
        description:
          "Verified B2B prospect lists, corporate contact discovery, LinkedIn research, and CRM enrichment.",
      },
    },
  },
  {
    key: "transcription-audio-to-text",
    sectorKey: "sector-operations-support",
    sortOrder: 1003,
    translations: {
      tr: {
        name: "Ses ve Video Deşifre Desteği",
        description:
          "Toplantı kayıtları, röportajlar, podcast ve duruşma kayıtlarının yazılı metne dönüştürülmesi.",
      },
      en: {
        name: "Audio & Video Transcription",
        description:
          "Accurate verbatim and clean-read transcriptions for business meetings, interviews, and media.",
      },
    },
  },
  {
    key: "photo-editing-retouching",
    sectorKey: "sector-design-creative",
    sortOrder: 305,
    translations: {
      tr: {
        name: "Fotoğraf Düzenleme ve Retouching",
        description:
          "E-ticaret ürün dekupe, katalog görseli hazırlama, renk düzeltme ve profesyonel portre rötuşlama.",
      },
      en: {
        name: "Photo Editing & Retouching",
        description:
          "E-commerce product cutout, catalog imagery, color grading, background removal, and portrait retouching.",
      },
    },
  },
  {
    key: "music-production-beatmaking",
    sectorKey: "sector-video-audio",
    sortOrder: 505,
    translations: {
      tr: {
        name: "Müzik Prodüksiyonu ve Beatmaking",
        description:
          "Özgün müzik besteleme, beat üretimi, reklam jingleları, şarkı aranjmanı ve miks/mastering.",
      },
      en: {
        name: "Music Production & Beatmaking",
        description:
          "Original music composition, beatmaking, commercial jingles, song arrangement, and mixing/mastering.",
      },
    },
  },
  {
    key: "hr-talent-recruitment",
    sectorKey: "sector-business-finance",
    sortOrder: 704,
    translations: {
      tr: {
        name: "İnsan Kaynakları ve Yetenek Avcılığı",
        description:
          "Teknik yetenek bulma (headhunting), mülakat taraması, uzaktan ekip kurma ve İK danışmanlığı.",
      },
      en: {
        name: "HR & Talent Recruitment",
        description:
          "Tech talent scouting, headhunting, candidate screening, remote team building, and HR advisory.",
      },
    },
  },
  {
    key: "online-tutoring-mentorship",
    sectorKey: "sector-business-finance",
    sortOrder: 705,
    translations: {
      tr: {
        name: "Online Eğitim, Özel Ders ve Mentorluk",
        description:
          "Yazılım mentorluğu, yabancı dil eğitimi, teknik mülakat hazırlığı ve LMS eğitim içerik tasarımı.",
      },
      en: {
        name: "Online Tutoring & Mentorship",
        description:
          "Software engineering mentorship, language lessons, technical interview prep, and LMS curriculum design.",
      },
    },
  },
];
