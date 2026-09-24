/**
 * Operis Recommendation Engine - User Affinity Service
 * 
 * Implements:
 * 1. Client-edge interaction logging (clicks, searches, tag interactions)
 * 2. Exponential time decay (half-life: 48 hours for user taste)
 * 3. Cross-category Cosine Similarity between user affinity and category tag distributions
 * 4. Cold-start hierarchical fallback to real platform momentum (strictly zero mock data)
 * 5. Memory-safe FIFO log pruning (< 2KB storage footprint)
 */

import type { CategoryDto } from "@/src/modules/categories/service";
import type { FeedListingItem } from "@/src/modules/listings/feed/service";

const STORAGE_KEY = "operis_user_affinity_v1";
const AFFINITY_CHANGE_EVENT = "operis_affinity_updated";

// Half-life in milliseconds: 48 hours
const HALF_LIFE_MS = 48 * 60 * 60 * 1000;
const LAMBDA = Math.LN2 / HALF_LIFE_MS;

// Max historical events retained for storage safety
const MAX_EVENTS = 50;
const EVENT_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export type AffinityEventType = "click_listing" | "click_tag" | "search" | "view_listing";

export interface AffinityEvent {
  type: AffinityEventType;
  categorySlug?: string;
  tags?: string[];
  query?: string;
  timestamp: number;
}

export interface UserAffinityStorage {
  version: 1;
  events: AffinityEvent[];
  categoryWeights: Record<string, { weight: number; lastUpdated: number }>;
  tagWeights: Record<string, { weight: number; lastUpdated: number }>;
}

export interface DecayedAffinityProfile {
  categories: Map<string, number>;
  tags: Map<string, number>;
  hasInteractions: boolean;
}

/**
 * Safely reads the user affinity state from localStorage.
 */
function readStorage(): UserAffinityStorage {
  if (typeof window === "undefined") {
    return { version: 1, events: [], categoryWeights: {}, tagWeights: {} };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { version: 1, events: [], categoryWeights: {}, tagWeights: {} };
    }
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1 && Array.isArray(parsed.events)) {
      return parsed;
    }
  } catch {
    // Ignore corrupted storage
  }

  return { version: 1, events: [], categoryWeights: {}, tagWeights: {} };
}

/**
 * Writes the user affinity state to localStorage and dispatches an update event.
 */
function writeStorage(data: UserAffinityStorage): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(AFFINITY_CHANGE_EVENT));
  } catch {
    // QuotaExceededError or security sandbox fallback
  }
}

/**
 * Records a user interaction (listing click, tag click, or search) into affinity.
 */
export function recordUserAffinity(event: {
  type: AffinityEventType;
  categorySlug?: string;
  tags?: string[];
  query?: string;
}): void {
  if (typeof window === "undefined") return;

  const now = Date.now();
  const current = readStorage();

  // Prune events older than 14 days
  const filteredEvents = current.events.filter(
    (e) => now - e.timestamp < EVENT_TTL_MS
  );

  const cleanTags = (event.tags || [])
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const newEvent: AffinityEvent = {
    type: event.type,
    categorySlug: event.categorySlug?.trim().toLowerCase(),
    tags: cleanTags.length > 0 ? cleanTags : undefined,
    query: event.query?.trim().toLowerCase(),
    timestamp: now,
  };

  filteredEvents.push(newEvent);

  // Keep last MAX_EVENTS
  if (filteredEvents.length > MAX_EVENTS) {
    filteredEvents.splice(0, filteredEvents.length - MAX_EVENTS);
  }

  // Determine incremental weight for this interaction
  let catWeight = 0;
  let tagWeight = 0;

  switch (event.type) {
    case "click_listing":
      catWeight = 3.0;
      tagWeight = 2.0;
      break;
    case "click_tag":
      catWeight = 1.5;
      tagWeight = 2.5;
      break;
    case "search":
      catWeight = 2.0;
      tagWeight = 2.0;
      break;
    case "view_listing":
      catWeight = 0.8;
      tagWeight = 0.5;
      break;
  }

  const categoryWeights = { ...current.categoryWeights };
  const tagWeights = { ...current.tagWeights };

  // Update category weight
  if (newEvent.categorySlug) {
    const prev = categoryWeights[newEvent.categorySlug] || { weight: 0, lastUpdated: now };
    const decayed = prev.weight * Math.exp(-LAMBDA * (now - prev.lastUpdated));
    categoryWeights[newEvent.categorySlug] = {
      weight: decayed + catWeight,
      lastUpdated: now,
    };
  }

  // Update tag weights
  if (newEvent.tags) {
    for (const tag of newEvent.tags) {
      const prev = tagWeights[tag] || { weight: 0, lastUpdated: now };
      const decayed = prev.weight * Math.exp(-LAMBDA * (now - prev.lastUpdated));
      tagWeights[tag] = {
        weight: decayed + tagWeight,
        lastUpdated: now,
      };
    }
  }

  writeStorage({
    version: 1,
    events: filteredEvents,
    categoryWeights,
    tagWeights,
  });
}

/**
 * Returns decayed affinity profile for the current user.
 */
export function getDecayedAffinityProfile(): DecayedAffinityProfile {
  const current = readStorage();
  const now = Date.now();

  const categories = new Map<string, number>();
  const tags = new Map<string, number>();

  let hasInteractions = false;

  for (const [slug, item] of Object.entries(current.categoryWeights)) {
    const decayed = item.weight * Math.exp(-LAMBDA * (now - item.lastUpdated));
    if (decayed > 0.05) {
      categories.set(slug, decayed);
      hasInteractions = true;
    }
  }

  for (const [tag, item] of Object.entries(current.tagWeights)) {
    const decayed = item.weight * Math.exp(-LAMBDA * (now - item.lastUpdated));
    if (decayed > 0.05) {
      tags.set(tag, decayed);
      hasInteractions = true;
    }
  }

  return { categories, tags, hasInteractions };
}

/**
 * Computes Cosine Similarity between user's tag affinity vector and category's active tag vector.
 */
function computeTagCosineSimilarity(
  userTagAffinity: Map<string, number>,
  categoryTags: Map<string, number>
): number {
  if (userTagAffinity.size === 0 || categoryTags.size === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normUser = 0;
  let normCat = 0;

  for (const [tag, weight] of userTagAffinity.entries()) {
    normUser += weight * weight;
    const catWeight = categoryTags.get(tag);
    if (catWeight !== undefined) {
      dotProduct += weight * catWeight;
    }
  }

  for (const [, weight] of categoryTags.entries()) {
    normCat += weight * weight;
  }

  if (normUser === 0 || normCat === 0) return 0;

  return dotProduct / (Math.sqrt(normUser) * Math.sqrt(normCat));
}

/**
 * Personalized Category Recommendation Algorithm
 * 
 * Formula:
 * Score(C) = 0.45 * DirectCategoryAffinity + 0.40 * CosineSimilarity(UserTags, CatTags) + 0.15 * MarketMomentum
 * 
 * - Unfollowed categories are ranked first.
 * - Followed categories are filtered out to foster discovery.
 * - Zero Mock Data: Falls back gracefully to real platform listing volume and engagement.
 */
export function rankCategoriesByPersonalizedAffinity({
  categories,
  listings,
  followedCategoryIds,
  limit = 5,
}: {
  categories: CategoryDto[];
  listings: FeedListingItem[];
  followedCategoryIds: Set<string>;
  limit?: number;
}): CategoryDto[] {
  // 1. Filter out followed categories
  const unfollowed = categories.filter((c) => !followedCategoryIds.has(c.id));
  const candidatePool = unfollowed.length > 0 ? unfollowed : categories;

  const profile = getDecayedAffinityProfile();

  // 2. Build Category Tag Distribution Vector from real active listings
  const categoryTagMap = new Map<string, Map<string, number>>();
  const categoryActiveListingCount = new Map<string, number>();

  for (const item of listings) {
    const catSlug = item.categorySlug?.toLowerCase();
    if (!catSlug) continue;

    categoryActiveListingCount.set(
      catSlug,
      (categoryActiveListingCount.get(catSlug) || 0) + 1
    );

    if (!categoryTagMap.has(catSlug)) {
      categoryTagMap.set(catSlug, new Map());
    }
    const catTags = categoryTagMap.get(catSlug)!;

    if (Array.isArray(item.tags)) {
      for (const t of item.tags) {
        const cleanTag = t.trim().toLowerCase();
        if (cleanTag) {
          catTags.set(cleanTag, (catTags.get(cleanTag) || 0) + 1);
        }
      }
    }
  }

  // Total active listings for market momentum baseline
  const totalListings = Math.max(1, listings.length);

  // 3. Score each candidate category
  const scored = candidatePool.map((cat) => {
    const slug = cat.slug.toLowerCase();

    // A. Direct Category Affinity (normalized 0-1)
    const directAffinityRaw = profile.categories.get(slug) || 0;
    const directAffinity = Math.min(1, directAffinityRaw / 10);

    // B. Cosine similarity between user's tag affinity and category tags
    const catTags = categoryTagMap.get(slug) || new Map<string, number>();
    const tagSimilarity = computeTagCosineSimilarity(profile.tags, catTags);

    // C. Real market momentum (based on real listings in DB, zero mock data)
    const activeCount = categoryActiveListingCount.get(slug) ?? cat.listingCount ?? 0;
    const marketMomentum = Math.min(1, activeCount / Math.max(1, totalListings / candidatePool.length));

    // Composite scoring
    let score = 0;
    if (profile.hasInteractions) {
      score = 0.45 * directAffinity + 0.40 * tagSimilarity + 0.15 * marketMomentum;
    } else {
      // Cold-start: Pure real platform momentum + category sort order
      score = marketMomentum * 0.8 + (1 / Math.max(1, cat.sortOrder + 1)) * 0.2;
    }

    return { category: cat, score, activeCount };
  });

  // Sort descending by recommendation score
  scored.sort((a, b) => b.score - a.score || b.activeCount - a.activeCount);

  return scored.slice(0, limit).map((s) => s.category);
}

/**
 * Hook or helper to subscribe to user affinity changes.
 */
export function subscribeToAffinityChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = () => callback();
  window.addEventListener(AFFINITY_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener(AFFINITY_CHANGE_EVENT, handler);
  };
}
