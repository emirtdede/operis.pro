import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ChangeRequestService } from "@/src/modules/engagements/change-request-service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isEnHeader = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:change-requests:get",
    subject: normalizeIp(ip),
    limit: 120,
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
    const summary = await ChangeRequestService.getChangeRequests(session.userId, id);

    return NextResponse.json({
      success: true,
      ...summary,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isEnHeader = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:change-requests:create",
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

    const { title, description, reason, additionalBudget, currency, additionalDays } = body;

    if (!title || !description || !reason) {
      return NextResponse.json(
        {
          error: isEnHeader
            ? "Missing required fields (title, description, reason)."
            : "Lütfen zorunlu alanları (başlık, açıklama, gerekçe) doldurun.",
        },
        { status: 400 }
      );
    }

    const record = await ChangeRequestService.createChangeRequest({
      engagementId: id,
      requesterUserId: session.userId,
      title,
      description,
      reason,
      additionalBudget: Number(additionalBudget) || 0,
      currency: currency || "TRY",
      additionalDays: Number(additionalDays) || 0,
    });

    return NextResponse.json({
      success: true,
      changeRequest: record,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    if (message === "ACTIVE_CHANGE_REQUEST_EXISTS") {
      return NextResponse.json(
        {
          error: isEnHeader
            ? "An active change request is already pending. Please resolve it first."
            : "Bu iş birliği için halihazırda onay bekleyen bir değişiklik talebi bulunmaktadır.",
        },
        { status: 409 }
      );
    }
    if (message === "ENGAGEMENT_NOT_FOUND" || message === "UNAUTHORIZED_USER") {
      return NextResponse.json(
        {
          error: isEnHeader
            ? "Unauthorized or engagement not found."
            : "İş birliği bulunamadı veya yetkiniz yok.",
        },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
