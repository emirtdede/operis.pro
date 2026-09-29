import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/src/proxy";
import { verifyTurnstileToken } from "@/src/lib/security/turnstile";
import { normalizeSqlType } from "@/scripts/lib/schema-audit";
import { getTurnstileEndpoint } from "@/src/lib/security/turnstile-endpoint";

vi.mock("@/src/config/env", () => ({ getEnv: () => ({}) }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Production verification guards", () => {
  it("rejects a test provider override outside an isolated database", () => {
    vi.stubEnv("TURNSTILE_VERIFY_URL", "http://127.0.0.1:1234/turnstile/siteverify");
    vi.stubEnv("TEST_DATABASE_URL", "postgresql://localhost/production");
    expect(() => getTurnstileEndpoint()).toThrow();
  });
  it("allows only the loopback provider in the verified test environment", () => {
    vi.stubEnv("TEST_DATABASE_URL", "postgresql://localhost/operis_test_fixture");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/operis_test_fixture");
    vi.stubEnv("OPERIS_E2E_RUNNER_TOKEN", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    vi.stubEnv("TURNSTILE_VERIFY_URL", "http://127.0.0.1:1234/turnstile/siteverify");
    expect(getTurnstileEndpoint()).toBe("http://127.0.0.1:1234/turnstile/siteverify");
    vi.stubEnv("TURNSTILE_VERIFY_URL", "https://example.com/turnstile/siteverify");
    expect(() => getTurnstileEndpoint()).toThrow();
  });
  it("rejects a missing Turnstile secret even inside a production test process", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    expect((await verifyTurnstileToken("token")).success).toBe(false);
  });
  it.each([
    new Response('{"success":true}', { status: 503 }),
    new Response("not json"),
    new Response('{"success":"yes"}'),
  ])("rejects unverified provider responses", async (response) => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response);
    expect((await verifyTurnstileToken("token")).success).toBe(false);
  });
  it("replaces a client nonce, forwards it to SSR and creates a fresh value per request", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const first = await proxy(
      new NextRequest("https://operis.pro/tr", { headers: { "x-nonce": "attacker" } })
    );
    const second = await proxy(new NextRequest("https://operis.pro/tr"));
    const nonce = first!.headers.get("x-middleware-request-x-nonce");
    expect(nonce).toBeTruthy();
    expect(nonce).not.toBe("attacker");
    expect(second!.headers.get("x-middleware-request-x-nonce")).not.toBe(nonce);
    const policy = first!.headers.get("Content-Security-Policy")!;
    expect(policy).toContain(`'nonce-${nonce}'`);
    expect(first!.headers.get("x-middleware-request-content-security-policy")).toBe(policy);
    const scriptPolicy = policy.split(";").find((p) => p.trim().startsWith("script-src"));
    expect(scriptPolicy).not.toContain("unsafe-inline");
    expect(scriptPolicy).not.toContain("unsafe-eval");
    expect(first!.headers.get("Cache-Control")).toBe("private, no-store");
    expect(
      first!.headers.get("x-middleware-next") || first!.headers.get("x-middleware-rewrite")
    ).toBeTruthy();
  });
  it("normalizes PostgreSQL aliases without hiding length differences", () => {
    expect(normalizeSqlType("character varying(50)")).toBe(normalizeSqlType("varchar(50)"));
    expect(normalizeSqlType("timestamp without time zone")).toBe("timestamp");
    expect(normalizeSqlType("varchar(50)")).not.toBe(normalizeSqlType("varchar(100)"));
  });
});
