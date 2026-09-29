import { it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { createIsolatedTestDatabase } from "../helpers/test-database";
import { migrateDatabase } from "@/scripts/migrate";

it("upgrades historical users and notifications without losing rows and covers old writers", async () => {
  const ctx = await createIsolatedTestDatabase({ throughTag: "0038_counter_offer_lookup_index" });
  try {
    const user = randomUUID();
    await ctx.pool.query(
      "INSERT INTO users(id,email,password_hash,auth_version,clerk_user_id) VALUES($1,$2,'hash',3,'old-clerk')",
      [user, `${user}@example.test`]
    );
    await ctx.pool.query(
      "INSERT INTO notifications(user_id,type,payload_json,created_at) SELECT $1,'SECURITY_EVENT','{}','2020-01-01' FROM generate_series(1,120)",
      [user]
    );
    await migrateDatabase({ connectionString: ctx.connectionString });
    const state = await ctx.pool.query("SELECT sessions_invalid_before FROM users WHERE id=$1", [
      user,
    ]);
    expect(state.rows[0].sessions_invalid_before).toBeInstanceOf(Date);
    const jobs = await ctx.pool.query(
      "SELECT auth_version,cutoff FROM clerk_revocation_jobs WHERE user_id=$1",
      [user]
    );
    expect(jobs.rows).toHaveLength(1);
    expect(jobs.rows[0].auth_version).toBe(3);
    const rows = await ctx.pool.query(
      "SELECT stream_sequence FROM notifications WHERE user_id=$1 ORDER BY stream_sequence",
      [user]
    );
    expect(rows.rows.map((r) => r.stream_sequence)).toEqual(
      Array.from({ length: 120 }, (_, i) => String(i + 1))
    );
    const next = await ctx.pool.query(
      "INSERT INTO notifications(user_id,type,payload_json) VALUES($1,'SECURITY_EVENT','{}') RETURNING stream_sequence",
      [user]
    );
    expect(next.rows[0].stream_sequence).toBe("121");
    // Running migrations twice is idempotent.
    await migrateDatabase({ connectionString: ctx.connectionString });
    expect(
      (
        await ctx.pool.query("SELECT count(*)::int n FROM clerk_revocation_jobs WHERE user_id=$1", [
          user,
        ])
      ).rows[0].n
    ).toBe(1);
  } finally {
    await ctx.destroy();
  }
}, 60000);
