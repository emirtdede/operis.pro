import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { verifyEmailVerificationToken } from "@/src/modules/auth/verification";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  getVerifiedSession,
} from "@/src/modules/auth/session";
import { SecurityAuditService } from "@/src/modules/security/audit-service";
import { getClientIp } from "@/src/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const isEn = searchParams.get("locale") === "en" || request.headers.get("x-locale") === "en";
  const acceptHeader = request.headers.get("accept") || "";
  const isHtml = acceptHeader.includes("text/html");

  if (!token) {
    if (isHtml) {
      const redirectPath = isEn ? "/en/login?error=missing_token" : "/tr/giris?error=missing_token";
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
    return NextResponse.json(
      { error: isEn ? "Verification token is missing." : "Doğrulama belirteci eksik." },
      { status: 400 }
    );
  }

  const payload = verifyEmailVerificationToken(token);
  if (!payload) {
    if (isHtml) {
      const redirectPath = isEn ? "/en/login?error=invalid_token" : "/tr/giris?error=invalid_token";
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
    return NextResponse.json(
      {
        error: isEn
          ? "Invalid or expired email verification link."
          : "Geçersiz veya süresi dolmuş e-posta doğrulama bağlantısı.",
      },
      { status: 400 }
    );
  }

  try {
    const db = getDb();
    const [user] = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        role: schema.users.role,
        status: schema.users.status,
        emailVerified: schema.users.emailVerified,
        authVersion: schema.users.authVersion,
      })
      .from(schema.users)
      .where(eq(schema.users.id, payload.userId))
      .limit(1);

    if (!user || (user.email && user.email.toLowerCase() !== payload.email.toLowerCase())) {
      if (isHtml) {
        const redirectPath = isEn ? "/en/login?error=invalid_user" : "/tr/giris?error=invalid_user";
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }
      return NextResponse.json(
        {
          error: isEn
            ? "User account or verification email mismatch."
            : "Kullanıcı hesabı veya doğrulama e-postası eşleşmedi.",
        },
        { status: 404 }
      );
    }

    // Check if the current client holds an active, unrevoked session for this user BEFORE updating updatedAt (Fixes R01)
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
    let shouldRefreshSession = false;
    if (sessionCookie?.value) {
      const currentSession = await getVerifiedSession(sessionCookie.value);
      if (currentSession && currentSession.userId === payload.userId) {
        shouldRefreshSession = true;
      }
    }

    if (!user.emailVerified) {
      await db
        .update(schema.users)
        .set({
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, payload.userId));

      const ip = getClientIp(request);
      SecurityAuditService.logEvent({
        userId: payload.userId,
        eventType: "EMAIL_VERIFIED",
        ipAddress: ip,
        userAgent: request.headers.get("user-agent"),
        riskMetadata: {
          action: "EMAIL_TOKEN_VERIFIED",
        },
      }).catch(() => {});
    }

    let freshToken: string | null = null;
    if (shouldRefreshSession) {
      freshToken = createSessionToken({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        authVersion: user.authVersion,
      });
    }

    const profileRows = await db
      .select({ locale: schema.profiles.locale })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, payload.userId))
      .limit(1);

    const userIsEn = profileRows[0]?.locale === "en" || searchParams.get("locale") === "en";

    // Redirect to login or home with verified notice if requested in browser
    if (isHtml) {
      let redirectPath = userIsEn
        ? "/en/login?verified=email"
        : "/tr/giris?verified=email";
      if (freshToken) {
        redirectPath = userIsEn
          ? "/en/dashboard/listings"
          : "/tr/panel/ilanlarim";
      }
      const redirectUrl = new URL(redirectPath, request.url);
      const res = NextResponse.redirect(redirectUrl);
      if (freshToken) {
        res.cookies.set(SESSION_COOKIE_NAME, freshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
        });
      }
      return res;
    }

    const res = NextResponse.json({
      success: true,
      message: userIsEn
        ? "Your email address has been verified successfully."
        : "E-posta adresiniz başarıyla doğrulandı.",
    });
    if (freshToken) {
      res.cookies.set(SESSION_COOKIE_NAME, freshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }
    return res;
  } catch (err: unknown) {
    const userIsEn = searchParams.get("locale") === "en";
    const message = err instanceof Error ? err.message : "Doğrulama işlemi tamamlanamadı.";
    if (isHtml) {
      const redirectPath = userIsEn
        ? "/en/login?error=verification_failed"
        : "/tr/giris?error=verification_failed";
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
