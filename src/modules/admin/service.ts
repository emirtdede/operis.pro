import {
  AdminDisputesService,
  AdminMetricsService,
  AdminModerationService,
  AdminUsersService,
} from "./services";
import {
  type AdminAbuseItem,
  type AdminDisputeItem,
  type AdminListingItem,
  type AdminLogItem,
  type AdminOfferItem,
  type AdminThreatItem,
  type AdminUserItem,
  type PaginatedResult,
} from "./services/types";
import { schema } from "@/src/lib/db";

// Re-export all types and services for backward compatibility
export * from "./services";

/**
 * AdminService - Facade service orchestrating administrative domains:
 * - AdminMetricsService: KPI metrics, logs, threats, system maintenance routines
 * - AdminUsersService: user pagination, moderation (suspend/warn/unsuspend), IP blocks
 * - AdminModerationService: listing/offer moderation, report resolution, contact messages
 * - AdminDisputesService: dispute review and binding arbitration
 */
export class AdminService {
  /**
   * High-level real-time KPI metrics for Admin Dashboard.
   */
  static async getDashboardMetrics() {
    return AdminMetricsService.getDashboardMetrics();
  }

  /**
   * Paginated, searchable, filterable user management for 10,000+ users.
   */
  static async getUsersPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
    sortBy?: "createdAt" | "email" | "role" | "status";
    sortDir?: "asc" | "desc";
  }): Promise<PaginatedResult<AdminUserItem>> {
    return AdminUsersService.getUsersPaginated(params);
  }

  /**
   * Paginated, searchable, filterable listing management.
   */
  static async getListingsPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    categoryId?: string;
  }): Promise<PaginatedResult<AdminListingItem>> {
    return AdminModerationService.getListingsPaginated(params);
  }

  /**
   * Paginated records of every single offer sent and received.
   */
  static async getOffersPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    rejectionCode?: string;
  }): Promise<PaginatedResult<AdminOfferItem>> {
    return AdminModerationService.getOffersPaginated(params);
  }

  /**
   * Advanced Categorized Logging Console.
   */
  static async getCategorizedLogs(params: {
    category?: "auth" | "business" | "audit" | "system" | "all";
    level?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<AdminLogItem>> {
    return AdminMetricsService.getCategorizedLogs(params);
  }

  /**
   * Channel 1 Engine: User Abuse, Profanity & Behavior Incidents.
   */
  static async getAbuseIncidents(
    params: {
      status?: string;
      search?: string;
    } = {}
  ): Promise<AdminAbuseItem[]> {
    return AdminModerationService.getAbuseIncidents(params);
  }

  /**
   * Channel 2 Engine: Hacker & Cyber Security Threats.
   */
  static async getSecurityThreats(params: {
    severity?: string;
    status?: string;
    search?: string;
  }): Promise<AdminThreatItem[]> {
    return AdminMetricsService.getSecurityThreats(params);
  }

  /**
   * Moderates a user account (Suspend / Ban / Unsuspend / Warn).
   */
  static async moderateUser(
    adminUserId: string,
    targetUserId: string,
    action: "SUSPEND" | "UNSUSPEND" | "WARN",
    reason: string
  ) {
    return AdminUsersService.moderateUser(adminUserId, targetUserId, action, reason);
  }

  /**
   * Moderates a listing (Hide / Unhide / Deactivate).
   */
  static async moderateListing(
    adminUserId: string,
    listingId: string,
    action: "HIDE" | "UNHIDE" | "DEACTIVATE",
    reason: string
  ) {
    return AdminModerationService.moderateListing(adminUserId, listingId, action, reason);
  }

  /**
   * Blocks an attacker's IP address (B18).
   */
  static async blockIp(adminUserId: string, ip: string, reason: string): Promise<boolean> {
    return AdminUsersService.blockIp(adminUserId, ip, reason);
  }

  /**
   * Unblocks a previously blacklisted IP address (B18).
   */
  static async unblockIp(adminUserId: string, ip: string): Promise<boolean> {
    return AdminUsersService.unblockIp(adminUserId, ip);
  }

  /**
   * Resolves a user abuse or harassment report.
   */
  static async resolveReport(
    adminUserId: string,
    reportId: string,
    resolution: "RESOLVED" | "DISMISSED"
  ): Promise<boolean> {
    return AdminModerationService.resolveReport(adminUserId, reportId, resolution);
  }

  /**
   * Performs administrative trigger routines (purging dead sessions, forcing expiry, outbox retry, ping DB).
   */
  static async triggerSystemOptimization(
    adminUserId: string,
    action: "purge_sessions" | "run_expiry" | "retry_outbox" | "ping_db"
  ): Promise<{ success: boolean; message: string }> {
    return AdminMetricsService.triggerSystemOptimization(adminUserId, action);
  }

  /**
   * Retrieves administrative audit logs.
   */
  static async getAuditLogs(limit = 50) {
    return AdminMetricsService.getAuditLogs(limit);
  }

  /**
   * T-03: Fetches disputed engagements for administrative review and arbitration.
   */
  static async getDisputedEngagements(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    } = {}
  ): Promise<PaginatedResult<AdminDisputeItem>> {
    return AdminDisputesService.getDisputedEngagements(params);
  }

  /**
   * T-03: Resolves a dispute on an engagement via administrative arbitration.
   */
  static async resolveEngagementDispute(
    adminUserId: string,
    engagementId: string,
    decision: "FORCE_COMPLETE" | "FORCE_CANCEL",
    notes?: string
  ) {
    return AdminDisputesService.resolveEngagementDispute(
      adminUserId,
      engagementId,
      decision,
      notes
    );
  }

  /**
   * Retrieves paginated contact inquiry messages with status and text filtering.
   */
  static async getContactMessagesPaginated(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{
    items: Array<typeof schema.contactMessages.$inferSelect>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    newCount: number;
  }> {
    return AdminModerationService.getContactMessagesPaginated(params);
  }

  /**
   * Updates contact message status (READ, REPLIED, ARCHIVED) and logs audit event atomically.
   */
  static async updateContactMessageStatus(
    adminUserId: string,
    messageId: string,
    status: "NEW" | "READ" | "REPLIED" | "ARCHIVED",
    expectedPreviousStatus: "NEW" | "READ" | "REPLIED" | "ARCHIVED"
  ): Promise<typeof schema.contactMessages.$inferSelect | null> {
    return AdminModerationService.updateContactMessageStatus(
      adminUserId,
      messageId,
      status,
      expectedPreviousStatus
    );
  }
}
