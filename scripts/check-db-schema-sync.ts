const proc = process as unknown as { loadEnvFile?: (path?: string) => void };
if (typeof proc.loadEnvFile === "function") {
  try {
    proc.loadEnvFile(".env");
  } catch {
    // Non-fatal
  }
  try {
    proc.loadEnvFile(".env.local");
  } catch {
    // Non-fatal
  }
}

import pg from "pg";
import { isTable, getTableColumns, getTableName } from "drizzle-orm";
import * as schema from "../db/schema";
import { getEnv } from "../src/config/env";

const { Client } = pg;

interface SchemaColumnMatch {
  tableName: string;
  columnName: string;
}

async function runSchemaSyncCheck(): Promise<void> {
  const env = getEnv();
  const client = new Client({ connectionString: env.DATABASE_URL });

  try {
    await client.connect();
    console.info("🔍 Checking Drizzle schema parity against live PostgreSQL database...");

    // 1. Fetch all existing tables and columns in 'public' schema
    const dbColsRes = await client.query<{ table_name: string; column_name: string }>(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public';
    `);

    const dbTablesRes = await client.query<{ table_name: string }>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);

    const existingTables = new Set<string>(dbTablesRes.rows.map((r) => r.table_name));
    const existingColumns = new Set<string>(
      dbColsRes.rows.map((r) => `${r.table_name}.${r.column_name}`)
    );

    // 2. Inspect all Drizzle schema tables
    const missingTables: string[] = [];
    const missingColumns: SchemaColumnMatch[] = [];
    let totalCheckedTables = 0;
    let totalCheckedColumns = 0;

    for (const value of Object.values(schema)) {
      if (isTable(value)) {
        totalCheckedTables++;
        const tableName = getTableName(value);

        if (!existingTables.has(tableName)) {
          missingTables.push(tableName);
          continue;
        }

        const columns = getTableColumns(value);
        for (const colDef of Object.values(columns)) {
          totalCheckedColumns++;
          const colName = colDef.name;
          const fullColRef = `${tableName}.${colName}`;

          if (!existingColumns.has(fullColRef)) {
            missingColumns.push({ tableName, columnName: colName });
          }
        }
      }
    }

    console.info(`📊 Inspected ${totalCheckedTables} tables and ${totalCheckedColumns} columns in Drizzle schema.`);

    // 3. Report findings
    if (missingTables.length > 0 || missingColumns.length > 0) {
      console.error("\n❌ DATABASE SCHEMA DRIFT DETECTED!");
      if (missingTables.length > 0) {
        console.error(`\nMissing Tables in Database (${missingTables.length}):`);
        for (const tbl of missingTables) {
          console.error(`  - Table '${tbl}' exists in TypeScript schema but NOT in live database.`);
        }
      }

      if (missingColumns.length > 0) {
        console.error(`\nMissing Columns in Database (${missingColumns.length}):`);
        for (const col of missingColumns) {
          console.error(`  - Column '${col.tableName}.${col.columnName}' exists in TypeScript schema but NOT in live database.`);
        }
      }

      console.error("\n💡 REMEDY:");
      console.error("  Run 'pnpm db:generate' to generate migration SQL, then 'pnpm db:migrate' to apply it.\n");
      process.exit(1);
    }

    console.info("✅ All Drizzle schema tables and columns are 100% in sync with live PostgreSQL database!\n");
  } catch (err) {
    console.error("❌ Failed to connect to database or execute schema check:", err);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

runSchemaSyncCheck();
