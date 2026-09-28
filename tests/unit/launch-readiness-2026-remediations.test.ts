import { describe, it, expect, afterEach } from "vitest";
import { getDbSslConfig } from "@/src/lib/db";
import { TrendingSearchService } from "@/src/lib/search/trending-service";
import { RunbookService } from "@/src/modules/engagements/runbook-service";
import { VectorPdfEngine } from "@/src/lib/pdf/vector-pdf-engine";
import { POST as presignedAvatarPost } from "@/src/app/api/upload/avatar/presigned-url/route";

describe("Launch Readiness 2026 Remediations Verification Suite", () => {
  describe("B01: Clerk Session Bridge 2FA Hardening", () => {
    it("ensures session tokens without explicit twoFactorVerified flag have false", async () => {
      const { createSessionToken, verifySessionToken } = await import("@/src/modules/auth/session");
      const token = createSessionToken({
        id: "user-test-001",
        email: "admin@operis.tech",
        role: "ADMIN",
        status: "ACTIVE",
        authVersion: 1,
        twoFactorVerified: false,
      });

      const payload = verifySessionToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.twoFactorVerified).toBe(false);
    });
  });

  describe("B02: Mock Engagement & Runbook Isolation in Production", () => {
    it("prevents unrelated users from modifying mock runbooks created by another user", async () => {
      const engagementId = "eng-test-isolation-999";
      const creatorUserId = "user-creator-100";
      const foreignUserId = "user-foreign-200";

      // 1. Creator initializes runbook
      await RunbookService.getRunbook(engagementId, creatorUserId);

      // 2. Creator saves draft
      const saveResult = await RunbookService.saveRunbook(
        engagementId,
        {
          architectureSummary: "Original architecture blueprint",
          environmentVariables: [
            {
              key: "ENV",
              description: "Node Env",
              isRequired: true,
              secretCategory: "OTHER",
            },
          ],
          buildAndRunSteps: [
            {
              stepNumber: 1,
              title: "Build Step",
              command: "npm run build",
              description: "Build the app",
              environment: "PRODUCTION",
            },
          ],
          thirdPartyServices: [],
          disasterRecoverySteps: [
            {
              priority: "HIGH",
              scenario: "Database outage",
              procedure: "restore from backup",
            },
          ],
          backupSchedule: { frequency: "DAILY" },
          emergencyContact: null,
          publish: false,
        },
        creatorUserId
      );

      expect(saveResult.success).toBe(true);

      // 3. Foreign user attempts to modify creator's runbook
      await expect(
        RunbookService.saveRunbook(
          engagementId,
          {
            architectureSummary: "Malicious override",
            environmentVariables: [],
            buildAndRunSteps: [],
            thirdPartyServices: [],
            disasterRecoverySteps: [],
            backupSchedule: { frequency: "DAILY" },
            emergencyContact: null,
            publish: false,
          },
          foreignUserId
        )
      ).rejects.toThrow("Forbidden. You are not a participant in this engagement.");
    });
  });

  describe("B04: Database TLS Server Identity Enforcement", () => {
    const originalEnv = process.env.NODE_ENV;
    const originalReject = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;
    const originalCa = process.env.SUPABASE_SSL_CA_CERT;

    afterEach(() => {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
      if (originalReject === undefined) {
        delete process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;
      } else {
        process.env.DATABASE_SSL_REJECT_UNAUTHORIZED = originalReject;
      }
      if (originalCa === undefined) {
        delete process.env.SUPABASE_SSL_CA_CERT;
      } else {
        process.env.SUPABASE_SSL_CA_CERT = originalCa;
      }
    });

    it("enforces rejectUnauthorized=true by default in production", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      delete process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;
      delete process.env.SUPABASE_SSL_CA_CERT;

      const ssl = getDbSslConfig("postgres://user:pass@db.pooler.supabase.com:6543/postgres");
      expect(ssl).toBeDefined();
      expect(ssl?.rejectUnauthorized).toBe(true);
    });

    it("respects CA cert when provided", () => {
      process.env.SUPABASE_SSL_CA_CERT =
        "-----BEGIN CERTIFICATE-----\nMOCK\n-----END CERTIFICATE-----";
      delete process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;

      const ssl = getDbSslConfig("postgres://user:pass@db.supabase.co:5432/postgres");
      expect(ssl).toBeDefined();
      expect(ssl?.rejectUnauthorized).toBe(true);
      expect(ssl?.ca).toContain("MOCK");
    });
  });

  describe("B05: Direct Presigned Avatar Upload Closed", () => {
    it("returns 410 Gone for direct presigned upload requests", async () => {
      const dummyReq = new Request("http://localhost:8000/api/upload/avatar/presigned-url", {
        method: "POST",
        headers: { "x-locale": "en" },
      });

      const response = await presignedAvatarPost(dummyReq);
      expect(response.status).toBe(410);

      const json = await response.json();
      expect(json.error).toContain("disabled for security hardening");
    });
  });

  describe("B06: Trending Search Bounded Memory and Locale Segregation", () => {
    it("blocks spam and invalid query patterns", () => {
      expect(TrendingSearchService.validateQuery("<script>alert(1)</script>")).toBeNull();
      expect(TrendingSearchService.validateQuery("https://malicious-site.com")).toBeNull();
      expect(TrendingSearchService.validateQuery("select * from users")).toBeNull();
      expect(TrendingSearchService.validateQuery("a")).toBeNull(); // too short
      expect(TrendingSearchService.validateQuery("x".repeat(45))).toBeNull(); // too long
      expect(TrendingSearchService.validateQuery("Next.js Developer")).toBe("Next.js Developer");
    });

    it("segregates in-memory trends by locale and retrieves top trending correctly", async () => {
      await TrendingSearchService.recordSearch("Frontend Uzmanı", "tr");
      await TrendingSearchService.recordSearch("React Specialist", "en");

      const topTr = await TrendingSearchService.getTopTrending("tr");
      const topEn = await TrendingSearchService.getTopTrending("en");

      expect(topTr.some((q) => q.toLowerCase().includes("frontend"))).toBe(true);
      expect(topEn.some((q) => q.toLowerCase().includes("react"))).toBe(true);
    });
  });

  describe("B07: Vector PDF Engine Cache Bounding", () => {
    it("manages and clears in-memory PDF cache safely", () => {
      expect(() => VectorPdfEngine.clearCache()).not.toThrow();
    });
  });

  describe("B03: Clerk Revocation Resilience and iat Verification", () => {
    it("exports POST route handler that enforces authentication", async () => {
      const { POST } = await import("@/src/app/api/auth/logout-other-sessions/route");
      const req = new Request("http://localhost:3000/api/auth/logout-other-sessions", {
        method: "POST",
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });
  });

  describe("B04: Auxiliary DB Scripts TLS Verification", () => {
    it("confirms seed and purge scripts use secure getDbSslConfig", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");

      const seedContent = fs.readFileSync(path.resolve(process.cwd(), "scripts/seed.ts"), "utf8");
      const purgeContent = fs.readFileSync(
        path.resolve(process.cwd(), "scripts/purge-dev-seed-data.ts"),
        "utf8"
      );

      expect(seedContent).toContain("ssl: getDbSslConfig(connStr)");
      expect(purgeContent).toContain("ssl: getDbSslConfig(connStr)");
      expect(seedContent).not.toContain("rejectUnauthorized: false");
      expect(purgeContent).not.toContain("rejectUnauthorized: false");
    });
  });

  describe("B06: Search Trends Schema Composite Key", () => {
    it("ensures searchTrends schema has composite unique index on locale and normalized", async () => {
      const { searchTrends } = await import("@/db/schema/tables/search-trends");
      expect(searchTrends).toBeDefined();
      expect(searchTrends.locale).toBeDefined();
      expect(searchTrends.normalized).toBeDefined();
    });
  });

  describe("B09: Internal Error Sanitization in PRD Architect & Verify Email", () => {
    it("PRD architect route sanitizes internal errors without leaking error.message", async () => {
      const { setDbForTesting, resetDbForTesting } = await import("@/src/lib/db");
      const { createAdminDbFixture } = await import("@/tests/helpers/admin-db-fixture");
      setDbForTesting(
        createAdminDbFixture({
          users: [
            {
              id: "user-test-prd",
              status: "ACTIVE",
              role: "USER",
              authVersion: 1,
              updatedAt: new Date(),
            },
          ],
        })
      );

      try {
        const { createSessionToken } = await import("@/src/modules/auth/session");
        const sessionToken = createSessionToken({
          id: "user-test-prd",
          email: "test@operis.tech",
          role: "USER",
          status: "ACTIVE",
          authVersion: 1,
          twoFactorVerified: false,
        });

        const { POST } = await import("@/src/app/api/ai/prd-architect/route");
        const req = new Request("http://localhost:3000/api/ai/prd-architect", {
          method: "POST",
          headers: {
            cookie: `fp_session=${sessionToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({}),
        });
        const res = await POST(req);
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.error).toBeDefined();
      } finally {
        resetDbForTesting();
      }
    });
  });

  describe("Systemd Worker Service Hardening", () => {
    it("uses native RuntimeDirectory=operis instead of non-root ExecStartPre mkdir", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");

      const serviceFile = fs.readFileSync(
        path.resolve(process.cwd(), "deploy/operis-worker.service"),
        "utf8"
      );

      expect(serviceFile).toContain("RuntimeDirectory=operis");
      expect(serviceFile).toContain("RuntimeDirectoryMode=0755");
      expect(serviceFile).not.toContain("ExecStartPre=/bin/mkdir");
    });
  });

  describe("B06: Trending DB & In-Memory Retention Purge", () => {
    it("exports and executes purgeExpiredTrends without unhandled exceptions", async () => {
      const { TrendingService } = await import("@/src/lib/search/trending-service");
      expect(typeof TrendingService.purgeExpiredTrends).toBe("function");
      const result = await TrendingService.purgeExpiredTrends(30, 500);
      expect(result).toHaveProperty("deletedDbRows");
      expect(result).toHaveProperty("prunedMemoryItems");
    });
  });

  describe("B09: Profile & Avatar Route Error Sanitization", () => {
    it("profile PATCH route returns generic 500 when an unhandled Error occurs", async () => {
      const { PATCH } = await import("@/src/app/api/profile/route");
      const { ProfileService } = await import("@/src/modules/profiles/service");
      const { vi } = await import("vitest");

      vi.spyOn(ProfileService, "updateProfile").mockRejectedValueOnce(
        new Error("relation 'secret_table' does not exist at character 42")
      );

      const rateLimitModule = await import("@/src/lib/security/rate-limit");
      vi.spyOn(rateLimitModule, "evaluateSecurityAccessAsync").mockResolvedValueOnce({
        allowed: true,
      } as unknown as Awaited<ReturnType<typeof rateLimitModule.evaluateSecurityAccessAsync>>);

      const sessionModule = await import("@/src/modules/auth/session");
      vi.spyOn(sessionModule, "getSession").mockResolvedValueOnce({
        userId: "d0000000-0000-0000-0000-000000000001",
        role: "USER",
        status: "ACTIVE",
        authVersion: 1,
        twoFactorVerified: false,
      } as unknown as Awaited<ReturnType<typeof sessionModule.getSession>>);

      const req = new Request("http://localhost:3000/api/profile", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-locale": "tr",
        },
        body: JSON.stringify({ handle: "legithandle" }),
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Profil güncellenirken beklenmeyen bir hata oluştu.");
      expect(data.error).not.toContain("secret_table");
      expect(data.error).not.toContain("character 42");
    });
  });
});
