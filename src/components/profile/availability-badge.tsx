"use client";

import { Clock, Calendar, AlertCircle } from "lucide-react";
import type { AvailabilityStatus } from "@/src/modules/profiles/service";

export interface AvailabilityBadgeProps {
  status: AvailabilityStatus;
  hoursPerWeek?: number | null;
  availableFromDate?: string | Date | null;
  notice?: string | null;
  isStale?: boolean;
  locale?: string;
  variant?: "pill" | "compact" | "detailed";
  showHours?: boolean;
  className?: string;
}

export function AvailabilityBadge({
  status,
  hoursPerWeek,
  availableFromDate,
  notice,
  isStale,
  locale = "tr",
  variant = "pill",
  showHours = true,
  className = "",
}: AvailabilityBadgeProps) {
  const isTr = locale === "tr";

  // Format date if available
  let busyUntilFormatted: string | null = null;
  if (availableFromDate) {
    try {
      const d = typeof availableFromDate === "string" ? new Date(availableFromDate) : availableFromDate;
      if (!isNaN(d.getTime())) {
        busyUntilFormatted = d.toLocaleDateString(isTr ? "tr-TR" : "en-US", {
          day: "numeric",
          month: "short",
        });
      }
    } catch {
      // Ignore invalid date
    }
  }

  // Visual status config
  const statusConfig = {
    AVAILABLE_NOW: {
      colorClasses: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      dotColor: "bg-emerald-400",
      pulse: true,
      labelTr: "Hemen Başlayabilir",
      labelEn: "Available Now",
      subtextTr: hoursPerWeek ? `${hoursPerWeek} sa/hafta` : "Hemen başlanabilir projeler",
      subtextEn: hoursPerWeek ? `${hoursPerWeek} hrs/wk` : "Available immediately",
    },
    FULL_TIME: {
      colorClasses: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      dotColor: "bg-blue-400",
      pulse: false,
      labelTr: "Tam Zamanlı Açık",
      labelEn: "Open to Full-Time",
      subtextTr: "Tam zamanlı (35-40 sa/hafta)",
      subtextEn: "Full-time (35-40 hrs/wk)",
    },
    PARTIALLY_AVAILABLE: {
      colorClasses: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      dotColor: "bg-amber-400",
      pulse: false,
      labelTr: "Yarı Zamanlı",
      labelEn: "Part-Time",
      subtextTr: hoursPerWeek ? `${hoursPerWeek} sa/hafta` : "10-20 sa/hafta",
      subtextEn: hoursPerWeek ? `${hoursPerWeek} hrs/wk` : "10-20 hrs/wk",
    },
    PROJECT_BASED: {
      colorClasses: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      dotColor: "bg-purple-400",
      pulse: false,
      labelTr: "Proje Bazlı / Serbest",
      labelEn: "Project-Based / Freelance",
      subtextTr: "Sprint ve anahtar teslim",
      subtextEn: "Sprints & fixed milestones",
    },
    ADVISORY: {
      colorClasses: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
      dotColor: "bg-indigo-400",
      pulse: false,
      labelTr: "Danışmanlık & Mentorluk",
      labelEn: "Advisory & Consulting",
      subtextTr: "Mimari ve teknik danışmanlık",
      subtextEn: "Architecture & tech advisory",
    },
    VOLUNTEER: {
      colorClasses: "bg-teal-500/10 text-teal-400 border-teal-500/30",
      dotColor: "bg-teal-400",
      pulse: false,
      labelTr: "Gönüllü & Sosyal Fayda",
      labelEn: "Volunteer & Pro Bono",
      subtextTr: "Açık kaynak ve STK desteği",
      subtextEn: "Open source & non-profit",
    },
    INTERNSHIP: {
      colorClasses: "bg-sky-500/10 text-sky-400 border-sky-500/30",
      dotColor: "bg-sky-400",
      pulse: false,
      labelTr: "Staj & Çıraklık",
      labelEn: "Internship & Apprenticeship",
      subtextTr: "Junior & staj olanakları",
      subtextEn: "Junior & intern tracks",
    },
    BUSY: {
      colorClasses: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      dotColor: "bg-rose-400",
      pulse: false,
      labelTr: busyUntilFormatted
        ? `${busyUntilFormatted} Tarihine Kadar Meşgul`
        : "Şu An Meşgul",
      labelEn: busyUntilFormatted
        ? `Busy until ${busyUntilFormatted}`
        : "Currently Busy",
      subtextTr: "Yeni proje kabul etmiyor",
      subtextEn: "Not taking new projects",
    },
  }[status] || {
    colorClasses: "bg-gray-500/10 text-gray-400 border-gray-500/30",
    dotColor: "bg-gray-400",
    pulse: false,
    labelTr: "Belirtilmemiş",
    labelEn: "Unspecified",
    subtextTr: "",
    subtextEn: "",
  };

  const label = isTr ? statusConfig.labelTr : statusConfig.labelEn;

  // Render Compact Variant (just the dot and label, ideal for cards and listings)
  if (variant === "compact") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium transition-colors ${statusConfig.colorClasses} ${className}`}
        title={notice || label}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          {statusConfig.pulse && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusConfig.dotColor}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.dotColor}`} />
        </span>
        <span className="truncate max-w-[150px]">{label}</span>
      </div>
    );
  }

  // Render Detailed Variant (with notice, workload meter, and stale indicators)
  if (variant === "detailed") {
    return (
      <div
        className={`rounded-2xl border p-4 space-y-2.5 transition-all ${statusConfig.colorClasses} ${className}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {statusConfig.pulse && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusConfig.dotColor}`} />
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusConfig.dotColor}`} />
            </span>
            <span className="font-semibold text-xs sm:text-sm">{label}</span>
          </div>

          {hoursPerWeek !== null && hoursPerWeek !== undefined && status !== "BUSY" && (
            <div className="flex items-center gap-1.5 text-xs opacity-90 font-mono bg-black/20 px-2.5 py-0.5 rounded-lg border border-white/5">
              <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{isTr ? `${hoursPerWeek} saat / hafta` : `${hoursPerWeek} hrs / week`}</span>
            </div>
          )}
        </div>

        {notice && (
          <p className="text-xs opacity-85 leading-relaxed italic border-t border-white/5 pt-2">
            &ldquo;{notice}&rdquo;
          </p>
        )}

        {isStale && (
          <div className="flex items-center gap-1.5 text-[10px] opacity-75 pt-1">
            <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>{isTr ? "Müsaitlik bilgisi 45 günden uzun süredir güncellenmedi." : "Availability hasn't been refreshed in 45+ days."}</span>
          </div>
        )}
      </div>
    );
  }

  // Default Pill Variant
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium shadow-sm transition-all ${statusConfig.colorClasses} ${className}`}
      title={notice || label}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {statusConfig.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusConfig.dotColor}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.dotColor}`} />
      </span>

      <span className="font-semibold">{label}</span>

      {showHours && hoursPerWeek !== null && hoursPerWeek !== undefined && status !== "BUSY" && (
        <>
          <span className="opacity-40">•</span>
          <span className="opacity-90 font-mono text-[11px]">
            {isTr ? `${hoursPerWeek} sa/hf` : `${hoursPerWeek}h/w`}
          </span>
        </>
      )}

      {status === "BUSY" && busyUntilFormatted && (
        <>
          <span className="opacity-40">•</span>
          <span className="inline-flex items-center gap-1 opacity-90 text-[11px]">
            <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>{busyUntilFormatted}</span>
          </span>
        </>
      )}
    </div>
  );
}
