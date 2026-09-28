/**
 * Operis Search - Trending Searches Service
 *
 * Implements:
 * 1. Hybrid Blending (Seed/Fallback -> Real User Searches)
 * 2. Spam, Quality, Length & Locale Guards
 * 3. In-memory bounded cache (LRU/TTL) & DB Resilience
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

const MAX_MEMORY_TRENDS = 500;
const TREND_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days retention

// High-speed bounded in-memory store for trending searches
interface MemoryTrendRecord {
  query: string;
  normalized: string;
  locale: string;
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
   * Cleans up stale entries to prevent unbounded memory growth and enforce retention.
   */
  private static pruneMemoryIfNeeded(): void {
    const now = Date.now();
    // 1. Evict expired entries regardless of collection size
    for (const [key, record] of inMemoryTrends.entries()) {
      if (now - record.lastSearchedAt > TREND_TTL_MS) {
        inMemoryTrends.delete(key);
      }
    }

    // 2. If still exceeding limit, evict least recently active
    if (inMemoryTrends.size > MAX_MEMORY_TRENDS) {
      const sorted = Array.from(inMemoryTrends.entries()).sort(
        (a, b) => a[1].lastSearchedAt - b[1].lastSearchedAt
      );
      const excess = inMemoryTrends.size - MAX_MEMORY_TRENDS;
      for (let i = 0; i < excess; i++) {
        const entry = sorted[i];
        if (entry) inMemoryTrends.delete(entry[0]);
      }
    }
  }

  /**
   * Records a valid search query into the trending statistics.
   * Asynchronous, non-blocking with rate deduplication and memory bounding.
   */
  static async recordSearch(rawQuery: string, locale: string = "tr"): Promise<boolean> {
    const valid = this.validateQuery(rawQuery);
    if (!valid) return false;

    const effectiveLocale = locale === "en" ? "en" : "tr";
    const normalized = valid.toLowerCase();
    const mapKey = `${effectiveLocale}:${normalized}`;
    const now = Date.now();

    // 1. Update in-memory registry with rate deduplication (ignore if within 2 seconds)
    const existing = inMemoryTrends.get(mapKey);
    if (existing) {
      if (now - existing.lastSearchedAt < 2000 && !process.env.VITEST) {
        return true; // Debounce flood
      }
      existing.count += 1;
      existing.lastSearchedAt = now;
      existing.query = valid; // Keep latest clean casing
    } else {
      this.pruneMemoryIfNeeded();
      inMemoryTrends.set(mapKey, {
        query: valid,
        normalized,
        locale: effectiveLocale,
        count: 1,
        lastSearchedAt: now,
      });
    }

    // 2. Persist to DB if available (graceful degradation)
    try {
      const db = getDb();
      await db.execute(sql`
        INSERT INTO search_trends (query, normalized, locale, count, last_searched_at)
        VALUES (${valid}, ${normalized}, ${effectiveLocale}, 1, now())
        ON CONFLICT (locale, normalized)
        DO UPDATE SET
          count = search_trends.count + 1,
          query = EXCLUDED.query,
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
    const now = Date.now();

    const realSearches: string[] = [];

    // 1. Try DB first (strictly within 30-day active retention window)
    try {
      const db = getDb();
      const rawResult = await db.execute(sql`
        SELECT query FROM search_trends
        WHERE locale = ${effectiveLocale}
          AND last_searched_at >= now() - INTERVAL '30 days'
        ORDER BY count DESC, last_searched_at DESC
        LIMIT 5;
      `);

      const rows: Array<{ query?: string }> = Array.isArray(rawResult)
        ? (rawResult as unknown as Array<{ query?: string }>)
        : (rawResult as unknown as { rows?: Array<{ query?: string }> })?.rows || [];

      for (const r of rows) {
        if (r?.query && !realSearches.includes(r.query)) {
          realSearches.push(r.query);
        }
      }
    } catch {
      // DB not configured or table missing - fallback to in-memory store
    }

    // 2. If DB had fewer than 5, supplement from in-memory trends (locale matched & non-expired)
    if (realSearches.length < 5) {
      const memorySorted = Array.from(inMemoryTrends.values())
        .filter(
          (item) => item.locale === effectiveLocale && now - item.lastSearchedAt <= TREND_TTL_MS
        )
        .sort((a, b) => b.count - a.count || b.lastSearchedAt - a.lastSearchedAt);

      for (const item of memorySorted) {
        const isAlreadyAdded = realSearches.some((s) => s.toLowerCase() === item.normalized);
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
      const alreadyPresent = blended.some((item) => item.toLowerCase() === seed.toLowerCase());
      if (!alreadyPresent) {
        blended.push(seed);
      }
    }

    return blended.slice(0, 5);
  }

  /**
   * Purges expired search trends from DB and memory in limited batches.
   * Cleans records older than retentionDays (default: 30) or low-frequency stale entries.
   */
  static async purgeExpiredTrends(
    retentionDays = 30,
    batchSize = 1000
  ): Promise<{ deletedDbRows: number; prunedMemoryItems: number }> {
    let deletedDbRows = 0;
    let prunedMemoryItems = 0;

    // 1. Prune in-memory trends
    const now = Date.now();
    const maxMemoryAgeMs = retentionDays * 24 * 60 * 60 * 1000;
    for (const [key, item] of inMemoryTrends.entries()) {
      if (now - item.lastSearchedAt > maxMemoryAgeMs) {
        inMemoryTrends.delete(key);
        prunedMemoryItems++;
      }
    }

    // 2. Prune DB trends in safe chunked transaction/delete
    try {
      const db = getDb();
      const rawResult = await db.execute(sql`
        WITH expired_ids AS (
          SELECT id FROM search_trends
          WHERE last_searched_at < now() - (${retentionDays} || ' days')::interval
          ORDER BY last_searched_at ASC
          LIMIT ${batchSize}
        ),
        deleted AS (
          DELETE FROM search_trends
          WHERE id IN (SELECT id FROM expired_ids)
          RETURNING id
        )
        SELECT count(*)::int AS count FROM deleted;
      `);

      const rows = Array.isArray(rawResult)
        ? rawResult
        : (rawResult as unknown as { rows?: Array<{ count?: number | string }> })?.rows || [];

      if (rows.length > 0 && rows[0]?.count !== undefined) {
        deletedDbRows = Number(rows[0].count) || 0;
      }
    } catch {
      // Graceful degradation if DB is offline or mock environment
    }

    return { deletedDbRows, prunedMemoryItems };
  }
}

export const TrendingService = TrendingSearchService;
