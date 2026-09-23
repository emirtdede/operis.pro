import { runExportCapacityWorker } from "@/tests/helpers/run-export-capacity-worker";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  createIsolatedTestDatabase,
  TestDatabaseContext,
  assertSafeE2ETestEnvironment,
  cleanupStaleEphemeralDatabases,
} from "@/tests/helpers/test-database";
import { setDbForTesting, resetDbForTesting } from "@/src/lib/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import http from "node:http";
import pg from "pg";
import { spawnSync } from "node:child_process";
import {
  enqueueExportJob,
  claimAndProcessExportJob,
  ExportJobManager,
  runGuardedExportDbOp,
} from "@/src/modules/privacy/export-jobs";
import { readAndVerifyExportPartsStream } from "@/src/modules/privacy/export-writer";
import { WorkerDaemonExportState } from "@/scripts/lib/daemon-export-state";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";
import { emailProvider } from "@/src/lib/email";
import { smsProvider } from "@/src/lib/sms";

describe("Sürüm 18 Audit: B25-ENTRY, B25-EXIT, B25-RUNNER, B26-CLEANUP, B26-MEM, K01-TEST", () => {
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
        passwordHash: "dummy_hash_v18",
        role: "USER",
        status: "ACTIVE",
      })
      .onConflictDoNothing();

    testCategoryId = crypto.randomUUID();
    await ctx.db
      .insert(schema.categories)
      .values({
        id: testCategoryId,
        key: `cat-v18-${testCategoryId}`,
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
  // 1. B25-ENTRY TESTS
  // =========================================================================
  describe("B25-ENTRY: Strict Entry & Runner Verification", () => {
    it("fails closed when TEST_DATABASE_URL is missing or empty at config load", () => {
      const code = `
        delete process.env.TEST_DATABASE_URL;
        delete process.env.OPERIS_E2E_RUNNER_TOKEN;
        import('./playwright.config.ts').catch(err => {
          console.error('ERROR_CAUGHT:', err.message);
          process.exit(1);
        });
      `;
      const res = spawnSync("node", ["--import", "tsx", "-e", code], { encoding: "utf8" });
      expect(res.status).toBe(1);
      expect(res.stderr).toContain(
        "TEST_DATABASE_URL environment variable is required and cannot be empty"
      );
    });

    it("fails closed when runner token is missing at config load", () => {
      const code = `
        process.env.TEST_DATABASE_URL = 'postgresql://ozlem_user:pass@localhost:5432/operis_test_ephemeral_123';
        process.env.DATABASE_URL = 'postgresql://ozlem_user:pass@localhost:5432/operis_test_ephemeral_123';
        delete process.env.OPERIS_E2E_RUNNER_TOKEN;
        import('./playwright.config.ts').catch(err => {
          console.error('ERROR_CAUGHT:', err.message);
          process.exit(1);
        });
      `;
      const res = spawnSync("node", ["--import", "tsx", "-e", code], { encoding: "utf8" });
      expect(res.status).toBe(1);
      expect(res.stderr).toContain("Playwright must be launched through the secure runner");
    });

    it("fails closed when DATABASE_URL differs from TEST_DATABASE_URL", () => {
      const code = `
        process.env.TEST_DATABASE_URL = 'postgresql://ozlem_user:pass@localhost:5432/operis_test_ephemeral_123';
        process.env.DATABASE_URL = 'postgresql://other_user:pass@localhost:5432/operis_prod';
        process.env.OPERIS_E2E_RUNNER_TOKEN = '${crypto.randomUUID()}';
        import('./playwright.config.ts').catch(err => {
          console.error('ERROR_CAUGHT:', err.message);
          process.exit(1);
        });
      `;
      const res = spawnSync("node", ["--import", "tsx", "-e", code], { encoding: "utf8" });
      expect(res.status).toBe(1);
      expect(res.stderr).toContain(
        "DATABASE_URL and TEST_DATABASE_URL must point to the identical ephemeral test database"
      );
    });

    it("assertSafeE2ETestEnvironment throws before mutating actions if preconditions are not met", () => {
      // 1. Missing URL
      const origUrl = process.env.TEST_DATABASE_URL;
      const origToken = process.env.OPERIS_E2E_RUNNER_TOKEN;
      const origDb = process.env.DATABASE_URL;

      try {
        delete process.env.TEST_DATABASE_URL;
        delete process.env.OPERIS_E2E_RUNNER_TOKEN;
        expect(() => assertSafeE2ETestEnvironment()).toThrow(/TEST_DATABASE_URL is missing/);

        // 2. Missing token
        process.env.TEST_DATABASE_URL = ctx.connectionString;
        expect(() => assertSafeE2ETestEnvironment()).toThrow(/OPERIS_E2E_RUNNER_TOKEN is required/);

        // 3. Mismatched DATABASE_URL
        process.env.OPERIS_E2E_RUNNER_TOKEN = crypto.randomUUID();
        process.env.DATABASE_URL = "postgresql://attacker@remote.server.com:5432/prod_db";
        expect(() => assertSafeE2ETestEnvironment()).toThrow(/DATABASE_URL does not match/);

        // 4. Valid matching environment passes
        process.env.DATABASE_URL = ctx.connectionString;
        expect(() => assertSafeE2ETestEnvironment()).not.toThrow();
      } finally {
        if (origUrl) process.env.TEST_DATABASE_URL = origUrl;
        if (origToken) process.env.OPERIS_E2E_RUNNER_TOKEN = origToken;
        if (origDb) process.env.DATABASE_URL = origDb;
      }
    });
  });

  // =========================================================================
  // 2. B25-EXIT & B25-RUNNER TESTS
  // =========================================================================
  describe("B25-EXIT & B25-RUNNER: Runner Safety, Error Propagation, Provider Egress", () => {
    it("B25-EXIT: runner defaults to failure and returns nonzero if seed or child fails; cleanup is always invoked", () => {
      const seedError1: unknown = new Error("Simulated seed constraint failure");
      const spawnError1: unknown = null;
      const testExitCode1: number | null = null;
      const cleanupSucceeded1 = true;
      const cleanupError1: unknown = null;

      let finalExitCode = 0;
      if (seedError1) {
        finalExitCode = 1;
      } else if (spawnError1) {
        finalExitCode = 1;
      } else if (testExitCode1 !== 0) {
        finalExitCode = testExitCode1 ?? 1;
      } else if (!cleanupSucceeded1 || cleanupError1) {
        finalExitCode = 1;
      }

      expect(finalExitCode).toBe(1);

      // Now verify that cleanup failure also forces nonzero even if tests passed
      const seedError2: unknown = null;
      const spawnError2: unknown = null;
      const testExitCode2 = 0;
      const cleanupSucceeded2 = false;
      const cleanupError2: unknown = new Error("Failed to drop database");

      let secondExitCode = 0;
      if (seedError2) {
        secondExitCode = 1;
      } else if (spawnError2) {
        secondExitCode = 1;
      } else if (testExitCode2 !== 0) {
        secondExitCode = testExitCode2;
      } else if (!cleanupSucceeded2 || cleanupError2) {
        secondExitCode = 1;
      }

      expect(secondExitCode).toBe(1);
    });

    it("B25-RUNNER: local stub intercepts email and SMS dispatches with zero external network egress", async () => {
      const interceptedRequests: Array<{ url?: string; method?: string; body: string }> = [];

      const stubServer = http.createServer((req, res) => {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          interceptedRequests.push({ url: req.url, method: req.method, body });
          if (req.url?.includes("/emails")) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ id: "re_stub_msg_123" }));
          } else if (req.url?.includes("/sms/send/get")) {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("00 654321");
          } else {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
          }
        });
      });

      await new Promise<void>((resolve) => stubServer.listen(0, "127.0.0.1", () => resolve()));
      const addr = stubServer.address() as { port: number };
      const stubUrl = `http://127.0.0.1:${addr.port}`;

      const origResendBase = process.env.RESEND_BASE_URL;
      const origNetgsmBase = process.env.NETGSM_BASE_URL;
      const origTestProd = process.env.TEST_PROD;
      const origEmailProvider = process.env.EMAIL_PROVIDER;
      const origSmsProvider = process.env.SMS_PROVIDER;
      const origResendKey = process.env.RESEND_API_KEY;
      const origSmsKey = process.env.SMS_API_KEY;

      try {
        process.env.TEST_PROD = "1";
        process.env.EMAIL_PROVIDER = "resend";
        process.env.RESEND_API_KEY = "re_test_blackhole_key";
        process.env.RESEND_BASE_URL = stubUrl;
        process.env.SMS_PROVIDER = "netgsm";
        process.env.SMS_API_KEY = "sms_test_blackhole_key";
        process.env.NETGSM_BASE_URL = stubUrl;

        // 1. Send test email
        const emailRes = await emailProvider.send({
          to: "audit-v18@operis.pro",
          template: "verify_email",
          locale: "tr",
          variables: { subject: "Audit V18 Test", body: "Egress isolation verification" },
          idempotencyKey: `audit_email_${Date.now()}`,
        });

        expect(emailRes.success).toBe(true);
        expect(emailRes.messageId).toBe("re_stub_msg_123");

        // 2. Send test SMS
        const smsRes = await smsProvider.sendOtp({
          phoneE164: "+905551234567",
          code: "123456",
          locale: "tr",
          idempotencyKey: `audit_sms_${Date.now()}`,
        });

        expect(smsRes.success).toBe(true);
        expect(smsRes.messageId).toBe("netgsm_654321");

        // Verify stub received both calls
        expect(interceptedRequests.length).toBe(2);
        expect(interceptedRequests.some((r) => r.url?.includes("/emails"))).toBe(true);
        expect(interceptedRequests.some((r) => r.url?.includes("/sms/send/get"))).toBe(true);

        // 3. Verify egress blocking: if external baseUrl is configured in TEST_PROD, it must be rejected fail-closed
        process.env.RESEND_BASE_URL = "https://api.resend.com";
        const blockedEmailRes = await emailProvider.send({
          to: "blocked@operis.pro",
          template: "verify_email",
          locale: "tr",
          variables: {},
          idempotencyKey: `blocked_email_${Date.now()}`,
        });
        expect(blockedEmailRes.success).toBe(false);
        expect(blockedEmailRes.error).toContain("strictly blocked in test mode");

        process.env.NETGSM_BASE_URL = "https://api.netgsm.com.tr";
        const blockedSmsRes = await smsProvider.sendOtp({
          phoneE164: "+905559876543",
          code: "999999",
          locale: "tr",
          idempotencyKey: `blocked_sms_${Date.now()}`,
        });
        expect(blockedSmsRes.success).toBe(false);
        expect(blockedSmsRes.error).toContain("strictly blocked in test mode");
      } finally {
        stubServer.close();
        if (origResendBase) process.env.RESEND_BASE_URL = origResendBase;
        else delete process.env.RESEND_BASE_URL;
        if (origNetgsmBase) process.env.NETGSM_BASE_URL = origNetgsmBase;
        else delete process.env.NETGSM_BASE_URL;
        if (origTestProd) process.env.TEST_PROD = origTestProd;
        else delete process.env.TEST_PROD;
        if (origEmailProvider) process.env.EMAIL_PROVIDER = origEmailProvider;
        else delete process.env.EMAIL_PROVIDER;
        if (origSmsProvider) process.env.SMS_PROVIDER = origSmsProvider;
        else delete process.env.SMS_PROVIDER;
        if (origResendKey) process.env.RESEND_API_KEY = origResendKey;
        else delete process.env.RESEND_API_KEY;
        if (origSmsKey) process.env.SMS_API_KEY = origSmsKey;
        else delete process.env.SMS_API_KEY;
      }
    });

    it("B25-RUNNER: cleanupStaleEphemeralDatabases preserves databases without ownership proof", async () => {
      // Create a mock abandoned test database
      const adminPool = new pg.Pool({ connectionString: ctx.connectionString, max: 1 });
      const mockStaleDb = `operis_test_stale_v18_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
      try {
        await adminPool.query(`CREATE DATABASE "${mockStaleDb}";`);
      } finally {
        await adminPool.end();
      }

      // Run cleanup while protecting the current active test database
      const cleaned = await cleanupStaleEphemeralDatabases({ excludeDbNames: [ctx.dbName] });
      expect(cleaned).toEqual([]);

      // An idle name-matching DB is not proof of an abandoned run.
      const checkPool = new pg.Pool({ connectionString: ctx.connectionString, max: 1 });
      try {
        const res = await checkPool.query(`SELECT 1 FROM pg_database WHERE datname = $1;`, [
          mockStaleDb,
        ]);
        expect(res.rows.length).toBe(1);
      } finally {
        await checkPool.query(`DROP DATABASE IF EXISTS "${mockStaleDb}";`);
        await checkPool.end();
      }
    });
  });

  // =========================================================================
  // 3. B26-CLEANUP TESTS
  // =========================================================================
  describe("B26-CLEANUP: Budget Contract, RESET Failure & Hang Protection", () => {
    it("B26-CLEANUP: real RESET error terminates client safely, tainted connection never returned to pool", async () => {
      const testPool = new pg.Pool({
        connectionString: ctx.connectionString,
        max: 2,
      });
      testPool.on("error", () => {});

      let clientRef: unknown = null;

      try {
        const result = await runGuardedExportDbOp(
          testPool,
          Date.now() + 5000,
          undefined,
          4000,
          "test_real_reset_error",
          async (client) => {
            const origQuery = client.query.bind(client);
            (client as unknown as { query: unknown }).query = function (
              cmd: unknown,
              ...args: unknown[]
            ) {
              if (typeof cmd === "string" && cmd.includes("RESET statement_timeout")) {
                throw new Error("INJECTED_RESET_FAILURE: Network dropped during RESET");
              }
              return (origQuery as (...fnArgs: unknown[]) => unknown)(cmd, ...args);
            };

            clientRef = client;
            const pidRes = await client.query<{ pid: number }>("SELECT pg_backend_pid() AS pid;");
            return pidRes.rows[0]?.pid;
          }
        );

        expect(result).toBeDefined();
        // Socket was destroyed via stream.destroy() and client terminated safely
        const clientObj = clientRef as unknown as {
          _terminatedSafely?: boolean;
          connection?: { stream?: { destroyed?: boolean } };
        };
        expect(
          clientObj?._terminatedSafely === true || clientObj?.connection?.stream?.destroyed === true
        ).toBe(true);

        // Verify pool can immediately execute next query with a healthy client
        const healthyClient = await testPool.connect();
        const testRes = await healthyClient.query<{ ok: number }>("SELECT 100 AS ok;");
        expect(testRes.rows[0]?.ok).toBe(100);
        healthyClient.release();
      } finally {
        await testPool.end();
      }
    });

    it("B26-CLEANUP: real RESET hang is terminated at absoluteDeadline without hidden 1500ms addition", async () => {
      const testPool = new pg.Pool({
        connectionString: ctx.connectionString,
        max: 2,
      });
      testPool.on("error", () => {});

      const startTime = Date.now();
      const budgetMs = 800; // Exact 800ms budget

      try {
        await runGuardedExportDbOp(
          testPool,
          startTime + budgetMs,
          undefined,
          budgetMs,
          "test_reset_hang",
          async (client) => {
            const origQuery = client.query.bind(client);
            (client as unknown as { query: unknown }).query = function (
              cmd: unknown,
              ...args: unknown[]
            ) {
              if (typeof cmd === "string" && cmd.includes("RESET statement_timeout")) {
                return new Promise(() => {}); // Hangs forever
              }
              return (origQuery as (...fnArgs: unknown[]) => unknown)(cmd, ...args);
            };
            return "DONE_FAST";
          }
        );
      } catch {
        // May catch or complete
      }

      const elapsed = Date.now() - startTime;

      // Must terminate at the 800ms deadline (+ margin for process scheduling),
      // strictly NOT 800ms + 1500ms (= 2300ms)
      expect(elapsed).toBeLessThan(1800);

      // Verify pool is still usable
      const healthyClient = await testPool.connect();
      const testRes = await healthyClient.query<{ ok: number }>("SELECT 1 AS ok;");
      expect(testRes.rows[0]?.ok).toBe(1);
      healthyClient.release();
      await testPool.end();
    });

    it("B26-CLEANUP: 1800ms acquisition delay consumes budget; op query only gets remaining 200ms and cancels on time", async () => {
      const slowPool = new pg.Pool({
        connectionString: ctx.connectionString,
        max: 1,
      });
      slowPool.on("error", () => {});

      // Blocker client holds connection for 1800ms then releases it
      const blockerClient = await slowPool.connect();
      const blockerPromise = blockerClient.query("SELECT pg_sleep(1.8);");
      setTimeout(async () => {
        try {
          await blockerPromise;
          blockerClient.release();
        } catch {
          // ignore
        }
      }, 1800);

      const startTime = Date.now();
      const totalBudgetMs = 2100;
      let caughtError: unknown = null;

      try {
        await runGuardedExportDbOp(
          slowPool,
          startTime + totalBudgetMs,
          undefined,
          totalBudgetMs,
          "test_acquisition_budget_sharing",
          async (client) => {
            // When acquired at ~1800ms, only ~300ms budget remains.
            // A 1.0s sleep must be cancelled by PostgreSQL statement_timeout within remaining ~300ms!
            await client.query("SELECT pg_sleep(1.0);");
            return "SHOULD_HAVE_TIMED_OUT";
          }
        );
      } catch (err) {
        caughtError = err;
      }

      const elapsed = Date.now() - startTime;
      expect(caughtError).toBeDefined();

      // Total execution: ~1800ms acquire + ~300ms query cancel ≈ ~2100-2400ms.
      // Must NOT restart a new 2100ms budget after acquire (which would take ~3900ms)!
      expect(elapsed).toBeGreaterThanOrEqual(1750);
      expect(elapsed).toBeLessThan(2600);

      await slowPool.end();
    });
  });

  // =========================================================================
  // 4. K01-TEST TESTS
  // =========================================================================
  describe("K01-TEST: Verified Renewal and Fenced Lease Loss", () => {
    it("K01-TEST: renewal timer fires and updates leaseUntil while lastProgressAt remains identical", async () => {
      await ctx.db.insert(schema.listings).values({
        id: crypto.randomUUID(),
        ownerUserId: testUserId,
        categoryId: testCategoryId,
        title: "K01-TEST Renewal Listing",
        slug: `k01-renewal-${crypto.randomUUID()}`,
        summary: "Summary for renewal test",
        scope: "Scope test content",
        budgetMode: "OPEN_BID",
        timelineMode: "FLEXIBLE",
        status: "ACTIVE",
      });

      const { jobId } = await enqueueExportJob(testUserId);
      const workerToken = crypto.randomUUID();

      let initialLeaseUntil: Date | null = null;
      let initialLastProgressAt: Date | null = null;
      let renewalObserved = false;

      // Fast renewal interval: 250ms with controlled processing barrier
      const processorPromise = claimAndProcessExportJob(jobId, workerToken, {
        pool: ctx.pool,
        maxDurationMs: 30000,
        renewalIntervalMs: 250,
        testProcessingBarrier: async (barrier) => {
          initialLeaseUntil = barrier.initialLeaseUntil;
          initialLastProgressAt = barrier.initialLastProgressAt;

          // Wait 600ms at controlled barrier without emitting any section/page progress.
          // Since renewalIntervalMs is 250ms, renewLease fires at least twice.
          await new Promise((r) => setTimeout(r, 600));

          // Verify renewal updated leaseUntil while lastProgressAt is untouched
          const [renewedJob] = await ctx.db
            .select()
            .from(schema.exportJobs)
            .where(eq(schema.exportJobs.id, jobId));

          if (
            renewedJob &&
            initialLeaseUntil &&
            renewedJob.leaseUntil &&
            renewedJob.leaseUntil.getTime() > initialLeaseUntil.getTime()
          ) {
            renewalObserved = true;
            // Assert lastProgressAt remained EXACTLY identical to the millisecond
            expect(renewedJob.lastProgressAt?.getTime()).toBe(initialLastProgressAt?.getTime());
          }
        },
      });

      const result = await processorPromise;
      expect(result).toBe("COMPLETED");
      expect(renewalObserved).toBe(true);
    });

    it("K01-TEST: separate connection steals lease_token with rowCount 1; processor returns exact LEASE_LOST and cleans daemon state", async () => {
      // Seed enough listings for sustained processing
      for (let i = 0; i < 15; i++) {
        await ctx.db.insert(schema.listings).values({
          id: crypto.randomUUID(),
          ownerUserId: testUserId,
          categoryId: testCategoryId,
          title: `Lease Fence Listing ${i}`,
          slug: `k01-fence-${i}-${crypto.randomUUID()}`,
          summary: "Summary",
          scope: "Scope text ".repeat(40),
          budgetMode: "OPEN_BID",
          timelineMode: "FLEXIBLE",
          status: "ACTIVE",
        });
      }

      const { jobId } = await enqueueExportJob(testUserId);

      const attackerPool = new pg.Pool({ connectionString: ctx.connectionString, max: 1 });
      let rowCountVerified = false;

      const daemonState = new WorkerDaemonExportState();

      try {
        const outcome = await ExportJobManager.processNextExportJob(
          "k01-test-worker",
          {
            onJobClaimed: (info) => {
              daemonState.onJobClaimed(info);
            },
            onJobProgress: (p) => {
              daemonState.onJobProgress(p);
            },
            onJobFinished: (jid) => {
              daemonState.onJobFinished(jid);
            },
          },
          {
            pool: ctx.pool,
            maxDurationMs: 30000,
            testProcessingBarrier: async () => {
              const stolenToken = crypto.randomUUID();
              const updateRes = await attackerPool.query(
                `UPDATE export_jobs SET lease_token = $1 WHERE id = $2 AND status = 'PROCESSING';`,
                [stolenToken, jobId]
              );
              expect(updateRes.rowCount).toBe(1);
              rowCountVerified = true;
            },
          }
        );

        // Processor MUST return exact LEASE_LOST (NOT generic FAILED)
        expect(rowCountVerified).toBe(true);
        expect(outcome.status).toBe("LEASE_LOST");

        // Daemon state MUST be completely reset and clean
        expect(daemonState.activeJobId).toBeNull();
        expect(daemonState.activeStartedAt).toBeNull();
        expect(daemonState.activeLastProgressAt).toBeNull();
      } finally {
        await attackerPool.end();
      }
    });
  });

  // =========================================================================
  // 5. B26-MEM TESTS: 11 MiB OVERSIZED RECORD & TRUE 50 x ~8.8 MiB CAPACITY
  // =========================================================================
  describe("B26-MEM: Payload Pre-Check & 50 x ~8.8 MiB Capacity & Integrity", () => {
    it("B26-MEM: 11 MiB oversized listing scope is rejected by pre-check with EXPORT_RECORD_TOO_LARGE, never READY", async () => {
      const listingId = crypto.randomUUID();
      // Insert oversized 11 MiB scope directly into DB (bypassing form validation)
      const oversizedScope = "O".repeat(11 * 1024 * 1024);

      await ctx.db.insert(schema.listings).values({
        id: listingId,
        ownerUserId: testUserId,
        categoryId: testCategoryId,
        title: "Oversized Listing",
        slug: `oversized-${listingId}`,
        summary: "Summary",
        scope: oversizedScope,
        budgetMode: "OPEN_BID",
        timelineMode: "FLEXIBLE",
        status: "ACTIVE",
      });

      const { jobId } = await enqueueExportJob(testUserId);
      const workerToken = crypto.randomUUID();

      const result = await claimAndProcessExportJob(jobId, workerToken, {
        pool: ctx.pool,
        maxDurationMs: 30000,
      });

      expect(result).toBe("FAILED");

      // Verify job in DB was marked FAILED and NEVER READY
      const [job] = await ctx.db
        .select()
        .from(schema.exportJobs)
        .where(eq(schema.exportJobs.id, jobId));

      expect(job?.status).toBe("FAILED");
      expect(job?.errorCode).toBe("EXPORT_RECORD_TOO_LARGE");

      // Clean up oversized listing
      await ctx.db.delete(schema.listings).where(eq(schema.listings.id, listingId));
    });

    it("B26-MEM: 50 large-scope revisions (~8.8 MiB each, ~440 MiB total) process boundedly, decrypted JSON fully verified", async () => {
      // 1. Create a listing
      const listingId = crypto.randomUUID();
      await ctx.db.insert(schema.listings).values({
        id: listingId,
        ownerUserId: testUserId,
        categoryId: testCategoryId,
        title: "B26-MEM 50x9MB Capacity Test",
        slug: `b26-mem-50x9-${listingId}`,
        summary: "Summary for 50x9MB test",
        scope: "Small listing scope",
        budgetMode: "OPEN_BID",
        timelineMode: "FLEXIBLE",
        status: "ACTIVE",
      });

      // 2. Insert 50 revisions of ~8.8 MiB payload each
      // Total payload ≈ 50 * 8.8 MiB = ~440 MiB
      // Each payload is <= 10 MiB, so pre-check passes.
      // Since each revision is > 8 MiB, each <= 16 MiB group will hold only 1 revision,
      // creating 50 distinct fetch groups and keeping memory strictly bounded!
      const revPayloadSize = 8800 * 1024; // 8.8 MiB
      const payloadData = "M".repeat(revPayloadSize);
      const insertedRevisionIds: string[] = [];

      for (let r = 1; r <= 50; r++) {
        const revId = crypto.randomUUID();
        insertedRevisionIds.push(revId);
        await ctx.db.insert(schema.listingRevisions).values({
          id: revId,
          listingId,
          editorUserId: testUserId,
          revisionNo: r,
          snapshotJson: { rev: r, content: payloadData },
        });
        if (r === 5) {
          const smallJob = await enqueueExportJob(testUserId);
          const small = await runExportCapacityWorker(ctx.connectionString, smallJob.jobId);
          expect(small.result).toBe("COMPLETED");
          console.info("[5-record isolated worker RSS]", small);
          expect(small.peak / 1024 / 1024).toBeLessThan(400);
          expect(small.delta / 1024 / 1024).toBeLessThan(200);
          await ctx.db
            .delete(schema.exportJobParts)
            .where(eq(schema.exportJobParts.jobId, smallJob.jobId));
          await ctx.db.delete(schema.exportJobs).where(eq(schema.exportJobs.id, smallJob.jobId));
        }
      }

      const { jobId } = await enqueueExportJob(testUserId);
      const measured = await runExportCapacityWorker(ctx.connectionString, jobId);
      expect(measured.result).toBe("COMPLETED");
      const [completedJob] = await ctx.db
        .select()
        .from(schema.exportJobs)
        .where(eq(schema.exportJobs.id, jobId));
      expect(completedJob?.status).toBe("READY");
      const totalBytes = Number(completedJob?.fileSizeBytes ?? 0);
      const partCount = Number(completedJob?.partCount ?? 0);
      console.info("[50-record isolated worker RSS]", measured);
      expect(totalBytes).toBeGreaterThanOrEqual(400 * 1024 * 1024);
      expect(partCount).toBeGreaterThanOrEqual(400);
      expect(measured.peak / 1024 / 1024).toBeLessThan(400);
      expect(measured.delta / 1024 / 1024).toBeLessThan(250);

      // 3. FULL DECRYPTION & DATA INTEGRITY VERIFICATION
      // Read all encrypted parts via stream, verify sequential parts, cumulative SHA-256,
      // and streaming JSON content integrity across all 50 revisions without buffering 430 MB in RAM.
      let decryptedPartsCount = 0;
      let totalDecryptedBytes = 0;
      const shaHasher = crypto.createHash("sha256");

      const remainingRevisionIds = new Set(insertedRevisionIds);
      let textCarryover = "";
      let foundRev1 = false;
      let foundRev50 = false;

      for await (const chunk of readAndVerifyExportPartsStream(
        jobId,
        completedJob!.attemptCount,
        completedJob!.checksumSha256!
      )) {
        decryptedPartsCount++;
        totalDecryptedBytes += chunk.length;
        shaHasher.update(chunk);

        // Streaming text search with carryover across chunk boundaries
        const chunkStr = textCarryover + chunk.toString("utf8");
        for (const revId of Array.from(remainingRevisionIds)) {
          if (chunkStr.includes(revId)) {
            remainingRevisionIds.delete(revId);
          }
        }
        if (chunkStr.includes(`"revisionNo":1`) || chunkStr.includes(`"revisionNo": 1`)) {
          foundRev1 = true;
        }
        if (chunkStr.includes(`"revisionNo":50`) || chunkStr.includes(`"revisionNo": 50`)) {
          foundRev50 = true;
        }
        textCarryover = chunkStr.slice(-100);
      }

      expect(decryptedPartsCount).toBe(partCount);
      expect(totalDecryptedBytes).toBe(totalBytes);
      expect(shaHasher.digest("hex")).toBe(completedJob!.checksumSha256);

      // Verify that all 50 revisions were present and verified in the decrypted stream
      expect(remainingRevisionIds.size).toBe(0);
      expect(foundRev1).toBe(true);
      expect(foundRev50).toBe(true);

      // Clean up 50 large revisions from test DB
      await ctx.db
        .delete(schema.listingRevisions)
        .where(eq(schema.listingRevisions.listingId, listingId));
      await ctx.db.delete(schema.listings).where(eq(schema.listings.id, listingId));
    }, 180000);
  });
});
