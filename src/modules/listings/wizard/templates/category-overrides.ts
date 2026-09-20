import type { WizardQuestion } from "./types";
import { SECTOR_WIZARD_TEMPLATES } from "./sectors";

// Specialized category-level templates (override sector default if matched)
export const CATEGORY_WIZARD_TEMPLATES: Record<string, WizardQuestion[]> = {
  "web-development": SECTOR_WIZARD_TEMPLATES["sector-software-it"] || [],
  "mobile-development": SECTOR_WIZARD_TEMPLATES["sector-software-it"] || [],
  "ai-ml": SECTOR_WIZARD_TEMPLATES["sector-ai-data"] || [],
  cybersecurity: [
    {
      key: "defensiveAuthConfirmed",
      type: "boolean",
      required: true,
      labelKey: "Sistem Sahibi Tarafından Yazılı Yetki ve İzin Verildiğini Onaylıyorum",
      labelEn: "Authorized Written Consent by System Owner Verified",
      clarityWeight: 15,
      helpTip: "Etik sızma testleri için yasal yazılı izin zorunludur.",
      helpTipEn: "Written authorization is legally mandatory for penetration testing.",
    },
    {
      key: "securityScope",
      type: "single",
      required: true,
      labelKey: "Güvenlik Çalışma Türü",
      labelEn: "Security Assessment Type",
      clarityWeight: 15,
      helpTip: "Test veya denetim türünü belirleyin.",
      helpTipEn: "Define security audit scope.",
      options: [
        {
          value: "web_pentest",
          label: "Yetkili Web ve API Sızma Testi (Penetration Test)",
          labelEn: "Authorized Web & API Penetration Testing",
        },
        {
          value: "code_review",
          label: "Statik & Dinamik Kaynak Kod Güvenlik Denetimi",
          labelEn: "Static & Dynamic Source Code Security Audit",
        },
        {
          value: "hardening",
          label: "Bulut ve Sunucu Altyapı Sıkılaştırma (Hardening)",
          labelEn: "Cloud & Infrastructure Hardening",
        },
        {
          value: "compliance_audit",
          label: "KVKK / ISO 27001 / SOC2 Güvenlik Uyumluluğu",
          labelEn: "KVKK / ISO 27001 / SOC2 Compliance Verification",
        },
      ],
    },
    ...(SECTOR_WIZARD_TEMPLATES["sector-software-it"] || []).slice(2),
  ],
};

export const DEFAULT_QUESTIONS: WizardQuestion[] = [
  {
    key: "projectBasis",
    type: "single",
    required: true,
    labelKey: "Projenin Başlangıç Durumu",
    labelEn: "Project Starting Point",
    clarityWeight: 10,
    helpTip: "Projenin sıfırdan mı yoksa mevcut sistem üzerinden mi yapılacağını seçin.",
    options: [
      { value: "scratch", label: "Sıfırdan Yeni Proje", labelEn: "New Project from Scratch" },
      {
        value: "existing_system",
        label: "Mevcut Sistem Üzerine Geliştirme",
        labelEn: "Improvement on Existing System",
      },
    ],
  },
  {
    key: "deliverableStandard",
    type: "single",
    required: true,
    labelKey: "Teslim Edilecek Çıktı Standardı",
    labelEn: "Deliverable Quality Standard",
    clarityWeight: 10,
    helpTip: "Beklenen teslimat çıktısını netleştirin.",
    options: [
      {
        value: "production_ready",
        label: "Eksiksiz Çalışır / Yayına Hazır Teslimat",
        labelEn: "Production-Ready Complete Delivery",
      },
      {
        value: "draft_prototype",
        label: "Prototip / Kavram Kanıtlama (PoC)",
        labelEn: "Prototype / Proof of Concept",
      },
    ],
  },
  {
    key: "revisionPolicy",
    type: "single",
    required: true,
    labelKey: "Revizyon ve İnceleme Koşulları",
    labelEn: "Revision & Review Terms",
    clarityWeight: 10,
    helpTip: "Kapsam dışı anlaşmazlıkları önlemek için revizyon sınırını belirleyin.",
    options: [
      {
        value: "two_rounds",
        label: "2 Tur Kapsamlı Revizyon Dahil",
        labelEn: "2 Revision Rounds Included",
      },
      {
        value: "milestone_signoff",
        label: "Aşama Bazlı Onay ve Kabul",
        labelEn: "Milestone-Based Acceptance",
      },
    ],
  },
];
