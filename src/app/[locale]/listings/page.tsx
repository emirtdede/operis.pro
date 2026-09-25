import type { Metadata } from "next";
import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";
import { FeedService, FeedResult } from "@/src/modules/listings/feed/service";
import { CategoryService } from "@/src/modules/categories/service";
import { ProfileService } from "@/src/modules/profiles/service";
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
    ? "Yazılım & Teknoloji İlanları — Canlı Akış"
    : "Tech & Software Listings — Live Feed";
  const description = isTr
    ? "Son 7 günde yayınlanan aktif yazılım, yapay zeka ve teknoloji ilanlarını inceleyin; işverenlerle %0 komisyonla doğrudan masaya oturun."
    : "Browse active technology and software listings published in the last 7 days. Connect directly with hiring teams with 0% platform fees.";

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
  const listingsPath = isTr ? "/tr/ilanlar" : "/en/listings";

  const selectedCategorySlugs = selectedCategory
    ? selectedCategory
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

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
    <main className="mx-auto max-w-[1440px] px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
      {/* Schema.org Structured Data */}
      <JsonLd data={jsonLd} />

      {/* Semantic Crawlable Heading & Summary for Search Engines & Screen Readers */}
      <header className="sr-only">
        <h1>
          {isTr
            ? "Yazılım & Teknoloji İlanları — Canlı Akış"
            : "Tech & Software Listings — Live Feed"}
        </h1>
        <p>
          {isTr
            ? "Son 7 günde yayınlanan aktif yazılım, yapay zeka ve teknoloji ilanlarını inceleyin; işverenlerle %0 komisyonla doğrudan masaya oturun."
            : "Browse active technology and software listings published in the last 7 days. Connect directly with hiring teams with 0% platform fees."}
        </p>
      </header>

      {/* Crawlable Semantic Listing Links (Indexable by search engine bots prior to JS hydration) */}
      {feedResult.items.length > 0 && (
        <nav aria-label={isTr ? "Aktif İlan İndeksi" : "Active Listings Index"} className="sr-only">
          <ul>
            {feedResult.items.map((item) => (
              <li key={item.id}>
                <a href={isTr ? `/tr/ilanlar/${item.slug}` : `/en/listings/${item.slug}`}>
                  <span>{item.title}</span> — <span>{item.categoryName}</span> — <span>{item.summary}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

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
        isAuthenticated={isAuthenticated}
        basePath={listingsPath}
        currentUserProfile={currentUserProfile}
      />
    </main>
  );
}
