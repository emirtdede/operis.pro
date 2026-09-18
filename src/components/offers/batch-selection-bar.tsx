"use client";

import { Layers, Send, X, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

export interface BatchSelectionBarProps {
  selectedCount: number;
  maxLimit?: number;
  locale: string;
  onClear: () => void;
  onOpenWizard: () => void;
  onExitBatchMode?: () => void;
}

export function BatchSelectionBar({
  selectedCount,
  maxLimit = 5,
  locale,
  onClear,
  onOpenWizard,
  onExitBatchMode,
}: BatchSelectionBarProps) {
  const isTr = locale === "tr";
  const isMaxReached = selectedCount >= maxLimit;

  if (selectedCount === 0 && !onExitBatchMode) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-2.5 sm:px-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/95 backdrop-blur-2xl p-2.5 sm:p-4 shadow-2xl shadow-blue-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
        {/* Left Side: Count & Limit Status */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-[var(--color-text-primary)] text-xs sm:text-sm whitespace-nowrap">
                  {selectedCount}{" "}
                  <span className="text-[11px] sm:text-xs font-normal text-[var(--color-text-secondary)]">
                    / {maxLimit} {isTr ? "İlan" : "Selected"}
                  </span>
                </span>
                {isMaxReached && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    <AlertCircle className="h-2.5 w-2.5" />
                    {isTr ? "Limit Doldu" : "Limit Reached"}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--color-text-tertiary)] hidden md:block">
                {isTr
                  ? "Tek seferde en fazla 5 ilana güvenli teklif iletebilirsiniz."
                  : "You can submit proposals to up to 5 listings simultaneously."}
              </p>
            </div>
          </div>

          {/* Mobile-Only Top Actions */}
          <div className="flex sm:hidden items-center gap-1 shrink-0">
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="px-2 py-1 rounded-lg text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              >
                {isTr ? "Temizle" : "Clear"}
              </button>
            )}
            {onExitBatchMode && (
              <button
                type="button"
                onClick={onExitBatchMode}
                className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                title={isTr ? "Kapat" : "Close"}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side / Bottom Action: Primary Submit Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="hidden sm:inline-flex px-3 py-2 rounded-xl text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            >
              {isTr ? "Temizle" : "Clear"}
            </button>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={onOpenWizard}
            disabled={selectedCount === 0}
            className="w-full sm:w-auto font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 h-9 sm:h-10 text-xs sm:text-sm"
          >
            <Send className="h-3.5 w-3.5" />
            <span>
              {isTr ? `Toplu Teklif Ver (${selectedCount})` : `Submit Batch (${selectedCount})`}
            </span>
          </Button>

          {onExitBatchMode && (
            <button
              type="button"
              onClick={onExitBatchMode}
              className="hidden sm:inline-flex p-2 rounded-xl text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer ml-1"
              title={isTr ? "Toplu Moddan Çık" : "Exit Batch Mode"}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
