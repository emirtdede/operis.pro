import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/src/app/api/auth/logout-other-sessions/route";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  bump: vi.fn(),
  createToken: vi.fn(),
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));
vi.mock("@/src/modules/auth/session", () => ({
  getSession: mocks.getSession,
  bumpUserAuthVersion: mocks.bump,
  createSessionToken: mocks.createToken,
  SESSION_COOKIE_NAME: "fp_session",
}));
vi.mock("@/src/lib/security/rate-limit", () => ({
  getClientIp: () => "127.0.0.1",
  evaluateSecurityAccessAsync: async () => ({ allowed: true }),
}));
vi.mock("@/src/modules/security/audit-service", () => ({
  SecurityAuditService: { logEvent: async () => {} },
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth, clerkClient: mocks.clerkClient }));

describe("durable logout of other devices", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("CLERK_SECRET_KEY", "test-clerk");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "test-clerk-public");
    mocks.getSession.mockResolvedValue({
      userId: "user-1",
      email: "user@example.test",
      role: "USER",
      authVersion: 1,
      twoFactorVerified: true,
    });
    mocks.auth.mockResolvedValue({ userId: "clerk-1", sessionId: "current-session" });
    mocks.bump.mockResolvedValue(2);
    mocks.createToken.mockReturnValue("new-signed-token");
    mocks.clerkClient.mockRejectedValue(new Error("provider offline"));
  });
  afterEach(() => vi.unstubAllEnvs());

  it("preserves the current cookie while remote cleanup is handled by the durable worker", async () => {
    const response = await POST(
      new Request("https://operis.test/api/auth/logout-other-sessions", { method: "POST" })
    );
    expect(response.status).toBe(200);
    expect(mocks.bump).toHaveBeenCalledWith("user-1", undefined, {
      clerkUserId: "clerk-1",
      sessionId: "current-session",
    });
    expect(mocks.clerkClient).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toContain("fp_session=new-signed-token");
    expect(mocks.createToken).toHaveBeenCalledWith(
      expect.objectContaining({ authVersion: 2, twoFactorVerified: true })
    );
  });

  it("does not issue a replacement cookie when the atomic security change fails", async () => {
    mocks.bump.mockResolvedValue(null);
    const response = await POST(
      new Request("https://operis.test/api/auth/logout-other-sessions", { method: "POST" })
    );
    expect(response.status).toBe(500);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(mocks.createToken).not.toHaveBeenCalled();
  });
});
