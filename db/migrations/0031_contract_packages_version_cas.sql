-- Migration 0031: Engagement Contract Packages Version CAS & Tamper Invalidation
ALTER TABLE "engagement_contract_packages" ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1;
ALTER TABLE "engagement_contract_packages" ADD COLUMN IF NOT EXISTS "tamper_reset_count" integer NOT NULL DEFAULT 0;
