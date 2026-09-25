import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalCenterClient } from "@/src/components/legal/legal-center-client";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";
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
    ? "Güven & Yasal Şeffaflık Merkezi"
    : "Trust & Legal Transparency Center";
  const description = isTr
    ? "Operis'in şeffaf kullanım koşulları, sıfır komisyon protokolü, KVKK aydınlatma metinleri ve fikri mülkiyet koruma ilkeleri dizini."
    : "Review Operis terms of service, zero-commission protocols, GDPR/KVKK compliance notices, and intellectual property protection framework.";

  const baseUrl = getBaseUrl();
  const url = isTr ? `${baseUrl}/tr/yasal` : `${baseUrl}/en/legal`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        tr: "/tr/yasal",
        en: "/en/legal",
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Operis",
      locale: isTr ? "tr_TR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LegalCenterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isTr = locale === "tr";

  const baseUrl = getBaseUrl();
  const legalUrl = `${baseUrl}${getLocalizedRoute("legalCenter", locale)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: isTr ? "Operis Yasal ve Güven Merkezi" : "Operis Legal & Trust Center",
        description: isTr
          ? "Operis platformu yasal sözleşmeleri, gizlilik politikaları ve hukuki güvenceler dizini."
          : "Directory of Operis platform user agreements, privacy notices, and trust guarantees.",
        url: legalUrl,
        inLanguage: locale,
        publisher: {
          "@type": "Organization",
          name: "Vellium",
          url: "https://vellium.dev",
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
            name: isTr ? "Yasal Merkez" : "Legal Center",
            item: legalUrl,
          },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Structured Schema.org JSON-LD */}
      <JsonLd data={jsonLd} />

      {/* Hero Header Section */}
      <header className="text-center space-y-4 max-w-3xl mx-auto pt-4 pb-2">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
          {isTr ? "Yasal ve Güven Merkezi" : "Legal & Trust Center"}
        </h1>

        <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
          {isTr
            ? "Operis'in kar amacı gütmeyen, sıfır ticari risk alan ve %0 komisyonlu açık teknoloji modeline ilişkin tüm bağlayıcı sözleşmeleri, gizlilik metinlerini ve fikri mülkiyet kurallarını tek bir merkezden inceleyin."
            : "Explore all binding agreements, privacy notices, intellectual property frameworks, and trust protections governing Operis's non-profit, zero-commission technology network."}
        </p>
      </header>

      {/* Interactive Client Component with Live Search & 9 Legal Document Cards */}
      <LegalCenterClient locale={locale} />
    </main>
  );
}
