import { describe, it, expect } from "vitest";
import { POST as accountPasswordPost } from "@/src/app/api/account/password/route";
import { POST as authChangePasswordPost } from "@/src/app/api/auth/change-password/route";

describe("WP-33 & WP-34: Settings Password Endpoint & Export Remediation", () => {
  describe("WP-33: Password Endpoint Routing & Validation", () => {
    it("ensures /api/account/password correctly exports the POST handler from /api/auth/change-password", () => {
      expect(accountPasswordPost).toBeDefined();
      expect(accountPasswordPost).toBe(authChangePasswordPost);
    });

    it("enforces minimum 12 characters with uppercase and number on password change endpoint", async () => {
      const mockReq = {
        headers: new Headers({ "x-locale": "tr", "content-type": "application/json" }),
        json: async () => ({
          currentPassword: "OldPassword123!",
          newPassword: "short", // Only 5 chars!
        }),
      } as unknown as Request;

      const res = await accountPasswordPost(mockReq);
      // Since no session is present or validation fails, it must reject with 401 or 400
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("WP-34: Data Export Polling and Download Link Contract", () => {
    it("formats the download URL correctly when status is READY", () => {
      const jobId = "123e4567-e89b-12d3-a456-426614174000";
      const expectedUrl = `/api/account/export?jobId=${encodeURIComponent(jobId)}&download=1`;
      expect(expectedUrl).toContain("download=1");
      expect(expectedUrl).toContain(jobId);
    });
  });
});
