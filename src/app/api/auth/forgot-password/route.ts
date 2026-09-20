import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, or } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { createPasswordResetToken } from "@/src/modules/auth/password-reset";
import { EmailAdapter } from "@/src/lib/email";
import { hashEmailBlindIndex } from "@/src/lib/crypto";
import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/src/lib/security/turnstile";

const createForgotPasswordSchema = (isEn: boolean) =>
  z.object({
    email: z
      .string()
      .email(isEn ? "Please enter a valid email address." : "Geçerli bir e-posta adresi giriniz."),
    locale: z.enum(["tr", "en"]).optional(),
  });

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const headerLocale = req.headers.get("x-locale");
  const isEnHeader = headerLocale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "auth:forgot-pwd",
    limit: 3,
    windowMs: 15 * 60 * 1000,
    isEn: isEnHeader,
  });
  if (!access.allowed) {
    return access.response;
  }

  try {
    const body = await req.json();
    const isEnCandidate = body?.locale === "en" || isEnHeader;

    // Verify Cloudflare Turnstile token (fail-open in dev/testing)
    const turnstileResult = await verifyTurnstileToken(body?.turnstileToken, ip);
    if (!turnstileResult.success) {
      return NextResponse.json(
        {
          error:
            turnstileResult.error ||
            (isEnCandidate
              ? "Bot verification failed. Please refresh."
              : "Bot doğrulaması başarısız oldu. Lütfen yenileyiniz."),
        },
        { status: 403 }
      );
    }

    const { email, locale: requestedLocale } =
      createForgotPasswordSchema(isEnCandidate).parse(body);
    const cleanEmail = email.toLowerCase().trim();

    let resetToken: string | null = null;
    let userLocale: "tr" | "en" = requestedLocale ?? "tr";

    try {
      const db = getDb();
      const emailHmac = hashEmailBlindIndex(cleanEmail);
      const userRows = await db
        .select({
          id: schema.users.id,
          passwordHash: schema.users.passwordHash,
          profileLocale: schema.profiles.locale,
        })
        .from(schema.users)
        .leftJoin(schema.profiles, eq(schema.users.id, schema.profiles.userId))
        .where(or(eq(schema.users.emailHmac, emailHmac), eq(schema.users.email, cleanEmail)))
        .limit(1);

      const user = userRows[0];
      if (user && user.passwordHash) {
        resetToken = createPasswordResetToken(cleanEmail, user.passwordHash);
        if (requestedLocale) {
          userLocale = requestedLocale;
        } else if (user.profileLocale === "en" || user.profileLocale === "tr") {
          userLocale = user.profileLocale;
        }
      } else if (
        process.env.NODE_ENV !== "production" &&
        (cleanEmail === "kullanici@operis.pro" || cleanEmail === "demo@operis.dev")
      ) {
        resetToken = createPasswordResetToken(cleanEmail, "demo-offline-hash-fingerprint");
      }
    } catch {
      // If database is offline or unreachable in dev/test, generate token for demo accounts
      if (
        process.env.NODE_ENV !== "production" &&
        (cleanEmail === "kullanici@operis.pro" || cleanEmail === "demo@operis.dev")
      ) {
        resetToken = createPasswordResetToken(cleanEmail, "demo-offline-hash-fingerprint");
      }
    }

    if (resetToken) {
      const rawAppUrl =
        process.env.APP_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      const appUrl = rawAppUrl.replace(/\/+$/, "");
      const isEn = userLocale === "en";
      const resetPath = isEn ? "/en/reset-password" : "/tr/sifre-sifirla";
      const resetLink = `${appUrl}${resetPath}?token=${encodeURIComponent(resetToken)}`;
      try {
        await EmailAdapter.sendTransactionalEmail({
          to: cleanEmail,
          template: "password_reset",
          locale: isEn ? "en" : "tr",
          subject: isEn ? "Operis - Password Reset Request" : "Operis - Şifre Sıfırlama Talebi",
          body: isEn
            ? `Hello,\n\nA request has been made to reset the password for your account. Click the link below to set a new password:\n\n${resetLink}\n\nThis link is valid for 1 hour. If you did not make this request, you can safely ignore this email.`
            : `Merhaba,\n\nHesabınız için bir şifre sıfırlama talebinde bulunuldu. Şifrenizi yenilemek için aşağıdaki bağlantıya tıklayınız:\n\n${resetLink}\n\nBu bağlantı 1 saat boyunca geçerlidir. Eğer bu talebi siz yapmadıysanız, bu e-postayı dikkate almayınız.`,
          variables: {
            resetLink,
            token: resetToken,
          },
        });
      } catch {
        // Non-blocking transactional dispatch
      }
    }

    const isEn = userLocale === "en";
    // Always return a success response to prevent email enumeration attacks.
    // In dev / test environments, expose resetToken for instant manual verification.
    return NextResponse.json(
      {
        success: true,
        message: isEn
          ? "Password reset instructions have been sent to your email address."
          : "Şifre sıfırlama talimatları e-posta adresinize gönderildi.",
        email: cleanEmail,
        ...(resetToken &&
        process.env.NODE_ENV !== "production" &&
        (process.env.EXPOSE_DEV_RESET_TOKEN === "true" ||
          process.env.VITEST !== undefined ||
          process.env.NODE_ENV === "test")
          ? { devResetToken: resetToken }
          : {}),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const isEn = headerLocale === "en";
    let message = isEn
      ? "An error occurred during request."
      : "İşlem sırasında bir hata oluştu.";
    if (err instanceof z.ZodError) {
      const fallbackFormat = isEn ? "Invalid email." : "Geçersiz e-posta.";
      message = err.issues[0]?.message || fallbackFormat;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
