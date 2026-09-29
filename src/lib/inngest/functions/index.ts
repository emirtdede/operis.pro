import { processOutboxJob } from "./outbox";
import { maintenanceCronJob } from "./maintenance";
import { staleOfferLifecycleJob } from "./stale-offers";
import { privacyExportRunnerJob } from "./privacy-export";
import { reliabilityJobs } from "./reliability";

export const inngestFunctions = [
  reliabilityJobs,
  processOutboxJob,
  maintenanceCronJob,
  staleOfferLifecycleJob,
  privacyExportRunnerJob,
];

export { processOutboxJob, maintenanceCronJob, staleOfferLifecycleJob, privacyExportRunnerJob };
