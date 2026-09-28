import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/src/modules/auth/session";
import { ListingService } from "@/src/modules/listings/service";
import { ReviewService } from "@/src/modules/reviews/service";
import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";
import { handleApiError } from "@/src/lib/api/error-response";

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
    if (err instanceof z.ZodError) {
      const fallbackMsg = isEn ? "Form validation error" : "Form doğrulama hatası";
      return NextResponse.json({ error: err.issues[0]?.message || fallbackMsg }, { status: 400 });
    }

    return handleApiError(
      err,
      {
        en: "Failed to publish listing",
        tr: "İlan yayınlanamadı",
      },
      { isEn, logPrefix: "[Listings Publish POST Error]", status: 500 }
    );
  }
}
