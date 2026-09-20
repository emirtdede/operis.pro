import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ShieldCheck, Lock, Clock, CheckCircle2, ArrowLeft } from "lucide-react";
import { CategoryService } from "@/src/modules/categories/service";
import { ListingWizardForm } from "@/src/components/listings/listing-wizard-form";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";
import { getSession } from "@/src/modules/auth/session";
import { serializeJsonLd } from "@/src/lib/security/json-ld";

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
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

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

      {/* Header with Guidance */}
      <header className="space-y-4 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
          {isTr ? "Yeni İlan Yayınlayın" : "Publish a New Listing"}
        </h1>
        <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
          {isTr
            ? "İhtiyacınızı net bir şekilde tanımlayın; ilanınız 7 gün boyunca tazelik radarında aktif kalır ve alanında uzman yazılımcılardan şifrelenmiş birebir teklifler almanızı sağlar."
            : "Define your technical scope; your project stays active on our freshness radar for 7 days to receive direct, encrypted 1-to-1 proposals from verified software specialists."}
        </p>
      </header>

      {/* 3 Step Onboarding Flow Strip */}
      <section
        aria-label={isTr ? "İlan Süreci Özeti" : "Publishing Process Overview"}
        className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto"
      >
        <div className="group relative overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-5 sm:p-6 space-y-2.5 transition-all duration-300 hover:border-blue-500/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-blue-500">ADIM 01</span>
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </div>
          <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
            {isTr ? "Kapsamı ve Teknolojileri Belirleyin" : "Define Scope & Tech Stack"}
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Beklenen çıktıları ve teknolojileri detaylandırın; doğru uzmanların dikkatini çekin."
              : "Detail deliverables and required stacks to attract the right technical expertise."}
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-5 sm:p-6 space-y-2.5 transition-all duration-300 hover:border-cyan-500/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-cyan-400">ADIM 02</span>
            <div className="h-7 w-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </div>
          <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
            {isTr ? "1 Haftalık Canlılık Radarı" : "1-Week Freshness Window"}
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "İlanınız 1 hafta boyunca en üstte listelenir; süre bitiminde tek tıkla ücretsiz yenilenebilir."
              : "Your project stays fresh for 1 week; reactivate anytime with 1 click at 0 cost."}
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-5 sm:p-6 space-y-2.5 transition-all duration-300 hover:border-emerald-500/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-400">ADIM 03</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </div>
          <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
            {isTr ? "Gizli Teklifler & Doğrudan Eşleşme" : "Encrypted Offers & Direct Match"}
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Teklifler yalnızca size özeldir. Beğendiğiniz teklifi onaylayın, iletişim bilgilerini açın."
              : "Offers are strictly private. Accept your preferred proposal to unlock direct contact."}
          </p>
        </div>
      </section>

      {/* Trust & Privacy Reassurance Notice */}
      <section
        aria-label={isTr ? "Gizlilik Güvencesi" : "Privacy Reassurance"}
        className="max-w-5xl mx-auto rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-5 sm:p-6 backdrop-blur-xl flex items-start gap-4 shadow-sm"
      >
        <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
          <span className="font-semibold text-[var(--color-text-primary)] block">
            {isTr ? "Gizlilik ve Komisyonsuzluk Güvencesi" : "Privacy & Zero-Fee Guarantee"}
          </span>
          <p>
            {isTr
              ? "Telefon numaranız ve e-posta adresiniz ilanda asla gösterilmez. İlan yayınlama ve eşleşme %100 ücretsizdir. Platform ne işverenden ne de uzmandan hiçbir komisyon almaz."
              : "Your phone number and email are never shown on public listings. Posting and matching are 100% free with 0% platform cuts."}
          </p>
        </div>
      </section>

      {/* Wizard Form */}
      <section aria-label={isTr ? "İlan Oluşturma Sihirbazı" : "Listing Creation Wizard"}>
        <Suspense
          fallback={
            <div className="mx-auto max-w-3xl rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 p-12 text-center text-sm text-[var(--color-text-secondary)] animate-pulse">
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
