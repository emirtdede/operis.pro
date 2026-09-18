"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, X, History } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { EmptyState } from "../ui/empty-state";
import { SubmitOfferModal } from "../offers/submit-offer-modal";
import { OfferRevisionsModal } from "../offers/offer-revisions-modal";
import { getLocalizedListingPath, getLocalizedWorkspacePath } from "@/src/lib/i18n/routes";

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
  createdAt: string | Date;
  updatedAt: string | Date;
  engagementId?: string | null;
}

export interface SentOffersDashboardProps {
  initialOffers: SentOfferItem[];
  locale: string;
}

export function SentOffersDashboard({ initialOffers, locale }: SentOffersDashboardProps) {
  const isTr = locale === "tr";
  const [offers, setOffers] = useState<SentOfferItem[]>(initialOffers);
  const [filter, setFilter] = useState<string>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [withdrawingOffer, setWithdrawingOffer] = useState<SentOfferItem | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [selectedOfferForRevisions, setSelectedOfferForRevisions] = useState<string | null>(null);
  const [editingOffer, setEditingOffer] = useState<SentOfferItem | null>(null);

  // Close modal on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && withdrawingOffer) {
        setWithdrawingOffer(null);
        setWithdrawError(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [withdrawingOffer]);

  const filteredOffers = offers.filter((o) => {
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
    } catch (err: unknown) {
      setWithdrawError(
        err instanceof Error ? err.message : isTr ? "İşlem başarısız oldu." : "Operation failed."
      );
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--color-border-subtle)] pb-4">
        {(["all", "pending", "accepted", "rejected", "cancelled", "withdrawn"] as const).map(
          (f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] font-semibold"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {f === "all"
                ? isTr
                  ? "Tümü"
                  : "All"
                : f === "pending"
                  ? isTr
                    ? "Beklemede"
                    : "Pending"
                  : f === "accepted"
                    ? isTr
                      ? "Kabul Edilenler"
                      : "Accepted"
                    : f === "rejected"
                      ? isTr
                        ? "Reddedilenler"
                        : "Rejected"
                      : f === "cancelled"
                        ? isTr
                          ? "İptal Edilenler"
                          : "Cancelled"
                        : isTr
                          ? "Geri Çekilenler"
                          : "Withdrawn"}
            </button>
          )
        )}
      </div>

      {filteredOffers.length === 0 ? (
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-8 sm:p-12 text-center shadow-sm">
          <EmptyState
            title={isTr ? "Teklif bulunamadı" : "No offers found"}
            description={
              isTr
                ? "Henüz bir ilana teklif vermediniz veya bu filtrede teklif bulunmuyor."
                : "You have not submitted proposals or none match this filter."
            }
            action={
              <Link href={isTr ? "/tr/ilanlar" : "/en/listings"}>
                <Button variant="primary">{isTr ? "İlanları Keşfet" : "Explore Listings"}</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOffers.map((offer) => {
            const dateStr = new Date(offer.createdAt).toLocaleDateString(isTr ? "tr-TR" : "en-US");

            return (
              <div
                key={offer.id}
                className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-5 sm:p-6 space-y-3 shadow-sm transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
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
                    <span className="text-xs text-[var(--color-text-tertiary)]">{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOfferForRevisions(offer.id)}
                      title={isTr ? "Revizyon Geçmişi" : "Revision History"}
                      className="cursor-pointer"
                    >
                      <History className="h-3.5 w-3.5 mr-1" />
                      {isTr ? "Geçmiş" : "History"}
                    </Button>
                  </div>

                  {offer.status === "PENDING" && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingOffer(offer)}
                        disabled={loadingId === offer.id}
                        className="cursor-pointer"
                      >
                        {isTr ? "Düzenle" : "Edit"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setWithdrawingOffer(offer)}
                        disabled={loadingId === offer.id}
                        className="text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 cursor-pointer"
                      >
                        {isTr ? "Teklifi Geri Çek" : "Withdraw"}
                      </Button>
                    </div>
                  )}

                  {offer.status === "ACCEPTED" && offer.engagementId && (
                    <Link href={getLocalizedWorkspacePath(offer.engagementId, locale)}>
                      <Button variant="primary" size="sm">
                        {isTr ? "Eşleşme ve İletişim Detayları →" : "View Match & Contact →"}
                      </Button>
                    </Link>
                  )}
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

      {/* Accessible Withdrawal Confirmation Modal Dialog */}
      {withdrawingOffer && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="withdraw-dialog-title"
          aria-describedby="withdraw-dialog-description"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-md max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2
                  id="withdraw-dialog-title"
                  className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]"
                >
                  {isTr ? "Teklifi Geri Çekmek İstiyor Musunuz?" : "Withdraw Proposal?"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWithdrawingOffer(null);
                  setWithdrawError(null);
                }}
                className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                aria-label={isTr ? "Kapat" : "Close"}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-4 pr-1">
              <p
                id="withdraw-dialog-description"
                className="text-xs text-[var(--color-text-secondary)] leading-relaxed"
              >
                {isTr
                  ? `"${withdrawingOffer.listingTitle}" projesine verdiğiniz teklifi geri çekiyorsunuz. İlanın mevcut 7 günlük yayım döngüsü boyunca bu projeye tekrar teklif sunamazsınız.`
                  : `You are withdrawing your proposal for "${withdrawingOffer.listingTitle}". You will not be able to submit another offer for this project during its current 7-day cycle.`}
              </p>

              {withdrawError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  {withdrawError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-[var(--color-border-subtle)] shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setWithdrawingOffer(null);
                  setWithdrawError(null);
                }}
                disabled={loadingId === withdrawingOffer.id}
              >
                {isTr ? "Vazgeç" : "Cancel"}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={confirmWithdraw}
                disabled={loadingId === withdrawingOffer.id}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
              >
                {loadingId === withdrawingOffer.id
                  ? isTr
                    ? "Geri Çekiliyor..."
                    : "Withdrawing..."
                  : isTr
                    ? "Evet, Teklifi Geri Çek"
                    : "Confirm Withdrawal"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Edit Modal */}
      {editingOffer && (
        <SubmitOfferModal
          isOpen={Boolean(editingOffer)}
          onClose={() => setEditingOffer(null)}
          listingId={editingOffer.listingId}
          listingTitle={editingOffer.listingTitle}
          locale={locale}
          offerId={editingOffer.id}
          initialData={{
            message: editingOffer.message,
            budgetCurrency: editingOffer.budgetCurrency ?? (isTr ? "TRY" : "USD"),
            budgetMin: editingOffer.budgetMin ?? "",
            budgetMax: editingOffer.budgetMax ?? "",
            timelineValue: editingOffer.estimatedDurationValue
              ? String(editingOffer.estimatedDurationValue)
              : "",
            timelineUnit:
              (editingOffer.estimatedDurationUnit as "DAYS" | "WEEKS" | "MONTHS") ?? "WEEKS",
          }}
          onSuccess={(updatedData) => {
            if (updatedData) {
              setOffers((prev) =>
                prev.map((o) =>
                  o.id === editingOffer.id
                    ? {
                        ...o,
                        message: updatedData.message ?? o.message,
                        budgetCurrency: updatedData.budgetCurrency ?? o.budgetCurrency,
                        budgetMin: updatedData.budgetMin ?? o.budgetMin,
                        budgetMax: updatedData.budgetMax ?? o.budgetMax,
                        estimatedDurationValue:
                          updatedData.estimatedDurationValue !== undefined
                            ? updatedData.estimatedDurationValue
                            : o.estimatedDurationValue,
                        estimatedDurationUnit:
                          updatedData.estimatedDurationUnit !== undefined
                            ? updatedData.estimatedDurationUnit
                            : o.estimatedDurationUnit,
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
      {/* Proposal Revisions Modal */}
      {selectedOfferForRevisions && (
        <OfferRevisionsModal
          offerId={selectedOfferForRevisions}
          isOpen={Boolean(selectedOfferForRevisions)}
          onClose={() => setSelectedOfferForRevisions(null)}
          locale={locale}
        />
      )}
    </div>
  );
}
