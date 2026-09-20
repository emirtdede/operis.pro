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
  primaryKey,
  uniqueIndex,
  index,
  char,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

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
    emailAlerts: boolean("email_alerts").default(true).notNull(),
    minBudget: integer("min_budget"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.categoryId] }),
    index("idx_cat_follows_cat_alerts").on(table.categoryId, table.emailAlerts),
  ]
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

// 34. Saved Listings (User Bookmarks / Favorites with composite indexing)
export const savedListings = pgTable(
  "saved_listings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("saved_listings_user_listing_idx").on(table.userId, table.listingId),
    index("saved_listings_user_created_idx").on(table.userId, table.createdAt),
  ]
);
