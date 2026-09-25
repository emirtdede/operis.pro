"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  X,
  Trash2,
  AlertCircle,
  ExternalLink,
  Tag,
  Clock,
  Coins,
  CheckSquare,
  Sparkles,
  Bookmark,
  ListFilter,
  ChevronDown,
  ArrowUpDown,
  Lightbulb,
} from "lucide-react";
import { SavedListingItem } from "@/src/modules/listings/saved-service";
import {
  filterAndSortByRelevance,
  computeRangeSelection,
} from "@/src/lib/search/token-matcher";
import { getLocalizedListingPath } from "@/src/lib/i18n/routes";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { EmptyState } from "../ui/empty-state";

export interface SavedListingsDashboardProps {
  initialSavedListings: SavedListingItem[];
  locale: string;
}

type StatusFilter = "all" | "active" | "closed";
type SortOption = "newest" | "oldest" | "budget_desc" | "budget_asc";

const CURRENCY_SYMBOLS: Record<string, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
};

function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

function getStatusFilterLabel(st: "all" | "active" | "closed", isTr: boolean): string {
  if (st === "all") return isTr ? "Tümü" : "All";
  if (st === "active") return isTr ? "Aktif" : "Active";
  return isTr ? "Kapanan" : "Closed";
}

function getEmptyStateTitle(hasSearchQuery: boolean, isTr: boolean): string {
  if (hasSearchQuery) {
    return isTr ? "Aramanıza uygun kayıtlı ilan bulunamadı" : "No saved listings match your query";
  }
  return isTr ? "Henüz kaydedilmiş ilanınız bulunmuyor" : "No saved listings yet";
}

function getEmptyStateDescription(hasSearchQuery: boolean, isTr: boolean): string {
  if (hasSearchQuery) {
    return isTr
      ? "Farklı anahtar kelimelerle arama yapmayı veya durum filtresini değiştirmeyi deneyebilirsiniz."
      : "Try searching with different terms or changing your status filter.";
  }
  return isTr
    ? "İlgilendiğiniz iş ilanlarını daha sonra başvurmak üzere yer imlerine ekleyebilirsiniz."
    : "Bookmark jobs you find interesting to easily review and apply later.";
}

function getListingCardClass(isSelected: boolean, isClosed: boolean): string {
  if (isSelected) {
    return "border-blue-500/50 bg-blue-500/5 shadow-md shadow-blue-500/10";
  }
  if (isClosed) {
    return "border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]/50 opacity-80 hover:opacity-100";
  }
  return "border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] hover:border-[var(--color-border-strong)] hover:shadow-sm";
}

function getListingActionLabel(isClosed: boolean, isTr: boolean): string {
  if (isClosed) {
    return isTr ? "İlanı İncele" : "View Archive";
  }
  return isTr ? "Teklif Ver" : "Apply Now";
}

function getBulkRemoveButtonLabel(isProcessing: boolean, isTr: boolean): string {
  if (isProcessing) {
    return isTr ? "Kaldırılıyor..." : "Removing...";
  }
  return isTr ? "Evet, Kaldır" : "Yes, Remove";
}

export function SavedListingsDashboard({
  initialSavedListings,
  locale,
}: SavedListingsDashboardProps) {
  const isTr = locale === "tr";
  const [items, setItems] = useState<SavedListingItem[]>(initialSavedListings);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // Bulk deletion modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const statusCounts = useMemo(() => {
    return {
      all: items.length,
      active: items.filter((i) => !i.isClosed).length,
      closed: items.filter((i) => i.isClosed).length,
    };
  }, [items]);

  // 1. Status Filter
  const statusFilteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter === "active") return !item.isClosed;
      if (statusFilter === "closed") return item.isClosed;
      return true;
    });
  }, [items, statusFilter]);

  // 2. Turkish-Aware Token Search Relevance Scoring
  const searchFilteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return statusFilteredItems;
    }
    return filterAndSortByRelevance(statusFilteredItems, searchQuery, (item) => [
      { text: item.title, weight: 10 },
      { text: item.categoryTitle, weight: 5 },
      { text: item.tags.join(" "), weight: 4 },
      { text: item.summary, weight: 3 },
      { text: item.ownerDisplayName, weight: 2 },
      { text: item.ownerHandle, weight: 2 },
    ]);
  }, [statusFilteredItems, searchQuery]);

  // 3. Sorting (when not actively searching)
  const displayItems = useMemo(() => {
    if (searchQuery.trim()) {
      return searchFilteredItems;
    }
    const copy = [...searchFilteredItems];
    switch (sortBy) {
      case "oldest":
        return copy.sort(
          (a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
        );
      case "budget_desc":
        return copy.sort(
          (a, b) => Number(b.budgetMax || b.budgetMin || 0) - Number(a.budgetMax || a.budgetMin || 0)
        );
      case "budget_asc":
        return copy.sort(
          (a, b) => Number(a.budgetMin || a.budgetMax || 0) - Number(b.budgetMin || b.budgetMax || 0)
        );
      case "newest":
      default:
        return copy.sort(
          (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        );
    }
  }, [searchFilteredItems, sortBy, searchQuery]);

  // Tri-state checkbox handling for Select All
  const visibleSelectedCount = useMemo(() => {
    let count = 0;
    for (const item of displayItems) {
      if (selectedIds.has(item.listingId)) {
        count++;
      }
    }
    return count;
  }, [displayItems, selectedIds]);

  const isAllSelected =
    displayItems.length > 0 && visibleSelectedCount === displayItems.length;
  const isPartiallySelected =
    visibleSelectedCount > 0 && visibleSelectedCount < displayItems.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isPartiallySelected;
    }
  }, [isPartiallySelected]);

  // Handle Select All toggle
  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // Unselect all visible
      const next = new Set(selectedIds);
      for (const item of displayItems) {
        next.delete(item.listingId);
      }
      setSelectedIds(next);
      setLastSelectedId(null);
    } else {
      // Select all visible
      const next = new Set(selectedIds);
      for (const item of displayItems) {
        next.add(item.listingId);
      }
      setSelectedIds(next);
    }
  };

  // Handle single item click with Shift + Click range selection
  const handleItemSelect = (listingId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (e.shiftKey && lastSelectedId) {
      // Range selection
      const itemsForSelection = displayItems.map((i) => ({ id: i.listingId }));
      const next = computeRangeSelection(
        itemsForSelection,
        lastSelectedId,
        listingId,
        selectedIds
      );
      setSelectedIds(next);
      setLastSelectedId(listingId);
    } else {
      // Toggle single item
      const next = new Set(selectedIds);
      if (next.has(listingId)) {
        next.delete(listingId);
      } else {
        next.add(listingId);
      }
      setSelectedIds(next);
      setLastSelectedId(listingId);
    }
  };

  // Perform bulk deletion
  const handleConfirmBulkUnsave = async () => {
    if (selectedIds.size === 0) return;

    setIsProcessing(true);
    setErrorMsg(null);

    const idsToDelete = Array.from(selectedIds);

    try {
      const res = await fetch("/api/listings/saved/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingIds: idsToDelete }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || (isTr ? "Kaldırma işlemi başarısız oldu." : "Failed to unsave."));
      }

      // Update client state
      const idSetToDelete = new Set(idsToDelete);
      setItems((prev) => prev.filter((i) => !idSetToDelete.has(i.listingId)));
      setSelectedIds(new Set());
      setLastSelectedId(null);
      setIsBulkModalOpen(false);

      // Notify badge count
      window.dispatchEvent(
        new CustomEvent("operis:badge-update", {
          detail: {
            key: "savedListings",
            delta: -idsToDelete.length,
          },
        })
      );
    } catch (err: unknown) {
      const defaultErr = isTr ? "Bir hata oluştu." : "An unexpected error occurred.";
      setErrorMsg(err instanceof Error ? err.message : defaultErr);
    } finally {
      setIsProcessing(false);
    }
  };

  // Format currency
  const formatBudget = (currency: string, min: string | null, max: string | null) => {
    if (!min && !max) return isTr ? "Belirtilmemiş" : "Negotiable";
    const curr = getCurrencySymbol(currency);
    if (min && max) {
      return `${curr}${Number(min).toLocaleString("tr-TR")} - ${curr}${Number(max).toLocaleString("tr-TR")}`;
    }
    return `${curr}${Number(min || max).toLocaleString("tr-TR")}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isTr ? "İlanlarda ara..." : "Search listings..."}
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all truncate"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              aria-label={isTr ? "Aramayı Temizle" : "Clear Search"}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Lifecycle & Sort controls: Single Status Filter Button + Single Sort Button */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Single Status Filter Dropdown Button */}
          <div className="relative inline-flex items-center">
            <ListFilter className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" aria-hidden="true" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              aria-label={isTr ? "Durum Filtresi" : "Status Filter"}
              className="appearance-none h-9 py-1.5 pl-8 pr-8 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all shadow-xs"
            >
              {(["all", "active", "closed"] as const).map((st) => (
                <option key={st} value={st} className="bg-[#141517] text-[var(--color-text-primary)]">
                  {getStatusFilterLabel(st, isTr)} ({statusCounts[st]})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" aria-hidden="true" />
          </div>

          {/* Single Sort Dropdown Button */}
          <div className="relative inline-flex items-center">
            <ArrowUpDown className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" aria-hidden="true" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label={isTr ? "Sıralama ölçütü" : "Sort by"}
              className="appearance-none h-9 py-1.5 pl-8 pr-8 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all shadow-xs"
            >
              <option value="newest" className="bg-[#141517] text-[var(--color-text-primary)]">{isTr ? "En Yeni" : "Newest"}</option>
              <option value="oldest" className="bg-[#141517] text-[var(--color-text-primary)]">{isTr ? "En Eski" : "Oldest"}</option>
              <option value="budget_desc" className="bg-[#141517] text-[var(--color-text-primary)]">{isTr ? "En Yüksek Bütçe" : "Highest Budget"}</option>
              <option value="budget_asc" className="bg-[#141517] text-[var(--color-text-primary)]">{isTr ? "En Düşük Bütçe" : "Lowest Budget"}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Bulk Action Sticky Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-20 flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 border border-blue-400/30 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <CheckSquare className="h-4 w-4" />
            <span>
              {isTr
                ? `${selectedIds.size} ilan seçildi (Aralık seçimi için Shift tuşuna basılı tutabilirsiniz)`
                : `${selectedIds.size} job(s) selected (Hold Shift to select a range)`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 transition-colors"
            >
              {isTr ? "Seçimi Temizle" : "Clear Selection"}
            </button>
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isTr ? "Seçilenleri Kaldır" : "Remove Selected"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Select All Row */}
      {displayItems.length > 0 && (
        <div className="flex items-center justify-between px-2 py-1 text-xs text-[var(--color-text-secondary)]">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={isAllSelected}
              onChange={handleToggleSelectAll}
              className="h-4 w-4 rounded border-[var(--color-border-subtle)] text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="font-medium">
              {isTr ? "Tümünü Seç" : "Select All"} ({displayItems.length} ilan)
            </span>
          </label>

          <span className="text-[11px] text-[var(--color-text-tertiary)] hidden sm:inline-flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <span>
              {isTr
                ? "İki kutu arasında Shift tuşuna basılı tutarak toplu aralık seçebilirsiniz."
                : "Hold Shift between two boxes to select a range."}
            </span>
          </span>
        </div>
      )}

      {/* Listings Grid / List */}
      {displayItems.length === 0 ? (
        <EmptyState
          variant="card"
          icon={<Bookmark className="h-7 w-7 text-blue-400" />}
          title={getEmptyStateTitle(Boolean(searchQuery), isTr)}
          description={getEmptyStateDescription(Boolean(searchQuery), isTr)}
          action={
            searchQuery ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="cursor-pointer"
              >
                {isTr ? "Aramayı Temizle" : "Clear Search"}
              </Button>
            ) : (
              <Link href={isTr ? "/tr/ilanlar" : "/en/listings"}>
                <Button variant="shimmer" size="md" className="gap-2 shadow-lg shadow-blue-500/15">
                  <Sparkles className="h-4 w-4" />
                  <span>{isTr ? "İlanları Keşfet" : "Browse Listings"}</span>
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayItems.map((item) => {
            const isSelected = selectedIds.has(item.listingId);
            const listingUrl = getLocalizedListingPath(item.slug, locale);

            return (
              <div
                key={item.listingId}
                onClick={(e) => handleItemSelect(item.listingId, e)}
                className={`group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border transition-all cursor-pointer select-none ${getListingCardClass(
                  isSelected,
                  Boolean(item.isClosed)
                )}`}
              >
                {/* Left Selection & Content */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Checkbox */}
                  <div className="pt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Controlled via parent onClick
                      className="h-4 w-4 rounded border-[var(--color-border-subtle)] text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>

                  {/* Details */}
                  <div className="space-y-2 flex-1">
                    {/* Header line: category & lifecycle badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-semibold py-0.5">
                        {item.categoryTitle}
                      </Badge>

                      {item.isClosed ? (
                        <Badge variant="danger" className="text-[10px] font-semibold py-0.5 gap-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>{isTr ? "İlan Kapanmış" : "Closed"}</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-semibold py-0.5 text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                          {isTr ? "Aktif Başvuruya Açık" : "Active"}
                        </Badge>
                      )}

                      <span className="text-[11px] text-[var(--color-text-tertiary)] flex items-center gap-1 ml-auto">
                        <Clock className="h-3 w-3" />
                        <span>
                          {isTr ? "Kaydedildi:" : "Saved:"}{" "}
                          {new Date(item.savedAt).toLocaleDateString(isTr ? "tr-TR" : "en-US")}
                        </span>
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-[var(--color-text-primary)] group-hover:text-blue-500 transition-colors">
                      <Link
                        href={listingUrl}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        <span>{item.title}</span>
                        <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 shrink-0" />
                      </Link>
                    </h3>

                    {/* Summary */}
                    {item.summary && (
                      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>
                    )}

                    {/* Tags and Budget Footer */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      {/* Budget */}
                      <div className="flex items-center gap-1 font-semibold text-emerald-400">
                        <Coins className="h-3.5 w-3.5" />
                        <span>{formatBudget(item.budgetCurrency, item.budgetMin, item.budgetMax)}</span>
                      </div>

                      {/* Tags */}
                      {item.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)]">
                          <Tag className="h-3 w-3" />
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface-hover)]"
                              >
                                #{tag}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="text-[10px] text-[var(--color-text-tertiary)]">
                                +{item.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Owner */}
                      <span className="text-[var(--color-text-tertiary)] text-[11px]">
                        {isTr ? "İlan Sahibi:" : "Owner:"} {item.ownerDisplayName} (@{item.ownerHandle})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0">
                  <Link
                    href={listingUrl}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant={item.isClosed ? "outline" : "shimmer"}
                      size="sm"
                      className="text-xs"
                    >
                      {getListingActionLabel(Boolean(item.isClosed), isTr)}
                    </Button>
                  </Link>

                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      // Single item unsave
                      try {
                        await fetch("/api/listings/saved/bulk", {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ listingIds: [item.listingId] }),
                        });
                        setItems((prev) => prev.filter((i) => i.listingId !== item.listingId));
                        setSelectedIds((prev) => {
                          const n = new Set(prev);
                          n.delete(item.listingId);
                          return n;
                        });
                        window.dispatchEvent(
                          new CustomEvent("operis:badge-update", {
                            detail: { key: "savedListings", delta: -1 },
                          })
                        );
                      } catch {
                        // ignore
                      }
                    }}
                    title={isTr ? "Kaydedilenlerden Çıkar" : "Remove Bookmark"}
                    className="p-2 rounded-xl text-[var(--color-text-tertiary)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Bulk Deletion */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  {isTr ? "Toplu Kaldırma Onayı" : "Confirm Bulk Removal"}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                  {isTr
                    ? `Seçilen ${selectedIds.size} adet ilanı kaydedilenler listenizden kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.`
                    : `Are you sure you want to remove ${selectedIds.size} saved job(s)? This action cannot be undone.`}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessing}
                onClick={() => setIsBulkModalOpen(false)}
              >
                {isTr ? "Vazgeç" : "Cancel"}
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={isProcessing}
                onClick={handleConfirmBulkUnsave}
              >
                {getBulkRemoveButtonLabel(isProcessing, isTr)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
