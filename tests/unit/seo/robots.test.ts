import { describe, it, expect } from "vitest";
import robots from "@/src/app/robots";

describe("SEO: Robots.txt Rules & Crawler Policy", () => {
  it("should generate a valid robots configuration with sitemap url", () => {
    const config = robots();
    expect(config).toBeDefined();
    expect(config.sitemap).toContain("/sitemap.xml");
  });

  it("should explicitly allow OAI-SearchBot for ChatGPT Search discovery", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const oaiRule = rules.find((r) => r.userAgent === "OAI-SearchBot");

    expect(oaiRule).toBeDefined();
    expect(oaiRule?.allow).toEqual(expect.arrayContaining(["/", "/llms.txt"]));
  });

  it("should disallow private dashboards, messages, and internal search parameters across all bots", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];

    for (const rule of rules) {
      const disallowed = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];

      // Internal search spam protection (Google Search Essentials)
      expect(disallowed).toContain("/*?*q=*");
      expect(disallowed).toContain("/*?*search=*");

      // Private messages & user panels protection
      expect(disallowed).toContain("/messages/");
      expect(disallowed).toContain("/mesajlar/");
      expect(disallowed).toContain("/dashboard/");
      expect(disallowed).toContain("/panel/");
      expect(disallowed).toContain("/api/");
    }
  });
});
