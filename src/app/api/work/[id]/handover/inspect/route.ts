import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { EngagementService } from "@/src/modules/engagements/service";
import { DeliveryInspectorService } from "@/src/modules/engagements/delivery-inspector";
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
    purpose: "work:handover:inspect",
    subject: normalizeIp(ip),
    limit: 30, // 30 inspections per minute
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

    const { id: engagementId } = await params;
    if (!engagementId) {
      return NextResponse.json(
        { error: isEnHeader ? "Engagement ID is required." : "Çalışma alanı kimliği zorunludur." },
        { status: 400 }
      );
    }

    const details = await EngagementService.getEngagementDetails(session.userId, engagementId);
    if (!details || !details.engagement) {
      return NextResponse.json(
        {
          error: isEnHeader
            ? "Engagement not found or unauthorized."
            : "İş birliği bulunamadı veya erişim yetkiniz yok.",
        },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const repositoryUrl = typeof body?.repositoryUrl === "string" ? body.repositoryUrl.trim() : "";
    const liveUrl = typeof body?.liveUrl === "string" ? body.liveUrl.trim() : undefined;
    const commitHash = typeof body?.commitHash === "string" ? body.commitHash.trim() : undefined;
    const locale = (body?.locale === "en" || isEnHeader ? "en" : "tr") as "tr" | "en";

    if (!repositoryUrl) {
      return NextResponse.json(
        {
          error: isEnHeader
            ? "Repository URL is required for inspection."
            : "Denetim için kaynak kod deposu URL'si zorunludur.",
        },
        { status: 400 }
      );
    }

    const report = await DeliveryInspectorService.inspectDelivery({
      liveUrl,
      repositoryUrl,
      commitHash,
      locale,
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
