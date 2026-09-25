"use client";

import { useEffect } from "react";
import {
  X,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Building2,
  Coins,
  FileCode,
  History,
  CheckCircle2,
} from "lucide-react";
import type {
  HiringIntentBreakdown,
  PillarType,
} from "@/src/modules/listings/hiring-intent/hiring-intent-types";

export interface HiringIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: HiringIntentBreakdown | null;
  listingTitle?: string;
  locale?: string;
}

export function HiringIntentModal({
  isOpen,
  onClose,
  breakdown,
  listingTitle,
  locale = "tr",
}: HiringIntentModalProps) {
  const isTr = locale === "tr";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !breakdown) return null;

  const score = breakdown.overallScore;

  const pillarIcons: Record<PillarType, typeof Building2> = {
    CORPORATE_VERIFICATION: Building2,
    BUDGET_BENCHMARK: Coins,
    SCOPE_CLARITY: FileCode,
    HISTORICAL_RELIABILITY: History,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hiring-intent-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-6 sm:p-8 shadow-2xl space-y-6 text-[var(--color-text-primary)]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <h2
                id="hiring-intent-modal-title"
                className="text-lg sm:text-xl font-extrabold tracking-tight"
              >
                {isTr ? "İşe Alım Niyet Endeksi Analizi" : "Hiring Intent Index Analysis"}
              </h2>
            </div>
            {listingTitle && (
              <p className="text-xs text-[var(--color-text-secondary)] line-clamp-1">
                {listingTitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Score Hero Banner */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              {isTr ? "Gerçek İşe Alım Olasılık Skoru" : "Hiring Probability Score"}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {isTr ? breakdown.summaryTr : breakdown.summaryEn}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-3 bg-[var(--color-surface-base)]/80 px-4 py-2.5 rounded-2xl border border-[var(--color-border-subtle)] shadow-sm">
            <span className="text-3xl font-black font-mono tracking-tight text-emerald-400">
              %{score}
            </span>
            <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] max-w-[80px] leading-tight">
              {isTr ? breakdown.shortBadgeLabelTr : breakdown.shortBadgeLabelEn}
            </span>
          </div>
        </div>

        {/* Cold-Start Guaranteed Callout for First-Time Employers */}
        {breakdown.isFirstTimeClient && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3 text-xs leading-relaxed">
            <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-400 font-semibold block mb-0.5">
                {isTr ? "Yeni İşveren Güvencesi" : "Verified New Employer Guarantee"}
              </strong>
              <span className="text-[var(--color-text-secondary)]">
                {isTr
                  ? "Bu işveren Operis platformunda ilk ilanını yayınlamaktadır. Operis, kurumsal VKN doğrulamasını ve piyasa bütçe uyumunu teyit ederek yeni işverenlerin güven skorunu yüksek tutar. Bu sayede uzmanlar ilk ilanlara da güvenle teklif verebilir."
                  : "This client is posting their inaugural project on Operis. By verifying corporate credentials and budget feasibility upfront, Operis ensures high standards and fair standing, allowing specialists to bid with high confidence."}
              </span>
            </div>
          </div>
        )}

        {/* 4 Pillars Breakdown */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
            {isTr ? "4 Temel Güven Sütunu ve Puan Dağılımı" : "4 Pillars & Score Breakdown"}
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(breakdown.pillars) as PillarType[]).map((key) => {
              const pillar = breakdown.pillars[key];
              const Icon = pillarIcons[key];
              const pct = Math.round((pillar.score / pillar.maxScore) * 100);

              let barColor = "bg-emerald-500";
              let badgeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
              if (pillar.status === "GOOD") {
                barColor = "bg-sky-500";
                badgeColor = "text-sky-400 bg-sky-500/10 border-sky-500/20";
              } else if (pillar.status === "FAIR") {
                barColor = "bg-amber-500";
                badgeColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
              } else if (pillar.status === "WARNING") {
                barColor = "bg-rose-500";
                badgeColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
              }

              return (
                <div
                  key={key}
                  className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/60 p-4 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-surface-hover)] text-blue-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-xs text-[var(--color-text-primary)]">
                        {isTr ? pillar.nameTr : pillar.nameEn}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}
                    >
                      {pillar.score}/{pillar.maxScore}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                    {isTr ? pillar.explanationTr : pillar.explanationEn}
                  </p>

                  {pillar.signals && pillar.signals.length > 0 && (
                    <ul className="text-[10px] text-[var(--color-text-tertiary)] space-y-1 pt-1 border-t border-[var(--color-border-subtle)]/50">
                      {pillar.signals.map((sig, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{sig}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Penalties Applied (if any) */}
        {breakdown.penaltiesApplied && breakdown.penaltiesApplied.length > 0 && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-rose-400">
              <AlertTriangle className="h-4 w-4" />
              <span>{isTr ? "Uygulanan Risk Kesintileri" : "Risk Deductions Applied"}</span>
            </div>
            <ul className="space-y-1 text-[var(--color-text-secondary)]">
              {breakdown.penaltiesApplied.map((p) => (
                <li key={p.id} className="flex items-start gap-2">
                  <span className="font-mono font-bold text-rose-400 shrink-0">
                    -{p.pointsDeducted}p:
                  </span>
                  <span>{isTr ? p.reasonTr : p.reasonEn}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Freelancer Guidance Box */}
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-1 text-xs">
          <div className="flex items-center gap-2 font-bold text-indigo-400">
            <TrendingUp className="h-4 w-4" />
            <span>{isTr ? "Yazılımcılar ve Uzmanlar İçin Tavsiye" : "Specialist Guidance"}</span>
          </div>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            {isTr ? breakdown.freelancerGuidanceTr : breakdown.freelancerGuidanceEn}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-subtle)] transition-colors cursor-pointer"
          >
            {isTr ? "Kapat" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
