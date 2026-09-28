import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { OfferService } from "@/src/modules/offers/service";
import { handleApiError } from "@/src/lib/api/error-response";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isEn = req.headers.get("x-locale") === "en";
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: isEn ? "Missing offer ID" : "Teklif ID eksik" },
      { status: 400 }
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: isEn ? "Unauthorized" : "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const revisions = await OfferService.getOfferRevisions(session.userId, id);
    return NextResponse.json({ revisions });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to fetch revisions",
        tr: "Revizyonlar alınamadı",
      },
      {
        isEn,
        logPrefix: "[Offer Revisions GET Error]",
        status: 500,
        allowedMessages: {
          UNAUTHORIZED_OFFER_REVISIONS_VIEW: {
            en: "Unauthorized to view these revisions.",
            tr: "Bu revizyonları görüntüleme yetkiniz yok.",
            status: 403,
          },
        },
      }
    );
  }
}
