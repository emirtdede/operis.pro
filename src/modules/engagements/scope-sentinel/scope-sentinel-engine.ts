/**
 * Operis AI Scope Creep Sentinel & Addendum Drafter Engine
 *
 * Algorithmic Scope Protection Engine compliant with:
 * - 6098 sayılı Türk Borçlar Kanunu (TBK m. 470 Eser Sözleşmesi & TBK m. 480/2 Kapsam Aşımı ve Ek Masraflar)
 * - TBK m. 474 (Muayene ve Ayıp İhbarı Sınırları - Revizyon vs. Yeni İş Ayrımı)
 * - Operis Resmi Sözleşme Madde 2 (Teknik Kapsam) ve Madde 4.3 (Azami 2 Tur Revizyon Sınırı)
 *
 * Performs deterministic NLP and semantic capability extraction to identify out-of-scope
 * feature requests in real time without external LLM API latency, costs, or downtime.
 */

import {
  ScopeBaselineProfile,
  ScopeSentinelAnalysisInput,
  ScopeSentinelResult,
  DetectedCreepCapability,
  QuickAddendumDraft,
} from "./scope-sentinel-types";
import { SemanticVectorMatcher } from "./semantic-vector-matcher";

interface CapabilityDefinition {
  key: string;
  category: DetectedCreepCapability["category"];
  titleTr: string;
  titleEn: string;
  keywords: string[];
  days: number;
  baseBudgetTry: number;
  baseBudgetUsd: number;
  baseBudgetEur: number;
}

const CAPABILITY_TAXONOMY: CapabilityDefinition[] = [
  {
    key: "PAYMENT_GATEWAY",
    category: "PAYMENT",
    titleTr: "Ödeme Altyapısı ve Sanal POS Entegrasyonu",
    titleEn: "Payment Gateway & Virtual POS Integration",
    keywords: [
      "ödeme",
      "stripe",
      "iyzico",
      "paytr",
      "param",
      "checkout",
      "sanal pos",
      "3d secure",
      "pos entegrasyonu",
      "payment gateway",
      "credit card",
      "kredi kartı",
    ],
    days: 4,
    baseBudgetTry: 12500,
    baseBudgetUsd: 380,
    baseBudgetEur: 350,
  },
  {
    key: "UI_VIEW_EXPANSION",
    category: "UI_EXPANSION",
    titleTr: "İlave Arayüz Ekranı ve Yönetim Paneli",
    titleEn: "Additional UI View & Management Dashboard",
    keywords: [
      "yeni sayfa",
      "yeni ekran",
      "admin paneli",
      "dashboard ekleyelim",
      "yeni arayüz",
      "ek sayfa",
      "new page",
      "new screen",
      "admin panel",
      "new dashboard",
      "ayrı bir ekran",
    ],
    days: 3,
    baseBudgetTry: 8500,
    baseBudgetUsd: 260,
    baseBudgetEur: 240,
  },
  {
    key: "THIRD_PARTY_API",
    category: "INTEGRATION",
    titleTr: "Harici API ve Servis Entegrasyonu",
    titleEn: "External Third-Party API Integration",
    keywords: [
      "api entegrasyonu",
      "webhook",
      "crm entegrasyonu",
      "kargo takip",
      "erp",
      "hubspot",
      "salesforce",
      "google sheets",
      "api integration",
      "third party api",
      "entegre edelim",
    ],
    days: 3,
    baseBudgetTry: 9500,
    baseBudgetUsd: 290,
    baseBudgetEur: 270,
  },
  {
    key: "REALTIME_CHAT_PUSH",
    category: "REALTIME",
    titleTr: "Canlı İletişim ve Anlık Bildirim Sistemi",
    titleEn: "Real-time Chat & Push Notification System",
    keywords: [
      "canlı sohbet",
      "canlı chat",
      "websocket",
      "anlık bildirim",
      "push notification",
      "live chat",
      "socket.io",
      "realtime messaging",
      "mesajlaşma sistemi",
    ],
    days: 4,
    baseBudgetTry: 11500,
    baseBudgetUsd: 350,
    baseBudgetEur: 320,
  },
  {
    key: "ADVANCED_SECURITY_AUTH",
    category: "SECURITY_AUTH",
    titleTr: "İleri Seviye Kimlik Doğrulama ve Güvenlik (2FA/OAuth)",
    titleEn: "Advanced Auth & Security Module (2FA/OAuth)",
    keywords: [
      "2fa",
      "iki faktörlü",
      "sms otp",
      "sosyal login",
      "google login",
      "apple login",
      "rol tabanlı yetkilendirme",
      "two factor",
      "two-factor auth",
      "rbac",
    ],
    days: 2,
    baseBudgetTry: 6500,
    baseBudgetUsd: 200,
    baseBudgetEur: 180,
  },
  {
    key: "LOCALIZATION_I18N",
    category: "LOCALIZATION",
    titleTr: "Çoklu Dil (i18n) ve Yerelleştirme Altyapısı",
    titleEn: "Multi-Language (i18n) Localization Setup",
    keywords: [
      "çoklu dil",
      "ingilizce versiyonu",
      "i18n",
      "çeviri altyapısı",
      "multi-language",
      "localization",
      "bilingual support",
      "dil desteği",
    ],
    days: 3,
    baseBudgetTry: 7500,
    baseBudgetUsd: 230,
    baseBudgetEur: 210,
  },
  {
    key: "MOBILE_NATIVE_EXTENSION",
    category: "GENERAL",
    titleTr: "Mobil Uygulama ve Çapraz Platform Genişletmesi",
    titleEn: "Mobile Application & Cross-Platform Extension",
    keywords: [
      "mobil uygulama",
      "ios uygulaması",
      "android uygulaması",
      "react native",
      "flutter",
      "mobile app",
      "pwa dönüşümü",
      "app store",
    ],
    days: 7,
    baseBudgetTry: 24000,
    baseBudgetUsd: 720,
    baseBudgetEur: 680,
  },
];

const SCOPE_EXPANSION_TRIGGER_REGEXES = [
  /\b(ek olarak|ayrıca|şuraya da|bunu da|şunu da|ekleyiverelim|ekleyelim|yapıverelim|küçük bir şey|yeni bir (özellik|sayfa|ekran|fonksiyon)|aklıma geldi|kapsama dahil|farklı olarak|fazladan|aradan çıkaralım)\b/i,
  /\b(additionally|can we also|also add|could we add|small addition|new feature|another page|extra feature|by the way can we|quick addition|expand scope|while we are at it)\b/i,
];

export class ScopeSentinelEngine {
  /**
   * Normalizes text by lowercasing, removing punctuation, and collapsing whitespace.
   */
  static normalizeText(text: string): string {
    return (text || "")
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Combines all contract baseline texts (Madde 2, EK-1, milestones, addendums)
   * into a unified lowercase corpus.
   */
  static buildBaselineCorpus(baseline: ScopeBaselineProfile): string {
    const parts: string[] = [
      baseline.listingTitle || "",
      baseline.category || "",
      baseline.technicalScopeSummary || "",
    ];

    if (baseline.acceptanceCriteria && baseline.acceptanceCriteria.length > 0) {
      parts.push(...baseline.acceptanceCriteria);
    }

    if (baseline.milestones && baseline.milestones.length > 0) {
      for (const m of baseline.milestones) {
        parts.push(m.title);
        if (m.description) parts.push(m.description);
      }
    }

    if (baseline.approvedAddendums && baseline.approvedAddendums.length > 0) {
      for (const a of baseline.approvedAddendums) {
        parts.push(a.title);
        parts.push(a.description);
      }
    }

    return this.normalizeText(parts.join(" "));
  }

  /**
   * Detects whether the candidate text explicitly uses scope expansion wording.
   */
  static detectExpansionTrigger(text: string): {
    detected: boolean;
    phrase?: string;
  } {
    for (const rx of SCOPE_EXPANSION_TRIGGER_REGEXES) {
      const match = text.match(rx);
      if (match && match[0]) {
        return { detected: true, phrase: match[0].trim() };
      }
    }
    return { detected: false };
  }

  /**
   * Evaluates if a given capability keyword is already covered in the baseline corpus.
   */
  private static isKeywordCoveredInBaseline(keyword: string, baselineCorpus: string): boolean {
    const normKeyword = this.normalizeText(keyword);
    if (!normKeyword) return false;
    return baselineCorpus.includes(normKeyword);
  }

  /**
   * Core inspection algorithm.
   */
  static analyze(input: ScopeSentinelAnalysisInput): ScopeSentinelResult {
    const candidate = input.candidateText || "";
    const normCandidate = this.normalizeText(candidate);
    const currency = (input.currency || "TRY").toUpperCase();
    const isEn = input.locale === "en";

    // 1. Guard against trivially short or empty text
    if (normCandidate.length < 5) {
      return {
        isScopeCreep: false,
        confidence: 0,
        expansionTriggerDetected: false,
        detectedCapabilities: [],
        suggestedAdditionalDays: 0,
        suggestedAdditionalBudget: 0,
        currency,
        warningCardMessageTr: "",
        warningCardMessageEn: "",
        statutoryReferenceTr: "TBK m. 474 ve TBK m. 480/2",
        statutoryReferenceEn: "TBK Art. 474 & TBK Art. 480/2",
        quickAddendumDraft: null,
      };
    }

    // 2. Build baseline corpus
    const baselineCorpus = this.buildBaselineCorpus(input.baseline);

    // 3. Detect expansion trigger words
    const triggerInfo = this.detectExpansionTrigger(candidate);

    // 4. Match capabilities against taxonomy
    const detectedCapabilities: DetectedCreepCapability[] = [];

    for (const cap of CAPABILITY_TAXONOMY) {
      const matchedKeywords: string[] = [];

      for (const kw of cap.keywords) {
        const normKw = this.normalizeText(kw);
        // Does the candidate text mention this keyword?
        if (normCandidate.includes(normKw)) {
          // Is this keyword ALREADY covered in the original contract scope?
          const isCovered = this.isKeywordCoveredInBaseline(kw, baselineCorpus);
          if (!isCovered) {
            matchedKeywords.push(kw);
          }
        }
      }

      if (matchedKeywords.length > 0) {
        let budget = cap.baseBudgetTry;
        if (currency === "USD") budget = cap.baseBudgetUsd;
        else if (currency === "EUR") budget = cap.baseBudgetEur;

        detectedCapabilities.push({
          capabilityKey: cap.key,
          titleTr: cap.titleTr,
          titleEn: cap.titleEn,
          estimatedDays: cap.days,
          estimatedBudget: budget,
          matchedKeywords,
          category: cap.category,
        });
      }
    }

    // 4b. Semantic Vector Matching for implicit / paraphrased scope creep
    const semanticMatches = SemanticVectorMatcher.match(candidate, baselineCorpus);
    for (const semMatch of semanticMatches) {
      if (semMatch.coveredInBaseline) continue;

      const alreadyDetected = detectedCapabilities.some(
        (c) => c.capabilityKey === semMatch.capabilityKey
      );
      if (alreadyDetected) continue;

      const capDef = CAPABILITY_TAXONOMY.find((c) => c.key === semMatch.capabilityKey);
      if (!capDef) continue;

      let budget = capDef.baseBudgetTry;
      if (currency === "USD") budget = capDef.baseBudgetUsd;
      else if (currency === "EUR") budget = capDef.baseBudgetEur;

      detectedCapabilities.push({
        capabilityKey: capDef.key,
        titleTr: capDef.titleTr,
        titleEn: capDef.titleEn,
        estimatedDays: capDef.days,
        estimatedBudget: budget,
        matchedKeywords: [`~semantik: %${Math.round(semMatch.similarity * 100)} uyum`],
        category: capDef.category,
      });
    }

    // 5. Determine whether this constitutes scope creep
    // It is scope creep if:
    // a) At least one capability not covered in baseline was requested, OR
    // b) An explicit expansion trigger was fired alongside novel technical requirements
    const isScopeCreep = detectedCapabilities.length > 0;

    if (!isScopeCreep) {
      return {
        isScopeCreep: false,
        confidence: triggerInfo.detected ? 40 : 10,
        expansionTriggerDetected: triggerInfo.detected,
        detectedTriggerPhrase: triggerInfo.phrase,
        detectedCapabilities: [],
        suggestedAdditionalDays: 0,
        suggestedAdditionalBudget: 0,
        currency,
        warningCardMessageTr: "",
        warningCardMessageEn: "",
        statutoryReferenceTr: "TBK m. 474 ve TBK m. 480/2",
        statutoryReferenceEn: "TBK Art. 474 & TBK Art. 480/2",
        quickAddendumDraft: null,
      };
    }

    // 6. Aggregate days & budget
    const totalDays = detectedCapabilities.reduce((sum, c) => sum + c.estimatedDays, 0);
    const totalBudget = detectedCapabilities.reduce((sum, c) => sum + c.estimatedBudget, 0);

    // 7. Calculate confidence
    let confidence = 70;
    if (triggerInfo.detected) confidence += 20;
    if (detectedCapabilities.length > 1) confidence += 10;
    confidence = Math.min(confidence, 98);

    // 8. Format warnings
    const primaryCap = detectedCapabilities[0];
    const capTitleTr = primaryCap?.titleTr || "İlave Kapsam";
    const capTitleEn = primaryCap?.titleEn || "Additional Scope";

    const formattedBudgetTr = `${totalBudget.toLocaleString("tr-TR")} ${currency}`;
    const formattedBudgetEn = `${currency} ${totalBudget.toLocaleString("en-US")}`;

    const warningCardMessageTr = `⚠️ Bu talep (${capTitleTr}) orijinal sözleşme kapsamının (Madde 2 & EK-1) dışındadır. Proje takvimini ~${totalDays} gün uzatabilir ve tahmini +${formattedBudgetTr} ek bütçe gerektirir.`;
    const warningCardMessageEn = `⚠️ This request (${capTitleEn}) is outside the original contract scope (Article 2 & Annex-1). It may extend project schedule by ~${totalDays} days and require an estimated +${formattedBudgetEn} budget.`;

    // 9. Synthesize Quick Addendum Draft
    const quickAddendumDraft: QuickAddendumDraft = {
      title: isEn ? capTitleEn : capTitleTr,
      description: isEn
        ? `Implementation of ${capTitleEn}. Detailed scope: ${candidate.slice(0, 300)}`
        : `${capTitleTr} kapsamı. Detaylar: ${candidate.slice(0, 300)}`,
      reason: "CLIENT_REQUESTED",
      additionalBudget: totalBudget,
      additionalDays: totalDays,
      currency,
    };

    return {
      isScopeCreep: true,
      confidence,
      expansionTriggerDetected: triggerInfo.detected,
      detectedTriggerPhrase: triggerInfo.phrase,
      detectedCapabilities,
      suggestedAdditionalDays: totalDays,
      suggestedAdditionalBudget: totalBudget,
      currency,
      warningCardMessageTr,
      warningCardMessageEn,
      statutoryReferenceTr: "TBK m. 470, TBK m. 480/2 ve HMK m. 193",
      statutoryReferenceEn: "TBK Art. 470, TBK Art. 480/2 & HMK Art. 193",
      quickAddendumDraft,
    };
  }
}
