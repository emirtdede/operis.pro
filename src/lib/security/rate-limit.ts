import { NextResponse } from "next/server";
import { GcraLimiter, type GcraRateLimitResult } from "./gcra-limiter";
export { GcraLimiter, type GcraRateLimitResult };

export const blockedIpSet = new Set<string>();

const IPV4_REGEX =
  /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const IPV6_REGEX = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$|^::1$|^[a-fA-F0-9:]+$/;

export function isValidIp(ip: string): boolean {
  const trimmed = ip.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("::ffff:")) {
    return IPV4_REGEX.test(trimmed.slice(7));
  }
  return IPV4_REGEX.test(trimmed) || (IPV6_REGEX.test(trimmed) && trimmed.includes(":"));
}

export function canonicalizeIpv6(ip: string): string {
  const trimmed = ip.trim().toLowerCase();
  if (trimmed.startsWith("::ffff:")) {
    const v4 = trimmed.slice(7);
    if (IPV4_REGEX.test(v4)) return v4;
  }
  if (!trimmed.includes(":")) return trimmed;

  try {
    const doubleColonIndex = trimmed.indexOf("::");
    let leftParts: string[] = [];
    let rightParts: string[] = [];

    if (doubleColonIndex !== -1) {
      const left = trimmed.slice(0, doubleColonIndex);
      const right = trimmed.slice(doubleColonIndex + 2);
      leftParts = left ? left.split(":") : [];
      rightParts = right ? right.split(":") : [];
      const missingCount = 8 - (leftParts.length + rightParts.length);
      const zeros = new Array(Math.max(0, missingCount)).fill("0");
      const fullParts = [...leftParts, ...zeros, ...rightParts].map((p) => p || "0");
      return fullParts.map((p) => parseInt(p, 16).toString(16)).join(":");
    } else {
      const parts = trimmed.split(":");
      if (parts.length === 8) {
        return parts.map((p) => parseInt(p, 16).toString(16)).join(":");
      }
    }
  } catch {
    // Fallback on parse failure
  }
  return trimmed;
}

export function normalizeIp(ip: string): string {
  const trimmed = ip.trim();
  if (trimmed.startsWith("::ffff:")) {
    const v4 = trimmed.slice(7);
    if (IPV4_REGEX.test(v4)) return v4;
  }
  if (trimmed.includes(":")) {
    return canonicalizeIpv6(trimmed);
  }
  return trimmed.toLowerCase();
}

let lastBlockedIpSync = 0;
const BLOCKED_IP_SYNC_INTERVAL_MS = 60 * 1000;
const BLOCKED_CACHE_TTL_MS = 30 * 1000;
const blockedIpCache = new Map<string, number>();

/**
 * Authoritative asynchronous check whether an IP is actively blocked in PostgreSQL schema.ipBlocks.
 */
export async function isIpBlockedAsync(ip: string): Promise<boolean> {
  const normalized = normalizeIp(ip);
  if (!normalized || !isValidIp(normalized)) return false;

  // Fast path: in-memory cache with active TTL (B18)
  const cachedUntil = blockedIpCache.get(normalized);
  if (cachedUntil && Date.now() < cachedUntil) {
    return true;
  }

  try {
    const { getDb, schema } = await import("@/src/lib/db");
    const { and, eq, gt, or, isNull } = await import("drizzle-orm");
    const db = getDb();
    const now = new Date();

    const [block] = await db
      .select({ id: schema.ipBlocks.id, expiresAt: schema.ipBlocks.expiresAt })
      .from(schema.ipBlocks)
      .where(
        and(
          eq(schema.ipBlocks.ip, normalized),
          isNull(schema.ipBlocks.revokedAt),
          or(isNull(schema.ipBlocks.expiresAt), gt(schema.ipBlocks.expiresAt, now))
        )
      )
      .limit(1);

    if (block) {
      const ttl = block.expiresAt
        ? Math.min(Date.now() + BLOCKED_CACHE_TTL_MS, new Date(block.expiresAt).getTime())
        : Date.now() + BLOCKED_CACHE_TTL_MS;
      blockedIpCache.set(normalized, ttl);
      blockedIpSet.add(normalized);
      return true;
    }

    // Explicitly clear revoked or non-existent block from cache
    blockedIpCache.delete(normalized);
    blockedIpSet.delete(normalized);
    return false;
  } catch (err) {
    throw new Error("SECURITY_DATABASE_UNAVAILABLE", { cause: err });
  }
}

export function isIpBlocked(ip: string): boolean {
  const normalized = normalizeIp(ip);
  if (Date.now() - lastBlockedIpSync > BLOCKED_IP_SYNC_INTERVAL_MS) {
    lastBlockedIpSync = Date.now();
    loadBlockedIpsFromDb().catch(() => {});
  }
  return blockedIpSet.has(normalized);
}

export function recordBlockedIpInCache(ip: string, durationMs = BLOCKED_CACHE_TTL_MS): void {
  const normalized = normalizeIp(ip);
  if (!normalized) return;
  const ttl = Date.now() + Math.min(BLOCKED_CACHE_TTL_MS, durationMs);
  blockedIpCache.set(normalized, ttl);
  blockedIpSet.add(normalized);
}

export function removeBlockedIpFromCache(ip: string): void {
  const normalized = normalizeIp(ip);
  if (!normalized) return;
  blockedIpCache.delete(normalized);
  blockedIpSet.delete(normalized);
}

/**
 * Awaited transactional block of an IP address (B18).
 */
export async function blockIpAddressAsync(
  ip: string,
  options?: { reason?: string; actorId?: string; durationSeconds?: number; tx?: unknown }
): Promise<void> {
  const normalized = normalizeIp(ip);
  if (!normalized || !isValidIp(normalized)) return;

  const { getDb, schema } = await import("@/src/lib/db");
  const client =
    options?.tx && typeof (options.tx as Record<string, unknown>).insert === "function"
      ? (options.tx as ReturnType<typeof getDb>)
      : getDb();
  const expiresAt = options?.durationSeconds
    ? new Date(Date.now() + options.durationSeconds * 1000)
    : null;

  const isActorUuid = options?.actorId
    ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(options.actorId)
    : false;

  const { eq } = await import("drizzle-orm");
  const [existing] = await client
    .select({ id: schema.ipBlocks.id })
    .from(schema.ipBlocks)
    .where(eq(schema.ipBlocks.ip, normalized))
    .limit(1);

  if (existing) {
    await client
      .update(schema.ipBlocks)
      .set({
        reason: options?.reason || "Security violation",
        actorId: isActorUuid ? options?.actorId : null,
        expiresAt,
        revokedAt: null,
      })
      .where(eq(schema.ipBlocks.id, existing.id));
  } else {
    await client.insert(schema.ipBlocks).values({
      ip: normalized,
      reason: options?.reason || "Security violation",
      actorId: isActorUuid ? options?.actorId : null,
      expiresAt,
    });
  }

  // Only update cache immediately if not inside an external transaction (B18)
  const hasExternalTx = Boolean(options?.tx);
  if (!hasExternalTx) {
    const remainingMs = expiresAt
      ? Math.max(0, expiresAt.getTime() - Date.now())
      : BLOCKED_CACHE_TTL_MS;
    const ttl = Date.now() + Math.min(BLOCKED_CACHE_TTL_MS, remainingMs);
    blockedIpCache.set(normalized, ttl);
    blockedIpSet.add(normalized);
  }
}

export function blockIpAddress(
  ip: string,
  options?: { reason?: string; actorId?: string; durationSeconds?: number }
): void {
  const normalized = normalizeIp(ip);
  if (normalized && isValidIp(normalized)) {
    blockedIpSet.add(normalized);
    blockIpAddressAsync(normalized, options).catch(() => {});
  }
}

/**
 * Awaited transactional unblock of an IP address (B18).
 */
export async function unblockIpAddressAsync(ip: string, options?: { tx?: unknown }): Promise<void> {
  const normalized = normalizeIp(ip);
  if (!normalized) return;

  const { getDb, schema } = await import("@/src/lib/db");
  const { eq, and, isNull } = await import("drizzle-orm");
  const client =
    options?.tx && typeof (options.tx as Record<string, unknown>).update === "function"
      ? (options.tx as ReturnType<typeof getDb>)
      : getDb();
  await client
    .update(schema.ipBlocks)
    .set({ revokedAt: new Date() })
    .where(and(eq(schema.ipBlocks.ip, normalized), isNull(schema.ipBlocks.revokedAt)));

  // Only remove from cache immediately if not inside an external transaction
  const hasExternalTx = Boolean(options?.tx);
  if (!hasExternalTx) {
    blockedIpCache.delete(normalized);
    blockedIpSet.delete(normalized);
  }
}

export function unblockIpAddress(ip: string): void {
  const normalized = normalizeIp(ip);
  blockedIpSet.delete(normalized);
  unblockIpAddressAsync(normalized).catch(() => {});
}

/**
 * Synchronously seeds the in-memory blocked IP set (useful for tests and initialization).
 */
export function seedBlockedIps(ips: string[]): void {
  for (const ip of ips) {
    const normalized = normalizeIp(ip);
    if (normalized) blockedIpSet.add(normalized);
  }
}

/**
 * Synchronizes persisted blocked IP addresses from schema.ipBlocks into the in-memory blockedIpSet.
 * NEVER clears existing blockedIpSet on database query failures (Fixes B18).
 */
export async function loadBlockedIpsFromDb(): Promise<number> {
  try {
    const { getDb, schema } = await import("@/src/lib/db");
    const { and, gt, or, isNull } = await import("drizzle-orm");
    const db = getDb();
    const now = new Date();

    const freshSet = new Set<string>();

    const ipBlockRows = await db
      .select({ ip: schema.ipBlocks.ip })
      .from(schema.ipBlocks)
      .where(
        and(
          isNull(schema.ipBlocks.revokedAt),
          or(isNull(schema.ipBlocks.expiresAt), gt(schema.ipBlocks.expiresAt, now))
        )
      );

    for (const r of ipBlockRows) {
      if (r.ip && isValidIp(r.ip)) {
        freshSet.add(normalizeIp(r.ip));
      }
    }

    // Merge active in-memory cached blocks that have not expired (B18)
    for (const [cachedIp, ttl] of blockedIpCache.entries()) {
      if (Date.now() < ttl) {
        freshSet.add(cachedIp);
      } else {
        blockedIpCache.delete(cachedIp);
      }
    }

    // Replace blockedIpSet with authoritative fresh records from database and active cache
    blockedIpSet.clear();
    for (const ip of freshSet) {
      blockedIpSet.add(ip);
    }
    lastBlockedIpSync = Date.now();
    return freshSet.size;
  } catch {
    // Preserve existing blockedIpSet on error; never unblock attackers due to DB connection glitches
    return blockedIpSet.size;
  }
}

// Periodic cleanup of expired GCRA rate limit records every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      GcraLimiter.pruneExpired();
    },
    5 * 60 * 1000
  ).unref?.();
}

/**
 * Extracts client IP from request headers or socket.
 */
export function getClientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const firstIp = ips[0];
    if (firstIp) {
      return firstIp;
    }
  }
  return "127.0.0.1";
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  isBlocked?: boolean;
}

/**
 * Checks and updates rate limit counter for a given key using the Generic Cell Rate Algorithm (GCRA).
 * @param key Unique identifier (e.g. `auth:login:${ip}`)
 * @param limit Maximum allowed requests within window
 * @param windowMs Window duration in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  let isBlocked = blockedIpSet.has(key);
  if (!isBlocked) {
    for (const blockedIp of blockedIpSet) {
      if (
        key === blockedIp ||
        key.endsWith(`:${blockedIp}`) ||
        key.includes(`:${blockedIp}:`) ||
        key.startsWith(`${blockedIp}:`)
      ) {
        isBlocked = true;
        break;
      }
    }
  }

  if (isBlocked) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: 86400,
      isBlocked: true,
    };
  }

  const gcra = GcraLimiter.check(key, limit, windowMs);
  return {
    success: gcra.success,
    limit: gcra.limit,
    remaining: gcra.remaining,
    reset: gcra.resetSeconds,
    isBlocked: false,
  };
}

/**
 * Authoritative asynchronous rate-limiting backed by schema.rateLimits (B12).
 * Atomically records and increments request count in PostgreSQL per purpose + subjectDigest.
 */
export async function checkRateLimitAsync(
  purpose: string,
  subject: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const isSubjectIp = isValidIp(subject);
  const normalizedSubject = isSubjectIp ? normalizeIp(subject) : subject.trim();
  const crypto = await import("crypto");
  const subjectDigest = crypto.createHash("sha256").update(normalizedSubject).digest("hex");

  // Check for blocked IP if subject is an IP
  if (isSubjectIp) {
    const isBlocked = await isIpBlockedAsync(normalizedSubject);
    if (isBlocked) {
      return { success: false, limit, remaining: 0, reset: 86400, isBlocked: true };
    }
  } else if (blockedIpSet.has(normalizedSubject)) {
    return { success: false, limit, remaining: 0, reset: 86400, isBlocked: true };
  }

  const { getDb, schema } = await import("@/src/lib/db");
  const { sql } = await import("drizzle-orm");
  const db = getDb();
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const expiresAt = new Date(windowStart.getTime() + windowMs);

  // Atomic upsert with Postgres ON CONFLICT DO UPDATE
  const rows = await db
    .insert(schema.rateLimits)
    .values({
      purpose,
      subjectDigest,
      windowStart,
      count: 1,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [
        schema.rateLimits.purpose,
        schema.rateLimits.subjectDigest,
        schema.rateLimits.windowStart,
      ],
      set: {
        count: sql`${schema.rateLimits.count} + 1`,
      },
    })
    .returning({ count: schema.rateLimits.count });

  const currentCount = rows[0]?.count ?? 1;
  const remaining = Math.max(0, limit - currentCount);
  const reset = Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));

  return {
    success: currentCount <= limit,
    limit,
    remaining,
    reset,
    isBlocked: false,
  };
}

export interface DualRateLimitResult extends RateLimitResult {
  isBlocked?: boolean;
}

/**
 * Enforces dual limits for both User ID and IP Address in PostgreSQL (B12).
 */
export async function checkDualRateLimitAsync(
  purpose: string,
  userId: string,
  ip: string,
  limits: {
    userLimit: number;
    ipLimit: number;
    windowMs: number;
  }
): Promise<DualRateLimitResult> {
  const isBlocked = await isIpBlockedAsync(ip);
  if (isBlocked) {
    return { success: false, limit: limits.ipLimit, remaining: 0, reset: 86400, isBlocked: true };
  }

  const normalizedIp = normalizeIp(ip);
  const ipCheck = await checkRateLimitAsync(
    `${purpose}:ip`,
    normalizedIp,
    limits.ipLimit,
    limits.windowMs
  );
  if (!ipCheck.success) {
    return ipCheck;
  }

  const userCheck = await checkRateLimitAsync(
    `${purpose}:usr`,
    userId.trim(),
    limits.userLimit,
    limits.windowMs
  );
  if (!userCheck.success) {
    return userCheck;
  }

  return {
    success: true,
    limit: Math.min(limits.userLimit, limits.ipLimit),
    remaining: Math.min(ipCheck.remaining, userCheck.remaining),
    reset: Math.max(ipCheck.reset, userCheck.reset),
    isBlocked: false,
  };
}

/**
 * Generates a 403 Forbidden response for blocked IP addresses.
 */
export function blockedIpResponse(isEn = false): NextResponse {
  return NextResponse.json(
    {
      error: isEn
        ? "Access denied: IP address is blocked."
        : "Erişim engellendi: IP adresiniz engellenmiştir.",
      errorCode: "IP_BLOCKED",
    },
    { status: 403 }
  );
}

/**
 * Generates a 503 Service Unavailable response when security database is offline.
 */
export function securityDbUnavailableResponse(isEn = false): NextResponse {
  return NextResponse.json(
    {
      error: isEn
        ? "Security service temporarily unavailable. Please try again later."
        : "Güvenlik servisine geçici olarak erişilemiyor. Lütfen daha sonra tekrar deneyiniz.",
      errorCode: "DB_UNAVAILABLE",
    },
    { status: 503 }
  );
}

/**
 * Generates a 429 Too Many Requests response with Retry-After header.
 */
export function rateLimitExceededResponse(
  resetSeconds: number,
  message = "Too many requests. Please try again later."
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      errorCode: "RATE_LIMITED",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, resetSeconds)),
      },
    }
  );
}

export type SecurityAccessDecision =
  | { allowed: true; remaining: number; reset: number }
  | {
      allowed: false;
      status: 403;
      error: string;
      reason: "IP_BLOCKED";
      response: NextResponse;
    }
  | {
      allowed: false;
      status: 429;
      error: string;
      reason: "RATE_LIMITED";
      reset: number;
      response: NextResponse;
    }
  | {
      allowed: false;
      status: 503;
      error: string;
      reason: "DB_UNAVAILABLE";
      response: NextResponse;
    };

/**
 * Unified authoritative security gateway evaluator (B18).
 * Checks:
 * 1. IP block status in PostgreSQL schema.ipBlocks (with 30s cache) -> 403
 * 2. Security DB availability -> 503
 * 3. Rate limiting (IP and optional subject/account) -> 429
 */
export async function evaluateSecurityAccessAsync(options: {
  ip: string;
  purpose: string;
  subject?: string;
  limit?: number;
  windowMs?: number;
  isEn?: boolean;
}): Promise<SecurityAccessDecision> {
  const isEn = options.isEn ?? false;

  try {
    const isBlocked = await isIpBlockedAsync(options.ip);
    if (isBlocked) {
      return {
        allowed: false,
        status: 403,
        error: isEn
          ? "Access denied: IP address is blocked."
          : "Erişim engellendi: IP adresiniz engellenmiştir.",
        reason: "IP_BLOCKED",
        response: blockedIpResponse(isEn),
      };
    }

    if (options.limit !== undefined && options.windowMs !== undefined) {
      const subject = options.subject ? options.subject.trim() : normalizeIp(options.ip);

      // Fast distributed Upstash check if available (fail-open)
      try {
        const { checkUpstashRateLimit } = await import("@/src/lib/security/upstash");
        const upstashResult = await checkUpstashRateLimit(
          `${options.purpose}:${subject}`,
          options.limit,
          Math.ceil(options.windowMs / 1000)
        );
        if (upstashResult && !upstashResult.success) {
          const msg = isEn
            ? "Too many requests. Please wait a moment."
            : "Çok fazla istek yapıldı. Lütfen biraz bekleyiniz.";
          return {
            allowed: false,
            status: 429,
            error: msg,
            reason: "RATE_LIMITED",
            reset: upstashResult.reset,
            response: rateLimitExceededResponse(upstashResult.reset, msg),
          };
        }
      } catch {
        // Fail-open: continue to DB rate limiter
      }

      const limitCheck = await checkRateLimitAsync(
        options.purpose,
        subject,
        options.limit,
        options.windowMs
      );

      if (!limitCheck.success) {
        if (limitCheck.isBlocked) {
          return {
            allowed: false,
            status: 403,
            error: isEn
              ? "Access denied: IP address is blocked."
              : "Erişim engellendi: IP adresiniz engellenmiştir.",
            reason: "IP_BLOCKED",
            response: blockedIpResponse(isEn),
          };
        }
        const msg = isEn
          ? "Too many requests. Please wait a moment."
          : "Çok fazla istek yapıldı. Lütfen biraz bekleyiniz.";
        return {
          allowed: false,
          status: 429,
          error: msg,
          reason: "RATE_LIMITED",
          reset: limitCheck.reset,
          response: rateLimitExceededResponse(limitCheck.reset, msg),
        };
      }

      return {
        allowed: true,
        remaining: limitCheck.remaining,
        reset: limitCheck.reset,
      };
    }

    return { allowed: true, remaining: 1, reset: 0 };
  } catch {
    return {
      allowed: false,
      status: 503,
      error: isEn
        ? "Security service temporarily unavailable. Please try again later."
        : "Güvenlik servisine geçici olarak erişilemiyor. Lütfen daha sonra tekrar deneyiniz.",
      reason: "DB_UNAVAILABLE",
      response: securityDbUnavailableResponse(isEn),
    };
  }
}

export async function cleanupExpiredRateLimits(): Promise<number> {
  const { getDb, schema } = await import("@/src/lib/db");
  const { lte } = await import("drizzle-orm");
  const db = getDb();
  const now = new Date();
  const result = await db
    .delete(schema.rateLimits)
    .where(lte(schema.rateLimits.expiresAt, now))
    .returning({ id: schema.rateLimits.id });
  return result.length;
}
