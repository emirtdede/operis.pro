import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { FeedService, FeedResult } from "@/src/modules/listings/feed/service";
import { CategoryService } from "@/src/modules/categories/service";
import { UnifiedListingsHub } from "@/src/components/listings/unified-listings-hub";
import { getSession } from "@/src/modules/auth/session";
import { JsonLd } from "@/src/components/seo/json-ld";
import { getBaseUrl } from "@/src/lib/config/url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  const title = isTr
    ? "İlanları Keşfedin & Canlı Akış | Operis"
    : "Explore Listings & Live Feed | Operis";
  const description = isTr
    ? "7 günlük güncel yazılım, tasarım ve teknoloji ilanlarını akışta veya katalogda inceleyin, komisyonsuz doğrudan teklif sunun."
    : "Explore active 7-day software, design, and technology listings in stream or catalog format and submit direct commission-free proposals.";

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
  searchParams: Promise<{
    category?: string;
    q?: string;
    mode?: string;
    view?: string;
  }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const isTr = locale === "tr";
  const selectedCategory = sp.category;
  const searchQuery = sp.q;
  const mode: "following" | "all" = sp.mode === "following" ? "following" : "all";
  const view: "stream" | "catalog" = sp.view === "catalog" ? "catalog" : "stream";
  const listingsPath = isTr ? "/tr/ilanlar" : "/en/listings";

  const selectedCategorySlugs = selectedCategory
    ? selectedCategory
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const session = await getSession();
  if (!session?.userId) {
    const loginBase = isTr ? "/tr/giris" : "/en/login";
    const query = new URLSearchParams();
    if (selectedCategory) query.set("category", selectedCategory);
    if (searchQuery) query.set("q", searchQuery);
    if (sp.mode) query.set("mode", sp.mode);
    if (sp.view) query.set("view", sp.view);
    const queryString = query.toString();
    const returnUrl = `${listingsPath}${queryString ? `?${queryString}` : ""}`;
    redirect(`${loginBase}?returnUrl=${encodeURIComponent(returnUrl)}`);
  }

  const categories = await CategoryService.getAllCategories(
    isTr ? "tr" : "en",
    session?.userId
  ).catch(() => []);

  const feedResult: FeedResult = await FeedService.getFeedListings({
    mode,
    categorySlugs: selectedCategorySlugs.length > 0 ? selectedCategorySlugs : undefined,
    search: searchQuery,
    locale: isTr ? "tr" : "en",
    userId: session?.userId,
    limit: 12,
  }).catch(() => ({ items: [], nextCursor: null, hasMore: false, hasFollowedCategories: true }));

  const baseUrl = getBaseUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: isTr ? "Teknoloji ve Yazılım İlanları" : "Technology & Software Listings",
        description: isTr
          ? "Tüm kategorilerdeki güncel teknoloji ve yazılım ilanları dizini."
          : "Directory of active software and technology listings.",
        url: `${baseUrl}${listingsPath}`,
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
            name: isTr ? "İlanlar" : "Listings",
            item: `${baseUrl}${listingsPath}`,
          },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-[1360px] px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
      {/* Schema.org Structured Data */}
      <JsonLd data={jsonLd} />

      <UnifiedListingsHub
        initialItems={feedResult.items}
        initialCursor={feedResult.nextCursor}
        initialHasMore={feedResult.hasMore}
        initialMode={mode}
        initialView={view}
        categorySlug={selectedCategory}
        searchQuery={searchQuery}
        categories={categories}
        hasFollowedCategories={feedResult.hasFollowedCategories ?? true}
        locale={locale}
        isAuthenticated={Boolean(session?.userId)}
        basePath={listingsPath}
      />
    </main>
  );
}
