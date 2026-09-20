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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {isTr ? "Akıllı Kapsam & Teslimat Şartnamesi" : "Smart Scope & Acceptance Spec"}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  <Sparkles className="h-3 w-3" />
                  {detection.profile.labelTr}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isTr
                  ? "İşin bittiğini nasıl anlayacağız? 3 adımda karşılıklı netleştirelim."
                  : "How do we define 'Done'? Clarify acceptance in 3 quick steps."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="flex h-1.5 w-full bg-slate-100 dark:bg-slate-900">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`h-full flex-1 transition-all duration-300 ${
                idx <= currentStep
                  ? "bg-emerald-500"
                  : "bg-slate-200 dark:bg-slate-800"
              }`}
            />
          ))}
          <div
            className={`h-full flex-1 transition-all duration-300 ${
              isPreviewStep ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
            }`}
          />
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isPreviewStep && currentQuestion ? (
            <div className="space-y-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {isTr ? `Soru ${currentStep + 1} / ${questions.length}` : `Question ${currentStep + 1} of ${questions.length}`}
                </div>
                <h4 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  {isTr ? currentQuestion.titleTr : currentQuestion.titleEn}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
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
                      className={`group relative flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500/50 dark:border-emerald-500 dark:bg-emerald-950/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
                            : "border-slate-300 bg-transparent group-hover:border-slate-400 dark:border-slate-700"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {isTr ? opt.labelTr : opt.labelEn}
                        </div>
                        {opt.descriptionTr && (
                          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
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
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isTr ? "📋 Teslimat Kontrol Listesi Özeti" : "📋 Acceptance Checklist Preview"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isTr
                      ? "Seçtiğiniz tercihlere göre oluşturulan objektif teslimat kuralları."
                      : "Generated objective acceptance criteria tailored to your selections."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGherkin(!showGherkin)}
                  className="text-xs"
                >
                  <Code2 className="mr-1.5 h-3.5 w-3.5" />
                  {getGherkinToggleButtonLabel(showGherkin, isTr)}
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
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/50"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                            {m.phase}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {isTr ? m.titleTr : m.titleEn}
                          </span>
                        </div>
                        <span className="rounded bg-slate-200/70 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          %{m.percentage}
                        </span>
                      </div>

                      <div className="mt-2.5 space-y-2">
                        {milestoneCriteria.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-start gap-2 rounded-lg bg-white p-2.5 shadow-sm border border-slate-100 dark:bg-slate-950 dark:border-slate-800/80 text-xs"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            <div className="flex-1">
                              <p className="font-medium text-slate-800 dark:text-slate-200">
                                {isTr ? c.humanCriterionTr : c.humanCriterionEn}
                              </p>
                              {showGherkin && (
                                <div className="mt-1.5 rounded bg-slate-900 p-2 font-mono text-[11px] text-emerald-400 dark:bg-slate-900">
                                  <span className="text-purple-400">GIVEN</span> {isTr ? c.gherkinGivenTr : c.gherkinGivenEn}
                                  <br />
                                  <span className="text-yellow-400">WHEN</span> {isTr ? c.gherkinWhenTr : c.gherkinWhenEn}
                                  <br />
                                  <span className="text-emerald-400">THEN</span> {isTr ? c.gherkinThenTr : c.gherkinThenEn}
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

              <div className="rounded-lg bg-blue-50/70 p-3 text-xs text-blue-800 dark:bg-blue-950/30 dark:text-blue-300 flex items-start gap-2">
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
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/30">
          <div>
            {!isPreviewStep && (
              <button
                type="button"
                onClick={handleSkipToDefaults}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline"
              >
                {isTr ? "Varsayılan Şartlarla Devam Et (Atla)" : "Skip with Standard Defaults"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBack}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                {isTr ? "Geri" : "Back"}
              </Button>
            )}

            {!isPreviewStep ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleNext}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isTr ? "İleri" : "Next"}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleApply}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="mr-1.5 h-4 w-4" />
                {isTr ? "Şartnameyi İlana Uygula" : "Apply Specification to Listing"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
