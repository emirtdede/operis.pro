import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ReviewService } from "@/src/modules/reviews/service";
import { handleApiError } from "@/src/lib/api/error-response";

export async function GET(req: Request) {
  const isEn = req.headers.get("x-locale") === "en";

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const pending = await ReviewService.checkPendingMandatoryReviews(session.userId);
    return NextResponse.json({ success: true, pending, hasPending: pending.length > 0 });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to check pending reviews",
        tr: "Bekleyen değerlendirmeler kontrol edilemedi",
      },
      { isEn, logPrefix: "[Pending Reviews GET Error]", status: 500 }
    );
  }
}
