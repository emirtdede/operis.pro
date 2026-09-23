import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { CategoryService } from "@/src/modules/categories/service";
import { ListingWizardForm } from "@/src/components/listings/listing-wizard-form";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";
import { getSession } from "@/src/modules/auth/session";
import { JsonLd } from "@/src/components/seo/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  const title = isTr ? "İlan Yayınla — Ücretsiz Sihirbaz" : "Post a Listing — Free 5-Step Wizard";
  const description = isTr
    ? "5 adımlı güvenli sihirbaz ile yazılım ve teknoloji ilanınızı ücretsiz yayınlayın, 7 gün boyunca doğrulanmış uzmanlardan doğrudan teklif alın."
    : "Publish your technology listing for free with our 5-step guided wizard and receive direct 1-to-1 proposals for 7 days.";

  return {
    title,
    description,
    alternates: {
      canonical: isTr ? "/tr/ilanlar/yeni" : "/en/listings/new",
      languages: {
        tr: "/tr/ilanlar/yeni",
        en: "/en/listings/new",
      },
    },
    openGraph: {
      title,
      description,
      url: isTr ? "/tr/ilanlar/yeni" : "/en/listings/new",
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
      index: false, // Wizard forms shouldn't compete with indexable listings
      follow: true,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function NewListingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isTr = locale === "tr";
  const session = await getSession();
  if (!session?.userId) {
    redirect(
      isTr ? "/tr/giris?returnUrl=/tr/ilanlar/yeni" : "/en/login?returnUrl=/en/listings/new"
    );
  }

  const categories = await CategoryService.getAllCategories(isTr ? "tr" : "en").catch(() => []);

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
        name: isTr ? "İlanlar" : "Listings",
        item: `https://operis.pro${getLocalizedRoute("listings", locale)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: isTr ? "Yeni İlan" : "New Listing",
        item: `https://operis.pro${getLocalizedRoute("newListing", locale)}`,
      },
    ],
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Schema.org Structured Data */}
      <JsonLd data={jsonLd} />

      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--color-border-subtle)]">
        {/* Navigation Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]"
        >
          <Link
            href={getLocalizedRoute("listings", locale)}
            className="inline-flex items-center gap-1 hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isTr ? "İlanlara Dön" : "Back to Listings"}</span>
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--color-text-secondary)] font-medium">
            {isTr ? "Yeni İlan Oluştur" : "Create New Listing"}
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={getLocalizedRoute("listings", locale)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border-subtle)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isTr ? "Tüm İlanları Gör" : "Browse All Listings"}</span>
          </Link>
        </div>
      </div>

      {/* Split-Screen Wizard Form */}
      <section aria-label={isTr ? "İlan Oluşturma Sihirbazı" : "Listing Creation Wizard"} className="w-full">
        <Suspense
          fallback={
            <div className="w-full rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 p-12 text-center text-sm text-[var(--color-text-secondary)] animate-pulse">
              {isTr ? "İlan sihirbazı hazırlanıyor..." : "Preparing listing wizard..."}
            </div>
          }
        >
          <ListingWizardForm categories={categories} locale={locale} userId={session.userId} />
        </Suspense>
      </section>
    </main>
  );
}
