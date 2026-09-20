import type { WizardQuestion } from "../types";

export const businessFinanceQuestions: WizardQuestion[] = [
  {
    key: "projectObjective",
    type: "single",
    required: true,
    labelKey: "Çalışmanın Temel Amacı",
    labelEn: "Project Strategic Objective",
    clarityWeight: 10,
    helpTip: "Danışmanlık çıktısının nihai kullanım amacını seçin.",
    helpTipEn: "Define strategic deliverable goal.",
    options: [
      {
        value: "investor_pitch_fundraising",
        label: "Yatırımcı Sunumu ve Fonlama / Değerleme Görüşmeleri",
        labelEn: "Investor Pitch Deck & Valuation Model",
      },
      {
        value: "internal_ops_strategy",
        label: "Şirket İçi Operasyonel Süreç İyileştirme ve Büyüme Stratejisi",
        labelEn: "Internal Operational Efficiency & Strategy",
      },
      {
        value: "financial_forecast_cashflow",
        label: "Finansal Projeksiyon, Nakit Akışı ve Bütçe Modellemesi",
        labelEn: "Financial Projections, Cash Flow & Budgeting",
      },
      {
        value: "due_diligence_mna",
        label: "Finansal Durum Tespiti (Due Diligence) ve Denetim Raporu",
        labelEn: "M&A Due Diligence & Audit Assessment",
      },
    ],
  },
  {
    key: "historicalDataAvailability",
    type: "single",
    required: true,
    labelKey: "Geçmiş Finansal Veri Durumu",
    labelEn: "Historical Financial Records",
    clarityWeight: 10,
    helpTip: "Mevcut finansal kayıtların durumunu belirtin.",
    helpTipEn: "Clarify baseline record quality.",
    options: [
      {
        value: "structured_records_ready",
        label: "Son 2-3 Yıllık Muhasebe / Gelir Tabloları Düzenli ve Hazır",
        labelEn: "2-3 Years Clean P&L / Balance Sheet Records Ready",
      },
      {
        value: "partial_needs_cleanup",
        label: "Parçalı Kayıtlar Var; Temizlenmesi ve Sınıflandırılması Gerekli",
        labelEn: "Partial Records; Cleanup & Classification Required",
      },
      {
        value: "new_venture_zero_history",
        label: "Yeni Girişim (Geçmiş Veri Yok, Sektör Tahminleri Kullanılacak)",
        labelEn: "Early Stage Startup (No Historical Records)",
      },
    ],
  },
  {
    key: "deliverableFormat",
    type: "single",
    required: true,
    labelKey: "Beklenen Çıktı Formatı",
    labelEn: "Deliverable Format",
    clarityWeight: 10,
    helpTip: "Hesaplama tabloları veya sunum formatını belirleyin.",
    helpTipEn: "Define final deliverable package.",
    options: [
      {
        value: "dynamic_sheets_model",
        label: "Dinamik Formüllü Excel / Google Sheets Modeli + Yönetici PDF",
        labelEn: "Dynamic Formula Excel Model + Executive PDF Summary",
      },
      {
        value: "designed_pitch_deck",
        label: "Profesyonel Tasarımlı Sunum Dosyası (PowerPoint / Figma)",
        labelEn: "Polished Pitch Deck (PowerPoint / Figma)",
      },
      {
        value: "comprehensive_advisory_report",
        label: "Yazılı Strateji Raporu ve Uygulama Yol Haritası",
        labelEn: "Written Strategy Report & Implementation Roadmap",
      },
    ],
  },
  {
    key: "ndaRequirement",
    type: "single",
    required: true,
    labelKey: "Gizlilik Sözleşmesi (NDA) Şartı",
    labelEn: "Non-Disclosure Agreement (NDA)",
    clarityWeight: 10,
    helpTip: "Proje öncesi NDA imzalanması gerekip gerekmediğini belirtin.",
    helpTipEn: "Specify whether custom NDA is mandatory.",
    options: [
      {
        value: "custom_nda_mandatory",
        label: "Çalışmaya Başlamadan Önce İki Taraflı Özel NDA İmzalanmalıdır",
        labelEn: "Mutual Custom NDA Mandatory Before Briefing",
      },
      {
        value: "platform_standard_nda",
        label: "Operis Standart Gizlilik ve Güvenlik Hükümleri Yeterlidir",
        labelEn: "Standard Operis Platform Terms Sufficient",
      },
    ],
  },
];
