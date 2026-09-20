"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Code2,
  Check,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { ContractAcceptanceCriterion } from "@/src/modules/contracts/acceptance-types";

export interface AcceptanceCriteriaChecklistProps {
  criteria: ContractAcceptanceCriterion[];
  locale?: "tr" | "en";
  mode?: "read_only" | "interactive_inspection";
  evaluations?: Record<string, { passed: boolean; failureReason?: string }>;
  onEvaluationChange?: (
    criterionId: string,
    passed: boolean,
    failureReason?: string
  ) => void;
  title?: string;
  showPhases?: boolean;
}

function getGherkinButtonLabel(showGherkin: boolean, isTr: boolean): string {
  if (showGherkin) {
    return isTr ? "Sade Dil" : "Plain Language";
  }
  return isTr ? "Teknik BDD Formatı" : "BDD Format";
}

function getPhaseTitle(phase: number, isTr: boolean): string {
  if (phase === 1) {
    return isTr ? "Faz 1: Altyapı & Yetkilendirme" : "Phase 1: Scaffolding & Auth";
  }
  if (phase === 2) {
    return isTr ? "Faz 2: Çekirdek İş Mantığı & Entegrasyonlar" : "Phase 2: Core Logic & Integrations";
  }
  return isTr ? "Faz 3: Çıktı, Raporlama & Canlıya Alma" : "Phase 3: Output, Tests & Production";
}

function getCriterionToggleTitle(isPassed: boolean, isTr: boolean): string {
  if (isPassed) {
    return isTr ? "Kriter Sağlandı (Tıkla ve Kusur Bildir)" : "Passed (Click to report defect)";
  }
  return isTr ? "Kriter Sağlanamadı (Tıkla ve Onayla)" : "Failed (Click to pass)";
}

export function AcceptanceCriteriaChecklist({
  criteria,
  locale = "tr",
  mode = "read_only",
  evaluations = {},
  onEvaluationChange,
  title,
  showPhases = true,
}: AcceptanceCriteriaChecklistProps) {
  const isTr = locale === "tr";
  const isInteractive = mode === "interactive_inspection";

  const [showGherkin, setShowGherkin] = useState(false);
  const [activeFailureInputId, setActiveFailureInputId] = useState<string | null>(null);
  const [tempFailureReason, setTempFailureReason] = useState("");

  if (!criteria || criteria.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {isTr
          ? "Bu iş için henüz özel kabul kriteri tanımlanmamıştır (Standart teslimat koşulları geçerlidir)."
          : "No specific acceptance criteria defined (Standard delivery terms apply)."}
      </div>
    );
  }

  const handleTogglePass = (criterionId: string, currentPassed: boolean) => {
    if (!isInteractive || !onEvaluationChange) return;

    if (currentPassed) {
      // Toggle to failed: open reason input
      setActiveFailureInputId(criterionId);
      setTempFailureReason("");
    } else {
      // Toggle to passed
      setActiveFailureInputId(null);
      onEvaluationChange(criterionId, true, undefined);
    }
  };

  const handleSaveFailureReason = (criterionId: string) => {
    if (!onEvaluationChange) return;
    onEvaluationChange(criterionId, false, tempFailureReason.trim() || "Kriter sağlanamadı.");
    setActiveFailureInputId(null);
  };

  // Group by phase
  const phases = [1, 2, 3];

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
              {title || (isTr ? "Objektif Teslimat ve Kabul Kriterleri" : "Objective Acceptance Criteria")}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isTr
                ? "TBK m. 470/474 uyarınca teslimat ayıpsızlık muayenesine esas teşkil eden maddeler."
                : "Contractual baseline for statutory inspection pursuant to TBK Art. 474."}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowGherkin(!showGherkin)}
          className="h-7 text-xs px-2.5"
        >
          <Code2 className="mr-1.5 h-3.5 w-3.5" />
          {getGherkinButtonLabel(showGherkin, isTr)}
        </Button>
      </div>

      {/* Criteria Items */}
      {showPhases ? (
        <div className="space-y-3">
          {phases.map((phase) => {
            const phaseCriteria = criteria.filter((c) => c.phaseNumber === phase);
            if (phaseCriteria.length === 0) return null;

            const phaseTitle = getPhaseTitle(phase, isTr);

            return (
              <div
                key={phase}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/40"
              >
                <div className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white">
                    {phase}
                  </span>
                  {phaseTitle}
                </div>

                <div className="space-y-2">
                  {phaseCriteria.map((c) => renderCriterionItem(c))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {criteria.map((c) => renderCriterionItem(c))}
        </div>
      )}
    </div>
  );

  function renderCriterionItem(criterion: ContractAcceptanceCriterion) {
    const evaluation = evaluations[criterion.id];
    const isPassed = evaluation ? evaluation.passed : true; // default true if not evaluated yet
    const hasFailed = evaluation && !evaluation.passed;
    const isEditingReason = activeFailureInputId === criterion.id;

    return (
      <div
        key={criterion.id}
        className={`rounded-lg border p-3 transition-all ${
          hasFailed
            ? "border-rose-300 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/20"
            : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
        }`}
      >
        <div className="flex items-start gap-3">
          {isInteractive ? (
            <button
              type="button"
              onClick={() => handleTogglePass(criterion.id, isPassed)}
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                isPassed
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-rose-600 bg-rose-600 text-white"
              }`}
              title={getCriterionToggleTitle(isPassed, isTr)}
            >
              {isPassed ? (
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          )}

          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {isTr ? criterion.humanCriterionTr : criterion.humanCriterionEn}
              </span>
              {hasFailed && (
                <span className="shrink-0 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  {isTr ? "KUSURLU BULUNDU" : "DEFECT FLAGGED"}
                </span>
              )}
            </div>

            {/* Gherkin Code View Toggle */}
            {showGherkin && (
              <div className="mt-2 rounded bg-slate-900 p-2 font-mono text-[11px] text-emerald-400 dark:bg-slate-900">
                <span className="text-purple-400">GIVEN</span> {isTr ? criterion.gherkinGivenTr : criterion.gherkinGivenEn}
                <br />
                <span className="text-yellow-400">WHEN</span> {isTr ? criterion.gherkinWhenTr : criterion.gherkinWhenEn}
                <br />
                <span className="text-emerald-400">THEN</span> {isTr ? criterion.gherkinThenTr : criterion.gherkinThenEn}
              </div>
            )}

            {/* Failure Reason Display */}
            {hasFailed && evaluation?.failureReason && !isEditingReason && (
              <div className="mt-2 rounded-md bg-rose-100/70 p-2 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                <span className="font-semibold">{isTr ? "Gerekçe:" : "Reason:"} </span>
                {evaluation.failureReason}
              </div>
            )}

            {/* Failure Reason Input Box for Inspection */}
            {isEditingReason && (
              <div className="mt-2.5 rounded-lg border border-rose-200 bg-white p-2.5 dark:border-rose-900 dark:bg-slate-900 space-y-2">
                <label className="block text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                  {isTr
                    ? "Bu şartın neden sağlanamadığını açıklayın (Somut Hata / Eksiklik):"
                    : "Specify how this criterion was not met (Concrete Defect):"}
                </label>
                <textarea
                  value={tempFailureReason}
                  onChange={(e) => setTempFailureReason(e.target.value)}
                  placeholder={
                    isTr
                      ? "Örn: Excel İndir butonuna basıldığında dosya inmiyor, tarayıcı 500 hatası veriyor."
                      : "E.g.: Clicking the button throws 500 error instead of downloading the file."
                  }
                  rows={2}
                  className="w-full rounded border border-slate-200 p-1.5 text-xs text-slate-800 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveFailureInputId(null)}
                    className="h-6 text-[11px] px-2"
                  >
                    {isTr ? "Vazgeç" : "Cancel"}
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleSaveFailureReason(criterion.id)}
                    className="h-6 text-[11px] px-2.5 bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    {isTr ? "Kusuru Kaydet" : "Save Defect"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
