"use client";

import { useState, useMemo, memo } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Zap,
  ShieldCheck,
  Share2,
  Check,
} from "lucide-react";
import { AvatarInitials } from "../ui/avatar-initials";
import { VerifiedCompanyBadge } from "../ui/verified-company-badge";
import { FeedListingItem } from "@/src/modules/listings/feed/service";
import { HiringIntentBadge } from "../listings/hiring-intent-badge";
import { HiringIntentModal } from "../listings/hiring-intent-modal";
import { HiringIntentEngine } from "@/src/modules/listings/hiring-intent/hiring-intent-engine";

export interface SocialListingCardProps {
  item: FeedListingItem;
  locale: string;
  isCategoryFollowed?: boolean;
  onToggleFollowCategory?: (categoryId: string) => Promise<void> | void;
  onQuickOffer?: (target: {
    id: string;
    slug: string;
    title: string;
    categoryName: string;
    budgetMin: string | null;
    budgetMax: string | null;
    budgetCurrency: string | null;
    ownerDisplayName: string;
  }) => void;
}

function formatRelativeTime(dateInput: Date | string, isTr: boolean): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return isTr ? "Az önce" : "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return isTr ? `${diffMin} dk önce` : `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return isTr ? `${diffHours} sa önce` : `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return isTr ? `${diffDays} gün önce` : `${diffDays}d ago`;

  return new Intl.DateTimeFormat(isTr ? "tr-TR" : "en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export const SocialListingCard = memo(function SocialListingCard({
  item,
  locale,
  isCategoryFollowed: _isCategoryFollowed = false,
  onToggleFollowCategory: _onToggleFollowCategory,
  onQuickOffer,
}: SocialListingCardProps) {
  const isTr = locale === "tr";
  const [copied, setCopied] = useState(false);
  const [isIntentModalOpen, setIsIntentModalOpen] = useState(false);

  const intentBreakdown = useMemo(() => {
    return HiringIntentEngine.evaluateHiringIntent({
      listingId: item.id,
      title: item.title,
      summary: item.summary,
      scope: item.summary,
      budgetMin: item.budgetMin,
      budgetMax: item.budgetMax,
      budgetCurrency: item.budgetCurrency,
      budgetMode: item.budgetMode,
      ownerProfile: {
        isCompanyVerified: item.ownerIsCompanyVerified,
        companyName: item.ownerCompanyName,
        companyType: item.ownerCompanyType,
        taxOffice: item.ownerTaxOffice,
        vknMasked: item.ownerVknMasked,
      },
      locale,
    });
  }, [item, locale]);

  // Freshness calculation
  const now = new Date();
  const until = new Date(item.activeUntil);
  const diffMs = until.getTime() - now.getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  let freshnessDot = "bg-emerald-500";
  let freshnessText = isTr ? `${diffDays} gün kaldı` : `${diffDays}d left`;
  let freshnessColor = "text-emerald-400";

  if (diffMs <= 0) {
    freshnessDot = "bg-zinc-500";
    freshnessText = isTr ? "Süresi doldu" : "Expired";
    freshnessColor = "text-zinc-400";
  } else if (diffHours <= 24) {
    freshnessDot = "bg-rose-500 animate-ping";
    freshnessText = isTr ? `Son ${Math.max(1, diffHours)} saat` : `Last ${Math.max(1, diffHours)}h`;
    freshnessColor = "text-rose-400";
  } else if (diffDays <= 3) {
    freshnessDot = "bg-amber-500";
    freshnessText = isTr ? `${diffDays} gün kaldı` : `${diffDays}d left`;
    freshnessColor = "text-amber-400";
  }

  // Budget label formatting
  let budgetLabel = isTr ? "Bütçe Belirtilmedi" : "Budget not specified";
  if (item.budgetMin && item.budgetMax) {
    budgetLabel = `${parseFloat(item.budgetMin).toLocaleString(isTr ? "tr-TR" : "en-US")} – ${parseFloat(item.budgetMax).toLocaleString(isTr ? "tr-TR" : "en-US")} ${item.budgetCurrency ?? ""}`;
  } else if (item.budgetMin) {
    budgetLabel = `${isTr ? "Min" : "From"} ${parseFloat(item.budgetMin).toLocaleString(isTr ? "tr-TR" : "en-US")} ${item.budgetCurrency ?? ""}`;
  } else if (item.budgetMode === "NEGOTIABLE") {
    budgetLabel = isTr ? "Pazarlığa Açık" : "Negotiable";
  } else if (item.budgetMode === "OPEN_OFFER" || item.budgetMode === "UNSPECIFIED") {
    budgetLabel = isTr ? "Teklif Usulü" : "Open to proposals";
  }

  // Timeline formatting
  let timelineLabel = isTr ? "Esnek Süre" : "Flexible";
  if (item.targetDate) {
    const tDate = new Date(item.targetDate);
    timelineLabel = new Intl.DateTimeFormat(isTr ? "tr-TR" : "en-US", {
      month: "short",
      day: "numeric",
    }).format(tDate);
  } else if (item.timelineValue && item.timelineUnit) {
    const unitMap: Record<string, string> = {
      DAYS: isTr ? "Gün" : "Days",
      WEEKS: isTr ? "Hafta" : "Weeks",
      MONTHS: isTr ? "Ay" : "Months",
    };
    timelineLabel = `${item.timelineValue} ${unitMap[item.timelineUnit] || item.timelineUnit}`;
  }

  const listingHref = isTr ? `/tr/ilanlar/${item.slug}` : `/en/listings/${item.slug}`;

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const shareUrl = `${window.location.origin}${listingHref}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <article className="group relative p-4 sm:p-5 transition-colors hover:bg-white/[0.02] [content-visibility:auto] [contain-intrinsic-size:0_140px]">
      <div className="flex items-start gap-3 sm:gap-3.5">
        {/* Left Column: Author Avatar */}
        <div className="shrink-0 mt-0.5">
          <AvatarInitials
            name={item.ownerDisplayName || "Operis"}
            size="md"
            className="h-10 w-10 sm:h-11 sm:w-11 ring-1 ring-[var(--color-border-subtle)]"
          />
        </div>

        {/* Right Column: Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Top Row: Author, Handle, Time, Category & Freshness */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs min-w-0 flex-wrap">
              <span className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
                {item.ownerDisplayName}
              </span>
              {item.ownerIsCompanyVerified && (
                <VerifiedCompanyBadge
                  size="xs"
                  companyName={item.ownerCompanyName}
                  taxOffice={item.ownerTaxOffice}
                  vknMasked={item.ownerVknMasked}
                  companyType={item.ownerCompanyType}
                  isEn={!isTr}
                />
              )}
              <span className="text-[var(--color-text-tertiary)] truncate">
                @{item.ownerHandle}
              </span>
              <span className="text-[var(--color-text-tertiary)]">·</span>
              <span className="text-[var(--color-text-tertiary)]">
                {formatRelativeTime(item.lastActivatedAt ?? item.firstPublishedAt, isTr)}
              </span>
              <span className="text-[var(--color-text-tertiary)]">·</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/10 text-sky-400 border border-blue-500/20">
                {item.categoryName}
              </span>
              <HiringIntentBadge
                score={intentBreakdown.overallScore}
                level={intentBreakdown.level}
                breakdown={intentBreakdown}
                compact={true}
                locale={locale}
                onClick={() => setIsIntentModalOpen(true)}
              />
            </div>

            {/* Freshness indicator */}
            <div className="flex items-center gap-1.5 text-xs shrink-0" title={freshnessText}>
              <span className={`h-2 w-2 rounded-full ${freshnessDot}`} />
              <span className={`text-[11px] font-medium ${freshnessColor}`}>{freshnessText}</span>
            </div>
          </div>

          {/* Title & Summary */}
          <div className="space-y-1">
            <Link href={listingHref} className="block group/link">
              <h2 className="text-base font-bold text-[var(--color-text-primary)] group-hover/link:text-blue-400 transition-colors leading-snug">
                {item.title}
              </h2>
            </Link>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
              {item.summary}
            </p>
          </div>

          {/* Metadata Chips: Budget, Timeline & Tags */}
          <div className="flex items-center gap-2 flex-wrap pt-0.5 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-surface/80 border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] font-semibold text-xs shadow-2xs">
              <span>{budgetLabel}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-surface/50 border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] text-xs">
              <span>{timelineLabel}</span>
            </span>

            {item.tags && item.tags.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
                {item.tags.slice(0, 4).map((tag, idx) => (
                  <span key={idx} className="hover:text-sky-400 transition-colors cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/90 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              <span>{isTr ? "Doğrudan & Komisyonsuz" : "Direct & Zero Fee"}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-surface/80 hover:text-[var(--color-text-primary)] transition-all cursor-pointer text-xs"
                title={isTr ? "İlan bağlantısını kopyala" : "Copy link"}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">{isTr ? "Kopyalandı" : "Copied"}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" />
                    <span>{isTr ? "Paylaş" : "Share"}</span>
                  </>
                )}
              </button>

              {onQuickOffer && diffMs > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    onQuickOffer({
                      id: item.id,
                      slug: item.slug,
                      title: item.title,
                      categoryName: item.categoryName,
                      budgetMin: item.budgetMin,
                      budgetMax: item.budgetMax,
                      budgetCurrency: item.budgetCurrency,
                      ownerDisplayName: item.ownerDisplayName,
                    })
                  }
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30 transition-all cursor-pointer shadow-2xs"
                >
                  <Zap className="h-3 w-3" />
                  <span>{isTr ? "Hızlı Teklif Ver" : "Quick Offer"}</span>
                </button>
              )}

              <Link
                href={listingHref}
                className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--color-text-tertiary)] hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
              >
                <span>{isTr ? "İncele" : "View"}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <HiringIntentModal
        isOpen={isIntentModalOpen}
        onClose={() => setIsIntentModalOpen(false)}
        breakdown={intentBreakdown}
        listingTitle={item.title}
        locale={locale}
      />
    </article>
  );
});
