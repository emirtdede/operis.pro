"use client";

import { useState } from "react";
import {
  useListingsHubState,
  useFeedCustomization,
  FeedLeftPanel,
  FeedRightPanel,
  FeedCustomizationModal,
  ListingsSearchHeader,
  ListingsFeedView,
  ListingsModals,
} from "./hub";
import type { UnifiedListingsHubProps } from "./hub";

export type { UnifiedListingsHubProps };

export function UnifiedListingsHub(props: UnifiedListingsHubProps) {
  const state = useListingsHubState(props);
  const feedCustomization = useFeedCustomization();
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  return (
    <div className="w-full">
      {/* 3-Column Responsive Feed Layout (Left Panel + Main Feed + Right Panel) */}
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[1400px] flex items-start justify-center gap-5 xl:gap-7 mx-auto px-1 sm:px-2">
          {/* 1. Left Panel (Identity Snapshot, Availability, Followed Categories, Quick Filters, Shortcuts) */}
          <FeedLeftPanel
            currentUserProfile={props.currentUserProfile}
            isAuthenticated={props.isAuthenticated}
            categories={props.categories}
            categorySlug={props.categorySlug}
            basePath={props.basePath}
            searchQuery={props.searchQuery}
            mode={state.mode}
            view={state.view}
            locale={props.locale}
            isTr={state.isTr}
            chipLast24h={state.chipLast24h}
            setChipLast24h={state.setChipLast24h}
            chipFixedBudget={state.chipFixedBudget}
            setChipFixedBudget={state.setChipFixedBudget}
            followedCategoryIds={state.followedCategoryIds}
            settings={feedCustomization.settings}
            onOpenCustomizationModal={() => setIsCustomizationOpen(true)}
          />

          {/* 2. Main Center Feed Stream */}
          <div className="flex-1 min-w-0 max-w-[680px] xl:max-w-[700px] flex flex-col gap-3.5 mx-auto">
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
              handleSwitchView={state.handleSwitchView}
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

          {/* 3. Right Panel (Publish CTA, Trending Tech, Personalized Suggested Areas) */}
          <FeedRightPanel
            isTr={state.isTr}
            locale={props.locale}
            basePath={props.basePath}
            trendingTags={state.trendingTags}
            categories={props.categories}
            followedCategoryIds={state.followedCategoryIds}
            handleToggleCategoryFollow={state.handleToggleCategoryFollow}
            totalItemsCount={state.sortedItems.length}
            settings={feedCustomization.settings}
            listings={state.items}
          />
        </div>
      </div>

      {/* 4. Feed Customization Modal */}
      <FeedCustomizationModal
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
        settings={feedCustomization.settings}
        updateSettings={feedCustomization.updateSettings}
        resetSettings={feedCustomization.resetSettings}
        isTr={state.isTr}
      />

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

