import { sql } from "drizzle-orm";
import { getDb } from "@/src/lib/db";

export async function getReliabilityHealth() {
  const result = await getDb().execute<{ dead_count: number; oldest_seconds: number }>(sql`
    SELECT count(*) FILTER (WHERE status='DEAD')::int AS dead_count,
      coalesce(max(extract(epoch FROM now()-next_attempt_at)) FILTER
        (WHERE status IN ('PENDING','PROCESSING','UPLOADING')),0)::int AS oldest_seconds
    FROM (SELECT status,next_attempt_at FROM clerk_revocation_jobs
      UNION ALL SELECT status,next_attempt_at FROM signature_storage_jobs) jobs`);
  return {
    deadCount: result.rows[0]?.dead_count || 0,
    oldestPendingSeconds: Math.max(0, result.rows[0]?.oldest_seconds || 0),
  };
}
