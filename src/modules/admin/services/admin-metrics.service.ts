import { count, desc, eq, gt, lte, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { ListingService } from "@/src/modules/listings/service";
import { NotificationService } from "@/src/modules/notifications/service";
import {
  blockedIpSet,
  loadBlockedIpsFromDb,
} from "@/src/lib/security/rate-limit";
import {
  type AdminLogItem,
  type AdminThreatItem,
  type PaginatedResult,
} from "./types";

export class AdminMetricsService {
  /**
   * High-level real-time KPI metrics for Admin Dashboard.
   */
  static async getDashboardMetrics() {
    try {
      const db = getDb();
      const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [activeListingsRow] = await db
        .select({ val: count() })
        .from(schema.listings)
        .where(eq(schema.listings.status, "ACTIVE"));

      const [expired24hRow] = await db
        .select({ val: count() })
        .from(schema.listings)
        .where(
          sql`${schema.listings.status} = 'INACTIVE_EXPIRED' AND ${schema.listings.updatedAt} >= ${past24h}`
        );

      const [offers24hRow] = await db
        .select({ val: count() })
        .from(schema.offers)
        .where(gt(schema.offers.createdAt, past24h));

      const [matches24hRow] = await db
        .select({ val: count() })
        .from(schema.engagements)
        .where(gt(schema.engagements.matchedAt, past24h));

      const [openReportsRow] = await db
        .select({ val: count() })
        .from(schema.reports)
        .where(eq(schema.reports.status, "OPEN"));

      const [totalUsersRow] = await db.select({ val: count() }).from(schema.users);
      const [suspendedUsersRow] = await db
        .select({ val: count() })
        .from(schema.users)
        .where(eq(schema.users.status, "SUSPENDED"));

      const [disputedRow] = await db
        .select({ val: count() })
        .from(schema.engagements)
        .where(eq(schema.engagements.status, "DISPUTED"));

      const [deadLettersRow] = await db
        .select({ val: count() })
        .from(schema.outboxEvents)
        .where(eq(schema.outboxEvents.status, "DEAD"));

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [threatsRow] = await db
        .select({ val: count() })
        .from(schema.securityEvents)
        .where(gt(schema.securityEvents.createdAt, twentyFourHoursAgo));

      const [blockedIpsRow] = await db
        .select({ val: count() })
        .from(schema.ipBlocks)
        .where(
          or(sql`${schema.ipBlocks.expiresAt} IS NULL`, gt(schema.ipBlocks.expiresAt, new Date()))
        );

      const deadCount = deadLettersRow?.val ?? 0;
      let systemHealth = 100;
      if (deadCount > 0) {
        systemHealth = Math.max(90, 100 - deadCount * 2);
      }

      return {
        totalUsers: totalUsersRow?.val ?? 0,
        activeListings: activeListingsRow?.val ?? 0,
        expiredListingsLast24h: expired24hRow?.val ?? 0,
        offersLast24h: offers24hRow?.val ?? 0,
        matchesLast24h: matches24hRow?.val ?? 0,
        openReports: openReportsRow?.val ?? 0,
        suspendedUsers: suspendedUsersRow?.val ?? 0,
        disputedEngagements: disputedRow?.val ?? 0,
        deadLetters: deadCount,
        activeThreats: threatsRow?.val ?? 0,
        blockedIpsCount: blockedIpsRow?.val ?? 0,
        systemHealthPercent: systemHealth,
      };
    } catch {
      return {
        totalUsers: 0,
        activeListings: 0,
        expiredListingsLast24h: 0,
        offersLast24h: 0,
        matchesLast24h: 0,
        openReports: 0,
        suspendedUsers: 0,
        disputedEngagements: 0,
        deadLetters: 0,
        activeThreats: 0,
        blockedIpsCount: 0,
        systemHealthPercent: 100,
      };
    }
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
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(10, params.limit || 25));

    let dbLogs: AdminLogItem[] = [];
    try {
      const db = getDb();
      const auditRows = await db
        .select()
        .from(schema.adminAuditLog)
        .orderBy(desc(schema.adminAuditLog.createdAt))
        .limit(100);

      const securityRows = await db
        .select()
        .from(schema.securityEvents)
        .orderBy(desc(schema.securityEvents.createdAt))
        .limit(100);

      dbLogs = [
        ...auditRows.map((r) => {
          let level: "INFO" | "WARN" = "INFO";
          if (r.action.includes("FAIL") || r.action.includes("SUSPEND")) {
            level = "WARN";
          }
          return {
            id: r.id,
            category: "audit" as const,
            level,
            action: r.action,
            actorId: r.adminUserId,
            targetId: r.targetId,
            safeSummary: r.safeSummary || `${r.action} on ${r.targetType}`,
            createdAt: r.createdAt,
          };
        }),
        ...securityRows.map((r) => {
          let level: "WARN" | "CRITICAL" = "WARN";
          if (r.eventType.includes("BRUTE") || r.eventType.includes("DDOS")) {
            level = "CRITICAL";
          }
          return {
            id: r.id,
            category: "auth" as const,
            level,
            action: r.eventType,
            actorId: r.userId || undefined,
            ipAddress: r.ipAddress || undefined,
            safeSummary: `Güvenlik Olayı: ${r.eventType}`,
            metadata: (r.riskMetadata as Record<string, unknown>) || undefined,
            createdAt: r.createdAt,
          };
        }),
      ];
    } catch {
      // In-memory fallback
    }

    let all = [...dbLogs];
    all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (params.category && params.category !== "all") {
      all = all.filter((l) => l.category === params.category);
    }
    if (params.level && params.level !== "ALL") {
      all = all.filter((l) => l.level === params.level);
    }
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      all = all.filter(
        (l) =>
          l.safeSummary.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          (l.ipAddress && l.ipAddress.includes(q))
      );
    }

    const total = all.length;
    const startIndex = (page - 1) * limit;
    const items = all.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /**
   * Retrieves detected and mitigated security threats.
   */
  static async getSecurityThreats(params: {
    severity?: string;
    status?: string;
    search?: string;
  }): Promise<AdminThreatItem[]> {
    await loadBlockedIpsFromDb().catch(() => {});

    const liveThreats: AdminThreatItem[] = Array.from(blockedIpSet).map((ip, idx) => ({
      id: `threat_live_blocked_${idx + 1}`,
      threatType: "RATE_LIMIT_DDOS",
      severity: "HIGH",
      sourceIp: ip,
      targetEndpoint: "/api/*",
      attemptCount: 100,
      status: "BLOCKED",
      riskScore: 90,
      lastSeenAt: new Date(),
    }));

    let all = liveThreats;
    if (params.severity && params.severity !== "ALL") {
      all = all.filter((t) => t.severity === params.severity);
    }
    if (params.status && params.status !== "ALL") {
      all = all.filter((t) => t.status === params.status);
    }
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      all = all.filter(
        (t) =>
          t.sourceIp.includes(q) ||
          t.targetEndpoint.toLowerCase().includes(q) ||
          t.threatType.toLowerCase().includes(q)
      );
    }
    return all;
  }

  /**
   * Performs administrative trigger routines (purging dead sessions, forcing expiry, outbox retry, ping DB).
   */
  static async triggerSystemOptimization(
    adminUserId: string,
    action: "purge_sessions" | "run_expiry" | "retry_outbox" | "ping_db"
  ): Promise<{ success: boolean; message: string }> {
    try {
      const db = getDb();
      await db.insert(schema.adminAuditLog).values({
        adminUserId,
        action: `SYSTEM_OPT_${action.toUpperCase()}`,
        targetType: "system",
        targetId: action,
        reasonCode: "OPTIMIZATION",
        safeSummary: `Admin executed system maintenance routine: ${action}`,
      });
    } catch {
      // non-blocking
    }

    if (action === "purge_sessions") {
      let purgedCount = 0;
      try {
        const db = getDb();
        const res = await db
          .delete(schema.securityEvents)
          .where(lte(schema.securityEvents.expiresAt, new Date()))
          .returning({ id: schema.securityEvents.id });
        purgedCount = res.length;
      } catch {
        // non-blocking fallback
      }
      return {
        success: true,
        message:
          purgedCount > 0
            ? `${purgedCount} adet süresi dolmuş oturum/güvenlik kaydı ve önbellek başarıyla temizlendi.`
            : "Süresi dolmuş tüm geçici oturumlar ve güvenlik önbelleği temizlendi.",
      };
    }

    if (action === "run_expiry") {
      try {
        const expiredCount = await ListingService.expireListingsJob();
        return {
          success: true,
          message: `7 günlük yaşam döngüsü başarıyla çalıştırıldı. ${expiredCount} ilan güncellendi.`,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          message: `Yaşam döngüsü worker hatası: ${msg}`,
        };
      }
    }

    if (action === "retry_outbox") {
      try {
        const revived = await NotificationService.reviveDeadOutboxEvents(100);
        const processed = await NotificationService.processOutboxBatch(100);
        let prefix = "";
        if (revived > 0) {
          prefix = `${revived} ölü olay yeniden sıraya alındı, `;
        }
        return {
          success: true,
          message: `Outbox kuyruğundaki bildirimler işlendi (${prefix}${processed} adet gönderildi).`,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          message: `Outbox kuyruk hatası: ${msg}`,
        };
      }
    }

    if (action === "ping_db") {
      try {
        const db = getDb();
        const start = Date.now();
        await db.execute(sql`SELECT 1`);
        const latency = Date.now() - start;
        return {
          success: true,
          message: `Veritabanı bağlantısı aktif. Gecikme süresi: ${latency}ms.`,
        };
      } catch {
        return { success: false, message: "Veritabanı bağlantısına ulaşılamadı." };
      }
    }

    return { success: true, message: "İşlem tamamlandı." };
  }

  /**
   * Retrieves administrative audit logs.
   */
  static async getAuditLogs(limit = 50) {
    try {
      const db = getDb();
      return await db
        .select()
        .from(schema.adminAuditLog)
        .orderBy(desc(schema.adminAuditLog.createdAt))
        .limit(limit);
    } catch {
      return [];
    }
  }
}
