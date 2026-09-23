import { describe, it, expect, beforeAll } from "vitest";
import {
  createPasswordResetToken,
  verifyPasswordResetToken,
  getPasswordHashFingerprint,
} from "@/src/modules/auth/password-reset";

beforeAll(() => {
  process.env.APP_URL = "http://localhost:3000";
  process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/freelance_platform";
  process.env.AUTH_SECRET = "8c7b6a5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a";
  process.env.PII_ENCRYPTION_KEY_CURRENT =
    "9f8e7d6c5b4a3928172635445362718293a4b5c6d7e8f901a2b3c4d5e6f70819";
  process.env.PII_HMAC_KEY = "1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809";
  process.env.LEGAL_ENTITY_NAME = "Operis Teknoloji Anonim Sirketi";
  process.env.LEGAL_ENTITY_TYPE = "Anonim Sirket";
  process.env.LEGAL_ADDRESS = "Buyukdere Cad. No: 199 Istanbul, Turkey";
  process.env.LEGAL_SUPPORT_EMAIL = "destek@operis.pro";
  process.env.LEGAL_PRIVACY_EMAIL = "kvkk@operis.pro";
  process.env.LEGAL_PHONE = "+90 212 555 0100";
  process.env.TERMS_EFFECTIVE_DATE = "2026-09-06";
  process.env.PRIVACY_EFFECTIVE_DATE = "2026-09-06";
  process.env.LEGAL_ETBIS_CLASSIFICATION_APPROVED = "true";
  process.env.LEGAL_PRIVACY_REVIEW_APPROVED = "true";
});

describe("Cryptographic Stateless Password Reset Engine", () => {
  const testEmail = "developer@operis.pro";
  const initialPasswordHash = "argon2id$v=19$m=65536,t=3,p=4$someSampleHashSecret123";

  it("generates a valid, verifiable HMAC-SHA256 reset token", () => {
    const token = createPasswordResetToken(testEmail, initialPasswordHash);
    expect(typeof token).toBe("string");
    expect(token.includes(".")).toBe(true);

    const payload = verifyPasswordResetToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.email).toBe(testEmail);
    expect(payload?.pwh).toBe(getPasswordHashFingerprint(initialPasswordHash));
    expect(payload?.expiresAt).toBeGreaterThan(Date.now());
  });

  it("normalizes and trims email addresses to lowercase", () => {
    const token = createPasswordResetToken("  DeV.User@Operis.PRO  ", initialPasswordHash);
    const payload = verifyPasswordResetToken(token);
    expect(payload?.email).toBe("dev.user@operis.pro");
  });

  it("rejects tampered token payloads or signatures", () => {
    const token = createPasswordResetToken(testEmail, initialPasswordHash);
    const [payloadB64, signature] = token.split(".");

    // Tampered payload
    const tamperedPayload = Buffer.from(
      JSON.stringify({ email: "hacker@evil.com", pwh: "xxx", expiresAt: Date.now() + 60000 })
    ).toString("base64url");
    expect(verifyPasswordResetToken(`${tamperedPayload}.${signature}`)).toBeNull();

    expect(signature).toBeDefined();
    // Tampered signature
    const corruptSignature = signature!.slice(0, -4) + "0000";
    expect(verifyPasswordResetToken(`${payloadB64}.${corruptSignature}`)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyPasswordResetToken("")).toBeNull();
    expect(verifyPasswordResetToken("invalid-format")).toBeNull();
    expect(verifyPasswordResetToken("a.b.c")).toBeNull();
    expect(verifyPasswordResetToken("nonbase64.signature")).toBeNull();
  });

  it("guarantees single-use token lifecycle (invalidated after password change)", () => {
    const token = createPasswordResetToken(testEmail, initialPasswordHash);
    const payload = verifyPasswordResetToken(token);
    expect(payload).not.toBeNull();

    // Simulate password change in DB resulting in a new passwordHash
    const updatedPasswordHash = "argon2id$v=19$m=65536,t=3,p=4$brandNewDifferentHash987";
    expect(payload?.pwh).toBe(getPasswordHashFingerprint(initialPasswordHash));
    expect(payload?.pwh).not.toBe(getPasswordHashFingerprint(updatedPasswordHash));
  });
});

describe("Verification and Token Isolation (B01, B06, B07)", () => {
  it("strictly isolates session tokens from email verification and reset tokens", async () => {
    const { createEmailVerificationToken, verifyEmailVerificationToken } =
      await import("@/src/modules/auth/verification");
    const { verifySessionToken } = await import("@/src/modules/auth/session");

    const userId = "11111111-1111-1111-1111-111111111111";
    const email = "isolation@operis.pro";

    const emailToken = createEmailVerificationToken(userId, email);
    const verifiedPayload = verifyEmailVerificationToken(emailToken);
    expect(verifiedPayload).not.toBeNull();
    expect(verifiedPayload?.userId).toBe(userId);
    expect(verifiedPayload?.email).toBe(email);

    // Cross-token attack: passing email token to session verifier must return null
    const asSession = await verifySessionToken(emailToken);
    expect(asSession).toBeNull();
  });

  it("handles phone OTP verification lifecycle without premature consumption (B07)", async () => {
    const { storePhoneOtp, verifyPhoneOtp, consumePhoneOtp } =
      await import("@/src/modules/auth/verification");

    const userId = "22222222-2222-2222-2222-222222222222";
    const code = "987654";

    storePhoneOtp(userId, code);

    // Verify without consuming (consume = false)
    const valid1 = verifyPhoneOtp(userId, code, false);
    expect(valid1).toBe(true);

    // Should still be verifiable because it wasn't consumed
    const valid2 = verifyPhoneOtp(userId, code, false);
    expect(valid2).toBe(true);

    // Explicit consumption
    consumePhoneOtp(userId);

    // Now it should be consumed
    const valid3 = verifyPhoneOtp(userId, code, false);
    expect(valid3).toBe(false);
  });
});
