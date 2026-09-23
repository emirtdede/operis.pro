import crypto from "node:crypto";
import pg from "pg";
import path from "node:path";
import fs from "node:fs";
import { getEnv } from "@/src/config/env";

const { Client } = pg;

export interface MigrateDatabaseOptions {
  connectionString: string;
  schemaName?: string;
  throughTag?: string;
  migrationsFolder?: string;
}

export interface MigrationHistoryInspectionResult {
  hasDrizzleSchemaTable: boolean;
  hasTargetSchemaTable: boolean;
  appliedTimestamps: Set<number>;
  appliedHashes: Set<string>;
  tablesToUpdate: Array<{ schema: string; table: string }>;
}

export async function inspectMigrationHistory(
  client: { query: <T = unknown>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }> },
  targetSchema: string
): Promise<MigrationHistoryInspectionResult> {
  const drizzleCheckRes = await client.query<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'
    ) as exists;
  `);
  const hasDrizzleSchemaTable = Boolean(drizzleCheckRes.rows[0]?.exists);

  const targetCheckRes = await client.query<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = $1 AND table_name = '__drizzle_migrations'
    ) as exists;
  `,
    [targetSchema]
  );
  const hasTargetSchemaTable = Boolean(targetCheckRes.rows[0]?.exists);

  const appliedTimestamps = new Set<number>();
  const appliedHashes = new Set<string>();
  const tablesToUpdate: Array<{ schema: string; table: string }> = [];

  if (hasDrizzleSchemaTable && hasTargetSchemaTable) {
    const drizzleRows = (
      await client.query<{ created_at: string | number; hash: string }>(
        `SELECT created_at, hash FROM "drizzle"."__drizzle_migrations";`
      )
    ).rows;
    const targetRows = (
      await client.query<{ created_at: string | number; hash: string }>(
        `SELECT created_at, hash FROM "${targetSchema}"."__drizzle_migrations";`
      )
    ).rows;

    const drizzleByTime = new Map<number, string>();
    for (const r of drizzleRows) {
      if (r.created_at) {
        const ts = Number(r.created_at);
        appliedTimestamps.add(ts);
        drizzleByTime.set(ts, r.hash);
      }
      if (r.hash) appliedHashes.add(r.hash);
    }
    for (const r of targetRows) {
      if (r.created_at) {
        const ts = Number(r.created_at);
        appliedTimestamps.add(ts);
        const dHash = drizzleByTime.get(ts);
        if (dHash && r.hash && dHash !== r.hash && targetSchema !== "drizzle") {
          throw new Error(
            `Migration history conflict: drizzle and ${targetSchema} migration tables disagree on timestamp ${ts} ('${dHash}' vs '${r.hash}')`
          );
        }
      }
      if (r.hash) appliedHashes.add(r.hash);
    }

    tablesToUpdate.push({ schema: "drizzle", table: "__drizzle_migrations" });
    if (targetSchema !== "drizzle") {
      tablesToUpdate.push({ schema: targetSchema, table: "__drizzle_migrations" });
    }
  } else if (hasDrizzleSchemaTable) {
    const drizzleRows = (
      await client.query<{ created_at: string | number; hash: string }>(
        `SELECT created_at, hash FROM "drizzle"."__drizzle_migrations";`
      )
    ).rows;
    for (const r of drizzleRows) {
      if (r.created_at) appliedTimestamps.add(Number(r.created_at));
      if (r.hash) appliedHashes.add(r.hash);
    }
    tablesToUpdate.push({ schema: "drizzle", table: "__drizzle_migrations" });
  } else if (hasTargetSchemaTable) {
    const targetRows = (
      await client.query<{ created_at: string | number; hash: string }>(
        `SELECT created_at, hash FROM "${targetSchema}"."__drizzle_migrations";`
      )
    ).rows;
    for (const r of targetRows) {
      if (r.created_at) appliedTimestamps.add(Number(r.created_at));
      if (r.hash) appliedHashes.add(r.hash);
    }
    tablesToUpdate.push({ schema: targetSchema, table: "__drizzle_migrations" });
  }

  return {
    hasDrizzleSchemaTable,
    hasTargetSchemaTable,
    appliedTimestamps,
    appliedHashes,
    tablesToUpdate,
  };
}

export async function migrateDatabase(options: MigrateDatabaseOptions): Promise<void> {
  const migrationsFolder = options.migrationsFolder || path.resolve(process.cwd(), "db/migrations");
  const journalPath = path.join(migrationsFolder, "meta/_journal.json");

  if (!fs.existsSync(journalPath)) {
    throw new Error(`Migration journal not found at ${journalPath}`);
  }

  const journalRaw = fs.readFileSync(journalPath, "utf8");
  const journal = JSON.parse(journalRaw) as {
    entries: Array<{ idx: number; tag: string; when: number }>;
  };
  const journalTags = new Set(journal.entries.map((e) => e.tag));

  const diskFiles = fs
    .readdirSync(migrationsFolder)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => f.replace(/\.sql$/, ""));

  const missingInJournal = diskFiles.filter((f) => !journalTags.has(f));
  if (missingInJournal.length > 0) {
    throw new Error(
      `Migration integrity check failed: Disk files missing from _journal.json: ${missingInJournal.join(", ")}`
    );
  }

  // Pre-validate throughTag if specified
  if (options.throughTag) {
    const throughTag = options.throughTag;
    const hasMatchingThroughTag = journal.entries.some(
      (e) =>
        e.tag === throughTag ||
        e.tag.startsWith(throughTag) ||
        e.tag.startsWith(`${throughTag}_`)
    );
    if (!hasMatchingThroughTag) {
      throw new Error(
        `Unknown throughTag: "${options.throughTag}". Available tags in journal: ${journal.entries.map((e) => e.tag).join(", ")}`
      );
    }
  }

  const isSupabase =
    options.connectionString.includes("supabase.co") ||
    options.connectionString.includes("pooler.supabase.com");

  const client = new Client({
    connectionString: options.connectionString,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    statement_timeout: 60000,
  });

  await client.connect();

  try {
    const targetSchema = options.schemaName || "public";

    if (options.schemaName) {
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${targetSchema}";`);
      await client.query(`SET search_path TO "${targetSchema}", public;`);
    }

    // Ensure standard compatibility roles (anon, authenticated, service_role) exist for Postgres environments (CI / local Docker / non-Supabase)
    await client.query(`
      DO $$
      BEGIN
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
            CREATE ROLE anon NOLOGIN;
          END IF;
        EXCEPTION WHEN duplicate_object OR insufficient_privilege THEN
          NULL;
        END;

        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
            CREATE ROLE authenticated NOLOGIN;
          END IF;
        EXCEPTION WHEN duplicate_object OR insufficient_privilege THEN
          NULL;
        END;

        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
            CREATE ROLE service_role NOLOGIN;
          END IF;
        EXCEPTION WHEN duplicate_object OR insufficient_privilege THEN
          NULL;
        END;
      END $$;
    `);

    const history = await inspectMigrationHistory(client, targetSchema);
    const appliedTimestamps = history.appliedTimestamps;
    const appliedHashes = history.appliedHashes;
    const tablesToUpdate = [...history.tablesToUpdate];

    if (tablesToUpdate.length === 0) {
      if (targetSchema === "public") {
        await client.query(`CREATE SCHEMA IF NOT EXISTS "drizzle";`);
        await client.query(`
          CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
            id SERIAL PRIMARY KEY,
            hash text NOT NULL,
            created_at bigint
          );
        `);
        tablesToUpdate.push({ schema: "drizzle", table: "__drizzle_migrations" });
      } else {
        await client.query(`
          CREATE TABLE IF NOT EXISTS "${targetSchema}"."__drizzle_migrations" (
            id SERIAL PRIMARY KEY,
            hash text NOT NULL,
            created_at bigint
          );
        `);
        tablesToUpdate.push({ schema: targetSchema, table: "__drizzle_migrations" });
      }
    }

    // Pre-DDL Validation: Verify migration history consistency, tampering, and sequence gaps before running DDL
    let seenUnapplied = false;
    for (const entry of journal.entries) {
      const sqlFilePath = path.join(migrationsFolder, `${entry.tag}.sql`);
      if (!fs.existsSync(sqlFilePath)) {
        throw new Error(`Migration SQL file not found: ${sqlFilePath}`);
      }

      const sqlContent = fs.readFileSync(sqlFilePath, "utf8");
      const sqlHash = crypto.createHash("sha256").update(sqlContent).digest("hex");

      const isApplied =
        appliedTimestamps.has(entry.when) ||
        appliedHashes.has(entry.tag) ||
        appliedHashes.has(sqlHash);

      if (
        appliedTimestamps.has(entry.when) &&
        !appliedHashes.has(entry.tag) &&
        !appliedHashes.has(sqlHash)
      ) {
        throw new Error(
          `Migration history conflict: Migration '${entry.tag}' (${entry.when}) timestamp exists in database but with a conflicting hash.`
        );
      }

      if (isApplied && seenUnapplied && !options.throughTag) {
        throw new Error(
          `Migration sequence gap: Migration '${entry.tag}' is recorded as applied, but earlier migration in sequence is unapplied.`
        );
      }

      if (!isApplied) {
        seenUnapplied = true;
      }
    }

    let reachedThroughTag = false;

    async function applyEntry(i: number): Promise<void> {
      if (i >= journal.entries.length || reachedThroughTag) return;
      const entry = journal.entries[i];
      if (!entry) return;

      const isTargetThroughTag =
        options.throughTag &&
        (entry.tag === options.throughTag ||
          entry.tag.startsWith(options.throughTag) ||
          entry.tag.startsWith(`${options.throughTag}_`));

      const sqlFilePath = path.join(migrationsFolder, `${entry.tag}.sql`);
      if (!fs.existsSync(sqlFilePath)) {
        throw new Error(`Migration SQL file not found: ${sqlFilePath}`);
      }

      const sqlContent = fs.readFileSync(sqlFilePath, "utf8");
      const sqlHash = crypto.createHash("sha256").update(sqlContent).digest("hex");

      if (
        appliedTimestamps.has(entry.when) ||
        appliedHashes.has(entry.tag) ||
        appliedHashes.has(sqlHash)
      ) {
        if (isTargetThroughTag) {
          reachedThroughTag = true;
        }
        await applyEntry(i + 1);
        return;
      }

      const entryWhen = entry.when;
      const entryTag = entry.tag;

      // Execute migration file in atomic transaction
      await client.query("BEGIN;");
      try {
        if (options.schemaName) {
          await client.query(`SET search_path TO "${targetSchema}", public;`);
        }
        await client.query(sqlContent);

        async function insertTableMeta(tableIdx: number): Promise<void> {
          if (tableIdx >= tablesToUpdate.length) return;
          const t = tablesToUpdate[tableIdx];
          if (t) {
            await client.query(
              `INSERT INTO "${t.schema}"."${t.table}" (hash, created_at) VALUES ($1, $2);`,
              [sqlHash, entryWhen]
            );
          }
          await insertTableMeta(tableIdx + 1);
        }
        await insertTableMeta(0);

        await client.query("COMMIT;");

        appliedTimestamps.add(entryWhen);
        appliedHashes.add(sqlHash);
        appliedHashes.add(entryTag);
      } catch (migrationErr) {
        await client.query("ROLLBACK;");
        throw new Error(
          `Migration ${entryTag} failed and was rolled back: ${migrationErr instanceof Error ? migrationErr.message : String(migrationErr)}`,
          { cause: migrationErr }
        );
      }

      if (isTargetThroughTag) {
        reachedThroughTag = true;
      }

      await applyEntry(i + 1);
    }

    await applyEntry(0);
  } finally {
    await client.end();
  }
}

async function runCliMigrations() {
  const proc = process as unknown as { loadEnvFile?: (path?: string) => void };
  if (typeof proc.loadEnvFile === "function") {
    try {
      proc.loadEnvFile(".env");
    } catch {
      // Non-fatal
    }
  }

  const env = getEnv();
  const connectionString =
    process.env.DATABASE_URL || env.DATABASE_MIGRATION_URL || env.DATABASE_URL;
  console.info("Running database migrations on:", connectionString.replace(/:[^:@]+@/, ":***@"));

  try {
    await migrateDatabase({ connectionString });
    console.info("Migrations applied successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

// Auto-run CLI only when directly executed
if (
  process.argv[1] &&
  (process.argv[1].endsWith("scripts/migrate.ts") ||
    process.argv[1].endsWith("scripts\\migrate.ts"))
) {
  runCliMigrations();
}
