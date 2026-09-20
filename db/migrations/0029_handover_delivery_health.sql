-- Migration 0029: Add delivery_health jsonb column to engagement_handovers for Proof-of-Work Uptime Inspection
ALTER TABLE "engagement_handovers" ADD COLUMN IF NOT EXISTS "delivery_health" jsonb;
