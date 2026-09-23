import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { BrandKitClient } from "@/src/components/brand/brand-kit-client";
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
    ? "Marka Kılavuzu & Medya Kiti — Resmi Varlıklar"
    : "Brand Guidelines & Media Kit — Official Assets";
  const description = isTr
    ? "Operis'in resmi vektör logoları, O-stream sembolü, optik kalibrasyon standartları, renk paleti ve marka kullanım kuralları."
    : "Official vector logos, calibrated O-stream symbol, optical kerning standards, color tokens, and brand usage rules for Operis.";

  const baseUrl = getBaseUrl();
  const url = isTr ? `${baseUrl}/tr/marka` : `${baseUrl}/en/brand`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        tr: "/tr/marka",
        en: "/en/brand",
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

export default async function BrandPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isTr = locale === "tr";

  const baseUrl = getBaseUrl();
  const brandUrl = `${baseUrl}${getLocalizedRoute("brand", locale)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: isTr ? "Operis Marka ve Tasarım Kılavuzu" : "Operis Brand Guidelines & Media Kit",
        description: isTr
          ? "Operis tescilli vektör logo varlıkları, renk paleti ve kullanım standartları."
          : "Official vector assets, color palette, and design guidelines for Operis.",
        url: brandUrl,
        inLanguage: locale,
        publisher: {
          "@type": "Organization",
          name: "Vellium",
          url: "https://vellium.dev",
          logo: `${baseUrl}/operis-logo-acik.svg`,
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
            name: isTr ? "Marka Kılavuzu" : "Brand Guidelines",
            item: brandUrl,
          },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Schema.org Structured Data */}
      <JsonLd data={jsonLd} />

      {/* Hero Header Section */}
      <header className="text-center space-y-4 max-w-3xl mx-auto pt-4 pb-2">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
          {isTr ? "Operis Marka Kılavuzu" : "Operis Brand Identity"}
        </h1>

        <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
          {isTr
            ? "Bağımsız yazılım mühendisleri ve teknoloji ekipleri için tasarlanan Operis markasının resmi vektörel logoları, optik kalibrasyon kuralları ve renk standartları."
            : "Official vector logos, optical calibration rules, design tokens, and media guidelines built for the Operis peer-to-peer technology network."}
        </p>
      </header>

      {/* Interactive Brand Client Component */}
      <BrandKitClient locale={locale} />
    </main>
  );
}
