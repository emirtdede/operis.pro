import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { ProfileService } from "@/src/modules/profiles/service";
import { getSession } from "@/src/modules/auth/session";
import { getLocalizedProfilePath } from "@/src/lib/i18n/routes";
import { JsonLd } from "@/src/components/seo/json-ld";
import { PublicProfileView } from "@/src/components/profile/public-profile-view";
import { getBaseUrl } from "@/src/lib/config/url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}): Promise<Metadata> {
  const { locale, handle } = await params;
  const isTr = locale === "tr";
  const profile = await ProfileService.getPublicProfileByHandle(handle);

  if (!profile) {
    return {
      title: isTr ? "Profil Bulunamadı" : "Profile Not Found",
    };
  }

  const title = `${profile.displayName} (@${profile.handle})`;
  const description = profile.headline
    ? `${profile.displayName} — ${profile.headline}. ${isTr ? "Operis doğrulanmış profili ve portfolyosu." : "Operis verified profile and portfolio."}`
    : isTr
      ? `${profile.displayName} kullanıcısının Operis profili ve doğrulanmış iş geçmişi.`
      : `Public profile and verified project history for ${profile.displayName} on Operis.`;

  return {
    title,
    description,
    alternates: {
      canonical: getLocalizedProfilePath(handle, locale),
      languages: {
        tr: getLocalizedProfilePath(handle, "tr"),
        en: getLocalizedProfilePath(handle, "en"),
      },
    },
    openGraph: {
      title,
      description,
      url: getLocalizedProfilePath(handle, locale),
      siteName: "Operis",
      locale: isTr ? "tr_TR" : "en_US",
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const { locale, handle } = await params;
  setRequestLocale(locale);

  const isTr = locale === "tr";
  const [profile, session] = await Promise.all([
    ProfileService.getPublicProfileByHandle(handle),
    getSession(),
  ]);

  if (!profile) {
    notFound();
  }

  const isSelf = Boolean(session?.userId && session.userId === profile.userId);
  const baseUrl = getBaseUrl();
  const profileUrl = `${baseUrl}${getLocalizedProfilePath(profile.handle, (locale as "tr" | "en") || "tr")}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        name: `${profile.displayName} (@${profile.handle})`,
        url: profileUrl,
        mainEntity: {
          "@type": "Person",
          name: profile.displayName,
          alternateName: profile.handle,
          jobTitle: profile.headline || undefined,
          description: profile.about || profile.headline,
          address: profile.location
            ? {
                "@type": "PostalAddress",
                addressLocality: profile.location.city,
                addressCountry: profile.location.countryCode,
              }
            : undefined,
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
            name: profile.displayName,
            item: profileUrl,
          },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-5xl xl:max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Schema.org Structured Data */}
      <JsonLd data={jsonLd} />

      {/* Navigation Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]"
      >
        <Link
          href={isTr ? "/tr/ilanlar" : "/en/listings"}
          className="inline-flex items-center gap-1 hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{isTr ? "İlanlara Dön" : "Back to Listings"}</span>
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[var(--color-text-secondary)] font-medium">@{profile.handle}</span>
      </nav>

      {/* Main Profile View with In-Place Editing */}
      <PublicProfileView
        initialProfile={profile}
        locale={locale}
        isSelf={isSelf}
      />
    </main>
  );
}
