import crypto from "node:crypto";
import { getEnv } from "@/src/config/env";
import type { getDb } from "@/src/lib/db";

type TransactionContext = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

export type PhoneVerificationErrorCode =
  | "INVALID_CODE"
  | "EXPIRED"
  | "MAX_ATTEMPTS_EXCEEDED"
  | "CHALLENGE_NOT_FOUND"
  | "CHALLENGE_ID_REQUIRED"
  | "RATE_LIMITED"
  | "DB_UNAVAILABLE"
  | "PURPOSE_MISMATCH"
  | "PHONE_MISMATCH";

export class PhoneVerificationError extends Error {
  readonly code: PhoneVerificationErrorCode;
  readonly status: number;

  constructor(code: PhoneVerificationErrorCode, message?: string) {
    let defaultMsg = "Phone verification failed.";
    let status = 400;
    if (code === "DB_UNAVAILABLE") {
      status = 503;
      defaultMsg = "Database service temporarily unavailable.";
    } else if (code === "RATE_LIMITED") {
      status = 429;
      defaultMsg = "Too many verification attempts.";
    } else if (code === "INVALID_CODE") {
      status = 400;
      defaultMsg = "Invalid or expired SMS verification code.";
    } else if (code === "EXPIRED") {
      status = 400;
      defaultMsg = "SMS verification code has expired.";
    } else if (code === "MAX_ATTEMPTS_EXCEEDED") {
      status = 400;
      defaultMsg = "Maximum verification attempts exceeded. Please request a new code.";
    } else if (code === "CHALLENGE_NOT_FOUND" || code === "CHALLENGE_ID_REQUIRED") {
      status = 400;
      defaultMsg = "Active verification session not found or challengeId is missing.";
    } else if (code === "PHONE_MISMATCH" || code === "PURPOSE_MISMATCH") {
      status = 400;
      defaultMsg = "Verification context mismatch.";
    }

    super(message || defaultMsg);
    this.name = "PhoneVerificationError";
    this.code = code;
    this.status = status;
  }
}

export interface EmailVerificationPayload {
  userId: string;
  email: string;
  type: "EMAIL_VERIFY";
  expiresAt: number;
}

const EMAIL_VERIFY_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export type OtpPurpose = "INITIAL_VERIFICATION" | "PHONE_CHANGE";

export interface StoredOtpMetadata {
  pendingPhone?: string;
  purpose?: OtpPurpose;
}

interface StoredOtpRecord {
  challengeId: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  metadata?: StoredOtpMetadata;
}

const otpStore = new Map<string, StoredOtpRecord>();

function getEmailVerifyKey(secret: string): Buffer {
  return crypto.createHmac("sha256", secret).update("operis_email_verify_token_v1").digest();
}

function getPhoneOtpSigningKey(secret: string): Buffer {
  return crypto.createHmac("sha256", secret).update("operis_phone_otp_key_v1").digest();
}

export function computeOtpDigest(
  userId: string,
  purpose: string,
  challengeId: string,
  code: string
): string {
  const env = getEnv();
  const signingKey = getPhoneOtpSigningKey(env.AUTH_SECRET);
  const payload = `v1:${userId}:${purpose}:${challengeId}:${code.trim()}`;
  return crypto.createHmac("sha256", signingKey).update(payload).digest("hex");
}

export function computeLegacyOtpDigest(code: string): string {
  const env = getEnv();
  return crypto.createHmac("sha256", env.AUTH_SECRET).update(code.trim()).digest("hex");
}

/**
 * Creates a cryptographically signed, stateless email verification token.
 */
export function createEmailVerificationToken(userId: string, email: string): string {
  const env = getEnv();
  const now = Date.now();
  const expiresAt = now + EMAIL_VERIFY_EXPIRY_MS;

  const payload: EmailVerificationPayload = {
    userId,
    email: email.toLowerCase().trim(),
    type: "EMAIL_VERIFY",
    expiresAt,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signingKey = getEmailVerifyKey(env.AUTH_SECRET);
  const signature = crypto.createHmac("sha256", signingKey).update(payloadB64).digest("hex");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies an email verification token against the platform's secret and expiration window.
 */
export function verifyEmailVerificationToken(
  token: string
): { userId: string; email: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    if (!payloadB64 || !signature) return null;

    const env = getEnv();
    const signingKey = getEmailVerifyKey(env.AUTH_SECRET);
    const expectedSignature = crypto
      .createHmac("sha256", signingKey)
      .update(payloadB64)
      .digest("hex");

    const sigBuffer = Buffer.from(signature, "hex");
    const expBuffer = Buffer.from(expectedSignature, "hex");

    if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
      return null;
    }

    const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson) as EmailVerificationPayload;

    if (
      !payload.userId ||
      !payload.email ||
      payload.type !== "EMAIL_VERIFY" ||
      !payload.expiresAt
    ) {
      return null;
    }

    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

/**
 * Helper to check if a string is a valid UUID
 */
function isUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

/**
 * Stores an SMS OTP code hash for a user with 10-minute expiration.
 * Persists to PostgreSQL schema.otpChallenges inside an awaited transaction (B12).
 */
export async function storePhoneOtpAsync(
  userId: string,
  code: string,
  metadata?: StoredOtpMetadata
): Promise<string> {
  const challengeId = crypto.randomUUID();
  const purpose = metadata?.purpose || "INITIAL_VERIFICATION";
  const codeHash = computeOtpDigest(userId, purpose, challengeId, code);
  const expiresAtMs = Date.now() + OTP_EXPIRY_MS;

  otpStore.set(userId, {
    challengeId,
    codeHash,
    expiresAt: expiresAtMs,
    attempts: 0,
    metadata,
  });

  if (isUuid(userId)) {
    try {
      const { getDb, schema } = await import("@/src/lib/db");
      const { eq, and, isNull, sql } = await import("drizzle-orm");
      const { hashPhoneBlindIndex } = await import("@/src/lib/crypto");
      const db = getDb();
      const now = new Date();
      const purpose = metadata?.purpose || "INITIAL_VERIFICATION";

      await db.transaction(async (tx) => {
        // Advisory lock to serialize concurrent OTP creations for this user & purpose (Fixes B12)
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${userId} || ':phone_otp:' || ${purpose}))`
        );

        // Mark previous unconsumed challenges as superseded
        await tx
          .update(schema.otpChallenges)
          .set({ supersededAt: now })
          .where(
            and(
              eq(schema.otpChallenges.userId, userId),
              eq(schema.otpChallenges.purpose, purpose),
              isNull(schema.otpChallenges.consumedAt),
              isNull(schema.otpChallenges.supersededAt)
            )
          );

        // Insert new challenge record
        await tx.insert(schema.otpChallenges).values({
          id: challengeId,
          userId,
          purpose,
          targetPhoneHmac: metadata?.pendingPhone
            ? hashPhoneBlindIndex(metadata.pendingPhone)
            : null,
          codeDigest: codeHash,
          expiresAt: new Date(expiresAtMs),
          attemptCount: 0,
        });
      });
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Failed to store OTP challenge in database", { cause: err });
      }
    }
  }

  return challengeId;
}

/**
 * Stores an SMS OTP code hash for a user with 10-minute expiration.
 * Retains synchronous API for compatibility while delegating persistence to storePhoneOtpAsync.
 */
export function storePhoneOtp(userId: string, code: string, metadata?: StoredOtpMetadata): string {
  const challengeId = crypto.randomUUID();
  const purpose = metadata?.purpose || "INITIAL_VERIFICATION";
  const codeHash = computeOtpDigest(userId, purpose, challengeId, code);
  const expiresAtMs = Date.now() + OTP_EXPIRY_MS;

  otpStore.set(userId, {
    challengeId,
    codeHash,
    expiresAt: expiresAtMs,
    attempts: 0,
    metadata,
  });

  if (isUuid(userId)) {
    storePhoneOtpAsync(userId, code, metadata).catch(() => {});
  }

  return challengeId;
}

/**
 * Retrieves stored OTP metadata (e.g. pending phone number, purpose).
 */
export function getStoredPhoneOtpMetadata(userId: string): StoredOtpMetadata | undefined {
  return otpStore.get(userId)?.metadata;
}

/**
 * Asynchronously and explicitly consumes a phone OTP after successful verification,
 * ensuring DB persistence in PostgreSQL is fully awaited.
 * If challengeId is provided, only deletes if the record matches that specific challenge (Fixes B12).
 */
export async function consumePhoneOtpAsync(userId: string, challengeId?: string): Promise<void> {
  const record = otpStore.get(userId);
  if (record) {
    if (!challengeId || record.challengeId === challengeId) {
      otpStore.delete(userId);
    }
  }

  // Update DB challenge record
  if (isUuid(userId)) {
    try {
      const { getDb, schema } = await import("@/src/lib/db");
      const { eq, and, isNull } = await import("drizzle-orm");
      const db = getDb();
      const now = new Date();
      const conditions = [
        eq(schema.otpChallenges.userId, userId),
        isNull(schema.otpChallenges.consumedAt),
      ];
      if (challengeId) {
        conditions.push(eq(schema.otpChallenges.id, challengeId));
      }

      await db
        .update(schema.otpChallenges)
        .set({ consumedAt: now })
        .where(and(...conditions));
    } catch {
      if (process.env.NODE_ENV === "production") {
        throw new PhoneVerificationError(
          "DB_UNAVAILABLE",
          "Database service temporarily unavailable during challenge consumption."
        );
      }
    }
  }
}

/**
 * Synchronous backward-compatible wrapper that triggers consumePhoneOtpAsync.
 */
export function consumePhoneOtp(userId: string, challengeId?: string): void {
  consumePhoneOtpAsync(userId, challengeId).catch(() => {});
}

export interface VerifyPhoneOtpOptions {
  autoConsume?: boolean;
  expectedPurpose?: OtpPurpose;
  targetPhone?: string;
  challengeId?: string;
  requireChallengeId?: boolean;
  onSuccessTx?: (tx: TransactionContext) => Promise<void>;
}

/**
 * Verifies a 6-digit phone OTP code for a user with brute-force protection (max 5 attempts).
 * Supports purpose binding (e.g. INITIAL_VERIFICATION vs PHONE_CHANGE) and target phone check.
 * Synchronous version checks in-memory state.
 */
export function verifyPhoneOtp(
  userId: string,
  code: string,
  optionsOrAutoConsume: boolean | VerifyPhoneOtpOptions = false
): boolean {
  const options: VerifyPhoneOtpOptions =
    typeof optionsOrAutoConsume === "boolean"
      ? { autoConsume: optionsOrAutoConsume }
      : optionsOrAutoConsume;
  const autoConsume = options.autoConsume ?? false;

  const allowDemoOtp =
    (process.env.ALLOW_DEMO_CREDENTIALS === "true" ||
      process.env.ENABLE_DEMO_LOGIN === "true" ||
      process.env.VITEST !== undefined ||
      process.env.NODE_ENV === "test") &&
    process.env.NODE_ENV !== "production";

  if (
    allowDemoOtp &&
    code.trim() === "123456" &&
    (userId === "usr_mock_demir_yildiz" || userId === "u-techcorp-1")
  ) {
    if (autoConsume) otpStore.delete(userId);
    return true;
  }

  const record = otpStore.get(userId);
  if (!record) return false;

  if (Date.now() > record.expiresAt) {
    otpStore.delete(userId);
    return false;
  }

  record.attempts++;
  if (record.attempts > 5) {
    otpStore.delete(userId);
    return false;
  }

  // Purpose validation: prevent cross-using initial OTP for phone change or vice versa
  if (options.expectedPurpose) {
    const recordPurpose = record.metadata?.purpose || "INITIAL_VERIFICATION";
    if (recordPurpose !== options.expectedPurpose) {
      return false;
    }
  }

  // Target phone validation if provided in metadata
  if (options.targetPhone && record.metadata?.pendingPhone) {
    if (record.metadata.pendingPhone !== options.targetPhone) {
      return false;
    }
  }

  const recordPurpose = record.metadata?.purpose || "INITIAL_VERIFICATION";
  const versionedHash = computeOtpDigest(userId, recordPurpose, record.challengeId, code);
  const legacyHash = computeLegacyOtpDigest(code);

  const versionedBuf = Buffer.from(versionedHash, "hex");
  const legacyBuf = Buffer.from(legacyHash, "hex");
  const expectedBuf = Buffer.from(record.codeHash, "hex");

  const isVersionedMatch =
    versionedBuf.length === expectedBuf.length && crypto.timingSafeEqual(versionedBuf, expectedBuf);
  const isLegacyMatch =
    legacyBuf.length === expectedBuf.length && crypto.timingSafeEqual(legacyBuf, expectedBuf);

  if (isVersionedMatch || isLegacyMatch) {
    if (autoConsume) {
      consumePhoneOtp(userId, record.challengeId);
    }
    return true;
  }

  return false;
}

/**
 * Asynchronous phone OTP verification with PostgreSQL single-source-of-truth and atomic row locks (B12).
 */
export async function verifyPhoneOtpAsync(
  userId: string,
  code: string,
  optionsOrAutoConsume: boolean | VerifyPhoneOtpOptions = false
): Promise<boolean> {
  const options: VerifyPhoneOtpOptions =
    typeof optionsOrAutoConsume === "boolean"
      ? { autoConsume: optionsOrAutoConsume }
      : optionsOrAutoConsume;

  // 1. If user ID is valid UUID, verify against PostgreSQL schema.otpChallenges with FOR UPDATE row lock
  if (isUuid(userId)) {
    try {
      const { getDb, schema } = await import("@/src/lib/db");
      const { eq, and, gt, isNull } = await import("drizzle-orm");
      const { hashPhoneBlindIndex } = await import("@/src/lib/crypto");
      const db = getDb();
      const now = new Date();
      const purpose = options.expectedPurpose || "INITIAL_VERIFICATION";

      let isValid = false;
      let verificationError: PhoneVerificationError | null = null;

      await db.transaction(async (tx) => {
        const conditions = [
          eq(schema.otpChallenges.userId, userId),
          eq(schema.otpChallenges.purpose, purpose),
          isNull(schema.otpChallenges.consumedAt),
          isNull(schema.otpChallenges.supersededAt),
          gt(schema.otpChallenges.expiresAt, now),
        ];

        if (options.challengeId) {
          conditions.push(eq(schema.otpChallenges.id, options.challengeId));
        } else if (options.requireChallengeId || process.env.NODE_ENV === "production") {
          verificationError = new PhoneVerificationError(
            "CHALLENGE_ID_REQUIRED",
            "challengeId is required for this verification operation."
          );
          return;
        }

        const challenges = await tx
          .select()
          .from(schema.otpChallenges)
          .where(and(...conditions))
          .for("update")
          .limit(1);

        const challenge = challenges[0];
        if (!challenge) {
          verificationError = new PhoneVerificationError(
            "CHALLENGE_NOT_FOUND",
            "No active verification challenge found for this user."
          );
          return;
        }

        // Check max attempts (5)
        if (challenge.attemptCount >= 5) {
          await tx
            .update(schema.otpChallenges)
            .set({ consumedAt: now })
            .where(eq(schema.otpChallenges.id, challenge.id));
          verificationError = new PhoneVerificationError(
            "MAX_ATTEMPTS_EXCEEDED",
            "Maximum verification attempts exceeded. Please request a new code."
          );
          return;
        }

        // Increment attempts atomically and consume if limit reached
        const nextAttempts = challenge.attemptCount + 1;
        const willExceed = nextAttempts >= 5;
        await tx
          .update(schema.otpChallenges)
          .set({
            attemptCount: nextAttempts,
            ...(willExceed ? { consumedAt: now } : {}),
          })
          .where(eq(schema.otpChallenges.id, challenge.id));

        // Validate target phone if requested
        if (options.targetPhone) {
          const expectedPhoneHmac = hashPhoneBlindIndex(options.targetPhone);
          if (challenge.targetPhoneHmac && challenge.targetPhoneHmac !== expectedPhoneHmac) {
            verificationError = new PhoneVerificationError(
              "PHONE_MISMATCH",
              "Target phone number does not match verification challenge."
            );
            return;
          }
        }

        const versionedHash = computeOtpDigest(userId, purpose, challenge.id, code);
        const legacyHash = computeLegacyOtpDigest(code);

        const versionedBuf = Buffer.from(versionedHash, "hex");
        const legacyBuf = Buffer.from(legacyHash, "hex");
        const expectedBuf = Buffer.from(challenge.codeDigest, "hex");

        const isVersionedMatch =
          versionedBuf.length === expectedBuf.length &&
          crypto.timingSafeEqual(versionedBuf, expectedBuf);
        // Legacy OTP format supported only for recent challenges within 15-minute migration window
        const isLegacyMatch =
          challenge.createdAt &&
          now.getTime() - new Date(challenge.createdAt).getTime() <= 15 * 60 * 1000 &&
          legacyBuf.length === expectedBuf.length &&
          crypto.timingSafeEqual(legacyBuf, expectedBuf);

        if (isVersionedMatch || isLegacyMatch) {
          if (options.onSuccessTx) {
            await options.onSuccessTx(tx);
          }
          if (options.autoConsume !== false) {
            await tx
              .update(schema.otpChallenges)
              .set({ consumedAt: now })
              .where(eq(schema.otpChallenges.id, challenge.id));
          }
          otpStore.delete(userId);
          isValid = true;
        } else {
          verificationError = new PhoneVerificationError(
            willExceed ? "MAX_ATTEMPTS_EXCEEDED" : "INVALID_CODE",
            willExceed
              ? "Maximum verification attempts exceeded. Please request a new code."
              : "Invalid or expired SMS verification code."
          );
        }
      });

      if (verificationError) {
        if (process.env.NODE_ENV === "production" || isUuid(userId)) {
          throw verificationError;
        }
      }

      return isValid;
    } catch (err) {
      if (err instanceof PhoneVerificationError) {
        throw err;
      }
      if (process.env.NODE_ENV === "production") {
        throw new PhoneVerificationError(
          "DB_UNAVAILABLE",
          "Database service temporarily unavailable."
        );
      }
    }
  }

  // 2. Fallback to in-memory store for unit test suites or non-UUID mock users
  return verifyPhoneOtp(userId, code, options);
}

export async function cleanupExpiredOtpChallenges(olderThanHours = 24): Promise<number> {
  try {
    const { getDb, schema } = await import("@/src/lib/db");
    const { or, lte, and, isNotNull } = await import("drizzle-orm");
    const db = getDb();
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const result = await db
      .delete(schema.otpChallenges)
      .where(
        or(
          lte(schema.otpChallenges.expiresAt, cutoff),
          and(
            isNotNull(schema.otpChallenges.consumedAt),
            lte(schema.otpChallenges.consumedAt, cutoff)
          )
        )
      )
      .returning({ id: schema.otpChallenges.id });
    return result.length;
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
    return 0;
  }
}

/**
 * Retrieves the currently active, unconsumed challenge ID and remaining validity for a user (B12).
 * Never returns code hashes or raw verification secrets.
 */
export async function getActivePhoneChallengeAsync(
  userId: string,
  purpose: OtpPurpose = "INITIAL_VERIFICATION"
): Promise<{ challengeId: string; expiresAt: Date; secondsRemaining: number } | null> {
  const now = new Date();
  if (isUuid(userId)) {
    try {
      const { getDb, schema } = await import("@/src/lib/db");
      const { eq, and, gt, isNull, desc } = await import("drizzle-orm");
      const db = getDb();

      const [challenge] = await db
        .select({
          id: schema.otpChallenges.id,
          expiresAt: schema.otpChallenges.expiresAt,
        })
        .from(schema.otpChallenges)
        .where(
          and(
            eq(schema.otpChallenges.userId, userId),
            eq(schema.otpChallenges.purpose, purpose),
            isNull(schema.otpChallenges.consumedAt),
            isNull(schema.otpChallenges.supersededAt),
            gt(schema.otpChallenges.expiresAt, now)
          )
        )
        .orderBy(desc(schema.otpChallenges.createdAt))
        .limit(1);

      if (challenge) {
        const secondsRemaining = Math.max(
          0,
          Math.ceil((new Date(challenge.expiresAt).getTime() - now.getTime()) / 1000)
        );
        return {
          challengeId: challenge.id,
          expiresAt: challenge.expiresAt,
          secondsRemaining,
        };
      }
      return null;
    } catch {
      if (process.env.NODE_ENV === "production") {
        throw new PhoneVerificationError(
          "DB_UNAVAILABLE",
          "Database service temporarily unavailable."
        );
      }
    }
  }

  const record = otpStore.get(userId);
  if (record && record.expiresAt > Date.now()) {
    const recordPurpose = record.metadata?.purpose || "INITIAL_VERIFICATION";
    if (recordPurpose === purpose) {
      const secondsRemaining = Math.max(0, Math.ceil((record.expiresAt - Date.now()) / 1000));
      return {
        challengeId: record.challengeId,
        expiresAt: new Date(record.expiresAt),
        secondsRemaining,
      };
    }
  }

  return null;
}
