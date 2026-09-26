import { describe, it, expect } from "vitest";
import sitemap from "@/src/app/sitemap";

describe("SEO: XML Sitemap Integrity & Route Rules", () => {
  it("must NOT contain 301-redirected feed routes (/tr/akis or /en/feed)", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    // Google Search Central strictly forbids redirecting URLs in XML sitemaps
    expect(urls).not.toContain("https://operis.pro/tr/akis");
    expect(urls).not.toContain("https://operis.pro/en/feed");
    expect(urls.some((u) => u.endsWith("/tr/akis") || u.endsWith("/en/feed"))).toBe(false);
  });

  it("must include core indexable pages for both TR and EN locales", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls.some((u) => u.endsWith("/tr"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/en"))).toBe(true);
    expect(urls.some((u) => u.includes("/tr/ilanlar"))).toBe(true);
    expect(urls.some((u) => u.includes("/en/listings"))).toBe(true);
    expect(urls.some((u) => u.includes("/tr/kategoriler"))).toBe(true);
    expect(urls.some((u) => u.includes("/en/categories"))).toBe(true);
  });

  it("must include 110 category landing routes in Turkish and English", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    const trCategories = urls.filter((u) => u.includes("/tr/kategori/"));
    const enCategories = urls.filter((u) => u.includes("/en/category/"));

    // 110 categories * 2 locales = 220 category URLs
    expect(trCategories.length).toBeGreaterThanOrEqual(100);
    expect(enCategories.length).toBeGreaterThanOrEqual(100);
  });

  it("all entries must have valid lastModified timestamps", async () => {
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries) {
      expect(entry.url).toBeDefined();
      expect(entry.lastModified).toBeDefined();
      expect(new Date(entry.lastModified as string | Date).toString()).not.toBe("Invalid Date");
    }
  });
});
