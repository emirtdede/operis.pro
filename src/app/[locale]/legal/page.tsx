import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalCenterClient } from "@/src/components/legal/legal-center-client";
import { serializeJsonLd } from "@/src/lib/security/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  const title = isTr
    ? "Yasal ve Güven Merkezi — Şeffaflık & Hukuki Zırh"
    : "Legal & Trust Center — Transparency & Protection";
  const description = isTr
    ? "Operis'in kar amacı gütmeyen, sıfır komisyonlu ve dava muafiyetli tüm yasal sözleşmeleri, KVKK aydınlatma metinleri ve fikri mülkiyet politikaları dizini."
    : "Comprehensive index of Operis terms of service, zero-commission policies, KVKK/GDPR notices, IP protection, and lawsuit immunity frameworks.";

  const url = isTr ? "https://operis.pro/tr/yasal" : "https://operis.pro/en/legal";

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: isTr ? "Operis Yasal ve Güven Merkezi" : "Operis Legal & Trust Center",
    description: isTr
      ? "Operis platformu yasal sözleşmeleri, gizlilik politikaları ve hukuki güvenceler dizini."
      : "Directory of Operis platform user agreements, privacy notices, and trust guarantees.",
    publisher: {
      "@type": "Organization",
      name: "Vellium",
      url: "https://vellium.dev",
    },
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

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
