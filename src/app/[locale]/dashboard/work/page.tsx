import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Rocket, Compass } from "lucide-react";
import { getSession } from "@/src/modules/auth/session";
import { EngagementService } from "@/src/modules/engagements/service";
import {
  ActiveEngagementsDashboard,
  ActiveEngagementItem,
} from "@/src/components/dashboard/active-engagements-dashboard";
import { MandatoryReviewBanner } from "@/src/components/dashboard/mandatory-review-banner";
import { Button } from "@/src/components/ui/button";
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
    ? "Aktif İlanlar & Projeler — Çalışma Merkezi"
    : "Active Projects & Engagements — Work Hub";
  const description = isTr
    ? "Eşleştiğiniz ve şu anda üzerinde çalıştığınız tüm aktif ilanları ve projeleri tek ekrandan yönetin."
    : "Manage and collaborate across all your ongoing matched projects and jobs in one place.";

  return {
    title,
    description,
    alternates: {
      canonical: isTr ? "/tr/panel/aktif-isler" : "/en/dashboard/work",
      languages: {
        tr: "/tr/panel/aktif-isler",
        en: "/en/dashboard/work",
      },
    },
    openGraph: {
      title,
      description,
      url: isTr ? "/tr/panel/aktif-isler" : "/en/dashboard/work",
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

export default async function ActiveWorkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isTr = locale === "tr";
  const session = await getSession();
  if (!session?.userId) {
    redirect(
      isTr ? "/tr/giris?returnUrl=/tr/panel/aktif-isler" : "/en/login?returnUrl=/en/dashboard/work"
    );
  }

  let engagements: ActiveEngagementItem[];
  let fetchError = false;

  try {
    const rawEngagements = await EngagementService.getUserEngagements(session.userId, {
      role: "all",
      status: "all",
      limit: 100,
    });
    engagements = rawEngagements as ActiveEngagementItem[];
  } catch {
    fetchError = true;
    engagements = [];
  }

  const baseUrl = getBaseUrl();
  const jsonLd = {
    "@context": "https://schema.org",
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
        name: isTr ? "Aktif Projelerim" : "Active Projects",
        item: `${baseUrl}/${locale}/dashboard/work`,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Rocket className="h-5 w-5 text-blue-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {isTr ? "Aktif İlanlar & Projelerim" : "My Active Projects"}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "Devam eden iş birlikleriniz, tamamlanma süreçleri ve özel çalışma alanları."
              : "Your ongoing active collaborations, completion stages, and private workspaces."}
          </p>
        </div>

        <Link href={isTr ? "/tr/ilanlar" : "/en/listings"}>
          <Button variant="shimmer" size="sm" className="gap-2 text-xs">
            <Compass className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isTr ? "Yeni İlanları Keşfet" : "Browse Opportunities"}</span>
          </Button>
        </Link>
      </div>

      {/* Mandatory Review Banner */}
      <MandatoryReviewBanner locale={locale} />

      {/* Content Stream */}
      {fetchError ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-400">
            {isTr
              ? "Aktif projeler yüklenirken bir sorun oluştu."
              : "Failed to load active projects."}
          </p>
          <Link href={isTr ? "/tr/panel/aktif-isler" : "/en/dashboard/work"}>
            <Button variant="outline" size="sm" className="mt-2 text-xs">
              {isTr ? "Sayfayı Yenile" : "Refresh"}
            </Button>
          </Link>
        </div>
      ) : (
        <ActiveEngagementsDashboard initialEngagements={engagements} locale={locale} />
      )}

      {/* Schema.org Structured Data */}
      <JsonLd data={jsonLd} />
    </div>
  );
}
