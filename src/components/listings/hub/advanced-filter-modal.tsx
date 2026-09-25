"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  RotateCcw,
  SlidersHorizontal,
  Check,
  Clock,
  Layers,
  ShieldCheck,
  Search,
  Flame,
  Globe,
  Calendar,
  Building2,
  Sparkles,
  Tag,
  Banknote,
  Hourglass,
  Plus,
} from "lucide-react";
import type { CategoryDto } from "@/src/modules/categories/service";
import { Button } from "@/src/components/ui/button";

export interface AdvancedFilterState {
  categorySlugs: string[];
  timeRange: "all" | "24h" | "3d" | "7d";
  budgetType: "all" | "fixed" | "hourly" | "open";
  minBudget: string;
  maxBudget: string;
  currency: "all" | "TRY" | "USD" | "EUR";
  timelineScope: "all" | "short" | "medium" | "long" | "flexible";
  companyVerifiedOnly: boolean;
  encryptedOnly: boolean;
  selectedTags: string[];
}

const STORAGE_KEY = "operis_feed_filters_v2";

const DEFAULT_FILTERS: AdvancedFilterState = {
  categorySlugs: [],
  timeRange: "all",
  budgetType: "all",
  minBudget: "",
  maxBudget: "",
  currency: "all",
  timelineScope: "all",
  companyVerifiedOnly: false,
  encryptedOnly: false,
  selectedTags: [],
};

const POPULAR_TECH_TAGS = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "Python",
  "Tailwind CSS",
  "PostgreSQL",
  "Docker",
  "AWS",
  "Figma",
  "Mobile App",
  "AI / ML",
  "DevOps",
  "UI/UX",
];

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryDto[];
  isTr: boolean;
  basePath?: string;
  currentCategorySlug?: string;
  selectedCategorySlugs?: string[];
  followedCategoryIds?: Set<string>;
  isAuthenticated?: boolean;
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
  selectedCategorySlugs = [],
  followedCategoryIds = new Set(),
  isAuthenticated = false,
  chipLast24h,
  setChipLast24h,
  chipFixedBudget,
  setChipFixedBudget,
  onFilterChangeCount,
}: AdvancedFilterModalProps) {
  const router = useRouter();

  // Search & sector filter inside category picker
  const [catSearch, setCatSearch] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("all");

  // Initialize filter state from URL or fallback to props
  const [filters, setFilters] = useState<AdvancedFilterState>(() => {
    return {
      categorySlugs: selectedCategorySlugs.length > 0
        ? selectedCategorySlugs
        : currentCategorySlug
        ? [currentCategorySlug]
        : [],
      timeRange: chipLast24h ? "24h" : "all",
      budgetType: chipFixedBudget ? "fixed" : "all",
      minBudget: "",
      maxBudget: "",
      currency: "all",
      timelineScope: "all",
      companyVerifiedOnly: false,
      encryptedOnly: false,
      selectedTags: [],
    };
  });

  // Sync state from URL and localStorage on mount / when opened
  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const urlCat = sp.get("category");
      const urlTime = sp.get("timeRange") as AdvancedFilterState["timeRange"] | null;
      const urlLast24 = sp.get("last24Hours") === "true";
      const urlBudgetType = sp.get("budgetType") as AdvancedFilterState["budgetType"] | null;
      const urlBudgetSpecific = sp.get("budgetSpecific") === "true";
      const urlMin = sp.get("minBudget") || "";
      const urlMax = sp.get("maxBudget") || "";
      const urlCurr = (sp.get("currency") as AdvancedFilterState["currency"]) || "all";
      const urlTimeline = (sp.get("timelineScope") as AdvancedFilterState["timelineScope"]) || "all";
      const urlCompany = sp.get("companyVerified") === "true";
      const urlEncrypted = sp.get("encryptedOnly") === "true";
      const urlTags = sp.get("tags") ? sp.get("tags")!.split(",").filter(Boolean) : [];

      const hasUrlParams =
        Boolean(urlCat) ||
        Boolean(urlTime) ||
        urlLast24 ||
        Boolean(urlBudgetType) ||
        urlBudgetSpecific ||
        Boolean(urlMin) ||
        Boolean(urlMax) ||
        urlCurr !== "all" ||
        urlTimeline !== "all" ||
        urlCompany ||
        urlEncrypted ||
        urlTags.length > 0;

      if (hasUrlParams) {
        setFilters({
          categorySlugs: urlCat ? urlCat.split(",").filter(Boolean) : [],
          timeRange: urlTime || (urlLast24 ? "24h" : "all"),
          budgetType: urlBudgetType || (urlBudgetSpecific ? "fixed" : "all"),
          minBudget: urlMin,
          maxBudget: urlMax,
          currency: urlCurr,
          timelineScope: urlTimeline,
          companyVerifiedOnly: urlCompany,
          encryptedOnly: urlEncrypted,
          selectedTags: urlTags,
        });
        return;
      }

      // Check localStorage for saved presets if URL is bare
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as AdvancedFilterState;
          setFilters(parsed);
        }
      } catch {
        // Ignore storage errors
      }
    }
  }, [isOpen]);

  // Calculate active filter count
  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.categorySlugs.length > 0) count += filters.categorySlugs.length;
    if (filters.timeRange !== "all") count += 1;
    if (filters.budgetType !== "all") count += 1;
    if (filters.minBudget.trim() || filters.maxBudget.trim()) count += 1;
    if (filters.currency !== "all") count += 1;
    if (filters.timelineScope !== "all") count += 1;
    if (filters.companyVerifiedOnly) count += 1;
    if (filters.encryptedOnly) count += 1;
    if (filters.selectedTags.length > 0) count += filters.selectedTags.length;
    return count;
  }, [filters]);

  useEffect(() => {
    onFilterChangeCount?.(activeCount);
  }, [activeCount, onFilterChangeCount]);

  // Derived sector list for category grouping
  const sectorList = useMemo(() => {
    return [
      { id: "all", labelTr: "Tümü", labelEn: "All" },
      { id: "sector-software-it", labelTr: "Yazılım & Bilişim", labelEn: "Software & IT" },
      { id: "sector-ai-data", labelTr: "Yapay Zeka & Veri", labelEn: "AI & Data" },
      { id: "sector-design-creative", labelTr: "Tasarım", labelEn: "Design" },
      { id: "sector-marketing-growth", labelTr: "Pazarlama", labelEn: "Marketing" },
      { id: "sector-business-finance", labelTr: "İş & Finans", labelEn: "Business & Finance" },
    ];
  }, []);

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

  // Selected Category objects
  const selectedCategoriesList = useMemo(() => {
    return filters.categorySlugs
      .map((slug) => categories.find((c) => c.slug === slug || c.key === slug))
      .filter((c): c is CategoryDto => Boolean(c));
  }, [categories, filters.categorySlugs]);

  // Toggle category in multi-select
  const handleToggleCategory = (slug: string) => {
    setFilters((prev) => {
      const exists = prev.categorySlugs.includes(slug);
      return {
        ...prev,
        categorySlugs: exists
          ? prev.categorySlugs.filter((s) => s !== slug)
          : [...prev.categorySlugs, slug],
      };
    });
  };

  // Toggle tech tag
  const handleToggleTag = (tag: string) => {
    setFilters((prev) => {
      const exists = prev.selectedTags.includes(tag);
      return {
        ...prev,
        selectedTags: exists
          ? prev.selectedTags.filter((t) => t !== tag)
          : [...prev.selectedTags, tag],
      };
    });
  };

  // 1-Click Personalization: Add Followed Categories
  const handleAddFollowedCategories = () => {
    if (!followedCategoryIds || followedCategoryIds.size === 0) return;
    const followedSlugs = categories
      .filter((c) => followedCategoryIds.has(c.id))
      .map((c) => c.slug);

    setFilters((prev) => {
      const merged = Array.from(new Set([...prev.categorySlugs, ...followedSlugs]));
      return { ...prev, categorySlugs: merged };
    });
  };

  // Quick Preset Actions
  const handleApplyPreset = (preset: "today" | "high_budget" | "verified" | "quick_delivery") => {
    if (preset === "today") {
      setFilters((prev) => ({ ...prev, timeRange: "24h" }));
    } else if (preset === "high_budget") {
      setFilters((prev) => ({
        ...prev,
        budgetType: "fixed",
        minBudget: "50000",
        currency: "TRY",
      }));
    } else if (preset === "verified") {
      setFilters((prev) => ({ ...prev, companyVerifiedOnly: true }));
    } else if (preset === "quick_delivery") {
      setFilters((prev) => ({ ...prev, timelineScope: "short" }));
    }
  };

  if (!isOpen) return null;

  const handleApply = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // Ignore storage error
    }

    // Sync header chip states
    setChipLast24h(filters.timeRange === "24h");
    setChipFixedBudget(filters.budgetType === "fixed");

    // Construct target URL with all active parameters
    const url = new URL(window.location.href);

    // 1. Categories
    if (filters.categorySlugs.length > 0) {
      url.searchParams.set("category", filters.categorySlugs.join(","));
    } else {
      url.searchParams.delete("category");
    }

    // 2. Time range
    if (filters.timeRange !== "all") {
      url.searchParams.set("timeRange", filters.timeRange);
      if (filters.timeRange === "24h") {
        url.searchParams.set("last24Hours", "true");
      } else {
        url.searchParams.delete("last24Hours");
      }
    } else {
      url.searchParams.delete("timeRange");
      url.searchParams.delete("last24Hours");
    }

    // 3. Budget Type
    if (filters.budgetType !== "all") {
      url.searchParams.set("budgetType", filters.budgetType);
      if (filters.budgetType === "fixed") {
        url.searchParams.set("budgetSpecific", "true");
      } else {
        url.searchParams.delete("budgetSpecific");
      }
    } else {
      url.searchParams.delete("budgetType");
      url.searchParams.delete("budgetSpecific");
    }

    // 4. Min & Max Budget
    if (filters.minBudget.trim()) {
      url.searchParams.set("minBudget", filters.minBudget.trim());
    } else {
      url.searchParams.delete("minBudget");
    }
    if (filters.maxBudget.trim()) {
      url.searchParams.set("maxBudget", filters.maxBudget.trim());
    } else {
      url.searchParams.delete("maxBudget");
    }

    // 5. Currency
    if (filters.currency !== "all") {
      url.searchParams.set("currency", filters.currency);
    } else {
      url.searchParams.delete("currency");
    }

    // 6. Timeline Scope
    if (filters.timelineScope !== "all") {
      url.searchParams.set("timelineScope", filters.timelineScope);
    } else {
      url.searchParams.delete("timelineScope");
    }

    // 7. Company Verified Only
    if (filters.companyVerifiedOnly) {
      url.searchParams.set("companyVerified", "true");
    } else {
      url.searchParams.delete("companyVerified");
    }

    // 8. Encrypted Only
    if (filters.encryptedOnly) {
      url.searchParams.set("encryptedOnly", "true");
    } else {
      url.searchParams.delete("encryptedOnly");
    }

    // 9. Tech Tags
    if (filters.selectedTags.length > 0) {
      url.searchParams.set("tags", filters.selectedTags.join(","));
    } else {
      url.searchParams.delete("tags");
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
    url.searchParams.delete("timeRange");
    url.searchParams.delete("last24Hours");
    url.searchParams.delete("budgetType");
    url.searchParams.delete("budgetSpecific");
    url.searchParams.delete("minBudget");
    url.searchParams.delete("maxBudget");
    url.searchParams.delete("currency");
    url.searchParams.delete("timelineScope");
    url.searchParams.delete("companyVerified");
    url.searchParams.delete("encryptedOnly");
    url.searchParams.delete("tags");

    router.push(url.pathname + url.search);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      {/* Clean backdrop */}
      <div
        className="fixed inset-0 bg-black/80 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-2xl z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="border-b border-[var(--color-border-subtle)] px-6 py-4 bg-[var(--color-surface-base)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    {isTr ? "Gelişmiş İlan Filtreleme" : "Advanced Feed Filters"}
                  </h3>
                  {activeCount > 0 && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-bold border border-blue-500/30 font-mono">
                      {activeCount} {isTr ? "Aktif Kriter" : "Active"}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                  {isTr
                    ? "Akışı uzmanlık alanı, bütçe aralığı, teslim süresi ve güvenceye göre kişiselleştirin"
                    : "Filter listings by domain, custom budget range, timeline, and trust verification"}
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

          {/* Quick Presets & Personalization Bar */}
          <div className="mt-3.5 pt-3 border-t border-[var(--color-border-subtle)]/60 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] flex items-center gap-1 shrink-0 mr-1">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>{isTr ? "Hızlı Şablonlar:" : "Presets:"}</span>
            </span>

            {isAuthenticated && followedCategoryIds.size > 0 && (
              <button
                type="button"
                onClick={handleAddFollowedCategories}
                className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all shrink-0 cursor-pointer flex items-center gap-1"
                title={isTr ? "Takip ettiğiniz uzmanlık alanlarını ekleyin" : "Add followed categories"}
              >
                <Plus className="h-3 w-3" />
                <span>{isTr ? "Takip Ettiğim Alanlar" : "My Followed Areas"}</span>
                <span className="font-mono text-[10px]">({followedCategoryIds.size})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleApplyPreset("today")}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                filters.timeRange === "24h"
                  ? "bg-blue-600 text-white border-blue-500 font-semibold"
                  : "bg-[var(--color-surface-hover)]/70 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-blue-400"
              }`}
            >
              <Flame className="h-3 w-3 text-amber-400" />
              <span>{isTr ? "Bugün Açılanlar" : "Posted Today"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset("high_budget")}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                filters.minBudget === "50000"
                  ? "bg-blue-600 text-white border-blue-500 font-semibold"
                  : "bg-[var(--color-surface-hover)]/70 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-blue-400"
              }`}
            >
              <Banknote className="h-3 w-3 text-emerald-400" />
              <span>{isTr ? "Yüksek Bütçeli (50k ₺+)" : "High Budget (50k+)"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset("verified")}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                filters.companyVerifiedOnly
                  ? "bg-blue-600 text-white border-blue-500 font-semibold"
                  : "bg-[var(--color-surface-hover)]/70 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-blue-400"
              }`}
            >
              <Building2 className="h-3 w-3 text-blue-400" />
              <span>{isTr ? "Kurumsal Onaylı" : "Verified Enterprise"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset("quick_delivery")}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                filters.timelineScope === "short"
                  ? "bg-blue-600 text-white border-blue-500 font-semibold"
                  : "bg-[var(--color-surface-hover)]/70 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-blue-400"
              }`}
            >
              <Clock className="h-3 w-3 text-indigo-400" />
              <span>{isTr ? "Hızlı Teslim (<2 Hafta)" : "Fast Track (<2w)"}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-6 flex-1 scrollbar-thin">
          {/* SECTION 1: Uzmanlık Kategorileri & Çoklu Seçim */}
          <div className="space-y-3 p-4 rounded-2xl bg-[var(--color-surface-hover)]/35 border border-[var(--color-border-subtle)]">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
                <Layers className="h-4 w-4 text-blue-400" />
                <span>{isTr ? "Uzmanlık Kategorileri (Çoklu Seçim)" : "Specialization Categories (Multi-Select)"}</span>
                {filters.categorySlugs.length > 0 && (
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                    {filters.categorySlugs.length} {isTr ? "Seçili" : "Selected"}
                  </span>
                )}
              </label>

              {filters.categorySlugs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFilters((p) => ({ ...p, categorySlugs: [] }))}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-medium cursor-pointer transition-colors"
                >
                  {isTr ? "Kategorileri Temizle" : "Clear All"}
                </button>
              )}
            </div>

            {/* Selected Categories Badges */}
            {selectedCategoriesList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                {selectedCategoriesList.map((cat) => (
                  <span
                    key={cat.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white shadow-xs"
                  >
                    <span>{cat.name}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(cat.slug)}
                      className="hover:text-rose-200 transition-colors cursor-pointer"
                      aria-label={`${isTr ? "Kaldır" : "Remove"}: ${cat.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search Input for categories */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                placeholder={
                  isTr
                    ? "Kategori ara... (Örn: React, Mobil, Fullstack, AI, DevOps)"
                    : "Search categories... (e.g. React, Mobile, AI, DevOps)"
                }
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-blue-500/50 transition-colors"
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
                        : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]"
                    }`}
                  >
                    {isTr ? sec.labelTr : sec.labelEn}
                  </button>
                );
              })}
            </div>

            {/* Filtered Category Chips (Multi-Selectable) */}
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] scrollbar-thin">
              {filteredCategories.length === 0 ? (
                <div className="w-full py-4 text-center text-xs text-[var(--color-text-tertiary)]">
                  {isTr ? "Eşleşen kategori bulunamadı." : "No matching categories."}
                </div>
              ) : (
                filteredCategories.slice(0, 40).map((cat) => {
                  const isSelected = filters.categorySlugs.includes(cat.slug);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleToggleCategory(cat.slug)}
                      className={`px-2.5 py-1 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-blue-600 border border-blue-500 text-white font-semibold shadow-xs"
                          : "border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/50 text-[var(--color-text-secondary)] hover:border-blue-500/50 hover:text-blue-400"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      <span>{cat.name}</span>
                      {typeof cat.listingCount === "number" && cat.listingCount > 0 && (
                        <span
                          className={`text-[10px] font-mono ${
                            isSelected ? "text-blue-100" : "text-blue-400/80"
                          }`}
                        >
                          ({cat.listingCount})
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Tech Stack / Tags Multi-Select */}
            <div className="pt-2 border-t border-[var(--color-border-subtle)]/70">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
                <Tag className="h-3.5 w-3.5 text-amber-400" />
                <span>{isTr ? "Popüler Teknolojiler & Beceriler:" : "Popular Tech & Skills:"}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_TECH_TAGS.map((tag) => {
                  const isTagSelected = filters.selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                        isTagSelected
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold"
                          : "bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                      }`}
                    >
                      <span>#{tag}</span>
                      {isTagSelected && <Check className="h-2.5 w-2.5 text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: Bütçe & Para Birimi & Sayısal Aralık */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-[var(--color-surface-hover)]/35 border border-[var(--color-border-subtle)]">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
                <Banknote className="h-4 w-4 text-emerald-400" />
                <span>{isTr ? "Bütçe ve Sözleşme Tipi" : "Budget & Contract Type"}</span>
              </label>

              {(filters.budgetType !== "all" || filters.minBudget || filters.maxBudget || filters.currency !== "all") && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters((p) => ({
                      ...p,
                      budgetType: "all",
                      minBudget: "",
                      maxBudget: "",
                      currency: "all",
                    }))
                  }
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-medium cursor-pointer transition-colors"
                >
                  {isTr ? "Bütçeyi Sıfırla" : "Reset Budget"}
                </button>
              )}
            </div>

            {/* Budget Mode Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "all", labelTr: "Fark Etmez", labelEn: "Any Budget" },
                { id: "fixed", labelTr: "Sabit Bütçe", labelEn: "Fixed Budget" },
                { id: "hourly", labelTr: "Saatlik Ücret", labelEn: "Hourly Rate" },
                { id: "open", labelTr: "Teklife Açık", labelEn: "Open Offer" },
              ].map((opt) => {
                const isSelected = filters.budgetType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setFilters((p) => ({
                        ...p,
                        budgetType: opt.id as AdvancedFilterState["budgetType"],
                      }))
                    }
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                      isSelected
                        ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20"
                        : "bg-[var(--color-surface-base)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-blue-500/30"
                    }`}
                  >
                    {isTr ? opt.labelTr : opt.labelEn}
                  </button>
                );
              })}
            </div>

            {/* Currency Selector + Min/Max Budget Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-text-tertiary)] mb-1">
                  {isTr ? "Para Birimi" : "Currency"}
                </label>
                <select
                  value={filters.currency}
                  onChange={(e) =>
                    setFilters((p) => ({
                      ...p,
                      currency: e.target.value as AdvancedFilterState["currency"],
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] outline-none focus:border-blue-500/50 cursor-pointer"
                >
                  <option value="all">{isTr ? "Tüm Birimler" : "All Currencies"}</option>
                  <option value="TRY">TRY (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-text-tertiary)] mb-1">
                  {isTr ? "Min Bütçe" : "Min Budget"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={filters.minBudget}
                    onChange={(e) => setFilters((p) => ({ ...p, minBudget: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none focus:border-blue-500/50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-text-tertiary)] font-mono">
                    {filters.currency === "USD" ? "$" : filters.currency === "EUR" ? "€" : "₺"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-text-tertiary)] mb-1">
                  {isTr ? "Max Bütçe" : "Max Budget"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={filters.maxBudget}
                    onChange={(e) => setFilters((p) => ({ ...p, maxBudget: e.target.value }))}
                    placeholder="Sınırsız"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none focus:border-blue-500/50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-text-tertiary)] font-mono">
                    {filters.currency === "USD" ? "$" : filters.currency === "EUR" ? "€" : "₺"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Budget Thresholds */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-medium text-[var(--color-text-tertiary)] mr-1">
                {isTr ? "Hızlı Eşik:" : "Quick Filter:"}
              </span>
              {[
                { label: "10.000 ₺+", val: "10000" },
                { label: "25.000 ₺+", val: "25000" },
                { label: "50.000 ₺+", val: "50000" },
                { label: "100.000 ₺+", val: "100000" },
              ].map((b) => (
                <button
                  key={b.val}
                  type="button"
                  onClick={() =>
                    setFilters((p) => ({
                      ...p,
                      minBudget: b.val,
                      currency: "TRY",
                    }))
                  }
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-all cursor-pointer ${
                    filters.minBudget === b.val
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold"
                      : "bg-[var(--color-surface-base)] border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 3: İlan Tazeliği & Proje Teslim Süresi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 3A: İlan Tazeliği */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-[var(--color-surface-hover)]/35 border border-[var(--color-border-subtle)]">
              <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
                <Clock className="h-4 w-4 text-blue-400" />
                <span>{isTr ? "İlan Tazeliği" : "Posting Recency"}</span>
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "all", labelTr: "Tümü", labelEn: "All", icon: Globe },
                  { id: "24h", labelTr: "Son 24 Saat", labelEn: "Last 24h", icon: Flame },
                  { id: "3d", labelTr: "Son 3 Gün", labelEn: "Last 3 Days", icon: Clock },
                  { id: "7d", labelTr: "7 Gün (Aktif)", labelEn: "7 Days (Active)", icon: Calendar },
                ].map((opt) => {
                  const isSelected = filters.timeRange === opt.id;
                  const IconComp = opt.icon;
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
                      className={`px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? "bg-blue-600 border-blue-500 text-white shadow-xs"
                          : "bg-[var(--color-surface-base)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-blue-500/30"
                      }`}
                    >
                      <IconComp className={`h-3 w-3 ${isSelected ? "text-white" : "text-[var(--color-text-tertiary)]"}`} />
                      <span>{isTr ? opt.labelTr : opt.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3B: Proje Süresi / Kapsam */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-[var(--color-surface-hover)]/35 border border-[var(--color-border-subtle)]">
              <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
                <Hourglass className="h-4 w-4 text-indigo-400" />
                <span>{isTr ? "Proje Teslim Süresi" : "Project Timeline"}</span>
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "all", labelTr: "Fark Etmez", labelEn: "Any Duration" },
                  { id: "short", labelTr: "Kısa (< 2 Hafta)", labelEn: "Short (< 2w)" },
                  { id: "medium", labelTr: "Orta (1-3 Ay)", labelEn: "Medium (1-3m)" },
                  { id: "long", labelTr: "Uzun (3+ Ay)", labelEn: "Long (3m+)" },
                ].map((opt) => {
                  const isSelected = filters.timelineScope === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          timelineScope: opt.id as AdvancedFilterState["timelineScope"],
                        }))
                      }
                      className={`px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer text-center ${
                        isSelected
                          ? "bg-blue-600 border-blue-500 text-white shadow-xs"
                          : "bg-[var(--color-surface-base)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-blue-500/30"
                      }`}
                    >
                      {isTr ? opt.labelTr : opt.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 4: Güvenlik, Onay & Gizlilik Toggle Switchleri */}
          <div className="space-y-3">
            {/* 4A: Kurumsal Onaylı İşverenler */}
            <div
              onClick={() =>
                setFilters((prev) => ({ ...prev, companyVerifiedOnly: !prev.companyVerifiedOnly }))
              }
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer gap-4 ${
                filters.companyVerifiedOnly
                  ? "bg-blue-500/10 border-blue-500/50 text-[var(--color-text-primary)] ring-1 ring-blue-500/30"
                  : "bg-[var(--color-surface-hover)]/50 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-blue-500/30"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 transition-colors ${
                    filters.companyVerifiedOnly
                      ? "bg-blue-600 text-white"
                      : "bg-[var(--color-surface-base)] text-[var(--color-text-tertiary)] border border-[var(--color-border-subtle)]"
                  }`}
                >
                  <Building2 className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">
                      {isTr ? "Yalnızca Kurumsal & Onaylı İşverenler" : "Verified Enterprise Employers Only"}
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                      {isTr ? "VKN Onaylı" : "Verified"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 leading-relaxed truncate sm:whitespace-normal">
                    {isTr
                      ? "Vergi levhası ve tüzel kişilik belgeleri Operis tarafından doğrulanmış şirketler"
                      : "Filter strictly for listings published by corporate-verified clients"}
                  </p>
                </div>
              </div>

              <div
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  filters.companyVerifiedOnly ? "bg-blue-600" : "bg-zinc-700/60"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    filters.companyVerifiedOnly ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </div>

            {/* 4B: Kör Teklif Güvenceli İlanlar */}
            <div
              onClick={() =>
                setFilters((prev) => ({ ...prev, encryptedOnly: !prev.encryptedOnly }))
              }
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer gap-4 ${
                filters.encryptedOnly
                  ? "bg-blue-500/10 border-blue-500/50 text-[var(--color-text-primary)] ring-1 ring-blue-500/30"
                  : "bg-[var(--color-surface-hover)]/50 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-blue-500/30"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 transition-colors ${
                    filters.encryptedOnly
                      ? "bg-blue-600 text-white"
                      : "bg-[var(--color-surface-base)] text-[var(--color-text-tertiary)] border border-[var(--color-border-subtle)]"
                  }`}
                >
                  <ShieldCheck className="h-4.5 w-4.5" />
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
                      ? "Yalnızca teklif fiyatlarının rakiplerden gizlendiği güvenli ilanlar"
                      : "Strictly listings where bids are protected from undercutting"}
                  </p>
                </div>
              </div>

              <div
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  filters.encryptedOnly ? "bg-blue-600" : "bg-zinc-700/60"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
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
                ? "text-[var(--color-text-tertiary)] hover:text-rose-400 hover:bg-rose-500/10"
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
