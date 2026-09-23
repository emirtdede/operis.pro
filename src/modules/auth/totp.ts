import crypto from "node:crypto";
import { encryptEnvelopeV2, decryptEnvelopeV2 } from "@/src/lib/crypto/envelope";

/**
 * Encrypts a raw Base32 TOTP secret using Envelope v2 with AAD context binding for zero-knowledge storage at rest.
 */
export function encryptTotpSecret(userId: string, secretBase32: string): string;
export function encryptTotpSecret(secretBase32: string, userId?: string): string;
export function encryptTotpSecret(arg1: string, arg2?: string): string {
  let userId = "";
  let secretBase32: string;

  if (arg2 !== undefined) {
    if (/^[A-Z2-7]{16,64}$/i.test(arg1) || /^[0-9a-f-]{36}$/i.test(arg2)) {
      secretBase32 = arg1;
      userId = arg2;
    } else {
      userId = arg1;
      secretBase32 = arg2;
    }
  } else {
    secretBase32 = arg1;
  }

  if (!secretBase32) return "";
  const primaryKey = userId || "global";
  return encryptEnvelopeV2(secretBase32, {
    table: "users",
    primaryKey,
    column: "two_factor_secret",
  });
}

/**
 * Decrypts an encrypted TOTP secret.
 * Supports:
 * 1. Envelope v2 (v2:keyId:...) verified with AAD context { table: "users", primaryKey: userId, column: "two_factor_secret" }.
 * 2. Legacy 3-part format (iv:tag:cipher).
 * 3. Legacy plaintext Base32 strings.
 */
export function decryptTotpSecret(userId: string, storedSecret: string | null | undefined): string;
export function decryptTotpSecret(storedSecret: string | null | undefined, userId?: string): string;
export function decryptTotpSecret(
  arg1: string | null | undefined,
  arg2?: string | null | undefined
): string {
  let userId = "";
  let storedSecret: string | null | undefined;

  if (arg2 !== undefined) {
    if (typeof arg1 === "string" && (arg1.startsWith("v2:") || arg1.includes(":"))) {
      storedSecret = arg1;
      userId = typeof arg2 === "string" ? arg2 : "";
    } else if (typeof arg2 === "string" && (arg2.startsWith("v2:") || arg2.includes(":"))) {
      userId = typeof arg1 === "string" ? arg1 : "";
      storedSecret = arg2;
    } else if (typeof arg2 === "string" && /^[0-9a-f-]{36}$/i.test(arg2)) {
      storedSecret = arg1;
      userId = arg2;
    } else {
      userId = typeof arg1 === "string" ? arg1 : "";
      storedSecret = arg2;
    }
  } else {
    storedSecret = arg1;
  }

  if (!storedSecret) return "";

  // Envelope v2 format: requires AAD context
  if (storedSecret.startsWith("v2:")) {
    const effectivePrimaryKey = userId || "global";
    return decryptEnvelopeV2(storedSecret, {
      table: "users",
      primaryKey: effectivePrimaryKey,
      column: "two_factor_secret",
    });
  }

  // Legacy 3-part ciphertext format (iv:tag:cipher)
  if (storedSecret.includes(":")) {
    return decryptEnvelopeV2(storedSecret);
  }

  // Legacy plaintext fallback: strictly validate that it's an unpadded Base32 string (16-64 chars)
  const cleaned = storedSecret.trim().toUpperCase();
  if (/^[A-Z2-7]{16,64}$/.test(cleaned)) {
    return cleaned;
  }

  throw new Error("Invalid or corrupted TOTP secret format");
}

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Encodes a buffer into a Base32 string (without padding).
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | (buffer[i] ?? 0);
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string into a binary Buffer.
 */
export function base32Decode(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i] ?? "";
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) {
      throw new Error(`Invalid Base32 character encountered: ${char}`);
    }

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically random Base32 secret for TOTP (20 bytes / 160 bits).
 */
export function generateTotpSecret(lengthBytes = 20): string {
  const buf = crypto.randomBytes(lengthBytes);
  return base32Encode(buf);
}

/**
 * Generates an RFC 6238 compliant 6-digit TOTP token using HMAC-SHA1.
 */
export function generateTotpCode(
  secretBase32: string,
  time = Date.now(),
  stepSeconds = 30,
  digits = 6
): string {
  const key = base32Decode(secretBase32);
  const counter = Math.floor(time / 1000 / stepSeconds);

  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac("sha1", key);
  hmac.update(counterBuf);
  const digest = hmac.digest();

  // Dynamic truncation
  const lastByte = digest[digest.length - 1] ?? 0;
  const offset = lastByte & 0x0f;
  const b0 = digest[offset] ?? 0;
  const b1 = digest[offset + 1] ?? 0;
  const b2 = digest[offset + 2] ?? 0;
  const b3 = digest[offset + 3] ?? 0;
  const binary =
    ((b0 & 0x7f) << 24) |
    ((b1 & 0xff) << 16) |
    ((b2 & 0xff) << 8) |
    (b3 & 0xff);

  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, "0");
}

/**
 * Verifies a 6-digit TOTP code against a secret within an allowed time window (+- window steps).
 * Employs constant-time comparison to protect against timing side-channel attacks.
 */
export function verifyTotpCode(
  secretBase32: string,
  code: string,
  timeMs: number = Date.now(),
  windowSteps: number = 1,
  stepSec: number = 30
): boolean {
  if (!code || typeof code !== "string") return false;
  const cleanCode = code.trim();
  if (!/^\d{6}$/.test(cleanCode)) return false;

  try {
    const inputBuf = Buffer.from(cleanCode);

    for (let stepOffset = -windowSteps; stepOffset <= windowSteps; stepOffset++) {
      const stepTime = timeMs + stepOffset * stepSec * 1000;
      const expectedCode = generateTotpCode(secretBase32, stepTime, stepSec, 6);
      const expectedBuf = Buffer.from(expectedCode);

      if (inputBuf.length === expectedBuf.length && crypto.timingSafeEqual(inputBuf, expectedBuf)) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Generates standard otpauth URI for authenticator applications (Google Authenticator, Apple, 1Password).
 */
export function getOtpAuthUri(account: string, secretBase32: string, issuer = "Operis"): string {
  const encodedAccount = encodeURIComponent(account.trim());
  const encodedIssuer = encodeURIComponent(issuer.trim());
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secretBase32}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates cryptographically secure single-use backup codes (e.g. 10 codes formatted as XXXX-XXXX).
 */
export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Base32 without 0, O, 1, I for unambiguous human reading
  for (let i = 0; i < count; i++) {
    const bytes = crypto.randomBytes(8);
    let code = "";
    for (let j = 0; j < 8; j++) {
      const byteVal = bytes[j] ?? 0;
      code += chars[byteVal % chars.length];
      if (j === 3) code += "-";
    }
    codes.push(code);
  }
  return codes;
}

/**
 * Hashes a backup code using SHA-256 for secure database storage.
 */
export function hashBackupCode(code: string): string {
  const normalized = code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Verifies if a given raw backup code matches any stored hashed code.
 * If matched, returns isValid: true and the remaining hashed codes array.
 */
export function verifyAndConsumeBackupCode(
  rawCode: string,
  hashedCodes: string[]
): { isValid: boolean; remainingHashedCodes: string[] } {
  if (!rawCode || !Array.isArray(hashedCodes) || hashedCodes.length === 0) {
    return { isValid: false, remainingHashedCodes: hashedCodes || [] };
  }

  const targetHash = hashBackupCode(rawCode);
  const targetBuf = Buffer.from(targetHash, "hex");

  let matchIndex = -1;
  for (let i = 0; i < hashedCodes.length; i++) {
    const storedCode = hashedCodes[i];
    if (!storedCode) continue;
    const storedBuf = Buffer.from(storedCode, "hex");
    if (storedBuf.length === targetBuf.length && crypto.timingSafeEqual(storedBuf, targetBuf)) {
      matchIndex = i;
      break;
    }
  }

  if (matchIndex === -1) {
    return { isValid: false, remainingHashedCodes: hashedCodes };
  }

  const remainingHashedCodes = [
    ...hashedCodes.slice(0, matchIndex),
    ...hashedCodes.slice(matchIndex + 1),
  ];

  return { isValid: true, remainingHashedCodes };
}
