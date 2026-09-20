import type { WizardQuestion } from "../types";

export const writingTranslationQuestions: WizardQuestion[] = [
  {
    key: "contentType",
    type: "single",
    required: true,
    labelKey: "İçerik Türü ve Kapsam",
    labelEn: "Content Type & Nature",
    clarityWeight: 10,
    helpTip: "Üretilecek metnin disiplinini seçin.",
    helpTipEn: "Specify content domain.",
    options: [
      {
        value: "seo_blog_articles",
        label: "SEO Odaklı Blog ve Bilgilendirici Makale İçerikleri",
        labelEn: "SEO Blog Articles & Authority Guides",
      },
      {
        value: "technical_writing_docs",
        label: "Teknik Dokümantasyon, API Kılavuzları ve Whitepaper",
        labelEn: "Technical Documentation & Whitepapers",
      },
      {
        value: "translation_localization",
        label: "Çok Dilli Çeviri ve Kültürel Yerelleştirme (Localization)",
        labelEn: "Multilingual Translation & Localization",
      },
      {
        value: "conversion_sales_copy",
        label: "Satış Sayfası (Landing Page), E-Posta ve Reklam Metinleri",
        labelEn: "Conversion Copywriting & Landing Pages",
      },
    ],
  },
  {
    key: "targetWordCount",
    type: "single",
    required: true,
    labelKey: "Hedef Kelime Hacmi",
    labelEn: "Target Word Volume",
    clarityWeight: 10,
    helpTip: "Yaklaşık kelime sayısını belirtin.",
    helpTipEn: "Select target word count.",
    options: [
      {
        value: "up_to_1000",
        label: "1.000 Kelimeye Kadar (1-2 Makale veya Satış Sayfası)",
        labelEn: "Up to 1,000 Words",
      },
      {
        value: "one_to_three_k",
        label: "1.000 - 3.000 Kelime (Orta Kapsamlı İçerik Seti)",
        labelEn: "1,000 - 3,000 Words",
      },
      {
        value: "three_to_ten_k",
        label: "3.000 - 10.000 Kelime (Kapsamlı Rehber / Seri)",
        labelEn: "3,000 - 10,000 Words",
      },
      {
        value: "over_ten_k",
        label: "10.000+ Kelime (E-Kitap / Kapsamlı Proje)",
        labelEn: "10,000+ Words (Comprehensive E-Book / Corpus)",
      },
    ],
  },
  {
    key: "seoKeywordBriefing",
    type: "single",
    required: true,
    labelKey: "Anahtar Kelime ve Brief Durumu",
    labelEn: "Keyword Research & Brief Status",
    clarityWeight: 10,
    helpTip: "Anahtar kelimelerin hazır olup olmadığını belirtin.",
    helpTipEn: "Define SEO keyword readiness.",
    options: [
      {
        value: "keywords_provided",
        label: "Hedef Anahtar Kelimeler ve Başlık Taslağı Hazır",
        labelEn: "Keywords & Content Brief Supplied by Client",
      },
      {
        value: "research_by_specialist",
        label: "Anahtar Kelime ve Rakip Hacim Analizi Uzmana Ait",
        labelEn: "Keyword & Competitor Research by Specialist",
      },
      {
        value: "non_seo_literary",
        label: "SEO Kriteri Yok; Akıcı, Profesyonel ve Edebi Dil Esastır",
        labelEn: "No SEO Constraints; Clear Professional Style",
      },
    ],
  },
  {
    key: "certificationNeeds",
    type: "single",
    required: true,
    labelKey: "Resmi Tasdik & Yeminli Çeviri İhtiyacı",
    labelEn: "Sworn / Notary Certification Requirement",
    clarityWeight: 10,
    helpTip: "Resmi onay gerekip gerekmediğini seçin.",
    helpTipEn: "Clarify official certification requirements.",
    options: [
      {
        value: "digital_standard",
        label: "Standart Dijital Yayın İçin (Resmi Onay Gerekmez)",
        labelEn: "Standard Digital Publication (No Official Seal)",
      },
      {
        value: "sworn_translator_stamp",
        label: "Yeminli Tercüman İmzalı ve Kaşeli Teslim",
        labelEn: "Sworn Translator Seal & Stamp Required",
      },
      {
        value: "notary_apostille_ready",
        label: "Noter ve Apostil Onayına Hazırlık Kapsamında",
        labelEn: "Notary & Apostille Verification Preparation",
      },
    ],
  },
];
