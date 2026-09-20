"use client";

import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import type { SafeHarborRiskLevel, SafeHarborConfig } from "@/src/modules/contracts/safe-harbor-types";
import { SafeHarborEngine } from "@/src/modules/contracts/safe-harbor-engine";

export interface SafeHarborBadgeProps {
  level?: SafeHarborRiskLevel;
  score?: number;
  config?: SafeHarborConfig | null;
  locale?: string;
  className?: string;
  onClick?: () => void;
}

export function SafeHarborBadge({
  level,
  score,
  config: safeHarborConfig,
  locale = "tr",
  className = "",
  onClick,
}: SafeHarborBadgeProps) {
  const isTr = locale === "tr";

  const evalResult = safeHarborConfig
    ? SafeHarborEngine.evaluateMisclassificationRisk(safeHarborConfig)
    : null;

  const effectiveLevel = level || evalResult?.riskLevel || "SAFE_HARBOR";
  const effectiveScore = score !== undefined ? score : evalResult?.riskScore;

  const badgeConfig = {
    SAFE_HARBOR: {
      label: isTr ? "Güvenli Liman (İş K. 8 Uyumlu)" : "Safe Harbor (Labor Law Art. 8 Compliant)",
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15",
      icon: ShieldCheck,
    },
    MODERATE_WARNING: {
      label: isTr ? "Orta Risk (Önlem Şartnamesi)" : "Moderate Warning (Mitigation Needed)",
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/15",
      icon: AlertTriangle,
    },
    CRITICAL_HAZARD: {
      label: isTr ? "Yüksek Gizli İstihdam Riski" : "Critical Misclassification Hazard",
      badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/15",
      icon: ShieldAlert,
    },
  }[effectiveLevel];

  const Icon = badgeConfig.icon;

  return (
    <span
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border transition-all ${
        onClick ? "cursor-pointer" : ""
      } ${badgeConfig.badgeClass} ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{badgeConfig.label}</span>
      {effectiveScore !== undefined && (
        <span className="opacity-75 font-mono text-[11px]">({effectiveScore}/100)</span>
      )}
    </span>
  );
}
