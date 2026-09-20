-- Migration 0020: Add roles, headline, is_available_for_hire, is_actively_hiring to profiles table
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "headline" varchar(140);
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "roles" text[] DEFAULT '{}'::text[] NOT NULL;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "is_available_for_hire" boolean DEFAULT true NOT NULL;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "is_actively_hiring" boolean DEFAULT false NOT NULL;
