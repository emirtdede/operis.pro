import {
  acquireClientWithDeadline,
  cancelBackendPid,
  getDbPool,
  schema,
  terminateClientSafely,
} from "@/src/lib/db";
import { drizzle } from "drizzle-orm/node-postgres";
import { ExportError } from "./export-errors";
import {
  readUserData,
  readProfileData,
  readProfileLinksData,
  readPrivateIdentityData,
} from "./readers/profile-data-reader";
import {
  readListingsData,
  readListingRevisionsData,
} from "./readers/listings-data-reader";
import {
  readOffersData,
  readOfferRevisionsData,
} from "./readers/offers-data-reader";
import {
  readEngagementsData,
  readEndorsementsData,
} from "./readers/engagements-data-reader";
import {
  readCategoryFollowsData,
  readOfferTemplatesData,
  readNotificationsData,
  readLegalAcceptancesData,
  readSecurityLogData,
} from "./readers/governance-data-reader";
import type {
  ExportDataSnapshot,
  ExportReaderContext,
  StreamExportOptions,
} from "./readers/types";

// Re-export all contract types and utility functions for backwards compatibility
export * from "./readers/types";

/**
 * Incremental, bounded-memory streaming generator for user personal data export.
 * Operates under REPEATABLE READ READ ONLY transaction isolation with statement timeout
 * and true PostgreSQL query cancellation (pg_cancel_backend) when aborted.
 * Orchestrates domain readers with index-backed keyset pagination.
 */
export async function* streamUserDataExport(
  userId: string,
  options?: StreamExportOptions
): AsyncGenerator<string, { snapshotStartedAt: Date }, unknown> {
  const signal = options?.signal;
  if (signal?.aborted) {
    throw signal.reason || new ExportError("EXPORT_ABORTED", "Export attempt aborted", 400, false);
  }

  const getRemainingMs = (): number => {
    if (options?.deadlineAt) {
      return Math.max(0, options.deadlineAt - Date.now());
    }
    return options?.remainingDeadlineMs ?? 30000;
  };

  const pool = options?.pool || getDbPool();
  const remainingAtStart = getRemainingMs();
  if (remainingAtStart <= 0) {
    throw new ExportError(
      "EXPORT_TIMEOUT",
      "Total job deadline exceeded before reader start",
      504,
      false
    );
  }

  const acquisitionTimeout = Math.min(options?.acquisitionTimeoutMs ?? 10000, remainingAtStart);
  const client = await acquireClientWithDeadline(pool, acquisitionTimeout, signal);
  const pid = (client as unknown as { processID?: number }).processID;

  let inTransaction = false;
  let transactionFinished = false;
  let clientDiscarded = false;
  let forceCloseTimer: NodeJS.Timeout | null = null;
  let pendingCancelPromise: Promise<boolean> | null = null;

  const performAbortCleanup = () => {
    if (clientDiscarded) return;
    clientDiscarded = true;
    if (forceCloseTimer) {
      clearTimeout(forceCloseTimer);
      forceCloseTimer = null;
    }
    terminateClientSafely(client);
  };

  const abortHandler = () => {
    if (pid && !pendingCancelPromise) {
      // 1. Launch independent cancellation targeting the exact pool/client server
      pendingCancelPromise = cancelBackendPid(pid, { pool, client })
        .then((ok) => {
          if (!ok) {
            // Cancel was rejected or failed -> forcefully destroy local socket immediately
            performAbortCleanup();
          }
          return ok;
        })
        .catch(() => {
          performAbortCleanup();
          return false;
        });

      // 2. Abort-initiated forced local socket termination timer (max 1500ms)
      forceCloseTimer = setTimeout(() => {
        performAbortCleanup();
      }, 1500);
    } else {
      performAbortCleanup();
    }
  };

  if (signal) {
    signal.addEventListener("abort", abortHandler, { once: true });
  }

  const txDb = drizzle(client, { schema });
  const snapshotStartedAt = new Date();

  try {
    const remainingAfterAcquire = getRemainingMs();
    if (remainingAfterAcquire < 1) {
      performAbortCleanup();
      throw new ExportError(
        "EXPORT_TIMEOUT",
        "Total job deadline exceeded after reader connection acquisition",
        504,
        false
      );
    }

    const stmtTimeoutMs = Math.min(30000, Math.max(1, remainingAfterAcquire));
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;");
    inTransaction = true;
    await client.query(`SET LOCAL statement_timeout = '${stmtTimeoutMs}';`);

    if (signal?.aborted) {
      throw (
        signal.reason || new ExportError("EXPORT_ABORTED", "Export attempt aborted", 400, false)
      );
    }

    const readerCtx: ExportReaderContext = {
      txDb,
      userId,
      options,
      signal,
      getRemainingMs,
    };

    // 1. User core
    yield* readUserData(readerCtx, snapshotStartedAt);

    // 2. Profile
    yield* readProfileData(readerCtx);

    // 3. Profile Links
    yield* readProfileLinksData(readerCtx);

    // 4. Private Identity
    yield* readPrivateIdentityData(readerCtx);

    // 5. Listings
    yield* readListingsData(readerCtx);

    // 6. Listing Revisions
    yield* readListingRevisionsData(readerCtx);

    // 7. Offers
    yield* readOffersData(readerCtx);

    // 8. Offer Revisions
    yield* readOfferRevisionsData(readerCtx);

    // 9. Engagements
    yield* readEngagementsData(readerCtx);

    // 10. Endorsements (Authored & Received)
    yield* readEndorsementsData(readerCtx);

    // 11. Category Follows
    yield* readCategoryFollowsData(readerCtx);

    // 12. Offer Templates
    yield* readOfferTemplatesData(readerCtx);

    // 13. Notifications
    yield* readNotificationsData(readerCtx);

    // 14. Legal Acceptances
    yield* readLegalAcceptancesData(readerCtx);

    // 15. Security Log (Audit Events)
    yield* readSecurityLogData(readerCtx);

    // Top-level JSON closure
    yield "}\n";

    if (getRemainingMs() <= 0) {
      throw new ExportError("EXPORT_TIMEOUT", "Deadline exceeded before commit", 504, false);
    }

    await client.query("COMMIT;");
    transactionFinished = true;
    return { snapshotStartedAt };
  } catch (err: unknown) {
    if (inTransaction && !transactionFinished) {
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
      throw (
        signal.reason ||
        new ExportError("EXPORT_ABORTED", "Export query cancelled by abort signal", 400, false)
      );
    }
    throw err;
  } finally {
    if (forceCloseTimer) {
      clearTimeout(forceCloseTimer);
      forceCloseTimer = null;
    }
    if (signal) {
      signal.removeEventListener("abort", abortHandler);
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

    if (signal?.aborted) {
      performAbortCleanup();
    } else {
      // Handle early generator termination (generator.return() / break in consumer)
      if (inTransaction && !transactionFinished) {
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
      if (!clientDiscarded) {
        client.release();
      }
    }
  }
}

/**
 * Compatibility wrapper for callers requiring a full snapshot object.
 * Assembles the snapshot by consuming the stream without duplicate querying logic.
 */
export async function extractUserDataSnapshot(
  userId: string,
  options?: StreamExportOptions
): Promise<{
  snapshot: ExportDataSnapshot;
  snapshotStartedAt: Date;
}> {
  const collectChunks = async (
    gen: AsyncGenerator<string, { snapshotStartedAt: Date }, unknown>
  ): Promise<{ chunks: string[]; snapshotStartedAt: Date }> => {
    const next = async (
      chunksAcc: string[]
    ): Promise<{ chunks: string[]; snapshotStartedAt: Date }> => {
      const res = await gen.next();
      if (res.done) {
        return { chunks: chunksAcc, snapshotStartedAt: res.value.snapshotStartedAt };
      }
      chunksAcc.push(res.value);
      return next(chunksAcc);
    };
    return next([]);
  };

  const generator = streamUserDataExport(userId, options);
  const { chunks, snapshotStartedAt } = await collectChunks(generator);

  const jsonStr = chunks.join("");
  const snapshot = JSON.parse(jsonStr) as ExportDataSnapshot;
  return { snapshot, snapshotStartedAt };
}
