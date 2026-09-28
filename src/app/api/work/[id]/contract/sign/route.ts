import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ContractSigningService } from "@/src/modules/contracts/contract-signing-service";
import { handleApiError } from "@/src/lib/api/error-response";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isEnHeader = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "contract:sign",
    subject: normalizeIp(ip),
    limit: 15,
    windowMs: 60 * 1000,
    isEn: isEnHeader,
  });

  if (!access.allowed) {
    return access.response;
  }

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEnHeader ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const {
      role,
      signerName,
      signatureType,
      signatureDataUrl,
      legalAcknowledged,
      selectedContracts,
      expectedVersion,
    } = body;

    if (!signerName || typeof signerName !== "string" || signerName.trim().length < 2) {
      return NextResponse.json(
        {
          error: isEnHeader
            ? "Valid signer full name is required."
            : "Geçerli bir imzalayan isim/unvanı gereklidir.",
        },
        { status: 400 }
      );
    }

    if (!legalAcknowledged) {
      return NextResponse.json(
        {
          error: isEnHeader
            ? "You must accept the Operis Platform liability waiver before executing contracts."
            : "Sözleşmeyi imzalamak için Operis Platform Sorumsuzluk ve Dava Muafiyeti klozunu onaylamanız zorunludur.",
        },
        { status: 400 }
      );
    }

    if (!signatureDataUrl || typeof signatureDataUrl !== "string") {
      return NextResponse.json(
        { error: isEnHeader ? "Signature data is required." : "İmza verisi gereklidir." },
        { status: 400 }
      );
    }

    const result = await ContractSigningService.submitSignature({
      engagementId: id,
      userId: session.userId,
      role:
        role === "CLIENT" ? "CLIENT" : role === "CONTRACTOR" ? "CONTRACTOR" : ("CLIENT" as const),
      signerName: signerName.trim(),
      signatureType: signatureType === "UPLOADED" ? "UPLOADED" : "DRAWN",
      signatureDataUrl,
      clientIp: ip,
      legalAcknowledged: Boolean(legalAcknowledged),
      selectedContracts,
      expectedVersion: typeof expectedVersion === "number" ? expectedVersion : undefined,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to submit signature.",
        tr: "İmza sisteme kaydedilemedi.",
      },
      {
        isEn: isEnHeader,
        logPrefix: "[Contract Sign Error]",
        status: 500,
        allowedMessages: {
          CONCURRENCY_CONFLICT: {
            en: "Contract has already been signed or is concurrently locked.",
            tr: "Sözleşme zaten imzalanmış veya işlem kilitlidir.",
            status: 409,
          },
          değiştirilemez: {
            en: "Contract has already been finalized and cannot be modified.",
            tr: "Sözleşme kesinleşmiş olup üzerinde değişiklik yapılamaz.",
            status: 409,
          },
          zaten: {
            en: "Contract has already been signed.",
            tr: "Sözleşme zaten imzalanmış.",
            status: 409,
          },
          already: {
            en: "Contract has already been signed.",
            tr: "Sözleşme zaten imzalanmış.",
            status: 409,
          },
          Yetkisiz: {
            en: "Unauthorized to sign this contract.",
            tr: "Bu sözleşmeyi imzalama yetkiniz bulunmamaktadır.",
            status: 403,
          },
          Unauthorized: {
            en: "Unauthorized to sign this contract.",
            tr: "Bu sözleşmeyi imzalama yetkiniz bulunmamaktadır.",
            status: 403,
          },
          "Güvenlik ihlali": {
            en: "Security violation detected during signing.",
            tr: "İmzalama sırasında güvenlik ihlali tespit edildi.",
            status: 403,
          },
          INVALID_SIGNATURE: {
            en: "Invalid signature payload or biometric timestamp.",
            tr: "Geçersiz imza verisi veya biyometrik doğrulama.",
            status: 400,
          },
          geçersiz: {
            en: "Invalid signature payload.",
            tr: "Geçersiz imza verisi.",
            status: 400,
          },
        },
      }
    );
  }
}
