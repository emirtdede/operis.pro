import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  char,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// 1. Users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 30 }).default("USER").notNull(), // USER, MODERATOR, ADMIN, SECURITY_ADMIN
  status: varchar("status", { length: 30 }).default("ACTIVE").notNull(), // ACTIVE, SUSPENDED, DELETED
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: varchar("two_factor_secret", { length: 255 }),
  twoFactorBackupCodes: text("two_factor_backup_codes")
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  authVersion: integer("auth_version").default(1).notNull(),
  emailEnc: text("email_enc"),
  emailHmac: varchar("email_hmac", { length: 64 }),
  clerkUserId: varchar("clerk_user_id", { length: 255 }).unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

// 2. User Private Identity (Encrypted PII + Blind Index)
export const userPrivateIdentity = pgTable("user_private_identity", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  legalFirstNameEnc: text("legal_first_name_enc").notNull(),
  legalLastNameEnc: text("legal_last_name_enc").notNull(),
  dateOfBirthEnc: text("date_of_birth_enc").notNull(),
  countryCode: char("country_code", { length: 2 }).notNull(),
  city: text("city").notNull(),
  phoneE164Enc: text("phone_e164_enc").notNull(),
  phoneHmac: text("phone_hmac").unique().notNull(), // Blind index for equality/uniqueness
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 22. Security Events
export const securityEvents = pgTable("security_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  riskMetadata: jsonb("risk_metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

// 27. OTP Challenges (Atomic and persistent phone verification - B12)
export const otpChallenges = pgTable(
  "otp_challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: varchar("purpose", { length: 40 }).notNull(),
    targetPhoneHmac: text("target_phone_hmac"),
    codeDigest: text("code_digest").notNull(),
    keyVersion: integer("key_version").default(1).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    supersededAt: timestamp("superseded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("otp_challenges_user_purpose_idx").on(table.userId, table.purpose),
    index("otp_challenges_expires_idx").on(table.expiresAt),
  ]
);
