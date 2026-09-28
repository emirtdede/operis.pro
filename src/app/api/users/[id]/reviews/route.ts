import { NextResponse } from "next/server";
import { ReviewService } from "@/src/modules/reviews/service";
import { ProfileService } from "@/src/modules/profiles/service";
import { handleApiError } from "@/src/lib/api/error-response";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isEn = req.headers.get("x-locale") === "en";

  try {
    const { id } = await params;
    let targetUserId = id;

    // Check if `id` is a handle rather than a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      const profile = await ProfileService.getPublicProfileByHandle(id);
      if (!profile) {
        return NextResponse.json(
          { error: isEn ? "Profile not found" : "Profil bulunamadı" },
          { status: 404 }
        );
      }
      targetUserId = profile.userId;
    }

    const reviewsSummary = await ReviewService.getReviewsForUser(targetUserId);
    return NextResponse.json({ success: true, reviewsSummary });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to fetch reviews",
        tr: "Değerlendirmeler alınamadı",
      },
      { isEn, logPrefix: "[User Reviews GET Error]", status: 500 }
    );
  }
}
