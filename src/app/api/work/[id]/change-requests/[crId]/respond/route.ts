import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ChangeRequestService } from "@/src/modules/engagements/change-request-service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; crId: string }> }
) {
  const isEnHeader = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:change-requests:respond",
    subject: normalizeIp(ip),
    limit: 20,
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

    const { id, crId } = await params;
    const body = await req.json();
    const { action, rejectionReason, locale } = body;

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'APPROVE' or 'REJECT'." },
        { status: 400 }
      );
    }

    const updated = await ChangeRequestService.respondChangeRequest({
      changeRequestId: crId,
      engagementId: id,
      userId: session.userId,
      action,
      rejectionReason,
      locale: locale || (isEnHeader ? "en" : "tr"),
    });

    return NextResponse.json({
      success: true,
      changeRequest: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    if (message === "CHANGE_REQUEST_NOT_PENDING") {
      return NextResponse.json(
        {
          error: isEnHeader
            ? "Change request is no longer pending."
            : "Değişiklik talebi artık beklemede değil.",
        },
        { status: 409 }
      );
    }
    if (message === "CANNOT_APPROVE_OWN_REQUEST") {
      return NextResponse.json(
        {
          error: isEnHeader
            ? "You cannot approve your own change request. Only the counterparty can review."
            : "Kendi oluşturduğunuz değişiklik talebini onaylayamazsınız; onay muhataba aittir.",
        },
        { status: 403 }
      );
    }
    if (message === "UNAUTHORIZED_REVIEWER" || message === "CHANGE_REQUEST_NOT_FOUND") {
      return NextResponse.json(
        {
          error: isEnHeader
            ? "Unauthorized or request not found."
            : "Yetkisiz işlem veya talep bulunamadı.",
        },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
