import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import pg from "pg";
import { z } from "zod";
import { getDb } from "../../src/lib/db";
import { getEnv } from "../../src/config/env";
import { sql } from "drizzle-orm";

export const CheckpointV2PhaseEnum = z.enum([
  "USERS",
  "IDENTITIES",
  "EXPORT_PARTS",
  "VERIFY",
  "DONE",
]);
export type CheckpointV2Phase = z.infer<typeof CheckpointV2PhaseEnum>;

export const CheckpointV2JobTypeEnum = z.enum(["BACKFILL", "ROTATION"]);
export type CheckpointV2JobType = z.infer<typeof CheckpointV2JobTypeEnum>;

export const CheckpointV2Schema = z.object({
  version: z.literal(2),
  jobType: CheckpointV2JobTypeEnum,
  phase: CheckpointV2PhaseEnum,
  lastSuccessfulId: z.string().nullable(),
  keyId: z.string().min(1).max(32),
  databaseFingerprint: z.string(),
  totalProcessed: z.number().int().nonnegative(),
  totalFailed: z.number().int().nonnegative(),
  startedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CheckpointV2 = z.infer<typeof CheckpointV2Schema>;

export const PII_ADVISORY_LOCK_ID = 987654321;

export interface PiiAdvisoryLockHandle {
  client: pg.PoolClient | pg.Client;
  release: () => Promise<void>;
}

/**
 * Computes a deterministic fingerprint of the active database connection, schema, and deployment.
 */
export async function getDatabaseFingerprint(): Promise<string> {
  const db = getDb();
  const dbRes = await db.execute<{ current_database: string }>(
    sql`SELECT current_database() as current_database`
  );
  const schemaRes = await db.execute<{ current_schema: string }>(
    sql`SELECT current_schema() as current_schema`
  );

  let deploymentId = "default_deployment";
  try {
    const depRes = await db.execute<{ deployment_id: string }>(
      sql`SELECT deployment_id FROM maintenance_identity WHERE is_singleton = true LIMIT 1`
    );
    const depRows = depRes.rows as unknown as Array<{ deployment_id?: string }>;
    if (depRows[0]?.deployment_id) {
      deploymentId = depRows[0].deployment_id;
    }
  } catch {
    // If maintenance_identity table does not exist in early migration states
  }

  const dbRows = dbRes.rows as unknown as Array<{ current_database?: string }>;
  const schemaRows = schemaRes.rows as unknown as Array<{ current_schema?: string }>;

  const dbName = dbRows[0]?.current_database || "unknown_db";
  const schemaName = schemaRows[0]?.current_schema || "public";

  return crypto
    .createHash("sha256")
    .update(`${deploymentId}:${dbName}:${schemaName}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Acquires a session-level PostgreSQL advisory lock using a dedicated client
 * to prevent lock leaks across connection pool reallocations and avoid starving
 * the application pool when pool max is 1.
 */
export async function acquireDedicatedPiiAdvisoryLock(): Promise<PiiAdvisoryLockHandle | null> {
  const env = getEnv();
  const connectionString =
    process.env.DATABASE_MIGRATION_URL || env.DATABASE_MIGRATION_URL || env.DATABASE_URL;
  const isSupabase =
    connectionString.includes("supabase.co") || connectionString.includes("pooler.supabase.com");

  const client = new pg.Client({
    connectionString,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();
  try {
    const res = await client.query<{ acquired: boolean }>(
      `SELECT pg_try_advisory_lock(${PII_ADVISORY_LOCK_ID}) as acquired;`
    );
    const acquired = Boolean(res.rows[0]?.acquired);
    if (!acquired) {
      await client.end().catch(() => {});
      return null;
    }

    let released = false;
    const release = async () => {
      if (released) return;
      released = true;
      try {
        await client.query(`SELECT pg_advisory_unlock(${PII_ADVISORY_LOCK_ID});`).catch(() => {});
      } finally {
        await client.end().catch(() => {});
      }
    };

    return { client, release };
  } catch (err) {
    await client.end().catch(() => {});
    throw err;
  }
}

let globalLockHandle: PiiAdvisoryLockHandle | null = null;

/**
 * Tries to acquire a global PostgreSQL advisory lock for PII migration/rotation.
 */
export async function acquirePiiAdvisoryLock(): Promise<boolean> {
  if (globalLockHandle) return true;
  const handle = await acquireDedicatedPiiAdvisoryLock();
  if (handle) {
    globalLockHandle = handle;
    return true;
  }
  return false;
}

/**
 * Releases the global PostgreSQL advisory lock.
 */
export async function releasePiiAdvisoryLock(): Promise<void> {
  if (globalLockHandle) {
    await globalLockHandle.release();
    globalLockHandle = null;
  }
}

export class PiiCheckpointManager {
  private checkpoint: CheckpointV2;

  constructor(
    private readonly checkpointFilePath: string,
    initialData: {
      jobType: CheckpointV2JobType;
      phase: CheckpointV2Phase;
      keyId: string;
      databaseFingerprint: string;
    }
  ) {
    this.checkpoint = {
      version: 2,
      jobType: initialData.jobType,
      phase: initialData.phase,
      lastSuccessfulId: null,
      keyId: initialData.keyId,
      databaseFingerprint: initialData.databaseFingerprint,
      totalProcessed: 0,
      totalFailed: 0,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  static async loadOrCreate(
    filePath: string,
    keyId: string,
    jobType: CheckpointV2JobType = "ROTATION",
    initialPhase: CheckpointV2Phase = "USERS"
  ): Promise<PiiCheckpointManager> {
    const currentFingerprint = await getDatabaseFingerprint();

    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(raw);
        const validated = CheckpointV2Schema.parse(parsed);

        // Security check: Database fingerprint, jobType, and keyId must match
        if (validated.databaseFingerprint !== currentFingerprint) {
          throw new Error(
            `FINGERPRINT_MISMATCH: Checkpoint belongs to DB fingerprint ${validated.databaseFingerprint}, but current is ${currentFingerprint}`
          );
        }

        if (validated.jobType !== jobType) {
          throw new Error(
            `JOB_TYPE_MISMATCH: Checkpoint belongs to jobType '${validated.jobType}', but current is '${jobType}'`
          );
        }

        if (validated.keyId !== keyId) {
          throw new Error(
            `KEY_ID_MISMATCH: Checkpoint target keyId '${validated.keyId}' does not match current target '${keyId}'`
          );
        }

        const manager = new PiiCheckpointManager(filePath, {
          jobType: validated.jobType,
          phase: validated.phase,
          keyId: validated.keyId,
          databaseFingerprint: validated.databaseFingerprint,
        });
        manager.checkpoint = validated;
        return manager;
      } catch (err) {
        throw new Error(`INVALID_CHECKPOINT_V2: Failed to load checkpoint at ${filePath}: ${err}`, {
          cause: err,
        });
      }
    }

    const manager = new PiiCheckpointManager(filePath, {
      jobType,
      phase: initialPhase,
      keyId,
      databaseFingerprint: currentFingerprint,
    });
    manager.saveAtomic();
    return manager;
  }

  get data(): Readonly<CheckpointV2> {
    return this.checkpoint;
  }

  /**
   * Records a single row success.
   * Atomically advances lastSuccessfulId and persists to disk.
   */
  recordSuccess(recordId: string): void {
    this.checkpoint.lastSuccessfulId = recordId;
    this.checkpoint.totalProcessed++;
    this.checkpoint.updatedAt = new Date().toISOString();
    this.saveAtomic();
  }

  /**
   * CRITICAL INVARIANT (K03):
   * On failure, totalFailed is incremented, but lastSuccessfulId is NEVER ADVANCED.
   * The manager saves atomically and execution must stop immediately.
   */
  recordFailureAndHalt(failingRecordId: string, reason: string): never {
    this.checkpoint.totalFailed++;
    this.checkpoint.updatedAt = new Date().toISOString();
    this.saveAtomic();

    throw new Error(
      `PII_ROTATION_HALTED_ON_FAILURE: Record '${failingRecordId}' failed: ${reason}. Checkpoint halted without advancing past '${this.checkpoint.lastSuccessfulId}'.`
    );
  }

  /**
   * Transitions to the next phase and resets lastSuccessfulId for the new table.
   */
  transitionPhase(nextPhase: CheckpointV2Phase): void {
    this.checkpoint.phase = nextPhase;
    this.checkpoint.lastSuccessfulId = null;
    this.checkpoint.updatedAt = new Date().toISOString();
    this.saveAtomic();
  }

  /**
   * Marks the job as DONE and persists the checkpoint file as permanent proof.
   */
  markDone(): void {
    this.checkpoint.phase = "DONE";
    this.checkpoint.updatedAt = new Date().toISOString();
    this.saveAtomic();
  }

  /**
   * Atomically writes checkpoint to a temporary file, calls fsync, and renames.
   */
  private saveAtomic(): void {
    const dir = path.dirname(this.checkpointFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }

    const payload = JSON.stringify(this.checkpoint, null, 2);
    const tmpFile = `${this.checkpointFilePath}.tmp.${process.pid}.${Date.now()}`;

    const fd = fs.openSync(tmpFile, "w", 0o600);
    try {
      fs.writeFileSync(fd, payload, "utf8");
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }

    fs.renameSync(tmpFile, this.checkpointFilePath);
  }

  /**
   * Retained for backward compatibility: keeps DONE checkpoint intact.
   */
  cleanUp(): void {
    this.markDone();
  }
}
