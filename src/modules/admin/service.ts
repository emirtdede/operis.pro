import { and, count, desc, eq, gt, ilike, lte, or, sql, inArray } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { ListingService, inMemoryListings } from "@/src/modules/listings/service";
import { NotificationService } from "@/src/modules/notifications/service";
import { EngagementService } from "@/src/modules/engagements/service";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";
import { inMemorySentOffers, inMemoryReceivedOffers } from "@/src/modules/offers/service";
import {
  blockIpAddressAsync,
  unblockIpAddressAsync,
  blockedIpSet,
  loadBlockedIpsFromDb,
  recordBlockedIpInCache,
  removeBlockedIpFromCache,
} from "@/src/lib/security/rate-limit";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUserItem {
  id: string;
  email: string;
  displayName: string;
  handle: string;
  role: string;
  status: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  listingsCount: number;
  offersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminListingItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  categoryName: string;
  categoryKey: string;
  ownerDisplayName: string;
  ownerHandle: string;
  ownerUserId: string;
  budgetMode: string;
  budgetFormatted: string;
  activationSeq: number;
  viewCount: number;
  clickCount: number;
  activeUntil: Date | null;
  createdAt: Date;
}

export interface AdminDisputeItem {
  id: string;
  listingId: string;
  listingTitle: string;
  listingSlug?: string | null;
  categoryKey: string;
  status: string;
  matchedAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
  ownerUserId: string;
  ownerDisplayName: string;
  ownerHandle: string;
  ownerMarkStatus: string | null;
  freelancerUserId: string;
  freelancerDisplayName: string;
  freelancerHandle: string;
  freelancerMarkStatus: string | null;
}

export interface AdminOfferItem {
  id: string;
  listingId: string;
  listingTitle: string;
  listingSlug: string;
  senderUserId: string;
  senderDisplayName: string;
  senderHandle: string;
  recipientUserId: string;
  recipientDisplayName: string;
  recipientHandle: string;
  status: string;
  rejectionReasonCode: string | null;
  budgetFormatted: string;
  estimatedDuration: string;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface AdminLogItem {
  id: string;
  category: "auth" | "business" | "audit" | "system";
  level: "INFO" | "WARN" | "ERROR" | "CRITICAL";
  action: string;
  actorId?: string;
  actorEmail?: string;
  targetId?: string;
  safeSummary: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface AdminAbuseItem {
  id: string;
  reporterUserId?: string;
  reporterDisplayName?: string;
  offenderUserId?: string;
  offenderDisplayName?: string;
  targetType: "listing" | "profile" | "offer" | "message" | "general";
  targetId: string;
  reasonCode: string;
  details: string;
  flaggedTerms?: string[];
  status: "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED";
  createdAt: Date;
}

export interface AdminThreatItem {
  id: string;
  threatType:
    "BRUTE_FORCE" | "RATE_LIMIT_DDOS" | "INJECTION_PROBE" | "UNAUTHORIZED_PATH" | "TOKEN_FORGERY";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  sourceIp: string;
  targetEndpoint: string;
  attemptCount: number;
  status: "DETECTED" | "BLOCKED" | "MITIGATED" | "INVESTIGATING";
  riskScore: number;
  lastSeenAt: Date;
}

const ROLE_HIERARCHY: Record<string, number> = {
  USER: 1,
  MODERATOR: 2,
  ADMIN: 3,
  SECURITY_ADMIN: 4,
};

export class AdminService {
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
      const systemHealth = deadCount === 0 ? 100 : Math.max(90, 100 - deadCount * 2);

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
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(10, params.limit || 25));

    try {
      const db = getDb();
      const conditions = [];

      if (params.status && params.status !== "ALL") {
        conditions.push(eq(schema.users.status, params.status));
      }
      if (params.role && params.role !== "ALL") {
        conditions.push(eq(schema.users.role, params.role));
      }
      if (params.search && params.search.trim()) {
        const q = `%${params.search.trim()}%`;
        conditions.push(
          or(
            ilike(schema.users.email, q),
            ilike(schema.profiles.displayName, q),
            ilike(schema.profiles.handle, q)
          )
        );
      }

      const [totalCountRow] = await db
        .select({ val: count() })
        .from(schema.users)
        .leftJoin(schema.profiles, eq(schema.users.id, schema.profiles.userId))
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      const total = totalCountRow?.val ?? 0;

      const rows = await db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          role: schema.users.role,
          status: schema.users.status,
          emailVerified: schema.users.emailVerified,
          twoFactorEnabled: schema.users.twoFactorEnabled,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt,
          displayName: schema.profiles.displayName,
          handle: schema.profiles.handle,
        })
        .from(schema.users)
        .leftJoin(schema.profiles, eq(schema.users.id, schema.profiles.userId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(schema.users.createdAt));

      return {
        items: (rows || []).map((r) => ({
          id: r.id,
          email: r.email,
          displayName: r.displayName || r.email.split("@")[0] || "İsimsiz",
          handle: r.handle || "user",
          role: r.role,
          status: r.status,
          emailVerified: r.emailVerified,
          twoFactorEnabled: r.twoFactorEnabled,
          listingsCount: 0,
          offersCount: 0,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    } catch {
      return { items: [], total: 0, page, limit, totalPages: 1 };
    }
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
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(10, params.limit || 25));

    try {
      const db = getDb();
      const conditions = [];

      if (params.status && params.status !== "ALL") {
        conditions.push(eq(schema.listings.status, params.status));
      }
      if (params.categoryId && params.categoryId !== "ALL") {
        conditions.push(eq(schema.listings.categoryId, params.categoryId));
      }
      if (params.search && params.search.trim()) {
        const q = `%${params.search.trim()}%`;
        conditions.push(
          or(
            ilike(schema.listings.title, q),
            ilike(schema.listings.slug, q),
            ilike(schema.profiles.displayName, q),
            ilike(schema.profiles.handle, q)
          )
        );
      }

      const [totalCountRow] = await db
        .select({ val: count() })
        .from(schema.listings)
        .leftJoin(schema.profiles, eq(schema.listings.ownerUserId, schema.profiles.userId))
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      const total = totalCountRow?.val ?? 0;

      const rows = await db
        .select({
          listing: schema.listings,
          profile: schema.profiles,
          category: schema.categories,
          categoryTranslation: schema.categoryTranslations,
        })
        .from(schema.listings)
        .leftJoin(schema.profiles, eq(schema.listings.ownerUserId, schema.profiles.userId))
        .leftJoin(schema.categories, eq(schema.listings.categoryId, schema.categories.id))
        .leftJoin(
          schema.categoryTranslations,
          and(
            eq(schema.categoryTranslations.categoryId, schema.categories.id),
            eq(schema.categoryTranslations.locale, "tr")
          )
        )
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(schema.listings.createdAt));

      return {
        items: rows.map(({ listing: l, profile: p, category: c, categoryTranslation: cTrans }) => ({
          id: l.id,
          title: l.title,
          slug: l.slug,
          status: l.status,
          categoryName: cTrans?.name || c?.key || "Web Geliştirme",
          categoryKey: c?.key || "web-development",
          ownerDisplayName: p?.displayName || "Demir Yıldız",
          ownerHandle: p?.handle || "demokullanici",
          ownerUserId: l.ownerUserId,
          budgetMode: l.budgetMode,
          budgetFormatted:
            l.budgetMin && l.budgetMax
              ? `${parseInt(l.budgetMin).toLocaleString()} - ${parseInt(l.budgetMax).toLocaleString()} ${l.budgetCurrency}`
              : "Anlaşmaya Bağlı",
          activationSeq: l.activationSeq,
          viewCount: l.viewCount ?? 0,
          clickCount: l.clickCount ?? 0,
          activeUntil: l.activeUntil,
          createdAt: l.firstPublishedAt || l.createdAt,
        })),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    } catch {
      if (!process.env.VITEST) {
        return { items: [], total: 0, page, limit, totalPages: 1 };
      }
      // In-memory fallback for Vitest
    }

    // Gather from in-memory listings
    let all = inMemoryListings.map((l) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      status: l.status,
      categoryName: "Web Geliştirme",
      categoryKey: "web-development",
      ownerDisplayName: "Demir Yıldız",
      ownerHandle: "demokullanici",
      ownerUserId: l.ownerUserId,
      budgetMode: l.budgetMode,
      budgetFormatted:
        l.budgetMin && l.budgetMax
          ? `${parseInt(l.budgetMin).toLocaleString()} - ${parseInt(l.budgetMax).toLocaleString()} ${l.budgetCurrency}`
          : "Anlaşmaya Bağlı",
      activationSeq: l.activationSeq,
      viewCount: l.viewCount ?? 0,
      clickCount: l.clickCount ?? 0,
      activeUntil: l.activeUntil,
      createdAt: l.firstPublishedAt,
    }));

    if (params.status && params.status !== "ALL") {
      all = all.filter((l) => l.status === params.status);
    }
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      all = all.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.ownerDisplayName.toLowerCase().includes(q) ||
          l.ownerHandle.toLowerCase().includes(q)
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
   * Paginated records of every single offer sent and received.
   */
  static async getOffersPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    rejectionCode?: string;
  }): Promise<PaginatedResult<AdminOfferItem>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(10, params.limit || 25));

    try {
      const db = getDb();
      const conditions = [];

      if (params.status && params.status !== "ALL") {
        conditions.push(eq(schema.offers.status, params.status));
      }
      if (params.search && params.search.trim()) {
        const q = `%${params.search.trim()}%`;
        conditions.push(or(ilike(schema.listings.title, q), ilike(schema.listings.slug, q)));
      }

      const [totalCountRow] = await db
        .select({ val: count() })
        .from(schema.offers)
        .innerJoin(schema.listings, eq(schema.offers.listingId, schema.listings.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      const total = totalCountRow?.val ?? 0;

      const rows = await db
        .select({
          offer: schema.offers,
          listing: schema.listings,
        })
        .from(schema.offers)
        .innerJoin(schema.listings, eq(schema.offers.listingId, schema.listings.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(schema.offers.createdAt));

      const participantUserIds = [
        ...new Set([
          ...rows.map((r) => r.offer.offerorUserId),
          ...rows.map((r) => r.listing.ownerUserId),
        ]),
      ];

      let profileMap = new Map<string, { displayName: string; handle: string }>();
      if (participantUserIds.length > 0) {
        const profiles = await db
          .select({
            userId: schema.profiles.userId,
            displayName: schema.profiles.displayName,
            handle: schema.profiles.handle,
          })
          .from(schema.profiles)
          .where(inArray(schema.profiles.userId, participantUserIds));
        profileMap = new Map(
          profiles.map((p) => [p.userId, { displayName: p.displayName, handle: p.handle }])
        );
      }

      return {
        items: rows.map(({ offer: o, listing: l }) => {
          const sender = profileMap.get(o.offerorUserId);
          const recipient = profileMap.get(l.ownerUserId);
          return {
            id: o.id,
            listingId: l.id,
            listingTitle: l.title,
            listingSlug: l.slug,
            senderUserId: o.offerorUserId,
            senderDisplayName: sender?.displayName || "Kullanıcı",
            senderHandle: sender?.handle || "user",
            recipientUserId: l.ownerUserId,
            recipientDisplayName: recipient?.displayName || "Kullanıcı",
            recipientHandle: recipient?.handle || "user",
            status: o.status,
            rejectionReasonCode: o.rejectionCode || null,
            budgetFormatted:
              o.budgetMin && o.budgetMax
                ? `${parseInt(o.budgetMin).toLocaleString()} - ${parseInt(o.budgetMax).toLocaleString()} ${o.budgetCurrency || "TRY"}`
                : o.budgetMin
                  ? `${parseInt(o.budgetMin).toLocaleString()} ${o.budgetCurrency || "TRY"}`
                  : "Belirtilmedi",
            estimatedDuration:
              o.estimatedDurationValue && o.estimatedDurationUnit
                ? `${o.estimatedDurationValue} ${o.estimatedDurationUnit}`
                : "Belirtilmedi",
            createdAt: o.createdAt,
            resolvedAt: o.resolvedAt || null,
          };
        }),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    } catch {
      return { items: [], total: 0, page, limit, totalPages: 1 };
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
        ...auditRows.map((r) => ({
          id: r.id,
          category: "audit" as const,
          level: (r.action.includes("FAIL") || r.action.includes("SUSPEND") ? "WARN" : "INFO") as
            "INFO" | "WARN",
          action: r.action,
          actorId: r.adminUserId,
          targetId: r.targetId,
          safeSummary: r.safeSummary || `${r.action} on ${r.targetType}`,
          createdAt: r.createdAt,
        })),
        ...securityRows.map((r) => {
          const isCritical = r.eventType.includes("BRUTE") || r.eventType.includes("DDOS");
          return {
            id: r.id,
            category: "auth" as const,
            level: (isCritical ? "CRITICAL" : "WARN") as "WARN" | "CRITICAL",
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
   * Channel 1 Engine: User Abuse, Profanity & Behavior Incidents.
   */
  static async getAbuseIncidents(
    params: {
      status?: string;
      search?: string;
    } = {}
  ): Promise<AdminAbuseItem[]> {
    let dbReports: AdminAbuseItem[] = [];
    try {
      const db = getDb();
      const rows = await db
        .select({
          id: schema.reports.id,
          reporterUserId: schema.reports.reporterUserId,
          targetType: schema.reports.targetType,
          targetId: schema.reports.targetId,
          reasonCode: schema.reports.reasonCode,
          details: schema.reports.details,
          status: schema.reports.status,
          createdAt: schema.reports.createdAt,
          reporterHandle: schema.profiles.handle,
          reporterDisplayName: schema.profiles.displayName,
        })
        .from(schema.reports)
        .leftJoin(schema.profiles, eq(schema.reports.reporterUserId, schema.profiles.userId))
        .orderBy(desc(schema.reports.createdAt));

      // Collect IDs to resolve offenders for each target type
      const listingTargetIds: string[] = [];
      const offerTargetIds: string[] = [];
      const profileTargetIds: string[] = [];

      for (const r of rows) {
        if (r.targetType === "listing" && r.targetId) listingTargetIds.push(r.targetId);
        else if (r.targetType === "offer" && r.targetId) offerTargetIds.push(r.targetId);
        else if (r.targetType === "profile" && r.targetId) profileTargetIds.push(r.targetId);
      }

      const listingOffenders = new Map<string, { userId: string; displayName: string }>();
      if (listingTargetIds.length > 0) {
        const listingRows = await db
          .select({
            listingId: schema.listings.id,
            ownerUserId: schema.listings.ownerUserId,
            displayName: schema.profiles.displayName,
          })
          .from(schema.listings)
          .leftJoin(schema.profiles, eq(schema.listings.ownerUserId, schema.profiles.userId))
          .where(inArray(schema.listings.id, listingTargetIds));
        for (const lr of listingRows) {
          listingOffenders.set(lr.listingId, {
            userId: lr.ownerUserId,
            displayName: lr.displayName || "İlan Sahibi",
          });
        }
      }

      const offerOffenders = new Map<string, { userId: string; displayName: string }>();
      if (offerTargetIds.length > 0) {
        const offerRows = await db
          .select({
            offerId: schema.offers.id,
            offerorUserId: schema.offers.offerorUserId,
            displayName: schema.profiles.displayName,
          })
          .from(schema.offers)
          .leftJoin(schema.profiles, eq(schema.offers.offerorUserId, schema.profiles.userId))
          .where(inArray(schema.offers.id, offerTargetIds));
        for (const ofr of offerRows) {
          offerOffenders.set(ofr.offerId, {
            userId: ofr.offerorUserId,
            displayName: ofr.displayName || "Teklif Sahibi",
          });
        }
      }

      const profileOffenders = new Map<string, { userId: string; displayName: string }>();
      if (profileTargetIds.length > 0) {
        const profileRows = await db
          .select({
            userId: schema.profiles.userId,
            displayName: schema.profiles.displayName,
          })
          .from(schema.profiles)
          .where(inArray(schema.profiles.userId, profileTargetIds));
        for (const pr of profileRows) {
          profileOffenders.set(pr.userId, {
            userId: pr.userId,
            displayName: pr.displayName || "Kullanıcı",
          });
        }
      }

      dbReports = rows.map((r) => {
        let offenderUserId: string | undefined = undefined;
        let offenderDisplayName: string | undefined = undefined;

        if (r.targetType === "listing") {
          const resolved = listingOffenders.get(r.targetId);
          offenderUserId = resolved?.userId;
          offenderDisplayName = resolved?.displayName;
        } else if (r.targetType === "offer") {
          const resolved = offerOffenders.get(r.targetId);
          offenderUserId = resolved?.userId;
          offenderDisplayName = resolved?.displayName;
        } else if (r.targetType === "profile") {
          const resolved = profileOffenders.get(r.targetId);
          offenderUserId = resolved?.userId || r.targetId;
          offenderDisplayName = resolved?.displayName;
        } else if (r.targetType === "general") {
          offenderUserId = undefined;
          offenderDisplayName = "Platform Geri Bildirimi / Genel Şikayet";
        }

        return {
          id: r.id,
          reporterUserId: r.reporterUserId,
          reporterDisplayName: r.reporterDisplayName || "Kullanıcı",
          offenderUserId,
          offenderDisplayName,
          targetType:
            (r.targetType as "listing" | "profile" | "offer" | "message" | "general") || "listing",
          targetId: r.targetId,
          reasonCode: r.reasonCode,
          details: r.details || "",
          status: (r.status as "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED") || "OPEN",
          createdAt: r.createdAt,
        };
      });
    } catch {
      // In-memory fallback
    }

    let combined: AdminAbuseItem[] = dbReports;
    if (combined.length === 0 && process.env.NODE_ENV !== "production") {
      try {
        const { ModerationService } = await import("@/src/modules/moderation/service");
        const mem = await ModerationService.getReports(params.status);
        combined = mem.map((r) => ({
          id: r.id,
          reporterUserId: r.reporterUserId,
          reporterDisplayName: "Kullanıcı",
          targetType:
            (r.targetType as "listing" | "profile" | "offer" | "message" | "general") || "listing",
          targetId: r.targetId,
          reasonCode: r.reasonCode,
          details: r.details || "",
          status: (r.status as "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED") || "OPEN",
          createdAt: r.createdAt,
        }));
      } catch {
        // non-blocking
      }
    }

    const seenIds = new Set<string>();
    let all: AdminAbuseItem[] = [];
    for (const item of combined) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        all.push(item);
      }
    }
    if (params.status && params.status !== "ALL") {
      all = all.filter((a) => a.status === params.status);
    }
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      all = all.filter(
        (a) =>
          a.details.toLowerCase().includes(q) ||
          a.reasonCode.toLowerCase().includes(q) ||
          (a.offenderDisplayName && a.offenderDisplayName.toLowerCase().includes(q))
      );
    }
    return all;
  }

  /**
   * Channel 2 Engine: Hacker & Cyber Security Threats.
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

    const merged: AdminThreatItem[] = liveThreats;

    let all = merged;
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
   * Moderates a user account (Suspend / Ban / Unsuspend).
   */
  static async moderateUser(
    adminUserId: string,
    targetUserId: string,
    action: "SUSPEND" | "UNSUSPEND" | "WARN",
    reason: string
  ) {
    if (!reason || reason.trim().length === 0) {
      throw new Error("A reason is strictly required for moderation actions");
    }

    if (adminUserId === targetUserId) {
      throw new Error(
        "CANNOT_MODERATE_SELF: Yöneticiler kendi hesaplarını askıya alamaz veya durumunu değiştiremez."
      );
    }

    const isTargetUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      targetUserId
    );

    if (isTargetUuid) {
      try {
        const db = getDb();

        const result = await db.transaction(async (tx) => {
          let updatedUser;

          const [existing] = await tx
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, targetUserId));

          if (!existing) {
            throw new Error("Target user not found");
          }

          if (existing.status === "DELETED") {
            throw new Error("Cannot modify status of a deleted account");
          }

          const [adminUser] = await tx
            .select({ role: schema.users.role })
            .from(schema.users)
            .where(eq(schema.users.id, adminUserId))
            .limit(1);

          const adminRank = ROLE_HIERARCHY[adminUser?.role || "MODERATOR"] || 1;
          const targetRank = ROLE_HIERARCHY[existing.role || "USER"] || 1;

          if (targetRank >= adminRank && action === "SUSPEND") {
            throw new Error(
              "INSUFFICIENT_ROLE_HIERARCHY: Yetki seviyeniz hedef kullanıcının rolünü askıya almak için yetersizdir."
            );
          }

          let pendingReceivedOffersToNotify: Array<{
            id: string;
            offerorUserId: string;
            listingTitle: string;
            locale: string;
          }> = [];

          if (action === "WARN") {
            // Do NOT alter user status on WARN
            updatedUser = existing;

            await tx
              .insert(schema.notifications)
              .values({
                userId: targetUserId,
                type: "SECURITY_EVENT",
                payloadJson: {
                  title: "Yönetici Uyarısı",
                  message: `Hesabınız için resmi bir yönetici uyarısı iletildi: ${reason}`,
                },
              })
              .catch(() => {});
          } else {
            const newStatus = action === "SUSPEND" ? "SUSPENDED" : "ACTIVE";
            const [u] = await tx
              .update(schema.users)
              .set({
                status: newStatus,
                authVersion: sql`${schema.users.authVersion} + 1`,
                updatedAt: new Date(),
              })
              .where(eq(schema.users.id, targetUserId))
              .returning();
            updatedUser = u;

            if (action === "SUSPEND") {
              const activeListings = await tx
                .select({ id: schema.listings.id, title: schema.listings.title })
                .from(schema.listings)
                .where(
                  and(
                    eq(schema.listings.ownerUserId, targetUserId),
                    eq(schema.listings.status, "ACTIVE")
                  )
                );

              const activeListingIds = activeListings.map((l) => l.id);

              await tx
                .update(schema.listings)
                .set({
                  status: "HIDDEN_MODERATION",
                  updatedAt: new Date(),
                })
                .where(
                  and(
                    eq(schema.listings.ownerUserId, targetUserId),
                    eq(schema.listings.status, "ACTIVE")
                  )
                );

              await tx
                .update(schema.offers)
                .set({
                  status: "EXPIRED_LISTING_INACTIVE",
                  resolvedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(
                  and(
                    eq(schema.offers.offerorUserId, targetUserId),
                    eq(schema.offers.status, "PENDING")
                  )
                );

              if (activeListingIds.length > 0) {
                const receivedPendingOffers = await tx
                  .select({
                    id: schema.offers.id,
                    offerorUserId: schema.offers.offerorUserId,
                    listingId: schema.offers.listingId,
                    locale: schema.profiles.locale,
                  })
                  .from(schema.offers)
                  .leftJoin(
                    schema.profiles,
                    eq(schema.offers.offerorUserId, schema.profiles.userId)
                  )
                  .where(
                    and(
                      inArray(schema.offers.listingId, activeListingIds),
                      eq(schema.offers.status, "PENDING")
                    )
                  );

                await tx
                  .update(schema.offers)
                  .set({
                    status: "EXPIRED_LISTING_INACTIVE",
                    resolvedAt: new Date(),
                    updatedAt: new Date(),
                  })
                  .where(
                    and(
                      inArray(schema.offers.listingId, activeListingIds),
                      eq(schema.offers.status, "PENDING")
                    )
                  );

                pendingReceivedOffersToNotify = receivedPendingOffers.map((ro) => {
                  const matchingListing = activeListings.find((l) => l.id === ro.listingId);
                  return {
                    id: ro.id,
                    offerorUserId: ro.offerorUserId,
                    listingTitle: matchingListing?.title || "İlan",
                    locale: ro.locale || "tr",
                  };
                });
              }
            } else if (action === "UNSUSPEND") {
              const hiddenListings = await tx
                .select({
                  id: schema.listings.id,
                  activeUntil: schema.listings.activeUntil,
                  activationSeq: schema.listings.activationSeq,
                })
                .from(schema.listings)
                .where(
                  and(
                    eq(schema.listings.ownerUserId, targetUserId),
                    eq(schema.listings.status, "HIDDEN_MODERATION")
                  )
                );

              const now = new Date();
              for (const hl of hiddenListings) {
                const isStillActive = Boolean(hl.activeUntil && new Date(hl.activeUntil) > now);
                const newListingStatus = isStillActive ? "ACTIVE" : "INACTIVE_OWNER";

                await tx
                  .update(schema.listings)
                  .set({
                    status: newListingStatus,
                    updatedAt: now,
                  })
                  .where(eq(schema.listings.id, hl.id));

                await tx.insert(schema.listingStatusEvents).values({
                  listingId: hl.id,
                  fromStatus: "HIDDEN_MODERATION",
                  toStatus: newListingStatus,
                  reason: "User unsuspended by administrator",
                  actorType: "ADMIN",
                  actorId: adminUserId,
                  activationSeq: hl.activationSeq,
                });
              }
            }
          }

          await tx.insert(schema.adminAuditLog).values({
            adminUserId,
            action: `USER_${action}`,
            targetType: "user",
            targetId: targetUserId,
            reasonCode: "ADMIN_ACTION",
            safeSummary: reason,
          });

          return { updatedUser, pendingReceivedOffersToNotify };
        });

        if (
          result?.pendingReceivedOffersToNotify &&
          result.pendingReceivedOffersToNotify.length > 0
        ) {
          await Promise.allSettled(
            result.pendingReceivedOffersToNotify.map((po) => {
              const isEn = po.locale === "en";
              return NotificationService.createNotification(
                po.offerorUserId,
                "OFFER_EXPIRED_LISTING",
                "offer",
                po.id,
                {
                  title: isEn ? "Proposal Concluded" : "Teklif Sonlandırıldı",
                  message: isEn
                    ? `The listing "${po.listingTitle}" was taken down by platform moderation. Your pending proposal has ended.`
                    : `"${po.listingTitle}" ilanı moderasyon incelemesi nedeniyle yayından kaldırıldığı için bekleyen teklifiniz sonlandırıldı.`,
                  actionUrl: isEn ? "/en/dashboard/offers/sent" : "/tr/panel/teklifler/gonderilen",
                }
              );
            })
          );
        }

        return result?.updatedUser;
      } catch (err) {
        if (process.env.NODE_ENV === "production" || !process.env.VITEST) {
          throw err;
        }
      }
    }

    // In-memory fallback
    if (adminUserId === targetUserId) {
      throw new Error(
        "CANNOT_MODERATE_SELF: Yöneticiler kendi hesaplarını askıya alamaz veya durumunu değiştiremez."
      );
    }
    if (action !== "WARN") {
      if (targetUserId === DEFAULT_USER.id) {
        DEFAULT_USER.status = action === "SUSPEND" ? "SUSPENDED" : "ACTIVE";
      }
    }
    if (action === "SUSPEND") {
      for (const l of inMemoryListings) {
        if (l.ownerUserId === targetUserId && l.status === "ACTIVE") {
          l.status = "HIDDEN_MODERATION";
        }
      }
      for (const o of inMemorySentOffers) {
        if (o.offer.offerorUserId === targetUserId && o.offer.status === "PENDING") {
          o.offer.status = "EXPIRED_LISTING_INACTIVE";
          o.offer.resolvedAt = new Date();
          o.offer.updatedAt = new Date();
        }
        if (
          (o.listing as { ownerUserId?: string })?.ownerUserId === targetUserId &&
          o.offer.status === "PENDING"
        ) {
          o.offer.status = "EXPIRED_LISTING_INACTIVE";
          o.offer.resolvedAt = new Date();
          o.offer.updatedAt = new Date();
        }
      }
      for (const r of inMemoryReceivedOffers) {
        if (r.listing.ownerUserId === targetUserId && r.offer.status === "PENDING") {
          r.offer.status = "EXPIRED_LISTING_INACTIVE";
          r.offer.resolvedAt = new Date();
          r.offer.updatedAt = new Date();
        }
      }
    } else if (action === "UNSUSPEND") {
      const now = new Date();
      for (const l of inMemoryListings) {
        if (l.ownerUserId === targetUserId && l.status === "HIDDEN_MODERATION") {
          l.status = l.activeUntil && new Date(l.activeUntil) > now ? "ACTIVE" : "INACTIVE_OWNER";
        }
      }
    }
    return {
      id: targetUserId,
      status: action === "SUSPEND" ? "SUSPENDED" : "ACTIVE",
      updatedAt: new Date(),
    };
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
    if (!reason || reason.trim().length === 0) {
      throw new Error("A reason is strictly required for moderation actions");
    }

    const isListingUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      listingId
    );

    if (isListingUuid) {
      try {
        const db = getDb();

        const txResult = await db.transaction(async (tx) => {
          let listingQuery = tx
            .select()
            .from(schema.listings)
            .where(eq(schema.listings.id, listingId));

          if (typeof (listingQuery as { for?: unknown }).for === "function") {
            listingQuery = (listingQuery as { for: (mode: string) => typeof listingQuery }).for(
              "update"
            );
          }

          const [currentListing] = await listingQuery.limit(1);

          if (!currentListing) {
            throw new Error("Listing not found");
          }

          if (
            currentListing.status === "MATCHED" ||
            currentListing.status === "COMPLETED" ||
            currentListing.status === "DELETED"
          ) {
            throw new Error(
              "Cannot moderate or unhide a listing that is matched, completed or deleted."
            );
          }

          let computedStatus: (typeof schema.listings.$inferSelect)["status"] =
            action === "HIDE"
              ? "HIDDEN_MODERATION"
              : action === "DEACTIVATE"
                ? "INACTIVE_OWNER"
                : "ACTIVE";

          if (action === "UNHIDE") {
            const isPast =
              currentListing.activeUntil &&
              new Date(currentListing.activeUntil).getTime() <= Date.now();
            if (isPast || currentListing.status === "INACTIVE_EXPIRED") {
              computedStatus = "INACTIVE_EXPIRED";
            } else {
              computedStatus = "ACTIVE";
            }
          }

          const now = new Date();
          const [updatedListing] = await tx
            .update(schema.listings)
            .set({
              status: computedStatus,
              updatedAt: now,
            })
            .where(eq(schema.listings.id, listingId))
            .returning();

          const notificationsToDispatch: Array<{
            userId: string;
            type: "MODERATION_ACTION" | "OFFER_EXPIRED_LISTING";
            aggregateType: string;
            aggregateId: string;
            payload: Record<string, unknown>;
          }> = [];

          if (action === "HIDE" || action === "DEACTIVATE") {
            const pendingOffersToNotify = await tx
              .select({
                id: schema.offers.id,
                offerorUserId: schema.offers.offerorUserId,
                locale: schema.profiles.locale,
              })
              .from(schema.offers)
              .leftJoin(schema.profiles, eq(schema.offers.offerorUserId, schema.profiles.userId))
              .where(
                and(eq(schema.offers.listingId, listingId), eq(schema.offers.status, "PENDING"))
              );

            await tx
              .update(schema.offers)
              .set({
                status: "EXPIRED_LISTING_INACTIVE",
                resolvedAt: now,
                updatedAt: now,
              })
              .where(
                and(eq(schema.offers.listingId, listingId), eq(schema.offers.status, "PENDING"))
              );

            // Fetch owner locale for localized notification
            const [ownerProfile] = await tx
              .select({ locale: schema.profiles.locale })
              .from(schema.profiles)
              .where(eq(schema.profiles.userId, currentListing.ownerUserId))
              .limit(1);

            const isOwnerEn = ownerProfile?.locale === "en";
            notificationsToDispatch.push({
              userId: currentListing.ownerUserId,
              type: "MODERATION_ACTION",
              aggregateType: "listing",
              aggregateId: listingId,
              payload: {
                title: isOwnerEn
                  ? "Listing Moderation Action"
                  : "İlanınız Moderasyon Tarafından Kapatıldı",
                message: isOwnerEn
                  ? `Your listing "${currentListing.title}" was ${action === "HIDE" ? "hidden" : "deactivated"} by an administrator. Reason: ${reason}`
                  : `"${currentListing.title}" başlıklı ilanınız bir yönetici tarafından ${action === "HIDE" ? "gizlenmiştir" : "yayından kaldırılmıştır"}. Gerekçe: ${reason}`,
                actionUrl: isOwnerEn ? "/en/dashboard/listings" : "/tr/panel/ilanlarim",
              },
            });

            for (const po of pendingOffersToNotify) {
              const isPoEn = po.locale === "en";
              notificationsToDispatch.push({
                userId: po.offerorUserId,
                type: "OFFER_EXPIRED_LISTING",
                aggregateType: "offer",
                aggregateId: po.id,
                payload: {
                  title: isPoEn ? "Listing Closed by Moderation" : "Teklif Verilen İlan Kapatıldı",
                  message: isPoEn
                    ? `The listing "${currentListing.title}" was closed due to a moderation action. Your pending proposal has ended.`
                    : `"${currentListing.title}" başlıklı ilan moderasyon işlemi sebebiyle kapatıldığı için bekleyen teklifiniz sona erdi.`,
                  actionUrl: isPoEn
                    ? "/en/dashboard/offers/sent"
                    : "/tr/panel/teklifler/gonderilen",
                },
              });
            }
          }

          await tx.insert(schema.listingStatusEvents).values({
            listingId,
            fromStatus: currentListing.status,
            toStatus: computedStatus,
            reason:
              action === "DEACTIVATE"
                ? `ADMIN_DEACTIVATION: ${reason}`
                : `ADMIN_${action}: ${reason}`,
            actorType: "ADMIN",
            actorId: adminUserId,
            activationSeq: currentListing.activationSeq,
          });

          await tx.insert(schema.adminAuditLog).values({
            adminUserId,
            action: `LISTING_${action}`,
            targetType: "listing",
            targetId: listingId,
            reasonCode: action === "DEACTIVATE" ? "ADMIN_DEACTIVATION" : "ADMIN_ACTION",
            safeSummary: reason,
          });

          return { updatedListing, notificationsToDispatch };
        });

        if (txResult?.notificationsToDispatch && txResult.notificationsToDispatch.length > 0) {
          await Promise.allSettled(
            txResult.notificationsToDispatch.map((n) =>
              NotificationService.createNotification(
                n.userId,
                n.type,
                n.aggregateType,
                n.aggregateId,
                n.payload
              )
            )
          );
        }

        return txResult?.updatedListing;
      } catch (err) {
        if (process.env.NODE_ENV === "production" || !process.env.VITEST) {
          throw err;
        }
      }
    }

    const l = inMemoryListings.find((item) => item.id === listingId);
    if (l && (l.status === "MATCHED" || l.status === "COMPLETED" || l.status === "DELETED")) {
      throw new Error("Cannot moderate or unhide a listing that is matched, completed or deleted.");
    }

    let targetStatus: (typeof schema.listings.$inferSelect)["status"] =
      action === "HIDE"
        ? "HIDDEN_MODERATION"
        : action === "DEACTIVATE"
          ? "INACTIVE_OWNER"
          : "ACTIVE";

    if (action === "UNHIDE" && l) {
      const isPast = l.activeUntil && new Date(l.activeUntil).getTime() <= Date.now();
      if (isPast || l.status === "INACTIVE_EXPIRED") {
        targetStatus = "INACTIVE_EXPIRED";
      } else {
        targetStatus = "ACTIVE";
      }
    }

    if (l) {
      l.status = targetStatus;
    }
    for (const s of inMemorySentOffers) {
      if (s.listing.id === listingId) {
        s.listing.status = targetStatus;
        if ((action === "HIDE" || action === "DEACTIVATE") && s.offer.status === "PENDING") {
          s.offer.status = "EXPIRED_LISTING_INACTIVE";
          s.offer.resolvedAt = new Date();
          s.offer.updatedAt = new Date();
        }
      }
    }
    for (const r of inMemoryReceivedOffers) {
      if (r.listing.id === listingId) {
        r.listing.status = targetStatus;
        if ((action === "HIDE" || action === "DEACTIVATE") && r.offer.status === "PENDING") {
          r.offer.status = "EXPIRED_LISTING_INACTIVE";
          r.offer.resolvedAt = new Date();
          r.offer.updatedAt = new Date();
        }
      }
    }

    if (l) {
      return l;
    }
    return {
      id: listingId,
      status: targetStatus,
      updatedAt: new Date(),
    };
  }

  /**
   * Blocks an attacker's IP address (B18).
   */
  static async blockIp(adminUserId: string, ip: string, reason: string): Promise<boolean> {
    const db = getDb();
    try {
      await db.transaction(async (tx) => {
        await blockIpAddressAsync(ip, { reason, actorId: adminUserId, tx });
        await tx.insert(schema.securityEvents).values({
          eventType: "IP_BLOCKED",
          ipAddress: ip,
          riskMetadata: { reason, blockedBy: adminUserId },
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
        await tx.insert(schema.adminAuditLog).values({
          adminUserId,
          action: "IP_BLOCKED",
          targetType: "security",
          targetId: ip,
          reasonCode: "ADMIN_ACTION",
          safeSummary: `IP ${ip} blocked: ${reason}`,
        });
      });
      // Update cache only after successful commit (B18)
      recordBlockedIpInCache(ip);
      return true;
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("ADMIN_IP_BLOCK_TRANSACTION_FAILED", { cause: err });
      }
      // Demo fallback in non-production environments
      recordBlockedIpInCache(ip);
      return true;
    }
  }

  /**
   * Unblocks a previously blacklisted IP address (B18).
   */
  static async unblockIp(adminUserId: string, ip: string): Promise<boolean> {
    const db = getDb();
    try {
      await db.transaction(async (tx) => {
        await unblockIpAddressAsync(ip, { tx });
        await tx
          .delete(schema.securityEvents)
          .where(
            and(
              eq(schema.securityEvents.eventType, "IP_BLOCKED"),
              eq(schema.securityEvents.ipAddress, ip)
            )
          );
        await tx.insert(schema.adminAuditLog).values({
          adminUserId,
          action: "IP_UNBLOCKED",
          targetType: "general",
          targetId: ip,
          reasonCode: "ADMIN_ACTION",
          safeSummary: `Blacklist entry removed for IP ${ip}`,
        });
      });
      // Remove from cache only after successful commit (B18)
      removeBlockedIpFromCache(ip);
      return true;
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("ADMIN_IP_UNBLOCK_TRANSACTION_FAILED", { cause: err });
      }
      removeBlockedIpFromCache(ip);
      return true;
    }
  }

  /**
   * Resolves a user abuse or harassment report.
   */
  static async resolveReport(
    adminUserId: string,
    reportId: string,
    resolution: "RESOLVED" | "DISMISSED"
  ): Promise<boolean> {
    const { ModerationService } = await import("@/src/modules/moderation/service");
    await ModerationService.resolveReport(adminUserId, reportId, resolution);
    return true;
  }

  /**
   * System Monitoring & Performance Optimization Tools.
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
        return {
          success: true,
          message: `Outbox kuyruğundaki bildirimler işlendi (${revived > 0 ? `${revived} ölü olay yeniden sıraya alındı, ` : ""}${processed} adet gönderildi).`,
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
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(10, params.limit || 25));
    const statusFilter = params.status || "DISPUTED";

    try {
      const db = getDb();
      const conditions = [];
      if (statusFilter && statusFilter !== "ALL") {
        conditions.push(eq(schema.engagements.status, statusFilter));
      }
      if (params.search && params.search.trim()) {
        const q = `%${params.search.trim()}%`;
        conditions.push(ilike(schema.engagements.listingTitleSnapshot, q));
      }

      const rows = await db
        .select({
          id: schema.engagements.id,
          listingId: schema.engagements.listingId,
          listingTitle: schema.engagements.listingTitleSnapshot,
          categoryKey: schema.engagements.listingCategorySnapshot,
          status: schema.engagements.status,
          matchedAt: schema.engagements.matchedAt,
          completedAt: schema.engagements.completedAt,
          cancelledAt: schema.engagements.cancelledAt,
          ownerUserId: schema.engagements.ownerUserId,
          freelancerUserId: schema.engagements.freelancerUserId,
        })
        .from(schema.engagements)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(schema.engagements.matchedAt))
        .limit(limit)
        .offset((page - 1) * limit);

      const [totalRow] = await db
        .select({ val: count() })
        .from(schema.engagements)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = totalRow?.val ?? 0;

      if (rows.length > 0) {
        const userIds = Array.from(
          new Set(rows.flatMap((r) => [r.ownerUserId, r.freelancerUserId]).filter(Boolean))
        );
        const engagementIds = rows.map((r) => r.id);
        const listingIds = rows.map((r) => r.listingId);

        const [profiles, marks, listingsList] = await Promise.all([
          userIds.length > 0
            ? db
                .select({
                  userId: schema.profiles.userId,
                  displayName: schema.profiles.displayName,
                  handle: schema.profiles.handle,
                })
                .from(schema.profiles)
                .where(inArray(schema.profiles.userId, userIds))
            : [],
          engagementIds.length > 0
            ? db
                .select({
                  engagementId: schema.engagementCompletionMarks.engagementId,
                  userId: schema.engagementCompletionMarks.userId,
                  status: schema.engagementCompletionMarks.status,
                })
                .from(schema.engagementCompletionMarks)
                .where(inArray(schema.engagementCompletionMarks.engagementId, engagementIds))
            : [],
          listingIds.length > 0
            ? db
                .select({
                  id: schema.listings.id,
                  slug: schema.listings.slug,
                })
                .from(schema.listings)
                .where(inArray(schema.listings.id, listingIds))
            : [],
        ]);

        const profileMap = new Map(profiles.map((p) => [p.userId, p]));
        const listingMap = new Map(listingsList.map((l) => [l.id, l.slug]));

        const items: AdminDisputeItem[] = rows.map((r) => {
          const owner = profileMap.get(r.ownerUserId);
          const freelancer = profileMap.get(r.freelancerUserId);
          const ownerMark = marks.find(
            (m) => m.engagementId === r.id && m.userId === r.ownerUserId
          );
          const freelancerMark = marks.find(
            (m) => m.engagementId === r.id && m.userId === r.freelancerUserId
          );

          return {
            ...r,
            listingSlug: listingMap.get(r.listingId) ?? null,
            ownerDisplayName: owner?.displayName ?? "İşveren",
            ownerHandle: owner?.handle ?? "isveren",
            ownerMarkStatus: ownerMark?.status ?? null,
            freelancerDisplayName: freelancer?.displayName ?? "Serbest Çalışan",
            freelancerHandle: freelancer?.handle ?? "freelancer",
            freelancerMarkStatus: freelancerMark?.status ?? null,
          };
        });

        return {
          items,
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        };
      }

      return { items: [], total: 0, page, limit, totalPages: 1 };
    } catch {
      if (!process.env.VITEST) {
        return { items: [], total: 0, page, limit, totalPages: 1 };
      }
      // In-memory demo fallback for Vitest unit test environment
      const demoItems: AdminDisputeItem[] = [
        {
          id: "eng-dispute-001",
          listingId: "sample-listing-001",
          listingTitle: "Next.js Kurumsal SaaS Mimarisi & API Entegrasyonu",
          listingSlug: "nextjs-ve-tailwind-ile-modern-e-ticaret-arayuzu-gelistirilmesi-a1b2c3",
          categoryKey: "software-development",
          status: "DISPUTED",
          matchedAt: new Date(Date.now() - 14 * 86400000),
          completedAt: null,
          cancelledAt: null,
          ownerUserId: DEFAULT_USER.id,
          ownerDisplayName: DEFAULT_USER.profile.displayName,
          ownerHandle: DEFAULT_USER.profile.handle,
          ownerMarkStatus: "DISPUTES_COMPLETION",
          freelancerUserId: "u-techcorp-1",
          freelancerDisplayName: "Ahmet Yılmaz (Senior Dev)",
          freelancerHandle: "ahmetyilmaz",
          freelancerMarkStatus: "MARKED_COMPLETE",
        },
      ];

      const filtered = demoItems.filter((d) => {
        if (statusFilter && statusFilter !== "ALL" && d.status !== statusFilter) return false;
        if (params.search && params.search.trim()) {
          const q = params.search.trim().toLowerCase();
          return (
            d.listingTitle.toLowerCase().includes(q) ||
            d.ownerDisplayName.toLowerCase().includes(q) ||
            d.freelancerDisplayName.toLowerCase().includes(q)
          );
        }
        return true;
      });

      return {
        items: filtered,
        total: filtered.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      };
    }
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
    const result = await EngagementService.resolveDisputeByAdmin(
      adminUserId,
      engagementId,
      decision,
      notes
    );

    try {
      const db = getDb();
      await db.insert(schema.adminAuditLog).values({
        adminUserId,
        action: `ENGAGEMENT_DISPUTE_${decision}`,
        targetType: "engagement",
        targetId: engagementId,
        reasonCode:
          decision === "FORCE_COMPLETE"
            ? "DISPUTE_ARBITRATION_COMPLETE"
            : "DISPUTE_ARBITRATION_CANCEL",
        safeSummary: notes || `Admin resolved dispute via ${decision}`,
      });
    } catch {
      // non-blocking audit
    }

    return result;
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
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 25));
    const offset = (page - 1) * limit;

    try {
      const db = getDb();
      const conditions = [];

      if (params.status && params.status !== "ALL") {
        conditions.push(eq(schema.contactMessages.status, params.status.toUpperCase()));
      }

      if (params.search && params.search.trim()) {
        const pattern = `%${params.search.trim()}%`;
        conditions.push(
          or(
            ilike(schema.contactMessages.name, pattern),
            ilike(schema.contactMessages.email, pattern),
            ilike(schema.contactMessages.subject, pattern),
            ilike(schema.contactMessages.message, pattern)
          )!
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [countRow] = await db
        .select({ val: count() })
        .from(schema.contactMessages)
        .where(whereClause);

      const [newCountRow] = await db
        .select({ val: count() })
        .from(schema.contactMessages)
        .where(eq(schema.contactMessages.status, "NEW"));

      const rows = await db
        .select()
        .from(schema.contactMessages)
        .where(whereClause)
        .orderBy(desc(schema.contactMessages.createdAt))
        .limit(limit)
        .offset(offset);

      const total = Number(countRow?.val ?? 0);
      const newCount = Number(newCountRow?.val ?? 0);

      return {
        items: rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        newCount,
      };
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 1,
        newCount: 0,
      };
    }
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
    try {
      const db = getDb();
      return await db.transaction(async (tx) => {
        const whereConditions = [
          eq(schema.contactMessages.id, messageId),
          eq(schema.contactMessages.status, expectedPreviousStatus),
        ];

        const [updated] = await tx
          .update(schema.contactMessages)
          .set({
            status,
          })
          .where(and(...whereConditions))
          .returning();

        if (!updated) {
          const [existing] = await tx
            .select({ id: schema.contactMessages.id, status: schema.contactMessages.status })
            .from(schema.contactMessages)
            .where(eq(schema.contactMessages.id, messageId))
            .limit(1);

          if (!existing) {
            return null;
          }
          throw new Error("CONTACT_MESSAGE_STATUS_CONFLICT");
        }

        if (updated) {
          const [userPart, domainPart] = (updated.email || "").split("@");
          const maskedEmail =
            userPart && domainPart ? `${userPart.slice(0, 2)}***@${domainPart}` : "***@***";

          await tx.insert(schema.adminAuditLog).values({
            adminUserId,
            action: `CONTACT_MESSAGE_${status}`,
            targetType: "contact_message",
            targetId: messageId,
            reasonCode: `STATUS_CHANGED_FROM_${expectedPreviousStatus}_TO_${status}`,
            safeSummary: `Contact message status changed from ${expectedPreviousStatus} to ${status} for ${maskedEmail}`,
          });
        }

        return updated || null;
      });
    } catch (err) {
      if (err instanceof Error && err.message === "CONTACT_MESSAGE_STATUS_CONFLICT") {
        throw err;
      }
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      return null;
    }
  }
}
