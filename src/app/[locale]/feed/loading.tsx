"use client";

import { useTranslations } from "next-intl";

export default function FeedLoading() {
  const t = useTranslations("common");

  return (
    <main
      role="status"
      aria-live="polite"
      aria-label={t("loading")}
      className="mx-auto max-w-2xl px-4 py-6 sm:py-8 space-y-4"
    >
      <span className="sr-only">{t("loading")}</span>


      {/* Minimal Tabs + Action Skeleton */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2.5 gap-4">
        <div className="flex items-center gap-6">
          <div className="h-5 w-24 rounded-lg bg-[var(--color-surface-hover)] animate-pulse" />
          <div className="h-5 w-28 rounded-lg bg-[var(--color-surface-hover)]/60 animate-pulse" />
        </div>
        <div className="h-7 w-20 rounded-full bg-blue-500/20 animate-pulse" />
      </div>

      {/* Continuous Stream Skeleton */}
      <div className="divide-y divide-[var(--color-border-subtle)]">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="py-4 sm:py-5 px-2 sm:px-3 space-y-3"
          >
            {/* Author Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]/60 animate-pulse shrink-0" />
                <div className="h-3.5 w-32 rounded bg-[var(--color-surface-hover)] animate-pulse" />
              </div>
              <div className="h-3 w-16 rounded bg-[var(--color-surface-hover)] animate-pulse" />
            </div>

            {/* Title & Summary */}
            <div className="space-y-1.5 pt-0.5">
              <div className="h-5 w-4/5 rounded bg-[var(--color-surface-hover)]/80 animate-pulse" />
              <div className="h-3.5 w-full rounded bg-[var(--color-surface-hover)]/60 animate-pulse" />
            </div>

            {/* Inline metadata */}
            <div className="h-3.5 w-48 rounded bg-[var(--color-surface-hover)]/40 animate-pulse" />

            {/* Footer */}
            <div className="pt-2 flex items-center justify-between">
              <div className="h-3 w-12 rounded bg-[var(--color-surface-hover)]/40 animate-pulse" />
              <div className="h-6 w-28 rounded-lg bg-[var(--color-surface-hover)]/50 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
