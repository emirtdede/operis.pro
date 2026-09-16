import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { Search, PlusCircle, Clock, ShieldCheck, X } from "lucide-react";
import { FeedService, FeedResult } from "@/src/modules/listings/feed/service";
import { CategoryService } from "@/src/modules/categories/service";
import { InteractiveListingsFeed } from "@/src/components/listings/interactive-listings-feed";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Button } from "@/src/components/ui/button";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";
import { CategoryFilterBar } from "@/src/components/categories/category-filter-bar";
import { getSession } from "@/src/modules/auth/session";
import { serializeJsonLd } from "@/src/lib/security/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  const title = isTr ? "İlan Arama & Filtreleme" : "Browse & Filter Listings";
  const description = isTr
    ? "Tüm kategorilerdeki güncel yazılım, tasarım ve teknoloji ilanlarını inceleyin, doğrudan teklif sunun."
    : "Explore active software, design, and technology listings across all categories and submit direct proposals.";

  return {
    title,
    description,
    alternates: {
      canonical: isTr ? "/tr/ilanlar" : "/en/listings",
      languages: {
        tr: "/tr/ilanlar",
        en: "/en/listings",
      },
    },
    openGraph: {
      title,
      description,
      url: isTr ? "/tr/ilanlar" : "/en/listings",
      siteName: "Operis",
      locale: isTr ? "tr_TR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function BrowseListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const isTr = locale === "tr";
  const selectedCategory = sp.category;
  const searchQuery = sp.q;
  const listingsPath = isTr ? "/tr/ilanlar" : "/en/listings";

  const categories = await CategoryService.getAllCategories(isTr ? "tr" : "en").catch(() => []);
  const session = await getSession();

  const feedResult: FeedResult = await FeedService.getFeedListings({
    mode: "all",
    categorySlugs: selectedCategory ? [selectedCategory] : undefined,
    search: searchQuery,
    locale: isTr ? "tr" : "en",
    userId: session?.userId,
  }).catch(() => ({ items: [], nextCursor: null, hasMore: false }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: isTr ? "Aktif Proje İlanları" : "Active Project Listings",
        description: isTr
          ? "Tüm kategorilerdeki güncel teknoloji ve yazılım projeleri dizini."
          : "Directory of active software and technology projects.",
        url: `https://operis.pro${listingsPath}`,
        inLanguage: locale,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: feedResult.items.length,
          itemListElement: feedResult.items.map((item, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            url: `https://operis.pro${isTr ? `/tr/ilanlar/${item.slug}` : `/en/listings/${item.slug}`}`,
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
            item: `https://operis.pro/${locale}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: isTr ? "Aktif İlanlar" : "Listings",
            item: `https://operis.pro${listingsPath}`,
          },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      {/* Expansive Header Banner */}
      <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[var(--color-border-subtle)]">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
            {isTr ? "Aktif İlanlar" : "Active Listings"}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Tüm kategorilerdeki en güncel yazılım ve teknoloji ilanlarını inceleyin, doğrudan şifreli teklifinizi iletin."
              : "Discover active software and technology listings across all categories with 100% direct client matching."}
          </p>
        </div>

        {/* Floating Glass Search Box */}
        <form
          method="GET"
          action={listingsPath}
          className="flex items-center gap-2 max-w-md w-full bg-[var(--color-surface-base)]/80 backdrop-blur-md p-1.5 rounded-2xl border border-[var(--color-border-subtle)] shadow-sm"
          role="search"
        >
          {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              defaultValue={searchQuery ?? ""}
              maxLength={100}
              aria-label={isTr ? "İlan arama" : "Search listings"}
              placeholder={
                isTr ? "İlan başlığı veya teknoloji ara..." : "Search title or tech stack..."
              }
              className={`w-full rounded-xl bg-transparent pl-9 ${searchQuery ? "pr-8" : "pr-3"} py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none`}
            />
            {searchQuery && (
              <Link
                href={listingsPath + (selectedCategory ? `?category=${selectedCategory}` : "")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                title={isTr ? "Aramayı Temizle" : "Clear Search"}
                aria-label={isTr ? "Aramayı Temizle" : "Clear Search"}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>
          <Button type="submit" variant="secondary" size="sm">
            {isTr ? "Ara" : "Search"}
          </Button>
        </form>
      </header>

      {/* 7-Day Live Freshness Guidance Banner */}
      <section
        aria-label={isTr ? "İlan Canlılık Bilgisi" : "Listing Freshness Info"}
        className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-400 shrink-0" aria-hidden="true" />
          <span>
            {isTr
              ? "Tüm teknoloji ilanları 1 haftalık tazelik garantisi altındadır. Süresi dolan veya terk edilen projeler asla listelenmez."
              : "All technology projects are governed by a 1-week freshness radar. Abandoned or stale listings are automatically pruned."}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-emerald-400 shrink-0">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span>{isTr ? "%0 Komisyon & Doğrudan Anlaşma" : "0% Platform Fee & Direct Deal"}</span>
        </div>
      </section>

      {/* Category Filter Bar (Modern Horizontal Rail + Categorized Popover) */}
      <section aria-label={isTr ? "Kategori Filtreleme" : "Category Filter"}>
        <CategoryFilterBar
          categories={categories}
          selectedCategory={selectedCategory}
          basePath={listingsPath}
          searchQuery={searchQuery}
          locale={locale}
          resultCount={feedResult.items.length}
        />
      </section>

      {/* Listings Grid / Content Stream */}
      <section className="space-y-6">
        <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] border-b border-[var(--color-border-subtle)] pb-3">
          <span>
            {isTr
              ? `${feedResult.items.length} aktif proje listelendi`
              : `${feedResult.items.length} active projects listed`}
          </span>
          <Link
            href={getLocalizedRoute("newListing", locale)}
            className="inline-flex items-center gap-1.5 font-medium text-blue-500 hover:text-blue-400 transition-colors"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            <span>{isTr ? "Yeni İlan Yayınla" : "Publish Listing"}</span>
          </Link>
        </div>

        {feedResult.items.length === 0 ? (
          <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/50 p-12 backdrop-blur-xl">
            <EmptyState
              title={isTr ? "Eşleşen İlan Bulunamadı" : "No Matching Listings"}
              description={
                selectedCategory || searchQuery
                  ? isTr
                    ? "Arama kriterlerinize uygun aktif ilan bulunamadı. Filtreleri temizleyebilir veya yeni bir arama yapabilirsiniz."
                    : "No active listings matched your search criteria. Try clearing filters or refining your query."
                  : isTr
                    ? "Şu an bu kategoride aktif ilan bulunmuyor. Kendi projenizi ilk olarak yayınlayabilirsiniz."
                    : "No active listings currently available. Be the first to publish a project in this space."
              }
              action={
                <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                  {(selectedCategory || searchQuery) && (
                    <Link href={listingsPath}>
                      <Button variant="outline" size="sm">
                        {isTr ? "Filtreleri Temizle" : "Clear Filters"}
                      </Button>
                    </Link>
                  )}
                  <Link href={getLocalizedRoute("newListing", locale)}>
                    <Button variant="shimmer" size="sm">
                      {isTr ? "Yeni İlan Oluştur" : "Create New Listing"}
                    </Button>
                  </Link>
                </div>
              }
            />
          </div>
        ) : (
          <InteractiveListingsFeed
            items={feedResult.items}
            locale={locale}
            initialNextCursor={feedResult.nextCursor}
            initialHasMore={feedResult.hasMore}
            categorySlug={selectedCategory}
            searchQuery={searchQuery}
          />
        )}
      </section>
    </main>
  );
}
