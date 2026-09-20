/**
 * Operis AI — Proposal Pitch Doctor Engine
 *
 * Evaluates freelance developer proposal drafts against job listing requirements.
 * Implements a 5-dimensional heuristic scoring algorithm:
 *   1. Technical & Architecture Alignment (25%)
 *   2. Delivery Milestones & Work Breakdown (25%)
 *   3. Timeline & Velocity Commitment (20%)
 *   4. Problem-First & Client-Centric Framing (15%)
 *   5. Professionalism & Cliche / Red-Flag Audit (15%)
 *
 * Provides actionable constructive feedback and 1-click tailored enhancements.
 */

export interface ListingContext {
  id?: string;
  title: string;
  scope?: string | null;
  summary?: string | null;
  tags?: string[] | null;
  categoryName?: string | null;
  budgetMin?: string | number | null;
  budgetMax?: string | number | null;
  budgetCurrency?: string | null;
  budgetMode?: string | null;
  timelineValue?: number | null;
  timelineUnit?: string | null;
  targetDate?: string | null;
}

export interface ProposalDraft {
  message: string;
  proposedBudgetMin?: string | number | null;
  proposedBudgetMax?: string | number | null;
  proposedCurrency?: string | null;
  proposedTimelineValue?: number | null;
  proposedTimelineUnit?: string | null;
}

export interface PitchDimensionScore {
  id: "architecture" | "milestones" | "timeline" | "client_focus" | "professionalism";
  label: string;
  score: number; // 0 - 100
  weight: number; // e.g. 0.25
  status: "excellent" | "good" | "needs_improvement" | "critical";
  feedback: string;
}

export interface PitchEvaluationResult {
  overallScore: number; // 0 - 100
  tier: "top_tier" | "strong" | "average" | "weak";
  tierLabel: string;
  tierDescription: string;
  dimensions: PitchDimensionScore[];
  strengths: string[];
  gaps: string[];
  redFlags: string[];
  actionableTips: string[];
  analyzedKeywords: {
    requiredTech: string[];
    matchedTech: string[];
    missingTech: string[];
  };
}

export interface ProposalEnhancementResult {
  suggestedArchitectureSnippet: string;
  suggestedMilestonesSnippet: string;
  suggestedTimelineSnippet: string;
  fullEnhancedMessage: string;
}

// Low-effort / lazy cliches that cause employers to immediately discard proposals
const CLICHE_PATTERNS_TR = [
  /\bben yaparım\b/i,
  /\byaparız\b/i,
  /\bhemen yapalım\b/i,
  /\bhalledeyim\b/i,
  /\bhalledebilirim\b/i,
  /\biletişime geçin\b/i,
  /\bulaşabilirsiniz\b/i,
  /\bkonuşalım\b/i,
  /\bdetayları konuşalım\b/i,
  /\bdetayları yazın\b/i,
  /\bdm atın\b/i,
  /\bdm den yazın\b/i,
  /\bnumaramı bırakayım\b/i,
  /\barayın\b/i,
  /\bwhatsapp\b/i,
];

const CLICHE_PATTERNS_EN = [
  /\bi can do this\b/i,
  /\bi will do this\b/i,
  /\bwe can do this\b/i,
  /\blet'?s talk\b/i,
  /\blet'?s chat\b/i,
  /\bcontact me\b/i,
  /\bdm me\b/i,
  /\bmessage me\b/i,
  /\bping me\b/i,
  /\bcall me\b/i,
  /\bwhatsapp me\b/i,
];

// Common technology dictionary for extracting technical stacks from listing titles and scope
const KNOWN_TECH_TAXONOMY = [
  "react",
  "next.js",
  "nextjs",
  "vue",
  "vue.js",
  "nuxt",
  "angular",
  "svelte",
  "tailwind",
  "tailwindcss",
  "css",
  "html",
  "typescript",
  "javascript",
  "node.js",
  "nodejs",
  "express",
  "nestjs",
  "python",
  "django",
  "fastapi",
  "flask",
  "go",
  "golang",
  "java",
  "spring",
  "c#",
  ".net",
  "dotnet",
  "rust",
  "php",
  "laravel",
  "postgresql",
  "postgres",
  "mysql",
  "sqlite",
  "mongodb",
  "redis",
  "elasticsearch",
  "supabase",
  "firebase",
  "prisma",
  "drizzle",
  "docker",
  "kubernetes",
  "aws",
  "gcp",
  "azure",
  "cloudflare",
  "vercel",
  "graphql",
  "rest",
  "restful",
  "websocket",
  "kafka",
  "rabbitmq",
  "flutter",
  "react native",
  "ios",
  "android",
  "swift",
  "kotlin",
  "ci/cd",
  "github actions",
  "microservices",
  "vitest",
  "jest",
  "cypress",
];

// Milestone and phase keywords
const MILESTONE_REGEX_TR = /(?:aşama|faz|adım|sprint|teslimat|milestone|etap)\s*([0-9]|i|ii|iii|bir|iki|üç|1|2|3)?/i;
const NUMBERED_LIST_REGEX = /(?:^|\n)\s*(?:[1-9]\.|\*|-|•)\s+[^\n]{10,}/g;

// Client-oriented vs ego-oriented pronouns
const CLIENT_WORDS_TR = ["siz", "sizin", "sizlere", "şirketiniz", "projeniz", "sisteminiz", "uygulamanız", "hedefiniz", "ihtiyacınız"];
const EGO_WORDS_TR = ["ben", "benim", "bana", "kendim", "tecrübem", "cv", "portfolyom"];

const CLIENT_WORDS_EN = ["you", "your", "yours", "project", "system", "product", "platform", "business", "goal", "needs"];
const EGO_WORDS_EN = ["i", "me", "my", "myself", "mine", "resume", "cv"];

const CANONICAL_TECH_MAP: Record<string, string> = {
  "nodejs": "node.js",
  "nextjs": "next.js",
  "vuejs": "vue.js",
  "postgres": "postgresql",
  "golang": "go",
  "dotnet": ".net",
  "tailwindcss": "tailwind",
  "restful": "rest",
};

export function formatTechName(tech: string): string {
  const map: Record<string, string> = {
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "react": "React",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "typescript": "TypeScript",
    "javascript": "JavaScript",
    "docker": "Docker",
    "redis": "Redis",
    "graphql": "GraphQL",
    "vue": "Vue.js",
    "vue.js": "Vue.js",
    "angular": "Angular",
    "svelte": "Svelte",
    "tailwind": "Tailwind CSS",
    "python": "Python",
    "django": "Django",
    "fastapi": "FastAPI",
    "aws": "AWS",
    "gcp": "GCP",
    "azure": "Azure",
    "ci/cd": "CI/CD",
    "rest": "REST API",
  };
  return map[tech.toLowerCase()] || tech.charAt(0).toUpperCase() + tech.slice(1);
}

/**
 * Extracts normalized tech keywords from text and tags.
 */
export function extractTechnicalKeywords(text: string, tags?: string[] | null): string[] {
  const found = new Set<string>();

  const addCanonical = (raw: string) => {
    const clean = raw.trim().toLowerCase();
    if (!clean) return;
    const canon = CANONICAL_TECH_MAP[clean] || clean;
    found.add(canon);
    // Also add un-aliased variant so tests searching for nodejs or node.js both find it
    if (canon === "node.js") found.add("nodejs");
    if (canon === "next.js") found.add("nextjs");
    if (canon === "postgresql") found.add("postgres");
  };

  if (tags && Array.isArray(tags)) {
    for (const tag of tags) {
      if (typeof tag === "string" && tag.trim().length > 0) {
        addCanonical(tag);
      }
    }
  }

  const lower = (text || "").toLowerCase();
  for (const tech of KNOWN_TECH_TAXONOMY) {
    // Word boundary check (handle special symbols like c#, .net)
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[^a-z0-9_])${escaped}(?:$|[^a-z0-9_])`, "i");
    if (regex.test(lower)) {
      addCanonical(tech);
    }
  }

  return Array.from(found);
}

/**
 * Evaluates a proposal draft against job listing requirements.
 */
export function evaluateProposalPitch(
  listing: ListingContext,
  draft: ProposalDraft,
  locale = "tr"
): PitchEvaluationResult {
  const isTr = locale !== "en";
  const message = (draft.message || "").trim();

  // -------------------------------------------------------------
  // 1. Technical & Architecture Alignment Analysis (Weight: 25%)
  // -------------------------------------------------------------
  const listingText = `${listing.title || ""} ${listing.summary || ""} ${listing.scope || ""}`;
  const requiredTech = extractTechnicalKeywords(listingText, listing.tags);
  const proposalTech = extractTechnicalKeywords(message);

  const matchedTech = requiredTech.filter((t) => proposalTech.includes(t));
  const missingTech = requiredTech.filter((t) => !proposalTech.includes(t));

  // Check architectural keywords in proposal
  const archKeywords = isTr
    ? ["mimari", "şema", "veritabanı", "önbellek", "katman", "güvenlik", "indeks", "api", "entegrasyon", "modüler", "test", "temiz kod", "docker", "pipeline"]
    : ["architecture", "schema", "database", "cache", "layer", "security", "index", "api", "integration", "modular", "test", "clean code", "docker", "pipeline"];

  const hasArchitectureMention = archKeywords.some((kw) => message.toLowerCase().includes(kw));

  let archScore = 50;
  if (requiredTech.length === 0) {
    // If listing didn't specify tech, award based on general architecture context
    archScore = hasArchitectureMention ? 85 : 55;
  } else {
    const targetCount = Math.min(requiredTech.length, 4);
    const techRatio = targetCount > 0 ? Math.min(1, matchedTech.length / targetCount) : 1;
    archScore = Math.min(100, Math.round(techRatio * 60 + (hasArchitectureMention ? 40 : 15)));
  }

  // -------------------------------------------------------------
  // 2. Delivery Milestones & Work Breakdown Analysis (Weight: 25%)
  // -------------------------------------------------------------
  const matchesNumbered = message.match(NUMBERED_LIST_REGEX) || [];
  const hasMilestoneKeyword = isTr ? MILESTONE_REGEX_TR.test(message) : /(?:phase|milestone|sprint|stage|step)\s*([0-9]|1|2|3)?/i.test(message);

  let milestoneScore = 20;
  if (matchesNumbered.length >= 3 || (matchesNumbered.length >= 2 && hasMilestoneKeyword)) {
    milestoneScore = 95;
  } else if (matchesNumbered.length >= 2 || hasMilestoneKeyword) {
    milestoneScore = 75;
  } else if (matchesNumbered.length === 1) {
    milestoneScore = 50;
  } else {
    milestoneScore = 20;
  }

  // -------------------------------------------------------------
  // 3. Timeline & Velocity Commitment (Weight: 20%)
  // -------------------------------------------------------------
  const hasFormTimeline = Boolean(draft.proposedTimelineValue && Number(draft.proposedTimelineValue) > 0);
  const timelinePatterns = isTr
    ? /(?:gün|hafta|ay|saat|iş günü|teslim|başlayabilirim|tamamlarım)/i
    : /(?:day|days|week|weeks|month|months|hour|hours|delivery|start immediately|complete)/i;

  const hasTextTimeline = timelinePatterns.test(message);

  let timelineScore = 30;
  if (hasFormTimeline && hasTextTimeline) {
    timelineScore = 95;
  } else if (hasFormTimeline || hasTextTimeline) {
    timelineScore = 75;
  } else {
    timelineScore = 25;
  }

  // -------------------------------------------------------------
  // 4. Problem-First & Client-Centric Framing (Weight: 15%)
  // -------------------------------------------------------------
  const lowerMsg = message.toLowerCase();
  const clientWords = isTr ? CLIENT_WORDS_TR : CLIENT_WORDS_EN;
  const egoWords = isTr ? EGO_WORDS_TR : EGO_WORDS_EN;

  let clientCount = 0;
  for (const cw of clientWords) {
    if (lowerMsg.includes(cw)) clientCount++;
  }

  let egoCount = 0;
  for (const ew of egoWords) {
    if (lowerMsg.includes(ew)) egoCount++;
  }

  // Check if first 120 chars contain client focus
  const openingSnippet = lowerMsg.slice(0, 140);
  const clientOpening = clientWords.some((w) => openingSnippet.includes(w));

  let clientFocusScore = 60;
  if (clientOpening && clientCount >= 2 && clientCount >= egoCount) {
    clientFocusScore = 95;
  } else if (clientCount > egoCount) {
    clientFocusScore = 80;
  } else if (egoCount > clientCount * 2) {
    clientFocusScore = 40;
  } else {
    clientFocusScore = 60;
  }

  // -------------------------------------------------------------
  // 5. Professionalism & Cliche / Red-Flag Audit (Weight: 15%)
  // -------------------------------------------------------------
  const clichePatterns = isTr ? CLICHE_PATTERNS_TR : CLICHE_PATTERNS_EN;
  const triggeredCliches: string[] = [];

  for (const pattern of clichePatterns) {
    if (pattern.test(message)) {
      triggeredCliches.push(pattern.source.replace(/\\b|\^|\$/g, ""));
    }
  }

  let professionalismScore = 95;
  if (triggeredCliches.length > 0) {
    professionalismScore -= triggeredCliches.length * 35;
  }

  // Length checks
  if (message.length < 100) {
    professionalismScore = Math.min(professionalismScore, 30);
  } else if (message.length < 180) {
    professionalismScore = Math.min(professionalismScore, 60);
  } else if (message.length > 2500) {
    professionalismScore = Math.min(professionalismScore, 75);
  }

  professionalismScore = Math.max(10, Math.min(100, professionalismScore));

  // -------------------------------------------------------------
  // Overall Weighted Score Computation
  // -------------------------------------------------------------
  const overallScore = Math.round(
    archScore * 0.25 +
    milestoneScore * 0.25 +
    timelineScore * 0.20 +
    clientFocusScore * 0.15 +
    professionalismScore * 0.15
  );

  // Status mapping
  const getStatus = (score: number) => {
    if (score >= 80) return "excellent";
    if (score >= 65) return "good";
    if (score >= 45) return "needs_improvement";
    return "critical";
  };

  const getArchFeedback = () => {
    if (archScore >= 80) {
      return isTr
        ? "Teklifiniz ilandaki teknik gereksinimlere ve mimari yaklaşıma güçlü şekilde değiniyor."
        : "Strong alignment with required technical specifications and architecture.";
    }
    if (missingTech.length > 0) {
      return isTr
        ? `İlanda geçen şu teknolojilere teklifinizde yer vermeniz önerilir: ${missingTech.slice(0, 4).join(", ")}`
        : `Consider explicitly addressing these required technologies: ${missingTech.slice(0, 4).join(", ")}`;
    }
    return isTr
      ? "Teklifinize somut veritabanı, önbellekleme veya API mimarisi detayları ekleyin."
      : "Add concrete architectural solutions, database design, or API patterns.";
  };

  const getMilestoneFeedback = () => {
    if (milestoneScore >= 80) {
      return isTr
        ? "Projenin teslimat aşamaları ve ara hedefleri net biçimde yapılandırılmış."
        : "Project delivery phases and intermediate milestones are clearly structured.";
    }
    return isTr
      ? "Teslimat adımları eksik. İşverenler 2-3 aşamalı şeffaf teslimat planı sunan teklifleri tercih eder."
      : "Delivery milestones are missing. Clients strongly favor proposals with a phased 2-3 step roadmap.";
  };

  const getTimelineFeedback = () => {
    if (timelineScore >= 80) {
      return isTr
        ? "Net süre taahhüdü ve teslimat hızı güven veriyor."
        : "Clear timeline commitment and realistic velocity build client trust.";
    }
    return isTr
      ? "Teklifinizde net bir teslim süresi veya başlama tarihi taahhüdü belirtilmemiş."
      : "Missing clear delivery duration or start date commitment.";
  };

  const getClientFocusFeedback = () => {
    if (clientFocusScore >= 80) {
      return isTr
        ? "Müşterinin hedeflerini merkezine alan çözüm odaklı bir dil kullanılmış."
        : "Client-first consultative tone directly addressing project objectives.";
    }
    return isTr
      ? "Teklifiniz kendinizden çok işverenin projesine ve çözümüne odaklanmalı ('Ben yaptım' yerine 'Projeniz için...')."
      : "Focus more on the client's project outcomes rather than self-praise.";
  };

  const getProfessionalismFeedback = () => {
    if (professionalismScore >= 80) {
      return isTr
        ? "Metin profesyonel, yapıcı ve klişelerden arındırılmış."
        : "Professional, structured, and free of generic bidding cliches.";
    }
    if (triggeredCliches.length > 0) {
      return isTr
        ? "Teklifinizde 'Ben yaparım / İletişime geçin' gibi zayıf ve klişe ifadeler tespit edildi."
        : "Generic cliches like 'I can do this / Contact me' detected. These reduce bid conversion.";
    }
    return isTr
      ? "Teklif açıklaması çok kısa. İşverenin güvenini kazanmak için daha fazla teknik detay ekleyin."
      : "Proposal is too brief to convey senior technical credibility.";
  };

  const dimensions: PitchDimensionScore[] = [
    {
      id: "architecture",
      label: isTr ? "Teknik & Mimari Uyum" : "Technical & Architecture Alignment",
      score: archScore,
      weight: 0.25,
      status: getStatus(archScore),
      feedback: getArchFeedback(),
    },
    {
      id: "milestones",
      label: isTr ? "Teslimat Aşamaları (Milestones)" : "Delivery Milestones & Work Breakdown",
      score: milestoneScore,
      weight: 0.25,
      status: getStatus(milestoneScore),
      feedback: getMilestoneFeedback(),
    },
    {
      id: "timeline",
      label: isTr ? "Zaman ve Hız Taahhüdü" : "Timeline & Velocity Commitment",
      score: timelineScore,
      weight: 0.20,
      status: getStatus(timelineScore),
      feedback: getTimelineFeedback(),
    },
    {
      id: "client_focus",
      label: isTr ? "Problem & Çözüm Odaklılık" : "Problem-First & Client Focus",
      score: clientFocusScore,
      weight: 0.15,
      status: getStatus(clientFocusScore),
      feedback: getClientFocusFeedback(),
    },
    {
      id: "professionalism",
      label: isTr ? "Profesyonellik & Klişe Taraması" : "Professionalism & Anti-Cliche Audit",
      score: professionalismScore,
      weight: 0.15,
      status: getStatus(professionalismScore),
      feedback: getProfessionalismFeedback(),
    },
  ];

  // Strengths and Gaps compilation
  const strengths: string[] = [];
  const gaps: string[] = [];
  const redFlags: string[] = [];
  const actionableTips: string[] = [];

  if (archScore >= 80) {
    strengths.push(isTr ? "İlanın teknik beklentileriyle yüksek uyum" : "High technical stack alignment");
  } else if (missingTech.length > 0) {
    gaps.push(
      isTr
        ? `İlanda istenen ${missingTech.slice(0, 3).join(", ")} teknolojilerine değinilmemiş.`
        : `Missing mention of required technologies: ${missingTech.slice(0, 3).join(", ")}.`
    );
  }

  if (milestoneScore >= 80) {
    strengths.push(isTr ? "Aşamalandırılmış ve şeffaf teslimat yol haritası" : "Structured delivery milestones");
  } else {
    gaps.push(isTr ? "Ara teslimat adımları ve test fazı belirtilmemiş." : "No delivery milestones or QA phase outlined.");
    actionableTips.push(isTr ? "Projeyi Faz 1 (Mimari), Faz 2 (Geliştirme), Faz 3 (Test & Canlı) olarak 3 adıma bölün." : "Divide work into Phase 1 (Architecture), Phase 2 (Development), Phase 3 (Testing & Launch).");
  }

  if (timelineScore >= 80) {
    strengths.push(isTr ? "Net zaman tahmini ve başlama taahhüdü" : "Explicit delivery timeline & availability commitment");
  } else {
    gaps.push(isTr ? "Tahmini bitiş süresi veya haftalık efor belirtilmemiş." : "Missing estimated turnaround duration or weekly availability.");
    actionableTips.push(isTr ? "Örn: 'Hemen başlayarak projeyi ~2 hafta içinde teslim edebilirim' cümlesini ekleyin." : "Add a clear commitment like 'I can start immediately and deliver within ~2 weeks'.");
  }

  if (triggeredCliches.length > 0) {
    redFlags.push(
      isTr
        ? "'Ben yaparım' veya 'İletişime geçin' gibi ifadeler işveren gözünde ilanın okunmadığı izlenimini verir."
        : "Generic phrases like 'I can do this' indicate lack of genuine project engagement to clients."
    );
  }

  if (message.length < 120) {
    redFlags.push(
      isTr
        ? "Teklif çok kısa. Nitelikli işverenler en az 250-500 karakterlik detaylı yaklaşım arar."
        : "Proposal is too brief. Professional clients seek at least 250-500 characters of consultative detail."
    );
  }

  // Tier classification
  let tier: PitchEvaluationResult["tier"] = "weak";
  let tierLabel = isTr ? "Zayıf Teklif (İlanı Kaybetme Riski)" : "Weak Proposal (High Risk)";
  let tierDescription = isTr
    ? "Bu teklif işveren tarafından yüzeysel algılanabilir. Lütfen Operis AI güçlendirmesini uygulayın."
    : "This proposal risks being skipped by the client. Apply Operis AI suggestions before submitting.";

  if (overallScore >= 85) {
    tier = "top_tier";
    tierLabel = isTr ? "🚀 Mükemmel & İkna Edici Teklif" : "🚀 Exceptional & Winning Proposal";
    tierDescription = isTr
      ? "Tebrikler! Teklifiniz teknik derinlik, teslimat planı ve profesyonel dil açısından üst düzeyde."
      : "Outstanding! Your proposal demonstrates consultative clarity, technical depth, and structured delivery.";
  } else if (overallScore >= 70) {
    tier = "strong";
    tierLabel = isTr ? "🟢 Güçlü Teklif (Birkaç İyileştirme ile Zirve)" : "🟢 Strong Proposal (Near Peak)";
    tierDescription = isTr
      ? "Teklifiniz kaliteli; ufak mimari veya zaman dokunuşlarıyla teklif kabul şansınızı ikiye katlayabilirsiniz."
      : "Very solid proposal; adding minor architecture or milestone touches will maximize conversion.";
  } else if (overallScore >= 50) {
    tier = "average";
    tierLabel = isTr ? "🟡 Orta Düzey (Geliştirilmeli)" : "🟡 Average (Needs Structure)";
    tierDescription = isTr
      ? "Temel niyetiniz anlaşılıyor ancak aşama ve teknoloji detayları yetersiz."
      : "Basic intent is clear, but lacks technical depth and phased delivery roadmap.";
  }

  return {
    overallScore,
    tier,
    tierLabel,
    tierDescription,
    dimensions,
    strengths,
    gaps,
    redFlags,
    actionableTips,
    analyzedKeywords: {
      requiredTech,
      matchedTech,
      missingTech,
    },
  };
}

/**
 * Generates tailored proposal enhancement blocks and a synthesized winning proposal.
 */
export function generateProposalEnhancement(
  listing: ListingContext,
  draft: ProposalDraft,
  locale = "tr"
): ProposalEnhancementResult {
  const isTr = locale !== "en";
  const listingTitle = listing.title || (isTr ? "Bu Proje" : "This Project");
  const techList = extractTechnicalKeywords(
    `${listing.title || ""} ${listing.summary || ""} ${listing.scope || ""}`,
    listing.tags
  );

  let primaryTech = isTr ? "modern yazılım mimarisi" : "modern software architecture";
  if (techList.length > 0) {
    primaryTech = techList.slice(0, 4).map(formatTechName).join(", ");
  }

  const resolveTimelineUnit = (unit: string | null | undefined): string => {
    if (unit === "DAYS") return isTr ? "iş günü" : "business days";
    if (unit === "MONTHS") return isTr ? "ay" : "months";
    return isTr ? "hafta" : "weeks";
  };

  let durationText = isTr ? "2-3 hafta" : "2-3 weeks";
  if (draft.proposedTimelineValue) {
    durationText = `${draft.proposedTimelineValue} ${resolveTimelineUnit(draft.proposedTimelineUnit)}`;
  } else if (listing.timelineValue && listing.timelineUnit) {
    durationText = `${listing.timelineValue} ${listing.timelineUnit.toLowerCase()}`;
  }

  // 1. Suggested Architecture Snippet
  const suggestedArchitectureSnippet = isTr
    ? `### 🛠️ Önerilen Teknik Mimari & Yaklaşım
Projenizde ${primaryTech} teknolojilerini temel alarak; temiz kod prensiplerine uygun, ölçeklenebilir ve güvenli bir altyapı kurgulamayı hedefliyorum. Veritabanı modellemesi, API uç noktalarının tasarımı ve hata toleranslı veri akışları öncelikli odak noktam olacaktır.`
    : `### 🛠️ Proposed Technical Architecture & Strategy
For this project, I plan to leverage ${primaryTech}, architecting a clean, scalable, and secure system. Database schema optimization, resilient API endpoint design, and reliable data flow will be the primary technical cornerstones.`;

  // 2. Suggested Milestones Snippet
  const suggestedMilestonesSnippet = isTr
    ? `### 📋 Şeffaf Teslimat Yol Haritası (Aşamalar)
1. **Aşama 1 — Teknik Analiz & Mimari Taslak (İlk %30)**: Veritabanı şeması, API kontratları ve temel altyapının kurulması.
2. **Aşama 2 — Çekirdek Özellikler & Entegrasyon (Orta %40)**: İş mantığının kodlanması, UI/API entegrasyonu ve ara demo sunumu.
3. **Aşama 3 — Test, Güvenlik & Canlıya Dağıtım (Son %30)**: Uçtan uca testler, performans optimizasyonu ve üretim ortamına devreye alma.`
    : `### 📋 Structured Delivery Milestones
1. **Phase 1 — Discovery & Architectural Blueprint (First 30%)**: Database schema modeling, API contract definition, and foundational scaffolding.
2. **Phase 2 — Core Implementation & Integration (Next 40%)**: Business logic development, client/API integration, and progress checkpoint demo.
3. **Phase 3 — QA, Performance Tuning & Deployment (Final 30%)**: End-to-end testing, security checks, and smooth production handoff.`;

  // 3. Suggested Timeline Snippet
  const suggestedTimelineSnippet = isTr
    ? `⏱️ **Zaman Taahhüdü**: Anlaşma sağlandığında hemen başlayabilir ve projeyi tahmini **${durationText}** içerisinde eksiksiz teslim edebilirim.`
    : `⏱️ **Timeline Commitment**: I can begin immediately upon agreement and deliver the complete milestone scope within **${durationText}**.`;

  // Full synthesized message
  const originalClean = (draft.message || "").trim();
  const hasIntro = originalClean.length > 30;

  let introBlock = originalClean;
  if (!hasIntro) {
    introBlock = isTr
      ? `Merhaba, "${listingTitle}" ilanınızı detaylıca inceledim. İhtiyacınız olan gereksinimleri eksiksiz karşılayacak teknik deneyime ve uzmanlığa sahibim.`
      : `Hello, I have carefully reviewed your listing for "${listingTitle}". I bring the exact technical background required to deliver this solution successfully.`;
  }

  const fullEnhancedMessage = `${introBlock}

${suggestedArchitectureSnippet}

${suggestedMilestonesSnippet}

${suggestedTimelineSnippet}`;

  return {
    suggestedArchitectureSnippet,
    suggestedMilestonesSnippet,
    suggestedTimelineSnippet,
    fullEnhancedMessage,
  };
}
