import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDbPool, resetDbForTesting } from "@/src/lib/db";

describe("PostgreSQL Pool Idle Client Error Handling (WP-10)", () => {
  beforeEach(() => {
    resetDbForTesting();
  });

  afterEach(() => {
    resetDbForTesting();
  });

  it("should have an error event listener registered on the pool", () => {
    const pool = getDbPool();
    expect(pool.listenerCount("error")).toBeGreaterThanOrEqual(1);
  });

  it("should gracefully handle emitted error events without throwing an uncaught exception", () => {
    const pool = getDbPool();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Emitting an error on EventEmitter with no listeners throws.
    // With our listener registered, it must not throw and should log.
    expect(() => {
      pool.emit("error", new Error("Simulated idle client backend disconnect"));
    }).not.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Postgres Pool Error]"),
      expect.stringContaining("Simulated idle client backend disconnect")
    );

    consoleSpy.mockRestore();
  });
});
