import { describe, it, expect, beforeAll } from "vitest";
import { registrationSchema, calculateAge } from "@/src/modules/auth/validation";
import { createSessionToken, verifySessionToken } from "@/src/modules/auth/session";

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

describe("Authentication & Registration Validation Rules", () => {
  const validBaseRegistration = {
    email: "emir@example.com",
    password: "SuperSecretPassword123!",
    confirmPassword: "SuperSecretPassword123!",
    legalFirstName: "Emir",
    legalLastName: "Dede",
    dateOfBirth: "2000-01-15",
    countryCode: "TR",
    city: "Istanbul",
    phone: "+905551234567",
    displayName: "Emir Dede",
    handle: "emir_dede",
    about: "Senior full stack software engineer.",
    focusCategoryKeys: ["web-development", "backend-api"],
    termsAccepted: true as const,
    privacyAcknowledged: true as const,
    matchingAcknowledged: true as const,
    ageConfirmed: true as const,
  };

  it("accepts valid registration input", () => {
    const result = registrationSchema.safeParse(validBaseRegistration);
    expect(result.success).toBe(true);
  });

  it("enforces 18+ age gate and rejects underage applicants", () => {
    // Current year is 2026; a user born in 2012 is 14 years old
    const underage = {
      ...validBaseRegistration,
      dateOfBirth: "2012-05-10",
    };
    const result = registrationSchema.safeParse(underage);
    expect(result.success).toBe(false);
  });

  it("correctly calculates age and rejects future dates", () => {
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 19);
    expect(calculateAge(eighteenYearsAgo)).toBe(19);

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 10);
    expect(calculateAge(futureDate)).toBe(-1);

    const futureRegistration = {
      ...validBaseRegistration,
      dateOfBirth: "2050-01-01",
    };
    expect(registrationSchema.safeParse(futureRegistration).success).toBe(false);
  });

  it("rejects password shorter than 12 characters", () => {
    const shortPassword = {
      ...validBaseRegistration,
      password: "Short123!",
      confirmPassword: "Short123!",
    };
    const result = registrationSchema.safeParse(shortPassword);
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const mismatched = {
      ...validBaseRegistration,
      confirmPassword: "DifferentPassword123!",
    };
    const result = registrationSchema.safeParse(mismatched);
    expect(result.success).toBe(false);
  });

  it("rejects reserved handles", () => {
    const reserved = {
      ...validBaseRegistration,
      handle: "admin",
    };
    const result = registrationSchema.safeParse(reserved);
    expect(result.success).toBe(false);
  });

  it("rejects emojis in name, handle, or about", () => {
    const withEmojiInName = {
      ...validBaseRegistration,
      displayName: "Emir Dede 🚀",
    };
    expect(registrationSchema.safeParse(withEmojiInName).success).toBe(false);

    const withEmojiInAbout = {
      ...validBaseRegistration,
      about: "Building great apps! 👍",
    };
    expect(registrationSchema.safeParse(withEmojiInAbout).success).toBe(false);
  });

  it("fails if any required legal acknowledgement checkbox is not accepted", () => {
    const missingTerms = {
      ...validBaseRegistration,
      termsAccepted: false,
    };
    expect(registrationSchema.safeParse(missingTerms).success).toBe(false);

    const missingMatching = {
      ...validBaseRegistration,
      matchingAcknowledged: false,
    };
    expect(registrationSchema.safeParse(missingMatching).success).toBe(false);
  });

  describe("Session Tokens", () => {
    it("signs and verifies session tokens correctly", () => {
      const user = {
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        email: "user@example.com",
        role: "USER",
        status: "ACTIVE",
      };
      const token = createSessionToken(user);
      const session = verifySessionToken(token);

      expect(session).not.toBeNull();
      expect(session?.userId).toBe(user.id);
      expect(session?.email).toBe(user.email);
    });

    it("rejects tampered session tokens", () => {
      const user = {
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        email: "user@example.com",
        role: "USER",
        status: "ACTIVE",
      };
      const token = createSessionToken(user);
      const parts = token.split(".");
      const tampered = `${parts[0]}tampered.${parts[1]}`;

      expect(verifySessionToken(tampered)).toBeNull();
    });
  });
});
