"use client";

import { useState, useEffect, useMemo } from "react";
import type { CategoryDto } from "@/src/modules/categories/service";
import type { FeedListingItem } from "@/src/modules/listings/feed/service";
import {
  rankCategoriesByPersonalizedAffinity,
  subscribeToAffinityChanges,
} from "@/src/lib/recommendations/user-affinity";

export function useUserAffinityRecommendations({
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
  const [isMounted, setIsMounted] = useState(false);
  const [affinityTick, setAffinityTick] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    const unsubscribe = subscribeToAffinityChanges(() => {
      setAffinityTick((prev) => prev + 1);
    });
    return unsubscribe;
  }, []);

  const suggestedCategories = useMemo(() => {
    // Before mounting on the client, use fallback ranking based on active listings
    // to ensure 100% hydration consistency between SSR and CSR.
    if (!isMounted) {
      const unfollowed = categories.filter((c) => !followedCategoryIds.has(c.id));
      const pool = unfollowed.length > 0 ? unfollowed : categories;
      return [...pool]
        .sort((a, b) => (b.listingCount ?? 0) - (a.listingCount ?? 0) || a.sortOrder - b.sortOrder)
        .slice(0, limit);
    }

    return rankCategoriesByPersonalizedAffinity({
      categories,
      listings,
      followedCategoryIds,
      limit,
    });
    // affinityTick triggers recalculation whenever user clicks or searches
  }, [categories, listings, followedCategoryIds, limit, isMounted, affinityTick]);

  return suggestedCategories;
}
