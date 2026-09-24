import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { getSession, createSessionToken, SESSION_COOKIE_NAME } from "@/src/modules/auth/session";
import { getDb, schema } from "@/src/lib/db";
import { verifyPassword, hashPassword } from "@/src/lib/crypto";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";

import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";
import { SecurityAuditService } from "@/src/modules/security/audit-service";

const createChangePasswordSchema = (isEn: boolean) =>
  z
    .object({
      currentPassword: z
        .string()
        .min(1, isEn ? "Please enter your current password." : "Mevcut şifrenizi giriniz."),
      newPassword: z
        .string()
        .min(
          12,
          isEn
            ? "New password must be at least 12 characters."
            : "Yeni şifre en az 12 karakter olmalıdır."
        )
        .regex(
          /[A-Z]/,
          isEn
            ? "Password must contain at least one uppercase letter."
            : "Şifre en az bir büyük harf içermelidir."
        )
        .regex(
          /[0-9]/,
          isEn ? "Password must contain at least one number." : "Şifre en az bir rakam içermelidir."
        ),
      locale: z.enum(["tr", "en"]).optional(),
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: isEn
        ? "New password cannot be the same as your current password."
        : "Yeni şifre mevcut şifrenizle aynı olamaz.",
      path: ["newPassword"],
    });

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const headerLocale = req.headers.get("x-locale");
  const isEnHeader = headerLocale === "en";

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEnHeader ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const security = await evaluateSecurityAccessAsync({
      ip,
      purpose: "auth:change-pwd",
      subject: session.userId,
      limit: 5,
      windowMs: 15 * 60 * 1000,
      isEn: isEnHeader,
    });
    if (!security.allowed) {
      return security.response;
    }

    const body = await req.json();
    const isEn = body?.locale === "en" || isEnHeader;
    const { currentPassword, newPassword } = createChangePasswordSchema(isEn).parse(body);

    const db = getDb();
    let newAuthVersion: number | null = null;
    let updated = false;

    try {
      const [user] = await db
        .select({ id: schema.users.id, passwordHash: schema.users.passwordHash })
        .from(schema.users)
        .where(eq(schema.users.id, session.userId))
        .limit(1);

      if (user && user.passwordHash) {
        const isValid = await verifyPassword(currentPassword, user.passwordHash);
        if (!isValid) {
          return NextResponse.json(
            {
              error: isEn ? "Current password is incorrect." : "Mevcut şifrenizi hatalı girdiniz.",
            },
            { status: 400 }
          );
        }

        const newPasswordHash = await hashPassword(newPassword);
        const [updatedRow] = await db
          .update(schema.users)
          .set({
            passwordHash: newPasswordHash,
            authVersion: sql`${schema.users.authVersion} + 1`,
            updatedAt: new Date(),
          })
          .where(
            and(eq(schema.users.id, user.id), eq(schema.users.passwordHash, user.passwordHash))
          )
          .returning({ authVersion: schema.users.authVersion });

        if (updatedRow?.authVersion) {
          newAuthVersion = updatedRow.authVersion;
          updated = true;
        }
      }
    } catch {
      // Fallback for in-memory or demo user
    }

    if (!updated) {
      // Check built-in demo user credentials strictly in non-production
      if (
        process.env.NODE_ENV !== "production" &&
        (session.email?.toLowerCase() === DEFAULT_USER.email.toLowerCase() ||
          session.userId === DEFAULT_USER.id)
      ) {
        if (
          currentPassword !== DEFAULT_USER.password &&
          currentPassword !== "Operis123!" &&
          currentPassword !== "OperisUser2026!" &&
          currentPassword !== "demo1234"
        ) {
          return NextResponse.json(
            {
              error: isEn ? "Current password is incorrect." : "Mevcut şifrenizi hatalı girdiniz.",
            },
            { status: 400 }
          );
        }
        DEFAULT_USER.password = newPassword;
        DEFAULT_USER.authVersion = (DEFAULT_USER.authVersion ?? 1) + 1;
        newAuthVersion = DEFAULT_USER.authVersion;
        updated = true;
      }
    }

    if (!updated || !newAuthVersion) {
      return NextResponse.json(
        {
          error: isEn
            ? "User record not found or update failed."
            : "Kullanıcı kaydı bulunamadı veya güncelleme başarısız oldu.",
        },
        { status: 404 }
      );
    }

    const freshToken = createSessionToken({
      id: session.userId,
      email: session.email,
      role: session.role,
      status: "ACTIVE",
      authVersion: newAuthVersion,
    });

    // Log user-specific security event (B23)
    await SecurityAuditService.logEvent({
      userId: session.userId,
      eventType: "PASSWORD_CHANGED",
      ipAddress: ip,
      userAgent: req.headers.get("user-agent"),
    });

    const response = NextResponse.json(
      {
        success: true,
        message: isEn ? "Password changed successfully." : "Şifreniz başarıyla değiştirildi.",
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
    const isEn = req.headers.get("x-locale") === "en";
    let message = isEn
      ? "Failed to change password."
      : "Şifre değiştirme işlemi başarısız oldu.";
    if (err instanceof z.ZodError) {
      const fallbackFormat = isEn ? "Invalid password format." : "Geçersiz şifre formatı.";
      message = err.issues[0]?.message || fallbackFormat;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
