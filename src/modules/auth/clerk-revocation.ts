import { randomUUID } from "node:crypto";
import { and, asc, eq, gt, lte, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";

export class ClerkVerificationUnavailable extends Error {
  constructor() {
    super("CLERK_VERIFICATION_UNAVAILABLE");
  }
}
async function bounded<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new ClerkVerificationUnavailable()), 5000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
export async function isClerkSessionRevokedOrObsolete(input: {
  userId: string;
  clerkUserId?: string;
  clerkSessionId?: string | null;
  currentAuthVersion: number;
  sessionsInvalidBefore?: Date | string | null;
  userUpdatedAt?: Date | string | null;
  tokenIatSec?: number | null;
}): Promise<boolean> {
  if (!input.clerkSessionId || !input.clerkUserId) return true;
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await bounded(clerkClient());
    const session = await bounded(client.sessions.getSession(input.clerkSessionId));
    const cutoff = input.sessionsInvalidBefore
      ? new Date(input.sessionsInvalidBefore).getTime()
      : NaN;
    const created = session?.createdAt ? new Date(session.createdAt).getTime() : NaN;
    if (
      session?.userId !== input.clerkUserId ||
      session.status !== "active" ||
      !Number.isFinite(created)
    )
      return true;
    if (!input.sessionsInvalidBefore) return input.currentAuthVersion !== 1;
    if (!Number.isFinite(cutoff)) return true;
    if (created > cutoff) return false;
    const [exception] = await getDb()
      .select({ id: schema.clerkRevocationJobs.id })
      .from(schema.clerkRevocationJobs)
      .where(
        and(
          eq(schema.clerkRevocationJobs.userId, input.userId),
          eq(schema.clerkRevocationJobs.authVersion, input.currentAuthVersion),
          eq(schema.clerkRevocationJobs.preserveSessionId, input.clerkSessionId)
        )
      )
      .limit(1);
    return !exception;
  } catch {
    throw new ClerkVerificationUnavailable();
  }
}
export interface RevocationResult {
  success: boolean;
  revokedCount: number;
  failedCount: number;
  failedSessionIds: string[];
  errors: string[];
}
export async function revokeClerkSessionsForUser(
  clerkUserId: string,
  options?: {
    preserveSessionId?: string | null;
    cutoff?: Date;
    beforeOperation?: () => Promise<void>;
  }
): Promise<RevocationResult> {
  const result: RevocationResult = {
    success: false,
    revokedCount: 0,
    failedCount: 0,
    failedSessionIds: [],
    errors: [],
  };
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await bounded(clerkClient());
    const ids = new Set<string>();
    for (let offset = 0; ; offset += 100) {
      await options?.beforeOperation?.();
      const response = await bounded(
        client.sessions.getSessionList({
          userId: clerkUserId,
          status: "active",
          limit: 100,
          offset,
        })
      );
      const sessions = response.data;
      if (!Array.isArray(sessions)) throw new Error("INVALID_SESSION_LIST");
      for (const session of sessions) {
        if (session.id === options?.preserveSessionId) continue;
        const created = session.createdAt ? new Date(session.createdAt).getTime() : NaN;
        if (options?.cutoff && !Number.isFinite(created)) throw new Error("INVALID_SESSION_DATE");
        if (!options?.cutoff || created <= options.cutoff.getTime()) ids.add(session.id);
      }
      if (sessions.length < 100) break;
    }
    // List before revoking so offset pagination cannot skip removed sessions.
    for (const id of ids) {
      try {
        await options?.beforeOperation?.();
        await bounded(client.sessions.revokeSession(id));
        result.revokedCount++;
      } catch {
        result.failedSessionIds.push(id);
        result.failedCount++;
      }
    }
    result.success = result.failedCount === 0;
  } catch {
    result.failedCount++;
  }
  if (!result.success) result.errors.push("CLERK_REVOCATION_FAILED");
  return result;
}
/** The users trigger writes jobs atomically with every auth-version update. */
export async function processClerkRevocationJobs(limit = 25): Promise<number> {
  const db = getDb();
  const table = schema.clerkRevocationJobs;
  const due = and(
    lte(table.nextAttemptAt, sql`clock_timestamp()`),
    or(
      eq(table.status, "PENDING"),
      and(eq(table.status, "PROCESSING"), lte(table.leaseUntil, sql`clock_timestamp()`))
    )
  );
  const candidates = await db
    .select()
    .from(table)
    .where(due)
    .orderBy(asc(table.createdAt))
    .limit(limit);
  let completed = 0;
  for (const candidate of candidates) {
    const token = randomUUID();
    const job = await db.transaction(async (tx) => {
      // A user may have several security changes queued. Serializing claims prevents
      // another version's worker from changing Clerk's offset pages while we read them.
      const [user] = await tx
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.id, candidate.userId))
        .for("update");
      if (!user) return null;
      const [activeJob] = await tx
        .select({ id: table.id })
        .from(table)
        .where(
          and(
            eq(table.userId, candidate.userId),
            eq(table.status, "PROCESSING"),
            gt(table.leaseUntil, sql`clock_timestamp()`)
          )
        )
        .limit(1);
      if (activeJob) return null;
      const [claimed] = await tx
        .update(table)
        .set({
          status: "PROCESSING",
          leaseToken: token,
          leaseUntil: new Date(Date.now() + 120000),
          attemptCount: sql`${table.attemptCount} + 1`,
        })
        .where(and(eq(table.id, candidate.id), due))
        .returning();
      return claimed ?? null;
    });
    if (!job) continue;
    const result = await revokeClerkSessionsForUser(job.clerkUserId, {
      cutoff: job.cutoff,
      preserveSessionId: job.preserveSessionId,
      beforeOperation: async () => {
        const [renewed] = await db
          .update(table)
          .set({ leaseUntil: new Date(Date.now() + 120000) })
          .where(
            and(
              eq(table.id, job.id),
              eq(table.leaseToken, token),
              eq(table.status, "PROCESSING"),
              gt(table.leaseUntil, sql`clock_timestamp()`)
            )
          )
          .returning({ id: table.id });
        if (!renewed) throw new Error("CLERK_REVOCATION_LEASE_LOST");
      },
    });
    const status = result.success ? "DONE" : job.attemptCount >= 12 ? "DEAD" : "PENDING";
    const updated = await db
      .update(table)
      .set({
        status,
        leaseToken: null,
        leaseUntil: null,
        lastError: result.success ? null : "CLERK_REVOCATION_FAILED",
        nextAttemptAt: new Date(Date.now() + Math.min(3600000, 1000 * 2 ** job.attemptCount)),
      })
      .where(and(eq(table.id, job.id), eq(table.leaseToken, token)))
      .returning({ id: table.id });
    if (updated.length && result.success) completed++;
    if (!result.success)
      console.error("[Clerk revocation job]", {
        jobId: job.id,
        status,
        attempts: job.attemptCount,
      });
  }
  return completed;
}
