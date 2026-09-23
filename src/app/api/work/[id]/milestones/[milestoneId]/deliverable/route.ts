import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { MilestoneService } from "@/src/modules/engagements/milestone-service";
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
        message: isEn ? "Milestone deliverable accepted successfully." : "Aşama teslimatı başarıyla onaylandı.",
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
    const message = err instanceof Error ? err.message : "Failed to update milestone deliverable";
    const status = message.includes("Yetkisiz") || message.includes("Güvenlik ihlali") ? 403 : message.includes("bulunamadı") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
