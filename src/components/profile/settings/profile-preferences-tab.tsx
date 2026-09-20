"use client";

import {
  Shield,
  Clock,
  MessageSquare,
} from "lucide-react";
import { Checkbox } from "@/src/components/ui/checkbox";

export interface ProfilePreferencesTabProps {
  showLocation: boolean;
  revealPhoneAfterMatch: boolean;
  marketingConsent: boolean;
  loadingMarketingConsent: boolean;
  isUpdatingConsent: boolean;
  preferredContactChannel: string;
  timeZone: string;
  locale: string;
  onShowLocationChange: (val: boolean) => void;
  onRevealPhoneChange: (val: boolean) => void;
  onMarketingConsentChange: (val: boolean) => void;
  onPreferredContactChannelChange: (val: string) => void;
  onTimeZoneChange: (val: string) => void;
}

export function ProfilePreferencesTab({
  showLocation,
  revealPhoneAfterMatch,
  marketingConsent,
  loadingMarketingConsent,
  isUpdatingConsent,
  preferredContactChannel,
  timeZone,
  locale,
  onShowLocationChange,
  onRevealPhoneChange,
  onMarketingConsentChange,
  onPreferredContactChannelChange,
  onTimeZoneChange,
}: ProfilePreferencesTabProps) {
  const isTr = locale === "tr";

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-7 space-y-4">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
        <Shield className="h-4 w-4 text-purple-400" aria-hidden="true" />
        <span>{isTr ? "Gizlilik & İletişim Tercihleri" : "Privacy & Contact Preferences"}</span>
      </h2>

      <div className="space-y-3 pt-1">
        <Checkbox
          label={
            <div>
              <span className="font-medium text-xs text-[var(--color-text-primary)]">
                {isTr ? "Konumumu Profilimde Göster" : "Show Location on Profile"}
              </span>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "Ülke ve şehir bilginiz herkese açık profilinizde rozet olarak listelenir."
                  : "Your city and country will be shown publicly on your profile badge."}
              </p>
            </div>
          }
          checked={showLocation}
          onChange={(e) => onShowLocationChange(e.target.checked)}
        />

        <Checkbox
          label={
            <div>
              <span className="font-medium text-xs text-[var(--color-text-primary)]">
                {isTr
                  ? "Eşleşme Sonrası Telefon Numaramı Paylaş"
                  : "Reveal Phone Number After Match"}
              </span>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "Bir teklif kabul edildiğinde oluşturulan özel çalışma alanında karşı tarafa telefon numaranız gösterilir."
                  : "Reveals your verified phone number in the direct match workspace once a proposal is accepted."}
              </p>
            </div>
          }
          checked={revealPhoneAfterMatch}
          onChange={(e) => onRevealPhoneChange(e.target.checked)}
        />

        <Checkbox
          label={
            <div>
              <span className="font-medium text-xs text-[var(--color-text-primary)]">
                {isTr
                  ? "E-posta Bildirimleri ve Bülten Aboneliği"
                  : "Email Updates & Platform Newsletter"}
              </span>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "Popüler ilanlar, haftalık platform özetleri ve yenilikler hakkında e-posta alın. İstediğiniz an tek tıkla abonelikten çıkabilirsiniz."
                  : "Receive periodic highlights, trending projects, and platform updates. Unsubscribe anytime with 1 click."}
              </p>
            </div>
          }
          checked={marketingConsent}
          disabled={loadingMarketingConsent || isUpdatingConsent}
          onChange={(e) => onMarketingConsentChange(e.target.checked)}
        />

        {/* Preferred Contact Channel & Timezone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border-subtle)]">
          <div className="space-y-1.5">
            <label htmlFor="preferred-channel-select" className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
              <span>{isTr ? "Öncelikli İletişim Tercihi" : "Preferred Contact Channel"}</span>
            </label>
            <select
              id="preferred-channel-select"
              value={preferredContactChannel}
              onChange={(e) => onPreferredContactChannelChange(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="any">{isTr ? "Fark Etmez / Tümü (Varsayılan)" : "Any / All Channels (Default)"}</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="meet">Google Meet</option>
              <option value="zoom">Zoom</option>
              <option value="teams">Microsoft Teams</option>
              <option value="slack">Slack</option>
              <option value="email">{isTr ? "Kurumsal E-Posta" : "Corporate Email"}</option>
              <option value="phone">{isTr ? "Telefonla Doğrudan Arama" : "Direct Phone Call"}</option>
            </select>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              {isTr
                ? "Eşleşme çalışma alanında bu kanalınıza '⭐ Tercih Edilen' rozeti eklenir."
                : "Counterparties will see a '⭐ Preferred' badge on this channel in the workspace."}
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="timezone-select" className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
              <span>{isTr ? "Saat Dilimi (Zaman Dilimi)" : "Primary Timezone"}</span>
            </label>
            <select
              id="timezone-select"
              value={timeZone}
              onChange={(e) => onTimeZoneChange(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="Europe/Istanbul">{isTr ? "Europe/Istanbul (Türkiye • UTC+3)" : "Europe/Istanbul (Turkey • UTC+3)"}</option>
              <option value="Europe/London">Europe/London (UK • UTC+0/+1)</option>
              <option value="Europe/Berlin">Europe/Berlin (Central Europe • UTC+1/+2)</option>
              <option value="America/New_York">America/New_York (US East • UTC-5/-4)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (US Pacific • UTC-8/-7)</option>
              <option value="Asia/Dubai">Asia/Dubai (Gulf • UTC+4)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT • UTC+8)</option>
              {timeZone && !["Europe/Istanbul", "Europe/London", "Europe/Berlin", "America/New_York", "America/Los_Angeles", "Asia/Dubai", "Asia/Singapore"].includes(timeZone) && (
                <option value={timeZone}>{timeZone}</option>
              )}
            </select>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              {isTr
                ? "İş ortaklarınızın canlı yerel saatinizi görüp mesai saatlerinize saygı duymasını sağlar."
                : "Helps counterparties respect your local business and resting hours."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
