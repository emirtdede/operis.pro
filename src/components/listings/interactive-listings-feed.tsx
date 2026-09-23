"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Layers, Flame, Briefcase, Loader2 } from "lucide-react";
import { ListingCard } from "./listing-card";
import { FeedListingItem } from "@/src/modules/listings/feed/service";
import { BatchSelectionBar } from "../offers/batch-selection-bar";
import { BatchOfferWizardModal, BatchListingTarget } from "../offers/batch-offer-wizard-modal";
import { QuickOfferDrawer } from "../offers/quick-offer-drawer";
import { SubmitOfferModal } from "../offers/submit-offer-modal";
import { SortDropdown } from "../ui/sort-dropdown";

export interface InteractiveListingsFeedProps {
  items: FeedListingItem[];
  locale: string;
  initialNextCursor?: string | null;
  initialHasMore?: boolean;
  categorySlug?: string;
  searchQuery?: string;
  mode?: "following" | "all";
}

function getBatchModeButtonLabel(isBatchMode: boolean, isTr: boolean): string {
  if (isBatchMode) {
    return isTr ? "Toplu Modu Kapat" : "Exit Batch Mode";
  }
  return isTr ? "Toplu Teklif Modu" : "Batch Offer Mode";
}

export function InteractiveListingsFeed({
  items,
  locale,
  initialNextCursor = null,
  initialHasMore = false,
  categorySlug,
  searchQuery,
  mode,
}: InteractiveListingsFeedProps) {
  const isTr = locale === "tr";

  const [feedItems, setFeedItems] = useState<FeedListingItem[]>(items);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isFilterLoading, setIsFilterLoading] = useState<boolean>(false);

  // Quick Filter Chips State
  const [chipLast24h, setChipLast24h] = useState(false);
  const [chipFixedBudget, setChipFixedBudget] = useState(false);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [filterRetryKey, setFilterRetryKey] = useState(0);

  const filterSeqRef = useRef(0);
  const loadMoreAbortControllerRef = useRef<AbortController | null>(null);

  // Dynamic multi-criteria client sorting
  const sortedItems = useMemo(() => {
    const list = [...feedItems];
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
  }, [feedItems, sortBy]);

  // Sync with props when chips are not active
  useEffect(() => {
    if (!chipLast24h && !chipFixedBudget) {
      setFeedItems(items);
      setNextCursor(initialNextCursor);
      setHasMore(initialHasMore);
      setLoadMoreError(null);
      setFilterError(null);
    }
  }, [items, initialNextCursor, initialHasMore, chipLast24h, chipFixedBudget]);

  // Server-side filter fetch with AbortController when quick chips change
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const currentSeq = ++filterSeqRef.current;
    if (loadMoreAbortControllerRef.current) {
      loadMoreAbortControllerRef.current.abort();
      loadMoreAbortControllerRef.current = null;
    }
    setIsLoadingMore(false);
    setLoadMoreError(null);
    setFilterError(null);

    const controller = new AbortController();
    setIsFilterLoading(true);

    const params = new URLSearchParams();
    params.set("locale", locale);
    if (mode) params.set("mode", mode);
    if (categorySlug) params.set("category", categorySlug);
    if (searchQuery) params.set("q", searchQuery);
    if (chipLast24h) params.set("last24Hours", "true");
    if (chipFixedBudget) params.set("budgetSpecific", "true");

    fetch(`/api/listings/feed?${params.toString()}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Feed request failed");
        return res.json();
      })
      .then((data) => {
        if (currentSeq !== filterSeqRef.current) return;
        setFeedItems(data.items || []);
        setNextCursor(data.nextCursor ?? null);
        setHasMore(Boolean(data.hasMore));
        setFilterError(null);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          if (currentSeq === filterSeqRef.current) {
            setFilterError(
              isTr
                ? "Filtrelenmiş ilanlar yüklenirken bir sorun oluştu."
                : "Failed to apply filters to listings."
            );
            if (!chipLast24h && !chipFixedBudget) {
              setFeedItems(items);
              setNextCursor(initialNextCursor);
              setHasMore(initialHasMore);
            }
          }
        }
      })
      .finally(() => {
        if (currentSeq === filterSeqRef.current) {
          setIsFilterLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [chipLast24h, chipFixedBudget, locale, mode, categorySlug, searchQuery, filterRetryKey, initialHasMore, initialNextCursor, isTr, items]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore || isFilterLoading) return;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    const seq = filterSeqRef.current;

    const controller = new AbortController();
    loadMoreAbortControllerRef.current = controller;

    try {
      const params = new URLSearchParams();
      params.set("cursor", nextCursor);
      params.set("locale", locale);
      if (mode) params.set("mode", mode);
      if (categorySlug) params.set("category", categorySlug);
      if (searchQuery) params.set("q", searchQuery);
      if (chipLast24h) params.set("last24Hours", "true");
      if (chipFixedBudget) params.set("budgetSpecific", "true");

      const res = await fetch(`/api/listings/feed?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error("Failed to load more listings");
      }
      const data = await res.json();
      if (seq !== filterSeqRef.current) return;

      const newItems: FeedListingItem[] = data.items || [];
      setFeedItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const uniqueNew = newItems.filter((i) => !existingIds.has(i.id));
        return [...prev, ...uniqueNew];
      });
      setNextCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.hasMore));
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== "AbortError") {
        setLoadMoreError(
          isTr
            ? "Daha fazla ilan yüklenirken bir sorun oluştu. Lütfen tekrar deneyin."
            : "Failed to load more listings. Please try again."
        );
      }
    } finally {
      if (seq === filterSeqRef.current) {
        setIsLoadingMore(false);
      }
    }
  };

  // Batch Mode State
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [isBatchWizardOpen, setIsBatchWizardOpen] = useState(false);

  // Quick Offer Drawer State
  const [quickOfferListing, setQuickOfferListing] = useState<BatchListingTarget | null>(null);

  // Full Modal Fallback State
  const [fullModalListing, setFullModalListing] = useState<BatchListingTarget | null>(null);
  const [fullModalInitialData, setFullModalInitialData] = useState<
    | {
        message?: string;
        budgetCurrency?: string;
        budgetMin?: string;
        budgetMax?: string;
        timelineValue?: string;
        timelineUnit?: "DAYS" | "WEEKS" | "MONTHS";
      }
    | undefined
  >(undefined);

  const maxBatchLimit = 5;

  const toggleSelectListing = (id: string) => {
    setSelectedListingIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= maxBatchLimit) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleClearSelection = () => {
    setSelectedListingIds([]);
  };

  const handleExitBatchMode = () => {
    setIsBatchMode(false);
    setSelectedListingIds([]);
  };

  // Filter selected targets
  const selectedTargets: BatchListingTarget[] = feedItems
    .filter((item) => selectedListingIds.includes(item.id))
    .map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      categoryName: item.categoryName,
      budgetMin: item.budgetMin,
      budgetMax: item.budgetMax,
      budgetCurrency: item.budgetCurrency,
      ownerDisplayName: item.ownerDisplayName,
    }));

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar: Toggle Batch Mode & Quick Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[var(--color-border-subtle)]/40">
        {/* Quick Filter Chips Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setChipLast24h((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              chipLast24h
                ? "bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-xs"
                : "bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Flame
              className={`h-3.5 w-3.5 ${chipLast24h ? "text-rose-400" : "text-[var(--color-text-tertiary)]"}`}
            />
            <span>{isTr ? "Son 24 Saatte Yayınlananlar" : "Published in Last 24h"}</span>
          </button>

          <button
            type="button"
            onClick={() => setChipFixedBudget((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              chipFixedBudget
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-xs"
                : "bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Briefcase
              className={`h-3.5 w-3.5 ${chipFixedBudget ? "text-emerald-400" : "text-[var(--color-text-tertiary)]"}`}
            />
            <span>{isTr ? "Bütçesi Belirli İlanlar" : "Defined Budget"}</span>
          </button>

          {(chipLast24h || chipFixedBudget) && (
            <button
              type="button"
              onClick={() => {
                setChipLast24h(false);
                setChipFixedBudget(false);
              }}
              className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] underline ml-1 cursor-pointer"
            >
              {isTr ? "Filtreleri Temizle" : "Clear Filters"}
            </button>
          )}
        </div>

        {/* Sort & Batch Controls */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
          <SortDropdown value={sortBy} onChange={setSortBy} locale={locale} />

          <div className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1.5">
            {isFilterLoading && <Loader2 className="h-3 w-3 animate-spin text-blue-400" />}
            <span>
              {sortedItems.length} {isTr ? "ilan" : "listings"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsBatchMode(!isBatchMode);
              if (isBatchMode) setSelectedListingIds([]);
            }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border shrink-0 ${
              isBatchMode
                ? "bg-blue-500 text-white border-blue-600 shadow-md shadow-blue-500/20"
                : "bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>
              {getBatchModeButtonLabel(isBatchMode, isTr)}
            </span>
          </button>
        </div>
      </div>

      {/* Filter Error Banner */}
      {filterError && (
        <div className="flex items-center justify-between gap-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-2xl animate-in fade-in">
          <span>{filterError}</span>
          <button
            type="button"
            onClick={() => setFilterRetryKey((k) => k + 1)}
            className="font-semibold underline hover:text-rose-300 cursor-pointer shrink-0"
          >
            {isTr ? "Tekrar Dene" : "Retry"}
          </button>
        </div>
      )}

      {/* Listings Grid */}
      {(() => {
        if (isFilterLoading && feedItems.length === 0) {
          return (
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/60 p-12 text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {isTr ? "İlanlar filtreleniyor..." : "Filtering listings..."}
              </p>
            </div>
          );
        }

        if (feedItems.length === 0) {
          return (
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/60 p-12 text-center space-y-2">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {isTr
                  ? "Seçilen filtrelere uygun ilan bulunamadı"
                  : "No listings match the selected filters"}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {isTr
                  ? "Daha fazla sonuç görmek için filtreleri sıfırlayabilirsiniz."
                  : "Reset filters to view all active listings."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setChipLast24h(false);
                  setChipFixedBudget(false);
                }}
                className="text-xs font-semibold text-blue-400 hover:underline pt-2 cursor-pointer"
              >
                {isTr ? "Tüm Filtreleri Temizle" : "Reset All Filters"}
              </button>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                budgetMin={item.budgetMin}
                budgetMax={item.budgetMax}
                timelineMode={item.timelineMode}
                targetDate={item.targetDate}
                timelineValue={item.timelineValue}
                timelineUnit={item.timelineUnit}
                ownerHandle={item.ownerHandle}
                ownerDisplayName={item.ownerDisplayName}
                ownerIsCompanyVerified={item.ownerIsCompanyVerified}
                ownerCompanyName={item.ownerCompanyName}
                ownerCompanyType={item.ownerCompanyType}
                ownerTaxOffice={item.ownerTaxOffice}
                ownerVknMasked={item.ownerVknMasked}
                firstPublishedAt={item.firstPublishedAt}
                lastActivatedAt={item.lastActivatedAt}
                activeUntil={item.activeUntil}
                activationSeq={item.activationSeq}
                viewCount={item.viewCount}
                clickCount={item.clickCount}
                locale={locale}
                isBatchMode={isBatchMode}
                isSelected={selectedListingIds.includes(item.id)}
                onToggleSelect={toggleSelectListing}
                onQuickOffer={(target) => setQuickOfferListing(target)}
              />
            ))}
          </div>
        );
      })()}

      {/* Dynamic Cursor Pagination / Load More */}
      {hasMore && (
        <div className="flex flex-col items-center gap-2 pt-4 pb-2">
          {loadMoreError && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl">
              <span>{loadMoreError}</span>
              <button
                type="button"
                onClick={handleLoadMore}
                className="font-semibold underline hover:text-rose-300 cursor-pointer ml-1"
              >
                {isTr ? "Tekrar Dene" : "Retry"}
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] hover:border-blue-500/30 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span>{isTr ? "İlanlar Yükleniyor..." : "Loading Listings..."}</span>
              </>
            ) : (
              <>
                <span>{isTr ? "Daha Fazla İlan Yükle" : "Load More Listings"}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Floating Batch Selection Bar */}
      <BatchSelectionBar
        selectedCount={selectedListingIds.length}
        maxLimit={maxBatchLimit}
        locale={locale}
        onClear={handleClearSelection}
        onOpenWizard={() => setIsBatchWizardOpen(true)}
        onExitBatchMode={isBatchMode ? handleExitBatchMode : undefined}
      />

      {/* Batch Offer Wizard Modal */}
      {isBatchWizardOpen && (
        <BatchOfferWizardModal
          isOpen={isBatchWizardOpen}
          onClose={() => setIsBatchWizardOpen(false)}
          selectedListings={selectedTargets}
          locale={locale}
          onRemoveListing={(id) => {
            setSelectedListingIds((prev) => prev.filter((item) => item !== id));
          }}
          onSuccess={() => {
            setSelectedListingIds([]);
            setIsBatchMode(false);
          }}
        />
      )}

      {/* Quick Offer Drawer */}
      {quickOfferListing && (
        <QuickOfferDrawer
          isOpen={!!quickOfferListing}
          onClose={() => setQuickOfferListing(null)}
          listing={quickOfferListing}
          locale={locale}
          onOpenFullModal={(initialData) => {
            setFullModalListing(quickOfferListing);
            setFullModalInitialData(initialData);
            setQuickOfferListing(null);
          }}
          onSuccess={() => {
            setQuickOfferListing(null);
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
