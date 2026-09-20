import { NextResponse } from "next/server";
import { AuthService } from "@/src/modules/auth/service";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/src/modules/auth/session";
import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";
import { SecurityAuditService } from "@/src/modules/security/audit-service";
import { verifyTurnstileToken } from "@/src/lib/security/turnstile";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || null;
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "auth:login",
    limit: 10,
    windowMs: 60 * 1000,
    isEn,
  });

  if (!access.allowed) {
    SecurityAuditService.logEvent({
      eventType: "SUSPICIOUS_ACTIVITY",
      ipAddress: ip,
      userAgent,
      riskMetadata: { reason: access.reason },
    }).catch(() => {});

    return access.response;
  }

  let requestEmail = "";
  try {
    const body = await req.json();
    requestEmail = (body?.email || "").toLowerCase().trim();

    // Verify Cloudflare Turnstile token (fail-open in dev/testing)
    const turnstileResult = await verifyTurnstileToken(body?.turnstileToken, ip);
    if (!turnstileResult.success) {
      return NextResponse.json(
        {
          error:
            turnstileResult.error ||
            (isEn
              ? "Bot verification failed. Please refresh."
              : "Bot doğrulaması başarısız oldu. Lütfen yenileyiniz."),
        },
        { status: 403 }
      );
    }

    if (requestEmail) {
      const accountAccess = await evaluateSecurityAccessAsync({
        ip,
        purpose: "auth:login:acc",
        subject: requestEmail,
        limit: 10,
        windowMs: 15 * 60 * 1000,
        isEn,
      });
      if (!accountAccess.allowed) {
        SecurityAuditService.logEvent({
          eventType: "SUSPICIOUS_ACTIVITY",
          ipAddress: ip,
          userAgent,
          riskMetadata: { email: requestEmail, reason: accountAccess.reason },
        }).catch(() => {});

        return accountAccess.response;
      }
    }

    const result = await AuthService.login(body);

    SecurityAuditService.logEvent({
      userId: result.user.id,
      eventType: "LOGIN_SUCCESS",
      ipAddress: ip,
      userAgent,
      riskMetadata: { email: requestEmail },
    }).catch(() => {});

    const response = NextResponse.json(
      {
        success: true,
        user: result.user,
      },
      { status: 200 }
    );

    // Set secure HTTP-only session cookie (7 days matching token expiration)
    response.cookies.set(SESSION_COOKIE_NAME, result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err: unknown) {
    SecurityAuditService.logEvent({
      eventType: "LOGIN_FAILED",
      ipAddress: ip,
      userAgent,
      riskMetadata: {
        email: requestEmail,
        reason: err instanceof Error ? err.message : "Login failed",
      },
    }).catch(() => {});

    if (
      err instanceof Error &&
      (err.message === "TWO_FACTOR_REQUIRED" ||
        (err as unknown as { requires2FA?: boolean }).requires2FA)
    ) {
      return NextResponse.json(
        {
          success: false,
          requires2FA: true,
          message: isEn
            ? "Two-factor authentication code is required."
            : "İki aşamalı doğrulama kodu gereklidir.",
        },
        { status: 403 }
      );
    }
    let message = isEn ? "Login failed" : "Giriş işlemi başarısız oldu";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
