import { describe, it, expect, beforeEach } from "vitest";
import {
  SavedListingService,
  MAX_SAVED_LISTINGS_LIMIT,
} from "@/src/modules/listings/saved-service";

describe("SavedListingService Unit Tests", () => {
  const userId = "test-user-uuid-101";

  beforeEach(() => {
    SavedListingService._resetMemoryState();
  });

  it("toggles bookmark state on and off idempotently", async () => {
    const listingId = "sample-listing-uuid-001";

    // First toggle -> saved = true
    const firstRes = await SavedListingService.toggleSave(userId, listingId);
    expect(firstRes.saved).toBe(true);

    const isSavedAfterFirst = await SavedListingService.isSaved(userId, listingId);
    expect(isSavedAfterFirst).toBe(true);

    // Second toggle -> saved = false (unsaved)
    const secondRes = await SavedListingService.toggleSave(userId, listingId);
    expect(secondRes.saved).toBe(false);

    const isSavedAfterSecond = await SavedListingService.isSaved(userId, listingId);
    expect(isSavedAfterSecond).toBe(false);
  });

  it("retrieves saved listing IDs as a Set in O(1) lookup", async () => {
    await SavedListingService.toggleSave(userId, "job-1");
    await SavedListingService.toggleSave(userId, "job-2");
    await SavedListingService.toggleSave(userId, "job-3");

    const savedSet = await SavedListingService.getSavedListingIds(userId);
    expect(savedSet.size).toBe(3);
    expect(savedSet.has("job-1")).toBe(true);
    expect(savedSet.has("job-2")).toBe(true);
    expect(savedSet.has("job-3")).toBe(true);
    expect(savedSet.has("job-4")).toBe(false);
  });

  it("performs atomic bulk unsave on multiple items", async () => {
    await SavedListingService.toggleSave(userId, "bulk-1");
    await SavedListingService.toggleSave(userId, "bulk-2");
    await SavedListingService.toggleSave(userId, "bulk-3");

    const bulkResult = await SavedListingService.bulkUnsave(userId, ["bulk-1", "bulk-3"]);
    expect(bulkResult.removedCount).toBe(2);

    const remainingSet = await SavedListingService.getSavedListingIds(userId);
    expect(remainingSet.has("bulk-1")).toBe(false);
    expect(remainingSet.has("bulk-2")).toBe(true);
    expect(remainingSet.has("bulk-3")).toBe(false);
  });

  it("enforces MAX_SAVED_LISTINGS_LIMIT of 200 items per user", async () => {
    // Fill up to limit
    for (let i = 0; i < MAX_SAVED_LISTINGS_LIMIT; i++) {
      await SavedListingService.toggleSave(userId, `limit-job-${i}`);
    }

    const set = await SavedListingService.getSavedListingIds(userId);
    expect(set.size).toBe(MAX_SAVED_LISTINGS_LIMIT);

    // 201st attempt should throw MAX_SAVED_LIMIT_REACHED
    await expect(
      SavedListingService.toggleSave(userId, "limit-job-overflow")
    ).rejects.toThrow(/MAX_SAVED_LIMIT_REACHED/);
  });
});
