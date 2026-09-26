"use client";

import { useState, useRef, useEffect, Suspense } from "react";
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
  X,
  History,
  TrendingUp,
  Trash2,
  ArrowUpRight,
  FileText,
  Folder,
  Loader2,
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
import { formatBudgetRange } from "@/src/lib/format/budget";

function getTrendingRankBadgeStyle(rank: number): string {
  if (rank === 1) return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
  if (rank === 2) return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
  if (rank === 3) return "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30";
  return "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] border border-[var(--color-border-subtle)]";
}
import { NotificationPopover } from "./notification-popover";
import { CommandPalette } from "./command-palette";
import { HeaderSearchSync } from "./header-search-sync";
import { getSeedTrending } from "@/src/lib/search/trending-constants";
import { searchCategories } from "@/src/lib/search/engine";
import type { SessionPayload } from "@/src/modules/auth/session";

export interface SearchListingResult {
  id: string;
  title: string;
  slug: string;
  categoryName: string;
  tags?: string[];
  budgetMode?: string;
  budgetMin?: string | null;
  budgetMax?: string | null;
  budgetCurrency?: string | null;
}

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
    return cleanUser.slice(0, 2).toUpperCase() || "OP";
  }
  return "OP";
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
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>(
    () => getSeedTrending(locale)
  );
  const [liveListings, setLiveListings] = useState<SearchListingResult[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionCacheRef = useRef<Map<string, SearchListingResult[]>>(new Map());

  const isTr = locale === "tr";
  const [session, setSession] = useState<SessionPayload | null>(initialSession ?? null);

  useEffect(() => {
    setSession(initialSession ?? null);
  }, [initialSession]);

  // Fetch dynamic trending searches with hybrid blending
  useEffect(() => {
    fetch(`/api/search/trending?locale=${locale}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.trending) && data.trending.length > 0) {
          setTrendingSearches(data.trending);
        }
      })
      .catch(() => {});
  }, [locale]);

  // Load recent searches lazily from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("operis_recent_searches");
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Gracefully ignore localStorage read/parse errors (e.g., SSR or private browsing)
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    try {
      setRecentSearches((prev) => {
        const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
        const next = [clean, ...filtered].slice(0, 5);
        localStorage.setItem("operis_recent_searches", JSON.stringify(next));
        return next;
      });
    } catch {
      // Gracefully ignore localStorage write quota restrictions
    }
  };

  const removeRecentSearch = (termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setRecentSearches((prev) => {
        const next = prev.filter((item) => item !== termToRemove);
        localStorage.setItem("operis_recent_searches", JSON.stringify(next));
        return next;
      });
    } catch {
      // Gracefully ignore localStorage update restrictions
    }
  };

  const clearAllRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem("operis_recent_searches");
      setRecentSearches([]);
    } catch {
      // Gracefully ignore localStorage clear restrictions
    }
  };

  const executeSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setIsSearchDropdownOpen(false);
      const searchPath = getLocalizedRoute("listings", locale);
      router.push(searchPath);
      return;
    }
    saveRecentSearch(trimmed);

    // Asynchronously log search query to trending statistics (fire-and-forget)
    fetch("/api/search/trending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: trimmed, locale }),
    }).catch(() => {});

    setIsSearchDropdownOpen(false);
    setHeaderSearchQuery(trimmed);
    const searchPath = getLocalizedRoute("listings", locale);
    router.push(`${searchPath}?q=${encodeURIComponent(trimmed)}`);
  };

  const trimmedSearchQuery = headerSearchQuery.trim();
  const liveCategories = trimmedSearchQuery
    ? searchCategories(trimmedSearchQuery, { limit: 2 })
    : [];

  // Build unified array of navigable suggestions for keyboard navigation (ArrowUp / ArrowDown / Enter)
  const activeSuggestions: { id: string; onSelect: () => void }[] = [];
  if (trimmedSearchQuery) {
    liveCategories.forEach((cat) => {
      activeSuggestions.push({
        id: `cat-${cat.slug}`,
        onSelect: () => {
          setIsSearchDropdownOpen(false);
          setSelectedSuggestionIndex(-1);
          router.push(
            isTr
              ? `/tr/kategoriler?q=${encodeURIComponent(cat.name)}`
              : `/en/categories?q=${encodeURIComponent(cat.name)}`
          );
        },
      });
    });

    liveListings.forEach((item) => {
      activeSuggestions.push({
        id: `listing-${item.id}`,
        onSelect: () => {
          setIsSearchDropdownOpen(false);
          setSelectedSuggestionIndex(-1);
          saveRecentSearch(item.title);
          router.push(isTr ? `/tr/ilanlar/${item.slug}` : `/en/listings/${item.slug}`);
        },
      });
    });

    activeSuggestions.push({
      id: "direct-search",
      onSelect: () => {
        setIsSearchDropdownOpen(false);
        setSelectedSuggestionIndex(-1);
        executeSearch(trimmedSearchQuery);
      },
    });
  }

  const handleHeaderSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      isSearchDropdownOpen &&
      selectedSuggestionIndex >= 0 &&
      selectedSuggestionIndex < activeSuggestions.length
    ) {
      activeSuggestions[selectedSuggestionIndex]?.onSelect();
      return;
    }
    executeSearch(headerSearchQuery);
  };

  const handlePaletteDismiss = () => {
    setCommandPaletteOpen(false);
    setTimeout(() => {
      headerInputRef.current?.focus();
    }, 50);
  };

  // Live search debounced query with AbortController and session cache
  useEffect(() => {
    const trimmed = headerSearchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setLiveListings([]);
      setIsSearchingLive(false);
      setSelectedSuggestionIndex(-1);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      return;
    }

    const cacheKey = `${locale}:${trimmed.toLowerCase()}`;
    if (sessionCacheRef.current.has(cacheKey)) {
      setLiveListings(sessionCacheRef.current.get(cacheKey) || []);
      setIsSearchingLive(false);
      return;
    }

    setIsSearchingLive(true);

    const timer = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch(
          `/api/listings/search?q=${encodeURIComponent(trimmed)}&locale=${locale}`,
          {
            signal: controller.signal,
            headers: { "x-locale": locale },
          }
        );
        if (!res.ok) throw new Error("Search response error");
        const data = await res.json();
        const items: SearchListingResult[] = Array.isArray(data?.items) ? data.items.slice(0, 4) : [];
        sessionCacheRef.current.set(cacheKey, items);
        setLiveListings(items);
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          setLiveListings([]);
        }
      } finally {
        if (abortControllerRef.current === controller) {
          setIsSearchingLive(false);
        }
      }
    }, 180);

    return () => {
      clearTimeout(timer);
    };
  }, [headerSearchQuery, locale]);

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
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key.toLowerCase() === "k" || event.code === "KeyK")
      ) {
        event.preventDefault();
        setIsSearchDropdownOpen(false);
        setCommandPaletteOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        setUserMenuOpen(false);
        setNotificationsOpen(false);
        setMobileMenuOpen(false);
        setIsSearchDropdownOpen(false);
        if (commandPaletteOpen) {
          handlePaletteDismiss();
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [commandPaletteOpen]);

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
      setSession(null);
      window.location.href = `/${locale}`;
    } catch {
      setSession(null);
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

  const renderLiveListings = () => {
    if (trimmedSearchQuery.length === 1) {
      return (
        <div className="px-3 py-2 text-[11px] text-[var(--color-text-tertiary)]">
          {isTr ? "İlan başlıkları için en az 2 karakter yazın..." : "Type at least 2 characters for listings..."}
        </div>
      );
    }
    if (liveListings.length > 0) {
      return (
        <div className="space-y-1">
          {liveListings.map((item, idx) => {
            const overallIdx = liveCategories.length + idx;
            const isSelected = selectedSuggestionIndex === overallIdx;
            const budgetText = item.budgetMin
              ? formatBudgetRange(item.budgetMin, item.budgetMax, item.budgetCurrency, isTr)
              : item.budgetMode || (isTr ? "Bütçe Belirtilmedi" : "Flexible Budget");

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setIsSearchDropdownOpen(false);
                  saveRecentSearch(item.title);
                  router.push(isTr ? `/tr/ilanlar/${item.slug}` : `/en/listings/${item.slug}`);
                }}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-500/15 text-[var(--color-text-primary)] border-blue-500/30"
                    : "bg-[var(--color-surface-base)]/50 hover:bg-[var(--color-surface-hover)] border-transparent hover:border-[var(--color-border-subtle)]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                    <FileText className="h-3 w-3" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-[var(--color-text-primary)] group-hover:text-blue-400 truncate transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                      {item.categoryName}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[10px] font-medium text-[var(--color-text-secondary)] px-2 py-0.5 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]">
                    {budgetText}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 group-hover:text-blue-400 transition-all shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    if (!isSearchingLive) {
      return (
        <div className="px-3 py-2.5 text-center text-xs text-[var(--color-text-tertiary)] space-y-0.5">
          <p className="font-medium text-[var(--color-text-secondary)]">
            {isTr ? "Eşleşen aktif ilan bulunamadı" : "No matching active listings found"}
          </p>
          <p className="text-[10px]">
            {isTr ? "Tüm ilanlar dizininde aramak için Enter'a basın." : "Press Enter to search the full listings directory."}
          </p>
        </div>
      );
    }
    return (
      <div className="p-3 text-center text-xs text-[var(--color-text-tertiary)] animate-pulse">
        {isTr ? "İlanlar taranıyor..." : "Scanning listings..."}
      </div>
    );
  };

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-[var(--color-border-subtle)] bg-[color-mix(in_srgb,var(--color-surface-base)_88%,transparent)] backdrop-blur-xl transition-all"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Left: Brand Logo */}
        <div className="flex items-center justify-start shrink-0 min-w-[160px] md:flex-1">
          <Link
            href={session ? getLocalizedRoute("listings", locale) : `/${locale}`}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            aria-label={common("appName")}
          >
            <BrandLogo size="md" showText={true} />
          </Link>
        </div>

        {/* Center: Compact Interactive Direct Search Bar (Only shown for authenticated users, perfectly centered) */}
        {session && (
          <div
            ref={searchContainerRef}
            className="relative hidden md:flex flex-initial w-full max-w-xs sm:max-w-sm lg:max-w-md mx-auto items-center justify-center"
          >
          <form
            onSubmit={handleHeaderSearchSubmit}
            className="w-full relative flex items-center rounded-xl bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-subtle,#181b24)] border border-[var(--color-border-subtle)] focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/25 transition-all shadow-xs group"
          >
            {/* Search icon button - clicking opens command palette */}
            <button
              type="button"
              onClick={() => {
                setIsSearchDropdownOpen(false);
                setCommandPaletteOpen(true);
              }}
              className="pl-3.5 pr-2 py-2 text-[var(--color-text-tertiary)] group-hover:text-blue-400 focus:text-blue-400 focus:outline-none cursor-pointer transition-colors shrink-0 flex items-center justify-center"
              title={isTr ? "Hızlı Arama Paletini Aç (⌘K / Ctrl+K)" : "Open Command Palette (⌘K / Ctrl+K)"}
              aria-label={isTr ? "Hızlı Arama Paletini Aç" : "Open Command Palette"}
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>

            {/* Direct text input for search */}
            <input
              ref={headerInputRef}
              type="text"
              role="combobox"
              aria-expanded={isSearchDropdownOpen}
              aria-autocomplete="list"
              aria-controls="header-search-suggestions"
              aria-label={isTr ? "İlan, teknoloji veya kategori ara" : "Search listings, skills, or categories"}
              value={headerSearchQuery}
              onChange={(e) => {
                setHeaderSearchQuery(e.target.value);
                setSelectedSuggestionIndex(-1);
              }}
              onFocus={() => setIsSearchDropdownOpen(true)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "k" || e.code === "KeyK")) {
                  e.preventDefault();
                  setIsSearchDropdownOpen(false);
                  setCommandPaletteOpen(true);
                } else if (e.key === "Escape") {
                  setIsSearchDropdownOpen(false);
                  (e.target as HTMLInputElement).blur();
                } else if (isSearchDropdownOpen && activeSuggestions.length > 0) {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedSuggestionIndex((prev) => (prev + 1) % activeSuggestions.length);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedSuggestionIndex((prev) => (prev <= 0 ? activeSuggestions.length - 1 : prev - 1));
                  } else if (e.key === "Enter" && selectedSuggestionIndex >= 0 && selectedSuggestionIndex < activeSuggestions.length) {
                    e.preventDefault();
                    activeSuggestions[selectedSuggestionIndex]?.onSelect();
                  }
                }
              }}
              placeholder={isTr ? "İlan, teknoloji veya kategori ara..." : "Search listings, skills, or categories..."}
              className="w-full py-2 bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] text-xs lg:text-[13px] font-normal focus:outline-none min-w-0"
            />

            {/* Clear button if text exists */}
            {headerSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setHeaderSearchQuery("");
                  setSelectedSuggestionIndex(-1);
                  headerInputRef.current?.focus();
                }}
                className="p-1.5 mr-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors focus:outline-none shrink-0"
                title={isTr ? "Temizle" : "Clear"}
                aria-label={isTr ? "Aramayı Temizle" : "Clear search query"}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}

            {/* Right: ⌘K badge button - clicking opens command palette */}
            <button
              type="button"
              onClick={() => {
                setIsSearchDropdownOpen(false);
                setCommandPaletteOpen(true);
              }}
              className="pr-2.5 pl-1.5 py-1.5 flex items-center shrink-0 cursor-pointer focus:outline-none"
              title={isTr ? "Hızlı Arama Paletini Aç (⌘K / Ctrl+K)" : "Open Command Palette (⌘K / Ctrl+K)"}
              aria-label={isTr ? "Hızlı Arama Paletini Aç" : "Open Command Palette"}
            >
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[10px] font-mono text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)] shadow-xs transition-colors">
                <span className="text-[11px]">⌘</span>K
              </kbd>
            </button>
          </form>

          {/* Quick Dropdown: En Çok Arananlar & Son Aramalar (100% Solid Background & Flush Footer) */}
          {isSearchDropdownOpen && !commandPaletteOpen && (
            <div
              id="header-search-suggestions"
              role="region"
              className="absolute top-full left-0 right-0 mt-2.5 z-50 rounded-2xl border border-[var(--color-border-strong)] shadow-2xl shadow-black/80 ring-1 ring-white/10 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col bg-[var(--color-surface-elevated)]"
            >
              {/* Content body: switches between Live Suggestions (when query exists) and Trends/Recent (when empty) */}
              {trimmedSearchQuery ? (
                <div className="p-3.5 space-y-3.5">
                  {/* Live Categories (Instant 0ms) */}
                  {liveCategories.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="px-1 text-[11px] font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5">
                        <Folder className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{isTr ? "Kategoriler" : "Categories"}</span>
                      </div>
                      <div className="space-y-1">
                        {liveCategories.map((cat, idx) => {
                          const isSelected = selectedSuggestionIndex === idx;
                          return (
                            <div
                              key={cat.slug}
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                setIsSearchDropdownOpen(false);
                                router.push(
                                  isTr
                                    ? `/tr/kategoriler?q=${encodeURIComponent(cat.name)}`
                                    : `/en/categories?q=${encodeURIComponent(cat.name)}`
                                );
                              }}
                              className={`group flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-500/15 text-[var(--color-text-primary)] border-emerald-500/30"
                                  : "bg-[var(--color-surface-base)]/50 hover:bg-[var(--color-surface-hover)] border-transparent hover:border-[var(--color-border-subtle)]"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                  <Folder className="h-3 w-3" />
                                </div>
                                <span className="text-xs font-medium text-[var(--color-text-primary)] group-hover:text-emerald-400 truncate transition-colors">
                                  {cat.name}
                                </span>
                              </div>
                              <ArrowUpRight className="h-3.5 w-3.5 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 group-hover:text-emerald-400 transition-all shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Live Listings (180ms Debounced with Abort & Session Cache) */}
                  <div className="space-y-1.5">
                    <div className="px-1 flex items-center justify-between text-[11px] font-semibold text-[var(--color-text-secondary)]">
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-blue-400" />
                        <span>{isTr ? "Canlı İlanlar" : "Live Listings"}</span>
                      </span>
                      {isSearchingLive && (
                        <span className="flex items-center gap-1 text-[10px] text-blue-400 font-normal animate-pulse">
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          <span>{isTr ? "Aranıyor..." : "Searching..."}</span>
                        </span>
                      )}
                    </div>

                    {renderLiveListings()}
                  </div>
                </div>
              ) : (
                /* Recent Searches & Trending Searches (Default View) */
                <div className="p-3.5 space-y-3.5">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)]">
                          <History className="h-3.5 w-3.5 text-blue-400" />
                          {isTr ? "Son Aramalar" : "Recent Searches"}
                        </span>
                        <button
                          type="button"
                          onClick={clearAllRecentSearches}
                          className="text-[10px] text-[var(--color-text-tertiary)] hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                          {isTr ? "Tümünü Temizle" : "Clear all"}
                        </button>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.map((item) => (
                          <div
                            key={item}
                            role="button"
                            tabIndex={0}
                            onClick={() => executeSearch(item)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                executeSearch(item);
                              }
                            }}
                            className="group flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--color-surface-base)]/60 hover:bg-[var(--color-surface-hover)] border border-transparent hover:border-[var(--color-border-subtle)] cursor-pointer text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all focus:outline-none focus:border-blue-500/50"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <History className="h-3.5 w-3.5 text-[var(--color-text-tertiary)] group-hover:text-blue-400 transition-colors shrink-0" />
                              <span className="truncate font-medium">{item}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => removeRecentSearch(item, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-[var(--color-text-tertiary)] transition-all cursor-pointer rounded-md hover:bg-[var(--color-surface-base)]"
                              title={isTr ? "Kaldır" : "Remove"}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Searches (En Çok Arananlar - Sıralı Liste) */}
                  <div className="space-y-1.5">
                    <div className="px-1 flex items-center justify-between text-[11px] font-semibold text-[var(--color-text-secondary)]">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                        {isTr ? "En Çok Arananlar" : "Trending Searches"}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-tertiary)] font-normal">
                        {isTr ? "Canlı Trendler" : "Live Trends"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {trendingSearches.map((term, index) => {
                        const rank = index + 1;
                        return (
                          <div
                            key={term}
                            role="button"
                            tabIndex={0}
                            onClick={() => executeSearch(term)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              executeSearch(term);
                            }
                          }}
                          className="group flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--color-surface-base)]/50 hover:bg-[var(--color-surface-hover)] border border-transparent hover:border-[var(--color-border-subtle)] cursor-pointer transition-all focus:outline-none focus:border-blue-500/50"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 transition-colors ${getTrendingRankBadgeStyle(
                                rank
                              )}`}
                            >
                              {rank}
                            </span>
                            <span className="text-xs font-medium text-[var(--color-text-primary)] group-hover:text-blue-400 truncate transition-colors">
                              {term}
                            </span>
                          </div>
                          <ArrowUpRight className="h-3.5 w-3.5 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

              {/* Distinct Footer strip - perfectly flush at bottom edge with zero gap */}
              <div
                className="w-full px-3.5 py-2.5 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)] mt-auto bg-[var(--color-surface-base)]"
              >
                {trimmedSearchQuery ? (
                  <button
                    type="button"
                    onClick={() => executeSearch(trimmedSearchQuery)}
                    className={`cursor-pointer flex items-center gap-1.5 text-left text-xs font-medium transition-all truncate max-w-[280px] px-2 py-1 -ml-1 rounded-lg border ${
                      selectedSuggestionIndex === activeSuggestions.length - 1
                        ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                        : "text-[var(--color-text-secondary)] hover:text-blue-400 border-transparent"
                    }`}
                  >
                    <Search className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">
                      {isTr
                        ? `"${trimmedSearchQuery}" için tüm ilanlarda ara`
                        : `Search all listings for "${trimmedSearchQuery}"`}
                    </span>
                    <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[10px] font-mono shrink-0">
                      ↵
                    </kbd>
                  </button>
                ) : (
                  <span>{isTr ? "Detaylı filtreler ve sayfalar" : "Advanced search & filters"}</span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsSearchDropdownOpen(false);
                    setCommandPaletteOpen(true);
                  }}
                  className="hover:text-blue-400 cursor-pointer flex items-center gap-1.5 font-mono text-[10px] text-[var(--color-text-secondary)] hover:text-blue-400 transition-colors shrink-0 ml-2"
                >
                  <span>{isTr ? "Paleti Aç" : "Open Palette"}</span>
                  <kbd className="px-1.5 py-0.5 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] shadow-xs">
                    ⌘K
                  </kbd>
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Right: Premium Auth / User Area */}
        <div className="hidden md:flex items-center justify-end gap-2 shrink-0 min-w-[160px] md:flex-1">
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
                    className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 duration-150 z-50 select-none text-xs"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    {/* Header: User Badge & Identity */}
                    <div
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] mb-2"
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
                          className="flex items-center gap-1 p-0.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]"
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
                          className="flex items-center gap-0.5 p-0.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]"
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
          className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] backdrop-blur-2xl px-4 pt-3 pb-6 md:hidden animate-in fade-in-0 slide-in-from-top-2 duration-200"
        >
          <nav className="flex flex-col gap-1.5">
            {/* Quick Search inside Mobile Menu Drawer (Only when logged in) */}
            {session && (
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
            )}
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
                    className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-text-secondary)] rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]"
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
        onDismiss={handlePaletteDismiss}
        userHandle={initialProfile?.handle}
        initialQuery={headerSearchQuery}
      />

      {/* URL Search Query Synchronization (App Router & SSR Safe) */}
      <Suspense fallback={null}>
        <HeaderSearchSync
          onQueryChange={(query) => setHeaderSearchQuery(query)}
        />
      </Suspense>
    </header>
  );
}
