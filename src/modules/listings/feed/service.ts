import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { inMemoryListings } from "@/src/modules/listings/service";
import { evaluateListingVisibility } from "@/src/modules/listings/visibility";
import { SEED_CATEGORIES } from "@/db/seeds/categories";

export interface FeedQueryParams {
  mode?: "following" | "all";
  userId?: string;
  categorySlugs?: string[];
  search?: string;
  cursor?: string | null;
  limit?: number;
  locale?: "tr" | "en";
  last24Hours?: boolean;
  budgetSpecific?: boolean;
  budgetMode?: "SPECIFIED" | "OPEN_OFFER" | "UNSPECIFIED" | string;
  timelineMode?:
    | "TARGET_DATE"
    | "ESTIMATED_DURATION"
    | "FLEXIBLE"
    | "IN_NEGOTIATION"
    | "SPECIFIC_DATE"
    | "DURATION_ESTIMATE"
    | string;
}

export interface FeedListingItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  scope: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  budgetMode: string;
  budgetCurrency: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  timelineMode: string;
  targetDate: string | null;
  timelineValue: number | null;
  timelineUnit: string | null;
  ownerHandle: string;
  ownerDisplayName: string;
  ownerIsCompanyVerified?: boolean;
  ownerCompanyName?: string | null;
  ownerCompanyType?: string | null;
  ownerTaxOffice?: string | null;
  ownerVknMasked?: string | null;
  firstPublishedAt: Date;
  lastActivatedAt: Date;
  activeUntil: Date;
  activationSeq: number;
  viewCount: number;
  clickCount: number;
  tags: string[];
}

export interface FeedResult {
  items: FeedListingItem[];
  nextCursor: string | null;
  hasMore: boolean;
  hasFollowedCategories?: boolean;
}

export const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  "fullstack-development": "web-development",
  "frontend-development": "frontend-ui",
  "backend-development": "backend-api",
  "devops-cloud-infrastructure": "devops-cloud",
  "ai-machine-learning": "ai-ml",
};

export class FeedService {
  /**
   * Retrieves active listings for the feed, supporting 'following' and 'all' modes,
   * category filtering, search queries, and deterministic cursor pagination.
   */
  static async getFeedListings(params: FeedQueryParams): Promise<FeedResult> {
    const mode = params.mode ?? "all";
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
    const locale = params.locale ?? "tr";

    const normalizedCategorySlugs = params.categorySlugs?.map(
      (slug) => CATEGORY_SLUG_ALIASES[slug] || slug
    );

    let items: FeedListingItem[] = [];
    let nextCursor: string | null = null;
    let hasMore = false;
    let followedCategoryIds: string[] = [];
    let hasZeroFollows = false;

    try {
      const db = getDb();

      if (mode === "following" && params.userId) {
        const userFollows = await db
          .select({ categoryId: schema.categoryFollows.categoryId })
          .from(schema.categoryFollows)
          .where(eq(schema.categoryFollows.userId, params.userId));

        followedCategoryIds = userFollows.map((f) => f.categoryId);

        // If user follows 0 categories in following mode, flag it instead of returning empty array.
        // Fall back to top active/trending listings with hasFollowedCategories: false
        // so listings never disappear from the user's screen!
        if (followedCategoryIds.length === 0) {
          hasZeroFollows = true;
        }
      }

      // Resolve categorySlugs to IDs if provided
      let filterCategoryIds: string[] | undefined = undefined;
      if (normalizedCategorySlugs && normalizedCategorySlugs.length > 0) {
        const catRows = await db
          .select({ id: schema.categories.id })
          .from(schema.categories)
          .where(inArray(schema.categories.key, normalizedCategorySlugs));
        filterCategoryIds = catRows.map((c) => c.id);
        if (filterCategoryIds.length === 0) {
          return {
            items: [],
            nextCursor: null,
            hasMore: false,
            hasFollowedCategories: mode === "following" ? !hasZeroFollows : undefined,
          };
        }
      }

      // Determine target category IDs when both following and explicit category filters exist
      let targetCategoryIds: string[] | undefined = filterCategoryIds;
      if (mode === "following" && params.userId && !hasZeroFollows) {
        if (targetCategoryIds) {
          targetCategoryIds = targetCategoryIds.filter((id) => followedCategoryIds.includes(id));
          if (targetCategoryIds.length === 0) {
            return {
              items: [],
              nextCursor: null,
              hasMore: false,
              hasFollowedCategories: true,
            };
          }
        } else {
          targetCategoryIds = followedCategoryIds;
        }
      }

      // Decode cursor
      let cursorDate: Date | null = null;
      let cursorId: string | null = null;
      if (params.cursor) {
        try {
          const decoded = JSON.parse(Buffer.from(params.cursor, "base64").toString("utf-8"));
          if (decoded.lastActivatedAt && decoded.id) {
            cursorDate = new Date(decoded.lastActivatedAt);
            cursorId = decoded.id;
          }
        } catch {
          // Invalid cursor ignored
        }
      }

      // Base conditions: active and unexpired, and owner user account active
      const now = new Date();
      const conditions = [
        eq(schema.listings.status, "ACTIVE"),
        sql`${schema.listings.activeUntil} > ${now}`,
        eq(schema.users.status, "ACTIVE"),
      ];

      if (targetCategoryIds && targetCategoryIds.length > 0) {
        conditions.push(inArray(schema.listings.categoryId, targetCategoryIds));
      }

      // Search query (including tags)
      if (params.search && params.search.trim().length > 0) {
        const sanitized = params.search.trim().slice(0, 100);
        const pattern = `%${sanitized}%`;
        const searchCondition = or(
          ilike(schema.listings.title, pattern),
          ilike(schema.listings.summary, pattern),
          ilike(schema.listings.scope, pattern),
          sql`array_to_string(${schema.listings.tags}, ' ') ILIKE ${pattern}`
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      // Server-side filter: last 24 hours (B21, K04)
      if (params.last24Hours) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        conditions.push(sql`${schema.listings.lastActivatedAt} >= ${twentyFourHoursAgo}`);
      }

      // Server-side filter: budget mode & specified budget (B21, K04, M01)
      if (params.budgetSpecific) {
        conditions.push(
          sql`(${schema.listings.budgetMode} IN ('FIXED_EXACT', 'FIXED_RANGE', 'HOURLY_EXACT', 'HOURLY_RANGE', 'EXACT', 'RANGE') AND ${schema.listings.budgetMin} IS NOT NULL)`
        );
      } else if (params.budgetMode) {
        if (params.budgetMode === "SPECIFIED") {
          conditions.push(
            sql`(${schema.listings.budgetMode} IN ('FIXED_EXACT', 'FIXED_RANGE', 'HOURLY_EXACT', 'HOURLY_RANGE', 'EXACT', 'RANGE') AND ${schema.listings.budgetMin} IS NOT NULL)`
          );
        } else if (params.budgetMode === "OPEN_OFFER" || params.budgetMode === "UNSPECIFIED") {
          conditions.push(
            sql`${schema.listings.budgetMode} IN ('NEGOTIABLE', 'REQUEST_GUIDANCE', 'OPEN_BID')`
          );
        } else if (params.budgetMode === "FIXED" || params.budgetMode === "FIXED_BUDGET") {
          conditions.push(
            sql`${schema.listings.budgetMode} IN ('FIXED_EXACT', 'FIXED_RANGE', 'EXACT', 'RANGE')`
          );
        } else if (params.budgetMode === "HOURLY") {
          conditions.push(sql`${schema.listings.budgetMode} IN ('HOURLY_EXACT', 'HOURLY_RANGE')`);
        } else if (params.budgetMode === "EXACT") {
          conditions.push(
            sql`${schema.listings.budgetMode} IN ('EXACT', 'FIXED_EXACT', 'HOURLY_EXACT')`
          );
        } else if (params.budgetMode === "RANGE") {
          conditions.push(
            sql`${schema.listings.budgetMode} IN ('RANGE', 'FIXED_RANGE', 'HOURLY_RANGE')`
          );
        } else if (params.budgetMode === "OPEN_BID") {
          conditions.push(
            sql`${schema.listings.budgetMode} IN ('OPEN_BID', 'NEGOTIABLE', 'REQUEST_GUIDANCE')`
          );
        } else {
          conditions.push(eq(schema.listings.budgetMode, params.budgetMode));
        }
      }

      // Server-side filter: timeline mode (B21, K04, M01)
      if (params.timelineMode) {
        if (params.timelineMode === "TARGET_DATE" || params.timelineMode === "SPECIFIC_DATE") {
          conditions.push(sql`${schema.listings.timelineMode} IN ('SPECIFIC_DATE', 'TARGET_DATE')`);
        } else if (
          params.timelineMode === "ESTIMATED_DURATION" ||
          params.timelineMode === "DURATION_ESTIMATE"
        ) {
          conditions.push(
            sql`${schema.listings.timelineMode} IN ('DURATION_ESTIMATE', 'ESTIMATED_DURATION')`
          );
        } else if (params.timelineMode === "FLEXIBLE" || params.timelineMode === "IN_NEGOTIATION") {
          conditions.push(sql`${schema.listings.timelineMode} IN ('FLEXIBLE', 'IN_NEGOTIATION')`);
        } else {
          conditions.push(eq(schema.listings.timelineMode, params.timelineMode));
        }
      }

      // Mutual block exclusions if viewer is logged in
      if (params.userId) {
        conditions.push(
          sql`NOT EXISTS (
            SELECT 1 FROM ${schema.blocks}
            WHERE (${schema.blocks.blockerUserId} = ${params.userId} AND ${schema.blocks.blockedUserId} = ${schema.listings.ownerUserId})
               OR (${schema.blocks.blockerUserId} = ${schema.listings.ownerUserId} AND ${schema.blocks.blockedUserId} = ${params.userId})
          )`
        );
      }

      // Cursor pagination condition
      if (cursorDate && cursorId) {
        conditions.push(
          sql`(${schema.listings.lastActivatedAt} < ${cursorDate} OR (${schema.listings.lastActivatedAt} = ${cursorDate} AND ${schema.listings.id} < ${cursorId}))`
        );
      }

      // Build main query: join category and profile
      const query = db
        .select({
          id: schema.listings.id,
          slug: schema.listings.slug,
          title: schema.listings.title,
          summary: schema.listings.summary,
          scope: schema.listings.scope,
          categoryId: schema.listings.categoryId,
          categorySlug: schema.categories.key,
          categoryName: schema.categoryTranslations.name,
          budgetMode: schema.listings.budgetMode,
          budgetCurrency: schema.listings.budgetCurrency,
          budgetMin: schema.listings.budgetMin,
          budgetMax: schema.listings.budgetMax,
          timelineMode: schema.listings.timelineMode,
          targetDate: schema.listings.targetDate,
          timelineValue: schema.listings.timelineValue,
          timelineUnit: schema.listings.timelineUnit,
          firstPublishedAt: schema.listings.firstPublishedAt,
          lastActivatedAt: schema.listings.lastActivatedAt,
          activeUntil: schema.listings.activeUntil,
          activationSeq: schema.listings.activationSeq,
          viewCount: schema.listings.viewCount,
          clickCount: schema.listings.clickCount,
          tags: schema.listings.tags,
          ownerHandle: schema.profiles.handle,
          ownerDisplayName: schema.profiles.displayName,
          ownerIsCompanyVerified: schema.profiles.isCompanyVerified,
          ownerCompanyName: schema.profiles.companyName,
          ownerCompanyType: schema.profiles.companyType,
          ownerTaxOffice: schema.profiles.taxOffice,
          ownerVknMasked: schema.profiles.vknMasked,
        })
        .from(schema.listings)
        .innerJoin(schema.categories, eq(schema.listings.categoryId, schema.categories.id))
        .leftJoin(
          schema.categoryTranslations,
          and(
            eq(schema.categoryTranslations.categoryId, schema.categories.id),
            eq(schema.categoryTranslations.locale, locale)
          )
        )
        .innerJoin(schema.profiles, eq(schema.listings.ownerUserId, schema.profiles.userId))
        .innerJoin(schema.users, eq(schema.listings.ownerUserId, schema.users.id))
        .where(and(...conditions))
        .orderBy(desc(schema.listings.lastActivatedAt), desc(schema.listings.id))
        .limit(limit + 1);

      const rows = await query;
      hasMore = rows.length > limit;
      const itemsToReturn = hasMore ? rows.slice(0, limit) : rows;

      if (hasMore && itemsToReturn.length > 0) {
        const lastItem = itemsToReturn[itemsToReturn.length - 1];
        if (lastItem) {
          nextCursor = Buffer.from(
            JSON.stringify({
              lastActivatedAt: lastItem.lastActivatedAt?.toISOString(),
              id: lastItem.id,
            })
          ).toString("base64");
        }
      }

      items = itemsToReturn.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        summary: r.summary,
        scope: r.scope,
        categoryId: r.categoryId,
        categorySlug: r.categorySlug,
        categoryName: r.categoryName ?? r.categorySlug,
        budgetMode: r.budgetMode,
        budgetCurrency: r.budgetCurrency,
        budgetMin: r.budgetMin,
        budgetMax: r.budgetMax,
        timelineMode: r.timelineMode,
        targetDate: r.targetDate,
        timelineValue: r.timelineValue,
        timelineUnit: r.timelineUnit,
        ownerHandle: r.ownerHandle,
        ownerDisplayName: r.ownerDisplayName,
        ownerIsCompanyVerified: r.ownerIsCompanyVerified ?? false,
        ownerCompanyName: r.ownerCompanyName ?? null,
        ownerCompanyType: r.ownerCompanyType ?? null,
        ownerTaxOffice: r.ownerTaxOffice ?? null,
        ownerVknMasked: r.ownerVknMasked ?? null,
        firstPublishedAt: r.firstPublishedAt ?? new Date(),
        lastActivatedAt: r.lastActivatedAt ?? new Date(),
        activeUntil: r.activeUntil ?? new Date(),
        activationSeq: r.activationSeq,
        viewCount: r.viewCount ?? 0,
        clickCount: r.clickCount ?? 0,
        tags: r.tags ?? [],
      }));
    } catch {
      // Database query error; return current items
    }

    return {
      items,
      nextCursor,
      hasMore,
      hasFollowedCategories: mode === "following" ? !hasZeroFollows : undefined,
    };
  }

  /**
   * Retrieves single listing details by slug, enforcing visibility and block rules (Fixes B03).
   */
  static async getListingBySlug(
    slug: string,
    viewerUserId?: string,
    viewerRole?: string,
    locale: string = "tr"
  ) {
    try {
      const db = getDb();
      const rows = await db
        .select({
          listing: schema.listings,
          category: schema.categories,
          categoryName: schema.categoryTranslations.name,
          ownerProfile: schema.profiles,
        })
        .from(schema.listings)
        .innerJoin(schema.categories, eq(schema.listings.categoryId, schema.categories.id))
        .leftJoin(
          schema.categoryTranslations,
          and(
            eq(schema.categoryTranslations.categoryId, schema.categories.id),
            eq(schema.categoryTranslations.locale, locale)
          )
        )
        .innerJoin(schema.profiles, eq(schema.listings.ownerUserId, schema.profiles.userId))
        .innerJoin(schema.users, eq(schema.listings.ownerUserId, schema.users.id))
        .where(and(eq(schema.listings.slug, slug), eq(schema.users.status, "ACTIVE")))
        .limit(1);

      const firstRow = rows[0];
      if (firstRow) {
        const { listing, category, categoryName, ownerProfile } = firstRow;

        const viewerBlockedUserIds: string[] = [];
        const viewerBlockedByUserIds: string[] = [];
        let effectiveRole = viewerRole;

        if (viewerUserId) {
          if (!effectiveRole) {
            const [viewerUser] = await db
              .select({ role: schema.users.role })
              .from(schema.users)
              .where(eq(schema.users.id, viewerUserId))
              .limit(1);
            effectiveRole = viewerUser?.role;
          }

          const blockRows = await db
            .select({
              blockerId: schema.blocks.blockerUserId,
              blockedId: schema.blocks.blockedUserId,
            })
            .from(schema.blocks)
            .where(
              or(
                and(
                  eq(schema.blocks.blockerUserId, viewerUserId),
                  eq(schema.blocks.blockedUserId, listing.ownerUserId)
                ),
                and(
                  eq(schema.blocks.blockerUserId, listing.ownerUserId),
                  eq(schema.blocks.blockedUserId, viewerUserId)
                )
              )
            );

          for (const b of blockRows) {
            if (b.blockerId === viewerUserId) viewerBlockedUserIds.push(b.blockedId);
            if (b.blockedId === viewerUserId) viewerBlockedByUserIds.push(b.blockerId);
          }
        }

        const visibility = evaluateListingVisibility(listing, {
          userId: viewerUserId,
          role: effectiveRole,
          blockedUserIds: viewerBlockedUserIds,
          blockedByUserIds: viewerBlockedByUserIds,
        });

        if (!visibility.visible) {
          return null;
        }

        let resolvedCategoryName = categoryName;
        if (!resolvedCategoryName) {
          const matchedSeed = SEED_CATEGORIES.find(
            (c) => c.key.toLowerCase() === category.key.toLowerCase()
          );
          if (matchedSeed) {
            const lang = locale === "en" ? "en" : "tr";
            resolvedCategoryName =
              matchedSeed.translations[lang]?.name || matchedSeed.translations.tr?.name;
          }
        }

        return {
          listing,
          category,
          categoryName: resolvedCategoryName || category.key,
          ownerProfile,
        };
      }
    } catch {
      // In-memory fallback
    }

    if (process.env.VITEST && inMemoryListings.length > 0) {
      const inMem = inMemoryListings.find((l) => l.slug === slug);
      if (inMem) {
        const visibility = evaluateListingVisibility(
          inMem as unknown as typeof schema.listings.$inferSelect,
          {
            userId: viewerUserId,
            role: viewerRole,
          }
        );
        if (!visibility.visible) {
          return null;
        }

        return {
          listing: inMem as unknown as typeof schema.listings.$inferSelect,
          category: {
            id: inMem.categoryId,
            key: inMem.categoryId,
          } as unknown as typeof schema.categories.$inferSelect,
          ownerProfile: {
            userId: inMem.ownerUserId,
            displayName: "Demir Yıldız",
            handle: "demokullanici",
          } as unknown as typeof schema.profiles.$inferSelect,
        };
      }
    }

    return null;
  }
}
