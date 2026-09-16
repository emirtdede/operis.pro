import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { Search, PlusCircle, Clock, ShieldCheck, X } from "lucide-react";
import { FeedService } from "@/src/modules/listings/feed/service";
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

  const title = isTr
    ? "Canlı İlan Akışı — 7 Günlük İlanlar"
    : "Live Listings Feed — 7-Day Listings";
  const description = isTr
    ? "7 günlük güncel teknoloji ve yazılım ilanlarını keşfedin, doğrudan teklif verin."
    : "Discover active 7-day software engineering and technology listings and submit direct proposals.";

  return {
    title,
    description,
    alternates: {
      canonical: isTr ? "/tr/akis" : "/en/feed",
      languages: {
        tr: "/tr/akis",
        en: "/en/feed",
      },
    },
    openGraph: {
      title,
      description,
      url: isTr ? "/tr/akis" : "/en/feed",
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

export default async function FeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    mode?: string;
    category?: string;
    kategori?: string;
    q?: string;
    ara?: string;
  }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const isTr = locale === "tr";
  const mode = sp.mode === "following" ? "following" : "all";
  const selectedCategory = sp.category || sp.kategori;
  const searchQuery = sp.q || sp.ara;
  const feedPath = isTr ? "/tr/akis" : "/en/feed";

  // Fetch categories for filter panel
  const categories = await CategoryService.getAllCategories(isTr ? "tr" : "en").catch(() => []);
  const session = await getSession();

  // Fetch feed listings
  const feedResult = await FeedService.getFeedListings({
    mode: mode as "following" | "all",
    categorySlugs: selectedCategory ? [selectedCategory] : undefined,
    search: searchQuery,
    locale: isTr ? "tr" : "en",
    userId: session?.userId,
  }).catch(() => ({ items: [], hasFollowedCategories: true, hasMore: false, nextCursor: null }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: isTr ? "İlan Akışı" : "Listings Feed",
        description: isTr
          ? "7 günlük güncel teknoloji ve yazılım ilanlarını keşfedin."
          : "Discover active 7-day software engineering and technology listings.",
        url: `https://operis.pro${feedPath}`,
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
            name: isTr ? "İlan Akışı" : "Listings Feed",
            item: `https://operis.pro${feedPath}`,
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

      {/* Top Expansive Header */}
      <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[var(--color-border-subtle)]">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
            {isTr ? "İlan Akışı" : "Listings Activity Feed"}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Yalnızca son 1 hafta içinde yayınlanmış veya yenilenmiş güncel yazılım ilanları."
              : "Strictly active listings published or reactivated within the last 1 week."}
          </p>
        </div>

        {/* Floating Glass Search Console */}
        <form
          method="GET"
          action={feedPath}
          className="flex items-center gap-2 max-w-md w-full bg-[var(--color-surface-base)]/80 backdrop-blur-md p-1.5 rounded-2xl border border-[var(--color-border-subtle)] shadow-sm"
          role="search"
        >
          <input type="hidden" name="mode" value={mode} />
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
                href={`${feedPath}?mode=${mode}${selectedCategory ? `&category=${selectedCategory}` : ""}`}
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

      {/* Mode Switcher Tabs */}
      <nav
        aria-label={isTr ? "Akış Sekmeleri" : "Feed Tabs"}
        className="flex flex-wrap items-center gap-3"
      >
        <Link
          href={`${feedPath}?mode=following${
            selectedCategory ? `&category=${selectedCategory}` : ""
          }${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`}
          className={`rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
            mode === "following"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
              : "border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/60 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]"
          }`}
        >
          {isTr ? "Takip Ettiğim Kategoriler" : "Following Categories"}
        </Link>

        <Link
          href={`${feedPath}?mode=all${
            selectedCategory ? `&category=${selectedCategory}` : ""
          }${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`}
          className={`rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
            mode === "all"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
              : "border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/60 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]"
          }`}
        >
          {isTr ? "Tüm İlanlar" : "All Listings"}
        </Link>
      </nav>

      {/* 7-Day Live Radar Guidance Banner */}
      <section
        aria-label={isTr ? "Akış Tazelik Bilgisi" : "Feed Freshness Info"}
        className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-400 shrink-0" aria-hidden="true" />
          <span>
            {isTr
              ? "Tüm ilanlar 1 haftalık canlılık döngüsündedir. Yalnızca aktif ve güncel yazılım işlerine teklif verirsiniz."
              : "All listings operate within a strict 1-week freshness radar. Connect strictly with active software work."}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-emerald-400 shrink-0">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span>{isTr ? "%0 Komisyon & Şifreli Teklif" : "0% Commission & Encrypted"}</span>
        </div>
      </section>

      {/* Category Filter Bar (Modern Horizontal Rail + Categorized Popover) */}
      <section aria-label={isTr ? "Kategori Filtreleri" : "Category Filters"}>
        <CategoryFilterBar
          categories={categories}
          selectedCategory={selectedCategory}
          basePath={feedPath}
          searchQuery={searchQuery}
          extraQuery={{ mode }}
          locale={locale}
          resultCount={feedResult.items.length}
        />
      </section>

      {/* Main Stream Area */}
      <section className="space-y-6">
        <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] border-b border-[var(--color-border-subtle)] pb-3">
          <span>
            {isTr
              ? `${feedResult.items.length} canlı ilan listelendi`
              : `${feedResult.items.length} active listings live`}
          </span>
          <Link
            href={getLocalizedRoute("newListing", locale)}
            className="inline-flex items-center gap-1.5 font-medium text-cyan-500 hover:text-cyan-400 transition-colors"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            <span>{isTr ? "Yeni İlan Yayınla" : "Publish Listing"}</span>
          </Link>
        </div>

        {feedResult.items.length === 0 ? (
          <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/50 p-12 backdrop-blur-xl">
            <EmptyState
              title={
                mode === "following" && !feedResult.hasFollowedCategories
                  ? isTr
                    ? "Henüz Kategori Takip Etmiyorsunuz"
                    : "No Categories Followed Yet"
                  : isTr
                    ? "Eşleşen Canlı İlan Bulunamadı"
                    : "No Matching Live Listings"
              }
              description={
                mode === "following" && !feedResult.hasFollowedCategories
                  ? isTr
                    ? "İlginizi çeken teknoloji kategorilerini takip ederek özelleştirilmiş ilan akışınızı oluşturun."
                    : "Follow technology categories you specialize in to build your personalized feed."
                  : isTr
                    ? "Arama ve filtre kriterlerinize uygun aktif ilan bulunamadı. Filtreleri temizleyebilir veya tüm akışı inceleyebilirsiniz."
                    : "No active listings match your filters. You can clear filters or view all listings."
              }
              action={
                <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                  {mode === "following" && !feedResult.hasFollowedCategories ? (
                    <Link href={getLocalizedRoute("categories", locale)}>
                      <Button variant="shimmer" size="sm">
                        {isTr ? "Kategorileri Keşfet ve Takip Et" : "Discover Categories"}
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href={`${feedPath}?mode=all`}>
                        <Button variant="secondary" size="sm">
                          {isTr ? "Tüm İlanları Göster" : "View All Listings"}
                        </Button>
                      </Link>
                      <Link href={getLocalizedRoute("newListing", locale)}>
                        <Button variant="shimmer" size="sm">
                          {isTr ? "Yeni İlan Oluştur" : "Create New Listing"}
                        </Button>
                      </Link>
                    </>
                  )}
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
            mode={mode as "following" | "all"}
          />
        )}
      </section>
    </main>
  );
}
