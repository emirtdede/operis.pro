import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { asc, eq, sql } from "drizzle-orm";
import { createIsolatedTestDatabase, type TestDatabaseContext } from "../helpers/test-database";
import { setDbForTesting, resetDbForTesting } from "@/src/lib/db";
import * as schema from "@/db/schema";
import {
  isClerkSessionRevokedOrObsolete,
  processClerkRevocationJobs,
} from "@/src/modules/auth/clerk-revocation";

const remote = vi.hoisted(() => ({
  getSession: vi.fn(),
  getSessionList: vi.fn(),
  revokeSession: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({ clerkClient: async () => ({ sessions: remote }) }));
describe("durable readiness boundaries", () => {
  let ctx: TestDatabaseContext;
  beforeAll(async () => {
    ctx = await createIsolatedTestDatabase();
    setDbForTesting(ctx.db, ctx.pool);
  }, 60000);
  afterAll(async () => {
    resetDbForTesting();
    await ctx?.destroy();
  });
  beforeEach(() => vi.resetAllMocks());
  async function user() {
    const id = randomUUID();
    await ctx.db
      .insert(schema.users)
      .values({ id, email: `${id}@example.test`, passwordHash: "old", clerkUserId: `clerk_${id}` });
    return id;
  }
  it("atomically records every security bump, survives a separate process and fails closed", async () => {
    const id = await user();
    await ctx.db
      .update(schema.users)
      .set({ authVersion: 2, passwordHash: "new" })
      .where(eq(schema.users.id, id));
    const child = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `
      import pg from 'pg'; const c=new pg.Client({connectionString:process.env.TEST_CHILD_DB});
      await c.connect(); const r=await c.query('select auth_version, sessions_invalid_before from users where id=$1',[process.env.TEST_CHILD_USER]);
      console.log(JSON.stringify(r.rows[0])); await c.end();
    `,
      ],
      {
        env: { ...process.env, TEST_CHILD_DB: ctx.connectionString, TEST_CHILD_USER: id },
        encoding: "utf8",
      }
    );
    const durable = JSON.parse(child);
    expect(durable.auth_version).toBe(2);
    const input = {
      userId: id,
      clerkUserId: `clerk_${id}`,
      clerkSessionId: "old",
      currentAuthVersion: 2,
      sessionsInvalidBefore: durable.sessions_invalid_before,
      tokenIatSec: Math.floor(Date.now() / 1000),
    };
    remote.getSession.mockRejectedValue(new Error("provider down"));
    await expect(isClerkSessionRevokedOrObsolete(input)).rejects.toThrow(
      "CLERK_VERIFICATION_UNAVAILABLE"
    );
    remote.getSession.mockResolvedValue({
      userId: input.clerkUserId,
      status: "active",
      createdAt: Date.now() - 60000,
    });
    expect(await isClerkSessionRevokedOrObsolete(input)).toBe(true);
    remote.getSession.mockResolvedValue({
      userId: input.clerkUserId,
      status: "active",
      createdAt: Date.now() + 1000,
    });
    expect(await isClerkSessionRevokedOrObsolete(input)).toBe(false);
    const jobs = await ctx.db
      .select()
      .from(schema.clerkRevocationJobs)
      .where(eq(schema.clerkRevocationJobs.userId, id));
    expect(jobs).toHaveLength(1);
  });
  it("rolls back credentials if the durable job cannot be inserted", async () => {
    const id = await user();
    await ctx.db
      .insert(schema.clerkRevocationJobs)
      .values({ userId: id, clerkUserId: `clerk_${id}`, authVersion: 2, cutoff: new Date() });
    await expect(
      ctx.db
        .update(schema.users)
        .set({ authVersion: 2, passwordHash: "changed" })
        .where(eq(schema.users.id, id))
    ).rejects.toThrow();
    const [row] = await ctx.db.select().from(schema.users).where(eq(schema.users.id, id));
    if (!row) throw new Error("missing user");
    expect(row.passwordHash).toBe("old");
    expect(row.authVersion).toBe(1);
  });
  it("retries failed jobs and never revokes post-cutoff sessions", async () => {
    await ctx.db.delete(schema.clerkRevocationJobs);
    const id = await user();
    await ctx.db.update(schema.users).set({ authVersion: 2 }).where(eq(schema.users.id, id));
    remote.getSessionList.mockRejectedValue(new Error("offline"));
    await processClerkRevocationJobs();
    let [job] = await ctx.db.select().from(schema.clerkRevocationJobs);
    if (!job) throw new Error("missing job");
    expect(job.status).toBe("PENDING");
    expect(job.attemptCount).toBe(1);
    await ctx.db.update(schema.clerkRevocationJobs).set({ nextAttemptAt: new Date(0) });
    remote.getSessionList.mockResolvedValue({
      data: [
        { id: "old", createdAt: new Date(0) },
        { id: "fresh", createdAt: new Date(job.cutoff.getTime() + 1000) },
      ],
    });
    remote.revokeSession.mockResolvedValue({});
    await Promise.all([processClerkRevocationJobs(), processClerkRevocationJobs()]);
    [job] = await ctx.db.select().from(schema.clerkRevocationJobs);
    if (!job) throw new Error("missing job");
    expect(job.status).toBe("DONE");
    expect(remote.revokeSession).toHaveBeenCalledTimes(1);
    expect(remote.revokeSession).toHaveBeenCalledWith("old");
    // An unrelated profile update must not move the cutoff.
    await ctx.db
      .update(schema.users)
      .set({ updatedAt: sql`now()` })
      .where(eq(schema.users.id, id));
    const [row] = await ctx.db.select().from(schema.users).where(eq(schema.users.id, id));
    if (!row || !job) throw new Error("missing state");
    expect(row.sessionsInvalidBefore).toEqual(job.cutoff);
  });

  it("serializes different auth-version jobs for the same user across competing workers", async () => {
    await ctx.db.delete(schema.clerkRevocationJobs);
    const id = await user();
    await ctx.db.update(schema.users).set({ authVersion: 2 }).where(eq(schema.users.id, id));
    await ctx.db.update(schema.users).set({ authVersion: 3 }).where(eq(schema.users.id, id));
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    remote.getSessionList.mockImplementation(async () => {
      await gate;
      return { data: [] };
    });
    const first = processClerkRevocationJobs();
    try {
      await vi.waitFor(() => expect(remote.getSessionList).toHaveBeenCalledTimes(1));
      expect(await processClerkRevocationJobs()).toBe(0);
      const jobs = await ctx.db
        .select()
        .from(schema.clerkRevocationJobs)
        .orderBy(asc(schema.clerkRevocationJobs.authVersion));
      expect(jobs.map((job) => job.status)).toEqual(["PROCESSING", "PENDING"]);
      expect(remote.getSessionList).toHaveBeenCalledTimes(1);
    } finally {
      release();
      await first;
    }
    const jobs = await ctx.db.select().from(schema.clerkRevocationJobs);
    expect(jobs.every((job) => job.status === "DONE")).toBe(true);
    expect(remote.getSessionList).toHaveBeenCalledTimes(2);
  });

  it("recovers an expired lease and fences a stale worker before remote deletion", async () => {
    await ctx.db.delete(schema.clerkRevocationJobs);
    const id = await user();
    await ctx.db.update(schema.users).set({ authVersion: 2 }).where(eq(schema.users.id, id));
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    remote.getSessionList
      .mockImplementationOnce(async () => {
        await gate;
        return { data: [{ id: "old", createdAt: 1 }] };
      })
      .mockResolvedValue({ data: [] });
    const staleWorker = processClerkRevocationJobs();
    try {
      await vi.waitFor(() => expect(remote.getSessionList).toHaveBeenCalledTimes(1));
      await ctx.db.update(schema.clerkRevocationJobs).set({ leaseUntil: new Date(0) });
      expect(await processClerkRevocationJobs()).toBe(1);
    } finally {
      release();
      await staleWorker;
    }
    const [job] = await ctx.db.select().from(schema.clerkRevocationJobs);
    expect(job).toEqual(
      expect.objectContaining({ status: "DONE", attemptCount: 2, leaseToken: null })
    );
    expect(remote.revokeSession).not.toHaveBeenCalled();
  });

  it("preserves only the current device recorded for the current security version", async () => {
    await ctx.db.delete(schema.clerkRevocationJobs);
    const id = await user();
    const { bumpUserAuthVersion } = await import("@/src/modules/auth/session");
    expect(
      await bumpUserAuthVersion(id, undefined, { clerkUserId: `clerk_${id}`, sessionId: "current" })
    ).toBe(2);
    let [row] = await ctx.db.select().from(schema.users).where(eq(schema.users.id, id));
    remote.getSession.mockResolvedValue({
      id: "current",
      userId: `clerk_${id}`,
      status: "active",
      createdAt: 1,
    });
    expect(
      await isClerkSessionRevokedOrObsolete({
        userId: id,
        clerkUserId: `clerk_${id}`,
        clerkSessionId: "current",
        currentAuthVersion: 2,
        sessionsInvalidBefore: row!.sessionsInvalidBefore,
      })
    ).toBe(false);
    remote.getSessionList.mockResolvedValue({
      data: [
        { id: "current", createdAt: 1 },
        { id: "other", createdAt: 1 },
      ],
    });
    remote.revokeSession.mockResolvedValue({});
    await processClerkRevocationJobs();
    expect(remote.revokeSession).toHaveBeenCalledExactlyOnceWith("other");
    await ctx.db.update(schema.users).set({ authVersion: 3 }).where(eq(schema.users.id, id));
    [row] = await ctx.db.select().from(schema.users).where(eq(schema.users.id, id));
    expect(
      await isClerkSessionRevokedOrObsolete({
        userId: id,
        clerkUserId: `clerk_${id}`,
        clerkSessionId: "current",
        currentAuthVersion: 3,
        sessionsInvalidBefore: row!.sessionsInvalidBefore,
      })
    ).toBe(true);
  });
});
