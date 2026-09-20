"use client";

import { Globe, AlertTriangle, ShieldCheck } from "lucide-react";
import type {
  ExportEligibilityStatus,
  SoftwareExportConfig,
} from "@/src/modules/finance/software-export-types";
import { SoftwareExportEngine } from "@/src/modules/finance/software-export-engine";

export interface SoftwareExportBadgeProps {
  status?: ExportEligibilityStatus;
  config?: SoftwareExportConfig | null;
  locale?: string;
  className?: string;
  compact?: boolean;
  onClick?: () => void;
}

type BadgeConfigItem = {
  label: string;
  shortLabel: string;
  badgeClass: string;
  icon: typeof ShieldCheck;
  dotClass: string;
};

const BADGE_MAP: Record<ExportEligibilityStatus, (isTr: boolean) => BadgeConfigItem> = {
  FULLY_ELIGIBLE: (isTr) => ({
    label: isTr
      ? "Yazılım İhracatı: %0 KDV & GVK 89/13 %100 İndirim"
      : "Software Export: 0% VAT & 100% Tax Deduction",
    shortLabel: isTr ? "%0 KDV & GVK 89/13" : "0% VAT (GVK 89/13)",
    badgeClass:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
    icon: ShieldCheck,
    dotClass: "bg-emerald-400 animate-pulse",
  }),
  ELIGIBLE_FULL_INCENTIVE: (isTr) => ({
    label: isTr
      ? "Yazılım İhracatı: %0 KDV & GVK 89/13 %100 İndirim"
      : "Software Export: 0% VAT & 100% Tax Deduction",
    shortLabel: isTr ? "%0 KDV & GVK 89/13" : "0% VAT (GVK 89/13)",
    badgeClass:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
    icon: ShieldCheck,
    dotClass: "bg-emerald-400 animate-pulse",
  }),
  CONDITIONALLY_ELIGIBLE: (isTr) => ({
    label: isTr
      ? "Yazılım İhracatı (Döviz Tevsiki Bekleniyor)"
      : "Software Export (Repatriation Pending)",
    shortLabel: isTr ? "İhracat (Şartlı)" : "Export (Pending)",
    badgeClass:
      "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/15",
    icon: Globe,
    dotClass: "bg-amber-400",
  }),
  COMPLIANCE_DEFICIT_WARNING: (isTr) => ({
    label: isTr
      ? "Yazılım İhracatı (Tevsik Eksikliği)"
      : "Software Export (Deficit Warning)",
    shortLabel: isTr ? "İhracat (Eksik)" : "Deficit Warning",
    badgeClass:
      "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/15",
    icon: AlertTriangle,
    dotClass: "bg-amber-400",
  }),
  NON_COMPLIANT: (isTr) => ({
    label: isTr
      ? "İhracat İstisnası Uygulanamaz"
      : "Export Exemption Ineligible",
    shortLabel: isTr ? "İhracat Dışı" : "Ineligible",
    badgeClass:
      "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/15",
    icon: AlertTriangle,
    dotClass: "bg-rose-400",
  }),
  DOMESTIC_STANDARD_TAX: (isTr) => ({
    label: isTr
      ? "Yurt İçi Standart Vergi Rejimi"
      : "Domestic Standard Tax Regime",
    shortLabel: isTr ? "Standart Rejim" : "Standard Regime",
    badgeClass:
      "bg-slate-500/10 text-slate-400 border-slate-500/30 hover:bg-slate-500/15",
    icon: AlertTriangle,
    dotClass: "bg-slate-400",
  }),
};

export function SoftwareExportBadge({
  status,
  config,
  locale = "tr",
  className = "",
  compact = false,
  onClick,
}: SoftwareExportBadgeProps) {
  const isTr = locale === "tr";

  const evalResult = config
    ? SoftwareExportEngine.evaluateExportEligibility(config)
    : null;

  const effectiveStatus: ExportEligibilityStatus =
    status || evalResult?.status || "FULLY_ELIGIBLE";

  const configFactory = BADGE_MAP[effectiveStatus] || BADGE_MAP.FULLY_ELIGIBLE;
  const badgeConfig = configFactory(isTr);
  const Icon = badgeConfig.icon;

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
      title={
        isTr
          ? "GVK m. 89/13 ve KDVK m. 11/1-a (Kod 302) Yazılım Hizmet İhracatı Rejimi"
          : "GVK Art. 89/13 & KDVK Art. 11/1-a Software Export Regime"
      }
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm transition-all select-none ${
        onClick ? "cursor-pointer active:scale-95" : ""
      } ${badgeConfig.badgeClass} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${badgeConfig.dotClass}`} />
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{compact ? badgeConfig.shortLabel : badgeConfig.label}</span>
      <span className="text-[10px] font-mono opacity-70 px-1 py-0.2 rounded bg-black/20 border border-current/20 ml-0.5">
        Kod 302
      </span>
    </span>
  );
}
