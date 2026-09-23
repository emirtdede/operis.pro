import { useState, useMemo, useEffect } from "react";
import { FolderTree, Sparkles, Layers, ShieldCheck } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { TextInput } from "@/src/components/ui/text-input";
import { TextArea } from "@/src/components/ui/text-area";
import { SearchableSelect } from "@/src/components/ui/searchable-select";
import { SEED_SECTORS, SEED_CATEGORIES } from "@/db/seeds/categories";
import type { CategoryItem } from "../types";

export interface StepBasicInfoProps {
  isTr: boolean;
  categoryId: string;
  setCategoryId: (id: string) => void;
  categories: CategoryItem[];
  selectedCategory?: CategoryItem;
  title: string;
  setTitle: (title: string) => void;
  summary: string;
  setSummary: (summary: string) => void;
  detectedArchetype: {
    profile: {
      labelTr: string;
      labelEn?: string;
    };
  } | null;
  setIsScopeInterviewOpen: (isOpen: boolean) => void;
  setIsPrdArchitectOpen: (isOpen: boolean) => void;
}

function getCategorySectorKey(cat?: CategoryItem): string {
  if (!cat) return "";
  if (cat.sectorKey) return cat.sectorKey;
  const match = SEED_CATEGORIES.find(
    (sc) => sc.key === cat.key || sc.key === cat.slug
  );
  return match?.sectorKey || "";
}

export function StepBasicInfo({
  isTr,
  categoryId,
  setCategoryId,
  categories,
  selectedCategory,
  title,
  setTitle,
  summary,
  setSummary,
  detectedArchetype,
  setIsScopeInterviewOpen,
  setIsPrdArchitectOpen,
}: StepBasicInfoProps) {
  const isTitleLengthInvalid = title.length < 20 || title.length > 120;
  const isSummaryLengthInvalid = summary.length < 80 || summary.length > 280;

  // Initialize selectedSectorKey from current category or first sector
  const initialSectorKey = useMemo(() => {
    return (
      getCategorySectorKey(selectedCategory) ||
      (SEED_SECTORS[0]?.key ?? "sector-software-it")
    );
  }, [selectedCategory]);

  const [selectedSectorKey, setSelectedSectorKey] = useState<string>(initialSectorKey);

  // Synchronize when selectedCategory changes externally (e.g. draft restore or clone)
  useEffect(() => {
    if (selectedCategory) {
      const derived = getCategorySectorKey(selectedCategory);
      if (derived && derived !== selectedSectorKey) {
        setSelectedSectorKey(derived);
      }
    }
  }, [selectedCategory, selectedSectorKey]);

  // Sector Options for the first searchable selector
  const sectorOptions = useMemo(() => {
    return SEED_SECTORS.map((s) => {
      const name = isTr ? s.translations.tr.name : s.translations.en.name;
      const desc = isTr ? s.translations.tr.description : s.translations.en.description;
      const matchingCats = categories.filter((c) => {
        const catSector = getCategorySectorKey(c);
        return catSector === s.key;
      });
      return {
        value: s.key,
        label: name,
        sublabel: desc,
        badge:
          matchingCats.length > 0
            ? `${matchingCats.length} ${isTr ? "Kategori" : "Categories"}`
            : undefined,
      };
    });
  }, [isTr, categories]);

  // Filter categories by the currently selected sector
  const availableCategories = useMemo(() => {
    if (!selectedSectorKey) return [];
    return categories.filter((c) => {
      const catSector = getCategorySectorKey(c);
      return catSector === selectedSectorKey;
    });
  }, [categories, selectedSectorKey]);

  // Category Options for the second searchable selector
  const categoryOptions = useMemo(() => {
    return availableCategories.map((c) => ({
      value: c.id,
      label: c.name,
      sublabel: `/${c.slug}`,
    }));
  }, [availableCategories]);

  // When sector changes: update sector, and if current category is not in this sector, auto-select first category
  const handleSectorChange = (newSectorKey: string) => {
    setSelectedSectorKey(newSectorKey);
    if (!newSectorKey) {
      setCategoryId("");
      return;
    }
    const matching = categories.filter((c) => getCategorySectorKey(c) === newSectorKey);
    const isCurrentInNewSector = matching.some((c) => c.id === categoryId);
    if (!isCurrentInNewSector && matching.length > 0 && matching[0]) {
      setCategoryId(matching[0].id);
    }
  };

  // When category changes: update categoryId, and ensure sector is in sync
  const handleCategoryChange = (newCategoryId: string) => {
    setCategoryId(newCategoryId);
    const cat = categories.find((c) => c.id === newCategoryId);
    if (cat) {
      const catSector = getCategorySectorKey(cat);
      if (catSector && catSector !== selectedSectorKey) {
        setSelectedSectorKey(catSector);
      }
    }
  };

  return (
    <div className="space-y-6">

      {/* 2-Tier Cascading & Searchable Selection: Sector then Category */}
      <div className="space-y-2 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* 1. SECTOR SEARCHABLE SELECT */}
          <SearchableSelect
            id="wizard-sector-select"
            label={isTr ? "1. Sektör Belirleyin" : "1. Choose Sector"}
            badge={isTr ? "Adım 1" : "Step 1"}
            icon={<Layers className="h-4 w-4 text-blue-400" />}
            placeholder={
              isTr
                ? "Sektör ara veya yazın... (örn. Yazılım, Yapay Zeka)"
                : "Type or select sector... (e.g. Software, AI)"
            }
            options={sectorOptions}
            value={selectedSectorKey}
            onChange={handleSectorChange}
            isTr={isTr}
            required
          />

          {/* 2. CATEGORY SEARCHABLE SELECT */}
          <SearchableSelect
            id="wizard-category-select"
            label={isTr ? "2. İlan Kategorisi" : "2. Listing Category"}
            badge={isTr ? "Adım 2" : "Step 2"}
            icon={<FolderTree className="h-4 w-4 text-cyan-400" />}
            placeholder={
              isTr
                ? "Kategori ara veya yazın... (örn. Web, Mobil, DevOps)"
                : "Type or select category... (e.g. Web, Mobile)"
            }
            disabled={!selectedSectorKey}
            disabledMessage={
              isTr ? "Lütfen önce sol taraftan bir sektör seçiniz" : "Please choose a sector first"
            }
            options={categoryOptions}
            value={categoryId}
            onChange={handleCategoryChange}
            isTr={isTr}
            required
          />
        </div>

        {/* Selected Sector & Category Breadcrumb Bar */}
        {selectedCategory && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
            <div className="flex items-center gap-1.5 text-blue-400">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[var(--color-text-tertiary)]">
                {isTr ? "Seçilen Alan:" : "Selected Discipline:"}
              </span>
              <span className="font-semibold text-[var(--color-text-primary)]">
                {sectorOptions.find((s) => s.value === selectedSectorKey)?.label || ""}
              </span>
              <span className="text-[var(--color-text-tertiary)]">›</span>
              <span className="font-bold text-blue-400">
                {selectedCategory.name}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[var(--color-text-tertiary)]">
              /{selectedCategory.slug}
            </span>
          </div>
        )}
      </div>

      {/* Project Title */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-[var(--color-text-primary)]">
            {isTr ? "İlan Başlığı *" : "Listing Title *"}
          </label>
          <span
            className={`font-mono text-[11px] ${
              isTitleLengthInvalid ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {title.length} / 120 (min: 20)
          </span>
        </div>
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            isTr
              ? "Örn: Next.js ve Tailwind ile Modern E-Ticaret Arayüzü Geliştirilmesi"
              : "e.g. Next.js and Tailwind Modern E-Commerce Frontend Development"
          }
          maxLength={120}
        />
        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          {isTr
            ? "Açık ve profesyonel bir başlık girin. Tamamı büyük harf kullanımı yasaktır."
            : "Keep it clear and professional. All-caps titles are forbidden."}
        </p>

        {/* Intelligent Scope & Archetype Detection Banner */}
        {detectedArchetype && title.trim().length >= 6 && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <span className="font-semibold text-emerald-300">{detectedArchetype.profile.labelTr}</span>{" "}
                {isTr ? "tespit edildi." : "detected."}
                <span className="text-[var(--color-text-tertiary)] block sm:inline sm:ml-1">
                  {isTr
                    ? "3 soruda teslimat ve kabul şartlarını netleştirelim."
                    : "Clarify acceptance criteria in 3 quick questions."}
                </span>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsScopeInterviewOpen(true)}
              className="shrink-0 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 text-xs h-8 cursor-pointer"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
              {isTr ? "Kapsamı Netleştir (3 Soru)" : "Clarify Scope (3 Steps)"}
            </Button>
          </div>
        )}
      </div>

      {/* Project Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-[var(--color-text-primary)]">
            {isTr ? "Kısa Özet (Önizleme) *" : "Short Summary (Preview) *"}
          </label>
          <span
            className={`font-mono text-[11px] ${
              isSummaryLengthInvalid ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {summary.length} / 280 (min: 80)
          </span>
        </div>
        <TextArea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={
            isTr
              ? "Örn: Mevcut Next.js web uygulamamız için yeni bir müşteri paneli ve grafik arayüzleri geliştirecek deneyimli frontend uzmanı aranıyor."
              : "e.g. Looking for an experienced frontend specialist to build customer dashboard and reporting views."
          }
          minLength={80}
          maxLength={280}
          rows={3}
          showCount={false}
        />

        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          {isTr
            ? "Akış kartlarında ve arama sonuçlarında gösterilecek 1-2 cümlelik vurucu özet."
            : "Shown on search cards and public feed previews."}
        </p>
      </div>

      {/* Operis AI PRD & Scope Architect Quick Trigger Banner */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-cyan-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-indigo-500/5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles className="h-4 w-4 fill-indigo-400/40 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                {isTr
                  ? "Operis AI: Akıllı PRD & Kapsam Mimarı"
                  : "Operis AI: Smart PRD & Scope Architect"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                {isTr ? "Yapay Zeka Destekli" : "AI Powered"}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {isTr
                ? "Girdiğiniz başlık ve özeti tarayarak Agile kullanıcı hikayeleri, kabul kriterleri, entegrasyonlar ve piyasa bütçesi üretir."
                : "Scans your brief to generate Agile INVEST stories, acceptance criteria, APIs, and realistic market budget."}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setIsPrdArchitectOpen(true)}
          disabled={!title.trim() && !summary.trim()}
          className="text-xs bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shrink-0 cursor-pointer shadow-md"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          <span>{isTr ? "PRD & Kapsam Üret" : "Synthesize PRD"}</span>
        </Button>
      </div>
    </div>
  );
}
