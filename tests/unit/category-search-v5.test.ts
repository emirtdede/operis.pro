import { describe, it, expect } from "vitest";
import { searchCategories, searchV5 } from "@/src/lib/search/engine";
import { taxonomyIndex } from "@/src/lib/search/taxonomy-index";
import {
  normalizeSearchQuery,
  toAsciiShadow,
  stemTurkishWord,
  cleanHiringIntent,
} from "@/src/lib/search/normalization";

describe("Operis Search v5 Engine & Taxonomy", () => {
  describe("Taxonomy Index Invariants", () => {
    it("loads exactly 110 categories", () => {
      expect(taxonomyIndex.categories.length).toBe(110);
      expect(taxonomyIndex.categoriesBySlug.size).toBe(110);
      expect(taxonomyIndex.categoriesById.size).toBe(110);
    });

    it("ensures all categories have valid slugs, names, and search terms", () => {
      for (const cat of taxonomyIndex.categories) {
        expect(cat.id).toBeGreaterThan(0);
        expect(cat.slug).toMatch(/^[a-z0-9-]+$/);
        expect(cat.name.length).toBeGreaterThan(2);
        expect(cat.canonicalTerms.length).toBeGreaterThan(0);
        expect(cat.searchTerms.length).toBeGreaterThan(0);
      }
    });

    it("ensures relation graph contains no self-relations and valid targets", () => {
      for (const [slug, relations] of taxonomyIndex.relationGraph.entries()) {
        for (const rel of relations) {
          expect(rel.slug).not.toBe(slug);
          expect(taxonomyIndex.getCategory(rel.slug)).toBeDefined();
          expect(["strong", "medium", "weak"]).toContain(rel.strength);
        }
      }
    });
  });

  describe("Turkish Normalization & Stemming", () => {
    it("handles Turkish ASCII shadow correctly", () => {
      expect(toAsciiShadow("çalışma")).toBe("calisma");
      expect(toAsciiShadow("geliştirici")).toBe("gelistirici");
      expect(toAsciiShadow("öğrenme")).toBe("ogrenme");
      expect(toAsciiShadow("şirket")).toBe("sirket");
      expect(toAsciiShadow("yazılım")).toBe("yazilim");
    });

    it("preserves protected technical tokens", () => {
      expect(normalizeSearchQuery("c# geliştirici")).toBe("c# geliştirici");
      expect(normalizeSearchQuery("c++ uzmanı")).toBe("c++ uzmanı");
      expect(normalizeSearchQuery(".net mimarı")).toBe(".net mimarı");
      expect(normalizeSearchQuery("ui/ux tasarım")).toBe("ui/ux tasarım");
    });

    it("stems Turkish agglutinative suffixes accurately", () => {
      expect(stemTurkishWord("oyunun")).toBe("oyun");
      expect(stemTurkishWord("motorundan")).toBe("motor");
      expect(stemTurkishWord("uygulamamın")).toBe("uygulam");
      expect(stemTurkishWord("uygulamamın")).toBe(stemTurkishWord("uygulama"));
      expect(stemTurkishWord("arayüzünü")).toBe("arayuz");
      expect(stemTurkishWord("sözleşmesi")).toBe("sozlesm");
      expect(stemTurkishWord("sözleşmesi")).toBe(stemTurkishWord("sözleşme"));
    });

    it("strips common hiring intent prefixes and suffixes", () => {
      const q1 = cleanHiringIntent(normalizeSearchQuery("mevcut projemde web sitesi yaptırmak istiyorum"));
      expect(q1.hasHiringIntent).toBe(true);
      expect(q1.coreQuery).toBe("web sitesi");

      const q2 = cleanHiringIntent(normalizeSearchQuery("projem için SQL bilen bir uzman arıyorum"));
      expect(q2.hasHiringIntent).toBe(true);
      expect(q2.coreQuery).toBe("sql");

      const q3 = cleanHiringIntent(normalizeSearchQuery("Contract Drafting konusunda tecrübeli bir freelancer lazım"));
      expect(q3.hasHiringIntent).toBe(true);
      expect(q3.coreQuery).toBe("contract drafting");
    });
  });

  describe("Relevance & Benchmark Search Scenarios", () => {
    it("resolves exact category names with score 1.0", () => {
      const res = searchCategories("Web Geliştirme");
      expect(res.length).toBeGreaterThan(0);
      expect(res[0]?.slug).toBe("web-gelistirme");
      expect(res[0]?.matchClass).toBe("exactCategoryName");
      expect(res[0]?.score).toBe(1.0);
    });

    it("resolves canonical queries via ASCII shadow with exact match", () => {
      const res = searchCategories("web gelistirme");
      expect(res.length).toBeGreaterThan(0);
      expect(res[0]?.slug).toBe("web-gelistirme");
    });

    it("resolves ambiguous tools with collision priority", () => {
      // SQL should prioritize data engineering
      const sqlRes = searchCategories("SQL konusunda tecrübeli bir freelancer lazım");
      expect(sqlRes[0]?.slug).toBe("veri-muhendisligi-ve-analitik");

      // Contract drafting should prioritize freelance & software contracts
      const contractRes = searchCategories("Contract Drafting konusunda tecrübeli bir freelancer lazım");
      expect(contractRes[0]?.slug).toBe("freelance-ve-yazilim-hizmet-sozlesmeleri");

      // Online sales site should prioritize e-commerce site development
      const storeRes = searchCategories("online satış sitesi yaptırmak istiyorum");
      expect(storeRes[0]?.slug).toBe("e-ticaret-sitesi-gelistirme");
    });

    it("handles complex natural problem statements", () => {
      const gameRes = searchCategories(
        "Oyunun motorundan bağımsız olarak genel mekanik ve prototip geliştirme desteği arıyorum."
      );
      expect(gameRes[0]?.slug).toBe("oyun-gelistirme");

      const legalRes = searchCategories(
        "Yazılım geliştirme projesi için kapsam, teslim, IP ve ödeme maddeleri olan sözleşme lazım."
      );
      expect(legalRes[0]?.slug).toBe("freelance-ve-yazilim-hizmet-sozlesmeleri");
    });

    it("recovers from curated and single-token typos", () => {
      const typo1 = searchCategories("phptoshop");
      expect(typo1[0]?.slug).toBe("fotograf-duzenleme-ve-retouching");

      const typo2 = searchCategories("reakt");
      expect(typo2[0]?.slug).toBe("frontend-ve-arayuz-muhendisligi");
    });

    it("searches query 'web' and verifies top matches and repoKey", () => {
      const res = searchCategories("web");
      expect(res.length).toBeGreaterThan(0);
      expect(res.some((r) => r.slug === "web-gelistirme" && r.repoKey === "web-development")).toBe(true);
    });

    it("alias searchV5 behaves identically to searchCategories", () => {
      const res1 = searchCategories("mobil uygulama");
      const res2 = searchV5("mobil uygulama");
      expect(res1[0]?.slug).toBe(res2[0]?.slug);
      expect(res1[0]?.score).toBe(res2[0]?.score);
    });
  });

  describe("Adversarial Robustness & Safety", () => {
    it("handles SQL injection payloads safely", () => {
      const res = searchCategories("'; DROP TABLE categories; --");
      expect(Array.isArray(res)).toBe(true);
    });

    it("handles XSS payloads safely", () => {
      const res = searchCategories("<script>alert('xss')</script>");
      expect(Array.isArray(res)).toBe(true);
    });

    it("handles empty and control character queries safely", () => {
      expect(searchCategories("")).toEqual([]);
      expect(searchCategories("   ")).toEqual([]);
      expect(searchCategories("\u0000\u0001\u0002")).toEqual([]);
    });

    it("safely caps excessively long queries without throwing", () => {
      const longQuery = "web ".repeat(100);
      const res = searchCategories(longQuery);
      expect(Array.isArray(res)).toBe(true);
    });
  });
});
