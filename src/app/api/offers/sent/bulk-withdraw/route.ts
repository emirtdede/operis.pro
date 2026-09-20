import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { OfferService } from "@/src/modules/offers/service";
import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";

const MAX_BULK_WITHDRAW_COUNT = 50;
const BATCH_CONCURRENCY_CHUNK_SIZE = 5;

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Process withdrawals in bounded concurrent chunks of 5 to eliminate Vercel serverless timeouts
    for (let i = 0; i < targetIds.length; i += BATCH_CONCURRENCY_CHUNK_SIZE) {
      const chunk = targetIds.slice(i, i + BATCH_CONCURRENCY_CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (offerId) => {
          try {
            await OfferService.withdrawOffer(session.userId, offerId);
            successfulWithdrawals.push(offerId);
          } catch (err: unknown) {
            errors.push({
              id: offerId,
              error: err instanceof Error ? err.message : "Failed to withdraw",
            });
          }
        })
      );
    }

    return NextResponse.json({
      success: true,
      withdrawnCount: successfulWithdrawals.length,
      offerIds: successfulWithdrawals,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to bulk withdraw offers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
