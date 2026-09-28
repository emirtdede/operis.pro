import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { ListingService } from "@/src/modules/listings/service";
import { NotificationService } from "@/src/modules/notifications/service";
import { getAdminSession } from "@/src/modules/admin/auth-guard";

export const dynamic = "force-dynamic";

/**
 * Scheduled background maintenance endpoint.
 * Expires overdue listings and processes pending outbox notifications.
 * Protected by CRON_SECRET authorization header (machine) or 2FA-verified Admin session (human fallback).
 */
async function handleMaintenance(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  try {
    let isAuthorized = false;

    // 1. Machine identity: Verify CRON_SECRET with timing-safe comparison
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

    // 2. Human operator fallback: Strictly enforce active admin session WITH 2FA verification
    if (!isAuthorized) {
      const adminAuth = await getAdminSession(["ADMIN", "SECURITY_ADMIN"]);
      if (adminAuth.isAdmin && adminAuth.session?.twoFactorVerified) {
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
    const { TrendingService } = await import("@/src/lib/search/trending-service");
    const cleanedOtp = await cleanupExpiredOtpChallenges(24);
    const cleanedRateLimits = await cleanupExpiredRateLimits();
    const cleanedIdempotencyKeys = await OfferService.cleanupExpiredIdempotencyKeys();
    const cleanedExportFiles = await PrivacyService.cleanupExpiredExportFiles();
    const processedExportJobs = await PrivacyService.processPendingExportJobs();
    const autoRevealedReviewsCount = await ReviewService.autoRevealExpiredReviews();
    const purgedTrends = await TrendingService.purgeExpiredTrends(30, 1000);

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
        cleanedSearchTrendsCount: purgedTrends.deletedDbRows + purgedTrends.prunedMemoryItems,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[Maintenance Cron Error] Job execution failed:", err);
    return NextResponse.json({ error: "Maintenance job execution failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handleMaintenance(req);
}

export async function POST(req: Request) {
  return handleMaintenance(req);
}
