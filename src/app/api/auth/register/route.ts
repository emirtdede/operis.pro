import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthService } from "@/src/modules/auth/service";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/src/modules/auth/session";
import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/src/lib/security/turnstile";

function normalizeE164Phone(rawPhone: string): string {
  if (!rawPhone) return rawPhone;
  let cleaned = rawPhone.trim().replace(/[\s()-]/g, "");
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  } else if (cleaned.startsWith("05")) {
    cleaned = "+90" + cleaned.slice(1);
  } else if (cleaned.startsWith("5") && cleaned.length === 10) {
    cleaned = "+90" + cleaned;
  } else if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }
  return cleaned;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "auth:register",
    limit: 5,
    windowMs: 10 * 60 * 1000,
    isEn,
  });

  if (!access.allowed) {
    return access.response;
  }

  try {
    const raw = await req.json();

    // Verify Cloudflare Turnstile token (fail-open in dev/testing)
    const turnstileResult = await verifyTurnstileToken(raw?.turnstileToken, ip);
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

    const legalConsents = raw.legalConsents || {};

    const normalized = {
      ...raw,
      legalFirstName: raw.legalFirstName || raw.firstName,
      legalLastName: raw.legalLastName || raw.lastName,
      city: raw.city || raw.cityOfResidence,
      countryCode: (raw.countryCode || raw.countryOfResidence || "TR").toUpperCase(),
      confirmPassword: raw.confirmPassword || raw.password,
      termsAccepted: raw.termsAccepted ?? legalConsents.termsAccepted ?? false,
      privacyAcknowledged: raw.privacyAcknowledged ?? legalConsents.privacyAcknowledged ?? false,
      matchingAcknowledged:
        raw.matchingAcknowledged ??
        legalConsents.matchingDisclaimerAcknowledged ??
        legalConsents.matchingAcknowledged ??
        false,
      ageConfirmed: raw.ageConfirmed ?? legalConsents.ageConfirmed ?? false,
      focusCategoryKeys:
        Array.isArray(raw.focusCategoryKeys) && raw.focusCategoryKeys.length > 0
          ? raw.focusCategoryKeys
          : ["web-development", "frontend-ui"],
      phone: raw.phone ? normalizeE164Phone(raw.phone) : raw.phone,
      locale: raw.locale === "en" || locale === "en" ? "en" : "tr",
    };

    const result = await AuthService.register(normalized);

    // If user opted into marketing/announcements, register in Resend dynamic pool
    if (raw.marketingConsent === true || raw.newsletterAccepted === true) {
      const { ResendPoolService } = await import("@/src/modules/email/resend-pool-service");
      await ResendPoolService.optInUser(result.user.id, result.user.email).catch(() => {});
    }

    const response = NextResponse.json(
      {
        success: true,
        user: result.user,
        phoneChallengeId: result.phoneChallengeId || null,
      },
      { status: 201 }
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
    const isEn = (req.headers.get("x-locale") || "tr") === "en";

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: isEn
            ? "Invalid registration data. Please check required fields."
            : "Geçersiz kayıt bilgileri. Lütfen zorunlu alanları kontrol ediniz.",
          details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
        { status: 400 }
      );
    }

    if (err instanceof Error) {
      const msg = err.message;
      if (msg.includes("email address already exists")) {
        return NextResponse.json(
          {
            error: isEn
              ? "An account with this email address already exists."
              : "Bu e-posta adresiyle kayıtlı bir hesap zaten mevcut.",
          },
          { status: 400 }
        );
      }
      if (msg.includes("handle is already taken")) {
        return NextResponse.json(
          {
            error: isEn
              ? "This handle is already taken. Please choose another one."
              : "Bu kullanıcı adı zaten alınmış. Lütfen başka bir kullanıcı adı seçiniz.",
          },
          { status: 400 }
        );
      }
      if (msg.includes("phone number already exists")) {
        return NextResponse.json(
          {
            error: isEn
              ? "An account with this mobile phone number already exists."
              : "Bu telefon numarasıyla kayıtlı bir hesap zaten mevcut.",
          },
          { status: 400 }
        );
      }
      if (
        msg.includes("Password does not meet") ||
        msg.includes("Must accept") ||
        msg.includes("Terms") ||
        msg.includes("Privacy")
      ) {
        return NextResponse.json(
          {
            error: isEn
              ? "Registration validation failed. Please check your details."
              : "Kayıt doğrulaması başarısız oldu. Lütfen bilgilerinizi kontrol ediniz.",
          },
          { status: 400 }
        );
      }
    }

    console.error("Auth register unhandled server error:", err);
    return NextResponse.json(
      {
        error: isEn
          ? "An unexpected error occurred during registration. Please try again later."
          : "Kayıt işlemi sırasında beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.",
      },
      { status: 500 }
    );
  }
}
