-- Migration 0034: Exotic the Enforcers
-- Applied missing domain tables (company verifications, squads, milestones, change requests, retainers, runbooks)
-- and corporate profile verification columns with idempotent guards and RLS policies.

-- 1. Tables Creation
CREATE TABLE IF NOT EXISTS "company_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" varchar(150) NOT NULL,
	"tax_office" varchar(80) NOT NULL,
	"tax_id_hmac" varchar(64) NOT NULL,
	"tax_id_masked" varchar(20) NOT NULL,
	"company_type" varchar(30) DEFAULT 'LTD' NOT NULL,
	"status" varchar(30) DEFAULT 'VERIFIED' NOT NULL,
	"website_url" text,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_verifications_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "company_verifications_tax_id_hmac_unique" UNIQUE("tax_id_hmac")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "offer_squad_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"user_id" uuid,
	"display_name" varchar(80) NOT NULL,
	"role_title" varchar(60) NOT NULL,
	"revenue_share_percentage" numeric(5, 2) NOT NULL,
	"scope_summary" text,
	"handle_or_email" varchar(100),
	"is_lead" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "engagement_change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"engagement_id" uuid NOT NULL,
	"requester_user_id" uuid NOT NULL,
	"reviewer_user_id" uuid NOT NULL,
	"sequence_number" integer DEFAULT 1 NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"reason" varchar(40) NOT NULL,
	"additional_budget" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(10) DEFAULT 'TRY' NOT NULL,
	"additional_days" integer DEFAULT 0 NOT NULL,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"responded_at" timestamp with time zone,
	"parent_contract_sha256" varchar(64),
	"addendum_sha256" varchar(64),
	"addendum_content_markdown" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "engagement_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"engagement_id" uuid NOT NULL,
	"sequence_number" integer DEFAULT 1 NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"deliverable_criteria" text,
	"percentage" numeric(5, 2) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'TRY' NOT NULL,
	"target_date" date,
	"deliverable_status" varchar(30) DEFAULT 'NOT_STARTED' NOT NULL,
	"deliverable_note" text,
	"deliverable_url" text,
	"deliverable_url_type" varchar(30),
	"submitted_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"payment_status" varchar(30) DEFAULT 'UNPAID' NOT NULL,
	"payment_reference" varchar(100),
	"payment_receipt_url" text,
	"invoice_number" varchar(100),
	"paid_marked_at" timestamp with time zone,
	"paid_confirmed_at" timestamp with time zone,
	"audit_trail_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sha256_seal" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "engagement_retainers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"engagement_id" uuid NOT NULL,
	"freelancer_user_id" uuid NOT NULL,
	"client_user_id" uuid NOT NULL,
	"plan_type" varchar(30) DEFAULT 'HOURLY_POOL' NOT NULL,
	"monthly_price" numeric(12, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'TRY' NOT NULL,
	"included_hours" integer DEFAULT 0 NOT NULL,
	"overage_hourly_rate" numeric(12, 2) DEFAULT '0',
	"rollover_policy" varchar(30) DEFAULT 'NO_ROLLOVER' NOT NULL,
	"sla_tier" varchar(20) DEFAULT 'STANDARD' NOT NULL,
	"scope_description" text NOT NULL,
	"status" varchar(30) DEFAULT 'PROPOSED' NOT NULL,
	"cancellation_notice_days" integer DEFAULT 15 NOT NULL,
	"started_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"contract_markdown" text,
	"sha256_seal" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "engagement_retainers_engagement_id_unique" UNIQUE("engagement_id")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "engagement_retainer_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"retainer_id" uuid NOT NULL,
	"period_index" integer DEFAULT 1 NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"base_price" numeric(12, 2) NOT NULL,
	"hours_logged" numeric(6, 2) DEFAULT '0' NOT NULL,
	"overage_hours" numeric(6, 2) DEFAULT '0' NOT NULL,
	"overage_price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'TRY' NOT NULL,
	"tax_summary" jsonb,
	"payment_status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "engagement_runbooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"engagement_id" uuid NOT NULL,
	"created_by_id" uuid NOT NULL,
	"status" varchar(30) DEFAULT 'DRAFT' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"architecture_summary" text NOT NULL,
	"environment_variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"build_and_run_steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"third_party_services" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"disaster_recovery_steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"backup_schedule" jsonb DEFAULT '{"frequency":"DAILY"}'::jsonb NOT NULL,
	"emergency_contact" jsonb,
	"sha256_seal" varchar(64),
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "engagement_runbooks_engagement_id_unique" UNIQUE("engagement_id")
);
--> statement-breakpoint

-- 2. Columns Alterations
ALTER TABLE "engagements" ADD COLUMN IF NOT EXISTS "is_squad_engagement" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "engagements" ADD COLUMN IF NOT EXISTS "squad_title_snapshot" varchar(120);--> statement-breakpoint

ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "is_squad_offer" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "squad_title" varchar(120);--> statement-breakpoint

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "is_company_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "company_name" varchar(150);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "company_type" varchar(30);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "tax_office" varchar(80);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "vkn_masked" varchar(20);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "vkn_hmac" varchar(64);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "company_verified_at" timestamp with time zone;--> statement-breakpoint

-- 3. Foreign Key Constraints (Protected with DO blocks)
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_verifications_user_id_users_id_fk') THEN
		ALTER TABLE "company_verifications" ADD CONSTRAINT "company_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_squad_members_offer_id_offers_id_fk') THEN
		ALTER TABLE "offer_squad_members" ADD CONSTRAINT "offer_squad_members_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_squad_members_user_id_users_id_fk') THEN
		ALTER TABLE "offer_squad_members" ADD CONSTRAINT "offer_squad_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_change_requests_engagement_id_engagements_id_fk') THEN
		ALTER TABLE "engagement_change_requests" ADD CONSTRAINT "engagement_change_requests_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_change_requests_requester_user_id_users_id_fk') THEN
		ALTER TABLE "engagement_change_requests" ADD CONSTRAINT "engagement_change_requests_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_change_requests_reviewer_user_id_users_id_fk') THEN
		ALTER TABLE "engagement_change_requests" ADD CONSTRAINT "engagement_change_requests_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_milestones_engagement_id_engagements_id_fk') THEN
		ALTER TABLE "engagement_milestones" ADD CONSTRAINT "engagement_milestones_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_retainers_engagement_id_engagements_id_fk') THEN
		ALTER TABLE "engagement_retainers" ADD CONSTRAINT "engagement_retainers_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_retainers_freelancer_user_id_users_id_fk') THEN
		ALTER TABLE "engagement_retainers" ADD CONSTRAINT "engagement_retainers_freelancer_user_id_users_id_fk" FOREIGN KEY ("freelancer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_retainers_client_user_id_users_id_fk') THEN
		ALTER TABLE "engagement_retainers" ADD CONSTRAINT "engagement_retainers_client_user_id_users_id_fk" FOREIGN KEY ("client_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_retainer_periods_retainer_id_engagement_retainers_id_fk') THEN
		ALTER TABLE "engagement_retainer_periods" ADD CONSTRAINT "engagement_retainer_periods_retainer_id_engagement_retainers_id_fk" FOREIGN KEY ("retainer_id") REFERENCES "public"."engagement_retainers"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_runbooks_engagement_id_engagements_id_fk') THEN
		ALTER TABLE "engagement_runbooks" ADD CONSTRAINT "engagement_runbooks_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_runbooks_created_by_id_users_id_fk') THEN
		ALTER TABLE "engagement_runbooks" ADD CONSTRAINT "engagement_runbooks_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint

-- 4. Indexes Creation
CREATE UNIQUE INDEX IF NOT EXISTS "idx_company_verif_user" ON "company_verifications" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_company_verif_hmac" ON "company_verifications" USING btree ("tax_id_hmac");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "offer_squad_members_offer_idx" ON "offer_squad_members" USING btree ("offer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_engagement_change_requests_engagement" ON "engagement_change_requests" USING btree ("engagement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_engagement_change_requests_status" ON "engagement_change_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_engagement_change_requests_seq" ON "engagement_change_requests" USING btree ("engagement_id","sequence_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_engagement_milestones_engagement" ON "engagement_milestones" USING btree ("engagement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_engagement_milestones_status" ON "engagement_milestones" USING btree ("deliverable_status","payment_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_engagement_milestones_seq" ON "engagement_milestones" USING btree ("engagement_id","sequence_number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_engagement_retainers_engagement" ON "engagement_retainers" USING btree ("engagement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_engagement_retainers_status" ON "engagement_retainers" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_engagement_retainer_periods_retainer" ON "engagement_retainer_periods" USING btree ("retainer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_engagement_retainer_periods_status" ON "engagement_retainer_periods" USING btree ("payment_status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_engagement_runbooks_engagement" ON "engagement_runbooks" USING btree ("engagement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_engagement_runbooks_status" ON "engagement_runbooks" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_profiles_company_verified" ON "profiles" USING btree ("is_company_verified");--> statement-breakpoint

-- 5. Row Level Security & Service Role Policies
ALTER TABLE "company_verifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "offer_squad_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "engagement_change_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "engagement_milestones" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "engagement_retainers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "engagement_retainer_periods" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "engagement_runbooks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

DO $$
DECLARE
	tbl text;
	new_tables text[] := ARRAY[
		'company_verifications',
		'offer_squad_members',
		'engagement_change_requests',
		'engagement_milestones',
		'engagement_retainers',
		'engagement_retainer_periods',
		'engagement_runbooks'
	];
BEGIN
	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
		FOREACH tbl IN ARRAY new_tables LOOP
			EXECUTE format('GRANT ALL ON TABLE "public".%I TO service_role;', tbl);
			EXECUTE format('DROP POLICY IF EXISTS "service_role_manage_all" ON "public".%I;', tbl);
			EXECUTE format('CREATE POLICY "service_role_manage_all" ON "public".%I FOR ALL TO service_role USING (true) WITH CHECK (true);', tbl);
		END LOOP;
	END IF;

	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
		FOREACH tbl IN ARRAY new_tables LOOP
			EXECUTE format('REVOKE ALL ON TABLE "public".%I FROM anon;', tbl);
		END LOOP;
	END IF;

	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
		FOREACH tbl IN ARRAY new_tables LOOP
			EXECUTE format('REVOKE ALL ON TABLE "public".%I FROM authenticated;', tbl);
		END LOOP;
	END IF;
END $$;