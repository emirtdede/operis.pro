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
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { listings } from "./listings";
import { offers } from "./offers";

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
    isSquadEngagement: boolean("is_squad_engagement").default(false).notNull(),
    squadTitleSnapshot: varchar("squad_title_snapshot", { length: 120 }),
  },
  (table) => [
    uniqueIndex("engagements_active_listing_idx")
      .on(table.listingId)
      .where(sql`${table.status} != 'CANCELLED'`),
    uniqueIndex("engagements_active_accepted_offer_idx")
      .on(table.acceptedOfferId)
      .where(sql`${table.status} != 'CANCELLED'`),
    index("idx_engagements_benchmark").on(table.status, table.matchedAt),
    index("engagements_owner_status_idx").on(table.ownerUserId, table.status),
    index("engagements_freelancer_status_idx").on(table.freelancerUserId, table.status),
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

// 15b. Engagement Handovers & Official Acceptance Protocol (TBK m. 474 / m. 477)
export const engagementHandovers = pgTable(
  "engagement_handovers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    freelancerUserId: uuid("freelancer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    repositoryUrl: text("repository_url").notNull(),
    commitHash: varchar("commit_hash", { length: 64 }),
    liveUrl: text("live_url"),
    deliveryHealth: jsonb("delivery_health"),
    accessChecklist: jsonb("access_checklist")
      .default({
        dnsTransferred: false,
        hostingTransferred: false,
        adminAccountsTransferred: false,
        apiKeysTransferred: false,
      })
      .notNull(),
    documentationNotes: text("documentation_notes").notNull(),
    status: varchar("status", { length: 30 }).default("SUBMITTED").notNull(),
    // SUBMITTED, ACCEPTED_EXPRESS, ACCEPTED_TACIT, REVISION_REQUESTED
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
    inspectionExpiresAt: timestamp("inspection_expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedByUserId: uuid("accepted_by_user_id").references(() => users.id),
    acceptanceType: varchar("acceptance_type", { length: 20 }), // EXPRESS, TACIT
    sha256Seal: varchar("sha256_seal", { length: 64 }).notNull(),
    revisionNotes: text("revision_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_engagement_handovers_engagement").on(table.engagementId),
    index("idx_engagement_handovers_status").on(table.status),
    index("idx_engagement_handovers_inspection").on(table.inspectionExpiresAt),
  ]
);

// 15c. Engagement Scope Shield & Change Requests (TBK m. 470 / m. 480/2 Contract Addendum)
export const engagementChangeRequests = pgTable(
  "engagement_change_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    requesterUserId: uuid("requester_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reviewerUserId: uuid("reviewer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sequenceNumber: integer("sequence_number").notNull().default(1),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description").notNull(),
    reason: varchar("reason", { length: 40 }).notNull(), // CLIENT_REQUESTED, TECHNICAL_NECESSITY, SCOPE_DISCOVERY, UNFORESEEN_COMPLICATION
    additionalBudget: numeric("additional_budget", { precision: 12, scale: 2 }).default("0").notNull(),
    currency: varchar("currency", { length: 10 }).default("TRY").notNull(),
    additionalDays: integer("additional_days").default(0).notNull(),
    status: varchar("status", { length: 30 }).default("PENDING").notNull(), // PENDING, APPROVED, REJECTED, CANCELLED
    rejectionReason: text("rejection_reason"),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    parentContractSha256: varchar("parent_contract_sha256", { length: 64 }),
    addendumSha256: varchar("addendum_sha256", { length: 64 }),
    addendumContentMarkdown: text("addendum_content_markdown"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_engagement_change_requests_engagement").on(table.engagementId),
    index("idx_engagement_change_requests_status").on(table.status),
    uniqueIndex("idx_engagement_change_requests_seq").on(table.engagementId, table.sequenceNumber),
    uniqueIndex("idx_engagement_change_requests_pending")
      .on(table.engagementId)
      .where(sql`${table.status} = 'PENDING'`),
  ]
);

// 15d. Smart Retainer & Recurring Maintenance Agreements (TBK m. 502 / m. 470)
export const engagementRetainers = pgTable(
  "engagement_retainers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    freelancerUserId: uuid("freelancer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientUserId: uuid("client_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planType: varchar("plan_type", { length: 30 }).default("HOURLY_POOL").notNull(), // HOURLY_POOL, FIXED_MAINTENANCE
    monthlyPrice: numeric("monthly_price", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).default("TRY").notNull(),
    includedHours: integer("included_hours").default(0).notNull(),
    overageHourlyRate: numeric("overage_hourly_rate", { precision: 12, scale: 2 }).default("0"),
    rolloverPolicy: varchar("rollover_policy", { length: 30 }).default("NO_ROLLOVER").notNull(), // NO_ROLLOVER, MAX_25_PERCENT
    slaTier: varchar("sla_tier", { length: 20 }).default("STANDARD").notNull(), // STANDARD, ENTERPRISE
    scopeDescription: text("scope_description").notNull(),
    status: varchar("status", { length: 30 }).default("PROPOSED").notNull(), // PROPOSED, ACTIVE, PAUSED, CANCELLED
    cancellationNoticeDays: integer("cancellation_notice_days").default(15).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    contractMarkdown: text("contract_markdown"),
    sha256Seal: varchar("sha256_seal", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_engagement_retainers_engagement").on(table.engagementId),
    index("idx_engagement_retainers_status").on(table.status),
  ]
);

// 15e. Engagement Retainer Billing Periods & Tax Ledger
export const engagementRetainerPeriods = pgTable(
  "engagement_retainer_periods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    retainerId: uuid("retainer_id")
      .notNull()
      .references(() => engagementRetainers.id, { onDelete: "cascade" }),
    periodIndex: integer("period_index").default(1).notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
    hoursLogged: numeric("hours_logged", { precision: 6, scale: 2 }).default("0").notNull(),
    overageHours: numeric("overage_hours", { precision: 6, scale: 2 }).default("0").notNull(),
    overagePrice: numeric("overage_price", { precision: 12, scale: 2 }).default("0").notNull(),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).default("TRY").notNull(),
    taxSummary: jsonb("tax_summary"),
    paymentStatus: varchar("payment_status", { length: 30 }).default("PENDING").notNull(), // PENDING, PAID, OVERDUE
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_engagement_retainer_periods_retainer").on(table.retainerId),
    index("idx_engagement_retainer_periods_status").on(table.paymentStatus),
    uniqueIndex("idx_engagement_retainer_periods_unique").on(table.retainerId, table.periodIndex),
  ]
);

// 15f. Interactive Engagement Milestones & Zero-Escrow Payment Ledger (TBK m. 470, HMK m. 193)
export const engagementMilestones = pgTable(
  "engagement_milestones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    sequenceNumber: integer("sequence_number").notNull().default(1),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description").notNull(),
    deliverableCriteria: text("deliverable_criteria"),
    percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(), // e.g. 25.00
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).default("TRY").notNull(),
    targetDate: date("target_date"),

    // Deliverable state (Freelancer progress tracking)
    deliverableStatus: varchar("deliverable_status", { length: 30 }).default("NOT_STARTED").notNull(), // NOT_STARTED, IN_PROGRESS, SUBMITTED, ACCEPTED
    deliverableNote: text("deliverable_note"),
    deliverableUrl: text("deliverable_url"), // Private repo / staging / figma URL
    deliverableUrlType: varchar("deliverable_url_type", { length: 30 }), // CODE_REPO, DESIGN_PROTOTYPE, STAGING_URL, DOC_WORKSPACE, OTHER
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),

    // Payment & Ledger state (Zero-Escrow Reversible)
    paymentStatus: varchar("payment_status", { length: 30 }).default("UNPAID").notNull(), // UNPAID, MARKED_PAID, CONFIRMED_PAID
    paymentReference: varchar("payment_reference", { length: 100 }), // EFT / Havale reference no
    paymentReceiptUrl: text("payment_receipt_url"), // Optional receipt image / pdf url
    invoiceNumber: varchar("invoice_number", { length: 100 }), // SMM or E-Invoice no
    paidMarkedAt: timestamp("paid_marked_at", { withTimezone: true }),
    paidConfirmedAt: timestamp("paid_confirmed_at", { withTimezone: true }),

    // HMK m. 193 Audit Trail & Digital Seal
    auditTrailJson: jsonb("audit_trail_json").default([]).notNull(),
    sha256Seal: varchar("sha256_seal", { length: 64 }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_engagement_milestones_engagement").on(table.engagementId),
    index("idx_engagement_milestones_status").on(table.deliverableStatus, table.paymentStatus),
    uniqueIndex("idx_engagement_milestones_seq").on(table.engagementId, table.sequenceNumber),
  ]
);

// 15f. Engagement Runbooks & Architecture Vault (Project Runbook & Disaster Recovery)
export const engagementRunbooks = pgTable(
  "engagement_runbooks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 30 }).default("DRAFT").notNull(), // DRAFT, PUBLISHED, VERIFIED
    version: integer("version").default(1).notNull(),
    architectureSummary: text("architecture_summary").notNull(),
    environmentVariables: jsonb("environment_variables")
      .$type<Array<{
        key: string;
        description: string;
        isRequired: boolean;
        sampleValue?: string;
        secretCategory: "DATABASE" | "AUTH" | "PAYMENT" | "STORAGE" | "ANALYTICS" | "COMMUNICATION" | "OTHER";
      }>>()
      .default([])
      .notNull(),
    buildAndRunSteps: jsonb("build_and_run_steps")
      .$type<Array<{
        stepNumber: number;
        title: string;
        command: string;
        description: string;
        environment: "LOCAL" | "DOCKER" | "PRODUCTION" | "CI_CD";
      }>>()
      .default([])
      .notNull(),
    thirdPartyServices: jsonb("third_party_services")
      .$type<Array<{
        serviceName: string;
        category: string;
        dashboardUrl?: string;
        purpose: string;
        credentialsTransferred: boolean;
        notes?: string;
      }>>()
      .default([])
      .notNull(),
    disasterRecoverySteps: jsonb("disaster_recovery_steps")
      .$type<Array<{
        priority: "CRITICAL" | "HIGH" | "MEDIUM";
        scenario: string;
        procedure: string;
        verificationCommand?: string;
      }>>()
      .default([])
      .notNull(),
    backupSchedule: jsonb("backup_schedule")
      .$type<{
        frequency: string;
        backupScriptOrCommand?: string;
        storageLocation?: string;
        restoreProcedure?: string;
      }>()
      .default({ frequency: "DAILY" })
      .notNull(),
    emergencyContact: jsonb("emergency_contact")
      .$type<{
        name?: string;
        email?: string;
        phone?: string;
        notes?: string;
      }>(),
    sha256Seal: varchar("sha256_seal", { length: 64 }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_engagement_runbooks_engagement").on(table.engagementId),
    index("idx_engagement_runbooks_status").on(table.status),
  ]
);

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

// 35. Engagement Reviews (Bilateral Double-Blind Rating & Review System)
export const engagementReviews = pgTable(
  "engagement_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    authorRole: varchar("author_role", { length: 20 }).notNull(), // 'EMPLOYER' | 'FREELANCER'
    overallRating: smallint("overall_rating").notNull(), // 1 to 5
    communicationRating: smallint("communication_rating").notNull(), // 1 to 5
    qualityRating: smallint("quality_rating").notNull(), // 1 to 5
    comment: text("comment").notNull(),
    tags: text("tags")
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    endorsedSkills: text("endorsed_skills")
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    isRevealed: boolean("is_revealed").default(false).notNull(),
    revealedAt: timestamp("revealed_at", { withTimezone: true }),
    reviewWindowExpiresAt: timestamp("review_window_expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("reviews_engagement_author_unique_idx").on(table.engagementId, table.authorUserId),
    index("reviews_recipient_revealed_idx").on(table.recipientUserId, table.isRevealed, table.createdAt),
    index("reviews_author_revealed_idx").on(table.authorUserId, table.isRevealed, table.createdAt),
    index("reviews_engagement_idx").on(table.engagementId),
    check("reviews_overall_rating_chk", sql`overall_rating >= 1 AND overall_rating <= 5`),
    check("reviews_comm_rating_chk", sql`communication_rating >= 1 AND communication_rating <= 5`),
    check("reviews_quality_rating_chk", sql`quality_rating >= 1 AND quality_rating <= 5`),
  ]
);

// 36. Engagement Contract Packages (Unified Single-Sign & Ephemeral R2 Storage)
export const engagementContractPackages = pgTable(
  "engagement_contract_packages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    selectedContracts: jsonb("selected_contracts")
      .$type<string[]>()
      .default(["CORE_SERVICE"])
      .notNull(),
    status: varchar("status", { length: 30 }).default("DRAFT").notNull(),
    // DRAFT, PENDING_SIGNATURES, PARTIALLY_SIGNED, FULLY_SIGNED, CANCELLED

    // Client Signature metadata
    clientSignerUserId: uuid("client_signer_user_id").references(() => users.id),
    clientSignerName: varchar("client_signer_name", { length: 120 }),
    clientSignedAt: timestamp("client_signed_at", { withTimezone: true }),
    clientIpHash: varchar("client_ip_hash", { length: 64 }),
    clientSignatureR2Key: text("client_signature_r2_key"),
    clientSignatureDataUrl: text("client_signature_data_url"),

    // Freelancer Signature metadata
    freelancerSignerUserId: uuid("freelancer_signer_user_id").references(() => users.id),
    freelancerSignerName: varchar("freelancer_signer_name", { length: 120 }),
    freelancerSignedAt: timestamp("freelancer_signed_at", { withTimezone: true }),
    freelancerIpHash: varchar("freelancer_ip_hash", { length: 64 }),
    freelancerSignatureR2Key: text("freelancer_signature_r2_key"),
    freelancerSignatureDataUrl: text("freelancer_signature_data_url"),

    // Compiled Master Document & Cryptographic Seal
    compiledMarkdown: text("compiled_markdown"),
    compiledHtml: text("compiled_html"),
    sha256Seal: varchar("sha256_seal", { length: 64 }),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    ephemeralCleanedAt: timestamp("ephemeral_cleaned_at", { withTimezone: true }),

    // Optimistic Concurrency Control (CAS) & Tamper Reset Invalidation
    version: integer("version").default(1).notNull(),
    tamperResetCount: integer("tamper_reset_count").default(0).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_contract_packages_engagement").on(table.engagementId),
    index("idx_contract_packages_status").on(table.status),
  ]
);
