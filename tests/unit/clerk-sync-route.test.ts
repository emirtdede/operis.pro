import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from "vitest";
import { POST } from "@/src/app/api/auth/clerk-sync/route";
import { ClerkSyncService } from "@/src/modules/auth/clerk-sync-service";
import * as dbModule from "@/src/lib/db";
import { SESSION_COOKIE_NAME, getVerifiedSession } from "@/src/modules/auth/session";

const mockAuth = vi.fn();
const mockCurrentUser = vi.fn();
const mockGetUser = vi.fn();
const mockRemoteSession = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
  currentUser: () => mockCurrentUser(),
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      getUser: (id: string) => mockGetUser(id),
    },
    sessions: { getSession: (id: string) => mockRemoteSession(id) },
  }),
}));

describe("Clerk Sync API Route (/api/auth/clerk-sync)", () => {
  const originalSecret = process.env.CLERK_SECRET_KEY;
  const originalPub = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLERK_SECRET_KEY = "sk_test_mock_secret_key";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_mock_pub_key";
    mockRemoteSession.mockImplementation(async (id: string) => ({
      id,
      userId: (await mockAuth()).userId,
      status: "active",
      createdAt: Date.now(),
    }));
  });

  afterAll(() => {
    process.env.CLERK_SECRET_KEY = originalSecret;
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalPub;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  function mockActiveUser(authVersion = 1, sessionsInvalidBefore: Date | null = null) {
    mockAuth.mockResolvedValue({ userId: "clerk-active", sessionId: "session-active" });
    mockCurrentUser.mockResolvedValue({
      id: "clerk-active",
      primaryEmailAddressId: "email-active",
      emailAddresses: [
        {
          id: "email-active",
          emailAddress: "user@example.test",
          verification: { status: "verified" },
        },
      ],
    });
    const sync = vi.spyOn(ClerkSyncService, "syncClerkUser").mockResolvedValue({
      userId: "local-active",
      isNewUser: false,
      handle: "user",
      email: "user@example.test",
      displayName: "User",
    });
    const dbUser = {
      id: "local-active",
      email: "user@example.test",
      role: "USER",
      status: "ACTIVE",
      authVersion,
      sessionsInvalidBefore,
      twoFactorEnabled: false,
    };
    const db = {
      select: vi.fn(() => ({
        from: (table: unknown) => ({
          where: () => ({ limit: async () => (table === dbModule.schema.users ? [dbUser] : []) }),
        }),
      })),
    };
    vi.spyOn(dbModule, "getDb").mockReturnValue(db as unknown as ReturnType<typeof dbModule.getDb>);
    return sync;
  }

  it("records explicit legal consent from the same request body used for TOTP", async () => {
    const sync = mockActiveUser();
    const legalConsent = { accepted: true, locale: "tr", documentVersions: { terms: "v2" } };
    const response = await POST(
      new Request("https://operis.test/api/auth/clerk-sync", {
        method: "POST",
        body: JSON.stringify({ legalConsent }),
      })
    );
    expect(response.status).toBe(200);
    expect(sync).toHaveBeenCalledWith(expect.objectContaining({ legalConsent }));
  });

  it.each(["provider-error", "missing-date", "obsolete"])(
    "refuses %s through the real sync handler before profile writes",
    async (failure) => {
      const cutoff = new Date();
      const sync = mockActiveUser(2, cutoff);
      if (failure === "provider-error")
        mockRemoteSession.mockRejectedValue(new Error("provider 500"));
      else
        mockRemoteSession.mockResolvedValue({
          id: "session-active",
          userId: "clerk-active",
          status: "active",
          createdAt: failure === "obsolete" ? cutoff.getTime() : undefined,
        });
      const response = await POST(
        new Request("https://operis.test/api/auth/clerk-sync", { method: "POST" })
      );
      expect(response.status).toBe(failure === "provider-error" ? 503 : 401);
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(mockRemoteSession).toHaveBeenCalledWith("session-active");
      expect(sync).not.toHaveBeenCalled();
    }
  );

  it("returns 503 for a provider timeout without issuing a local cookie", async () => {
    vi.useFakeTimers();
    const sync = mockActiveUser(2, new Date());
    mockRemoteSession.mockImplementation(() => new Promise(() => {}));
    const responsePromise = POST(
      new Request("https://operis.test/api/auth/clerk-sync", { method: "POST" })
    );
    await vi.waitFor(() => expect(mockRemoteSession).toHaveBeenCalledWith("session-active"));
    await vi.advanceTimersByTimeAsync(5001);
    const response = await responsePromise;
    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(mockRemoteSession).toHaveBeenCalledWith("session-active");
    expect(sync).not.toHaveBeenCalled();
  });

  it("returns no fallback session when the provider request times out", async () => {
    vi.useFakeTimers();
    vi.stubEnv("VITEST", undefined);
    mockActiveUser(2, new Date());
    mockRemoteSession.mockImplementation(() => new Promise(() => {}));
    const sessionPromise = getVerifiedSession();
    await vi.waitFor(() => expect(mockRemoteSession).toHaveBeenCalledWith("session-active"));
    await vi.advanceTimersByTimeAsync(5001);
    expect(await sessionPromise).toBeNull();
  });

  it.each(["provider-error", "missing-date", "obsolete"])(
    "refuses %s through the real cookie-free fallback",
    async (failure) => {
      vi.stubEnv("VITEST", undefined);
      const cutoff = new Date();
      mockActiveUser(2, cutoff);
      if (failure === "provider-error")
        mockRemoteSession.mockRejectedValue(new Error("provider 500"));
      else
        mockRemoteSession.mockResolvedValue({
          id: "session-active",
          userId: "clerk-active",
          status: "active",
          createdAt: failure === "obsolete" ? cutoff.getTime() : undefined,
        });
      expect(await getVerifiedSession()).toBeNull();
      expect(mockRemoteSession).toHaveBeenCalledWith("session-active");
    }
  );

  it("allows a new post-cutoff session through the cookie-free fallback", async () => {
    vi.stubEnv("VITEST", undefined);
    mockActiveUser(2, new Date(Date.now() - 60000));
    const session = await getVerifiedSession();
    expect(session).toEqual(expect.objectContaining({ userId: "local-active", authVersion: 2 }));
    expect(mockRemoteSession).toHaveBeenCalledWith("session-active");
  });

  it("returns 503 when Clerk keys are missing", async () => {
    delete process.env.CLERK_SECRET_KEY;
    const req = new Request("https://operis.pro/api/auth/clerk-sync", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toContain("Clerk");
  });

  it("returns 401 when no active Clerk session is found (reproducing & blocking body spoofing)", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    mockCurrentUser.mockResolvedValue(null);
    mockGetUser.mockResolvedValue(null);

    // Attacker sends forged clerkUserId and email in the body with no active Clerk session
    const req = new Request("https://operis.pro/api/auth/clerk-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerkUserId: "attacker_spoofed_clerk_id",
        email: "victim_admin@operis.pro",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBeDefined();

    // Verify session cookie was NOT set
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("returns 400 when active Clerk session has no email address", async () => {
    mockAuth.mockResolvedValue({ userId: "user_clerk_no_email" });
    mockCurrentUser.mockResolvedValue({
      id: "user_clerk_no_email",
      emailAddresses: [],
    });

    const req = new Request("https://operis.pro/api/auth/clerk-sync", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("returns 403 when Clerk email is not verified", async () => {
    mockAuth.mockResolvedValue({ userId: "user_clerk_unverified" });
    mockCurrentUser.mockResolvedValue({
      id: "user_clerk_unverified",
      primaryEmailAddressId: "email_1",
      emailAddresses: [
        {
          id: "email_1",
          emailAddress: "unverified@domain.com",
          verification: { status: "unverified" },
        },
      ],
    });

    const req = new Request("https://operis.pro/api/auth/clerk-sync", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("doğrulanmamış");
  });

  it("returns 403 when user exists in DB but is not ACTIVE", async () => {
    mockAuth.mockResolvedValue({ userId: "user_clerk_suspended", sessionId: "session_suspended" });
    mockCurrentUser.mockResolvedValue({
      id: "user_clerk_suspended",
      primaryEmailAddressId: "email_1",
      emailAddresses: [
        {
          id: "email_1",
          emailAddress: "suspended@operis.pro",
          verification: { status: "verified" },
        },
      ],
    });

    vi.spyOn(ClerkSyncService, "syncClerkUser").mockResolvedValue({
      userId: "uuid-suspended",
      isNewUser: false,
      handle: "suspended_user",
      email: "suspended@operis.pro",
      displayName: "Suspended User",
    });

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: "uuid-suspended",
                email: "suspended@operis.pro",
                role: "USER",
                status: "SUSPENDED",
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
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("aktif durumda değil");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("successfully synchronizes active Clerk user with verified email and sets fp_session cookie", async () => {
    mockAuth.mockResolvedValue({ userId: "user_clerk_12345", sessionId: "session_12345" });
    mockCurrentUser.mockResolvedValue({
      id: "user_clerk_12345",
      primaryEmailAddressId: "email_verified_1",
      emailAddresses: [
        {
          id: "email_verified_1",
          emailAddress: "emir@operis.pro",
          verification: { status: "verified" },
        },
      ],
      firstName: "Emir",
      lastName: "Dede",
      imageUrl: "https://clerk.dev/avatar.png",
    });

    const syncSpy = vi.spyOn(ClerkSyncService, "syncClerkUser").mockResolvedValue({
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
                role: "USER",
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
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe("emir@operis.pro");
    expect(data.user.handle).toBe("emirtdede");

    // Verify ClerkSyncService was called with server-verified credentials
    expect(syncSpy).toHaveBeenCalledWith({
      clerkUserId: "user_clerk_12345",
      email: "emir@operis.pro",
      firstName: "Emir",
      lastName: "Dede",
      avatarUrl: "https://clerk.dev/avatar.png",
      emailVerified: true,
    });

    // Verify session cookie was set
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain(SESSION_COOKIE_NAME);
  });

  it("adversarial: body.clerkUserId and body.email are completely ignored even if supplied by attacker", async () => {
    mockAuth.mockResolvedValue({
      userId: "attacker_legit_clerk_id",
      sessionId: "session_attacker",
    });
    mockCurrentUser.mockResolvedValue({
      id: "attacker_legit_clerk_id",
      primaryEmailAddressId: "email_attacker",
      emailAddresses: [
        {
          id: "email_attacker",
          emailAddress: "attacker@domain.com",
          verification: { status: "verified" },
        },
      ],
      firstName: "Attacker",
      lastName: "User",
      imageUrl: null,
    });

    const syncSpy = vi.spyOn(ClerkSyncService, "syncClerkUser").mockResolvedValue({
      userId: "attacker-uuid",
      isNewUser: false,
      handle: "attacker",
      email: "attacker@domain.com",
      displayName: "Attacker User",
    });

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: "attacker-uuid",
                email: "attacker@domain.com",
                role: "USER",
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

    // Attacker is logged in as attacker@domain.com, but attempts to spoof victim admin in request body
    const req = new Request("https://operis.pro/api/auth/clerk-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerkUserId: "forged_victim_clerk_id",
        email: "victim_admin@operis.pro",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // The synced user MUST be the attacker's server identity, NOT the victim's
    expect(syncSpy).toHaveBeenCalledWith({
      clerkUserId: "attacker_legit_clerk_id",
      email: "attacker@domain.com",
      firstName: "Attacker",
      lastName: "User",
      avatarUrl: null,
      emailVerified: true,
    });

    const data = await res.json();
    expect(data.user.email).toBe("attacker@domain.com");
  });
});
