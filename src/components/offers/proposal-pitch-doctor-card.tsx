"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Layers,
  Clock,
  Code2,
  ShieldCheck,
  Target,
  RefreshCw,
  X,
  Plus,
} from "lucide-react";
import { Button } from "../ui/button";
import type { PitchEvaluationResult, ProposalEnhancementResult } from "@/src/modules/ai/pitch-doctor";

export interface ProposalPitchDoctorCardProps {
  listingId: string;
  listingTitle: string;
  proposalMessage: string;
  proposedBudgetMin?: string;
  proposedBudgetMax?: string;
  proposedCurrency?: string;
  proposedTimelineValue?: string;
  proposedTimelineUnit?: string;
  locale?: string;
  onApplyEnhancement: (enhancedText: string) => void;
  onClose?: () => void;
}

export function ProposalPitchDoctorCard({
  listingId,
  listingTitle,
  proposalMessage,
  proposedBudgetMin,
  proposedBudgetMax,
  proposedCurrency,
  proposedTimelineValue,
  proposedTimelineUnit,
  locale = "tr",
  onApplyEnhancement,
  onClose,
}: ProposalPitchDoctorCardProps) {
  const isTr = locale === "tr";

  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<PitchEvaluationResult | null>(null);
  const [enhancement, setEnhancement] = useState<ProposalEnhancementResult | null>(null);
  const [activeTab, setActiveTab] = useState<"analysis" | "enhancement">("analysis");
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const fetchEvaluation = async () => {
    setIsLoading(true);
    setAppliedSuccess(false);

    try {
      const res = await fetch("/api/ai/proposal-pitch-doctor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          listingId,
          message: proposalMessage,
          proposedBudgetMin: proposedBudgetMin ? parseFloat(proposedBudgetMin) : null,
          proposedBudgetMax: proposedBudgetMax ? parseFloat(proposedBudgetMax) : null,
          proposedCurrency,
          proposedTimelineValue: proposedTimelineValue ? parseInt(proposedTimelineValue, 10) : null,
          proposedTimelineUnit,
          fallbackListing: {
            title: listingTitle,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Evaluation failed");
      }

      const data = await res.json();
      if (data.success) {
        setEvaluation(data.evaluation);
        setEnhancement(data.enhancement);
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 65) return "text-blue-400 border-blue-500/30 bg-blue-500/10";
    if (score >= 50) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 65) return "bg-blue-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <section
      aria-label="Operis AI Proposal Pitch Doctor"
      className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-4 sm:p-5 backdrop-blur-xl space-y-4 shadow-lg transition-all animate-in fade-in"
    >
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-indigo-500/10 blur-2xl" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-xs">
            <Sparkles className="h-4 w-4 fill-indigo-400/40 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <span>Operis AI — {isTr ? "Akıllı Teklif Asistanı (Pitch Doctor)" : "Proposal Pitch Doctor"}</span>
            </h4>
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              {isTr
                ? "İlanın teknik gereksinimlerini tarayarak teklif gücünüzü değerlendirir."
                : "Scans project requirements to score and optimize proposal conversion."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={fetchEvaluation}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
            title={isTr ? "Yeniden Değerlendir" : "Re-evaluate"}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
              title={isTr ? "Kapat" : "Close"}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {(() => {
        if (isLoading) {
          return (
            <div className="py-8 text-center space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-400 mx-auto" />
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                {isTr
                  ? "Teklif mimarisi ve ilan gereksinimleri analiz ediliyor..."
                  : "Analyzing proposal architecture and project specifications..."}
              </p>
            </div>
          );
        }
        if (!evaluation) return null;
        return (
          <div className="space-y-4 relative z-10">
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80">
            {/* Score Number Gauge */}
            <div className="sm:col-span-4 flex items-center gap-3">
              <div
                className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-xl border text-xl font-mono font-extrabold ${getScoreColor(
                  evaluation.overallScore
                )}`}
              >
                {evaluation.overallScore}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold tracking-wider block">
                  {isTr ? "Teklif Gücü Puanı" : "Pitch Strength"}
                </span>
                <span className="text-xs font-bold text-[var(--color-text-primary)] truncate block">
                  {evaluation.tierLabel}
                </span>
              </div>
            </div>

            {/* Score Description */}
            <div className="sm:col-span-8 text-xs text-[var(--color-text-secondary)] leading-relaxed border-t sm:border-t-0 sm:border-l border-[var(--color-border-subtle)] pt-2 sm:pt-0 sm:pl-3">
              {evaluation.tierDescription}
            </div>
          </div>

          {/* Sub-Tabs: Analiz & Puanlar vs 1-Tıkla Güçlendirme */}
          <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] pb-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("analysis")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === "analysis"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {isTr ? "📊 5 Boyutlu Analiz" : "📊 5-Dimension Audit"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("enhancement")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "enhancement"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>{isTr ? "✨ 1-Tıkla Güçlendirme" : "✨ 1-Click Enhancement"}</span>
            </button>
          </div>

          {/* TAB 1: 5-Dimension Audit */}
          {activeTab === "analysis" && (
            <div className="space-y-3.5">
              {/* Dimensions Progress Bars */}
              <div className="space-y-2 text-xs">
                {evaluation.dimensions.map((dim) => (
                  <div key={dim.id} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                        {dim.id === "architecture" && <Code2 className="h-3 w-3 text-blue-400" />}
                        {dim.id === "milestones" && <Layers className="h-3 w-3 text-purple-400" />}
                        {dim.id === "timeline" && <Clock className="h-3 w-3 text-cyan-400" />}
                        {dim.id === "client_focus" && <Target className="h-3 w-3 text-amber-400" />}
                        {dim.id === "professionalism" && <ShieldCheck className="h-3 w-3 text-emerald-400" />}
                        <span>{dim.label}</span>
                      </span>
                      <span className="font-mono font-bold text-[var(--color-text-secondary)]">
                        {dim.score}/100
                      </span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${getProgressColor(
                          dim.score
                        )}`}
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">{dim.feedback}</p>
                  </div>
                ))}
              </div>

              {/* Red Flags & Critical Warnings */}
              {evaluation.redFlags.length > 0 && (
                <div className="p-3 rounded-xl border border-rose-500/25 bg-rose-500/10 space-y-1.5 text-xs text-rose-300">
                  <div className="font-bold flex items-center gap-1.5 text-rose-400">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{isTr ? "Kritik İpuçları (Kazanma Şansını Düşüren Unsurlar)" : "Critical Red Flags"}</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {evaluation.redFlags.map((rf, idx) => (
                      <li key={idx}>{rf}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strengths & Actionable Tips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {evaluation.strengths.length > 0 && (
                  <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1 text-emerald-300">
                    <span className="font-semibold text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{isTr ? "Güçlü Noktalarınız" : "Strengths"}</span>
                    </span>
                    <ul className="text-[11px] space-y-0.5 list-disc pl-3">
                      {evaluation.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.actionableTips.length > 0 && (
                  <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1 text-amber-300">
                    <span className="font-semibold text-[11px] text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{isTr ? "Operis AI Önerileri" : "Actionable Tips"}</span>
                    </span>
                    <ul className="text-[11px] space-y-0.5 list-disc pl-3">
                      {evaluation.actionableTips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 1-Click Enhancement Snippet */}
          {activeTab === "enhancement" && enhancement && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 space-y-2">
                <span className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5 text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span>
                    {isTr
                      ? "İlan Gereksinimlerine Özel Önerilen Mimari & Teslimat Planı"
                      : "Tailored Architecture & Milestones Roadmap"}
                  </span>
                </span>
                <pre className="whitespace-pre-wrap font-sans text-[11px] text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-surface-base)]/90 p-3 rounded-lg border border-[var(--color-border-subtle)] max-h-56 overflow-y-auto">
                  {enhancement.fullEnhancedMessage}
                </pre>
              </div>

              {appliedSuccess ? (
                <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {isTr
                      ? "Önerilen mimari ve teslimat fazları teklif metninize başarıyla eklendi!"
                      : "Enhanced architecture and milestones have been inserted into your proposal!"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onApplyEnhancement(enhancement.fullEnhancedMessage);
                      setAppliedSuccess(true);
                      setTimeout(() => fetchEvaluation(), 400);
                    }}
                    className="text-xs font-semibold h-8 px-4 gap-1.5 cursor-pointer shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isTr ? "Teklife Entegre Et (1-Tıkla Ekle)" : "Insert into Proposal"}</span>
                  </Button>
                </div>
              )}
            </div>
          )}
          </div>
        );
      })()}
    </section>
  );
}
