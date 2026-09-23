import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
  char,
  check,
  bigint,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

// 16. User Blocks
export const blocks = pgTable(
  "blocks",
  {
    blockerUserId: uuid("blocker_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedUserId: uuid("blocked_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.blockerUserId, table.blockedUserId] })]
);

// 17. Reports (Abuse & Moderation)
export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  reporterUserId: uuid("reporter_user_id")
    .notNull()
    .references(() => users.id),
  targetType: varchar("target_type", { length: 30 }).notNull(), // listing, profile, offer
  targetId: uuid("target_id").notNull(),
  reasonCode: varchar("reason_code", { length: 50 }).notNull(),
  details: text("details"),
  status: varchar("status", { length: 30 }).default("OPEN").notNull(), // OPEN, REVIEWING, RESOLVED, DISMISSED
  assignedAdminId: uuid("assigned_admin_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

// 20. Legal Documents (Versioned metadata & hash)
/**
 * @reserved @dormant
 * Currently, legal terms and privacy policies are maintained via localized static markdown/JSON resources.
 * User acceptances are tracked in `legalAcceptances`. This table is reserved for future dynamic legal versioning and publishing.
 */
export const legalDocuments = pgTable("legal_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentKey: varchar("document_key", { length: 50 }).notNull(),
  locale: varchar("locale", { length: 5 }).notNull(),
  version: varchar("version", { length: 20 }).notNull(),
  contentHash: varchar("content_hash", { length: 64 }).notNull(),
  effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
  isCurrent: boolean("is_current").default(true).notNull(),
});

// 21. Legal Acceptances (Immutable consent audit log)
export const legalAcceptances = pgTable("legal_acceptances", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  documentKey: varchar("document_key", { length: 50 }).notNull(),
  documentVersion: varchar("version", { length: 20 }).notNull(),
  contentHash: varchar("content_hash", { length: 64 }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }).defaultNow().notNull(),
});

// 23. Admin Audit Log (Append-only)
export const adminAuditLog = pgTable("admin_audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminUserId: uuid("admin_user_id")
    .notNull()
    .references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(),
  targetId: uuid("target_id").notNull(),
  reasonCode: varchar("reason_code", { length: 50 }).notNull(),
  safeSummary: text("safe_summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 25. Idempotency Keys (Atomic deduplication for operations like batch submissions - B12)
export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    key: varchar("key", { length: 255 }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 60 }).notNull(),
    responseJson: jsonb("response_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("idempotency_keys_user_action_idx").on(table.userId, table.action)]
);

// 28. IP Blocks (Persistent centralized IP blocklist - B18)
export const ipBlocks = pgTable(
  "ip_blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ip: varchar("ip", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    reason: varchar("reason", { length: 255 }),
    actorId: uuid("actor_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ip_blocks_ip_idx").on(table.ip),
    index("ip_blocks_revoked_expires_idx").on(table.revokedAt, table.expiresAt),
  ]
);

// 29. Rate Limits (Persistent centralized rate limit buckets - B12)
export const rateLimits = pgTable(
  "rate_limits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    purpose: varchar("purpose", { length: 60 }).notNull(),
    subjectDigest: text("subject_digest").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").default(1).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("rate_limits_purpose_subject_window_idx").on(
      table.purpose,
      table.subjectDigest,
      table.windowStart
    ),
    index("rate_limits_expires_idx").on(table.expiresAt),
  ]
);

// 30. Export Jobs (Persistent privacy data export jobs with checksum & expiration - B26)
export const exportJobs = pgTable(
  "export_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 30 }).default("PENDING").notNull(), // PENDING, PROCESSING, READY, FAILED, EXPIRED
    formatVersion: integer("format_version").default(2).notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).defaultNow().notNull(),
    leaseToken: uuid("lease_token"),
    leaseUntil: timestamp("lease_until", { withTimezone: true }),
    lastProgressAt: timestamp("last_progress_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    snapshotStartedAt: timestamp("snapshot_started_at", { withTimezone: true }),
    progress: integer("progress").default(0).notNull(),
    manifestJson: jsonb("manifest_json"),
    fileContent: text("file_content"),
    checksumSha256: varchar("checksum_sha256", { length: 64 }),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
    errorCode: varchar("error_code", { length: 64 }),
    resultAttempt: integer("result_attempt"),
    partCount: integer("part_count"),
    errorMessage: text("error_message"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("export_jobs_user_status_created_idx").on(table.userId, table.status, table.createdAt),
    index("export_jobs_status_next_attempt_idx").on(table.status, table.nextAttemptAt),
    uniqueIndex("export_jobs_one_active_user_idx")
      .on(table.userId)
      .where(sql`status IN ('PENDING', 'PROCESSING')`),
  ]
);

// 31. Export Job Parts (Encrypted 1MiB payload parts - B26)
export const exportJobParts = pgTable(
  "export_job_parts",
  {
    jobId: uuid("job_id")
      .notNull()
      .references(() => exportJobs.id, { onDelete: "cascade" }),
    attemptNo: integer("attempt_no").notNull(),
    partNo: integer("part_no").notNull(),
    payloadEnc: text("payload_enc").notNull(),
    plaintextSha256: char("plaintext_sha256", { length: 64 }).notNull(),
    byteLength: integer("byte_length").notNull(),
  },
  (table) => [primaryKey({ columns: [table.jobId, table.attemptNo, table.partNo] })]
);

// 32. Maintenance Identity (Singleton table for deployment tracking - B26/K01)
export const maintenanceIdentity = pgTable(
  "maintenance_identity",
  {
    isSingleton: boolean("is_singleton").default(true).primaryKey(),
    deploymentId: uuid("deployment_id").defaultRandom().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (_table) => [check("maintenance_identity_singleton_check", sql`is_singleton = true`)]
);
