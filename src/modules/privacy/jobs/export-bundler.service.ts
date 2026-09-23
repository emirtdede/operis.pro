import { getDb, schema } from "@/src/lib/db";
import { and, desc, eq, inArray, lte, or, sql } from "drizzle-orm";
import { ExportError } from "../export-errors";

/**
 * Enqueues a new export job for a user with duplicate active job collision handling.
 */
export async function enqueueExportJob(userId: string): Promise<{
  jobId: string;
  status: "PENDING" | "PROCESSING";
  pollAfterSeconds: number;
  alreadyRunning?: boolean;
}> {
  const db = getDb();

  // 1. Check for any active job for this user first
  const activeJobs = await db
    .select({
      id: schema.exportJobs.id,
      status: schema.exportJobs.status,
      progress: schema.exportJobs.progress,
    })
    .from(schema.exportJobs)
    .where(
      and(
        eq(schema.exportJobs.userId, userId),
        inArray(schema.exportJobs.status, ["PENDING", "PROCESSING"])
      )
    )
    .limit(1);

  const existing = activeJobs[0];
  if (existing) {
    return {
      jobId: existing.id,
      status: existing.status as "PENDING" | "PROCESSING",
      pollAfterSeconds: 3,
      alreadyRunning: true,
    };
  }

  // 2. Insert new PENDING job with safe conflict catch
  try {
    const [inserted] = await db
      .insert(schema.exportJobs)
      .values({
        userId,
        status: "PENDING",
        formatVersion: 2,
        attemptCount: 0,
        nextAttemptAt: new Date(),
        progress: 0,
      })
      .returning({ id: schema.exportJobs.id, status: schema.exportJobs.status });

    if (!inserted) {
      throw new Error("Failed to enqueue export job");
    }

    return {
      jobId: inserted.id,
      status: "PENDING",
      pollAfterSeconds: 3,
      alreadyRunning: false,
    };
  } catch (err: unknown) {
    // Classify duplicate key violation strictly by PostgreSQL SQLSTATE 23505 and exact constraint name
    const pgErr = ((err as { cause?: unknown })?.cause || err) as {
      code?: string;
      constraint?: string;
      message?: string;
    };
    const isConflict =
      pgErr?.code === "23505" &&
      (pgErr?.constraint === "export_jobs_one_active_user_idx" ||
        (typeof pgErr?.message === "string" &&
          pgErr.message.includes("export_jobs_one_active_user_idx")));

    if (isConflict) {
      const currentActive = await db
        .select({
          id: schema.exportJobs.id,
          status: schema.exportJobs.status,
        })
        .from(schema.exportJobs)
        .where(
          and(
            eq(schema.exportJobs.userId, userId),
            inArray(schema.exportJobs.status, ["PENDING", "PROCESSING"])
          )
        )
        .limit(1);

      const activeJob = currentActive[0];
      if (activeJob) {
        return {
          jobId: activeJob.id,
          status: activeJob.status as "PENDING" | "PROCESSING",
          pollAfterSeconds: 3,
          alreadyRunning: true,
        };
      }
    }

    throw err;
  }
}

/**
 * Retrieves the current status of an export job and automatically marks expired artifacts.
 */
export async function getExportJobStatus(userId: string, jobId?: string) {
  const db = getDb();
  const now = new Date();

  const query = db
    .select()
    .from(schema.exportJobs)
    .where(
      and(eq(schema.exportJobs.userId, userId), jobId ? eq(schema.exportJobs.id, jobId) : undefined)
    )
    .orderBy(desc(schema.exportJobs.createdAt))
    .limit(1);

  const [job] = await query;
  if (!job) {
    return null;
  }

  // Check expiration (completedAt + 24 hours or expiresAt)
  if (job.status === "READY" && job.expiresAt && job.expiresAt <= now) {
    await db.transaction(async (tx) => {
      await tx
        .update(schema.exportJobs)
        .set({ status: "EXPIRED" })
        .where(eq(schema.exportJobs.id, job.id));

      await tx.delete(schema.exportJobParts).where(eq(schema.exportJobParts.jobId, job.id));
    });

    return {
      ...job,
      status: "EXPIRED" as const,
    };
  }

  return job;
}

/**
 * Cancels an active PENDING or PROCESSING export job and purges partial parts.
 * Evaluates job state strictly INSIDE transaction with row-level FOR UPDATE locking
 * and conditional atomic update, ensuring completed READY results are never overwritten or deleted.
 */
export async function cancelExportJob(
  userId: string,
  jobId?: string
): Promise<{ success: boolean; message: string }> {
  const db = getDb();
  const now = new Date();

  return await db.transaction(async (tx) => {
    // 1. Row-level lock on candidate job row FOR UPDATE inside transaction
    const whereConds = [eq(schema.exportJobs.userId, userId)];
    if (jobId) {
      whereConds.push(eq(schema.exportJobs.id, jobId));
    } else {
      const statusCondition = or(
        eq(schema.exportJobs.status, "PENDING"),
        eq(schema.exportJobs.status, "PROCESSING")
      );
      if (statusCondition) {
        whereConds.push(statusCondition);
      }
    }

    const lockedJobs = await tx
      .select({
        id: schema.exportJobs.id,
        status: schema.exportJobs.status,
        userId: schema.exportJobs.userId,
      })
      .from(schema.exportJobs)
      .where(and(...whereConds))
      .orderBy(desc(schema.exportJobs.createdAt))
      .limit(1)
      .for("update");

    const job = lockedJobs[0];
    if (!job) {
      throw new ExportError("EXPORT_JOB_NOT_FOUND", "No active export job found to cancel", 404);
    }

    if (job.status !== "PENDING" && job.status !== "PROCESSING") {
      throw new ExportError(
        "EXPORT_CANNOT_CANCEL",
        `Cannot cancel export job in ${job.status} status`,
        400
      );
    }

    // 2. Perform conditional atomic update strictly requiring status IN ('PENDING', 'PROCESSING')
    const updateResult = await tx
      .update(schema.exportJobs)
      .set({
        status: "FAILED",
        errorCode: "EXPORT_CANCELLED_BY_USER",
        errorMessage: "Export job was cancelled by user request.",
        completedAt: now,
        leaseToken: null,
        leaseUntil: null,
      })
      .where(
        and(
          eq(schema.exportJobs.id, job.id),
          eq(schema.exportJobs.userId, userId),
          or(eq(schema.exportJobs.status, "PENDING"), eq(schema.exportJobs.status, "PROCESSING"))
        )
      )
      .returning({ id: schema.exportJobs.id });

    if (updateResult.length === 0) {
      throw new ExportError(
        "EXPORT_CANNOT_CANCEL",
        "Cannot cancel export job: job is no longer active",
        400
      );
    }

    // 3. ONLY delete parts if cancel update actually succeeded!
    await tx.delete(schema.exportJobParts).where(eq(schema.exportJobParts.jobId, job.id));

    return { success: true, message: "Export job successfully cancelled." };
  });
}

/**
 * Periodically purges expired export packages and cleans storage records.
 */
export async function cleanupExpiredJobs(referenceTime: Date = new Date()): Promise<number> {
  const db = getDb();
  return await db.transaction(async (tx) => {
    const expiredJobs = await tx
      .update(schema.exportJobs)
      .set({ status: "EXPIRED" })
      .where(
        or(
          and(
            lte(schema.exportJobs.expiresAt, referenceTime),
            sql`${schema.exportJobs.status} != 'EXPIRED'`
          ),
          eq(schema.exportJobs.status, "EXPIRED")
        )
      )
      .returning({ id: schema.exportJobs.id });

    if (expiredJobs.length > 0) {
      const jobIds = expiredJobs.map((job) => job.id);
      await tx.delete(schema.exportJobParts).where(inArray(schema.exportJobParts.jobId, jobIds));
    }
    return expiredJobs.length;
  });
}
