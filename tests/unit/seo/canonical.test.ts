import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getBaseUrl, constructCanonicalUrl } from "@/src/lib/config/url";

describe("SEO: Canonical URL Normalization & Domain Security", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should strip query parameters and hash fragments from canonical URLs", () => {
    const urlWithParams = constructCanonicalUrl("/tr/ilanlar?category=web&sort=date#results");
    expect(urlWithParams).toBe("https://operis.pro/tr/ilanlar");
    expect(urlWithParams).not.toContain("?");
    expect(urlWithParams).not.toContain("#");
  });

  it("should normalize paths with or without leading/trailing slashes", () => {
    expect(constructCanonicalUrl("tr/kategoriler/")).toBe("https://operis.pro/tr/kategoriler");
    expect(constructCanonicalUrl("/tr/kategoriler")).toBe("https://operis.pro/tr/kategoriler");
    expect(constructCanonicalUrl("/")).toBe("https://operis.pro");
    expect(constructCanonicalUrl("")).toBe("https://operis.pro");
  });

  it("should strictly enforce https://operis.pro in production and never leak vercel.app", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_URL = "operis-preview-xyz.vercel.app";
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.APP_URL;

    const base = getBaseUrl();
    expect(base).toBe("https://operis.pro");
    expect(base).not.toContain("vercel.app");
  });

  it("should respect explicit NEXT_PUBLIC_APP_URL in non-production environments", () => {
    delete process.env.VERCEL_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:8000";

    const base = getBaseUrl();
    expect(base).toBe("http://localhost:8000");
  });
});
