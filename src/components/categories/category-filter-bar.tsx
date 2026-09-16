"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
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
}

export function CategoryFilterBar({
  categories,
  selectedCategory,
  basePath,
  searchQuery,
  extraQuery = {},
  locale,
  resultCount,
}: CategoryFilterBarProps) {
  const isTr = locale === "tr";
  const [modalOpen, setModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const selectedCatObj = useMemo(
    () => categories.find((c) => c.slug === selectedCategory),
    [categories, selectedCategory]
  );

  const [quickDropdownOpen, setQuickDropdownOpen] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState("");
  const quickDropdownRef = useRef<HTMLDivElement>(null);
  const quickInputRef = useRef<HTMLInputElement>(null);

  // Close quick dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (quickDropdownRef.current && !quickDropdownRef.current.contains(e.target as Node)) {
        setQuickDropdownOpen(false);
      }
    }
    if (quickDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [quickDropdownOpen]);

  // Close quick dropdown on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setQuickDropdownOpen(false);
      }
    }
    if (quickDropdownOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [quickDropdownOpen]);

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

  // Categories filtered inside the quick combobox dropdown
  const quickFilteredCategories = useMemo(() => {
    const q = quickSearchQuery.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter((c) => {
      const sector = SEED_SECTORS.find((s) => s.key === c.sectorKey);
      const sectorName = sector
        ? isTr
          ? sector.translations.tr.name
          : sector.translations.en.name
        : "";
      return (
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        sectorName.toLowerCase().includes(q)
      );
    });
  }, [categories, quickSearchQuery, isTr]);

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

  const selectedSector = selectedCatObj
    ? SEED_SECTORS.find((s) => s.key === selectedCatObj.sectorKey)
    : null;
  const ActiveQuickIcon = selectedSector
    ? SECTOR_ICON_MAP[selectedSector.key] || Code2
    : selectedCategory
      ? Code2
      : Globe;

  return (
    <div className="space-y-2.5">
      {/* Searchable Quick Category Combobox Button (Replaces horizontal scroll rail) */}
      <div className={`relative ${quickDropdownOpen ? "z-50" : "z-10"}`} ref={quickDropdownRef}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Combobox Trigger Button / Input */}
          <div
            className={`relative flex-1 max-w-xl h-11 px-3.5 rounded-2xl bg-[var(--color-surface-hover)] border transition-all flex items-center gap-2.5 shadow-xs ${
              quickDropdownOpen
                ? "border-blue-500 ring-2 ring-blue-500/20 bg-[var(--color-surface-base)]"
                : "border-[var(--color-border-subtle)] hover:border-blue-500/40"
            }`}
          >
            <div className="h-7 w-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ActiveQuickIcon className="h-4 w-4" aria-hidden="true" />
            </div>

            <input
              type="text"
              ref={quickInputRef}
              value={
                quickDropdownOpen
                  ? quickSearchQuery
                  : selectedCatObj
                    ? selectedCatObj.name
                    : isTr
                      ? `Tüm Alanlar & Kategoriler (${categories.length})`
                      : `All Fields & Categories (${categories.length})`
              }
              onChange={(e) => {
                setQuickSearchQuery(e.target.value);
                if (!quickDropdownOpen) setQuickDropdownOpen(true);
              }}
              onFocus={() => setQuickDropdownOpen(true)}
              placeholder={
                isTr
                  ? "Kategori ara veya yazın (örn: Unity, Frontend, UI/UX)..."
                  : "Search or type category (e.g. Unity, Frontend)..."
              }
              aria-label={isTr ? "Kategori filtresi" : "Category filter"}
              className="flex-1 min-w-0 bg-transparent text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none font-medium truncate"
            />

            {quickDropdownOpen && quickSearchQuery ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickSearchQuery("");
                }}
                className="p-1 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-base)]"
                aria-label={isTr ? "Aramayı temizle" : "Clear search"}
              >
                <X className="h-3 w-3" />
              </button>
            ) : selectedCategory ? (
              <Link
                href={buildHref(undefined)}
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded-md text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-white hover:bg-blue-500/20 transition-colors"
                aria-label={isTr ? "Filtreyi kaldır" : "Clear filter"}
                title={isTr ? "Filtreyi kaldır" : "Clear filter"}
              >
                <X className="h-3 w-3" />
              </Link>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setQuickDropdownOpen((prev) => !prev);
                if (!quickDropdownOpen) {
                  setTimeout(() => quickInputRef.current?.focus(), 50);
                }
              }}
              className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              aria-label={isTr ? "Kategori menüsünü aç" : "Toggle category menu"}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  quickDropdownOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                }`}
              />
            </button>
          </div>

          {/* Action Buttons & Counter */}
          <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
            {typeof resultCount === "number" && (
              <span className="text-xs text-[var(--color-text-tertiary)] hidden sm:inline">
                <strong className="text-[var(--color-text-primary)]">{resultCount}</strong>{" "}
                {isTr ? "ilan" : "listings"}
              </span>
            )}

            {/* Modal / Grid Matrix Trigger */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-text-primary)] hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer shadow-xs whitespace-nowrap"
            >
              <LayoutGrid className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <span>
                {isTr
                  ? `Sektör Matrisi (${categories.length})`
                  : `Sector Matrix (${categories.length})`}
              </span>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Dropdown Menu (Shows 10 items in viewport, scrollable) */}
        {quickDropdownOpen && (
          <div
            className="absolute top-full left-0 mt-2 w-full max-w-xl rounded-2xl border p-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150"
            style={{
              backgroundColor: "var(--bg-elevated)",
              borderColor: "var(--border-strong)",
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border-subtle)",
            }}
          >
            <div className="max-h-[415px] overflow-y-auto space-y-1 p-0.5 scrollbar-thin">
              {/* Option 0: All Categories */}
              <Link
                href={buildHref(undefined)}
                onClick={() => {
                  setQuickDropdownOpen(false);
                  setQuickSearchQuery("");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  !selectedCategory
                    ? "bg-blue-500/10 dark:bg-blue-600/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 font-semibold"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold">{isTr ? "Tüm Alanlar" : "All Fields"}</p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">
                      {isTr
                        ? `10 sektördeki ${categories.length} uzmanlık kategorisi • ${categories.reduce((acc, c) => acc + (c.listingCount || 0), 0)} ilan`
                        : `All ${categories.length} categories across 10 sectors • ${categories.reduce((acc, c) => acc + (c.listingCount || 0), 0)} listings`}
                    </p>
                  </div>
                </div>
                {!selectedCategory && (
                  <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                )}
              </Link>

              {/* Matching Categories */}
              {quickFilteredCategories.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {isTr
                      ? "Aramanızla eşleşen kategori bulunamadı."
                      : "No matching categories found."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuickSearchQuery("")}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {isTr ? "Aramayı temizle" : "Clear search"}
                  </button>
                </div>
              ) : (
                quickFilteredCategories.map((cat) => {
                  const isSelected = selectedCategory === cat.slug;
                  const sector = SEED_SECTORS.find((s) => s.key === cat.sectorKey);
                  const sectorName = sector
                    ? isTr
                      ? sector.translations.tr.name
                      : sector.translations.en.name
                    : "";
                  const SectorIcon = (sector && SECTOR_ICON_MAP[sector.key]) || Code2;

                  return (
                    <Link
                      key={cat.id}
                      href={buildHref(cat.slug)}
                      onClick={() => {
                        setQuickDropdownOpen(false);
                        setQuickSearchQuery("");
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-blue-500/10 dark:bg-blue-600/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 font-semibold"
                          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                              : "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]"
                          }`}
                        >
                          <SectorIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{cat.name}</p>
                          {sectorName && (
                            <p className="text-[10px] text-[var(--color-text-tertiary)] truncate opacity-80">
                              {sectorName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {typeof cat.listingCount === "number" && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                              cat.listingCount > 0
                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                                : "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] border-[var(--color-border-subtle)]"
                            }`}
                          >
                            {cat.listingCount} {isTr ? "ilan" : "listings"}
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-[var(--color-text-tertiary)] bg-[var(--color-surface-hover)] px-1.5 py-0.5 rounded">
                          /{cat.slug}
                        </span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Categorized Popover / Modal with Live Search */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
        >
          <div
            ref={modalRef}
            className="relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] p-5 pb-4">
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
                    ? "İhtiyacınıza uygun sektör ve uzmanlık disiplinini seçin."
                    : "Select your relevant industry sector and specialization."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                aria-label={isTr ? "Kapat" : "Close"}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Live Search Input */}
            <div className="p-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30">
              <div className="relative">
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
            </div>

            {/* Modal Body: Grouped Categories */}
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
                        const isSelected = selectedCategory === cat.slug;
                        const sector = SEED_SECTORS.find((s) => s.key === cat.sectorKey);
                        const sectorName = sector
                          ? isTr
                            ? sector.translations.tr.name
                            : sector.translations.en.name
                          : "";

                        return (
                          <Link
                            key={cat.id}
                            href={buildHref(cat.slug)}
                            onClick={() => setModalOpen(false)}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? "border-blue-500/60 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold shadow-xs"
                                : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 hover:border-blue-500/30 hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]"
                            }`}
                          >
                            <div className="space-y-0.5 pr-2">
                              {sectorName && (
                                <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                                  {sectorName}
                                </div>
                              )}
                              <div className="font-semibold text-xs">{cat.name}</div>
                              {cat.description && (
                                <div className="text-[11px] text-[var(--color-text-secondary)] line-clamp-1">
                                  {cat.description}
                                </div>
                              )}
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Dynamic 10 Sector Groups */
                <>
                  {sectorGroups.map((group) => {
                    const Icon = group.icon;
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
                          <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] bg-[var(--color-surface-hover)] px-2 py-0.5 rounded-full">
                            {group.categories.length}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {group.categories.map((cat) => {
                            const isSelected = selectedCategory === cat.slug;
                            return (
                              <Link
                                key={cat.id}
                                href={buildHref(cat.slug)}
                                onClick={() => setModalOpen(false)}
                                className={`flex items-center justify-between p-2.5 px-3 rounded-xl border transition-all cursor-pointer ${
                                  isSelected
                                    ? "border-blue-500/60 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold shadow-xs"
                                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 hover:border-blue-500/30 hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]"
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <span className="font-medium text-xs">{cat.name}</span>
                                </div>
                                {isSelected && (
                                  <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {fallbackCats.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)]/40 pb-1.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg border text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20">
                          <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </div>
                        <h3 className="font-bold text-xs text-[var(--color-text-primary)] uppercase tracking-wider">
                          {isTr ? "Diğer Kategoriler" : "Other Categories"}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {fallbackCats.map((cat) => {
                          const isSelected = selectedCategory === cat.slug;
                          return (
                            <Link
                              key={cat.id}
                              href={buildHref(cat.slug)}
                              onClick={() => setModalOpen(false)}
                              className={`flex items-center justify-between p-2.5 px-3 rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? "border-blue-500/60 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold shadow-xs"
                                  : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 hover:border-blue-500/30 hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]"
                              }`}
                            >
                              <div className="truncate pr-2">
                                <span className="font-medium text-xs">{cat.name}</span>
                              </div>
                              {isSelected && (
                                <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer: Reset & Close */}
            <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] p-4 bg-[var(--color-surface-hover)]/40 text-xs">
              <Link
                href={buildHref(undefined)}
                onClick={() => setModalOpen(false)}
                className="text-[var(--color-text-secondary)] hover:text-red-400 transition-colors"
              >
                {isTr ? "Filtreyi Sıfırla (Tümü)" : "Reset Filter (All)"}
              </Link>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl bg-blue-600 px-4 py-1.5 font-semibold text-white hover:bg-blue-500 transition-all cursor-pointer"
              >
                {isTr ? "Kapat" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
