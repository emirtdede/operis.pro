import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ListingService } from "@/src/modules/listings/service";
import { handleApiError } from "@/src/lib/api/error-response";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isEn = req.headers.get("x-locale") !== "tr";
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: isEn ? "Missing listing ID" : "İlan ID eksik" },
      { status: 400 }
    );
  }

  const session = await getSession();
  const viewerUserId = session?.userId ?? null;
  const userRole = session?.role ?? undefined;

  try {
    const revisions = await ListingService.getListingRevisions(viewerUserId, id, userRole);
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
        logPrefix: "[Listing Revisions GET Error]",
        status: 500,
        allowedMessages: {
          UNAUTHORIZED_LISTING_REVISIONS_VIEW: {
            en: "Unauthorized to view revisions for this listing.",
            tr: "Bu ilanın revizyonlarını görüntüleme yetkiniz yok.",
            status: session ? 403 : 401,
          },
          LISTING_NOT_FOUND: {
            en: "Listing not found.",
            tr: "İlan bulunamadı.",
            status: 404,
          },
        },
      }
    );
  }
}
