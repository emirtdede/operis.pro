import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { EndorsementService } from "@/src/modules/endorsements/service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const headerLocale = req.headers.get("x-locale");
  let isEn = headerLocale === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:endorse",
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

    if (!body || typeof body.content !== "string" || !body.content.trim()) {
      return NextResponse.json(
        { error: isEn ? "Endorsement text is required." : "Tavsiye metni zorunludur." },
        { status: 400 }
      );
    }

    const endorsement = await EndorsementService.createEndorsement({
      engagementId: id,
      authorUserId: session.userId,
      content: body.content,
    });

    return NextResponse.json({ success: true, endorsement }, { status: 201 });
  } catch (err: unknown) {
    console.error("[Endorse POST Error]:", err);
    const rawMessage = err instanceof Error ? err.message : "";
    const KNOWN_CODES = [
      "ENDORSEMENT_TOO_SHORT",
      "ENDORSEMENT_TOO_LONG",
      "EMOJIS_FORBIDDEN",
      "PROFANITY_OR_INAPPROPRIATE_CONTENT",
      "ENGAGEMENT_NOT_COMPLETED",
      "DUPLICATE_ENDORSEMENT",
      "UNAUTHORIZED_PARTICIPANT",
    ] as const;

    const matchedCode = KNOWN_CODES.find((c) => rawMessage === c);

    if (matchedCode) {
      let errorMessage = isEn
        ? "An error occurred while saving the endorsement."
        : "Tavsiye notu kaydedilirken bir hata oluştu.";

      if (matchedCode === "ENDORSEMENT_TOO_SHORT") {
        errorMessage = isEn
          ? "Endorsement must be at least 20 characters."
          : "Tavsiye notu en az 20 karakter olmalıdır.";
      } else if (matchedCode === "ENDORSEMENT_TOO_LONG") {
        errorMessage = isEn
          ? "Endorsement cannot exceed 500 characters."
          : "Tavsiye notu en fazla 500 karakter olabilir.";
      } else if (matchedCode === "EMOJIS_FORBIDDEN") {
        errorMessage = isEn
          ? "Emojis are not permitted in endorsements."
          : "Platform kuralları gereği tavsiye notlarında emoji kullanılamaz.";
      } else if (matchedCode === "PROFANITY_OR_INAPPROPRIATE_CONTENT") {
        errorMessage = isEn
          ? "Endorsement contains inappropriate content violating community guidelines."
          : "Tavsiye notunuz topluluk kurallarımıza aykırı uygunsuz ifadeler içerdiği için kaydedilemedi.";
      } else if (matchedCode === "ENGAGEMENT_NOT_COMPLETED") {
        errorMessage = isEn
          ? "Endorsements can only be submitted for completed projects."
          : "Yalnızca başarıyla tamamlanan iş birlikleri için tavsiye notu bırakılabilir.";
      } else if (matchedCode === "DUPLICATE_ENDORSEMENT") {
        errorMessage = isEn
          ? "You have already submitted an endorsement for this project."
          : "Bu proje için zaten bir tavsiye notu bıraktınız.";
      } else if (matchedCode === "UNAUTHORIZED_PARTICIPANT") {
        errorMessage = isEn
          ? "You are not authorized to endorse this project."
          : "Bu proje için tavsiye notu bırakma yetkiniz bulunmamaktadır.";
      }

      return NextResponse.json({ error: errorMessage, code: matchedCode }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: isEn
          ? "An error occurred while saving the endorsement."
          : "Tavsiye notu kaydedilirken bir hata oluştu.",
        code: "ENDORSEMENT_FAILED",
      },
      { status: 500 }
    );
  }
}
