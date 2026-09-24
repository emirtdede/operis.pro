import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as followPostHandler } from "@/src/app/api/categories/follow/route";
import { CategoryService } from "@/src/modules/categories/service";
import * as sessionModule from "@/src/modules/auth/session";

vi.mock("@/src/modules/auth/session", () => ({
  getSession: vi.fn().mockResolvedValue({
    userId: "user-cat-test-101",
    role: "SPECIALIST",
    email: "user@operis.pro",
    status: "ACTIVE",
    type: "SESSION",
    authVersion: 1,
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000,
  }),
}));

vi.mock("@/src/lib/security/rate-limit", () => ({
  evaluateSecurityAccessAsync: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  normalizeIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

describe("Category Bulk Unfollow & Management", () => {
  const userId = "user-cat-test-101";

  beforeEach(() => {
    vi.spyOn(sessionModule, "getSession").mockResolvedValue({
      userId,
      role: "SPECIALIST",
      email: "user@operis.pro",
      status: "ACTIVE",
      type: "SESSION",
      authVersion: 1,
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    });
  });

  it("successfully unfollows multiple categories using CategoryService.unfollowMultiple", async () => {
    // Follow some categories first
    await CategoryService.toggleFollow(userId, "frontend");
    await CategoryService.toggleFollow(userId, "backend");
    await CategoryService.toggleFollow(userId, "devops");

    // Bulk unfollow two of them
    const count = await CategoryService.unfollowMultiple(userId, ["frontend", "backend"]);
    expect(count).toBeGreaterThanOrEqual(1);

    // devops should still be followed or toggleable
    const followedIds = await CategoryService.getFollowedCategoryIds(userId);
    expect(followedIds).not.toContain("frontend");
    expect(followedIds).not.toContain("backend");
  });

  it("handles empty categoryIds gracefully in CategoryService.unfollowMultiple", async () => {
    const count = await CategoryService.unfollowMultiple(userId, []);
    expect(count).toBe(0);
  });

  it("calls POST /api/categories/follow with categoryIds and returns success count", async () => {
    await CategoryService.toggleFollow(userId, "mobile");
    await CategoryService.toggleFollow(userId, "ai");

    const req = new Request("http://localhost:3000/api/categories/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryIds: ["mobile", "ai"] }),
    });

    const res = await followPostHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.count).toBeGreaterThanOrEqual(1);
    expect(json.isFollowed).toBe(false);
  });

  it("preserves backward compatibility for single categoryId toggle in POST /api/categories/follow", async () => {
    const req = new Request("http://localhost:3000/api/categories/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: "blockchain" }),
    });

    const res = await followPostHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(typeof json.isFollowed).toBe("boolean");
  });

  it("returns 400 when neither categoryId nor categoryIds is provided", async () => {
    const req = new Request("http://localhost:3000/api/categories/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await followPostHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });
});
