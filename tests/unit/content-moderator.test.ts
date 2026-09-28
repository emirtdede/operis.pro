import { describe, it, expect } from "vitest";
import { validateContentAppropriateness } from "@/src/lib/security/content-moderator";
import { submitOfferSchema } from "@/src/modules/offers/validation";

describe("Content Moderation Engine & Guardrail", () => {
  it("allows professional, clean project proposals and technical scopes", () => {
    const cleanText =
      "Merhaba, Next.js 15 ve PostgreSQL altyapısıyla projenizi 2 hafta içinde profesyonel ve eksiksiz olarak geliştirebilirim. Kod kalitesi ve test kapsamına azami özen göstereceğim.";
    const result = validateContentAppropriateness(cleanText);
    expect(result.isValid).toBe(true);
    expect(result.flaggedTerms).toHaveLength(0);
  });

  it("blocks vulgar insults and profanity in Turkish", () => {
    const vulgarText = "Bu fiyata bu iş yapılmaz amk salak mısınız nesiniz ahmak herifler";
    const result = validateContentAppropriateness(vulgarText);
    expect(result.isValid).toBe(false);
    expect(result.flaggedTerms.length).toBeGreaterThan(0);
  });

  it("blocks vulgar profanity in English", () => {
    const vulgarText = "This is a fucking terrible budget you idiot asshole";
    const result = validateContentAppropriateness(vulgarText);
    expect(result.isValid).toBe(false);
    expect(result.flaggedTerms.length).toBeGreaterThan(0);
  });

  it("blocks obfuscated l33tspeak attempts (e.g. @ for a, 1 for i)", () => {
    const obfuscated = "Sen tam bir s1k kafalı birisin";
    const result = validateContentAppropriateness(obfuscated);
    expect(result.isValid).toBe(false);
  });

  it("integrates seamlessly into submitOfferSchema to reject improper offers", () => {
    const invalidOffer = {
      listingId: "11111111-1111-1111-1111-111111111111",
      message:
        "Projenizi yapamam çünkü siz tam bir gerizekalı ve ahmak birisiniz böyle bütçe mi olur ya",
      budgetCurrency: "TRY",
      budgetMin: "1000",
      budgetMax: "2000",
    };

    const parsed = submitOfferSchema.safeParse(invalidOffer);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message;
      expect(errorMsg).toContain("topluluk kurallarımıza aykırı");
    }
  });

  it("does not false-positive on legitimate Turkish words like 'sık', 'sıkça', 'sıkıntı', 'sıkı'", () => {
    const validTexts = [
      "Sıkça sorulan sorulara göz atabilirsiniz.",
      "Hiçbir sıkıntı yaşamadan projeyi tamamlayabiliriz.",
      "Bu aralar çok sık teslimat yapıyoruz.",
      "Sıkı bir çalışma takvimi ile bitireceğiz.",
      "Trafik sıkışık olduğu için gecikme olmasın diye erken başladık.",
      "Küfürsüz ve saygılı bir çalışma ortamı rica ediyoruz.",
    ];

    for (const text of validTexts) {
      const result = validateContentAppropriateness(text);
      expect(result.isValid).toBe(true);
      expect(result.flaggedTerms).toHaveLength(0);
    }
  });

  it("accurately detects real profanity with dotted 'i' or vulgar roots", () => {
    const vulgarTexts = [
      "Bunu böyle yaparsan seni sikeyim",
      "sikiş ortamı kurmuşsunuz",
      "tam bir sik kafalı",
    ];

    for (const text of vulgarTexts) {
      const result = validateContentAppropriateness(text);
      expect(result.isValid).toBe(false);
      expect(result.flaggedTerms.length).toBeGreaterThan(0);
    }
  });
});
