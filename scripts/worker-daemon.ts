const proc = process as unknown as { loadEnvFile?: (path?: string) => void };
if (typeof proc.loadEnvFile === "function") {
  try {
    proc.loadEnvFile(".env");
  } catch {
    // Non-fatal: Ignore missing .env in CI, Docker, or systemd environments
  }
}

import fs from "node:fs";
import { getDb, schema } from "../src/lib/db";
import { eq, sql } from "drizzle-orm";
import { ListingService } from "../src/modules/listings/service";
import { NotificationService } from "../src/modules/notifications/service";
import { OfferService } from "../src/modules/offers/service";
import { ExportJobManager } from "../src/modules/privacy/export-jobs";
import { cleanupExpiredOtpChallenges } from "../src/modules/auth/verification";
import { cleanupExpiredRateLimits } from "../src/lib/security/rate-limit";
import {
  DEFAULT_HEARTBEAT_FILE,
  WorkerHeartbeatV2,
  writeWorkerHeartbeat,
  evaluateWorkerHealth,
  probeDatabaseDirectly,
} from "./lib/worker-health";
import { WorkerDaemonExportState } from "./lib/daemon-export-state";

const HEARTBEAT_FILE = process.env.WORKER_HEARTBEAT_FILE || DEFAULT_HEARTBEAT_FILE;

// CLI Healthcheck option for Docker / systemd / Kubernetes probes (K01)
if (process.argv.includes("--healthcheck")) {
  try {
    if (!fs.existsSync(HEARTBEAT_FILE)) {
      console.error(`Healthcheck failed: Heartbeat file not found at ${HEARTBEAT_FILE}`);
      process.exit(1);
    }
    const raw = fs.readFileSync(HEARTBEAT_FILE, "utf-8");
    const data = JSON.parse(raw);
    const evalResult = evaluateWorkerHealth(data, new Date());

    if (!evalResult.healthy) {
      console.error(
        `Healthcheck failed: ${evalResult.reasons.join("; ")} (age=${Math.round(evalResult.heartbeatAgeSeconds)}s)`
      );
      process.exit(1);
    }

    console.info(
      `Healthcheck OK: Heartbeat fresh (${Math.round(evalResult.heartbeatAgeSeconds)}s old, pid=${data.pid}, db=${evalResult.dbProbeStatus})`
    );
    process.exit(0);
  } catch (err) {
    console.error("Healthcheck error:", err instanceof Error ? err.message : "Unknown error");
    process.exit(1);
  }
}

const OUTBOX_INTERVAL_MS = 5000;
const EXPORT_INTERVAL_MS = 5000;
const MAINTENANCE_INTERVAL_MS = 60000;
const HEARTBEAT_INTERVAL_MS = 15000;

const workerId = `worker-${process.pid}-${Date.now().toString(36)}`;

let isShuttingDown = false;
let isProcessingOutbox = false;
let isProcessingExport = false;
let isRunningMaintenance = false;

// Outbox metrics
let outboxConsecutiveFailures = 0;
let lastSuccessfulOutboxAt: Date | null = null;
let lastDeadCount = 0;
let lastFailedCount = 0;
let oldestPendingSeconds = 0;

// Export metrics
let exportConsecutiveFailures = 0;
let lastExportAttemptAt: Date | null = null;
let lastSuccessfulExportAt: Date | null = null;
const daemonExportState = new WorkerDaemonExportState();

// Maintenance metrics
let lastMaintenanceAttemptAt: Date | null = null;
let lastSuccessfulMaintenanceAt: Date | null = null;
let maintenanceHasErrors = false;
let lastMaintenanceSummary: Record<string, unknown> = {};

// DB Probe metrics
let lastDbProbeStatus: "UP" | "DOWN" = "UP";
let lastDbProbeLatencyMs = 0;
let lastDbProbeCheckedAt: Date = new Date();
let lastDbProbeError: string | undefined = undefined;

console.info(
  JSON.stringify({
    event: "worker_starting",
    pid: process.pid,
    workerId,
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || "development",
  })
);

async function checkQueueMetrics(): Promise<void> {
  try {
    const db = getDb();
    const now = Date.now();

    const [deadRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.outboxEvents)
      .where(eq(schema.outboxEvents.status, "DEAD"));

    lastDeadCount = deadRow?.count ?? 0;

    const [failedRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.outboxEvents)
      .where(eq(schema.outboxEvents.status, "FAILED"));

    lastFailedCount = failedRow?.count ?? 0;

    const [oldestPending] = await db
      .select({ createdAt: schema.outboxEvents.createdAt })
      .from(schema.outboxEvents)
      .where(eq(schema.outboxEvents.status, "PENDING"))
      .orderBy(schema.outboxEvents.createdAt)
      .limit(1);

    oldestPendingSeconds = oldestPending
      ? Math.max(0, Math.floor((now - new Date(oldestPending.createdAt).getTime()) / 1000))
      : 0;
  } catch (err) {
    console.error(
      JSON.stringify({
        event: "queue_metrics_error",
        error: err instanceof Error ? err.message : "Unknown metrics error",
        timestamp: new Date().toISOString(),
      })
    );
  }
}

async function runOutboxCycle(): Promise<void> {
  if (isShuttingDown || isProcessingOutbox) return;
  isProcessingOutbox = true;

  try {
    const processedCount = await NotificationService.processOutboxBatch(50);
    if (processedCount > 0) {
      lastSuccessfulOutboxAt = new Date();
      outboxConsecutiveFailures = 0;
      console.info(
        JSON.stringify({
          event: "outbox_batch_processed",
          count: processedCount,
          timestamp: new Date().toISOString(),
        })
      );
    }
    await checkQueueMetrics();
  } catch (err) {
    outboxConsecutiveFailures++;
    console.error(
      JSON.stringify({
        event: "outbox_cycle_error",
        error: err instanceof Error ? err.message : "Unknown outbox error",
        consecutiveFailures: outboxConsecutiveFailures,
        timestamp: new Date().toISOString(),
      })
    );
  } finally {
    isProcessingOutbox = false;
  }
}

async function runExportCycle(): Promise<void> {
  if (isShuttingDown || isProcessingExport) return;
  isProcessingExport = true;
  lastExportAttemptAt = new Date();

  try {
    const res = await ExportJobManager.processNextExportJob(workerId, daemonExportState);
    if (res.status === "COMPLETED") {
      lastSuccessfulExportAt = new Date();
      exportConsecutiveFailures = 0;
      console.info(
        JSON.stringify({
          event: "export_job_processed",
          jobId: res.jobId,
          timestamp: new Date().toISOString(),
        })
      );
    } else if (res.status === "FAILED" || res.status === "RETRY_SCHEDULED") {
      exportConsecutiveFailures++;
      console.warn(
        JSON.stringify({
          event: "export_job_failed",
          status: res.status,
          jobId: res.jobId,
          consecutiveFailures: exportConsecutiveFailures,
          timestamp: new Date().toISOString(),
        })
      );
    } else if (res.status === "LEASE_LOST") {
      console.warn(
        JSON.stringify({
          event: "export_lease_lost",
          jobId: res.jobId,
          timestamp: new Date().toISOString(),
        })
      );
    }
  } catch (err) {
    exportConsecutiveFailures++;
    console.error(
      JSON.stringify({
        event: "export_cycle_error",
        error: err instanceof Error ? err.message : "Unknown export error",
        consecutiveFailures: exportConsecutiveFailures,
        timestamp: new Date().toISOString(),
      })
    );
  } finally {
    isProcessingExport = false;
  }
}

async function runMaintenanceCycle(): Promise<void> {
  if (isShuttingDown || isRunningMaintenance) return;
  isRunningMaintenance = true;
  lastMaintenanceAttemptAt = new Date();
  const results: Record<string, unknown> = {};

  try {
    try {
      results.expiredListings = await ListingService.expireListingsJob();
    } catch (err) {
      results.expiredListings = {
        error: err instanceof Error ? err.message : "Error expiring listings",
      };
    }

    try {
      results.notifiedExpiring = await ListingService.notifyExpiringListings();
    } catch (err) {
      results.notifiedExpiring = {
        error: err instanceof Error ? err.message : "Error notifying expiring listings",
      };
    }

    try {
      results.cleanedOtp = await cleanupExpiredOtpChallenges(24);
    } catch (err) {
      results.cleanedOtp = {
        error: err instanceof Error ? err.message : "Error cleaning OTP challenges",
      };
    }

    try {
      results.cleanedRateLimits = await cleanupExpiredRateLimits();
    } catch (err) {
      results.cleanedRateLimits = {
        error: err instanceof Error ? err.message : "Error cleaning rate limits",
      };
    }

    try {
      results.cleanedIdempotencyKeys = await OfferService.cleanupExpiredIdempotencyKeys();
    } catch (err) {
      results.cleanedIdempotencyKeys = {
        error: err instanceof Error ? err.message : "Error cleaning idempotency keys",
      };
    }

    try {
      results.cleanedExportFiles = await ExportJobManager.cleanupExpiredJobs();
    } catch (err) {
      results.cleanedExportFiles = {
        error: err instanceof Error ? err.message : "Error cleaning expired export files",
      };
    }

    try {
      const { ReviewService } = await import("../src/modules/reviews/service");
      results.autoRevealedReviews = await ReviewService.autoRevealExpiredReviews();
    } catch (err) {
      results.autoRevealedReviews = {
        error: err instanceof Error ? err.message : "Error auto-revealing expired reviews",
      };
    }

    const hasErrors = Object.values(results).some(
      (val) => typeof val === "object" && val !== null && "error" in val
    );

    maintenanceHasErrors = hasErrors;
    lastMaintenanceSummary = results;

    if (!hasErrors) {
      lastSuccessfulMaintenanceAt = new Date();
    }

    console.info(
      JSON.stringify({
        event: hasErrors ? "maintenance_cycle_partial_failure" : "maintenance_cycle_completed",
        timestamp: lastMaintenanceAttemptAt.toISOString(),
        hasErrors,
        ...results,
      })
    );
  } catch (err) {
    maintenanceHasErrors = true;
    console.error(
      JSON.stringify({
        event: "maintenance_cycle_fatal_error",
        error: err instanceof Error ? err.message : "Unknown maintenance error",
        timestamp: new Date().toISOString(),
      })
    );
  } finally {
    isRunningMaintenance = false;
  }
}

async function runHeartbeatCycle(): Promise<void> {
  // DB probe
  const probe = await probeDatabaseDirectly(5000);
  lastDbProbeStatus = probe.status;
  lastDbProbeLatencyMs = probe.latencyMs;
  lastDbProbeCheckedAt = new Date();
  lastDbProbeError = probe.error;

  const payload: WorkerHeartbeatV2 = {
    schemaVersion: 2,
    pid: process.pid,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    dbProbe: {
      status: lastDbProbeStatus,
      latencyMs: Math.round(lastDbProbeLatencyMs * 10) / 10,
      lastCheckedAt: lastDbProbeCheckedAt.toISOString(),
      error: lastDbProbeError,
    },
    outbox: {
      lastSuccessAt: lastSuccessfulOutboxAt?.toISOString() ?? null,
      consecutiveFailures: outboxConsecutiveFailures,
      deadCount: lastDeadCount,
      failedCount: lastFailedCount,
      oldestPendingSeconds,
    },
    export: {
      lastAttemptAt: lastExportAttemptAt?.toISOString() ?? null,
      lastSuccessAt: lastSuccessfulExportAt?.toISOString() ?? null,
      lastProgressAt: daemonExportState.activeLastProgressAt?.toISOString() ?? null,
      startedAt: daemonExportState.activeStartedAt?.toISOString() ?? null,
      activeJobId: daemonExportState.activeJobId,
      consecutiveFailures: exportConsecutiveFailures,
    },
    maintenance: {
      lastAttemptAt: lastMaintenanceAttemptAt?.toISOString() ?? null,
      lastSuccessAt: lastSuccessfulMaintenanceAt?.toISOString() ?? null,
      hasErrors: maintenanceHasErrors,
      summary: lastMaintenanceSummary,
    },
  };

  try {
    writeWorkerHeartbeat(payload, HEARTBEAT_FILE);
  } catch (err) {
    console.error("Failed to write heartbeat:", err);
  }
}

// Start timers
const outboxTimer = setInterval(() => {
  runOutboxCycle().catch(() => {});
}, OUTBOX_INTERVAL_MS);

const exportTimer = setInterval(() => {
  runExportCycle().catch(() => {});
}, EXPORT_INTERVAL_MS);

const maintenanceTimer = setInterval(() => {
  runMaintenanceCycle().catch(() => {});
}, MAINTENANCE_INTERVAL_MS);

const heartbeatTimer = setInterval(() => {
  runHeartbeatCycle().catch(() => {});
}, HEARTBEAT_INTERVAL_MS);

// Initial executions on startup
runOutboxCycle().catch(() => {});
runExportCycle().catch(() => {});
runMaintenanceCycle().catch(() => {});
runHeartbeatCycle().catch(() => {});

// Graceful shutdown
function handleShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.info(
    JSON.stringify({
      event: "worker_stopping",
      signal,
      pid: process.pid,
      timestamp: new Date().toISOString(),
    })
  );

  clearInterval(outboxTimer);
  clearInterval(exportTimer);
  clearInterval(maintenanceTimer);
  clearInterval(heartbeatTimer);

  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));
