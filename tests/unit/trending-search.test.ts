import { describe, it, expect } from "vitest";
import { TrendingSearchService } from "@/src/lib/search/trending-service";
import { getSeedTrending, SEED_TRENDING_SEARCHES } from "@/src/lib/search/trending-constants";

describe("Navbar & Trending Search Ecosystem Specifications", () => {
  describe("Seed Constants & Bilingual Support", () => {
    it("provides exactly 5 curated seeds for Turkish and English", () => {
      const trSeeds = getSeedTrending("tr");
      const enSeeds = getSeedTrending("en");

      expect(trSeeds.length).toBe(5);
      expect(enSeeds.length).toBe(5);
      expect(trSeeds).toContain("TypeScript");
      expect(trSeeds).toContain("Yapay Zeka");
      expect(enSeeds).toContain("AI / LLM");
    });

    it("falls back safely to Turkish seeds for unknown locales", () => {
      const fallback = getSeedTrending("fr");
      expect(fallback.length).toBe(5);
      expect(fallback).toEqual(SEED_TRENDING_SEARCHES.tr);
    });
  });

  describe("Query Validation & Anti-Spam Guards", () => {
    it("accepts valid developer queries between 2 and 40 characters", () => {
      expect(TrendingSearchService.validateQuery("Next.js")).toBe("Next.js");
      expect(TrendingSearchService.validateQuery("React Native Developer")).toBe("React Native Developer");
      expect(TrendingSearchService.validateQuery("  PostgreSQL 16  ")).toBe("PostgreSQL 16");
    });

    it("rejects queries shorter than 2 or longer than 40 characters", () => {
      expect(TrendingSearchService.validateQuery("a")).toBeNull();
      expect(TrendingSearchService.validateQuery("")).toBeNull();
      expect(TrendingSearchService.validateQuery("a".repeat(45))).toBeNull();
    });

    it("blocks HTML and script injection attempts", () => {
      expect(TrendingSearchService.validateQuery("<script>alert(1)</script>")).toBeNull();
      expect(TrendingSearchService.validateQuery("Hello <img src=x onerror=alert(1)>")).toBeNull();
      expect(TrendingSearchService.validateQuery("javascript:void(0)")).toBeNull();
    });

    it("blocks URL links and web domains", () => {
      expect(TrendingSearchService.validateQuery("https://spam-site.com")).toBeNull();
      expect(TrendingSearchService.validateQuery("http://malware.org")).toBeNull();
      expect(TrendingSearchService.validateQuery("www.badlink.net")).toBeNull();
    });

    it("blocks SQL injection payloads", () => {
      expect(TrendingSearchService.validateQuery("SELECT * FROM users")).toBeNull();
      expect(TrendingSearchService.validateQuery("UNION SELECT password FROM users")).toBeNull();
      expect(TrendingSearchService.validateQuery("DROP TABLE listings")).toBeNull();
    });

    it("blocks casino, gambling, and adult spam keywords", () => {
      expect(TrendingSearchService.validateQuery("online casino bonus")).toBeNull();
      expect(TrendingSearchService.validateQuery("canlı bahis siteleri")).toBeNull();
      expect(TrendingSearchService.validateQuery("kumar oyna")).toBeNull();
    });
  });

  describe("Hybrid Blending & Ranking", () => {
    it("returns top 5 trending items blending real searches with seed fallbacks", async () => {
      // Record a search
      await TrendingSearchService.recordSearch("Docker & Kubernetes", "tr");

      const topTrending = await TrendingSearchService.getTopTrending("tr");

      expect(topTrending.length).toBe(5);
      // The recorded item should be present
      expect(topTrending).toContain("Docker & Kubernetes");
      // The remaining 4 items should be filled from seeds
      expect(topTrending.filter(item => getSeedTrending("tr").includes(item)).length).toBe(4);
    });

    it("increments search counts and ranks more frequently searched queries higher", async () => {
      // Record searches with different frequencies
      await TrendingSearchService.recordSearch("Rust Backend", "tr");
      await TrendingSearchService.recordSearch("Rust Backend", "tr");
      await TrendingSearchService.recordSearch("Rust Backend", "tr");

      await TrendingSearchService.recordSearch("Golang Microservices", "tr");

      const topTrending = await TrendingSearchService.getTopTrending("tr");

      const rustIndex = topTrending.indexOf("Rust Backend");
      const goIndex = topTrending.indexOf("Golang Microservices");

      expect(rustIndex).toBeGreaterThanOrEqual(0);
      expect(goIndex).toBeGreaterThanOrEqual(0);
      expect(rustIndex).toBeLessThan(goIndex); // Rust was searched more, so it should rank higher
    });

    it("correctly extracts database rows from node-postgres QueryResult object", async () => {
      const dbModule = await import("@/src/lib/db");
      const { vi } = await import("vitest");

      vi.spyOn(dbModule, "getDb").mockReturnValue({
        execute: vi.fn().mockResolvedValue({
          command: "SELECT",
          rowCount: 1,
          oid: null,
          fields: [],
          rows: [{ query: "PostgreSQL Advanced Architecture" }],
        }),
      } as unknown as ReturnType<typeof dbModule.getDb>);

      const top = await TrendingSearchService.getTopTrending("tr");
      expect(top).toContain("PostgreSQL Advanced Architecture");
      expect(top.length).toBe(5);
    });
  });
});

