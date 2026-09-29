import { describe, expect, it } from "vitest";
import { envSchema } from "@/src/config/env";

const productionEnv = {
  NODE_ENV: "production",
  APP_URL: "https://operis.pro",
  NEXT_PUBLIC_APP_URL: "https://operis.pro",
  AUTH_URL: "https://operis.pro",
  PRODUCT_NAME: "Operis",
  DATABASE_URL: "postgresql://runtime@example.invalid/operis",
  AUTH_SECRET: "a".repeat(64),
  PII_ENCRYPTION_KEY_CURRENT: "b".repeat(64),
  PII_HMAC_KEY: "c".repeat(64),
  LEGAL_ENTITY_NAME: "Operis",
  LEGAL_ENTITY_TYPE: "Company",
  LEGAL_ADDRESS: "Istanbul",
  LEGAL_SUPPORT_EMAIL: "support@operis.pro",
  LEGAL_PRIVACY_EMAIL: "privacy@operis.pro",
  LEGAL_PHONE: "+90 212 000 0000",
  TERMS_EFFECTIVE_DATE: "2026-09-29",
  PRIVACY_EFFECTIVE_DATE: "2026-09-29",
  LEGAL_ETBIS_CLASSIFICATION_APPROVED: "true",
  LEGAL_PRIVACY_REVIEW_APPROVED: "true",
};

describe("production environment contract", () => {
  it("accepts one canonical HTTPS origin", () => {
    expect(envSchema.safeParse(productionEnv).success).toBe(true);
  });

  it.each([
    { APP_URL: "http://operis.pro" },
    { AUTH_URL: "https://auth.operis.pro" },
    { NEXT_PUBLIC_APP_URL: "https://preview.operis.pro" },
    { ENABLE_DEMO_LOGIN: "true" },
    { ALLOW_DEMO_CREDENTIALS: "true" },
    { VITEST: "true" },
  ])("rejects unsafe production overrides: %o", (override) => {
    expect(envSchema.safeParse({ ...productionEnv, ...override }).success).toBe(false);
  });
});
