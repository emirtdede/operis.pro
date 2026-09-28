import { NextResponse } from "next/server";
import { getDbPool } from "@/src/lib/db";
import { getUpstashRedis } from "@/src/lib/security/upstash";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, string> = {
    database: "unknown",
    upstash: "disabled",
  };

  try {
    const pool = getDbPool();
    // Fast ping query with timeout protection to prevent hanging connection pools
    let dbTimer: NodeJS.Timeout | undefined;
    const dbTimeout = new Promise<never>((_, reject) => {
      dbTimer = setTimeout(
        () => reject(new Error("Database health check timed out (2500ms)")),
        2500
      );
    });
    try {
      await Promise.race([pool.query("SELECT 1"), dbTimeout]);
      checks.database = "healthy";
    } finally {
      if (dbTimer) clearTimeout(dbTimer);
    }

    const redis = getUpstashRedis();
    if (redis) {
      let redisTimer: NodeJS.Timeout | undefined;
      try {
        const redisTimeout = new Promise<never>((_, reject) => {
          redisTimer = setTimeout(() => reject(new Error("Redis ping timed out (2000ms)")), 2000);
        });
        await Promise.race([redis.ping(), redisTimeout]);
        checks.upstash = "healthy";
      } catch {
        checks.upstash = "unreachable";
      } finally {
        if (redisTimer) clearTimeout(redisTimer);
      }
    }

    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        status: "ok",
        service: "operis",
        checks,
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: unknown) {
    console.error("[Health Check Failure]:", err);
    const latencyMs = Date.now() - startTime;
    return NextResponse.json(
      {
        status: "error",
        service: "operis",
        checks,
        latencyMs,
        message: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
