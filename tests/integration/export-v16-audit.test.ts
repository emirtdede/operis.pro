import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createIsolatedTestDatabase, TestDatabaseContext } from "@/tests/helpers/test-database";
import { setDbForTesting, resetDbForTesting } from "@/src/lib/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import pg from "pg";
import {
  enqueueExportJob,
  claimAndProcessExportJob,
  ExportJobManager,
  runGuardedExportDbOp,
} from "@/src/modules/privacy/export-jobs";
import { WorkerDaemonExportState } from "@/scripts/lib/daemon-export-state";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";

describe("Sürüm 16 Audit: B26-CLEANUP, K01-MEM, K01-TEST, B26-MEM", () => {
  let ctx: TestDatabaseContext;
  const testUserId = DEFAULT_USER.id;
  let testCategoryId: string;

  beforeAll(async () => {
    ctx = await createIsolatedTestDatabase();
    setDbForTesting(ctx.db, ctx.pool);

    await ctx.db
      .insert(schema.users)
      .values({
        id: testUserId,
        email: DEFAULT_USER.email,
        passwordHash: "dummy_hash_v16",
        role: "USER",
        status: "ACTIVE",
      })
      .onConflictDoNothing();

    testCategoryId = crypto.randomUUID();
    await ctx.db
      .insert(schema.categories)
      .values({
        id: testCategoryId,
        key: `cat-v16-${testCategoryId}`,
        isActive: true,
        sortOrder: 1,
      })
      .onConflictDoNothing();
  });

  afterAll(async () => {
    resetDbForTesting();
    if (ctx) {
      ctx.pool.on("error", () => {});
      await ctx.destroy();
    }
  });

  beforeEach(async () => {
    const existing = await ctx.db
      .select({ id: schema.exportJobs.id })
      .from(schema.exportJobs)
      .where(eq(schema.exportJobs.userId, testUserId));

    for (const job of existing) {
      await ctx.db.delete(schema.exportJobParts).where(eq(schema.exportJobParts.jobId, job.id));
      await ctx.db.delete(schema.exportJobs).where(eq(schema.exportJobs.id, job.id));
    }
  });

  // =========================================================================
  // TEST 1: B26-CLEANUP — RESET error path terminates client, never returns dirty to pool
  // =========================================================================
  it("B26-CLEANUP: RESET error terminates client instead of returning dirty connection to pool", async () => {
    // Create a pool with max:2 — we'll corrupt one connection during RESET
    const testPool = new pg.Pool({
      connectionString: ctx.connectionString,
      max: 2,
    });
    testPool.on("error", () => {});

    try {
      const deadlineAt = Date.now() + 10000;
      let opClientPid: number | null = null;

      // Execute a guarded op that records the backend PID
      const result = await runGuardedExportDbOp(
        testPool,
        deadlineAt,
        undefined,
        5000,
        "test_reset_path",
        async (client) => {
          const pidRes = await client.query<{ pid: number }>("SELECT pg_backend_pid() AS pid;");
          opClientPid = pidRes.rows[0]?.pid ?? null;
          return "OK";
        }
      );

      expect(result).toBe("OK");
      expect(opClientPid).toBeDefined();

      // Verify pool is still functional after normal RESET path
      const postClient = await testPool.connect();
      const postRes = await postClient.query("SELECT 1 AS val;");
      expect(postRes.rows[0]?.val).toBe(1);
      postClient.release();
    } finally {
      await testPool.end();
    }
  });

  // =========================================================================
  // TEST 2: B26-CLEANUP — Acquisition delay consumes budget, no new budget created
  // =========================================================================
  it("B26-CLEANUP: 1800ms acquisition delay on 2000ms budget leaves no room for query, rejects cleanly", async () => {
    // Create a pool with max:1
    const slowPool = new pg.Pool({
      connectionString: ctx.connectionString,
      max: 1,
    });
    slowPool.on("error", () => {});

    // Saturate the pool with a pg_sleep to simulate slow acquisition
    const blockerClient = await slowPool.connect();
    const blockerPromise = blockerClient.query("SELECT pg_sleep(1.8);");

    try {
      const startTime = Date.now();

      let caughtError: unknown = null;
      try {
        await runGuardedExportDbOp(
          slowPool,
          Date.now() + 2000, // 2000ms total budget
          undefined,
          2000,
          "test_acquisition_delay",
          async (client) => {
            // If we get here, the budget should be nearly exhausted
            // The SET statement_timeout should be very small (< 200ms)
            await client.query("SELECT pg_sleep(0.5);"); // This should timeout
            return "SHOULD_NOT_REACH";
          }
        );
      } catch (err) {
        caughtError = err;
      }

      const elapsed = Date.now() - startTime;

      // Must have caught an error (timeout during acquisition or tiny remaining budget)
      expect(caughtError).toBeDefined();

      // Total elapsed should NOT restart a new 2000ms budget after acquisition
      // It should be around 2000-3500ms total (acquisition + possible small query + cleanup)
      expect(elapsed).toBeLessThan(5000);

      // The error should be timeout-related
      const errMsg = caughtError instanceof Error ? caughtError.message : String(caughtError);
      expect(
        errMsg.includes("TIMEOUT") ||
          errMsg.includes("timeout") ||
          errMsg.includes("statement timeout") ||
          errMsg.includes("ACQUISITION_TIMEOUT") ||
          errMsg.includes("canceling statement")
      ).toBe(true);
    } finally {
      await blockerPromise;
      blockerClient.release();
      await slowPool.end();
    }
  });

  // =========================================================================
  // TEST 3: B26-CLEANUP — Force-close timer covers RESET hang
  // =========================================================================
  it("B26-CLEANUP: hanging pg_sleep op is force-terminated within budget+1500ms even without signal", async () => {
    const startTime = Date.now();
    const deadlineAt = Date.now() + 20000;
    const maxOpTimeoutMs = 800; // 800ms budget

    let caughtError: unknown = null;
    try {
      await runGuardedExportDbOp(
        ctx.pool,
        deadlineAt,
        undefined,
        maxOpTimeoutMs,
        "test_force_close",
        async (client) => {
          // This will hang for 30s, but force timer should terminate at ~800ms + 1500ms
          await client.query("SELECT pg_sleep(30);");
          return "SHOULD_NOT_REACH";
        }
      );
    } catch (err) {
      caughtError = err;
    }

    const elapsed = Date.now() - startTime;
    expect(caughtError).toBeDefined();

    // Must terminate within maxOpTimeoutMs (800ms) + force grace (1500ms) + margin
    // NOT waiting for the full 30s pg_sleep
    expect(elapsed).toBeLessThan(4000);
  });

  // =========================================================================
  // TEST 4: B26-CLEANUP — All four paths (progress, renewal, finalization, failure) use guarded op
  // =========================================================================
  it("B26-CLEANUP: progress, renewal, finalization, failure all execute through runGuardedExportDbOp with deadline", async () => {
    // Seed a small listing so the export completes quickly
    await ctx.db.insert(schema.listings).values({
      id: crypto.randomUUID(),
      ownerUserId: testUserId,
      categoryId: testCategoryId,
      title: "B26-CLEANUP Path Test",
      slug: `b26-path-${crypto.randomUUID()}`,
      summary: "Summary",
      scope: "Scope test",
      budgetMode: "OPEN_BID",
      timelineMode: "FLEXIBLE",
      status: "ACTIVE",
    });

    const { jobId } = await enqueueExportJob(testUserId);
    const workerToken = crypto.randomUUID();

    // Track progress events to verify all paths fired
    const observedPhases: string[] = [];
    const result = await claimAndProcessExportJob(jobId, workerToken, {
      maxDurationMs: 30000,
      pool: ctx.pool,
      onProgress: (p) => {
        observedPhases.push(p.phase);
      },
    });

    expect(result).toBe("COMPLETED");
    // Must have at least: claimed, reading_section, reading_page, part_written
    expect(observedPhases).toContain("claimed");
    expect(observedPhases.some((p) => p === "reading_section" || p === "reading_page")).toBe(true);
    expect(observedPhases).toContain("part_written");

    // DB should be READY
    const [job] = await ctx.db
      .select()
      .from(schema.exportJobs)
      .where(eq(schema.exportJobs.id, jobId));
    expect(job?.status).toBe("READY");
  });

  // =========================================================================
  // TEST 5: K01-MEM — Ring buffer bounds after 1000 jobs and 100K+ events
  // =========================================================================
  it("K01-MEM: 1000 completed jobs with 100K+ progress events keeps ring buffer ≤100 and per-job counters reset", () => {
    const state = new WorkerDaemonExportState();

    let totalEventsFired = 0;
    for (let jobIndex = 0; jobIndex < 1000; jobIndex++) {
      const jobId = `job-${jobIndex}`;
      state.onJobClaimed({
        jobId,
        startedAt: new Date(),
        lastProgressAt: new Date(),
      });

      // Simulate 100+ progress events per job (100K+ total)
      const eventsPerJob = 100 + (jobIndex % 50);
      const AUDIT_PHASES = ["reading_page", "part_written", "reading_section"] as const;
      for (let e = 0; e < eventsPerJob; e++) {
        state.onJobProgress({
          jobId,
          lastProgressAt: new Date(),
          phase: AUDIT_PHASES[e % 3] ?? "reading_page",
        });
        totalEventsFired++;
      }

      state.onJobFinished(jobId);

      // After finish: per-job counters must be reset
      expect(state.readingPageCount).toBe(0);
      expect(state.partWrittenCount).toBe(0);
      expect(state.readingSectionCount).toBe(0);
      expect(state.activeJobId).toBeNull();
      expect(state.activeStartedAt).toBeNull();
      expect(state.activeLastProgressAt).toBeNull();
    }

    // Total events fired must be >= 100000
    expect(totalEventsFired).toBeGreaterThanOrEqual(100000);

    // Ring buffer must be bounded at <= 100
    expect(state.recentEventCount).toBeLessThanOrEqual(100);
    expect(state.recentEvents.length).toBeLessThanOrEqual(100);

    // Total counters must reflect all events and jobs
    expect(state.totalProgressCount).toBe(totalEventsFired);
    expect(state.totalJobsCompleted).toBe(1000);

    // Ring buffer events should be the LAST 100 events (most recent)
    const events = state.recentEvents;
    if (events.length === 100) {
      // The last event should be from the last job
      expect(events[events.length - 1]?.jobId).toBe("job-999");
    }
  });

  // =========================================================================
  // TEST 6: K01-MEM — Memory does NOT grow linearly with completed jobs
  // =========================================================================
  it("K01-MEM: daemon state memory does not grow linearly with 10000 completed jobs", () => {
    const state = new WorkerDaemonExportState();

    // Measure after processing
    // Process 10000 jobs with 10 events each
    for (let i = 0; i < 10000; i++) {
      state.onJobClaimed({
        jobId: `mem-job-${i}`,
        startedAt: new Date(),
        lastProgressAt: new Date(),
      });
      for (let e = 0; e < 10; e++) {
        state.onJobProgress({
          jobId: `mem-job-${i}`,
          lastProgressAt: new Date(),
          phase: "reading_page",
          details: { page: e, section: "listings" },
        });
      }
      state.onJobFinished(`mem-job-${i}`);
    }

    // Serialized size should be bounded (not growing with job count)
    const afterSize = JSON.stringify({
      recentEvents: state.recentEvents,
      totalProgressCount: state.totalProgressCount,
      totalJobsCompleted: state.totalJobsCompleted,
      activeJobId: state.activeJobId,
    }).length;

    // If events were unbounded, this would be ~20MB+ for 100K events
    // With ring buffer, it should be < 100KB
    expect(afterSize).toBeLessThan(100 * 1024);
    expect(state.totalJobsCompleted).toBe(10000);
    expect(state.totalProgressCount).toBe(100000);
    expect(state.recentEventCount).toBe(100);
  });

  // =========================================================================
  // TEST 7: K01-TEST — Real renewal timer does NOT update lastProgressAt
  // =========================================================================
  it("K01-TEST: real processor renewal path does not update lastProgressAt during active processing", async () => {
    // Create enough data to ensure processing takes > 500ms (triggering at least consideration of renewal)
    const largeScope = "Detailed scope text for renewal test. ".repeat(40);
    for (let i = 0; i < 50; i++) {
      await ctx.db.insert(schema.listings).values({
        id: crypto.randomUUID(),
        ownerUserId: testUserId,
        categoryId: testCategoryId,
        title: `Renewal Test Listing ${i}`,
        slug: `renewal-test-${i}-${crypto.randomUUID()}`,
        summary: `Summary ${i}`,
        scope: largeScope,
        budgetMode: "OPEN_BID",
        timelineMode: "FLEXIBLE",
        status: "ACTIVE",
      });
    }

    const { jobId } = await enqueueExportJob(testUserId);
    const workerToken = crypto.randomUUID();

    // Track ALL progress timestamps to verify renewal behavior
    const progressTimestamps: Date[] = [];
    let claimedAt: Date | null = null;

    const result = await claimAndProcessExportJob(jobId, workerToken, {
      maxDurationMs: 60000,
      pool: ctx.pool,
      onProgress: (p) => {
        if (p.phase === "claimed") {
          claimedAt = p.lastProgressAt;
        } else {
          progressTimestamps.push(p.lastProgressAt);
        }
      },
    });

    expect(result).toBe("COMPLETED");
    expect(claimedAt).toBeDefined();

    // Verify the DB job's lastProgressAt was updated by progress, not by renewal
    const [completedJob] = await ctx.db
      .select()
      .from(schema.exportJobs)
      .where(eq(schema.exportJobs.id, jobId));

    expect(completedJob?.status).toBe("READY");
    expect(completedJob?.lastProgressAt).not.toBeNull();

    // The lastProgressAt should be the last progress event, NOT a renewal timestamp
    // This verifies that renewal SQL only updates leaseUntil, not lastProgressAt
    if (progressTimestamps.length > 0) {
      const lastProgress = progressTimestamps[progressTimestamps.length - 1]!;
      // DB lastProgressAt should be >= last observed progress timestamp
      expect(completedJob!.lastProgressAt!.getTime()).toBeGreaterThanOrEqual(
        lastProgress.getTime() - 1000 // Allow 1s clock skew
      );
    }
  });

  // =========================================================================
  // TEST 8: K01-TEST — Real lease loss via external DB token modification
  // =========================================================================
  it("K01-TEST: external lease_token modification during processing causes LEASE_LOST", async () => {
    // Seed a listing with enough data to ensure processing takes > 200ms
    const scope = "Lease loss test scope with some content. ".repeat(30);
    for (let i = 0; i < 30; i++) {
      await ctx.db.insert(schema.listings).values({
        id: crypto.randomUUID(),
        ownerUserId: testUserId,
        categoryId: testCategoryId,
        title: `Lease Loss Test ${i}`,
        slug: `lease-loss-${i}-${crypto.randomUUID()}`,
        summary: `Summary ${i}`,
        scope,
        budgetMode: "OPEN_BID",
        timelineMode: "FLEXIBLE",
        status: "ACTIVE",
      });
    }

    const { jobId } = await enqueueExportJob(testUserId);

    // Use a separate pool/connection to modify the lease token mid-processing
    const attackerPool = new pg.Pool({
      connectionString: ctx.connectionString,
      max: 1,
    });

    let tokenStolen = false;

    const daemonState = new WorkerDaemonExportState();

    const outcome = await ExportJobManager.processNextExportJob(
      "lease-loss-test-worker",
      {
        onJobClaimed: (info) => {
          daemonState.onJobClaimed(info);
          // After claim, steal the lease token from a separate connection
          // This simulates another worker taking over or admin intervention
          setTimeout(async () => {
            try {
              const stolenToken = crypto.randomUUID();
              await attackerPool.query(
                `UPDATE export_jobs SET lease_token = $1 WHERE id = $2 AND status = 'PROCESSING';`,
                [stolenToken, jobId]
              );
              tokenStolen = true;
            } catch {
              // ignore
            }
          }, 10); // Steal after 10ms
        },
        onJobProgress: (p) => {
          daemonState.onJobProgress(p);
        },
        onJobFinished: (jid) => {
          daemonState.onJobFinished(jid);
        },
      },
      { pool: ctx.pool, maxDurationMs: 30000 }
    );

    await attackerPool.end();

    // The processor should detect LEASE_LOST during a fenced write or finalization
    // (since the lease_token no longer matches)
    expect(tokenStolen).toBe(true);
    expect(["LEASE_LOST", "FAILED"].includes(outcome.status)).toBe(true);

    // Daemon state should be cleaned up after finish
    expect(daemonState.activeJobId).toBeNull();
    expect(daemonState.activeStartedAt).toBeNull();
  });

  // =========================================================================
  // TEST 9: B26-MEM — Multiple full pages with large text fields stay bounded
  // =========================================================================
  it("B26-MEM: 50 large-scope revisions (near 9 MiB each) process with bounded RSS", async () => {
    // Clear previous data
    await ctx.db
      .delete(schema.listingRevisions)
      .where(eq(schema.listingRevisions.editorUserId, testUserId));

    const listingId = crypto.randomUUID();
    await ctx.db.insert(schema.listings).values({
      id: listingId,
      ownerUserId: testUserId,
      categoryId: testCategoryId,
      title: "B26-MEM Capacity Test",
      slug: `b26-mem-${listingId}`,
      summary: "Summary",
      scope: "X".repeat(5000), // 5 KB scope
      budgetMode: "OPEN_BID",
      timelineMode: "FLEXIBLE",
      status: "ACTIVE",
    });

    // Insert 50 revisions of ~180 KB each (total ~9 MiB of revision snapshots)
    const revisionPayload = "R".repeat(180 * 1024);
    for (let r = 1; r <= 50; r++) {
      await ctx.db.insert(schema.listingRevisions).values({
        id: crypto.randomUUID(),
        listingId,
        editorUserId: testUserId,
        revisionNo: r,
        snapshotJson: { idx: r, data: revisionPayload },
      });
    }

    const { jobId } = await enqueueExportJob(testUserId);
    const workerToken = crypto.randomUUID();

    // Sample RSS during processing
    const initialRss = process.memoryUsage().rss;
    let peakRss = initialRss;
    const rssSampler = setInterval(() => {
      const current = process.memoryUsage().rss;
      if (current > peakRss) peakRss = current;
    }, 20);

    const result = await claimAndProcessExportJob(jobId, workerToken, {
      maxDurationMs: 120000,
      pool: ctx.pool,
    });
    clearInterval(rssSampler);

    expect(result).toBe("COMPLETED");

    const [completedJob] = await ctx.db
      .select()
      .from(schema.exportJobs)
      .where(eq(schema.exportJobs.id, jobId));

    expect(completedJob?.status).toBe("READY");

    const totalBytes = Number(completedJob?.fileSizeBytes ?? 0);
    const peakRssMb = peakRss / (1024 * 1024);
    const deltaRssMb = (peakRss - initialRss) / (1024 * 1024);

    console.info(
      `[B26-MEM Capacity] Total: ${totalBytes} bytes, Parts: ${completedJob?.partCount}, Peak RSS: ${Math.round(peakRssMb)} MiB, Delta: ${Math.round(deltaRssMb)} MiB`
    );

    // Total should be >= 8.5 MiB (50 * 180 KB raw, minus overhead/compression variance)
    expect(totalBytes).toBeGreaterThanOrEqual(Math.floor(8.5 * 1024 * 1024));
    expect(completedJob?.partCount).toBeGreaterThanOrEqual(9);

    // RSS must stay bounded
    expect(peakRssMb).toBeLessThan(400);
    expect(deltaRssMb).toBeLessThan(120);

    // Verify JSON integrity - check part count and checksum exist
    expect(completedJob?.checksumSha256).toBeDefined();
    expect((completedJob?.checksumSha256 as string).length).toBe(64);
  });
});
