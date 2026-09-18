"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  Plus,
  ArrowRight,
  Check,
} from "lucide-react";
import { FeedListingItem } from "@/src/modules/listings/feed/service";
import { CategoryDto } from "@/src/modules/categories/service";
import { SocialListingCard } from "./social-listing-card";
import { QuickOfferDrawer } from "../offers/quick-offer-drawer";
import { SubmitOfferModal } from "../offers/submit-offer-modal";
import { EmptyState } from "../ui/empty-state";
import { Button } from "../ui/button";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";

export interface SocialFeedStreamProps {
  initialItems: FeedListingItem[];
  initialCursor: string | null;
  initialHasMore: boolean;
  initialMode: "following" | "all";
  hasFollowedCategories?: boolean;
  categories: CategoryDto[];
  locale: string;
}

export function SocialFeedStream({
  initialItems,
  initialCursor,
  initialHasMore,
  initialMode,
  hasFollowedCategories = true,
  categories,
  locale,
}: SocialFeedStreamProps) {
  const isTr = locale === "tr";

  // Feed items & cursor state
  const [items, setItems] = useState<FeedListingItem[]>(initialItems);
  const [mode, setMode] = useState<"following" | "all">(initialMode);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isTabLoading, setIsTabLoading] = useState<boolean>(false);
  const [hasFollowed, setHasFollowed] = useState<boolean>(hasFollowedCategories);

  // Followed categories cache
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

  // Sentinel ref & performance refs for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastTriggerTimeRef = useRef<number>(0);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Stable Quick Offer callback
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

  // Fetch next batch via cursor with throttling and AbortController
  const loadMore = useCallback(async () => {
    const now = Date.now();
    if (now - lastTriggerTimeRef.current < 250) return; // Cooldown throttle
    if (!hasMore || isLoadingMore || isFetchingRef.current || !cursor) return;

    lastTriggerTimeRef.current = now;
    isFetchingRef.current = true;
    setIsLoadingMore(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const params = new URLSearchParams();
      params.set("mode", mode);
      params.set("cursor", cursor);
      params.set("locale", locale);

      const res = await fetch(`/api/listings/feed?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Failed to load more");
      const data = await res.json();

      setItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const newUnique = (data.items || []).filter(
          (i: FeedListingItem) => !existingIds.has(i.id)
        );
        return [...prev, ...newUnique];
      });
      setCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.hasMore));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      // Stale or failed request fallback
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [hasMore, isLoadingMore, cursor, mode, locale]);

  // Infinite scroll intersection observer with cooldown
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore && !isTabLoading) {
          loadMore();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoadingMore, isTabLoading]);

  // Switch tabs ("following" vs "all") with active request cancellation
  const handleSwitchMode = async (newMode: "following" | "all") => {
    if (newMode === mode || isTabLoading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setMode(newMode);
    setIsTabLoading(true);

    // Sync URL without hard refresh
    const url = new URL(window.location.href);
    url.searchParams.set("mode", newMode);
    window.history.pushState({}, "", url.toString());

    try {
      const params = new URLSearchParams();
      params.set("mode", newMode);
      params.set("locale", locale);

      const res = await fetch(`/api/listings/feed?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Failed to switch feed mode");
      const data = await res.json();

      setItems(data.items || []);
      setCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.hasMore));
      if (typeof data.hasFollowedCategories === "boolean") {
        setHasFollowed(data.hasFollowedCategories);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      // Stale or failed request fallback
    } finally {
      setIsTabLoading(false);
    }
  };

  // Toggle Category Follow with functional state updater
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

  return (
    <div className="space-y-2">
      {/* Minimalist Tabs Header + Action */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] gap-4">
        <div className="flex items-center gap-6 text-sm">
          <button
            type="button"
            onClick={() => handleSwitchMode("all")}
            className={`py-3 font-semibold transition-colors cursor-pointer relative ${
              mode === "all"
                ? "text-[var(--color-text-primary)]"
                : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            <span>{isTr ? "Tüm İlanlar" : "All Listings"}</span>
            {mode === "all" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode("following")}
            className={`py-3 font-semibold transition-colors cursor-pointer relative ${
              mode === "following"
                ? "text-[var(--color-text-primary)]"
                : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            <span>{isTr ? "Takip Ettiklerim" : "Following"}</span>
            {mode === "following" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>

        <Link href={getLocalizedRoute("newListing", locale)}>
          <Button variant="shimmer" size="sm" className="gap-1 px-3.5 py-1 text-xs rounded-full font-medium h-7.5">
            <Plus className="h-3 w-3" />
            <span>{isTr ? "İlan Ver" : "Post"}</span>
          </Button>
        </Link>
      </div>

      {/* Stream Content */}
      {isTabLoading ? (
        <div className="py-16 text-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto" />
          <p className="text-xs text-[var(--color-text-secondary)]">
            {isTr ? "İlanlar yükleniyor..." : "Loading listings..."}
          </p>
        </div>
      ) : mode === "following" && !hasFollowed ? (
        /* Empty State for Following Mode */
        <div className="py-12 px-4 space-y-5 text-center">
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              {isTr ? "Henüz Takip Ettiğiniz Bir Kategori Yok" : "No Categories Followed Yet"}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "İlgilendiğiniz kategorileri takip ederek sadece uzmanlaştığınız alanlardaki ilanları akışınızda görün."
                : "Follow categories to see listings only in areas relevant to you."}
            </p>
          </div>

          {/* Quick Category Follow Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto pt-1">
            {categories.slice(0, 6).map((cat) => {
              const isFollowed = followedCategoryIds.has(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleToggleCategoryFollow(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isFollowed
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                      : "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] hover:border-blue-500/40 border border-[var(--color-border-subtle)]"
                  }`}
                >
                  {isFollowed ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>{cat.name}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3 text-blue-400" />
                      <span>{cat.name}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSwitchMode("all")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-400 cursor-pointer"
            >
              <span>{isTr ? "Tüm güncel ilanları keşfet" : "Explore all listings"}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : items.length === 0 ? (
        /* Empty State when no listings */
        <div className="py-16 text-center">
          <EmptyState
            title={
              isTr
                ? "Bu akışta henüz aktif ilan bulunmuyor"
                : "No active listings in this feed yet"
            }
            description={
              isTr
                ? "Takip ettiğiniz alanlarda yeni bir ilan yayınlandığında burada görünecektir."
                : "New listings will appear here as they are published."
            }
            action={
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                {mode === "following" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSwitchMode("all")}
                  >
                    {isTr ? "Tüm İlanları Gör" : "View All Listings"}
                  </Button>
                )}
                <Link href={getLocalizedRoute("newListing", locale)}>
                  <Button variant="shimmer" size="sm">
                    {isTr ? "Hemen İlan Ver" : "Post a Listing"}
                  </Button>
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        /* Continuous Stream with Cards */
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <SocialListingCard
              key={item.id}
              item={item}
              locale={locale}
              isCategoryFollowed={followedCategoryIds.has(item.categoryId)}
              onToggleFollowCategory={handleToggleCategoryFollow}
              onQuickOffer={handleQuickOffer}
            />
          ))}

          {/* Infinite Scroll Sentinel */}
          <div ref={sentinelRef} className="py-5 text-center">
            {isLoadingMore && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-surface-base)]/75 backdrop-blur-xl border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                <span>{isTr ? "Daha fazla ilan yükleniyor..." : "Loading more listings..."}</span>
              </div>
            )}

            {!hasMore && items.length > 0 && (
              <div className="py-4 text-xs text-[var(--color-text-tertiary)] flex items-center justify-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                <span>
                  {isTr
                    ? "Tüm güncel ilanları gördünüz."
                    : "You're all caught up."}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Offer Drawer */}
      {quickOfferTarget && (
        <QuickOfferDrawer
          isOpen={!!quickOfferTarget}
          onClose={() => setQuickOfferTarget(null)}
          listing={quickOfferTarget}
          locale={locale}
          onOpenFullModal={(initialData) => {
            setFullModalListing(quickOfferTarget);
            setFullModalInitialData(initialData);
            setQuickOfferTarget(null);
          }}
          onSuccess={() => {
            setQuickOfferTarget(null);
          }}
        />
      )}

      {/* Detailed Full Proposal Modal (Fallback) */}
      {fullModalListing && (
        <SubmitOfferModal
          isOpen={!!fullModalListing}
          onClose={() => {
            setFullModalListing(null);
            setFullModalInitialData(undefined);
          }}
          listingId={fullModalListing.id}
          listingTitle={fullModalListing.title}
          locale={locale}
          initialData={fullModalInitialData}
        />
      )}
    </div>
  );
}
