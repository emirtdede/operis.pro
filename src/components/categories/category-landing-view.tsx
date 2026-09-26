import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ChevronRight, Briefcase, ArrowLeft } from "lucide-react";
import { CategoryService } from "@/src/modules/categories/service";
import { FeedService, FeedResult } from "@/src/modules/listings/feed/service";
import { ProfileService } from "@/src/modules/profiles/service";
import { getSession } from "@/src/modules/auth/session";
import { UnifiedListingsHub } from "@/src/components/listings/unified-listings-hub";
import { JsonLd } from "@/src/components/seo/json-ld";
import { getBaseUrl, constructCanonicalUrl } from "@/src/lib/config/url";
import { SEED_SECTORS } from "@/db/seeds/categories";

interface CategoryLandingViewProps {
  locale: "tr" | "en";
  slug: string;
  searchParams?: {
    q?: string;
    mode?: string;
    view?: string;
    timeRange?: "all" | "24h" | "3d" | "7d";
    last24Hours?: string;
    budgetSpecific?: string;
    budgetType?: "all" | "fixed" | "hourly" | "open";
    minBudget?: string;
    maxBudget?: string;
    currency?: string;
    timelineScope?: "all" | "short" | "medium" | "long" | "flexible";
    companyVerified?: string;
    tags?: string;
  };
}

export async function CategoryLandingView({
  locale,
  slug,
  searchParams,
}: CategoryLandingViewProps) {
  const isTr = locale === "tr";
  const category = await CategoryService.getCategoryBySlug(slug, locale);

  if (!category) {
    notFound();
  }

  const sector = SEED_SECTORS.find((s) => s.key === category.sectorKey);
  const sectorName = sector
    ? isTr
      ? sector.translations.tr.name
      : sector.translations.en.name
    : null;

  const sp = searchParams || {};
  const searchQuery = sp.q;
  const session = await getSession();
  const isAuthenticated = Boolean(session?.userId);
  const mode: "following" | "all" =
    sp.mode === "following" && isAuthenticated ? "following" : "all";

  const cookieStore = await cookies();
  const savedViewCookie = cookieStore.get("operis_listings_view_preference")?.value;
  const view: "stream" | "catalog" =
    sp.view === "catalog"
      ? "catalog"
      : sp.view === "stream"
      ? "stream"
      : savedViewCookie === "catalog"
      ? "catalog"
      : "stream";

  const basePath = isTr ? `/tr/kategori/${category.slug}` : `/en/category/${category.slug}`;

  const userProfile = session?.userId
    ? await ProfileService.getProfileByUserId(session.userId).catch(() => null)
    : null;

  const currentUserProfile = userProfile
    ? {
        userId: userProfile.userId,
        displayName: userProfile.displayName,
        handle: userProfile.handle,
        headline: (userProfile as { headline?: string | null })?.headline ?? null,
        avatarUrl: userProfile.avatarUrl ?? null,
        availabilityStatus:
          (userProfile as { availabilityStatus?: import("@/src/modules/profiles/services/availability.service").AvailabilityStatus })
            ?.availabilityStatus ?? "AVAILABLE_NOW",
        isAvailableForHire:
          (userProfile as { isAvailableForHire?: boolean })?.isAvailableForHire ?? true,
        isActivelyHiring:
          (userProfile as { isActivelyHiring?: boolean })?.isActivelyHiring ?? false,
        isCompanyVerified:
          (userProfile as { isCompanyVerified?: boolean })?.isCompanyVerified ?? false,
        roles: (userProfile as { roles?: string[] })?.roles ?? [],
        trackedSkills: (userProfile as { trackedSkills?: string[] })?.trackedSkills ?? [],
      }
    : null;

  const categories = await CategoryService.getAllCategories(
    isTr ? "tr" : "en",
    session?.userId
  ).catch(() => []);

  const minBudgetNum = sp.minBudget ? Number(sp.minBudget) : undefined;
  const maxBudgetNum = sp.maxBudget ? Number(sp.maxBudget) : undefined;
  const tagsList = sp.tags ? sp.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined;

  const feedResult: FeedResult = await FeedService.getFeedListings({
    mode,
    categorySlugs: [category.key],
    search: searchQuery,
    locale: isTr ? "tr" : "en",
    userId: session?.userId,
    limit: 12,
    timeRange: sp.timeRange,
    last24Hours: sp.last24Hours === "true" || sp.timeRange === "24h" || undefined,
    budgetSpecific: sp.budgetSpecific === "true" || undefined,
    budgetType: sp.budgetType,
    minBudget: typeof minBudgetNum === "number" && !isNaN(minBudgetNum) ? minBudgetNum : undefined,
    maxBudget: typeof maxBudgetNum === "number" && !isNaN(maxBudgetNum) ? maxBudgetNum : undefined,
    currency: sp.currency,
    timelineScope: sp.timelineScope,
    companyVerifiedOnly: sp.companyVerified === "true" || undefined,
    tags: tagsList,
  }).catch(() => ({ items: [], nextCursor: null, hasMore: false, hasFollowedCategories: true }));

  const baseUrl = getBaseUrl();
  const canonicalUrl = constructCanonicalUrl(basePath);
  const categoriesListUrl = constructCanonicalUrl(isTr ? "/tr/kategoriler" : "/en/categories");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: isTr ? `${category.name} Freelance İş İlanları` : `${category.name} Freelance Jobs`,
        description: category.description || (isTr
          ? `${category.name} alanındaki aktif projeler ve freelance fırsatları.`
          : `Active projects and freelance opportunities in ${category.name}.`),
        url: canonicalUrl,
        inLanguage: locale,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: feedResult.items.length,
          itemListElement: feedResult.items.map((item, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            url: `${baseUrl}${isTr ? `/tr/ilanlar/${item.slug}` : `/en/listings/${item.slug}`}`,
            name: item.title,
          })),
        },
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
            name: isTr ? "Kategoriler" : "Categories",
            item: categoriesListUrl,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: category.name,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-[1440px] px-2 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-6">
      {/* Schema.org Structured Data */}
      <JsonLd data={jsonLd} />

      {/* Semantic Category Header & Breadcrumbs */}
      <header className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/80 p-5 sm:p-7 backdrop-blur-sm shadow-sm space-y-4">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-[var(--color-text-secondary)]">
          <Link
            href={`/${locale}`}
            className="hover:text-[var(--color-text-primary)] transition-colors"
          >
            {isTr ? "Ana Sayfa" : "Home"}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          <Link
            href={isTr ? "/tr/kategoriler" : "/en/categories"}
            className="hover:text-[var(--color-text-primary)] transition-colors"
          >
            {isTr ? "Kategoriler" : "Categories"}
          </Link>
          {sectorName && (
            <>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              <span className="truncate max-w-[180px] sm:max-w-none opacity-80">{sectorName}</span>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          <span className="font-semibold text-[var(--color-text-primary)] truncate max-w-[220px] sm:max-w-none">
            {category.name}
          </span>
        </nav>

        {/* Category Title & Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Briefcase className="h-5 w-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
                {category.name}
              </h1>
            </div>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
              {category.description ||
                (isTr
                  ? `${category.name} uzmanlık alanındaki güncel freelance projeleri inceleyin. Doğrudan işverenlerle %0 komisyonla masaya oturun.`
                  : `Browse verified freelance projects in ${category.name}. Connect directly with clients with 0% platform commission.`)}
            </p>
          </div>

          {/* Active Listings Counter Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-xs sm:text-sm font-medium text-[var(--color-text-primary)]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {feedResult.items.length}{" "}
                {isTr ? "aktif proje" : "active projects"}
              </span>
            </div>
            <Link
              href={isTr ? "/tr/kategoriler" : "/en/categories"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{isTr ? "Tüm Kategoriler" : "All Categories"}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Crawlable Semantic Listing Links for Search Spiders prior to hydration */}
      {feedResult.items.length > 0 && (
        <nav aria-label={isTr ? `${category.name} İlanları` : `${category.name} Listings`} className="sr-only">
          <ul>
            {feedResult.items.map((item) => (
              <li key={item.id}>
                <a href={isTr ? `/tr/ilanlar/${item.slug}` : `/en/listings/${item.slug}`}>
                  <span>{item.title}</span> — <span>{item.summary}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Interactive Unified Listings Feed */}
      <UnifiedListingsHub
        initialItems={feedResult.items}
        initialCursor={feedResult.nextCursor}
        initialHasMore={feedResult.hasMore}
        initialMode={mode}
        initialView={view}
        categorySlug={category.key}
        searchQuery={searchQuery}
        categories={categories}
        hasFollowedCategories={feedResult.hasFollowedCategories ?? true}
        locale={locale}
        isAuthenticated={isAuthenticated}
        basePath={basePath}
        currentUserProfile={currentUserProfile}
      />
    </main>
  );
}
