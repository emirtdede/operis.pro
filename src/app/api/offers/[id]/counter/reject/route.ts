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
    purpose: "offer:counter:reject",
    subject: normalizeIp(ip),
    limit: 20,
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

    await params;
    const body = await req.json();

    const result = await OfferService.rejectCounterOffer(session.userId, {
      counterProposalId: body.counterProposalId,
      rejectionNote: body.rejectionNote,
    });

    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to reject counter-offer",
        tr: "Karşı teklif reddedilemedi",
      },
      {
        isEn,
        logPrefix: "[Counter Reject POST Error]",
        status: 500,
        allowedMessages: {
          Unauthorized: {
            en: "Unauthorized to reject this counter-offer.",
            tr: "Bu karşı teklifi reddetme yetkiniz yok.",
            status: 403,
          },
          yalnızca: {
            en: "Unauthorized to reject this counter-offer.",
            tr: "Bu karşı teklifi reddetme yetkiniz yok.",
            status: 403,
          },
          "not found": {
            en: "Counter-offer not found.",
            tr: "Karşı teklif bulunamadı.",
            status: 400,
          },
          "not pending": {
            en: "Counter-offer is not pending.",
            tr: "Karşı teklif beklemede değil.",
            status: 400,
          },
          bulunamadı: {
            en: "Counter-offer not found.",
            tr: "Karşı teklif bulunamadı.",
            status: 400,
          },
        },
      }
    );
  }
}
