import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { OfferService } from "@/src/modules/offers/service";
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
    purpose: "offer:reject",
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
    const body = await req.json();
    const offer = await OfferService.rejectOffer(session.userId, {
      offerId: id,
      rejectionCode: body.rejectionCode,
      rejectionNote: body.rejectionNote,
    });

    return NextResponse.json({ success: true, offer }, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to reject offer",
        tr: "Teklif reddedilemedi",
      },
      {
        isEn,
        logPrefix: "[Offer Reject POST Error]",
        status: 500,
        allowedMessages: {
          "Offer not found": {
            en: "Offer not found.",
            tr: "Teklif bulunamadı.",
            status: 404,
          },
          "Only the listing creator can reject": {
            en: "Unauthorized: Only the listing creator can reject this offer.",
            tr: "Yetkisiz işlem: Sadece ilan sahibi bu teklifi reddedebilir.",
            status: 403,
          },
          "not in PENDING status": {
            en: "This offer is not in pending status.",
            tr: "Bu teklif bekleme durumunda değil.",
            status: 400,
          },
        },
      }
    );
  }
}
