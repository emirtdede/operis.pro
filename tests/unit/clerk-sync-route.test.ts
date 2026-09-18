import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { POST } from "@/src/app/api/auth/clerk-sync/route";
import { ClerkSyncService } from "@/src/modules/auth/clerk-sync-service";
import * as dbModule from "@/src/lib/db";
import { SESSION_COOKIE_NAME } from "@/src/modules/auth/session";

describe("Clerk Sync API Route (/api/auth/clerk-sync)", () => {
  const originalSecret = process.env.CLERK_SECRET_KEY;
  const originalPub = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.CLERK_SECRET_KEY = "sk_test_mock_secret_key";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_mock_pub_key";
  });

  afterAll(() => {
    process.env.CLERK_SECRET_KEY = originalSecret;
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalPub;
  });

  it("returns 503 when Clerk keys are missing", async () => {
    delete process.env.CLERK_SECRET_KEY;
    const req = new Request("https://operis.pro/api/auth/clerk-sync", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toContain("Clerk");
  });

  it("returns 401 when no active Clerk session is found", async () => {
    // Mock @clerk/nextjs/server auth to return empty
    vi.doMock("@clerk/nextjs/server", () => ({
      auth: vi.fn().mockResolvedValue({ userId: null }),
      currentUser: vi.fn().mockResolvedValue(null),
      clerkClient: vi.fn().mockResolvedValue({
        users: { getUser: vi.fn().mockResolvedValue(null) },
      }),
    }));

    const req = new Request("https://operis.pro/api/auth/clerk-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("successfully synchronizes active Clerk user and sets fp_session cookie", async () => {
    vi.spyOn(ClerkSyncService, "syncClerkUser").mockResolvedValue({
      userId: "user-sync-uuid-1",
      isNewUser: false,
      handle: "emirtdede",
      email: "emir@operis.pro",
      displayName: "Emir T. Dede",
    });

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: "user-sync-uuid-1",
                email: "emir@operis.pro",
                role: "client",
                status: "ACTIVE",
                authVersion: 1,
              },
            ]),
          }),
        }),
      }),
    };

    vi.spyOn(dbModule, "getDb").mockReturnValue(
      mockDb as unknown as ReturnType<typeof dbModule.getDb>
    );

    const req = new Request("https://operis.pro/api/auth/clerk-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerkUserId: "user_clerk_12345",
        email: "emir@operis.pro",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe("emir@operis.pro");
    expect(data.user.handle).toBe("emirtdede");

    // Verify session cookie was set
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain(SESSION_COOKIE_NAME);
  });
});
