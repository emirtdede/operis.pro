import { pgTable, uuid, text, integer, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const clerkRevocationJobs = pgTable(
  "clerk_revocation_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id").notNull(),
    authVersion: integer("auth_version").notNull(),
    preserveSessionId: text("preserve_session_id"),
    cutoff: timestamp("cutoff", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("PENDING"),
    attemptCount: integer("attempt_count").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
    leaseToken: uuid("lease_token"),
    leaseUntil: timestamp("lease_until", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("clerk_revocation_user_version_idx").on(t.userId, t.authVersion),
    index("clerk_revocation_due_idx").on(t.status, t.nextAttemptAt),
  ]
);

export const signatureStorageJobs = pgTable(
  "signature_storage_jobs",
  {
    key: text("key").primaryKey(),
    engagementId: uuid("engagement_id").notNull(),
    packageId: uuid("package_id"),
    packageVersion: integer("package_version"),
    status: text("status").notNull().default("UPLOADING"),
    attemptCount: integer("attempt_count").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
    leaseToken: uuid("lease_token"),
    leaseUntil: timestamp("lease_until", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("signature_storage_due_idx").on(t.status, t.nextAttemptAt)]
);
