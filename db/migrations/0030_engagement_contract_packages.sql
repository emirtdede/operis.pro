-- Migration 0030: Engagement Contract Packages (Unified Single-Sign Hub & Ephemeral Storage)
CREATE TABLE IF NOT EXISTS "engagement_contract_packages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "engagement_id" uuid NOT NULL REFERENCES "engagements"("id") ON DELETE CASCADE,
  "selected_contracts" jsonb NOT NULL DEFAULT '["CORE_SERVICE"]'::jsonb,
  "status" varchar(30) NOT NULL DEFAULT 'DRAFT',
  "client_signer_user_id" uuid REFERENCES "users"("id"),
  "client_signer_name" varchar(120),
  "client_signed_at" timestamp with time zone,
  "client_ip_hash" varchar(64),
  "client_signature_r2_key" text,
  "client_signature_data_url" text,
  "freelancer_signer_user_id" uuid REFERENCES "users"("id"),
  "freelancer_signer_name" varchar(120),
  "freelancer_signed_at" timestamp with time zone,
  "freelancer_ip_hash" varchar(64),
  "freelancer_signature_r2_key" text,
  "freelancer_signature_data_url" text,
  "compiled_markdown" text,
  "compiled_html" text,
  "sha256_seal" varchar(64),
  "signed_at" timestamp with time zone,
  "ephemeral_cleaned_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_contract_packages_engagement" ON "engagement_contract_packages" ("engagement_id");
CREATE INDEX IF NOT EXISTS "idx_contract_packages_status" ON "engagement_contract_packages" ("status");
