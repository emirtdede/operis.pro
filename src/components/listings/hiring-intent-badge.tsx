"use client";

import { Sparkles, ShieldCheck, TrendingUp, AlertTriangle } from "lucide-react";
import type {
  HiringIntentBreakdown,
  HiringIntentLevel,
} from "@/src/modules/listings/hiring-intent/hiring-intent-types";

export interface HiringIntentBadgeProps {
  score?: number;
  level?: HiringIntentLevel;
  breakdown?: HiringIntentBreakdown | null;
  isFirstTimeClient?: boolean;
  compact?: boolean;
  className?: string;
  onClick?: () => void;
  locale?: string;
}

function getHiringIntentDisplay(level: HiringIntentLevel, score: number, isTr: boolean) {
  switch (level) {
    case "VERIFIED_NEW_CLIENT":
      return {
        label: isTr ? `Yeni İşveren (%${score} Güven)` : `Verified New Client (${score}%)`,
        shortLabel: isTr ? "Yeni İşveren" : "New Client",
        badgeClass:
          "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
        dotClass: "bg-emerald-400 animate-pulse",
        Icon: Sparkles,
      };
    case "PROVEN_HIGH_INTENT":
      return {
        label: isTr ? `%${score} İşe Alım Niyeti` : `${score}% High Intent`,
        shortLabel: isTr ? `%${score} Niyet` : `${score}% Intent`,
        badgeClass:
          "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
        dotClass: "bg-emerald-400 animate-pulse",
        Icon: ShieldCheck,
      };
    case "ACTIVE_HIRING_LIKELY":
      return {
        label: isTr ? `%${score} İşe Alım Bekleniyor` : `${score}% Hiring Expected`,
        shortLabel: isTr ? `%${score} Niyet` : `${score}% Intent`,
        badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/15",
        dotClass: "bg-sky-400",
        Icon: TrendingUp,
      };
    case "MODERATE_INTENT":
      return {
        label: isTr ? `%${score} Orta Düzey Niyet` : `${score}% Moderate Intent`,
        shortLabel: isTr ? `%${score} Niyet` : `${score}% Intent`,
        badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/15",
        dotClass: "bg-amber-400",
        Icon: AlertTriangle,
      };
    default:
      return {
        label: isTr ? `%${score} Piyasa Yoklama Riski` : `${score}% Price Discovery Risk`,
        shortLabel: isTr ? `%${score} Riskli` : `${score}% Risk`,
        badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/15",
        dotClass: "bg-rose-400",
        Icon: AlertTriangle,
      };
  }
}

export function HiringIntentBadge({
  score: propScore,
  level: propLevel,
  breakdown,
  compact = false,
  className = "",
  onClick,
  locale = "tr",
}: HiringIntentBadgeProps) {
  const isTr = locale === "tr";

  const effectiveScore = typeof breakdown?.overallScore === "number" ? breakdown.overallScore : (propScore ?? 85);
  const fallbackLevel: HiringIntentLevel = effectiveScore >= 85 ? "PROVEN_HIGH_INTENT" : "ACTIVE_HIRING_LIKELY";
  const effectiveLevel: HiringIntentLevel = breakdown?.level || propLevel || fallbackLevel;

  const { label, shortLabel, badgeClass, dotClass, Icon } = getHiringIntentDisplay(
    effectiveLevel,
    effectiveScore,
    isTr
  );

  const tooltipTitle = isTr
    ? "Operis İşe Alım Niyet Endeksi: Şirket VKN doğrulaması, piyasa benchmark bütçe uyumu ve teknik kapsam zenginliği analizi"
    : "Operis Hiring Intent Index: Evaluates verified company tax ID, market budget alignment, and scope specification richness";

  return (
    <span
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      title={tooltipTitle}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm transition-all select-none ${
        onClick ? "cursor-pointer active:scale-95" : ""
      } ${badgeClass} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotClass}`} />
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{compact ? shortLabel : label}</span>
    </span>
  );
}
