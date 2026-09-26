import { describe, it, expect } from "vitest";
import { getClientIp } from "@/src/lib/security/rate-limit";

describe("getClientIp Anti-Spoofing & Edge Proxy Priority", () => {
  it("prioritizes Cloudflare cf-connecting-ip over spoofed x-forwarded-for", () => {
    const req = new Request("https://operis.pro/api/test", {
      headers: {
        "cf-connecting-ip": "198.51.100.42",
        "x-forwarded-for": "10.0.0.1, 10.0.0.2",
        "x-real-ip": "172.16.0.5",
      },
    });

    const ip = getClientIp(req);
    expect(ip).toBe("198.51.100.42");
  });

  it("prioritizes Vercel x-vercel-forwarded-for when cf-connecting-ip is absent", () => {
    const req = new Request("https://operis.pro/api/test", {
      headers: {
        "x-vercel-forwarded-for": "203.0.113.19, 10.0.0.1",
        "x-forwarded-for": "10.0.0.1, 10.0.0.2",
        "x-real-ip": "172.16.0.5",
      },
    });

    const ip = getClientIp(req);
    expect(ip).toBe("203.0.113.19");
  });

  it("falls back to x-real-ip when edge proxy headers are absent", () => {
    const req = new Request("https://operis.pro/api/test", {
      headers: {
        "x-real-ip": "192.0.2.1",
      },
    });

    const ip = getClientIp(req);
    expect(ip).toBe("192.0.2.1");
  });

  it("validates and normalizes candidate IPs and ignores invalid strings", () => {
    const req = new Request("https://operis.pro/api/test", {
      headers: {
        "x-forwarded-for": "malicious-header-injection, 192.0.2.77",
      },
    });

    const ip = getClientIp(req);
    expect(ip).toBe("192.0.2.77");
  });

  it("returns default 127.0.0.1 when no headers are present", () => {
    const req = new Request("https://operis.pro/api/test");
    const ip = getClientIp(req);
    expect(ip).toBe("127.0.0.1");
  });
});
