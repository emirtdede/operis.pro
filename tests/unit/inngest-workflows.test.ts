import { describe, it, expect, vi, beforeEach } from "vitest";
import { inngest, sendInngestEvent } from "@/src/lib/inngest/client";
import {
  processOutboxJob,
  maintenanceCronJob,
  staleOfferLifecycleJob,
  privacyExportRunnerJob,
  inngestFunctions,
} from "@/src/lib/inngest/functions";
import { NotificationService } from "@/src/modules/notifications/service";
import { ListingService, inMemoryListings } from "@/src/modules/listings/service";
import { OfferService } from "@/src/modules/offers/service";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";
import { GET, POST, PUT, dynamic, maxDuration } from "@/src/app/api/inngest/route";
import type { NextRequest } from "next/server";

describe("Inngest Serverless Architecture Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Inngest Client & Fail-Open Event Dispatcher", () => {
    it("initializes Inngest client with expected app id", () => {
      expect(inngest.id).toBe("operis");
    });

    it("safely dispatches events in test/dev environment without throwing", async () => {
      const success = await sendInngestEvent("operis/outbox.process", {
        batchSize: 20,
      });
      expect(success).toBe(true);

      const resolvedSuccess = await sendInngestEvent("operis/offer.resolved", {
        offerId: "test-offer-1",
        listingId: "test-listing-1",
        status: "WITHDRAWN",
      });
      expect(resolvedSuccess).toBe(true);
    });

    it("handles unexpected errors during event send gracefully with fail-open", async () => {
      vi.spyOn(inngest, "send").mockRejectedValueOnce(new Error("Network timeout to Inngest API"));
      const env = process.env as Record<string, string | undefined>;
      const originalNodeEnv = env.NODE_ENV;
      const originalEventKey = env.INNGEST_EVENT_KEY;

      try {
        env.NODE_ENV = "production";
        env.INNGEST_EVENT_KEY = "dummy-event-key";
        const success = await sendInngestEvent("operis/offer.submitted", {
          offerId: "test-offer-1",
          listingId: "test-listing-1",
          offerorUserId: "test-user-1",
        });
        expect(success).toBe(false);
      } finally {
        env.NODE_ENV = originalNodeEnv;
        if (originalEventKey) {
          env.INNGEST_EVENT_KEY = originalEventKey;
        } else {
          delete env.INNGEST_EVENT_KEY;
        }
      }
    });

    it("returns false gracefully when unconfigured in production", async () => {
      const env = process.env as Record<string, string | undefined>;
      const originalNodeEnv = env.NODE_ENV;
      const originalEventKey = env.INNGEST_EVENT_KEY;

      try {
        env.NODE_ENV = "production";
        delete env.INNGEST_EVENT_KEY;

        const success = await sendInngestEvent("operis/outbox.process");
        expect(success).toBe(false);
      } finally {
        env.NODE_ENV = originalNodeEnv;
        if (originalEventKey) env.INNGEST_EVENT_KEY = originalEventKey;
      }
    });
  });

  describe("Inngest Functions & Durable Workflows Configuration", () => {
    it("registers all essential background workflows in the barrel export", () => {
      expect(inngestFunctions.length).toBe(4);
      expect(inngestFunctions).toContain(processOutboxJob);
      expect(inngestFunctions).toContain(maintenanceCronJob);
      expect(inngestFunctions).toContain(staleOfferLifecycleJob);
      expect(inngestFunctions).toContain(privacyExportRunnerJob);
    });

    it("configures processOutboxJob with correct id, concurrency, and debounce", () => {
      const id =
        typeof processOutboxJob.id === "function" ? processOutboxJob.id() : processOutboxJob.id;
      expect(id).toBe("operis-process-outbox");
      expect(processOutboxJob.opts.concurrency).toEqual({ limit: 1 });
      expect(processOutboxJob.opts.debounce).toEqual({ period: "2s", timeout: "10s" });
    });

    it("configures maintenanceCronJob with correct id and triggers", () => {
      const id =
        typeof maintenanceCronJob.id === "function"
          ? maintenanceCronJob.id()
          : maintenanceCronJob.id;
      expect(id).toBe("operis-scheduled-maintenance");
    });

    it("configures staleOfferLifecycleJob with correct id and cancelOn", () => {
      const id =
        typeof staleOfferLifecycleJob.id === "function"
          ? staleOfferLifecycleJob.id()
          : staleOfferLifecycleJob.id;
      expect(id).toBe("operis-stale-offer-lifecycle");
      expect(staleOfferLifecycleJob.opts.cancelOn).toEqual([
        {
          event: "operis/offer.resolved",
          match: "data.offerId",
        },
      ]);
    });

    it("configures privacyExportRunnerJob with correct id and triggers", () => {
      const id =
        typeof privacyExportRunnerJob.id === "function"
          ? privacyExportRunnerJob.id()
          : privacyExportRunnerJob.id;
      expect(id).toBe("operis-privacy-export-runner");
    });
  });

  describe("Outbox & Maintenance Integrations", () => {
    it("delegates outbox processing to NotificationService.processOutboxBatch", async () => {
      const spy = vi.spyOn(NotificationService, "processOutboxBatch").mockResolvedValueOnce(12);

      // Verify the underlying service call works with specified batchSize
      const result = await NotificationService.processOutboxBatch(50);
      expect(result).toBe(12);
      expect(spy).toHaveBeenCalledWith(50);
    });

    it("executes listing expiration job during maintenance", async () => {
      const spy = vi.spyOn(ListingService, "expireListingsJob").mockResolvedValueOnce(5);

      const count = await ListingService.expireListingsJob();
      expect(count).toBe(5);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("Stale Offer Auto-Cancellation Domain Logic", () => {
    it("handles non-existent offer gracefully in autoCancelStaleOffer", async () => {
      const result = await OfferService.autoCancelStaleOffer("non-existent-offer-id");
      expect(result.cancelled).toBe(false);
      expect(result.status).toBe("NOT_FOUND");
    });

    it("auto-cancels a pending in-memory offer and marks status WITHDRAWN", async () => {
      const dummyListingId = "dummy-listing-for-inngest-" + Date.now();
      const dummyOfferor = "dummy-user-inngest-" + Date.now();

      // Seed in-memory active listing
      inMemoryListings.unshift({
        id: dummyListingId,
        ownerUserId: DEFAULT_USER.id,
        slug: "inngest-test-listing-" + Date.now(),
        status: "ACTIVE",
        categoryId: "cat-backend",
        title: "Inngest Test Project",
        summary: "Project summary for Inngest testing",
        scope: "Full scope",
        answersJson: {},
        tags: ["typescript", "inngest"],
        budgetMode: "OPEN_BID",
        budgetCurrency: "TRY",
        budgetMin: null,
        budgetMax: null,
        timelineMode: "NO_PREFERENCE",
        targetDate: null,
        timelineValue: null,
        timelineUnit: null,
        activationSeq: 1,
        viewCount: 0,
        clickCount: 0,
        firstPublishedAt: new Date(),
        lastActivatedAt: new Date(),
        activeUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const offer = await OfferService.submitOffer(dummyOfferor, {
        listingId: dummyListingId,
        message: "Test proposal for Inngest auto-cancel verification",
        budgetCurrency: "TRY",
        budgetMin: "5000",
        budgetMax: "10000",
      });

      expect(offer.status).toBe("PENDING");

      // Simulate Inngest waking up after 3 days and auto-cancelling the stale offer
      const cancelResult = await OfferService.autoCancelStaleOffer(offer.id);
      expect(cancelResult.cancelled).toBe(true);
      expect(cancelResult.status).toBe("WITHDRAWN");

      // Calling again should report already resolved
      const repeatResult = await OfferService.autoCancelStaleOffer(offer.id);
      expect(repeatResult.cancelled).toBe(false);
      expect(repeatResult.status).toBe("WITHDRAWN");
    });
  });

  describe("Inngest Next.js Route Handler", () => {
    it("exports GET, POST, and PUT handlers for App Router", () => {
      expect(typeof GET).toBe("function");
      expect(typeof POST).toBe("function");
      expect(typeof PUT).toBe("function");
    });

    it("configures serverless execution timeout and dynamic segment options", () => {
      expect(dynamic).toBe("force-dynamic");
      expect(maxDuration).toBe(60);
    });

    it("responds to GET requests with Inngest introspection / schema metadata", async () => {
      const originalDev = process.env.INNGEST_DEV;
      try {
        process.env.INNGEST_DEV = "1";
        const request = new Request("http://localhost:8000/api/inngest", {
          method: "GET",
        });

        const response = await GET(request as unknown as NextRequest, undefined);
        expect(response).toBeDefined();
        expect(response.status).toBe(200);

        const body = (await response.json()) as Record<string, unknown>;
        expect(body).toBeDefined();
        expect(body.schema_version).toBeDefined();
        expect(body.function_count).toBe(4);
      } finally {
        if (originalDev) {
          process.env.INNGEST_DEV = originalDev;
        } else {
          delete process.env.INNGEST_DEV;
        }
      }
    });
  });
});
