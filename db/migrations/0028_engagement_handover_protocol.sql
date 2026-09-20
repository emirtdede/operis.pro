CREATE TABLE IF NOT EXISTS "engagement_handovers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"engagement_id" uuid NOT NULL REFERENCES "engagements"("id") ON DELETE CASCADE,
	"freelancer_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"repository_url" text NOT NULL,
	"commit_hash" varchar(64),
	"live_url" text,
	"access_checklist" jsonb DEFAULT '{"dnsTransferred": false, "hostingTransferred": false, "adminAccountsTransferred": false, "apiKeysTransferred": false}'::jsonb NOT NULL,
	"documentation_notes" text NOT NULL,
	"status" varchar(30) DEFAULT 'SUBMITTED' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"inspection_expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by_user_id" uuid REFERENCES "users"("id"),
	"acceptance_type" varchar(20),
	"sha256_seal" varchar(64) NOT NULL,
	"revision_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_engagement_handovers_engagement" ON "engagement_handovers" ("engagement_id");
CREATE INDEX IF NOT EXISTS "idx_engagement_handovers_status" ON "engagement_handovers" ("status");
CREATE INDEX IF NOT EXISTS "idx_engagement_handovers_inspection" ON "engagement_handovers" ("inspection_expires_at");
