import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isTable, getTableName } from "drizzle-orm";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import type { Client } from "pg";
import { readSchemaCatalog, compareSchemaCatalog, type CatalogEntry } from "./schema-catalog";

export function normalizeSqlType(value: string): string {
  return value
    .toLowerCase()
    .replace(/character varying/g, "varchar")
    .replace(/character\(/g, "char(")
    .replace(/timestamp without time zone/g, "timestamp")
    .replace(/timestamp with time zone/g, "timestamptz")
    .replace(/bigserial/g, "bigint")
    .replace(/\bserial\b/g, "integer")
    .replace(/\s+/g, "");
}

/** Read-only audit against both the Drizzle model and a freshly migrated catalog baseline. */
export async function auditSchema(
  client: Pick<Client, "query">,
  schema: Record<string, unknown>,
  folder: string
) {
  const issues: string[] = [];
  const columns = (
    await client.query<{
      table_name: string;
      column_name: string;
      sql_type: string;
      not_null: boolean;
    }>(`
    SELECT c.relname AS table_name, a.attname AS column_name,
      format_type(a.atttypid, a.atttypmod) AS sql_type, a.attnotnull AS not_null
    FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND a.attnum>0 AND NOT a.attisdropped
  `)
  ).rows;
  const constraints = (
    await client.query<{ table_name: string; name: string; valid: boolean; definition: string }>(`
    SELECT c.relname AS table_name, x.conname AS name, x.convalidated AS valid, pg_get_constraintdef(x.oid) AS definition
    FROM pg_constraint x JOIN pg_class c ON c.oid=x.conrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'
  `)
  ).rows;
  const indexes = (
    await client.query<{ table_name: string; name: string; valid: boolean; unique: boolean }>(`
    SELECT t.relname AS table_name, c.relname AS name, i.indisvalid AS valid, i.indisunique AS unique
    FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_class t ON t.oid=i.indrelid
    JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public'
  `)
  ).rows;
  for (const table of Object.values(schema)) {
    if (!isTable(table)) continue;
    const config = getTableConfig(table as PgTable);
    for (const col of config.columns) {
      const actual = columns.find(
        (c) => c.table_name === config.name && c.column_name === col.name
      );
      const label = `${config.name}.${col.name}`;
      if (!actual) {
        issues.push(`Missing column: ${label}`);
        continue;
      }
      if (normalizeSqlType(actual.sql_type) !== normalizeSqlType(col.getSQLType()))
        issues.push(`Type mismatch: ${label} (${actual.sql_type} != ${col.getSQLType()})`);
      if (actual.not_null !== col.notNull) issues.push(`Nullability mismatch: ${label}`);
    }
    const list = (cols: { name: string }[]) => cols.map((c) => c.name).join(",");
    const expected = [
      ...config.foreignKeys.map((fk) => {
        const ref = fk.reference();
        return (
          "FOREIGN KEY (" +
          list(ref.columns) +
          ") REFERENCES " +
          getTableName(ref.foreignTable) +
          "(" +
          list(ref.foreignColumns) +
          ") ON UPDATE " +
          (fk.onUpdate || "no action") +
          " ON DELETE " +
          (fk.onDelete || "no action")
        );
      }),
      ...config.primaryKeys.map((pk) => "PRIMARY KEY (" + list(pk.columns) + ")"),
      ...config.uniqueConstraints.map(
        (u) =>
          "UNIQUE " +
          (u.nullsNotDistinct ? "NULLS NOT DISTINCT " : "") +
          "(" +
          list(u.columns) +
          ")"
      ),
      ...config.columns
        .filter((c) => c.isUnique)
        .map(
          (c) =>
            "UNIQUE " +
            (c.uniqueType === "not distinct" ? "NULLS NOT DISTINCT " : "") +
            "(" +
            c.name +
            ")"
        ),
      ...(config.columns.some((c) => c.primary)
        ? ["PRIMARY KEY (" + list(config.columns.filter((c) => c.primary)) + ")"]
        : []),
    ];
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .replace(/"/g, "")
        .replace(/public\./g, "")
        .replace(/on (delete|update) no action/g, "")
        .replace(/\s+/g, "");
    for (const definition of expected) {
      if (
        !constraints.some(
          (c) =>
            c.table_name === config.name &&
            c.valid &&
            normalize(c.definition) === normalize(definition)
        )
      )
        issues.push("Missing/changed constraint: " + config.name + ": " + definition);
    }
    for (const check of config.checks) {
      // This historical migration used PostgreSQL's inline-check name.
      const name =
        config.name === "maintenance_identity" &&
        check.name === "maintenance_identity_singleton_check"
          ? "maintenance_identity_is_singleton_check"
          : check.name;
      if (
        !constraints.some(
          (c) => c.table_name === config.name && c.valid && [check.name, name].includes(c.name)
        )
      )
        issues.push("Missing/unvalidated check: " + config.name + "." + check.name);
    }
    for (const { config: index } of config.indexes) {
      if (
        !indexes.some(
          (i) =>
            i.table_name === config.name &&
            i.name === index.name &&
            i.valid &&
            i.unique === index.unique
        )
      )
        issues.push(`Missing/invalid index: ${config.name}.${index.name}`);
    }
  }
  const journal = JSON.parse(readFileSync(join(folder, "meta/_journal.json"), "utf8")) as {
    entries: { tag: string; when: number }[];
  };
  const histories = (
    await client.query<{ schema: string }>(`
    SELECT table_schema AS schema FROM information_schema.tables
    WHERE table_name='__drizzle_migrations' AND table_schema IN ('public', 'drizzle')
  `)
  ).rows;
  if (!histories.length) issues.push("Migration history is missing");
  for (const history of histories) {
    if (!["public", "drizzle"].includes(history.schema))
      throw new Error("Unexpected migration schema");
    const rows = (
      await client.query<{ hash: string; created_at: string }>(
        `SELECT hash, created_at FROM "${history.schema}"."__drizzle_migrations"`
      )
    ).rows;
    for (const entry of journal.entries) {
      const hash = createHash("sha256")
        .update(readFileSync(join(folder, entry.tag + ".sql"), "utf8"))
        .digest("hex");
      if (!rows.some((r) => Number(r.created_at) === entry.when && r.hash === hash))
        issues.push(`Missing/changed migration: ${history.schema}.${entry.tag}`);
    }
    if (rows.some((r) => !journal.entries.some((e) => e.when === Number(r.created_at))))
      issues.push(`Unknown migration in ${history.schema}`);
  }
  const baseline = JSON.parse(
    readFileSync(join(folder, "meta/schema-catalog.json"), "utf8")
  ) as CatalogEntry[];
  issues.push(...compareSchemaCatalog(baseline, await readSchemaCatalog(client)));
  return issues;
}
