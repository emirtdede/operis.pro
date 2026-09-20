CREATE TABLE "export_job_parts" (
	"job_id" uuid NOT NULL,
	"attempt_no" integer NOT NULL,
	"part_no" integer NOT NULL,
	"payload_enc" text NOT NULL,
	"plaintext_sha256" char(64) NOT NULL,
	"byte_length" integer NOT NULL,
	CONSTRAINT "export_job_parts_job_id_attempt_no_part_no_pk" PRIMARY KEY("job_id","attempt_no","part_no")
);
--> statement-breakpoint
CREATE TABLE "export_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"format_version" integer DEFAULT 2 NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_token" uuid,
	"lease_until" timestamp with time zone,
	"last_progress_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"snapshot_started_at" timestamp with time zone,
	"progress" integer DEFAULT 0 NOT NULL,
	"manifest_json" jsonb,
	"file_content" text,
	"checksum_sha256" varchar(64),
	"file_size_bytes" bigint,
	"error_code" varchar(64),
	"result_attempt" integer,
	"part_count" integer,
	"error_message" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ip_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"reason" varchar(255),
	"actor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_identity" (
	"is_singleton" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"deployment_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "maintenance_identity_singleton_check" CHECK (is_singleton = true)
);
--> statement-breakpoint
CREATE TABLE "notification_fanout_progress" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"phase" varchar(16) NOT NULL,
	"last_user_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" varchar(40) NOT NULL,
	"target_phone_hmac" text,
	"code_digest" text NOT NULL,
	"key_version" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"consumed_at" timestamp with time zone,
	"superseded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purpose" varchar(60) NOT NULL,
	"subject_digest" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resend_contact_pool" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"resend_contact_id" varchar(100),
	"consent_given_at" timestamp with time zone DEFAULT now() NOT NULL,
	"synced_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"bounced_at" timestamp with time zone,
	"bounce_reason" text,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resend_contact_pool_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "delivery_key" varchar(191);--> statement-breakpoint
ALTER TABLE "outbox_events" ADD COLUMN "lease_token" uuid;--> statement-breakpoint
ALTER TABLE "outbox_events" ADD COLUMN "lease_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "outbox_events" ADD COLUMN "delivery_key" varchar(191);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "avatar_source" varchar(20) DEFAULT 'oauth' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "preferred_contact_channel" varchar(30) DEFAULT 'any';--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "time_zone" varchar(60) DEFAULT 'Europe/Istanbul';--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "headline" varchar(140);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "roles" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "is_available_for_hire" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "is_actively_hiring" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_enc" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_hmac" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "clerk_user_id" varchar(255);--> statement-breakpoint
ALTER TABLE "export_job_parts" ADD CONSTRAINT "export_job_parts_job_id_export_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."export_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_blocks" ADD CONSTRAINT "ip_blocks_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_fanout_progress" ADD CONSTRAINT "notification_fanout_progress_event_id_outbox_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."outbox_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resend_contact_pool" ADD CONSTRAINT "resend_contact_pool_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "export_jobs_user_status_created_idx" ON "export_jobs" USING btree ("user_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "export_jobs_one_active_user_idx" ON "export_jobs" USING btree ("user_id") WHERE status IN ('PENDING', 'PROCESSING');--> statement-breakpoint
CREATE INDEX "ip_blocks_ip_idx" ON "ip_blocks" USING btree ("ip");--> statement-breakpoint
CREATE INDEX "ip_blocks_revoked_expires_idx" ON "ip_blocks" USING btree ("revoked_at","expires_at");--> statement-breakpoint
CREATE INDEX "otp_challenges_user_purpose_idx" ON "otp_challenges" USING btree ("user_id","purpose");--> statement-breakpoint
CREATE INDEX "otp_challenges_expires_idx" ON "otp_challenges" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limits_purpose_subject_window_idx" ON "rate_limits" USING btree ("purpose","subject_digest","window_start");--> statement-breakpoint
CREATE INDEX "rate_limits_expires_idx" ON "rate_limits" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "resend_contact_pool_user_id_idx" ON "resend_contact_pool" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "resend_contact_pool_status_active_idx" ON "resend_contact_pool" USING btree ("status","last_active_at");--> statement-breakpoint
CREATE INDEX "resend_contact_pool_email_idx" ON "resend_contact_pool" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "resend_contact_pool_resend_id_idx" ON "resend_contact_pool" USING btree ("resend_contact_id") WHERE resend_contact_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "outbox_delivery_key_unique_idx" ON "outbox_events" USING btree ("delivery_key");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_delivery_key_unique" UNIQUE("delivery_key");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id");--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_budget_integrity_chk" CHECK (status = 'DRAFT' OR (budget_mode IN ('EXACT', 'FIXED_EXACT', 'HOURLY_EXACT') AND budget_min IS NOT NULL AND budget_max IS NOT NULL AND budget_min = budget_max AND budget_min > 0 AND budget_currency IS NOT NULL) OR (budget_mode IN ('RANGE', 'FIXED_RANGE', 'HOURLY_RANGE') AND budget_min IS NOT NULL AND budget_max IS NOT NULL AND budget_min > 0 AND budget_max >= budget_min AND budget_currency IS NOT NULL) OR (budget_mode IN ('OPEN_BID', 'NEGOTIABLE', 'REQUEST_GUIDANCE') AND (budget_min IS NULL OR budget_min > 0) AND (budget_max IS NULL OR budget_max > 0) AND (budget_min IS NULL OR budget_max IS NULL OR budget_max >= budget_min)));