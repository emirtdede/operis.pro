import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Bookmark, Compass } from "lucide-react";
import { getSession } from "@/src/modules/auth/session";
import { SavedListingService, SavedListingItem } from "@/src/modules/listings/saved-service";
import { SavedListingsDashboard } from "@/src/components/dashboard/saved-listings-dashboard";
import { DashboardTabs } from "@/src/components/dashboard/dashboard-tabs";
import { Button } from "@/src/components/ui/button";
import { serializeJsonLd } from "@/src/lib/security/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  const title = isTr ? "Kaydedilen İlanlar — Favorilerim" : "Saved Jobs — My Bookmarks";
  const description = isTr
    ? "Kaydettiğiniz ve daha sonra başvurmak istediğiniz iş ilanlarını takip edin, filtreleyin ve yönetin."
    : "Track, filter, and manage listings you bookmarked to apply later.";

  return {
    title,
    description,
    alternates: {
      canonical: isTr ? "/tr/panel/kaydedilenler" : "/en/dashboard/saved",
      languages: {
        tr: "/tr/panel/kaydedilenler",
        en: "/en/dashboard/saved",
      },
    },
    openGraph: {
      title,
      description,
      url: isTr ? "/tr/panel/kaydedilenler" : "/en/dashboard/saved",
      siteName: "Operis",
      locale: isTr ? "tr_TR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function SavedListingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isTr = locale === "tr";
  const session = await getSession();
  if (!session?.userId) {
    redirect(
      isTr
        ? "/tr/giris?returnUrl=/tr/panel/kaydedilenler"
        : "/en/login?returnUrl=/en/dashboard/saved"
    );
  }

  let savedItems: SavedListingItem[] = [];
  let fetchError = false;

  try {
    savedItems = await SavedListingService.getSavedListings(session.userId, {
      statusFilter: "all",
      limit: 200,
    });
  } catch {
    fetchError = true;
    savedItems = [];
  }

  const jsonLd = {
    "@context": "https://schema.org",
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
        name: isTr ? "Kaydedilen İlanlar" : "Saved Jobs",
        item: `https://operis.pro/${locale}/dashboard/saved`,
      },
    ],
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Bookmark className="h-5 w-5 fill-blue-400/20 text-blue-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {isTr ? "Kaydedilen İlanlar" : "Saved Jobs"}
            </h1>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "Daha sonra değerlendirmek üzere yer imlerine eklediğiniz iş fırsatları."
              : "Opportunities you have bookmarked to review or apply to later."}
          </p>
        </div>

        <Link href={isTr ? "/tr/ilanlar" : "/en/listings"}>
          <Button variant="shimmer" size="sm" className="gap-2">
            <Compass className="h-4 w-4" aria-hidden="true" />
            <span>{isTr ? "Yeni İlanları Keşfet" : "Explore Listings"}</span>
          </Button>
        </Link>
      </header>

      {/* Navigation Tabs */}
      <DashboardTabs locale={locale} counts={{ savedListings: savedItems.length }} />

      {/* Error state */}
      {fetchError ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-400">
            {isTr
              ? "Kayıtlı ilanlar yüklenirken bir sorun oluştu."
              : "Failed to load saved listings."}
          </p>
          <Link href={isTr ? "/tr/panel/kaydedilenler" : "/en/dashboard/saved"}>
            <Button variant="outline" size="sm" className="mt-2 text-xs">
              {isTr ? "Sayfayı Yenile" : "Refresh"}
            </Button>
          </Link>
        </div>
      ) : (
        <SavedListingsDashboard initialSavedListings={savedItems} locale={locale} />
      )}
    </main>
  );
}
