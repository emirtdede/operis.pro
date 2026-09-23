import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { RetainerService } from "@/src/modules/engagements/retainer-service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isEn = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:retainer:get",
    subject: normalizeIp(ip),
    limit: 120,
    windowMs: 60 * 1000,
    isEn,
  });

  if (!access.allowed) {
    return access.response;
  }

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const { id: engagementId } = await params;
    const details = await RetainerService.getRetainerDetails(engagementId, session.userId);

    return NextResponse.json({ success: true, ...details });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch retainer details";
    const status = message.includes("Yetkisiz") || message.includes("Güvenlik ihlali") ? 403 : message.includes("bulunamadı") || message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isEn = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:retainer:post",
    subject: normalizeIp(ip),
    limit: 60,
    windowMs: 60 * 1000,
    isEn,
  });

  if (!access.allowed) {
    return access.response;
  }

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const { id: engagementId } = await params;
    const body = await req.json();
    const action = (body.action || "").toUpperCase();

    if (action === "PROPOSE") {
      const {
        planType = "HOURLY_POOL",
        monthlyPrice,
        currency = "TRY",
        includedHours = 0,
        overageHourlyRate = 0,
        rolloverPolicy = "NO_ROLLOVER",
        slaTier = "STANDARD",
        scopeDescription,
        cancellationNoticeDays = 15,
      } = body;

      if (!monthlyPrice || monthlyPrice <= 0) {
        return NextResponse.json(
          { error: isEn ? "Monthly price must be greater than zero." : "Aylık ücret sıfırdan büyük olmalıdır." },
          { status: 400 }
        );
      }

      if (!scopeDescription || scopeDescription.trim().length < 10) {
        return NextResponse.json(
          { error: isEn ? "Scope description must be at least 10 characters." : "Kapsam açıklaması en az 10 karakter olmalıdır." },
          { status: 400 }
        );
      }

      const result = await RetainerService.proposeRetainer({
        engagementId,
        requesterUserId: session.userId,
        planType,
        monthlyPrice: parseFloat(monthlyPrice),
        currency,
        includedHours: parseInt(includedHours, 10),
        overageHourlyRate: parseFloat(overageHourlyRate),
        rolloverPolicy,
        slaTier,
        scopeDescription: scopeDescription.trim(),
        cancellationNoticeDays: parseInt(cancellationNoticeDays, 10),
      });

      return NextResponse.json(result);
    }

    if (action === "ACTIVATE") {
      const result = await RetainerService.activateRetainer(engagementId, session.userId);
      return NextResponse.json(result);
    }

    if (action === "CANCEL") {
      const result = await RetainerService.cancelRetainer(engagementId, session.userId);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: isEn ? "Invalid action specified." : "Geçersiz işlem belirtildi." },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Retainer action failed";
    const status = message.includes("Yetkisiz") || message.includes("Güvenlik ihlali") ? 403 : message.includes("bulunamadı") || message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
