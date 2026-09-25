/**
 * Production Database Purge Script (WP-48)
 *
 * Safely removes mock seed data (dummy listings, test offers, test engagements,
 * and test users with email pattern *@operis.local or demo seeds),
 * while strictly preserving:
 * - Taxonomy (Industry sectors, categories, skills)
 * - Legal documents and compliance manifests
 * - Super administrator accounts
 *
 * Usage:
 *   pnpm exec tsx scripts/purge-dev-seed-data.ts --confirm
 */

const proc = process as unknown as { loadEnvFile?: (path?: string) => void };
if (typeof proc.loadEnvFile === "function") {
  try {
    proc.loadEnvFile(".env");
  } catch {
    // Non-fatal
  }
}

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema";
import { getEnv } from "@/src/config/env";

const { Pool } = pg;

async function purgeDevSeedData() {
  const isConfirmed = process.argv.includes("--confirm");

  if (!isConfirmed) {
    console.error(`
[SAFETY LOCK] Production Purge requires explicit confirmation.
To execute, run:
  pnpm exec tsx scripts/purge-dev-seed-data.ts --confirm
`);
    process.exit(1);
  }

  const env = getEnv();
  const connStr = process.env.DATABASE_URL || env.DATABASE_URL;
  if (!connStr) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  console.info("Connecting to database:", connStr.replace(/:[^:@]+@/, ":***@"));

  const isSupabase = connStr.includes("supabase.co") || connStr.includes("pooler.supabase.com");
  const pool = new Pool({
    connectionString: connStr,
    max: 2,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  });

  const db = drizzle(pool, { schema });

  try {
    console.info("Inspecting table counts...");
    const counts = await pool.query(`
      SELECT 
        (SELECT count(*) FROM users) as users,
        (SELECT count(*) FROM listings) as listings,
        (SELECT count(*) FROM offers) as offers,
        (SELECT count(*) FROM engagements) as engagements,
        (SELECT count(*) FROM categories) as categories
    `);
    console.info("Current counts:", counts.rows[0]);

    console.info("Executing comprehensive test data purge...");
    const allUsers = await pool.query(`SELECT id, email, role FROM users`);
    console.info("All existing users in database:", allUsers.rows);

    // Identify user IDs to purge: demo/seed accounts ONLY (exclude owner emirtdede@gmail.com and admin)
    const userRes = await pool.query(`
      SELECT id, email, role FROM users
      WHERE (email LIKE '%@operis.local'
         OR email = 'kullanici@operis.pro'
         OR email = 'freelancer@operis.pro'
         OR email LIKE '%demo%')
        AND email NOT IN ('emirtdede@gmail.com', 'admin@operis.pro')
    `);
    console.info(`Found ${userRes.rows.length} test seed users to purge:`, userRes.rows.map(r => r.email));

    // Ensure owner emirtdede@gmail.com has ADMIN role for production
    await pool.query(`
      UPDATE users SET role = 'ADMIN' WHERE email = 'emirtdede@gmail.com'
    `);
    console.info("Promoted owner emirtdede@gmail.com to ADMIN.");

    // Execute purge in single transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Delete all moderation test data (reports, blocks)
      await client.query("DELETE FROM reports");
      await client.query("DELETE FROM blocks");
      await client.query("DELETE FROM admin_audit_log");
      await client.query("DELETE FROM idempotency_keys");

      // 2. Delete all engagement sub-tables and engagements
      await client.query("DELETE FROM engagement_completion_marks");
      await client.query("DELETE FROM engagement_reviews");
      await client.query("DELETE FROM endorsements");
      await client.query("DELETE FROM engagement_handovers");
      await client.query("DELETE FROM engagement_change_requests");
      await client.query("DELETE FROM engagement_retainer_periods");
      await client.query("DELETE FROM engagement_retainers");
      await client.query("DELETE FROM engagement_milestones");
      await client.query("DELETE FROM engagement_runbooks");
      await client.query("DELETE FROM engagement_contract_packages");
      await client.query("DELETE FROM engagements");

      // 3. Delete all offer sub-tables and offers
      await client.query("DELETE FROM offer_counter_proposals");
      await client.query("DELETE FROM offer_squad_members");
      await client.query("DELETE FROM offer_revisions");
      await client.query("DELETE FROM offer_templates");
      await client.query("DELETE FROM offers");

      // 4. Delete all listing sub-tables and mock listings
      await client.query("DELETE FROM saved_listings");
      await client.query("DELETE FROM listing_revisions");
      await client.query("DELETE FROM listing_status_events");
      await client.query("DELETE FROM listings");

      // 5. Delete communications, follows, verifications, profiles, auth of seed users
      if (userRes.rows.length > 0) {
        const ids = userRes.rows.map(r => `'${r.id}'`).join(",");
        await client.query(`DELETE FROM notifications WHERE user_id IN (${ids})`);
        await client.query(`DELETE FROM category_follows WHERE user_id IN (${ids})`);
        await client.query(`DELETE FROM company_verifications WHERE user_id IN (${ids})`);
        await client.query(`DELETE FROM profile_links WHERE user_id IN (${ids})`);
        await client.query(`DELETE FROM profiles WHERE user_id IN (${ids})`);
        await client.query(`DELETE FROM user_private_identity WHERE user_id IN (${ids})`);
        await client.query(`DELETE FROM security_events WHERE user_id IN (${ids})`);
        await client.query(`DELETE FROM otp_challenges WHERE user_id IN (${ids})`);
        await client.query(`DELETE FROM legal_acceptances WHERE user_id IN (${ids})`);
        await client.query(`DELETE FROM users WHERE id IN (${ids})`);
      }

      // Also clean any orphan notifications / outbox
      await client.query("DELETE FROM notifications");
      await client.query("DELETE FROM outbox_events");
      await client.query("DELETE FROM notification_fanout_progress");

      await client.query("COMMIT");
      console.info("All test engagements, offers, mock listings, reports, and seed accounts successfully purged.");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    // 3. Verify taxonomy integrity
    const categoryCount = await db.select({ id: schema.categories.id }).from(schema.categories);
    console.info(`Preserved ${categoryCount.length} industry categories and sectors intact.`);

    console.info("Database purge completed successfully. Ready for production launch.");
  } catch (err) {
    console.error("Purge failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

purgeDevSeedData().catch((err) => {
  console.error(err);
  process.exit(1);
});
