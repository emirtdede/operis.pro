"use client";

import { Laptop, Shield } from "lucide-react";

export interface ActiveSessionsSectionProps {
  locale: string;
}

export function ActiveSessionsSection({ locale }: ActiveSessionsSectionProps) {
  const isTr = locale === "tr";

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-7 space-y-4 shadow-sm">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
        <Laptop className="h-4 w-4 text-emerald-400" aria-hidden="true" />
        <span>
          {isTr ? "Aktif Oturum ve Güvenlik Durumu" : "Active Session & Security Status"}
        </span>
      </h2>

      <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Shield className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-[var(--color-text-primary)]">
              {isTr ? "Mevcut Oturum (Bu Cihaz)" : "Current Session (This Device)"}
            </p>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              {isTr
                ? "HTTP-Only Güvenli Oturum Çerezi ile korunuyor"
                : "Secured with HTTP-Only cookie"}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{isTr ? "Canlı" : "Active"}</span>
        </span>
      </div>
    </div>
  );
}
