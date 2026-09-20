import { describe, it, expect, beforeEach } from "vitest";
import { GcraLimiter } from "@/src/lib/security/gcra-limiter";
import { checkRateLimit } from "@/src/lib/security/rate-limit";

describe("GCRA Rate Limiter (Generic Cell Rate Algorithm)", () => {
  const testKey = "test:gcra:user_123";

  beforeEach(() => {
    GcraLimiter.reset(testKey);
  });

  it("permits initial requests up to the burst limit within the window", () => {
    const t0 = 1000000;
    const limit = 5;
    const windowMs = 50000; // T = 10s per cell

    for (let i = 0; i < limit; i++) {
      const res = GcraLimiter.check(testKey, limit, windowMs, t0);
      expect(res.success).toBe(true);
      expect(res.limit).toBe(limit);
      expect(res.remaining).toBe(limit - 1 - i);
    }
  });

  it("rejects burst requests that exceed the capacity limit", () => {
    const t0 = 1000000;
    const limit = 3;
    const windowMs = 30000; // T = 10s per cell

    expect(GcraLimiter.check(testKey, limit, windowMs, t0).success).toBe(true);
    expect(GcraLimiter.check(testKey, limit, windowMs, t0).success).toBe(true);
    expect(GcraLimiter.check(testKey, limit, windowMs, t0).success).toBe(true);

    const rejected = GcraLimiter.check(testKey, limit, windowMs, t0);
    expect(rejected.success).toBe(false);
    expect(rejected.remaining).toBe(0);
    expect(rejected.resetSeconds).toBeGreaterThan(0);
    expect(rejected.retryAfterMs).toBe(10000); // exactly T (10s)
  });

  it("smoothly restores tokens as virtual time passes (cell leak)", () => {
    const t0 = 1000000;
    const limit = 2;
    const windowMs = 20000; // T = 10s

    // Consume all 2 tokens at t0
    GcraLimiter.check(testKey, limit, windowMs, t0);
    GcraLimiter.check(testKey, limit, windowMs, t0);

    // Immediate next request should fail
    expect(GcraLimiter.check(testKey, limit, windowMs, t0).success).toBe(false);

    // After 10 seconds (1 emission interval T), 1 token should leak and allow request
    const afterOneInterval = t0 + 10000;
    const restored = GcraLimiter.check(testKey, limit, windowMs, afterOneInterval);
    expect(restored.success).toBe(true);
  });

  it("correctly resets limits when requested", () => {
    const t0 = 1000000;
    GcraLimiter.check(testKey, 1, 10000, t0);
    expect(GcraLimiter.check(testKey, 1, 10000, t0).success).toBe(false);

    GcraLimiter.reset(testKey);
    expect(GcraLimiter.check(testKey, 1, 10000, t0).success).toBe(true);
  });

  it("prunes expired keys older than 60 seconds", () => {
    const t0 = 1000000;
    GcraLimiter.check("key_to_prune", 5, 10000, t0);
    expect(GcraLimiter.keyCount).toBeGreaterThan(0);

    // At t0 + 75000ms, key is well past expiration
    const pruned = GcraLimiter.pruneExpired(t0 + 75000);
    expect(pruned).toBeGreaterThanOrEqual(1);
  });

  it("integrates seamlessly into checkRateLimit in rate-limit.ts", () => {
    const apiTestKey = `api:test:${Date.now()}`;
    const first = checkRateLimit(apiTestKey, 2, 60000);
    expect(first.success).toBe(true);
    expect(first.remaining).toBe(1);

    const second = checkRateLimit(apiTestKey, 2, 60000);
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(0);

    const third = checkRateLimit(apiTestKey, 2, 60000);
    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.reset).toBeGreaterThan(0);
  });
});
