export type TaxIdType = "VKN" | "TCKN";

export interface TaxIdValidationResult {
  isValid: boolean;
  type: TaxIdType | null;
  error?: string;
}

/**
 * Validates a 10-digit Turkish Corporate Tax Identification Number (Vergi Kimlik Numarası - VKN).
 * Uses the official Gelir İdaresi Başkanlığı (GİB) modular arithmetic checksum algorithm.
 *
 * Algorithm details:
 * For the first 9 digits (i = 0 to 8):
 *   v = (d_i + (9 - i)) % 10
 *   if v != 0:
 *     w = (v * 2^(9 - i)) % 9
 *     if w == 0: w = 9
 *   else:
 *     w = 0
 *   sum += w
 * checkDigit = (10 - (sum % 10)) % 10
 * Valid if checkDigit === d_9
 */
export function validateVKN(vkn: string): boolean {
  if (typeof vkn !== "string") return false;
  const clean = vkn.trim();
  if (!/^\d{10}$/.test(clean)) return false;

  // Reject all identical digits (e.g., 0000000000, 1111111111)
  if (/^(\d)\1{9}$/.test(clean)) return false;

  const digits = clean.split("").map(Number);
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    const digit = digits[i] ?? 0;
    const v = (digit + (9 - i)) % 10;
    let w = 0;
    if (v !== 0) {
      w = (v * Math.pow(2, 9 - i)) % 9;
      if (w === 0) w = 9;
    }
    sum += w;
  }

  const expectedCheckDigit = (10 - (sum % 10)) % 10;
  return expectedCheckDigit === digits[9];
}

/**
 * Validates an 11-digit Turkish National ID Number (T.C. Kimlik Numarası - TCKN).
 * Used by Sole Proprietorships (Şahıs İşletmeleri) as their official tax number.
 */
export function validateTCKN(tckn: string): boolean {
  if (typeof tckn !== "string") return false;
  const clean = tckn.trim();
  if (!/^\d{11}$/.test(clean)) return false;

  // First digit cannot be zero
  if (clean[0] === "0") return false;

  // Reject all identical digits (e.g., 11111111111)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  const digits = clean.split("").map(Number);

  // 10th digit formula: ((sum of odd digits 1,3,5,7,9 * 7) - (sum of even digits 2,4,6,8)) % 10
  const d0 = digits[0] ?? 0;
  const d1 = digits[1] ?? 0;
  const d2 = digits[2] ?? 0;
  const d3 = digits[3] ?? 0;
  const d4 = digits[4] ?? 0;
  const d5 = digits[5] ?? 0;
  const d6 = digits[6] ?? 0;
  const d7 = digits[7] ?? 0;
  const d8 = digits[8] ?? 0;
  const oddSum = d0 + d2 + d4 + d6 + d8;
  const evenSum = d1 + d3 + d5 + d7;
  const check10 = ((oddSum * 7) - evenSum) % 10;
  // Handle potential negative modulus in JS: (val % 10 + 10) % 10
  const normalizedCheck10 = (check10 % 10 + 10) % 10;

  if (normalizedCheck10 !== digits[9]) return false;

  // 11th digit formula: sum of first 10 digits % 10 === 11th digit
  let sum10 = 0;
  for (let i = 0; i < 10; i++) {
    sum10 += digits[i] ?? 0;
  }

  return (sum10 % 10) === digits[10];
}

/**
 * Unified Turkish Tax ID validator supporting both 10-digit VKN (Legal entities)
 * and 11-digit TCKN (Sole proprietors).
 */
export function validateTaxId(taxId: string): TaxIdValidationResult {
  if (!taxId || typeof taxId !== "string") {
    return { isValid: false, type: null, error: "Vergi Kimlik Numarası boş olamaz." };
  }

  const clean = taxId.replace(/[\s-]/g, "");

  if (clean.length === 10) {
    if (validateVKN(clean)) {
      return { isValid: true, type: "VKN" };
    }
    return {
      isValid: false,
      type: "VKN",
      error: "Girdiğiniz 10 haneli Vergi Kimlik Numarası (VKN) algoritması geçersizdir.",
    };
  }

  if (clean.length === 11) {
    if (validateTCKN(clean)) {
      return { isValid: true, type: "TCKN" };
    }
    return {
      isValid: false,
      type: "TCKN",
      error: "Girdiğiniz 11 haneli T.C. Kimlik / Şahıs Vergi Numarası algoritması geçersizdir.",
    };
  }

  return {
    isValid: false,
    type: null,
    error: "Vergi Kimlik Numarası 10 haneli (Kurumsal VKN) veya 11 haneli (Şahıs TCKN) olmalıdır.",
  };
}

/**
 * Masks a tax identification number for safe public display in compliance with KVKK / privacy rules.
 * e.g., "1234567890" -> "123***7890"
 * e.g., "12345678901" -> "123*****901"
 */
export function maskTaxId(taxId: string): string {
  const clean = (taxId || "").replace(/[\s-]/g, "");
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}***${clean.slice(6)}`;
  }
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}*****${clean.slice(8)}`;
  }
  return "***";
}

/**
 * Generates a deterministic HMAC-SHA256 blind index hash for duplicate tax ID prevention.
 * Enables unique indexing without storing or exposing plain text tax numbers.
 */
export function hashTaxId(taxId: string, pepper = "operis-vkn-blind-index-salt-2026"): string {
  const clean = (taxId || "").replace(/[\s-]/g, "");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeCrypto = require("crypto");
  return nodeCrypto.createHmac("sha256", pepper).update(clean, "utf8").digest("hex");
}

/**
 * Normalizes company title preserving Turkish specific casing rules (İ/i, I/ı).
 */
export function normalizeCompanyTitle(title: string): string {
  if (!title || typeof title !== "string") return "";
  let cleaned = title.trim().replace(/\s+/g, " ");

  // Standardize common legal entity suffixes case-insensitively
  cleaned = cleaned.replace(/(?:^|\s)(a\.s\.|a\.ş\.|aş|as|anonim\s+şirketi|anonim\s+sirketi)(?:\s|$)/gi, (match) =>
    match.replace(/a\.s\.|a\.ş\.|aş|as|anonim\s+şirketi|anonim\s+sirketi/i, "A.Ş.")
  );

  cleaned = cleaned.replace(/(?:^|\s)(ltd\.\s*şti\.|ltd\.\s*sti\.|ltd|limited\s+şirketi|limited\s+sirketi)(?:\s|$)/gi, (match) =>
    match.replace(/ltd\.\s*şti\.|ltd\.\s*sti\.|ltd|limited\s+şirketi|limited\s+sirketi/i, "Ltd. Şti.")
  );

  cleaned = cleaned.replace(/(?:^|\s)(tic\.\s*ltd\.\s*şti\.|tic\.\s*ltd\.\s*sti\.)(?:\s|$)/gi, (match) =>
    match.replace(/tic\.\s*ltd\.\s*şti\.|tic\.\s*ltd\.\s*sti\./i, "Tic. Ltd. Şti.")
  );

  return cleaned.trim();
}
