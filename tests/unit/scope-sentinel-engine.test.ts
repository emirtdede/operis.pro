import { describe, it, expect } from "vitest";
import { ScopeSentinelEngine } from "@/src/modules/engagements/scope-sentinel/scope-sentinel-engine";
import { ScopeBaselineProfile } from "@/src/modules/engagements/scope-sentinel/scope-sentinel-types";

describe("ScopeSentinelEngine - AI Scope Creep Sentinel & Addendum Drafter", () => {
  const landingPageBaseline: ScopeBaselineProfile = {
    listingTitle: "Modern Kurumsal Landing Page ve İletişim Formu",
    category: "Web Geliştirme",
    technicalScopeSummary:
      "Next.js ve TailwindCSS kullanılarak responsive kurumsal tanıtım sayfası, hakkımızda, hizmetler ve e-posta bildirimli iletişim formu geliştirilmesi.",
    acceptanceCriteria: [
      "Responsive mobil uyumlu tasarım",
      "Lighthouse performans skoru 90+",
      "İletişim formundan e-posta gönderimi",
    ],
    milestones: [
      {
        title: "Tasarım ve Arayüz Kodlaması",
        description: "Figma tasarımının React bileşenlerine dönüştürülmesi",
      },
      {
        title: "İletişim Formu ve Canlıya Alma",
        description: "Vercel üzerinde yayına alma ve DNS yönlendirmesi",
      },
    ],
  };

  it("identifies legitimate in-scope defect notices and bug fixes as NOT scope creep", () => {
    const result = ScopeSentinelEngine.analyze({
      candidateText:
        "İletişim formundaki buton mobilde taştığı için tıklanamıyor, lütfen düzeltin.",
      baseline: landingPageBaseline,
      currency: "TRY",
      locale: "tr",
    });

    expect(result.isScopeCreep).toBe(false);
    expect(result.detectedCapabilities).toHaveLength(0);
    expect(result.suggestedAdditionalDays).toBe(0);
    expect(result.suggestedAdditionalBudget).toBe(0);
    expect(result.quickAddendumDraft).toBeNull();
  });

  it("detects explicit out-of-scope payment addition ('Şuraya da küçük bir ödeme entegrasyonu ekleyiverelim')", () => {
    const result = ScopeSentinelEngine.analyze({
      candidateText:
        "Şuraya da küçük bir ödeme entegrasyonu ekleyiverelim, müşteriler kredi kartıyla ödeme yapabilsin.",
      baseline: landingPageBaseline,
      currency: "TRY",
      locale: "tr",
    });

    expect(result.isScopeCreep).toBe(true);
    expect(result.expansionTriggerDetected).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(80);
    expect(result.suggestedAdditionalDays).toBe(4);
    expect(result.suggestedAdditionalBudget).toBe(12500);
    expect(result.warningCardMessageTr).toContain("Ödeme Altyapısı");
    expect(result.warningCardMessageTr).toContain("12.500 TRY");
    expect(result.warningCardMessageTr).toContain("4 gün");

    expect(result.quickAddendumDraft).not.toBeNull();
    expect(result.quickAddendumDraft?.reason).toBe("CLIENT_REQUESTED");
    expect(result.quickAddendumDraft?.additionalBudget).toBe(12500);
    expect(result.quickAddendumDraft?.additionalDays).toBe(4);
  });

  it("does not flag capabilities if they were already part of the baseline contract", () => {
    const ecommerceBaseline: ScopeBaselineProfile = {
      listingTitle: "E-Ticaret Sitesi ve Stripe Ödeme Altyapısı",
      category: "E-Ticaret",
      technicalScopeSummary:
        "Next.js, PostgreSQL ve Stripe checkout ile sanal pos kredi kartı ödeme entegrasyonu.",
      acceptanceCriteria: ["Stripe webhook güvenliği", "Kredi kartı ile 3D secure ödeme"],
    };

    const result = ScopeSentinelEngine.analyze({
      candidateText:
        "Stripe checkout sayfasında kart doğrulama sonrası yönlendirme hatası var, kontrol eder misiniz?",
      baseline: ecommerceBaseline,
      currency: "TRY",
      locale: "tr",
    });

    // Because 'stripe', 'checkout', 'ödeme' are in the baseline corpus, it is recognized as in-scope!
    expect(result.isScopeCreep).toBe(false);
  });

  it("handles English prompts and generates English addendum draft", () => {
    const result = ScopeSentinelEngine.analyze({
      candidateText: "Can we also add real-time live chat with websocket notifications?",
      baseline: landingPageBaseline,
      currency: "USD",
      locale: "en",
    });

    expect(result.isScopeCreep).toBe(true);
    expect(result.expansionTriggerDetected).toBe(true);
    expect(result.suggestedAdditionalDays).toBe(4);
    expect(result.suggestedAdditionalBudget).toBe(350); // USD base
    expect(result.currency).toBe("USD");
    expect(result.warningCardMessageEn).toContain("Real-time Chat");
    expect(result.warningCardMessageEn).toContain("USD 350");

    expect(result.quickAddendumDraft?.title).toBe("Real-time Chat & Push Notification System");
    expect(result.quickAddendumDraft?.currency).toBe("USD");
  });

  it("aggregates multiple out-of-scope capabilities (admin panel + 2FA security)", () => {
    const result = ScopeSentinelEngine.analyze({
      candidateText:
        "Ek olarak ayrı bir admin paneli ve SMS 2FA iki faktörlü kimlik doğrulama da yapalım.",
      baseline: landingPageBaseline,
      currency: "EUR",
      locale: "tr",
    });

    expect(result.isScopeCreep).toBe(true);
    expect(result.detectedCapabilities.length).toBeGreaterThanOrEqual(2);
    // UI View (3 days) + Security Auth (2 days) = 5 days
    expect(result.suggestedAdditionalDays).toBe(5);
    // UI View (240 EUR) + Security Auth (180 EUR) = 420 EUR
    expect(result.suggestedAdditionalBudget).toBe(420);
    expect(result.currency).toBe("EUR");
  });

  it("considers approved addendums as part of updated contract baseline", () => {
    const baselineWithAddendum: ScopeBaselineProfile = {
      ...landingPageBaseline,
      approvedAddendums: [
        {
          title: "Zeyilname 01: Stripe Entegrasyonu",
          description: "Stripe sanal pos ve ödeme altyapısı sisteme dahil edilmiştir.",
        },
      ],
    };

    const result = ScopeSentinelEngine.analyze({
      candidateText: "Stripe ödeme sayfasındaki logo ortalansın lütfen.",
      baseline: baselineWithAddendum,
      currency: "TRY",
      locale: "tr",
    });

    // Should NOT be scope creep because Stripe was approved in the addendum!
    expect(result.isScopeCreep).toBe(false);
  });

  it("detects semantic scope creep via N-gram vector matching when exact keywords are omitted", () => {
    // "kartından çekim", "tahsilat", "provizyon" - exact words 'ödeme' or 'sanal pos' are not present
    const result = ScopeSentinelEngine.analyze({
      candidateText:
        "Şuraya müşterilerin kartından çekim yapabileceğimiz tahsilat ve provizyon altyapısı kuralım.",
      baseline: landingPageBaseline,
      currency: "TRY",
      locale: "tr",
    });

    expect(result.isScopeCreep).toBe(true);
    expect(result.detectedCapabilities.length).toBeGreaterThanOrEqual(1);
    expect(result.detectedCapabilities[0]?.capabilityKey).toBe("PAYMENT_GATEWAY");
    expect(result.suggestedAdditionalDays).toBe(4);
    expect(result.suggestedAdditionalBudget).toBe(12500);
    expect(result.quickAddendumDraft).not.toBeNull();
  });
});
