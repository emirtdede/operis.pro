import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { OfferService } from "@/src/modules/offers/service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(req);
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "offer:counter:withdraw",
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

    await params;
    const body = await req.json();

    const result = await OfferService.withdrawCounterOffer(session.userId, {
      counterProposalId: body.counterProposalId,
    });

    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (err: unknown) {
    let message = isEn ? "Failed to withdraw counter-offer" : "Karşı teklif geri çekilemedi";
    if (err instanceof Error) {
      message = err.message;
    }
    const status = message.includes("Unauthorized") || message.includes("Yalnızca") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
