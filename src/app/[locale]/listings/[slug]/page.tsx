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
  Eye,
  MousePointerClick,
  ArrowRight,
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
import { serializeJsonLd } from "@/src/lib/security/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const isTr = locale === "tr";
  const data = await FeedService.getListingBySlug(slug);

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

  const title = isTr ? `${listing.title} — İlan Detayı` : `${listing.title} — Listing Details`;
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
  const data = await FeedService.getListingBySlug(slug, session?.userId, session?.role);

  if (!data) {
    notFound();
  }

  const { listing, category, ownerProfile } = data;
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

  const viewCount = (listing.viewCount ?? 0) + (isCurrentlyActive && !isOwner ? 1 : 0);
  const clickCount = listing.clickCount ?? 0;
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
  let budgetLabel = isTr ? "Belirtilmedi" : "Not specified";
  if (listing.budgetMin && listing.budgetMax) {
    budgetLabel = `${parseFloat(listing.budgetMin).toLocaleString(isTr ? "tr-TR" : "en-US")} – ${parseFloat(listing.budgetMax).toLocaleString(isTr ? "tr-TR" : "en-US")} ${listing.budgetCurrency ?? ""}`;
  } else if (listing.budgetMin) {
    budgetLabel = `${isTr ? "Min" : "From"} ${parseFloat(listing.budgetMin).toLocaleString(isTr ? "tr-TR" : "en-US")} ${listing.budgetCurrency ?? ""}`;
  } else if (listing.budgetMode === "NEGOTIABLE") {
    budgetLabel = isTr ? "Görüşülebilir" : "Negotiable";
  }

  // Format timeline
  let timelineLabel: string | null = null;
  if (listing.timelineValue && listing.timelineUnit) {
    const unitLabel = getTimelineUnitLabel(listing.timelineUnit, isTr);
    timelineLabel = `~${listing.timelineValue} ${unitLabel}`;
  }

  const localizedProfilePath = getLocalizedProfilePath(ownerProfile.handle, locale);
  const localizedListingUrl = `https://operis.pro${getLocalizedListingPath(slug, locale)}`;

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
          sameAs: `https://operis.pro${localizedProfilePath}`,
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
            item: `https://operis.pro/${locale}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: isTr ? "İlanlar" : "Listings",
            item: `https://operis.pro${getLocalizedRoute("listings", locale)}`,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

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
        <span className="text-[var(--color-text-secondary)] font-medium">{category.key}</span>
      </nav>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Main Content (Col 8) */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
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

          {/* Header Card: Title, Status, Summary */}
          <article className="relative overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-4 sm:p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  size="md"
                  className="font-medium bg-blue-500/10 text-blue-400 border-blue-500/20"
                >
                  {category.key}
                </Badge>
                <HiringIntentBadge
                  score={hiringIntent.overallScore}
                  level={hiringIntent.level}
                  breakdown={hiringIntent}
                  locale={locale}
                />
              </div>

              <div className="flex items-center gap-3 text-xs">
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

                {/* View and Click Count Badges */}
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] px-3 py-1 text-xs text-[var(--color-text-secondary)] font-medium">
                  <span
                    className="flex items-center gap-1"
                    title={isTr ? `${viewCount} Görüntülenme` : `${viewCount} Views`}
                  >
                    <Eye className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                    <span>{viewCount}</span>
                  </span>
                  <span className="text-[var(--color-border-strong)] opacity-60" aria-hidden="true">
                    |
                  </span>
                  <span
                    className="flex items-center gap-1"
                    title={isTr ? `${clickCount} Tıklanma` : `${clickCount} Clicks`}
                  >
                    <MousePointerClick
                      className="h-3.5 w-3.5 text-emerald-400"
                      aria-hidden="true"
                    />
                    <span>{clickCount}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-tight">
                {listing.title}
              </h1>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
                {listing.summary}
              </p>
            </div>
          </article>

          {/* Scope / Requirements Section */}
          <section className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 p-6 sm:p-8 backdrop-blur-xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              <Layers className="h-4 w-4 text-blue-500" aria-hidden="true" />
              <span>
                {isTr
                  ? "İlan Kapsamı ve Teknik Gereksinimler"
                  : "Listing Scope & Technical Requirements"}
              </span>
            </div>
            <div className="prose prose-sm max-w-none text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
              {listing.scope}
            </div>
          </section>

          {/* Technologies & Tags */}
          {listing.tags && listing.tags.length > 0 && (
            <section className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 p-6 sm:p-8 backdrop-blur-xl space-y-3 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
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
            </section>
          )}

          {/* Proposal Guidance for Specialists */}
          <section
            aria-label={isTr ? "Teklif Rehberi" : "Proposal Guide"}
            className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl"
          >
            <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative z-10 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  {isTr
                    ? "Bu İlana Teklif Verirken Nelere Dikkat Edilmeli?"
                    : "Guidelines for Submitting a Winning Proposal"}
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {isTr
                    ? "Başarılı ve kesintisiz iş birlikleri için önerilen adımlar"
                    : "Best practices for high-impact proposals"}
                </p>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-[var(--color-text-secondary)] leading-relaxed">
              <div className="p-4 rounded-2xl bg-[var(--color-surface-base)]/80 border border-[var(--color-border-subtle)] backdrop-blur-md space-y-2">
                <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold">
                    1
                  </span>
                  <span>{isTr ? "Birebir Gizlilik" : "Confidentiality"}</span>
                </div>
                <p>
                  {isTr
                    ? "Teklifiniz rakiplere kapalıdır; doğrudan ilan sahibine iletilir."
                    : "Your proposal is encrypted and viewed solely by the client."}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--color-surface-base)]/80 border border-[var(--color-border-subtle)] backdrop-blur-md space-y-2">
                <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold">
                    2
                  </span>
                  <span>{isTr ? "Net Zaman & Bütçe" : "Milestones"}</span>
                </div>
                <p>
                  {isTr
                    ? "Teklifinizde teknik yaklaşımınızı ve tahmini aşamaları kısaca özetleyin."
                    : "Outline your technical architecture and delivery timeline."}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--color-surface-base)]/80 border border-[var(--color-border-subtle)] backdrop-blur-md space-y-2">
                <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                    3
                  </span>
                  <span>{isTr ? "%0 Komisyon" : "0% Fee"}</span>
                </div>
                <p>
                  {isTr
                    ? "Eşleştiğinizde doğrudan iletişim kurulur; kesinti yapılmaz."
                    : "Direct connection with no platform cut or middleman fees."}
                </p>
              </div>
            </div>
          </section>

          {/* Privacy & Legal Transparency Box */}
          <aside className="relative overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/60 p-5 sm:p-6 text-xs text-[var(--color-text-tertiary)] leading-relaxed flex items-start gap-3 backdrop-blur-xl shadow-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <p className="mt-0.5">
              {isTr
                ? "Yürürlükteki mevzuatın izin verdiği azami ölçüde, bu platform üzerinden verilen teklifler AES-256-GCM ile şifrelenir ve yalnızca ilan sahibi tarafından incelenir. Platform ödeme garantisi, emanet veya aracılık hizmeti vermez; tüm ticari müzakere doğrudan taraflar arasındadır."
                : "To the maximum extent permitted by applicable law, proposals submitted on this platform are encrypted via AES-256-GCM and viewed solely by the project owner. The platform does not hold escrow or process payments."}
            </p>
          </aside>
        </div>

        {/* Right Sticky Sidebar (Col 4) */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          {/* Key Metrics & Action Card */}
          <div id="listing-action-card" className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-5">
            <div className="space-y-3 border-b border-[var(--color-border-subtle)] pb-4">
              <div className="space-y-1">
                <span className="text-[11px] text-[var(--color-text-tertiary)] uppercase font-semibold tracking-wider block">
                  {isTr ? "İlan Bütçesi" : "Listing Budget"}
                </span>
                <span className="font-mono text-2xl font-extrabold text-emerald-400 block">
                  {budgetLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div>
                  <span className="text-[var(--color-text-tertiary)] block text-[11px]">
                    {isTr ? "Tahmini Süre" : "Duration"}
                  </span>
                  <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1 mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{timelineLabel ?? (isTr ? "Belirtilmedi" : "Flexible")}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-tertiary)] block text-[11px]">
                    {isTr ? "Yayım Tarihi" : "Published"}
                  </span>
                  <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-400" />
                    <span className="truncate">{formattedFirstDate}</span>
                  </span>
                </div>
              </div>

              {/* Engagement Stats: Views & Clicks */}
              <div className="grid grid-cols-2 gap-3 pt-3 text-xs border-t border-[var(--color-border-subtle)]/60">
                <div>
                  <span className="text-[var(--color-text-tertiary)] block text-[11px]">
                    {isTr ? "Görüntülenme" : "Views"}
                  </span>
                  <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1 mt-0.5">
                    <Eye className="h-3.5 w-3.5 text-blue-400" />
                    <span>{viewCount.toLocaleString(isTr ? "tr-TR" : "en-US")}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-tertiary)] block text-[11px]">
                    {isTr ? "Tıklanma" : "Clicks"}
                  </span>
                  <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1 mt-0.5">
                    <MousePointerClick className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{clickCount.toLocaleString(isTr ? "tr-TR" : "en-US")}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons (Teklif Ver / Düzenle) */}
            <div className="pt-1">
              <ListingDetailActions
                listingId={listing.id}
                listingSlug={slug}
                listingTitle={listing.title}
                categoryName={category.key}
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
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{isTr ? "%0 Komisyon & Şifreli" : "0% Fee & Encrypted"}</span>
              </span>
              <span className="text-[var(--color-text-tertiary)] font-normal">
                {isTr ? "Doğrudan Anlaşma" : "Direct Deal"}
              </span>
            </div>
          </div>

          {/* Client Profile Card */}
          <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 p-5 backdrop-blur-xl shadow-sm space-y-3 text-xs">
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

          {/* Hiring Intent Index Card */}
          <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-5 backdrop-blur-xl shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] block">
                  {isTr ? "İşe Alım Niyet Endeksi" : "Hiring Intent Index"}
                </span>
                <span className="font-extrabold text-sm text-[var(--color-text-primary)]">
                  {isTr ? hiringIntent.badgeLabelTr : hiringIntent.badgeLabelEn}
                </span>
              </div>
              <span className="text-2xl font-black font-mono text-emerald-400">
                %{hiringIntent.overallScore}
              </span>
            </div>

            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              {isTr ? hiringIntent.summaryTr : hiringIntent.summaryEn}
            </p>

            {/* Pillar Breakdown Meters */}
            <div className="space-y-2.5 pt-1">
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
                  <span>{isTr ? "İşe Alım Geçmişi (Bayesian)" : "Hire Rate (Bayesian)"}</span>
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

            {/* Freelancer advice badge */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              <strong className="text-blue-400 block mb-0.5">
                {isTr ? "💡 Uzman Tavsiyesi:" : "💡 Specialist Tip:"}
              </strong>
              {isTr ? hiringIntent.freelancerGuidanceTr : hiringIntent.freelancerGuidanceEn}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
