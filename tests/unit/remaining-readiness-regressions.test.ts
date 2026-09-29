import { afterEach, expect, it, vi } from "vitest";
import { getClientIp } from "@/src/lib/security/rate-limit";
import { isClerkSessionRevokedOrObsolete } from "@/src/modules/auth/clerk-revocation";

const getSession = vi.hoisted(() => vi.fn());
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({ sessions: { getSession } }),
}));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

it("R02 rejects an old session with a refreshed token when provider lookup fails in a fresh worker", async () => {
  getSession.mockRejectedValue(new Error("provider unavailable"));
  const input = {
    userId: "fresh-worker-user",
    clerkUserId: "clerk-user",
    clerkSessionId: "old-session",
    currentAuthVersion: 2,
    userUpdatedAt: new Date(Date.now() - 10000),
    tokenIatSec: Math.floor(Date.now() / 1000),
  };
  // Rejection or an explicit revoked result are both fail-closed.
  const result = await isClerkSessionRevokedOrObsolete(input).catch(() => true);
  expect(getSession).toHaveBeenCalledWith("old-session");
  expect(result).toBe(true);
});

it.each([
  { userId: "another-owner", status: "active", createdAt: Date.now() },
  { userId: "clerk-user", status: "revoked", createdAt: Date.now() },
  { userId: "clerk-user", status: "active", createdAt: undefined },
  { userId: "clerk-user", status: "active", createdAt: "invalid" },
])("R02 validates initial-version Clerk session metadata: %j", async (remoteSession) => {
  getSession.mockResolvedValue(remoteSession);
  expect(
    await isClerkSessionRevokedOrObsolete({
      userId: "local-user",
      clerkUserId: "clerk-user",
      clerkSessionId: "remote-session",
      currentAuthVersion: 1,
    })
  ).toBe(true);
  expect(getSession).toHaveBeenCalledWith("remote-session");
});

it("R02 requires a session ID even before the first security change", async () => {
  expect(
    await isClerkSessionRevokedOrObsolete({
      userId: "local-user",
      clerkUserId: "clerk-user",
      currentAuthVersion: 1,
    })
  ).toBe(true);
});

it("R02 permits verified active initial sessions without a security cutoff", async () => {
  getSession.mockResolvedValue({ userId: "clerk-user", status: "active", createdAt: Date.now() });
  expect(
    await isClerkSessionRevokedOrObsolete({
      userId: "local-user",
      clerkUserId: "clerk-user",
      clerkSessionId: "remote-session",
      currentAuthVersion: 1,
    })
  ).toBe(false);
});

it("R02 rejects an initial session during a real provider lookup failure", async () => {
  getSession.mockRejectedValue(new Error("provider unavailable"));
  await expect(
    isClerkSessionRevokedOrObsolete({
      userId: "local-user",
      clerkUserId: "clerk-user",
      clerkSessionId: "remote-session",
      currentAuthVersion: 1,
    })
  ).rejects.toThrow("CLERK_VERIFICATION_UNAVAILABLE");
  expect(getSession).toHaveBeenCalledWith("remote-session");
});

it("R13 ignores forged proxy headers without an authoritative provider", () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", undefined);
  vi.stubEnv("TRUSTED_PROXY_PROVIDER", undefined);
  vi.stubEnv("CLOUDFLARE_PROXY_SECRET", undefined);
  vi.stubEnv("VITEST", undefined);
  expect(
    getClientIp(
      new Request("https://operis.test", {
        headers: {
          "cf-ray": "forged",
          "cf-connecting-ip": "198.51.100.1",
          "x-real-ip": "198.51.100.2",
          "x-forwarded-for": "198.51.100.3",
        },
      })
    )
  ).toBe("127.0.0.1");
});
