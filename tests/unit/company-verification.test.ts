import { describe, it, expect } from "vitest";
import {
  validateVKN,
  validateTCKN,
  validateTaxId,
  maskTaxId,
  hashTaxId,
  normalizeCompanyTitle,
} from "@/src/modules/companies/vkn-validator";

describe("Corporate Tax ID & VKN Verification Engine", () => {
  describe("10-Digit VKN (Vergi Kimlik Numarası) Validation", () => {
    it("validates mathematically correct 10-digit VKNs", () => {
      // 1234567890 has all v === 0, resulting in check digit 0
      expect(validateVKN("1234567890")).toBe(true);

      // Known corporate VKN examples
      // e.g. Garanti BBVA VKN: 8790017566
      // e.g. İş Bankası VKN: 4810058590
      expect(validateVKN("8790017566")).toBe(true);
      expect(validateVKN("4810058590")).toBe(true);
    });

    it("rejects invalid 10-digit numbers with wrong checksums", () => {
      expect(validateVKN("1234567891")).toBe(false);
      expect(validateVKN("8790017567")).toBe(false);
      expect(validateVKN("4810058599")).toBe(false);
    });

    it("rejects all-identical digit strings", () => {
      expect(validateVKN("0000000000")).toBe(false);
      expect(validateVKN("1111111111")).toBe(false);
      expect(validateVKN("9999999999")).toBe(false);
    });

    it("rejects non-numeric, too short, or too long strings", () => {
      expect(validateVKN("123456789")).toBe(false); // 9 digits
      expect(validateVKN("12345678901")).toBe(false); // 11 digits
      expect(validateVKN("12345abc90")).toBe(false);
      expect(validateVKN("")).toBe(false);
    });
  });

  describe("11-Digit TCKN (Şahıs Şirketleri) Validation", () => {
    it("validates mathematically correct 11-digit TCKNs", () => {
      // Test with algorithmic TCKN
      // Let's verify a known valid TCKN pattern
      expect(validateTCKN("10000000146")).toBe(true);
    });

    it("rejects TCKN starting with 0 or with incorrect check digits", () => {
      expect(validateTCKN("01234567890")).toBe(false);
      expect(validateTCKN("10000000147")).toBe(false);
      expect(validateTCKN("11111111111")).toBe(false);
    });
  });

  describe("Unified validateTaxId", () => {
    it("correctly identifies VKN and returns valid status", () => {
      const result = validateTaxId("8790017566");
      expect(result.isValid).toBe(true);
      expect(result.type).toBe("VKN");
      expect(result.error).toBeUndefined();
    });

    it("correctly identifies TCKN and returns valid status", () => {
      const result = validateTaxId("10000000146");
      expect(result.isValid).toBe(true);
      expect(result.type).toBe("TCKN");
    });

    it("returns descriptive error for invalid length", () => {
      const result = validateTaxId("12345");
      expect(result.isValid).toBe(false);
      expect(result.type).toBeNull();
      expect(result.error).toContain("10 haneli");
    });

    it("returns descriptive error for invalid checksum", () => {
      const result = validateTaxId("8790017561");
      expect(result.isValid).toBe(false);
      expect(result.type).toBe("VKN");
      expect(result.error).toContain("geçersizdir");
    });
  });

  describe("Tax ID Masking (KVKK Compliance)", () => {
    it("masks 10-digit VKN to 123***7890", () => {
      expect(maskTaxId("8790017566")).toBe("879***7566");
      expect(maskTaxId("1234567890")).toBe("123***7890");
    });

    it("masks 11-digit TCKN to 123*****901", () => {
      expect(maskTaxId("10000000146")).toBe("100*****146");
    });
  });

  describe("Deterministic Blind Index Hashing (HMAC-SHA256)", () => {
    it("produces deterministic 64-char hex hash preventing duplicate VKN registrations", () => {
      const hash1 = hashTaxId("8790017566");
      const hash2 = hashTaxId("8790017566");
      const hashOther = hashTaxId("1234567890");

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hashOther);
    });

    it("ignores spaces and dashes during hashing", () => {
      const hashClean = hashTaxId("8790017566");
      const hashFormatted = hashTaxId("879-001-7566");

      expect(hashFormatted).toBe(hashClean);
    });
  });

  describe("Company Legal Title Normalization", () => {
    it("standardizes legal entity suffixes", () => {
      expect(normalizeCompanyTitle("Acme Yazılım a.ş.")).toBe("Acme Yazılım A.Ş.");
      expect(normalizeCompanyTitle("Tekno Bilişim Ltd. Şti.")).toBe("Tekno Bilişim Ltd. Şti.");
      expect(normalizeCompanyTitle("Global Danışmanlık Anonim Şirketi")).toBe(
        "Global Danışmanlık A.Ş."
      );
      expect(normalizeCompanyTitle("Innova Teknoloji limited sirketi")).toBe(
        "Innova Teknoloji Ltd. Şti."
      );
    });
  });
});
