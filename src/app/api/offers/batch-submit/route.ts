import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { OfferService } from "@/src/modules/offers/service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "offer:batch",
    subject: normalizeIp(ip),
    limit: 10,
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
        {
          error: isEn
            ? "Please log in to submit batch proposals."
            : "Toplu teklif verebilmek için lütfen oturum açın.",
        },
        { status: 401 }
      );
    }

    const idempotencyHeader = req.headers.get("idempotency-key") || undefined;
    const body = await req.json();

    const payload = {
      ...body,
      idempotencyKey: body.idempotencyKey || idempotencyHeader,
    };

    const batchResponse = await OfferService.batchSubmitOffers(session.userId, payload, locale);

    // If all failed, return 422, if mixed or all success return 200
    const status = batchResponse.succeededCount > 0 ? 200 : 422;

    return NextResponse.json(batchResponse, { status });
  } catch (err: unknown) {
    let message = isEn
      ? "Batch proposal operation failed."
      : "Toplu teklif işlemi başarısız oldu.";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
