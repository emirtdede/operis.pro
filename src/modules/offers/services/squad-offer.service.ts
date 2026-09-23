import crypto from "crypto";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { mapConcurrent } from "@/src/lib/async/concurrency";
import { BatchSubmitOffersInput, batchSubmitOffersSchema } from "../validation";
import type { SquadMemberDto } from "../squad-engine";
import {
  BatchOfferResponse,
  BatchOfferResultItem,
  inMemorySquadMembers,
  inMemoryBatchIdempotencyStore,
} from "./types";
import { OfferCreationService } from "./offer-creation.service";

export class SquadOfferService {
  static async getOfferSquadMembers(offerId: string): Promise<SquadMemberDto[]> {
    const inMem = inMemorySquadMembers.get(offerId);
    if (inMem && inMem.length > 0) {
      return inMem;
    }

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.offerSquadMembers)
        .where(eq(schema.offerSquadMembers.offerId, offerId));

      return rows.map((r) => ({
        id: r.id,
        offerId: r.offerId,
        displayName: r.displayName,
        roleTitle: r.roleTitle,
        revenueSharePercentage: Number(r.revenueSharePercentage),
        scopeSummary: r.scopeSummary,
        handleOrEmail: r.handleOrEmail,
        isLead: Boolean(r.isLead),
        userId: r.userId,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
      }));
    } catch {
      return inMemorySquadMembers.get(offerId) || [];
    }
  }

  /**
   * Submits batch proposals across multiple listings (max 5) with RFC 7807 / Envelope Multi-Status
   * response format, individual isolated sub-transactions, and idempotency protection.
   */
  static async batchSubmitOffers(
    offerorUserId: string,
    rawInput: BatchSubmitOffersInput,
    locale?: string,
    submitOfferFn?: typeof OfferCreationService.submitOffer
  ): Promise<BatchOfferResponse> {
    const input = batchSubmitOffersSchema.parse(rawInput);
    const isEn = locale === "en";

    if (input.items.length > 1 && input.capacityConfirmed === false) {
      throw new Error(
        isEn
          ? "You must confirm your delivery capacity when submitting multiple proposals simultaneously."
          : "Birden fazla ilana aynı anda teklif verirken teslimat kapasitenizi onaylamanız gerekmektedir."
      );
    }

    if (input.idempotencyKey) {
      const cached = inMemoryBatchIdempotencyStore.get(`${offerorUserId}:${input.idempotencyKey}`);
      if (cached) {
        return cached;
      }
    }

    const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      offerorUserId
    );
    const dbKey = input.idempotencyKey
      ? `batch:offers:${offerorUserId}:${input.idempotencyKey}`
      : null;

    if (dbKey && isUserUuid) {
      try {
        const db = getDb();
        const existingKey = await db
          .select()
          .from(schema.idempotencyKeys)
          .where(eq(schema.idempotencyKeys.key, dbKey))
          .limit(1);

        if (existingKey[0]) {
          if (existingKey[0].responseJson) {
            return existingKey[0].responseJson as BatchOfferResponse;
          }
          throw new Error(
            isEn
              ? "A batch submission with this idempotency key is currently processing."
              : "Bu idempotency anahtarıyla bir toplu teklif işlemi şu anda yürütülüyor."
          );
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        await db.insert(schema.idempotencyKeys).values({
          key: dbKey,
          userId: offerorUserId,
          action: "BATCH_SUBMIT_OFFERS",
          responseJson: null,
          createdAt: now,
          expiresAt,
        });
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          (err.message.includes("currently processing") ||
            err.message.includes("şu anda yürütülüyor"))
        ) {
          throw err;
        }
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: string }).code === "23505"
        ) {
          throw new Error(
            isEn
              ? "A batch submission with this idempotency key is already in progress or completed."
              : "Bu idempotency anahtarıyla bir toplu teklif işlemi zaten yürütülüyor veya tamamlandı.",
            { cause: err }
          );
        }
      }
    }

    const batchId = crypto.randomUUID();
    const results: BatchOfferResultItem[] = await mapConcurrent(
      input.items,
      3,
      async (item): Promise<BatchOfferResultItem> => {
        try {
          const createFn = submitOfferFn || OfferCreationService.submitOffer;
          const offer = await createFn(offerorUserId, item);
          return {
            listingId: item.listingId,
            status: "SUCCESS",
            offerId: offer.id,
            offer,
          };
        } catch (err: unknown) {
          const rawMessage = err instanceof Error ? err.message : "Teklif iletilemedi";
          let code = "SUBMISSION_FAILED";
          let message: string;

          if (rawMessage.includes("own listing") || rawMessage.includes("Kendi ilanınıza")) {
            code = "SELF_BIDDING_PROHIBITED";
            message = isEn
              ? "You cannot submit an offer on your own listing."
              : "Kendi ilanınıza teklif veremezsiniz.";
          } else if (
            rawMessage.includes("active for offers") ||
            rawMessage.includes("teklif kabul etmiyor")
          ) {
            code = "LISTING_NOT_ACTIVE";
            message = isEn
              ? "Listing is not currently active for offers."
              : "İlan şu anda teklif kabul etmiyor veya süresi dolmuş.";
          } else if (
            rawMessage.includes("Cannot submit an offer to this listing") ||
            rawMessage.includes("engelleme kısıtı")
          ) {
            code = "USER_BLOCKED";
            message = isEn
              ? "Cannot submit an offer to this listing."
              : "Bu ilana teklif verilemez (engelleme kısıtı).";
          } else if (
            rawMessage.includes("already have an active pending offer") ||
            rawMessage.includes("bekleyen bir teklifiniz")
          ) {
            code = "ALREADY_OFFERED";
            message = isEn
              ? "You already have an active pending offer on this listing."
              : "Bu ilana yönelik zaten aktif ve bekleyen bir teklifiniz bulunmaktadır.";
          } else if (
            rawMessage.includes("withdrawing during this activation cycle") ||
            rawMessage.includes("teklifinizi geri çektiğiniz")
          ) {
            code = "WITHDRAWN_IN_CYCLE";
            message = isEn
              ? "You cannot submit another offer after withdrawing during this activation cycle."
              : "Bu yayın döngüsünde teklifinizi geri çektiğiniz için yeni bir teklif iletemezsiniz.";
          } else if (
            rawMessage.includes("doğrulamanız gerekmektedir") ||
            rawMessage.includes("verify your email")
          ) {
            code = "EMAIL_VERIFICATION_REQUIRED";
            message = isEn
              ? "You must verify your email address before submitting an offer."
              : "Teklif verebilmek için önce e-posta adresinizi doğrulamanız gerekmektedir.";
          } else {
            message = rawMessage;
          }

          return {
            listingId: item.listingId,
            status: "FAILED",
            code,
            message,
          };
        }
      }
    );

    const succeededCount = results.filter((r) => r.status === "SUCCESS").length;
    const failedCount = results.filter((r) => r.status === "FAILED").length;

    const response: BatchOfferResponse = {
      batchId,
      total: results.length,
      succeededCount,
      failedCount,
      results,
    };

    if (input.idempotencyKey) {
      inMemoryBatchIdempotencyStore.set(`${offerorUserId}:${input.idempotencyKey}`, response);
    }

    if (dbKey && isUserUuid) {
      try {
        const db = getDb();
        await db
          .update(schema.idempotencyKeys)
          .set({ responseJson: response })
          .where(eq(schema.idempotencyKeys.key, dbKey));
      } catch (err) {
        console.error("Non-blocking idempotency update error:", err);
      }
    }

    return response;
  }
}
