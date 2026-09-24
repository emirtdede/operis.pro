import { describe, it, expect } from "vitest";
import {
  normalizeCategory,
  getSettingsCategories,
  getMarketingConsentFeedback,
  getTwoFactorButtonLabel,
  getSavePasswordButtonLabel,
  getExportDataButtonLabel,
} from "@/src/components/settings/types";

describe("Settings Types & Category Helpers", () => {
  it("normalizes unknown or empty categories to 'profile'", () => {
    expect(normalizeCategory(null)).toBe("profile");
    expect(normalizeCategory(undefined)).toBe("profile");
    expect(normalizeCategory("unknown_tab")).toBe("profile");
  });

  it("maps legacy tabs for backwards compatibility", () => {
    expect(normalizeCategory("visibility")).toBe("privacy");
    expect(normalizeCategory("advertising")).toBe("notifications");
  });

  it("preserves valid 7 enterprise categories", () => {
    expect(normalizeCategory("profile")).toBe("profile");
    expect(normalizeCategory("work")).toBe("work");
    expect(normalizeCategory("account")).toBe("account");
    expect(normalizeCategory("corporate")).toBe("corporate");
    expect(normalizeCategory("security")).toBe("security");
    expect(normalizeCategory("notifications")).toBe("notifications");
    expect(normalizeCategory("privacy")).toBe("privacy");
  });

  it("returns 7 categories with keywords for search filtering", () => {
    const categoriesTr = getSettingsCategories(true);
    expect(categoriesTr.length).toBe(7);

    const securityCat = categoriesTr.find((c) => c.id === "security");
    expect(securityCat).toBeDefined();
    expect(securityCat?.keywords).toContain("şifre");
    expect(securityCat?.keywords).toContain("2fa");

    const corporateCat = categoriesTr.find((c) => c.id === "corporate");
    expect(corporateCat).toBeDefined();
    expect(corporateCat?.keywords).toContain("vkn");
    expect(corporateCat?.keywords).toContain("iban");

    const profileCat = categoriesTr.find((c) => c.id === "profile");
    expect(profileCat).toBeDefined();
    expect(profileCat?.keywords).toContain("handle");
  });

  it("returns correct button and feedback labels for both locales", () => {
    expect(getMarketingConsentFeedback(true, true)).toBe("Pazarlama onayınız kaydedildi.");
    expect(getMarketingConsentFeedback(false, true)).toBe("Pazarlama onayınız geri alındı.");
    expect(getMarketingConsentFeedback(true, false)).toBe("Marketing preferences updated.");

    expect(getTwoFactorButtonLabel(true, true)).toBe("2FA Yönet");
    expect(getTwoFactorButtonLabel(false, true)).toBe("2FA Etkinleştir");

    expect(getSavePasswordButtonLabel(true, true)).toBe("Güncelleniyor...");
    expect(getSavePasswordButtonLabel(false, true)).toBe("Şifreyi Güncelle");

    expect(getExportDataButtonLabel(true, true)).toBe("Hazırlanıyor...");
    expect(getExportDataButtonLabel(false, true)).toBe("Verileri İndir");
  });
});
