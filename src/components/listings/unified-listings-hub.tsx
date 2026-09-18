"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Flame,
  Briefcase,
  PlusCircle,
  Plus,
  Check,
  ArrowRight,
  Loader2,
  X,
  TrendingUp,
  Search,
} from "lucide-react";
import { FeedListingItem } from "@/src/modules/listings/feed/service";
import { CategoryDto } from "@/src/modules/categories/service";
import { SocialListingCard } from "../feed/social-listing-card";
import { ListingCard } from "./listing-card";
import { CategoryFilterBar } from "../categories/category-filter-bar";
import { SortDropdown } from "../ui/sort-dropdown";
import { BatchSelectionBar } from "../offers/batch-selection-bar";
import { BatchOfferWizardModal, BatchListingTarget } from "../offers/batch-offer-wizard-modal";
import { QuickOfferDrawer } from "../offers/quick-offer-drawer";
import { SubmitOfferModal } from "../offers/submit-offer-modal";
import { EmptyState } from "../ui/empty-state";
import { Button } from "../ui/button";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";

export interface UnifiedListingsHubProps {
  initialItems: FeedListingItem[];
  initialCursor: string | null;
  initialHasMore: boolean;
  initialMode: "following" | "all";
  initialView: "stream" | "catalog";
  categorySlug?: string;
  searchQuery?: string;
  categories: CategoryDto[];
  hasFollowedCategories?: boolean;
  locale: string;
  isAuthenticated: boolean;
  basePath: string;
}

export function UnifiedListingsHub({
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
  isAuthenticated,
  basePath,
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

  // Quick Filter Chips State (matching E2E tests: Son 24s / Bütçesi Belirli)
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
  const [quickOfferTarget, setQuickOfferTarget] = useState<{
    id: string;
    slug: string;
    title: string;
    categoryName: string;
    budgetMin: string | null;
    budgetMax: string | null;
    budgetCurrency: string | null;
    ownerDisplayName: string;
  } | null>(null);

  const [fullModalListing, setFullModalListing] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [fullModalInitialData, setFullModalInitialData] = useState<any>(undefined);

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
    const url = new URL(window.location.href);
    url.searchParams.set("mode", newMode);
    window.history.replaceState({}, "", url.toString());
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
  const handleQuickOffer = useCallback(
    (target: {
      id: string;
      slug: string;
      title: string;
      categoryName: string;
      budgetMin: string | null;
      budgetMax: string | null;
      budgetCurrency: string | null;
      ownerDisplayName: string;
    }) => {
      setQuickOfferTarget(target);
    },
    []
  );

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

  // Extract trending tags from listings with fallback
  const trendingTags = useMemo(() => {
    const tagCountMap = new Map<string, number>();
    const tagCategoryMap = new Map<string, string>();
    items.forEach((item) => {
      item.tags?.forEach((t) => {
        const cleanTag = t.trim();
        if (cleanTag) {
          tagCountMap.set(cleanTag, (tagCountMap.get(cleanTag) || 0) + 1);
          if (!tagCategoryMap.has(cleanTag)) {
            tagCategoryMap.set(cleanTag, item.categoryName);
          }
        }
      });
    });

    const list = Array.from(tagCountMap.entries())
      .map(([tag, count]) => ({
        tag,
        count,
        category: tagCategoryMap.get(tag) || (isTr ? "Yazılım & Teknoloji" : "Software & Tech"),
      }))
      .sort((a, b) => b.count - a.count);

    if (list.length >= 4) return list.slice(0, 5);

    const fallbackList = [
      { tag: "Go", count: 24, category: isTr ? "Fintech & Backend" : "Fintech & Backend" },
      { tag: "PostgreSQL", count: 18, category: isTr ? "Veritabanı & API" : "Database & API" },
      { tag: "React", count: 15, category: isTr ? "Frontend & Web" : "Frontend & Web" },
      { tag: "Flutter", count: 12, category: isTr ? "Mobil Geliştirme" : "Mobile Development" },
      { tag: "AI", count: 9, category: isTr ? "Yapay Zeka & Otomasyon" : "AI & Automation" },
    ];

    const existingNames = new Set(list.map((l) => l.tag.toLowerCase()));
    const merged = [...list];
    for (const fb of fallbackList) {
      if (!existingNames.has(fb.tag.toLowerCase()) && merged.length < 5) {
        merged.push(fb);
      }
    }
    return merged;
  }, [items, isTr]);

  return (
    <div className="w-full">
      {/* Twitter (X) 3-Column Container */}
      <div className="flex flex-col lg:flex-row items-start justify-center gap-6 xl:gap-8 w-full">
        {/* ========================================================
            1. SOL KOLON (Sadeleştirilmiş Tek Parça Navigasyon & Filtreler)
            Width: ~250px on desktop, hidden on mobile (< 1024px)
           ======================================================== */}
        <aside className="hidden lg:flex flex-col gap-3 w-[240px] xl:w-[250px] shrink-0 sticky top-20">
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-surface/75 backdrop-blur-xl p-3.5 shadow-xs space-y-3.5">
            {/* Kategori ve Sektör Gezgini */}
            <CategoryFilterBar
              categories={categories}
              selectedCategory={categorySlug}
              basePath={basePath}
              searchQuery={searchQuery}
              extraQuery={{
                ...(mode === "following" ? { mode: "following" } : {}),
                ...(view === "stream" ? { view: "stream" } : { view: "catalog" }),
              }}
              locale={locale}
              variant="sidebar"
            />

            <div className="h-px bg-[var(--color-border-subtle)]/60" />

            {/* Hızlı Filtreler (E2E Test Selectors: "Son 24s", "Bütçesi Belirli") */}
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setChipLast24h((prev) => !prev)}
                aria-pressed={chipLast24h}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer border ${
                  chipLast24h
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-2xs font-semibold"
                    : "bg-surface/50 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-surface hover:text-[var(--color-text-primary)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Flame
                    className={`h-3.5 w-3.5 ${chipLast24h ? "text-amber-400" : "text-[var(--color-text-tertiary)]"}`}
                    aria-hidden="true"
                  />
                  <span>{isTr ? "Son 24s" : "Last 24h"}</span>
                </div>
                <span className="text-[9px] font-mono opacity-60">24h</span>
              </button>

              <button
                type="button"
                onClick={() => setChipFixedBudget((prev) => !prev)}
                aria-pressed={chipFixedBudget}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer border ${
                  chipFixedBudget
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-2xs font-semibold"
                    : "bg-surface/50 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-surface hover:text-[var(--color-text-primary)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Briefcase
                    className={`h-3.5 w-3.5 ${chipFixedBudget ? "text-emerald-400" : "text-[var(--color-text-tertiary)]"}`}
                    aria-hidden="true"
                  />
                  <span>{isTr ? "Bütçesi Belirli" : "Specific Budget"}</span>
                </div>
                <span className="text-[9px] font-mono opacity-60">TRY</span>
              </button>
            </div>

            <div className="h-px bg-[var(--color-border-subtle)]/60" />

            {/* Twitter 'Post' Style Primary Action Button */}
            <Link href={getLocalizedRoute("newListing", locale)} className="w-full block">
              <Button
                variant="shimmer"
                className="w-full py-2.5 h-10 rounded-xl font-bold text-xs sm:text-sm gap-2 shadow-md shadow-blue-500/20"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                <span>{isTr ? "İlan Yayınla" : "Publish Listing"}</span>
              </Button>
            </Link>
          </div>
        </aside>

        {/* ========================================================
            2. ORTA KOLON (Center Main Feed Stream - Ekranın Ortasında)
            Width: ~640px, centered on screen
           ======================================================== */}
        <div className="w-full max-w-[640px] min-w-0 flex flex-col gap-3.5 mx-auto">
          {/* Mobile Top Control Bar (< lg) */}
          <div className="lg:hidden flex flex-col gap-2.5 p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-surface/75 backdrop-blur-xl shadow-xs">
            <div className="flex items-center gap-2">
              <form
                method="GET"
                action={basePath}
                className="relative flex-1"
                role="search"
              >
                {selectedCategorySlugs.length > 0 && (
                  <input type="hidden" name="category" value={selectedCategorySlugs.join(",")} />
                )}
                {mode === "following" && <input type="hidden" name="mode" value="following" />}
                {view === "catalog" && <input type="hidden" name="view" value="catalog" />}
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                <input
                  type="search"
                  name="q"
                  defaultValue={searchQuery ?? ""}
                  placeholder={isTr ? "İlan veya teknoloji ara..." : "Search listings..."}
                  className="w-full rounded-xl bg-surface/60 border border-[var(--color-border-subtle)] pl-9 pr-3 py-2 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none focus:border-blue-500/40"
                />
              </form>

              <Link href={getLocalizedRoute("newListing", locale)}>
                <Button variant="shimmer" size="sm" className="h-9 px-3 gap-1 rounded-xl text-xs shrink-0">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>{isTr ? "Yayınla" : "Post"}</span>
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setChipLast24h((prev) => !prev)}
                aria-pressed={chipLast24h}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border transition-all cursor-pointer ${
                  chipLast24h
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold"
                    : "bg-surface/50 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                }`}
              >
                <Flame className="h-3 w-3" />
                <span>{isTr ? "Son 24s" : "Last 24h"}</span>
              </button>

              <button
                type="button"
                onClick={() => setChipFixedBudget((prev) => !prev)}
                aria-pressed={chipFixedBudget}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border transition-all cursor-pointer ${
                  chipFixedBudget
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold"
                    : "bg-surface/50 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                }`}
              >
                <Briefcase className="h-3 w-3" />
                <span>{isTr ? "Bütçesi Belirli" : "Specific Budget"}</span>
              </button>
            </div>
          </div>

          {/* Sticky Twitter-Style Feed Header */}
          <div className="sticky top-16 z-20 backdrop-blur-xl bg-surface/85 border border-[var(--color-border-subtle)]/70 rounded-2xl px-4 py-2.5 shadow-xs flex items-center justify-between">
            {/* Left: Feed Mode Tabs */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSwitchMode("all")}
                disabled={isTabLoading}
                className={`relative pb-1 text-xs font-bold transition-all cursor-pointer ${
                  mode === "all"
                    ? "text-[var(--color-text-primary)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500 after:rounded-full"
                    : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {isTr ? "Tüm İlanlar" : "All Listings"}
              </button>

              <span className="text-[var(--color-border-strong)] opacity-30">|</span>

              <button
                type="button"
                onClick={() => handleSwitchMode("following")}
                disabled={isTabLoading}
                className={`relative pb-1 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mode === "following"
                    ? "text-[var(--color-text-primary)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500 after:rounded-full"
                    : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <span>{isTr ? "Sana Özel" : "For You"}</span>
                {isAuthenticated && followedCategoryIds.size > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/15 text-blue-700 dark:text-sky-300 font-bold border border-blue-500/20">
                    {followedCategoryIds.size}
                  </span>
                )}
              </button>
            </div>

            {/* Right: Sorting */}
            <div className="flex items-center gap-2">
              <SortDropdown value={sortBy} onChange={setSortBy} locale={locale} />
            </div>
          </div>

          {/* Dismissible Multi-Category Filter Badges */}
          {selectedCategorySlugs.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 px-1">
              <span className="text-xs text-[var(--color-text-tertiary)] font-medium mr-1">
                {isTr ? "Filtreler:" : "Filters:"}
              </span>
              {selectedCategorySlugs.map((slug) => {
                const cat = categories.find((c) => c.slug === slug);
                const remainingSlugs = selectedCategorySlugs.filter((s) => s !== slug);
                const query = new URLSearchParams();
                if (remainingSlugs.length > 0) query.set("category", remainingSlugs.join(","));
                if (searchQuery) query.set("q", searchQuery);
                if (mode === "following") query.set("mode", "following");
                if (view === "catalog") query.set("view", "catalog");
                const qStr = query.toString();
                const removeHref = `${basePath}${qStr ? `?${qStr}` : ""}`;

                return (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-blue-500/15 text-blue-700 dark:text-sky-300 border border-blue-500/30 shadow-2xs"
                  >
                    <span>{cat?.name || slug}</span>
                    <Link
                      href={removeHref}
                      className="hover:text-blue-900 dark:hover:text-white transition-colors cursor-pointer"
                      aria-label={`${isTr ? "Filtreyi kaldır" : "Remove filter"}: ${cat?.name || slug}`}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </span>
                );
              })}
            </div>
          )}

          {/* Active Items Counter & Clear Filters Bar */}
          <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] px-1">
            <div>
              {isTr ? (
                <>
                  Toplam{" "}
                  <strong className="text-[var(--color-text-primary)] font-semibold">
                    {sortedItems.length}
                  </strong>{" "}
                  aktif ilan listelendi
                </>
              ) : (
                <>
                  <strong className="text-[var(--color-text-primary)] font-semibold">
                    {sortedItems.length}
                  </strong>{" "}
                  active listings listed
                </>
              )}
            </div>

            {(categorySlug || searchQuery || chipLast24h || chipFixedBudget) && (
              <Link
                href={basePath}
                className="text-blue-600 dark:text-sky-400 hover:underline font-medium transition-colors cursor-pointer"
              >
                {isTr ? "Filtreleri Temizle" : "Clear Filters"}
              </Link>
            )}
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-xs text-red-400 flex items-center justify-between">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => fetchListings(mode, false)}
                className="underline hover:no-underline font-semibold cursor-pointer ml-4"
              >
                {isTr ? "Yeniden Dene" : "Retry"}
              </button>
            </div>
          )}

          {/* Loading indicator when switching tabs */}
          {isTabLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-tertiary)] gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" aria-hidden="true" />
              <span className="text-xs">
                {isTr ? "İlanlar güncelleniyor..." : "Updating listings..."}
              </span>
            </div>
          )}

          {/* Empty States */}
          {!isTabLoading && sortedItems.length === 0 && (
            <div>
              {mode === "following" && (!hasFollowed || followedCategoryIds.size === 0) ? (
                <EmptyState
                  title={
                    isTr
                      ? "Henüz bir uzmanlık kategorisi takip etmediniz"
                      : "You haven't followed any categories yet"
                  }
                  description={
                    isTr
                      ? "Canlı akışınızı kişiselleştirmek için sağ taraftaki önerilen kategorilerden ilgi alanlarınızı takip edin."
                      : "Follow categories from the right sidebar to tailor your personalized live feed."
                  }
                  action={
                    <button
                      type="button"
                      onClick={() => handleSwitchMode("all")}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
                    >
                      {isTr ? "Tüm İlanları Görüntüle" : "Browse All Listings"}
                    </button>
                  }
                />
              ) : (
                <EmptyState
                  title={isTr ? "Kriterlere uygun ilan bulunamadı" : "No listings found"}
                  description={
                    isTr
                      ? "Arama veya filtre kriterlerinizi değiştirerek daha fazla sonuca ulaşabilirsiniz."
                      : "Try clearing or adjusting your search criteria to discover active listings."
                  }
                  action={
                    <Link href={basePath}>
                      <Button variant="outline" size="sm">
                        {isTr ? "Tüm İlanlara Dön" : "Reset Filters"}
                      </Button>
                    </Link>
                  }
                />
              )}
            </div>
          )}

          {/* RENDER VIEW: STREAM (Social Timeline with Divider Architecture) */}
          {!isTabLoading && sortedItems.length > 0 && view === "stream" && (
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-surface/75 backdrop-blur-xl divide-y divide-[var(--color-border-subtle)]/60 overflow-hidden shadow-xs">
              {sortedItems.map((item) => (
                <SocialListingCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  isCategoryFollowed={followedCategoryIds.has(item.categoryId)}
                  onToggleFollowCategory={handleToggleCategoryFollow}
                  onQuickOffer={handleQuickOffer}
                />
              ))}
            </div>
          )}

          {/* RENDER VIEW: CATALOG (Marketplace Grid Cards with Batch Select) */}
          {!isTabLoading && sortedItems.length > 0 && view === "catalog" && (
            <div className="grid grid-cols-1 gap-3.5">
              {sortedItems.map((item) => (
                <ListingCard
                  key={item.id}
                  id={item.id}
                  slug={item.slug}
                  title={item.title}
                  summary={item.summary}
                  categoryName={item.categoryName}
                  budgetMode={item.budgetMode}
                  budgetCurrency={item.budgetCurrency}
                  budgetMin={item.budgetMin ? String(item.budgetMin) : null}
                  budgetMax={item.budgetMax ? String(item.budgetMax) : null}
                  timelineMode={item.timelineMode}
                  targetDate={item.targetDate}
                  timelineValue={item.timelineValue}
                  timelineUnit={item.timelineUnit}
                  ownerHandle={item.ownerHandle}
                  ownerDisplayName={item.ownerDisplayName}
                  firstPublishedAt={item.firstPublishedAt}
                  lastActivatedAt={item.lastActivatedAt}
                  activeUntil={item.activeUntil}
                  activationSeq={item.activationSeq}
                  viewCount={item.viewCount}
                  clickCount={item.clickCount}
                  locale={locale}
                  isBatchMode={true}
                  isSelected={selectedIds.has(item.id)}
                  onToggleSelect={handleToggleSelect}
                  onQuickOffer={handleQuickOffer}
                />
              ))}
            </div>
          )}

          {/* Infinite Scroll Sentinel & Load More Trigger */}
          <div ref={sentinelRef} className="pt-4 pb-4 text-center">
            {isLoadingMore && (
              <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" aria-hidden="true" />
                <span>{isTr ? "Daha fazla ilan yükleniyor..." : "Loading more listings..."}</span>
              </div>
            )}

            {!isLoadingMore && hasMore && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                {isTr ? "Daha Fazla İlan Yükle" : "Load More Listings"}
              </Button>
            )}

            {!hasMore && sortedItems.length > 0 && !isTabLoading && (
              <p className="text-xs text-[var(--color-text-tertiary)] py-4">
                {isTr
                  ? "Tüm aktif ilanlar listelendi. Yeni ilanlar eklendikçe burada görünecektir."
                  : "All active listings displayed. New listings will appear in real time."}
              </p>
            )}
          </div>
        </div>

        {/* ========================================================
            3. SAĞ KOLON (Right Search, Trending & Discovery Sidebar)
            Width: ~330px on desktop (hidden on mobile / tablet)
           ======================================================== */}
        <aside className="hidden xl:flex flex-col gap-4 w-[310px] xl:w-[330px] shrink-0 sticky top-20">
          {/* Twitter-Style Pill Search Bar */}
          <form
            method="GET"
            action={basePath}
            className="relative w-full"
            role="search"
          >
            {selectedCategorySlugs.length > 0 && (
              <input type="hidden" name="category" value={selectedCategorySlugs.join(",")} />
            )}
            {mode === "following" && <input type="hidden" name="mode" value="following" />}
            {view === "catalog" && <input type="hidden" name="view" value="catalog" />}
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)] pointer-events-none" />
            <input
              type="search"
              name="q"
              defaultValue={searchQuery ?? ""}
              placeholder={isTr ? "İlan veya teknoloji ara..." : "Search listings, tech..."}
              className="w-full rounded-full bg-surface/75 backdrop-blur-xl border border-[var(--color-border-subtle)] pl-10 pr-9 py-2.5 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-blue-500/50 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
            />
            {searchQuery && (
              <Link
                href={basePath}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                title={isTr ? "Aramayı Temizle" : "Clear Search"}
              >
                <X className="h-3.5 w-3.5" />
              </Link>
            )}
          </form>

          {/* Trending Technologies Widget (Authentic Twitter Trends) */}
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-surface/75 backdrop-blur-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                <span>{isTr ? "Gündemdeki Teknolojiler" : "Trending Tech"}</span>
              </h2>
            </div>

            <div className="space-y-1">
              {trendingTags.map((t, idx) => (
                <Link
                  key={t.tag}
                  href={`${basePath}?q=${encodeURIComponent(t.tag)}`}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-surface/80 transition-colors group cursor-pointer"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-[var(--color-text-primary)] group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors">
                      #{t.tag}
                    </span>
                    <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                      {t.category}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-sky-400/90 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 shrink-0">
                    {idx === 0 ? (isTr ? "Trend" : "Trending") : idx === 1 ? (isTr ? "Popüler" : "Popular") : (isTr ? "Talep Yüksek" : "High Demand")}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Suggested Categories to Follow Card */}
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-surface/75 backdrop-blur-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                <span>{isTr ? "Önerilen Kategoriler" : "Suggested Categories"}</span>
              </h2>

              <Link
                href={getLocalizedRoute("categories", locale)}
                className="text-[11px] font-semibold text-blue-600 dark:text-sky-400 hover:underline transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{isTr ? "Tümü" : "All"}</span>
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>

            <div className="space-y-1.5">
              {categories.slice(0, 5).map((cat) => {
                const isFollowed = followedCategoryIds.has(cat.id);
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between gap-2 p-1.5 px-2 rounded-xl hover:bg-surface/60 transition-colors"
                  >
                    <Link
                      href={`${basePath}?category=${cat.slug}`}
                      className="min-w-0 flex-1 group"
                    >
                      <div className="text-xs font-medium text-[var(--color-text-primary)] group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors truncate">
                        {cat.name}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)]">
                        {isTr ? "Uzmanlık Alanı" : "Specialization"}
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleToggleCategoryFollow(cat.id)}
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                        isFollowed
                          ? "bg-blue-500/15 text-blue-700 dark:text-sky-300 border border-blue-500/25 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                          : "bg-surface/60 text-[var(--color-text-secondary)] hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-sky-300 border border-[var(--color-border-subtle)]"
                      }`}
                    >
                      {isFollowed ? (
                        <>
                          <Check className="h-3 w-3 text-blue-500" aria-hidden="true" />
                          <span>{isTr ? "Takipte" : "Following"}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" aria-hidden="true" />
                          <span>{isTr ? "Takip Et" : "Follow"}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Twitter-Style Mini Footer */}
          <footer className="px-2 text-[11px] text-[var(--color-text-tertiary)] space-y-1">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <Link href={getLocalizedRoute("home", locale)} className="hover:underline">
                {isTr ? "Hakkında" : "About"}
              </Link>
              <span>•</span>
              <Link href={getLocalizedRoute("categories", locale)} className="hover:underline">
                {isTr ? "Kategoriler" : "Categories"}
              </Link>
              <span>•</span>
              <span className="opacity-75">{isTr ? "Gizlilik & Şartlar" : "Privacy & Terms"}</span>
            </div>
            <p className="text-[10px] opacity-60">
              Operis Marketplace © 2026
            </p>
          </footer>
        </aside>
      </div>

      {/* 5. Drawers & Modals (Quick Offer, Batch Selection, Full Modal) */}
      {quickOfferTarget && (
        <QuickOfferDrawer
          isOpen={Boolean(quickOfferTarget)}
          onClose={() => setQuickOfferTarget(null)}
          listing={quickOfferTarget}
          locale={locale}
          onOpenFullModal={(initialData) => {
            const current = quickOfferTarget;
            setQuickOfferTarget(null);
            setFullModalListing(current);
            setFullModalInitialData(initialData);
          }}
          onSuccess={() => {
            setQuickOfferTarget(null);
          }}
        />
      )}

      {fullModalListing && (
        <SubmitOfferModal
          isOpen={Boolean(fullModalListing)}
          onClose={() => {
            setFullModalListing(null);
            setFullModalInitialData(undefined);
          }}
          listingId={fullModalListing.id}
          listingTitle={fullModalListing.title}
          locale={locale}
          initialData={fullModalInitialData}
          onSuccess={() => {
            setFullModalListing(null);
            setFullModalInitialData(undefined);
          }}
        />
      )}

      {/* Batch Selection Sticky Bar (in Catalog view when items are selected) */}
      <BatchSelectionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onOpenWizard={() => setIsBatchOpen(true)}
        locale={locale}
      />

      {isBatchOpen && (
        <BatchOfferWizardModal
          isOpen={isBatchOpen}
          onClose={() => setIsBatchOpen(false)}
          selectedListings={batchTargets}
          locale={locale}
          onRemoveListing={(id) => {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }}
          onSuccess={() => {
            setSelectedIds(new Set());
            setIsBatchOpen(false);
          }}
        />
      )}
    </div>
  );
}
