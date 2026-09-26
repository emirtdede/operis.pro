import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, getSession } from "@/src/modules/auth/session";

import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";

export async function GET() {
  try {
    const session = await getSession();
    return NextResponse.json({
      authenticated: Boolean(session),
      session,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve session";
    return NextResponse.json(
      { authenticated: false, session: null, error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const security = await evaluateSecurityAccessAsync({
    ip,
    purpose: "auth:admin-session",
    limit: 5,
    windowMs: 15 * 60 * 1000,
    isEn: false,
  });
  if (!security.allowed) {
    return security.response;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const {
      adminKey,
      role: requestedRole,
      email: requestedEmail,
      displayName: requestedName,
      totpCode,
    } = body;

    const configuredKey = process.env.ADMIN_MASTER_KEY;

    if (!configuredKey) {
      return NextResponse.json(
        { error: "Yönetici oturum anahtarı sistemde tanımlanmamış." },
        { status: 503 }
      );
    }

    if (!adminKey || typeof adminKey !== "string") {
      return NextResponse.json(
        { error: "Lütfen yönetici güvenlik anahtarını (PIN) giriniz." },
        { status: 401 }
      );
    }

    const keyBuf = Buffer.from(adminKey.trim());
    const expectedBuf = Buffer.from(configuredKey.trim());

    if (keyBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(keyBuf, expectedBuf)) {
      return NextResponse.json(
        { error: "Geçersiz yönetici güvenlik anahtarı (PIN)." },
        { status: 401 }
      );
    }

    // Determine target admin email
    const email = (requestedEmail || "admin@operis.pro").trim().toLowerCase();
    const validRoles = ["ADMIN", "SECURITY_ADMIN", "MODERATOR"] as const;
    let targetRole: (typeof validRoles)[number] = validRoles.includes(requestedRole)
      ? requestedRole
      : "ADMIN";
    let userId = "usr_admin_authorized";
    let authVersion = 1;
    let dbUserFound = false;

    // Re-verify against database users
    try {
      const { getDb, schema } = await import("@/src/lib/db");
      const { eq } = await import("drizzle-orm");
      const db = getDb();
      const [existingUser] = await db
        .select({
          id: schema.users.id,
          role: schema.users.role,
          status: schema.users.status,
          twoFactorEnabled: schema.users.twoFactorEnabled,
          twoFactorSecret: schema.users.twoFactorSecret,
          authVersion: schema.users.authVersion,
        })
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1);

      if (existingUser) {
        dbUserFound = true;
        if (existingUser.status !== "ACTIVE") {
          return NextResponse.json(
            { error: "Yönetici hesabı askıya alınmış veya silinmiş." },
            { status: 403 }
          );
        }
        if (!validRoles.includes(existingUser.role as (typeof validRoles)[number])) {
          return NextResponse.json(
            { error: "Bu kullanıcının yönetici paneline erişim yetkisi bulunmamaktadır." },
            { status: 403 }
          );
        }

        // Enforce 2FA TOTP for privileged admin roles (ADMIN, SECURITY_ADMIN)
        const isPrivilegedAdmin = ["ADMIN", "SECURITY_ADMIN"].includes(existingUser.role);

        if (isPrivilegedAdmin && (!existingUser.twoFactorEnabled || !existingUser.twoFactorSecret)) {
          return NextResponse.json(
            {
              error:
                "Yönetici hesapları için iki aşamalı doğrulama (2FA) zorunludur. Lütfen profil ayarlarınızdan 2FA kurulumunu tamamlayın.",
              requires2FASetup: true,
            },
            { status: 403 }
          );
        }

        // Verify 2FA TOTP if admin user has 2FA enabled
        if (existingUser.twoFactorEnabled && existingUser.twoFactorSecret) {
          const code = (totpCode || "").trim();
          if (!code) {
            return NextResponse.json(
              { error: "İki aşamalı doğrulama kodu (TOTP) gereklidir.", requires2FA: true },
              { status: 401 }
            );
          }
          const { verifyTotpCode, decryptTotpSecret } = await import("@/src/modules/auth/totp");
          if (
            !verifyTotpCode(decryptTotpSecret(existingUser.id, existingUser.twoFactorSecret), code)
          ) {
            return NextResponse.json({ error: "Geçersiz 2FA doğrulama kodu." }, { status: 401 });
          }
        }

        userId = existingUser.id;
        targetRole = existingUser.role as (typeof validRoles)[number];
        authVersion = existingUser.authVersion ?? 1;
      }
    } catch {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Veritabanı bağlantı hatası nedeniyle yönetici oturumu açılamadı." },
          { status: 500 }
        );
      }
    }

    if (!dbUserFound && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Belirtilen e-posta adresine ait yetkili yönetici hesabı bulunamadı." },
        { status: 404 }
      );
    }

    const displayName =
      requestedName || (targetRole === "ADMIN" ? "Demir Yıldız (Yönetici)" : "Güvenlik Sorumlusu");

    const sessionToken = createSessionToken({
      id: userId,
      email,
      role: targetRole,
      status: "ACTIVE",
      authVersion,
      twoFactorVerified: true,
    });

    const response = NextResponse.json({
      success: true,
      message: `Admin oturumu başarıyla oluşturuldu (${targetRole}).`,
      role: targetRole,
      user: {
        id: userId,
        email,
        name: displayName,
        role: targetRole,
        authVersion,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Session error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Admin oturumu sonlandırıldı.",
    });

    response.cookies.delete(SESSION_COOKIE_NAME);

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Session termination error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
