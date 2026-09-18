"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { FileQuestion, Home, Search, PlusCircle, ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { ErrorCard } from "@/src/components/ui/error-card";

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const paramLocale = typeof params?.locale === "string" ? params.locale : null;
  const isEn = paramLocale === "en" || pathname?.startsWith("/en");
  const locale = isEn ? "en" : "tr";
  const isTr = !isEn;
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    document.title = isTr ? "404 — Sayfa Bulunamadı | Operis" : "404 — Page Not Found | Operis";
    if (typeof window !== "undefined" && window.history.length > 1) {
      setCanGoBack(true);
    }
  }, [isTr]);

  const feedPath = isTr ? "/tr/akis" : "/en/feed";
  const newListingPath = isTr ? "/tr/ilanlar/yeni" : "/en/listings/new";

  return (
    <main
      role="main"
      className="min-h-[75vh] flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8"
    >
      <ErrorCard
        code="404"
        badgeText="404 NOT FOUND"
        badgeColor="blue"
        statusLabel={
          isTr
            ? "Operis Servisleri: Tüm Sistemler Aktif"
            : "Operis Systems: All Services Operational"
        }
        subtitle={isTr ? "Sayfa Bulunamadı" : "Page Not Found"}
        title={isTr ? "Aradığınız Sayfa Mevcut Değil" : "This Page Does Not Exist"}
        description={
          isTr
            ? "Ulaşmaya çalıştığınız sayfa taşınmış, silinmiş veya bağlantı hatalı girilmiş olabilir. Aşağıdaki arama kutusunu kullanabilir veya güncel ilan akışını inceleyebilirsiniz."
            : "The page you are looking for may have been moved, deleted, or mistyped. Use the search bar below or explore current project listings."
        }
        icon={<FileQuestion className="h-8 w-8" aria-hidden="true" />}
      >
        {/* Instant Search Bar */}
        <form
          method="GET"
          action={feedPath}
          className="flex items-center gap-2 bg-[var(--color-surface-hover)] p-1.5 rounded-2xl border border-[var(--color-border-subtle)] focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner"
          role="search"
        >
          <Search
            className="h-4 w-4 text-[var(--color-text-tertiary)] ml-2.5 shrink-0"
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            aria-label={isTr ? "İlan veya teknoloji ara" : "Search listings or tech"}
            placeholder={
              isTr
                ? "İlan, teknoloji veya anahtar kelime ara..."
                : "Search listing, tech, or keyword..."
            }
            className="w-full bg-transparent px-2 py-1.5 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none"
          />
          <Button type="submit" variant="secondary" size="sm" className="px-3.5">
            {isTr ? "Ara" : "Search"}
          </Button>
        </form>

        {/* Popular Domain Shortcut Chips */}
        <div className="space-y-2.5 pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] block">
            {isTr ? "Popüler Alanlar:" : "Popular Domains:"}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { label: isTr ? "Ön Yüz" : "Frontend", slug: "frontend-ui" },
              { label: isTr ? "Arka Yüz" : "Backend", slug: "backend-api" },
              { label: "Full Stack", slug: "web-development" },
              { label: isTr ? "Mobil" : "Mobile", slug: "mobile-development" },
              { label: "DevOps & Cloud", slug: "devops-cloud" },
              { label: isTr ? "Yapay Zeka & ML" : "AI & ML", slug: "ai-ml" },
            ].map((cat) => (
              <Link
                key={cat.slug}
                href={`${feedPath}?category=${cat.slug}`}
                className="text-[11px] font-medium px-3 py-1 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 text-[var(--color-text-secondary)] hover:text-blue-400 hover:border-blue-500/40 hover:bg-[var(--color-surface-hover)] transition-all"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Action Button Grid */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4 border-t border-[var(--color-border-subtle)]/60">
          {canGoBack && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>{isTr ? "Geri Dön" : "Go Back"}</span>
            </Button>
          )}

          <Link href={`/${locale}`}>
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              <Home className="h-4 w-4" aria-hidden="true" />
              <span>{isTr ? "Ana Sayfa" : "Home"}</span>
            </Button>
          </Link>

          <Link href={feedPath}>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="gap-1.5 shadow-md shadow-blue-500/10"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              <span>{isTr ? "İlanları Keşfet" : "Browse Listings"}</span>
            </Button>
          </Link>

          <Link href={newListingPath}>
            <Button type="button" variant="secondary" size="sm" className="gap-1.5">
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              <span>{isTr ? "İlan Ver" : "Post Listing"}</span>
            </Button>
          </Link>
        </div>
      </ErrorCard>
    </main>
  );
}
