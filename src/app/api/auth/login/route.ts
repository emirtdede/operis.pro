import { NextResponse } from "next/server";
import { z } from "zod";
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

  let requestEmail = "";
  try {
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
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: isEn ? "Invalid login credentials format." : "Geçersiz giriş bilgileri formatı.",
          details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
        { status: 400 }
      );
    }

    const KNOWN_AUTH_ERRORS: Record<string, { en: string; tr: string; status: number }> = {
      "Invalid email or password.": {
        en: "Invalid email or password.",
        tr: "Geçersiz e-posta veya şifre.",
        status: 400,
      },
      "This account has been suspended by platform moderation.": {
        en: "This account has been suspended by platform moderation.",
        tr: "Bu hesap platform yönetimi tarafından askıya alınmıştır.",
        status: 403,
      },
      "This account has been deleted.": {
        en: "This account has been deleted.",
        tr: "Bu hesap silinmiştir.",
        status: 403,
      },
      "Geçersiz 2FA doğrulama kodu. Lütfen Authenticator uygulamanızdaki güncel kodu giriniz.": {
        en: "Invalid 2FA code. Please enter the current code from your authenticator app.",
        tr: "Geçersiz 2FA doğrulama kodu. Lütfen Authenticator uygulamanızdaki güncel kodu giriniz.",
        status: 400,
      },
      "Geçersiz 2FA doğrulama kodu veya kurtarma kodu. Lütfen kontrol ediniz.": {
        en: "Invalid 2FA verification or backup code.",
        tr: "Geçersiz 2FA doğrulama kodu veya kurtarma kodu. Lütfen kontrol ediniz.",
        status: 400,
      },
      "Tüm 2FA yedek kodları kullanılmış. Lütfen authenticator uygulaması ile giriş yapınız.": {
        en: "All 2FA backup codes have been used. Please use your authenticator app.",
        tr: "Tüm 2FA yedek kodları kullanılmış. Lütfen authenticator uygulaması ile giriş yapınız.",
        status: 400,
      },
      "Geçersiz 2FA kodu veya yedek kod.": {
        en: "Invalid 2FA code or backup code.",
        tr: "Geçersiz 2FA kodu veya yedek kod.",
        status: 400,
      },
    };

    if (err instanceof Error) {
      const known = KNOWN_AUTH_ERRORS[err.message];
      if (known) {
        return NextResponse.json({ error: isEn ? known.en : known.tr }, { status: known.status });
      }
      if (
        err.message.includes("Giriş yapılamadı") ||
        err.message.includes("Bilgilerinizi kontrol ediniz")
      ) {
        return NextResponse.json(
          {
            error: isEn
              ? "Login failed. Please check your credentials."
              : "Giriş yapılamadı. Bilgilerinizi kontrol ediniz.",
          },
          { status: 400 }
        );
      }
    }

    console.error("Auth login unhandled server error:", err);
    return NextResponse.json(
      {
        error: isEn
          ? "An unexpected error occurred during login. Please try again later."
          : "Giriş işlemi sırasında beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.",
      },
      { status: 500 }
    );
  }
}
