import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Send, Compass, RefreshCw } from "lucide-react";
import { getSession } from "@/src/modules/auth/session";
import { OfferService } from "@/src/modules/offers/service";
import {
  SentOffersDashboard,
  SentOfferItem,
} from "@/src/components/dashboard/sent-offers-dashboard";
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

  const title = isTr
    ? "Teklif Verdiğim İlanlar — Durum Takibi"
    : "My Sent Proposals — Track Status";
  const description = isTr
    ? "İlanlar için ilettiğiniz gizli teklifleri, beklemedeki durumları ve kabul edilen eşleşmeleri takip edin."
    : "Track your private proposals, pending statuses, and accepted matches across listings.";

  return {
    title,
    description,
    alternates: {
      canonical: isTr ? "/tr/panel/teklifler/gonderilen" : "/en/dashboard/offers/sent",
      languages: {
        tr: "/tr/panel/teklifler/gonderilen",
        en: "/en/dashboard/offers/sent",
      },
    },
    openGraph: {
      title,
      description,
      url: isTr ? "/tr/panel/teklifler/gonderilen" : "/en/dashboard/offers/sent",
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

export default async function SentOffersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isTr = locale === "tr";
  const session = await getSession();
  if (!session?.userId) {
    redirect(
      isTr
        ? "/tr/giris?returnUrl=/tr/panel/teklifler/gonderilen"
        : "/en/login?returnUrl=/en/dashboard/offers/sent"
    );
  }

  let initialOffers: SentOfferItem[];
  let fetchError = false;

  try {
    const rows = await OfferService.getSentOffers(session.userId);
    initialOffers = rows.map((r) => ({
      id: r.offer.id,
      listingId: r.listing.id,
      listingSlug: r.listing.slug,
      listingTitle: r.listing.title,
      status: r.offer.status,
      message: r.offer.message,
      budgetCurrency: r.offer.budgetCurrency,
      budgetMin: r.offer.budgetMin,
      budgetMax: r.offer.budgetMax,
      estimatedDurationValue: r.offer.estimatedDurationValue,
      estimatedDurationUnit: r.offer.estimatedDurationUnit,
      createdAt: r.offer.createdAt,
      updatedAt: r.offer.updatedAt,
      engagementId: r.engagementId || null,
      isSquadOffer: r.offer.isSquadOffer ?? false,
      squadTitle: r.offer.squadTitle ?? null,
      squadMembers: r.squadMembers ?? [],
    }));
  } catch {
    fetchError = true;
    initialOffers = [];
  }

  const baseUrl = getBaseUrl();
  const sentOffersUrl = isTr
    ? `${baseUrl}/tr/panel/teklifler/gonderilen`
    : `${baseUrl}/en/dashboard/offers/sent`;

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
        name: isTr ? "Gönderilen Teklifler" : "Sent Offers",
        item: sentOffersUrl,
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
              <Send className="h-5 w-5 fill-blue-400/20 text-blue-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {isTr ? "Teklif Verdiğim İlanlar" : "Listings I Bid On"}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "İlanlar için verdiğiniz tekliflerin güncel durumlarını buradan izleyebilirsiniz."
              : "Review and manage all proposals you have submitted to listing owners."}
          </p>
        </div>

        <Link href={isTr ? "/tr/ilanlar" : "/en/listings"}>
          <Button variant="shimmer" size="sm" className="gap-2 text-xs">
            <Compass className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isTr ? "Yeni İlanları Keşfet" : "Browse Listings"}</span>
          </Button>
        </Link>
      </div>

      {/* Soft Error Notice if database query had an issue */}
      {fetchError && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-center justify-between gap-3 text-xs text-amber-300">
          <span>
            {isTr
              ? "Sunucu bağlantısında anlık bir gecikme yaşandı. Çevrimdışı veriler gösteriliyor."
              : "Temporary server connection delay. Displaying offline view."}
          </span>
          <Link href={isTr ? "/tr/panel/teklifler/gonderilen" : "/en/dashboard/offers/sent"}>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-amber-300 hover:text-amber-200">
              <RefreshCw className="h-3 w-3 mr-1" />
              {isTr ? "Yenile" : "Refresh"}
            </Button>
          </Link>
        </div>
      )}

      {/* Sent Offers Dashboard */}
      <section aria-label={isTr ? "Gönderilen Teklif Listesi" : "Sent Offer List"}>
        <SentOffersDashboard initialOffers={initialOffers} locale={locale} />
      </section>

      {/* Schema.org Structured Data */}
      <JsonLd data={jsonLd} />
    </div>
  );
}
