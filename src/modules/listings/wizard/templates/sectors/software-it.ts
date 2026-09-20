import type { WizardQuestion } from "../types";

export const softwareItQuestions: WizardQuestion[] = [
  {
    key: "projectBasis",
    type: "single",
    required: true,
    labelKey: "Projenin Başlangıç Durumu",
    labelEn: "Project Starting Point",
    clarityWeight: 10,
    helpTip: "Projenin sıfırdan mı yoksa mevcut kod tabanı üzerinden mi geliştirileceğini belirtin.",
    helpTipEn: "Specify whether this is a greenfield build or an existing codebase.",
    options: [
      {
        value: "scratch",
        label: "Sıfırdan Yeni Proje (Greenfield)",
        labelEn: "Brand New Build (Greenfield)",
      },
      {
        value: "existing_repo",
        label: "Mevcut Kod Tabanı / Repository Var",
        labelEn: "Existing Codebase / Repository",
      },
      {
        value: "refactor_upgrade",
        label: "Mevcut Kodun Yenilenmesi / Sürüm Geçişi",
        labelEn: "Refactor / Architecture Modernization",
      },
    ],
  },
  {
    key: "designAssets",
    type: "single",
    required: true,
    labelKey: "Tasarım ve Arayüz Kaynakları",
    labelEn: "UI / Design Assets Status",
    clarityWeight: 10,
    helpTip: "Tasarımın hazır olup olmadığını seçmeniz teklif kalitesini doğrudan artırır.",
    helpTipEn: "Clarifying design readiness improves quote accuracy.",
    options: [
      {
        value: "figma_ready",
        label: "Figma / Tasarım Dosyaları Eksiksiz Hazır",
        labelEn: "Figma / UI Specs Fully Prepared",
      },
      {
        value: "wireframe_only",
        label: "Yalnızca Tel Çerçeve (Wireframe) / Taslak Var",
        labelEn: "Wireframes / Sketches Only",
      },
      {
        value: "need_design_from_scratch",
        label: "Arayüz Tasarımı da Uzman Tarafından Yapılmalı",
        labelEn: "Design Must Be Created by Specialist",
      },
    ],
  },
  {
    key: "deploymentResponsibility",
    type: "single",
    required: true,
    labelKey: "Dağıtım ve Canlıya Alma Sorumluluğu",
    labelEn: "Deployment & Infrastructure Ownership",
    clarityWeight: 10,
    helpTip: "Canlıya alma ve sunucu ayarlarının kime ait olduğunu belirleyin.",
    helpTipEn: "Define deployment responsibility to prevent scope creep.",
    options: [
      {
        value: "full_cicd_deployment",
        label: "Canlıya Alma ve CI/CD Kurulumu Uzmana Ait",
        labelEn: "Production Deployment & CI/CD by Specialist",
      },
      {
        value: "code_only_handover",
        label: "Yalnızca Kaynak Kod ve Kurulum Dokümanı Teslimi",
        labelEn: "Code Repository & Setup Guide Only",
      },
      {
        value: "client_infra_assist",
        label: "İşverenin Mevcut Bulut Altyapısına Kurulum Desteği",
        labelEn: "Assisted Setup on Client Cloud Infrastructure",
      },
    ],
  },
  {
    key: "warrantyScope",
    type: "single",
    required: true,
    labelKey: "Hata Düzeltme & Garanti Süresi",
    labelEn: "Bug Fix & Warranty Period",
    clarityWeight: 10,
    helpTip: "Teslimat sonrası garanti süresini netleştirerek anlaşmazlıkları önleyin.",
    helpTipEn: "Establish post-delivery warranty to avoid friction.",
    options: [
      {
        value: "fourteen_days_warranty",
        label: "Teslim Sonrası 14 Gün Ücretsiz Hata Giderme",
        labelEn: "14 Days Free Bug-Fix Warranty",
      },
      {
        value: "thirty_days_warranty",
        label: "Teslim Sonrası 30 Gün Kapsamlı Destek",
        labelEn: "30 Days Comprehensive Support",
      },
      {
        value: "acceptance_signoff_only",
        label: "Kabul Testi Sonrası Destek Yeni Sözleşmeye Tabidir",
        labelEn: "Support Ends at Formal Acceptance",
      },
    ],
  },
];
