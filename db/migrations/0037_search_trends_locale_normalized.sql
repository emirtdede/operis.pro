-- Migration 0037: Segregate search_trends by (locale, normalized)
ALTER TABLE "search_trends" DROP CONSTRAINT IF EXISTS "search_trends_normalized_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "search_trends_normalized_idx";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "search_trends_locale_normalized_idx" ON "search_trends" USING btree ("locale", "normalized");
