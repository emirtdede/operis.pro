const proc = process as unknown as { loadEnvFile?: (path?: string) => void };
if (typeof proc.loadEnvFile === "function") {
  try {
    proc.loadEnvFile(".env");
  } catch {
    // Non-fatal: Ignore missing .env in CI, Docker, or systemd environments
  }
}

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  DEFAULT_HEARTBEAT_FILE,
  evaluateWorkerHealth,
  probeDatabaseDirectly,
  sendOperationalAlert,
} from "./lib/worker-health";

const STATE_FILE = path.join(os.tmpdir(), "operis-worker-observer-state.json");

const RETRY_BACKOFF_DELAYS_MS = [30000, 60000, 120000, 240000];

interface PendingAlert {
  event: "worker_health_down" | "worker_health_recovered";
  details: Record<string, unknown>;
  attemptCount: number;
  nextAttemptAt: string;
  createdAt: string;
  exhausted?: boolean;
}

interface ObserverState {
  lastStatus: "UP" | "DOWN" | "UNKNOWN";
  lastCheckedAt: string;
  consecutiveDown: number;
  pendingAlert?: PendingAlert | null;
}

function readObserverState(): ObserverState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    }
  } catch {
    // Ignore read error
  }
  return {
    lastStatus: "UNKNOWN",
    lastCheckedAt: new Date().toISOString(),
    consecutiveDown: 0,
    pendingAlert: null,
  };
}

function writeObserverState(state: ObserverState): void {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch {
    // Non-fatal
  }
}

async function main() {
  const args = process.argv.slice(2);
  const probeDb = args.includes("--probe-db");
  const heartbeatFile = process.env.WORKER_HEARTBEAT_FILE || DEFAULT_HEARTBEAT_FILE;
  const webhookUrl = process.env.OPERATIONAL_ALERT_WEBHOOK_URL;

  const prevState = readObserverState();
  let pendingAlert = prevState.pendingAlert ?? null;

  // Retry previous pending webhook alert with 30s/60s/120s backoff and visible escalation upon exhaustion
  if (pendingAlert && webhookUrl && !pendingAlert.exhausted) {
    const isDue = !pendingAlert.nextAttemptAt || new Date(pendingAlert.nextAttemptAt) <= new Date();
    if (isDue) {
      const retried = await sendOperationalAlert(
        webhookUrl,
        pendingAlert.event,
        pendingAlert.details
      );
      if (retried) {
        pendingAlert = null;
      } else {
        pendingAlert.attemptCount++;
        if (pendingAlert.attemptCount >= 5) {
          pendingAlert.exhausted = true;
          console.error(
            `[OBSERVER_ALERT_DELIVERY_EXHAUSTED] Operational alert '${pendingAlert.event}' failed after 5 attempts. Escalated to stderr log: ${JSON.stringify(pendingAlert.details)}`
          );
        } else {
          const fallbackDelay =
            RETRY_BACKOFF_DELAYS_MS[RETRY_BACKOFF_DELAYS_MS.length - 1] ?? 60000;
          const delay =
            RETRY_BACKOFF_DELAYS_MS[pendingAlert.attemptCount - 1] ?? fallbackDelay;
          pendingAlert.nextAttemptAt = new Date(Date.now() + delay).toISOString();
        }
      }
    }
  }

  let evalResult: {
    healthy: boolean;
    reasons: string[];
    heartbeatAgeSeconds: number;
    dbProbeStatus: "UP" | "DOWN";
  } = {
    healthy: false,
    reasons: ["Uninitialized observer evaluation"],
    heartbeatAgeSeconds: 999999,
    dbProbeStatus: "DOWN",
  };

  let independentDbProbe: { status: "UP" | "DOWN"; latencyMs: number; error?: string } | null =
    null;

  if (!fs.existsSync(heartbeatFile)) {
    evalResult = {
      healthy: false,
      reasons: [`Heartbeat file not found at ${heartbeatFile}`],
      heartbeatAgeSeconds: 999999,
      dbProbeStatus: "DOWN",
    };
  } else {
    let rawContent = "";
    let readOk = true;
    try {
      rawContent = fs.readFileSync(heartbeatFile, "utf-8");
    } catch (err) {
      readOk = false;
      evalResult = {
        healthy: false,
        reasons: [
          `Failed to read heartbeat file: ${err instanceof Error ? err.message : String(err)}`,
        ],
        heartbeatAgeSeconds: 999999,
        dbProbeStatus: "DOWN",
      };
    }

    if (readOk) {
      let payload: unknown;
      let parseOk = true;
      try {
        payload = JSON.parse(rawContent);
      } catch (err) {
        parseOk = false;
        evalResult = {
          healthy: false,
          reasons: [
            `Invalid JSON in heartbeat file: ${err instanceof Error ? err.message : String(err)}`,
          ],
          heartbeatAgeSeconds: 999999,
          dbProbeStatus: "DOWN",
        };
      }

      if (parseOk) {
        evalResult = evaluateWorkerHealth(payload, new Date());
      }
    }
  }

  // Optional live DB probe
  if (probeDb) {
    independentDbProbe = await probeDatabaseDirectly(5000);
    if (independentDbProbe.status !== "UP") {
      evalResult.healthy = false;
      evalResult.reasons.push(
        `Independent DB probe failed: ${independentDbProbe.error || "unknown"}`
      );
    }
  }

  const currentStatus: "UP" | "DOWN" = evalResult.healthy ? "UP" : "DOWN";

  // Transition alerts: UNKNOWN/UP -> DOWN or DOWN -> UP
  if (prevState.lastStatus !== "DOWN" && currentStatus === "DOWN") {
    const alertDetails = {
      reasons: evalResult.reasons,
      heartbeatAgeSeconds: evalResult.heartbeatAgeSeconds,
      independentDbProbe,
    };
    const sent = await sendOperationalAlert(webhookUrl, "worker_health_down", alertDetails);
    if (!sent && webhookUrl) {
      pendingAlert = {
        event: "worker_health_down",
        details: alertDetails,
        attemptCount: 1,
        createdAt: new Date().toISOString(),
        nextAttemptAt: new Date(Date.now() + (RETRY_BACKOFF_DELAYS_MS[0] ?? 60000)).toISOString(),
      };
    }
  } else if (prevState.lastStatus === "DOWN" && currentStatus === "UP") {
    const alertDetails = {
      recoveredAt: new Date().toISOString(),
      heartbeatAgeSeconds: evalResult.heartbeatAgeSeconds,
      independentDbProbe,
    };
    const sent = await sendOperationalAlert(webhookUrl, "worker_health_recovered", alertDetails);
    if (!sent && webhookUrl) {
      pendingAlert = {
        event: "worker_health_recovered",
        details: alertDetails,
        attemptCount: 1,
        createdAt: new Date().toISOString(),
        nextAttemptAt: new Date(Date.now() + (RETRY_BACKOFF_DELAYS_MS[0] ?? 60000)).toISOString(),
      };
    }
  }

  writeObserverState({
    lastStatus: currentStatus,
    lastCheckedAt: new Date().toISOString(),
    consecutiveDown: currentStatus === "DOWN" ? prevState.consecutiveDown + 1 : 0,
    pendingAlert,
  });

  const output = {
    status: currentStatus,
    healthy: evalResult.healthy,
    heartbeatAgeSeconds: Math.round(evalResult.heartbeatAgeSeconds * 10) / 10,
    reasons: evalResult.reasons,
    independentDbProbe,
    timestamp: new Date().toISOString(),
  };

  if (evalResult.healthy) {
    console.info(JSON.stringify(output, null, 2));
    process.exit(0);
  } else {
    console.error(JSON.stringify(output, null, 2));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal observer error:", err);
  process.exit(1);
});
