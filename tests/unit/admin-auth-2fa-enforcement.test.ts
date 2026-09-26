import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/src/app/api/admin/auth/session/route";
import * as dbModule from "@/src/lib/db";
import * as rateLimitModule from "@/src/lib/security/rate-limit";

describe("Admin Session 2FA Enforcement Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_MASTER_KEY = "test-master-pin-123456";
    vi.spyOn(rateLimitModule, "evaluateSecurityAccessAsync").mockResolvedValue({
      allowed: true,
      remaining: 5,
      reset: Date.now() + 60000,
    });
  });

  it("blocks privileged ADMIN without 2FA enabled with 403 Forbidden", async () => {
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: "usr_admin_1",
              role: "ADMIN",
              status: "ACTIVE",
              twoFactorEnabled: false,
              twoFactorSecret: null,
              authVersion: 1,
            },
          ]),
        }),
      }),
    });

    vi.spyOn(dbModule, "getDb").mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<typeof dbModule.getDb>);

    const req = new NextRequest("https://operis.pro/api/admin/auth/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        adminKey: "test-master-pin-123456",
        email: "admin@operis.pro",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.requires2FASetup).toBe(true);
    expect(data.error).toContain("iki aşamalı doğrulama (2FA) zorunludur");
  });

  it("demands 2FA TOTP code with 401 when admin has 2FA enabled but code is omitted", async () => {
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: "usr_admin_2",
              role: "ADMIN",
              status: "ACTIVE",
              twoFactorEnabled: true,
              twoFactorSecret: "encrypted_secret_stub",
              authVersion: 1,
            },
          ]),
        }),
      }),
    });

    vi.spyOn(dbModule, "getDb").mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<typeof dbModule.getDb>);

    const req = new NextRequest("https://operis.pro/api/admin/auth/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        adminKey: "test-master-pin-123456",
        email: "admin@operis.pro",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.requires2FA).toBe(true);
    expect(data.error).toContain("TOTP");
  });

  it("blocks requireAdminSession when admin session lacks twoFactorVerified claim", async () => {
    const { requireAdminSession } = await import("@/src/modules/admin/auth-guard");
    const sessionModule = await import("@/src/modules/auth/session");

    vi.spyOn(sessionModule, "getSession").mockResolvedValue({
      type: "SESSION",
      userId: "usr_admin_unverified",
      email: "admin@operis.pro",
      role: "ADMIN",
      status: "ACTIVE",
      authVersion: 1,
      twoFactorVerified: false,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10000,
    });

    await expect(requireAdminSession()).rejects.toThrow("Two-factor authentication (2FA) verification is required");
  });

  it("permits requireAdminSession when admin session has twoFactorVerified: true", async () => {
    const { requireAdminSession } = await import("@/src/modules/admin/auth-guard");
    const sessionModule = await import("@/src/modules/auth/session");

    vi.spyOn(sessionModule, "getSession").mockResolvedValue({
      type: "SESSION",
      userId: "usr_admin_verified",
      email: "admin@operis.pro",
      role: "ADMIN",
      status: "ACTIVE",
      authVersion: 1,
      twoFactorVerified: true,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10000,
    });

    const session = await requireAdminSession();
    expect(session.userId).toBe("usr_admin_verified");
    expect(session.twoFactorVerified).toBe(true);
  });
});

