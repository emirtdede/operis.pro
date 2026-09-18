-- Migration 0019: Add preferred_contact_channel and time_zone to profiles table
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "preferred_contact_channel" varchar(30) DEFAULT 'any';
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "time_zone" varchar(60) DEFAULT 'Europe/Istanbul';
