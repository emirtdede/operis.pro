import { describe, expect, it } from "vitest";
import { mapConcurrent, runSequentially } from "@/src/lib/async/concurrency";

describe("Async Concurrency Utilities", () => {
  describe("mapConcurrent", () => {
    it("should handle empty arrays", async () => {
      const res = await mapConcurrent([], 5, async (x) => x);
      expect(res).toEqual([]);
    });

    it("should preserve result order while executing concurrently", async () => {
      const items = [10, 5, 2, 8, 1];
      const res = await mapConcurrent(items, 3, async (ms, idx) => {
        await new Promise((resolve) => setTimeout(resolve, ms));
        return { original: ms, idx };
      });

      expect(res).toEqual([
        { original: 10, idx: 0 },
        { original: 5, idx: 1 },
        { original: 2, idx: 2 },
        { original: 8, idx: 3 },
        { original: 1, idx: 4 },
      ]);
    });

    it("should enforce concurrency limits", async () => {
      let active = 0;
      let maxActive = 0;

      const items = Array.from({ length: 20 }, (_, i) => i);
      await mapConcurrent(items, 4, async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active--;
      });

      expect(maxActive).toBeLessThanOrEqual(4);
      expect(active).toBe(0);
    });

    it("should propagate errors cleanly", async () => {
      await expect(
        mapConcurrent([1, 2, 3], 2, async (x) => {
          if (x === 2) throw new Error("Item 2 failed");
          return x;
        })
      ).rejects.toThrow("Item 2 failed");
    });
  });

  describe("runSequentially", () => {
    it("should execute strictly sequentially in exact order", async () => {
      const executionOrder: number[] = [];
      const items = [1, 2, 3, 4];

      const res = await runSequentially(items, async (item) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        executionOrder.push(item);
        return item * 2;
      });

      expect(executionOrder).toEqual([1, 2, 3, 4]);
      expect(res).toEqual([2, 4, 6, 8]);
    });
  });
});
