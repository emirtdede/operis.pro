"use client";

import Link from "next/link";
import { LogIn, X } from "lucide-react";

export interface CategoryAuthNoticeProps {
  isOpen: boolean;
  onClose: () => void;
  isTr: boolean;
  loginUrl: string;
}

export function CategoryAuthNotice({
  isOpen,
  onClose,
  isTr,
  loginUrl,
}: CategoryAuthNoticeProps) {
  if (!isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[calc(100%-2rem)] p-4 rounded-2xl bg-[var(--color-surface-base)]/95 backdrop-blur-xl border border-blue-500/40 shadow-2xl shadow-blue-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
          <LogIn className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-[var(--color-text-primary)]">
            {isTr ? "Giriş Yapmanız Gerekiyor" : "Authentication Required"}
          </p>
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-tight">
            {isTr
              ? "Kategorileri takip etmek ve özel akış oluşturmak için lütfen giriş yapın."
              : "Please sign in to follow categories and personalize your project feed."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <Link
          href={loginUrl}
          className="inline-flex items-center justify-center h-8 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {isTr ? "Giriş Yap" : "Sign In"}
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="h-8 w-8 rounded-xl flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
          aria-label={isTr ? "Kapat" : "Dismiss"}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
