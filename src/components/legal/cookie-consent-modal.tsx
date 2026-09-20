"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Cookie,
  X,
  Check,
  ShieldCheck,
  ChartColumn,
  Megaphone,
  SlidersHorizontal,
} from "lucide-react";
import { getLocalizedLegalPath } from "@/src/lib/i18n/routes";
import { Locale } from "@/src/lib/i18n/config";

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  updatedAt: string;
}

const COOKIE_STORAGE_KEY = "operis_cookie_consent";
const COOKIE_CONSENT_EVENT = "operis-cookie-consent-updated";
const OPEN_COOKIE_MODAL_EVENT = "open-cookie-modal";

export function openCookiePreferences() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(OPEN_COOKIE_MODAL_EVENT, { detail: { view: "preferences" } })
    );
  }
}

export function openCookieModal(view: "main" | "preferences" = "main") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_COOKIE_MODAL_EVENT, { detail: { view } }));
  }
}

interface CookieConsentModalProps {
  locale: string;
}

function getPreferencesBackButtonLabel(isManualOpen: boolean, isTr: boolean): string {
  if (isManualOpen) {
    return isTr ? "Kapat" : "Close";
  }
  return isTr ? "Geri Dön" : "Back";
}

export function CookieConsentModal({ locale }: CookieConsentModalProps) {
  const isTr = locale === "tr";
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"main" | "preferences">("main");
  const [isManualOpen, setIsManualOpen] = useState(false);

  // Preference switches
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);
  const [functional, setFunctional] = useState(true);

  // Initialize consent on client mount
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const stored = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CookiePreferences;
        setAnalytics(parsed.analytics ?? true);
        setMarketing(parsed.marketing ?? true);
        setFunctional(parsed.functional ?? true);
      } else {
        // First-time visit: show initial prompt at bottom-left
        timer = setTimeout(() => {
          setView("main");
          setIsManualOpen(false);
          setIsOpen(true);
        }, 1000);
      }
    } catch {
      // Fallback
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Listen for custom trigger event (e.g. from footer button)
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ view?: "main" | "preferences" }>;
      setView(customEvent.detail?.view || "preferences");
      setIsManualOpen(true);
      setIsOpen(true);
    };

    window.addEventListener(OPEN_COOKIE_MODAL_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_COOKIE_MODAL_EVENT, handleOpen);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const saveConsent = useCallback(
    (prefs: { analytics: boolean; marketing: boolean; functional: boolean }) => {
      const record: CookiePreferences = {
        essential: true,
        analytics: prefs.analytics,
        marketing: prefs.marketing,
        functional: prefs.functional,
        updatedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(record));
        document.cookie = `operis_cookie_consent=1; path=/; max-age=31536000; SameSite=Lax`;
        window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: record }));
      } catch {
        // Silent error handling for restricted storage environments
      }

      setIsOpen(false);
    },
    []
  );

  const handleAcceptAll = () => {
    setAnalytics(true);
    setMarketing(true);
    setFunctional(true);
    saveConsent({ analytics: true, marketing: true, functional: true });
  };

  const handleOnlyEssential = () => {
    setAnalytics(false);
    setMarketing(false);
    setFunctional(false);
    saveConsent({ analytics: false, marketing: false, functional: false });
  };

  const handleSavePreferences = () => {
    saveConsent({ analytics, marketing, functional });
  };

  if (!isOpen) return null;

  // VIEW 1: Initial Cookie Notice (Floating card matching user's reference image shape with theme colors)
  if (view === "main") {
    return (
      <aside
        className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 z-[950] w-[calc(100vw-2rem)] sm:w-[410px] max-w-[calc(100vw-2rem)] pt-7 transition-all duration-300 ease-out animate-in fade-in-0 slide-in-from-bottom-5"
        role="region"
        aria-label={isTr ? "Çerez Bildirimi" : "Cookie Notice"}
      >
        <div className="relative rounded-[28px] sm:rounded-[32px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/98 backdrop-blur-2xl px-4 sm:px-6 pb-4 sm:pb-6 pt-7 sm:pt-8 shadow-2xl shadow-black/30 dark:shadow-black/80">
          {/* Top Center Circular Cookie Badge (Exactly preserved original design) */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center justify-center h-14 w-14 rounded-full border-2 border-amber-500/40 bg-[var(--color-surface-base)] shadow-lg shadow-black/20 z-10">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-500/15">
              <Cookie className="h-6 w-6 text-amber-500 dark:text-amber-400" aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-3.5">
            {/* Description Text with Bold and Underlined Links */}
            <p className="text-xs leading-relaxed text-[var(--color-text-secondary)] font-normal text-left sm:text-center">
              {isTr ? (
                <>
                  <strong className="font-bold text-[var(--color-text-primary)]">
                    &ldquo;Kabul Et&rdquo;
                  </strong>{" "}
                  butonuna tıklayarak, site gezintisini iyileştirmek, kullanımı analiz etmek ve
                  pazarlama faaliyetlerimizi desteklemek için cihazınızda çerez saklanmasını kabul
                  etmiş olursunuz. Detaylar için{" "}
                  <Link
                    href={getLocalizedLegalPath("privacy", locale as Locale)}
                    className="font-semibold text-[var(--color-text-primary)] underline underline-offset-4 decoration-[var(--color-border-strong)] hover:text-blue-500 hover:decoration-blue-500 transition-colors"
                  >
                    Gizlilik Politikası
                  </Link>{" "}
                  ve{" "}
                  <Link
                    href={getLocalizedLegalPath("cookies", locale as Locale)}
                    className="font-semibold text-[var(--color-text-primary)] underline underline-offset-4 decoration-[var(--color-border-strong)] hover:text-blue-500 hover:decoration-blue-500 transition-colors"
                  >
                    Çerez Politikası
                  </Link>{" "}
                  sayfalarımızı inceleyebilirsiniz.
                </>
              ) : (
                <>
                  By clicking{" "}
                  <strong className="font-bold text-[var(--color-text-primary)]">
                    &ldquo;Accept All&rdquo;
                  </strong>
                  , you consent to the storage of cookies on your device to improve site navigation,
                  analyze site usage, and support our marketing activities. For details, review our{" "}
                  <Link
                    href={getLocalizedLegalPath("privacy", locale as Locale)}
                    className="font-semibold text-[var(--color-text-primary)] underline underline-offset-4 decoration-[var(--color-border-strong)] hover:text-blue-500 hover:decoration-blue-500 transition-colors"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    href={getLocalizedLegalPath("cookies", locale as Locale)}
                    className="font-semibold text-[var(--color-text-primary)] underline underline-offset-4 decoration-[var(--color-border-strong)] hover:text-blue-500 hover:decoration-blue-500 transition-colors"
                  >
                    Cookie Policy
                  </Link>
                  .
                </>
              )}
            </p>

            {/* 3 Action Buttons: Responsive vertical stack on fold/mobile, 3-column on desktop */}
            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleOnlyEssential}
                className="w-full whitespace-nowrap px-3 sm:px-2 py-2.5 rounded-xl sm:rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-active)] text-xs font-semibold text-[var(--color-text-primary)] transition-all shadow-sm active:scale-[0.98] text-center cursor-pointer"
              >
                {isTr ? "Yalnızca Gerekli" : "Only Essential"}
              </button>

              <button
                type="button"
                onClick={() => setView("preferences")}
                className="w-full whitespace-nowrap px-3 sm:px-2 py-2.5 rounded-xl sm:rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-active)] text-xs font-semibold text-[var(--color-text-primary)] transition-all shadow-sm active:scale-[0.98] text-center cursor-pointer"
              >
                {isTr ? "Tercihler" : "Preferences"}
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                className="w-full whitespace-nowrap px-3 sm:px-2 py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] text-center cursor-pointer"
              >
                {isTr ? "Tümünü Kabul Et" : "Accept All"}
              </button>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // VIEW 2: Preferences Modal (Centered modal, lighter backdrop overlay)
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/35 backdrop-blur-[2px] transition-all duration-200 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={isTr ? "Çerez ve Gizlilik Tercihleri" : "Cookie and Privacy Preferences"}
    >
      {/* Gentle backdrop: click outside to dismiss */}
      <div
        className="absolute inset-0"
        onClick={() => {
          if (isManualOpen) {
            setIsOpen(false);
          } else {
            setView("main");
          }
        }}
        aria-hidden="true"
      />

      {/* Center Pop-Up Modal Card */}
      <div className="relative w-full max-w-[530px] max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 sm:p-7 shadow-2xl shadow-black/25 z-10 transition-all duration-200 animate-in fade-in-0 zoom-in-95 overflow-hidden">
        {/* Header with Title and Close 'X' */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center shrink-0">
              <Cookie className="h-4 w-4 text-amber-400" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] tracking-tight">
                {isTr ? "Çerez ve Gizlilik Tercihleri" : "Cookie & Privacy Preferences"}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "Tercihlerinizi dilediğiniz zaman güncelleyebilirsiniz"
                  : "You can adjust your preferences anytime"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-xl text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border border-transparent hover:border-[var(--color-border-subtle)] transition-all cursor-pointer"
            aria-label={isTr ? "Kapat" : "Close"}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* List of 4 Preference Cards */}
        <div className="space-y-2.5 flex-1 min-h-0 overflow-y-auto pr-1 py-3 overscroll-contain">
          {/* 1. Zorunlu Çerezler */}
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/70 p-3.5 sm:p-4 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                <span>{isTr ? "Zorunlu Çerezler" : "Strictly Necessary"}</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "Sitenin güvenliği, oturum devamlılığı ve temel fonksiyonlarının çalışması için zorunludur."
                  : "Required for basic security, session integrity, and vital platform operations."}
              </p>
            </div>
            <span className="shrink-0 text-[10px] sm:text-[11px] font-semibold text-amber-500 dark:text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 sm:px-2.5 py-1 rounded-lg">
              {isTr ? "Her Zaman Etkin" : "Always Active"}
            </span>
          </div>

          {/* 2. Analitik & Performans */}
          <label className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/70 hover:bg-[var(--color-surface-hover)] p-3.5 sm:p-4 flex items-start justify-between gap-3 cursor-pointer transition-colors">
            <div className="space-y-1">
              <div className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
                <ChartColumn className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0" aria-hidden="true" />
                <span>{isTr ? "Analitik & Performans" : "Analytics & Performance"}</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "Site kullanımını anonim olarak analiz etmemize ve deneyimi geliştirmemize yardımcı olur."
                  : "Helps us anonymously measure traffic to understand usage and refine workflows."}
              </p>
            </div>
            <div className="shrink-0 pt-0.5">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="h-5 w-5 rounded border-[var(--color-border-strong)] text-blue-600 accent-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </label>

          {/* 3. Pazarlama & Duyurular */}
          <label className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/70 hover:bg-[var(--color-surface-hover)] p-3.5 sm:p-4 flex items-start justify-between gap-3 cursor-pointer transition-colors">
            <div className="space-y-1">
              <div className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-purple-500 dark:text-purple-400 shrink-0" aria-hidden="true" />
                <span>{isTr ? "Pazarlama & Duyurular" : "Marketing & Updates"}</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "İlgi alanlarınıza uygun kişiselleştirilmiş teknoloji duyuruları ve ürün bildirimleri sunmamızı sağlar."
                  : "Enables tailored engineering announcements and release notes relevant to your focus."}
              </p>
            </div>
            <div className="shrink-0 pt-0.5">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="h-5 w-5 rounded border-[var(--color-border-strong)] text-blue-600 accent-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </label>

          {/* 4. İşlevsel & Yerel Tercihler */}
          <label className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/70 hover:bg-[var(--color-surface-hover)] p-3.5 sm:p-4 flex items-start justify-between gap-3 cursor-pointer transition-colors">
            <div className="space-y-1">
              <div className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" aria-hidden="true" />
                <span>{isTr ? "İşlevsel & Yerel Tercihler" : "Functional & Regional Preferences"}</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "Karanlık/aydınlık tema, dil tercihi ve filtre ayarlarınızı cihazınızda yerel olarak hatırlar."
                  : "Remembers your dark/light theme, active locale, and interface filters on your device."}
              </p>
            </div>
            <div className="shrink-0 pt-0.5">
              <input
                type="checkbox"
                checked={functional}
                onChange={(e) => setFunctional(e.target.checked)}
                className="h-5 w-5 rounded border-[var(--color-border-strong)] text-blue-600 accent-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </label>
        </div>

        {/* Bottom Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-3 border-t border-[var(--color-border-subtle)]/60 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (isManualOpen) {
                setIsOpen(false);
              } else {
                setView("main");
              }
            }}
            className="w-full whitespace-nowrap px-4 py-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] transition-all shadow-sm active:scale-[0.98] text-center cursor-pointer order-2 sm:order-1"
          >
            {getPreferencesBackButtonLabel(isManualOpen, isTr)}
          </button>

          <button
            type="button"
            onClick={handleSavePreferences}
            className="w-full whitespace-nowrap px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 text-center cursor-pointer order-1 sm:order-2"
          >
            <Check className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
            <span>{isTr ? "Tercihleri Kaydet" : "Save Preferences"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
