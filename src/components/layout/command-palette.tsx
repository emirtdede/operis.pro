"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search,
  Compass,
  PlusCircle,
  Briefcase,
  Inbox,
  Send,
  Bell,
  User,
  Moon,
  Sun,
  Laptop,
  ArrowRight,
  FileText,
  Folder,
  X,
} from "lucide-react";
import { useTheme } from "./theme-provider";
import { Locale } from "@/src/lib/i18n/config";
import { searchCategories } from "@/src/lib/search/engine";

interface SearchListingResult {
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

export interface CommandPaletteProps {
  locale: Locale;
  isOpen: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  userHandle?: string;
  initialQuery?: string;
}

interface PaletteAction {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  category: "categories" | "listings" | "navigation" | "theme";
  onSelect: () => void;
}

export function CommandPalette({
  locale,
  isOpen,
  onClose,
  onDismiss,
  userHandle,
  initialQuery,
}: CommandPaletteProps) {
  const isTr = locale === "tr";
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchListingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery || "");
      setSearchResults([]);
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialQuery]);

  // Live search effect
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/listings/search?q=${encodeURIComponent(query.trim())}&locale=${locale}`,
          {
            headers: {
              "x-locale": locale,
            },
          }
        );
        const data = await res.json();
        setSearchResults(data.items || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, locale]);

  // Handle outside click & escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (onDismiss) {
          onDismiss();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onDismiss]);

  // Navigation actions
  const navActions: PaletteAction[] = [
    {
      id: "nav-browse",
      title: isTr ? "Tüm İlanları Keşfet" : "Browse All Listings",
      subtitle: isTr ? "Aktif ilan akışına git" : "Go to listings feed",
      icon: <Compass className="h-4 w-4 text-blue-400" />,
      category: "navigation",
      onSelect: () => {
        router.push(isTr ? "/tr/ilanlar" : "/en/listings");
        onClose();
      },
    },
    {
      id: "nav-new",
      title: isTr ? "Yeni İlan Yayınla" : "Post a New Listing",
      subtitle: isTr ? "Yeni ilan sihirbazını başlat" : "Start listing wizard",
      icon: <PlusCircle className="h-4 w-4 text-emerald-400" />,
      category: "navigation",
      onSelect: () => {
        router.push(isTr ? "/tr/ilanlar/yeni" : "/en/listings/new");
        onClose();
      },
    },
    {
      id: "nav-workspace",
      title: isTr ? "Çalışma Alanım / İlanlarım" : "My Workspace & Listings",
      subtitle: isTr ? "Yayınladığın ilanları yönet" : "Manage your listings",
      icon: <Briefcase className="h-4 w-4 text-purple-400" />,
      category: "navigation",
      onSelect: () => {
        router.push(isTr ? "/tr/panel/ilanlarim" : "/en/dashboard/listings");
        onClose();
      },
    },
    {
      id: "nav-offers-received",
      title: isTr ? "Gelen Teklifler" : "Received Offers",
      subtitle: isTr ? "İlanlarına gelen teklifleri incele" : "Review received proposals",
      icon: <Inbox className="h-4 w-4 text-amber-400" />,
      category: "navigation",
      onSelect: () => {
        router.push(isTr ? "/tr/panel/teklifler/gelen" : "/en/dashboard/offers/received");
        onClose();
      },
    },
    {
      id: "nav-offers-sent",
      title: isTr ? "Gönderilen Teklifler" : "Sent Offers",
      subtitle: isTr ? "Verdiğin tekliflerin durumunu gör" : "View your sent proposals",
      icon: <Send className="h-4 w-4 text-cyan-400" />,
      category: "navigation",
      onSelect: () => {
        router.push(isTr ? "/tr/panel/teklifler/gonderilen" : "/en/dashboard/offers/sent");
        onClose();
      },
    },
    {
      id: "nav-notifications",
      title: isTr ? "Bildirim Merkezi" : "Notification Center",
      subtitle: isTr ? "Radar ve teklif güncellemeleri" : "Radar and listing alerts",
      icon: <Bell className="h-4 w-4 text-blue-400" />,
      category: "navigation",
      onSelect: () => {
        router.push(isTr ? "/tr/panel/bildirimler" : "/en/dashboard/notifications");
        onClose();
      },
    },
    {
      id: "nav-profile",
      title: isTr ? "Profilimi Görüntüle" : "My Public Profile",
      subtitle: isTr ? "Doğrulanmış profil ve tavsiyeler" : "Public profile & endorsements",
      icon: <User className="h-4 w-4 text-emerald-400" />,
      category: "navigation",
      onSelect: () => {
        const targetHandle = userHandle || "demokullanici";
        router.push(isTr ? `/tr/profil/${targetHandle}` : `/en/profile/${targetHandle}`);
        onClose();
      },
    },
  ];

  // Theme actions
  const themeActions: PaletteAction[] = [
    {
      id: "theme-dark",
      title: isTr ? "Koyu Tema" : "Dark Theme",
      subtitle: isTr ? "Modern lacivert koyu mod" : "Modern dark sapphire palette",
      icon: <Moon className="h-4 w-4 text-blue-400" />,
      category: "theme",
      onSelect: () => {
        setTheme("dark");
        onClose();
      },
    },
    {
      id: "theme-light",
      title: isTr ? "Açık Tema" : "Light Theme",
      subtitle: isTr ? "Net ve aydınlık arayüz" : "Crisp bright interface",
      icon: <Sun className="h-4 w-4 text-amber-400" />,
      category: "theme",
      onSelect: () => {
        setTheme("light");
        onClose();
      },
    },
    {
      id: "theme-black",
      title: isTr ? "Siyah Tema (True OLED)" : "Black Theme (True OLED)",
      subtitle: isTr ? "Saf siyah derin kontrast" : "Pure black high contrast mode",
      icon: <Laptop className="h-4 w-4 text-purple-400" />,
      category: "theme",
      onSelect: () => {
        setTheme("black");
        onClose();
      },
    },
  ];

  // Dynamic category search actions via v5 search engine
  const categoryResults = query.trim() ? searchCategories(query.trim(), { limit: 3 }) : [];
  const categoryActions: PaletteAction[] = categoryResults.map((cat) => ({
    id: `category-${cat.slug}`,
    title: cat.name,
    subtitle: isTr ? "Kategoriyi İncele" : "Explore Category",
    icon: <Folder className="h-4 w-4 text-emerald-400" />,
    category: "categories",
    onSelect: () => {
      router.push(isTr ? `/tr/kategoriler?q=${encodeURIComponent(cat.name)}` : `/en/categories?q=${encodeURIComponent(cat.name)}`);
      onClose();
    },
  }));

  // Dynamic listing search actions
  const listingActions: PaletteAction[] = searchResults.map((item) => ({
    id: `listing-${item.id}`,
    title: item.title,
    subtitle: `${item.categoryName} • ${
      item.budgetMin
        ? `${parseFloat(item.budgetMin).toLocaleString(isTr ? "tr-TR" : "en-US")} ${item.budgetCurrency || "TL"}`
        : item.budgetMode
    }`,
    icon: <FileText className="h-4 w-4 text-blue-400" />,
    category: "listings",
    onSelect: () => {
      router.push(isTr ? `/tr/ilanlar/${item.slug}` : `/en/listings/${item.slug}`);
      onClose();
    },
  }));

  // Universal search action (always available when query is typed)
  const universalSearchActions: PaletteAction[] = query.trim()
    ? [
        {
          id: "search-all-listings-universal",
          title: isTr
            ? `"${query.trim()}" için tüm ilanlarda ara`
            : `Search all listings for "${query.trim()}"`,
          subtitle: isTr
            ? "İlanlar sayfasına git ve tüm sonuçları listele"
            : "Go to listings page with full filter results",
          icon: <Search className="h-4 w-4 text-blue-400" />,
          category: "navigation",
          onSelect: () => {
            const clean = query.trim();
            try {
              const stored = localStorage.getItem("operis_recent_searches");
              const prev: string[] = stored ? JSON.parse(stored) : [];
              const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
              localStorage.setItem("operis_recent_searches", JSON.stringify([clean, ...filtered].slice(0, 5)));
            } catch {
              // Gracefully ignore localStorage quota or private browsing errors
            }

            fetch("/api/search/trending", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query: clean, locale }),
            }).catch(() => {});

            router.push(
              isTr
                ? `/tr/ilanlar?q=${encodeURIComponent(clean)}`
                : `/en/listings?q=${encodeURIComponent(clean)}`
            );
            onClose();
          },
        },
      ]
    : [];

  // Build combined item list
  const filteredNavActions = query.trim()
    ? navActions.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          (a.subtitle && a.subtitle.toLowerCase().includes(query.toLowerCase()))
      )
    : navActions;

  const filteredThemeActions = query.trim()
    ? themeActions.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          (a.subtitle && a.subtitle.toLowerCase().includes(query.toLowerCase()))
      )
    : themeActions;

  const combinedActions: PaletteAction[] = [
    ...universalSearchActions,
    ...categoryActions,
    ...listingActions,
    ...filteredNavActions,
    ...filteredThemeActions,
  ];

  // Keyboard navigation within list
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (onDismiss) {
        onDismiss();
      } else {
        onClose();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, combinedActions.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev <= 0 ? Math.max(0, combinedActions.length - 1) : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = combinedActions[selectedIndex];
      if (current) {
        current.onSelect();
      }
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] sm:pt-[12vh] px-2.5 sm:px-4 bg-black/80 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (onDismiss) {
            onDismiss();
          } else {
            onClose();
          }
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={isTr ? "Komut Paleti" : "Command Palette"}
    >
      <div
        ref={containerRef}
        className="w-full max-w-xl rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-2xl shadow-blue-500/10 overflow-hidden flex flex-col max-h-[min(85dvh,620px)] animate-in zoom-in-95 duration-150"
      >
        {/* Search Header Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/60">
          <Search
            className="h-4.5 w-4.5 text-[var(--color-text-tertiary)] shrink-0"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={
              isTr
                ? "İlanlarda ara, sayfalara git veya tema değiştir..."
                : "Search listings, jump to pages, or change theme..."
            }
            className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
              title={isTr ? "Temizle" : "Clear"}
              aria-label={isTr ? "Aramayı Temizle" : "Clear search"}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
          {isSearching ? (
            <span className="text-[11px] text-blue-400 font-medium animate-pulse">
              {isTr ? "Aranıyor..." : "Searching..."}
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] font-mono text-[10px] text-[var(--color-text-tertiary)] shadow-xs">
                ESC
              </kbd>
            </div>
          )}
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 divide-y divide-[var(--color-border-subtle)]/40">
          {/* Universal Search section (Always available when query is typed) */}
          {universalSearchActions.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                {isTr ? "Doğrudan Arama" : "Direct Search"}
              </div>
              {universalSearchActions.map((action) => {
                const overallIdx = combinedActions.findIndex((a) => a.id === action.id);
                const isSelected = overallIdx === selectedIndex;
                return (
                  <div
                    key={action.id}
                    onClick={action.onSelect}
                    onMouseEnter={() => setSelectedIndex(overallIdx)}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-600/15 text-[var(--color-text-primary)] border border-blue-500/30"
                        : "hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        {action.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                          {action.title}
                        </div>
                        {action.subtitle && (
                          <div className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                            {action.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[10px] font-mono text-blue-400">
                        ↵
                      </kbd>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Categories section */}
          {categoryActions.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                {isTr ? "Kategoriler" : "Categories"}
              </div>
              {categoryActions.map((action) => {
                const overallIdx = combinedActions.findIndex((a) => a.id === action.id);
                const isSelected = overallIdx === selectedIndex;
                return (
                  <div
                    key={action.id}
                    onClick={action.onSelect}
                    onMouseEnter={() => setSelectedIndex(overallIdx)}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-emerald-500/15 text-[var(--color-text-primary)] border border-emerald-500/25"
                        : "hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        {action.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                          {action.title}
                        </div>
                        {action.subtitle && (
                          <div className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                            {action.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Listings section */}
          {listingActions.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                {isTr ? "Eşleşen İlanlar" : "Matching Listings"}
              </div>
              {listingActions.map((action) => {
                const overallIdx = combinedActions.findIndex((a) => a.id === action.id);
                const isSelected = overallIdx === selectedIndex;
                return (
                  <div
                    key={action.id}
                    onClick={action.onSelect}
                    onMouseEnter={() => setSelectedIndex(overallIdx)}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-500/15 text-[var(--color-text-primary)] border border-blue-500/25"
                        : "hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        {action.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                          {action.title}
                        </div>
                        {action.subtitle && (
                          <div className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                            {action.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[var(--color-text-tertiary)] shrink-0" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Navigation section */}
          {filteredNavActions.length > 0 && (
            <div className="space-y-1 pt-2">
              <div className="px-3 py-1 text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                {isTr ? "Hızlı Geçiş ve Rotalar" : "Quick Navigation"}
              </div>
              {filteredNavActions.map((action) => {
                const overallIdx = combinedActions.findIndex((a) => a.id === action.id);
                const isSelected = overallIdx === selectedIndex;
                return (
                  <div
                    key={action.id}
                    onClick={action.onSelect}
                    onMouseEnter={() => setSelectedIndex(overallIdx)}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-500/15 text-[var(--color-text-primary)] border border-blue-500/25"
                        : "hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0">
                        {action.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                          {action.title}
                        </div>
                        {action.subtitle && (
                          <div className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                            {action.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[9px] text-[var(--color-text-tertiary)] font-mono">
                      ↵
                    </kbd>
                  </div>
                );
              })}
            </div>
          )}

          {/* Theme section */}
          {filteredThemeActions.length > 0 && (
            <div className="space-y-1 pt-2">
              <div className="px-3 py-1 text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                {isTr ? "Arayüz Teması" : "Interface Theme"}
              </div>
              {filteredThemeActions.map((action) => {
                const overallIdx = combinedActions.findIndex((a) => a.id === action.id);
                const isSelected = overallIdx === selectedIndex;
                return (
                  <div
                    key={action.id}
                    onClick={action.onSelect}
                    onMouseEnter={() => setSelectedIndex(overallIdx)}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-500/15 text-[var(--color-text-primary)] border border-blue-500/25"
                        : "hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0">
                        {action.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                          {action.title}
                        </div>
                        {action.subtitle && (
                          <div className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                            {action.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    {((action.id === "theme-dark" && theme === "dark") ||
                      (action.id === "theme-light" && theme === "light") ||
                      (action.id === "theme-black" && theme === "black")) && (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {isTr ? "Aktif" : "Active"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {combinedActions.length === 0 && (
            <div className="p-8 text-center space-y-1">
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                {isTr ? "Sonuç bulunamadı" : "No results found"}
              </p>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr ? "Farklı bir arama terimi deneyin." : "Try a different search query."}
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 flex items-center justify-between text-[10px] sm:text-[11px] text-[var(--color-text-tertiary)] shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[9px] font-mono">
                ↑
              </kbd>
              <kbd className="px-1 py-0.2 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[9px] font-mono">
                ↓
              </kbd>
              <span className="ml-1">{isTr ? "Gezin" : "Navigate"}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[9px] font-mono">
                ↵
              </kbd>
              <span className="ml-1">{isTr ? "Seç" : "Select"}</span>
            </span>
          </div>
          <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
            Operis Command
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
