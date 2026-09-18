"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, MousePointerClick, History } from "lucide-react";
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

export function OwnerListingsDashboard({
  initialListings,
  locale,
  hasLoadError,
}: OwnerListingsDashboardProps) {
  const isTr = locale === "tr";
  const [listings, setListings] = useState<OwnerListingItem[]>(initialListings);
  const [tab, setTab] = useState<"all" | "active" | "inactive" | "matched">("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedListingForRevisions, setSelectedListingForRevisions] = useState<string | null>(
    null
  );

  const filteredListings = listings.filter((l) => {
    if (tab === "all") return true;
    if (tab === "active") return l.status === "ACTIVE";
    if (tab === "inactive") return l.status === "INACTIVE_EXPIRED" || l.status === "INACTIVE_OWNER";
    if (tab === "matched") return l.status === "MATCHED" || l.status === "COMPLETED";
    return true;
  });

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

      {/* Top Bar: Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--color-border-subtle)] pb-4">
        {(["all", "active", "inactive", "matched"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              tab === t
                ? "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] font-semibold border border-[var(--color-border-subtle)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {t === "all"
              ? isTr
                ? "Tümü"
                : "All"
              : t === "active"
                ? isTr
                  ? "Aktif (1 Hafta)"
                  : "Active (1-Week)"
                : t === "inactive"
                  ? isTr
                    ? "Pasif / Süresi Dolanlar"
                    : "Inactive / Expired"
                  : isTr
                    ? "Eşleşenler"
                    : "Matched"}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="rounded-md border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 p-3 text-xs text-[var(--color-danger)]">
          {actionError}
        </div>
      )}

      {/* Listings Table / Cards */}
      {filteredListings.length === 0 ? (
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-8 sm:p-12 text-center shadow-sm">
          {tab === "inactive" ? (
            <EmptyState
              title={isTr ? "Süresi Dolan veya Pasif İlan Yok" : "No Inactive or Expired Listings"}
              description={
                isTr
                  ? "Süresi dolmuş veya durdurulmuş bir ilanınız bulunmuyor. Aktif ilanlarınızı 'Aktif' sekmesinden inceleyebilirsiniz."
                  : "You have no expired or paused listings. Check active listings to see your live projects."
              }
              action={
                <Button variant="secondary" onClick={() => setTab("active")}>
                  {isTr ? "Aktif İlanları Gör" : "View Active Listings"}
                </Button>
              }
            />
          ) : tab === "matched" ? (
            <EmptyState
              title={isTr ? "Eşleşen İlan Bulunmuyor" : "No Matched Listings"}
              description={
                isTr
                  ? "Henüz bir bağımsız profesyonelle eşleşen projeniz yok. İlanlarınıza gelen teklifleri 'Gelen Teklifler' alanından değerlendirebilirsiniz."
                  : "No listings have matched with a professional yet. Review proposals in incoming offers."
              }
              action={
                <Link href={isTr ? "/tr/panel/teklifler/gelen" : "/en/dashboard/offers/received"}>
                  <Button variant="secondary">
                    {isTr ? "Gelen Teklifleri İncele" : "Review Incoming Offers"}
                  </Button>
                </Link>
              }
            />
          ) : tab === "active" ? (
            <EmptyState
              title={isTr ? "Aktif İlan Bulunmuyor" : "No Active Listings"}
              description={
                isTr
                  ? "Şu anda radarımızda canlı olan bir ilanınız yok. Yeni bir ilan yayınlayarak bağımsız mühendislerden doğrudan teklif alabilirsiniz."
                  : "You currently have no active listings on our radar. Post a listing to get direct proposals."
              }
              action={
                <Link href={isTr ? "/tr/ilanlar/yeni" : "/en/listings/new"}>
                  <Button variant="primary">
                    {isTr ? "Yeni İlan Yayınla" : "Publish Listing"}
                  </Button>
                </Link>
              }
            />
          ) : (
            <EmptyState
              title={
                isTr
                  ? "Henüz Bir İlan Yayınlamadınız"
                  : "You Haven't Published Any Listings Yet"
              }
              description={
                isTr
                  ? "%100 komisyonsuz ve doğrudan iletişimle ilanınız için bağımsız mühendis arayışınızı hemen başlatabilirsiniz."
                  : "Start finding independent engineers directly with 0% commission cut."
              }
              action={
                <Link href={isTr ? "/tr/ilanlar/yeni" : "/en/listings/new"}>
                  <Button variant="primary">
                    {isTr ? "+ İlk İlanınızı Yayınlayın" : "+ Post Your First Listing"}
                  </Button>
                </Link>
              }
            />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((listing) => {
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
                      variant={
                        listing.status === "ACTIVE"
                          ? "primary"
                          : listing.status === "MATCHED"
                            ? "secondary"
                            : "outline"
                      }
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
