"use client";

import { Sparkles, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "./button";

export interface DraftRecoveryBarProps {
  isOpen: boolean;
  draftTitle?: string;
  locale: string;
  onRestore: () => void;
  onDiscard: () => void;
  onDismiss: () => void;
}

export function DraftRecoveryBar({
  isOpen,
  draftTitle,
  locale,
  onRestore,
  onDiscard,
  onDismiss,
}: DraftRecoveryBarProps) {
  if (!isOpen) return null;

  const isTr = locale === "tr";

  return (
    <div
      role="region"
      aria-label={isTr ? "Taslak Kurtarma Bildirimi" : "Draft Recovery Alert"}
      className="relative rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/5 p-4 sm:p-5 shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2"
    >
      {/* Top right close button */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label={isTr ? "Bildirimi Kapat" : "Dismiss Notice"}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pr-7 sm:pr-8">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/15 text-blue-400">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {isTr ? "Yarım Kalan İlan Taslağınız Bulundu" : "Unsaved Draft Discovered"}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
              {draftTitle ? (
                <span>
                  &ldquo;<strong className="text-[var(--color-text-primary)]">{draftTitle}</strong>
                  &rdquo;{" "}
                  {isTr
                    ? "başlıklı taslağınıza kaldığınız yerden devam edebilirsiniz."
                    : "can be restored to pick up right where you left off."}
                </span>
              ) : (
                <span>
                  {isTr
                    ? "Daha önce girdiğiniz ilan detaylarına kaldığınız yerden devam edebilirsiniz."
                    : "You have a previously entered draft that can be restored."}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onRestore}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm cursor-pointer shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isTr ? "Taslağı Geri Yükle" : "Restore Draft"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDiscard}
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-red-400 hover:border-red-500/30 cursor-pointer shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isTr ? "Temizle" : "Discard"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
