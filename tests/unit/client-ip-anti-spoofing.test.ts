import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getClientIp } from "@/src/lib/security/rate-limit";
const request = (headers: Record<string, string>) =>
  new Request("https://operis.test", { headers });
beforeEach(() => {
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("TRUSTED_PROXY_PROVIDER", undefined);
  vi.stubEnv("CLOUDFLARE_PROXY_SECRET", undefined);
});
afterEach(() => vi.unstubAllEnvs());
describe("authoritative proxy identity", () => {
  it.each(["cf-connecting-ip", "x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"])(
    "ignores %s without a trusted provider",
    (header) => {
      expect(getClientIp(request({ [header]: "198.51.100.1", "cf-ray": "forged" }))).toBe(
        "127.0.0.1"
      );
    }
  );
  it("requires a Cloudflare secret and rejects forged origin authentication", () => {
    vi.stubEnv("TRUSTED_PROXY_PROVIDER", "cloudflare");
    expect(() => getClientIp(request({ "cf-ray": "x" }))).toThrow("CLOUDFLARE_PROXY_SECRET");
    vi.stubEnv("CLOUDFLARE_PROXY_SECRET", "origin-test-secret");
    const headers = { "cf-connecting-ip": "198.51.100.2", "x-operis-origin-auth": "wrong" };
    expect(getClientIp(request(headers))).toBe("127.0.0.1");
    headers["x-operis-origin-auth"] = "origin-test-secret";
    expect(getClientIp(request(headers))).toBe("198.51.100.2");
  });
  it("isolates Vercel headers", () => {
    vi.stubEnv("VERCEL", "1");
    expect(
      getClientIp(
        request({
          "cf-connecting-ip": "198.51.100.2",
          "cf-ray": "forged",
          "x-vercel-forwarded-for": "192.0.2.3, 10.0.0.1",
        })
      )
    ).toBe("192.0.2.3");
    expect(getClientIp(request({ "x-real-ip": "192.0.2.4" }))).toBe("127.0.0.1");
  });
  it("rejects conflicting and unknown providers", () => {
    vi.stubEnv("TRUSTED_PROXY_PROVIDER", "unknown");
    expect(() => getClientIp(request({}))).toThrow("Invalid");
    vi.stubEnv("TRUSTED_PROXY_PROVIDER", "cloudflare");
    vi.stubEnv("VERCEL", "1");
    expect(() => getClientIp(request({}))).toThrow("Conflicting");
  });
  it.each(["bad", ":::", "198.51.100.2, 192.0.2.3", ""])(
    "rejects malformed Cloudflare IP %s",
    (ip) => {
      vi.stubEnv("TRUSTED_PROXY_PROVIDER", "cloudflare");
      vi.stubEnv("CLOUDFLARE_PROXY_SECRET", "test-origin");
      expect(
        getClientIp(request({ "cf-connecting-ip": ip, "x-operis-origin-auth": "test-origin" }))
      ).toBe("127.0.0.1");
    }
  );
  it("normalizes verified IPv6", () => {
    vi.stubEnv("TRUSTED_PROXY_PROVIDER", "vercel");
    expect(getClientIp(request({ "x-vercel-forwarded-for": "2001:db8::1" }))).toBe(
      "2001:db8:0:0:0:0:0:1"
    );
  });
});
