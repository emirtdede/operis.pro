import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

// 18. Notifications
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(),
    payloadJson: jsonb("payload_json").notNull(),
    deliveryKey: varchar("delivery_key", { length: 191 }).unique(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
    index("notifications_user_unread_idx").on(table.userId, table.readAt),
  ]
);

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
  (table) => [
    uniqueIndex("outbox_delivery_key_unique_idx").on(table.deliveryKey),
    index("outbox_status_next_attempt_idx").on(table.status, table.nextAttemptAt),
  ]
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
