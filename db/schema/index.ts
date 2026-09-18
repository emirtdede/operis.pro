import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  numeric,
  date,
  jsonb,
  smallint,
  primaryKey,
  uniqueIndex,
  index,
  char,
  check,
  bigint,
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

// 3. Profiles
export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  handle: varchar("handle", { length: 30 }).unique().notNull(),
  displayName: varchar("display_name", { length: 80 }).notNull(),
  about: varchar("about", { length: 1000 }),
  avatarUrl: text("avatar_url"),
  showLocation: boolean("show_location").default(false).notNull(),
  revealPhoneAfterMatch: boolean("reveal_phone_after_match").default(false).notNull(),
  locale: varchar("locale", { length: 5 }).default("tr").notNull(),
  theme: varchar("theme", { length: 10 }).default("light").notNull(),
  preferredContactChannel: varchar("preferred_contact_channel", { length: 30 }).default("any"),
  timeZone: varchar("time_zone", { length: 60 }).default("Europe/Istanbul"),
  trackedSkills: text("tracked_skills")
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. Profile Links (Max 10 per profile)
export const profileLinks = pgTable(
  "profile_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 40 }).notNull(),
    label: varchar("label", { length: 40 }).notNull(),
    url: text("url").notNull(),
    sortOrder: smallint("sort_order").notNull(),
  },
  (table) => [uniqueIndex("profile_links_user_sort_idx").on(table.userId, table.sortOrder)]
);

// 5. Categories
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 80 }).unique().notNull(), // immutable key
  parentId: uuid("parent_id"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 6. Category Translations
export const categoryTranslations = pgTable(
  "category_translations",
  {
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    locale: varchar("locale", { length: 5 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
  },
  (table) => [primaryKey({ columns: [table.categoryId, table.locale] })]
);

// 7. Category Follows (Private to user)
export const categoryFollows = pgTable(
  "category_follows",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.categoryId] })]
);

// 8. Listing Templates (Wizard Schemas)
/**
 * @reserved @dormant
 * Currently, listing creation wizard schemas are defined statically in `src/modules/listings/wizard.ts`.
 * This table is retained in the schema for backward compatibility and planned future CMS/dynamic form builder support.
 */
export const listingTemplates = pgTable("listing_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  schemaVersion: integer("schema_version").default(1).notNull(),
  locale: varchar("locale", { length: 5 }).notNull(),
  schemaJson: jsonb("schema_json").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 9. Listings
export const listings = pgTable(
  "listings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").unique().notNull(),
    status: varchar("status", { length: 30 }).default("DRAFT").notNull(),
    // DRAFT, ACTIVE, INACTIVE_EXPIRED, INACTIVE_OWNER, MATCHED, COMPLETED, CANCELLED_MATCH, DELETED, HIDDEN_MODERATION
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    templateSchemaVersion: integer("template_schema_version").default(1).notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    summary: varchar("summary", { length: 280 }).notNull(),
    scope: text("scope").notNull(),
    answersJson: jsonb("answers_json").default({}).notNull(),
    tags: text("tags")
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    budgetMode: varchar("budget_mode", { length: 30 }).notNull(),
    budgetCurrency: char("budget_currency", { length: 3 }),
    budgetMin: numeric("budget_min", { precision: 18, scale: 2 }),
    budgetMax: numeric("budget_max", { precision: 18, scale: 2 }),
    timelineMode: varchar("timeline_mode", { length: 30 }).notNull(),
    targetDate: date("target_date"),
    timelineValue: integer("timeline_value"),
    timelineUnit: varchar("timeline_unit", { length: 20 }),
    activationSeq: integer("activation_seq").default(0).notNull(),
    viewCount: integer("view_count").default(0).notNull(),
    clickCount: integer("click_count").default(0).notNull(),
    firstPublishedAt: timestamp("first_published_at", { withTimezone: true }),
    lastActivatedAt: timestamp("last_activated_at", { withTimezone: true }),
    activeUntil: timestamp("active_until", { withTimezone: true }),
    matchedAt: timestamp("matched_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("listings_feed_idx").on(table.status, table.lastActivatedAt, table.id),
    index("listings_category_feed_idx").on(table.categoryId, table.status, table.lastActivatedAt),
    index("listings_owner_status_idx").on(table.ownerUserId, table.status),
    index("listings_search_multi_idx").on(table.status, table.title),
    check(
      "listings_budget_integrity_chk",
      sql`status = 'DRAFT' OR (budget_mode IN ('EXACT', 'FIXED_EXACT', 'HOURLY_EXACT') AND budget_min IS NOT NULL AND budget_max IS NOT NULL AND budget_min = budget_max AND budget_min > 0 AND budget_currency IS NOT NULL) OR (budget_mode IN ('RANGE', 'FIXED_RANGE', 'HOURLY_RANGE') AND budget_min IS NOT NULL AND budget_max IS NOT NULL AND budget_min > 0 AND budget_max >= budget_min AND budget_currency IS NOT NULL) OR (budget_mode IN ('OPEN_BID', 'NEGOTIABLE', 'REQUEST_GUIDANCE') AND (budget_min IS NULL OR budget_min > 0) AND (budget_max IS NULL OR budget_max > 0) AND (budget_min IS NULL OR budget_max IS NULL OR budget_max >= budget_min))`
    ),
  ]
);

// 10. Listing Revisions
export const listingRevisions = pgTable(
  "listing_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    editorUserId: uuid("editor_user_id")
      .notNull()
      .references(() => users.id),
    revisionNo: integer("revision_no").notNull(),
    snapshotJson: jsonb("snapshot_json").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("listing_revisions_uniq_idx").on(table.listingId, table.revisionNo)]
);

// 11. Listing Status Events
export const listingStatusEvents = pgTable("listing_status_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  fromStatus: varchar("from_status", { length: 30 }).notNull(),
  toStatus: varchar("to_status", { length: 30 }).notNull(),
  reason: text("reason"),
  actorType: varchar("actor_type", { length: 20 }).notNull(), // USER, SYSTEM, ADMIN
  actorId: uuid("actor_id"),
  activationSeq: integer("activation_seq").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 12. Offers
export const offers = pgTable(
  "offers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    offerorUserId: uuid("offeror_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingActivationSeq: integer("listing_activation_seq").notNull(),
    status: varchar("status", { length: 30 }).default("PENDING").notNull(),
    // PENDING, ACCEPTED, REJECTED, REJECTED_OTHER_SELECTED, WITHDRAWN, EXPIRED_LISTING, VOID_MODERATION, CANCELLED_ENGAGEMENT
    message: text("message").notNull(),
    budgetCurrency: char("budget_currency", { length: 3 }),
    budgetMin: numeric("budget_min", { precision: 18, scale: 2 }),
    budgetMax: numeric("budget_max", { precision: 18, scale: 2 }),
    estimatedDurationValue: integer("estimated_duration_value"),
    estimatedDurationUnit: varchar("estimated_duration_unit", { length: 20 }),
    rejectionCode: varchar("rejection_code", { length: 50 }),
    rejectionNote: text("rejection_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    // Invariant: Max 1 PENDING offer per user for a specific listing
    uniqueIndex("offers_pending_unique_idx")
      .on(table.listingId, table.offerorUserId)
      .where(sql`status = 'PENDING'`),
    // Invariant: Exactly 1 ACCEPTED offer per listing
    uniqueIndex("offers_accepted_unique_idx")
      .on(table.listingId)
      .where(sql`status = 'ACCEPTED'`),
    index("offers_sent_idx").on(table.offerorUserId, table.status),
    index("offers_received_idx").on(table.listingId, table.status),
  ]
);

// 13. Offer Revisions
export const offerRevisions = pgTable(
  "offer_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    revisionNo: integer("revision_no").notNull(),
    snapshotJson: jsonb("snapshot_json").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("offer_revisions_uniq_idx").on(table.offerId, table.revisionNo)]
);

// 13b. Offer Templates
export const offerTemplates = pgTable(
  "offer_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    message: text("message").notNull(),
    budgetCurrency: char("budget_currency", { length: 3 }),
    budgetMin: numeric("budget_min", { precision: 18, scale: 2 }),
    budgetMax: numeric("budget_max", { precision: 18, scale: 2 }),
    estimatedDurationValue: integer("estimated_duration_value"),
    estimatedDurationUnit: varchar("estimated_duration_unit", { length: 20 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("offer_templates_user_idx").on(table.userId)]
);

// 14. Engagements (Matches)
export const engagements = pgTable(
  "engagements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id),
    acceptedOfferId: uuid("accepted_offer_id")
      .notNull()
      .references(() => offers.id),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id),
    freelancerUserId: uuid("freelancer_user_id")
      .notNull()
      .references(() => users.id),
    status: varchar("status", { length: 30 }).default("MATCHED").notNull(),
    // MATCHED, COMPLETION_PENDING, COMPLETED, CANCELLED
    matchedAt: timestamp("matched_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    listingTitleSnapshot: varchar("listing_title_snapshot", { length: 120 }).notNull(),
    listingCategorySnapshot: varchar("listing_category_snapshot", { length: 80 }).notNull(),
  },
  (table) => [
    uniqueIndex("engagements_active_listing_idx")
      .on(table.listingId)
      .where(sql`${table.status} != 'CANCELLED'`),
    uniqueIndex("engagements_active_accepted_offer_idx")
      .on(table.acceptedOfferId)
      .where(sql`${table.status} != 'CANCELLED'`),
  ]
);

// 15. Engagement Completion Marks (Bilateral mutual confirmation)
export const engagementCompletionMarks = pgTable(
  "engagement_completion_marks",
  {
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    status: varchar("status", { length: 30 }).notNull(), // MARKED_COMPLETE, DISPUTES_COMPLETION
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.engagementId, table.userId] })]
);

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

// 18. Notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  payloadJson: jsonb("payload_json").notNull(),
  deliveryKey: varchar("delivery_key", { length: 191 }).unique(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 19. Outbox Events (Idempotent transactional notification outbox)
export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: varchar("type", { length: 50 }).notNull(),
    aggregateType: varchar("aggregate_type", { length: 50 }).notNull(),
    aggregateId: uuid("aggregate_id").notNull(),
    payloadJson: jsonb("payload_json").notNull(),
    status: varchar("status", { length: 30 }).default("PENDING").notNull(), // PENDING, PROCESSING, SENT, FAILED, DEAD
    attemptCount: integer("attempt_count").default(0).notNull(),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).defaultNow().notNull(),
    leaseToken: uuid("lease_token"),
    leaseUntil: timestamp("lease_until", { withTimezone: true }),
    deliveryKey: varchar("delivery_key", { length: 191 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("outbox_delivery_key_unique_idx").on(table.deliveryKey)]
);

// 19b. Notification Fanout Progress (Persistent cursor for radar & category fan-out - B16)
export const notificationFanoutProgress = pgTable("notification_fanout_progress", {
  eventId: uuid("event_id")
    .primaryKey()
    .references(() => outboxEvents.id, { onDelete: "cascade" }),
  phase: varchar("phase", { length: 16 }).notNull(), // 'RADAR' | 'CATEGORY' | 'DONE'
  lastUserId: uuid("last_user_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
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

// 24. Endorsements (Bilateral 1-paragraph verified vouches upon completion)
export const endorsements = pgTable(
  "endorsements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id),
    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => users.id),
    content: varchar("content", { length: 500 }).notNull(),
    projectTitleSnapshot: varchar("project_title_snapshot", { length: 120 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("endorsements_engagement_author_idx").on(table.engagementId, table.authorUserId),
    index("endorsements_recipient_idx").on(table.recipientUserId),
  ]
);

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

// 26. Contact Messages
export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    message: text("message").notNull(),
    locale: varchar("locale", { length: 5 }).default("tr").notNull(),
    ipAddress: varchar("ip_address", { length: 64 }),
    status: varchar("status", { length: 30 }).default("NEW").notNull(), // NEW, READ, REPLIED, ARCHIVED
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("contact_messages_created_idx").on(table.createdAt),
    index("contact_messages_status_idx").on(table.status),
  ]
);

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

// 33. Resend Contact Pool (Dynamic 1000-seat contact pool & consent management)
export const resendContactPool = pgTable(
  "resend_contact_pool",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    email: varchar("email", { length: 255 }).notNull(),
    status: varchar("status", { length: 30 }).default("PENDING").notNull(), // 'PENDING' | 'IN_POOL' | 'OPTED_OUT' | 'BOUNCED'
    resendContactId: varchar("resend_contact_id", { length: 100 }),
    consentGivenAt: timestamp("consent_given_at", { withTimezone: true }).defaultNow().notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    bouncedAt: timestamp("bounced_at", { withTimezone: true }),
    bounceReason: text("bounce_reason"),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("resend_contact_pool_user_id_idx").on(table.userId),
    index("resend_contact_pool_status_active_idx").on(table.status, table.lastActiveAt),
    index("resend_contact_pool_email_idx").on(table.email),
    uniqueIndex("resend_contact_pool_resend_id_idx")
      .on(table.resendContactId)
      .where(sql`resend_contact_id IS NOT NULL`),
  ]
);
