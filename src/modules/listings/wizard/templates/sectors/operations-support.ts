import type { WizardQuestion } from "../types";

export const operationsSupportQuestions: WizardQuestion[] = [
  {
    key: "workingHoursModel",
    type: "single",
    required: true,
    labelKey: "Çalışma Saatleri & İletişim Modeli",
    labelEn: "Working Hours & Schedule",
    clarityWeight: 10,
    helpTip: "Sabit saatli mi yoksa görev odaklı mı çalışılacağını belirleyin.",
    helpTipEn: "Define working hours cadence.",
    options: [
      {
        value: "fixed_business_hours",
        label: "Sabit Mesai Saatleri (Hafta İçi 09:00 - 18:00 Canlı Destek)",
        labelEn: "Fixed Business Hours (Mon-Fri 09:00 - 18:00 Live)",
      },
      {
        value: "flexible_async",
        label: "Esnek ve Görev Bazlı Asenkron Çalışma",
        labelEn: "Flexible Task-Based Asynchronous Operations",
      },
      {
        value: "weekend_shifts",
        label: "Vardiyalı / Hafta Sonu Kapsamlı Canlı Nöbet",
        labelEn: "Shift-Based / Weekend Live Coverage",
      },
    ],
  },
  {
    key: "toolsStack",
    type: "single",
    required: true,
    labelKey: "Kullanılacak Araçlar & Platformlar",
    labelEn: "Operational Tools & Helpdesk",
    clarityWeight: 10,
    helpTip: "Asistanın kullanacağı yazılımları belirleyin.",
    helpTipEn: "Select target software tools.",
    options: [
      {
        value: "crm_helpdesk_intercom",
        label: "Müşteri Destek Sistemleri (Zendesk, Freshdesk, Intercom, LiveChat)",
        labelEn: "Helpdesk & CRM (Zendesk, Freshdesk, Intercom)",
      },
      {
        value: "ecom_backoffice",
        label: "E-Ticaret Yönetim Panelleri (Shopify, Trendyol, Amazon, Hepsiburada)",
        labelEn: "E-Commerce Dashboards (Shopify, Amazon, Marketplaces)",
      },
      {
        value: "office_notion_sheets",
        label: "Ofis & Veri Düzenleme (Google Workspace, Excel, Notion, Slack)",
        labelEn: "Workspace Management (Google Workspace, Excel, Notion)",
      },
    ],
  },
  {
    key: "languageProficiency",
    type: "single",
    required: true,
    labelKey: "Destek Verilecek Diller",
    labelEn: "Support Languages",
    clarityWeight: 10,
    helpTip: "Yazışma veya sesli görüşme dillerini seçin.",
    helpTipEn: "Select language requirements.",
    options: [
      {
        value: "turkish_only",
        label: "Yalnızca Türkçe İletişim",
        labelEn: "Turkish Communication Only",
      },
      {
        value: "fluent_turkish_english",
        label: "Akıcı Türkçe ve İngilizce Yazışma / Çağrı",
        labelEn: "Fluent Turkish & English Written/Spoken",
      },
      {
        value: "multilingual_german_arabic",
        label: "Çok Dilli (Almanca, Fransızca, Arapça vb.)",
        labelEn: "Multilingual (German, French, Arabic, etc.)",
      },
    ],
  },
  {
    key: "weeklyCommitment",
    type: "single",
    required: true,
    labelKey: "Haftalık Zaman Taahhüdü",
    labelEn: "Weekly Time Commitment",
    clarityWeight: 10,
    helpTip: "Haftalık tahmini çalışma saati beklentisini seçin.",
    helpTipEn: "Define weekly hours expected.",
    options: [
      {
        value: "part_time_10_20",
        label: "Yarı Zamanlı (Haftalık 10 - 20 Saat)",
        labelEn: "Part-Time (10 - 20 Hours / Week)",
      },
      {
        value: "full_time_40",
        label: "Tam Zamanlı (Haftalık 40 Saat)",
        labelEn: "Full-Time (40 Hours / Week)",
      },
      {
        value: "task_project_basis",
        label: "Belirli Görev Tamamlanana Kadar Proje Bazlı",
        labelEn: "Task / Project-Based Milestone Engagement",
      },
    ],
  },
];
