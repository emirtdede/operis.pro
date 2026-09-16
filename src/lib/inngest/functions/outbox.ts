import { inngest } from "../client";
import { NotificationService } from "@/src/modules/notifications/service";

/**
 * Inngest serverless background worker for processing transactional outbox notifications.
 * Runs on a 2-minute cron schedule and can also be triggered immediately via "operis/outbox.process".
 * Automatically retries up to 3 times with exponential backoff on transient errors (e.g. Resend rate limits or network issues).
 */
export const processOutboxJob = inngest.createFunction(
  {
    id: "operis-process-outbox",
    name: "Operis: Process Outbox Notifications",
    triggers: [{ cron: "*/2 * * * *" }, { event: "operis/outbox.process" }],
    retries: 3,
    concurrency: {
      limit: 1,
    },
    debounce: {
      period: "2s",
      timeout: "10s",
    },
  },
  async ({ event, step }) => {
    const rawBatchSize = (event.data as Record<string, unknown> | undefined)?.batchSize;
    const batchSize = typeof rawBatchSize === "number" && rawBatchSize > 0 ? rawBatchSize : 50;

    const processedCount = await step.run("dispatch-outbox-batch", async () => {
      return await NotificationService.processOutboxBatch(batchSize);
    });

    return {
      success: true,
      processedCount,
      timestamp: new Date().toISOString(),
    };
  }
);
