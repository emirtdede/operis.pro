import type { WizardQuestion } from "../types";

export const designCreativeQuestions: WizardQuestion[] = [
  {
    key: "brandAssets",
    type: "single",
    required: true,
    labelKey: "Mevcut Marka Varlıkları ve Kurumsal Kimlik",
    labelEn: "Brand Assets & Visual Identity Status",
    clarityWeight: 10,
    helpTip: "Tasarımcının hangi marka materyallerinden yararlanacağını belirtin.",
    helpTipEn: "Define starting branding guidelines.",
    options: [
      {
        value: "guidelines_ready",
        label: "Marka Rehberi, Logo ve Renk Paleti Eksiksiz Hazır",
        labelEn: "Brand Guidelines, Logo & Color Palette Ready",
      },
      {
        value: "logo_only",
        label: "Yalnızca Logo Var; Görsel Dil Sıfırdan Kurulmalı",
        labelEn: "Logo Only; Visual System to Be Created",
      },
      {
        value: "scratch_branding",
        label: "Sıfırdan Yeni Marka Kimliği Oluşturulacak",
        labelEn: "Brand Identity from Scratch",
      },
    ],
  },
  {
    key: "conceptOptions",
    type: "single",
    required: true,
    labelKey: "Sunulacak İlk Konsept Alternatif Sayısı",
    labelEn: "Initial Concept Directions",
    clarityWeight: 10,
    helpTip: "İlk aşamada kaç farklı yaratıcı yönelim sunulacağını seçin.",
    helpTipEn: "Select initial design variations.",
    options: [
      {
        value: "one_deep_concept",
        label: "1 Adet Derinlemesine Çalışılmış Olgun Konsept",
        labelEn: "1 Polished, Well-Developed Concept",
      },
      {
        value: "two_distinct_directions",
        label: "2 Farklı Görsel Yaklaşım ve Tasarım Yönelimi",
        labelEn: "2 Distinct Creative Directions",
      },
      {
        value: "three_directions",
        label: "3 Farklı Yaratıcı Alternatif",
        labelEn: "3 Creative Alternatives",
      },
    ],
  },
  {
    key: "revisionRounds",
    type: "single",
    required: true,
    labelKey: "Dahil Olan Revizyon Tur Sınırı",
    labelEn: "Included Revision Rounds",
    clarityWeight: 10,
    helpTip: "Süreçte belirsizlikleri önlemek için revizyon sınırını belirleyin.",
    helpTipEn: "Establish revision limit to prevent infinite iteration.",
    options: [
      {
        value: "two_rounds",
        label: "2 Tur Kapsamlı Revizyon Dahil",
        labelEn: "2 Thorough Revision Rounds Included",
      },
      {
        value: "three_rounds",
        label: "3 Tur Detaylı Revizyon Dahil",
        labelEn: "3 Detailed Revision Rounds Included",
      },
      {
        value: "milestone_approved",
        label: "Her Aşama Ayrı Onaylanır; Onay Sonrası Değişiklik Ek Ücrettir",
        labelEn: "Milestone-Based Approvals; Post-Approval Adds Extra",
      },
    ],
  },
  {
    key: "deliverableFormats",
    type: "single",
    required: true,
    labelKey: "Teslim Edilecek Dosya Formatları",
    labelEn: "Deliverable File Formats",
    clarityWeight: 10,
    helpTip: "Teslimat çıktısının formatını belirleyin.",
    helpTipEn: "Clarify expected source and export formats.",
    options: [
      {
        value: "figma_and_vectors",
        label: "Düzenlenebilir Figma Dosyası + Vektörel SVG/AI Çıktıları",
        labelEn: "Editable Figma Source + Vector SVG/AI Exports",
      },
      {
        value: "dev_ready_tokens",
        label: "Developer Handoff (Design Tokens, Responsive Auto-Layout)",
        labelEn: "Developer Handoff (Tokens, Responsive Layout)",
      },
      {
        value: "high_res_exports_only",
        label: "Yalnızca Yüksek Çözünürlüklü PNG/PDF/WebP Çıktıları",
        labelEn: "High-Resolution PNG / PDF / WebP Exports Only",
      },
    ],
  },
];
