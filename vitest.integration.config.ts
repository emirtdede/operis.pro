import { defineConfig } from "vitest/config";
import path from "node:path";

// B25: Integration test configuration.
// Strictly requires TEST_DATABASE_URL and validates permitted test host/database names.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    // Several integration suites replace the process-wide DB singleton and the
    // PII maintenance jobs intentionally share one advisory-lock namespace.
    // Running test files in parallel makes otherwise isolated databases race
    // through that shared process state.
    fileParallelism: false,
    setupFiles: ["tests/setup/integration.ts"],
    include: ["tests/integration/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
