import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ContractSigningService } from "@/src/modules/contracts/contract-signing-service";
import { handleApiError } from "@/src/lib/api/error-response";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isEnHeader = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "contract:recommendations",
    subject: normalizeIp(ip),
    limit: 60,
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
    const url = new URL(req.url);
    const locale = url.searchParams.get("locale") || (isEnHeader ? "en" : "tr");

    const result = await ContractSigningService.getOrInitPackage(id, session.userId, locale);

    return NextResponse.json({
      success: true,
      package: result.packageDetails,
      recommendations: result.recommendations,
    });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to load contract recommendations.",
        tr: "Sözleşme önerileri yüklenemedi.",
      },
      { isEn: isEnHeader, logPrefix: "[Contract Recommendations GET Error]", status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isEnHeader = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "contract:select",
    subject: normalizeIp(ip),
    limit: 30,
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
    const selectedContracts = Array.isArray(body.selectedContracts)
      ? body.selectedContracts
      : ["CORE_SERVICE"];

    const updatedPackage = await ContractSigningService.updateSelectedContracts(
      id,
      session.userId,
      selectedContracts
    );

    return NextResponse.json({
      success: true,
      package: updatedPackage,
      signaturesInvalidated: Boolean(updatedPackage.signaturesInvalidated),
      noticeTr: updatedPackage.signaturesInvalidated
        ? "Sözleşme seçimi değiştiği için önceden atılmış olan imza(lar) güvenlik amacıyla iptal edildi. Lütfen güncel paketi yeniden imzalayın."
        : undefined,
      noticeEn: updatedPackage.signaturesInvalidated
        ? "Contract selection changed; prior signature(s) were invalidated for security. Please review and sign the updated package."
        : undefined,
    });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to update contract selection.",
        tr: "Sözleşme seçimi güncellenemedi.",
      },
      { isEn: isEnHeader, logPrefix: "[Contract Recommendations POST Error]", status: 500 }
    );
  }
}
