import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { OfferService } from "@/src/modules/offers/service";
import { handleApiError } from "@/src/lib/api/error-response";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(req);
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "offer:counter:timeline",
    subject: normalizeIp(ip),
    limit: 60,
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

    const { id } = await params;
    const timeline = await OfferService.getCounterNegotiationTimeline(session.userId, id);

    return NextResponse.json({ success: true, ...timeline }, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to load negotiation timeline",
        tr: "Pazarlık geçmişi yüklenemedi",
      },
      {
        isEn,
        logPrefix: "[Offer Counter GET Error]",
        status: 500,
        allowedMessages: {
          Unauthorized: { en: "Unauthorized", tr: "Yetkisiz erişim", status: 403 },
          "not found": { en: "Offer not found", tr: "Teklif bulunamadı", status: 404 },
        },
      }
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(req);
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "offer:counter:submit",
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
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const counterProposal = await OfferService.submitCounterOffer(session.userId, {
      offerId: id,
      budgetMin: body.budgetMin,
      budgetMax: body.budgetMax,
      estimatedDurationValue: Number(body.estimatedDurationValue),
      estimatedDurationUnit: body.estimatedDurationUnit,
      message: body.message,
      expectedRound: body.expectedRound !== undefined ? Number(body.expectedRound) : undefined,
    });

    return NextResponse.json({ success: true, counterProposal }, { status: 201 });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to submit counter-offer",
        tr: "Karşı teklif iletilemedi",
      },
      {
        isEn,
        logPrefix: "[Offer Counter POST Error]",
        status: 500,
        allowedMessages: {
          Unauthorized: { en: "Unauthorized", tr: "Yetkisiz erişim", status: 403 },
          CONCURRENCY_CONFLICT: {
            en: "Offer was updated by another party",
            tr: "Teklif başka bir işlemle güncellendi",
            status: 409,
          },
        },
      }
    );
  }
}
