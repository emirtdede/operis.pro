import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { MilestoneService } from "@/src/modules/engagements/milestone-service";
import { handleApiError } from "@/src/lib/api/error-response";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const isEn = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:milestones:deliverable:post",
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

    const { id: engagementId, milestoneId } = await params;
    const body = await req.json();
    const action = body.action || "UPDATE";

    if (action === "ACCEPT") {
      const result = await MilestoneService.acceptDeliverable(
        engagementId,
        milestoneId,
        session.userId
      );
      return NextResponse.json({
        success: true,
        milestone: result.milestone,
        message: isEn
          ? "Milestone deliverable accepted successfully."
          : "Aşama teslimatı başarıyla onaylandı.",
      });
    }

    // Default: UPDATE deliverable state (IN_PROGRESS, SUBMITTED)
    const result = await MilestoneService.updateDeliverable(
      engagementId,
      milestoneId,
      {
        status: body.status || "IN_PROGRESS",
        deliverableNote: body.deliverableNote,
        deliverableUrl: body.deliverableUrl,
        deliverableUrlType: body.deliverableUrlType,
        clientIp: ip,
      },
      session.userId
    );

    return NextResponse.json({
      success: true,
      milestone: result.milestone,
      message: isEn ? "Milestone progress updated." : "Aşama ilerleme durumu güncellendi.",
    });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to update milestone deliverable",
        tr: "Aşama teslimatı güncellenemedi",
      },
      {
        isEn,
        logPrefix: "[Milestone Deliverable Error]",
        status: 500,
        allowedMessages: {
          Yetkisiz: { en: "Unauthorized", tr: "Yetkisiz erişim", status: 403 },
          "Güvenlik ihlali": { en: "Security violation", tr: "Güvenlik ihlali", status: 403 },
          bulunamadı: { en: "Milestone not found", tr: "Aşama bulunamadı", status: 404 },
        },
      }
    );
  }
}
