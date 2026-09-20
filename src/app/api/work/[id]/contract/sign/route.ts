import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ContractSigningService } from "@/src/modules/contracts/contract-signing-service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: isEnHeader ? "Valid signer full name is required." : "Geçerli bir imzalayan isim/unvanı gereklidir." },
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
      role: role === "CLIENT" ? "CLIENT" : "CONTRACTOR",
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
    let message = isEnHeader
      ? "Failed to submit signature."
      : "İmza sisteme kaydedilemedi.";
    if (err instanceof Error) {
      message = err.message;
    }

    const status = message.includes("CONCURRENCY_CONFLICT") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
