import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { OfferService } from "@/src/modules/offers/service";
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
    let message = isEn ? "Failed to load negotiation timeline" : "Pazarlık geçmişi yüklenemedi";
    if (err instanceof Error) {
      message = err.message;
    }
    let status = 500;
    if (message.includes("Unauthorized")) {
      status = 403;
    } else if (message.includes("not found")) {
      status = 404;
    }
    return NextResponse.json({ error: message }, { status });
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
    let message = isEn ? "Failed to submit counter-offer" : "Karşı teklif iletilemedi";
    if (err instanceof Error) {
      message = err.message;
    }
    const status = message.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
