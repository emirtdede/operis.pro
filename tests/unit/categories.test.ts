import { describe, it, expect } from "vitest";
import { SEED_CATEGORIES, SEED_SECTORS } from "@/db/seeds/categories";
import { CategoryService } from "@/src/modules/categories/service";

describe("Category Service & Privacy Invariants", () => {
  it("ensures all seed sectors have defined stable keys, icons and translations", () => {
    expect(SEED_SECTORS.length).toBe(10);
    const keys = new Set<string>();
    SEED_SECTORS.forEach((sec) => {
      expect(sec.key).toMatch(/^[a-z0-9-]+$/);
      expect(keys.has(sec.key)).toBe(false);
      keys.add(sec.key);
      expect(sec.sortOrder).toBeGreaterThanOrEqual(1);
      expect(sec.icon).toBeDefined();
      expect(sec.translations.tr.name.length).toBeGreaterThan(2);
      expect(sec.translations.en.name.length).toBeGreaterThan(2);
    });
  });

  it("ensures all seed categories have defined stable keys and sort orders", () => {
    const keys = new Set<string>();
    SEED_CATEGORIES.forEach((cat) => {
      expect(cat.key).toMatch(/^[a-z0-9-]+$/);
      expect(keys.has(cat.key)).toBe(false);
      keys.add(cat.key);
      expect(cat.sortOrder).toBeGreaterThanOrEqual(1);
    });
  });

  it("verifies localized translation integrity for categories", () => {
    for (const cat of SEED_CATEGORIES) {
      expect(cat.translations.tr.name.length).toBeGreaterThan(2);
      expect(cat.translations.en.name.length).toBeGreaterThan(2);
      expect(cat.translations.tr.description.length).toBeGreaterThan(5);
      expect(cat.translations.en.description.length).toBeGreaterThan(5);
    }
  });

  it("verifies CategoryService.getSectorsWithCategories correctly groups all categories", async () => {
    const sectorsTr = await CategoryService.getSectorsWithCategories("tr");
    expect(sectorsTr.length).toBe(10);
    const totalCategories = sectorsTr.reduce((acc, s) => acc + s.categories.length, 0);
    expect(totalCategories).toBe(110);

    const sectorsEn = await CategoryService.getSectorsWithCategories("en");
    expect(sectorsEn.length).toBe(10);
    expect(sectorsEn[0]?.name).toBe("Software & Information Technology");
  });

  it("verifies searching 'web' maps seamlessly to CategoryService categories", async () => {
    const categories = await CategoryService.getAllCategories("tr");
    const { searchCategories } = await import("@/src/lib/search/engine");
    const searchResults = searchCategories("web");
    expect(searchResults.length).toBeGreaterThan(0);

    const categoryMap = new Map();
    for (const c of categories) {
      if (c.slug) categoryMap.set(c.slug.toLowerCase(), c);
      if (c.id) categoryMap.set(c.id.toLowerCase(), c);
      if (c.key) categoryMap.set(c.key.toLowerCase(), c);
      if (c.name) categoryMap.set(c.name.toLowerCase().trim(), c);
    }

    const mapped = [];
    for (const res of searchResults) {
      const item =
        (res.repoKey && categoryMap.get(res.repoKey.toLowerCase())) ||
        (res.slug && categoryMap.get(res.slug.toLowerCase())) ||
        (res.name && categoryMap.get(res.name.toLowerCase().trim()));
      if (item) mapped.push(item);
    }

    expect(mapped.length).toBeGreaterThan(0);
    expect(mapped.some((m) => m.name === "Web Geliştirme")).toBe(true);
  });
});
