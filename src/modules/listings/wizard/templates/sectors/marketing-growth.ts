import type { WizardQuestion } from "../types";

export const marketingGrowthQuestions: WizardQuestion[] = [
  {
    key: "adSpendHandling",
    type: "single",
    required: true,
    labelKey: "Reklam Harcaması & Yönetim Bedeli",
    labelEn: "Media Spend vs. Management Fee",
    clarityWeight: 10,
    helpTip: "Reklam bütçesinin yönetim ücretinden ayrık olduğunu netleştirin.",
    helpTipEn: "Differentiate advertising spend from management fees.",
    options: [
      {
        value: "spend_separate",
        label: "Reklam Harcaması Doğrudan İşverenin Kredi Kartından Çekilir (Ayrık)",
        labelEn: "Ad Spend Paid Directly via Client Billing Card",
      },
      {
        value: "all_inclusive_spend",
        label: "Belirtilen Bütçe Reklam Harcaması Dahil Toplam Bedeldir",
        labelEn: "All-Inclusive Budget (Ad Spend + Management Combined)",
      },
    ],
  },
  {
    key: "creativeAssetsSource",
    type: "single",
    required: true,
    labelKey: "Görseller & Reklam Metinleri Kaynağı",
    labelEn: "Creative Assets & Copywriting",
    clarityWeight: 10,
    helpTip: "Banner, video ve reklam metinlerinin kim tarafından üretileceğini seçin.",
    helpTipEn: "Define who produces advertising banners and copy.",
    options: [
      {
        value: "client_provides_assets",
        label: "Görseller ve Ürün Bilgileri İşveren Tarafından Eksiksiz Verilecek",
        labelEn: "Creatives & Copy Provided by Client",
      },
      {
        value: "specialist_creates_creatives",
        label: "Reklam Görselleri ve Copywriting Uzman Tarafından Hazırlanacak",
        labelEn: "Specialist Produces Ad Banners & Copywriting",
      },
      {
        value: "co_production",
        label: "Şablonlar Uzmandan, Ürün Detay ve Fotoğrafları İşverenden",
        labelEn: "Co-produced: Specialist Templates, Client Product Data",
      },
    ],
  },
  {
    key: "primaryKpi",
    type: "single",
    required: true,
    labelKey: "Birincil Başarı Metriği (KPI)",
    labelEn: "Primary Success Metric (KPI)",
    clarityWeight: 10,
    helpTip: "Kampanyanın veya çalışmanın ana başarısının neye göre ölçüleceğini belirtin.",
    helpTipEn: "Select target outcome metric.",
    options: [
      {
        value: "roas_ecommerce",
        label: "E-Ticaret Ciro Büyümesi & ROAS (Reklam Harcaması Getirisi)",
        labelEn: "E-Commerce Revenue Growth & ROAS Target",
      },
      {
        value: "cpl_lead_gen",
        label: "B2B Form / Nitelikli Müşteri Adayı Kazanımı (Düşük CPL)",
        labelEn: "B2B Lead Generation & Low CPL",
      },
      {
        value: "organic_seo_ranking",
        label: "Organik Arama Trafiği ve Hedef Anahtar Kelime Sıralamaları",
        labelEn: "Organic SEO Search Traffic & Keyword Ranks",
      },
      {
        value: "brand_awareness_reach",
        label: "Sosyal Medya Etkileşimi, Erişim ve Marka Bilinirliği",
        labelEn: "Brand Reach, Social Engagement & Community Growth",
      },
    ],
  },
  {
    key: "reportingCadence",
    type: "single",
    required: true,
    labelKey: "Raporlama ve İletişim Sıklığı",
    labelEn: "Reporting & Performance Cadence",
    clarityWeight: 10,
    helpTip: "Haftalık veya aylık rapor beklentinizi belirleyin.",
    helpTipEn: "Set reporting intervals.",
    options: [
      {
        value: "weekly_dashboard",
        label: "Haftalık Yazılı Rapor + Canlı Looker Studio Paneli",
        labelEn: "Weekly Written Briefing + Live Looker Studio Dashboard",
      },
      {
        value: "biweekly_sync",
        label: "İki Haftada Bir Senkron Görüntülü Değerlendirme Toplantısı",
        labelEn: "Bi-weekly Video Sync Call & Performance Review",
      },
      {
        value: "monthly_executive_summary",
        label: "Aylık Kapsamlı Yönetici Özeti ve Yol Haritası",
        labelEn: "Monthly Executive Performance Audit & Roadmap",
      },
    ],
  },
];
