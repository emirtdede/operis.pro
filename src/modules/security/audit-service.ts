import { getDb, schema } from "@/src/lib/db";

export interface LogSecurityEventInput {
  userId?: string | null;
  eventType:
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILED"
    | "LOGOUT"
    | "PASSWORD_RESET"
    | "PASSWORD_CHANGED"
    | "EMAIL_VERIFIED"
    | "PHONE_VERIFIED"
    | "TOTP_ENABLED"
    | "TOTP_DISABLED"
    | "ACCOUNT_DELETED"
    | "SUSPICIOUS_ACTIVITY"
    | "PROFILE_UPDATED"
    | "HANDLE_CHANGED"
    | "AVAILABILITY_CHANGED"
    | "LINKS_UPDATED"
    | "BILLING_UPDATED"
    | "PREFERENCES_UPDATED"
    | "SESSIONS_TERMINATED";
  ipAddress?: string | null;
  userAgent?: string | null;
  riskMetadata?: Record<string, unknown>;
  retentionDays?: number;
}

export class SecurityAuditService {
  /**
   * Logs a security audit event to schema.securityEvents asynchronously (non-blocking).
   */
  static async logEvent(input: LogSecurityEventInput): Promise<void> {
    const days = input.retentionDays || 365;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    try {
      const db = getDb();
      await db.insert(schema.securityEvents).values({
        userId: input.userId || null,
        eventType: input.eventType,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        riskMetadata: input.riskMetadata || {},
        expiresAt,
      });
    } catch {
      // Non-blocking write: never fail auth flows due to audit logging
    }
  }

  /**
   * Retrieves recent audit logs specifically belonging to the given user.
   */
  static async getUserAuditLogs(userId: string, limit: number = 15) {
    try {
      const { eq, desc } = await import("drizzle-orm");
      const db = getDb();
      const logs = await db
        .select({
          id: schema.securityEvents.id,
          eventType: schema.securityEvents.eventType,
          ipAddress: schema.securityEvents.ipAddress,
          createdAt: schema.securityEvents.createdAt,
          riskMetadata: schema.securityEvents.riskMetadata,
        })
        .from(schema.securityEvents)
        .where(eq(schema.securityEvents.userId, userId))
        .orderBy(desc(schema.securityEvents.createdAt))
        .limit(limit);

      return logs;
    } catch {
      return [];
    }
  }
}
