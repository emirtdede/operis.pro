"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronRight,
  ChevronDown,
  Globe,
  Search,
  Sparkles,
  Code2,
  Cpu,
  Palette,
  TrendingUp,
  Video,
  PenTool,
  Briefcase,
  Scale,
  Box,
  Headphones,
  Check,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import type { CategoryDto } from "@/src/modules/categories/service";
import { SEED_SECTORS } from "@/db/seeds/categories";

const SECTOR_ICON_MAP: Record<string, LucideIcon> = {
  "sector-software-it": Code2,
  "sector-ai-data": Cpu,
  "sector-design-creative": Palette,
  "sector-marketing-growth": TrendingUp,
  "sector-video-audio": Video,
  "sector-writing-translation": PenTool,
  "sector-business-finance": Briefcase,
  "sector-legal-compliance": Scale,
  "sector-engineering-3d": Box,
  "sector-operations-support": Headphones,
};

const SECTOR_COLOR_MAP: Record<string, string> = {
  "sector-software-it": "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "sector-ai-data": "text-purple-400 bg-purple-500/10 border-purple-500/20",
  "sector-design-creative": "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "sector-marketing-growth": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "sector-video-audio": "text-rose-400 bg-rose-500/10 border-rose-500/20",
  "sector-writing-translation": "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  "sector-business-finance": "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  "sector-legal-compliance": "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  "sector-engineering-3d": "text-teal-400 bg-teal-500/10 border-teal-500/20",
  "sector-operations-support": "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
};

export interface CategoryFilterBarProps {
  categories: CategoryDto[];
  selectedCategory?: string;
  basePath: string;
  searchQuery?: string;
  extraQuery?: Record<string, string>;
  locale: string;
  resultCount?: number;
  showSearchInput?: boolean;
  variant?: "horizontal" | "sidebar";
}

export function CategoryFilterBar({
  categories,
  selectedCategory,
  basePath,
  searchQuery,
  extraQuery = {},
  locale,
  resultCount: _resultCount,
  showSearchInput = false,
  variant = "horizontal",
}: CategoryFilterBarProps) {
  const isTr = locale === "tr";
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [modalView, setModalView] = useState<"all" | "sectors">("all");
  const [searchFilter, setSearchFilter] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse multi-category slugs from comma-separated string
  const selectedCategorySlugs = useMemo(() => {
    if (!selectedCategory) return [];
    return selectedCategory
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [selectedCategory]);

  // Temporary selection state for the modal
  const [tempSelectedSlugs, setTempSelectedSlugs] = useState<string[]>([]);

  useEffect(() => {
    if (modalOpen) {
      setTempSelectedSlugs(selectedCategorySlugs);
    }
  }, [modalOpen, selectedCategorySlugs]);

  const toggleModalCategory = (slug: string) => {
    setTempSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const toggleSectorCategories = (sectorCatSlugs: string[]) => {
    const allSelected = sectorCatSlugs.every((slug) => tempSelectedSlugs.includes(slug));
    if (allSelected) {
      setTempSelectedSlugs((prev) => prev.filter((s) => !sectorCatSlugs.includes(s)));
    } else {
      setTempSelectedSlugs((prev) => Array.from(new Set([...prev, ...sectorCatSlugs])));
    }
  };

  const applyModalFilters = () => {
    const slugParam = tempSelectedSlugs.length > 0 ? tempSelectedSlugs.join(",") : undefined;
    router.push(buildHref(slugParam));
    setModalOpen(false);
  };

  // Group categories dynamically under the 10 official industry sectors
  const sectorGroups = useMemo(() => {
    return SEED_SECTORS.map((sec) => {
      const trans = isTr ? sec.translations.tr : sec.translations.en;
      const cats = categories.filter((c) => c.sectorKey === sec.key);
      const Icon = SECTOR_ICON_MAP[sec.key] || Briefcase;
      const color = SECTOR_COLOR_MAP[sec.key] || "text-blue-400 bg-blue-500/10 border-blue-500/20";
      return {
        key: sec.key,
        name: trans.name,
        icon: Icon,
        color,
        categories: cats,
      };
    }).filter((g) => g.categories.length > 0);
  }, [categories, isTr]);

  const fallbackCats = useMemo(() => {
    const knownKeys = new Set(SEED_SECTORS.map((s) => s.key));
    return categories.filter((c) => !c.sectorKey || !knownKeys.has(c.sectorKey));
  }, [categories]);

  // Sorted list for All Categories view
  const sortedAllCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name, isTr ? "tr" : "en"));
  }, [categories, isTr]);

  // Helper to build URLs preserving extra query params and search query
  const buildHref = (catSlug?: string) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    Object.entries(extraQuery).forEach(([key, val]) => {
      if (val) params.set(key, val);
    });
    if (catSlug) {
      params.set("category", catSlug);
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const clearSearchHref = () => {
    const params = new URLSearchParams();
    Object.entries(extraQuery).forEach(([key, val]) => {
      if (val) params.set(key, val);
    });
    if (selectedCategory) {
      params.set("category", selectedCategory);
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const comboboxLabel = useMemo(() => {
    if (selectedCategorySlugs.length === 0) {
      return isTr
        ? `Tüm Kategoriler (${categories.length})`
        : `All Categories (${categories.length})`;
    }
    if (selectedCategorySlugs.length === 1) {
      const cat = categories.find((c) => c.slug === selectedCategorySlugs[0]);
      return cat ? cat.name : selectedCategorySlugs[0];
    }
    const firstCat = categories.find((c) => c.slug === selectedCategorySlugs[0]);
    return isTr
      ? `${firstCat?.name || "Kategori"} (+${selectedCategorySlugs.length - 1})`
      : `${firstCat?.name || "Category"} (+${selectedCategorySlugs.length - 1})`;
  }, [selectedCategorySlugs, categories, isTr]);

  // Categories filtered inside the popover/modal
  const filteredModalCategories = useMemo(() => {
    if (!searchFilter.trim()) return categories;
    const q = searchFilter.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchFilter]);

  // Close modal on Escape or outside click
  useEffect(() => {
    if (!modalOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setModalOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setModalOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    setTimeout(() => searchInputRef.current?.focus(), 50);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalOpen]);

  return (
    <div className="space-y-2.5">
      {variant === "sidebar" ? (
        /* Vertical Sidebar Triggers (Twitter-style left column) */
        <div className="space-y-2 w-full">
          {/* 1. Tüm Kategoriler Butonu */}
          <button
            type="button"
            onClick={() => {
              setModalView("all");
              setModalOpen(true);
            }}
            className={`w-full h-11 px-3.5 rounded-2xl border transition-all flex items-center justify-between shadow-xs cursor-pointer ${
              selectedCategorySlugs.length > 0
                ? "border-blue-500/50 bg-blue-500/15 text-blue-700 dark:text-sky-300 font-semibold ring-1 ring-blue-500/30"
                : "border-[var(--color-border-subtle)] bg-surface/75 backdrop-blur-xl hover:bg-surface/90 hover:border-blue-500/40 text-[var(--color-text-primary)]"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-xl bg-blue-500/15 text-blue-600 dark:text-sky-300 flex items-center justify-center shrink-0">
                <Globe className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold truncate text-left">
                {selectedCategorySlugs.length > 0 ? comboboxLabel : isTr ? "Tüm Kategoriler" : "All Categories"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-surface/80 text-[var(--color-text-tertiary)] border border-[var(--color-border-subtle)]">
                {categories.length}
              </span>
              {selectedCategorySlugs.length > 0 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(buildHref(undefined));
                  }}
                  className="p-1 rounded-md text-blue-600 dark:text-sky-300 hover:bg-blue-500/20 transition-colors cursor-pointer"
                  title={isTr ? "Temizle" : "Clear"}
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </div>
          </button>

          {/* 2. Sektör Matrisi Butonu */}
          <button
            type="button"
            onClick={() => {
              setModalView("sectors");
              setModalOpen(true);
            }}
            className="w-full h-11 px-3.5 rounded-2xl border border-[var(--color-border-subtle)] bg-surface/75 backdrop-blur-xl hover:bg-surface/90 hover:border-blue-500/40 text-[var(--color-text-primary)] transition-all flex items-center justify-between shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold">
                {isTr ? "Sektör Matrisi" : "Sector Matrix"}
              </span>
            </div>

            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25">
              {sectorGroups.length}
            </span>
          </button>
        </div>
      ) : showSearchInput ? (
        /* Unified Search & Category Command Bar */
        <div className="relative z-20">
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-surface/75 backdrop-blur-xl p-1.5 shadow-sm">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
              {/* 1. Keyword Search Input Form */}
              <form
                method="GET"
                action={basePath}
                className="relative flex-1 flex items-center min-w-0"
                role="search"
              >
                {selectedCategory && (
                  <input type="hidden" name="category" value={selectedCategory} />
                )}
                {Object.entries(extraQuery).map(([k, v]) => (
                  <input key={k} type="hidden" name={k} value={v} />
                ))}
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)] pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  name="q"
                  defaultValue={searchQuery ?? ""}
                  maxLength={100}
                  aria-label={isTr ? "İlan arama" : "Search listings"}
                  placeholder={
                    isTr
                      ? "İlan başlığı, teknoloji veya anahtar kelime ara..."
                      : "Search listing title, tech stack or keywords..."
                  }
                  className={`w-full rounded-xl bg-surface/40 hover:bg-surface/60 focus:bg-surface/80 border border-transparent focus:border-blue-500/30 pl-10 ${
                    searchQuery ? "pr-9" : "pr-3"
                  } py-2.5 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] transition-all outline-none`}
                />
                {searchQuery && (
                  <Link
                    href={clearSearchHref()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                    title={isTr ? "Aramayı Temizle" : "Clear Search"}
                    aria-label={isTr ? "Aramayı Temizle" : "Clear Search"}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                )}
              </form>

              {/* Dikey Ayrım Çizgisi (Desktop) */}
              <div className="hidden md:block w-px h-7 bg-[var(--color-border-subtle)]" />

              {/* 2. Tüm Kategoriler Butonu (Pop-up Modal Açar) */}
              <button
                type="button"
                onClick={() => {
                  setModalView("all");
                  setModalOpen(true);
                }}
                className={`relative h-10 px-3 rounded-xl border transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                  selectedCategorySlugs.length > 0
                    ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                    : "border-transparent bg-surface/40 hover:bg-surface/70 text-[var(--color-text-primary)]"
                }`}
              >
                <div className="h-6 w-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                </div>

                <span className="text-xs font-medium truncate max-w-[130px] sm:max-w-[180px]">
                  {comboboxLabel}
                </span>

                {selectedCategorySlugs.length > 0 ? (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(buildHref(undefined));
                    }}
                    className="p-1 rounded-md text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-white hover:bg-blue-500/20 transition-colors cursor-pointer"
                    title={isTr ? "Filtreleri kaldır" : "Clear filters"}
                    aria-label={isTr ? "Filtreleri kaldır" : "Clear filters"}
                  >
                    <X className="h-3 w-3" />
                  </span>
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-tertiary)] shrink-0" />
                )}
              </button>

              {/* Dikey Ayrım Çizgisi (Desktop) */}
              <div className="hidden md:block w-px h-7 bg-[var(--color-border-subtle)]" />

              {/* 3. Sektör Matrisi Butonu (Pop-up Modal Açar) */}
              <button
                type="button"
                onClick={() => {
                  setModalView("sectors");
                  setModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 h-10 px-3.5 rounded-xl border border-transparent hover:border-[var(--color-border-subtle)] bg-surface/40 hover:bg-surface/70 text-xs font-semibold text-[var(--color-text-primary)] hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <LayoutGrid className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>{isTr ? "Sektör Matrisi" : "Sector Matrix"}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-bold">
                  {selectedCategorySlugs.length > 0
                    ? `${selectedCategorySlugs.length} Seçili`
                    : sectorGroups.length}
                </span>
                <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Standalone Combobox Trigger */
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Tüm Kategoriler Butonu */}
            <button
              type="button"
              onClick={() => {
                setModalView("all");
                setModalOpen(true);
              }}
              className={`relative flex-1 max-w-xl h-11 px-3.5 rounded-2xl border transition-all flex items-center gap-2.5 shadow-xs cursor-pointer ${
                selectedCategorySlugs.length > 0
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-[var(--color-border-subtle)] bg-surface/75 backdrop-blur-xl text-[var(--color-text-primary)] hover:border-blue-500/40"
              }`}
            >
              <div className="h-7 w-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Globe className="h-4 w-4" aria-hidden="true" />
              </div>

              <span className="flex-1 text-left text-xs font-medium truncate">
                {comboboxLabel}
              </span>

              {selectedCategorySlugs.length > 0 ? (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(buildHref(undefined));
                  }}
                  className="p-1 rounded-md text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-white hover:bg-blue-500/20 transition-colors cursor-pointer"
                  title={isTr ? "Filtreleri kaldır" : "Clear filters"}
                  aria-label={isTr ? "Filtreleri kaldır" : "Clear filters"}
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              ) : (
                <ChevronDown className="h-4 w-4 text-[var(--color-text-tertiary)] shrink-0" />
              )}
            </button>

            {/* Sektör Matrisi Butonu */}
            <button
              type="button"
              onClick={() => {
                setModalView("sectors");
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-2xl border border-[var(--color-border-subtle)] bg-surface/75 backdrop-blur-xl text-xs font-semibold text-[var(--color-text-primary)] hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer shadow-xs whitespace-nowrap self-end sm:self-center shrink-0"
            >
              <LayoutGrid className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <span>
                {isTr ? "Sektör Matrisi" : "Sector Matrix"}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-bold">
                {selectedCategorySlugs.length > 0
                  ? `${selectedCategorySlugs.length} Seçili`
                  : sectorGroups.length}
              </span>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Categorized Popover / Modal with Live Search & Dual Views */}
      {modalOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
        >
          <div
            ref={modalRef}
            className="relative w-full max-w-4xl max-h-[min(90dvh,850px)] flex flex-col rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] p-5 pb-4 bg-[var(--color-surface-elevated)]">
              <div className="space-y-0.5">
                <h2
                  id="category-modal-title"
                  className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <span>
                    {isTr
                      ? "Tüm Sektör ve Uzmanlık Kategorileri"
                      : "All Sectors & Specialization Categories"}
                  </span>
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {isTr
                    ? "İhtiyacınıza uygun sektör ve uzmanlık disiplinlerini seçin. Birden fazla seçim yapabilirsiniz."
                    : "Select your relevant industry sectors and specializations. You can select multiple."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-2 text-[var(--color-text-secondary)] hover:bg-surface/60 hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                aria-label={isTr ? "Kapat" : "Close"}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Modal Sub-Header: Live Search & View Switcher */}
            <div className="p-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={
                    isTr
                      ? "Kategori adı veya anahtar kelime yazın..."
                      : "Search by category name or keyword..."
                  }
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] pl-10 pr-9 py-2 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-blue-500 focus:outline-none transition-all"
                />
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center p-1 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => setModalView("all")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    modalView === "all"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>{isTr ? `Tüm Kategoriler (${categories.length})` : `All Categories (${categories.length})`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalView("sectors")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    modalView === "sectors"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>{isTr ? `Sektör Matrisi (${sectorGroups.length})` : `Sector Matrix (${sectorGroups.length})`}</span>
                </button>
              </div>
            </div>

            {/* Modal Body: Grouped Categories or All Categories */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
              {searchFilter.trim() ? (
                /* Search Results Flat Grid */
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
                    {isTr
                      ? `${filteredModalCategories.length} sonuç bulundu`
                      : `${filteredModalCategories.length} results found`}
                  </div>
                  {filteredModalCategories.length === 0 ? (
                    <div className="p-8 text-center text-[var(--color-text-secondary)]">
                      {isTr
                        ? "Aramanızla eşleşen kategori bulunamadı."
                        : "No matching categories found."}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {filteredModalCategories.map((cat) => {
                        const isSelected = tempSelectedSlugs.includes(cat.slug);
                        const sector = SEED_SECTORS.find((s) => s.key === cat.sectorKey);
                        const sectorName = sector
                          ? isTr
                            ? sector.translations.tr.name
                            : sector.translations.en.name
                          : "";

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleModalCategory(cat.slug)}
                            className={`text-left w-full flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold shadow-xs ring-1 ring-blue-500/30"
                                : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-blue-500/30 hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] shadow-2xs"
                            }`}
                          >
                            <div className="space-y-0.5 pr-2 min-w-0">
                              {sectorName && (
                                <div className="text-[11px] font-medium text-[var(--color-text-secondary)] dark:text-slate-300 truncate">
                                  {sectorName}
                                </div>
                              )}
                              <div className="font-semibold text-xs truncate">{cat.name}</div>
                              {cat.description && (
                                <div className="text-[11px] text-[var(--color-text-secondary)] line-clamp-1">
                                  {cat.description}
                                </div>
                              )}
                            </div>
                            <div
                              className={`h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] text-transparent"
                              }`}
                            >
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : modalView === "all" ? (
                /* All Categories Grid (Alphabetical with multi-select) */
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)]/40 pb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      {isTr
                        ? `Tüm Kategoriler (${sortedAllCategories.length})`
                        : `All Categories (${sortedAllCategories.length})`}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-secondary)]">
                      {isTr ? "Birden fazla kategori seçebilirsiniz" : "You can select multiple categories"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {sortedAllCategories.map((cat) => {
                      const isSelected = tempSelectedSlugs.includes(cat.slug);
                      const sector = SEED_SECTORS.find((s) => s.key === cat.sectorKey);
                      const sectorName = sector
                        ? isTr
                          ? sector.translations.tr.name
                          : sector.translations.en.name
                        : "";

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleModalCategory(cat.slug)}
                          className={`text-left w-full flex items-center justify-between p-2.5 px-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold shadow-xs ring-1 ring-blue-500/30"
                              : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-blue-500/30 hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] shadow-2xs"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-medium text-xs truncate">{cat.name}</p>
                            {sectorName && (
                              <p className="text-[11px] font-medium text-[var(--color-text-secondary)] dark:text-slate-300 truncate">
                                {sectorName}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {typeof cat.listingCount === "number" && cat.listingCount > 0 && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-sky-300 border border-blue-500/25">
                                {cat.listingCount}
                              </span>
                            )}
                            <div
                              className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] text-transparent"
                              }`}
                            >
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Dynamic 10 Sector Groups */
                <>
                  {sectorGroups.map((group) => {
                    const Icon = group.icon;
                    const sectorSlugs = group.categories.map((c) => c.slug);
                    const allSectorSelected =
                      sectorSlugs.length > 0 &&
                      sectorSlugs.every((slug) => tempSelectedSlugs.includes(slug));
                    const selectedInSectorCount = sectorSlugs.filter((slug) =>
                      tempSelectedSlugs.includes(slug)
                    ).length;

                    return (
                      <div key={group.key} className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border-subtle)]/40 pb-1.5">
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-lg border ${group.color}`}
                            >
                              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            </div>
                            <h3 className="font-bold text-xs text-[var(--color-text-primary)] uppercase tracking-wider">
                              {group.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleSectorCategories(sectorSlugs)}
                              className="text-[11px] font-semibold text-blue-600 dark:text-sky-400 hover:underline cursor-pointer"
                            >
                              {allSectorSelected
                                ? isTr
                                  ? "Tümünü Bırak"
                                  : "Deselect All"
                                : isTr
                                  ? "Tümünü Seç"
                                  : "Select All"}
                            </button>
                            <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] bg-[var(--color-surface-hover)] px-2 py-0.5 rounded-full">
                              {selectedInSectorCount > 0
                                ? `${selectedInSectorCount}/${group.categories.length}`
                                : group.categories.length}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {group.categories.map((cat) => {
                            const isSelected = tempSelectedSlugs.includes(cat.slug);
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => toggleModalCategory(cat.slug)}
                                className={`text-left w-full flex items-center justify-between p-2.5 px-3 rounded-xl border transition-all cursor-pointer ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold shadow-xs ring-1 ring-blue-500/30"
                                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-blue-500/30 hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] shadow-2xs"
                                }`}
                              >
                                <span className="truncate pr-2 font-medium text-xs">
                                  {cat.name}
                                </span>
                                <div
                                  className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected
                                      ? "bg-blue-600 border-blue-600 text-white"
                                      : "border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] text-transparent"
                                  }`}
                                >
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {fallbackCats.length > 0 && (() => {
                    const fallbackSlugs = fallbackCats.map((c) => c.slug);
                    const allFallbackSelected =
                      fallbackSlugs.length > 0 &&
                      fallbackSlugs.every((slug) => tempSelectedSlugs.includes(slug));
                    const selectedFallbackCount = fallbackSlugs.filter((slug) =>
                      tempSelectedSlugs.includes(slug)
                    ).length;

                    return (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border-subtle)]/40 pb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg border text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20">
                              <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </div>
                            <h3 className="font-bold text-xs text-[var(--color-text-primary)] uppercase tracking-wider">
                              {isTr ? "Diğer Kategoriler" : "Other Categories"}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleSectorCategories(fallbackSlugs)}
                              className="text-[11px] font-semibold text-blue-600 dark:text-sky-400 hover:underline cursor-pointer"
                            >
                              {allFallbackSelected
                                ? isTr
                                  ? "Tümünü Bırak"
                                  : "Deselect All"
                                : isTr
                                  ? "Tümünü Seç"
                                  : "Select All"}
                            </button>
                            <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] bg-surface/60 px-2 py-0.5 rounded-full">
                              {selectedFallbackCount > 0
                                ? `${selectedFallbackCount}/${fallbackCats.length}`
                                : fallbackCats.length}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {fallbackCats.map((cat) => {
                            const isSelected = tempSelectedSlugs.includes(cat.slug);
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => toggleModalCategory(cat.slug)}
                                className={`text-left w-full flex items-center justify-between p-2.5 px-3 rounded-xl border transition-all cursor-pointer ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold shadow-xs ring-1 ring-blue-500/30"
                                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-blue-500/30 hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] shadow-2xs"
                                }`}
                              >
                                <span className="truncate pr-2 font-medium text-xs">
                                  {cat.name}
                                </span>
                                <div
                                  className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected
                                      ? "bg-blue-600 border-blue-600 text-white"
                                      : "border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] text-transparent"
                                  }`}
                                >
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {/* Modal Footer: Reset & Apply */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] p-4 bg-[var(--color-surface-base)]/50 text-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTempSelectedSlugs([])}
                  disabled={tempSelectedSlugs.length === 0}
                  className="text-[var(--color-text-secondary)] hover:text-red-400 disabled:opacity-40 disabled:hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {isTr ? "Seçimleri Temizle" : "Clear Selection"}
                </button>
                {tempSelectedSlugs.length > 0 && (
                  <span className="text-[11px] font-semibold text-blue-700 dark:text-sky-300 bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                    {isTr
                      ? `${tempSelectedSlugs.length} kategori seçildi`
                      : `${tempSelectedSlugs.length} categories selected`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:bg-[var(--color-surface-hover)] px-4 py-2 font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer"
                >
                  {isTr ? "İptal" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={applyModalFilters}
                  className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>{isTr ? "Filtreleri Uygula" : "Apply Filters"}</span>
                  {tempSelectedSlugs.length > 0 && (
                    <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      {tempSelectedSlugs.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
