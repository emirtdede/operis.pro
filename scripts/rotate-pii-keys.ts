import path from "node:path";
import crypto from "node:crypto";
import { getDb, schema } from "../src/lib/db";
import { getEnv } from "../src/config/env";
import {
  encryptEnvelopeV2,
  decryptEnvelopeV2,
  encryptEnvelopeV2Buffer,
  decryptEnvelopeV2Buffer,
} from "../src/lib/crypto/envelope";
import { decryptTotpSecret } from "../src/modules/auth/totp";
import {
  acquirePiiAdvisoryLock,
  releasePiiAdvisoryLock,
  PiiCheckpointManager,
} from "./lib/pii-checkpoint";
import { and, asc, eq, gt, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";

const DEFAULT_CHECKPOINT_FILE = path.resolve(process.cwd(), ".pii-rotation-checkpoint.json");

export interface RotatePiiKeysOptions {
  targetKeyId?: string;
  checkpointPath?: string;
  batchSize?: number;
}

export async function runRotation(options?: RotatePiiKeysOptions) {
  const env = getEnv();
  const targetKeyId = options?.targetKeyId || env.PII_CURRENT_KEY_ID || "k1";
  const checkpointFile = options?.checkpointPath || DEFAULT_CHECKPOINT_FILE;

  console.info(`[PII-Rotation] Starting PII key rotation to target keyId: '${targetKeyId}'...`);

  const db = getDb();

  // 1. Acquire global advisory lock
  const locked = await acquirePiiAdvisoryLock();
  if (!locked) {
    throw new Error("LOCKED: Another PII migration or rotation job holds the advisory lock.");
  }

  try {
    const cpManager = await PiiCheckpointManager.loadOrCreate(
      checkpointFile,
      targetKeyId,
      "ROTATION",
      "USERS"
    );
    const BATCH_SIZE = options?.batchSize || 100;

    // Phase 1: USERS
    if (cpManager.data.phase === "USERS") {
      console.info("[PII-Rotation] Phase 1: Rotating 'users' table...");

      async function attemptUserCas(
        user: typeof schema.users.$inferSelect,
        retry: number
      ): Promise<boolean> {
        if (retry >= 3) return false;
        const currentRows = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, user.id))
          .limit(1);

        const currentUser = currentRows[0];
        if (!currentUser) {
          return true;
        }

        const updates: Partial<typeof schema.users.$inferInsert> = {};
        let needsUpdate = false;

        // Rotate emailEnc if not already on target keyId
        if (currentUser.emailEnc && !currentUser.emailEnc.startsWith(`v2:${targetKeyId}:`)) {
          const decryptedEmail = decryptEnvelopeV2(currentUser.emailEnc, {
            table: "users",
            primaryKey: currentUser.id,
            column: "email_enc",
          });
          updates.emailEnc = encryptEnvelopeV2(
            decryptedEmail,
            { table: "users", primaryKey: currentUser.id, column: "email_enc" },
            targetKeyId
          );
          needsUpdate = true;
        }

        // Rotate twoFactorSecret if present and not already on target keyId
        if (
          currentUser.twoFactorSecret &&
          !currentUser.twoFactorSecret.startsWith(`v2:${targetKeyId}:`)
        ) {
          const dec2Fa = decryptTotpSecret(currentUser.id, currentUser.twoFactorSecret);
          if (dec2Fa) {
            updates.twoFactorSecret = encryptEnvelopeV2(
              dec2Fa,
              { table: "users", primaryKey: currentUser.id, column: "two_factor_secret" },
              targetKeyId
            );
            needsUpdate = true;
          }
        }

        if (!needsUpdate) {
          return true;
        }

        const whereConditions = [
          eq(schema.users.id, currentUser.id),
          currentUser.emailEnc !== null && currentUser.emailEnc !== undefined
            ? eq(schema.users.emailEnc, currentUser.emailEnc)
            : isNull(schema.users.emailEnc),
          currentUser.twoFactorSecret !== null && currentUser.twoFactorSecret !== undefined
            ? eq(schema.users.twoFactorSecret, currentUser.twoFactorSecret)
            : isNull(schema.users.twoFactorSecret),
        ];

        const res = await db
          .update(schema.users)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(and(...whereConditions))
          .returning({ id: schema.users.id });

        if (res.length > 0) {
          return true;
        }

        return attemptUserCas(user, retry + 1);
      }

      async function processUsersBatch(): Promise<void> {
        const lastId = cpManager.data.lastSuccessfulId;
        const conditions = [
          lastId ? gt(schema.users.id, lastId) : undefined,
          or(isNotNull(schema.users.emailEnc), isNotNull(schema.users.twoFactorSecret)),
        ].filter(Boolean);

        const batch = await db
          .select()
          .from(schema.users)
          .where(and(...conditions))
          .orderBy(asc(schema.users.id))
          .limit(BATCH_SIZE);

        if (batch.length === 0) return;

        async function processUserItem(idx: number): Promise<void> {
          if (idx >= batch.length) return;
          const user = batch[idx];
          if (user) {
            try {
              const casSuccess = await attemptUserCas(user, 0);

              if (!casSuccess) {
                cpManager.recordFailureAndHalt(user.id, "USERS_CAS_CONFLICT_EXHAUSTED");
              }

              cpManager.recordSuccess(user.id);
            } catch (err) {
              cpManager.recordFailureAndHalt(
                user.id,
                err instanceof Error ? err.message : String(err)
              );
            }
          }
          await processUserItem(idx + 1);
        }

        await processUserItem(0);
        await processUsersBatch();
      }

      await processUsersBatch();
      cpManager.transitionPhase("IDENTITIES");
    }

    // Phase 2: IDENTITIES
    if (cpManager.data.phase === "IDENTITIES") {
      console.info("[PII-Rotation] Phase 2: Rotating 'user_private_identity' table...");

      async function attemptIdentityCas(
        identity: typeof schema.userPrivateIdentity.$inferSelect,
        retry: number
      ): Promise<boolean> {
        if (retry >= 3) return false;
        const currentRows = await db
          .select()
          .from(schema.userPrivateIdentity)
          .where(eq(schema.userPrivateIdentity.userId, identity.userId))
          .limit(1);

        const currentIdentity = currentRows[0];
        if (!currentIdentity) {
          return true;
        }

        const updates: Partial<typeof schema.userPrivateIdentity.$inferInsert> = {};
        let needsUpdate = false;

        if (
          currentIdentity.legalFirstNameEnc &&
          !currentIdentity.legalFirstNameEnc.startsWith(`v2:${targetKeyId}:`)
        ) {
          const dec = decryptEnvelopeV2(currentIdentity.legalFirstNameEnc, {
            table: "user_private_identity",
            primaryKey: currentIdentity.userId,
            column: "legal_first_name_enc",
          });
          updates.legalFirstNameEnc = encryptEnvelopeV2(
            dec,
            {
              table: "user_private_identity",
              primaryKey: currentIdentity.userId,
              column: "legal_first_name_enc",
            },
            targetKeyId
          );
          needsUpdate = true;
        }

        if (
          currentIdentity.legalLastNameEnc &&
          !currentIdentity.legalLastNameEnc.startsWith(`v2:${targetKeyId}:`)
        ) {
          const dec = decryptEnvelopeV2(currentIdentity.legalLastNameEnc, {
            table: "user_private_identity",
            primaryKey: currentIdentity.userId,
            column: "legal_last_name_enc",
          });
          updates.legalLastNameEnc = encryptEnvelopeV2(
            dec,
            {
              table: "user_private_identity",
              primaryKey: currentIdentity.userId,
              column: "legal_last_name_enc",
            },
            targetKeyId
          );
          needsUpdate = true;
        }

        if (
          currentIdentity.phoneE164Enc &&
          !currentIdentity.phoneE164Enc.startsWith(`v2:${targetKeyId}:`)
        ) {
          const dec = decryptEnvelopeV2(currentIdentity.phoneE164Enc, {
            table: "user_private_identity",
            primaryKey: currentIdentity.userId,
            column: "phone_e164_enc",
          });
          updates.phoneE164Enc = encryptEnvelopeV2(
            dec,
            {
              table: "user_private_identity",
              primaryKey: currentIdentity.userId,
              column: "phone_e164_enc",
            },
            targetKeyId
          );
          needsUpdate = true;
        }

        if (
          currentIdentity.dateOfBirthEnc &&
          !currentIdentity.dateOfBirthEnc.startsWith(`v2:${targetKeyId}:`)
        ) {
          const dec = decryptEnvelopeV2(currentIdentity.dateOfBirthEnc, {
            table: "user_private_identity",
            primaryKey: currentIdentity.userId,
            column: "date_of_birth_enc",
          });
          updates.dateOfBirthEnc = encryptEnvelopeV2(
            dec,
            {
              table: "user_private_identity",
              primaryKey: currentIdentity.userId,
              column: "date_of_birth_enc",
            },
            targetKeyId
          );
          needsUpdate = true;
        }

        if (!needsUpdate) {
          return true;
        }

        const whereConditions = [
          eq(schema.userPrivateIdentity.userId, currentIdentity.userId),
          currentIdentity.legalFirstNameEnc !== null &&
          currentIdentity.legalFirstNameEnc !== undefined
            ? eq(
                schema.userPrivateIdentity.legalFirstNameEnc,
                currentIdentity.legalFirstNameEnc
              )
            : isNull(schema.userPrivateIdentity.legalFirstNameEnc),
          currentIdentity.legalLastNameEnc !== null &&
          currentIdentity.legalLastNameEnc !== undefined
            ? eq(
                schema.userPrivateIdentity.legalLastNameEnc,
                currentIdentity.legalLastNameEnc
              )
            : isNull(schema.userPrivateIdentity.legalLastNameEnc),
          currentIdentity.phoneE164Enc !== null && currentIdentity.phoneE164Enc !== undefined
            ? eq(schema.userPrivateIdentity.phoneE164Enc, currentIdentity.phoneE164Enc)
            : isNull(schema.userPrivateIdentity.phoneE164Enc),
          currentIdentity.dateOfBirthEnc !== null &&
          currentIdentity.dateOfBirthEnc !== undefined
            ? eq(schema.userPrivateIdentity.dateOfBirthEnc, currentIdentity.dateOfBirthEnc)
            : isNull(schema.userPrivateIdentity.dateOfBirthEnc),
        ];

        const res = await db
          .update(schema.userPrivateIdentity)
          .set({ ...updates, updatedAt: new Date() })
          .where(and(...whereConditions))
          .returning({ userId: schema.userPrivateIdentity.userId });

        if (res.length > 0) {
          return true;
        }

        return attemptIdentityCas(identity, retry + 1);
      }

      async function processIdentitiesBatch(): Promise<void> {
        const lastId = cpManager.data.lastSuccessfulId;
        const conditions = [
          lastId ? gt(schema.userPrivateIdentity.userId, lastId) : undefined,
        ].filter(Boolean);

        const batch = await db
          .select()
          .from(schema.userPrivateIdentity)
          .where(and(...conditions))
          .orderBy(asc(schema.userPrivateIdentity.userId))
          .limit(BATCH_SIZE);

        if (batch.length === 0) return;

        async function processIdentityItem(idx: number): Promise<void> {
          if (idx >= batch.length) return;
          const identity = batch[idx];
          if (identity) {
            try {
              const casSuccess = await attemptIdentityCas(identity, 0);

              if (!casSuccess) {
                cpManager.recordFailureAndHalt(identity.userId, "IDENTITY_CAS_CONFLICT_EXHAUSTED");
              }

              cpManager.recordSuccess(identity.userId);
            } catch (err) {
              cpManager.recordFailureAndHalt(
                identity.userId,
                err instanceof Error ? err.message : String(err)
              );
            }
          }
          await processIdentityItem(idx + 1);
        }

        await processIdentityItem(0);
        await processIdentitiesBatch();
      }

      await processIdentitiesBatch();
      cpManager.transitionPhase("EXPORT_PARTS");
    }

    // Phase 3: EXPORT_PARTS
    if (cpManager.data.phase === "EXPORT_PARTS") {
      console.info("[PII-Rotation] Phase 3: Rotating 'export_job_parts' table...");

      // Check if export_job_parts table exists
      const checkRes = await db.execute<{ exists: boolean }>(
        sql`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'export_job_parts') as exists`
      );

      const checkRows = checkRes.rows as unknown as Array<{ exists?: boolean }>;
      if (checkRows[0]?.exists) {
        let cursor: { jobId: string; attemptNo: number; partNo: number } | null = null;
        if (cpManager.data.lastSuccessfulId) {
          const parts = cpManager.data.lastSuccessfulId.split(":");
          if (parts.length === 3) {
            const [pJobId, pAttemptNo, pPartNo] = parts;
            if (pJobId && pAttemptNo && pPartNo) {
              cursor = {
                jobId: pJobId,
                attemptNo: parseInt(pAttemptNo, 10),
                partNo: parseInt(pPartNo, 10),
              };
            }
          }
        }

        async function attemptPartCas(
          part: typeof schema.exportJobParts.$inferSelect,
          compositeKey: string,
          retry: number
        ): Promise<boolean> {
          if (retry >= 3) return false;

          // Re-read current row for CAS verification
          const [currentPart] = await db
            .select()
            .from(schema.exportJobParts)
            .where(
              and(
                eq(schema.exportJobParts.jobId, part.jobId),
                eq(schema.exportJobParts.attemptNo, part.attemptNo),
                eq(schema.exportJobParts.partNo, part.partNo)
              )
            )
            .limit(1);

          if (!currentPart) {
            return true;
          }

          if (currentPart.payloadEnc.startsWith(`v2:${targetKeyId}:`)) {
            return true;
          }

          const aadContext = {
            table: "export_job_parts",
            primaryKey: currentPart.jobId,
            column: `${currentPart.attemptNo}:${currentPart.partNo}`,
          };

          const decBuffer = decryptEnvelopeV2Buffer(currentPart.payloadEnc, aadContext);
          const computedSha256 = crypto.createHash("sha256").update(decBuffer).digest("hex");

          if (computedSha256 !== currentPart.plaintextSha256) {
            cpManager.recordFailureAndHalt(
              compositeKey,
              `CHECKSUM_MISMATCH: Decrypted part sha256 '${computedSha256}' !== recorded '${currentPart.plaintextSha256}'`
            );
          }

          const newPayloadEnc = encryptEnvelopeV2Buffer(decBuffer, aadContext, targetKeyId);

          const updateRes = await db
            .update(schema.exportJobParts)
            .set({ payloadEnc: newPayloadEnc })
            .where(
              and(
                eq(schema.exportJobParts.jobId, currentPart.jobId),
                eq(schema.exportJobParts.attemptNo, currentPart.attemptNo),
                eq(schema.exportJobParts.partNo, currentPart.partNo),
                eq(schema.exportJobParts.payloadEnc, currentPart.payloadEnc)
              )
            )
            .returning({ jobId: schema.exportJobParts.jobId });

          if (updateRes.length > 0) {
            return true;
          }

          return attemptPartCas(part, compositeKey, retry + 1);
        }

        async function processPartsBatch(
          currentCursor: { jobId: string; attemptNo: number; partNo: number } | null
        ): Promise<void> {
          const cursorCondition = currentCursor
            ? sql`(${schema.exportJobParts.jobId}, ${schema.exportJobParts.attemptNo}, ${schema.exportJobParts.partNo}) > (${currentCursor.jobId}::uuid, ${currentCursor.attemptNo}::integer, ${currentCursor.partNo}::integer)`
            : undefined;

          const batch = await db
            .select()
            .from(schema.exportJobParts)
            .where(cursorCondition)
            .orderBy(
              asc(schema.exportJobParts.jobId),
              asc(schema.exportJobParts.attemptNo),
              asc(schema.exportJobParts.partNo)
            )
            .limit(BATCH_SIZE);

          if (batch.length === 0) return;

          let nextCursor = currentCursor;

          async function processPartItem(idx: number): Promise<void> {
            if (idx >= batch.length) return;
            const part = batch[idx];
            if (part) {
              const compositeKey = `${part.jobId}:${part.attemptNo}:${part.partNo}`;

              try {
                const casSuccess = await attemptPartCas(part, compositeKey, 0);

                if (!casSuccess) {
                  cpManager.recordFailureAndHalt(compositeKey, "EXPORT_PART_CAS_CONFLICT_EXHAUSTED");
                }

                nextCursor = { jobId: part.jobId, attemptNo: part.attemptNo, partNo: part.partNo };
                cpManager.recordSuccess(compositeKey);
              } catch (err) {
                cpManager.recordFailureAndHalt(
                  compositeKey,
                  err instanceof Error ? err.message : String(err)
                );
              }
            }
            await processPartItem(idx + 1);
          }

          await processPartItem(0);
          await processPartsBatch(nextCursor);
        }

        await processPartsBatch(cursor);
      }

      cpManager.transitionPhase("VERIFY");
    }

    // Phase 4: VERIFY (Full table keyset scan)
    if (cpManager.data.phase === "VERIFY") {
      console.info("[PII-Rotation] Phase 4: Full verification of rotated records...");

      let totalUsersExamined = 0;
      let totalIdentitiesExamined = 0;
      let totalPartsExamined = 0;

      // 1. Verify all users with emailEnc or twoFactorSecret
      async function verifyUsersBatch(lastUserId: string | null): Promise<void> {
        const cond: SQL[] = [
          lastUserId ? gt(schema.users.id, lastUserId) : undefined,
          or(isNotNull(schema.users.emailEnc), isNotNull(schema.users.twoFactorSecret)),
        ].filter((c): c is SQL => Boolean(c));

        const users = await db
          .select({
            id: schema.users.id,
            emailEnc: schema.users.emailEnc,
            twoFactorSecret: schema.users.twoFactorSecret,
          })
          .from(schema.users)
          .where(and(...cond))
          .orderBy(asc(schema.users.id))
          .limit(BATCH_SIZE);

        if (users.length === 0) return;

        let nextUserId = lastUserId;
        for (const u of users) {
          totalUsersExamined++;
          if (u.emailEnc) {
            if (!u.emailEnc.startsWith(`v2:${targetKeyId}:`)) {
              cpManager.recordFailureAndHalt(
                u.id,
                `VERIFY_KEY_MISMATCH: User emailEnc is not on target keyId '${targetKeyId}'`
              );
            }
            try {
              const dec = decryptEnvelopeV2(u.emailEnc, {
                table: "users",
                primaryKey: u.id,
                column: "email_enc",
              });
              if (!dec || !dec.includes("@")) {
                cpManager.recordFailureAndHalt(u.id, "VERIFY_DECRYPTION_FAILED");
              }
            } catch (err) {
              cpManager.recordFailureAndHalt(
                u.id,
                `VERIFY_DECRYPTION_EXCEPTION: ${err instanceof Error ? err.message : String(err)}`
              );
            }
          }

          if (u.twoFactorSecret) {
            if (!u.twoFactorSecret.startsWith(`v2:${targetKeyId}:`)) {
              cpManager.recordFailureAndHalt(
                u.id,
                `VERIFY_KEY_MISMATCH: User twoFactorSecret is not on target keyId '${targetKeyId}'`
              );
            }
            try {
              const dec2Fa = decryptTotpSecret(u.id, u.twoFactorSecret);
              if (!dec2Fa) {
                cpManager.recordFailureAndHalt(u.id, "VERIFY_TOTP_EMPTY");
              }
            } catch (err) {
              cpManager.recordFailureAndHalt(
                u.id,
                `VERIFY_TOTP_EXCEPTION: ${err instanceof Error ? err.message : String(err)}`
              );
            }
          }

          nextUserId = u.id;
        }

        await verifyUsersBatch(nextUserId);
      }

      await verifyUsersBatch(null);

      // 2. Verify all identities
      async function verifyIdentitiesBatch(lastIdentityId: string | null): Promise<void> {
        const cond: SQL[] = [
          lastIdentityId ? gt(schema.userPrivateIdentity.userId, lastIdentityId) : undefined,
        ].filter((c): c is SQL => Boolean(c));

        const ids = await db
          .select()
          .from(schema.userPrivateIdentity)
          .where(and(...cond))
          .orderBy(asc(schema.userPrivateIdentity.userId))
          .limit(BATCH_SIZE);

        if (ids.length === 0) return;

        let nextIdentityId = lastIdentityId;
        for (const idRow of ids) {
          totalIdentitiesExamined++;
          const checkCol = (val: string | null, col: string) => {
            if (!val) return;
            if (!val.startsWith(`v2:${targetKeyId}:`)) {
              cpManager.recordFailureAndHalt(
                idRow.userId,
                `VERIFY_KEY_MISMATCH: Identity column '${col}' is not on target keyId '${targetKeyId}'`
              );
            }
            try {
              decryptEnvelopeV2(val, {
                table: "user_private_identity",
                primaryKey: idRow.userId,
                column: col,
              });
            } catch (err) {
              cpManager.recordFailureAndHalt(
                idRow.userId,
                `VERIFY_IDENTITY_EXCEPTION: ${col} failed: ${err instanceof Error ? err.message : String(err)}`
              );
            }
          };

          checkCol(idRow.legalFirstNameEnc, "legal_first_name_enc");
          checkCol(idRow.legalLastNameEnc, "legal_last_name_enc");
          checkCol(idRow.phoneE164Enc, "phone_e164_enc");
          checkCol(idRow.dateOfBirthEnc, "date_of_birth_enc");

          nextIdentityId = idRow.userId;
        }

        await verifyIdentitiesBatch(nextIdentityId);
      }

      await verifyIdentitiesBatch(null);

      // 3. Verify all export_job_parts
      const partsTableCheck = await db.execute<{ exists: boolean }>(
        sql`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'export_job_parts') as exists`
      );
      const hasPartsTable = Boolean(
        (partsTableCheck.rows as unknown as Array<{ exists?: boolean }>)[0]?.exists
      );

      if (hasPartsTable) {
        async function verifyPartsBatch(
          cursor: { jobId: string; attemptNo: number; partNo: number } | null
        ): Promise<void> {
          const verifyPartCondition: SQL | undefined = cursor
            ? sql`(${schema.exportJobParts.jobId}, ${schema.exportJobParts.attemptNo}, ${schema.exportJobParts.partNo}) > (${cursor.jobId}::uuid, ${cursor.attemptNo}::integer, ${cursor.partNo}::integer)`
            : undefined;

          const parts: (typeof schema.exportJobParts.$inferSelect)[] = await db
            .select()
            .from(schema.exportJobParts)
            .where(verifyPartCondition)
            .orderBy(
              asc(schema.exportJobParts.jobId),
              asc(schema.exportJobParts.attemptNo),
              asc(schema.exportJobParts.partNo)
            )
            .limit(BATCH_SIZE);

          if (parts.length === 0) return;

          let nextPartCursor = cursor;
          for (const p of parts) {
            totalPartsExamined++;
            const compositeKey = `${p.jobId}:${p.attemptNo}:${p.partNo}`;
            if (!p.payloadEnc.startsWith(`v2:${targetKeyId}:`)) {
              cpManager.recordFailureAndHalt(
                compositeKey,
                `VERIFY_KEY_MISMATCH: Export part is not on target keyId '${targetKeyId}'`
              );
            }

            try {
              const aadContext = {
                table: "export_job_parts",
                primaryKey: p.jobId,
                column: `${p.attemptNo}:${p.partNo}`,
              };
              const dec = decryptEnvelopeV2Buffer(p.payloadEnc, aadContext);
              if (dec.length !== p.byteLength) {
                cpManager.recordFailureAndHalt(
                  compositeKey,
                  `VERIFY_PART_LENGTH_MISMATCH: Decrypted length ${dec.length} !== recorded ${p.byteLength}`
                );
              }
              const sha = crypto.createHash("sha256").update(dec).digest("hex");
              if (sha !== p.plaintextSha256) {
                cpManager.recordFailureAndHalt(
                  compositeKey,
                  `VERIFY_PART_CHECKSUM_MISMATCH: Decrypted checksum ${sha} !== recorded ${p.plaintextSha256}`
                );
              }
            } catch (err) {
              cpManager.recordFailureAndHalt(
                compositeKey,
                `VERIFY_PART_DECRYPTION_FAILED: ${err instanceof Error ? err.message : String(err)}`
              );
            }

            nextPartCursor = { jobId: p.jobId, attemptNo: p.attemptNo, partNo: p.partNo };
          }

          await verifyPartsBatch(nextPartCursor);
        }

        await verifyPartsBatch(null);
      }

      console.info(
        `[PII-Rotation] Verification Summary: Users: ${totalUsersExamined}, Identities: ${totalIdentitiesExamined}, Export Parts: ${totalPartsExamined}. Zero errors found.`
      );

      cpManager.transitionPhase("DONE");
    }

    cpManager.markDone();
    console.info(
      "[PII-Rotation] Key rotation completed successfully with 100% verified integrity!"
    );

    return {
      phase: cpManager.data.phase,
      totalProcessed: cpManager.data.totalProcessed,
      totalFailed: cpManager.data.totalFailed,
    };
  } finally {
    await releasePiiAdvisoryLock();
  }
}

if (process.argv[1] && process.argv[1].endsWith("rotate-pii-keys.ts")) {
  runRotation()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[PII-Rotation] Fatal error:", err);
      process.exit(1);
    });
}
