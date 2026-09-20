import { getTemplateQuestions, type WizardQuestion } from "./templates";
import { validateContentAppropriateness } from "@/src/lib/security/content-moderator";

export interface ScopeSynthesizerInput {
  title: string;
  summary: string;
  categoryName?: string;
  categorySlug?: string;
  sectorKey?: string;
  projectType?: string;
  projectStage?: string;
  tags?: string[];
  answers: Record<string, unknown>;
  customNotes?: string;
  locale?: string;
}

export interface ClarityScoreResult {
  score: number;
  level: "needs_work" | "good" | "excellent";
  tips: string[];
  answeredQuestionsCount: number;
  totalQuestionsCount: number;
}

const PROJECT_TYPE_LABELS: Record<string, { tr: string; en: string }> = {
  new_build: { tr: "Sıfırdan Yeni Proje / Ürün Geliştirme", en: "New Greenfield Build" },
  improvement: { tr: "Mevcut Sistemi Geliştirme & Özellik Eklenmesi", en: "Feature Improvement" },
  bug_fix: { tr: "Hata Çözümü & Performans Optimizasyonu", en: "Bug Fix & Optimization" },
  migration: { tr: "Altyapı / Versiyon / Teknoloji Geçişi", en: "Migration & Modernization" },
  integration: { tr: "API, Veri ve 3. Parti Servis Entegrasyonu", en: "API & Third-Party Integration" },
  consulting: { tr: "Teknik Mimari & Stratejik Danışmanlık", en: "Technical Advisory & Consulting" },
  audit: { tr: "Güvenlik, Kod ve Süreç Denetimi", en: "Security & Codebase Audit" },
  maintenance: { tr: "Düzenli Bakım, Destek ve İyileştirme", en: "Ongoing Maintenance & Support" },
};

const PROJECT_STAGE_LABELS: Record<string, { tr: string; en: string }> = {
  idea: { tr: "Kavramsal / Fikir Aşaması", en: "Conceptual / Idea Stage" },
  requirements_ready: { tr: "Gereksinimler ve Akışlar Hazır", en: "Requirements Documented" },
  design_ready: { tr: "Tasarım / UI Dosyaları Hazır", en: "UI / Designs Ready" },
  existing_code: { tr: "Mevcut Kod Tabanı / Çalışan Sistem Var", en: "Existing Codebase / System" },
  production_system: { tr: "Canlıda Çalışan Üretim Ortamı", en: "Active Production System" },
};

function formatAnswerText(
  question: WizardQuestion,
  answer: unknown,
  isTr: boolean
): string | null {
  if (answer === undefined || answer === null || answer === "") return null;

  if (question.type === "boolean") {
    const boolVal = Boolean(answer);
    if (isTr) {
      return boolVal ? "Evet, Kapsama Dahil" : "Hayır, Kapsam Dışı";
    }
    return boolVal ? "Yes, Included" : "No, Not Required";
  }

  if (question.type === "single" && question.options) {
    const opt = question.options.find((o) => o.value === String(answer));
    if (opt) {
      return isTr ? opt.label : opt.labelEn || opt.label;
    }
  }

  if (question.type === "multi" && Array.isArray(answer) && question.options) {
    const selected = question.options.filter((o) => answer.includes(o.value));
    if (selected.length > 0) {
      return selected.map((s) => (isTr ? s.label : s.labelEn || s.label)).join(", ");
    }
  }

  return String(answer);
}

/**
 * Synthesizes a structured, comprehensive, and professional 4-part RFP specification
 * in standard Markdown based on category-adaptive answers and employer inputs.
 */
export function synthesizeScope(input: ScopeSynthesizerInput): string {
  const isTr = input.locale !== "en";
  const questions = getTemplateQuestions(input.categorySlug, input.sectorKey);

  const lines: string[] = [];

  // 1. Proje Amacı ve Genel Çerçeve
  lines.push(isTr ? "### 1. Proje Amacı ve Genel Çerçeve" : "### 1. Project Objective & Strategic Context");

  if (input.summary?.trim()) {
    lines.push(input.summary.trim());
  } else {
    lines.push(
      isTr
        ? "Bu projenin temel hedefi, yüksek kalite standartlarında, modern ve sürdürülebilir bir çalışma ortaya koymaktır."
        : "The primary objective of this project is to deliver a modern, high-quality, and robust solution."
    );
  }

  const projectTypeLabel = input.projectType
    ? PROJECT_TYPE_LABELS[input.projectType]?.[isTr ? "tr" : "en"] || input.projectType
    : null;
  const projectStageLabel = input.projectStage
    ? PROJECT_STAGE_LABELS[input.projectStage]?.[isTr ? "tr" : "en"] || input.projectStage
    : null;

  if (input.categoryName || projectTypeLabel || projectStageLabel) {
    lines.push("");
    if (input.categoryName) {
      lines.push(
        isTr
          ? `- **Ana Disiplin / Kategori:** ${input.categoryName}`
          : `- **Primary Discipline / Category:** ${input.categoryName}`
      );
    }
    if (projectTypeLabel) {
      lines.push(
        isTr
          ? `- **İşin Niteliği:** ${projectTypeLabel}`
          : `- **Project Nature:** ${projectTypeLabel}`
      );
    }
    if (projectStageLabel) {
      lines.push(
        isTr
          ? `- **Mevcut Proje Durumu:** ${projectStageLabel}`
          : `- **Project Stage:** ${projectStageLabel}`
      );
    }
  }

  lines.push("");

  // 2. Mevcut Varlıklar ve Teknik / Operasyonel Ortam
  lines.push(
    isTr
      ? "### 2. Mevcut Varlıklar ve Başlangıç Koşulları"
      : "### 2. Baseline Assets & Technical Environment"
  );

  const assetQuestions = questions.filter(
    (q) =>
      q.key.toLowerCase().includes("asset") ||
      q.key.toLowerCase().includes("basis") ||
      q.key.toLowerCase().includes("data") ||
      q.key.toLowerCase().includes("cad") ||
      q.key.toLowerCase().includes("footage") ||
      q.key.toLowerCase().includes("historical") ||
      q.key.toLowerCase().includes("template")
  );

  let assetFound = false;
  for (const q of assetQuestions) {
    const val = input.answers[q.key];
    const text = formatAnswerText(q, val, isTr);
    if (text) {
      lines.push(`- **${isTr ? q.labelKey : q.labelEn || q.labelKey}:** ${text}`);
      assetFound = true;
    }
  }

  if (input.tags && input.tags.length > 0) {
    lines.push(
      isTr
        ? `- **İlgili Teknolojiler & Beceriler:** ${input.tags.join(", ")}`
        : `- **Relevant Tech & Skill Stack:** ${input.tags.join(", ")}`
    );
    assetFound = true;
  }

  if (!assetFound) {
    lines.push(
      isTr
        ? "- İşe başlangıç için gerekli tüm teknik ve idari dokümanlar işveren tarafından sağlanacaktır."
        : "- All necessary technical briefings and assets will be shared upon onboarding."
    );
  }

  lines.push("");

  // 3. Beklenen Teslim Edilecek Çıktılar ve Standartlar
  lines.push(
    isTr
      ? "### 3. Teslim Edilecek Çıktılar ve Standartlar"
      : "### 3. Target Deliverables & Milestones"
  );

  const deliverableQuestions = questions.filter(
    (q) =>
      q.key.toLowerCase().includes("deliverable") ||
      q.key.toLowerCase().includes("deployment") ||
      q.key.toLowerCase().includes("format") ||
      q.key.toLowerCase().includes("concept") ||
      q.key.toLowerCase().includes("kpi") ||
      q.key.toLowerCase().includes("duration") ||
      q.key.toLowerCase().includes("aspect") ||
      q.key.toLowerCase().includes("wordcount") ||
      q.key.toLowerCase().includes("application") ||
      q.key.toLowerCase().includes("tools") ||
      q.key.toLowerCase().includes("model") ||
      q.key.toLowerCase().includes("metric") ||
      q.key.toLowerCase().includes("security")
  );

  for (const q of deliverableQuestions) {
    const val = input.answers[q.key];
    const text = formatAnswerText(q, val, isTr);
    if (text) {
      lines.push(`- **${isTr ? q.labelKey : q.labelEn || q.labelKey}:** ${text}`);
    }
  }

  lines.push(
    isTr
      ? "- Eksiksiz, hatasız ve kararlaştırılan standartlara uygun nihai teslimat"
      : "- Complete, bug-free, and production-standard verified handover"
  );
  lines.push(
    isTr
      ? "- İlgili kaynak dosyalar, kullanım/kurulum rehberi ve şeffaf devir teslim"
      : "- Complete source files, documentation, and structured transition guide"
  );

  lines.push("");

  // 4. Kapsam Dışı Sınırlar, Revizyon ve Garanti Koşulları
  lines.push(
    isTr
      ? "### 4. Kapsam Sınırları, Revizyon ve Garanti Koşulları"
      : "### 4. Scope Boundaries, Revisions & Warranty"
  );

  const boundaryQuestions = questions.filter(
    (q) =>
      q.key.toLowerCase().includes("revision") ||
      q.key.toLowerCase().includes("warranty") ||
      q.key.toLowerCase().includes("spend") ||
      q.key.toLowerCase().includes("cost") ||
      (q.key.toLowerCase().includes("nda") && !q.key.toLowerCase().includes("brand")) ||
      q.key.toLowerCase().includes("certification") ||
      q.key.toLowerCase().includes("litigation") ||
      q.key.toLowerCase().includes("review") ||
      q.key.toLowerCase().includes("hours") ||
      q.key.toLowerCase().includes("commitment")
  );

  for (const q of boundaryQuestions) {
    const val = input.answers[q.key];
    const text = formatAnswerText(q, val, isTr);
    if (text) {
      lines.push(`- **${isTr ? q.labelKey : q.labelEn || q.labelKey}:** ${text}`);
    }
  }

  lines.push(
    isTr
      ? "- Kararlaştırılan kapsam dışındaki ek özellik talepleri yeni bir iş veya revizyon bedeline tabidir."
      : "- Out-of-scope feature requests require an agreed-upon milestone extension."
  );
  lines.push(
    isTr
      ? "- İletişim ve iş akışı Operis platform güvencesiyle yürütülecektir."
      : "- Milestone progress and sign-offs are conducted under Operis platform terms."
  );

  // 5. İşverenin Özel Notları (Opsiyonel)
  if (input.customNotes && input.customNotes.trim().length > 0) {
    const cleanNotes = input.customNotes.trim();
    lines.push("");
    lines.push(
      isTr
        ? "### 5. İşverenin Özel Notları ve Ek Detaylar"
        : "### 5. Client Specific Notes & Additional Details"
    );
    lines.push(cleanNotes);
  }

  return lines.join("\n");
}

/**
 * Calculates real-time 0–100 clarity score with category-adaptive weights
 * and actionable guidance tips.
 */
export function calculateClarityScore(
  formData: {
    title: string;
    summary: string;
    tagsInput?: string;
    projectType?: string;
    projectStage?: string;
    answers: Record<string, unknown>;
    customNotes?: string;
    scope?: string;
  },
  questions: WizardQuestion[],
  locale: string = "tr"
): ClarityScoreResult {
  const isTr = locale !== "en";
  let score = 0;
  const tips: string[] = [];

  // 1. Title Quality (Max 15 pts)
  const titleLen = formData.title.trim().length;
  if (titleLen >= 20 && titleLen <= 120) {
    const isAllCaps =
      titleLen > 15 &&
      (formData.title.match(/[A-ZĞÜŞİÖÇ]/g) || []).length / titleLen > 0.7;
    if (isAllCaps) {
      score += 5;
      tips.push(
        isTr
          ? "Başlığı tamamen büyük harfler yerine kurallara uygun yazın."
          : "Avoid using all-caps in the title."
      );
    } else {
      score += 15;
    }
  } else if (titleLen > 0) {
    score += Math.round((titleLen / 20) * 10);
    tips.push(
      isTr
        ? "İlan başlığını en az 20 karaktere çıkararak projenin amacını özetleyin."
        : "Expand title to at least 20 characters."
    );
  } else {
    tips.push(
      isTr
        ? "Projenizi özetleyen profesyonel bir başlık girin."
        : "Provide a clear project title."
    );
  }

  // 2. Summary Quality (Max 15 pts)
  const summaryLen = formData.summary.trim().length;
  if (summaryLen >= 80 && summaryLen <= 280) {
    score += 15;
  } else if (summaryLen > 0) {
    score += Math.round(Math.min(summaryLen / 80, 1) * 10);
    tips.push(
      isTr
        ? `Kısa özeti en az 80 karaktere çıkarın (şu an: ${summaryLen}/80).`
        : `Expand short summary to at least 80 characters (currently: ${summaryLen}/80).`
    );
  } else {
    tips.push(
      isTr
        ? "İlan kartlarında ve aramalarda görünecek 80-280 karakterlik kısa özet yazın."
        : "Provide a short preview summary (80-280 chars)."
    );
  }

  // 3. Category / Sector Questions (Max 40 pts)
  const totalQuestions = questions.length;
  let answeredCount = 0;

  if (totalQuestions > 0) {
    const pointsPerQuestion = 40 / totalQuestions;
    for (const q of questions) {
      const val = formData.answers[q.key];
      const isAnswered =
        val !== undefined &&
        val !== null &&
        val !== "" &&
        (!Array.isArray(val) || val.length > 0);

      if (isAnswered) {
        answeredCount++;
        score += pointsPerQuestion;
      } else if (q.helpTip) {
        tips.push(isTr ? q.helpTip : q.helpTipEn || q.helpTip);
      }
    }
  } else {
    score += 40;
  }

  // 4. Technology / Skills Tags (Max 10 pts)
  const tags = (formData.tagsInput || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (tags.length >= 2) {
    score += 10;
  } else if (tags.length === 1) {
    score += 5;
    tips.push(
      isTr
        ? "En az 2 adet teknoloji / beceri etiketi ekleyerek uzmanların sizi bulmasını kolaylaştırın."
        : "Add at least 2 technology/skill tags."
    );
  } else {
    tips.push(
      isTr
        ? "Projeyle ilgili popüler teknoloji etiketlerini seçin."
        : "Select relevant technology tags."
    );
  }

  // 5. Project Type & Project Stage (Max 10 pts)
  let contextPts = 0;
  if (formData.projectType) contextPts += 5;
  if (formData.projectStage) contextPts += 5;
  score += contextPts;
  if (contextPts < 10) {
    tips.push(
      isTr
        ? "İş türünü ve projenin mevcut aşamasını seçin."
        : "Select job type and project stage."
    );
  }

  // 6. Custom Notes / Rich Specification Detail (Max 10 pts)
  const hasCustomNotes = Boolean(
    formData.customNotes && formData.customNotes.trim().length >= 20
  );
  const scopeLen = (formData.scope || "").trim().length;
  if (hasCustomNotes || scopeLen >= 400) {
    score += 10;
  } else if (scopeLen >= 200) {
    score += 5;
  }

  // Clamp score
  const finalScore = Math.min(Math.max(Math.round(score), 0), 100);

  let level: "needs_work" | "good" | "excellent" = "needs_work";
  if (finalScore >= 80) {
    level = "excellent";
  } else if (finalScore >= 50) {
    level = "good";
  }

  return {
    score: finalScore,
    level,
    tips: tips.slice(0, 3), // return top 3 actionable guidance tips
    answeredQuestionsCount: answeredCount,
    totalQuestionsCount: totalQuestions,
  };
}

/**
 * Validates employer custom notes against abuse and prohibited contact exchange.
 */
export function validateCustomNotes(notes: string): { isValid: boolean; error?: string } {
  if (!notes || notes.trim().length === 0) return { isValid: true };

  const mod = validateContentAppropriateness(notes);
  if (!mod.isValid) {
    return {
      isValid: false,
      error: mod.reason || "Not alanında topluluk kurallarına aykırı veya uygunsuz içerik tespit edildi.",
    };
  }

  return { isValid: true };
}
