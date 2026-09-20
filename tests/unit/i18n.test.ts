import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, formatRelativeTime } from "@/src/lib/i18n/formatters";
import fs from "node:fs";
import path from "node:path";

describe("i18n Foundation & Catalogs", () => {
  it("formats currency correctly for TR and EN", () => {
    const formattedTr = formatCurrency(15000, "TRY", "tr");
    expect(formattedTr).toContain("15.000");

    const formattedEn = formatCurrency(5000, "USD", "en");
    expect(formattedEn).toContain("5,000");
  });

  it("formats dates consistently across locales", () => {
    const fixedDate = new Date("2026-09-06T12:00:00Z");
    const trDate = formatDate(fixedDate, "tr");
    const enDate = formatDate(fixedDate, "en");

    expect(trDate).toContain("2026");
    expect(enDate).toContain("2026");
  });

  it("calculates relative time correctly", () => {
    const now = Date.now();
    const threeDaysLater = new Date(now + 3 * 24 * 60 * 60 * 1000);
    const relTr = formatRelativeTime(threeDaysLater, "tr");
    const relEn = formatRelativeTime(threeDaysLater, "en");

    expect(relTr.toLowerCase()).toContain("gün");
    expect(relEn.toLowerCase()).toContain("day");
  });

  it("guarantees 100% exact key parity between messages/tr.json and messages/en.json", () => {
    const tr = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), "messages/tr.json"), "utf-8")
    );
    const en = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), "messages/en.json"), "utf-8")
    );

    function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
      let result: string[] = [];
      for (const [k, v] of Object.entries(obj)) {
        const full = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === "object" && !Array.isArray(v)) {
          result = result.concat(getKeys(v as Record<string, unknown>, full));
        } else {
          result.push(full);
        }
      }
      return result;
    }

    const trKeys = getKeys(tr).sort();
    const enKeys = getKeys(en).sort();

    expect(trKeys).toEqual(enKeys);
  });

  it("converts paths between TR and EN preserving localized route structures", async () => {
    const { getAlternateLocalePath } = await import("@/src/lib/i18n/routes");

    // Standard routes
    expect(getAlternateLocalePath("/tr/panel/ilanlarim", "en")).toBe("/en/dashboard/listings");
    expect(getAlternateLocalePath("/en/dashboard/listings", "tr")).toBe("/tr/panel/ilanlarim");

    // Listings detail & edit
    expect(getAlternateLocalePath("/tr/ilanlar/react-developer", "en")).toBe(
      "/en/listings/react-developer"
    );
    expect(getAlternateLocalePath("/en/listings/react-developer/edit", "tr")).toBe(
      "/tr/ilanlar/react-developer/duzenle"
    );
    expect(getAlternateLocalePath("/tr/ilanlar/react-developer/duzenle", "en")).toBe(
      "/en/listings/react-developer/edit"
    );

    // Profile
    expect(getAlternateLocalePath("/tr/profil/johndoe", "en")).toBe("/en/profile/johndoe");
    expect(getAlternateLocalePath("/en/profile/johndoe", "tr")).toBe("/tr/profil/johndoe");
    expect(getAlternateLocalePath("/en/u/johndoe", "tr")).toBe("/tr/profil/johndoe");

    // Workspace
    expect(getAlternateLocalePath("/tr/calisma-alani/eng-123", "en")).toBe("/en/workspace/eng-123");
    expect(getAlternateLocalePath("/en/workspace/eng-123", "tr")).toBe("/tr/calisma-alani/eng-123");
    expect(getAlternateLocalePath("/tr/work/eng-123", "en")).toBe("/en/workspace/eng-123");

    // Regional locales (en-US, tr-TR)
    expect(getAlternateLocalePath("/tr/ayarlar", "en-US")).toBe("/en/settings");
    expect(getAlternateLocalePath("/en/settings", "tr-TR")).toBe("/tr/ayarlar");

    // Legal
    expect(getAlternateLocalePath("/tr/yasal/kullanim-kosullari", "en")).toBe("/en/legal/terms");
    expect(getAlternateLocalePath("/en/legal/terms", "tr")).toBe("/tr/yasal/kullanim-kosullari");
  });
});
