import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ChangeRequestService } from "@/src/modules/engagements/change-request-service";
import { handleApiError } from "@/src/lib/api/error-response";
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
    purpose: "work:change-requests:cancel",
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

    const cancelled = await ChangeRequestService.cancelChangeRequest(session.userId, crId, id);

    return NextResponse.json({
      success: true,
      changeRequest: cancelled,
    });
  } catch (error: unknown) {
    return handleApiError(
      error,
      {
        en: "Failed to cancel change request",
        tr: "Değişiklik talebi iptal edilemedi",
      },
      {
        isEn: isEnHeader,
        logPrefix: "[Change Request Cancel Error]",
        status: 500,
        allowedMessages: {
          CHANGE_REQUEST_NOT_PENDING: {
            en: "Change request is no longer pending.",
            tr: "Değişiklik talebi artık beklemede değil.",
            status: 409,
          },
          UNAUTHORIZED_USER: {
            en: "Unauthorized or request not found.",
            tr: "Yetkisiz işlem veya talep bulunamadı.",
            status: 403,
          },
          CHANGE_REQUEST_NOT_FOUND: {
            en: "Unauthorized or request not found.",
            tr: "Yetkisiz işlem veya talep bulunamadı.",
            status: 403,
          },
        },
      }
    );
  }
}
