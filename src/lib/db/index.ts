import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@/db/schema";
import { getEnv } from "@/src/config/env";

const { Pool } = pg;

const globalForDb = globalThis as unknown as {
  operisDbPool?: pg.Pool;
  operisDbInstance?: ReturnType<typeof drizzle<typeof schema>>;
  shutdownRegistered?: boolean;
};

function registerGracefulShutdown(p: pg.Pool) {
  if (globalForDb.shutdownRegistered) return;
  globalForDb.shutdownRegistered = true;

  const closePool = async () => {
    try {
      await p.end();
    } catch {
      // ignore
    }
  };

  if (
    typeof process !== "undefined" &&
    typeof process.once === "function" &&
    process.env.NODE_ENV === "production"
  ) {
    process.once("SIGTERM", closePool);
    process.once("SIGINT", closePool);
  }
}

export function getDbPool(): pg.Pool {
  if (!globalForDb.operisDbPool) {
    const env = getEnv();
    let connString = env.DATABASE_URL;

    // Supabase Pooler: automatically use Transaction Mode (Port 6543) instead of Session Mode (Port 5432)
    // in serverless production to prevent (EMAXCONNSESSION) pool_size: 15 exhaustion.
    if (connString.includes("pooler.supabase.com:5432")) {
      connString = connString.replace(":5432", ":6543");
    }

    const isSupabase =
      connString.includes("supabase.co") || connString.includes("pooler.supabase.com");

    globalForDb.operisDbPool = new Pool({
      connectionString: connString,
      max: process.env.NODE_ENV === "production" ? 4 : 10,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000,
      ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    });

    // WP-10: Register error listener immediately to prevent unhandled EventEmitter exceptions on idle clients from crashing Node process
    globalForDb.operisDbPool.on("error", (err: Error) => {
      console.error("[Postgres Pool Error] Unexpected idle client error:", err?.message || err);
    });

    registerGracefulShutdown(globalForDb.operisDbPool);
  }
  return globalForDb.operisDbPool;
}

export function getDb() {
  if (!globalForDb.operisDbInstance) {
    const p = getDbPool();
    globalForDb.operisDbInstance = drizzle(p, { schema });
  }
  return globalForDb.operisDbInstance;
}

export function setDbForTesting(mockDb: unknown, testPool?: pg.Pool) {
  globalForDb.operisDbInstance = mockDb as ReturnType<typeof drizzle<typeof schema>>;
  if (testPool) {
    globalForDb.operisDbPool = testPool;
  }
}

export function resetDbForTesting() {
  globalForDb.operisDbInstance = undefined;
  globalForDb.operisDbPool = undefined;
}

export { schema };
export * from "./locks";
export * from "./cancellation";
