import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ProfileService } from "@/src/modules/profiles/service";
import { handleApiError } from "@/src/lib/api/error-response";
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

    const {
      companyName,
      taxId,
      taxOffice,
      companyType,
      websiteUrl,
      proofDocumentUrl,
      authorizedTitle,
      representativeAttestation,
      strictCorporateProof,
    } = body || {};

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
      proofDocumentUrl,
      authorizedTitle,
      representativeAttestation,
      strictCorporateProof,
    });

    const defaultMsg = isEn
      ? verificationResult.isCompanyVerified
        ? "Company verified successfully. Corporate badge is now active on your listings."
        : "Tax ID format verified. Please submit authority proof for official corporate badge."
      : verificationResult.isCompanyVerified
        ? "Kurumsal şirket doğrulaması başarıyla tamamlandı. Rozetiniz ilanlarınızda ve profilinizde aktif edildi."
        : "Vergi Kimlik Numarası biçimi doğrulandı. Resmi rozet için kurumsal yetki belgesi yükleyiniz.";

    return NextResponse.json(
      {
        success: true,
        data: verificationResult,
        message: isEn
          ? verificationResult.messageEn || defaultMsg
          : verificationResult.messageTr || defaultMsg,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const locale = headerLocale || "tr";
    const isEn = locale === "en";

    return handleApiError(
      err,
      {
        en: "An unexpected error occurred during company verification.",
        tr: "Şirket doğrulaması sırasında beklenmeyen bir hata oluştu.",
      },
      {
        isEn,
        logPrefix: "[Company Verification Error]",
        status: 500,
        allowedMessages: {
          "başka bir kurumsal hesap tarafından zaten doğrulanmış": {
            en: "This Tax ID is already registered and verified by another corporate account.",
            tr: "Bu Vergi Numarası başka bir kurumsal hesap tarafından zaten doğrulanmış.",
            status: 409,
          },
          "Vergi Kimlik Numarası (VKN) algoritması geçersizdir": {
            en: "Tax Identification Number (VKN) checksum algorithm is invalid.",
            tr: "Vergi Kimlik Numarası (VKN) algoritması geçersizdir. Kontrol hanesi uyuşmuyor.",
            status: 400,
          },
          "T.C. Kimlik Numarası (TCKN) algoritması geçersizdir": {
            en: "National ID Number (TCKN) checksum algorithm is invalid.",
            tr: "T.C. Kimlik Numarası (TCKN) algoritması geçersizdir. Kontrol hanesi uyuşmuyor.",
            status: 400,
          },
          "Geçersiz vergi kimlik numarası": {
            en: "Invalid tax identification number length or format.",
            tr: "Geçersiz vergi kimlik numarası uzunluğu veya biçimi.",
            status: 400,
          },
          "Vergi Kimlik Numarası": {
            en: "Invalid Tax Identification Number.",
            tr: "Geçersiz Vergi Kimlik Numarası.",
            status: 400,
          },
          "T.C. Kimlik": {
            en: "Invalid Republic of Turkey Identity Number.",
            tr: "Geçersiz T.C. Kimlik Numarası.",
            status: 400,
          },
          VKN: {
            en: "Invalid VKN format.",
            tr: "Geçersiz VKN formatı.",
            status: 400,
          },
          TCKN: {
            en: "Invalid TCKN format.",
            tr: "Geçersiz TCKN formatı.",
            status: 400,
          },
          "Şirket unvanı": {
            en: "Company name must be at least 2 characters.",
            tr: "Şirket unvanı en az 2 karakter olmalıdır.",
            status: 400,
          },
          "Vergi dairesi": {
            en: "Tax office must be at least 2 characters.",
            tr: "Vergi dairesi en az 2 karakter olmalıdır.",
            status: 400,
          },
          "Geçersiz istek": {
            en: "Invalid company verification request.",
            tr: "Geçersiz şirket doğrulama isteği.",
            status: 400,
          },
        },
      }
    );
  }
}
