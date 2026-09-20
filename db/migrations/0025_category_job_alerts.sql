ALTER TABLE "category_follows" ADD COLUMN IF NOT EXISTS "email_alerts" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "category_follows" ADD COLUMN IF NOT EXISTS "min_budget" integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cat_follows_cat_alerts" ON "category_follows" USING btree ("category_id", "email_alerts");
