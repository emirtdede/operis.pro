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
    const connString = env.DATABASE_URL;

    // Architecture Audit: Warn if legacy Session Pooler (port 5432) is configured in environment variables
    if (connString.includes("pooler.supabase.com:5432")) {
      console.warn(
        "[Database Architecture Warning] DATABASE_URL is configured with Supabase Session Mode (:5432). " +
          "In serverless production, configure the official Supabase Transaction Pooler URI (:6543) directly in environment variables."
      );
    }

    const isSupabase =
      connString.includes("supabase.co") || connString.includes("pooler.supabase.com");

    const caCert = process.env.SUPABASE_SSL_CA_CERT || process.env.DATABASE_SSL_CA;
    const isProd = process.env.NODE_ENV === "production";
    const explicitReject = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;
    const shouldRejectUnauthorized =
      explicitReject !== undefined
        ? explicitReject === "true"
        : isProd || Boolean(caCert);

    globalForDb.operisDbPool = new Pool({
      connectionString: connString,
      // Section 7 & 18: Serverless target pool max = 1 to prevent connection exhaustion during lambda fan-out
      max: process.env.NODE_ENV === "production" ? 1 : 10,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000,
      ssl: isSupabase
        ? {
            rejectUnauthorized: shouldRejectUnauthorized,
            ca: caCert || undefined,
          }
        : undefined,
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
