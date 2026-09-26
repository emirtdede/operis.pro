import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSessionToken, getVerifiedSession } from "@/src/modules/auth/session";
import * as dbModule from "@/src/lib/db";

describe("Session Verification Fail-Closed Security Suite", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
  });

  it("refuses privileged ADMIN session when database query fails (fail-closed)", async () => {
    // Generate valid cryptographically signed admin token
    const adminToken = createSessionToken({
      id: "usr_admin_victim",
      email: "admin@operis.pro",
      role: "ADMIN",
      status: "ACTIVE",
      authVersion: 1,
      twoFactorVerified: true,
    });

    // Mock DB throwing connection/query failure
    vi.spyOn(dbModule, "getDb").mockImplementation(() => {
      throw new Error("Supabase connection timeout / connection pool exhausted");
    });

    const result = await getVerifiedSession(adminToken);
    // Privileged role must fail-closed!
    expect(result).toBeNull();
  });

  it("refuses privileged SECURITY_ADMIN session when database query fails", async () => {
    const secAdminToken = createSessionToken({
      id: "usr_sec_admin",
      email: "security@operis.pro",
      role: "SECURITY_ADMIN",
      status: "ACTIVE",
      authVersion: 1,
      twoFactorVerified: true,
    });

    vi.spyOn(dbModule, "getDb").mockImplementation(() => {
      throw new Error("DB unreachable");
    });

    const result = await getVerifiedSession(secAdminToken);
    expect(result).toBeNull();
  });

  it("refuses privileged MODERATOR session when database query fails", async () => {
    const modToken = createSessionToken({
      id: "usr_mod",
      email: "mod@operis.pro",
      role: "MODERATOR",
      status: "ACTIVE",
      authVersion: 1,
    });

    vi.spyOn(dbModule, "getDb").mockImplementation(() => {
      throw new Error("DB unreachable");
    });

    const result = await getVerifiedSession(modToken);
    expect(result).toBeNull();
  });
});
