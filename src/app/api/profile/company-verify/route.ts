import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ProfileService } from "@/src/modules/profiles/service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function POST(req: Request) {
  const headerLocale = req.headers.get("x-locale");

  try {
    const session = await getSession();
    const body = await req.json();
    const locale = headerLocale || body?.locale || "tr";
    const isEn = locale === "en";

    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const ip = getClientIp(req);
    // Rate limit: 5 attempts per 10 minutes to protect against brute-force tax ID enumeration
    const access = await evaluateSecurityAccessAsync({
      ip,
      purpose: "profile:company-verify",
      subject: `${session.userId}:${normalizeIp(ip)}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
      isEn,
    });
    if (!access.allowed) {
      return access.response;
    }

    const { companyName, taxId, taxOffice, companyType, websiteUrl } = body || {};

    if (!companyName || !taxId || !taxOffice) {
      return NextResponse.json(
        {
          error: isEn
            ? "Company name, Tax ID (VKN/TCKN), and Tax Office are required."
            : "Şirket unvanı, Vergi Kimlik No (VKN/TCKN) ve Vergi Dairesi alanları zorunludur.",
        },
        { status: 400 }
      );
    }

    const verificationResult = await ProfileService.verifyCompany(session.userId, {
      companyName,
      taxId,
      taxOffice,
      companyType,
      websiteUrl,
    });

    return NextResponse.json(
      {
        success: true,
        data: verificationResult,
        message: isEn
          ? "Company verified successfully. Corporate badge is now active on your listings."
          : "Kurumsal şirket doğrulaması başarıyla tamamlandı. Rozetiniz ilanlarınızda ve profilinizde aktif edildi.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const locale = headerLocale || "tr";
    const isEn = locale === "en";
    const rawMessage = err instanceof Error ? err.message : "";

    if (rawMessage.includes("başka bir kurumsal hesap tarafından zaten doğrulanmış")) {
      return NextResponse.json(
        {
          error: isEn
            ? "This Tax ID is already registered and verified by another corporate account."
            : "Bu Vergi Numarası başka bir kurumsal hesap tarafından zaten doğrulanmış.",
        },
        { status: 409 }
      );
    }

    const lowerMessage = rawMessage.toLowerCase();
    if (
      lowerMessage.includes("geçersiz") ||
      lowerMessage.includes("invalid") ||
      lowerMessage.includes("zorunludur") ||
      lowerMessage.includes("required") ||
      lowerMessage.includes("karakter") ||
      lowerMessage.includes("characters") ||
      lowerMessage.includes("uygunsuz")
    ) {
      return NextResponse.json({ error: rawMessage }, { status: 400 });
    }

    const message = isEn
      ? "An unexpected error occurred during company verification."
      : "Şirket doğrulaması sırasında beklenmeyen bir hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
