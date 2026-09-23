"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  X,
  ChevronDown,
  Check,
  Briefcase,
  Layers,
} from "lucide-react";
import { SEED_SECTORS } from "@/db/seeds/categories";
import { SECTOR_ICONS } from "./category-icons-map";
import type { CategoryItem } from "./category-grid-card";

export interface CategorySearchFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedSector: string;
  onSelectSector: (sectorKey: string) => void;
  categories: CategoryItem[];
  isTr: boolean;
}

export function CategorySearchFilter({
  searchQuery,
  onSearchChange,
  selectedSector,
  onSelectSector,
  categories,
  isTr,
}: CategorySearchFilterProps) {
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);
  const [sectorSearchQuery, setSectorSearchQuery] = useState("");
  const sectorDropdownRef = useRef<HTMLDivElement>(null);
  const sectorInputRef = useRef<HTMLInputElement>(null);

  // Close sector dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sectorDropdownRef.current && !sectorDropdownRef.current.contains(event.target as Node)) {
        setIsSectorDropdownOpen(false);
      }
    }
    if (isSectorDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSectorDropdownOpen]);

  // Close sector dropdown on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsSectorDropdownOpen(false);
      }
    }
    if (isSectorDropdownOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSectorDropdownOpen]);

  const selectedSectorObj = useMemo(() => {
    if (selectedSector === "all") return null;
    return SEED_SECTORS.find((s) => s.key === selectedSector) || null;
  }, [selectedSector]);

  const currentSectorLabel = useMemo(() => {
    if (!selectedSectorObj) {
      return isTr ? "Tüm Sektörler" : "All Sectors";
    }
    return isTr ? selectedSectorObj.translations.tr.name : selectedSectorObj.translations.en.name;
  }, [selectedSectorObj, isTr]);

  const currentSectorCount =
    selectedSector === "all"
      ? categories.length
      : categories.filter((c) => c.sectorKey === selectedSector).length;

  const currentSectorListingCount = useMemo(() => {
    if (selectedSector === "all") {
      return categories.reduce((acc, c) => acc + (c.listingCount || 0), 0);
    }
    return categories
      .filter((c) => c.sectorKey === selectedSector)
      .reduce((acc, c) => acc + (c.listingCount || 0), 0);
  }, [categories, selectedSector]);

  let ActiveSectorIcon = Layers;
  if (selectedSectorObj) {
    ActiveSectorIcon = SECTOR_ICONS[selectedSectorObj.key] || Briefcase;
  }

  const sectorOptions = useMemo(() => {
    const totalListings = categories.reduce((acc, c) => acc + (c.listingCount || 0), 0);
    const list = [
      {
        key: "all",
        name: isTr ? "Tüm Sektörler" : "All Sectors",
        count: categories.length,
        listingCount: totalListings,
        icon: Layers,
        subText: isTr
          ? `10 sektör, ${categories.length} uzmanlık • ${totalListings} aktif ilan`
          : `10 sectors, ${categories.length} specializations • ${totalListings} active listings`,
        allKeywords: "all tüm hepsi",
      },
      ...SEED_SECTORS.map((sec) => {
        const name = isTr ? sec.translations.tr.name : sec.translations.en.name;
        const subCats = categories.filter((c) => c.sectorKey === sec.key);
        const sectorListingCount = subCats.reduce((acc, c) => acc + (c.listingCount || 0), 0);
        const subText = subCats
          .slice(0, 3)
          .map((c) => c.name)
          .join(", ");
        const allKeywords =
          `${name} ${subCats.map((c) => `${c.name} ${c.slug}`).join(" ")}`.toLowerCase();

        return {
          key: sec.key,
          name,
          count: subCats.length,
          listingCount: sectorListingCount,
          icon: SECTOR_ICONS[sec.key] || Briefcase,
          subText,
          allKeywords,
        };
      }),
    ];

    const q = sectorSearchQuery.toLowerCase().trim();
    if (!q) return list;

    return list.filter((item) => item.allKeywords.includes(q));
  }, [categories, isTr, sectorSearchQuery]);

  let containerZIndexClass = "z-20";
  if (isSectorDropdownOpen) {
    containerZIndexClass = "z-50 ring-1 ring-blue-500/25 border-blue-500/40";
  }

  let triggerStyleClass = "bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-hover)]/80 border-[var(--color-border-subtle)]/70 text-[var(--color-text-primary)]";
  if (isSectorDropdownOpen) {
    triggerStyleClass = "bg-blue-500/10 border-blue-500/40 text-[var(--color-text-primary)]";
  }

  return (
    <div
      className={`relative rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/85 backdrop-blur-xl p-2 sm:p-2.5 shadow-sm transition-all ${containerZIndexClass}`}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Akıcı Kategori ve Beceri Arama Girdisi (Sol Entegre) */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              isTr
                ? "Kategori veya beceri ara (örn. Frontend, Unity, Next.js, SEO)..."
                : "Filter specializations (e.g. Frontend, Unity, Next.js, Cloud)..."
            }
            aria-label={isTr ? "Kategori filtrele" : "Filter categories"}
            className="w-full h-10 rounded-xl bg-transparent border-none pl-9 pr-8 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none transition-all [&::-webkit-search-cancel-button]:hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
              aria-label={isTr ? "Aramayı temizle" : "Clear search"}
              title={isTr ? "Aramayı temizle" : "Clear search"}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Dikey İnce Ayraç (Masaüstü) */}
        <div className="hidden sm:block h-6 w-px bg-[var(--color-border-subtle)]/70 mx-0.5" />

        {/* Sektör Seçici Combobox Tetikleyici (Sağ Entegre) */}
        <div className="relative z-50 shrink-0 w-full sm:w-auto" ref={sectorDropdownRef}>
          <div
            className={`w-full sm:w-72 md:w-80 h-10 px-3 rounded-xl transition-all flex items-center justify-between gap-2 text-left cursor-pointer border select-none ${triggerStyleClass}`}
            onClick={() => {
              setIsSectorDropdownOpen((prev) => !prev);
              if (!isSectorDropdownOpen) {
                setTimeout(() => sectorInputRef.current?.focus(), 50);
              }
            }}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="h-6 w-6 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <ActiveSectorIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold truncate">
                {currentSectorLabel}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                <span className="hidden min-[380px]:inline">{currentSectorCount} {isTr ? "alan" : "areas"} • </span>
                {currentSectorListingCount} {isTr ? "ilan" : "listings"}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[var(--color-text-tertiary)] transition-transform duration-200 ${
                  isSectorDropdownOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                }`}
              />
            </div>
          </div>

          {/* Dropdown Menu (With Search Filter Inside Popover, Right Aligned) */}
          {isSectorDropdownOpen && (
            <div
              className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-full min-w-0 max-w-[calc(100vw-2rem)] sm:max-w-[480px] sm:min-w-[420px] rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-2xl shadow-black/50 p-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="p-1 mb-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                  <input
                    type="text"
                    ref={sectorInputRef}
                    value={sectorSearchQuery}
                    onChange={(e) => setSectorSearchQuery(e.target.value)}
                    placeholder={isTr ? "Sektör ara..." : "Filter sector..."}
                    className="w-full h-8 pl-8 pr-7 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-blue-500"
                  />
                  {sectorSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setSectorSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-[min(55dvh,380px)] overflow-y-auto space-y-1 p-0.5 scrollbar-thin">
                {sectorOptions.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {isTr
                        ? "Aramanızla eşleşen sektör bulunamadı."
                        : "No matching sector found."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSectorSearchQuery("")}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {isTr ? "Aramayı temizle" : "Clear search"}
                    </button>
                  </div>
                ) : (
                  sectorOptions.map((item) => {
                    const Icon = item.icon;
                    const isSelected = selectedSector === item.key;

                    let rowClass = "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]";
                    if (isSelected) {
                      rowClass = "bg-blue-500/10 dark:bg-blue-600/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 font-semibold";
                    }

                    let iconBgClass = "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]";
                    if (isSelected) {
                      iconBgClass = "bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400";
                    }

                    let countBadgeClass = "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]";
                    if (isSelected) {
                      countBadgeClass = "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20 dark:border-transparent";
                    }

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          onSelectSector(item.key);
                          setIsSectorDropdownOpen(false);
                          setSectorSearchQuery("");
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${rowClass}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${iconBgClass}`}>
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{item.name}</p>
                            {item.subText && (
                              <p className="text-[10px] text-[var(--color-text-tertiary)] truncate opacity-80">
                                {item.subText}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${countBadgeClass}`}>
                            <span className="hidden min-[360px]:inline">{item.count} {isTr ? "uzmanlık" : "specializations"} • </span>
                            {item.listingCount} {isTr ? "ilan" : "listings"}
                          </span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Aktif Sektör Sıfırlama Rozeti (Eğer sektör seçiliyse) */}
        {selectedSector !== "all" && (
          <button
            type="button"
            onClick={() => onSelectSector("all")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/20 transition-colors shrink-0 cursor-pointer"
            title={isTr ? "Sektör filtresini sıfırla" : "Reset sector filter"}
          >
            <span>{isTr ? "Filtreyi Sıfırla" : "Reset Filter"}</span>
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
