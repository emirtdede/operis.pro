import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { MilestoneService } from "@/src/modules/engagements/milestone-service";
import { handleApiError } from "@/src/lib/api/error-response";
import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
      purpose: "work:ip-deeds",
      subject: session.userId,
      limit: 60,
      windowMs: 60 * 1000,
      isEn,
    });
    if (!access.allowed) {
      return access.response;
    }

    const { id: engagementId } = await params;
    const deeds = await MilestoneService.getEngagementIpDeeds(engagementId, session.userId);

    return NextResponse.json({
      success: true,
      engagementId,
      deeds,
      count: deeds.length,
    });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to retrieve engagement IP deeds",
        tr: "Fikri mülkiyet devir senetleri alınamadı",
      },
      { isEn, logPrefix: "[IP Deeds Error]", status: 500 }
    );
  }
}
