"use client";

import { useLocale, useTranslations } from "next-intl";
import { Search, Globe, LayoutGrid, PlusCircle } from "lucide-react";

export default function ListingsLoading() {
  const t = useTranslations("common");
  const locale = useLocale();
  const isTr = locale === "tr";

  return (
    <main
      role="status"
      aria-live="polite"
      aria-label={t("loading")}
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10"
    >
      <span className="sr-only">{t("loading")}</span>

      {/* Centered End-User Friendly Hero Header Skeleton (Canlı başlıkla tam 2 satır milimetrik uyum) */}
      <header className="relative text-center max-w-3xl mx-auto space-y-3 pt-2 pb-2 flex flex-col items-center">
        {/* Satır 1: Başlık ("İlanları Keşfedin") */}
        <div className="h-10 sm:h-12 w-64 sm:w-80 rounded-2xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]/70 animate-pulse shadow-2xs" />
        
        {/* Satır 2: Açıklama ("Yazılım, tasarım ve teknolojideki güncel iş ilanlarını...") */}
        <div className="h-5 w-4/5 sm:w-[580px] max-w-full rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]/50 animate-pulse" />
      </header>

      {/* Unified Command & Filter Bar Skeleton */}
      <section aria-label={isTr ? "Kategori ve Arama Filtresi Yükleniyor" : "Loading filters"}>
        <div className="relative rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-2 sm:p-2.5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search input placeholder */}
            <div className="relative flex-1 flex items-center h-10 px-3.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]/60 gap-2">
              <Search className="h-4 w-4 text-[var(--color-text-tertiary)] shrink-0 opacity-60" />
              <div className="h-3.5 w-48 rounded bg-[var(--color-border-subtle)]/60 animate-pulse" />
            </div>

            {/* Category Dropdown Trigger Placeholder */}
            <div className="h-10 px-3.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]/60 flex items-center gap-2 shrink-0">
              <Globe className="h-3.5 w-3.5 text-blue-400 opacity-70" />
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                {isTr ? "Tüm Kategoriler (110)" : "All Categories (110)"}
              </span>
            </div>

            {/* Sector Matrix Trigger Placeholder */}
            <div className="h-10 px-3.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]/60 flex items-center gap-2 shrink-0">
              <LayoutGrid className="h-3.5 w-3.5 text-blue-400 opacity-70" />
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                {isTr ? "Sektör Matrisi" : "Sector Matrix"}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                10
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Listings Stream Header & Card Skeletons */}
      <section className="space-y-6">
        {/* Counter and Action Button Row */}
        <div className="flex items-center justify-between gap-4 text-xs border-b border-[var(--color-border-subtle)] pb-3">
          <div className="h-4 w-52 sm:w-64 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]/50 animate-pulse" />
          <div className="h-9 px-4 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center gap-2 text-blue-400 text-xs font-semibold shrink-0 shadow-sm whitespace-nowrap">
            <PlusCircle className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{isTr ? "Yeni İlan Yayınla" : "Publish Listing"}</span>
          </div>
        </div>

        {/* 2-Column Listing Cards Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="relative rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 backdrop-blur-xl p-6 space-y-4 shadow-sm"
            >
              {/* Card Header: Category Badge & Freshness */}
              <div className="flex items-center justify-between gap-2">
                <div className="h-5 w-24 rounded-md bg-blue-500/10 border border-blue-500/20 animate-pulse" />
                <div className="h-5 w-28 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]/50 animate-pulse" />
              </div>

              {/* Title & Summary */}
              <div className="space-y-2">
                <div className="h-6 w-3/4 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]/60 animate-pulse" />
                <div className="h-4 w-full rounded-md bg-[var(--color-surface-hover)]/80 border border-[var(--color-border-subtle)]/40 animate-pulse" />
                <div className="h-4 w-5/6 rounded-md bg-[var(--color-surface-hover)]/60 border border-[var(--color-border-subtle)]/30 animate-pulse" />
              </div>

              {/* Metadata Badges: Budget & Timeline */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="h-6 w-28 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]/50 animate-pulse" />
                <div className="h-6 w-24 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]/50 animate-pulse" />
              </div>

              {/* Card Footer: Owner & Stats */}
              <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]/50 animate-pulse" />
                  <div className="h-3.5 w-24 rounded bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]/40 animate-pulse" />
                </div>
                <div className="h-4 w-20 rounded bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]/30 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
