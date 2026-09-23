"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Locale } from "@/src/lib/i18n/config";
import { getLocalizedRoute, getLocalizedLegalPath } from "@/src/lib/i18n/routes";
import { BrandLogo } from "./brand-logo";
import { FooterQuickSettings } from "./footer-quick-settings";
import { openCookiePreferences } from "@/src/components/legal/cookie-consent-modal";
import { VelliumLogo } from "./vellium-logo";

export function Footer() {
  const t = useTranslations("footer");
  const legal = useTranslations("legal");
  const common = useTranslations("common");
  const params = useParams();
  const locale = ((params?.locale as string) || "tr") as Locale;
  const isTr = locale === "tr";
  const pathname = usePathname();
  const listingsRoute = getLocalizedRoute("listings", locale);
  const feedRoute = getLocalizedRoute("feed", locale);
  const isFeedPage =
    pathname === listingsRoute ||
    pathname === feedRoute ||
    pathname === `/${locale}/ilanlar` ||
    pathname === `/${locale}/listings` ||
    pathname === `/${locale}/akis` ||
    pathname === `/${locale}/feed` ||
    pathname?.startsWith(`/${locale}/akis/`) ||
    pathname?.startsWith(`/${locale}/feed/`);

  if (isFeedPage) {
    return null;
  }

  const isHomePage = pathname === `/${locale}` || pathname === `/${locale}/` || pathname === "/";
  const currentYear = new Date().getFullYear();

  const platformLinks = [
    {
      href: getLocalizedRoute("listings", locale),
      label: isTr ? "İlanları Keşfet" : "Browse Listings",
    },
    {
      href: getLocalizedRoute("categories", locale),
      label: isTr ? "Teknoloji Kategorileri" : "Tech Categories",
    },
    {
      href: getLocalizedRoute("newListing", locale),
      label: isTr ? "İlan Yayınla" : "Post a Listing",
    },
    {
      href: `${getLocalizedRoute("help", locale)}#nasil-calisir`,
      label: isTr ? "Nasıl Çalışır?" : "How It Works",
    },
    {
      href: getLocalizedRoute("feed", locale),
      label: isTr ? "Canlı Radar & Akış" : "Live Radar & Feed",
    },
  ];

  const corporateLinks = [
    {
      href: getLocalizedRoute("about", locale),
      label: isTr ? "Hakkımızda & Manifesto" : "About & Manifesto",
    },
    {
      href: getLocalizedRoute("help", locale),
      label: isTr ? "Yardım Merkezi & SSS" : "Help Center & FAQ",
    },
    {
      href: getLocalizedRoute("contact", locale),
      label: isTr ? "İletişim & Destek" : "Contact & Support",
    },
    {
      href: getLocalizedRoute("report", locale),
      label: isTr ? "Kötüye Kullanım Bildir" : "Report Abuse",
    },
    {
      href: getLocalizedRoute("brand", locale),
      label: isTr ? "Marka & Medya Kiti" : "Brand & Media Kit",
    },
  ];

  const legalLinks = [
    {
      href: getLocalizedRoute("legalCenter", locale),
      label: isTr ? "Yasal & Güven Merkezi" : "Legal & Trust Center",
    },
    { href: getLocalizedLegalPath("terms", locale), label: legal("terms.title") },
    { href: getLocalizedLegalPath("privacy", locale), label: legal("privacy.title") },
    { href: getLocalizedLegalPath("matching-disclaimer", locale), label: legal("matching.title") },
    { href: getLocalizedLegalPath("cookies", locale), label: legal("cookies.title") },
  ];

  return (
    <footer
      className={`relative border-t border-[var(--color-border-subtle)]/80 bg-[var(--color-surface-base)]/75 backdrop-blur-2xl text-[var(--color-text-secondary)] transition-all snap-start scroll-mt-16 overflow-hidden ${
        isHomePage ? "min-h-[calc(100dvh-4rem)] flex flex-col justify-center" : ""
      }`}
    >
      {/* Top Ambient Glow Line */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-blue-500/35 to-transparent" />

      {/* Subtle Background Radial Glow */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[260px] bg-gradient-to-t from-blue-500/10 via-indigo-500/5 to-transparent blur-3xl rounded-full"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-10 sm:py-14 space-y-10 sm:space-y-12 relative z-10">
        {/* Balanced 4 Equal Columns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BrandLogo size="md" showText={true} />
            </div>

            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "110'u aşkın profesyonel kategoride bağımsız uzmanlar, ajanslar ve yenilikçi kurumlar için doğrudan, şeffaf ve %100 komisyonsuz yeni nesil iş birliği ağı."
                : "A next-generation, zero-commission collaboration network connecting verified independent experts, agencies, and forward-thinking enterprises across 110+ professional categories."}
            </p>
          </div>

          {/* Col 2: Platform Navigation */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
              {isTr ? "Platform & Keşfet" : "Platform"}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {platformLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:text-[var(--color-text-primary)] hover:translate-x-0.5 transition-all text-[var(--color-text-secondary)] inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Company & Support */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
              {isTr ? "Kurumsal & Destek" : "Company & Support"}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {corporateLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-[var(--color-text-primary)] hover:translate-x-0.5 transition-all text-[var(--color-text-secondary)] inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Legal & Transparency */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
              {isTr ? "Yasal & Şeffaflık" : "Legal & Trust"}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-[var(--color-text-primary)] hover:translate-x-0.5 transition-all inline-block text-[var(--color-text-secondary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="hover:text-[var(--color-text-primary)] hover:translate-x-0.5 transition-all inline-block text-[var(--color-text-secondary)] text-left cursor-pointer"
                >
                  {isTr ? "Çerez Tercihleri" : "Cookie Preferences"}
                </button>
              </li>
              {isTr && (
                <li className="pt-2">
                  <a
                    href="https://etbis.eticaret.gov.tr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 text-[11px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-blue-500/40 transition-all group"
                    title="T.C. Ticaret Bakanlığı Elektronik Ticaret Bilgi Sistemi (ETBİS) Kayıtlı Platform"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>ETBİS Kayıtlı Platform</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Clean Sub-Footer Bar Without Duplicated Legal Links */}
        <div className="border-t border-[var(--color-border-subtle)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-tertiary)]">
          <p className="order-1 text-center sm:text-left">
            © {currentYear} Vellium. {common("appName")} {isTr ? "bir Vellium ürünüdür." : "is a product of Vellium."} {t("rights")}
          </p>

          <div className="order-2 flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-5">
            {/* Frameless Icon-Only Quick Settings */}
            <FooterQuickSettings />

            {/* Subtle Divider */}
            <div
              className="hidden sm:block h-3.5 w-[1px] bg-[var(--color-border-subtle)]"
              aria-hidden="true"
            />

            {/* Designed & Developed by Vellium Signature */}
            <a
              href="https://vellium.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors group py-0.5"
              title="Designed & Developed by Vellium"
            >
              <VelliumLogo className="h-3.5 w-auto text-[var(--color-text-secondary)] group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors shrink-0" />
              <span>
                Designed &amp; Developed by{" "}
                <span className="font-semibold text-[var(--color-text-secondary)] group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                  Vellium
                </span>
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Massive Official Operis Watermark Logo at Base */}
      <div className="relative w-full flex justify-center items-end overflow-hidden pointer-events-none select-none -mt-6 sm:-mt-8">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-center [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.85)_15%,rgba(0,0,0,0.12)_80%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.85)_15%,rgba(0,0,0,0.12)_80%,transparent_100%)]">
          <svg
            viewBox="0 0 350 112"
            width="100%"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full max-h-44 sm:max-h-60 md:max-h-72 lg:max-h-84 object-contain text-[var(--color-text-primary)] opacity-15 dark:opacity-20 transition-opacity duration-300"
            aria-hidden="true"
          >
            <defs>
              <g id="operisWatermarkMark">
                {/* 1. Dış Akış Şeridi */}
                <path
                  d="M 25.50 124.50 A 70 70 0 0 1 124.50 25.50"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* 2. Merkez Akış Şeridi */}
                <path
                  d="M 36.11 113.89 A 55 55 0 0 1 113.89 36.11"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* 3. İç Akış Şeridi */}
                <path
                  d="M 46.72 103.28 A 40 40 0 0 1 103.28 46.72"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* 4. Birleşik Monolitik Gövde */}
                <path
                  d="M 113.89 36.11 A 55 55 0 0 1 36.11 113.89"
                  stroke="currentColor"
                  strokeWidth="40"
                  strokeLinecap="butt"
                  fill="none"
                />
              </g>
            </defs>
            <g id="operisWordmarkWatermark">
              {/* 'O' HARFİ LOGO SEMBOLÜ (Resmi kalibre: scale 0.54, translate 15, 6) */}
              <g transform="translate(15, 6) scale(0.54)">
                <use href="#operisWatermarkMark" />
              </g>
              {/* 'peris' KÜÇÜK HARFLER (Resmi kalibre: Inter Bold, 100px, y 85, letterSpacing 0.01em) */}
              <text
                x="100"
                y="85"
                fill="currentColor"
                fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
                fontWeight="700"
                fontSize="100"
                letterSpacing="0.01em"
              >
                peris
              </text>
            </g>
          </svg>
        </div>
      </div>
    </footer>
  );
}
