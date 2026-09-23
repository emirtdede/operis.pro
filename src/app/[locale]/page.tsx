import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/src/modules/auth/session";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";
import { getBaseUrl } from "@/src/lib/config/url";
import {
  ArrowRight,
  Code2,
  Building2,
  Cpu,
  Palette,
  TrendingUp,
  Video,
  PenTool,
  Briefcase,
  Scale,
  Box,
  Headphones,
  Zap,
  Layers,
  Percent,
  Lock as LockIcon,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { SEED_SECTORS, SEED_CATEGORIES } from "@/db/seeds/categories";
import { Button } from "@/src/components/ui/button";
import { SpotlightCard } from "@/src/components/ui/spotlight-card";
import { JsonLd } from "@/src/components/seo/json-ld";
import { InteractiveArchitectureShowcase } from "@/src/components/diagrams/interactive-architecture-showcase";
import { HowItWorksSection } from "@/src/components/onboarding/how-it-works-section";
import { FaqAccordion } from "@/src/components/onboarding/faq-accordion";
import { HeroInteractivePreview } from "@/src/components/landing/hero-interactive-preview";
import { PlatformFeaturesGrid } from "@/src/components/landing/platform-features-grid";
import { PlatformComparisonTable } from "@/src/components/landing/platform-comparison-table";
import { PlatformProtocolStrip } from "@/src/components/landing/platform-protocol-strip";
import { RolePerspectiveSection } from "@/src/components/landing/role-perspective-section";
import { PlatformManifestoSection } from "@/src/components/landing/platform-manifesto-section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  const title = isTr
    ? "Doğrudan & Komisyonsuz Yazılım İlanları | Operis"
    : "Direct & Zero-Fee Tech Listings | Operis";

  const description = isTr
    ? "Türkiye ve küresel teknoloji profesyonelleri için doğrudan ve güvenli serbest çalışma platformu. Komisyon yok, aracı yok, %100 doğrudan iş birliği."
    : "Direct, transparent freelance matching for software engineers and technology professionals. Zero commission, zero escrow, 100% direct collaboration.";

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        tr: "/tr",
        en: "/en",
        "x-default": "/tr",
      },
    },
    openGraph: {
      title,
      description,
      url: `/${locale}`,
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
      index: true,
      follow: true,
    },
  };
}

export default async function LandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ preview?: string }>;
}) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : {};
  setRequestLocale(locale);

  const session = await getSession();
  if (session?.userId && sp.preview !== "true") {
    redirect(getLocalizedRoute("listings", locale));
  }

  const isTr = locale === "tr";

  const sectors = SEED_SECTORS.map((sec) => {
    const trans = isTr ? sec.translations.tr : sec.translations.en;
    const subCategories = SEED_CATEGORIES.filter((c) => c.sectorKey === sec.key);
    const topTags = subCategories
      .slice(0, 4)
      .map((c) => (isTr ? c.translations.tr.name : c.translations.en.name));

    const iconMap: Record<string, LucideIcon> = {
      "sector-software-it": Code2,
      "sector-ai-data": Cpu,
      "sector-design-creative": Palette,
      "sector-marketing-growth": TrendingUp,
      "sector-video-audio": Video,
      "sector-writing-translation": PenTool,
      "sector-business-finance": Briefcase,
      "sector-legal-compliance": Scale,
      "sector-engineering-3d": Box,
      "sector-operations-support": Headphones,
    };

    const colorMap: Record<string, { badge: string; iconBg: string }> = {
      "sector-software-it": {
        badge: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        iconBg: "text-blue-400 bg-blue-500/10",
      },
      "sector-ai-data": {
        badge: "text-purple-400 bg-purple-500/10 border-purple-500/20",
        iconBg: "text-purple-400 bg-purple-500/10",
      },
      "sector-design-creative": {
        badge: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        iconBg: "text-amber-400 bg-amber-500/10",
      },
      "sector-marketing-growth": {
        badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        iconBg: "text-emerald-400 bg-emerald-500/10",
      },
      "sector-video-audio": {
        badge: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        iconBg: "text-rose-400 bg-rose-500/10",
      },
      "sector-writing-translation": {
        badge: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
        iconBg: "text-indigo-400 bg-indigo-500/10",
      },
      "sector-business-finance": {
        badge: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
        iconBg: "text-cyan-400 bg-cyan-500/10",
      },
      "sector-legal-compliance": {
        badge: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
        iconBg: "text-yellow-400 bg-yellow-500/10",
      },
      "sector-engineering-3d": {
        badge: "text-teal-400 bg-teal-500/10 border-teal-500/20",
        iconBg: "text-teal-400 bg-teal-500/10",
      },
      "sector-operations-support": {
        badge: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
        iconBg: "text-fuchsia-400 bg-fuchsia-500/10",
      },
    };

    return {
      key: sec.key,
      name: trans.name,
      description: trans.description,
      categoryCount: subCategories.length,
      topCategories: topTags,
      icon: iconMap[sec.key] || Briefcase,
      colors: colorMap[sec.key] || {
        badge: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        iconBg: "text-blue-400 bg-blue-500/10",
      },
      href: isTr ? `/tr/kategoriler?sector=${sec.key}` : `/en/categories?sector=${sec.key}`,
    };
  });

  const baseUrl = getBaseUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/${locale}/#website`,
        url: `${baseUrl}/${locale}`,
        name: "Operis",
        description: isTr
          ? "Teknoloji ve Yazılım Serbest Çalışan Platformu"
          : "Modern Tech & Software Convergent Talent Platform",
        inLanguage: locale,
      },
      {
        "@type": "Organization",
        "@id": "https://vellium.dev/#organization",
        name: "Vellium",
        url: "https://vellium.dev",
        logo: `${baseUrl}/operis.svg`,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+90-212-555-0100",
          contactType: "customer service",
          availableLanguage: ["Turkish", "English"],
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
        ],
      },
    ],
  };

  return (
    <main className="flex flex-col w-full overflow-hidden">
      {/* Schema.org Structured Data */}
      <JsonLd data={jsonLd} />

      {/* 1. Expansive Hero Section (Full Viewport Height & Centered) */}
      <section className="relative flex flex-col justify-center items-center w-full min-h-[calc(100dvh-4rem)] px-4 sm:px-6 lg:px-8 text-center py-10 sm:py-16 snap-start">
        <div className="mx-auto max-w-6xl w-full space-y-8 sm:space-y-10 my-auto">
          {/* Top Operational Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-xs font-semibold text-blue-400 mx-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {isTr
                ? "Bağımsız Yazılım & Teknoloji İlan Ağı • %0 Komisyon Protokolü"
                : "Independent Software & Tech Network • 0% Commission Protocol"}
            </span>
          </div>

          {/* Display Typography with Masked Gradients */}
          <div className="space-y-4 sm:space-y-6">
            <h1 className="flex flex-col items-center gap-2 sm:gap-3.5 text-3xl sm:text-5xl lg:text-[3.75rem] xl:text-[4.25rem] font-extrabold tracking-tight text-[var(--color-text-primary)] max-w-6xl mx-auto leading-tight">
              {isTr ? (
                <>
                  <span className="block whitespace-normal sm:whitespace-nowrap">
                    Yazılımcılar ve İşverenler İçin
                  </span>
                  <span className="block text-gradient-accent whitespace-normal sm:whitespace-nowrap pb-1">
                    Komisyonsuz, Doğrudan İş Birliği
                  </span>
                </>
              ) : (
                <>
                  <span className="block whitespace-normal sm:whitespace-nowrap">
                    Direct, Zero-Commission Collaboration
                  </span>
                  <span className="block text-gradient-accent whitespace-normal sm:whitespace-nowrap pb-1">
                    for Engineers & Teams
                  </span>
                </>
              )}
            </h1>

            <p className="text-base sm:text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-relaxed">
              {isTr
                ? "Geleneksel platformların %20 komisyon kesintilerini, unutulmuş hayalet ilan kalabalığını ve açık artırma fiyat kırma savaşlarını tarihe gömüyoruz. Operis; doğrudan iletişim, şifrelenmiş birebir teklifler ve 7 günlük taze ilan radarıyla çalışan bağımsız bir eşleştirme platformudur."
                : "Leave 20% platform commissions, ghost listings, and public underbidding wars behind. Operis connects software engineers and project owners directly with encrypted 1-to-1 proposals and a 7-day freshness radar."}
            </p>
          </div>

          {/* Living Reactive Dual-Role CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-1">
            <Link href={isTr ? "/tr/akis" : "/en/feed"} className="w-full sm:w-auto">
              <Button variant="shimmer" size="lg" className="w-full sm:w-auto px-8 py-4 text-base gap-2">
                <Code2 className="h-4 w-4" aria-hidden="true" />
                <span>
                  {isTr ? "Yazılımcıyım: Canlı Akışı İncele" : "I'm a Developer: Explore Live Feed"}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link
              href={isTr ? "/tr/ilanlar/yeni" : "/en/listings/new"}
              className="w-full sm:w-auto"
            >
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto px-8 py-4 text-base gap-2"
              >
                <Building2 className="h-4 w-4" aria-hidden="true" />
                <span>
                  {isTr ? "İşverenim: 2 Dakikada İlan Ver" : "I'm a Client: Post a Free Listing"}
                </span>
              </Button>
            </Link>
          </div>

          {/* Key Metrics / Value Propositions Strip */}
          <div className="pt-6 border-t border-[var(--color-border-subtle)]/60 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-center">
            <div className="p-3 flex flex-col items-center justify-center text-center">
              <div className="text-2xl font-bold text-emerald-400 font-display">%0</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {isTr ? "Komisyon Kesintisi" : "Platform Escrow Fee"}
              </div>
            </div>
            <div className="p-3 flex flex-col items-center justify-center text-center">
              <div className="text-2xl font-bold text-cyan-400 font-display">
                {isTr ? "7 Gün" : "7 Days"}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {isTr ? "Maksimum İlan Canlılığı" : "Freshness Lifecycle"}
              </div>
            </div>
            <div className="p-3 flex flex-col items-center justify-center text-center">
              <div className="text-2xl font-bold text-indigo-400 font-display">
                {isTr ? "Gizli" : "Encrypted"}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {isTr ? "Birebir Şifreli Teklif" : "1:1 Protected Bids"}
              </div>
            </div>
            <div className="p-3 flex flex-col items-center justify-center text-center">
              <div className="text-2xl font-bold text-blue-400 font-display">%100</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {isTr ? "Doğrudan İletişim" : "Direct Relationship"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Protocol Guarantees Strip (100% Real Protocol Facts) */}
      <PlatformProtocolStrip isTr={isTr} />

      {/* 2. 'Operis Nedir ve Neyi Değiştirir?' Fundamental Pillars Section */}
      <section className="relative flex flex-col justify-center items-center w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 snap-start scroll-mt-16">
        <div className="mx-auto max-w-6xl w-full space-y-10">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              {isTr ? "OPERİS'İN TEMEL FELSEFESİ" : "CORE OPERATING PHILOSOPHY"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
              {isTr ? "Operis Nedir ve Neden Farklıdır?" : "What is Operis & Why Does It Matter?"}
            </h2>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "Operis, bir aracı kurum ya da emanetçi değildir. Yazılım dünyasında aracıları devreden çıkaran, tarafların eşit ve özgürce doğrudan iş birliği kurmasını sağlayan açık bir eşleştirme ağıdır."
                : "Operis is not an escrow broker or middleman agency. It is an open direct matching protocol designed to liberate tech collaboration with zero commission and uncensored communication."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SpotlightCard
              className="p-6 sm:p-7 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]"
              contentClassName="space-y-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Percent className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                {isTr ? "Emanetsiz & Kesintisiz Eşleşme" : "Zero Escrow & Direct Settlement"}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "Paranızı günlerce platform havuzunda bloke etmiyoruz. İşveren ve geliştirici ödeme yöntemini (Banka havalesi, fatura, kripto) ve takvimini aracı olmadan kendi yönetir."
                  : "We never hold your funds in custody or charge withdrawal fees. Clients and developers settle directly via bank transfer, crypto, or corporate invoicing."}
              </p>
            </SpotlightCard>

            <SpotlightCard
              className="p-6 sm:p-7 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]"
              contentClassName="space-y-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <LockIcon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                {isTr ? "Şifreli Kör Teklif Mimarisi" : "Sealed Encrypted Proposals"}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "Açık artırma mantığıyla fiyatların düşürüldüğü modeller yerine; teklif mektubunuz ve fiyatınız AES-256 ile mühürlenir. Rakipler göremez, yalnızca teknik kalite konuşur."
                  : "Say goodbye to public bidding wars. Proposals and quotes are encrypted with AES-256-GCM and readable exclusively by the listing creator."}
              </p>
            </SpotlightCard>

            <SpotlightCard
              className="p-6 sm:p-7 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]"
              contentClassName="space-y-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Clock className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                {isTr ? "7 Günlük Canlılık Radarı" : "Strict 7-Day Freshness Radar"}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "Sistemdeki hiçbir ilan 7 günden fazla açık kalamaz. Süresi biten ilanlar pasifleşir; aylarca unutulmuş hayalet ilanlara teklif harcamazsınız."
                  : "All projects expire after 7 days unless explicitly reactivated. Say goodbye to stale ghost jobs and interact only with active, responsive clients."}
              </p>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* 3. Dedicated Dual-Role Deep Dive: What Operis Delivers for Freelancers & Clients */}
      <RolePerspectiveSection isTr={isTr} locale={locale} />

      {/* 4. Interactive Live Card & Encrypted Proposal Simulator */}
      <section className="relative flex flex-col justify-center items-center w-full px-4 sm:px-6 lg:px-8 py-14 sm:py-20 snap-start scroll-mt-16 border-t border-[var(--color-border-subtle)]/40">
        <div className="mx-auto max-w-6xl w-full">
          <HeroInteractivePreview isTr={isTr} />
        </div>
      </section>

      {/* 3. Comprehensive Platform Capabilities & Features Grid (10 Core Features) */}
      <PlatformFeaturesGrid isTr={isTr} locale={locale} />

      {/* 4. End-to-End Engagement Workflow Guide (5 Phases from Start to Finish) */}
      <HowItWorksSection locale={locale} />

      {/* 5. Interactive SVG Architecture Showcase */}
      <section className="relative flex flex-col justify-center items-center w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 snap-start scroll-mt-16">
        <div className="mx-auto max-w-7xl w-full space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-400">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {isTr ? "GÜVENLİK VE KRİPTOGRAFİK MİMARİ" : "SECURITY & CRYPTOGRAPHIC ARCHITECTURE"}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {isTr
                ? "Operis'i Güçlendiren 3 Kriptografik Protokol"
                : "3 Cryptographic Protocols Powering Operis"}
            </h2>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
              {isTr
                ? "7 günlük yaşam radarı, AES-256-GCM birebir teklif şifreleme ve aracısız doğrudan eşleşme altyapısı."
                : "7-day freshness radar, AES-256-GCM encrypted bidding, and direct bilateral handshake protocols."}
            </p>
          </div>

          <InteractiveArchitectureShowcase isTr={isTr} />
        </div>
      </section>

      {/* 3. Dynamic Sector & Category Matrix */}
      <section className="relative flex flex-col justify-center items-center w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 snap-start scroll-mt-16">
        <div className="mx-auto max-w-7xl w-full space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {isTr ? "Sektörler ve Uzmanlık Dizinleri" : "Industry Sectors & Expertise"}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mt-1">
                {isTr
                  ? "10 Ana Sektör, 110 Uzmanlık Alanı"
                  : "10 Industry Sectors, 110 Specializations"}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-2xl">
                {isTr
                  ? "Yazılımdan tasarıma, yapay zekadan hukuka kadar tüm alanlarda doğrudan ve komisyonsuz serbest çalışma ekosistemi."
                  : "From software engineering and creative design to AI and legal compliance, explore direct zero-commission freelance opportunities."}
              </p>
            </div>
            <Link
              href={isTr ? "/tr/kategoriler" : "/en/categories"}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors shrink-0"
            >
              <span>{isTr ? "Tüm Kategorileri Gör (110)" : "View All Categories (110)"}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sectors.map((sec) => {
              const Icon = sec.icon;
              return (
                <Link key={sec.key} href={sec.href} className="group block">
                  <SpotlightCard className="h-full p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-blue-500/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${sec.colors.iconBg} group-hover:scale-110 transition-transform`}
                        >
                          <Icon className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${sec.colors.badge} transition-colors`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>
                              {sec.categoryCount} {isTr ? "Kategori" : "Categories"}
                            </span>
                          </span>
                          <ArrowRight
                            className="h-4 w-4 text-[var(--color-text-tertiary)] group-hover:text-blue-500 group-hover:translate-x-1 transition-all"
                            aria-hidden="true"
                          />
                        </div>
                      </div>

                      <h3 className="font-bold text-base text-[var(--color-text-primary)] group-hover:text-blue-400 transition-colors mb-2">
                        {sec.name}
                      </h3>

                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
                        {sec.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[var(--color-border-subtle)]/50">
                      {sec.topCategories.map((catName) => (
                        <span
                          key={catName}
                          className="inline-flex items-center rounded-md bg-[var(--color-surface-hover)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors"
                        >
                          {catName}
                        </span>
                      ))}
                    </div>
                  </SpotlightCard>
                </Link>
              );
            })}
          </div>

          {/* Clean "Explore All 110 Categories" Callout Banner */}
          <div className="mt-8 rounded-2xl border border-[var(--color-border-subtle)] bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                {isTr
                  ? "Tüm 10 Sektör ve 110 Uzmanlık Kategorisi"
                  : "Explore All 10 Sectors & 110 Categories"}
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {isTr
                  ? "Yazılım, Yapay Zeka, Tasarım, Pazarlama, Hukuk, Finans ve daha fazlasını doğrudan inceleyin ve takip edin."
                  : "Discover Software, AI, Design, Marketing, Legal, Finance, and more. Follow categories to build your custom direct feed."}
              </p>
            </div>
            <Link
              href={isTr ? "/tr/kategoriler" : "/en/categories"}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 transition-all shrink-0"
            >
              <span>{isTr ? "Kategoriler Dizinine Git" : "Explore Categories"}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Comprehensive Platform Comparison Table */}
      <PlatformComparisonTable isTr={isTr} locale={locale} />

      {/* 8. Platform Transparency & Independence Manifesto (Zero Fake Data) */}
      <PlatformManifestoSection isTr={isTr} />

      {/* 9. Frequently Asked Questions (FAQ) */}
      <FaqAccordion locale={locale} />

      {/* 10. Legal & Final Closing CTA */}
      <section className="relative flex flex-col justify-center items-center w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 snap-start scroll-mt-16">
        <div className="mx-auto max-w-5xl w-full space-y-8">
          {/* Final High-Impact CTA Card */}
          <div className="relative overflow-hidden rounded-3xl cta-card-surface p-8 sm:p-12 text-center space-y-6 transition-all duration-300">
            <div
              className="pointer-events-none absolute -top-32 -right-32 w-64 h-64 rounded-full bg-[var(--cta-card-aura)] blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-[var(--cta-card-aura)] blur-3xl"
              aria-hidden="true"
            />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)]">
              {isTr ? "Yazılım İlanınızı Bugün Yayınlayın" : "Launch Your Tech Listing Today"}
            </h2>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
              {isTr
                ? "Aracı komisyonu olmadan, doğrudan ve şifrelenmiş tekliflerle en iyi yazılım uzmanlarıyla hemen eşleşin."
                : "Zero commission cuts. Connect directly with top software engineers through secure encrypted offers."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link href={isTr ? "/tr/akis" : "/en/feed"} className="w-full sm:w-auto">
                <Button
                  variant="shimmer"
                  size="lg"
                  className="w-full sm:w-auto px-8 py-4 text-base"
                >
                  <span>{isTr ? "İlanları Keşfet" : "Browse Listings"}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link
                href={isTr ? "/tr/ilanlar/yeni" : "/en/listings/new"}
                className="w-full sm:w-auto"
              >
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto px-8 py-4 text-base cta-button-secondary shadow-sm transition-all"
                >
                  {isTr ? "Ücretsiz İlan Yayınla" : "Post a Free Listing"}
                </Button>
              </Link>
            </div>
          </div>

          {/* Subtle Integrated Platform Transparency Notice */}
          <div className="text-center max-w-3xl mx-auto px-4 text-xs text-[var(--color-text-tertiary)] leading-relaxed space-y-1.5 pt-2">
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              <span>
                {isTr
                  ? "Platform İşleyiş Duyurusu & Şeffaflık İlkesi"
                  : "Platform Operation & Transparency Principle"}
              </span>
            </div>
            <p>
              {isTr
                ? "Yürürlükteki mevzuatın izin verdiği azami ölçüde, Operis bağımsız bir keşif ve eşleştirme ağıdır. Platform üzerinde ödeme alınmaz, emanet (escrow) sistemi işletilmez, kullanıcılar adına fatura düzenlenmez ve taraflar kendi doğrudan sözleşmeleriyle çalışır."
                : "To the maximum extent permitted by applicable law, Operis operates strictly as an autonomous discovery venue without third-party escrow or commission lock-in."}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
