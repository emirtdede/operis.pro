import { Inngest } from "inngest";

export type OperisEvents = {
  "operis/outbox.process": {
    data?: {
      batchSize?: number;
      triggeredBy?: string;
    };
  };
  "operis/cron.maintenance": {
    data?: {
      source?: string;
    };
  };
  "operis/offer.submitted": {
    data: {
      offerId: string;
      listingId: string;
      offerorUserId: string;
      createdAt?: string;
    };
  };
  "operis/privacy.export-requested": {
    data: {
      jobId: string;
      userId: string;
    };
  };
  "operis/offer.resolved": {
    data: {
      offerId: string;
      listingId?: string;
      status: "ACCEPTED" | "REJECTED" | "WITHDRAWN" | "REJECTED_OTHER_SELECTED";
    };
  };
};

export const inngest = new Inngest({
  id: "operis",
  isDev: process.env.NODE_ENV !== "production" && !process.env.INNGEST_SIGNING_KEY,
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

/**
 * Safely dispatches an event to Inngest with fail-open resilience.
 * If Inngest is unreachable, unconfigured, or executing in unit test mode,
 * this function handles errors gracefully so core user operations are never blocked.
 */
export async function sendInngestEvent<T extends keyof OperisEvents>(
  name: T,
  data?: OperisEvents[T]["data"]
): Promise<boolean> {
  try {
    if (process.env.NODE_ENV === "test" && !process.env.INNGEST_EVENT_KEY) {
      return true;
    }

    // In production without an event key, fail-open gracefully
    if (!process.env.INNGEST_EVENT_KEY && process.env.NODE_ENV === "production") {
      return false;
    }

    await inngest.send({
      name,
      data: data ?? {},
    });
    return true;
  } catch (err) {
    console.warn(
      `[Inngest] Fail-open: Failed to dispatch event "${name}":`,
      err instanceof Error ? err.message : String(err)
    );
    return false;
  }
}
