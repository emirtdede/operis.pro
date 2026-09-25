"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Share2, Check, LogIn, Send, SlidersHorizontal, Flag, History, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { SubmitOfferModal } from "../offers/submit-offer-modal";
import { QuickOfferDrawer } from "../offers/quick-offer-drawer";
import { ListingRevisionsModal } from "./listing-revisions-modal";
import { ContextualReportModal } from "../moderation/contextual-report-modal";
import { BookmarkButton } from "./bookmark-button";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";

export interface ListingDetailActionsProps {
  listingId: string;
  listingSlug?: string;
  listingTitle: string;
  categoryName?: string;
  budgetMin?: string | null;
  budgetMax?: string | null;
  budgetCurrency?: string | null;
  ownerDisplayName?: string;
  ownerUserId: string;
  currentUserId?: string;
  isOwner: boolean;
  isActive: boolean;
  locale: string;
}

function getCopyLinkAriaLabel(copied: boolean, isTr: boolean): string {
  if (copied) {
    return isTr ? "Bağlantı kopyalandı" : "Link copied";
  }
  return isTr ? "Bağlantıyı kopyala" : "Copy link";
}

function getOfferButtonLabel(hasUser: boolean, isTr: boolean): string {
  if (!hasUser) {
    return isTr ? "Giriş Yaparak Teklif Ver" : "Sign In to Submit Offer";
  }
  return isTr ? "Hızlı Teklif Ver" : "Quick Proposal";
}

export function ListingDetailActions({
  listingId,
  listingSlug,
  listingTitle,
  categoryName = "Teknoloji",
  budgetMin = null,
  budgetMax = null,
  budgetCurrency = "TRY",
  ownerDisplayName = "İlan Sahibi",
  currentUserId,
  isOwner,
  isActive,
  locale,
}: ListingDetailActionsProps) {
  const isTr = locale === "tr";
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [initialData, setInitialData] = useState<
    | {
        message: string;
        budgetCurrency: string;
        budgetMin: string;
        budgetMax: string;
        timelineValue: string;
        timelineUnit: "DAYS" | "WEEKS" | "MONTHS";
      }
    | undefined
  >(undefined);
  const [copied, setCopied] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  const handleCopyLink = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setCopyToast(true);
        setTimeout(() => {
          setCopied(false);
          setCopyToast(false);
        }, 3000);
      }
    } catch {
      // Fallback
    }
  };

  const redirectToLogin = () => {
    const returnPath = isTr
      ? `/tr/ilanlar/${listingSlug ?? listingId}`
      : `/en/listings/${listingSlug ?? listingId}`;
    const loginUrl = isTr
      ? `/tr/giris?returnUrl=${encodeURIComponent(returnPath)}`
      : `/en/login?returnUrl=${encodeURIComponent(returnPath)}`;
    router.push(loginUrl);
  };

  const handleQuickOfferClick = () => {
    if (!currentUserId) {
      redirectToLogin();
      return;
    }
    setDrawerOpen(true);
  };

  const handleDetailedOfferClick = () => {
    if (!currentUserId) {
      redirectToLogin();
      return;
    }
    setInitialData(undefined);
    setModalOpen(true);
  };

  const copyButton = (
    <Button
      type="button"
      variant="secondary"
      size="md"
      onClick={handleCopyLink}
      className="w-full gap-1.5 transition-all justify-center text-xs h-10 rounded-xl"
      aria-label={getCopyLinkAriaLabel(copied, isTr)}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
          <span className="text-emerald-400 font-semibold">{isTr ? "Kopyalandı" : "Copied"}</span>
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
          <span>{isTr ? "Bağlantıyı Kopyala" : "Share Link"}</span>
        </>
      )}
    </Button>
  );

  const copyToastPortal =
    copyToast && typeof document !== "undefined"
      ? createPortal(
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl border border-emerald-500/40 bg-[var(--color-surface-base)]/95 text-[var(--color-text-primary)] shadow-2xl shadow-black/60 backdrop-blur-xl animate-in slide-in-from-bottom-4 fade-in duration-200"
          >
            <div className="h-7 w-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Check className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex flex-col pr-1">
              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                {isTr ? "Bağlantı Kopyalandı!" : "Link Copied!"}
              </span>
              <span className="text-[11px] text-[var(--color-text-secondary)]">
                {isTr
                  ? "İlan bağlantısı panoya kopyalandı, dilediğiniz yerde paylaşabilirsiniz."
                  : "Listing link copied to clipboard, ready to share."}
              </span>
            </div>
          </div>,
          document.body
        )
      : null;

  if (isOwner) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {copyToastPortal}
        <Link
          href={`${getLocalizedRoute("dashboardReceivedOffers", locale)}?listingId=${listingId}`}
        >
          <Button variant="primary">
            {isTr ? "Gelen Teklifleri İncele" : "View Received Offers"}
          </Button>
        </Link>
        {listingSlug && isActive && (
          <Link
            href={isTr ? `/tr/ilanlar/${listingSlug}/duzenle` : `/en/listings/${listingSlug}/edit`}
          >
            <Button variant="secondary">{isTr ? "İlanı Düzenle" : "Edit Listing"}</Button>
          </Link>
        )}
        <Link href={getLocalizedRoute("dashboardListings", locale)}>
          <Button variant="outline">{isTr ? "Tüm İlanlarım" : "All My Listings"}</Button>
        </Link>
        <Button
          type="button"
          variant="outline"
          onClick={() => setRevisionsOpen(true)}
          className="cursor-pointer"
        >
          <History className="h-4 w-4 mr-1.5 text-blue-400" />
          <span>{isTr ? "Revizyon Geçmişi" : "Revision History"}</span>
        </Button>
        <Link
          href={
            isTr
              ? `/tr/ilanlar/yeni?cloneFrom=${listingSlug || listingId}`
              : `/en/listings/new?cloneFrom=${listingSlug || listingId}`
          }
        >
          <Button variant="outline" className="gap-1.5 cursor-pointer">
            <Copy className="h-4 w-4 text-cyan-400" />
            <span>{isTr ? "Klonla & Düzenle" : "Duplicate & Edit"}</span>
          </Button>
        </Link>
        {copyButton}

        <ListingRevisionsModal
          listingId={listingId}
          isOpen={revisionsOpen}
          onClose={() => setRevisionsOpen(false)}
          locale={locale}
        />
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-4 text-sm text-[var(--color-text-secondary)]">
          {isTr
            ? "Bu ilanın 7 günlük yayım süresi dolmuştur. Şu anda yeni teklif kabul edilmemektedir."
            : "This listing has expired. It is not currently accepting new offers."}
        </div>
        <div>{copyButton}</div>
        {copyToastPortal}
      </div>
    );
  }

  const drawerListing = {
    id: listingId,
    slug: listingSlug || listingId,
    title: listingTitle,
    categoryName,
    budgetMin,
    budgetMax,
    budgetCurrency,
    ownerDisplayName,
  };
  return (
    <div className="space-y-2">
      {/* Primary CTA: Quick Offer / Login */}
      <Button
        variant="primary"
        size="md"
        onClick={handleQuickOfferClick}
        className="w-full h-11 gap-2 shadow-md shadow-blue-500/20 font-bold justify-center text-sm rounded-xl"
      >
        {!currentUserId ? (
          <LogIn className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Send className="h-4 w-4 text-white" aria-hidden="true" />
        )}
        <span>{getOfferButtonLabel(Boolean(currentUserId), isTr)}</span>
      </Button>

      {/* Secondary & Utility Actions: Balanced 2-Column Grid */}
      {currentUserId ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleDetailedOfferClick}
              className="w-full gap-1.5 justify-center text-xs h-10 rounded-xl"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400 shrink-0" aria-hidden="true" />
              <span>{isTr ? "Detaylı Teklif" : "Detailed Offer"}</span>
            </Button>

            <BookmarkButton
              listingId={listingId}
              locale={locale}
              variant="button"
              size="md"
              className="w-full justify-center text-xs h-10 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {copyButton}

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setReportOpen(true)}
              className="group w-full gap-1.5 justify-center text-xs h-10 rounded-xl text-[var(--color-text-secondary)] hover:text-rose-400 hover:border-rose-500/30 transition-colors"
            >
              <Flag className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-tertiary)] group-hover:text-rose-400 transition-colors" />
              <span>{isTr ? "İhbar Et" : "Report"}</span>
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <BookmarkButton
              listingId={listingId}
              locale={locale}
              variant="button"
              size="md"
              className="w-full justify-center text-xs h-10 rounded-xl"
            />
            {copyButton}
          </div>

          <div className="text-center pt-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setReportOpen(true)}
              className="group w-full text-xs text-[var(--color-text-tertiary)] hover:text-rose-400 cursor-pointer h-8 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Flag className="h-3 w-3 mr-1 text-[var(--color-text-tertiary)] group-hover:text-rose-400 transition-colors" />
              <span>{isTr ? "İlanı İhbar Et" : "Report Listing"}</span>
            </Button>
          </div>
        </>
      )}

        {drawerOpen && (
          <QuickOfferDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            listing={drawerListing}
            locale={locale}
            onOpenFullModal={(data) => {
              setDrawerOpen(false);
              setInitialData(data);
              setModalOpen(true);
            }}
            onSuccess={() => {
              setDrawerOpen(false);
              router.refresh();
            }}
          />
        )}

        {modalOpen && (
          <SubmitOfferModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setInitialData(undefined);
            }}
            listingId={listingId}
            listingTitle={listingTitle}
            locale={locale}
            initialData={initialData}
            onSuccess={() => {
              setModalOpen(false);
              setInitialData(undefined);
              router.refresh();
            }}
          />
        )}

        <ContextualReportModal
          targetType="listing"
          targetIdentifier={listingSlug || listingId}
          targetTitle={listingTitle}
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          locale={locale}
        />

      <p className="text-[11px] text-[var(--color-text-tertiary)] flex items-center gap-1.5 pt-1">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
        <span>
          {isTr
            ? "Operis kar amacı gütmeyen ücretsiz bir buluşma platformudur; ticari risk almaz. Ödeme ve sözleşmeler tarafların kendi sorumluluğundadır."
            : "Operis is a non-profit, zero-commission matching venue. All payments and contracts are strictly direct; the platform assumes zero commercial risk."}{" "}
          <Link
            href={
              isTr ? "/tr/yasal/eslestirme-ve-sorumluluk-reddi" : "/en/legal/matching-disclaimer"
            }
            className="text-blue-400 hover:underline inline-block font-medium"
          >
            {isTr ? "Yasal Sorumluluk Reddi" : "Disclaimer"}
          </Link>
        </span>
      </p>

      {copyToastPortal}
    </div>
  );
}
