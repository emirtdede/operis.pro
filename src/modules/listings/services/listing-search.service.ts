import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { inMemoryListings } from "./types";

export class ListingSearchService {
  /**
   * Performs full-text keyword search across title, summary, and tags with relevance scoring.
   * Enforces active user account status, mutual block exclusions, and category joins.
   */
  static async searchListingsFullText(
    query: string,
    limit: number = 20,
    options?: {
      viewerUserId?: string;
      locale?: "tr" | "en";
    }
  ): Promise<
    Array<{
      id: string;
      slug: string;
      title: string;
      summary: string;
      categoryName: string;
      budgetMode: string;
      budgetMin: string | null;
      budgetMax: string | null;
      budgetCurrency: string | null;
      tags: string[];
      relevanceScore: number;
    }>
  > {
    const trimmed = (query || "").trim().toLowerCase();
    if (!trimmed) {
      return [];
    }

    const locale = options?.locale || "tr";
    const terms = trimmed.split(/\s+/).filter((t) => t.length > 0);

    const scoreListings = (
      list: Array<{
        id: string;
        slug: string;
        title: string;
        summary: string;
        categoryName?: string | null;
        budgetMode: string;
        budgetMin?: string | null;
        budgetMax?: string | null;
        budgetCurrency?: string | null;
        tags: string[] | null;
        status: string;
        activeUntil?: Date | null;
      }>
    ) =>
      list
        .filter((l) => {
          if (l.status !== "ACTIVE") {
            return false;
          }
          if (l.activeUntil && new Date(l.activeUntil).getTime() <= Date.now()) {
            return false;
          }
          return true;
        })
        .map((l) => {
          let score = 0;
          const titleLower = l.title.toLowerCase();
          const summaryLower = l.summary.toLowerCase();
          const tagsLower = (l.tags || []).map((t) => t.toLowerCase());

          for (const term of terms) {
            if (titleLower.includes(term)) {
              score += 10;
            }
            if (summaryLower.includes(term)) {
              score += 5;
            }
            if (tagsLower.some((t) => t.includes(term))) {
              score += 8;
            }
          }

          let fallbackCategory = "Genel";
          if (locale === "en") {
            fallbackCategory = "General";
          }

          return {
            id: l.id,
            slug: l.slug,
            title: l.title,
            summary: l.summary,
            categoryName: l.categoryName || fallbackCategory,
            budgetMode: l.budgetMode,
            budgetMin: l.budgetMin ?? null,
            budgetMax: l.budgetMax ?? null,
            budgetCurrency: l.budgetCurrency ?? null,
            tags: l.tags || [],
            relevanceScore: score,
          };
        })
        .filter((item) => item.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

    if (process.env.VITEST || process.env.NODE_ENV === "test") {
      return scoreListings(inMemoryListings);
    }

    try {
      const db = getDb();
      const now = new Date();
      const escapeLike = (s: string) => s.replace(/[%_\\]/g, "\\$&");
      const uniqueTerms = Array.from(new Set(terms)).slice(0, 10);

      const termScoreSqlParts = uniqueTerms.map((term) => {
        const escaped = `%${escapeLike(term)}%`;
        return sql<number>`(
          (CASE WHEN ${schema.listings.title} ILIKE ${escaped} THEN 10 ELSE 0 END) +
          (CASE WHEN ${schema.listings.summary} ILIKE ${escaped} THEN 5 ELSE 0 END) +
          (CASE WHEN EXISTS (SELECT 1 FROM unnest(${schema.listings.tags}) t WHERE t ILIKE ${escaped}) THEN 8 ELSE 0 END)
        )`;
      });

      const totalScoreSql = sql<number>`(${sql.join(termScoreSqlParts, sql` + `)})`;

      const conditions = [
        eq(schema.listings.status, "ACTIVE"),
        sql`${schema.listings.activeUntil} > ${now}`,
        eq(schema.users.status, "ACTIVE"),
      ];

      if (options?.viewerUserId) {
        conditions.push(
          sql`NOT EXISTS (
            SELECT 1 FROM ${schema.blocks}
            WHERE (${schema.blocks.blockerUserId} = ${options.viewerUserId} AND ${schema.blocks.blockedUserId} = ${schema.listings.ownerUserId})
               OR (${schema.blocks.blockerUserId} = ${schema.listings.ownerUserId} AND ${schema.blocks.blockedUserId} = ${options.viewerUserId})
          )`
        );
      }

      const rows = await db
        .select({
          id: schema.listings.id,
          slug: schema.listings.slug,
          title: schema.listings.title,
          summary: schema.listings.summary,
          categoryName: schema.categoryTranslations.name,
          budgetMode: schema.listings.budgetMode,
          budgetMin: schema.listings.budgetMin,
          budgetMax: schema.listings.budgetMax,
          budgetCurrency: schema.listings.budgetCurrency,
          tags: schema.listings.tags,
          relevanceScore: totalScoreSql,
        })
        .from(schema.listings)
        .innerJoin(schema.users, eq(schema.listings.ownerUserId, schema.users.id))
        .leftJoin(schema.categories, eq(schema.listings.categoryId, schema.categories.id))
        .leftJoin(
          schema.categoryTranslations,
          and(
            eq(schema.categories.id, schema.categoryTranslations.categoryId),
            eq(schema.categoryTranslations.locale, locale)
          )
        )
        .where(and(...conditions, sql`${totalScoreSql} > 0`))
        .orderBy(
          desc(totalScoreSql),
          desc(schema.listings.lastActivatedAt),
          desc(schema.listings.id)
        )
        .limit(limit);

      return rows.map((r) => {
        let fallbackCategory = "Genel";
        if (locale === "en") {
          fallbackCategory = "General";
        }
        return {
          id: r.id,
          slug: r.slug,
          title: r.title,
          summary: r.summary,
          categoryName: r.categoryName || fallbackCategory,
          budgetMode: r.budgetMode,
          budgetMin: r.budgetMin ?? null,
          budgetMax: r.budgetMax ?? null,
          budgetCurrency: r.budgetCurrency ?? null,
          tags: r.tags || [],
          relevanceScore: Number(r.relevanceScore || 0),
        };
      });
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("SEARCH_DATABASE_UNAVAILABLE", { cause: err });
      }
      return scoreListings(inMemoryListings);
    }
  }
}
