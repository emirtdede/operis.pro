import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  WorkerHeartbeatV2,
  evaluateWorkerHealth,
  writeWorkerHeartbeat,
} from "../../scripts/lib/worker-health";

describe("Worker Health Evaluation Engine (K01)", () => {
  let tempDir: string;
  let heartbeatPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "operis-worker-test-"));
    heartbeatPath = path.join(tempDir, "heartbeat.json");
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Non-fatal cleanup
    }
  });

  function createValidHeartbeat(overrides?: Partial<WorkerHeartbeatV2>): WorkerHeartbeatV2 {
    const now = new Date().toISOString();
    return {
      schemaVersion: 2,
      pid: 1234,
      uptimeSeconds: 300,
      timestamp: now,
      dbProbe: {
        status: "UP",
        latencyMs: 3.5,
        lastCheckedAt: now,
      },
      outbox: {
        lastSuccessAt: now,
        consecutiveFailures: 0,
        deadCount: 0,
        failedCount: 0,
        oldestPendingSeconds: 0,
      },
      export: {
        lastAttemptAt: now,
        lastSuccessAt: now,
        activeJobId: null,
        consecutiveFailures: 0,
      },
      maintenance: {
        lastAttemptAt: now,
        lastSuccessAt: now,
        hasErrors: false,
        summary: {},
      },
      ...overrides,
    };
  }

  it("evaluates a fresh, normal heartbeat as healthy", () => {
    const hb = createValidHeartbeat();
    const result = evaluateWorkerHealth(hb, new Date());
    expect(result.healthy).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.dbProbeStatus).toBe("UP");
  });

  it.each([
    { deadCount: 1, oldestPendingSeconds: 0, hasErrors: false },
    { deadCount: 0, oldestPendingSeconds: 901, hasErrors: false },
    { deadCount: 0, oldestPendingSeconds: 0, hasErrors: true },
  ])("reports stalled security/storage jobs as unhealthy", (reliability) => {
    const result = evaluateWorkerHealth(createValidHeartbeat({ reliability }));
    expect(result.healthy).toBe(false);
    expect(result.reasons).toContain("Reliability jobs require attention");
  });

  it("fails if heartbeat timestamp is stale (> 45 seconds)", () => {
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const hb = createValidHeartbeat({
      timestamp: sixtySecondsAgo,
      dbProbe: {
        status: "UP",
        latencyMs: 2,
        lastCheckedAt: sixtySecondsAgo,
      },
    });

    const result = evaluateWorkerHealth(hb, new Date());
    expect(result.healthy).toBe(false);
    expect(result.reasons.some((r) => r.includes("Stale heartbeat"))).toBe(true);
  });

  it("fails if heartbeat timestamp is in the future (> 5 seconds)", () => {
    const tenSecondsFuture = new Date(Date.now() + 10 * 1000).toISOString();
    const hb = createValidHeartbeat({ timestamp: tenSecondsFuture });

    const result = evaluateWorkerHealth(hb, new Date());
    expect(result.healthy).toBe(false);
    expect(result.reasons.some((r) => r.includes("in the future"))).toBe(true);
  });

  it("fails if dbProbe reports DOWN", () => {
    const hb = createValidHeartbeat({
      dbProbe: {
        status: "DOWN",
        latencyMs: 5000,
        lastCheckedAt: new Date().toISOString(),
        error: "ECONNREFUSED",
      },
    });

    const result = evaluateWorkerHealth(hb, new Date());
    expect(result.healthy).toBe(false);
    expect(result.reasons.some((r) => r.includes("database probe DOWN"))).toBe(true);
  });

  it("fails if outbox has 5 or more consecutive failures", () => {
    const hb = createValidHeartbeat({
      outbox: {
        lastSuccessAt: null,
        consecutiveFailures: 5,
        deadCount: 1,
        failedCount: 2,
        oldestPendingSeconds: 10,
      },
    });

    const result = evaluateWorkerHealth(hb, new Date());
    expect(result.healthy).toBe(false);
    expect(result.reasons.some((r) => r.includes("5 consecutive failures"))).toBe(true);
  });

  it("fails if outbox is stuck with old pending messages and no recent success", () => {
    const twoMinutesAgo = new Date(Date.now() - 120 * 1000).toISOString();
    const hb = createValidHeartbeat({
      outbox: {
        lastSuccessAt: twoMinutesAgo,
        consecutiveFailures: 0,
        deadCount: 0,
        failedCount: 0,
        oldestPendingSeconds: 150,
      },
    });

    const result = evaluateWorkerHealth(hb, new Date());
    expect(result.healthy).toBe(false);
    expect(result.reasons.some((r) => r.includes("Outbox stuck"))).toBe(true);
  });

  it("fails if export processor has 3 or more consecutive failures", () => {
    const hb = createValidHeartbeat({
      export: {
        lastAttemptAt: new Date().toISOString(),
        lastSuccessAt: null,
        activeJobId: null,
        consecutiveFailures: 3,
      },
    });

    const result = evaluateWorkerHealth(hb, new Date());
    expect(result.healthy).toBe(false);
    expect(
      result.reasons.some((r) => r.includes("Export processor has 3 consecutive failures"))
    ).toBe(true);
  });

  it("fails if active export job is stuck for more than 600 seconds", () => {
    const sevenHundredSecondsAgo = new Date(Date.now() - 700 * 1000).toISOString();
    const hb = createValidHeartbeat({
      export: {
        lastAttemptAt: sevenHundredSecondsAgo,
        startedAt: sevenHundredSecondsAgo,
        lastSuccessAt: null,
        activeJobId: "job-stuck-999",
        consecutiveFailures: 0,
      },
    });

    const result = evaluateWorkerHealth(hb, new Date());
    expect(result.healthy).toBe(false);
    expect(result.reasons.some((r) => r.includes("job-stuck-999 stuck"))).toBe(true);
  });

  it("marks export job healthy if active for 120s but progress occurred recently (10s ago)", () => {
    const now = Date.now();
    const twoMinutesAgo = new Date(now - 120 * 1000).toISOString();
    const tenSecondsAgo = new Date(now - 10 * 1000).toISOString();
    const hb = createValidHeartbeat({
      export: {
        lastAttemptAt: twoMinutesAgo,
        startedAt: twoMinutesAgo,
        lastProgressAt: tenSecondsAgo,
        lastSuccessAt: null,
        activeJobId: "job-progressing-123",
        consecutiveFailures: 0,
      },
    });

    const result = evaluateWorkerHealth(hb, new Date());
    expect(result.healthy).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("fails if active export job has made no progress for > 90s, even with 0 error count", () => {
    const now = Date.now();
    const oneHundredSecondsAgo = new Date(now - 100 * 1000).toISOString();
    const hb = createValidHeartbeat({
      export: {
        lastAttemptAt: oneHundredSecondsAgo,
        startedAt: oneHundredSecondsAgo,
        lastProgressAt: oneHundredSecondsAgo,
        lastSuccessAt: null,
        activeJobId: "job-silent-stall-456",
        consecutiveFailures: 0, // 0 errors, but hung silently!
      },
    });

    const result = evaluateWorkerHealth(hb, new Date());
    expect(result.healthy).toBe(false);
    expect(
      result.reasons.some((r) => r.includes("job-silent-stall-456 stalled: no progress"))
    ).toBe(true);
  });

  it("atomically writes valid heartbeat file that can be read and evaluated", () => {
    const hb = createValidHeartbeat();
    writeWorkerHeartbeat(hb, heartbeatPath);

    expect(fs.existsSync(heartbeatPath)).toBe(true);
    const raw = fs.readFileSync(heartbeatPath, "utf-8");
    const parsed = JSON.parse(raw);
    const evalResult = evaluateWorkerHealth(parsed, new Date());
    expect(evalResult.healthy).toBe(true);
  });
});
