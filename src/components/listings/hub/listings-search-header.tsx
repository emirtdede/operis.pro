import { useState, type Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { Search, PlusCircle, Flame, Briefcase, X, SlidersHorizontal, LayoutList, LayoutGrid } from "lucide-react";
import type { CategoryDto } from "@/src/modules/categories/service";
import { SortDropdown } from "@/src/components/ui/sort-dropdown";
import { Button } from "@/src/components/ui/button";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";
import { AdvancedFilterModal } from "./advanced-filter-modal";
import { recordUserAffinity } from "@/src/lib/recommendations/user-affinity";

export interface ListingsSearchHeaderProps {
  isTr: boolean;
  locale: string;
  basePath: string;
  categorySlug?: string;
  selectedCategorySlugs: string[];
  categories: CategoryDto[];
  searchQuery?: string;
  mode: "following" | "all";
  view: "stream" | "catalog";
  handleSwitchView?: (view: "stream" | "catalog") => void;
  handleSwitchMode: (mode: "following" | "all") => void;
  isTabLoading: boolean;
  isAuthenticated: boolean;
  followedCategoryIds: Set<string>;
  sortBy: string;
  setSortBy: (val: string) => void;
  chipLast24h: boolean;
  setChipLast24h: Dispatch<SetStateAction<boolean>>;
  chipFixedBudget: boolean;
  setChipFixedBudget: Dispatch<SetStateAction<boolean>>;
  totalItemsCount: number;
}

export function ListingsSearchHeader({
  isTr,
  locale,
  basePath,
  categorySlug,
  selectedCategorySlugs,
  categories,
  searchQuery,
  mode,
  view,
  handleSwitchView,
  handleSwitchMode,
  isTabLoading,
  isAuthenticated,
  followedCategoryIds,
  sortBy,
  setSortBy,
  chipLast24h,
  setChipLast24h,
  chipFixedBudget,
  setChipFixedBudget,
  totalItemsCount: _totalItemsCount,
}: ListingsSearchHeaderProps) {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  return (
    <>
      {/* Mobile Top Control Bar (< lg) */}
      <div className="lg:hidden flex flex-col gap-2.5 p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-surface/75 backdrop-blur-xl shadow-xs">
        <div className="flex items-center gap-2">
          <form
            method="GET"
            action={basePath}
            onSubmit={(e) => {
              const formData = new FormData(e.currentTarget);
              const q = formData.get("q") as string;
              if (q && q.trim()) {
                recordUserAffinity({
                  type: "search",
                  query: q.trim(),
                });
              }
            }}
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
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/15 text-sky-400 font-bold border border-blue-500/20">
                {followedCategoryIds.size}
              </span>
            )}
          </button>
        </div>

        {/* Right: Advanced Filter, Sorting and View Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              activeFilterCount > 0
                ? "bg-blue-600/15 border-blue-500/40 text-blue-400 font-bold shadow-xs"
                : "bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-blue-500/30"
            }`}
            title={isTr ? "Gelişmiş filtreleme seçeneklerini aç" : "Open advanced filtering options"}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isTr ? "Gelişmiş Filtrele" : "Filter"}</span>
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <SortDropdown value={sortBy} onChange={setSortBy} locale={locale} />

          {handleSwitchView && (
            <div className="flex items-center p-0.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40">
              <button
                type="button"
                onClick={() => handleSwitchView("stream")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  view === "stream"
                    ? "bg-blue-500/20 text-blue-400 font-bold shadow-xs"
                    : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                }`}
                title={isTr ? "Liste Görünümü" : "List View"}
                aria-label={isTr ? "Liste Görünümü" : "List View"}
              >
                <LayoutList className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleSwitchView("catalog")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  view === "catalog"
                    ? "bg-blue-500/20 text-blue-400 font-bold shadow-xs"
                    : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                }`}
                title={isTr ? "Kart Görünümü" : "Card View"}
                aria-label={isTr ? "Kart Görünümü" : "Card View"}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
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
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-blue-500/15 text-sky-400 border border-blue-500/30 shadow-2xs"
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

      {/* Clear Filters Bar (only when filters are active) */}
      {(categorySlug || searchQuery || chipLast24h || chipFixedBudget || activeFilterCount > 0) && (
        <div className="flex items-center justify-end text-xs text-[var(--color-text-tertiary)] px-1">
          <Link
            href={basePath}
            className="text-blue-600 dark:text-sky-400 hover:underline font-medium transition-colors cursor-pointer"
          >
            {isTr ? "Filtreleri Temizle" : "Clear Filters"}
          </Link>
        </div>
      )}

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        categories={categories}
        isTr={isTr}
        basePath={basePath}
        currentCategorySlug={categorySlug}
        selectedCategorySlugs={selectedCategorySlugs}
        followedCategoryIds={followedCategoryIds}
        isAuthenticated={isAuthenticated}
        chipLast24h={chipLast24h}
        setChipLast24h={setChipLast24h}
        chipFixedBudget={chipFixedBudget}
        setChipFixedBudget={setChipFixedBudget}
        onFilterChangeCount={setActiveFilterCount}
      />
    </>
  );
}
