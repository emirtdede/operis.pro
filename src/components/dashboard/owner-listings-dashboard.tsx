"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Eye, MousePointerClick, History, Copy, Rocket, PlusCircle, Search, X, ListFilter, ChevronDown, ArrowUpDown, Clock, Briefcase } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { EmptyState } from "../ui/empty-state";
import { ListingRevisionsModal } from "../listings/listing-revisions-modal";
import { getLocalizedWorkspacePath, getLocalizedListingPath } from "@/src/lib/i18n/routes";
import { Locale } from "@/src/lib/i18n/config";

export interface OwnerListingItem {
  id: string;
  slug: string;
  title: string;
  status: string;
  budgetMode: string;
  budgetCurrency: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  firstPublishedAt: string | Date | null;
  lastActivatedAt: string | Date | null;
  activeUntil: string | Date | null;
  activationSeq: number;
  viewCount?: number;
  clickCount?: number;
  engagementId?: string | null;
}

export interface OwnerListingsDashboardProps {
  initialListings: OwnerListingItem[];
  locale: string;
  hasLoadError?: boolean;
}

const LISTING_STATUS_BADGE_VARIANTS: Record<string, "primary" | "secondary" | "outline"> = {
  ACTIVE: "primary",
  MATCHED: "secondary",
};

export type OwnerSortOption =
  | "newest"
  | "expiring_soon"
  | "most_viewed"
  | "budget_desc"
  | "budget_asc";

function getOwnerTabLabel(
  tabKey: "all" | "active" | "inactive" | "matched",
  isTr: boolean
): string {
  const LABELS: Record<"all" | "active" | "inactive" | "matched", { tr: string; en: string }> = {
    all: { tr: "Tümü", en: "All" },
    active: { tr: "Aktif", en: "Active" },
    inactive: { tr: "Pasif", en: "Inactive" },
    matched: { tr: "Eşleşen", en: "Matched" },
  };
  const item = LABELS[tabKey];
  return isTr ? item.tr : item.en;
}

export function OwnerListingsDashboard({
  initialListings,
  locale,
  hasLoadError,
}: OwnerListingsDashboardProps) {
  const isTr = locale === "tr";
  const [listings, setListings] = useState<OwnerListingItem[]>(initialListings);
  const [tab, setTab] = useState<"all" | "active" | "inactive" | "matched">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<OwnerSortOption>("newest");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedListingForRevisions, setSelectedListingForRevisions] = useState<string | null>(
    null
  );

  const filteredAndSortedListings = useMemo(() => {
    let list = listings.filter((l) => {
      if (tab === "all") return true;
      if (tab === "active") return l.status === "ACTIVE";
      if (tab === "inactive") return l.status === "INACTIVE_EXPIRED" || l.status === "INACTIVE_OWNER";
      if (tab === "matched") return l.status === "MATCHED" || l.status === "COMPLETED";
      return true;
    });

    const q = searchQuery.trim().toLocaleLowerCase("tr-TR");
    if (q) {
      list = list.filter((l) => {
        const titleMatch = l.title.toLocaleLowerCase("tr-TR").includes(q);
        const slugMatch = l.slug.toLocaleLowerCase("tr-TR").includes(q);
        return titleMatch || slugMatch;
      });
    }

    const sorted = [...list];
    switch (sortBy) {
      case "expiring_soon":
        return sorted.sort((a, b) => {
          const timeA = a.activeUntil ? new Date(a.activeUntil).getTime() : Infinity;
          const timeB = b.activeUntil ? new Date(b.activeUntil).getTime() : Infinity;
          return timeA - timeB;
        });
      case "most_viewed":
        return sorted.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
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
      case "newest":
      default:
        return sorted.sort((a, b) => {
          const dateA = new Date(a.firstPublishedAt || a.lastActivatedAt || 0).getTime();
          const dateB = new Date(b.firstPublishedAt || b.lastActivatedAt || 0).getTime();
          return dateB - dateA;
        });
    }
  }, [listings, tab, searchQuery, sortBy]);

  const handleReactivate = async (id: string) => {
    setLoadingId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/listings/${id}/reactivate`, {
        method: "POST",
        headers: { "x-locale": locale },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reactivation failed");

      setListings((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                ...(data.listing || {}),
                status: "ACTIVE",
                activationSeq: data.listing?.activationSeq ?? l.activationSeq + 1,
                activeUntil:
                  data.listing?.activeUntil ??
                  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              }
            : l
        )
      );
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Error reactivating listing");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeactivate = async (id: string) => {
    setLoadingId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/listings/${id}/deactivate`, {
        method: "POST",
        headers: { "x-locale": locale },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deactivation failed");

      setListings((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                ...(data.listing || {}),
                status: "INACTIVE_OWNER",
              }
            : l
        )
      );
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Error deactivating listing");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        isTr
          ? "Bu ilanı silmek istediğinize emin misiniz?"
          : "Are you sure you want to delete this listing?"
      )
    ) {
      return;
    }

    setLoadingId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/listings/${id}/delete`, {
        method: "POST",
        headers: { "x-locale": locale },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deletion failed");

      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Error deleting listing");
    } finally {
      setLoadingId(null);
    }
  };

  const renderEmptyState = () => {
    if (searchQuery.trim()) {
      return (
        <EmptyState
          variant="card"
          icon={<Search className="h-7 w-7 text-blue-400" />}
          title={isTr ? "Aramanıza uygun ilan bulunamadı" : "No listings match your search"}
          description={
            isTr
              ? `"${searchQuery.trim()}" aramasıyla eşleşen bir ilanınız bulunmuyor. Farklı anahtar kelimeler deneyebilir veya filtreyi temizleyebilirsiniz.`
              : `No listings match "${searchQuery.trim()}". Try searching with different keywords or reset your filters.`
          }
          action={
            <Button variant="secondary" size="sm" onClick={() => setSearchQuery("")} className="cursor-pointer">
              {isTr ? "Aramayı Temizle" : "Clear Search"}
            </Button>
          }
        />
      );
    }
    if (tab === "inactive") {
      return (
        <EmptyState
          variant="card"
          icon={<Clock className="h-7 w-7 text-blue-400" />}
          title={isTr ? "Süresi Dolan veya Pasif İlan Yok" : "No Inactive or Expired Listings"}
          description={
            isTr
              ? "Süresi dolmuş veya durdurulmuş bir ilanınız bulunmuyor. Aktif ilanlarınızı 'Aktif' sekmesinden inceleyebilirsiniz."
              : "You have no expired or paused listings. Check active listings to see your live projects."
          }
          action={
            <Button variant="secondary" size="sm" onClick={() => setTab("active")} className="cursor-pointer">
              {isTr ? "Aktif İlanları Gör" : "View Active Listings"}
            </Button>
          }
        />
      );
    }
    if (tab === "matched") {
      return (
        <EmptyState
          variant="card"
          icon={<Briefcase className="h-7 w-7 text-blue-400" />}
          title={isTr ? "Eşleşen İlan Bulunmuyor" : "No Matched Listings"}
          description={
            isTr
              ? "Henüz bir bağımsız profesyonelle eşleşen projeniz yok. İlanlarınıza gelen teklifleri 'Gelen Teklifler' alanından değerlendirebilirsiniz."
              : "No listings have matched with a professional yet. Review proposals in incoming offers."
          }
          action={
            <Link href={isTr ? "/tr/panel/teklifler/gelen" : "/en/dashboard/offers/received"}>
              <Button variant="shimmer" size="md" className="gap-2 shadow-lg shadow-blue-500/15">
                {isTr ? "Gelen Teklifleri İncele" : "Review Incoming Offers"}
              </Button>
            </Link>
          }
        />
      );
    }
    if (tab === "active") {
      return (
        <EmptyState
          variant="card"
          icon={<Rocket className="h-7 w-7 text-blue-400" />}
          title={isTr ? "Aktif İlan Bulunmuyor" : "No Active Listings"}
          description={
            isTr
              ? "Şu anda radarımızda canlı olan bir ilanınız yok. Yeni bir ilan yayınlayarak bağımsız mühendislerden doğrudan teklif alabilirsiniz."
              : "You currently have no active listings on our radar. Post a listing to get direct proposals."
          }
          action={
            <Link href={isTr ? "/tr/ilanlar/yeni" : "/en/listings/new"}>
              <Button variant="shimmer" size="md" className="gap-2 shadow-lg shadow-blue-500/15">
                <PlusCircle className="h-4 w-4" />
                <span>{isTr ? "Yeni İlan Yayınla" : "Publish Listing"}</span>
              </Button>
            </Link>
          }
        />
      );
    }
    return (
      <EmptyState
        variant="card"
        icon={<Briefcase className="h-7 w-7 text-blue-400" />}
        title={isTr ? "Henüz Bir İlan Yayınlamadınız" : "You Haven't Published Any Listings Yet"}
        description={
          isTr
            ? "Operis'te %100 komisyonsuz ve doğrudan iletişimle bağımsız uzman arayışınızı hemen başlatın."
            : "Start finding verified independent specialists directly with 0% commission on Operis."
        }
        action={
          <Link href={isTr ? "/tr/ilanlar/yeni" : "/en/listings/new"}>
            <Button variant="shimmer" size="md" className="gap-2 shadow-lg shadow-blue-500/15">
              <PlusCircle className="h-4 w-4" />
              <span>{isTr ? "Yeni İlan Yayınla" : "Publish Listing"}</span>
            </Button>
          </Link>
        }
      />
    );
  };

  const tabCounts = {
    all: listings.length,
    active: listings.filter((l) => l.status === "ACTIVE").length,
    inactive: listings.filter(
      (l) => l.status === "INACTIVE_EXPIRED" || l.status === "INACTIVE_OWNER"
    ).length,
    matched: listings.filter(
      (l) => l.status === "MATCHED" || l.status === "COMPLETED"
    ).length,
  };

  return (
    <div className="space-y-6">
      {hasLoadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 flex items-center justify-between">
          <span>
            {isTr
              ? "İlanlarınız yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyiniz."
              : "An error occurred while loading your listings. Please refresh the page."}
          </span>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            {isTr ? "Yeniden Dene" : "Retry"}
          </Button>
        </div>
      )}

      {/* Unified Toolbar: Search Input + Status Filters + Sort Dropdown */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer"
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
              value={tab}
              onChange={(e) => setTab(e.target.value as "all" | "active" | "inactive" | "matched")}
              aria-label={isTr ? "Durum Filtresi" : "Status Filter"}
              className="appearance-none h-9 py-1.5 pl-8 pr-8 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all shadow-xs"
            >
              {(["all", "active", "inactive", "matched"] as const).map((t) => (
                <option key={t} value={t} className="bg-[#141517] text-[var(--color-text-primary)]">
                  {getOwnerTabLabel(t, isTr)} ({tabCounts[t]})
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
              onChange={(e) => setSortBy(e.target.value as OwnerSortOption)}
              aria-label={isTr ? "Sıralama ölçütü" : "Sort by"}
              className="appearance-none h-9 py-1.5 pl-8 pr-8 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all shadow-xs"
            >
              <option value="newest" className="bg-[#141517] text-[var(--color-text-primary)]">{isTr ? "En Yeni" : "Newest"}</option>
              <option value="expiring_soon" className="bg-[#141517] text-[var(--color-text-primary)]">{isTr ? "Süresi Biten" : "Expiring Soon"}</option>
              <option value="most_viewed" className="bg-[#141517] text-[var(--color-text-primary)]">{isTr ? "En Çok Görüntülenen" : "Most Viewed"}</option>
              <option value="budget_desc" className="bg-[#141517] text-[var(--color-text-primary)]">{isTr ? "En Yüksek Bütçe" : "Highest Budget"}</option>
              <option value="budget_asc" className="bg-[#141517] text-[var(--color-text-primary)]">{isTr ? "En Düşük Bütçe" : "Lowest Budget"}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Result Count and Active Filter Indicator */}
      {(searchQuery.trim() || tab !== "all") && (
        <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] px-1">
          <span>
            {isTr
              ? `${filteredAndSortedListings.length} ilan listeleniyor`
              : `Showing ${filteredAndSortedListings.length} listings`}
            {searchQuery.trim() && ` ("${searchQuery.trim()}")`}
          </span>
          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
            >
              {isTr ? "Aramayı Temizle" : "Clear Search"}
            </button>
          )}
        </div>
      )}

      {actionError && (
        <div className="rounded-md border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 p-3 text-xs text-[var(--color-danger)]">
          {actionError}
        </div>
      )}

      {/* Listings Table / Cards */}
      {filteredAndSortedListings.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-4">
          {filteredAndSortedListings.map((listing) => {
            const firstDate = listing.firstPublishedAt
              ? new Date(listing.firstPublishedAt).toLocaleDateString(isTr ? "tr-TR" : "en-US")
              : "—";

            return (
              <div
                key={listing.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-5 sm:p-6 transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={LISTING_STATUS_BADGE_VARIANTS[listing.status] ?? "outline"}
                      size="sm"
                    >
                      {listing.status}
                    </Badge>
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      {isTr ? "İlk Yayım:" : "Published:"} {firstDate}
                    </span>
                    {listing.activationSeq > 1 && (
                      <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
                        (Seq #{listing.activationSeq})
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                    <Link
                      href={getLocalizedListingPath(listing.slug, locale as Locale)}
                      className="hover:underline"
                    >
                      {listing.title}
                    </Link>
                  </h3>

                  {/* Views & Clicks Stats */}
                  <div className="flex items-center gap-2 pt-1 text-xs text-[var(--color-text-secondary)] font-medium">
                    <span
                      className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] px-2.5 py-1"
                      title={isTr ? "Toplam Görüntülenme Sayısı" : "Total View Count"}
                    >
                      <Eye className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                      <span>
                        {(listing.viewCount ?? 0).toLocaleString(isTr ? "tr-TR" : "en-US")}{" "}
                        {isTr ? "görüntülenme" : "views"}
                      </span>
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] px-2.5 py-1"
                      title={isTr ? "Toplam Tıklanma Sayısı" : "Total Click Count"}
                    >
                      <MousePointerClick
                        className="h-3.5 w-3.5 text-emerald-400"
                        aria-hidden="true"
                      />
                      <span>
                        {(listing.clickCount ?? 0).toLocaleString(isTr ? "tr-TR" : "en-US")}{" "}
                        {isTr ? "tıklanma" : "clicks"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={
                      isTr
                        ? `/tr/panel/teklifler/gelen?listingId=${listing.id}`
                        : `/en/dashboard/offers/received?listingId=${listing.id}`
                    }
                  >
                    <Button variant="secondary" size="sm">
                      {isTr ? "Teklifler" : "Offers"}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedListingForRevisions(listing.id)}
                    title={isTr ? "Revizyon Geçmişi" : "Revision History"}
                  >
                    <History className="h-3.5 w-3.5 mr-1" />
                    {isTr ? "Geçmiş" : "History"}
                  </Button>

                  {listing.status === "ACTIVE" && (
                    <Link
                      href={
                        isTr
                          ? `/tr/ilanlar/${listing.slug}/duzenle`
                          : `/en/listings/${listing.slug}/edit`
                      }
                    >
                      <Button variant="outline" size="sm">
                        {isTr ? "Düzenle" : "Edit"}
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedListingForRevisions(listing.id)}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  >
                    <History className="mr-1.5 h-3.5 w-3.5" />
                    {isTr ? "Revizyonlar" : "Revisions"}
                  </Button>

                  <Link
                    href={
                      isTr
                        ? `/tr/ilanlar/yeni?cloneFrom=${listing.id}`
                        : `/en/listings/new?cloneFrom=${listing.id}`
                    }
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      title={isTr ? "İlanı Klonla & Yeni Taslak Aç" : "Duplicate & Edit Listing"}
                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 cursor-pointer"
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5 text-cyan-400" />
                      {isTr ? "Klonla" : "Duplicate"}
                    </Button>
                  </Link>

                  {listing.status === "ACTIVE" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeactivate(listing.id)}
                      disabled={loadingId === listing.id}
                    >
                      {isTr ? "Durdur" : "Deactivate"}
                    </Button>
                  )}

                  {(listing.status === "INACTIVE_EXPIRED" ||
                    listing.status === "INACTIVE_OWNER") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReactivate(listing.id)}
                      disabled={loadingId === listing.id}
                    >
                      {isTr ? "Yeniden Başlat (1 Hafta)" : "Reactivate (1-Week)"}
                    </Button>
                  )}

                  {listing.status === "MATCHED" && listing.engagementId && (
                    <Link href={getLocalizedWorkspacePath(listing.engagementId, locale)}>
                      <Button variant="primary" size="sm">
                        {isTr ? "Çalışma Alanı →" : "Workspace →"}
                      </Button>
                    </Link>
                  )}

                  {listing.status !== "MATCHED" && listing.status !== "COMPLETED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(listing.id)}
                      disabled={loadingId === listing.id}
                      className="text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                    >
                      {isTr ? "Sil" : "Delete"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedListingForRevisions && (
        <ListingRevisionsModal
          listingId={selectedListingForRevisions}
          isOpen={Boolean(selectedListingForRevisions)}
          onClose={() => setSelectedListingForRevisions(null)}
          locale={locale}
        />
      )}
    </div>
  );
}
