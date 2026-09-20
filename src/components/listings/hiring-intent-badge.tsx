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
  const effectiveLevel: HiringIntentLevel =
    breakdown?.level || propLevel || (effectiveScore >= 85 ? "PROVEN_HIGH_INTENT" : "ACTIVE_HIRING_LIKELY");

  let label = isTr ? `%${effectiveScore} İşe Alım Niyeti` : `${effectiveScore}% Hiring Intent`;
  let shortLabel = isTr ? `%${effectiveScore} Niyet` : `${effectiveScore}% Intent`;
  let badgeClass = "bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/15";
  let dotClass = "bg-sky-400";
  let Icon = TrendingUp;

  if (effectiveLevel === "VERIFIED_NEW_CLIENT") {
    label = isTr ? `✨ Yeni İşveren (%${effectiveScore} Güven)` : `✨ Verified New Client (${effectiveScore}%)`;
    shortLabel = isTr ? "✨ Yeni İşveren" : "✨ New Client";
    badgeClass =
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15 shadow-[0_0_12px_rgba(16,185,129,0.15)]";
    dotClass = "bg-emerald-400 animate-pulse";
    Icon = Sparkles;
  } else if (effectiveLevel === "PROVEN_HIGH_INTENT") {
    label = isTr ? `🟢 %${effectiveScore} İşe Alım Niyeti` : `🟢 ${effectiveScore}% High Intent`;
    shortLabel = isTr ? `%${effectiveScore} Niyet` : `${effectiveScore}% Intent`;
    badgeClass =
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15 shadow-[0_0_12px_rgba(16,185,129,0.15)]";
    dotClass = "bg-emerald-400 animate-pulse";
    Icon = ShieldCheck;
  } else if (effectiveLevel === "ACTIVE_HIRING_LIKELY") {
    label = isTr ? `🔵 %${effectiveScore} İşe Alım Bekleniyor` : `🔵 ${effectiveScore}% Hiring Expected`;
    shortLabel = isTr ? `%${effectiveScore} Niyet` : `${effectiveScore}% Intent`;
    badgeClass = "bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/15";
    dotClass = "bg-sky-400";
    Icon = TrendingUp;
  } else if (effectiveLevel === "MODERATE_INTENT") {
    label = isTr ? `🟡 %${effectiveScore} Orta Düzey Niyet` : `🟡 ${effectiveScore}% Moderate Intent`;
    shortLabel = isTr ? `%${effectiveScore} Niyet` : `${effectiveScore}% Intent`;
    badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/15";
    dotClass = "bg-amber-400";
    Icon = AlertTriangle;
  } else {
    label = isTr ? `🟠 %${effectiveScore} Piyasa Yoklama Riski` : `🟠 ${effectiveScore}% Price Discovery Risk`;
    shortLabel = isTr ? `%${effectiveScore} Riskli` : `${effectiveScore}% Risk`;
    badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/15";
    dotClass = "bg-rose-400";
    Icon = AlertTriangle;
  }

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
