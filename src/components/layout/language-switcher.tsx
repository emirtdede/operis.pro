"use client";

import { usePathname, useRouter, useParams } from "next/navigation";
import { locales, Locale } from "@/src/lib/i18n/config";

import { getAlternateLocalePath } from "@/src/lib/i18n/routes";

function resolveActiveLocale(
  currentLocale?: Locale,
  paramLocale?: unknown,
  pathname = ""
): Locale {
  if (currentLocale) {
    return currentLocale;
  }
  if (paramLocale && locales.includes(paramLocale as Locale)) {
    return paramLocale as Locale;
  }
  if (pathname.startsWith("/en")) {
    return "en";
  }
  return "tr";
}

export function LanguageSwitcher({
  currentLocale,
  className = "",
}: {
  currentLocale?: Locale;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const activeLocale: Locale = resolveActiveLocale(currentLocale, params?.locale, pathname);

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === activeLocale) return;

    // Persist locale cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `fp_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    try {
      localStorage.setItem("fp_locale", newLocale);
    } catch {
      // ignore
    }

    const basePath = getAlternateLocalePath(pathname, newLocale);
    const qs =
      typeof window !== "undefined" && window.location.search
        ? window.location.search.replace(/^\?/, "")
        : "";
    const targetUrl = qs ? `${basePath}?${qs}` : basePath;
    router.push(targetUrl);
  };

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`inline-flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0.5 text-xs font-medium select-none ${className}`}
    >
      <button
        type="button"
        onClick={() => switchLocale("tr")}
        aria-pressed={activeLocale === "tr"}
        className={`px-2.5 py-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
          activeLocale === "tr"
            ? "bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold shadow-xs"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        }`}
      >
        TR
      </button>
      <button
        type="button"
        onClick={() => switchLocale("en")}
        aria-pressed={activeLocale === "en"}
        className={`px-2.5 py-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
          activeLocale === "en"
            ? "bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold shadow-xs"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        }`}
      >
        EN
      </button>
    </div>
  );
}
