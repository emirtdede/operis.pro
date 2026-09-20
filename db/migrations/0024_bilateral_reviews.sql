CREATE TABLE IF NOT EXISTS "engagement_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"engagement_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"author_role" varchar(20) NOT NULL,
	"overall_rating" smallint NOT NULL,
	"communication_rating" smallint NOT NULL,
	"quality_rating" smallint NOT NULL,
	"comment" text NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"endorsed_skills" text[] DEFAULT '{}'::text[] NOT NULL,
	"is_revealed" boolean DEFAULT false NOT NULL,
	"revealed_at" timestamp with time zone,
	"review_window_expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_overall_rating_chk" CHECK (overall_rating >= 1 AND overall_rating <= 5),
	CONSTRAINT "reviews_comm_rating_chk" CHECK (communication_rating >= 1 AND communication_rating <= 5),
	CONSTRAINT "reviews_quality_rating_chk" CHECK (quality_rating >= 1 AND quality_rating <= 5)
);--> statement-breakpoint

ALTER TABLE "engagement_reviews" ADD CONSTRAINT "engagement_reviews_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_reviews" ADD CONSTRAINT "engagement_reviews_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_reviews" ADD CONSTRAINT "engagement_reviews_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "reviews_engagement_author_unique_idx" ON "engagement_reviews" USING btree ("engagement_id", "author_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_recipient_revealed_idx" ON "engagement_reviews" USING btree ("recipient_user_id", "is_revealed", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_author_revealed_idx" ON "engagement_reviews" USING btree ("author_user_id", "is_revealed", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_engagement_idx" ON "engagement_reviews" USING btree ("engagement_id");
