"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LogIn,
  UserPlus,
  LogOut,
  Bell,
  Settings,
  User,
  Globe,
  Sun,
  Moon,
  ShieldCheck,
  Briefcase,
  Contrast,
  Search,
  Compass,
} from "lucide-react";
import { Locale } from "@/src/lib/i18n/config";
import {
  getLocalizedRoute,
  getAlternateLocalePath,
  getLocalizedLegalPath,
  getLocalizedProfilePath,
} from "@/src/lib/i18n/routes";
import { BrandLogo } from "./brand-logo";
import { Button } from "../ui/button";
import { useTheme } from "./theme-provider";
import { NotificationPopover } from "./notification-popover";
import { CommandPalette } from "./command-palette";
import type { SessionPayload } from "@/src/modules/auth/session";

export interface HeaderProps {
  initialSession?: SessionPayload | null;
  initialProfile?: { displayName: string; handle: string; avatarUrl?: string | null } | null;
}

/**
 * Calculates crisp user initials (e.g. "Demir Yıldız" -> "DY", "Demir" -> "DE")
 */
export function getInitials(name?: string | null, email?: string | null): string {
  const cleanName = name?.trim();
  if (cleanName && cleanName.length > 0) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    const firstWord = parts[0];
    const lastWord = parts[parts.length - 1];
    if (parts.length >= 2 && firstWord && lastWord) {
      const first = firstWord.charAt(0);
      const last = lastWord.charAt(0);
      return (first + last).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
  }
  if (email && email.trim().length > 0) {
    const userPart = email.split("@")[0] || "";
    const cleanUser = userPart.replace(/[^a-zA-Z0-9]/g, "");
    return cleanUser.slice(0, 2).toUpperCase() || "DY";
  }
  return "DY";
}

function resolveFallbackDisplayName(email?: string | null): string {
  if (email === "kullanici@operis.pro") {
    return "Demir Yıldız";
  }
  if (email) {
    return email.split("@")[0] ?? "";
  }
  return "";
}

function renderThemeIcon(theme: string) {
  if (theme === "light") {
    return <Sun className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />;
  }
  if (theme === "black") {
    return <Contrast className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />;
  }
  return <Moon className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />;
}

export function Header({ initialSession, initialProfile }: HeaderProps) {
  const t = useTranslations("nav");
  const common = useTranslations("common");
  const params = useParams();
  const locale = ((params?.locale as string) || "tr") as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  const isTr = locale === "tr";
  const session = initialSession;
  const [avatarError, setAvatarError] = useState(false);
  const avatarUrl = initialProfile?.avatarUrl;

  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  // Resolve clean display name & handle
  const displayName =
    initialProfile?.displayName || resolveFallbackDisplayName(session?.email);
  const handle =
    initialProfile?.handle || (session?.email === "kullanici@operis.pro" ? "demokullanici" : "");
  const initials = getInitials(displayName, session?.email);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key.toLowerCase() === "k" || event.code === "KeyK")
      ) {
        event.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        setUserMenuOpen(false);
        setNotificationsOpen(false);
        setMobileMenuOpen(false);
        setCommandPaletteOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isWorkspaceActive =
    pathname.startsWith(`/${locale}/panel`) || pathname.startsWith(`/${locale}/dashboard`);

  const isListingsActive =
    pathname === `/${locale}/ilanlar` ||
    pathname.startsWith(`/${locale}/ilanlar`) ||
    pathname === `/${locale}/listings` ||
    pathname.startsWith(`/${locale}/listings`) ||
    pathname.startsWith(`/${locale}/feed`) ||
    pathname.startsWith(`/${locale}/akis`);

  const navLinks = session
    ? [
        {
          href: getLocalizedRoute("dashboardListings", locale),
          label: isTr ? "Çalışma Alanım" : "Workspace",
          isActive: isWorkspaceActive,
        },
      ]
    : [];

  const handleLogout = async () => {
    try {
      if (
        typeof window !== "undefined" &&
        (window as unknown as { Clerk?: { signOut?: () => Promise<void> } }).Clerk?.signOut
      ) {
        try {
          await (window as unknown as { Clerk: { signOut: () => Promise<void> } }).Clerk.signOut();
        } catch {
          // Ignore Clerk client signOut error if session already cleared
        }
      }
      await fetch("/api/auth/logout", { method: "POST" });
      router.push(`/${locale}`);
      router.refresh();
    } catch {
      window.location.href = `/${locale}`;
    }
  };

  const handleLanguageSelect = (newLocale: Locale) => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    if (newLocale === locale) return;
    try {
      localStorage.setItem("fp_locale", newLocale);
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = `fp_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore in restricted environments
    }
    const targetPath = getAlternateLocalePath(pathname, newLocale);
    router.push(targetPath);
  };

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-[var(--color-border-subtle)] backdrop-blur-xl transition-all"
      style={{
        backgroundColor: "color-mix(in srgb, var(--color-surface-base) 88%, transparent)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Left: Brand Logo */}
        <div className="flex items-center shrink-0">
          <Link
            href={session ? getLocalizedRoute("listings", locale) : `/${locale}`}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            aria-label={common("appName")}
          >
            <BrandLogo size="md" showText={true} />
          </Link>
        </div>

        {/* Center: Wide Interactive Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md lg:max-w-lg xl:max-w-xl mx-4 lg:mx-8 items-center justify-center">
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl text-xs bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-subtle,#181b24)] border border-[var(--color-border-subtle)] hover:border-blue-500/50 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-all cursor-pointer shadow-xs group focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            title={isTr ? "Hızlı Arama (⌘K / Ctrl+K)" : "Quick Search (⌘K / Ctrl+K)"}
            aria-label={isTr ? "Hızlı Arama" : "Quick Search"}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Search className="h-4 w-4 text-[var(--color-text-tertiary)] group-hover:text-blue-400 transition-colors shrink-0" aria-hidden="true" />
              <span className="truncate select-none font-normal text-xs lg:text-[13px]">
                {isTr ? "İlan, teknoloji veya kategori ara..." : "Search listings, skills, or categories..."}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[10px] font-mono text-[var(--color-text-tertiary)] shadow-xs">
                <span className="text-[11px]">⌘</span>K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right: Premium Auth / User Area */}
        <div className="hidden md:flex items-center justify-end gap-2 shrink-0">
          {session ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* 1. İlanlar Butonu (İkon + Alt Metin) */}
              <Link
                href={getLocalizedRoute("listings", locale)}
                className={`relative px-2.5 py-1 rounded-xl border transition-all cursor-pointer focus:outline-none flex flex-col items-center justify-center gap-0.5 ${
                  isListingsActive
                    ? "text-[var(--color-text-primary)] bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] shadow-xs font-semibold"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border-transparent hover:border-[var(--color-border-subtle)]"
                }`}
                title={isTr ? "İlanlar" : "Listings"}
                aria-label={isTr ? "İlanlar" : "Listings"}
              >
                <Compass className="h-4 w-4" aria-hidden="true" />
                <span className="text-[10px] font-medium leading-tight whitespace-nowrap select-none">
                  {isTr ? "İlanlar" : "Listings"}
                </span>
              </Link>

              {/* 2. Panel Butonu (İkon + Alt Metin) */}
              <Link
                href={getLocalizedRoute("dashboardListings", locale)}
                className={`relative px-2.5 py-1 rounded-xl border transition-all cursor-pointer focus:outline-none flex flex-col items-center justify-center gap-0.5 ${
                  isWorkspaceActive
                    ? "text-[var(--color-text-primary)] bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] shadow-xs font-semibold"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border-transparent hover:border-[var(--color-border-subtle)]"
                }`}
                title={isTr ? "Panel" : "Dashboard"}
                aria-label={isTr ? "Panel" : "Dashboard"}
              >
                <Briefcase className="h-4 w-4" aria-hidden="true" />
                <span className="text-[10px] font-medium leading-tight whitespace-nowrap select-none">
                  {isTr ? "Panel" : "Dashboard"}
                </span>
              </Link>

              {/* 2. Bildirimler İkonu */}
              <div className="relative" ref={notificationMenuRef}>
                <NotificationPopover
                  locale={locale}
                  isOpen={notificationsOpen}
                  onToggle={() => {
                    setNotificationsOpen((prev) => !prev);
                    setUserMenuOpen(false);
                  }}
                  onClose={() => setNotificationsOpen(false)}
                />
              </div>

              {/* User Avatar Circle Button & Dropdown Container */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen((prev) => !prev);
                    setNotificationsOpen(false);
                  }}
                  className="h-9 w-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs sm:text-sm tracking-tight overflow-hidden hover:opacity-90 hover:ring-2 hover:ring-blue-500/40 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all cursor-pointer select-none"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  aria-label={isTr ? "Kullanıcı Menüsü" : "User Menu"}
                >
                  {avatarUrl && !avatarError ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover rounded-full"
                      onError={() => setAvatarError(true)}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    initials
                  )}
                </button>

                {/* Dropdown Menu Modal */}
                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-[var(--color-border-subtle)] p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 duration-150 z-50 select-none text-xs"
                    style={{
                      backgroundColor: "var(--color-surface-base)",
                      borderColor: "var(--color-border-subtle)",
                      boxShadow:
                        "0 20px 40px -15px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--color-border-subtle)",
                    }}
                    role="menu"
                    aria-orientation="vertical"
                  >
                    {/* Header: User Badge & Identity */}
                    <div
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--color-border-subtle)] mb-2"
                      style={{
                        backgroundColor: "var(--color-surface-hover)",
                      }}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold text-sm tracking-tight overflow-hidden">
                        {avatarUrl && !avatarError ? (
                          <img
                            src={avatarUrl}
                            alt={displayName}
                            className="w-full h-full object-cover rounded-full"
                            onError={() => setAvatarError(true)}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-[var(--color-text-primary)] truncate">
                          {displayName}
                        </div>
                        <div className="text-[11px] text-[var(--color-text-tertiary)] truncate">
                          @{handle || "demokullanici"}
                        </div>
                      </div>
                    </div>

                    {/* Group 1: Navigation Links */}
                    <div className="space-y-0.5 border-b border-[var(--color-border-subtle)] pb-2 mb-2">
                      {/* Profil */}
                      <Link
                        href={getLocalizedProfilePath(handle || "demokullanici", locale)}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                        role="menuitem"
                      >
                        <User className="h-4 w-4 text-blue-400" aria-hidden="true" />
                        <span className="font-medium">
                          {isTr ? "Profilimi Gör" : "View Profile"}
                        </span>
                      </Link>

                      {/* Çalışma Alanım */}
                      <Link
                        href={getLocalizedRoute("dashboardListings", locale)}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                        role="menuitem"
                      >
                        <Briefcase className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                        <span className="font-medium">{isTr ? "Çalışma Alanım" : "Workspace"}</span>
                      </Link>

                      {/* Bildirimler */}
                      <Link
                        href={getLocalizedRoute("dashboardNotifications", locale)}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                        role="menuitem"
                      >
                        <Bell className="h-4 w-4 text-amber-400" aria-hidden="true" />
                        <span className="font-medium">
                          {isTr ? "Bildirimler" : "Notifications"}
                        </span>
                      </Link>

                      {/* Ayarlar */}
                      <Link
                        href={getLocalizedRoute("settings", locale)}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                        role="menuitem"
                      >
                        <Settings className="h-4 w-4 text-purple-400" aria-hidden="true" />
                        <span className="font-medium">
                          {isTr ? "Hesap Ayarları" : "Account Settings"}
                        </span>
                      </Link>

                      {/* Yasal ve Güven Merkezi */}
                      <Link
                        href={getLocalizedRoute("legalCenter", locale)}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                        role="menuitem"
                      >
                        <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                        <span className="font-medium">
                          {isTr ? "Yasal & Güven Merkezi" : "Legal & Trust Center"}
                        </span>
                      </Link>
                    </div>

                    {/* Group 2: Quick Preferences (Dil & Tema) */}
                    <div className="space-y-2 border-b border-[var(--color-border-subtle)] pb-2.5 mb-2 px-1">
                      {/* Dil Seçimi */}
                      <div className="flex items-center justify-between px-2 text-[11px] text-[var(--color-text-tertiary)]">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Globe className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                          <span>{isTr ? "Dil" : "Language"}</span>
                        </div>
                        <div
                          className="flex items-center gap-1 p-0.5 rounded-lg border border-[var(--color-border-subtle)]"
                          style={{
                            backgroundColor: "var(--color-surface-hover)",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleLanguageSelect("tr")}
                            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] transition-all cursor-pointer ${
                              locale === "tr"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                            }`}
                          >
                            TR
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLanguageSelect("en")}
                            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] transition-all cursor-pointer ${
                              locale === "en"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                            }`}
                          >
                            EN
                          </button>
                        </div>
                      </div>

                      {/* Tema Seçimi */}
                      <div className="flex items-center justify-between px-2 text-[11px] text-[var(--color-text-tertiary)]">
                        <div className="flex items-center gap-1.5 font-medium">
                          {renderThemeIcon(theme)}
                          <span>{isTr ? "Tema" : "Theme"}</span>
                        </div>
                        <div
                          className="flex items-center gap-0.5 p-0.5 rounded-lg border border-[var(--color-border-subtle)]"
                          style={{
                            backgroundColor: "var(--color-surface-hover)",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setTheme("dark")}
                            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] transition-all cursor-pointer ${
                              theme === "dark"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                            }`}
                          >
                            {isTr ? "Koyu" : "Dark"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setTheme("light")}
                            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] transition-all cursor-pointer ${
                              theme === "light"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                            }`}
                          >
                            {isTr ? "Açık" : "Light"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setTheme("black")}
                            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] transition-all cursor-pointer ${
                              theme === "black"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                            }`}
                          >
                            {isTr ? "Siyah" : "Black"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Group 3: Çıkış Yap */}
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors font-medium cursor-pointer"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      <span>{isTr ? "Çıkış Yap" : "Sign Out"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={getLocalizedRoute("listings", locale)}
                className={`relative px-2.5 py-1 rounded-xl border transition-all cursor-pointer focus:outline-none flex flex-col items-center justify-center gap-0.5 ${
                  isListingsActive
                    ? "text-[var(--color-text-primary)] bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] shadow-xs font-semibold"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border-transparent hover:border-[var(--color-border-subtle)]"
                }`}
                title={isTr ? "İlanlar" : "Listings"}
                aria-label={isTr ? "İlanlar" : "Listings"}
              >
                <Compass className="h-4 w-4" aria-hidden="true" />
                <span className="text-[10px] font-medium leading-tight whitespace-nowrap select-none">
                  {isTr ? "İlanlar" : "Listings"}
                </span>
              </Link>

              <Link href={getLocalizedRoute("login", locale)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl px-4 border border-transparent hover:border-[var(--color-border-subtle)] hover:shadow-sm transition-all"
                >
                  <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("login")}
                </Button>
              </Link>

              <Link href={getLocalizedRoute("register", locale)}>
                <Button
                  variant="primary"
                  size="sm"
                  className="gap-2 rounded-xl px-5 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all"
                >
                  <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("register")}
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Action Buttons (Search + Hamburger) */}
        <div className="flex md:hidden items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border border-transparent hover:border-[var(--color-border-subtle)] transition-all cursor-pointer focus:outline-none flex items-center justify-center"
            title={isTr ? "Hızlı Arama" : "Quick Search"}
            aria-label={isTr ? "Hızlı Arama" : "Quick Search"}
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          className="border-b border-[var(--color-border-subtle)] backdrop-blur-2xl px-4 pt-3 pb-6 md:hidden animate-in fade-in-0 slide-in-from-top-2 duration-200"
          style={{
            backgroundColor: "var(--color-surface-base)",
          }}
        >
          <nav className="flex flex-col gap-1.5">
            {/* Quick Search inside Mobile Menu Drawer */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setCommandPaletteOpen(true);
              }}
              className="flex items-center justify-between gap-2.5 w-full rounded-2xl px-3.5 py-2.5 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] hover:border-blue-500/40 hover:text-[var(--color-text-primary)] transition-all mb-2 cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-500 shrink-0" aria-hidden="true" />
                <span className="font-medium text-[var(--color-text-tertiary)]">
                  {isTr ? "İlanlarda, kategorilerde ara..." : "Search listings, categories..."}
                </span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[10px] font-mono text-[var(--color-text-tertiary)]">
                ⌘K
              </kbd>
            </button>
            {navLinks.map((link) => {
              const isActive = link.isActive ?? pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-xl px-3.5 py-2.5 text-base font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] font-semibold"
                      : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="mt-4 flex flex-col gap-2.5 border-t border-[var(--color-border-subtle)] pt-4">
              {session ? (
                <>
                  <div
                    className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-text-secondary)] rounded-xl border border-[var(--color-border-subtle)]"
                    style={{
                      backgroundColor: "var(--color-surface-hover)",
                    }}
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs tracking-tight overflow-hidden">
                      {avatarUrl && !avatarError ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="w-full h-full object-cover rounded-full"
                          onError={() => setAvatarError(true)}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-[var(--color-text-primary)] truncate">
                        {displayName}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                        @{handle || "demokullanici"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={getLocalizedProfilePath(handle || "demokullanici", locale)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                    >
                      <User className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                      <span>{isTr ? "Profilim" : "Profile"}</span>
                    </Link>
                    <Link
                      href={getLocalizedRoute("dashboardNotifications", locale)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                    >
                      <Bell className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                      <span>{isTr ? "Bildirimler" : "Alerts"}</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={getLocalizedRoute("dashboardSettings", locale)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                    >
                      <Settings className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
                      <span>{isTr ? "Ayarlar" : "Settings"}</span>
                    </Link>
                    <Link
                      href={getLocalizedLegalPath("terms", locale)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                      <span>{isTr ? "Güven" : "Trust"}</span>
                    </Link>
                  </div>

                  {/* Mobile Language & Theme Row */}
                  <div className="flex items-center justify-between p-2 rounded-xl border border-[var(--color-border-subtle)] text-xs">
                    <div className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                      <button
                        type="button"
                        onClick={() => handleLanguageSelect("tr")}
                        className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                          locale === "tr"
                            ? "bg-blue-600 text-white"
                            : "text-[var(--color-text-secondary)]"
                        }`}
                      >
                        TR
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLanguageSelect("en")}
                        className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                          locale === "en"
                            ? "bg-blue-600 text-white"
                            : "text-[var(--color-text-secondary)]"
                        }`}
                      >
                        EN
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                          theme === "dark"
                            ? "bg-blue-600 text-white"
                            : "text-[var(--color-text-secondary)]"
                        }`}
                      >
                        {isTr ? "Koyu" : "Dark"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                          theme === "light"
                            ? "bg-blue-600 text-white"
                            : "text-[var(--color-text-secondary)]"
                        }`}
                      >
                        {isTr ? "Açık" : "Light"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("black")}
                        className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                          theme === "black"
                            ? "bg-blue-600 text-white"
                            : "text-[var(--color-text-secondary)]"
                        }`}
                      >
                        {isTr ? "Siyah" : "Black"}
                      </button>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full gap-2 text-red-400 hover:text-red-300 cursor-pointer"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    {isTr ? "Çıkış Yap" : "Sign Out"}
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    href={getLocalizedRoute("register", locale)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="primary" className="w-full gap-2">
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                      {t("register")}
                    </Button>
                  </Link>
                  <Link
                    href={getLocalizedRoute("login", locale)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="outline" className="w-full gap-2">
                      <LogIn className="h-4 w-4" aria-hidden="true" />
                      {t("login")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Command Palette Modal */}
      <CommandPalette
        locale={locale}
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        userHandle={initialProfile?.handle}
      />
    </header>
  );
}
