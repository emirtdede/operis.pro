"use client";

import { useState } from "react";
import { Building2, ShieldCheck, CheckCircle2, Info } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface VerifiedCompanyBadgeProps {
  companyName?: string | null;
  taxOffice?: string | null;
  vknMasked?: string | null;
  companyType?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  showPopover?: boolean;
  className?: string;
  isEn?: boolean;
}

function getVerifiedBadgeLabel(size: string, isEn: boolean): string {
  if (size === "xs") {
    return isEn ? "Corporate" : "Kurumsal";
  }
  return isEn ? "Verified Corporate" : "Doğrulanmış Kurumsal";
}

export function VerifiedCompanyBadge({
  companyName,
  taxOffice,
  vknMasked,
  companyType,
  size = "sm",
  showPopover = true,
  className,
  isEn = false,
}: VerifiedCompanyBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getCompanyTypeLabel = (type?: string | null) => {
    switch (type) {
      case "ANONIM":
        return isEn ? "Joint Stock Co. (A.Ş.)" : "Anonim Şirket (A.Ş.)";
      case "LIMITED":
        return isEn ? "Limited Liability Co. (Ltd. Şti.)" : "Limited Şirket (Ltd. Şti.)";
      case "SAHIS":
        return isEn ? "Sole Proprietorship" : "Şahıs Şirketi";
      case "KOOPERATIF":
        return isEn ? "Cooperative" : "Kooperatif";
      default:
        return isEn ? "Corporate Entity" : "Tüzel Kişilik";
    }
  };

  const badgeContent = (
    <span
      className={twMerge(
        clsx(
          "relative inline-flex items-center gap-1.5 font-medium rounded-full transition-all duration-200 select-none",
          "bg-blue-500/10 hover:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25",
          size === "xs" && "px-1.5 py-0.5 text-[10px] tracking-wide",
          size === "sm" && "px-2 py-0.5 text-xs font-semibold tracking-wide",
          size === "md" && "px-3 py-1 text-xs font-semibold tracking-wide gap-2",
          size === "lg" && "px-3.5 py-1.5 text-sm font-semibold tracking-wide gap-2.5",
          showPopover && "cursor-pointer",
          className
        )
      )}
      onMouseEnter={() => showPopover && setIsHovered(true)}
      onMouseLeave={() => showPopover && setIsHovered(false)}
      tabIndex={showPopover ? 0 : undefined}
      aria-label={isEn ? "Verified Corporate Employer" : "Doğrulanmış Kurumsal İşveren"}
    >
      <Building2
        className={clsx(
          "text-blue-600 dark:text-blue-400 shrink-0",
          size === "xs" && "w-2.5 h-2.5",
          size === "sm" && "w-3.5 h-3.5",
          size === "md" && "w-4 h-4",
          size === "lg" && "w-4.5 h-4.5"
        )}
      />
      <span>
        {getVerifiedBadgeLabel(size, isEn)}
      </span>
      <ShieldCheck
        className={clsx(
          "text-emerald-500 dark:text-emerald-400 shrink-0",
          size === "xs" && "w-2.5 h-2.5",
          size === "sm" && "w-3.5 h-3.5",
          size === "md" && "w-4 h-4",
          size === "lg" && "w-4.5 h-4.5"
        )}
      />

      {/* Floating details popover on hover */}
      {showPopover && isHovered && (
        <div
          role="tooltip"
          className={clsx(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 z-50",
            "p-3 rounded-xl shadow-xl backdrop-blur-md",
            "bg-[var(--bg-elevated)]/95 text-[var(--text-primary)] border border-blue-500/30",
            "animate-in fade-in zoom-in-95 duration-150 pointer-events-none text-left"
          )}
        >
          <div className="flex items-center gap-1.5 pb-2 border-b border-[var(--border-subtle)] text-xs font-semibold text-blue-600 dark:text-blue-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isEn ? "Tax & Identity Verified" : "Vergi Sicili Doğrulanmış"}</span>
          </div>

          <div className="mt-2 space-y-1.5 text-[11px] leading-snug">
            {companyName && (
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">
                  {isEn ? "Legal Title:" : "Şirket Unvanı:"}
                </span>
                <span className="font-medium text-[var(--text-primary)] line-clamp-2">
                  {companyName}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              {vknMasked && (
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px]">
                    {isEn ? "Tax ID (VKN):" : "Vergi No (VKN):"}
                  </span>
                  <span className="font-mono font-medium text-[var(--text-secondary)]">
                    {vknMasked}
                  </span>
                </div>
              )}

              {taxOffice && (
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px]">
                    {isEn ? "Tax Office:" : "Vergi Dairesi:"}
                  </span>
                  <span className="font-medium text-[var(--text-secondary)] truncate block">
                    {taxOffice} V.D.
                  </span>
                </div>
              )}
            </div>

            {companyType && (
              <div className="pt-1">
                <span className="text-[var(--text-muted)] block text-[10px]">
                  {isEn ? "Entity Type:" : "Şirket Türü:"}
                </span>
                <span className="font-medium text-[var(--text-secondary)]">
                  {getCompanyTypeLabel(companyType)}
                </span>
              </div>
            )}

            <div className="pt-1.5 mt-1 border-t border-[var(--border-subtle)] flex items-center gap-1 text-[9px] text-[var(--text-muted)]">
              <Info className="w-3 h-3 text-blue-400 shrink-0" />
              <span>
                {isEn
                  ? "Verified via official GİB checksum & validation rules."
                  : "GİB resmi algoritma kontrolüyle onaylanmıştır."}
              </span>
            </div>
          </div>
        </div>
      )}
    </span>
  );

  return badgeContent;
}
