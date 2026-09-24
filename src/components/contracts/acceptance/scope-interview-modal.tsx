"use client";

import { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Code2,
  X,
  Check,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { AcceptanceEngine } from "@/src/modules/contracts/acceptance-engine";
import {
  ScopeInterviewAnswers,
  SynthesizedScopePackage,
} from "@/src/modules/contracts/acceptance-types";

export interface ScopeInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  summary?: string;
  categorySlug?: string;
  tags?: string[];
  locale?: "tr" | "en";
  onApplyPackage: (pkg: SynthesizedScopePackage) => void;
}

function getGherkinToggleButtonLabel(showGherkin: boolean, isTr: boolean): string {
  if (showGherkin) {
    return isTr ? "Sade Dili Göster" : "Show Plain View";
  }
  return isTr ? "Teknik Formatı Göster (Gherkin)" : "Show Gherkin BDD";
}

export function ScopeInterviewModal({
  isOpen,
  onClose,
  title,
  summary = "",
  categorySlug = "",
  tags = [],
  locale = "tr",
  onApplyPackage,
}: ScopeInterviewModalProps) {
  const isTr = locale === "tr";

  // Archetype Detection
  const detection = AcceptanceEngine.detectArchetype(title, summary, categorySlug, tags);
  const questions = AcceptanceEngine.getInterviewQuestions(detection.archetype);

  // Active step in the interview (0 to questions.length)
  // Last step is the Preview & Confirmation
  const [currentStep, setCurrentStep] = useState(0);
  const [showGherkin, setShowGherkin] = useState(false);

  // User answers map
  const [answers, setAnswers] = useState<ScopeInterviewAnswers>(() => {
    const init: ScopeInterviewAnswers = {};
    for (const q of questions) {
      init[q.slotKey] = q.defaultOptionValue;
    }
    return init;
  });

  if (!isOpen) return null;

  const currentQuestion = questions[currentStep];
  const isPreviewStep = currentStep >= questions.length;

  // Synthesize scope based on currently selected answers
  const synthesizedPackage = AcceptanceEngine.synthesizeScopePackage({
    archetype: detection.archetype,
    title,
    summary,
    answers,
    categorySlug,
    tags,
  });

  const handleSelectOption = (slotKey: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [slotKey]: value }));
  };

  const handleNext = () => {
    if (currentStep < questions.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleApply = () => {
    onApplyPackage(synthesizedPackage);
    onClose();
  };

  const handleSkipToDefaults = () => {
    // Apply with standard defaults immediately without hassle
    const defaultPackage = AcceptanceEngine.synthesizeScopePackage({
      archetype: detection.archetype,
      title,
      summary,
      answers: {},
      categorySlug,
      tags,
    });
    onApplyPackage(defaultPackage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 transition-opacity animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-6 py-4.5 bg-[var(--color-surface-base)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-[var(--color-text-primary)]">
                  {isTr ? "Akıllı Kapsam & Teslimat Şartnamesi" : "Smart Scope & Acceptance Spec"}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
                  <Sparkles className="h-3 w-3" />
                  {detection.profile.labelTr}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                {isTr
                  ? "İşin bittiğini nasıl anlayacağız? 3 adımda karşılıklı netleştirelim."
                  : "How do we define 'Done'? Clarify acceptance in 3 quick steps."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            aria-label={isTr ? "Kapat" : "Close"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="flex h-1.5 w-full bg-[var(--color-surface-hover)]">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`h-full flex-1 transition-all duration-300 ${
                idx <= currentStep
                  ? "bg-blue-600"
                  : "bg-[var(--color-surface-hover)] opacity-50"
              }`}
            />
          ))}
          <div
            className={`h-full flex-1 transition-all duration-300 ${
              isPreviewStep ? "bg-blue-600" : "bg-[var(--color-surface-hover)] opacity-50"
            }`}
          />
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {!isPreviewStep && currentQuestion ? (
            <div className="space-y-5">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">
                  {isTr ? `Soru ${currentStep + 1} / ${questions.length}` : `Question ${currentStep + 1} of ${questions.length}`}
                </div>
                <h4 className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">
                  {isTr ? currentQuestion.titleTr : currentQuestion.titleEn}
                </h4>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  {isTr ? currentQuestion.subtitleTr : currentQuestion.subtitleEn}
                </p>
              </div>

              {/* Options Radio List */}
              <div className="space-y-3">
                {currentQuestion.options.map((opt) => {
                  const isSelected = answers[currentQuestion.slotKey] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion.slotKey, opt.value)}
                      className={`group relative flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-blue-500/60 bg-blue-500/[0.06] shadow-sm ring-1 ring-blue-500/30 text-[var(--color-text-primary)]"
                          : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-blue-500/30 hover:bg-[var(--color-surface-hover)]"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                            : "border-[var(--color-border-subtle)] bg-transparent group-hover:border-blue-400"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-[var(--color-text-primary)]">
                          {isTr ? opt.labelTr : opt.labelEn}
                        </div>
                        {opt.descriptionTr && (
                          <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)] leading-relaxed">
                            {isTr ? opt.descriptionTr : opt.descriptionEn}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Preview Step: Final Acceptance Criteria & Milestones */
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h4 className="text-lg font-bold text-[var(--color-text-primary)]">
                    {isTr ? "📋 Teslimat Kontrol Listesi Özeti" : "📋 Acceptance Checklist Preview"}
                  </h4>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                    {isTr
                      ? "Seçtiğiniz tercihlere göre oluşturulan objektif teslimat kuralları."
                      : "Generated objective acceptance criteria tailored to your selections."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowGherkin(!showGherkin)}
                  className="text-xs cursor-pointer gap-1.5"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span>{getGherkinToggleButtonLabel(showGherkin, isTr)}</span>
                </Button>
              </div>

              {/* Milestones and Criteria Cards */}
              <div className="space-y-3">
                {synthesizedPackage.suggestedMilestones.map((m) => {
                  const milestoneCriteria = synthesizedPackage.criteria.filter(
                    (c) => c.phaseNumber === m.phase
                  );
                  return (
                    <div
                      key={m.phase}
                      className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)]/70 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                            {m.phase}
                          </span>
                          <span className="font-bold text-[var(--color-text-primary)] text-xs sm:text-sm">
                            {isTr ? m.titleTr : m.titleEn}
                          </span>
                        </div>
                        <span className="rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-text-secondary)] font-mono">
                          %{m.percentage}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {milestoneCriteria.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-start gap-2.5 rounded-xl bg-[var(--color-surface-base)] p-3 shadow-xs border border-[var(--color-border-subtle)] text-xs"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                            <div className="flex-1">
                              <p className="font-medium text-[var(--color-text-primary)] leading-relaxed">
                                {isTr ? c.humanCriterionTr : c.humanCriterionEn}
                              </p>
                              {showGherkin && (
                                <div className="mt-2 rounded-xl bg-black/60 p-2.5 font-mono text-[11px] text-blue-300 border border-[var(--color-border-subtle)] leading-relaxed">
                                  <span className="text-purple-400 font-bold">GIVEN</span> {isTr ? c.gherkinGivenTr : c.gherkinGivenEn}
                                  <br />
                                  <span className="text-amber-400 font-bold">WHEN</span> {isTr ? c.gherkinWhenTr : c.gherkinWhenEn}
                                  <br />
                                  <span className="text-emerald-400 font-bold">THEN</span> {isTr ? c.gherkinThenTr : c.gherkinThenEn}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-3.5 text-xs text-blue-400 flex items-start gap-2.5 leading-relaxed">
                <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {isTr
                    ? "Bu kontrol listesi sözleşmeye 'Ek-1: Objektif Kabul Şartnamesi' olarak eklenecektir. İş bittiğinde işveren keyfi ret yapamaz; teslimat bu maddeler üzerinden onaylanır."
                    : "This checklist will be appended to the contract as Annex-1. At handover, subjective rejection is barred; approval is evaluated against these points."}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-6 py-4">
          <div>
            {!isPreviewStep && (
              <button
                type="button"
                onClick={handleSkipToDefaults}
                className="text-xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] underline transition-colors cursor-pointer"
              >
                {isTr ? "Varsayılan Şartlarla Devam Et (Atla)" : "Skip with Standard Defaults"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="cursor-pointer"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                {isTr ? "Geri" : "Back"}
              </Button>
            )}

            {!isPreviewStep ? (
              <Button
                type="button"
                variant="shimmer"
                size="sm"
                onClick={handleNext}
                className="cursor-pointer gap-1"
              >
                <span>{isTr ? "İleri" : "Next"}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="shimmer"
                size="sm"
                onClick={handleApply}
                className="cursor-pointer gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>{isTr ? "Şartnameyi İlana Uygula" : "Apply Specification to Listing"}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
