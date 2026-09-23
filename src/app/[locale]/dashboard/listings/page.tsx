import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Briefcase, Plus } from "lucide-react";
import { getSession } from "@/src/modules/auth/session";
import { ListingService } from "@/src/modules/listings/service";
import {
  OwnerListingsDashboard,
  OwnerListingItem,
} from "@/src/components/dashboard/owner-listings-dashboard";
import { MandatoryReviewBanner } from "@/src/components/dashboard/mandatory-review-banner";
import { Button } from "@/src/components/ui/button";
import { JsonLd } from "@/src/components/seo/json-ld";
import { getBaseUrl } from "@/src/lib/config/url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  const title = isTr ? "Yayınladığım İlanlar & Yaşam Döngüsü" : "My Published Listings & Lifecycle";
  const description = isTr
    ? "Yayınladığınız teknoloji ilanlarını yönetin, teklifleri inceleyin ve 1 haftalık yaşam döngüsünü yenileyin."
    : "Manage your published technology listings, review incoming proposals, and renew 1-week lifecycles.";

  return {
    title,
    description,
    alternates: {
      canonical: isTr ? "/tr/panel/ilanlarim" : "/en/dashboard/listings",
      languages: {
        tr: "/tr/panel/ilanlarim",
        en: "/en/dashboard/listings",
      },
    },
    openGraph: {
      title,
      description,
      url: isTr ? "/tr/panel/ilanlarim" : "/en/dashboard/listings",
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

export default async function DashboardListingsPage({
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
        ? "/tr/giris?returnUrl=/tr/panel/ilanlarim"
        : "/en/login?returnUrl=/en/dashboard/listings"
    );
  }

  let initialListings: OwnerListingItem[];
  let hasLoadError = false;

  try {
    const rows = await ListingService.getOwnerListings(session.userId);
    initialListings = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      status: r.status,
      budgetMode: r.budgetMode,
      budgetCurrency: r.budgetCurrency,
      budgetMin: r.budgetMin,
      budgetMax: r.budgetMax,
      firstPublishedAt: r.firstPublishedAt,
      lastActivatedAt: r.lastActivatedAt,
      activeUntil: r.activeUntil,
      activationSeq: r.activationSeq,
      viewCount: r.viewCount ?? 0,
      clickCount: r.clickCount ?? 0,
      engagementId: r.engagementId ?? null,
    }));
  } catch (err) {
    console.error("Failed to load owner listings for dashboard:", err);
    hasLoadError = true;
    initialListings = [];
  }

  const baseUrl = getBaseUrl();
  const dashboardUrl = isTr
    ? `${baseUrl}/tr/panel/ilanlarim`
    : `${baseUrl}/en/dashboard/listings`;

  const jsonLd = {
    "@context": "https://schema.org",
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
        name: isTr ? "İlanlarım" : "My Listings",
        item: dashboardUrl,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Briefcase className="h-5 w-5 fill-blue-400/20 text-blue-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {isTr ? "Yayınladığım İlanlar" : "My Published Listings"}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "Yayınladığınız teknoloji ilanlarını yönetin, gelen teklifleri inceleyin ve yaşam döngülerini takip edin."
              : "Manage your published technology listings, review incoming proposals, and track lifecycles."}
          </p>
        </div>

        <Link href={isTr ? "/tr/ilanlar/yeni" : "/en/listings/new"}>
          <Button variant="shimmer" size="sm" className="gap-2 text-xs">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isTr ? "Yeni İlan Yayınla" : "Post New Listing"}</span>
          </Button>
        </Link>
      </div>

      {/* Mandatory Review Prompt for Completed Engagements */}
      <MandatoryReviewBanner locale={locale} />

      {/* Owner Listings Dashboard (Segmented Control + Launchpad Empty State / Listing Cards) */}
      <OwnerListingsDashboard
        initialListings={initialListings}
        locale={locale}
        hasLoadError={hasLoadError}
      />

      {/* Schema.org Structured Data */}
      <JsonLd data={jsonLd} />
    </div>
  );
}
