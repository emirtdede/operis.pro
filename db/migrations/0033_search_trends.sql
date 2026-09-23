CREATE TABLE IF NOT EXISTS "search_trends" (
	"id" serial PRIMARY KEY NOT NULL,
	"query" varchar(100) NOT NULL,
	"normalized" varchar(100) NOT NULL,
	"locale" varchar(10) DEFAULT 'tr' NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"last_searched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "search_trends_normalized_unique" UNIQUE("normalized")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "search_trends_normalized_idx" ON "search_trends" USING btree ("normalized");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "search_trends_locale_count_idx" ON "search_trends" USING btree ("locale","count","last_searched_at");
