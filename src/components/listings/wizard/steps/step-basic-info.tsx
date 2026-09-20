import { FolderTree, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { TextInput } from "@/src/components/ui/text-input";
import { TextArea } from "@/src/components/ui/text-area";
import { Select } from "@/src/components/ui/select";
import { SEED_SECTORS } from "@/db/seeds/categories";
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

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <FolderTree className="h-5 w-5 text-blue-400" />
          <span>{isTr ? "1. İlan Tanımı ve Kategori" : "1. Listing Info & Category"}</span>
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
          {isTr
            ? "İlanınızın ana disiplinini seçin, net bir başlık ve kısa bir özet belirleyin."
            : "Choose the technology category, clear title, and concise preview summary."}
        </p>
      </div>

      {/* Category Select */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[var(--color-text-primary)] block">
          {isTr ? "İlan Kategorisi *" : "Listing Category *"}
        </label>
        <Select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={categories.map((c) => {
            const sector = SEED_SECTORS.find((s) => s.key === c.sectorKey);
            let sectorName = "";
            if (sector) {
              sectorName = isTr ? sector.translations.tr.name : sector.translations.en.name;
            }
            return {
              value: c.id,
              label: sectorName ? `${sectorName} › ${c.name}` : c.name,
            };
          })}
        />
        {selectedCategory && (
          <div className="text-[11px] text-blue-400 flex items-center gap-1.5 pt-0.5">
            <Sparkles className="h-3 w-3" />
            <span>
              {isTr
                ? `Seçilen alan: ${selectedCategory.name} (/${selectedCategory.slug})`
                : `Selected: ${selectedCategory.name}`}
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
                  ? "🤖 Operis AI: Akıllı PRD & Kapsam Mimarı"
                  : "🤖 Operis AI: Smart PRD & Scope Architect"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                Uma Spec Architect
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
