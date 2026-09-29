import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createIsolatedTestDatabase, type TestDatabaseContext } from "../helpers/test-database";
import { auditSchema } from "../../scripts/lib/schema-audit";
import * as schema from "../../db/schema";
import path from "node:path";

describe("Read-only schema audit against migrated PostgreSQL", () => {
  let context: TestDatabaseContext;
  beforeAll(async () => {
    context = await createIsolatedTestDatabase();
  }, 60000);
  afterAll(async () => {
    if (context) await context.destroy();
  });
  it("accepts a database created from the migration journal", async () => {
    const client = await context.pool.connect();
    try {
      expect(await auditSchema(client, schema, path.resolve("db/migrations"))).toEqual([]);
    } finally {
      client.release();
    }
  });
  it.each([
    ["ALTER TABLE users ALTER COLUMN email TYPE varchar(999)", "Type mismatch"],
    ["ALTER TABLE users ALTER COLUMN email DROP NOT NULL", "Nullability mismatch"],
    ["DROP INDEX offer_counter_proposals_offer_idx", "Missing/invalid index"],
    [
      "DROP INDEX offer_counter_proposals_offer_idx; CREATE INDEX offer_counter_proposals_offer_idx ON offer_counter_proposals(round)",
      "Catalog mismatch",
    ],
    ["ALTER TABLE users ALTER COLUMN auth_version SET DEFAULT 2", "Catalog mismatch"],
    [
      "ALTER TABLE maintenance_identity DROP CONSTRAINT maintenance_identity_is_singleton_check; ALTER TABLE maintenance_identity ADD CONSTRAINT maintenance_identity_is_singleton_check CHECK (is_singleton IS NOT NULL)",
      "Catalog mismatch",
    ],
    [
      "ALTER TABLE offers DROP CONSTRAINT offers_current_turn_user_id_users_id_fk",
      "Missing/changed constraint",
    ],
    ["UPDATE drizzle.__drizzle_migrations SET hash='tampered'", "Missing/changed migration"],
    ["DROP TRIGGER users_security_change ON users", "Catalog mismatch"],
    ["DROP TRIGGER contract_signature_storage ON engagement_contract_packages", "Catalog mismatch"],
    ["DROP TRIGGER notifications_assign_sequence ON notifications", "Catalog mismatch"],
  ])("detects drift and leaves the database unchanged: %s", async (sql, message) => {
    const client = await context.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      expect(
        (await auditSchema(client, schema, path.resolve("db/migrations"))).join("\n")
      ).toContain(message);
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  });
});
