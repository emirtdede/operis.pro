DROP INDEX "idx_engagement_change_requests_seq";--> statement-breakpoint
DROP INDEX "idx_engagement_milestones_seq";--> statement-breakpoint
ALTER TABLE "company_verifications" ADD COLUMN "proof_document_url" text;--> statement-breakpoint
ALTER TABLE "company_verifications" ADD COLUMN "authorized_title" varchar(100);--> statement-breakpoint
ALTER TABLE "engagement_retainer_periods" ADD COLUMN "work_logs_json" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "engagement_retainers" ADD COLUMN "effective_cancellation_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_engagement_change_requests_pending" ON "engagement_change_requests" USING btree ("engagement_id") WHERE "engagement_change_requests"."status" = 'PENDING';--> statement-breakpoint
CREATE UNIQUE INDEX "idx_engagement_retainer_periods_unique" ON "engagement_retainer_periods" USING btree ("retainer_id","period_index");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_engagement_change_requests_seq" ON "engagement_change_requests" USING btree ("engagement_id","sequence_number");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_engagement_milestones_seq" ON "engagement_milestones" USING btree ("engagement_id","sequence_number");