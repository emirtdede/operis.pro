import pg from "pg";
import { writeFileSync } from "node:fs";
import { createIsolatedTestDatabase } from "../tests/helpers/test-database";
import { readSchemaCatalog } from "./lib/schema-catalog";

// Always regenerate from the journal in a newly created, owned test database.
// Never capture a production database's drift as the desired state.
const database = await createIsolatedTestDatabase();
const client = new pg.Client({ connectionString: database.connectionString });
try {
  await client.connect();
  const catalog = await readSchemaCatalog(client);
  writeFileSync("db/migrations/meta/schema-catalog.json", JSON.stringify(catalog, null, 2) + "\n");
  console.info(
    `Captured ${catalog.length} schema definitions from a fresh migrated test database.`
  );
} finally {
  await client.end();
  await database.destroy();
}
