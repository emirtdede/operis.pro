import dns from "dns";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  DeliveryInspectorService,
  type InspectDeliveryInput,
} from "@/src/modules/engagements/delivery-inspector";
import { POST as inspectRouteHandler } from "@/src/app/api/work/[id]/handover/inspect/route";
import { evaluateSecurityAccessAsync } from "@/src/lib/security/rate-limit";

vi.mock("@/src/modules/auth/session", () => ({
  getSession: vi.fn().mockResolvedValue({
    userId: "u-techcorp-1",
    role: "SPECIALIST",
    email: "specialist@operis.pro",
  }),
}));

vi.mock("@/src/lib/security/rate-limit", () => ({
  evaluateSecurityAccessAsync: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  normalizeIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

describe("Proof-of-Work (PoW) Delivery Health & Uptime Inspector Suite", () => {
  beforeEach(() => {
    vi.mocked(evaluateSecurityAccessAsync).mockResolvedValue({
      allowed: true,
    } as unknown as Awaited<ReturnType<typeof evaluateSecurityAccessAsync>>);
    vi.spyOn(dns.promises, "lookup").mockImplementation(async (hostname: string) => {
      const lower = hostname.toLowerCase();
      if (
        lower === "localhost" ||
        lower.endsWith(".localhost") ||
        lower.endsWith(".local") ||
        lower.endsWith(".internal") ||
        lower === "127.0.0.1" ||
        lower === "169.254.169.254" ||
        lower === "10.0.0.1" ||
        lower === "private.corp"
      ) {
        return [{ address: "127.0.0.1", family: 4 }] as unknown as dns.LookupAddress;
      }
      return [{ address: "93.184.216.34", family: 4 }] as unknown as dns.LookupAddress;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("SSRF Shield & Subnet Firewall", () => {
    it("should detect and block IPv4 private, loopback, and cloud metadata ranges", () => {
      // Loopback
      expect(DeliveryInspectorService.isPrivateOrReservedIp("127.0.0.1")).toBe(true);
      expect(DeliveryInspectorService.isPrivateOrReservedIp("127.10.20.30")).toBe(true);

      // Class A private (10.0.0.0/8)
      expect(DeliveryInspectorService.isPrivateOrReservedIp("10.0.0.1")).toBe(true);
      expect(DeliveryInspectorService.isPrivateOrReservedIp("10.254.254.254")).toBe(true);

      // Class B private (172.16.0.0/12)
      expect(DeliveryInspectorService.isPrivateOrReservedIp("172.16.0.1")).toBe(true);
      expect(DeliveryInspectorService.isPrivateOrReservedIp("172.31.255.255")).toBe(true);
      expect(DeliveryInspectorService.isPrivateOrReservedIp("172.32.0.1")).toBe(false); // Public

      // Class C private (192.168.0.0/16)
      expect(DeliveryInspectorService.isPrivateOrReservedIp("192.168.1.1")).toBe(true);
      expect(DeliveryInspectorService.isPrivateOrReservedIp("192.168.254.254")).toBe(true);

      // AWS/GCP/Azure link-local instance metadata (169.254.169.254)
      expect(DeliveryInspectorService.isPrivateOrReservedIp("169.254.169.254")).toBe(true);
      expect(DeliveryInspectorService.isPrivateOrReservedIp("169.254.1.1")).toBe(true);

      // CGNAT and broadcast
      expect(DeliveryInspectorService.isPrivateOrReservedIp("0.0.0.0")).toBe(true);
      expect(DeliveryInspectorService.isPrivateOrReservedIp("100.64.0.1")).toBe(true);

      // Public IP addresses must be allowed
      expect(DeliveryInspectorService.isPrivateOrReservedIp("8.8.8.8")).toBe(false);
      expect(DeliveryInspectorService.isPrivateOrReservedIp("1.1.1.1")).toBe(false);
      expect(DeliveryInspectorService.isPrivateOrReservedIp("104.21.5.10")).toBe(false);
    });

    it("should detect and block IPv6 loopback, link-local, and unique local addresses", () => {
      expect(DeliveryInspectorService.isPrivateOrReservedIp("::1")).toBe(true);
      expect(DeliveryInspectorService.isPrivateOrReservedIp("::")).toBe(true);
      expect(DeliveryInspectorService.isPrivateOrReservedIp("fc00::1")).toBe(true);
      expect(DeliveryInspectorService.isPrivateOrReservedIp("fd12:3456:789a::1")).toBe(true);
      expect(DeliveryInspectorService.isPrivateOrReservedIp("fe80::1")).toBe(true);
      expect(DeliveryInspectorService.isPrivateOrReservedIp("::ffff:127.0.0.1")).toBe(true);
      expect(DeliveryInspectorService.isPrivateOrReservedIp("::ffff:192.168.1.1")).toBe(true);
    });

    it("should reject non-HTTP schemes and dangerous internal hostnames", async () => {
      await expect(
        DeliveryInspectorService.validateUrlSsrfSafe("ftp://ftp.operis.pro/secret")
      ).rejects.toThrow(/Yalnızca HTTP ve HTTPS/);

      await expect(
        DeliveryInspectorService.validateUrlSsrfSafe("gopher://127.0.0.1:70")
      ).rejects.toThrow(/Yalnızca HTTP ve HTTPS/);

      await expect(
        DeliveryInspectorService.validateUrlSsrfSafe("http://localhost:3000/api")
      ).rejects.toThrow(/engellendi/);

      await expect(
        DeliveryInspectorService.validateUrlSsrfSafe("http://sub.localhost/test")
      ).rejects.toThrow(/engellendi/);

      await expect(
        DeliveryInspectorService.validateUrlSsrfSafe("http://169.254.169.254/latest/meta-data")
      ).rejects.toThrow(/SSRF Koruması/);
    });
  });

  describe("Git Repository & Commit Hash Verification", () => {
    it("should identify Git providers (GitHub, GitLab, Bitbucket)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: new Headers(),
      });
      vi.stubGlobal("fetch", mockFetch);

      const gh = await DeliveryInspectorService.probeGitRepository(
        "https://github.com/operis-platform/core",
        "9a7b1c3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c"
      );
      expect(gh.provider).toBe("github");
      expect(gh.commitValid).toBe(true);

      const gl = await DeliveryInspectorService.probeGitRepository(
        "https://gitlab.com/enterprise/backend",
        "abc1234"
      );
      expect(gl.provider).toBe("gitlab");
      expect(gl.commitValid).toBe(true);

      const bb = await DeliveryInspectorService.probeGitRepository(
        "https://bitbucket.org/workspace/repo",
        null
      );
      expect(bb.provider).toBe("bitbucket");
    });

    it("should flag invalid commit hash formats (non-hex or incorrect length)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: new Headers(),
      });
      vi.stubGlobal("fetch", mockFetch);

      const invalidShort = await DeliveryInspectorService.probeGitRepository(
        "https://github.com/test/repo",
        "123" // Too short (< 7)
      );
      expect(invalidShort.commitValid).toBe(false);

      const invalidChars = await DeliveryInspectorService.probeGitRepository(
        "https://github.com/test/repo",
        "abcdefg_not_hex!"
      );
      expect(invalidChars.commitValid).toBe(false);
    });
  });

  describe("Live Deployment Probing & Metric Measurement", () => {
    it("should probe live HTTP 200 OK deployment with latency and SSL flags", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: new Headers({
          "content-type": "text/html; charset=utf-8",
          server: "Vercel",
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const probe = await DeliveryInspectorService.probeLiveDeployment(
        "https://demo.operis.dev"
      );

      expect(probe.checked).toBe(true);
      expect(probe.isAccessible).toBe(true);
      expect(probe.httpStatus).toBe(200);
      expect(probe.sslValid).toBe(true);
      expect(probe.protocol).toBe("HTTPS");
      expect(probe.responseTimeMs).toBeGreaterThanOrEqual(0);
    });

    it("should mark 404 and 500 responses as not accessible", async () => {
      const mockFetch404 = vi.fn().mockResolvedValue({
        status: 404,
        statusText: "Not Found",
        headers: new Headers(),
      });
      vi.stubGlobal("fetch", mockFetch404);

      const probe404 = await DeliveryInspectorService.probeLiveDeployment(
        "https://demo.operis.dev/broken-link"
      );

      expect(probe404.checked).toBe(true);
      expect(probe404.isAccessible).toBe(false);
      expect(probe404.httpStatus).toBe(404);
    });
  });

  describe("Proof-of-Work (PoW) Seal & Full Orchestration", () => {
    it("should generate a 64-char cryptographic SHA-256 seal and bilingual badges", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "text/html" }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const input: InspectDeliveryInput = {
        liveUrl: "https://saas-demo.operis.dev",
        repositoryUrl: "https://github.com/techcorp/nextjs-saas-enterprise",
        commitHash: "e4b2a8f9c1d07e6b5a3f1234567890abcdef1234",
        locale: "tr",
      };

      const report = await DeliveryInspectorService.inspectDelivery(input);

      expect(report.isHealthy).toBe(true);
      expect(report.summaryStatus).toBe("HEALTHY");
      expect(report.powSeal).toMatch(/^[0-9a-f]{64}$/);
      expect(report.badgeTextTr).toContain("✅ Canlı Sistem Sağlık Kontrolünden Geçti");
      expect(report.badgeTextEn).toContain("✅ Live System Health Inspection Passed");
      expect(report.liveDeployment.isAccessible).toBe(true);
      expect(report.gitRepository.commitValid).toBe(true);

      vi.unstubAllGlobals();
    });
  });

  describe("POST /api/work/[id]/handover/inspect Endpoint", () => {
    it("should return inspection report for authenticated requests", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: new Headers(),
      });
      vi.stubGlobal("fetch", mockFetch);

      const req = new Request("http://localhost/api/work/eng-demo-101/handover/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryUrl: "https://github.com/techcorp/saas",
          liveUrl: "https://demo.operis.dev",
          commitHash: "e4b2a8f",
          locale: "tr",
        }),
      });

      const res = await inspectRouteHandler(req, {
        params: Promise.resolve({ id: "eng-demo-101" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.report).toBeDefined();
      expect(json.report.powSeal).toMatch(/^[0-9a-f]{64}$/);

      vi.unstubAllGlobals();
    });

    it("should reject redirect pointing to private IP or cloud metadata", async () => {
      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("safe-site.com")) {
          return {
            status: 302,
            headers: new Headers({ location: "http://169.254.169.254/latest/meta-data" }),
          };
        }
        return { status: 200, headers: new Headers() };
      });
      vi.stubGlobal("fetch", mockFetch);

      await expect(
        DeliveryInspectorService.fetchSsrfSafe("https://safe-site.com/redirect")
      ).rejects.toThrow(/SSRF Koruması/);
    });

    it("should follow safe redirects and return final URL", async () => {
      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("start")) {
          return {
            status: 301,
            headers: new Headers({ location: "https://safe-site.com/destination" }),
          };
        }
        return {
          status: 200,
          statusText: "OK",
          headers: new Headers({ "content-type": "text/html" }),
        };
      });
      vi.stubGlobal("fetch", mockFetch);

      const result = await DeliveryInspectorService.fetchSsrfSafe("https://safe-site.com/start");
      expect(result.response.status).toBe(200);
      expect(result.finalUrl).toBe("https://safe-site.com/destination");
    });

    it("should abort when redirect count exceeds maxRedirects", async () => {
      const mockFetch = vi.fn().mockImplementation(async () => {
        return {
          status: 302,
          headers: new Headers({ location: "https://safe-site.com/loop" }),
        };
      });
      vi.stubGlobal("fetch", mockFetch);

      await expect(
        DeliveryInspectorService.fetchSsrfSafe("https://safe-site.com/loop", { maxRedirects: 3 })
      ).rejects.toThrow(/Çok fazla yönlendirme/);
    });

    it("should return 400 Bad Request when repositoryUrl is omitted", async () => {
      const req = new Request("http://localhost/api/work/eng-demo-101/handover/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryUrl: "",
        }),
      });

      const res = await inspectRouteHandler(req, {
        params: Promise.resolve({ id: "eng-demo-101" }),
      });

      expect(res.status).toBe(400);
    });

    it("should return 404 when user is not authorized for the engagement", async () => {
      const req = new Request("http://localhost/api/work/eng-unauthorized-xyz/handover/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryUrl: "https://github.com/techcorp/saas",
        }),
      });

      const res = await inspectRouteHandler(req, {
        params: Promise.resolve({ id: "eng-unauthorized-xyz" }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toContain("İş birliği bulunamadı veya erişim yetkiniz yok.");
    });
  });
});
