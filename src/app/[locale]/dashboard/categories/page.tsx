import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { FolderTree, Plus } from "lucide-react";
import { getSession } from "@/src/modules/auth/session";
import { CategoryService } from "@/src/modules/categories/service";
import { FollowedCategoriesView } from "@/src/components/dashboard/followed-categories-view";
import { Button } from "@/src/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  return {
    title: isTr ? "Takip Ettiğim Kategoriler" : "Followed Categories",
    description: isTr
      ? "Takip ettiğiniz teknoloji kategorileri ve canlı ilan bildirimleri."
      : "Manage your followed technology categories and listing feed preferences.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function DashboardCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isTr = locale === "tr";

  const session = await getSession();
  if (!session?.userId) {
    redirect(isTr ? "/tr/giris" : "/en/login");
  }

  const allCategories = await CategoryService.getAllCategories(
    locale === "tr" ? "tr" : "en",
    session.userId
  );
  const followed = allCategories.filter((c) => c.isFollowed);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <FolderTree className="h-5 w-5 fill-blue-400/20 text-blue-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {isTr ? "Takip Ettiğim Kategoriler" : "Followed Categories"}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "Uzmanlık alanlarınıza uygun ilanları doğrudan akışınızda görün ve bildirimler alın."
              : "Keep track of listings matching your tech stack with tailored notifications."}
          </p>
        </div>

        <Link href={isTr ? "/tr/kategoriler" : "/en/categories"}>
          <Button variant="shimmer" size="sm" className="gap-2 text-xs">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isTr ? "Daha Fazla Kategori Ekle" : "Browse All Categories"}</span>
          </Button>
        </Link>
      </div>

      {/* Categories Grid */}
      <FollowedCategoriesView categories={followed} locale={locale} />
    </div>
  );
}
