import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { FeedListingItem } from "@/src/modules/listings/feed/service";
import type { BatchListingTarget } from "@/src/components/offers/batch-offer-wizard-modal";
import type { SubmitOfferModalProps } from "@/src/components/offers/submit-offer-modal";
import type {
  UnifiedListingsHubProps,
  QuickOfferTarget,
  FullModalListing,
  TrendingTagItem,
} from "./types";

export function useListingsHubState({
  initialItems,
  initialCursor,
  initialHasMore,
  initialMode,
  initialView,
  categorySlug,
  searchQuery,
  categories,
  hasFollowedCategories = true,
  locale,
}: UnifiedListingsHubProps) {
  const isTr = locale === "tr";

  // Mode: "following" vs "all"
  const [mode, setMode] = useState<"following" | "all">(initialMode);

  // View: "stream" (Social timeline list) vs "catalog" (Marketplace grid cards)
  const [view] = useState<"stream" | "catalog">(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlView = urlParams.get("view");
      if (urlView === "stream" || urlView === "catalog") return urlView;
    }
    return initialView || "stream";
  });

  // Feed items & cursor state
  const [items, setItems] = useState<FeedListingItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isTabLoading, setIsTabLoading] = useState<boolean>(false);
  const [hasFollowed, setHasFollowed] = useState<boolean>(hasFollowedCategories);

  // Quick Filter Chips State
  const [chipLast24h, setChipLast24h] = useState(false);
  const [chipFixedBudget, setChipFixedBudget] = useState(false);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Batch Selection State (for Catalog view)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchOpen, setIsBatchOpen] = useState<boolean>(false);

  // Followed categories set
  const [followedCategoryIds, setFollowedCategoryIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    categories.forEach((c) => {
      if (c.isFollowed) set.add(c.id);
    });
    return set;
  });

  // Modal / Drawer state for Quick Offer
  const [quickOfferTarget, setQuickOfferTarget] = useState<QuickOfferTarget | null>(null);
  const [fullModalListing, setFullModalListing] = useState<FullModalListing | null>(null);
  const [fullModalInitialData, setFullModalInitialData] = useState<SubmitOfferModalProps["initialData"]>(undefined);

  // Refs for infinite scroll and request deduplication
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastTriggerTimeRef = useRef<number>(0);
  const filterSeqRef = useRef(0);

  // Sync initial props when navigating
  useEffect(() => {
    if (!chipLast24h && !chipFixedBudget) {
      setItems(initialItems);
      setCursor(initialCursor);
      setHasMore(initialHasMore);
      setErrorMsg(null);
    }
  }, [initialItems, initialCursor, initialHasMore, chipLast24h, chipFixedBudget]);

  // Dynamic multi-criteria client sorting
  const sortedItems = useMemo(() => {
    const list = [...items];
    if (sortBy === "expiring_soon") {
      return list.sort(
        (a, b) => new Date(a.activeUntil).getTime() - new Date(b.activeUntil).getTime()
      );
    }
    if (sortBy === "budget_desc") {
      return list.sort((a, b) => {
        const valA = Number(a.budgetMax ?? a.budgetMin ?? 0);
        const valB = Number(b.budgetMax ?? b.budgetMin ?? 0);
        return valB - valA;
      });
    }
    if (sortBy === "budget_asc") {
      return list.sort((a, b) => {
        const valA = Number(a.budgetMin ?? a.budgetMax ?? 0);
        const valB = Number(b.budgetMin ?? b.budgetMax ?? 0);
        return valA - valB;
      });
    }
    if (sortBy === "proposals_desc") {
      return list.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
    }
    // "newest" default
    return list.sort(
      (a, b) =>
        new Date(b.lastActivatedAt ?? b.firstPublishedAt).getTime() -
        new Date(a.lastActivatedAt ?? a.firstPublishedAt).getTime()
    );
  }, [items, sortBy]);

  // Fetch helper when mode, chips or filters change
  const fetchListings = useCallback(
    async (targetMode: "following" | "all", isLoadMore = false) => {
      const currentSeq = ++filterSeqRef.current;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsTabLoading(true);
      }
      setErrorMsg(null);

      try {
        const params = new URLSearchParams();
        params.set("mode", targetMode);
        params.set("locale", locale);
        if (categorySlug) params.set("category", categorySlug);
        if (searchQuery) params.set("q", searchQuery);
        if (chipLast24h) params.set("last24Hours", "true");
        if (chipFixedBudget) params.set("budgetSpecific", "true");
        if (isLoadMore && cursor) {
          params.set("cursor", cursor);
        }

        const res = await fetch(`/api/listings/feed?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Request failed");
        const data = await res.json();

        if (currentSeq !== filterSeqRef.current) return;

        if (isLoadMore) {
          setItems((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const newUnique = (data.items || []).filter(
              (i: FeedListingItem) => !existingIds.has(i.id)
            );
            return [...prev, ...newUnique];
          });
        } else {
          setItems(data.items || []);
        }

        setCursor(data.nextCursor ?? null);
        setHasMore(Boolean(data.hasMore));
        if (typeof data.hasFollowedCategories === "boolean") {
          setHasFollowed(data.hasFollowedCategories);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (currentSeq === filterSeqRef.current) {
          setErrorMsg(
            isTr
              ? "İlanlar yüklenirken bir sorun oluştu. Lütfen tekrar deneyin."
              : "Failed to load listings. Please try again."
          );
        }
      } finally {
        if (currentSeq === filterSeqRef.current) {
          setIsLoadingMore(false);
          setIsTabLoading(false);
          isFetchingRef.current = false;
        }
      }
    },
    [locale, categorySlug, searchQuery, chipLast24h, chipFixedBudget, cursor, isTr]
  );

  // React to chip changes
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchListings(mode, false);
  }, [chipLast24h, chipFixedBudget, fetchListings, mode]);

  // Mode Switcher ("following" vs "all")
  const handleSwitchMode = (newMode: "following" | "all") => {
    if (newMode === mode || isTabLoading) return;
    setMode(newMode);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("mode", newMode);
      window.history.replaceState({}, "", url.toString());
    }
    fetchListings(newMode, false);
  };

  // Infinite Scroll Trigger
  const handleLoadMore = useCallback(() => {
    const now = Date.now();
    if (now - lastTriggerTimeRef.current < 250) return;
    if (!hasMore || isLoadingMore || isFetchingRef.current || !cursor) return;
    lastTriggerTimeRef.current = now;
    isFetchingRef.current = true;
    fetchListings(mode, true);
  }, [hasMore, isLoadingMore, cursor, fetchListings, mode]);

  // IntersectionObserver for stream view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore && !isTabLoading) {
          handleLoadMore();
        }
      },
      { rootMargin: "350px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore, hasMore, isLoadingMore, isTabLoading]);

  // Toggle Category Follow
  const handleToggleCategoryFollow = useCallback(async (categoryId: string) => {
    let isCurrentlyFollowed = false;
    setFollowedCategoryIds((prev) => {
      isCurrentlyFollowed = prev.has(categoryId);
      const updated = new Set(prev);
      if (isCurrentlyFollowed) {
        updated.delete(categoryId);
      } else {
        updated.add(categoryId);
      }
      return updated;
    });

    try {
      await fetch("/api/categories/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          action: isCurrentlyFollowed ? "unfollow" : "follow",
        }),
      });
      if (!isCurrentlyFollowed) {
        setHasFollowed(true);
      }
    } catch {
      setFollowedCategoryIds((prev) => {
        const rolledBack = new Set(prev);
        if (isCurrentlyFollowed) {
          rolledBack.add(categoryId);
        } else {
          rolledBack.delete(categoryId);
        }
        return rolledBack;
      });
    }
  }, []);

  // Quick Offer Handler
  const handleQuickOffer = useCallback((target: QuickOfferTarget) => {
    setQuickOfferTarget(target);
  }, []);

  // Batch Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 5) return next;
        next.add(id);
      }
      return next;
    });
  };

  const batchTargets: BatchListingTarget[] = useMemo(() => {
    return sortedItems
      .filter((i) => selectedIds.has(i.id))
      .map((i) => ({
        id: i.id,
        title: i.title,
        slug: i.slug,
        categoryName: i.categoryName,
        budgetMin: i.budgetMin ? String(i.budgetMin) : null,
        budgetMax: i.budgetMax ? String(i.budgetMax) : null,
        budgetCurrency: i.budgetCurrency,
        ownerDisplayName: i.ownerDisplayName,
      }));
  }, [sortedItems, selectedIds]);

  const selectedCategorySlugs = useMemo(() => {
    if (!categorySlug) return [];
    return categorySlug
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [categorySlug]);

  // Real search trends from search_trends table (auto-refreshed)
  const [searchTrendKeywords, setSearchTrendKeywords] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/search/trending?locale=${locale}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data?.trending)) {
          setSearchTrendKeywords(data.trending.map((t: string) => t.toLowerCase()));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [locale]);

  // Extract trending tags with Time-Decayed Interaction Momentum & Search Blending
  // Absolutely ZERO hardcoded mock data!
  const trendingTags: TrendingTagItem[] = useMemo(() => {
    const now = Date.now();
    const HALF_LIFE_HOURS = 72; // 3 days
    const searchBoostSet = new Set(searchTrendKeywords);

    // Tag stats tracking: decayed score, occurrence count, primary category
    const tagScoreMap = new Map<string, number>();
    const tagCountMap = new Map<string, number>();
    const tagCategoryMap = new Map<string, string>();

    items.forEach((item) => {
      // Age in hours
      const itemTime = item.lastActivatedAt ? new Date(item.lastActivatedAt).getTime() : now;
      const ageHours = Math.max(0, (now - itemTime) / (1000 * 60 * 60));
      const timeDecay = Math.pow(2, -ageHours / HALF_LIFE_HOURS);

      // Interaction weight: base 1.0 + clicks * 1.5 + views * 0.5
      const interactionWeight = 1.0 + (item.clickCount || 0) * 1.5 + (item.viewCount || 0) * 0.5;
      const listingScore = interactionWeight * timeDecay;

      item.tags?.forEach((t) => {
        const cleanTag = t.trim();
        if (cleanTag) {
          const lower = cleanTag.toLowerCase();
          tagCountMap.set(cleanTag, (tagCountMap.get(cleanTag) || 0) + 1);

          // Additional search boost if users are searching for this tech
          const searchMultiplier = searchBoostSet.has(lower) ? 2.5 : 1.0;
          const currentScore = tagScoreMap.get(cleanTag) || 0;
          tagScoreMap.set(cleanTag, currentScore + listingScore * searchMultiplier);

          if (!tagCategoryMap.has(cleanTag)) {
            tagCategoryMap.set(cleanTag, item.categoryName);
          }
        }
      });
    });

    const list = Array.from(tagScoreMap.entries())
      .map(([tag, score]) => ({
        tag,
        count: tagCountMap.get(tag) || 1,
        category: tagCategoryMap.get(tag) || (isTr ? "Yazılım & Teknoloji" : "Software & Tech"),
        score,
      }))
      .sort((a, b) => b.score - a.score || b.count - a.count);

    // Return real authentic tags (max 5). Zero hardcoded mock fallback.
    return list.slice(0, 5).map(({ tag, count, category }) => ({
      tag,
      count,
      category,
    }));
  }, [items, isTr, searchTrendKeywords]);

  return {
    isTr,
    mode,
    view,
    items,
    cursor,
    hasMore,
    isLoadingMore,
    isTabLoading,
    hasFollowed,
    chipLast24h,
    setChipLast24h,
    chipFixedBudget,
    setChipFixedBudget,
    sortBy,
    setSortBy,
    errorMsg,
    selectedIds,
    setSelectedIds,
    isBatchOpen,
    setIsBatchOpen,
    followedCategoryIds,
    quickOfferTarget,
    setQuickOfferTarget,
    fullModalListing,
    setFullModalListing,
    fullModalInitialData,
    setFullModalInitialData,
    sentinelRef,
    sortedItems,
    fetchListings,
    handleSwitchMode,
    handleLoadMore,
    handleToggleCategoryFollow,
    handleQuickOffer,
    handleToggleSelect,
    batchTargets,
    selectedCategorySlugs,
    trendingTags,
  };
}

export type ListingsHubState = ReturnType<typeof useListingsHubState>;
