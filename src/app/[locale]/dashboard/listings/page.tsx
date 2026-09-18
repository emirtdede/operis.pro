import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Clock, ShieldCheck, PlusCircle } from "lucide-react";
import { getSession } from "@/src/modules/auth/session";
import { ListingService } from "@/src/modules/listings/service";
import {
  OwnerListingsDashboard,
  OwnerListingItem,
} from "@/src/components/dashboard/owner-listings-dashboard";
import { DashboardTabs } from "@/src/components/dashboard/dashboard-tabs";
import { Button } from "@/src/components/ui/button";

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

  const dashboardUrl = isTr
    ? "https://operis.pro/tr/panel/ilanlarim"
    : "https://operis.pro/en/dashboard/listings";

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
        name: isTr ? "İlanlarım" : "My Listings",
        item: dashboardUrl,
      },
    ],
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {isTr ? "İlanlarım" : "My Listings"}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "Yayınladığınız ilanların 1 haftalık durumlarını, teklifleri ve eşleşmeleri yönetin."
              : "Manage your 1-week listing lifecycles, incoming offers, and matched requests."}
          </p>
        </div>

        <Link href={isTr ? "/tr/ilanlar/yeni" : "/en/listings/new"}>
          <Button variant="shimmer" size="sm" className="gap-2">
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            <span>{isTr ? "Yeni İlan Yayınla" : "Post New Listing"}</span>
          </Button>
        </Link>
      </header>

      {/* Unified Dashboard Navigation Tabs */}
      <DashboardTabs locale={locale} counts={{ listings: initialListings.length }} />

      {/* 7-Day Lifecycle Guidance Banner */}
      <section
        aria-label={isTr ? "İlan Yönetim Rehberi" : "Listing Management Guide"}
        className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            <span className="font-semibold text-[var(--color-text-primary)] block">
              {isTr
                ? "1 Haftalık Canlılık ve Yenileme Kuralı"
                : "1-Week Freshness & Renewal Policy"}
            </span>
            <p>
              {isTr
                ? "İlanlarınız 1 hafta boyunca radarımızda aktiftir. Süresi dolan ilanlar silinmez; 'Pasif / Süresi Dolanlar' sekmesinden tek tıkla 1 hafta daha ücretsiz yeniden başlatabilirsiniz."
                : "Projects stay active on our freshness radar for 1 week. Expired listings are never deleted; reactivate them anytime for another 1 week with a single click at zero cost."}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-emerald-400 self-end sm:self-center">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span>{isTr ? "%0 Komisyon" : "0% Platform Cut"}</span>
        </div>
      </section>

      {/* Listings Table / Cards */}
      <section aria-label={isTr ? "İlan Yönetimi" : "Listing Management"}>
        <OwnerListingsDashboard
          initialListings={initialListings}
          locale={locale}
          hasLoadError={hasLoadError}
        />
      </section>
    </main>
  );
}
