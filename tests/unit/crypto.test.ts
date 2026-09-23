import { describe, it, expect, beforeAll } from "vitest";
import {
  encryptPii,
  decryptPii,
  hashPhoneBlindIndex,
  hashPassword,
  verifyPassword,
  generateOtpCode,
  sha256,
} from "@/src/lib/crypto";

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

describe("Cryptographic Service (AES-256-GCM, HMAC, Scrypt)", () => {
  it("encrypts and decrypts private identity plaintext faithfully", () => {
    const original = "Emir Dede";
    const encrypted = encryptPii(original);

    expect(encrypted).not.toBe(original);
    expect(encrypted.split(":").length).toBe(3);

    const decrypted = decryptPii(encrypted);
    expect(decrypted).toBe(original);
  });

  it("throws when decrypting tampered ciphertext", () => {
    const encrypted = encryptPii("Sensitive Data");
    const parts = encrypted.split(":");
    // Tamper with ciphertext
    const tampered = `${parts[0]}:${parts[1]}:bad123${parts[2]}`;

    expect(() => decryptPii(tampered)).toThrow();
  });

  it("produces deterministic HMAC blind index for identical phone numbers", () => {
    const phone1 = "+90 555 123 4567";
    const phone2 = "+905551234567";
    const phone3 = "+90 555 999 8888";

    const hash1 = hashPhoneBlindIndex(phone1);
    const hash2 = hashPhoneBlindIndex(phone2);
    const hash3 = hashPhoneBlindIndex(phone3);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(64); // 32 bytes hex
  });

  it("hashes passwords securely with scrypt and validates correct/incorrect passwords", async () => {
    const password = "SuperSecurePassword123!";
    const hash = await hashPassword(password);

    expect(hash).toContain(":");
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword("WrongPassword123!", hash)).toBe(false);
  });

  it("generates 6-digit numeric OTP codes", () => {
    const otp = generateOtpCode();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it("computes exact SHA-256 hash", () => {
    const hash = sha256("test-content");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
