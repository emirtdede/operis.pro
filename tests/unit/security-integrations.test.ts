import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyTurnstileToken } from "@/src/lib/security/turnstile";
import {
  getUpstashRedis,
  checkUpstashRateLimit,
  _getRatelimitCacheSizeForTesting,
} from "@/src/lib/security/upstash";

describe("Cloudflare Turnstile Verification Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("gracefully bypasses verification when TURNSTILE_SECRET_KEY is not configured", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const result = await verifyTurnstileToken("dummy-token", "127.0.0.1");
    expect(result.success).toBe(true);
  });

  it("fails verification when secret key is set but token is missing", async () => {
    process.env.TURNSTILE_SECRET_KEY = "0x4AAAAAAtest-secret";
    const result = await verifyTurnstileToken("", "127.0.0.1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Missing bot verification token");
  });

  it("handles successful siteverify response from Cloudflare API", async () => {
    process.env.TURNSTILE_SECRET_KEY = "0x4AAAAAAtest-secret";
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const result = await verifyTurnstileToken("valid-token", "127.0.0.1");
    expect(result.success).toBe(true);
  });

  it("handles failed siteverify response from Cloudflare API", async () => {
    process.env.TURNSTILE_SECRET_KEY = "0x4AAAAAAtest-secret";
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, "error-codes": ["invalid-input-response"] }),
    } as Response);

    const result = await verifyTurnstileToken("invalid-token", "127.0.0.1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("invalid-input-response");
  });

  it("rejects verification when Cloudflare is unreachable", async () => {
    process.env.TURNSTILE_SECRET_KEY = "0x4AAAAAAtest-secret";
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Cloudflare 502 Bad Gateway"));

    const result = await verifyTurnstileToken("token", "127.0.0.1");
    // Provider failure must not authorize the request.
    expect(result.success).toBe(false);
  });

  it("rejects verification on timeout", async () => {
    process.env.TURNSTILE_SECRET_KEY = "0x4AAAAAAtest-secret";
    const timeoutErr = new Error("The operation was aborted due to timeout");
    timeoutErr.name = "TimeoutError";
    vi.spyOn(global, "fetch").mockRejectedValueOnce(timeoutErr);

    const result = await verifyTurnstileToken("token", "127.0.0.1");
    expect(result.success).toBe(false);
  });
});

describe("Upstash Redis & Distributed Rate Limit Suite", () => {
  it("returns null for getUpstashRedis when env vars are absent", () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const client = getUpstashRedis();
    expect(client).toBeNull();
  });

  it("returns null for checkUpstashRateLimit when not configured (fail-open)", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const result = await checkUpstashRateLimit("auth:login:test-ip");
    expect(result).toBeNull();
  });

  it("reuses cached Ratelimit instance without reallocating on repeated calls", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";

    // Mock global fetch to return valid Lua script output for Ratelimit sliding window
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify([{ result: [1, 9, Date.now() + 60000] }]),
      json: async () => [{ result: [1, 9, Date.now() + 60000] }],
    } as Response);

    await checkUpstashRateLimit("auth:test:1", 10, 60);
    const sizeAfterFirst = _getRatelimitCacheSizeForTesting();
    expect(sizeAfterFirst).toBeGreaterThanOrEqual(1);

    await checkUpstashRateLimit("auth:test:2", 10, 60);
    // Reuses same instance key (10:60), so cache size does not grow
    expect(_getRatelimitCacheSizeForTesting()).toBe(sizeAfterFirst);

    await checkUpstashRateLimit("auth:test:3", 30, 120);
    // Different key creates a second instance in the map
    expect(_getRatelimitCacheSizeForTesting()).toBe(sizeAfterFirst + 1);
  });
});
