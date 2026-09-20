"use client";

import { Shield, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import type { DpaRiskLevel } from "@/src/modules/contracts/dpa-types";

export interface DpaBadgeProps {
  level: DpaRiskLevel;
  score?: number;
  locale?: string;
  className?: string;
  onClick?: () => void;
}

export function DpaBadge({
  level,
  score,
  locale = "tr",
  className = "",
  onClick,
}: DpaBadgeProps) {
  const isTr = locale === "tr";

  const config = {
    LOW: {
      label: isTr ? "Düşük Risk (Standart DPA)" : "Low Risk (Standard DPA)",
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15",
      icon: ShieldCheck,
    },
    MEDIUM: {
      label: isTr ? "Orta Risk (Güçlendirilmiş DPA)" : "Medium Risk (Hardened DPA)",
      badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/15",
      icon: Shield,
    },
    HIGH: {
      label: isTr ? "Yüksek Risk (DPIA Önerilir)" : "High Risk (DPIA Recommended)",
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/15",
      icon: AlertTriangle,
    },
    CRITICAL: {
      label: isTr ? "Kritik Risk (DPIA & 2FA Şart)" : "Critical Risk (DPIA & 2FA Required)",
      badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/15",
      icon: ShieldAlert,
    },
  }[level];

  const Icon = config.icon;

  return (
    <span
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border transition-all ${
        onClick ? "cursor-pointer" : ""
      } ${config.badgeClass} ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="opacity-75 font-mono text-[11px]">({score}/100)</span>
      )}
    </span>
  );
}
