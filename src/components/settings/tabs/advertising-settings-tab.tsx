"use client";

import { Megaphone } from "lucide-react";

export interface AdvertisingSettingsTabProps {
  marketingConsent: boolean;
  loadingConsent: boolean;
  personalizedAds: boolean;
  locale: string;
  onMarketingConsentChange: (val: boolean) => void;
  onPersonalizedAdsChange: (val: boolean) => void;
}

export function AdvertisingSettingsTab({
  marketingConsent,
  loadingConsent,
  personalizedAds,
  locale,
  onMarketingConsentChange,
  onPersonalizedAdsChange,
}: AdvertisingSettingsTabProps) {
  const isTr = locale === "tr";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-blue-500" />
          <span>{isTr ? "Reklam ve Pazarlama Verileri" : "Advertising data"}</span>
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          {isTr
            ? "E-posta bülten izinleri ve kişiselleştirilmiş ilan eşleştirme algoritmalarını yönetin."
            : "Manage marketing communication, newsletters, and matching algorithms."}
        </p>
      </div>

      {/* E-posta Bülteni */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <label className="text-xs font-bold text-[var(--color-text-primary)] block">
            {isTr ? "Operis Teknoloji Radarı ve Haftalık Bülten" : "Weekly Tech & Market Digest"}
          </label>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            {isTr
              ? "Haftanın öne çıkan ilanları, talep gören teknolojiler ve platform güncellemeleri."
              : "Highlights of trending tech, top-tier projects, and platform releases."}
          </p>
        </div>
        <input
          type="checkbox"
          checked={marketingConsent}
          disabled={loadingConsent}
          onChange={(e) => onMarketingConsentChange(e.target.checked)}
          className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
        />
      </div>

      {/* Algoritmik Eşleştirme */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <label className="text-xs font-bold text-[var(--color-text-primary)] block">
            {isTr ? "Kişiselleştirilmiş İlan ve Uzman Eşleştirmesi" : "Personalized Project Recommendations"}
          </label>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            {isTr
              ? "Yeteneklerinize ve geçmiş ilanlarınıza göre size özel ilan önerileri sunulur."
              : "Smart algorithmic matches tailored to your tech stack and past engagements."}
          </p>
        </div>
        <input
          type="checkbox"
          checked={personalizedAds}
          onChange={(e) => onPersonalizedAdsChange(e.target.checked)}
          className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
        />
      </div>
    </div>
  );
}
