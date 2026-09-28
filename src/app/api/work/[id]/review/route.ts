import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ReviewService } from "@/src/modules/reviews/service";
import { handleApiError } from "@/src/lib/api/error-response";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const status = await ReviewService.getEngagementReviewStatus(id, session.userId);
    return NextResponse.json({ success: true, status });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to load review status",
        tr: "Değerlendirme durumu yüklenemedi",
      },
      { isEn: false, logPrefix: "[Review Status GET Error]", status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const headerLocale = req.headers.get("x-locale");
  let isEn = headerLocale === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:review",
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
    if (!session) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    if (body?.locale === "en") isEn = true;

    const overallRating = Number(body.overallRating);
    const communicationRating = Number(body.communicationRating);
    const qualityRating = Number(body.qualityRating);
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";

    if (!overallRating || !communicationRating || !qualityRating) {
      return NextResponse.json(
        {
          error: isEn
            ? "All rating dimensions (overall, communication, quality) are required."
            : "Lütfen genel, iletişim ve iş kalitesi puanlarının tümünü verin.",
        },
        { status: 400 }
      );
    }

    if (!comment) {
      return NextResponse.json(
        { error: isEn ? "Review text is required." : "Değerlendirme metni zorunludur." },
        { status: 400 }
      );
    }

    const review = await ReviewService.createReview({
      engagementId: id,
      authorUserId: session.userId,
      overallRating,
      communicationRating,
      qualityRating,
      comment,
      tags: Array.isArray(body.tags) ? body.tags : [],
      endorsedSkills: Array.isArray(body.endorsedSkills) ? body.endorsedSkills : [],
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (err: unknown) {
    console.error("[Review Submit POST Error]:", err);
    const rawMessage = err instanceof Error ? err.message : "";
    const KNOWN_CODES = [
      "REVIEW_TOO_SHORT",
      "REVIEW_TOO_LONG",
      "EMOJIS_FORBIDDEN",
      "PROFANITY_OR_INAPPROPRIATE_CONTENT",
      "ENGAGEMENT_NOT_COMPLETED",
      "REVIEW_WINDOW_EXPIRED",
      "DUPLICATE_REVIEW",
      "UNAUTHORIZED_PARTICIPANT",
    ] as const;

    const matchedCode = KNOWN_CODES.find((c) => rawMessage === c);

    if (matchedCode) {
      let errorMessage = isEn
        ? "An error occurred while submitting your review."
        : "Değerlendirme kaydedilirken bir hata oluştu.";

      if (matchedCode === "REVIEW_TOO_SHORT") {
        errorMessage = isEn
          ? "Review must be at least 20 characters."
          : "Değerlendirmeniz en az 20 karakter olmalıdır.";
      } else if (matchedCode === "REVIEW_TOO_LONG") {
        errorMessage = isEn
          ? "Review cannot exceed 1000 characters."
          : "Değerlendirmeniz en fazla 1000 karakter olabilir.";
      } else if (matchedCode === "EMOJIS_FORBIDDEN") {
        errorMessage = isEn
          ? "Emojis are not permitted in verified reviews."
          : "Platform kuralları gereği doğrulanmış değerlendirmelerde emoji kullanılamaz.";
      } else if (matchedCode === "PROFANITY_OR_INAPPROPRIATE_CONTENT") {
        errorMessage = isEn
          ? "Review contains inappropriate content violating community guidelines."
          : "Değerlendirmeniz topluluk kurallarımıza aykırı uygunsuz ifadeler içerdiği için kaydedilemedi.";
      } else if (matchedCode === "ENGAGEMENT_NOT_COMPLETED") {
        errorMessage = isEn
          ? "Reviews can only be submitted for completed projects."
          : "Yalnızca karşılıklı tamamlanan projeler için değerlendirme yapılabilir.";
      } else if (matchedCode === "REVIEW_WINDOW_EXPIRED") {
        errorMessage = isEn
          ? "The 14-day review window for this project has expired."
          : "Bu proje için 14 günlük değerlendirme penceresi sona ermiştir.";
      } else if (matchedCode === "DUPLICATE_REVIEW") {
        errorMessage = isEn
          ? "You have already submitted a review for this project."
          : "Bu proje için zaten bir değerlendirme gönderdiniz.";
      } else if (matchedCode === "UNAUTHORIZED_PARTICIPANT") {
        errorMessage = isEn
          ? "You are not an authorized participant of this project."
          : "Bu proje için değerlendirme yapma yetkiniz bulunmamaktadır.";
      }

      return NextResponse.json({ error: errorMessage, code: matchedCode }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: isEn
          ? "An error occurred while submitting your review."
          : "Değerlendirme kaydedilirken bir hata oluştu.",
        code: "REVIEW_FAILED",
      },
      { status: 500 }
    );
  }
}
