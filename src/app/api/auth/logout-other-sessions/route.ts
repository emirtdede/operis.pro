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
    let preserve: { sessionId: string; clerkUserId: string } | undefined;
    if (process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      const { auth } = await import("@clerk/nextjs/server");
      const current = await auth();
      if (current.sessionId && current.userId)
        preserve = { sessionId: current.sessionId, clerkUserId: current.userId };
    }
    const newVersion = await bumpUserAuthVersion(session.userId, undefined, preserve);
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

    // The auth-version transaction also queues remote revocation. Local access is already
    // denied to other devices; the worker retries provider failures without logging this device out.

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
