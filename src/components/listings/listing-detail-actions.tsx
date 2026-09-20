"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Share2, Check, LogIn, Zap, SlidersHorizontal, Flag, History, Copy } from "lucide-react";
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

  const handleCopyLink = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
      variant="outline"
      size={isOwner ? "md" : "lg"}
      onClick={handleCopyLink}
      className="gap-2 transition-all"
      aria-label={getCopyLinkAriaLabel(copied, isTr)}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <span className="text-emerald-400 font-semibold">{isTr ? "Kopyalandı" : "Copied"}</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
          <span>{isTr ? "Bağlantıyı Kopyala" : "Share Link"}</span>
        </>
      )}
    </Button>
  );

  if (isOwner) {
    return (
      <div className="flex flex-wrap items-center gap-3">
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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={handleQuickOfferClick}
          className="gap-2 shadow-lg shadow-blue-500/20 font-semibold"
        >
          {!currentUserId ? (
            <LogIn className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Zap className="h-4 w-4 fill-current text-amber-400" aria-hidden="true" />
          )}
          <span>
            {getOfferButtonLabel(Boolean(currentUserId), isTr)}
          </span>
        </Button>

        {currentUserId && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleDetailedOfferClick}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4 text-blue-400" aria-hidden="true" />
            <span>{isTr ? "Detaylı Teklif" : "Detailed Proposal"}</span>
          </Button>
        )}

        <BookmarkButton
          listingId={listingId}
          locale={locale}
          variant="button"
          size="md"
        />

        {copyButton}

        <Button
          type="button"
          variant="ghost"
          size={isOwner ? "md" : "lg"}
          onClick={() => setReportOpen(true)}
          className="text-xs text-[var(--color-text-tertiary)] hover:text-amber-400 cursor-pointer"
        >
          <Flag className="h-3.5 w-3.5 mr-1" />
          <span>{isTr ? "İhbar Et" : "Report"}</span>
        </Button>

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
      </div>

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
    </div>
  );
}
