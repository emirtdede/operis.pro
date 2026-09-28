import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { SavedListingService } from "@/src/modules/listings/saved-service";
import { handleApiError } from "@/src/lib/api/error-response";

export async function GET(req: Request) {
  const isEn = req.headers.get("x-locale") === "en";
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = (searchParams.get("statusFilter") as "all" | "active" | "closed") || "all";
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 100), 1), 200);
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

    const items = await SavedListingService.getSavedListings(session.userId, {
      statusFilter,
      limit,
      offset,
    });

    return NextResponse.json({
      items,
      total: items.length,
    });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to fetch saved listings",
        tr: "Kaydedilen ilanlar alınamadı",
      },
      { isEn, logPrefix: "[Saved Listings GET Error]", status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const isEn = req.headers.get("x-locale") === "en";
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { listingId, notes } = body;

    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json(
        { error: "INVALID_BODY: listingId string is required." },
        { status: 400 }
      );
    }

    const result = await SavedListingService.toggleSave(
      session.userId,
      listingId,
      typeof notes === "string" ? notes : undefined
    );

    return NextResponse.json({
      success: true,
      saved: result.saved,
      id: result.id,
    });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to toggle saved listing",
        tr: "İlan kaydedilemedi",
      },
      {
        isEn,
        logPrefix: "[Saved Listing POST Error]",
        status: 500,
        allowedMessages: {
          MAX_SAVED_LIMIT_REACHED: {
            en: "Maximum saved listings limit reached",
            tr: "Maksimum kayıtlı ilan sınırına ulaşıldı",
            status: 400,
          },
          LISTING_NOT_FOUND: {
            en: "Listing not found",
            tr: "İlan bulunamadı",
            status: 400,
          },
          INVALID_ARGUMENTS: {
            en: "Invalid arguments provided",
            tr: "Geçersiz parametreler gönderildi",
            status: 400,
          },
        },
      }
    );
  }
}
