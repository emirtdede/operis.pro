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
    const isSupabase =
      env.DATABASE_URL.includes("supabase.co") || env.DATABASE_URL.includes("pooler.supabase.com");
    globalForDb.operisDbPool = new Pool({
      connectionString: env.DATABASE_URL,
      max: process.env.NODE_ENV === "production" ? 20 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
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
