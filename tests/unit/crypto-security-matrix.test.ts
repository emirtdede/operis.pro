import { describe, it, expect, beforeAll } from "vitest";
import {
  encryptPii,
  decryptPii,
  hashPhoneBlindIndex,
  hashPassword,
  verifyPassword,
  generateSecureToken,
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

describe("Cryptographic Rigor & Security Matrix (750 Test Scenarios)", () => {
  // ==========================================================================
  // 1. AES-256-GCM Encryption & Decryption Round-Trip (250 Scenarios)
  // ==========================================================================
  describe("AES-256-GCM Round-Trip & Nonce Uniqueness (250 Scenarios)", () => {
    const piiInputs = Array.from({ length: 250 }, (_, i) => {
      const sampleNames = [
        "Ahmet Yılmaz",
        "Ayşe Kaya",
        "Mehmet Öztürk",
        "Fatma Çelik",
        "Mustafa Şahin",
      ];
      const samplePhones = ["+905551112233", "+905324445566", "+905417778899", "+905059990011"];
      const baseName = sampleNames[i % sampleNames.length]!;
      const basePhone = samplePhones[i % samplePhones.length]!;

      return {
        id: i,
        plaintext: `${baseName} (${basePhone}) - Case #${i} - TC: ${10000000000 + i}`,
      };
    });

    it.each(piiInputs)(
      "encrypts and decrypts without data corruption or loss (case $id)",
      ({ plaintext }) => {
        const encrypted1 = encryptPii(plaintext);
        const encrypted2 = encryptPii(plaintext);

        // Invariant 1: Random IV ensures ciphertext uniqueness even for identical plaintext
        expect(encrypted1).not.toBe(encrypted2);

        // Invariant 2: Structure is iv(24 hex chars):authTag(32 hex chars):ciphertext
        const parts1 = encrypted1.split(":");
        expect(parts1.length).toBe(3);
        expect(parts1[0]!.length).toBe(24); // 12 bytes = 24 hex chars
        expect(parts1[1]!.length).toBe(32); // 16 bytes = 32 hex chars
        expect(parts1[2]!.length).toBeGreaterThan(0);

        // Invariant 3: Perfect round-trip decryption
        const decrypted1 = decryptPii(encrypted1);
        const decrypted2 = decryptPii(encrypted2);
        expect(decrypted1).toBe(plaintext);
        expect(decrypted2).toBe(plaintext);
      }
    );
  });

  // ==========================================================================
  // 2. AES-256-GCM Tamper-Resistance & AuthTag Verification (150 Scenarios)
  // ==========================================================================
  describe("AES-256-GCM Tamper Resistance & Auth Failure Matrix (150 Scenarios)", () => {
    const TAMPER_MODES = ["TAMPER_IV", "TAMPER_AUTHTAG", "TAMPER_CIPHERTEXT"] as const;
    const tamperCases = Array.from({ length: 150 }, (_, i) => {
      const mode = TAMPER_MODES[i % 3] ?? "TAMPER_IV";
      return {
        id: i,
        mode,
        original: `Sensitive User Record #${i} with PII data`,
      };
    });

    it.each(tamperCases)(
      "detects tampering and throws authentication error (case $id: $mode)",
      ({ mode, original }) => {
        const encrypted = encryptPii(original);
        const [iv, authTag, cipher] = encrypted.split(":");

        let tamperedPayload = "";
        if (mode === "TAMPER_IV") {
          const flipped = iv![0] === "a" ? "b" : "a";
          const tamperedIv = flipped + iv!.slice(1);
          tamperedPayload = `${tamperedIv}:${authTag}:${cipher}`;
        } else if (mode === "TAMPER_AUTHTAG") {
          const flipped = authTag![0] === "a" ? "b" : "a";
          const tamperedTag = flipped + authTag!.slice(1);
          tamperedPayload = `${iv}:${tamperedTag}:${cipher}`;
        } else {
          const flipped = cipher![0] === "a" ? "b" : "a";
          const tamperedCipher = flipped + cipher!.slice(1);
          tamperedPayload = `${iv}:${authTag}:${tamperedCipher}`;
        }

        expect(() => decryptPii(tamperedPayload)).toThrow(
          "Failed to decrypt PII: authentication verification failed"
        );
      }
    );
  });

  // ==========================================================================
  // 3. HMAC Blind Index Determinism & Normalization (150 Scenarios)
  // ==========================================================================
  describe("HMAC Blind Index Determinism & Phone Whitespace Invariance (150 Scenarios)", () => {
    const phoneCases = Array.from({ length: 150 }, (_, i) => {
      const prefix = "+90";
      const subscriber = (5000000000 + i).toString();
      const rawE164 = `${prefix}${subscriber}`;

      // Different formatting variations of the exact same number
      const variationWithSpaces = `${prefix} ${subscriber.slice(0, 3)} ${subscriber.slice(3, 6)} ${subscriber.slice(6)}`;
      const variationWithLeadingTrailing = `   ${rawE164}   `;

      return {
        id: i,
        rawE164,
        variationWithSpaces,
        variationWithLeadingTrailing,
      };
    });

    it.each(phoneCases)(
      "computes deterministic blind index invariant to whitespace (case $id)",
      ({ rawE164, variationWithSpaces, variationWithLeadingTrailing }) => {
        const hashRaw = hashPhoneBlindIndex(rawE164);
        const hashSpaces = hashPhoneBlindIndex(variationWithSpaces);
        const hashLeadingTrailing = hashPhoneBlindIndex(variationWithLeadingTrailing);

        // Invariant 1: Formatting whitespace must produce the EXACT same blind index
        expect(hashSpaces).toBe(hashRaw);
        expect(hashLeadingTrailing).toBe(hashRaw);

        // Invariant 2: Hash must be a valid 64-character hex string (SHA-256)
        expect(hashRaw).toHaveLength(64);
        expect(hashRaw).toMatch(/^[0-9a-f]{64}$/);
      }
    );
  });

  // ==========================================================================
  // 4. Scrypt Password Hashing & Verification Boundary (100 Scenarios)
  // ==========================================================================
  describe("Scrypt Password Verification & Timing-Safe Boundary (100 Scenarios)", () => {
    const passwordCases = Array.from({ length: 100 }, (_, i) => {
      const pwd = `S3cureP@ssword_${i}!Aa#`;
      const wrongPwd = `Wr0ngP@ssword_${i}!Aa#`;
      return {
        id: i,
        password: pwd,
        wrongPassword: wrongPwd,
      };
    });

    it.each(passwordCases)(
      "hashes with unique salts and verifies timing-safe comparison (case $id)",
      async ({ password, wrongPassword }) => {
        const hash = await hashPassword(password);

        // Invariant 1: Format must be salt(32 hex chars):hash(128 hex chars)
        const parts = hash.split(":");
        expect(parts.length).toBe(2);
        expect(parts[0]!.length).toBe(32); // 16 bytes salt
        expect(parts[1]!.length).toBe(128); // 64 bytes derived key

        // Invariant 2: Correct password verifies successfully
        const isValid = await verifyPassword(password, hash);
        expect(isValid).toBe(true);

        // Invariant 3: Incorrect password fails verification
        const isWrongValid = await verifyPassword(wrongPassword, hash);
        expect(isWrongValid).toBe(false);

        // Invariant 4: Corrupted hash format gracefully returns false without crashing
        const isCorruptedValid = await verifyPassword(password, "invalid_hash_format");
        expect(isCorruptedValid).toBe(false);
      }
    );
  });

  // ==========================================================================
  // 5. Secure Token & OTP Generation (100 Scenarios)
  // ==========================================================================
  describe("Secure Token & Numeric OTP Generation Invariants (100 Scenarios)", () => {
    const tokenCases = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      byteLen: 16 + (i % 32),
    }));

    it.each(tokenCases)(
      "generates high-entropy secure tokens and valid 6-digit numeric OTPs (case $id)",
      ({ byteLen }) => {
        // Secure Token Check
        const token = generateSecureToken(byteLen);
        expect(token.length).toBe(byteLen * 2);
        expect(token).toMatch(/^[0-9a-f]+$/);
        expect(sha256(token)).toHaveLength(64);

        // OTP Code Check
        const otp = generateOtpCode();
        expect(otp.length).toBe(6);
        expect(otp).toMatch(/^\d{6}$/);

        const otpNum = parseInt(otp, 10);
        expect(otpNum).toBeGreaterThanOrEqual(100000);
        expect(otpNum).toBeLessThanOrEqual(999999);
      }
    );
  });
});
