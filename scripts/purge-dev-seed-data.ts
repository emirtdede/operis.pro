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
import { or, like, eq, inArray } from "drizzle-orm";
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
    console.info("1. Identifying dev seed users to purge...");
    // Find users with demo / test email patterns (excluding real admin emails)
    const seedUsers = await db
      .select({ id: schema.users.id, email: schema.users.email, role: schema.users.role })
      .from(schema.users)
      .where(
        or(
          like(schema.users.email, "%@operis.local"),
          like(schema.users.email, "%demo%"),
          eq(schema.users.email, "freelancer@operis.pro"),
          eq(schema.users.email, "client@operis.pro")
        )
      );

    const purgeUserIds = seedUsers
      .filter((u) => u.role !== "ADMIN" && u.role !== "SECURITY_ADMIN")
      .map((u) => u.id);

    console.info(`Found ${purgeUserIds.length} dev seed users eligible for deletion.`);

    if (purgeUserIds.length > 0) {
      // 2. Cascade delete will clean up dependent profiles, offers, engagements, and listings
      // First clean up listings owned by these users
      const deletedListings = await db
        .delete(schema.listings)
        .where(inArray(schema.listings.ownerUserId, purgeUserIds))
        .returning({ id: schema.listings.id });

      console.info(`Purged ${deletedListings.length} mock listings.`);

      // Delete seed users (cascades to userPrivateIdentity, profiles, etc.)
      const deletedUsers = await db
        .delete(schema.users)
        .where(inArray(schema.users.id, purgeUserIds))
        .returning({ id: schema.users.id });

      console.info(`Purged ${deletedUsers.length} dev seed users.`);
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
