import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Lock, RefreshCw, Inbox } from "lucide-react";
import { getSession } from "@/src/modules/auth/session";
import { OfferService } from "@/src/modules/offers/service";
import {
  ReceivedOffersDashboard,
  ReceivedOfferItem,
} from "@/src/components/dashboard/received-offers-dashboard";
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

  const title = isTr ? "Gelen Teklifler — İncele & Eşleş" : "Incoming Proposals — Review & Match";
  const description = isTr
    ? "İlanlarınıza gelen özel teklifleri değerlendirin ve doğrudan eşleşme başlatın."
    : "Review private proposals submitted to your listings and initiate direct matching.";

  return {
    title,
    description,
    alternates: {
      canonical: isTr ? "/tr/panel/teklifler/gelen" : "/en/dashboard/offers/received",
      languages: {
        tr: "/tr/panel/teklifler/gelen",
        en: "/en/dashboard/offers/received",
      },
    },
    openGraph: {
      title,
      description,
      url: isTr ? "/tr/panel/teklifler/gelen" : "/en/dashboard/offers/received",
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

export default async function ReceivedOffersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ listingId?: string }>;
}) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : {};
  const filterListingId = sp.listingId;
  setRequestLocale(locale);

  const isTr = locale === "tr";
  const session = await getSession();
  if (!session?.userId) {
    redirect(
      isTr
        ? "/tr/giris?returnUrl=/tr/panel/teklifler/gelen"
        : "/en/login?returnUrl=/en/dashboard/offers/received"
    );
  }

  let initialOffers: ReceivedOfferItem[];
  let fetchError = false;

  try {
    const rows = await OfferService.getReceivedOffers(session.userId);
    initialOffers = rows.map((r) => ({
      id: r.offer.id,
      listingId: r.listing.id,
      listingTitle: r.listing.title,
      offerorUserId: r.offer.offerorUserId,
      offerorDisplayName: r.offerorProfile.displayName,
      offerorHandle: r.offerorProfile.handle,
      status: r.offer.status,
      message: r.offer.message,
      budgetCurrency: r.offer.budgetCurrency,
      budgetMin: r.offer.budgetMin,
      budgetMax: r.offer.budgetMax,
      estimatedDurationValue: r.offer.estimatedDurationValue,
      estimatedDurationUnit: r.offer.estimatedDurationUnit,
      createdAt: r.offer.createdAt,
      engagementId: r.engagementId ?? null,
      isSquadOffer: r.offer.isSquadOffer ?? false,
      squadTitle: r.offer.squadTitle ?? null,
      squadMembers: r.squadMembers ?? [],
    }));

    if (filterListingId) {
      initialOffers = initialOffers.filter((o) => o.listingId === filterListingId);
    }
  } catch {
    fetchError = true;
    initialOffers = [];
  }

  const baseUrl = getBaseUrl();
  const receivedOffersUrl = isTr
    ? `${baseUrl}/tr/panel/teklifler/gelen`
    : `${baseUrl}/en/dashboard/offers/received`;

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
        item: `${baseUrl}${isTr ? "/tr/panel/ilanlarim" : "/en/dashboard/listings"}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: isTr ? "Gelen Teklifler" : "Received Offers",
        item: receivedOffersUrl,
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
              <Inbox className="h-5 w-5 fill-blue-400/20 text-blue-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {isTr ? "Gelen Teklifler" : "Received Offers"}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
              <Lock className="h-3 w-3" />
              {isTr ? "Şifreli & Gizli" : "Encrypted"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "İlanlarınıza gelen tüm teklifler şifrelenmiştir ve yalnızca sizin tarafınızdan görüntülenebilir."
              : "All proposals submitted to your listings are encrypted and visible exclusively to you."}
          </p>
        </div>

        <Link href={isTr ? "/tr/panel/ilanlarim" : "/en/dashboard/listings"}>
          <Button variant="outline" size="sm" className="text-xs">
            {isTr ? "İlanlarıma Dön" : "My Listings"}
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
          <Link href={isTr ? "/tr/panel/teklifler/gelen" : "/en/dashboard/offers/received"}>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-amber-300 hover:text-amber-200">
              <RefreshCw className="h-3 w-3 mr-1" />
              {isTr ? "Yenile" : "Refresh"}
            </Button>
          </Link>
        </div>
      )}

      {/* Received Offers Dashboard */}
      <section aria-label={isTr ? "Gelen Teklif Listesi" : "Received Offer List"}>
        <ReceivedOffersDashboard initialOffers={initialOffers} locale={locale} />
      </section>

      {/* Schema.org Structured Data */}
      <JsonLd data={jsonLd} />
    </div>
  );
}
