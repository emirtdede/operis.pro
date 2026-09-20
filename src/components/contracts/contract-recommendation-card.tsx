"use client";

import { Sparkles, Check, Plus, ShieldCheck, FileText, AlertCircle, Info } from "lucide-react";
import type { ContractRecommendationItem } from "@/src/modules/contracts/recommendation-types";

interface ContractRecommendationCardProps {
  allContracts: ContractRecommendationItem[];
  selectedContractIds: string[];
  onToggleContract: (id: string) => void;
  isReadOnly?: boolean;
  locale?: string;
}

export function ContractRecommendationCard({
  allContracts,
  selectedContractIds,
  onToggleContract,
  isReadOnly = false,
  locale = "tr",
}: ContractRecommendationCardProps) {
  const isTr = locale === "tr";

  const recommended = allContracts.filter((c) => c.status === "RECOMMENDED");
  const optionalOrOther = allContracts.filter((c) => c.status !== "RECOMMENDED");

  return (
    <div className="space-y-4">
      {/* Smart Engine Header */}
      <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {isTr ? "Akıllı Sözleşme Öneri Motoru" : "Smart Contract Recommendation Engine"}
            </h4>
            <p className="text-xs text-[var(--color-text-muted)]">
              {isTr
                ? "Sistem, ilan detaylarını analiz ederek yalnızca bu iş için kanunen ve operasyonel olarak gerekli sözleşmeleri seçili getirmiştir."
                : "The engine analyzed the listing to pre-select only legally necessary agreements for your exact scope."}
            </p>
          </div>
        </div>
      </div>

      {/* Recommended Contracts Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {isTr ? "İlanınız İçin Önerilen Sözleşmeler" : "Recommended Agreements For This Scope"}
            </h5>
          </div>
          <span className="text-xs text-[var(--color-text-muted)]">
            {recommended.filter((c) => selectedContractIds.includes(c.id)).length} / {recommended.length} {isTr ? "seçili" : "selected"}
          </span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-1">
          {recommended.map((contract) => {
            const isSelected = selectedContractIds.includes(contract.id);
            return (
              <div
                key={contract.id}
                onClick={() => {
                  if (!isReadOnly && !contract.isBaseAgreement) {
                    onToggleContract(contract.id);
                  }
                }}
                className={`relative flex items-start justify-between rounded-xl border p-3.5 transition-all ${
                  isSelected
                    ? "border-emerald-500/30 bg-emerald-500/5 shadow-sm"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] opacity-70"
                } ${!isReadOnly && !contract.isBaseAgreement ? "cursor-pointer hover:border-emerald-500/50" : ""}`}
              >
                <div className="space-y-1.5 pr-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-xs text-[var(--color-text-primary)]">
                      {isTr ? contract.titleTr : contract.titleEn}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      {isTr ? "✨ Önerilen" : "✨ Recommended"}
                    </span>
                    {contract.isBaseAgreement && (
                      <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                        {isTr ? "Temel Omurga" : "Base Agreement"}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {isTr ? contract.descriptionTr : contract.descriptionEn}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[var(--color-text-muted)]">
                    <span className="rounded bg-black/20 px-1.5 py-0.5 text-[10px]">
                      {isTr ? contract.statutoryBasisTr : contract.statutoryBasisEn}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400/90 text-[10px]">
                      <Info className="h-3 w-3" />
                      {isTr ? contract.recommendationReasonTr : contract.recommendationReasonEn}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pt-0.5">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500 text-black font-bold"
                        : "border-[var(--color-border-subtle)] bg-transparent"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Optional Add-on Contracts */}
      {optionalOrOther.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                {isTr ? "İsteğe Bağlı Ek Sözleşmeler (Opsiyonel)" : "Optional Add-On Agreements"}
              </h5>
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">
              {isTr ? "Dilediğiniz sözleşmeyi pakete ekleyebilirsiniz" : "You can add any agreement to package"}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-1">
            {optionalOrOther.map((contract) => {
              const isSelected = selectedContractIds.includes(contract.id);
              const isNotApplicable = contract.status === "NOT_APPLICABLE";

              return (
                <div
                  key={contract.id}
                  onClick={() => {
                    if (!isReadOnly) onToggleContract(contract.id);
                  }}
                  className={`relative flex items-start justify-between rounded-xl border p-3 transition-all ${
                    isSelected
                      ? "border-indigo-500/40 bg-indigo-500/10 shadow-sm"
                      : "border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/60 hover:border-[var(--color-border-hover)]"
                  } ${!isReadOnly ? "cursor-pointer" : ""}`}
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-xs text-[var(--color-text-primary)]">
                        {isTr ? contract.titleTr : contract.titleEn}
                      </span>
                      {isNotApplicable ? (
                        <span className="inline-flex items-center rounded-full bg-zinc-500/20 px-2 py-0.5 text-[10px] text-zinc-400">
                          {isTr ? "Gerekli Değil" : "Not Applicable"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-300">
                          {isTr ? "İsteğe Bağlı" : "Optional"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      {isTr ? contract.descriptionTr : contract.descriptionEn}
                    </p>
                    <div className="text-[10px] text-[var(--color-text-muted)]">
                      {isTr ? contract.recommendationReasonTr : contract.recommendationReasonEn}
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500 text-white"
                          : "border-[var(--color-border-subtle)] bg-transparent"
                      }`}
                    >
                      {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3 w-3 text-zinc-400" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Safe Harbor Legal Notice Footer */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-300/90 flex items-start gap-2.5">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <p className="font-medium">
            {isTr
              ? "Platform Sorumsuzluğu ve Sözleşme Özgürlüğü (TBK m. 26 & 5651 Sayılı Kanun):"
              : "Platform Immunity & Freedom of Contract:"}
          </p>
          <p className="mt-0.5 text-[var(--color-text-muted)] leading-relaxed">
            {isTr
              ? "Operis sözleşmenin tarafı, işvereni veya garantörü değildir; yalnızca bağımsız yer sağlayıcıdır. Sözleşmeler %100 opsiyoneldir. Tüm hak ve borçlar münhasıran iki taraf arasında geçerlidir."
              : "Operis is solely an independent venue provider and is not a party or guarantor. Contracts are 100% voluntary; all liabilities remain strictly bilateral."}
          </p>
        </div>
      </div>
    </div>
  );
}
