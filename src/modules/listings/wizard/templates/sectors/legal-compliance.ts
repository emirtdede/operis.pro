import type { WizardQuestion } from "../types";

export const legalComplianceQuestions: WizardQuestion[] = [
  {
    key: "legalDomain",
    type: "single",
    required: true,
    labelKey: "Hukuki Uzmanlık Alanı",
    labelEn: "Legal Domain & Subject Matter",
    clarityWeight: 10,
    helpTip: "İhtiyaç duyulan hukuki alanını seçin.",
    helpTipEn: "Specify legal area.",
    options: [
      {
        value: "kvkk_gdpr_privacy",
        label: "KVKK & GDPR Veri Koruma Uyumu ve Çerez Politikaları",
        labelEn: "KVKK & GDPR Privacy Compliance & Policies",
      },
      {
        value: "commercial_contracts_saas",
        label: "Ticari Sözleşmeler (SaaS Kullanıcı Sözleşmesi, Gizlilik, Bayilik)",
        labelEn: "Commercial Contracts (SaaS Terms, Vendor, NDA)",
      },
      {
        value: "intellectual_property_trademark",
        label: "Fikri Mülkiyet, Marka ve Telif Hakları Tescil Süreci",
        labelEn: "Intellectual Property & Trademark Filings",
      },
      {
        value: "startup_incorporation_equity",
        label: "Şirket Kuruluşu, Ana Sözleşme ve Ortaklar Sözleşmesi (SHA)",
        labelEn: "Incorporation, Articles of Association & SHA",
      },
    ],
  },
  {
    key: "jurisdiction",
    type: "single",
    required: true,
    labelKey: "Geçerli Yargı ve Ülke Mevzuatı",
    labelEn: "Applicable Jurisdiction & Law",
    clarityWeight: 10,
    helpTip: "Sözleşmenin hangi ülke hukukuna tabi olacağını belirtin.",
    helpTipEn: "Select governing law.",
    options: [
      {
        value: "turkey_law",
        label: "Türkiye Cumhuriyeti Hukuku (TTK, TBK, KVKK)",
        labelEn: "Republic of Turkey Jurisdiction (TCC, KVKK)",
      },
      {
        value: "european_union_law",
        label: "Avrupa Birliği Mevzuatı & GDPR",
        labelEn: "European Union Law & GDPR",
      },
      {
        value: "us_delaware_law",
        label: "Amerika Birleşik Devletleri (Delaware / Uluslararası Ticaret)",
        labelEn: "United States (Delaware / US Commercial Law)",
      },
      {
        value: "cross_border_international",
        label: "Çok Uluslu / Sınır Ötesi Hibrit Sözleşme Düzeni",
        labelEn: "Cross-Border / Multi-Jurisdiction Hybrid",
      },
    ],
  },
  {
    key: "templateStatus",
    type: "single",
    required: true,
    labelKey: "Mevcut Taslak / Şablon Durumu",
    labelEn: "Current Draft / Template Status",
    clarityWeight: 10,
    helpTip: "Elinizde mevcut bir taslak sözleşme olup olmadığını seçin.",
    helpTipEn: "Define starting contract draft status.",
    options: [
      {
        value: "draft_exists_needs_review",
        label: "Mevcut Taslak Var; Hukuki İnceleme ve Risk Revizyonu Yapılmalı",
        labelEn: "Draft Exists; Legal Review & Risk Redlining Required",
      },
      {
        value: "from_scratch_drafting",
        label: "İhtiyaca Özel Sıfırdan Sözleşme Metni Hazırlanacak",
        labelEn: "From Scratch Custom Legal Drafting",
      },
      {
        value: "comprehensive_audit",
        label: "Uçtan Uca Kurumsal Uyumluluk ve Süreç Denetimi",
        labelEn: "Full Corporate Compliance Audit",
      },
    ],
  },
  {
    key: "litigationRepresentation",
    type: "single",
    required: true,
    labelKey: "Hizmetin Niteliği (Danışmanlık vs. Dava)",
    labelEn: "Scope of Service (Advisory vs. Litigation)",
    clarityWeight: 10,
    helpTip: "Hizmetin danışmanlık mı yoksa adli temsil mi olduğunu netleştirin.",
    helpTipEn: "Clarify whether court representation is expected.",
    options: [
      {
        value: "pure_advisory_contract",
        label: "Yalnızca Hukuki Danışmanlık ve Metin Hazırlığı (Dava Hariçtir)",
        labelEn: "Legal Advisory & Drafting Only (No Court Litigation)",
      },
      {
        value: "dispute_preparation",
        label: "Uyuşmazlık Çözümü ve Dava Öncesi İhtarname / Müzakere Hazırlığı",
        labelEn: "Dispute Pre-Litigation Notice & Settlement Preparation",
      },
    ],
  },
];
