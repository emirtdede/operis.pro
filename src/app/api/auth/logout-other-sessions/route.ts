import { NextResponse } from "next/server";
import {
  getSession,
  bumpUserAuthVersion,
  createSessionToken,
  SESSION_COOKIE_NAME,
} from "@/src/modules/auth/session";
import { SecurityAuditService } from "@/src/modules/security/audit-service";
import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";

export async function POST(req: Request) {
  const headerLocale = req.headers.get("x-locale");
  const isEn = headerLocale === "en";
  const ip = getClientIp(req);

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const access = await evaluateSecurityAccessAsync({
      ip,
      purpose: "auth:logout-other-sessions",
      subject: session.userId,
      limit: 10,
      windowMs: 15 * 60 * 1000,
      isEn,
    });
    if (!access.allowed) {
      return access.response;
    }

    // Atomically bump authVersion in DB to invalidate all existing sessions
    const newVersion = await bumpUserAuthVersion(session.userId);
    if (!newVersion) {
      console.error(
        "[Logout Other Sessions] Database authVersion bump failed for user:",
        session.userId
      );
      return NextResponse.json(
        {
          error: isEn
            ? "Failed to terminate other sessions. Database update could not be completed."
            : "Diğer oturumlar sonlandırılamadı. Veritabanı güncellemesi tamamlanamadı.",
        },
        { status: 500 }
      );
    }

    // Revoke active Clerk sessions across other devices if Clerk is configured
    if (process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      let clerkRevocationError = false;
      const failedRevocations: string[] = [];

      try {
        const { getDb, schema } = await import("@/src/lib/db");
        const { eq } = await import("drizzle-orm");
        const db = getDb();
        const [dbUser] = await db
          .select({ clerkUserId: schema.users.clerkUserId })
          .from(schema.users)
          .where(eq(schema.users.id, session.userId))
          .limit(1);

        if (dbUser?.clerkUserId) {
          const { clerkClient, auth } = await import("@clerk/nextjs/server");
          let currentClerkSessionId: string | null = null;
          try {
            const currentClerkAuth = await auth();
            currentClerkSessionId = currentClerkAuth?.sessionId || null;
          } catch {
            // Ignore failure to detect current Clerk session
          }

          const client = await clerkClient();
          if (client?.sessions && typeof client.sessions.getSessionList === "function") {
            const sessionIdsToRevoke = new Set<string>();
            let offset = 0;
            const limit = 100;
            let hasMore = true;

            // Phase 1: Collect all active session IDs across pages without mutating during collection
            while (hasMore) {
              const sessionsResponse = await client.sessions.getSessionList({
                userId: dbUser.clerkUserId,
                status: "active",
                limit,
                offset,
              });
              const sessionsList: Array<{ id: string }> = Array.isArray(sessionsResponse)
                ? (sessionsResponse as unknown as Array<{ id: string }>)
                : (sessionsResponse as unknown as { data?: Array<{ id: string }> })?.data || [];

              if (sessionsList.length === 0) {
                hasMore = false;
                break;
              }

              for (const s of sessionsList) {
                if (s?.id) {
                  sessionIdsToRevoke.add(s.id);
                }
              }

              if (sessionsList.length < limit) {
                hasMore = false;
              } else {
                offset += limit;
              }
            }

            // Phase 2: Revoke other sessions with exponential backoff retries
            for (const sId of sessionIdsToRevoke) {
              // Preserve current device's Clerk session if active
              if (currentClerkSessionId && sId === currentClerkSessionId) {
                continue;
              }

              let revoked = false;
              let attempts = 0;
              while (!revoked && attempts < 3) {
                attempts++;
                try {
                  await client.sessions.revokeSession(sId);
                  revoked = true;
                } catch (e) {
                  if (attempts >= 3) {
                    console.error(
                      `[Logout Other Sessions] Error: Failed to revoke Clerk session ${sId} after 3 attempts:`,
                      e
                    );
                    failedRevocations.push(sId);
                  } else {
                    await new Promise((resolve) => setTimeout(resolve, 100 * attempts));
                  }
                }
              }
            }
          }
        }
      } catch (clerkErr) {
        console.error("[Logout Other Sessions] Clerk session revocation error:", clerkErr);
        clerkRevocationError = true;
      }

      if (clerkRevocationError || failedRevocations.length > 0) {
        return NextResponse.json(
          {
            error: isEn
              ? "Failed to fully terminate other Clerk sessions. Please try again."
              : "Diğer Clerk oturumlarının tamamı sonlandırılamadı. Lütfen tekrar deneyin.",
            code: "REMOTE_SESSION_REVOCATION_FAILED",
          },
          { status: 502 }
        );
      }
    }

    // Reissue current device's cookie with the verified new authVersion
    const freshToken = createSessionToken({
      id: session.userId,
      email: session.email,
      role: session.role,
      status: "ACTIVE",
      authVersion: newVersion,
      twoFactorVerified: session.twoFactorVerified,
    });

    // Log the security event
    await SecurityAuditService.logEvent({
      userId: session.userId,
      eventType: "SESSIONS_TERMINATED",
      ipAddress: ip,
      userAgent: req.headers.get("user-agent"),
      riskMetadata: {
        newAuthVersion: newVersion,
        action: "logout_other_devices",
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        message: isEn
          ? "All other sessions on other devices have been terminated."
          : "Bu cihaz haricindeki diğer tüm aktif oturumlar başarıyla kapatıldı.",
      },
      { status: 200 }
    );

    response.cookies.set(SESSION_COOKIE_NAME, freshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: unknown) {
    console.error("[Logout Other Sessions] Unexpected error:", err);
    return NextResponse.json(
      {
        error: isEn
          ? "An unexpected error occurred while terminating sessions."
          : "Oturumlar kapatılırken beklenmeyen bir hata oluştu.",
      },
      { status: 500 }
    );
  }
}
