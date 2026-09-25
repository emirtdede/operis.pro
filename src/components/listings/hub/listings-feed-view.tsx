import type { RefObject } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import type { FeedListingItem } from "@/src/modules/listings/feed/service";
import { SocialListingCard } from "@/src/components/feed/social-listing-card";
import { ListingCard } from "../listing-card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Button } from "@/src/components/ui/button";
import type { QuickOfferTarget } from "./types";

export interface ListingsFeedViewProps {
  isTr: boolean;
  locale: string;
  basePath: string;
  mode: "following" | "all";
  view: "stream" | "catalog";
  errorMsg: string | null;
  isTabLoading: boolean;
  sortedItems: FeedListingItem[];
  hasFollowed: boolean;
  followedCategoryIds: Set<string>;
  selectedIds: Set<string>;
  isLoadingMore: boolean;
  hasMore: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  handleSwitchMode: (mode: "following" | "all") => void;
  fetchListings: (mode: "following" | "all", isLoadMore?: boolean) => Promise<void>;
  handleToggleCategoryFollow: (categoryId: string) => Promise<void>;
  handleQuickOffer: (target: QuickOfferTarget) => void;
  handleToggleSelect: (id: string) => void;
  handleLoadMore: () => void;
}

export function ListingsFeedView({
  isTr,
  locale,
  basePath,
  mode,
  view,
  errorMsg,
  isTabLoading,
  sortedItems,
  hasFollowed,
  followedCategoryIds,
  selectedIds,
  isLoadingMore,
  hasMore,
  sentinelRef,
  handleSwitchMode,
  fetchListings,
  handleToggleCategoryFollow,
  handleQuickOffer,
  handleToggleSelect,
  handleLoadMore,
}: ListingsFeedViewProps) {
  const isFollowingEmpty = mode === "following" && (!hasFollowed || followedCategoryIds.size === 0);

  return (
    <>
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
          {isFollowingEmpty ? (
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

      {/* Onboarding Suggestion Banner for Sana Özel when user has no followed categories */}
      {!isTabLoading && mode === "following" && (!hasFollowed || followedCategoryIds.size === 0) && sortedItems.length > 0 && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "Henüz bir uzmanlık alanı takip etmediğiniz için sizin için öne çıkan güncel ilanları listeliyoruz. Sağdaki önerilen alanlardan takip ederek akışınızı dilediğiniz gibi kişiselleştirebilirsiniz."
                : "Since you haven't followed any categories yet, we are displaying featured active listings. Follow areas on the right to personalize your feed."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSwitchMode("all")}
            className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:border-blue-500/40 transition-colors cursor-pointer self-start sm:self-auto"
          >
            {isTr ? "Tüm İlanlar" : "All Listings"}
          </button>
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
              categorySlug={item.categorySlug}
              tags={item.tags}
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
    </>
  );
}
