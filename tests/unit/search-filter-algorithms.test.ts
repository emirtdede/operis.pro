import { describe, it, expect } from "vitest";
import {
  normalizeTurkish,
  extractSearchTokens,
  scoreSearchMatch,
  filterAndSortByRelevance,
  computeRangeSelection,
} from "@/src/lib/search/token-matcher";

describe("Search and Filtering Algorithms (Turkish-Aware Token Matcher)", () => {
  describe("normalizeTurkish and extractSearchTokens", () => {
    it("handles Turkish diacritics and dotted/dotless I correctly", () => {
      const input = "İleri Düzey Grafik Tasarım & Yazılım Çözümleri";
      const normalized = normalizeTurkish(input);

      expect(normalized).toContain("ileri");
      expect(normalized).toContain("tasarim");
      expect(normalized).toContain("yazilim");
      expect(normalized).toContain("cozumleri");
    });

    it("extracts tokens including ascii shadows", () => {
      const tokens = extractSearchTokens("Geliştirici İlanı");
      expect(tokens).toContain("gelistirici");
      expect(tokens).toContain("ilani");
    });
  });

  describe("scoreSearchMatch", () => {
    it("matches Turkish queries regardless of diacritic usage (e.g. 'tasarim' matches 'Tasarım')", () => {
      const fields = [
        { text: "UI/UX Tasarım ve Marka Kimliği", weight: 10 },
        { text: "Figma ve Adobe Illustrator", weight: 4 },
      ];

      const res = scoreSearchMatch("tasarim", fields);
      expect(res.matches).toBe(true);
      expect(res.score).toBeGreaterThan(0);
    });

    it("requires all tokens in a multi-token query to match (AND logic)", () => {
      const fields = [
        { text: "Next.js ve Tailwind ile Modern Web Sitesi", weight: 10 },
        { text: "Frontend geliştirme", weight: 5 },
      ];

      const matchBoth = scoreSearchMatch("nextjs frontend", fields);
      expect(matchBoth.matches).toBe(true);

      const matchOneMissing = scoreSearchMatch("nextjs flutter", fields);
      expect(matchOneMissing.matches).toBe(false);
      expect(matchOneMissing.score).toBe(0);
    });

    it("rewards higher weight fields (title > tags > summary)", () => {
      const titleMatch = scoreSearchMatch("react", [
        { text: "React Uzmanı Aranıyor", weight: 10 },
        { text: "Web sitesi yapımı", weight: 2 },
      ]);

      const summaryMatch = scoreSearchMatch("react", [
        { text: "Web Geliştirici", weight: 10 },
        { text: "React deneyimi tercih sebebidir", weight: 2 },
      ]);

      expect(titleMatch.score).toBeGreaterThan(summaryMatch.score);
    });
  });

  describe("filterAndSortByRelevance", () => {
    interface DummyItem {
      id: string;
      title: string;
      tags: string[];
    }

    const dummyItems: DummyItem[] = [
      { id: "1", title: "Python Backend API", tags: ["fastapi", "docker"] },
      { id: "2", title: "React Native Mobil Uygulama", tags: ["mobile", "react"] },
      { id: "3", title: "Full Stack React & Node.js Platform", tags: ["react", "node", "typescript"] },
    ];

    it("filters and sorts items so highest relevance comes first", () => {
      const filtered = filterAndSortByRelevance(dummyItems, "react", (item) => [
        { text: item.title, weight: 10 },
        { text: item.tags.join(" "), weight: 4 },
      ]);

      expect(filtered.length).toBe(2);
      expect(filtered.map((i) => i.id)).toContain("2");
      expect(filtered.map((i) => i.id)).toContain("3");
      expect(filtered.map((i) => i.id)).not.toContain("1");
    });
  });

  describe("Algoritma 5: Shift + Click Hızlı Aralık Seçimi (computeRangeSelection)", () => {
    const items = [
      { id: "item-1" },
      { id: "item-2" },
      { id: "item-3" },
      { id: "item-4" },
      { id: "item-5" },
    ];

    it("selects a contiguous range when Shift is held", () => {
      const initialSelection = new Set(["item-2"]);
      const nextSelection = computeRangeSelection(
        items,
        "item-2", // last selected
        "item-4", // target clicked with shift
        initialSelection
      );

      expect(nextSelection.has("item-2")).toBe(true);
      expect(nextSelection.has("item-3")).toBe(true);
      expect(nextSelection.has("item-4")).toBe(true);
      expect(nextSelection.has("item-1")).toBe(false);
      expect(nextSelection.has("item-5")).toBe(false);
    });

    it("handles reverse range selection (bottom to top)", () => {
      const initialSelection = new Set(["item-4"]);
      const nextSelection = computeRangeSelection(
        items,
        "item-4",
        "item-1",
        initialSelection
      );

      expect(nextSelection.has("item-1")).toBe(true);
      expect(nextSelection.has("item-2")).toBe(true);
      expect(nextSelection.has("item-3")).toBe(true);
      expect(nextSelection.has("item-4")).toBe(true);
      expect(nextSelection.has("item-5")).toBe(false);
    });

    it("toggles single item when no lastSelectedId is provided", () => {
      const selection = new Set<string>();
      const added = computeRangeSelection(items, null, "item-3", selection);
      expect(added.has("item-3")).toBe(true);

      const removed = computeRangeSelection(items, null, "item-3", added);
      expect(removed.has("item-3")).toBe(false);
    });
  });
});
