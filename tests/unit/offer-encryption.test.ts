import { describe, it, expect } from "vitest";
import { encryptOfferMessage, decryptOfferMessage } from "@/src/modules/offers/crypto";

describe("Offer Encryption & Decryption Suite (Envelope v2 AES-256-GCM)", () => {
  const testOfferId = "00000000-0000-4000-a000-000000000001";
  const otherOfferId = "00000000-0000-4000-a000-000000000002";
  const sampleProposal = "Merhaba, projenizi Next.js 16 ve PostgreSQL mimarisinde 2 hafta içinde teslim edebilirim.";

  it("encrypts plaintext proposal message to Envelope v2 format", () => {
    const encrypted = encryptOfferMessage(sampleProposal, testOfferId);

    expect(encrypted).not.toBe(sampleProposal);
    expect(encrypted.startsWith("v2:")).toBe(true);
    const parts = encrypted.split(":");
    expect(parts.length).toBe(5); // v2:keyId:iv:authTag:ciphertext
  });

  it("round-trip decrypts encrypted proposal message successfully", () => {
    const encrypted = encryptOfferMessage(sampleProposal, testOfferId);
    const decrypted = decryptOfferMessage(encrypted, testOfferId);

    expect(decrypted).toBe(sampleProposal);
  });

  it("backward-compatibility: returns legacy plaintext message unmodified", () => {
    const legacyPlaintext = "Bu eski bir teklif metnidir, şifrelenmeden önce yazılmıştır.";
    const result = decryptOfferMessage(legacyPlaintext, testOfferId);

    expect(result).toBe(legacyPlaintext);
  });

  it("gracefully handles null or empty inputs", () => {
    expect(encryptOfferMessage("", testOfferId)).toBe("");
    expect(decryptOfferMessage("", testOfferId)).toBe("");
    expect(decryptOfferMessage(null, testOfferId)).toBe("");
    expect(decryptOfferMessage(undefined, testOfferId)).toBe("");
  });

  it("AAD tamper-resistance: throws when decrypting with mismatched offer ID", () => {
    const encrypted = encryptOfferMessage(sampleProposal, testOfferId);

    // Mismatched primaryKey in AAD context must fail authentication verification
    expect(() => decryptOfferMessage(encrypted, otherOfferId)).toThrow();
  });
});
