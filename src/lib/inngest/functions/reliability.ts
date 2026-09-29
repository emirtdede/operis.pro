import { getReliabilityHealth } from "@/src/modules/storage/reliability-health";
import { processSignatureStorageJobs } from "@/src/modules/storage/signature-cleanup";
import { inngest } from "../client";
import { processClerkRevocationJobs } from "@/src/modules/auth/clerk-revocation";

export const reliabilityJobs = inngest.createFunction(
  {
    id: "operis-reliability-jobs",
    retries: 2,
    triggers: [{ cron: "* * * * *" }],
  },
  async ({ step }) => ({
    cleaned: await step.run("signature-cleanup", () => processSignatureStorageJobs()),
    revoked: await step.run("clerk-revocations", () => processClerkRevocationJobs()),
    health: await step.run("reliability-health", async () => {
      const health = await getReliabilityHealth();
      if (health.deadCount || health.oldestPendingSeconds > 900)
        throw new Error("RELIABILITY_JOBS_REQUIRE_ATTENTION");
      return health;
    }),
  })
);
