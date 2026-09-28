import type { BrowserContext } from "@playwright/test";
import { assertSafeE2ETestEnvironment } from "./test-database";

export async function installTurnstileFixture(context: BrowserContext) {
  assertSafeE2ETestEnvironment();
  await context.addInitScript(() => {
    window.turnstile = {
      render: (_container, options) => {
        queueMicrotask(() => options.callback?.(`operis-e2e-token-${crypto.randomUUID()}`));
        return "operis-e2e-widget";
      },
      reset: () => {},
      remove: () => {},
    };
  });
}
