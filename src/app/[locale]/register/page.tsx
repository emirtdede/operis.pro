import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { RegisterForm } from "@/src/components/auth/register-form";
import { AuthValueHero } from "@/src/components/onboarding/auth-value-hero";
import { getSession } from "@/src/modules/auth/session";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";
import { serializeJsonLd } from "@/src/lib/security/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  const title = isTr
    ? "Hesap Oluştur — Tek Hesap, Çift Yetenek"
    : "Join Network — Dual-Role Account";
  const description = isTr
    ? "Ücretsiz hesap oluşturarak hem ilan yayınlayabilir hem de ilanlara teklif verebilirsiniz. Tek hesap, çift yetenek."
    : "Create a free single account with dual capabilities to both post technology listings and submit direct proposals.";

  return {
    title,
    description,
    alternates: {
      canonical: isTr ? "/tr/kayit" : "/en/register",
      languages: {
        tr: "/tr/kayit",
        en: "/en/register",
      },
    },
    openGraph: {
      title,
      description,
      url: isTr ? "/tr/kayit" : "/en/register",
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
      index: false,
      follow: true,
    },
  };
}

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ returnUrl?: string }>;
}) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : {};
  setRequestLocale(locale);

  // Authenticated users must not access register page; redirect to returnUrl or workspace
  const session = await getSession();
  if (session) {
    if (sp.returnUrl && /^\/(tr|en)(\/|$)/.test(sp.returnUrl) && !sp.returnUrl.startsWith("//")) {
      redirect(sp.returnUrl);
    }
    redirect(getLocalizedRoute("dashboardListings", locale));
  }

  const isTr = locale === "tr";
  const registerUrl = isTr ? "https://operis.pro/tr/kayit" : "https://operis.pro/en/register";

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
        name: isTr ? "Kayıt Ol" : "Join Network",
        item: registerUrl,
      },
    ],
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Value Proposition & Guarantees */}
        <div className="lg:col-span-5 sticky top-24">
          <AuthValueHero locale={locale} isRegister={true} />
        </div>

        {/* Right Column: Multi-Step Registration Form */}
        <div className="lg:col-span-7 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Background ambient glow */}
          <div
            className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 space-y-6">
            <header className="space-y-2 border-b border-[var(--color-border-subtle)]/70 pb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                {isTr ? "Ücretsiz Hesap Oluşturun" : "Create Your Free Account"}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "Tek hesap ile hem dilediğiniz zaman ilan verin hem de teklif sunun."
                  : "One verified account gives you dual capabilities to both publish work and submit proposals."}
              </p>
            </header>

            <section aria-label={isTr ? "Kayıt Sihirbazı" : "Registration Wizard"}>
              <RegisterForm locale={locale} returnUrl={sp.returnUrl} />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
