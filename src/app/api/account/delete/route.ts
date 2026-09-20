import { NextResponse } from "next/server";
import { getSession, SESSION_COOKIE_NAME } from "@/src/modules/auth/session";
import { PrivacyService } from "@/src/modules/privacy/service";
import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";

export async function POST(req: Request) {
  const headerLocale = req.headers.get("x-locale");
  let isEn = headerLocale === "en";
  const ip = getClientIp(req);
  const security = await evaluateSecurityAccessAsync({
    ip,
    purpose: "account:delete",
    limit: 5,
    windowMs: 10 * 60 * 1000,
    isEn,
  });

  if (!security.allowed) {
    return security.response;
  }

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    if (body?.locale === "en") isEn = true;
    const { password, totpCode, reason } = body;

    if (!password || typeof password !== "string" || !password.trim()) {
      return NextResponse.json(
        {
          error: isEn
            ? "Please enter your account password to confirm deletion."
            : "Hesabınızı silmek için lütfen şifrenizi giriniz.",
        },
        { status: 400 }
      );
    }

    let passwordVerified = false;
    try {
      const { getDb, schema } = await import("@/src/lib/db");
      const { eq } = await import("drizzle-orm");
      const db = getDb();
      const [dbUser] = await db
        .select({
          id: schema.users.id,
          passwordHash: schema.users.passwordHash,
          twoFactorEnabled: schema.users.twoFactorEnabled,
          twoFactorSecret: schema.users.twoFactorSecret,
          twoFactorBackupCodes: schema.users.twoFactorBackupCodes,
        })
        .from(schema.users)
        .where(eq(schema.users.id, session.userId))
        .limit(1);

      if (dbUser) {
        const { verifyPassword } = await import("@/src/lib/crypto");
        const isValid = await verifyPassword(password.trim(), dbUser.passwordHash);
        if (!isValid) {
          return NextResponse.json(
            { error: isEn ? "Incorrect account password." : "Hesap şifrenizi hatalı girdiniz." },
            { status: 400 }
          );
        }

        if (dbUser.twoFactorEnabled && dbUser.twoFactorSecret) {
          const cleanTotp = (totpCode || "").trim().replace(/\s+/g, "");
          if (!cleanTotp) {
            return NextResponse.json(
              {
                error: isEn
                  ? "2FA verification code or recovery backup code is required."
                  : "İki aşamalı doğrulama (TOTP) veya kurtarma kodu gereklidir.",
                requires2FA: true,
              },
              { status: 400 }
            );
          }

          let isTwoFactorValid = false;
          const { verifyTotpCode, verifyAndConsumeBackupCode, decryptTotpSecret } =
            await import("@/src/modules/auth/totp");

          if (/^\d{6}$/.test(cleanTotp) && dbUser.twoFactorSecret) {
            isTwoFactorValid = verifyTotpCode(
              decryptTotpSecret(dbUser.id, dbUser.twoFactorSecret),
              cleanTotp
            );
          }

          if (
            !isTwoFactorValid &&
            dbUser.twoFactorBackupCodes &&
            dbUser.twoFactorBackupCodes.length > 0
          ) {
            const { isValid } = verifyAndConsumeBackupCode(cleanTotp, dbUser.twoFactorBackupCodes);
            if (isValid) {
              isTwoFactorValid = true;
            }
          }

          if (!isTwoFactorValid) {
            return NextResponse.json(
              {
                error: isEn
                  ? "Invalid 2FA verification code or recovery backup code."
                  : "Geçersiz 2FA doğrulama kodu veya kurtarma kodu.",
              },
              { status: 400 }
            );
          }
        }
        passwordVerified = true;
      }
    } catch {
      // Fallback in non-production
    }

    if (!passwordVerified) {
      if (process.env.NODE_ENV !== "production") {
        const { DEFAULT_USER } = await import("@/src/modules/auth/demo-user");
        if (session.userId === DEFAULT_USER.id) {
          if (
            password !== DEFAULT_USER.password &&
            password !== "Operis123!" &&
            password !== "OperisUser2026!" &&
            password !== "demo1234"
          ) {
            return NextResponse.json(
              { error: isEn ? "Incorrect account password." : "Hesap şifrenizi hatalı girdiniz." },
              { status: 400 }
            );
          }
          passwordVerified = true;
        }
      }
    }

    if (!passwordVerified) {
      return NextResponse.json(
        { error: isEn ? "Failed to verify account credentials." : "Hesap kimliği doğrulanamadı." },
        { status: 401 }
      );
    }

    await PrivacyService.deleteAccount(session.userId, reason);

    const response = NextResponse.json(
      {
        success: true,
        message: isEn
          ? "Your account and personal data have been permanently deleted."
          : "Hesabınız ve kişisel verileriniz başarıyla silindi.",
      },
      { status: 200 }
    );

    // Invalidate session cookie immediately
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (err: unknown) {
    let message = isEn ? "Failed to delete account." : "Hesap silinemedi.";
    if (err instanceof Error) {
      message = err.message;
    }

    if (isEn && message.includes("iş birlikleriniz bulunurken")) {
      message =
        "You cannot delete your account while you have active, disputed, or pending completion engagements. Please conclude all projects first.";
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
