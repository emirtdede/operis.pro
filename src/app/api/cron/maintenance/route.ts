import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { ListingService } from "@/src/modules/listings/service";
import { NotificationService } from "@/src/modules/notifications/service";
import { getSession } from "@/src/modules/auth/session";

export const dynamic = "force-dynamic";

/**
 * Scheduled background maintenance endpoint.
 * Expires overdue listings and processes pending outbox notifications.
 * Protected by CRON_SECRET authorization header or Admin session across all environments.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  try {
    let isAuthorized = false;

    if (cronSecret && authHeader) {
      const expectedHeader = `Bearer ${cronSecret}`;
      const providedBuffer = Buffer.from(authHeader);
      const expectedBuffer = Buffer.from(expectedHeader);

      if (
        providedBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(providedBuffer, expectedBuffer)
      ) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      const session = await getSession();
      if (session?.role === "ADMIN" || session?.role === "SECURITY_ADMIN") {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    const expiredCount = await ListingService.expireListingsJob();
    const expiringSoonNotified = await ListingService.notifyExpiringListings();
    const outboxProcessed = await NotificationService.processOutboxBatch(50);
    const { cleanupExpiredOtpChallenges } = await import("@/src/modules/auth/verification");
    const { cleanupExpiredRateLimits } = await import("@/src/lib/security/rate-limit");
    const { OfferService } = await import("@/src/modules/offers/service");
    const { PrivacyService } = await import("@/src/modules/privacy/service");
    const { ReviewService } = await import("@/src/modules/reviews/service");
    const cleanedOtp = await cleanupExpiredOtpChallenges(24);
    const cleanedRateLimits = await cleanupExpiredRateLimits();
    const cleanedIdempotencyKeys = await OfferService.cleanupExpiredIdempotencyKeys();
    const cleanedExportFiles = await PrivacyService.cleanupExpiredExportFiles();
    const processedExportJobs = await PrivacyService.processPendingExportJobs();
    const autoRevealedReviewsCount = await ReviewService.autoRevealExpiredReviews();

    return NextResponse.json(
      {
        success: true,
        executedAt: new Date().toISOString(),
        expiredListingsCount: expiredCount,
        expiringSoonNotifiedCount: expiringSoonNotified,
        outboxProcessedCount: outboxProcessed,
        cleanedOtpCount: cleanedOtp,
        cleanedRateLimitsCount: cleanedRateLimits,
        cleanedIdempotencyKeysCount: cleanedIdempotencyKeys,
        cleanedExportFilesCount: cleanedExportFiles,
        processedExportJobsCount: processedExportJobs,
        autoRevealedReviewsCount,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Maintenance job failure";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    return await GET(req);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Maintenance job failure";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
