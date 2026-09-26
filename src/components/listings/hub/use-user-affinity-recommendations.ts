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
    if (!isMounted) {
      return [];
    }

    // affinityTick triggers recalculation whenever user clicks or searches
    void affinityTick;

    return rankCategoriesByPersonalizedAffinity({
      categories,
      listings,
      followedCategoryIds,
      limit,
    });
  }, [categories, listings, followedCategoryIds, limit, isMounted, affinityTick]);

  return suggestedCategories;
}
