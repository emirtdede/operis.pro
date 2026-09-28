import http from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  getVerifiedTestDatabaseUrl,
  createIsolatedTestDatabase,
  type TestDatabaseContext,
} from "../tests/helpers/test-database";
import { runE2EWorkflow } from "./lib/e2e-workflow";
import { runNodeStage } from "./lib/e2e-process";
/**
 * Start a local HTTP stub server to intercept transactional email & SMS in test mode.
 * Guarantees zero network egress to real external provider APIs.
 */
function startLocalProviderStub(): Promise<{
  server: http.Server;
  port: number;
  requests: Array<{ method: string; url: string; body: string }>;
}> {
  const requests: Array<{ method: string; url: string; body: string }> = [];
  const usedTurnstileTokens = new Set<string>();

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        requests.push({ method: req.method || "POST", url: req.url || "/", body });

        // Resend emails endpoint stub: POST /emails
        if (req.url?.includes("/emails")) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ id: `re_stub_${Date.now()}_${crypto.randomUUID()}` }));
          return;
        }

        // Netgsm SMS endpoint stub: POST /sms/send/get
        if (req.url?.includes("/sms/send/get")) {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end(`00 ${Date.now().toString().slice(-6)}`);
          return;
        }

        if (req.url === "/turnstile/siteverify") {
          const params = new URLSearchParams(body);
          const token = params.get("response") || "";
          const success =
            params.get("secret") === "operis-e2e-secret" &&
            /^operis-e2e-token-[0-9a-f-]{36}$/.test(token) &&
            !usedTurnstileTokens.has(token);
          if (success) usedTurnstileTokens.add(token);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success,
            })
          );
          return;
        }

        // Default OK
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      });
    });

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        resolve({ server, port: addr.port, requests });
      } else {
        reject(new Error("Failed to obtain stub server address."));
      }
    });

    server.on("error", reject);
  });
}

export async function main(): Promise<number> {
  getVerifiedTestDatabaseUrl();
  const controller = new AbortController();
  const interrupt = () => controller.abort(new Error("E2E runner interrupted"));
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);
  let stub: Awaited<ReturnType<typeof startLocalProviderStub>>;
  let db: TestDatabaseContext;
  let childEnv: NodeJS.ProcessEnv;
  const stage = async (args: string[], signal: AbortSignal) => {
    const code = await runNodeStage(args, signal, childEnv);
    if (code !== 0) throw new Error(`E2E stage ${args[0]} failed (exit ${code})`);
  };
  try {
    return await runE2EWorkflow(
      {
        provider: async () => {
          stub = await startLocalProviderStub();
          return {
            close: async () => {
              stub.server.closeAllConnections();
              await new Promise<void>((resolve, reject) =>
                stub.server.close((e) => (e ? reject(e) : resolve()))
              );
            },
          };
        },
        database: async () => {
          db = await createIsolatedTestDatabase();
          // Only this closure owns this exact database. No name-based stale sweep.
          return { close: () => db.destroy() };
        },
        configure: () => {
          childEnv = {
            ...process.env,
            TEST_PROD: "1",
            NODE_ENV: "production",
            TEST_DATABASE_URL: db.connectionString,
            DATABASE_URL: db.connectionString,
            DATABASE_MIGRATION_URL: db.connectionString,
            OPERIS_E2E_RUNNER_TOKEN: crypto.randomUUID(),
            EMAIL_PROVIDER: "resend",
            RESEND_API_KEY: "re_local_test_only",
            SMS_PROVIDER: "netgsm",
            SMS_API_KEY: "sms_local_test_only",
            TURNSTILE_SECRET_KEY: "operis-e2e-secret",
            NEXT_PUBLIC_TURNSTILE_SITE_KEY: "operis-e2e-site",
            TURNSTILE_VERIFY_URL: `http://127.0.0.1:${stub.port}/turnstile/siteverify`,
            RESEND_BASE_URL: `http://127.0.0.1:${stub.port}`,
            NETGSM_BASE_URL: `http://127.0.0.1:${stub.port}`,
            // Explicitly shadow .env provider credentials as Next may load .env itself.
            EMAIL_API_KEY: "",
            UPSTASH_REDIS_REST_URL: "",
            UPSTASH_REDIS_REST_TOKEN: "",
            NETGSM_USERCODE: "",
            NETGSM_PASSWORD: "",
            NETGSM_HEADER: "",
          };
        },
        seed: async (signal) => {
          await stage(["--import", "tsx", "scripts/seed.ts"], signal);
          await stage(["--import", "tsx", "scripts/seed-e2e.ts"], signal);
        },
        build: (signal) => stage(["node_modules/next/dist/bin/next", "build", "--webpack"], signal),
        test: (signal) =>
          runNodeStage(
            ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)],
            signal,
            childEnv
          ),
        report: (error) =>
          console.error("[E2E] Failed:", error instanceof Error ? error.message : error),
      },
      controller.signal
    );
  } finally {
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", interrupt);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error("[E2E] Fatal:", error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
