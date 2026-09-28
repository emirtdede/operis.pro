import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createIsolatedTestDatabase, TestDatabaseContext } from "@/tests/helpers/test-database";
import { setDbForTesting, resetDbForTesting } from "@/src/lib/db";
import * as schema from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import crypto from "node:crypto";
import pg from "pg";
import { claimAndProcessExportJob, enqueueExportJob } from "@/src/modules/privacy/export-jobs";
import { writeEncryptedExportParts } from "@/src/modules/privacy/export-writer";
import { POST as exportRoutePost } from "@/src/app/api/account/export/route";
import { NextRequest } from "next/server";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/src/modules/auth/session";

describe("B26 Export Jobs Architecture & Worker Lease Integration", () => {
  let ctx: TestDatabaseContext;
  const testUserId = DEFAULT_USER.id;
  let sessionToken: string;

  beforeAll(async () => {
    ctx = await createIsolatedTestDatabase();
    setDbForTesting(ctx.db, ctx.pool);

    sessionToken = createSessionToken({
      id: testUserId,
      email: DEFAULT_USER.email,
      role: "USER",
      status: "ACTIVE",
    });

    // Ensure test user exists in the isolated database
    await ctx.db
      .insert(schema.users)
      .values({
        id: testUserId,
        email: DEFAULT_USER.email,
        passwordHash: "dummy_hash_for_test",
        role: "USER",
        status: "ACTIVE",
      })
      .onConflictDoNothing();
  });

  afterAll(async () => {
    resetDbForTesting();
    if (ctx) {
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

  it("completes snapshot and writer work with the production single-slot pool", async () => {
    const pool = new pg.Pool({ connectionString: ctx.connectionString, max: 1 });
    try {
      const { jobId } = await enqueueExportJob(testUserId);
      expect(
        await claimAndProcessExportJob(jobId, crypto.randomUUID(), {
          pool,
          maxDurationMs: 10000,
        })
      ).toBe("COMPLETED");
      const [job] = await ctx.db
        .select()
        .from(schema.exportJobs)
        .where(eq(schema.exportJobs.id, jobId));
      expect(job?.status).toBe("READY");
      expect(pool.waitingCount).toBe(0);
    } finally {
      await pool.end();
    }
  });

  it("POST returns 202 Accepted on new export job creation", async () => {
    const req = new NextRequest("http://localhost:3000/api/account/export", {
      method: "POST",
      headers: {
        "x-locale": "tr",
        cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
      },
    });

    const res = await exportRoutePost(req);
    expect(res.status).toBe(202);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.jobId).toBeDefined();
    expect(body.status).toBe("PENDING");

    const [row] = await ctx.db
      .select()
      .from(schema.exportJobs)
      .where(eq(schema.exportJobs.id, body.jobId));
    expect(row).toBeDefined();
    expect(row?.userId).toBe(testUserId);
    expect(row?.status).toBe("PENDING");
  });

  it("returns 409 Conflict if an active job already exists for the user", async () => {
    const enqueued = await enqueueExportJob(testUserId);
    expect(enqueued.status).toBe("PENDING");

    const req = new NextRequest("http://localhost:3000/api/account/export", {
      method: "POST",
      headers: {
        "x-locale": "en",
        cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
      },
    });

    const res = await exportRoutePost(req);
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.errorCode).toBe("EXPORT_ALREADY_ACTIVE");
  });

  it("enforces database unique partial index preventing concurrent active jobs", async () => {
    await enqueueExportJob(testUserId);

    let dbError: unknown = null;
    try {
      await ctx.db.insert(schema.exportJobs).values({
        userId: testUserId,
        status: "PENDING",
      });
    } catch (err) {
      dbError = err;
    }

    expect(dbError).toMatchObject({
      cause: { code: "23505", constraint: "export_jobs_one_active_user_idx" },
    });
  });

  it("worker atomically claims job with UUID lease, processes data, and creates encrypted parts", async () => {
    const { jobId } = await enqueueExportJob(testUserId);
    const workerTokenA = crypto.randomUUID();

    // Claim and process
    const result = await claimAndProcessExportJob(jobId, workerTokenA);
    expect(result).toBe("COMPLETED");

    const [finishedJob] = await ctx.db
      .select()
      .from(schema.exportJobs)
      .where(eq(schema.exportJobs.id, jobId));

    expect(finishedJob).toBeDefined();
    expect(finishedJob?.status).toBe("READY");
    expect(finishedJob?.progress).toBe(100);
    expect(finishedJob?.checksumSha256).toBeDefined();
    expect(finishedJob?.checksumSha256?.length).toBe(64);
    expect(finishedJob?.fileSizeBytes).toBeGreaterThan(0);
    expect(finishedJob?.partCount).toBeGreaterThan(0);

    // Verify parts stored
    const parts = await ctx.db
      .select()
      .from(schema.exportJobParts)
      .where(eq(schema.exportJobParts.jobId, jobId))
      .orderBy(schema.exportJobParts.partNo);

    expect(parts.length).toBe(finishedJob?.partCount);
    for (const part of parts) {
      expect(part.payloadEnc.startsWith("v2:")).toBe(true);
      expect(part.byteLength).toBeGreaterThan(0);
      expect(part.plaintextSha256.length).toBe(64);
    }
  });

  it("prevents stale worker from proceeding after lease loss and rejects operations on expired lease", async () => {
    const { jobId } = await enqueueExportJob(testUserId);
    const workerTokenA = crypto.randomUUID();
    const workerTokenB = crypto.randomUUID();

    // Worker A claims job
    await ctx.db
      .update(schema.exportJobs)
      .set({
        status: "PROCESSING",
        leaseToken: workerTokenA,
        attemptCount: 1,
        leaseUntil: new Date(Date.now() - 5000), // Expired
      })
      .where(eq(schema.exportJobs.id, jobId));

    // Test 1: Worker A tries to renew lease or finalize while expired and before Worker B takes over
    // Renewal query MUST fail because leaseUntil is expired
    const renewedExpired = await ctx.db
      .update(schema.exportJobs)
      .set({ leaseUntil: new Date(Date.now() + 60000) })
      .where(
        and(
          eq(schema.exportJobs.id, jobId),
          eq(schema.exportJobs.leaseToken, workerTokenA),
          eq(schema.exportJobs.status, "PROCESSING"),
          gt(schema.exportJobs.leaseUntil, new Date())
        )
      )
      .returning({ id: schema.exportJobs.id });
    expect(renewedExpired.length).toBe(0);

    // Test 2: Worker B takes over the expired lease
    const resultB = await claimAndProcessExportJob(jobId, workerTokenB);
    expect(["COMPLETED", "FAILED", "RETRY_SCHEDULED"]).toContain(resultB);

    // Check Worker B's result state
    const [jobAfterB] = await ctx.db
      .select()
      .from(schema.exportJobs)
      .where(eq(schema.exportJobs.id, jobId));
    expect(jobAfterB?.status).toBe("READY");

    // Test 3: Worker A now attempts to write parts with stale lease token
    let workerAWriteError: unknown = null;
    try {
      await writeEncryptedExportParts(jobId, 1, Buffer.from("stale data from A"), workerTokenA);
    } catch (err) {
      workerAWriteError = err;
    }
    expect(workerAWriteError).toBeDefined();

    // Test 4: Worker A claimAndProcess must return LEASE_LOST without clobbering Worker B
    const resultA = await claimAndProcessExportJob(jobId, workerTokenA);
    expect(resultA).toBe("LEASE_LOST");

    // Verify Worker B's READY result was fully preserved
    const [finalJob] = await ctx.db
      .select()
      .from(schema.exportJobs)
      .where(eq(schema.exportJobs.id, jobId));
    expect(finalJob?.status).toBe("READY");
    expect(finalJob?.attemptCount).toBeGreaterThanOrEqual(2);
  });
});
