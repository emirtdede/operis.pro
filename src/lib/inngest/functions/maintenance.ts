import { inngest } from "../client";
import { ListingService } from "@/src/modules/listings/service";
import { cleanupExpiredOtpChallenges } from "@/src/modules/auth/verification";
import { cleanupExpiredRateLimits } from "@/src/lib/security/rate-limit";
import { OfferService } from "@/src/modules/offers/service";
import { PrivacyService } from "@/src/modules/privacy/service";
import { ReviewService } from "@/src/modules/reviews/service";

/**
 * Scheduled system maintenance durable function.
 * Runs hourly to expire outdated listings, notify owners of expiring listings,
 * prune expired OTPs, purge rate limits, clean up idempotency keys, and handle data export jobs.
 * Each operation runs in an isolated step, ensuring partial failures do not block other tasks.
 */
export const maintenanceCronJob = inngest.createFunction(
  {
    id: "operis-scheduled-maintenance",
    name: "Operis: Scheduled System Maintenance",
    triggers: [{ cron: "0 * * * *" }, { event: "operis/cron.maintenance" }],
    retries: 2,
  },
  async ({ step }) => {
    const expiredListings = await step.run("expire-listings", async () => {
      return await ListingService.expireListingsJob();
    });

    const expiringSoonNotified = await step.run("notify-expiring-listings", async () => {
      return await ListingService.notifyExpiringListings();
    });

    const cleanedOtp = await step.run("cleanup-expired-otp", async () => {
      return await cleanupExpiredOtpChallenges(24);
    });

    const cleanedRateLimits = await step.run("cleanup-expired-rate-limits", async () => {
      return await cleanupExpiredRateLimits();
    });

    const cleanedIdempotencyKeys = await step.run("cleanup-idempotency-keys", async () => {
      return await OfferService.cleanupExpiredIdempotencyKeys();
    });

    const cleanedExportFiles = await step.run("cleanup-expired-export-files", async () => {
      return await PrivacyService.cleanupExpiredExportFiles();
    });

    const processedExportJobs = await step.run("process-pending-export-jobs", async () => {
      return await PrivacyService.processPendingExportJobs();
    });

    const autoRevealedReviews = await step.run("auto-reveal-expired-reviews", async () => {
      return await ReviewService.autoRevealExpiredReviews();
    });

    return {
      success: true,
      executedAt: new Date().toISOString(),
      results: {
        expiredListings,
        expiringSoonNotified,
        cleanedOtp,
        cleanedRateLimits,
        cleanedIdempotencyKeys,
        cleanedExportFiles,
        processedExportJobs,
        autoRevealedReviews,
      },
    };
  }
);
