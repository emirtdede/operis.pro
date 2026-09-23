import type { Dispatch, SetStateAction } from "react";
import {
  FileText,
  ShieldCheck,
  Sparkles,
  Info,
  Sliders,
  Check,
  AlertTriangle,
  Eye,
  FileCode,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { TextInput } from "@/src/components/ui/text-input";
import { TextArea } from "@/src/components/ui/text-area";
import { Select } from "@/src/components/ui/select";
import type { SynthesizedScopePackage } from "@/src/modules/contracts/acceptance-types";
import type { WizardQuestion } from "@/src/modules/listings/wizard/templates";
import type { ClarityScoreResult } from "@/src/modules/listings/wizard/scope-synthesizer";
import {
  CategoryItem,
  CATEGORY_TECH_SUGGESTIONS,
  DEFAULT_TECH_SUGGESTIONS,
  getClarityBadgeClass,
  getClarityBarClass,
  getClarityLabel,
  getScopePreviewButtonLabel,
} from "../types";

export interface StepScopeSkillsProps {
  isTr: boolean;
  acceptedScopePackage: SynthesizedScopePackage | null;
  setIsScopeInterviewOpen: (isOpen: boolean) => void;
  clarity: ClarityScoreResult;
  selectedCategory?: CategoryItem;
  currentQuestions: WizardQuestion[];
  answers: Record<string, unknown>;
  setAnswers: Dispatch<SetStateAction<Record<string, unknown>>>;
  customNotes: string;
  handleCustomNotesChange: (val: string) => void;
  notesWarning: string | null;
  scope: string;
  setScope: Dispatch<SetStateAction<string>>;
  setIsPrdArchitectOpen: (isOpen: boolean) => void;
  isScopePreviewOpen: boolean;
  setIsScopePreviewOpen: Dispatch<SetStateAction<boolean>>;
  scopeMode: "wizard" | "manual";
  setScopeMode: (mode: "wizard" | "manual") => void;
  handleInsertBlueprintTemplate: () => void;
  tagsInput: string;
  setTagsInput: (val: string) => void;
  handleToggleTagSuggestion: (tag: string) => void;
  projectType: string;
  setProjectType: (val: string) => void;
  projectStage: string;
  setProjectStage: (val: string) => void;
  workPreference: string;
  setWorkPreference: (val: string) => void;
  preferredLanguage: string;
  setPreferredLanguage: (val: string) => void;
}

export function StepScopeSkills({
  isTr,
  acceptedScopePackage,
  setIsScopeInterviewOpen,
  clarity,
  selectedCategory,
  currentQuestions,
  answers,
  setAnswers,
  customNotes,
  handleCustomNotesChange,
  notesWarning,
  scope,
  setScope,
  setIsPrdArchitectOpen,
  isScopePreviewOpen,
  setIsScopePreviewOpen,
  scopeMode,
  setScopeMode,
  handleInsertBlueprintTemplate,
  tagsInput,
  handleToggleTagSuggestion,
  projectType,
  setProjectType,
  projectStage,
  setProjectStage,
  workPreference,
  setWorkPreference,
  preferredLanguage,
  setPreferredLanguage,
  setTagsInput,
}: StepScopeSkillsProps) {
  const categorySuggestions =
    (selectedCategory?.slug && CATEGORY_TECH_SUGGESTIONS[selectedCategory.slug]) ||
    DEFAULT_TECH_SUGGESTIONS;

  return (
    <div className="space-y-6">

      {/* Accepted Scope Package (Acceptance Criteria Active Banner) */}
      {acceptedScopePackage && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-emerald-300">
                  {isTr ? "Objektif Kabul Şartnamesi Tanımlandı" : "Objective Acceptance Criteria Active"}
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                  {acceptedScopePackage.criteria.length} {isTr ? "Kriter" : "Criteria"}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {isTr
                  ? "Bu maddeler sözleşmeye 'Ek-1' olarak eklenecektir; teslimatta keyfi müşteri retlerini engeller."
                  : "These conditions will be appended to the contract as Annex-1, barring subjective rejections."}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsScopeInterviewOpen(true)}
            className="shrink-0 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 text-xs h-8 cursor-pointer"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
            {isTr ? "Kriterleri Düzenle" : "Edit Criteria"}
          </Button>
        </div>
      )}

      {/* Clarity Score Radar Bar */}
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold text-[var(--color-text-primary)]">
              {isTr ? "İlan Sağlık ve Açıklık Puanı" : "Listing Health & Clarity Score"}
            </span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getClarityBadgeClass(
              clarity.level
            )}`}
          >
            {clarity.score} / 100 • {getClarityLabel(clarity.level, isTr)}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]">
          <div
            className={`h-full transition-all duration-300 ${getClarityBarClass(clarity.level)}`}
            style={{ width: `${clarity.score}%` }}
          />
        </div>
        {clarity.tips.length > 0 && (
          <div className="space-y-1 pt-1">
            {clarity.tips.map((tip, idx) => (
              <div
                key={idx}
                className="text-[11px] text-[var(--color-text-secondary)] flex items-start gap-1.5"
              >
                <Info className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Smart Category-Adaptive Questions (Interactive Chips) */}
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 p-4 sm:p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
          <div>
            <div className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-cyan-400" />
              <span>{isTr ? "Akıllı Şartname Sihirbazı" : "Smart Scope Questions"}</span>
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
              {isTr
                ? "Tek tıkla projenizin gereksinimlerini belirleyin. Sistem bu yanıtlardan 4 bölümlü teknik şartname oluşturur."
                : "Click options to define project boundaries. Automatically synthesized into a 4-part RFP."}
            </p>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg shrink-0">
            {selectedCategory?.name || (isTr ? "Genel" : "General")}
          </span>
        </div>

        <div className="space-y-4">
          {currentQuestions.map((q) => {
            const currentVal = answers[q.key];
            return (
              <div key={q.key} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1">
                    <span>{isTr ? q.labelKey : q.labelEn || q.labelKey}</span>
                    {q.required && <span className="text-cyan-400">*</span>}
                  </label>
                  {q.helpTip && (
                    <span className="text-[10px] text-[var(--color-text-tertiary)] hidden sm:inline">
                      {isTr ? q.helpTip : q.helpTipEn || q.helpTip}
                    </span>
                  )}
                </div>

                {q.type === "single" && q.options && (
                  <div className="flex flex-wrap gap-1.5">
                    {q.options.map((opt) => {
                      const isSelected = currentVal === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAnswers({ ...answers, [q.key]: opt.value })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer text-left flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-xs"
                              : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                          }`}
                        >
                          {isSelected ? (
                            <Check className="h-3 w-3 text-cyan-400 shrink-0" />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-tertiary)] shrink-0" />
                          )}
                          <span>{isTr ? opt.label : opt.labelEn || opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === "boolean" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAnswers({ ...answers, [q.key]: true })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                        currentVal
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-xs"
                          : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]"
                      }`}
                    >
                      {Boolean(currentVal) && <Check className="h-3 w-3 text-cyan-400" />}
                      <span>{isTr ? "Evet / Dahil" : "Yes / Included"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnswers({ ...answers, [q.key]: false })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                        currentVal === false
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-xs"
                          : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]"
                      }`}
                    >
                      {currentVal === false && <Check className="h-3 w-3 text-cyan-400" />}
                      <span>{isTr ? "Hayır / Hariç" : "No / Excluded"}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Employer Custom Notes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-[var(--color-text-primary)]">
            {isTr
              ? "İşverenin Özel Notları ve Ek Şartları (Opsiyonel)"
              : "Client Specific Notes & Additional Terms (Optional)"}
          </label>
          <span className="text-[11px] font-mono text-[var(--color-text-tertiary)]">
            {customNotes.length} / 1000
          </span>
        </div>
        <TextArea
          value={customNotes}
          onChange={(e) => handleCustomNotesChange(e.target.value)}
          placeholder={
            isTr
              ? "Örn: Adayların daha önce benzer ölçekli projelerde çalışmış olması tercih sebebidir. Haftalık kısa senkron toplantı yapılacaktır."
              : "e.g. Previous experience in similar projects preferred. Weekly brief sync meetings will be held."
          }
          maxLength={1000}
          rows={3}
        />
        {notesWarning && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{notesWarning}</span>
          </div>
        )}
        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          {isTr
            ? "Bu notlar otomatik olarak şartnamenin 5. bölümüne eklenir. İletişim bilgisi (telefon, e-posta, sosyal medya) paylaşılması yasaktır."
            : "Integrated into Part 5 of RFP. Off-platform contact sharing is forbidden."}
        </p>
      </div>

      {/* Generated Scope Preview & Mode Selector */}
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/20 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold text-[var(--color-text-primary)]">
              {isTr ? "Oluşturulan Teknik Şartname (RFP)" : "Generated Technical RFP Scope"}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              {scope.length} {isTr ? "karakter" : "chars"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrdArchitectOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="h-3 w-3 text-indigo-400" />
              <span>{isTr ? "AI PRD & Kapsam Mimarı" : "AI PRD Architect"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsScopePreviewOpen(!isScopePreviewOpen)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer"
            >
              <Eye className="h-3 w-3" />
              <span>
                {getScopePreviewButtonLabel(isScopePreviewOpen, isTr)}
              </span>
            </button>

            {scopeMode === "wizard" ? (
              <button
                type="button"
                onClick={() => setScopeMode("manual")}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] transition-all cursor-pointer"
              >
                <FileCode className="h-3 w-3" />
                <span>{isTr ? "Manuel Düzenle" : "Edit Raw Text"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setScopeMode("wizard")}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 transition-all cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>{isTr ? "Sihirbaz Moduna Dön" : "Reset to Wizard"}</span>
              </button>
            )}
          </div>
        </div>

        {scopeMode === "manual" && (
          <div className="space-y-2">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleInsertBlueprintTemplate}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-1 rounded-lg"
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>
                  {isTr ? "Şablon Ekle (4 Bölümlü İskelet)" : "Insert Blueprint Template"}
                </span>
              </button>
            </div>
            <TextArea
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              minLength={200}
              maxLength={6000}
              rows={8}
            />
            <p className="text-[11px] text-amber-400">
              {isTr
                ? "Manuel düzenleme modundasınız. Sihirbaz sorularına yapılan değişikliklerin metne yansıması için 'Sihirbaz Moduna Dön' butonuna tıklayabilirsiniz."
                : "Editing raw text. Click 'Reset to Wizard' to sync with question selections."}
            </p>
          </div>
        )}

        {(isScopePreviewOpen || scopeMode === "wizard") && (
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-4 max-h-72 overflow-y-auto space-y-2 text-xs text-[var(--color-text-secondary)] font-mono leading-relaxed whitespace-pre-wrap select-text">
            {scope}
          </div>
        )}
      </div>

      {/* Technology Tags */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[var(--color-text-primary)] block">
          {isTr ? "Teknoloji Etiketleri ve Beceriler" : "Technology Tags & Skills"}
        </label>
        <TextInput
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="React, Next.js, TypeScript, Tailwind, PostgreSQL"
        />
        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          {isTr
            ? "Kullanılacak dilleri veya kütüphaneleri virgülle ayırarak yazın (en fazla 10 etiket)."
            : "Comma-separated keywords (max 10 tags)."}
        </p>

        {/* Quick Tech Chips */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            <span>
              {isTr ? "Önerilen Popüler Yetkinlikler:" : "Suggested Skills for Category:"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categorySuggestions.map((suggestion) => {
              const isSelected = tagsInput
                .split(",")
                .map((t) => t.trim().toLowerCase())
                .includes(suggestion.toLowerCase());
              return (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleToggleTagSuggestion(suggestion)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-xs"
                      : "bg-[var(--color-surface-hover)]/40 text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {isSelected ? (
                    <Check className="h-3 w-3 text-cyan-400" />
                  ) : (
                    <Plus className="h-3 w-3 text-[var(--color-text-tertiary)]" />
                  )}
                  <span>{suggestion}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project Context & Working Model */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--color-text-primary)] block">
            {isTr ? "İş / İlan Türü" : "Job / Listing Type"}
          </label>
          <Select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            options={[
              {
                value: "new_build",
                label: isTr ? "Sıfırdan Yeni İş / Ürün" : "New Build / Green-field",
              },
              {
                value: "improvement",
                label: isTr ? "Mevcut Sistemi Geliştirme" : "Feature Improvement",
              },
              {
                value: "bug_fix",
                label: isTr ? "Hata Çözümü & Optimizasyon" : "Bug Fix & Optimization",
              },
              {
                value: "migration",
                label: isTr ? "Altyapı / Versiyon Geçişi" : "Migration & Upgrade",
              },
              {
                value: "integration",
                label: isTr ? "API & Servis Entegrasyonu" : "API & Integration",
              },
              {
                value: "consulting",
                label: isTr ? "Teknik Mimari & Danışmanlık" : "Technical Consulting",
              },
              {
                value: "audit",
                label: isTr ? "Güvenlik & Kod Denetimi" : "Security & Code Audit",
              },
              {
                value: "maintenance",
                label: isTr ? "Sürekli Bakım & Destek" : "Ongoing Maintenance",
              },
            ]}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--color-text-primary)] block">
            {isTr ? "İşin / İlanın Aşaması" : "Listing Stage"}
          </label>
          <Select
            value={projectStage}
            onChange={(e) => setProjectStage(e.target.value)}
            options={[
              {
                value: "idea",
                label: isTr ? "Fikir Aşaması (Kavramsal)" : "Idea / Conceptual",
              },
              {
                value: "requirements_ready",
                label: isTr ? "Gereksinimler Hazır" : "Requirements Ready",
              },
              {
                value: "design_ready",
                label: isTr ? "Tasarım / UI/UX Hazır" : "Design / Wireframes Ready",
              },
              {
                value: "existing_code",
                label: isTr ? "Mevcut Kod Tabanı Var" : "Existing Codebase",
              },
              {
                value: "production_system",
                label: isTr ? "Canlıda Çalışan Sistem" : "Production System",
              },
            ]}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--color-text-primary)] block">
            {isTr ? "Çalışma Şekli" : "Work Preference"}
          </label>
          <Select
            value={workPreference}
            onChange={(e) => setWorkPreference(e.target.value)}
            options={[
              { value: "REMOTE", label: isTr ? "Uzaktan (Remote)" : "Remote" },
              { value: "HYBRID", label: isTr ? "Hibrit" : "Hybrid" },
              { value: "ONSITE", label: isTr ? "Ofiste / Yerinde" : "Onsite" },
            ]}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--color-text-primary)] block">
            {isTr ? "İletişim Dili" : "Preferred Language"}
          </label>
          <Select
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value)}
            options={[
              { value: "any", label: isTr ? "Fark etmez (TR / EN)" : "Any (TR / EN)" },
              { value: "tr", label: isTr ? "Türkçe" : "Turkish" },
              { value: "en", label: isTr ? "İngilizce" : "English" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
