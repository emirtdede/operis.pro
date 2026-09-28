/** A local provider is available only to the isolated production E2E runner. */
export function getTurnstileEndpoint(): string {
  const override = process.env.TURNSTILE_VERIFY_URL;
  if (!override) return "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  const database = new URL(process.env.TEST_DATABASE_URL || "invalid:");
  const endpoint = new URL(override);
  if (
    !["localhost", "127.0.0.1", "postgres"].includes(database.hostname) ||
    !database.pathname.startsWith("/operis_test_") ||
    process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      process.env.OPERIS_E2E_RUNNER_TOKEN || ""
    ) ||
    endpoint.protocol !== "http:" ||
    endpoint.hostname !== "127.0.0.1" ||
    endpoint.username ||
    endpoint.password ||
    endpoint.pathname !== "/turnstile/siteverify" ||
    endpoint.search ||
    endpoint.hash
  )
    throw new Error("Invalid isolated Turnstile test provider configuration");
  return endpoint.href;
}
