"use client";

import {
  FolderTree,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Lightbulb,
  ShieldAlert,
  BookmarkCheck,
  RotateCcw,
  Trash2,
  Plus,
} from "lucide-react";
import type { SavedDraftItem } from "../types";

function formatDraftTime(timestamp: number, isTr: boolean): string {
  if (!timestamp) return "";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return isTr ? "Az önce" : "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return isTr ? `${diffMin} dk önce` : `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return isTr ? `${diffHours} sa önce` : `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return isTr ? `${diffDays} gün önce` : `${diffDays}d ago`;
}

function getMobileStepButtonClass(isActive: boolean, isDone: boolean): string {
  if (isActive) {
    return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
  }
  if (isDone) {
    return "bg-[var(--color-surface-hover)] text-emerald-400 hover:text-emerald-300 cursor-pointer";
  }
  return "text-[var(--color-text-tertiary)] opacity-40 cursor-not-allowed";
}

function getSidebarStepButtonClass(isActive: boolean, isDone: boolean): string {
  if (isActive) {
    return "bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-transparent border-blue-500/40 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20";
  }
  if (isDone) {
    return "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/60 hover:border-emerald-500/40 hover:bg-emerald-500/5 cursor-pointer";
  }
  return "border-transparent bg-transparent opacity-50 cursor-not-allowed";
}

function getSidebarCircleClass(isActive: boolean, isDone: boolean): string {
  if (isActive) {
    return "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40";
  }
  if (isDone) {
    return "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 group-hover:scale-105";
  }
  return "bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]";
}

function getSidebarStepTagClass(isActive: boolean, isDone: boolean): string {
  if (isActive) return "text-blue-400";
  if (isDone) return "text-emerald-400";
  return "text-[var(--color-text-tertiary)]";
}

function getSidebarStepTitleClass(isActive: boolean, isDone: boolean): string {
  if (isActive) return "text-[var(--color-text-primary)] font-bold";
  if (isDone) return "text-[var(--color-text-primary)]";
  return "text-[var(--color-text-tertiary)]";
}

function getDraftsBoxClass(hasDrafts: boolean, hasActive: boolean): string {
  if (hasDrafts) {
    return "border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-[var(--color-surface-base)]/80 to-indigo-500/5 shadow-blue-500/5";
  }
  if (hasActive) {
    return "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70";
  }
  return "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/60";
}

function getDraftsIconClass(hasDrafts: boolean, hasActive: boolean): string {
  if (hasDrafts) {
    return "bg-blue-500/20 border-blue-500/30 text-blue-400";
  }
  if (hasActive) {
    return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
  }
  return "bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]";
}

const DEFAULT_GUIDANCE = {
  icon: Sparkles,
  tag: { tr: "AŞAMA 1 İPUCU", en: "STAGE 1 TIP" },
  title: { tr: "Yapay Zeka ile Hızlı Başlangıç", en: "Fast Track with AI PRD" },
  desc: {
    tr: "Projenizi özetleyen net bir başlık yazdıktan sonra 'AI ile PRD Oluştur' asistanını kullanarak teknik gereksinim dokümanınızı saniyeler içinde tasarlayabilirsiniz.",
    en: "After entering a concise title, launch the 'Generate PRD with AI' wizard to synthesize structured technical specifications in seconds.",
  },
};

const STEP_GUIDANCE: Record<
  number,
  {
    icon: typeof Sparkles;
    tag: { tr: string; en: string };
    title: { tr: string; en: string };
    desc: { tr: string; en: string };
  }
> = {
  1: DEFAULT_GUIDANCE,
  2: {
    icon: Lightbulb,
    tag: { tr: "AŞAMA 2 İPUCU", en: "STAGE 2 TIP" },
    title: { tr: "Net Kapsam, Kaliteli Teklif", en: "Clear Scope, Better Bids" },
    desc: {
      tr: "Beklenen teslimat çıktılarını ve teknoloji yığınını netleştirmeniz, ilanınızı doğru uzmanların radarına sokar ve teklif verme süresini %40 hızlandırır.",
      en: "Clarifying concrete deliverables and required technologies accelerates developer evaluation and generates higher quality proposals.",
    },
  },
  3: {
    icon: ShieldCheck,
    tag: { tr: "AŞAMA 3 İPUCU", en: "STAGE 3 TIP" },
    title: { tr: "%0 Komisyon & Şeffaf Süreç", en: "0% Fees & Direct Match" },
    desc: {
      tr: "Operis platformu işverenden veya uzmandan hiçbir komisyon almaz. Bütçe ve ödeme koşulları doğrudan taraflar arasında yönetilir.",
      en: "Operis charges 0% fees from both sides. Payment milestones and terms are managed directly between you and the chosen engineer.",
    },
  },
};

export interface WizardStepperSidebarProps {
  step: number;
  setStep: (step: number) => void;
  totalSteps: number;
  isTr: boolean;
  hasDraftNotice?: boolean;
  draftTitleNotice?: string;
  currentTitle?: string;
  categoryName?: string;
  onRestoreDraft?: () => void;
  onDiscardDraft?: () => void;
  draftsList?: SavedDraftItem[];
  activeDraftId?: string | null;
  onSaveDraft?: () => boolean | void;
  onLoadDraft?: (draftId: string) => void;
  onDeleteDraft?: (draftId: string) => void;
  onStartNewListing?: () => void;
}

export function WizardStepperSidebar({
  step,
  setStep,
  totalSteps,
  isTr,
  hasDraftNotice = false,
  draftTitleNotice,
  currentTitle,
  categoryName,
  onRestoreDraft,
  onDiscardDraft,
  draftsList = [],
  activeDraftId,
  onSaveDraft,
  onLoadDraft,
  onDeleteDraft,
  onStartNewListing,
}: WizardStepperSidebarProps) {
  const hasActiveContent = Boolean(currentTitle && currentTitle.trim().length > 0);
  const hasDraftsList = Boolean(draftsList && draftsList.length > 0);

  const stepsConfig = [
    {
      stepNumber: 1,
      tag: isTr ? "ADIM 01" : "STEP 01",
      title: isTr ? "İlan Tanımı & Kategori" : "Listing Info & Category",
      desc: isTr ? "Kategori, başlık ve proje özeti" : "Category, title & summary",
      icon: FolderTree,
    },
    {
      stepNumber: 2,
      tag: isTr ? "ADIM 02" : "STEP 02",
      title: isTr ? "Teknik Kapsam & Yetkinlikler" : "Technical Scope & Skills",
      desc: isTr ? "Gereksinimler ve teknoloji etiketleri" : "Deliverables & tech stack",
      icon: FileText,
    },
    {
      stepNumber: 3,
      tag: isTr ? "ADIM 03" : "STEP 03",
      title: isTr ? "Bütçe, Süreç & Yasal Onay" : "Budget, Timeline & Review",
      desc: isTr ? "Tahmini bütçe ve güvenceler" : "Budget, timeline & guarantees",
      icon: ShieldCheck,
    },
  ];

  const currentStepInfo =
    stepsConfig.find((s) => s.stepNumber === step) ??
    stepsConfig[0] ?? {
      stepNumber: 1,
      tag: isTr ? "ADIM 01" : "STEP 01",
      title: isTr ? "İlan Tanımı & Kategori" : "Listing Info & Category",
      desc: isTr ? "Kategori, başlık ve proje özeti" : "Category, title & summary",
      icon: FolderTree,
    };

  const currentGuidance = STEP_GUIDANCE[step] ?? DEFAULT_GUIDANCE;
  const GuidanceIcon = currentGuidance.icon;

  const renderDraftsHeaderBadge = () => {
    if (hasDraftsList) {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
          {isTr ? `${draftsList.length} Taslak` : `${draftsList.length} Drafts`}
        </span>
      );
    }
    if (hasActiveContent) {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {isTr ? "Aktif Giriş" : "In Progress"}
        </span>
      );
    }
    return (
      <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
        {isTr ? "0 Taslak" : "0 Drafts"}
      </span>
    );
  };

  const renderDraftsBody = () => {
    if (hasDraftsList) {
      return (
        <div className="space-y-2.5">
          <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
            {draftsList.map((d) => {
              const isActive = activeDraftId === d.id;
              return (
                <div
                  key={d.id}
                  className={`rounded-2xl border p-3 space-y-2 transition-all ${
                    isActive
                      ? "border-blue-500/40 bg-blue-500/10 shadow-xs"
                      : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 hover:border-blue-500/30"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                      {d.title || (isTr ? "İsimsiz İlan Taslağı" : "Untitled Draft")}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5 truncate">
                      {d.categoryName || (isTr ? "Genel İlan" : "General")} • {isTr ? `${d.step}. Aşama` : `Stage ${d.step}`} • {formatDraftTime(d.updatedAt, isTr)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border-subtle)]/60 text-[11px]">
                    {isActive ? (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {isTr ? "Şu An Açık" : "Currently Open"}
                      </span>
                    ) : (
                      onLoadDraft && (
                        <button
                          type="button"
                          onClick={() => onLoadDraft(d.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 py-1 px-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 cursor-pointer transition-colors"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>{isTr ? "Yükle" : "Load"}</span>
                        </button>
                      )
                    )}

                    {onDeleteDraft && (
                      <button
                        type="button"
                        onClick={() => onDeleteDraft(d.id)}
                        className="p-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
                        title={isTr ? "Taslağı Sil" : "Delete Draft"}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {onStartNewListing && (
            <button
              type="button"
              onClick={onStartNewListing}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-[var(--color-border-subtle)] text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-blue-500/40 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-blue-400" />
              <span>{isTr ? "+ Yeni Boş İlan Başlat" : "+ Start New Blank Listing"}</span>
            </button>
          )}
        </div>
      );
    }

    if (hasActiveContent) {
      return (
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 p-3 space-y-2">
          <div>
            <div className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
              {currentTitle || (isTr ? "İsimsiz İlan Taslağı" : "Untitled Draft")}
            </div>
            {categoryName && (
              <div className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5 truncate">
                {categoryName} • {isTr ? `Aşama ${step}/3` : `Stage ${step}/3`}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border-subtle)]/60 text-[11px]">
            <span className="text-[10px] text-emerald-400/90 flex items-center gap-1">
              ✓ {isTr ? "Geçici oturumda" : "Temporary session"}
            </span>
            {onSaveDraft && (
              <button
                type="button"
                onClick={onSaveDraft}
                className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <BookmarkCheck className="h-3 w-3" />
                <span>{isTr ? "Listeye Kaydet" : "Save to List"}</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-border-subtle)] p-4 text-center space-y-1.5">
        <BookmarkCheck className="h-4 w-4 text-[var(--color-text-tertiary)] mx-auto opacity-50" />
        <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
          {isTr ? "Henüz kayıtlı taslak yok" : "No saved drafts yet"}
        </p>
        <p className="text-[11px] text-[var(--color-text-tertiary)] leading-relaxed">
          {isTr
            ? "'Taslağı Kaydet' butonuna tıkladığınızda taslaklarınız burada listelenir."
            : "Click 'Save Draft' at any time to list your drafts here."}
        </p>
      </div>
    );
  };

  return (
    <>
      {/* MOBILE PROGRESS BAR (< lg) */}
      <div className="lg:hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-4 shadow-sm mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-6 px-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold text-blue-400">
              {isTr ? `Adım ${step} / ${totalSteps}` : `Step ${step} / ${totalSteps}`}
            </span>
            <span className="text-xs font-semibold text-[var(--color-text-primary)]">
              {currentStepInfo.title}
            </span>
          </div>
          <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
            %{Math.round((step / totalSteps) * 100)}
          </span>
        </div>

        {/* Progress Track */}
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
        >
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Mobile Step Quick Selector */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {stepsConfig.map((s) => {
            const isDone = step > s.stepNumber;
            const isActive = step === s.stepNumber;
            return (
              <button
                key={s.stepNumber}
                type="button"
                onClick={() => {
                  if (isDone) setStep(s.stepNumber);
                }}
                disabled={!isDone && !isActive}
                className={`flex-1 text-center py-1 text-[11px] font-medium rounded-lg transition-all ${getMobileStepButtonClass(
                  isActive,
                  isDone
                )}`}
              >
                {isDone ? `✓ ${s.stepNumber}. Aşama` : `${s.stepNumber}. Aşama`}
              </button>
            );
          })}
        </div>

        {/* Mobile Drafts Bar */}
        {hasDraftsList && (
          <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-text-primary)]">
                <BookmarkCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>{isTr ? `Kayıtlı Taslaklar (${draftsList.length})` : `Saved Drafts (${draftsList.length})`}</span>
              </div>
              {onStartNewListing && (
                <button
                  type="button"
                  onClick={onStartNewListing}
                  className="text-[10px] text-[var(--color-text-secondary)] hover:text-blue-400 cursor-pointer"
                >
                  {isTr ? "+ Yeni İlan" : "+ New"}
                </button>
              )}
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {draftsList.map((d) => {
                const isActive = activeDraftId === d.id;
                return (
                  <div
                    key={d.id}
                    className={`flex items-center justify-between gap-2 p-2 rounded-xl border text-[11px] ${
                      isActive
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                        : "bg-[var(--color-surface-hover)]/40 border-[var(--color-border-subtle)]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate text-[var(--color-text-primary)]">
                        {d.title || (isTr ? "İsimsiz Taslak" : "Untitled Draft")}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                        {d.categoryName || (isTr ? "Kategori Yok" : "No Category")} • {isTr ? `${d.step}. Aşama` : `Stage ${d.step}`} • {formatDraftTime(d.updatedAt, isTr)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!isActive && onLoadDraft && (
                        <button
                          type="button"
                          onClick={() => onLoadDraft(d.id)}
                          className="px-2 py-0.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold cursor-pointer"
                        >
                          {isTr ? "Yükle" : "Load"}
                        </button>
                      )}
                      {onDeleteDraft && (
                        <button
                          type="button"
                          onClick={() => onDeleteDraft(d.id)}
                          className="p-1 rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer"
                          title={isTr ? "Sil" : "Delete"}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!hasDraftsList && hasDraftNotice && (
          <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <BookmarkCheck className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-[var(--color-text-primary)] block truncate">
                  {draftTitleNotice || currentTitle || (isTr ? "Kayıtlı Taslak" : "Saved Draft")}
                </span>
                <span className="text-[10px] text-[var(--color-text-secondary)]">
                  {isTr ? "Kaldığınız yerden devam edin" : "Continue draft"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {onRestoreDraft && (
                <button
                  type="button"
                  onClick={onRestoreDraft}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold cursor-pointer"
                >
                  {isTr ? "Kullan" : "Use"}
                </button>
              )}
              {onDiscardDraft && (
                <button
                  type="button"
                  onClick={onDiscardDraft}
                  className="p-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer"
                  title={isTr ? "Sil" : "Delete"}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP STICKY SIDEBAR (>= lg) */}
      <aside
        aria-label={isTr ? "İlan Oluşturma Adımları" : "Listing Creation Steps"}
        className="hidden lg:block lg:sticky lg:top-24 space-y-4"
      >
        {/* Header Block */}
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 shadow-xl space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {isTr ? "İlan Sihirbazı" : "Listing Wizard"}
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "3 aşamada gereksinimlerinizi tanımlayın, doğrulanmış uzmanlardan doğrudan teklif alın."
                : "Define your requirements in 3 steps to receive direct encrypted bids from verified engineers."}
            </p>
          </div>

          {/* Stepper Rail */}
          <nav aria-label={isTr ? "Aşama Çizelgesi" : "Stage Progress"} className="space-y-3 pt-2">
            {stepsConfig.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.stepNumber;
              const isDone = step > s.stepNumber;
              const isLast = idx === stepsConfig.length - 1;

              return (
                <div key={s.stepNumber} className="relative">
                  {/* Connecting Rail Line */}
                  {!isLast && (
                    <div
                      aria-hidden="true"
                      className={`absolute left-[18px] top-10 bottom-[-16px] w-[2px] transition-colors duration-300 ${
                        isDone ? "bg-emerald-500/50" : "bg-[var(--color-border-subtle)]"
                      }`}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (isDone) setStep(s.stepNumber);
                    }}
                    disabled={!isDone && !isActive}
                    className={`w-full group flex items-start gap-3.5 p-3 rounded-2xl border text-left transition-all duration-200 ${getSidebarStepButtonClass(
                      isActive,
                      isDone
                    )}`}
                  >
                    {/* Circle Indicator */}
                    <div
                      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs transition-all ${getSidebarCircleClass(
                        isActive,
                        isDone
                      )}`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>

                    {/* Step Text Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-mono font-bold tracking-wider uppercase ${getSidebarStepTagClass(
                            isActive,
                            isDone
                          )}`}
                        >
                          {s.tag}
                        </span>
                        {isDone && (
                          <span className="text-[10px] text-emerald-400/80 font-medium">
                            {isTr ? "Tamamlandı" : "Completed"}
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[10px] text-blue-400 font-medium animate-pulse">
                            {isTr ? "Düzenleniyor" : "Editing"}
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-xs font-semibold truncate transition-colors ${getSidebarStepTitleClass(
                          isActive,
                          isDone
                        )}`}
                      >
                        {s.title}
                      </div>
                      <p className="text-[11px] text-[var(--color-text-secondary)] truncate mt-0.5">
                        {s.desc}
                      </p>
                    </div>
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        {/* DEDICATED SAVED DRAFTS BOX */}
        <div
          aria-label={isTr ? "Kayıtlı Taslaklar" : "Saved Drafts"}
          className={`rounded-3xl border p-5 backdrop-blur-xl shadow-lg space-y-3.5 transition-all duration-300 ${getDraftsBoxClass(
            hasDraftsList,
            hasActiveContent
          )}`}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${getDraftsIconClass(
                  hasDraftsList,
                  hasActiveContent
                )}`}
              >
                <BookmarkCheck className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-bold text-[var(--color-text-primary)]">
                {isTr ? "Kayıtlı Taslaklar" : "Saved Drafts"}
              </h3>
            </div>

            {renderDraftsHeaderBadge()}
          </div>

          {/* Draft Items List */}
          {renderDraftsBody()}
        </div>

        {/* DYNAMIC CONTEXTUAL GUIDANCE CARD */}
        <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-[var(--color-surface-base)]/80 to-transparent p-5 backdrop-blur-xl shadow-lg space-y-3 transition-all duration-300">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <GuidanceIcon className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider block">
                {isTr ? currentGuidance.tag.tr : currentGuidance.tag.en}
              </span>
              <h3 className="text-xs font-bold text-[var(--color-text-primary)]">
                {isTr ? currentGuidance.title.tr : currentGuidance.title.en}
              </h3>
            </div>
          </div>

          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {isTr ? currentGuidance.desc.tr : currentGuidance.desc.en}
          </p>

          <div className="pt-1 border-t border-blue-500/15 flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)]">
            <span>{isTr ? "Canlı Rehberlik" : "Live Assistant"}</span>
            <span className="text-blue-400 font-medium">
              {isTr ? "Operis Radar" : "Operis Radar"}
            </span>
          </div>
        </div>

        {/* COMPACT TRUST & PRIVACY GUARANTEE */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 backdrop-blur-xl flex items-center gap-3 shadow-xs">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-[var(--color-text-primary)] block">
              {isTr ? "Gizlilik & Güvenlik Garantisi" : "Privacy Guarantee"}
            </span>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-tight mt-0.5">
              {isTr
                ? "Telefon ve e-postanız asla yayınlanmaz, doğrudan gizli tutulur."
                : "Your phone and email are never public on the listing."}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
