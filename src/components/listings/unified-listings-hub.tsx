"use client";

import {
  useListingsHubState,
  ListingsSearchHeader,
  ListingsFeedView,
  ListingsModals,
} from "./hub";
import type { UnifiedListingsHubProps } from "./hub";

export type { UnifiedListingsHubProps };

export function UnifiedListingsHub(props: UnifiedListingsHubProps) {
  const state = useListingsHubState(props);

  return (
    <div className="w-full">
      {/* Centered Focused Feed Stream (Left & Right Sidebars hidden per request) */}
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[680px] min-w-0 flex flex-col gap-3.5 mx-auto">
          <ListingsSearchHeader
            isTr={state.isTr}
            locale={props.locale}
            basePath={props.basePath}
            categorySlug={props.categorySlug}
            selectedCategorySlugs={state.selectedCategorySlugs}
            categories={props.categories}
            searchQuery={props.searchQuery}
            mode={state.mode}
            view={state.view}
            handleSwitchMode={state.handleSwitchMode}
            isTabLoading={state.isTabLoading}
            isAuthenticated={props.isAuthenticated}
            followedCategoryIds={state.followedCategoryIds}
            sortBy={state.sortBy}
            setSortBy={state.setSortBy}
            chipLast24h={state.chipLast24h}
            setChipLast24h={state.setChipLast24h}
            chipFixedBudget={state.chipFixedBudget}
            setChipFixedBudget={state.setChipFixedBudget}
            totalItemsCount={state.sortedItems.length}
          />

          <ListingsFeedView
            isTr={state.isTr}
            locale={props.locale}
            basePath={props.basePath}
            mode={state.mode}
            view={state.view}
            errorMsg={state.errorMsg}
            isTabLoading={state.isTabLoading}
            sortedItems={state.sortedItems}
            hasFollowed={state.hasFollowed}
            followedCategoryIds={state.followedCategoryIds}
            selectedIds={state.selectedIds}
            isLoadingMore={state.isLoadingMore}
            hasMore={state.hasMore}
            sentinelRef={state.sentinelRef}
            handleSwitchMode={state.handleSwitchMode}
            fetchListings={state.fetchListings}
            handleToggleCategoryFollow={state.handleToggleCategoryFollow}
            handleQuickOffer={state.handleQuickOffer}
            handleToggleSelect={state.handleToggleSelect}
            handleLoadMore={state.handleLoadMore}
          />
        </div>
      </div>

      {/* 5. Drawers & Modals (Quick Offer, Batch Selection, Full Modal) */}
      <ListingsModals
        locale={props.locale}
        quickOfferTarget={state.quickOfferTarget}
        setQuickOfferTarget={state.setQuickOfferTarget}
        fullModalListing={state.fullModalListing}
        setFullModalListing={state.setFullModalListing}
        fullModalInitialData={state.fullModalInitialData}
        setFullModalInitialData={state.setFullModalInitialData}
        selectedIds={state.selectedIds}
        setSelectedIds={state.setSelectedIds}
        isBatchOpen={state.isBatchOpen}
        setIsBatchOpen={state.setIsBatchOpen}
        batchTargets={state.batchTargets}
      />
    </div>
  );
}
