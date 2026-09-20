import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { MilestoneService } from "@/src/modules/engagements/milestone-service";
import { IpAssignmentDeedEngine } from "@/src/modules/engagements/ip-assignment/ip-assignment-engine";
import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const isEn = req.headers.get("x-locale") === "en";
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const ip = getClientIp(req);
    const access = await evaluateSecurityAccessAsync({
      ip,
      purpose: "work:milestone:ip-deed",
      subject: session.userId,
      limit: 60,
      windowMs: 60 * 1000,
      isEn,
    });
    if (!access.allowed) {
      return access.response;
    }

    const { id: engagementId, milestoneId } = await params;
    const deed = await MilestoneService.getIpAssignmentDeed(
      engagementId,
      milestoneId,
      session.userId
    );

    if (!deed) {
      return NextResponse.json(
        {
          error: isEn
            ? "IP Assignment Deed not found or milestone is not yet confirmed paid."
            : "Fikri Mülkiyet Devir Senedi bulunamadı veya hakediş henüz teyit edilmedi.",
        },
        { status: 404 }
      );
    }

    const markdown = IpAssignmentDeedEngine.formatDeedMarkdown(deed);
    const html = IpAssignmentDeedEngine.formatDeedHtml(deed);
    const verification = IpAssignmentDeedEngine.verifyDeed(deed);

    return NextResponse.json({
      success: true,
      deed,
      markdown,
      html,
      verification,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve IP deed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
