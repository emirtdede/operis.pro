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

import { getDbPool } from "../src/lib/db";

interface ConcurrencyResult {
  concurrency: number;
  requests: number;
  success: number;
  failure: number;
  p50: number;
  p95: number;
  p99: number;
  dbErrors: string;
}

function calculatePercentile(latencies: number[], p: number): number {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))] ?? 0;
}

async function runConcurrencyLevel(concurrency: number, iterations = 2): Promise<ConcurrencyResult> {
  const pool = getDbPool();
  const totalRequests = concurrency * iterations;
  const latencies: number[] = [];
  const errors: string[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (let it = 0; it < iterations; it++) {
    const promises = Array.from({ length: concurrency }, async () => {
      const start = Date.now();
      try {
        await pool.query("SELECT 1;");
        const elapsed = Date.now() - start;
        latencies.push(elapsed);
        successCount++;
      } catch (err: unknown) {
        failureCount++;
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes("EMAXCONNSESSION") || errMsg.includes("max clients reached")) {
          errors.push("EMAXCONNSESSION");
        } else if (errMsg.includes("ECONNRESET")) {
          errors.push("ECONNRESET");
        } else if (errMsg.includes("timeout")) {
          errors.push("TIMEOUT");
        } else {
          errors.push(errMsg.slice(0, 30));
        }
      }
    });

    await Promise.all(promises);
  }

  const p50 = Math.round(calculatePercentile(latencies, 50));
  const p95 = Math.round(calculatePercentile(latencies, 95));
  const p99 = Math.round(calculatePercentile(latencies, 99));

  const uniqueErrors = Array.from(new Set(errors));
  const dbErrorsStr = uniqueErrors.length > 0 ? uniqueErrors.join(", ") : "None";

  return {
    concurrency,
    requests: totalRequests,
    success: successCount,
    failure: failureCount,
    p50,
    p95,
    p99,
    dbErrors: dbErrorsStr,
  };
}

async function main() {
  console.info("================================================================================");
  console.info("OPERIS DATABASE CONCURRENCY BENCHMARK — READ-ONLY NON-DESTRUCTIVE VERIFICATION");
  console.info("Testing Concurrency Levels: 1, 5, 10, 25, 50");
  console.info("================================================================================\n");

  const levels = [1, 5, 10, 25, 50];
  const results: ConcurrencyResult[] = [];

  for (const lvl of levels) {
    process.stdout.write(`Testing Concurrency ${lvl}... `);
    const res = await runConcurrencyLevel(lvl);
    results.push(res);
    console.info(`Done (Success: ${res.success}/${res.requests}, p50: ${res.p50}ms, Errors: ${res.dbErrors})`);
  }

  console.info("\n### FINAL CONCURRENCY BENCHMARK REPORT TABLE:\n");
  console.info("| Concurrency | Requests | Success | Failure | p50 (ms) | p95 (ms) | p99 (ms) | DB Errors |");
  console.info("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |");
  for (const r of results) {
    console.info(
      `| ${r.concurrency} | ${r.requests} | ${r.success} | ${r.failure} | ${r.p50} | ${r.p95} | ${r.p99} | ${r.dbErrors} |`
    );
  }
  console.info("\nBenchmark completed successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Benchmark failed fatal error:", err);
  process.exit(1);
});
