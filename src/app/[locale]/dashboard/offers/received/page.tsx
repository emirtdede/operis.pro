import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Lock, ShieldCheck } from "lucide-react";
import { getSession } from "@/src/modules/auth/session";
import { OfferService } from "@/src/modules/offers/service";
import {
  ReceivedOffersDashboard,
  ReceivedOfferItem,
} from "@/src/components/dashboard/received-offers-dashboard";
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

  const receivedOffersUrl = isTr
    ? "https://operis.pro/tr/panel/teklifler/gelen"
    : "https://operis.pro/en/dashboard/offers/received";

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
        item: `https://operis.pro${isTr ? "/tr/panel/ilanlarim" : "/en/dashboard/listings"}`,
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
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {isTr ? "Gelen Teklifler" : "Received Offers"}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "İlanlarınıza gelen tüm teklifler şifrelenmiştir ve yalnızca sizin tarafınızdan görüntülenebilir."
              : "All proposals submitted to your listings are encrypted and visible exclusively to you."}
          </p>
        </div>

        <Link href={isTr ? "/tr/panel/ilanlarim" : "/en/dashboard/listings"}>
          <Button variant="secondary" size="sm">
            {isTr ? "İlanlarıma Dön" : "My Listings"}
          </Button>
        </Link>
      </header>

      {/* Unified Dashboard Navigation Tabs */}
      <DashboardTabs locale={locale} counts={{ receivedOffers: initialOffers.length }} />

      {/* Acceptance Guidance & Invariant Rules */}
      <section
        aria-label={isTr ? "Teklif Değerlendirme Rehberi" : "Proposal Review Guide"}
        className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            <span className="font-semibold text-[var(--color-text-primary)] block">
              {isTr
                ? "Teklif Onayı Süreci & Otomatik Ret Kuralları"
                : "Offer Acceptance & Auto-Decline Mechanics"}
            </span>
            <p>
              {isTr
                ? "Bir teklifi kabul ettiğinizde sistem o teklif sahibi ile doğrudan çalışma alanınızı açar. İlanınızdaki diğer tüm bekleyen teklifler otomatik olarak 'Diğer teklif seçildi' gerekçesiyle nezaketle reddedilir."
                : "Accepting a proposal creates an active bilateral workspace and unlocks direct contacts. All other pending offers on the listing are automatically transitioned to declined."}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-emerald-400 self-end sm:self-center">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span>{isTr ? "Gizli ve Şifreli" : "Encrypted & Safe"}</span>
        </div>
      </section>

      {/* Received Offers Dashboard */}
      {fetchError ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-400">
            {isTr
              ? "Gelen teklifleriniz yüklenirken bir sorun oluştu."
              : "An error occurred while loading incoming proposals."}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {isTr
              ? "Sunucu bağlantısında anlık bir gecikme yaşanmış olabilir. Lütfen sayfayı yenileyiniz."
              : "There may have been a temporary network blip. Please refresh the page to try again."}
          </p>
          <Link href={isTr ? "/tr/panel/teklifler/gelen" : "/en/dashboard/offers/received"}>
            <Button variant="outline" size="sm" className="mt-2 text-xs">
              {isTr ? "Sayfayı Yenile" : "Refresh Page"}
            </Button>
          </Link>
        </div>
      ) : (
        <section aria-label={isTr ? "Gelen Teklif Listesi" : "Received Offer List"}>
          <ReceivedOffersDashboard initialOffers={initialOffers} locale={locale} />
        </section>
      )}
    </main>
  );
}
