import type { Client } from "pg";

export interface CatalogEntry {
  kind: string;
  table_name: string;
  name: string;
  definition: string;
}

/** Canonical PostgreSQL definitions, with no row data or connection details. */
export async function readSchemaCatalog(client: Pick<Client, "query">): Promise<CatalogEntry[]> {
  return (
    await client.query<CatalogEntry>(`
    SELECT 'column' AS kind, c.relname AS table_name, a.attname AS name,
      concat(format_type(a.atttypid,a.atttypmod), ';notnull=',a.attnotnull,
        ';default=',coalesce(pg_get_expr(d.adbin,d.adrelid),''),
        ';identity=',a.attidentity,';generated=',a.attgenerated) AS definition
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
    LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
    WHERE n.nspname='public' AND c.relkind='r' AND c.relname<>'__drizzle_migrations'
    UNION ALL
    SELECT 'constraint',c.relname,x.conname,pg_get_constraintdef(x.oid)
    FROM pg_constraint x JOIN pg_class c ON c.oid=x.conrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname<>'__drizzle_migrations'
    UNION ALL
    SELECT 'index',t.relname,c.relname,concat(pg_get_indexdef(i.indexrelid),';valid=',i.indisvalid)
    FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_class t ON t.oid=i.indrelid
    JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' AND t.relname<>'__drizzle_migrations'
    UNION ALL
    SELECT 'trigger',c.relname,t.tgname,pg_get_triggerdef(t.oid)
    FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND NOT t.tgisinternal
    UNION ALL
    SELECT 'function','',p.proname,pg_get_functiondef(p.oid)
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('queue_clerk_security_change','track_signature_storage','allocate_notification_sequence')
    ORDER BY kind,table_name,name
  `)
  ).rows;
}

export function compareSchemaCatalog(expected: CatalogEntry[], actual: CatalogEntry[]): string[] {
  const normalize = (s?: string) => s?.replace(/\r\n/g, "\n");
  const key = (entry: CatalogEntry) => `${entry.kind}:${entry.table_name}.${entry.name}`;
  const remaining = new Map(actual.map((entry) => [key(entry), normalize(entry.definition)]));
  const issues: string[] = [];
  for (const entry of expected) {
    if (remaining.get(key(entry)) !== normalize(entry.definition))
      issues.push(`Catalog mismatch: ${key(entry)}`);
    remaining.delete(key(entry));
  }
  for (const name of remaining.keys()) issues.push(`Unexpected catalog object: ${name}`);
  return issues;
}
