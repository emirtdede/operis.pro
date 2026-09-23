-- Migration 0032: High-Performance Composite Indexes for Query Acceleration
-- Optimizes notifications, outbox queue, engagements feed, export worker, and security audit log

CREATE INDEX IF NOT EXISTS "notifications_user_created_idx" ON "public"."notifications" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "notifications_user_unread_idx" ON "public"."notifications" ("user_id", "read_at");
CREATE INDEX IF NOT EXISTS "outbox_status_next_attempt_idx" ON "public"."outbox_events" ("status", "next_attempt_at");
CREATE INDEX IF NOT EXISTS "engagements_owner_status_idx" ON "public"."engagements" ("owner_user_id", "status");
CREATE INDEX IF NOT EXISTS "engagements_freelancer_status_idx" ON "public"."engagements" ("freelancer_user_id", "status");
CREATE INDEX IF NOT EXISTS "export_jobs_status_next_attempt_idx" ON "public"."export_jobs" ("status", "next_attempt_at");
CREATE INDEX IF NOT EXISTS "security_events_user_created_idx" ON "public"."security_events" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "security_events_expires_idx" ON "public"."security_events" ("expires_at");
