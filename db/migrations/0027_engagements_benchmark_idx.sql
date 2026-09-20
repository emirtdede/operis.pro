-- 0027_engagements_benchmark_idx.sql
-- Optimizes 30-day market rate benchmark lookups over accepted engagements

CREATE INDEX IF NOT EXISTS "idx_engagements_benchmark" 
ON "engagements" ("status", "matched_at");
