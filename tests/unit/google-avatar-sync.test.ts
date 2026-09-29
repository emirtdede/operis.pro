import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as decommissionedAvatarPost } from "@/src/app/api/upload/avatar/route";
import { POST as syncAvatarPost } from "@/src/app/api/profile/sync-avatar/route";

describe("Google Avatar Sync & Decommissioned Uploads Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Upload Decommissioning Verification", () => {
    it("returns HTTP 410 Gone for direct avatar file upload attempts", async () => {
      const dummyReq = new Request("http://localhost:8000/api/upload/avatar", {
        method: "POST",
        headers: { "x-locale": "tr" },
      });

      const res = await decommissionedAvatarPost(dummyReq);
      expect(res.status).toBe(410);

      const json = await res.json();
      expect(json.code).toBe("UPLOAD_DECOMMISSIONED");
      expect(json.error).toContain("Google");
    });
  });

  describe("Google Avatar Synchronization Endpoint", () => {
    it("returns HTTP 401 Unauthorized when no authenticated session is present", async () => {
      const req = new Request("http://localhost:8000/api/profile/sync-avatar", {
        method: "POST",
        headers: { "x-locale": "en" },
      });

      const res = await syncAvatarPost(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });
  });
});
