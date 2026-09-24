"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  RotateCcw,
  SlidersHorizontal,
  Check,
  Clock,
  Briefcase,
  Layers,
  ShieldCheck,
  Search,
  Flame,
  Globe,
  Calendar,
} from "lucide-react";
import type { CategoryDto } from "@/src/modules/categories/service";
import { Button } from "@/src/components/ui/button";

export interface AdvancedFilterState {
  categorySlug: string;
  timeRange: "all" | "24h" | "3d" | "7d";
  budgetType: "all" | "fixed" | "open" | "high";
  encryptedOnly: boolean;
}

const STORAGE_KEY = "operis_feed_filters_v1";

const DEFAULT_FILTERS: AdvancedFilterState = {
  categorySlug: "",
  timeRange: "all",
  budgetType: "all",
  encryptedOnly: false,
};

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryDto[];
  isTr: boolean;
  basePath?: string;
  currentCategorySlug?: string;
  chipLast24h: boolean;
  setChipLast24h: (val: boolean | ((prev: boolean) => boolean)) => void;
  chipFixedBudget: boolean;
  setChipFixedBudget: (val: boolean | ((prev: boolean) => boolean)) => void;
  onFilterChangeCount?: (count: number) => void;
}

export function AdvancedFilterModal({
  isOpen,
  onClose,
  categories,
  isTr,
  currentCategorySlug = "",
  chipLast24h,
  setChipLast24h,
  chipFixedBudget,
  setChipFixedBudget,
  onFilterChangeCount,
}: AdvancedFilterModalProps) {
  const router = useRouter();

  const [filters, setFilters] = useState<AdvancedFilterState>(() => {
    return {
      categorySlug: currentCategorySlug,
      timeRange: chipLast24h ? "24h" : "all",
      budgetType: chipFixedBudget ? "fixed" : "all",
      encryptedOnly: false,
    };
  });

  // Search & sector filter inside category picker
  const [catSearch, setCatSearch] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("all");

  // Load saved filters from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AdvancedFilterState;
        setFilters(parsed);
        if (parsed.timeRange === "24h") setChipLast24h(true);
        if (parsed.budgetType === "fixed" || parsed.budgetType === "high") {
          setChipFixedBudget(true);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [setChipLast24h, setChipFixedBudget]);

  // Sync when currentCategorySlug changes from URL
  useEffect(() => {
    if (currentCategorySlug) {
      setFilters((prev) => ({ ...prev, categorySlug: currentCategorySlug }));
    }
  }, [currentCategorySlug]);

  // Calculate active filter count
  const activeCount =
    (filters.categorySlug ? 1 : 0) +
    (filters.timeRange !== "all" ? 1 : 0) +
    (filters.budgetType !== "all" ? 1 : 0) +
    (filters.encryptedOnly ? 1 : 0);

  useEffect(() => {
    onFilterChangeCount?.(activeCount);
  }, [activeCount, onFilterChangeCount]);

  // Selected Category Object
  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.slug === filters.categorySlug);
  }, [categories, filters.categorySlug]);

  // Sector list derived from categories
  const sectorList = useMemo(() => {
    const map = new Map<string, number>();
    categories.forEach((c) => {
      if (c.sectorKey) {
        map.set(c.sectorKey, (map.get(c.sectorKey) || 0) + 1);
      }
    });

    const items = [
      { id: "all", labelTr: "Tümü", labelEn: "All" },
      { id: "sector-software-it", labelTr: "Yazılım & Bilişim", labelEn: "Software & IT" },
      { id: "sector-ai-data", labelTr: "Yapay Zeka & Veri", labelEn: "AI & Data" },
      { id: "sector-design-creative", labelTr: "Tasarım", labelEn: "Design" },
      { id: "sector-marketing-growth", labelTr: "Pazarlama", labelEn: "Marketing" },
      { id: "sector-business-finance", labelTr: "İş & Finans", labelEn: "Business & Finance" },
    ];

    return items;
  }, [categories]);

  // Filtered categories for combobox
  const filteredCategories = useMemo(() => {
    let list = categories;
    if (selectedSector !== "all") {
      list = list.filter((c) => c.sectorKey === selectedSector);
    }
    if (catSearch.trim()) {
      const q = catSearch.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.key.toLowerCase().includes(q)
      );
    }
    return list;
  }, [categories, selectedSector, catSearch]);

  if (!isOpen) return null;

  const handleApply = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // Ignore storage error
    }

    // Apply time filter
    setChipLast24h(filters.timeRange === "24h");

    // Apply budget filter
    setChipFixedBudget(filters.budgetType === "fixed" || filters.budgetType === "high");

    // Navigate to URL with category param if changed
    const url = new URL(window.location.href);
    if (filters.categorySlug) {
      url.searchParams.set("category", filters.categorySlug);
    } else {
      url.searchParams.delete("category");
    }

    if (filters.timeRange === "24h") {
      url.searchParams.set("last24Hours", "true");
    } else {
      url.searchParams.delete("last24Hours");
    }

    if (filters.budgetType === "fixed" || filters.budgetType === "high") {
      url.searchParams.set("budgetSpecific", "true");
      url.searchParams.delete("budgetMode");
    } else if (filters.budgetType === "open") {
      url.searchParams.set("budgetMode", "OPEN_OFFER");
      url.searchParams.delete("budgetSpecific");
    } else {
      url.searchParams.delete("budgetSpecific");
      url.searchParams.delete("budgetMode");
    }

    router.push(url.pathname + url.search);
    onClose();
  };

  const handleResetAll = () => {
    setFilters(DEFAULT_FILTERS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setChipLast24h(false);
    setChipFixedBudget(false);
    setCatSearch("");
    setSelectedSector("all");

    const url = new URL(window.location.href);
    url.searchParams.delete("category");
    url.searchParams.delete("last24Hours");
    url.searchParams.delete("budgetSpecific");
    url.searchParams.delete("budgetMode");
    router.push(url.pathname + url.search);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      {/* Non-blur backdrop as requested by user */}
      <div
        className="fixed inset-0 bg-black/80 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card - Solid crisp surface, no blur */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-2xl z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-6 py-4 bg-[var(--color-surface-base)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <SlidersHorizontal className="h-4.5 w-4.5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  {isTr ? "Gelişmiş İlan Filtreleme" : "Advanced Feed Filters"}
                </h3>
                {activeCount > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/30 font-mono">
                    {activeCount} {isTr ? "Aktif" : "Active"}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "Akışı uzmanlık alanı, süre ve bütçeye göre özelleştirin"
                  : "Filter listings by domain, timeline, and budget parameters"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            aria-label={isTr ? "Kapat" : "Close"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-6 flex-1 scrollbar-thin">
          {/* 1. Kategori / Uzmanlık Alanı Seçimi (Searchable + Sector Pills) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
                <Layers className="h-3.5 w-3.5 text-blue-400" />
                <span>{isTr ? "Uzmanlık Kategorisi" : "Specialization Category"}</span>
              </label>

              {filters.categorySlug && (
                <button
                  type="button"
                  onClick={() => setFilters((p) => ({ ...p, categorySlug: "" }))}
                  className="text-[11px] text-red-400 hover:text-red-300 font-medium cursor-pointer transition-colors"
                >
                  {isTr ? "Seçimi Kaldır" : "Clear Selection"}
                </button>
              )}
            </div>

            {/* If a category is selected: show elegant selected card */}
            {selectedCategory ? (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 shrink-0">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--color-text-primary)]">
                      {selectedCategory.name}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-tertiary)] font-mono flex items-center gap-1.5 mt-0.5">
                      <span className="uppercase">{selectedCategory.key}</span>
                      {typeof selectedCategory.listingCount === "number" && (
                        <span>• {selectedCategory.listingCount} {isTr ? "Aktif İlan" : "Active Listings"}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilters((p) => ({ ...p, categorySlug: "" }))}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white transition-colors cursor-pointer"
                  >
                    {isTr ? "Değiştir" : "Change"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilters((p) => ({ ...p, categorySlug: "" }))}
                    className="h-7 w-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-red-400 transition-colors cursor-pointer"
                    aria-label={isTr ? "Kategoriyi kaldır" : "Remove category"}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Search input for categories */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                  <input
                    type="text"
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    placeholder={
                      isTr
                        ? "110 kategori içinde ara... (Örn: React, Mobil, AI, DevOps)"
                        : "Search within 110 categories..."
                    }
                    className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                  {catSearch && (
                    <button
                      type="button"
                      onClick={() => setCatSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-white cursor-pointer"
                      aria-label={isTr ? "Aramayı Temizle" : "Clear search"}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Horizontal Sector Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  {sectorList.map((sec) => {
                    const isSecSelected = selectedSector === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setSelectedSector(sec.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                          isSecSelected
                            ? "bg-blue-600 text-white font-semibold shadow-xs"
                            : "bg-[var(--color-surface-hover)]/70 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                        }`}
                      >
                        {isTr ? sec.labelTr : sec.labelEn}
                      </button>
                    );
                  })}
                </div>

                {/* Filtered Category Pills */}
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-2xl bg-[var(--color-surface-hover)]/30 border border-[var(--color-border-subtle)]/60 scrollbar-thin">
                  {filteredCategories.length === 0 ? (
                    <div className="w-full py-4 text-center text-xs text-[var(--color-text-tertiary)]">
                      {isTr ? "Eşleşen kategori bulunamadı." : "No matching categories."}
                    </div>
                  ) : (
                    filteredCategories.slice(0, 32).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFilters((p) => ({ ...p, categorySlug: cat.slug }))}
                        className="px-2.5 py-1 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-blue-500/50 hover:bg-blue-500/10 text-xs text-[var(--color-text-secondary)] hover:text-blue-400 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{cat.name}</span>
                        {typeof cat.listingCount === "number" && cat.listingCount > 0 && (
                          <span className="text-[10px] font-mono text-blue-400/80">({cat.listingCount})</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Yayınlanma / Tazelik Zaman Aralığı (Operis Unified Blue Palette) */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span>{isTr ? "İlan Tazeliği (Zaman Dilimi)" : "Listing Freshness"}</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "all", labelTr: "Tümü", labelEn: "All", icon: Globe },
                { id: "24h", labelTr: "Son 24 Saat", labelEn: "Last 24h", icon: Flame },
                { id: "3d", labelTr: "Son 3 Gün", labelEn: "Last 3 Days", icon: Clock },
                { id: "7d", labelTr: "7 Gün (Aktif)", labelEn: "7 Days (Active)", icon: Calendar },
              ].map((opt) => {
                const isSelected = filters.timeRange === opt.id;
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        timeRange: opt.id as AdvancedFilterState["timeRange"],
                      }))
                    }
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20"
                        : "bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-blue-500/30"
                    }`}
                  >
                    <IconComponent className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-[var(--color-text-tertiary)]"}`} />
                    <span>{isTr ? opt.labelTr : opt.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Bütçe Kriteri (Operis Design Standards) */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
              <Briefcase className="h-3.5 w-3.5 text-blue-400" />
              <span>{isTr ? "Bütçe Kriteri" : "Budget Preference"}</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "all", labelTr: "Fark Etmez", labelEn: "Any Budget" },
                { id: "fixed", labelTr: "Bütçesi Belirli", labelEn: "Fixed Budget" },
                { id: "high", labelTr: "Yüksek (50.000 ₺+)", labelEn: "High (50k ₺+)" },
              ].map((opt) => {
                const isSelected = filters.budgetType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        budgetType: opt.id as AdvancedFilterState["budgetType"],
                      }))
                    }
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                      isSelected
                        ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20"
                        : "bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-blue-500/30"
                    }`}
                  >
                    {isTr ? opt.labelTr : opt.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Şifreli / Kör Teklif Güvencesi (Security Card with Modern Switch) */}
          <div className="pt-2 border-t border-[var(--color-border-subtle)]/70">
            <div
              onClick={() =>
                setFilters((prev) => ({ ...prev, encryptedOnly: !prev.encryptedOnly }))
              }
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer gap-4 ${
                filters.encryptedOnly
                  ? "bg-blue-500/10 border-blue-500/50 text-[var(--color-text-primary)] shadow-md shadow-blue-500/10 ring-1 ring-blue-500/30"
                  : "bg-[var(--color-surface-hover)]/70 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-blue-500/30"
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl shrink-0 transition-colors ${
                    filters.encryptedOnly
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] border border-[var(--color-border-subtle)]"
                  }`}
                >
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">
                      {isTr ? "Kör Teklif Güvenceli İlanlar" : "Encrypted Blind Bid Listings"}
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                      {isTr ? "Gizlilik" : "Privacy"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 leading-relaxed truncate sm:whitespace-normal">
                    {isTr
                      ? "Yalnızca rakiplerin fiyat görmediği güvenli ilanlar"
                      : "Strictly listings where bids are protected from undercutting"}
                  </p>
                </div>
              </div>

              {/* Modern Accessible Toggle Switch */}
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  filters.encryptedOnly ? "bg-blue-600" : "bg-zinc-700/60"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    filters.encryptedOnly ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with 1-Click Reset & Apply */}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] px-6 py-4 bg-[var(--color-surface-base)]">
          <button
            type="button"
            onClick={handleResetAll}
            disabled={activeCount === 0}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeCount > 0
                ? "text-[var(--color-text-tertiary)] hover:text-red-400 hover:bg-red-500/10"
                : "opacity-40 cursor-not-allowed text-[var(--color-text-tertiary)]"
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{isTr ? "Tümünü Sıfırla" : "Reset All"}</span>
            {activeCount > 0 && <span className="font-mono">({activeCount})</span>}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            >
              {isTr ? "Vazgeç" : "Cancel"}
            </button>
            <Button
              variant="shimmer"
              size="sm"
              onClick={handleApply}
              className="gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>
                {isTr ? "Filtreleri Uygula" : "Apply Filters"}
                {activeCount > 0 ? ` (${activeCount})` : ""}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
