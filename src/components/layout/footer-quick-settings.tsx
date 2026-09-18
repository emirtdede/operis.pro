"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Globe, Sun, Moon, Contrast, Check } from "lucide-react";
import { useTheme, Theme } from "./theme-provider";
import { Locale } from "@/src/lib/i18n/config";
import { getAlternateLocalePath } from "@/src/lib/i18n/routes";

export function FooterQuickSettings() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const isTr = pathname.startsWith("/tr");
  const currentLocale: Locale = isTr ? "tr" : "en";

  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setThemeOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLangOpen(false);
        setThemeOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLanguageSelect = (newLocale: Locale) => {
    setLangOpen(false);
    if (newLocale === currentLocale) return;

    // Persist user preference for 1 year
    try {
      localStorage.setItem("fp_locale", newLocale);
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = `fp_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignored in restricted environments
    }

    const nextPath = getAlternateLocalePath(pathname, newLocale);
    const qs =
      typeof window !== "undefined" && window.location.search
        ? window.location.search.replace(/^\?/, "")
        : "";
    const targetUrl = qs ? `${nextPath}?${qs}` : nextPath;
    router.push(targetUrl);
  };

  const handleThemeSelect = (newTheme: Theme) => {
    setTheme(newTheme);
    setThemeOpen(false);
  };

  const themeOptions: { id: Theme; labelTr: string; labelEn: string; icon: typeof Sun }[] = [
    { id: "light", labelTr: "Açık Tema", labelEn: "Light Theme", icon: Sun },
    { id: "dark", labelTr: "Koyu Tema", labelEn: "Dark Theme", icon: Moon },
    { id: "black", labelTr: "Saf Siyah (OLED)", labelEn: "True Black", icon: Contrast },
  ];

  return (
    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
      {/* 1. Language Dropdown Button (Frameless Icon) */}
      <div className="relative" ref={langRef}>
        <button
          type="button"
          onClick={() => {
            setLangOpen(!langOpen);
            setThemeOpen(false);
          }}
          aria-label={isTr ? "Dil Seçimi Menüsü" : "Language Selection Menu"}
          aria-haspopup="true"
          aria-expanded={langOpen}
          className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-all border-0 bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title={isTr ? "Dili Değiştir (Türkçe / English)" : "Change Language (English / Türkçe)"}
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
        </button>

        {langOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            className="absolute bottom-full right-0 sm:right-auto sm:left-0 mb-2 w-44 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 shadow-2xl shadow-black/20 dark:shadow-black/70 z-50 animate-in fade-in zoom-in-95 duration-150 select-none"
          >
            <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {isTr ? "Dil Seçimi" : "Select Language"}
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => handleLanguageSelect("tr")}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                currentLocale === "tr"
                  ? "bg-blue-500/10 text-blue-500 font-semibold"
                  : "text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              <span>Türkçe (TR)</span>
              {currentLocale === "tr" && (
                <Check className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => handleLanguageSelect("en")}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                currentLocale === "en"
                  ? "bg-blue-500/10 text-blue-500 font-semibold"
                  : "text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              <span>English (EN)</span>
              {currentLocale === "en" && (
                <Check className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Separator Dot */}
      <span className="text-[var(--color-border-subtle)] select-none">•</span>

      {/* 2. Theme Dropdown Button (Frameless Icon) */}
      <div className="relative" ref={themeRef}>
        <button
          type="button"
          onClick={() => {
            setThemeOpen(!themeOpen);
            setLangOpen(false);
          }}
          aria-label={isTr ? "Görünüm ve Tema Menüsü" : "Theme Selection Menu"}
          aria-haspopup="true"
          aria-expanded={themeOpen}
          className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-all border-0 bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
          title={isTr ? "Temayı Değiştir" : "Change Theme"}
        >
          {theme === "light" && <Sun className="h-4 w-4" aria-hidden="true" />}
          {theme === "dark" && <Moon className="h-4 w-4" aria-hidden="true" />}
          {theme === "black" && <Contrast className="h-4 w-4" aria-hidden="true" />}
        </button>

        {themeOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            className="absolute bottom-full right-0 mb-2 w-48 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 shadow-2xl shadow-black/20 dark:shadow-black/70 z-50 animate-in fade-in zoom-in-95 duration-150 select-none"
          >
            <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {isTr ? "Görünüm Teması" : "Display Theme"}
            </div>
            {themeOptions.map((opt) => {
              const IconComp = opt.icon;
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleThemeSelect(opt.id)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-blue-500/10 text-blue-500 font-semibold"
                      : "text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <IconComp className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{isTr ? opt.labelTr : opt.labelEn}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
