import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { OfferService } from "@/src/modules/offers/service";
import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";
import { mapConcurrent } from "@/src/lib/async/concurrency";
import { handleApiError } from "@/src/lib/api/error-response";

const MAX_BULK_WITHDRAW_COUNT = 50;
const BATCH_CONCURRENCY_CHUNK_SIZE = 5;

export async function POST(req: Request) {
  const isEn = req.headers.get("x-locale") === "en";
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const ip = getClientIp(req);
    const access = await evaluateSecurityAccessAsync({
      ip,
      purpose: "offers:bulk-withdraw",
      subject: session.userId,
      limit: 15,
      windowMs: 60 * 1000,
    });
    if (!access.allowed) {
      return access.response;
    }

    const body = await req.json().catch(() => ({}));
    const { offerIds } = body;

    if (!Array.isArray(offerIds) || offerIds.length === 0) {
      return NextResponse.json(
        { error: "INVALID_BODY: offerIds array is required." },
        { status: 400 }
      );
    }

    const targetIds = offerIds.slice(0, MAX_BULK_WITHDRAW_COUNT);
    const successfulWithdrawals: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    // Process withdrawals with bounded concurrency of 5 to eliminate Vercel serverless timeouts
    await mapConcurrent(targetIds, BATCH_CONCURRENCY_CHUNK_SIZE, async (offerId) => {
      try {
        await OfferService.withdrawOffer(session.userId, offerId);
        successfulWithdrawals.push(offerId);
      } catch (err: unknown) {
        let itemError = isEn ? "Failed to withdraw" : "Geri çekilemedi";
        if (err instanceof Error) {
          if (err.message.includes("Offer not found")) {
            itemError = isEn ? "Offer not found." : "Teklif bulunamadı.";
          } else if (err.message.includes("Only pending offers can be withdrawn")) {
            itemError = isEn
              ? "Only pending offers can be withdrawn."
              : "Sadece bekleme durumundaki teklifler geri çekilebilir.";
          } else if (err.message.includes("Unauthorized")) {
            itemError = isEn ? "Unauthorized." : "Yetkisiz işlem.";
          }
        }
        errors.push({
          id: offerId,
          error: itemError,
        });
      }
    });

    return NextResponse.json({
      success: true,
      withdrawnCount: successfulWithdrawals.length,
      offerIds: successfulWithdrawals,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to bulk withdraw offers",
        tr: "Toplu teklif geri çekme işlemi başarısız oldu",
      },
      { isEn, logPrefix: "[Offers Bulk Withdraw POST Error]", status: 500 }
    );
  }
}
