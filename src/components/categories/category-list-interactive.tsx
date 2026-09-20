"use client";

import { useState, useMemo, useDeferredValue } from "react";
import { searchCategories } from "@/src/lib/search/engine";
import { CategoryGridCard, type CategoryItem } from "./category-grid-card";
import { CategorySearchFilter } from "./category-search-filter";
import { CategoryMetaBar } from "./category-meta-bar";
import { CategoryEmptyState } from "./category-empty-state";
import { CategoryAuthNotice } from "./category-auth-notice";

import { SEED_SECTORS } from "@/db/seeds/categories";

export type { CategoryItem };

export interface CategoryListInteractiveProps {
  categories: CategoryItem[];
  initialFollowedIds: string[];
  locale: string;
  hasSession?: boolean;
  initialSector?: string;
}

export function CategoryListInteractive({
  categories,
  initialFollowedIds,
  locale,
  hasSession = false,
  initialSector = "all",
}: CategoryListInteractiveProps) {
  const isTr = locale === "tr";
  const [selectedSector, setSelectedSector] = useState<string>(initialSector);

  const selectedSectorObj = useMemo(() => {
    if (selectedSector === "all") return null;
    return SEED_SECTORS.find((s) => s.key === selectedSector) || null;
  }, [selectedSector]);

  const currentSectorLabel = useMemo(() => {
    if (!selectedSectorObj) {
      return isTr ? "Tüm Sektörler" : "All Sectors";
    }
    return isTr ? selectedSectorObj.translations.tr.name : selectedSectorObj.translations.en.name;
  }, [selectedSectorObj, isTr]);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const isStale = searchQuery !== deferredQuery;
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set(initialFollowedIds));
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthNotice, setShowAuthNotice] = useState(false);

  const POPULAR_SEARCH_CHIPS = useMemo(() => {
    if (isTr) {
      return ["Web Geliştirme", "UI/UX Tasarım", "SEO", "Yapay Zeka", "Mobil Uygulama", "Logo & Marka"];
    }
    return ["Web Development", "UI/UX Design", "SEO", "Artificial Intelligence", "Mobile App", "Logo & Branding"];
  }, [isTr]);

  const globalCrossSectorMatches = useMemo(() => {
    const query = deferredQuery.trim();
    if (selectedSector === "all" || !query) return [];
    return searchCategories(query, { limit: 5 });
  }, [selectedSector, deferredQuery]);

  const filteredCategories = useMemo(() => {
    const trimmed = deferredQuery.trim();
    if (!trimmed) {
      return categories.filter((c) => selectedSector === "all" || c.sectorKey === selectedSector);
    }

    const searchResults = searchCategories(trimmed, {
      sectorKey: selectedSector === "all" ? undefined : selectedSector,
      limit: 110,
    });

    if (searchResults.length > 0) {
      const categoryMap = new Map<string, CategoryItem>();
      for (const c of categories) {
        if (c.slug) categoryMap.set(c.slug.toLowerCase(), c);
        if (c.id) categoryMap.set(c.id.toLowerCase(), c);
        if (c.key) categoryMap.set(c.key.toLowerCase(), c);
        if (c.name) categoryMap.set(c.name.toLowerCase().trim(), c);
      }

      const ranked: CategoryItem[] = [];
      const seen = new Set<string>();

      for (const res of searchResults) {
        const item =
          (res.repoKey && categoryMap.get(res.repoKey.toLowerCase())) ||
          (res.slug && categoryMap.get(res.slug.toLowerCase())) ||
          (res.name && categoryMap.get(res.name.toLowerCase().trim()));

        if (item && !seen.has(item.id)) {
          if (selectedSector === "all" || item.sectorKey === selectedSector) {
            seen.add(item.id);
            ranked.push(item);
          }
        }
      }

      if (ranked.length > 0) {
        return ranked;
      }
    }

    // Fallback if no taxonomy search result
    return categories.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(trimmed.toLowerCase()) ||
        c.slug.toLowerCase().includes(trimmed.toLowerCase()) ||
        Boolean(c.description && c.description.toLowerCase().includes(trimmed.toLowerCase()));
      const matchesSector = selectedSector === "all" || c.sectorKey === selectedSector;
      return matchesSearch && matchesSector;
    });
  }, [categories, deferredQuery, selectedSector]);

  const filteredListingCount = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + (cat.listingCount || 0), 0);
  }, [filteredCategories]);

  const loginUrl = `${isTr ? "/tr/giris" : "/en/login"}?returnUrl=${encodeURIComponent(isTr ? "/tr/kategoriler" : "/en/categories")}`;

  const handleToggle = async (categoryId: string) => {
    if (!hasSession) {
      setShowAuthNotice(true);
      return;
    }

    const isFollowed = followedIds.has(categoryId);
    const newSet = new Set(followedIds);
    if (isFollowed) {
      newSet.delete(categoryId);
    } else {
      newSet.add(categoryId);
    }
    setFollowedIds(newSet);

    try {
      const res = await fetch("/api/categories/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          action: isFollowed ? "unfollow" : "follow",
        }),
      });
      if (!res.ok) {
        setFollowedIds(followedIds);
        if (res.status === 401) {
          setShowAuthNotice(true);
        }
      }
    } catch {
      // Revert on error
      setFollowedIds(followedIds);
    }
  };

  const handleFollowAll = async () => {
    if (!hasSession) {
      setShowAuthNotice(true);
      return;
    }

    setIsLoading(true);
    const allIds = new Set(categories.map((c) => c.id));
    setFollowedIds(allIds);

    try {
      const res = await fetch("/api/categories/follow-all", { method: "POST" });
      if (!res.ok) {
        setFollowedIds(followedIds);
        if (res.status === 401) {
          setShowAuthNotice(true);
        }
      }
    } catch {
      setFollowedIds(followedIds);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollowAll = async () => {
    if (!hasSession) {
      setShowAuthNotice(true);
      return;
    }

    setIsLoading(true);
    setFollowedIds(new Set());

    try {
      const res = await fetch("/api/categories/unfollow-all", { method: "POST" });
      if (!res.ok) {
        setFollowedIds(followedIds);
        if (res.status === 401) {
          setShowAuthNotice(true);
        }
      }
    } catch {
      setFollowedIds(followedIds);
    } finally {
      setIsLoading(false);
    }
  };

  let gridOpacityClass = "opacity-100";
  if (isStale) {
    gridOpacityClass = "opacity-75";
  }

  return (
    <div className="space-y-6">
      {/* Search & Sector Filter Bar */}
      <CategorySearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSector={selectedSector}
        onSelectSector={setSelectedSector}
        categories={categories}
        isTr={isTr}
      />

      {/* Meta Count and Bulk Follow Action Bar */}
      <CategoryMetaBar
        filteredCategoriesCount={filteredCategories.length}
        filteredListingCount={filteredListingCount}
        followedCount={followedIds.size}
        isLoading={isLoading}
        isTr={isTr}
        onFollowAll={handleFollowAll}
        onUnfollowAll={handleUnfollowAll}
      />

      {/* Empty State vs Category Grid */}
      {filteredCategories.length === 0 ? (
        <CategoryEmptyState
          selectedSector={selectedSector}
          currentSectorLabel={currentSectorLabel}
          globalCrossSectorMatchesCount={globalCrossSectorMatches.length}
          searchQuery={searchQuery}
          isTr={isTr}
          popularChips={POPULAR_SEARCH_CHIPS}
          onResetSector={() => setSelectedSector("all")}
          onClearSearch={() => {
            setSearchQuery("");
            if (selectedSector !== "all") setSelectedSector("all");
          }}
          onSelectChip={(chip) => {
            setSelectedSector("all");
            setSearchQuery(chip);
          }}
        />
      ) : (
        <div
          className={`relative z-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 transition-opacity duration-150 ${gridOpacityClass}`}
        >
          {filteredCategories.map((cat) => {
            return (
              <CategoryGridCard
                key={cat.id}
                cat={cat}
                isFollowed={followedIds.has(cat.id)}
                isTr={isTr}
                onToggle={handleToggle}
              />
            );
          })}
        </div>
      )}

      {/* Guest Authentication Modal */}
      <CategoryAuthNotice
        isOpen={showAuthNotice}
        onClose={() => setShowAuthNotice(false)}
        isTr={isTr}
        loginUrl={loginUrl}
      />
    </div>
  );
}
