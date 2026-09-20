import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/src/modules/auth/session";
import { OfferService } from "@/src/modules/offers/service";
import { ReviewService } from "@/src/modules/reviews/service";
import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "offer:submit",
    limit: 25,
    windowMs: 60 * 1000,
    isEn,
  });

  if (!access.allowed) {
    return access.response;
  }

  try {
    const session = await getSession();
    const body = await req.json();
    const locale = req.headers.get("x-locale") || body?.locale || "tr";
    const isEn = locale === "en";

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
            ? `Please submit your review for "${pending.projectTitle}" before submitting new offers.`
            : `Yeni bir teklif vermeden önce lütfen tamamlanan "${pending.projectTitle}" projesi için değerlendirmenizi yapın.`,
          code: "PENDING_MANDATORY_REVIEW",
          pendingReview: pending,
        },
        { status: 403 }
      );
    }

    const offer = await OfferService.submitOffer(session.userId, body);

    return NextResponse.json({ success: true, offer }, { status: 201 });
  } catch (err: unknown) {
    const locale = req.headers.get("x-locale") || "tr";
    const isEn = locale === "en";

    let message = isEn ? "Failed to submit offer." : "Teklif iletilemedi.";
    if (err instanceof z.ZodError) {
      message =
        err.issues[0]?.message || (isEn ? "Invalid proposal format." : "Geçersiz teklif formatı.");
    } else if (err instanceof Error) {
      const raw = err.message;
      if (raw.includes("Listing not found")) {
        message = isEn ? "Listing not found." : "İlan bulunamadı.";
      } else if (raw.includes("own listing")) {
        message = isEn
          ? "You cannot submit an offer on your own listing."
          : "Kendi ilanınıza teklif veremezsiniz.";
      } else if (raw.includes("not currently active")) {
        message = isEn
          ? "Listing is not currently active for offers."
          : "İlan şu anda teklif kabul etmiyor veya süresi dolmuş.";
      } else if (raw.includes("Cannot submit an offer to this listing")) {
        message = isEn
          ? "Cannot submit an offer to this listing."
          : "Bu ilana teklif verilemez (engelleme kısıtı).";
      } else if (raw.includes("already have an active pending offer")) {
        message = isEn
          ? "You already have an active pending offer on this listing."
          : "Bu ilana yönelik zaten aktif ve bekleyen bir teklifiniz bulunmaktadır.";
      } else if (raw.includes("after withdrawing")) {
        message = isEn
          ? "You cannot submit another offer after withdrawing during this activation cycle."
          : "Bu yayın döngüsünde teklifinizi geri çektiğiniz için yeni bir teklif iletemezsiniz.";
      } else if (raw.includes("e-posta adresinizi doğrulamanız")) {
        message = isEn
          ? "You must verify your email address before submitting an offer."
          : "Teklif verebilmek için önce e-posta adresinizi doğrulamanız gerekmektedir.";
      } else {
        message = raw;
      }
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
