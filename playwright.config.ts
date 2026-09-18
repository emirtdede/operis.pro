import { defineConfig, devices } from "@playwright/test";

const isProd = !!process.env.TEST_PROD;
const prodPort = process.env.PLAYWRIGHT_PORT
  ? Number(process.env.PLAYWRIGHT_PORT)
  : isProd
    ? 8008
    : 5000;
const baseUrl = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${prodPort}`;

// B25-ENTRY: Fail-closed — refuse to run if TEST_DATABASE_URL is invalid, missing, or runner token absent
const testDbUrl = (process.env.TEST_DATABASE_URL || "").trim();
if (!testDbUrl) {
  throw new Error(
    "B25-ENTRY: FAIL-CLOSED: TEST_DATABASE_URL environment variable is required and cannot be empty for Playwright tests."
  );
}

try {
  const parsed = new URL(testDbUrl);
  const host = parsed.hostname;
  const dbName = parsed.pathname.replace(/^\//, "");
  if (!["localhost", "127.0.0.1", "postgres"].includes(host)) {
    throw new Error(`B25-ENTRY: Host '${host}' is not allowed for E2E tests.`);
  }
  if (!dbName.startsWith("operis_test_")) {
    throw new Error(`B25-ENTRY: DB '${dbName}' must start with operis_test_.`);
  }
} catch (err) {
  if (err instanceof TypeError && (err as Error).message.includes("Invalid URL")) {
    throw new Error("B25-ENTRY: TEST_DATABASE_URL is not a valid URL.");
  }
  throw err;
}

// B25-ENTRY: Ensure DATABASE_URL strictly matches TEST_DATABASE_URL if defined
if (process.env.DATABASE_URL && process.env.DATABASE_URL !== testDbUrl) {
  throw new Error(
    "B25-ENTRY: FAIL-CLOSED: DATABASE_URL and TEST_DATABASE_URL must point to the identical ephemeral test database."
  );
}

// B25-ENTRY: Require verified runner token to prevent direct runner bypass
const runnerToken = (process.env.OPERIS_E2E_RUNNER_TOKEN || "").trim();
if (!runnerToken) {
  throw new Error(
    "B25-ENTRY: FAIL-CLOSED: Playwright must be launched through the secure runner (pnpm test:e2e:prod / tsx scripts/run-e2e-prod.ts). Direct execution without a verified runner token is prohibited."
  );
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  expect: {
    timeout: 15000,
  },
  reporter: "list",
  use: {
    baseURL: baseUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: isProd ? `npm run start -- -p ${prodPort}` : `npm run dev -- -p ${prodPort}`,
    url: baseUrl,
    reuseExistingServer: !isProd && !process.env.CI,
    timeout: 120000,
    env: {
      EMAIL_PROVIDER: isProd ? "resend" : process.env.EMAIL_PROVIDER || "mock",
      RESEND_API_KEY: "re_test_e2e_blackhole_key",
      SMS_PROVIDER: isProd ? "netgsm" : process.env.SMS_PROVIDER || "mock",
      // B25-ENTRY: DATABASE_URL and TEST_DATABASE_URL must both be the verified ephemeral test DB
      DATABASE_URL: testDbUrl,
      TEST_DATABASE_URL: testDbUrl,
      OPERIS_E2E_RUNNER_TOKEN: runnerToken,
      RESEND_BASE_URL: process.env.RESEND_BASE_URL || "",
      NETGSM_BASE_URL: process.env.NETGSM_BASE_URL || "",
    },
  },
});
