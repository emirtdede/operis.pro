import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Send, ShieldCheck, Compass } from "lucide-react";
import { getSession } from "@/src/modules/auth/session";
import { OfferService } from "@/src/modules/offers/service";
import {
  SentOffersDashboard,
  SentOfferItem,
} from "@/src/components/dashboard/sent-offers-dashboard";
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

  const sentOffersUrl = isTr
    ? "https://operis.pro/tr/panel/teklifler/gonderilen"
    : "https://operis.pro/en/dashboard/offers/sent";

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
        name: isTr ? "Teklif Verdiğim İlanlar" : "My Sent Offers",
        item: sentOffersUrl,
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
            {isTr ? "Teklif Verdiğim İlanlar" : "Listings I Bid On"}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "İlanlar için verdiğiniz tekliflerin güncel durumlarını buradan izleyebilirsiniz."
              : "Review and manage all proposals you have submitted to listing owners."}
          </p>
        </div>

        <Link href={isTr ? "/tr/ilanlar" : "/en/listings"}>
          <Button variant="shimmer" size="sm" className="gap-2">
            <Compass className="h-4 w-4" aria-hidden="true" />
            <span>{isTr ? "Yeni İlanları Keşfet" : "Browse Listings"}</span>
          </Button>
        </Link>
      </header>

      {/* Unified Dashboard Navigation Tabs */}
      <DashboardTabs locale={locale} counts={{ sentOffers: initialOffers.length }} />

      {/* Sent Offers Lifecycle Guidance Banner */}
      <section
        aria-label={isTr ? "Teklif Durumları Rehberi" : "Proposal Status Guide"}
        className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <Send className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            <span className="font-semibold text-[var(--color-text-primary)] block">
              {isTr ? "Teklif Durumları ve Haklarınız" : "Proposal Lifecycles & Rights"}
            </span>
            <p>
              {isTr
                ? "Teklifleriniz rakiplere kapalıdır. 'Beklemede' olan teklifinizi istediğiniz zaman güncelleyebilir veya geri çekebilirsiniz. İlan sahibi teklifinizi kabul ettiğinde eşleşme alanına yönlendirilirsiniz."
                : "Your offers are strictly confidential. You may update or withdraw any 'Pending' proposal at any time. Once accepted, you will receive direct contact channels in the workspace."}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-emerald-400 self-end sm:self-center">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span>{isTr ? "%100 Kazanç" : "100% Take-Home"}</span>
        </div>
      </section>

      {/* Sent Offers Dashboard */}
      {fetchError ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-400">
            {isTr
              ? "Teklifleriniz yüklenirken bir sorun oluştu."
              : "An error occurred while loading your proposals."}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {isTr
              ? "Sunucu bağlantısında anlık bir gecikme yaşanmış olabilir. Lütfen sayfayı yenileyiniz."
              : "There may have been a temporary network blip. Please refresh the page to try again."}
          </p>
          <Link href={isTr ? "/tr/panel/teklifler/gonderilen" : "/en/dashboard/offers/sent"}>
            <Button variant="outline" size="sm" className="mt-2 text-xs">
              {isTr ? "Sayfayı Yenile" : "Refresh Page"}
            </Button>
          </Link>
        </div>
      ) : (
        <section aria-label={isTr ? "Gönderilen Teklif Listesi" : "Sent Offer List"}>
          <SentOffersDashboard initialOffers={initialOffers} locale={locale} />
        </section>
      )}
    </main>
  );
}
