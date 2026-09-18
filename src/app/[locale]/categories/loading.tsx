"use client";

import { useLocale, useTranslations } from "next-intl";
import { Search, ChevronDown, Layers, BookmarkCheck, ArrowRight, Plus } from "lucide-react";

export default function CategoriesLoading() {
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

      {/* Centered Hero Header Skeleton — Tam Olarak 236px Yükseklik (Canlı Başlıkla Milimetrik Eşleşme) */}
      <header className="text-center max-w-4xl mx-auto space-y-4 pt-2 pb-2">
        {/* 2 Satırlı Başlık İskeleti — Tam Olarak 120px Yükseklik (48px + 24px gap + 48px = 120px) */}
        <div className="h-[120px] flex flex-col items-center justify-between">
          {/* Satır 1: "Geleceğin Projelerini ve Doğru" */}
          <div className="h-12 w-4/5 sm:w-[620px] max-w-full rounded-2xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]/60 animate-pulse" />
          {/* Satır 2: "Yetenekleri Keşfedin" (Diğer iskelet elemanlarıyla birebir aynı nötr renk ve sınır) */}
          <div className="h-12 w-3/5 sm:w-[380px] max-w-full rounded-2xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]/60 animate-pulse" />
        </div>

        {/* 3 Satırlı Açıklama İskeleti — Tam Olarak 84px Yükseklik (18px + 15px gap + 18px + 15px gap + 18px = 84px) */}
        <div className="h-[84px] max-w-2xl mx-auto flex flex-col items-center justify-between">
          <div className="h-[18px] w-full rounded-lg bg-[var(--color-surface-hover)] animate-pulse" />
          <div className="h-[18px] w-11/12 rounded-lg bg-[var(--color-surface-hover)]/80 animate-pulse" />
          <div className="h-[18px] w-2/5 rounded-lg bg-[var(--color-surface-hover)]/60 animate-pulse" />
        </div>
      </header>

      {/* Interactive Controls & Cards Skeleton Container (Canlı Sayfayla Birebir space-y-6) */}
      <div className="space-y-6">
        {/* Single Unified Modern Command Bar İskeleti (Tam Olarak y: 421, Yükseklik: 62px) */}
        <div className="relative rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/85 backdrop-blur-xl p-2 sm:p-2.5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Akıcı Kategori ve Beceri Arama Girdisi İskeleti (Sol Entegre) */}
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]"
                aria-hidden="true"
              />
              <input
                type="text"
                readOnly
                placeholder={
                  isTr
                    ? "Kategori veya beceri ara (örn. Frontend, Unity, Next.js, SEO)..."
                    : "Filter specializations (e.g. Frontend, Unity, Next.js, Cloud)..."
                }
                className="w-full h-10 rounded-xl bg-transparent border-none pl-9 pr-8 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none transition-all select-none"
              />
            </div>

            {/* Dikey İnce Ayraç (Masaüstü) */}
            <div className="hidden sm:block h-6 w-px bg-[var(--color-border-subtle)]/70 mx-0.5" />

            {/* Sektör Seçici Tetikleyici İskeleti (Sağ Entegre, Genişlik: 320px, Yükseklik: 40px) */}
            <div className="w-full sm:w-72 md:w-80 h-10 px-3 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]/70 flex items-center justify-between gap-2 shrink-0 select-none">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-6 w-6 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Layers className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                  {isTr ? "Tüm Sektörler" : "All Sectors"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                  {isTr ? "110 alan • 0 ilan" : "110 areas • 0 listings"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Frameless Meta Bar İskeleti (Tam Olarak y: 507, Yükseklik: 28px) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 text-xs -mt-2">
          {/* Sol: Canlı İlan ve Uzmanlık Sayacı */}
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)] font-medium">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span>
              <strong className="font-bold text-[var(--color-text-primary)]">110</strong>{" "}
              {isTr ? "uzmanlık" : "specializations"}
            </span>
            <span className="opacity-40">•</span>
            <span>
              <strong className="font-bold text-blue-600 dark:text-blue-400">0</strong>{" "}
              {isTr ? "aktif ilan listeleniyor" : "active listings"}
            </span>
          </div>

          {/* Sağ: Takip Durumu & Toplu Aksiyonlar */}
          <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
            <div className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
              <BookmarkCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <span>
                <strong className="font-semibold text-[var(--color-text-primary)]">0</strong>{" "}
                {isTr ? "takip ediliyor" : "following"}
              </span>
            </div>
            <div className="h-3.5 w-px bg-[var(--color-border-subtle)] hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] select-none">
                {isTr ? "Tümünü Takip Et" : "Follow All"}
              </span>
              <span className="px-2 py-1 text-xs text-[var(--color-text-tertiary)] select-none">
                {isTr ? "Tümünü Bırak" : "Unfollow"}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Sütunlu Spotlight Kategori Kartları Izgarası İskeleti (Tam Olarak y: 559, Kart Yüksekliği: 269.5px) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div
              key={idx}
              className="h-[269.5px] rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-6 flex flex-col justify-between backdrop-blur-xl shadow-xs"
            >
              <div className="flex flex-col flex-1">
                {/* Üst Satır: İkon Kutusu ve Sağ Rozetler */}
                <div className="flex items-start justify-between mb-3.5">
                  <div className="h-11 w-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <div className="h-5 w-5 rounded bg-blue-500/20" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] border-[var(--color-border-subtle)]">
                      {isTr ? "0 ilan" : "0 listings"}
                    </span>
                    <div className="h-4 w-20 rounded bg-[var(--color-surface-hover)] animate-pulse" />
                  </div>
                </div>

                {/* Kategori Başlığı İskeleti (Tam 44px min-h) */}
                <div className="min-h-[2.75rem] flex items-center">
                  <div
                    className="h-5 rounded-lg bg-[var(--color-surface-hover)] animate-pulse"
                    style={{ width: `${idx % 3 === 0 ? 65 : idx % 3 === 1 ? 78 : 52}%` }}
                  />
                </div>

                {/* Açıklama Satırları İskeleti (Tam 40px + pt-1.5) */}
                <div className="space-y-2 pt-1.5 min-h-[2.5rem]">
                  <div className="h-3.5 w-full rounded bg-[var(--color-surface-hover)]/70 animate-pulse" />
                  <div className="h-3.5 w-4/5 rounded bg-[var(--color-surface-hover)]/50 animate-pulse" />
                </div>
              </div>

              {/* Alt Satır: Aksiyon Linki & Takip Butonu */}
              <div className="mt-5 flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]/60 shrink-0">
                <div className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>{isTr ? "İlanlar (0)" : "Listings (0)"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>

                <div className="h-8 px-3 rounded-lg bg-blue-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs select-none">
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isTr ? "Takip Et" : "Follow"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
