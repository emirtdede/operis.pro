import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const searchTrends = pgTable(
  "search_trends",
  {
    id: serial("id").primaryKey(),
    query: varchar("query", { length: 100 }).notNull(),
    normalized: varchar("normalized", { length: 100 }).notNull().unique(),
    locale: varchar("locale", { length: 10 }).notNull().default("tr"),
    count: integer("count").notNull().default(1),
    lastSearchedAt: timestamp("last_searched_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("search_trends_normalized_idx").on(table.normalized),
    index("search_trends_locale_count_idx").on(table.locale, table.count, table.lastSearchedAt),
  ]
);
