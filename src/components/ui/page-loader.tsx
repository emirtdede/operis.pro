"use client";

import { useTranslations } from "next-intl";

export function PageLoader({ message }: { message?: string }) {
  const t = useTranslations("common");
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message || t("loading")}
      className="flex min-h-[50vh] items-center justify-center p-8"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-500" />
        <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
          {message || t("loading")}
        </span>
      </div>
    </div>
  );
}
