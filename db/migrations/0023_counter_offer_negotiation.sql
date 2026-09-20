ALTER TABLE "offers" ADD COLUMN "is_countered" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "current_turn_user_id" uuid;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "counter_round" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "active_counter_proposal_id" uuid;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_current_turn_user_id_users_id_fk" FOREIGN KEY ("current_turn_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "offer_counter_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"round" integer NOT NULL,
	"proposer_user_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"budget_currency" char(3) NOT NULL,
	"budget_min" numeric(18, 2) NOT NULL,
	"budget_max" numeric(18, 2) NOT NULL,
	"estimated_duration_value" integer NOT NULL,
	"estimated_duration_unit" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);--> statement-breakpoint

ALTER TABLE "offer_counter_proposals" ADD CONSTRAINT "offer_counter_proposals_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_counter_proposals" ADD CONSTRAINT "offer_counter_proposals_proposer_user_id_users_id_fk" FOREIGN KEY ("proposer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_counter_proposals" ADD CONSTRAINT "offer_counter_proposals_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "counter_proposals_offer_round_idx" ON "offer_counter_proposals" USING btree ("offer_id", "round");--> statement-breakpoint
CREATE INDEX "counter_proposals_status_idx" ON "offer_counter_proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "counter_proposals_expires_idx" ON "offer_counter_proposals" USING btree ("expires_at");
