import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { Layers, ArrowLeft } from "lucide-react";
import { getSession } from "@/src/modules/auth/session";
import { FeedService } from "@/src/modules/listings/feed/service";
import { ListingEditForm } from "@/src/components/listings/listing-edit-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  return {
    title: isTr ? "İlanı Düzenle" : "Edit Listing",
    description: isTr
      ? "İlanınızın kapsamını, bütçesini ve detaylarını güncelleyin."
      : "Update your listing scope, budget, and details.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const isTr = locale === "tr";

  const session = await getSession();
  if (!session?.userId) {
    redirect(isTr ? "/tr/giris" : "/en/login");
  }

  const data = await FeedService.getListingBySlug(slug);
  if (!data) {
    notFound();
  }

  const isOwner = Boolean(session.userId === data.listing.ownerUserId);
  if (!isOwner) {
    redirect(isTr ? "/tr/yetkisiz" : "/en/unauthorized");
  }

  const { listing } = data;

  if (listing.status === "DELETED") {
    notFound();
  }

  if (listing.status === "MATCHED" || listing.status === "COMPLETED") {
    redirect(isTr ? `/tr/ilanlar/${listing.slug}` : `/en/listings/${listing.slug}`);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
            <Link
              href={isTr ? `/tr/ilanlar/${listing.slug}` : `/en/listings/${listing.slug}`}
              className="hover:text-[var(--color-text-primary)] transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isTr ? "İlana Geri Dön" : "Back to Listing"}</span>
            </Link>
            <span>/</span>
            <span>{isTr ? "Düzenle" : "Edit"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-blue-400" aria-hidden="true" />
            <span>{isTr ? "İlanı Düzenle" : "Edit Listing"}</span>
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "Yayındaki veya taslak ilanınızın detaylarını revize edin. Değişiklikler geçmişe kaydedilir."
              : "Revise listing scope, tags, and budget. Revisions are safely versioned."}
          </p>
        </div>
      </header>

      {/* Edit Form */}
      <ListingEditForm
        listing={{
          id: listing.id,
          slug: listing.slug,
          title: listing.title,
          summary: listing.summary,
          scope: listing.scope,
          tags: listing.tags,
          budgetMin: listing.budgetMin,
          budgetMax: listing.budgetMax,
        }}
        locale={locale}
      />
    </main>
  );
}
