"use client";

import { Loader2, AlertCircle } from "lucide-react";
import type { GeneratedContractResult, ContractLanguage } from "@/src/modules/contracts/types";

export interface ContractBilingualViewerProps {
  isLoading: boolean;
  fetchError: string | null;
  activeLang: ContractLanguage;
  contractData: GeneratedContractResult | null;
  listingTitle: string;
  isTr: boolean;
}

export function ContractBilingualViewer({
  isLoading,
  fetchError,
  activeLang,
  contractData,
  listingTitle,
  isTr,
}: ContractBilingualViewerProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="text-xs text-[var(--color-text-secondary)]">
          {isTr
            ? "Resmi sözleşme ve SHA-256 mührü hesaplanıyor..."
            : "Generating statutory contract & SHA-256 seal..."}
        </span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>{fetchError}</div>
      </div>
    );
  }

  if (activeLang === "bilingual" && contractData?.bilingualClauses) {
    return (
      <div
        id="opr-printable-contract"
        className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 sm:p-4 max-h-[350px] overflow-y-auto space-y-3 shadow-inner"
      >
        <div className="grid grid-cols-2 gap-3 p-2 bg-[var(--color-surface-hover)] rounded-lg text-xs font-bold text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-1.5">
            <span>🇹🇷 SOL SÜTUN (TÜRKÇE - RESMİ METİN)</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-400">
            <span>🇬🇧 SAĞ SÜTUN (ENGLISH - TRANSLATION)</span>
          </div>
        </div>
        {contractData.bilingualClauses.map((clause) => (
          <div
            key={clause.id}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] text-[11px] leading-relaxed"
          >
            <div className="border-b sm:border-b-0 sm:border-r border-[var(--color-border-subtle)] sm:pr-3">
              <div className="font-bold text-[var(--color-text-primary)] mb-1">
                {clause.articleNumber ? `${clause.articleNumber}: ` : ""}
                {clause.titleTr}
              </div>
              <div className="text-[var(--color-text-secondary)] whitespace-pre-wrap">
                {clause.bodyTr}
              </div>
            </div>
            <div className="sm:pl-1">
              <div className="font-bold text-blue-400 mb-1">
                {clause.articleNumber ? `${clause.articleNumber}: ` : ""}
                {clause.titleEn}
              </div>
              <div className="text-[var(--color-text-secondary)] whitespace-pre-wrap">
                {clause.bodyEn}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      id="opr-printable-contract"
      className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 sm:p-5 font-mono text-[11px] sm:text-xs text-[var(--color-text-primary)] leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap select-all shadow-inner"
    >
      {contractData ? contractData.plainText : listingTitle}
    </div>
  );
}
