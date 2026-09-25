"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { History, ArrowRightLeft, Search, X, ListFilter, ChevronDown, ArrowUpDown, Inbox, Eye, Users } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { OfferRevisionsModal } from "../offers/offer-revisions-modal";
import { NegotiationTimelineModal } from "../offers/negotiation-timeline";
import { AvatarInitials } from "../ui/avatar-initials";
import { Dialog } from "../ui/dialog";
import { Select } from "../ui/select";
import { TextArea } from "../ui/text-area";
import { EmptyState } from "../ui/empty-state";
import { getLocalizedWorkspacePath, getLocalizedProfilePath } from "@/src/lib/i18n/routes";
import { SquadProposalBadge } from "../offers/squad/squad-proposal-badge";
import { SquadExplainerCard } from "../offers/squad/squad-explainer-card";

export interface ReceivedOfferItem {
  id: string;
  listingId: string;
  listingTitle: string;
  offerorUserId: string;
  offerorDisplayName: string;
  offerorHandle: string;
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

export interface ReceivedOffersDashboardProps {
  initialOffers: ReceivedOfferItem[];
  locale: string;
}

function getReceivedFilterLabel(f: string, isTr: boolean): string {
  const LABELS: Record<string, { tr: string; en: string }> = {
    all: { tr: "Tümü", en: "All" },
    pending: { tr: "Beklemede", en: "Pending" },
    accepted: { tr: "Kabul Edilen", en: "Accepted" },
    rejected: { tr: "Reddedilen", en: "Rejected" },
    cancelled: { tr: "İptal Edilen", en: "Cancelled" },
  };
  const item = LABELS[f];
  if (item) {
    return isTr ? item.tr : item.en;
  }
  return isTr ? "Geri Çekilen" : "Withdrawn";
}

function getNegotiationButtonLabel(
  isCountered: boolean | undefined,
  counterRound: number | undefined,
  isTr: boolean
): string {
  const round = counterRound || 1;
  if (isCountered) {
    return isTr ? `Pazarlık (${round}. Tur)` : `Negotiation (R${round})`;
  }
  return isTr ? "Pazarlık / Karşı Teklif" : "Counter-Offer";
}

export type ReceivedOfferSortOption = "newest" | "budget_desc" | "budget_asc" | "duration_asc";

function getOfferDurationInDays(val: number | null, unit: string | null): number {
  if (!val) return Infinity;
  const u = (unit || "").toLowerCase();
  if (u.includes("month") || u.includes("ay")) return val * 30;
  if (u.includes("week") || u.includes("hafta")) return val * 7;
  return val;
}

export function ReceivedOffersDashboard({ initialOffers, locale }: ReceivedOffersDashboardProps) {
  const isTr = locale === "tr";
  const [offers, setOffers] = useState<ReceivedOfferItem[]>(initialOffers);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<ReceivedOfferSortOption>("newest");
  const [selectedOfferForRevisions, setSelectedOfferForRevisions] = useState<string | null>(null);
  const [selectedOfferForNegotiation, setSelectedOfferForNegotiation] = useState<string | null>(null);

  // Accept Modal State
  const [acceptingOffer, setAcceptingOffer] = useState<ReceivedOfferItem | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Reject Modal State
  const [rejectingOffer, setRejectingOffer] = useState<ReceivedOfferItem | null>(null);
  const [rejectionCode, setRejectionCode] = useState<string>("BUDGET_MISMATCH");
  const [rejectionNote, setRejectionNote] = useState<string>("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

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

  const filteredAndSortedOffers = useMemo(() => {
    let list = offers.filter((o) => {
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

    const q = searchQuery.trim().toLocaleLowerCase("tr-TR");
    if (q) {
      list = list.filter((o) => {
        const nameMatch = o.offerorDisplayName.toLocaleLowerCase("tr-TR").includes(q);
        const handleMatch = o.offerorHandle.toLocaleLowerCase("tr-TR").includes(q);
        const msgMatch = (o.message || "").toLocaleLowerCase("tr-TR").includes(q);
        const titleMatch = (o.listingTitle || "").toLocaleLowerCase("tr-TR").includes(q);
        const squadMatch = (o.squadTitle || "").toLocaleLowerCase("tr-TR").includes(q);
        return nameMatch || handleMatch || msgMatch || titleMatch || squadMatch;
      });
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
      case "duration_asc":
        return sorted.sort((a, b) => {
          const durA = getOfferDurationInDays(a.estimatedDurationValue, a.estimatedDurationUnit);
          const durB = getOfferDurationInDays(b.estimatedDurationValue, b.estimatedDurationUnit);
          return durA - durB;
        });
      case "newest":
      default:
        return sorted.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }, [offers, filter, searchQuery, sortBy]);

  const handleAcceptConfirm = async () => {
    if (!acceptingOffer) return;
    setIsAccepting(true);
    setAcceptError(null);

    try {
      const res = await fetch(`/api/offers/${acceptingOffer.id}/accept`, {
        method: "POST",
        headers: {
          "x-locale": locale,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept offer");

      if (!data?.engagement?.id) {
        throw new Error(
          isTr ? "Eşleşme kaydı oluşturulamadı." : "Failed to retrieve engagement ID."
        );
      }

      setOffers((prev) =>
        prev.map((o) => {
          if (o.id === acceptingOffer.id) {
            return { ...o, status: "ACCEPTED", engagementId: data.engagement.id };
          }
          if (o.listingId === acceptingOffer.listingId && o.status === "PENDING") {
            return { ...o, status: "REJECTED_OTHER_SELECTED" };
          }
          return o;
        })
      );

      // Redirect to match page
      const targetPath = getLocalizedWorkspacePath(data.engagement.id, locale);
      if (typeof window !== "undefined") {
        window.location.href = targetPath;
      }
    } catch (err: unknown) {
      setAcceptError(err instanceof Error ? err.message : "Error accepting offer");
      setIsAccepting(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingOffer) return;
    setIsRejecting(true);
    setRejectError(null);

    try {
      const res = await fetch(`/api/offers/${rejectingOffer.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          rejectionCode,
          rejectionNote: rejectionNote || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject offer");

      setOffers((prev) =>
        prev.map((o) => (o.id === rejectingOffer.id ? { ...o, status: "REJECTED" } : o))
      );
      setRejectingOffer(null);
    } catch (err: unknown) {
      setRejectError(err instanceof Error ? err.message : "Error rejecting offer");
    } finally {
      setIsRejecting(false);
    }
  };

  const renderEmptyState = () => {
    if (searchQuery.trim()) {
      return (
        <EmptyState
          variant="card"
          icon={<Inbox className="h-7 w-7 text-blue-400" />}
          title={isTr ? "Aramanıza uygun teklif bulunamadı" : "No offers match your search"}
          description={
            isTr
              ? `"${searchQuery.trim()}" aramasıyla eşleşen gelen teklif bulunmuyor. Farklı kelimelerle aramayı veya filtreyi sıfırlamayı deneyebilirsiniz.`
              : `No proposals match "${searchQuery.trim()}". Try searching with different keywords or reset your filters.`
          }
          action={
            <Button variant="secondary" size="sm" onClick={() => setSearchQuery("")} className="cursor-pointer">
              {isTr ? "Aramayı Temizle" : "Clear Search"}
            </Button>
          }
        />
      );
    }

    if (offers.length === 0) {
      return (
        <EmptyState
          variant="card"
          icon={<Inbox className="h-7 w-7 text-blue-400" />}
          title={isTr ? "Henüz teklif alınmadı" : "No received offers yet"}
          description={
            isTr
              ? "İlanlarınıza teklif geldiğinde bu ekranda listelenecektir."
              : "Offers submitted to your listings will appear here."
          }
          action={
            <Link href={isTr ? "/tr/panel/ilanlarim" : "/en/dashboard/listings"}>
              <Button variant="shimmer" size="md" className="gap-2 shadow-lg shadow-blue-500/15">
                <Eye className="h-4 w-4" />
                <span>{isTr ? "İlanlarımı İncele" : "View My Listings"}</span>
              </Button>
            </Link>
          }
        />
      );
    }

    return (
      <EmptyState
        variant="card"
        icon={<Inbox className="h-7 w-7 text-blue-400" />}
        title={isTr ? "Teklif bulunamadı" : "No offers found"}
        description={
          isTr
            ? "Seçilen filtreye uygun gelen teklif bulunmuyor."
            : "No incoming proposals match this filter criteria."
        }
        action={
          <Button variant="secondary" size="sm" onClick={() => setFilter("all")} className="cursor-pointer">
            {isTr ? "Tüm Teklifleri Göster" : "Show All Offers"}
          </Button>
        }
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Unified Toolbar: Search Input + Status Filters + Sort Dropdown */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
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
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label={isTr ? "Durum Filtresi" : "Status Filter"}
              className="appearance-none h-9 py-1.5 pl-8 pr-8 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all shadow-xs"
            >
              {(["all", "pending", "accepted", "rejected", "cancelled", "withdrawn"] as const).map((f) => (
                <option key={f} value={f} className="bg-[#141517] text-[var(--color-text-primary)]">
                  {getReceivedFilterLabel(f, isTr)} ({filterCounts[f]})
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
              onChange={(e) => setSortBy(e.target.value as ReceivedOfferSortOption)}
              aria-label={isTr ? "Sıralama ölçütü" : "Sort by"}
              className="appearance-none h-9 py-1.5 pl-8 pr-8 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all shadow-xs"
            >
              <option value="newest" className="bg-[#141517] text-[var(--color-text-primary)]">{isTr ? "En Yeni" : "Newest"}</option>
              <option value="budget_desc" className="bg-[#141517] text-[var(--color-text-primary)]">{isTr ? "En Yüksek Bütçe" : "Highest Budget"}</option>
              <option value="budget_asc" className="bg-[#141517] text-[var(--color-text-primary)]">{isTr ? "En Düşük Bütçe" : "Lowest Budget"}</option>
              <option value="duration_asc" className="bg-[#141517] text-[var(--color-text-primary)]">{isTr ? "En Kısa Süre" : "Shortest Timeline"}</option>
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
              ? `${filteredAndSortedOffers.length} teklif listeleniyor`
              : `Showing ${filteredAndSortedOffers.length} offers`}
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

      {filteredAndSortedOffers.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-4">
          {filteredAndSortedOffers.map((offer) => {
            const dateStr = new Date(offer.createdAt).toLocaleDateString(isTr ? "tr-TR" : "en-US");

            return (
              <div
                key={offer.id}
                className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-7 space-y-4 shadow-sm transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg"
              >
                {/* Header: Offeror details and status */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3">
                  <Link
                    href={getLocalizedProfilePath(offer.offerorHandle, locale)}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <AvatarInitials name={offer.offerorDisplayName} size="sm" />
                    <div>
                      <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {offer.offerorDisplayName}
                      </div>
                      <div className="text-xs text-[var(--color-text-tertiary)]">
                        @{offer.offerorHandle}
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2">
                    {offer.isSquadOffer && (
                      <SquadProposalBadge
                        memberCount={offer.squadMembers?.length}
                        squadTitle={offer.squadTitle}
                        locale={locale}
                        size="sm"
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
                        badgeVariant = "secondary";
                        badgeLabel = isTr ? "Beklemede" : "Pending";
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
                      } else if (offer.status.toLowerCase().startsWith("rejected")) {
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
                    <span className="text-xs text-[var(--color-text-tertiary)]">{dateStr}</span>
                  </div>
                </div>

                {/* Listing Reference */}
                <div className="text-xs text-[var(--color-text-secondary)]">
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {isTr ? "İlan:" : "Project:"}
                  </span>{" "}
                  {offer.listingTitle}
                </div>

                {/* Proposal Message */}
                <div className="rounded-lg bg-[var(--color-surface-hover)] p-4 text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {offer.message}
                </div>

                {/* Squad Consortium Breakdown & Explainer */}
                {offer.isSquadOffer && offer.squadMembers && offer.squadMembers.length > 0 && (
                  <div className="space-y-3 rounded-xl border border-indigo-500/25 bg-indigo-950/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-indigo-400 shrink-0" aria-hidden="true" />
                        <span>
                          {isTr
                            ? "Çevik Konsorsiyum Ekip Yapısı & Hakediş Dağılımı"
                            : "Squad Roster & Revenue Allocation"}
                        </span>
                      </span>
                      <span className="text-[11px] text-indigo-400 font-mono">
                        {offer.squadMembers.length}{" "}
                        {isTr ? "Uzman / %100 Konsorsiyum" : "Specialists / 100% Total"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {offer.squadMembers.map((sm, smIdx) => (
                        <div
                          key={smIdx}
                          className="rounded-lg border border-indigo-500/20 bg-[var(--color-surface-base)]/80 p-2.5 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[var(--color-text-primary)] truncate">
                              {sm.displayName}
                            </span>
                            <span className="font-mono text-emerald-400 font-bold">
                              %{sm.revenueSharePercentage}
                            </span>
                          </div>
                          <div className="text-[11px] text-indigo-300 font-medium">
                            {sm.roleTitle}
                            {sm.isLead && (
                              <span className="ml-1 text-[10px] text-cyan-300">
                                ({isTr ? "Lider Muhatap" : "Lead"})
                              </span>
                            )}
                          </div>
                          {sm.scopeSummary && (
                            <p className="text-[10px] text-[var(--color-text-tertiary)] line-clamp-2">
                              {sm.scopeSummary}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <SquadExplainerCard locale={locale} />
                  </div>
                )}

                {/* Budget & Timeline */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-4 text-xs text-[var(--color-text-tertiary)]">
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

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOfferForNegotiation(offer.id)}
                      title={isTr ? "Karşı Teklif & Pazarlık" : "Counter-Offer & Negotiation"}
                      className={offer.isCountered ? "border-blue-500/50 text-blue-400 hover:bg-blue-500/10" : ""}
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                      {getNegotiationButtonLabel(offer.isCountered, offer.counterRound, isTr)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOfferForRevisions(offer.id)}
                      title={isTr ? "Revizyon Geçmişi" : "Revision History"}
                    >
                      <History className="h-3.5 w-3.5 mr-1" />
                      {isTr ? "Geçmiş" : "History"}
                    </Button>
                  </div>

                  {/* Actions for PENDING offers */}
                  {offer.status === "PENDING" && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRejectingOffer(offer)}
                        className="text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                      >
                        {isTr ? "Reddet" : "Reject"}
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setAcceptingOffer(offer)}>
                        {isTr ? "Teklifi Kabul Et" : "Accept Offer"}
                      </Button>
                    </div>
                  )}

                  {/* Actions for ACCEPTED offers */}
                  {offer.status === "ACCEPTED" && offer.engagementId && (
                    <div className="flex items-center gap-2">
                      <Link href={getLocalizedWorkspacePath(offer.engagementId, locale)}>
                        <Button variant="primary" size="sm">
                          {isTr ? "Çalışma Alanına Git →" : "Go to Workspace →"}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Acceptance Modal */}
      {acceptingOffer && (
        <Dialog
          isOpen={true}
          onClose={() => setAcceptingOffer(null)}
          title={isTr ? "Teklifi Kabul Et ve Eşleş" : "Accept Offer & Match"}
          description={
            isTr
              ? `"${acceptingOffer.offerorDisplayName}" kullanıcısının teklifini kabul etmek üzeresiniz.`
              : `You are about to accept the proposal from ${acceptingOffer.offerorDisplayName}.`
          }
        >
          <div className="space-y-4">
            {acceptError && (
              <div className="rounded-md border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 p-3 text-xs text-[var(--color-danger)]">
                {acceptError}
              </div>
            )}

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs leading-relaxed text-[var(--color-text-secondary)] space-y-2">
              <p className="font-semibold text-[var(--color-text-primary)]">
                {isTr
                  ? "Önemli Eşleştirme ve Sorumluluk Hatırlatması:"
                  : "Important Matching Notice:"}
              </p>
              <p>
                {isTr
                  ? "Bu işlem ilanın diğer tüm bekleyen tekliflerini otomatik olarak reddeder ve karşı taraf ile doğrulanmış iletişim kanallarınızı paylaşır. Platform ödeme almaz, emanet (escrow) sağlamaz ve sözleşmesel güvence vermez. Tüm çalışma ve ödeme şartlarını doğrudan karşı tarafla yazılı olarak belirleyiniz."
                  : "This action will reject all other pending offers and reveal verified contact channels. The platform provides no escrow, payment holding, or contract enforcement."}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setAcceptingOffer(null)}
                disabled={isAccepting}
              >
                {isTr ? "Vazgeç" : "Cancel"}
              </Button>
              <Button variant="primary" onClick={handleAcceptConfirm} isLoading={isAccepting}>
                {isTr ? "Onayla ve Eşleş" : "Confirm & Match"}
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Rejection Modal */}
      {rejectingOffer && (
        <Dialog
          isOpen={true}
          onClose={() => setRejectingOffer(null)}
          title={isTr ? "Teklifi Reddet" : "Reject Offer"}
          description={
            isTr
              ? "Teklifi reddetme gerekçenizi seçebilir ve isteğe bağlı bir açıklama ekleyebilirsiniz."
              : "Select a reason for rejecting this offer with an optional note."
          }
        >
          <div className="space-y-4">
            {rejectError && (
              <div className="rounded-md border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 p-3 text-xs text-[var(--color-danger)]">
                {rejectError}
              </div>
            )}

            <Select
              label={isTr ? "Reddetme Gerekçesi" : "Rejection Reason"}
              value={rejectionCode}
              onChange={(e) => setRejectionCode(e.target.value)}
              options={[
                { value: "BUDGET_MISMATCH", label: isTr ? "Bütçe Uyuşmazlığı" : "Budget Mismatch" },
                {
                  value: "TIMELINE_MISMATCH",
                  label: isTr ? "Zamanlama Uyuşmazlığı" : "Timeline Mismatch",
                },
                {
                  value: "SCOPE_MISMATCH",
                  label: isTr ? "Kapsam / Yetkinlik Uyuşmazlığı" : "Scope Mismatch",
                },
                { value: "OTHER", label: isTr ? "Diğer" : "Other" },
              ]}
            />

            <TextArea
              label={isTr ? "Açıklama (İsteğe Bağlı)" : "Note (Optional)"}
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder={isTr ? "Teklif sahibine özel açıklama..." : "Private note to offeror..."}
              maxLength={500}
              showCount
              rows={3}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setRejectingOffer(null)}
                disabled={isRejecting}
              >
                {isTr ? "İptal" : "Cancel"}
              </Button>
              <Button variant="secondary" onClick={handleRejectConfirm} isLoading={isRejecting}>
                {isTr ? "Reddi Onayla" : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
      {/* Offer Revisions Modal */}
      {selectedOfferForRevisions && (
        <OfferRevisionsModal
          offerId={selectedOfferForRevisions}
          isOpen={Boolean(selectedOfferForRevisions)}
          onClose={() => setSelectedOfferForRevisions(null)}
          locale={locale}
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
