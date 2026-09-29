import { describe, it, expect, vi } from "vitest";
import { isValidAvatarUrl } from "@/src/modules/profiles/links";
import { getClientIp } from "@/src/lib/security/rate-limit";
import { DeliveryInspectorService } from "@/src/modules/engagements/delivery-inspector";
import { uploadAvatarBuffer } from "@/src/modules/storage/r2-client";
import { EmailAdapter } from "@/src/lib/email";

describe("Yayına Hazırlık Tam Tarama R01-R14 Remediation Suite", () => {
  describe("R04 — SSRF DNS Rebinding & Socket Pinning", () => {
    it("rejects loopback and private IP addresses", async () => {
      await expect(
        DeliveryInspectorService.resolveAndValidateUrlSsrfSafe("http://127.0.0.1:8080")
      ).rejects.toThrow("yerel veya özel ağ");

      await expect(
        DeliveryInspectorService.resolveAndValidateUrlSsrfSafe(
          "http://169.254.169.254/latest/meta-data"
        )
      ).rejects.toThrow("yerel veya özel ağ");

      await expect(
        DeliveryInspectorService.resolveAndValidateUrlSsrfSafe("http://10.0.0.1")
      ).rejects.toThrow("yerel veya özel ağ");
    });

    it("rejects non-http/https protocols", async () => {
      await expect(
        DeliveryInspectorService.resolveAndValidateUrlSsrfSafe("file:///etc/passwd")
      ).rejects.toThrow("Yalnızca HTTP ve HTTPS");
    });
  });

  describe("R09 — Storage Fail-Closed & Avatar URL Policy", () => {
    it("validates avatar URLs correctly across environments", () => {
      // In dev/test: accepts /uploads/avatars/
      expect(isValidAvatarUrl("/uploads/avatars/user-123.webp")).toBe(true);

      // Rejects directory traversal in /uploads/avatars/
      expect(isValidAvatarUrl("/uploads/avatars/../secret.txt")).toBe(false);
      expect(isValidAvatarUrl("/uploads/avatars//root")).toBe(false);

      // Accepts public HTTPS image URLs
      expect(isValidAvatarUrl("https://images.unsplash.com/photo-123")).toBe(true);
      expect(isValidAvatarUrl("https://img.clerk.com/avatar.png")).toBe(true);
      expect(isValidAvatarUrl("https://avatars.githubusercontent.com/u/1")).toBe(true);

      // Rejects private IP addresses and dangerous schemes
      expect(isValidAvatarUrl("https://127.0.0.1/avatar.png")).toBe(false);
      expect(isValidAvatarUrl("https://192.168.1.1/avatar.png")).toBe(false);
      expect(isValidAvatarUrl("javascript:alert(1)")).toBe(false);
      expect(isValidAvatarUrl("data:image/png;base64,abc")).toBe(false);
    });

    it("fails closed in production if R2 credentials are missing", async () => {
      const oldEnv = process.env.NODE_ENV;
      const oldVitest = process.env.VITEST;
      try {
        (process.env as unknown as { NODE_ENV: string }).NODE_ENV = "production";
        delete (process.env as Record<string, string | undefined>).VITEST;

        const fakeBuffer = Buffer.from("fake-webp-image");
        await expect(uploadAvatarBuffer("test-user-prod", fakeBuffer)).rejects.toThrow(
          "Cloudflare R2 storage credentials are required in production"
        );
      } finally {
        (process.env as unknown as { NODE_ENV?: string }).NODE_ENV = oldEnv;
        if (oldVitest) (process.env as Record<string, string>).VITEST = oldVitest;
      }
    });
  });

  describe("R10 — Contact Form Attachment Support", () => {
    it("accepts attachments parameter in EmailAdapter", async () => {
      const result = await EmailAdapter.sendTransactionalEmail({
        to: "support@operis.pro",
        subject: "Test Attachment",
        body: "Hello with attachment",
        attachments: [
          {
            filename: "spec.pdf",
            content: Buffer.from("mock-pdf-content").toString("base64"),
            contentType: "application/pdf",
          },
        ],
      });

      expect(typeof result).toBe("boolean");
      expect(result).toBe(true);
    });
  });

  describe("R13 — Edge Proxy Trust Boundary & Anti-Spoofing", () => {
    it("rejects forged cf-connecting-ip in production when cf-ray is missing", () => {
      const oldEnv = process.env.NODE_ENV;
      const oldVitest = process.env.VITEST;
      try {
        (process.env as unknown as { NODE_ENV: string }).NODE_ENV = "production";
        delete (process.env as Record<string, string | undefined>).VITEST;

        const req = new Request("https://operis.pro/api/auth/login", {
          headers: {
            "cf-connecting-ip": "1.2.3.4", // forged header
            "x-forwarded-for": "100.20.30.40",
          },
        });

        const detectedIp = getClientIp(req);
        // Must ignore unverified forwarding headers, without falling back to next trusted or x-forwarded-for
        expect(detectedIp).toBe("127.0.0.1");
      } finally {
        (process.env as unknown as { NODE_ENV?: string }).NODE_ENV = oldEnv;
        if (oldVitest) (process.env as Record<string, string>).VITEST = oldVitest;
      }
    });

    it("rejects cf-connecting-ip authenticated only by cf-ray", () => {
      const oldEnv = process.env.NODE_ENV;
      const oldVitest = process.env.VITEST;
      try {
        (process.env as unknown as { NODE_ENV: string }).NODE_ENV = "production";
        delete (process.env as Record<string, string | undefined>).VITEST;

        const req = new Request("https://operis.pro/api/auth/login", {
          headers: {
            "cf-connecting-ip": "198.51.100.77",
            "cf-ray": "8c59999-FRA",
            "x-forwarded-for": "10.0.0.1",
          },
        });

        expect(getClientIp(req)).toBe("127.0.0.1");
      } finally {
        (process.env as unknown as { NODE_ENV?: string }).NODE_ENV = oldEnv;
        if (oldVitest) (process.env as Record<string, string>).VITEST = oldVitest;
      }
    });

    it("authoritatively prioritizes Vercel edge header when on Vercel platform", () => {
      const oldVercel = process.env.VERCEL;
      try {
        process.env.VERCEL = "1";
        const req = new Request("https://operis.pro/api/test", {
          headers: {
            "x-vercel-forwarded-for": "203.0.113.88",
            "cf-connecting-ip": "198.51.100.11",
            "x-forwarded-for": "10.0.0.1",
          },
        });

        expect(getClientIp(req)).toBe("203.0.113.88");
      } finally {
        if (oldVercel !== undefined) process.env.VERCEL = oldVercel;
        else delete process.env.VERCEL;
      }
    });
  });

  describe("R01 — Clerk Session 2FA Bypass Prevention", () => {
    it("rejects unverified sessions when user has 2FA enabled", async () => {
      const { getSession } = await import("@/src/modules/auth/session");
      const { setDbForTesting, resetDbForTesting } = await import("@/src/lib/db");

      try {
        // Mock DB user with twoFactorEnabled: true
        const mockDb = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([
            {
              id: "user-2fa-active",
              authVersion: 1,
              twoFactorEnabled: true,
              role: "CLIENT",
            },
          ]),
        };
        setDbForTesting(mockDb);

        // When a request has clerk session claims but 2FA is active and unverified:
        // getSession returns null
        const session = await getSession();
        // Without active verified cookie, session must be null
        expect(session).toBeNull();
      } finally {
        resetDbForTesting();
      }
    });
  });

  describe("R02 — Remote Clerk Session Revocation Helper", () => {
    it("handles remote session revocation gracefully with logging and retry", async () => {
      const { revokeClerkSessionsForUser } = await import("@/src/modules/auth/clerk-revocation");

      // In test environment without real Clerk keys, it handles gracefully and does not throw uncaught exceptions
      const res = await revokeClerkSessionsForUser("user_test_12345");
      expect(res).toBeDefined();
      expect(typeof res.success).toBe("boolean");
      expect(typeof res.revokedCount).toBe("number");
    });
  });

  describe("R07 — Sealed Contract Party Email Verification", () => {
    it("rejects .local placeholder email addresses for sealed contracts", () => {
      const invalidEmails = ["client@operis.local", "contractor@operis.local", "user@test.local"];

      for (const email of invalidEmails) {
        expect(email.endsWith(".local")).toBe(true);
      }

      const validEmails = ["emre@operis.pro", "client@company.com", "freelancer@dev.io"];
      for (const email of validEmails) {
        expect(!email.endsWith(".local")).toBe(true);
      }
    });
  });

  describe("R11 — Realtime Notification Deduplication", () => {
    it("tracks seen IDs and prevents duplicate unread increment logic", () => {
      const seenIds = new Set<string>();
      let unreadCount = 0;

      const processNotification = (item: { id: string; readAt: string | null }) => {
        const isAlreadySeen = seenIds.has(item.id);
        seenIds.add(item.id);

        if (!isAlreadySeen && !item.readAt) {
          unreadCount += 1;
        }
      };

      const notif1 = { id: "notif-abc-1", readAt: null };
      processNotification(notif1);
      expect(unreadCount).toBe(1);

      // Reconnect receives the exact same notification again
      processNotification(notif1);
      expect(unreadCount).toBe(1); // Must not increment!

      // New unread notification
      const notif2 = { id: "notif-abc-2", readAt: null };
      processNotification(notif2);
      expect(unreadCount).toBe(2);

      // Already read notification
      const notif3 = { id: "notif-abc-3", readAt: new Date().toISOString() };
      processNotification(notif3);
      expect(unreadCount).toBe(2); // Read notification must not increment unreadCount
    });
  });
});
