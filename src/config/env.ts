import { z } from "zod";

const hexKeySchema = z
  .string()
  .length(64, "Key must be exactly 64 hex characters (32 bytes)")
  .regex(/^[0-9a-fA-F]{64}$/, "Key must be valid 64-character hexadecimal");

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url(),
  PRODUCT_NAME: z.string().min(1).default("Operis"),

  DATABASE_URL: z.string().min(1),
  DATABASE_MIGRATION_URL: z.string().optional(),
  DATABASE_SSL_REJECT_UNAUTHORIZED: z.enum(["true", "false"]).optional(),
  DATABASE_SSL_CA: z.string().optional(),

  AUTH_SECRET: z.string().min(32, "Auth secret must be at least 32 characters"),
  AUTH_URL: z.string().url().optional(),

  PII_ENCRYPTION_KEY_CURRENT: hexKeySchema,
  PII_ENCRYPTION_KEY_PREVIOUS: hexKeySchema.optional().or(z.literal("")),
  PII_KEYRING_JSON: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const parsed = JSON.parse(val);
          if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return false;
          for (const [k, v] of Object.entries(parsed)) {
            if (!/^[a-zA-Z0-9_-]{1,32}$/.test(k)) return false;
            if (typeof v !== "string" || !/^[0-9a-fA-F]{64}$/.test(v)) return false;
          }
          return true;
        } catch {
          return false;
        }
      },
      { message: "PII_KEYRING_JSON must be valid JSON mapping keyId (1-32 chars) to 64-hex key" }
    ),
  PII_CURRENT_KEY_ID: z
    .string()
    .regex(
      /^[a-zA-Z0-9_-]{1,32}$/,
      "PII_CURRENT_KEY_ID must be 1-32 alphanumeric/underscore/dash chars"
    )
    .default("k1"),
  PII_HMAC_KEY: hexKeySchema,

  EMAIL_PROVIDER: z.enum(["mock", "resend", "smtp"]).default("mock"),
  EMAIL_FROM: z.string().email().default("noreply@operis.pro"),
  EMAIL_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),

  SMS_PROVIDER: z.enum(["mock", "twilio", "netgsm"]).default("mock"),
  SMS_API_KEY: z.string().optional(),
  NETGSM_USERCODE: z.string().optional(),
  NETGSM_PASSWORD: z.string().optional(),
  NETGSM_HEADER: z.string().optional(),

  OBSERVABILITY_PII_REDACTION: z
    .string()
    .transform((val) => val === "true" || val === "1")
    .default("true"),

  FEATURE_IDENTITY_VERIFICATION: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  FEATURE_MARKETING_EMAIL: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  FEATURE_PUBLIC_OFFER_COUNT: z
    .string()
    .transform((val) => val === "true")
    .default("false"),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),

  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().optional(),

  // Analytics (PostHog)
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional().default("https://eu.i.posthog.com"),

  // Cloudflare Turnstile Bot Shield
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),

  // Cloudflare R2 Object Storage (10 GB Free, $0 Egress)
  CLOUDFLARE_R2_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().optional(),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_R2_BUCKET_NAME: z.string().optional(),
  NEXT_PUBLIC_R2_PUBLIC_URL: z.string().optional(),

  // Error Tracking (Sentry)
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Serverless Redis & Rate Limiting (Upstash)
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Serverless Background Workflows & Queues (Inngest)
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  // Legal operator fields
  LEGAL_ENTITY_NAME: z.string().min(1),
  LEGAL_ENTITY_TYPE: z.string().min(1),
  LEGAL_ADDRESS: z.string().min(1),
  LEGAL_SUPPORT_EMAIL: z.string().email(),
  LEGAL_PRIVACY_EMAIL: z.string().email(),
  LEGAL_PHONE: z.string().min(1),
  MERSIS_NO: z.string().optional(),
  TAX_NO: z.string().optional(),
  KEP_ADDRESS: z.string().optional(),
  TERMS_EFFECTIVE_DATE: z.string().min(1),
  PRIVACY_EFFECTIVE_DATE: z.string().min(1),
  LEGAL_ETBIS_CLASSIFICATION_APPROVED: z
    .string()
    .transform((val) => val === "true")
    .refine((val) => process.env.NODE_ENV !== "production" || val === true, {
      message: "LEGAL_ETBIS_CLASSIFICATION_APPROVED must be true before production launch",
    }),
  LEGAL_PRIVACY_REVIEW_APPROVED: z
    .string()
    .transform((val) => val === "true")
    .refine((val) => process.env.NODE_ENV !== "production" || val === true, {
      message: "LEGAL_PRIVACY_REVIEW_APPROVED must be true before production launch",
    }),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env | null = null;

export function getEnv(): Env {
  if (parsedEnv) return parsedEnv;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formattedErrors = result.error.format();
    console.error(
      "Critical: Invalid environment configuration:",
      JSON.stringify(formattedErrors, null, 2)
    );
    throw new Error(
      `Invalid environment configuration: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`
    );
  }

  parsedEnv = result.data;
  return parsedEnv;
}
