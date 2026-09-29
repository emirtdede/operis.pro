import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["tests/setup/unit.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/a11y/**/*.test.ts"],
    server: {
      deps: {
        inline: ["next-intl"],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts", "src/config/env.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "next/server": path.resolve(__dirname, "./node_modules/next/server.js"),
    },
  },
});
