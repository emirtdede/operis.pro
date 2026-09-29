import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type pg from "pg";
import { z } from "zod";
import {
  acquireClientWithDeadline,
  cancelBackendPid,
  getDbPool,
  terminateClientSafely,
} from "../../src/lib/db";

export const DEFAULT_HEARTBEAT_FILE =
  process.env.WORKER_HEARTBEAT_FILE || path.join(os.tmpdir(), "operis-worker-heartbeat.json");

export const WorkerHeartbeatSchemaV2 = z.object({
  schemaVersion: z.literal(2),
  pid: z.number().int().positive(),
  uptimeSeconds: z.number().nonnegative(),
  timestamp: z.string().datetime(),
  dbProbe: z.object({
    status: z.enum(["UP", "DOWN"]),
    latencyMs: z.number().nonnegative(),
    lastCheckedAt: z.string().datetime(),
    error: z.string().optional(),
  }),
  outbox: z.object({
    lastSuccessAt: z.string().datetime().nullable(),
    consecutiveFailures: z.number().int().nonnegative(),
    deadCount: z.number().int().nonnegative(),
    failedCount: z.number().int().nonnegative(),
    oldestPendingSeconds: z.number().int().nonnegative(),
  }),
  export: z.object({
    lastAttemptAt: z.string().datetime().nullable(),
    lastSuccessAt: z.string().datetime().nullable(),
    lastProgressAt: z.string().datetime().nullable().optional(),
    startedAt: z.string().datetime().nullable().optional(),
    activeJobId: z.string().nullable(),
    consecutiveFailures: z.number().int().nonnegative(),
  }),
  maintenance: z.object({
    lastAttemptAt: z.string().datetime().nullable(),
    lastSuccessAt: z.string().datetime().nullable(),
    hasErrors: z.boolean(),
    summary: z.record(z.unknown()),
  }),
  reliability: z
    .object({
      deadCount: z.number().int().nonnegative(),
      oldestPendingSeconds: z.number().int().nonnegative(),
      hasErrors: z.boolean(),
    })
    .optional(),
});

export type WorkerHeartbeatV2 = z.infer<typeof WorkerHeartbeatSchemaV2>;

export interface HealthEvaluationResult {
  healthy: boolean;
  reasons: string[];
  heartbeatAgeSeconds: number;
  dbProbeStatus: "UP" | "DOWN";
}

/**
 * Evaluates worker heartbeat payload against operational freshness & progress thresholds.
 * Enforces real progress checks for outbox (90s), maintenance (180s/errors), and export (600s/90s).
 */
export function evaluateWorkerHealth(
  data: unknown,
  now: Date = new Date()
): HealthEvaluationResult {
  const parseResult = WorkerHeartbeatSchemaV2.safeParse(data);
  if (!parseResult.success) {
    return {
      healthy: false,
      reasons: [`Heartbeat schema validation failed: ${parseResult.error.message}`],
      heartbeatAgeSeconds: Infinity,
      dbProbeStatus: "DOWN",
    };
  }

  const hb = parseResult.data;
  const reasons: string[] = [];
  if (
    hb.reliability &&
    (hb.reliability.hasErrors ||
      hb.reliability.deadCount > 0 ||
      hb.reliability.oldestPendingSeconds > 900)
  ) {
    reasons.push("Reliability jobs require attention");
  }
  const nowMs = now.getTime();
  const hbTimeMs = new Date(hb.timestamp).getTime();
  const ageSeconds = (nowMs - hbTimeMs) / 1000;

  // 1. Timestamp future check
  if (ageSeconds < -5) {
    reasons.push(`Heartbeat timestamp is in the future (${Math.round(ageSeconds)}s)`);
  }

  // 2. Heartbeat age check (max 45s for 15s interval)
  if (ageSeconds > 45) {
    reasons.push(`Stale heartbeat (${Math.round(ageSeconds)}s old, threshold 45s)`);
  }

  // 3. DB probe freshness & status
  const dbProbeMs = new Date(hb.dbProbe.lastCheckedAt).getTime();
  const dbProbeAgeSeconds = (nowMs - dbProbeMs) / 1000;
  if (dbProbeAgeSeconds > 45) {
    reasons.push(`Stale DB probe in heartbeat (${Math.round(dbProbeAgeSeconds)}s old)`);
  }
  if (hb.dbProbe.status !== "UP") {
    reasons.push(`Worker reports database probe DOWN: ${hb.dbProbe.error || "unknown"}`);
  }

  // 4. Outbox pipeline health: consecutive failures or actionable queue stuck > 90s without real progress
  if (hb.outbox.consecutiveFailures >= 5) {
    reasons.push(`Outbox processor has ${hb.outbox.consecutiveFailures} consecutive failures`);
  }
  if (hb.outbox.oldestPendingSeconds > 90) {
    const lastSuccessMs = hb.outbox.lastSuccessAt ? new Date(hb.outbox.lastSuccessAt).getTime() : 0;
    const sinceLastSuccess = (nowMs - lastSuccessMs) / 1000;
    if (sinceLastSuccess > 90) {
      reasons.push(
        `Outbox stuck: actionable queue is ${hb.outbox.oldestPendingSeconds}s old and no successful processing in ${Math.round(sinceLastSuccess)}s`
      );
    }
  }

  // 5. Maintenance pipeline health: errors or no success within 180s
  if (hb.maintenance.hasErrors) {
    reasons.push("Maintenance cycle reported execution errors");
  }
  if (hb.maintenance.lastSuccessAt) {
    const sinceLastMaintSuccess = (nowMs - new Date(hb.maintenance.lastSuccessAt).getTime()) / 1000;
    if (sinceLastMaintSuccess > 180) {
      reasons.push(
        `Maintenance cycle has not succeeded in ${Math.round(sinceLastMaintSuccess)}s (threshold 180s)`
      );
    }
  } else if (hb.uptimeSeconds > 180) {
    reasons.push("Maintenance cycle has not succeeded since worker startup (exceeded 180s)");
  }

  // 6. Export pipeline health: 600s total duration or 90s stall (independent of failure count)
  if (hb.export.consecutiveFailures >= 3) {
    reasons.push(`Export processor has ${hb.export.consecutiveFailures} consecutive failures`);
  }
  if (hb.export.activeJobId) {
    // 6a. Overall job timeout (600s) from startedAt (or fallback to lastAttemptAt)
    const jobStartStr = hb.export.startedAt || hb.export.lastAttemptAt;
    if (jobStartStr) {
      const activeDurationSeconds = (nowMs - new Date(jobStartStr).getTime()) / 1000;
      if (activeDurationSeconds > 600) {
        reasons.push(
          `Export job ${hb.export.activeJobId} stuck: active for ${Math.round(activeDurationSeconds)}s without completion (threshold 600s)`
        );
      }
    }

    // 6b. True stall detection: 90s without progress, independent of failure count
    const lastProgressStr =
      hb.export.lastProgressAt || hb.export.startedAt || hb.export.lastAttemptAt;
    if (lastProgressStr) {
      const stallDurationSeconds = (nowMs - new Date(lastProgressStr).getTime()) / 1000;
      if (stallDurationSeconds > 90) {
        reasons.push(
          `Export job ${hb.export.activeJobId} stalled: no progress in ${Math.round(stallDurationSeconds)}s (threshold 90s)`
        );
      }
    }
  }

  return {
    healthy: reasons.length === 0,
    reasons,
    heartbeatAgeSeconds: ageSeconds,
    dbProbeStatus: hb.dbProbe.status,
  };
}

/**
 * Atomically writes the heartbeat file with fsync and rename.
 */
export function writeWorkerHeartbeat(
  payload: WorkerHeartbeatV2,
  targetFile = DEFAULT_HEARTBEAT_FILE
): void {
  const dir = path.dirname(targetFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tmpFile = `${targetFile}.tmp.${process.pid}.${Date.now()}`;
  const raw = JSON.stringify(payload, null, 2);

  const fd = fs.openSync(tmpFile, "w");
  try {
    fs.writeSync(fd, raw, 0, "utf-8");
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }

  fs.renameSync(tmpFile, targetFile);
}

/**
 * Performs a live SQL SELECT 1 probe with statement cancellation, connection cleanup,
 * and finally timer disposal to prevent timer leaks.
 * Includes connection acquisition in the timeout window, and discards timed out connections
 * to guarantee no delayed cancel packet hits subsequent queries.
 */
export async function probeDatabaseDirectly(
  timeoutMs = 5000,
  poolOverride?: pg.Pool
): Promise<{
  status: "UP" | "DOWN";
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  const pool = poolOverride || getDbPool();
  let client: pg.PoolClient | null = null;
  let clientDiscarded = false;
  let pendingCancelPromise: Promise<boolean> | null = null;

  try {
    client = await acquireClientWithDeadline(pool, timeoutMs);
    const pid = (client as unknown as { processID?: number }).processID;

    const elapsed = Date.now() - start;
    const remaining = timeoutMs - elapsed;
    if (remaining <= 0) {
      throw new Error(`DB probe acquisition consumed entire budget of ${timeoutMs}ms`);
    }

    let queryTimer: NodeJS.Timeout | null = null;
    const queryTimeoutPromise = new Promise<never>((_, reject) => {
      queryTimer = setTimeout(
        () => {
          if (pid && !pendingCancelPromise) {
            pendingCancelPromise = cancelBackendPid(pid, { pool, client: client || undefined });
          }
          reject(new Error(`DB probe query timed out after ${timeoutMs}ms`));
        },
        Math.max(1, remaining)
      );
    });

    try {
      await Promise.race([client.query("SELECT 1"), queryTimeoutPromise]);
    } finally {
      if (queryTimer) clearTimeout(queryTimer);
    }

    return {
      status: "UP",
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    if (client && !clientDiscarded) {
      clientDiscarded = true;
      terminateClientSafely(client);
    }
    return {
      status: "DOWN",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    if (pendingCancelPromise) {
      let cancelTimeout: NodeJS.Timeout | null = null;
      await Promise.race([
        pendingCancelPromise,
        new Promise<void>((resolve) => {
          cancelTimeout = setTimeout(resolve, 1500);
        }),
      ]).catch(() => {});
      if (cancelTimeout) clearTimeout(cancelTimeout);
    }
    if (client && !clientDiscarded) {
      client.release();
    }
  }
}

/**
 * Sends webhook alert on health transitions (UP -> DOWN or DOWN -> UP).
 */
export async function sendOperationalAlert(
  webhookUrl: string | undefined,
  event: "worker_health_down" | "worker_health_recovered",
  details: Record<string, unknown>
): Promise<boolean> {
  if (!webhookUrl) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Operis-Worker-Observer/1.0",
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        hostname: os.hostname(),
        ...details,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}
