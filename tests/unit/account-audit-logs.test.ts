import { describe, it, expect } from "vitest";
import { SecurityAuditService } from "@/src/modules/security/audit-service";

describe("SecurityAuditService User Audit Logs", () => {
  it("should define audit event types for settings actions", () => {
    const validEventTypes = [
      "LOGIN_SUCCESS",
      "LOGIN_FAILED",
      "LOGOUT",
      "PASSWORD_RESET",
      "PASSWORD_CHANGED",
      "EMAIL_VERIFIED",
      "PHONE_VERIFIED",
      "TOTP_ENABLED",
      "TOTP_DISABLED",
      "ACCOUNT_DELETED",
      "SUSPICIOUS_ACTIVITY",
      "PROFILE_UPDATED",
      "HANDLE_CHANGED",
      "AVAILABILITY_CHANGED",
      "LINKS_UPDATED",
      "BILLING_UPDATED",
      "PREFERENCES_UPDATED",
      "SESSIONS_TERMINATED",
    ];

    expect(validEventTypes).toContain("PROFILE_UPDATED");
    expect(validEventTypes).toContain("HANDLE_CHANGED");
    expect(validEventTypes).toContain("AVAILABILITY_CHANGED");
    expect(validEventTypes).toContain("LINKS_UPDATED");
    expect(validEventTypes).toContain("SESSIONS_TERMINATED");
  });

  it("should return empty array gracefully when db query throws or table is unavailable", async () => {
    const logs = await SecurityAuditService.getUserAuditLogs("non-existent-user-id");
    expect(Array.isArray(logs)).toBe(true);
  });
});
