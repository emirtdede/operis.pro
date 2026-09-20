import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  numeric,
  jsonb,
  uniqueIndex,
  index,
  char,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { listings } from "./listings";

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
    isCountered: boolean("is_countered").default(false).notNull(),
    currentTurnUserId: uuid("current_turn_user_id").references(() => users.id),
    counterRound: integer("counter_round").default(0).notNull(),
    activeCounterProposalId: uuid("active_counter_proposal_id"),
    isSquadOffer: boolean("is_squad_offer").default(false).notNull(),
    squadTitle: varchar("squad_title", { length: 120 }),
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

// 12b. Offer Counter Proposals (Negotiation Cycle)
export const offerCounterProposals = pgTable(
  "offer_counter_proposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    round: integer("round").notNull(),
    proposerUserId: uuid("proposer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    budgetCurrency: char("budget_currency", { length: 3 }).notNull(),
    budgetMin: numeric("budget_min", { precision: 18, scale: 2 }).notNull(),
    budgetMax: numeric("budget_max", { precision: 18, scale: 2 }).notNull(),
    estimatedDurationValue: integer("estimated_duration_value").notNull(),
    estimatedDurationUnit: varchar("estimated_duration_unit", { length: 20 }).notNull(),
    message: text("message").notNull(),
    status: varchar("status", { length: 30 }).default("PENDING").notNull(),
    // PENDING, ACCEPTED, REJECTED, SUPERSEDED, WITHDRAWN, EXPIRED
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("counter_proposals_offer_round_idx").on(table.offerId, table.round),
    index("offer_counter_proposals_offer_idx").on(table.offerId),
    index("counter_proposals_status_idx").on(table.status),
    index("counter_proposals_expires_idx").on(table.expiresAt),
  ]
);

// 12c. Offer Squad Members (Consortium & Multi-Disciplinary Collective)
export const offerSquadMembers = pgTable(
  "offer_squad_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id),
    displayName: varchar("display_name", { length: 80 }).notNull(),
    roleTitle: varchar("role_title", { length: 60 }).notNull(),
    revenueSharePercentage: numeric("revenue_share_percentage", { precision: 5, scale: 2 }).notNull(),
    scopeSummary: text("scope_summary"),
    handleOrEmail: varchar("handle_or_email", { length: 100 }),
    isLead: boolean("is_lead").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("offer_squad_members_offer_idx").on(table.offerId),
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
