import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/src/components/auth/login-form";
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

  const title = isTr ? "Giriş Yap — Güvenli Oturum" : "Sign In — Secure Portal Access";
  const description = isTr
    ? "Hesabınıza güvenle giriş yaparak teknoloji ilanlarını inceleyin, tekliflerinizi yönetin ve doğrudan iletişim kurun."
    : "Log in securely to review technology listings, manage proposals, and access direct match workspaces.";

  return {
    title,
    description,
    alternates: {
      canonical: isTr ? "/tr/giris" : "/en/login",
      languages: {
        tr: "/tr/giris",
        en: "/en/login",
      },
    },
    openGraph: {
      title,
      description,
      url: isTr ? "/tr/giris" : "/en/login",
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

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ returnUrl?: string }>;
}) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : {};
  setRequestLocale(locale);

  // Authenticated users must not access login page; redirect to returnUrl or workspace
  const session = await getSession();
  if (session) {
    if (sp.returnUrl && /^\/(tr|en)(\/|$)/.test(sp.returnUrl) && !sp.returnUrl.startsWith("//")) {
      redirect(sp.returnUrl);
    }
    redirect(getLocalizedRoute("dashboardListings", locale));
  }

  const isTr = locale === "tr";
  const loginUrl = isTr ? "https://operis.pro/tr/giris" : "https://operis.pro/en/login";

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
        name: isTr ? "Giriş Yap" : "Sign In",
        item: loginUrl,
      },
    ],
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Value Proposition & Guarantees */}
        <div className="lg:col-span-6 flex flex-col">
          <AuthValueHero locale={locale} isRegister={false} />
        </div>

        {/* Right Column: Clean Login Form */}
        <div className="lg:col-span-6 flex flex-col justify-center h-full rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-8 lg:p-12 shadow-2xl relative overflow-hidden">
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
            <header className="space-y-1.5 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                {isTr ? "Hesabınıza Giriş Yapın" : "Welcome Back"}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "Teknoloji ilanlarınızı ve tekliflerinizi yönetmek için oturum açın."
                  : "Sign in to manage your technology listings and proposals."}
              </p>
            </header>

            <section aria-label={isTr ? "Giriş Formu" : "Login Form"}>
              <LoginForm locale={locale} returnUrl={sp.returnUrl} />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
