import path from "node:path";
import { getDb, schema } from "../src/lib/db";
import { getEnv } from "../src/config/env";
import { hashEmailBlindIndex } from "../src/lib/crypto";
import { encryptEnvelopeV2, decryptEnvelopeV2 } from "../src/lib/crypto/envelope";
import { decryptTotpSecret } from "../src/modules/auth/totp";
import {
  acquirePiiAdvisoryLock,
  releasePiiAdvisoryLock,
  PiiCheckpointManager,
} from "./lib/pii-checkpoint";
import { and, asc, eq, gt, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";

const DEFAULT_CHECKPOINT_FILE = path.resolve(process.cwd(), ".pii-backfill-checkpoint.json");

export interface BackfillOptions {
  checkpointPath?: string;
  targetKeyId?: string;
}

export async function runBackfill(options?: BackfillOptions) {
  const env = getEnv();
  const targetKeyId = options?.targetKeyId || env.PII_CURRENT_KEY_ID || "k1";
  const checkpointFile = options?.checkpointPath || DEFAULT_CHECKPOINT_FILE;

  // Validate environment configuration
  try {
    getEnv();
  } catch (err) {
    console.error("[PII-Backfill] Environment validation error:", err);
    if (process.env.NODE_ENV === "production") {
      console.error("[PII-Backfill] FATAL: Invalid or missing environment configuration.");
      process.exit(1);
    }
  }

  const db = getDb();

  // 1. Acquire global advisory lock
  const locked = await acquirePiiAdvisoryLock();
  if (!locked) {
    throw new Error(
      "LOCKED: Another PII migration or rotation job is currently holding the advisory lock."
    );
  }

  try {
    const cpManager = await PiiCheckpointManager.loadOrCreate(
      checkpointFile,
      targetKeyId,
      "BACKFILL",
      "USERS"
    );
    const BATCH_SIZE = 100;

    let totalUpdated = 0;
    let totalSkipped = 0;

    if (cpManager.data.phase === "USERS") {
      console.info("[PII-Backfill] Phase 1: Backfilling users table...");

      async function attemptCas(
        user: typeof schema.users.$inferSelect,
        retryCount: number
      ): Promise<boolean> {
        if (retryCount >= 3) return false;
        const currentRows = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, user.id))
          .limit(1);

        const currentUser = currentRows[0];
        if (!currentUser) {
          // Record deleted concurrently
          return true;
        }

        // Recompute updates from fresh current row
        const freshUpdates: Partial<typeof schema.users.$inferInsert> = {};
        let freshNeedsUpdate = false;

        // 1. Blind index HMAC
        if (!currentUser.emailHmac && currentUser.email) {
          freshUpdates.emailHmac = hashEmailBlindIndex(currentUser.email);
          freshNeedsUpdate = true;
        }

        // 2. Encrypt email using Envelope v2 with AAD
        if (!currentUser.emailEnc && currentUser.email) {
          freshUpdates.emailEnc = encryptEnvelopeV2(
            currentUser.email.trim().toLowerCase(),
            { table: "users", primaryKey: currentUser.id, column: "email_enc" },
            targetKeyId
          );
          freshNeedsUpdate = true;
        }

        // 3. Encrypt legacy Base32 twoFactorSecret using Envelope v2 with AAD
        if (currentUser.twoFactorSecret && !currentUser.twoFactorSecret.includes(":")) {
          freshUpdates.twoFactorSecret = encryptEnvelopeV2(
            currentUser.twoFactorSecret,
            { table: "users", primaryKey: currentUser.id, column: "two_factor_secret" },
            targetKeyId
          );
          freshNeedsUpdate = true;
        }

        if (!freshNeedsUpdate) {
          totalSkipped++;
          return true;
        }

        const whereConditions = [
          eq(schema.users.id, currentUser.id),
          currentUser.email !== null && currentUser.email !== undefined
            ? eq(schema.users.email, currentUser.email)
            : isNull(schema.users.email),
          currentUser.emailEnc !== null && currentUser.emailEnc !== undefined
            ? eq(schema.users.emailEnc, currentUser.emailEnc)
            : isNull(schema.users.emailEnc),
          currentUser.emailHmac !== null && currentUser.emailHmac !== undefined
            ? eq(schema.users.emailHmac, currentUser.emailHmac)
            : isNull(schema.users.emailHmac),
          currentUser.twoFactorSecret !== null && currentUser.twoFactorSecret !== undefined
            ? eq(schema.users.twoFactorSecret, currentUser.twoFactorSecret)
            : isNull(schema.users.twoFactorSecret),
        ];

        const res = await db
          .update(schema.users)
          .set({
            ...freshUpdates,
            updatedAt: new Date(),
          })
          .where(and(...whereConditions))
          .returning({ id: schema.users.id });

        if (res.length > 0) {
          totalUpdated++;
          return true;
        }

        return attemptCas(user, retryCount + 1);
      }

      async function processUsersBatches(): Promise<void> {
        const lastUserId = cpManager.data.lastSuccessfulId;

        // Select records missing emailHmac, missing emailEnc, or holding unencrypted twoFactorSecret
        const conditions = [
          lastUserId ? gt(schema.users.id, lastUserId) : undefined,
          or(
            isNull(schema.users.emailHmac),
            isNull(schema.users.emailEnc),
            and(
              isNotNull(schema.users.twoFactorSecret),
              sql`${schema.users.twoFactorSecret} NOT LIKE '%:%'`
            )
          ),
        ].filter(Boolean);

        const usersBatch = await db
          .select()
          .from(schema.users)
          .where(and(...conditions))
          .orderBy(asc(schema.users.id))
          .limit(BATCH_SIZE);

        if (usersBatch.length === 0) {
          return;
        }

        async function processUserItem(userIndex: number): Promise<void> {
          if (userIndex >= usersBatch.length) return;
          const user = usersBatch[userIndex];
          if (user) {
            try {
              const casSuccess = await attemptCas(user, 0);

              if (!casSuccess) {
                cpManager.recordFailureAndHalt(user.id, "CAS_CONFLICT_EXHAUSTED");
              }

              cpManager.recordSuccess(user.id);
            } catch (err) {
              cpManager.recordFailureAndHalt(
                user.id,
                err instanceof Error ? err.message : String(err)
              );
            }
          }
          await processUserItem(userIndex + 1);
        }

        await processUserItem(0);
        await processUsersBatches();
      }

      await processUsersBatches();
      cpManager.transitionPhase("VERIFY");
    }

    // Phase 2: VERIFY
    if (cpManager.data.phase === "VERIFY") {
      console.info("[PII-Backfill] Phase 2: Full verification of backfilled records...");

      async function verifyBatches(lastId: string | null): Promise<void> {
        const verifyConditions: SQL[] = [
          lastId ? gt(schema.users.id, lastId) : undefined,
          isNotNull(schema.users.email),
        ].filter((c): c is SQL => Boolean(c));

        const usersToVerify = await db
          .select({
            id: schema.users.id,
            email: schema.users.email,
            emailEnc: schema.users.emailEnc,
            emailHmac: schema.users.emailHmac,
            twoFactorSecret: schema.users.twoFactorSecret,
          })
          .from(schema.users)
          .where(and(...verifyConditions))
          .orderBy(asc(schema.users.id))
          .limit(BATCH_SIZE);

        if (usersToVerify.length === 0) return;

        let currentLastId = lastId;
        for (const u of usersToVerify) {
          const emailEnc = u.emailEnc;
          if (!emailEnc) {
            cpManager.recordFailureAndHalt(u.id, "VERIFY_MISSING_EMAIL_ENC");
            continue;
          }
          if (!u.emailHmac) {
            cpManager.recordFailureAndHalt(u.id, "VERIFY_MISSING_EMAIL_HMAC");
            continue;
          }

          try {
            const decEmail = decryptEnvelopeV2(emailEnc, {
              table: "users",
              primaryKey: u.id,
              column: "email_enc",
            });
            if (decEmail.toLowerCase() !== u.email?.trim().toLowerCase()) {
              cpManager.recordFailureAndHalt(u.id, "VERIFY_EMAIL_MISMATCH");
            }
          } catch (err) {
            cpManager.recordFailureAndHalt(
              u.id,
              `VERIFY_EMAIL_DECRYPT_FAILED: ${err instanceof Error ? err.message : String(err)}`
            );
          }

          if (u.twoFactorSecret) {
            try {
              const dec2fa = decryptTotpSecret(u.id, u.twoFactorSecret);
              if (!dec2fa) {
                cpManager.recordFailureAndHalt(u.id, "VERIFY_EMPTY_TOTP_SECRET");
              }
            } catch (err) {
              cpManager.recordFailureAndHalt(
                u.id,
                `VERIFY_TOTP_DECRYPT_FAILED: ${err instanceof Error ? err.message : String(err)}`
              );
            }
          }

          currentLastId = u.id;
        }

        await verifyBatches(currentLastId);
      }

      await verifyBatches(null);
      cpManager.transitionPhase("DONE");
    }

    cpManager.markDone();

    console.info(
      `[PII-Backfill] Completed successfully. Processed=${cpManager.data.totalProcessed}, Updated=${totalUpdated}, Skipped=${totalSkipped}`
    );

    return {
      totalProcessed: cpManager.data.totalProcessed,
      totalUpdated,
      totalSkipped,
      errors: 0,
    };
  } finally {
    await releasePiiAdvisoryLock();
  }
}

if (process.argv[1] && process.argv[1].endsWith("backfill-pii-keys.ts")) {
  runBackfill()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[PII-Backfill] Fatal error:", err);
      process.exit(1);
    });
}
