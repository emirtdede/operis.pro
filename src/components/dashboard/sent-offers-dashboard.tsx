"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { AlertTriangle, X, History, Search, CheckSquare, Undo2, ArrowRightLeft, ListFilter, ChevronDown, ArrowUpDown, Send, Compass } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { EmptyState } from "../ui/empty-state";
import { SubmitOfferModal, type SubmitOfferModalProps } from "../offers/submit-offer-modal";
import { OfferRevisionsModal } from "../offers/offer-revisions-modal";
import { NegotiationTimelineModal } from "../offers/negotiation-timeline";
import { SquadProposalBadge } from "../offers/squad/squad-proposal-badge";
import { getLocalizedListingPath, getLocalizedWorkspacePath } from "@/src/lib/i18n/routes";
import { filterAndSortByRelevance, computeRangeSelection } from "@/src/lib/search/token-matcher";

export interface SentOfferItem {
  id: string;
  listingId: string;
  listingSlug: string;
  listingTitle: string;
  status: string;
  message: string;
  budgetCurrency: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  estimatedDurationValue: number | null;
  estimatedDurationUnit: string | null;
  isCountered?: boolean;
  counterRound?: number;
  currentTurnUserId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  engagementId?: string | null;
  isSquadOffer?: boolean | null;
  squadTitle?: string | null;
  squadMembers?: Array<{
    id?: string;
    displayName: string;
    roleTitle: string;
    revenueSharePercentage: number;
    scopeSummary?: string | null;
    isLead?: boolean;
    handleOrEmail?: string | null;
  }>;
}

export interface SentOffersDashboardProps {
  initialOffers: SentOfferItem[];
  locale: string;
}

const FILTER_LABELS: Record<string, { tr: string; en: string }> = {
  all: { tr: "Tümü", en: "All" },
  pending: { tr: "Beklemede", en: "Pending" },
  accepted: { tr: "Kabul Edilen", en: "Accepted" },
  rejected: { tr: "Reddedilen", en: "Rejected" },
  cancelled: { tr: "İptal Edilen", en: "Cancelled" },
  withdrawn: { tr: "Geri Çekilen", en: "Withdrawn" },
};

function getFilterLabel(filterKey: string, isTr: boolean): string {
  const item = FILTER_LABELS[filterKey];
  if (!item) return filterKey;
  return isTr ? item.tr : item.en;
}

function getErrorMessage(err: unknown, defaultMessage: string): string {
  if (err instanceof Error) return err.message;
  return defaultMessage;
}

function getEmptyStateTitle(hasSearchQuery: boolean, isTr: boolean): string {
  if (hasSearchQuery) {
    return isTr ? "Aramanıza uygun teklif bulunamadı" : "No proposals match your search";
  }
  return isTr ? "Teklif bulunamadı" : "No proposals found";
}

function getEmptyStateDescription(hasSearchQuery: boolean, isTr: boolean): string {
  if (hasSearchQuery) {
    return isTr
      ? "Farklı bir arama terimi deneyebilir veya filtreyi 'Tümü' olarak değiştirebilirsiniz."
      : "Try searching with different terms or changing your status filter.";
  }
  return isTr
    ? "Henüz bir ilana teklif vermediniz veya bu filtrede teklif bulunmuyor."
    : "You have not submitted proposals or none match this filter.";
}

function getNegotiationButtonLabel(isCountered: boolean, counterRound: number | undefined, isTr: boolean): string {
  if (isCountered) {
    const round = counterRound || 1;
    return isTr ? `Pazarlık (${round}. Tur)` : `Negotiation (R${round})`;
  }
  return isTr ? "Pazarlık" : "Negotiate";
}

function getWithdrawButtonLabel(isWithdrawing: boolean, isTr: boolean): string {
  if (isWithdrawing) return isTr ? "Geri Çekiliyor..." : "Withdrawing...";
  return isTr ? "Evet, Geri Çek" : "Yes, Withdraw";
}

function getBulkWithdrawButtonLabel(isWithdrawing: boolean, isTr: boolean): string {
  if (isWithdrawing) return isTr ? "Geri Çekiliyor..." : "Withdrawing...";
  return isTr ? "Evet, Hepsini Geri Çek" : "Yes, Withdraw All";
}

export type SentOfferSortOption = "newest" | "budget_desc" | "budget_asc" | "title_asc";

export function SentOffersDashboard({ initialOffers, locale }: SentOffersDashboardProps) {
  const isTr = locale === "tr";
  const [offers, setOffers] = useState<SentOfferItem[]>(initialOffers);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SentOfferSortOption>("newest");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [withdrawingOffer, setWithdrawingOffer] = useState<SentOfferItem | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [selectedOfferForRevisions, setSelectedOfferForRevisions] = useState<string | null>(null);
  const [selectedOfferForNegotiation, setSelectedOfferForNegotiation] = useState<string | null>(null);
  const [editingOffer, setEditingOffer] = useState<SentOfferItem | null>(null);

  // Bulk withdraw state
  const [selectedOfferIds, setSelectedOfferIds] = useState<Set<string>>(new Set());
  const [lastSelectedOfferId, setLastSelectedOfferId] = useState<string | null>(null);
  const [isBulkWithdrawModalOpen, setIsBulkWithdrawModalOpen] = useState(false);
  const [isBulkWithdrawing, setIsBulkWithdrawing] = useState(false);
  const [bulkWithdrawError, setBulkWithdrawError] = useState<string | null>(null);

  const selectAllRef = useRef<HTMLInputElement | null>(null);

  // Close modal on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (withdrawingOffer) {
          setWithdrawingOffer(null);
          setWithdrawError(null);
        }
        if (isBulkWithdrawModalOpen) {
          setIsBulkWithdrawModalOpen(false);
          setBulkWithdrawError(null);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [withdrawingOffer, isBulkWithdrawModalOpen]);

  const filterCounts = useMemo(() => {
    return {
      all: offers.length,
      pending: offers.filter((o) => o.status.toLowerCase() === "pending").length,
      accepted: offers.filter((o) => o.status.toLowerCase() === "accepted").length,
      rejected: offers.filter((o) => o.status.toLowerCase().startsWith("rejected")).length,
      cancelled: offers.filter(
        (o) =>
          o.status === "CANCELLED_ENGAGEMENT" ||
          o.status === "CANCELLED" ||
          o.status === "EXPIRED_LISTING" ||
          o.status === "EXPIRED_LISTING_INACTIVE" ||
          o.status === "VOID_MODERATION"
      ).length,
      withdrawn: offers.filter((o) => o.status.toLowerCase() === "withdrawn").length,
    };
  }, [offers]);

  // 1. Status Filter
  const statusFiltered = useMemo(() => {
    return offers.filter((o) => {
      if (filter === "all") return true;
      if (filter === "cancelled") {
        return (
          o.status === "CANCELLED_ENGAGEMENT" ||
          o.status === "CANCELLED" ||
          o.status === "EXPIRED_LISTING" ||
          o.status === "EXPIRED_LISTING_INACTIVE" ||
          o.status === "VOID_MODERATION"
        );
      }
      if (filter === "rejected") {
        return o.status.toLowerCase().startsWith("rejected");
      }
      return o.status.toLowerCase() === filter.toLowerCase();
    });
  }, [offers, filter]);

  // 2. Search Filter with Turkish token weighting & Multi-criteria Sort
  const displayedOffers = useMemo(() => {
    let list: SentOfferItem[];
    if (!searchQuery.trim()) {
      list = [...statusFiltered];
    } else {
      list = filterAndSortByRelevance(statusFiltered, searchQuery, (offer) => [
        { text: offer.listingTitle, weight: 10 },
        { text: offer.message, weight: 5 },
        { text: offer.status, weight: 2 },
      ]);
    }

    const sorted = [...list];
    switch (sortBy) {
      case "budget_desc":
        return sorted.sort((a, b) => {
          const maxA = Number(a.budgetMax || a.budgetMin || 0);
          const maxB = Number(b.budgetMax || b.budgetMin || 0);
          return maxB - maxA;
        });
      case "budget_asc":
        return sorted.sort((a, b) => {
          const minA = Number(a.budgetMin || a.budgetMax || 0);
          const minB = Number(b.budgetMin || b.budgetMax || 0);
          return minA - minB;
        });
      case "title_asc":
        return sorted.sort((a, b) =>
          a.listingTitle.localeCompare(b.listingTitle, isTr ? "tr-TR" : "en-US")
        );
      case "newest":
      default:
        if (searchQuery.trim()) return list;
        return sorted.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }, [statusFiltered, searchQuery, sortBy, isTr]);

  // Only PENDING offers can be selected for bulk withdraw
  const selectableOffers = useMemo(() => {
    return displayedOffers.filter((o) => o.status === "PENDING");
  }, [displayedOffers]);

  // Tri-state checkbox handling
  const selectedPendingCount = useMemo(() => {
    let count = 0;
    for (const o of selectableOffers) {
      if (selectedOfferIds.has(o.id)) count++;
    }
    return count;
  }, [selectableOffers, selectedOfferIds]);

  const isAllPendingSelected =
    selectableOffers.length > 0 && selectedPendingCount === selectableOffers.length;
  const isPartiallyPendingSelected =
    selectedPendingCount > 0 && selectedPendingCount < selectableOffers.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isPartiallyPendingSelected;
    }
  }, [isPartiallyPendingSelected]);

  const handleToggleSelectAll = () => {
    if (isAllPendingSelected) {
      const next = new Set(selectedOfferIds);
      for (const o of selectableOffers) {
        next.delete(o.id);
      }
      setSelectedOfferIds(next);
      setLastSelectedOfferId(null);
    } else {
      const next = new Set(selectedOfferIds);
      for (const o of selectableOffers) {
        next.add(o.id);
      }
      setSelectedOfferIds(next);
    }
  };

  const handleOfferSelect = (offerId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (e.shiftKey && lastSelectedOfferId) {
      const itemsForSelection = selectableOffers.map((o) => ({ id: o.id }));
      const next = computeRangeSelection(
        itemsForSelection,
        lastSelectedOfferId,
        offerId,
        selectedOfferIds
      );
      setSelectedOfferIds(next);
      setLastSelectedOfferId(offerId);
    } else {
      const next = new Set(selectedOfferIds);
      if (next.has(offerId)) {
        next.delete(offerId);
      } else {
        next.add(offerId);
      }
      setSelectedOfferIds(next);
      setLastSelectedOfferId(offerId);
    }
  };

  const confirmWithdraw = async () => {
    if (!withdrawingOffer) return;

    setLoadingId(withdrawingOffer.id);
    setWithdrawError(null);

    try {
      const res = await fetch(`/api/offers/${withdrawingOffer.id}/withdraw`, {
        method: "POST",
        headers: {
          "x-locale": locale,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error || (isTr ? "Teklif geri çekilemedi." : "Could not withdraw offer.")
        );
      }

      setOffers((prev) =>
        prev.map((o) => (o.id === withdrawingOffer.id ? { ...o, status: "WITHDRAWN" } : o))
      );
      setWithdrawingOffer(null);
      setSelectedOfferIds((prev) => {
        const next = new Set(prev);
        next.delete(withdrawingOffer.id);
        return next;
      });
    } catch (err: unknown) {
      setWithdrawError(
        getErrorMessage(err, isTr ? "İşlem başarısız oldu." : "Operation failed.")
      );
    } finally {
      setLoadingId(null);
    }
  };

  // Bulk withdraw execution
  const confirmBulkWithdraw = async () => {
    if (selectedOfferIds.size === 0) return;

    setIsBulkWithdrawing(true);
    setBulkWithdrawError(null);

    const idsToWithdraw = Array.from(selectedOfferIds);

    try {
      const res = await fetch("/api/offers/sent/bulk-withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerIds: idsToWithdraw }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error || (isTr ? "Toplu geri çekme başarısız oldu." : "Bulk withdraw failed.")
        );
      }

      const withdrawnSet = new Set(data.offerIds || idsToWithdraw);
      setOffers((prev) =>
        prev.map((o) => (withdrawnSet.has(o.id) ? { ...o, status: "WITHDRAWN" } : o))
      );
      setSelectedOfferIds(new Set());
      setLastSelectedOfferId(null);
      setIsBulkWithdrawModalOpen(false);
    } catch (err: unknown) {
      setBulkWithdrawError(
        getErrorMessage(err, isTr ? "Bir hata oluştu." : "An unexpected error occurred.")
      );
    } finally {
      setIsBulkWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Status Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isTr ? "Tekliflerde ara..." : "Search offers..."}
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

        {/* Controls: Single Status Filter Button + Single Sort Button */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Single Status Filter Dropdown Button */}
          <div className="relative inline-flex items-center">
            <ListFilter className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" aria-hidden="true" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label={isTr ? "Durum Filtresi" : "Status Filter"}
              className="appearance-none h-9 py-1.5 pl-8 pr-8 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all shadow-xs"
            >
              {(["all", "pending", "accepted", "rejected", "cancelled", "withdrawn"] as const).map((f) => (
                <option key={f} value={f} className="bg-[#141517] text-[var(--color-text-primary)]">
                  {getFilterLabel(f, isTr)} ({filterCounts[f]})
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
              onChange={(e) => setSortBy(e.target.value as SentOfferSortOption)}
              aria-label={isTr ? "Sıralama ölçütü" : "Sort by"}
              className="appearance-none h-9 py-1.5 pl-8 pr-8 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all shadow-xs"
            >
              <option value="newest" className="bg-[#141517] text-[var(--color-text-primary)]">{isTr ? "En Yeni" : "Newest"}</option>
              <option value="budget_desc" className="bg-[#141517] text-[var(--color-text-primary)]">{isTr ? "En Yüksek Bütçe" : "Highest Budget"}</option>
              <option value="budget_asc" className="bg-[#141517] text-[var(--color-text-primary)]">{isTr ? "En Düşük Bütçe" : "Lowest Budget"}</option>
              <option value="title_asc" className="bg-[#141517] text-[var(--color-text-primary)]">{isTr ? "Başlık (A-Z)" : "Title (A-Z)"}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Result Count and Active Filter Indicator */}
      {(searchQuery.trim() || filter !== "all") && (
        <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] px-1">
          <span>
            {isTr
              ? `${displayedOffers.length} teklif listeleniyor`
              : `Showing ${displayedOffers.length} proposals`}
            {searchQuery.trim() && ` ("${searchQuery.trim()}")`}
          </span>
          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
            >
              {isTr ? "Aramayı Temizle" : "Clear Search"}
            </button>
          )}
        </div>
      )}

      {/* Bulk Action Sticky Bar */}
      {selectedOfferIds.size > 0 && (
        <div className="sticky top-4 z-20 flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 border border-indigo-400/30 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <CheckSquare className="h-4 w-4" />
            <span>
              {isTr
                ? `${selectedOfferIds.size} teklif seçildi (Aralık seçimi için Shift tuşuna basabilirsiniz)`
                : `${selectedOfferIds.size} proposal(s) selected (Hold Shift to select range)`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedOfferIds(new Set())}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 transition-colors"
            >
              {isTr ? "Seçimi Temizle" : "Clear Selection"}
            </button>
            <button
              type="button"
              onClick={() => setIsBulkWithdrawModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow transition-all"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>{isTr ? "Seçilenleri Geri Çek" : "Withdraw Selected"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Select All Row for Pending Offers */}
      {selectableOffers.length > 0 && (
        <div className="flex items-center justify-between px-2 py-1 text-xs text-[var(--color-text-secondary)]">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={isAllPendingSelected}
              onChange={handleToggleSelectAll}
              className="h-4 w-4 rounded border-[var(--color-border-subtle)] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="font-medium">
              {isTr
                ? `Beklemedeki Tümünü Seç (${selectableOffers.length})`
                : `Select All Pending (${selectableOffers.length})`}
            </span>
          </label>

          <span className="text-[11px] text-[var(--color-text-tertiary)] hidden sm:inline">
            {isTr
              ? "Sadece henüz yanıtlanmamış (beklemedeki) teklifler geri çekilebilir."
              : "Only proposals currently pending review can be withdrawn."}
          </span>
        </div>
      )}

      {/* Offers List */}
      {displayedOffers.length === 0 ? (
        <EmptyState
          variant="card"
          icon={<Send className="h-7 w-7 text-blue-400" />}
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
                  <Compass className="h-4 w-4" />
                  <span>{isTr ? "İlanları Keşfet" : "Explore Listings"}</span>
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {displayedOffers.map((offer) => {
            const dateStr = new Date(offer.createdAt).toLocaleDateString(isTr ? "tr-TR" : "en-US");
            const isPending = offer.status === "PENDING";
            const isSelected = selectedOfferIds.has(offer.id);

            return (
              <div
                key={offer.id}
                className={`rounded-2xl border transition-all duration-200 p-5 sm:p-6 space-y-3 shadow-sm ${
                  isSelected
                    ? "border-indigo-500/50 bg-indigo-500/5 shadow-md shadow-indigo-500/10"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl hover:border-indigo-500/30 hover:shadow-md"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {/* Checkbox for pending offers */}
                    {isPending && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleOfferSelect(offer.id, e as unknown as React.MouseEvent)}
                        onClick={(e) => handleOfferSelect(offer.id, e)}
                        className="h-4 w-4 rounded border-[var(--color-border-subtle)] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        aria-label={isTr ? "Teklifi seç" : "Select offer"}
                      />
                    )}

                    {(() => {
                      let badgeVariant: "success" | "secondary" | "danger" | "neutral" | "outline" =
                        "outline";
                      let badgeLabel = offer.status;

                      if (offer.status === "ACCEPTED") {
                        badgeVariant = "success";
                        badgeLabel = isTr ? "Kabul Edildi" : "Accepted";
                      } else if (offer.status === "PENDING") {
                        if (offer.isCountered) {
                          badgeVariant = "outline";
                          badgeLabel = isTr
                            ? `Pazarlıkta (${offer.counterRound || 1}. Tur)`
                            : `Negotiating (R${offer.counterRound || 1})`;
                        } else {
                          badgeVariant = "secondary";
                          badgeLabel = isTr ? "Beklemede" : "Pending";
                        }
                      } else if (
                        offer.status === "CANCELLED_ENGAGEMENT" ||
                        offer.status === "CANCELLED"
                      ) {
                        badgeVariant = "danger";
                        badgeLabel = isTr ? "İş İptal Edildi" : "Cancelled";
                      } else if (
                        offer.status === "EXPIRED_LISTING" ||
                        offer.status === "EXPIRED_LISTING_INACTIVE"
                      ) {
                        badgeVariant = "neutral";
                        badgeLabel = isTr ? "İlan Süresi Doldu" : "Listing Expired";
                      } else if (offer.status === "VOID_MODERATION") {
                        badgeVariant = "danger";
                        badgeLabel = isTr ? "Yönetimce İptal" : "Voided by Admin";
                      } else if (offer.status === "REJECTED_OTHER_SELECTED") {
                        badgeVariant = "neutral";
                        badgeLabel = isTr ? "Başka Teklif Seçildi" : "Other Selected";
                      } else if (offer.status.startsWith("REJECTED")) {
                        badgeVariant = "danger";
                        badgeLabel = isTr ? "Reddedildi" : "Rejected";
                      } else if (offer.status === "WITHDRAWN") {
                        badgeVariant = "outline";
                        badgeLabel = isTr ? "Geri Çekildi" : "Withdrawn";
                      }

                      return (
                        <Badge variant={badgeVariant} size="sm">
                          {badgeLabel}
                        </Badge>
                      );
                    })()}
                    {offer.isSquadOffer && (
                      <SquadProposalBadge
                        memberCount={offer.squadMembers?.length}
                        squadTitle={offer.squadTitle}
                        locale={locale}
                        size="sm"
                      />
                    )}
                    <span className="text-xs text-[var(--color-text-tertiary)]">{dateStr}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOfferForNegotiation(offer.id)}
                      title={isTr ? "Karşı Teklif & Pazarlık" : "Counter-Offer & Negotiation"}
                      className={`cursor-pointer text-xs ${
                        offer.isCountered ? "text-blue-400 font-semibold bg-blue-500/10" : ""
                      }`}
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                      {getNegotiationButtonLabel(Boolean(offer.isCountered), offer.counterRound, isTr)}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOfferForRevisions(offer.id)}
                      title={isTr ? "Revizyon Geçmişi" : "Revision History"}
                      className="cursor-pointer text-xs"
                    >
                      <History className="h-3.5 w-3.5 mr-1" />
                      {isTr ? "Geçmiş" : "History"}
                    </Button>

                    {offer.status === "PENDING" && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingOffer(offer)}
                          disabled={loadingId === offer.id}
                          className="cursor-pointer text-xs"
                        >
                          {isTr ? "Düzenle" : "Edit"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setWithdrawingOffer(offer)}
                          disabled={loadingId === offer.id}
                          className="text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 cursor-pointer text-xs"
                        >
                          {isTr ? "Geri Çek" : "Withdraw"}
                        </Button>
                      </div>
                    )}

                    {offer.status === "ACCEPTED" && offer.engagementId && (
                      <Link href={getLocalizedWorkspacePath(offer.engagementId, locale)}>
                        <Button variant="primary" size="sm" className="text-xs">
                          {isTr ? "Çalışma Alanı & İletişim →" : "Workspace & Contact →"}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-base text-[var(--color-text-primary)]">
                  <Link
                    href={getLocalizedListingPath(offer.listingSlug, locale)}
                    className="hover:underline"
                  >
                    {offer.listingTitle}
                  </Link>
                </h3>

                <p className="line-clamp-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {offer.message}
                </p>

                {(offer.budgetMin || offer.estimatedDurationValue) && (
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--color-text-tertiary)] pt-1 border-t border-[var(--color-border-subtle)]">
                    {offer.budgetMin && (
                      <span>
                        <strong>{isTr ? "Bütçe:" : "Budget:"}</strong> {offer.budgetMin}{" "}
                        {offer.budgetMax ? `– ${offer.budgetMax}` : ""} {offer.budgetCurrency}
                      </span>
                    )}
                    {offer.estimatedDurationValue && (
                      <span>
                        <strong>{isTr ? "Süre:" : "Timeline:"}</strong> ~
                        {offer.estimatedDurationValue} {offer.estimatedDurationUnit}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Single Withdraw Modal */}
      {withdrawingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-[var(--color-danger)]">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-semibold text-base text-[var(--color-text-primary)]">
                  {isTr ? "Teklifi Geri Çek" : "Withdraw Proposal"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWithdrawingOffer(null);
                  setWithdrawError(null);
                }}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-[var(--color-text-secondary)]">
              {isTr
                ? `"${withdrawingOffer.listingTitle}" ilanına verdiğiniz teklifi geri çekmek istediğinizden emin misiniz?`
                : `Are you sure you want to withdraw your proposal for "${withdrawingOffer.listingTitle}"?`}
            </p>

            {withdrawError && (
              <p className="text-xs text-[var(--color-danger)] bg-[var(--color-danger)]/10 p-2 rounded">
                {withdrawError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWithdrawingOffer(null);
                  setWithdrawError(null);
                }}
                disabled={loadingId === withdrawingOffer.id}
                className="cursor-pointer"
              >
                {isTr ? "Vazgeç" : "Cancel"}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmWithdraw}
                disabled={loadingId === withdrawingOffer.id}
                className="cursor-pointer"
              >
                {getWithdrawButtonLabel(loadingId === withdrawingOffer.id, isTr)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Withdraw Modal */}
      {isBulkWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                <Undo2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  {isTr ? "Toplu Teklif Geri Çekme" : "Bulk Withdraw Proposals"}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                  {isTr
                    ? `Seçilen ${selectedOfferIds.size} adet beklemedeki teklifi geri çekmek istediğinize emin misiniz? İlan sahipleri tekliflerinizi artık değerlendiremeyecektir.`
                    : `Are you sure you want to withdraw ${selectedOfferIds.size} pending proposals? Listing owners will no longer be able to accept them.`}
                </p>
              </div>
            </div>

            {bulkWithdrawError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                {bulkWithdrawError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isBulkWithdrawing}
                onClick={() => setIsBulkWithdrawModalOpen(false)}
              >
                {isTr ? "Vazgeç" : "Cancel"}
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={isBulkWithdrawing}
                onClick={confirmBulkWithdraw}
              >
                {getBulkWithdrawButtonLabel(isBulkWithdrawing, isTr)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Revision History Modal */}
      {selectedOfferForRevisions && (
        <OfferRevisionsModal
          offerId={selectedOfferForRevisions}
          locale={locale}
          isOpen={true}
          onClose={() => setSelectedOfferForRevisions(null)}
        />
      )}

      {/* Edit Offer Modal */}
      {editingOffer && (
        <SubmitOfferModal
          isOpen={true}
          onClose={() => setEditingOffer(null)}
          listingId={editingOffer.listingId}
          listingTitle={editingOffer.listingTitle}
          locale={locale}
          offerId={editingOffer.id}
          initialData={{
            message: editingOffer.message,
            budgetCurrency: editingOffer.budgetCurrency || "TRY",
            budgetMin: editingOffer.budgetMin || undefined,
            budgetMax: editingOffer.budgetMax || undefined,
            timelineValue: editingOffer.estimatedDurationValue?.toString(),
            timelineUnit: (editingOffer.estimatedDurationUnit as "DAYS" | "WEEKS" | "MONTHS") || undefined,
            isSquadOffer: editingOffer.isSquadOffer ?? undefined,
            squadTitle: editingOffer.squadTitle ?? undefined,
            squadMembers: (editingOffer.squadMembers as NonNullable<SubmitOfferModalProps["initialData"]>["squadMembers"]) || undefined,
          }}
          onSuccess={(updated) => {
            if (updated) {
              setOffers((prev) =>
                prev.map((o) =>
                  o.id === editingOffer.id
                    ? {
                        ...o,
                        message: updated.message,
                        budgetCurrency: updated.budgetCurrency ?? o.budgetCurrency,
                        budgetMin: updated.budgetMin ?? o.budgetMin,
                        budgetMax: updated.budgetMax ?? o.budgetMax,
                        estimatedDurationValue: updated.estimatedDurationValue ?? o.estimatedDurationValue,
                        estimatedDurationUnit: updated.estimatedDurationUnit ?? o.estimatedDurationUnit,
                        updatedAt: new Date(),
                      }
                    : o
                )
              );
            }
            setEditingOffer(null);
          }}
        />
      )}
      {/* Negotiation Timeline Modal */}
      {selectedOfferForNegotiation && (
        <NegotiationTimelineModal
          offerId={selectedOfferForNegotiation}
          isOpen={Boolean(selectedOfferForNegotiation)}
          onClose={() => setSelectedOfferForNegotiation(null)}
          locale={locale}
          onOfferUpdated={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
