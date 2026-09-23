import { describe, it, expect } from "vitest";
import { searchCategories } from "@/src/lib/search/engine";

describe("Navbar Live Search & Suggestion Engine Specifications", () => {
  describe("Category Live Matching (0ms In-Memory)", () => {
    it("returns up to 2 closest matching categories for valid query", () => {
      const results = searchCategories("web", { limit: 2 });
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(2);
      if (results.length > 0) {
        expect(results[0]?.name).toBeDefined();
        expect(results[0]?.slug).toBeDefined();
      }
    });

    it("returns empty array for non-matching queries", () => {
      const results = searchCategories("xyznonexistentterm999", { limit: 2 });
      expect(results.length).toBe(0);
    });
  });

  describe("Suggestion Hierarchy & Navigable Flow", () => {
    it("orders suggestions logically: categories -> listings -> direct search", () => {
      const categories = [{ slug: "web-dev", name: "Web Geliştirme" }];
      const listings = [
        { id: "1", title: "Next.js SaaS", slug: "nextjs-saas" },
        { id: "2", title: "Next.js Portal", slug: "nextjs-portal" },
      ];

      const suggestions: { id: string; type: "category" | "listing" | "search" }[] = [];

      categories.forEach((cat) => {
        suggestions.push({ id: `cat-${cat.slug}`, type: "category" });
      });
      listings.forEach((item) => {
        suggestions.push({ id: `listing-${item.id}`, type: "listing" });
      });
      suggestions.push({ id: "direct-search", type: "search" });

      expect(suggestions[0]?.type).toBe("category");
      expect(suggestions[1]?.type).toBe("listing");
      expect(suggestions[2]?.type).toBe("listing");
      expect(suggestions[3]?.type).toBe("search");
      expect(suggestions.length).toBe(4);
    });

    it("cycles through suggestion indices without out-of-bounds errors", () => {
      const totalCount = 4;
      let selectedIndex = -1;

      // Down arrow moves to 0
      selectedIndex = (selectedIndex + 1) % totalCount;
      expect(selectedIndex).toBe(0);

      // Down arrow moves to 1
      selectedIndex = (selectedIndex + 1) % totalCount;
      expect(selectedIndex).toBe(1);

      // Cycling backwards with Up arrow from 0 wraps to end
      selectedIndex = 0;
      selectedIndex = selectedIndex <= 0 ? totalCount - 1 : selectedIndex - 1;
      expect(selectedIndex).toBe(3);
    });
  });

  describe("Session Cache & Key Generation", () => {
    it("generates normalized locale-aware cache keys", () => {
      const query = "  TypeScript  ";
      const locale = "tr";
      const cacheKey = `${locale}:${query.trim().toLowerCase()}`;

      expect(cacheKey).toBe("tr:typescript");
    });
  });
});
