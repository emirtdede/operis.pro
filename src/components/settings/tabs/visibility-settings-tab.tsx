"use client";

import {
  Eye,
  Clock,
  Calendar,
} from "lucide-react";

export interface VisibilitySettingsTabProps {
  showLocation: boolean;
  revealPhoneAfterMatch: boolean;
  allowSearchIndex: boolean;
  availabilityStatus: "AVAILABLE_NOW" | "PARTIALLY_AVAILABLE" | "BUSY";
  availabilityHoursPerWeek: number;
  availableFromDate: string;
  availabilityNotice: string;
  locale: string;
  onShowLocationChange: (val: boolean) => void;
  onRevealPhoneChange: (val: boolean) => void;
  onAllowSearchIndexChange: (val: boolean) => void;
  onAvailabilityStatusChange: (status: "AVAILABLE_NOW" | "PARTIALLY_AVAILABLE" | "BUSY") => void;
  onAvailabilityHoursChange: (hours: number) => void;
  onAvailableFromDateChange: (dateStr: string) => void;
  onAvailabilityNoticeChange: (notice: string) => void;
  onAvailabilityNoticeBlur: () => void;
}

export function VisibilitySettingsTab({
  showLocation,
  revealPhoneAfterMatch,
  allowSearchIndex,
  availabilityStatus,
  availabilityHoursPerWeek,
  availableFromDate,
  availabilityNotice,
  locale,
  onShowLocationChange,
  onRevealPhoneChange,
  onAllowSearchIndexChange,
  onAvailabilityStatusChange,
  onAvailabilityHoursChange,
  onAvailableFromDateChange,
  onAvailabilityNoticeChange,
  onAvailabilityNoticeBlur,
}: VisibilitySettingsTabProps) {
  const isTr = locale === "tr";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-500" />
          <span>{isTr ? "Görünürlük ve Gizlilik" : "Visibility"}</span>
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          {isTr
            ? "Profilinizin ve iletişim bilgilerinizin platformda ve arama motorlarında nasıl göründüğünü kontrol edin."
            : "Control how your profile and contact details are discovered on Operis and web search."}
        </p>
      </div>

      {/* Konum Görünürlüğü */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <label className="text-xs font-bold text-[var(--color-text-primary)] block">
            {isTr ? "Konum Bilgisini Profilde Göster" : "Show Location on Profile"}
          </label>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            {isTr
              ? "Şehir ve ülke bilginiz genel profilinizde yer alır."
              : "Your city and country code are displayed on your public card."}
          </p>
        </div>
        <input
          type="checkbox"
          checked={showLocation}
          onChange={(e) => onShowLocationChange(e.target.checked)}
          className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
        />
      </div>

      {/* Telefon Numarası Gizliliği */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <label className="text-xs font-bold text-[var(--color-text-primary)] block">
            {isTr ? "Telefon Numarasını Sadece Eşleşmede Göster" : "Reveal Phone Only After Match"}
          </label>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            {isTr
              ? "Telefon numaranız profilinizde gizli kalır; yalnızca iki tarafın karşılıklı onayladığı projelerde görünür."
              : "Your phone remains hidden until a mutual project proposal is accepted."}
          </p>
        </div>
        <input
          type="checkbox"
          checked={revealPhoneAfterMatch}
          onChange={(e) => onRevealPhoneChange(e.target.checked)}
          className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
        />
      </div>

      {/* Arama Motoru İndeksleme */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <label className="text-xs font-bold text-[var(--color-text-primary)] block">
            {isTr ? "Arama Motorlarının Profilinizi Dizinlemesine İzin Ver" : "Public Search Indexing"}
          </label>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            {isTr
              ? "Google ve diğer arama motorları genel profil sayfanızı arama sonuçlarında gösterebilir."
              : "Allows search engines like Google to index your public portfolio."}
          </p>
        </div>
        <input
          type="checkbox"
          checked={allowSearchIndex}
          onChange={(e) => onAllowSearchIndexChange(e.target.checked)}
          className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
        />
      </div>

      {/* 3-Kademeli Müsaitlik ve İş Yükü Rozeti */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3">
        <div className="space-y-0.5">
          <label className="text-xs font-bold text-[var(--color-text-primary)] block">
            {isTr ? "Müsaitlik ve İş Yükü Durumu" : "Availability & Workload Status"}
          </label>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            {isTr
              ? "Profilinizde ve arama sonuçlarında görünen 3 kademeli gerçek zamanlı müsaitlik rozeti."
              : "Real-time 3-tier availability badge displayed on your profile and search results."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {[
            {
              id: "AVAILABLE_NOW" as const,
              labelTr: "Hemen Başlayabilir",
              labelEn: "Available Now",
              subTr: "30+ saat/hafta",
              subEn: "30+ hrs/wk",
              border: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
              dot: "bg-emerald-400 animate-pulse",
            },
            {
              id: "PARTIALLY_AVAILABLE" as const,
              labelTr: "Kısmi Müsait",
              labelEn: "Partially Available",
              subTr: "10-20 saat/hafta",
              subEn: "10-20 hrs/wk",
              border: "border-amber-500/30 bg-amber-500/10 text-amber-400",
              dot: "bg-amber-400",
            },
            {
              id: "BUSY" as const,
              labelTr: "Şu An Meşgul",
              labelEn: "Currently Busy",
              subTr: "Yeni proje almıyor",
              subEn: "No new projects",
              border: "border-rose-500/30 bg-rose-500/10 text-rose-400",
              dot: "bg-rose-400",
            },
          ].map((tier) => {
            const selected = availabilityStatus === tier.id;
            let cardClasses = "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] opacity-70 hover:opacity-100";
            if (selected) {
              cardClasses = `${tier.border} ring-2 ring-blue-500/40 shadow-xs font-semibold`;
            }

            return (
              <button
                type="button"
                key={tier.id}
                onClick={() => onAvailabilityStatusChange(tier.id)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${cardClasses}`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-primary)]">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${tier.dot}`} />
                  <span>{isTr ? tier.labelTr : tier.labelEn}</span>
                </div>
                <span className="text-[10px] text-[var(--color-text-tertiary)] mt-1">
                  {isTr ? tier.subTr : tier.subEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* Hours Slider (when not BUSY) */}
        {availabilityStatus !== "BUSY" && (
          <div className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-primary)]">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-400" />
                <span>{isTr ? "Haftalık Çalışma Kapasitesi:" : "Weekly Capacity:"}</span>
              </span>
              <span className="font-mono text-blue-400 font-bold">
                {availabilityHoursPerWeek} {isTr ? "saat / hafta" : "hrs / week"}
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={availabilityHoursPerWeek}
              onChange={(e) => onAvailabilityHoursChange(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>
        )}

        {/* Busy Until Date (when BUSY) */}
        {availabilityStatus === "BUSY" && (
          <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{isTr ? "Müsait Olacağınız Tarih:" : "Busy Until Date:"}</span>
            </div>
            <input
              type="date"
              value={availableFromDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => onAvailableFromDateChange(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Optional Custom Notice */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)]">
            {isTr ? "Özel Müsaitlik Notu (İsteğe Bağlı)" : "Custom Notice (Optional)"}
          </label>
          <input
            type="text"
            maxLength={120}
            placeholder={
              isTr
                ? "Örn: Yalnızca Next.js ve yapay zeka projelerine açığım."
                : "E.g. Only open for Next.js AI integrations."
            }
            value={availabilityNotice}
            onChange={(e) => onAvailabilityNoticeChange(e.target.value)}
            onBlur={onAvailabilityNoticeBlur}
            className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
