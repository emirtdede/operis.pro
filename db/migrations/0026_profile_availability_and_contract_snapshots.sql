ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "availability_status" varchar(30) DEFAULT 'AVAILABLE_NOW' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "availability_hours_per_week" integer DEFAULT 40 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "available_from_date" date;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "availability_notice" varchar(140);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "availability_updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_profiles_availability_status" ON "profiles" USING btree ("availability_status");
