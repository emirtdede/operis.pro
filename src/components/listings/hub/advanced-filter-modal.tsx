"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  RotateCcw,
  SlidersHorizontal,
  Check,
  Clock,
  Briefcase,
  Layers,
  Lock,
} from "lucide-react";
import type { CategoryDto } from "@/src/modules/categories/service";

export interface AdvancedFilterState {
  categorySlug: string;
  timeRange: "all" | "24h" | "3d" | "7d";
  budgetType: "all" | "fixed" | "high";
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

  // Load saved filters from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AdvancedFilterState;
        setFilters(parsed);
        if (parsed.timeRange === "24h") setChipLast24h(true);
        if (parsed.budgetType === "fixed") setChipFixedBudget(true);
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
    setChipFixedBudget(filters.budgetType === "fixed");

    // Navigate to URL with category param if changed
    const url = new URL(window.location.href);
    if (filters.categorySlug) {
      url.searchParams.set("category", filters.categorySlug);
    } else {
      url.searchParams.delete("category");
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

    const url = new URL(window.location.href);
    url.searchParams.delete("category");
    url.searchParams.delete("last24Hours");
    url.searchParams.delete("budgetSpecific");
    router.push(url.pathname + url.search);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/95 backdrop-blur-2xl shadow-2xl z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                {isTr ? "Gelişmiş İlan Filtreleme" : "Advanced Feed Filters"}
              </h3>
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
          {/* 1. Kategori / Uzmanlık Alanı Seçimi */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                <span>{isTr ? "Uzmanlık Kategorisi" : "Specialization Category"}</span>
              </label>
              {filters.categorySlug && (
                <button
                  type="button"
                  onClick={() => setFilters((p) => ({ ...p, categorySlug: "" }))}
                  className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                >
                  {isTr ? "Tüm Kategoriler" : "All Categories"}
                </button>
              )}
            </div>

            <select
              value={filters.categorySlug}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, categorySlug: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="">{isTr ? "Tüm Kategoriler (110 Uzmanlık)" : "All Categories (110 Niches)"}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name} ({cat.listingCount || 0})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Yayınlanma / Tazelik Zaman Aralığı */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>{isTr ? "İlan Tazeliği (Zaman Dilimi)" : "Listing Freshness"}</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "all", labelTr: "Tümü", labelEn: "All" },
                { id: "24h", labelTr: "Son 24 Saat", labelEn: "Last 24h" },
                { id: "3d", labelTr: "Son 3 Gün", labelEn: "Last 3 Days" },
                { id: "7d", labelTr: "7 Gün (Aktif)", labelEn: "7 Days (Max)" },
              ].map((opt) => {
                const isSelected = filters.timeRange === opt.id;
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
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                      isSelected
                        ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-sm"
                        : "bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    {isTr ? opt.labelTr : opt.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Bütçe Durumu */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
              <Briefcase className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isTr ? "Bütçe Kriteri" : "Budget Preference"}</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "all", labelTr: "Fark Etmez", labelEn: "Any Budget" },
                { id: "fixed", labelTr: "Bütçesi Belirli", labelEn: "Fixed Budget" },
                { id: "high", labelTr: "Yüksek (50.000 ₺+)", labelEn: "High Budget ($1.5k+)" },
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
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm"
                        : "bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    {isTr ? opt.labelTr : opt.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Şifreli / Kör Teklif Güvencesi */}
          <div className="pt-2 border-t border-[var(--color-border-subtle)]/70">
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({ ...prev, encryptedOnly: !prev.encryptedOnly }))
              }
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                filters.encryptedOnly
                  ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-300"
                  : "bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
              }`}
            >
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--color-text-primary)]">
                    {isTr ? "Kör Teklif Güvenceli İlanlar" : "Encrypted Blind Bid Listings"}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-tertiary)]">
                    {isTr
                      ? "Yalnızca rakiplerin fiyat görmediği güvenli ilanlar"
                      : "Strictly listings where bids are protected from undercutting"}
                  </div>
                </div>
              </div>
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                  filters.encryptedOnly
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "border-[var(--color-border-subtle)]"
                }`}
              >
                {filters.encryptedOnly && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
            </button>
          </div>
        </div>

        {/* Modal Footer with 1-Click Reset & Apply */}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] px-6 py-4 bg-[var(--color-surface-hover)]/40">
          <button
            type="button"
            onClick={handleResetAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{isTr ? "Tümünü Sıfırla" : "Reset All"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            >
              {isTr ? "Vazgeç" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Check className="h-3.5 w-3.5" />
              <span>
                {isTr ? "Filtreleri Uygula" : "Apply Filters"}
                {activeCount > 0 ? ` (${activeCount})` : ""}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
