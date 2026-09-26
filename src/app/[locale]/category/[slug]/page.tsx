import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { CategoryService } from "@/src/modules/categories/service";
import { CategoryLandingView } from "@/src/components/categories/category-landing-view";
import { constructCanonicalUrl } from "@/src/lib/config/url";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{
    q?: string;
    mode?: string;
    view?: string;
    timeRange?: "all" | "24h" | "3d" | "7d";
    last24Hours?: string;
    budgetSpecific?: string;
    budgetType?: "all" | "fixed" | "hourly" | "open";
    minBudget?: string;
    maxBudget?: string;
    currency?: string;
    timelineScope?: "all" | "short" | "medium" | "long" | "flexible";
    companyVerified?: string;
    tags?: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const isTr = locale === "tr";
  const category = await CategoryService.getCategoryBySlug(slug, locale as "tr" | "en");

  if (!category) {
    return {
      title: isTr ? "Kategori Bulunamadı" : "Category Not Found",
    };
  }

  const title = isTr
    ? `${category.name} Freelance İş İlanları — Operis`
    : `${category.name} Freelance Jobs & Projects — Operis`;
  const description = isTr
    ? `${category.name} alanındaki en güncel freelance iş ilanlarını inceleyin. %0 komisyonla doğrudan işverenle iletişime geçin.`
    : `Explore verified freelance jobs and projects in ${category.name}. Connect directly with hiring teams with 0% platform commission.`;

  const trPath = `/tr/kategori/${category.slug}`;
  const enPath = `/en/category/${category.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: constructCanonicalUrl(isTr ? trPath : enPath),
      languages: {
        tr: constructCanonicalUrl(trPath),
        en: constructCanonicalUrl(enPath),
        "x-default": constructCanonicalUrl(trPath),
      },
    },
    openGraph: {
      title,
      description,
      url: constructCanonicalUrl(isTr ? trPath : enPath),
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

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  return (
    <CategoryLandingView
      locale={locale as "tr" | "en"}
      slug={slug}
      searchParams={sp}
    />
  );
}
