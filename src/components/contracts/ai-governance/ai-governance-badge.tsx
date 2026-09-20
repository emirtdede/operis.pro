"use client";

import { ShieldCheck, ShieldAlert, Cpu } from "lucide-react";
import type {
  AiIpRiskLevel,
  AiGovernanceConfig,
} from "@/src/modules/contracts/ai-governance-types";
import { AiGovernanceEngine } from "@/src/modules/contracts/ai-governance-engine";

export interface AiGovernanceBadgeProps {
  level?: AiIpRiskLevel;
  score?: number;
  config?: AiGovernanceConfig | null;
  locale?: string;
  className?: string;
  onClick?: () => void;
}

export function AiGovernanceBadge({
  level,
  score,
  config,
  locale = "tr",
  className = "",
  onClick,
}: AiGovernanceBadgeProps) {
  const isTr = locale === "tr";

  const evalResult = config
    ? AiGovernanceEngine.evaluateAiGovernanceRisk(config)
    : null;

  const effectiveLevel = level || evalResult?.riskLevel || "PRISTINE_IP_SAFE";
  const effectiveScore = score !== undefined ? score : evalResult?.riskScore;

  const badgeConfig = {
    PRISTINE_IP_SAFE: {
      label: isTr ? "FSEK 52 Telif Güvenceli" : "Pristine IP Safe (FSEK Art. 52)",
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15",
      icon: ShieldCheck,
    },
    COMMERCIALLY_VIABLE_MONITORED: {
      label: isTr ? "İnsan Denetimli AI (Standart)" : "Human-in-Loop AI (Viable)",
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/15",
      icon: Cpu,
    },
    COPYRIGHT_CONTAMINATION_HAZARD: {
      label: isTr ? "Telif & Lisans Bulaşma Riski" : "Copyright & Copyleft Hazard",
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
