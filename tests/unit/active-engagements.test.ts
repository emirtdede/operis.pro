import { describe, it, expect } from "vitest";
import { EngagementService } from "@/src/modules/engagements/service";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";

describe("EngagementService.getUserEngagements Unit Tests", () => {
  it("returns user engagements with counterparty profile details", async () => {
    const list = await EngagementService.getUserEngagements(DEFAULT_USER.id, {
      role: "all",
      status: "all",
    });

    expect(Array.isArray(list)).toBe(true);
    if (list.length > 0) {
      const item = list[0]!;
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("listingTitle");
      expect(item).toHaveProperty("status");
      expect(item).toHaveProperty("myRole");
      expect(item).toHaveProperty("counterparty");
      expect(item.counterparty).toHaveProperty("handle");
      expect(item.counterparty).toHaveProperty("displayName");
    }
  });

  it("filters engagements by role correctly", async () => {
    const ownerList = await EngagementService.getUserEngagements(DEFAULT_USER.id, {
      role: "owner",
    });
    for (const item of ownerList) {
      expect(item.myRole).toBe("owner");
    }

    const freelancerList = await EngagementService.getUserEngagements(DEFAULT_USER.id, {
      role: "freelancer",
    });
    for (const item of freelancerList) {
      expect(item.myRole).toBe("freelancer");
    }
  });

  it("handles status filters ('active', 'completed')", async () => {
    const activeList = await EngagementService.getUserEngagements(DEFAULT_USER.id, {
      status: "active",
    });
    for (const item of activeList) {
      expect(["MATCHED", "COMPLETION_PENDING"]).toContain(item.status);
    }

    const completedList = await EngagementService.getUserEngagements(DEFAULT_USER.id, {
      status: "completed",
    });
    for (const item of completedList) {
      expect(item.status).toBe("COMPLETED");
    }
  });
});
