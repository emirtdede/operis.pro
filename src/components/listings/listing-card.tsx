import Link from "next/link";
import {
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Zap,
  CheckSquare,
  Square,
} from "lucide-react";
import { AvatarInitials } from "../ui/avatar-initials";
import { Badge } from "../ui/badge";

export interface ListingCardProps {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categoryName: string;
  budgetMode: string;
  budgetCurrency: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  timelineMode: string;
  targetDate: string | null;
  timelineValue: number | null;
  timelineUnit: string | null;
  ownerHandle: string;
  ownerDisplayName: string;
  firstPublishedAt: Date | string;
  lastActivatedAt: Date | string;
  activeUntil: Date | string;
  activationSeq: number;
  viewCount?: number;
  clickCount?: number;
  locale: string;
  // Batch and Quick offer enhancements
  isBatchMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onQuickOffer?: (listing: {
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

export function ListingCard({
  id,
  slug,
  title,
  summary,
  categoryName,
  budgetMode,
  budgetCurrency,
  budgetMin,
  budgetMax,
  timelineValue,
  timelineUnit,
  ownerHandle,
  ownerDisplayName,
  firstPublishedAt,
  activeUntil,
  activationSeq,
  viewCount: _viewCount = 0,
  clickCount: _clickCount = 0,
  locale,
  isBatchMode,
  isSelected,
  onToggleSelect,
  onQuickOffer,
}: ListingCardProps) {
  const isTr = locale === "tr";

  // Calculate remaining active time & Freshness Radar
  const now = new Date();
  const until = new Date(activeUntil);
  const diffMs = until.getTime() - now.getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  let freshnessColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  let dotColor = "bg-emerald-500";
  let freshnessText = isTr ? `${diffDays} gün kaldı (Yeni)` : `${diffDays}d left (New)`;

  if (diffMs <= 0) {
    freshnessColor = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    dotColor = "bg-zinc-500";
    freshnessText = isTr ? "Süresi doldu" : "Expired";
  } else if (diffHours <= 24) {
    freshnessColor = "bg-rose-500/10 text-rose-400 border-rose-500/25 animate-pulse";
    dotColor = "bg-rose-500";
    freshnessText = isTr ? `Son ${Math.max(1, diffHours)} saat` : `Last ${Math.max(1, diffHours)}h`;
  } else if (diffDays <= 3) {
    freshnessColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    dotColor = "bg-amber-500";
    freshnessText = isTr ? `${diffDays} gün kaldı` : `${diffDays} days left`;
  }

  // Format first published date
  const firstDate = new Date(firstPublishedAt);
  const formattedFirstDate = new Intl.DateTimeFormat(isTr ? "tr-TR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(firstDate);

  // Budget label formatting
  let budgetLabel = isTr ? "Belirtilmedi" : "Not specified";
  if (budgetMin && budgetMax) {
    budgetLabel = `${parseFloat(budgetMin).toLocaleString(isTr ? "tr-TR" : "en-US")} – ${parseFloat(budgetMax).toLocaleString(isTr ? "tr-TR" : "en-US")} ${budgetCurrency ?? ""}`;
  } else if (budgetMin) {
    budgetLabel = `${isTr ? "Min" : "From"} ${parseFloat(budgetMin).toLocaleString(isTr ? "tr-TR" : "en-US")} ${budgetCurrency ?? ""}`;
  } else if (budgetMode === "NEGOTIABLE") {
    budgetLabel = isTr ? "Görüşülebilir" : "Negotiable";
  }

  // Timeline label formatting
  let timelineLabel: string | null = null;
  if (timelineValue && timelineUnit) {
    const unitLabel =
      timelineUnit === "DAYS"
        ? isTr
          ? "gün"
          : "days"
        : timelineUnit === "WEEKS"
          ? isTr
            ? "hafta"
            : "weeks"
          : isTr
            ? "ay"
            : "months";
    timelineLabel = `~${timelineValue} ${unitLabel}`;
  }

  const handleCardClick = () => {
    try {
      fetch(`/api/listings/${id}/track?action=click`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Ignore background analytics errors
    }
  };

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/5 ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-500/30 bg-blue-500/5"
          : "border-[var(--color-border-subtle)] bg-surface/75 hover:border-blue-500/40"
      }`}
    >
      <div className="flex flex-col gap-4">
        {/* Top Header: Category Badge, Batch Checkbox & Freshness Indicator */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {isBatchMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (diffDays > 0 && onToggleSelect) onToggleSelect(id);
                }}
                disabled={diffDays <= 0}
                className={`relative z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  isSelected
                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/25"
                    : diffDays <= 0
                      ? "opacity-50 cursor-not-allowed bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]"
                      : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]"
                }`}
                title={
                  diffDays <= 0
                    ? isTr
                      ? "Süresi dolmuş ilana toplu teklif verilemez"
                      : "Cannot select expired listing"
                    : undefined
                }
              >
                {isSelected ? (
                  <CheckSquare className="h-3.5 w-3.5" />
                ) : (
                  <Square className="h-3.5 w-3.5" />
                )}
                <span>
                  {isSelected ? (isTr ? "Seçildi" : "Selected") : isTr ? "Seç" : "Select"}
                </span>
              </button>
            )}

            <Badge
              variant="secondary"
              className="font-semibold bg-blue-500/15 text-blue-700 dark:text-sky-300 border-blue-500/25 shadow-2xs"
            >
              {categoryName}
            </Badge>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${freshnessColor}`}
          >
            <span className={`h-2 w-2 rounded-full ${dotColor} shrink-0`} />
            <span>{freshnessText}</span>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold leading-snug text-[var(--color-text-primary)] group-hover:text-blue-400 transition-colors">
            <Link
              href={isTr ? `/tr/ilanlar/${slug}` : `/en/listings/${slug}`}
              onClick={handleCardClick}
              className="focus:outline-none"
            >
              <span className="absolute inset-0" aria-hidden="true" />
              {title}
            </Link>
          </h3>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>

        {/* Summary Description */}
        <p className="line-clamp-2 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {summary}
        </p>

        {/* Commercial Metadata Badges & Quick Offer Trigger */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs pt-1">
          <div className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-surface-hover)] px-3 py-1.5 text-[var(--color-text-primary)] font-mono font-medium">
            <span className="text-[var(--color-text-tertiary)] font-sans">
              {isTr ? "Bütçe:" : "Budget:"}
            </span>
            <span className="text-emerald-400">{budgetLabel}</span>
          </div>

          {timelineLabel && (
            <div className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-surface-hover)] px-3 py-1.5 text-[var(--color-text-secondary)]">
              <Clock className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
              <span>{timelineLabel}</span>
            </div>
          )}

          {/* Quick Offer Button */}
          {onQuickOffer && diffDays > 0 && !isBatchMode && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickOffer({
                  id,
                  slug,
                  title,
                  categoryName,
                  budgetMin,
                  budgetMax,
                  budgetCurrency,
                  ownerDisplayName,
                });
              }}
              className="relative z-20 ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer shadow-sm group/quick"
              title={isTr ? "1-Tıkla Hızlı Teklif Gönder" : "Send 1-Click Quick Proposal"}
            >
              <Zap className="h-3.5 w-3.5 fill-amber-500" />
              <span>{isTr ? "Hızlı Teklif" : "Quick Offer"}</span>
            </button>
          )}
        </div>

        {/* Footer: Owner info & first published date */}
        <div className="relative z-10 mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border-subtle)]/60 pt-4 text-xs text-[var(--color-text-secondary)]">
          <Link
            href={isTr ? `/tr/profil/${ownerHandle}` : `/en/profile/${ownerHandle}`}
            className="flex items-center gap-2.5 hover:text-[var(--color-text-primary)] transition-colors"
          >
            <AvatarInitials name={ownerDisplayName} size="sm" />
            <span className="font-semibold text-[var(--color-text-primary)]">
              {ownerDisplayName}
            </span>
          </Link>

          <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
            <span>
              {isTr ? "İlk yayım:" : "Published:"} {formattedFirstDate}
            </span>
            {activationSeq > 1 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400 border border-indigo-500/20">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                <span>{isTr ? "Yenilendi" : "Reactivated"}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
