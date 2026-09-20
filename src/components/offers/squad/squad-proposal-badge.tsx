"use client";

import { Users } from "lucide-react";

export interface SquadProposalBadgeProps {
  memberCount?: number;
  squadTitle?: string | null;
  locale?: string;
  size?: "sm" | "md";
  className?: string;
}

function getSquadMemberCountLabel(memberCount: number | undefined, isTr: boolean): string {
  if (memberCount && memberCount > 0) {
    return isTr ? `${memberCount} Uzman` : `${memberCount} Experts`;
  }
  return isTr ? "Çevik Ekip" : "Squad";
}

function getSquadBadgeTitle(squadTitle: string | null | undefined, isTr: boolean): string {
  if (squadTitle) {
    const prefix = isTr ? "Kolektif Ekip" : "Consortium Squad";
    return `${prefix}: ${squadTitle}`;
  }
  return isTr ? "Çevik Ekip / Kolektif Ortak Teklif" : "Fractional Squad Proposal";
}

export function SquadProposalBadge({
  memberCount,
  squadTitle,
  locale = "tr",
  size = "md",
  className = "",
}: SquadProposalBadgeProps) {
  const isTr = locale === "tr";

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2 py-0.5 gap-1.5"
      : "text-xs px-2.5 py-1 gap-2 font-medium";

  const countLabel = getSquadMemberCountLabel(memberCount, isTr);

  return (
    <span
      className={`inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 border border-indigo-500/30 text-indigo-300 shadow-xs backdrop-blur-sm ${sizeClasses} ${className}`}
      title={getSquadBadgeTitle(squadTitle, isTr)}
    >
      <Users className={size === "sm" ? "h-3 w-3 text-indigo-400" : "h-3.5 w-3.5 text-indigo-400"} />
      <span className="font-semibold tracking-wide">
        {squadTitle || (isTr ? "👥 Çevik Kolektif" : "👥 Agile Squad")}
      </span>
      <span className="text-indigo-400/80 font-normal">
        ({countLabel})
      </span>
    </span>
  );
}
