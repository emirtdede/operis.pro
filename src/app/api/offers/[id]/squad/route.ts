import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { OfferService } from "@/src/modules/offers/service";
import { SquadRevenueEngine } from "@/src/modules/offers/squad-engine";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "offer:squad:get",
    subject: normalizeIp(ip),
    limit: 120,
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

    const { id: offerId } = await params;
    const offerDetails = await OfferService.getOfferById(session.userId, offerId);

    if (!offerDetails) {
      return NextResponse.json(
        { error: isEn ? "Offer not found" : "Teklif bulunamadı" },
        { status: 404 }
      );
    }

    const offer = offerDetails.offer;
    const squadMembers = await OfferService.getOfferSquadMembers(offerId);

    let budgetVal = 0;
    if (offer.budgetMax) {
      budgetVal = Number(offer.budgetMax);
    } else if (offer.budgetMin) {
      budgetVal = Number(offer.budgetMin);
    }
    const currency = offer.budgetCurrency || "TRY";

    const payouts = squadMembers.length > 0 && budgetVal > 0
      ? SquadRevenueEngine.calculatePayouts(budgetVal, currency, squadMembers)
      : [];

    return NextResponse.json({
      success: true,
      offerId,
      isSquadOffer: Boolean(offer.isSquadOffer),
      squadTitle: offer.squadTitle,
      squadMembers,
      payouts,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch squad details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
