import { inngest } from "../client";
import { OfferService } from "@/src/modules/offers/service";

/**
 * Inngest durable delayed workflow for handling stale offers.
 * Triggered whenever a new offer is submitted ("operis/offer.submitted").
 * Pauses execution for 3 days via serverless step.sleep without keeping any process or server alive.
 * After 3 days, wakes up and verifies if the offer is still PENDING.
 * If untouched, automatically cancels/withdraws the offer and notifies both freelancer and employer.
 */
export const staleOfferLifecycleJob = inngest.createFunction(
  {
    id: "operis-stale-offer-lifecycle",
    name: "Operis: Stale Offer Auto-Cancel Lifecycle",
    triggers: [{ event: "operis/offer.submitted" }],
    cancelOn: [
      {
        event: "operis/offer.resolved",
        match: "data.offerId",
      },
    ],
    retries: 2,
  },
  async ({ event, step }) => {
    const rawData = event.data as Record<string, unknown> | undefined;
    const offerId = typeof rawData?.offerId === "string" ? rawData.offerId : "";

    if (!offerId) {
      return { success: false, reason: "MISSING_OFFER_ID" };
    }

    // Durable sleep: pauses execution in the cloud for 3 days with $0 resource consumption
    await step.sleep("wait-for-employer-response", "3 days");

    // Wake up after 3 days and execute the cancellation check
    const outcome = await step.run("check-and-cancel-stale-offer", async () => {
      return await OfferService.autoCancelStaleOffer(offerId);
    });

    return {
      success: true,
      offerId,
      outcome,
      processedAt: new Date().toISOString(),
    };
  }
);
