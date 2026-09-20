"use client";

import { FileText, Layers, XCircle } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { resolveStatusBadgeVariant, resolveStatusBadgeLabel } from "../types";

export interface MatchSummaryCardProps {
  category: string;
  listingTitle: string;
  matchedAt: string | Date;
  currentStatus: string;
  completed: boolean;
  isTr: boolean;
  onOpenContractModal: () => void;
}

export function MatchSummaryCard({
  category,
  listingTitle,
  matchedAt,
  currentStatus,
  completed,
  isTr,
  onOpenContractModal,
}: MatchSummaryCardProps) {
  const matchedDateStr = new Date(matchedAt).toLocaleDateString(
    isTr ? "tr-TR" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div className="space-y-8">
      {/* Header Container */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="secondary">{category}</Badge>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
            <Badge
              variant={resolveStatusBadgeVariant(completed, currentStatus)}
              className={
                currentStatus === "CANCELLED"
                  ? "border-rose-500/40 text-rose-400 bg-rose-500/10"
                  : ""
              }
            >
              {resolveStatusBadgeLabel(completed, currentStatus, isTr)}
            </Badge>
            <span>{matchedDateStr}</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
          {listingTitle}
        </h1>
      </div>

      {/* Cancelled Banner */}
      {currentStatus === "CANCELLED" && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 sm:p-7 shadow-sm space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
            <XCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>
              {isTr ? "Bu İş Birliği İptal Edildi" : "This Collaboration Has Been Cancelled"}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">
            {isTr
              ? "Bu iş birliği taraflardan biri tarafından iptal edilmiştir. İlgili ilan 'Yayında Değil' statüsüne alınmıştır. İlan sahibi paneline girerek ilanı güncelleyebilir veya tek tıkla yeniden yayına alabilir."
              : "This engagement was cancelled by one of the participants. The listing was moved to inactive. The listing owner can edit or reactivate the listing from their dashboard."}
          </p>
        </div>
      )}

      {/* Bilateral Contract Draft Banner */}
      <div className="rounded-3xl border border-blue-500/25 bg-gradient-to-r from-blue-500/10 via-[var(--color-surface-base)] to-blue-500/5 p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>
              {isTr
                ? "1-Tıkla Resmi Hizmet & Fikri Mülkiyet Devir Sözleşmesi"
                : "1-Click Service & IP Transfer Contract"}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
            {isTr
              ? "Operis emanet havuzu tutmaz; 5846 sayılı FSEK ve 6325 sayılı doğrudan arabuluculuk maddeleriyle hukuki zırh sunar. Tek tıkla resmi sözleşmenizi PDF olarak kaydedip yazdırabilirsiniz."
              : "Operis takes zero commission and operates zero escrow. Review and print your official bilateral contract with full IP transfer and mediation clauses."}
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={onOpenContractModal}
          className="gap-2 shrink-0 shadow-md shadow-blue-500/15"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          <span>{isTr ? "Resmi PDF Sözleşmesi Oluştur" : "Generate Official PDF"}</span>
        </Button>
      </div>

      {/* Lightweight 3-Step Milestone Schedule Recommendation */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--color-text-primary)]">
            <Layers className="h-4.5 w-4.5 text-blue-400" aria-hidden="true" />
            <span>
              {isTr
                ? "Tavsiye Edilen 3 Kademeli Avans ve Kilometre Çizelgesi"
                : "Recommended 3-Step Milestone & Advance Schedule"}
            </span>
          </div>
          <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
            {isTr ? "Güvenli İş Birliği Modeli" : "Safe Collaboration Model"}
          </span>
        </div>

        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {isTr
            ? "Platform emanet para tutmaz; ancak serbest çalışanın emeğini, işverenin de teslimatını korumak için aşağıdaki 3 adımlı ödeme çizelgesi tavsiye edilir:"
            : "Platform holds no escrow; following this 3-tier milestone schedule eliminates non-payment and non-delivery risks:"}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>{isTr ? "1. Aşama" : "Phase 1"}</span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 font-mono">%30</span>
            </div>
            <div className="font-semibold text-xs text-[var(--color-text-primary)]">
              {isTr ? "Tasarım ve Mimari Onayı" : "Design & Architecture Approval"}
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-normal">
              {isTr
                ? "Altyapı şablonları ve mimari onaylandığında %30 avans ödenir."
                : "30% initial advance once project architecture and UI are agreed."}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-blue-400">
              <span>{isTr ? "2. Aşama" : "Phase 2"}</span>
              <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 font-mono">%40</span>
            </div>
            <div className="font-semibold text-xs text-[var(--color-text-primary)]">
              {isTr ? "Fonksiyonel Demo ve Test" : "Functional Demo & Testing"}
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-normal">
              {isTr
                ? "Çalışan prototip ve test sürümü sunulduğunda %40 ara ödeme yapılır."
                : "40% interim payment upon milestone demo and functional test."}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-purple-400">
              <span>{isTr ? "3. Aşama" : "Phase 3"}</span>
              <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 font-mono">%30</span>
            </div>
            <div className="font-semibold text-xs text-[var(--color-text-primary)]">
              {isTr ? "Kaynak Kod & FSEK Devri" : "Source Code & IP Transfer"}
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-normal">
              {isTr
                ? "Canlıya alma, kod teslimi ve FSEK mülkiyet devriyle son %30 ödenir."
                : "Final 30% payment upon complete source code handover and deployment."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
