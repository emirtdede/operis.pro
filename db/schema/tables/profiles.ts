import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  date,
  smallint,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

// 3. Profiles
export const profiles = pgTable(
  "profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    handle: varchar("handle", { length: 30 }).unique().notNull(),
    displayName: varchar("display_name", { length: 80 }).notNull(),
    about: varchar("about", { length: 1000 }),
    avatarUrl: text("avatar_url"),
    avatarSource: varchar("avatar_source", { length: 20 }).default("oauth").notNull(),
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
    headline: varchar("headline", { length: 140 }),
    roles: text("roles")
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    isAvailableForHire: boolean("is_available_for_hire").default(true).notNull(),
    isActivelyHiring: boolean("is_actively_hiring").default(false).notNull(),
    availabilityStatus: varchar("availability_status", { length: 30 }).default("AVAILABLE_NOW").notNull(),
    availabilityHoursPerWeek: integer("availability_hours_per_week").default(40).notNull(),
    availableFromDate: date("available_from_date"),
    availabilityNotice: varchar("availability_notice", { length: 140 }),
    availabilityUpdatedAt: timestamp("availability_updated_at", { withTimezone: true }).defaultNow().notNull(),
    isCompanyVerified: boolean("is_company_verified").default(false).notNull(),
    companyName: varchar("company_name", { length: 150 }),
    companyType: varchar("company_type", { length: 30 }),
    taxOffice: varchar("tax_office", { length: 80 }),
    vknMasked: varchar("vkn_masked", { length: 20 }),
    vknHmac: varchar("vkn_hmac", { length: 64 }),
    companyVerifiedAt: timestamp("company_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_profiles_availability_status").on(table.availabilityStatus),
    index("idx_profiles_company_verified").on(table.isCompanyVerified),
  ]
);

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

// 4b. Company Verifications (GİB VKN & TCKN Verified Corporate Entities)
export const companyVerifications = pgTable(
  "company_verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    companyName: varchar("company_name", { length: 150 }).notNull(),
    taxOffice: varchar("tax_office", { length: 80 }).notNull(),
    taxIdHmac: varchar("tax_id_hmac", { length: 64 }).notNull().unique(), // Blind index prevents multi-account theft
    taxIdMasked: varchar("tax_id_masked", { length: 20 }).notNull(), // KVKK safe representation: 123***7890
    companyType: varchar("company_type", { length: 30 }).default("LTD").notNull(), // LTD, AS, SAHIS, OTHER
    status: varchar("status", { length: 30 }).default("VERIFIED").notNull(), // VERIFIED, REVOKED
    websiteUrl: text("website_url"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_company_verif_user").on(table.userId),
    uniqueIndex("idx_company_verif_hmac").on(table.taxIdHmac),
  ]
);
