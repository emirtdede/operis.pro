import crypto from "node:crypto";
import type pg from "pg";
import {
  acquireClientWithDeadline,
  cancelBackendPid,
  type CancelBackendOptions,
  getDb,
  getDbPool,
  schema,
  terminateClientSafely,
} from "@/src/lib/db";
import { encryptEnvelopeV2Buffer, decryptEnvelopeV2Buffer } from "@/src/lib/crypto/envelope";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { ExportError } from "./export-errors";

export const CHUNK_SIZE_BYTES = 1024 * 1024; // 1 MiB bounded chunk size

export interface ExportWriterResult {
  partCount: number;
  totalBytes: number;
  cumulativeSha256: string;
}

export interface ExportWriterOptions {
  signal?: AbortSignal;
  deadlineAt?: number;
  remainingDeadlineMs?: number;
  pool?: pg.Pool;
  onPartWritten?: (partNo: number, byteLength: number) => Promise<void> | void;
}

/**
 * Runs a transactional database operation with bounded statement_timeout and lock_timeout
 * derived from the remaining job deadline, tracking backend PID and issuing real pg_cancel_backend
 * via an independent dedicated client when aborted.
 * Guarantees that connection is rolled back and safely terminated (not returned dirty to pool).
 */
export async function runFencedWriterTx<T>(
  signal: AbortSignal | undefined,
  callback: (txDb: NodePgDatabase<typeof schema>, client: pg.PoolClient) => Promise<T>,
  options?: {
    pool?: pg.Pool;
    deadlineAt?: number;
    remainingDeadlineMs?: number;
    acquisitionTimeoutMs?: number;
    cancelOptions?: CancelBackendOptions;
  }
): Promise<T> {
  const getRemainingMs = (): number => {
    if (options?.deadlineAt !== undefined) {
      return options.deadlineAt - Date.now();
    }
    if (options?.remainingDeadlineMs !== undefined) {
      return options.remainingDeadlineMs;
    }
    return 30000;
  };

  if (signal?.aborted) {
    throw (
      signal.reason ||
      new ExportError("EXPORT_ABORTED", "Export write aborted by signal", 400, false)
    );
  }

  const remainingBeforeAcquire = getRemainingMs();
  if (remainingBeforeAcquire < 1) {
    throw new ExportError(
      "EXPORT_TIMEOUT",
      "Total job deadline exceeded before writer connection acquisition",
      504,
      false
    );
  }

  const pool = options?.pool || getDbPool();
  let client: pg.PoolClient | null = null;
  let clientDiscarded = false;
  let inTransaction = false;
  let transactionFinished = false;
  let pendingCancelPromise: Promise<boolean> | null = null;
  let forceCloseTimer: NodeJS.Timeout | null = null;

  const performAbortCleanup = () => {
    if (forceCloseTimer) {
      clearTimeout(forceCloseTimer);
      forceCloseTimer = null;
    }
    if (client && !clientDiscarded) {
      clientDiscarded = true;
      terminateClientSafely(client);
    }
  };

  const abortHandler = () => {
    if (client) {
      const pid = (client as unknown as { processID?: number }).processID;
      if (pid && !pendingCancelPromise) {
        pendingCancelPromise = cancelBackendPid(pid, {
          pool,
          client,
          ...options?.cancelOptions,
        })
          .then((ok) => {
            if (!ok) performAbortCleanup();
            return ok;
          })
          .catch(() => {
            performAbortCleanup();
            return false;
          });

        forceCloseTimer = setTimeout(() => {
          performAbortCleanup();
        }, 1500);
      } else {
        performAbortCleanup();
      }
    } else {
      performAbortCleanup();
    }
  };

  if (signal) {
    signal.addEventListener("abort", abortHandler, { once: true });
  }

  try {
    const acquisitionTimeout =
      options?.acquisitionTimeoutMs ?? Math.min(10000, Math.max(1, remainingBeforeAcquire));
    client = await acquireClientWithDeadline(pool, acquisitionTimeout, signal);

    if (signal?.aborted) {
      abortHandler();
      throw (
        signal.reason ||
        new ExportError("EXPORT_ABORTED", "Export write aborted by signal", 400, false)
      );
    }

    const remainingAfterAcquire = getRemainingMs();
    if (remainingAfterAcquire < 1) {
      performAbortCleanup();
      throw new ExportError(
        "EXPORT_TIMEOUT",
        "Total job deadline exceeded after writer connection acquisition",
        504,
        false
      );
    }

    const lockTimeoutMs = Math.min(5000, Math.max(1, remainingAfterAcquire));
    const stmtTimeoutMs = Math.min(30000, Math.max(1, remainingAfterAcquire));

    await client.query("BEGIN;");
    inTransaction = true;
    await client.query(`SET LOCAL lock_timeout = '${lockTimeoutMs}';`);
    await client.query(`SET LOCAL statement_timeout = '${stmtTimeoutMs}';`);

    const txDb = drizzle(client, { schema });
    const result = await callback(txDb, client);

    if (signal?.aborted) {
      throw (
        signal.reason ||
        new ExportError("EXPORT_ABORTED", "Export write aborted before commit", 400, false)
      );
    }
    if (getRemainingMs() < 1) {
      throw new ExportError(
        "EXPORT_TIMEOUT",
        "Total job deadline exceeded before committing writer transaction",
        504,
        false
      );
    }

    await client.query("COMMIT;");
    transactionFinished = true;
    return result;
  } catch (err) {
    if (client && inTransaction && !transactionFinished) {
      try {
        let rollbackTimer: NodeJS.Timeout | null = null;
        await Promise.race([
          client.query("ROLLBACK;"),
          new Promise<void>((_, reject) => {
            rollbackTimer = setTimeout(() => reject(new Error("ROLLBACK_TIMEOUT")), 1000);
          }),
        ]);
        if (rollbackTimer) clearTimeout(rollbackTimer);
        transactionFinished = true;
      } catch {
        performAbortCleanup();
      }
    }
    if (signal?.aborted) {
      performAbortCleanup();
      throw (
        signal.reason ||
        new ExportError("EXPORT_ABORTED", "Export write cancelled by abort signal", 400, false)
      );
    }
    throw err;
  } finally {
    if (signal) {
      signal.removeEventListener("abort", abortHandler);
    }
    if (forceCloseTimer) {
      clearTimeout(forceCloseTimer);
      forceCloseTimer = null;
    }
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
      if (signal?.aborted) {
        performAbortCleanup();
      } else {
        client.release();
      }
    }
  }
}

/**
 * Consumes an incremental stream (or Buffer/string), chunks it into <= 1 MiB parts,
 * encrypts each part as raw binary Buffer with Envelope v2 and strict AAD context binding,
 * updates cumulative SHA-256, and atomically writes each part to export_job_parts.
 *
 * CRITICAL LEASE FENCING & MEMORY BOUNDING:
 * - Validates worker lease ownership, PROCESSING status, attempt count, and unexpired leaseUntil
 *   under lock_timeout (5s) and statement_timeout (30s) on EVERY transaction.
 * - Uses a rolling queue with in-place buffer copying, completely avoiding repeated Buffer.concat.
 * - Releases plaintext chunk memory immediately after encryption to guarantee bounded RSS memory.
 */
export async function writeEncryptedExportParts(
  jobId: string,
  attemptNo: number,
  payload: AsyncIterable<string | Buffer> | Buffer | string,
  workerLeaseToken: string,
  options?: ExportWriterOptions
): Promise<ExportWriterResult> {
  const signal = options?.signal;
  if (signal?.aborted) {
    throw (
      signal.reason ||
      new ExportError("EXPORT_ABORTED", "Export attempt aborted before write", 400, false)
    );
  }

  // 1. Initial fenced cleanup of any prior parts for this attempt under strict lease verification
  await runFencedWriterTx(
    signal,
    async (txDb) => {
      const [lockedJob] = await txDb
        .select({ id: schema.exportJobs.id })
        .from(schema.exportJobs)
        .where(
          and(
            eq(schema.exportJobs.id, jobId),
            eq(schema.exportJobs.leaseToken, workerLeaseToken),
            eq(schema.exportJobs.status, "PROCESSING"),
            eq(schema.exportJobs.attemptCount, attemptNo),
            gt(schema.exportJobs.leaseUntil, sql`now()`)
          )
        )
        .for("update");

      if (!lockedJob) {
        throw new ExportError(
          "LEASE_LOST",
          `Worker lease lost for job '${jobId}' attempt ${attemptNo}`
        );
      }

      await txDb
        .delete(schema.exportJobParts)
        .where(
          and(
            eq(schema.exportJobParts.jobId, jobId),
            eq(schema.exportJobParts.attemptNo, attemptNo)
          )
        );
    },
    {
      pool: options?.pool,
      deadlineAt: options?.deadlineAt,
      remainingDeadlineMs: options?.remainingDeadlineMs,
    }
  );

  const totalHasher = crypto.createHash("sha256");
  let totalBytes = 0;
  let partNo = 0;

  // Helper to encrypt and write a single bounded chunk under transactional lease check
  const persistChunk = async (chunkBuffer: Buffer) => {
    if (signal?.aborted) {
      throw (
        signal.reason ||
        new ExportError("EXPORT_ABORTED", "Export write aborted by signal", 400, false)
      );
    }

    partNo++;
    totalBytes += chunkBuffer.length;
    totalHasher.update(chunkBuffer);

    const partSha256 = crypto.createHash("sha256").update(chunkBuffer).digest("hex");

    const payloadEnc = encryptEnvelopeV2Buffer(chunkBuffer, {
      table: "export_job_parts",
      primaryKey: jobId,
      column: `${attemptNo}:${partNo}`,
    });

    await runFencedWriterTx(
      signal,
      async (txDb) => {
        const [activeJob] = await txDb
          .select({ id: schema.exportJobs.id })
          .from(schema.exportJobs)
          .where(
            and(
              eq(schema.exportJobs.id, jobId),
              eq(schema.exportJobs.leaseToken, workerLeaseToken),
              eq(schema.exportJobs.status, "PROCESSING"),
              eq(schema.exportJobs.attemptCount, attemptNo),
              gt(schema.exportJobs.leaseUntil, sql`now()`)
            )
          )
          .for("update");

        if (!activeJob) {
          throw new ExportError(
            "LEASE_LOST",
            `Worker lease lost during part ${partNo} persistence for job '${jobId}' attempt ${attemptNo}`
          );
        }

        await txDb.insert(schema.exportJobParts).values({
          jobId,
          attemptNo,
          partNo,
          payloadEnc,
          plaintextSha256: partSha256,
          byteLength: chunkBuffer.length,
        });

        // Update real progress timestamp in database
        await txDb
          .update(schema.exportJobs)
          .set({ lastProgressAt: sql`now()` })
          .where(eq(schema.exportJobs.id, jobId));
      },
      {
        pool: options?.pool,
        deadlineAt: options?.deadlineAt,
        remainingDeadlineMs: options?.remainingDeadlineMs,
      }
    );

    if (options?.onPartWritten) {
      await options.onPartWritten(partNo, chunkBuffer.length);
    }
  };

  // 2. Consume payload chunks using a rolling queue with in-place copying (no repeated Buffer.concat)
  const chunkQueue: Buffer[] = [];
  let queueTotalBytes = 0;
  let queueHeadOffset = 0;

  const flushQueue = async (forceFinalPart = false) => {
    const drainChunks = async (): Promise<void> => {
      if (queueTotalBytes < CHUNK_SIZE_BYTES) return;
      const outBuf = Buffer.allocUnsafe(CHUNK_SIZE_BYTES);
      let copied = 0;
      while (copied < CHUNK_SIZE_BYTES && chunkQueue.length > 0) {
        const head = chunkQueue[0];
        if (!head) break;
        const available = head.length - queueHeadOffset;
        const need = CHUNK_SIZE_BYTES - copied;
        const toCopy = Math.min(available, need);
        head.copy(outBuf, copied, queueHeadOffset, queueHeadOffset + toCopy);
        copied += toCopy;
        queueHeadOffset += toCopy;
        if (queueHeadOffset >= head.length) {
          chunkQueue.shift();
          queueHeadOffset = 0;
        }
      }
      queueTotalBytes -= CHUNK_SIZE_BYTES;
      await persistChunk(outBuf);
      return drainChunks();
    };

    await drainChunks();

    if (forceFinalPart && (queueTotalBytes > 0 || partNo === 0)) {
      const finalBuf = Buffer.allocUnsafe(queueTotalBytes);
      let copied = 0;
      while (queueTotalBytes > 0 && chunkQueue.length > 0) {
        const head = chunkQueue[0];
        if (!head) break;
        const available = head.length - queueHeadOffset;
        const toCopy = Math.min(available, queueTotalBytes);
        head.copy(finalBuf, copied, queueHeadOffset, queueHeadOffset + toCopy);
        copied += toCopy;
        queueHeadOffset += toCopy;
        queueTotalBytes -= toCopy;
        if (queueHeadOffset >= head.length) {
          chunkQueue.shift();
          queueHeadOffset = 0;
        }
      }
      await persistChunk(finalBuf);
    }
  };

  const isAsyncIterable = (val: unknown): val is AsyncIterable<string | Buffer> =>
    typeof val === "object" && val !== null && Symbol.asyncIterator in val;

  if (isAsyncIterable(payload)) {
    const iterator = payload[Symbol.asyncIterator]();
    const consumeAsyncIterable = async (): Promise<void> => {
      if (signal?.aborted) {
        throw (
          signal.reason ||
          new ExportError("EXPORT_ABORTED", "Export write aborted by signal", 400, false)
        );
      }

      const item = await iterator.next();
      if (item.done) return;

      const chunk = item.value;
      const chunkBuf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, "utf8");
      if (chunkBuf.length > 0) {
        chunkQueue.push(chunkBuf);
        queueTotalBytes += chunkBuf.length;

        if (queueTotalBytes >= CHUNK_SIZE_BYTES) {
          await flushQueue(false);
        }
      }

      return consumeAsyncIterable();
    };

    await consumeAsyncIterable();
  } else {
    const fullBuffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, "utf8");
    if (fullBuffer.length > 0) {
      chunkQueue.push(fullBuffer);
      queueTotalBytes += fullBuffer.length;
    }
  }

  // 3. Flush remaining buffer or empty part if totalBytes === 0
  await flushQueue(true);

  const cumulativeSha256 = totalHasher.digest("hex");

  return {
    partCount: partNo,
    totalBytes,
    cumulativeSha256,
  };
}

/**
 * Decrypts and verifies parts for a completed export job, yielding raw binary Buffer chunks.
 * Uses single-part keyset pagination to ensure bounded memory usage and true streaming backpressure.
 * Verifies strict consecutive partNo ordering (no gaps/drops), expectedPartCount,
 * individual part SHA-256, and overall cumulative SHA-256 checksum over exact bytes.
 */
export async function* readAndVerifyExportPartsStream(
  jobId: string,
  resultAttempt: number,
  expectedChecksum: string,
  expectedPartCount?: number
): AsyncGenerator<Buffer, void, unknown> {
  const db = getDb();
  const cumulativeHasher = crypto.createHash("sha256");
  let yieldedPartsCount = 0;

  try {
    const streamNextPart = async function* (
      currentPartNo: number
    ): AsyncGenerator<Buffer, void, unknown> {
      const [part] = await db
        .select()
        .from(schema.exportJobParts)
        .where(
          and(
            eq(schema.exportJobParts.jobId, jobId),
            eq(schema.exportJobParts.attemptNo, resultAttempt),
            gt(schema.exportJobParts.partNo, currentPartNo)
          )
        )
        .orderBy(asc(schema.exportJobParts.partNo))
        .limit(1);

      if (!part) return;

      // Strict sequential part ordering check (no sequence gaps permitted)
      if (part.partNo !== currentPartNo + 1) {
        throw new ExportError(
          "EXPORT_PART_MISSING",
          `Export part sequence gap detected for job '${jobId}': expected part ${currentPartNo + 1}, got ${part.partNo}`,
          500,
          false
        );
      }

      let decryptedChunkBuffer: Buffer;
      try {
        decryptedChunkBuffer = decryptEnvelopeV2Buffer(part.payloadEnc, {
          table: "export_job_parts",
          primaryKey: jobId,
          column: `${part.attemptNo}:${part.partNo}`,
        });
      } catch (err) {
        throw new ExportError(
          "EXPORT_DECRYPTION_FAILED",
          `Failed to decrypt part ${part.partNo}: ${err}`,
          500,
          false
        );
      }

      // Verify SHA-256 integrity of this chunk against stored digest
      const calculatedPartSha256 = crypto
        .createHash("sha256")
        .update(decryptedChunkBuffer)
        .digest("hex");
      if (calculatedPartSha256 !== part.plaintextSha256) {
        throw new ExportError(
          "EXPORT_CHECKSUM_MISMATCH",
          `SHA-256 verification failed on part ${part.partNo} of job '${jobId}'. Expected ${part.plaintextSha256}, got ${calculatedPartSha256}`,
          500,
          false
        );
      }

      cumulativeHasher.update(decryptedChunkBuffer);
      yieldedPartsCount++;
      yield decryptedChunkBuffer;

      yield* streamNextPart(part.partNo);
    };

    yield* streamNextPart(0);

    if (yieldedPartsCount === 0) {
      throw new ExportError(
        "EXPORT_PART_MISSING",
        `No parts found for export job '${jobId}' attempt ${resultAttempt}`,
        404,
        false
      );
    }

    if (expectedPartCount !== undefined && yieldedPartsCount !== expectedPartCount) {
      throw new ExportError(
        "EXPORT_PART_MISSING",
        `Export part count mismatch for job '${jobId}': expected ${expectedPartCount} parts, got ${yieldedPartsCount}`,
        500,
        false
      );
    }

    const finalCumulativeSha = cumulativeHasher.digest("hex");
    if (finalCumulativeSha !== expectedChecksum) {
      throw new ExportError(
        "EXPORT_CHECKSUM_MISMATCH",
        `Overall checksum mismatch: expected ${expectedChecksum}, got ${finalCumulativeSha}`,
        500,
        false
      );
    }
  } finally {
    // Explicit generator cleanup hook
  }
}
