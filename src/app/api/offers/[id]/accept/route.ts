import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { EngagementService } from "@/src/modules/engagements/service";
import { handleApiError } from "@/src/lib/api/error-response";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(req);
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "offer:accept",
    subject: normalizeIp(ip),
    limit: 30,
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
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const engagement = await EngagementService.acceptOffer(session.userId, id);

    return NextResponse.json({ success: true, engagement }, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to accept offer",
        tr: "Teklif kabul edilemedi",
      },
      {
        isEn,
        logPrefix: "[Offer Accept POST Error]",
        status: 500,
        allowedMessages: {
          "Offer not found": {
            en: "Offer not found.",
            tr: "Teklif bulunamadı.",
            status: 404,
          },
          "Only the listing creator can accept": {
            en: "Unauthorized: Only the listing creator can accept this offer.",
            tr: "Yetkisiz işlem: Sadece ilan sahibi bu teklifi kabul edebilir.",
            status: 403,
          },
          "not in PENDING status": {
            en: "This offer is not in pending status.",
            tr: "Bu teklif bekleme durumunda değil.",
            status: 400,
          },
          "no longer active": {
            en: "Listing is no longer active for offer acceptance.",
            tr: "İlan artık teklif kabulü için aktif değil.",
            status: 400,
          },
        },
      }
    );
  }
}
