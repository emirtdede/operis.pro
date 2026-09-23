/**
 * Operis Search - Trending Searches Service
 * 
 * Implements:
 * 1. Hybrid Blending (Seed/Fallback -> Real User Searches)
 * 2. Spam, Quality & Length Guards
 * 3. In-memory & DB Resilience
 */

import { getDb } from "@/src/lib/db";
import { sql } from "drizzle-orm";
import { getSeedTrending } from "./trending-constants";

const BLOCKED_PATTERNS = [
  /<[^>]*>/, // HTML tags
  /https?:\/\//i, // URLs
  /www\./i, // Web domains
  /javascript:/i, // JS injection
  /select\s+.*from/i, // SQL injection patterns
  /union\s+select/i,
  /insert\s+into/i,
  /drop\s+table/i,
  /(casino|betting|kumar|bahis|porn|porno|sex|viagra)/i, // Obvious spam keywords
];

// High-speed in-memory store for trending searches (resilient across serverless/dev instances)
interface MemoryTrendRecord {
  query: string;
  normalized: string;
  count: number;
  lastSearchedAt: number;
}

const inMemoryTrends: Map<string, MemoryTrendRecord> = new Map();

export class TrendingSearchService {
  /**
   * Sanitizes and validates a query for inclusion into trending statistics.
   * Returns cleaned query or null if spam/invalid.
   */
  static validateQuery(rawQuery: string): string | null {
    if (!rawQuery || typeof rawQuery !== "string") return null;

    const trimmed = rawQuery.trim().replace(/\s+/g, " ");

    // Length guard: 2 to 40 characters
    if (trimmed.length < 2 || trimmed.length > 40) return null;

    // Check blocked spam patterns
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(trimmed)) return null;
    }

    return trimmed;
  }

  /**
   * Records a valid search query into the trending statistics.
   * Asynchronous, non-blocking.
   */
  static async recordSearch(rawQuery: string, locale: string = "tr"): Promise<boolean> {
    const valid = this.validateQuery(rawQuery);
    if (!valid) return false;

    const normalized = valid.toLowerCase();

    // 1. Update in-memory registry
    const existing = inMemoryTrends.get(normalized);
    if (existing) {
      existing.count += 1;
      existing.lastSearchedAt = Date.now();
      existing.query = valid; // Keep latest clean casing
    } else {
      inMemoryTrends.set(normalized, {
        query: valid,
        normalized,
        count: 1,
        lastSearchedAt: Date.now(),
      });
    }

    // 2. Persist to DB if available (graceful degradation)
    try {
      const db = getDb();
      await db.execute(sql`
        INSERT INTO search_trends (query, normalized, locale, count, last_searched_at)
        VALUES (${valid}, ${normalized}, ${locale}, 1, now())
        ON CONFLICT (normalized)
        DO UPDATE SET
          count = search_trends.count + 1,
          last_searched_at = now();
      `);
    } catch {
      // Graceful in-memory fallback
    }

    return true;
  }

  /**
   * Retrieves the top 5 trending searches with Hybrid Blending.
   * If real searches < 5, fills the remaining slots with curated seed data.
   */
  static async getTopTrending(locale: string = "tr"): Promise<string[]> {
    const effectiveLocale = locale === "en" ? "en" : "tr";
    const seeds = getSeedTrending(effectiveLocale);

    const realSearches: string[] = [];

    // 1. Try DB first
    try {
      const db = getDb();
      const rows = (await db.execute(sql`
        SELECT query FROM search_trends
        WHERE locale = ${effectiveLocale}
        ORDER BY count DESC, last_searched_at DESC
        LIMIT 5;
      `)) as unknown as { query: string }[];

      if (Array.isArray(rows)) {
        for (const r of rows) {
          if (r?.query && !realSearches.includes(r.query)) {
            realSearches.push(r.query);
          }
        }
      }
    } catch {
      // DB not configured or table missing - fallback to in-memory store
    }

    // 2. If DB had fewer than 5, supplement from in-memory trends
    if (realSearches.length < 5) {
      const memorySorted = Array.from(inMemoryTrends.values())
        .sort((a, b) => b.count - a.count || b.lastSearchedAt - a.lastSearchedAt);

      for (const item of memorySorted) {
        const isAlreadyAdded = realSearches.some(
          (s) => s.toLowerCase() === item.normalized
        );
        if (!isAlreadyAdded) {
          realSearches.push(item.query);
        }
        if (realSearches.length >= 5) break;
      }
    }

    // 3. Hybrid Blending: If still < 5, fill remaining slots with seed items
    const blended = [...realSearches];
    for (const seed of seeds) {
      if (blended.length >= 5) break;
      const alreadyPresent = blended.some(
        (item) => item.toLowerCase() === seed.toLowerCase()
      );
      if (!alreadyPresent) {
        blended.push(seed);
      }
    }

    return blended.slice(0, 5);
  }
}
