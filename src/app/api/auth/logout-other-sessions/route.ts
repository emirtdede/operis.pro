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

    // Atomically bump authVersion to invalidate all previous sessions
    const newVersion = await bumpUserAuthVersion(session.userId);
    const updatedVersion = newVersion ?? ((session.authVersion ?? 1) + 1);

    // Revoke active Clerk sessions across other devices if Clerk is configured
    if (
      process.env.CLERK_SECRET_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ) {
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
          const { clerkClient } = await import("@clerk/nextjs/server");
          const client = await clerkClient();
          if (client?.sessions && typeof client.sessions.getSessionList === "function") {
            const sessionsResponse = await client.sessions.getSessionList({
              userId: dbUser.clerkUserId,
              status: "active",
            });
            const sessionsList: Array<{ id: string }> = Array.isArray(sessionsResponse)
              ? (sessionsResponse as unknown as Array<{ id: string }>)
              : ((sessionsResponse as unknown as { data?: Array<{ id: string }> })?.data || []);

            for (const s of sessionsList) {
              if (s?.id) {
                await client.sessions.revokeSession(s.id).catch(() => {});
              }
            }
          }
        }
      } catch (clerkErr) {
        console.warn("[Logout Other Sessions] Clerk session revocation warning:", clerkErr);
      }
    }

    // Reissue current device's cookie with the new authVersion
    const freshToken = createSessionToken({
      id: session.userId,
      email: session.email,
      role: session.role,
      status: "ACTIVE",
      authVersion: updatedVersion,
    });

    // Log the security event
    await SecurityAuditService.logEvent({
      userId: session.userId,
      eventType: "SESSIONS_TERMINATED",
      ipAddress: ip,
      userAgent: req.headers.get("user-agent"),
      riskMetadata: {
        newAuthVersion: updatedVersion,
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
    const message = err instanceof Error ? err.message : "Failed to logout other sessions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
