import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ListingService } from "@/src/modules/listings/service";
import { ReviewService } from "@/src/modules/reviews/service";
import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "listing:publish",
    limit: 15,
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

    const pendingReviews = await ReviewService.checkPendingMandatoryReviews(session.userId);
    if (pendingReviews.length > 0 && pendingReviews[0]) {
      const pending = pendingReviews[0];
      return NextResponse.json(
        {
          error: isEn
            ? `Please submit your review for "${pending.projectTitle}" before publishing new listings.`
            : `Yeni bir ilan yayınlamadan önce lütfen tamamlanan "${pending.projectTitle}" projesi için değerlendirmenizi yapın.`,
          code: "PENDING_MANDATORY_REVIEW",
          pendingReview: pending,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const listing = await ListingService.publishListing(session.userId, body);

    return NextResponse.json({ success: true, listing }, { status: 201 });
  } catch (err: unknown) {
    let message = isEn ? "Failed to publish listing" : "İlan yayınlanamadı";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
