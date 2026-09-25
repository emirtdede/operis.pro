import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import {
  Clock,
  Calendar,
  Layers,
  ArrowLeft,
  Lock,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { FeedService } from "@/src/modules/listings/feed/service";
import { ListingService } from "@/src/modules/listings/service";
import { getSession } from "@/src/modules/auth/session";
import { AvatarInitials } from "@/src/components/ui/avatar-initials";
import { Badge } from "@/src/components/ui/badge";
import { VerifiedCompanyBadge } from "@/src/components/ui/verified-company-badge";
import { ListingDetailActions } from "@/src/components/listings/listing-detail-actions";
import { HiringIntentBadge } from "@/src/components/listings/hiring-intent-badge";
import { HiringIntentService } from "@/src/modules/listings/hiring-intent/hiring-intent-service";
import {
  getLocalizedListingPath,
  getLocalizedProfilePath,
  getLocalizedRoute,
} from "@/src/lib/i18n/routes";
import { JsonLd } from "@/src/components/seo/json-ld";
import { formatBudgetRange } from "@/src/lib/format/budget";
import { getBaseUrl } from "@/src/lib/config/url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const isTr = locale === "tr";
  const data = await FeedService.getListingBySlug(slug, undefined, undefined, locale);

  if (!data) {
    return {
      title: isTr ? "İlan Bulunamadı" : "Listing Not Found",
    };
  }

  const { listing } = data;
  const now = new Date();
  const until = listing.activeUntil ? new Date(listing.activeUntil) : null;
  const isCurrentlyActive =
    listing.status === "ACTIVE" && until !== null && until.getTime() > now.getTime();

  if (!isCurrentlyActive) {
    return {
      title: isTr ? "İlan Bulunamadı" : "Listing Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = listing.title;
  const description = listing.summary;

  return {
    title,
    description,
    alternates: {
      canonical: getLocalizedListingPath(slug, locale),
      languages: {
        tr: getLocalizedListingPath(slug, "tr"),
        en: getLocalizedListingPath(slug, "en"),
      },
    },
    openGraph: {
      title,
      description,
      url: getLocalizedListingPath(slug, locale),
      siteName: "Operis",
      locale: isTr ? "tr_TR" : "en_US",
      type: "article",
      publishedTime: listing.firstPublishedAt?.toISOString(),
      expirationTime: listing.activeUntil?.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: listing.status === "ACTIVE",
      follow: true,
    },
  };
}

export const dynamic = "force-dynamic";

function getTimelineUnitLabel(unit: string, isTr: boolean): string {
  if (unit === "DAYS") {
    return isTr ? "gün" : "days";
  }
  if (unit === "WEEKS") {
    return isTr ? "hafta" : "weeks";
  }
  return isTr ? "ay" : "months";
}

function getActiveStatusBadgeText(isActive: boolean, diffDays: number, isTr: boolean): string {
  if (isActive) {
    return isTr ? `${diffDays} gün aktif` : `Active for ${diffDays} days`;
  }
  return isTr ? "Süresi doldu" : "Expired";
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const isTr = locale === "tr";
  const session = await getSession();
  const data = await FeedService.getListingBySlug(slug, session?.userId, session?.role, locale);

  if (!data) {
    notFound();
  }

  const { listing, category, categoryName, ownerProfile } = data;
  const categoryDisplayName = categoryName || category.key;
  const isOwner = Boolean(session?.userId && session.userId === listing.ownerUserId);

  // Calculate remaining days
  const now = new Date();
  const until = listing.activeUntil ? new Date(listing.activeUntil) : null;
  const isCurrentlyActive =
    listing.status === "ACTIVE" && until !== null && until.getTime() > now.getTime();

  // Deleted listings must never be rendered; non-owners cannot view non-active or expired listings
  if (listing.status === "DELETED" || (!isOwner && !isCurrentlyActive)) {
    notFound();
  }

  // Increment view count asynchronously only for valid active views by non-owners
  if (isCurrentlyActive && !isOwner) {
    ListingService.incrementListingViews(listing.id).catch(() => {});
  }

  const diffDays = until
    ? Math.max(0, Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const hiringIntent = await HiringIntentService.getListingHiringIntent(listing.id, locale);

  // Format first published date
  const firstDate = listing.firstPublishedAt
    ? new Date(listing.firstPublishedAt)
    : new Date(listing.createdAt);
  const formattedFirstDate = new Intl.DateTimeFormat(isTr ? "tr-TR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(firstDate);

  // Format budget
  let budgetLabel: string;
  if (listing.budgetMode === "NEGOTIABLE" && !listing.budgetMin && !listing.budgetMax) {
    budgetLabel = isTr ? "Görüşülebilir" : "Negotiable";
  } else {
    budgetLabel = formatBudgetRange(listing.budgetMin, listing.budgetMax, listing.budgetCurrency, isTr);
  }

  // Format timeline
  let timelineLabel: string | null = null;
  if (listing.timelineValue && listing.timelineUnit) {
    const unitLabel = getTimelineUnitLabel(listing.timelineUnit, isTr);
    timelineLabel = `~${listing.timelineValue} ${unitLabel}`;
  }

  const baseUrl = getBaseUrl();
  const localizedProfilePath = getLocalizedProfilePath(ownerProfile.handle, locale);
  const localizedListingUrl = `${baseUrl}${getLocalizedListingPath(slug, locale)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "JobPosting",
        title: listing.title,
        description: listing.scope || listing.summary,
        datePosted:
          listing.firstPublishedAt?.toISOString() || new Date(listing.createdAt).toISOString(),
        validThrough: listing.activeUntil?.toISOString(),
        employmentType: "CONTRACTOR",
        hiringOrganization: {
          "@type": "Organization",
          name: ownerProfile.displayName,
          sameAs: `${baseUrl}${localizedProfilePath}`,
        },
        jobLocationType: "TELECOMMUTE",
        baseSalary: listing.budgetMin
          ? {
              "@type": "MonetaryAmount",
              currency: listing.budgetCurrency || "TRY",
              value: {
                "@type": "QuantitativeValue",
                minValue: parseFloat(listing.budgetMin),
                maxValue: listing.budgetMax ? parseFloat(listing.budgetMax) : undefined,
                unitText: "PROJECT",
              },
            }
          : undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: isTr ? "Ana Sayfa" : "Home",
            item: `${baseUrl}/${locale}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: isTr ? "İlanlar" : "Listings",
            item: `${baseUrl}${getLocalizedRoute("listings", locale)}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: listing.title,
            item: localizedListingUrl,
          },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Schema.org Structured Data */}
      <JsonLd data={jsonLd} />

      {/* Navigation Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]"
      >
        <Link
          href={getLocalizedRoute("listings", locale)}
          className="inline-flex items-center gap-1 hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{isTr ? "Tüm İlanlara Dön" : "Back to Listings"}</span>
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[var(--color-text-secondary)] font-medium">{categoryDisplayName}</span>
      </nav>

      {/* Mobile Quick Overview & Action Strip (< 1024px) */}
      <div className="lg:hidden rounded-2xl sm:rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/90 p-4 sm:p-5 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div>
            <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold tracking-wider block">
              {isTr ? "İlan Bütçesi" : "Listing Budget"}
            </span>
            <span className="font-mono text-xl sm:text-2xl font-extrabold text-emerald-400 block">
              {budgetLabel}
            </span>
          </div>
          <div className="border-l border-[var(--color-border-subtle)] pl-4">
            <span className="text-[10px] text-[var(--color-text-tertiary)] block">
              {isTr ? "Tahmini Süre" : "Duration"}
            </span>
            <span className="font-semibold text-xs text-[var(--color-text-primary)] flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3 text-cyan-400" />
              <span>{timelineLabel ?? (isTr ? "Esnek" : "Flexible")}</span>
            </span>
          </div>
        </div>

        <a
          href="#listing-action-card"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <span>{isTr ? "Hemen Teklif Ver" : "Submit Proposal"}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* 2-Column Responsive Layout: Left Sidebar (Actions & Trust) + Right Main Document */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Sticky Sidebar (Col 4 on lg) - PANELS MOVED TO LEFT */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-20 order-2 lg:order-1">
          {/* Card 1: Key Metrics & Action Card */}
          <div id="listing-action-card" className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-5">
            <div className="space-y-3 border-b border-[var(--color-border-subtle)] pb-4">
              <div className="space-y-1">
                <span className="text-[11px] text-[var(--color-text-tertiary)] uppercase font-semibold tracking-wider block">
                  {isTr ? "İlan Bütçesi" : "Listing Budget"}
                </span>
                <span className="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-400 block">
                  {budgetLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div>
                  <span className="text-[var(--color-text-tertiary)] block text-[11px]">
                    {isTr ? "Tahmini Süre" : "Duration"}
                  </span>
                  <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>{timelineLabel ?? (isTr ? "Belirtilmedi" : "Flexible")}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-tertiary)] block text-[11px]">
                    {isTr ? "Yayım Tarihi" : "Published"}
                  </span>
                  <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5 mt-0.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{formattedFirstDate}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-1">
              <ListingDetailActions
                listingId={listing.id}
                listingSlug={slug}
                listingTitle={listing.title}
                categoryName={categoryDisplayName}
                budgetMin={listing.budgetMin}
                budgetMax={listing.budgetMax}
                budgetCurrency={listing.budgetCurrency}
                ownerDisplayName={ownerProfile.displayName}
                ownerUserId={listing.ownerUserId}
                currentUserId={session?.userId}
                isOwner={isOwner}
                isActive={isCurrentlyActive}
                locale={locale}
              />
            </div>

            <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{isTr ? "%0 Komisyon & Şifreli" : "0% Fee & Encrypted"}</span>
              </span>
              <span className="text-[var(--color-text-tertiary)] font-normal">
                {isTr ? "Doğrudan Anlaşma" : "Direct Deal"}
              </span>
            </div>
          </div>

          {/* Card 2: Unified Employer & Trust Intelligence Card */}
          <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-5 sm:p-6 backdrop-blur-xl shadow-sm space-y-4 text-xs">
            {/* Employer Section */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                {isTr ? "İlan Sahibi" : "Posted By"}
              </div>
              <Link
                href={getLocalizedProfilePath(ownerProfile.handle, locale)}
                className="flex items-center gap-3 group"
              >
                <AvatarInitials name={ownerProfile.displayName} size="md" />
                <div className="space-y-0.5 truncate">
                  <div className="font-bold text-sm text-[var(--color-text-primary)] group-hover:text-blue-400 transition-colors truncate">
                    {ownerProfile.displayName}
                  </div>
                  <div className="font-mono text-xs text-blue-400">@{ownerProfile.handle}</div>
                </div>
              </Link>

              {ownerProfile.isCompanyVerified && (
                <div className="pt-2 border-t border-[var(--color-border-subtle)]/70">
                  <VerifiedCompanyBadge
                    size="sm"
                    companyName={ownerProfile.companyName}
                    taxOffice={ownerProfile.taxOffice}
                    vknMasked={ownerProfile.vknMasked}
                    companyType={ownerProfile.companyType}
                    isEn={!isTr}
                  />
                </div>
              )}
            </div>

            {/* Hiring Intent Breakdown */}
            <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] block">
                    {isTr ? "İşe Alım Niyet Endeksi" : "Hiring Intent Index"}
                  </span>
                  <span className="font-bold text-xs text-[var(--color-text-primary)]">
                    {isTr ? hiringIntent.badgeLabelTr : hiringIntent.badgeLabelEn}
                  </span>
                </div>
                <span className="text-xl font-black font-mono text-emerald-400">
                  %{hiringIntent.overallScore}
                </span>
              </div>

              <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                {isTr ? hiringIntent.summaryTr : hiringIntent.summaryEn}
              </p>

              {/* Pillar Breakdown Meters */}
              <div className="space-y-2 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[var(--color-text-secondary)]">
                    <span>{isTr ? "Kurumsal & VKN Doğrulama" : "Corporate Tax Verification"}</span>
                    <span className="font-mono font-bold">{hiringIntent.pillars.CORPORATE_VERIFICATION.score}/30</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(hiringIntent.pillars.CORPORATE_VERIFICATION.score / 30) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[var(--color-text-secondary)]">
                    <span>{isTr ? "Piyasa Benchmark Uyumu" : "Market Benchmark Alignment"}</span>
                    <span className="font-mono font-bold">{hiringIntent.pillars.BUDGET_BENCHMARK.score}/25</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${(hiringIntent.pillars.BUDGET_BENCHMARK.score / 25) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[var(--color-text-secondary)]">
                    <span>{isTr ? "Teknik Kapsam & Şartname" : "Scope & Specification"}</span>
                    <span className="font-mono font-bold">{hiringIntent.pillars.SCOPE_CLARITY.score}/25</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${(hiringIntent.pillars.SCOPE_CLARITY.score / 25) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[var(--color-text-secondary)]">
                    <span>{isTr ? "İşe Alım Güvenilirliği" : "Hiring Reliability"}</span>
                    <span className="font-mono font-bold">{hiringIntent.pillars.HISTORICAL_RELIABILITY.score}/20</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${(hiringIntent.pillars.HISTORICAL_RELIABILITY.score / 20) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Specialist Guidance Tip (Clean SVG Lightbulb, NO emoji) */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-[11px] text-[var(--color-text-secondary)] leading-relaxed flex items-start gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-blue-400 block mb-0.5">
                    {isTr ? "Uzman Tavsiyesi:" : "Specialist Tip:"}
                  </strong>
                  <span>{isTr ? hiringIntent.freelancerGuidanceTr : hiringIntent.freelancerGuidanceEn}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Content (Col 8 on lg) - UNIFIED CLEAN DOCUMENT (FEWER BOXES) */}
        <div className="lg:col-span-8 min-w-0 order-1 lg:order-2">
          <article className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-6 sm:p-8 lg:p-10 shadow-xl space-y-8">
            {/* Header: Badges & Title & Summary */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    size="md"
                    className="font-medium bg-blue-500/10 text-blue-400 border-blue-500/20"
                  >
                    {categoryDisplayName}
                  </Badge>
                  <HiringIntentBadge
                    score={hiringIntent.overallScore}
                    level={hiringIntent.level}
                    breakdown={hiringIntent}
                    locale={locale}
                  />
                </div>

                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-cyan-400 font-medium">
                    <span
                      className={`h-2 w-2 rounded-full ${isCurrentlyActive ? "bg-cyan-400 animate-pulse" : "bg-red-500"}`}
                    />
                    <span>{getActiveStatusBadgeText(isCurrentlyActive, diffDays, isTr)}</span>
                  </div>

                  {listing.activationSeq > 1 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400 border border-indigo-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {isTr
                          ? `${listing.activationSeq}. Yayım Döngüsü`
                          : `Cycle #${listing.activationSeq}`}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Summary */}
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-tight">
                  {listing.title}
                </h1>
                <p className="text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed font-normal">
                  {listing.summary}
                </p>
              </div>
            </div>

            {/* Scope / Technical Requirements (Unified flow, NO extra outer box) */}
            <div className="pt-6 border-t border-[var(--color-border-subtle)] space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                <Layers className="h-4 w-4 text-blue-400" aria-hidden="true" />
                <span>
                  {isTr
                    ? "İlan Kapsamı ve Teknik Gereksinimler"
                    : "Listing Scope & Technical Requirements"}
                </span>
              </div>
              <div className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap font-sans">
                {listing.scope}
              </div>
            </div>

            {/* Skills & Technologies (Integrated pill tags) */}
            {listing.tags && listing.tags.length > 0 && (
              <div className="pt-6 border-t border-[var(--color-border-subtle)] space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  {isTr ? "İlgili Teknolojiler ve Beceriler" : "Relevant Tech Stack & Skills"}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] px-3.5 py-1.5 text-xs font-medium text-[var(--color-text-primary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Proposal Guidance: Sleek 3-Step Banner (NOT chunky floating boxes) */}
            <div className="pt-6 border-t border-[var(--color-border-subtle)] space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                <ShieldCheck className="h-4 w-4 text-blue-400" aria-hidden="true" />
                <span>
                  {isTr
                    ? "Bu İlana Teklif Verirken Nelere Dikkat Edilmeli?"
                    : "Guidelines for Submitting a Proposal"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[var(--color-text-secondary)]">
                <div className="p-3.5 rounded-2xl bg-[var(--color-surface-hover)]/40 border border-[var(--color-border-subtle)]/70 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-bold">1</span>
                    <span>{isTr ? "Birebir Gizlilik" : "Confidentiality"}</span>
                  </div>
                  <p className="leading-relaxed">
                    {isTr
                      ? "Teklifiniz rakiplere kapalıdır; doğrudan ilan sahibine iletilir."
                      : "Your proposal is encrypted and viewed solely by the client."}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--color-surface-hover)]/40 border border-[var(--color-border-subtle)]/70 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400 text-[10px] font-bold">2</span>
                    <span>{isTr ? "Net Zaman & Bütçe" : "Milestones"}</span>
                  </div>
                  <p className="leading-relaxed">
                    {isTr
                      ? "Teklifinizde teknik yaklaşımınızı ve tahmini aşamaları kısaca özetleyin."
                      : "Outline your technical architecture and delivery timeline."}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--color-surface-hover)]/40 border border-[var(--color-border-subtle)]/70 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">3</span>
                    <span>{isTr ? "%0 Komisyon" : "0% Fee"}</span>
                  </div>
                  <p className="leading-relaxed">
                    {isTr
                      ? "Eşleştiğinizde doğrudan iletişim kurulur; kesinti yapılmaz."
                      : "Direct connection with no platform cut or middleman fees."}
                  </p>
                </div>
              </div>
            </div>

            {/* Legal Transparency Note (Sleek 1-line footer) */}
            <div className="pt-4 border-t border-[var(--color-border-subtle)]/60 flex items-start gap-2.5 text-[11px] text-[var(--color-text-tertiary)] leading-relaxed">
              <Lock className="h-3.5 w-3.5 shrink-0 text-blue-400 mt-0.5" />
              <p>
                {isTr
                  ? "Teklifleriniz uçtan uca şifrelenir ve yalnızca ilan sahibi tarafından incelenir. Operis komisyonsuz doğrudan iş birliği sağlar; ticari müzakere taraflar arasındadır."
                  : "Proposals are encrypted end-to-end and viewed solely by the client. Operis facilitates direct 0% commission collaboration without intermediary escrow."}
              </p>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
