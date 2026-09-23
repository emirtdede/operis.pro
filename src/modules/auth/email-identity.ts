import crypto from "node:crypto";
import { getDb, schema } from "@/src/lib/db";
import { hashEmailBlindIndex } from "@/src/lib/crypto";
import { decryptEnvelopeV2 } from "@/src/lib/crypto/envelope";
import { eq } from "drizzle-orm";

/**
 * Normalizes email for blind index calculation and identity comparisons.
 * Trims whitespace, lowercases local and domain parts.
 */
export function canonicalizeEmail(email: string): string {
  if (!email) return "";
  const trimmed = email.trim();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex === -1) {
    return trimmed.toLowerCase();
  }
  const local = trimmed.slice(0, atIndex).toLowerCase();
  const domain = trimmed.slice(atIndex + 1).toLowerCase();
  return `${local}@${domain}`;
}

/**
 * Resolves the plaintext email of a user record.
 * Prioritizes encrypted emailEnc (Envelope v2 or legacy), verifying with AAD context if available.
 * Falls back to legacy plaintext email column during backfill/migration.
 */
export function resolveUserEmail(user: {
  id: string;
  email: string | null;
  emailEnc?: string | null;
}): string {
  if (user.emailEnc) {
    try {
      const decrypted = decryptEnvelopeV2(user.emailEnc, {
        table: "users",
        primaryKey: user.id,
        column: "email_enc",
      });
      if (decrypted) return canonicalizeEmail(decrypted);
    } catch {
      // Fallback to trying without AAD in case of legacy 3-part cipher
      try {
        const decrypted = decryptEnvelopeV2(user.emailEnc);
        if (decrypted) return canonicalizeEmail(decrypted);
      } catch (err) {
        // Fail closed: do NOT silently fallback to plaintext when emailEnc exists
        throw new Error(
          `Failed to decrypt user emailEnc for user '${user.id}': ${err instanceof Error ? err.message : String(err)}`,
          { cause: err }
        );
      }
    }
  }

  return user.email ? canonicalizeEmail(user.email) : "";
}

/**
 * Performs authoritative lookup of an active user by email.
 * 1. Computes blind index HMAC over canonical email.
 * 2. Queries PostgreSQL by emailHmac (O(1) indexed lookup).
 * 3. Validates candidates by decrypting emailEnc with timing-safe comparison.
 * 4. Falls back to plaintext email column if emailHmac has not yet been backfilled.
 */
export async function findUserByEmail(
  rawEmail: string
): Promise<typeof schema.users.$inferSelect | null> {
  const canonical = canonicalizeEmail(rawEmail);
  if (!canonical) return null;

  const db = getDb();
  const hmac = hashEmailBlindIndex(canonical);

  // 1. Primary path: query by emailHmac
  const hmacMatches = await db.select().from(schema.users).where(eq(schema.users.emailHmac, hmac));

  for (const user of hmacMatches) {
    const decrypted = resolveUserEmail(user);
    if (decrypted) {
      const bufA = Buffer.from(decrypted);
      const bufB = Buffer.from(canonical);
      if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
        return user;
      }
    }
  }

  // 2. Legacy fallback: query by plaintext email column (for unmigrated records)
  const legacyMatches = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, canonical));

  const firstLegacy = legacyMatches[0];
  if (firstLegacy) {
    return firstLegacy;
  }

  return null;
}
