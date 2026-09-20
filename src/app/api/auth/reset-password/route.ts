import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { hashPassword, hashEmailBlindIndex } from "@/src/lib/crypto";
import {
  verifyPasswordResetToken,
  getPasswordHashFingerprint,
} from "@/src/modules/auth/password-reset";
import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";
import { SecurityAuditService } from "@/src/modules/security/audit-service";
import { verifyTurnstileToken } from "@/src/lib/security/turnstile";

const createResetPasswordSchema = (isEn: boolean) =>
  z.object({
    token: z.string().min(1, isEn ? "Reset token is missing." : "Sıfırlama anahtarı eksik."),
    password: z
      .string()
      .min(
        12,
        isEn ? "Password must be at least 12 characters." : "Şifre en az 12 karakter olmalıdır."
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
  });

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const headerLocale = req.headers.get("x-locale");
  const isEnHeader = headerLocale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "auth:reset",
    limit: 5,
    windowMs: 15 * 60 * 1000,
    isEn: isEnHeader,
  });
  if (!access.allowed) {
    return access.response;
  }

  let isEn = isEnHeader;
  try {
    const body = await req.json();
    isEn = body?.locale === "en" || isEnHeader;

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

    const schemaValidator = createResetPasswordSchema(isEn);
    const { token, password } = schemaValidator.parse(body);

    const payload = verifyPasswordResetToken(token);
    if (!payload) {
      return NextResponse.json(
        {
          error: isEn
            ? "Invalid or expired password reset link."
            : "Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı.",
        },
        { status: 400 }
      );
    }

    let userFound = false;

    try {
      const db = getDb();
      const emailHmac = hashEmailBlindIndex(payload.email.toLowerCase().trim());
      const [user] = await db
        .select({
          id: schema.users.id,
          passwordHash: schema.users.passwordHash,
        })
        .from(schema.users)
        .where(or(eq(schema.users.emailHmac, emailHmac), eq(schema.users.email, payload.email)))
        .limit(1);

      if (user && user.passwordHash) {
        // Single-use token verification: ensure current password hash matches token snapshot
        if (getPasswordHashFingerprint(user.passwordHash) !== payload.pwh) {
          return NextResponse.json(
            {
              error: isEn
                ? "This password reset link has already been used or invalidated."
                : "Bu sıfırlama bağlantısı daha önce kullanılmış veya geçersiz kılınmış.",
            },
            { status: 400 }
          );
        }

        const newPasswordHash = await hashPassword(password);
        const updateResult = await db
          .update(schema.users)
          .set({
            passwordHash: newPasswordHash,
            authVersion: sql`${schema.users.authVersion} + 1`,
            updatedAt: new Date(),
          })
          .where(
            and(eq(schema.users.id, user.id), eq(schema.users.passwordHash, user.passwordHash))
          )
          .returning({ id: schema.users.id });

        if (updateResult.length === 0) {
          return NextResponse.json(
            {
              error: isEn
                ? "This password reset link has already been used or invalidated."
                : "Bu sıfırlama bağlantısı daha önce kullanılmış veya geçersiz kılınmış.",
            },
            { status: 400 }
          );
        }

        userFound = true;

        SecurityAuditService.logEvent({
          userId: user.id,
          eventType: "PASSWORD_RESET",
          ipAddress: ip,
          userAgent: req.headers.get("user-agent") || null,
          riskMetadata: { email: payload.email },
        }).catch(() => {});
      }
    } catch {
      // Offline fallback in non-production
    }

    if (!userFound && process.env.NODE_ENV !== "production") {
      if (
        payload.email.toLowerCase() === DEFAULT_USER.email.toLowerCase() ||
        payload.email.toLowerCase() === "demo@operis.dev"
      ) {
        DEFAULT_USER.password = password;
        userFound = true;
      }
    }

    if (!userFound) {
      return NextResponse.json(
        { error: isEn ? "User account not found." : "Kullanıcı bulunamadı." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: isEn
          ? "Your password has been updated successfully. You can now sign in with your new password."
          : "Şifreniz başarıyla güncellendi. Yeni şifreniz ile giriş yapabilirsiniz.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    let message = isEn
      ? "Password reset failed. Please try again."
      : "Şifre sıfırlama işlemi başarısız oldu.";
    if (err instanceof z.ZodError) {
      const fallbackFormat = isEn ? "Invalid password format." : "Geçersiz şifre formatı.";
      message = err.issues[0]?.message || fallbackFormat;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
