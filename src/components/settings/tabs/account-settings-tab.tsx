"use client";

import {
  Sliders,
  Globe,
  Moon,
  Clock,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";

export interface AccountSettingsTabProps {
  prefLocale: string;
  theme: string;
  timeZone: string;
  contactChannel: string;
  locale: string;
  onPrefLocaleChange: (val: string) => void;
  onThemeChange: (val: string) => void;
  onTimeZoneChange: (val: string) => void;
  onContactChannelChange: (val: string) => void;
  onCloseAccountClick: () => void;
}

export function AccountSettingsTab({
  prefLocale,
  theme,
  timeZone,
  contactChannel,
  locale,
  onPrefLocaleChange,
  onThemeChange,
  onTimeZoneChange,
  onContactChannelChange,
  onCloseAccountClick,
}: AccountSettingsTabProps) {
  const isTr = locale === "tr";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Sliders className="h-5 w-5 text-blue-500" />
          <span>{isTr ? "Hesap Tercihleri" : "Account preferences"}</span>
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          {isTr
            ? "Genel arayüz deneyiminizi, dil ve saat dilimi tercihlerinizi yönetin."
            : "Manage your overall user experience, language, and regional preferences."}
        </p>
      </div>

      {/* Dil Tercihi */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Globe className="h-4 w-4 text-cyan-400" />
            <span>{isTr ? "Arayüz Dili" : "Language"}</span>
          </label>
          <select
            value={prefLocale}
            onChange={(e) => onPrefLocaleChange(e.target.value)}
            className="rounded-xl bg-surface border border-[var(--color-border-subtle)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="tr">Türkçe (TR)</option>
            <option value="en">English (US)</option>
          </select>
        </div>
        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          {isTr
            ? "Platform arayüzü ve sistem e-postaları bu dilde görüntülenecektir."
            : "The platform interface and system emails will be presented in this language."}
        </p>
      </div>

      {/* Tema Seçimi */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
        <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Moon className="h-4 w-4 text-purple-400" />
          <span>{isTr ? "Görsel Tema" : "Theme"}</span>
        </label>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { id: "dark", label: isTr ? "Koyu (Dark)" : "Dark" },
            { id: "light", label: isTr ? "Açık (Light)" : "Light" },
            { id: "system", label: isTr ? "Sistem" : "System" },
          ].map((t) => {
            const isSelected = theme === t.id;
            const buttonClasses = isSelected
              ? "border-blue-500 bg-blue-500/15 text-blue-400"
              : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]";

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onThemeChange(t.id)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${buttonClasses}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Saat Dilimi */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <span>{isTr ? "Saat Dilimi" : "Time Zone"}</span>
          </label>
          <select
            value={timeZone}
            onChange={(e) => onTimeZoneChange(e.target.value)}
            className="rounded-xl bg-surface border border-[var(--color-border-subtle)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="Europe/Istanbul">Europe/Istanbul (GMT+3)</option>
            <option value="Europe/London">Europe/London (GMT+0)</option>
            <option value="Europe/Berlin">Europe/Berlin (GMT+1)</option>
            <option value="America/New_York">America/New York (EST)</option>
            <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
          </select>
        </div>
      </div>

      {/* İletişim Tercihi */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-emerald-400" />
            <span>{isTr ? "Tercih Edilen İletişim Kanalı" : "Preferred Channel"}</span>
          </label>
          <select
            value={contactChannel}
            onChange={(e) => onContactChannelChange(e.target.value)}
            className="rounded-xl bg-surface border border-[var(--color-border-subtle)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="any">{isTr ? "Fark Etmez (Herhangi)" : "Any"}</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
            <option value="email">{isTr ? "Yalnızca E-posta" : "Email Only"}</option>
          </select>
        </div>
      </div>

      {/* Hesabı Kapat / Dondur */}
      <div className="pt-6 border-t border-red-500/20 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">
          {isTr ? "Hesap Yönetimi ve Kapatma" : "Account Closure"}
        </h3>
        <p className="text-xs text-[var(--color-text-secondary)]">
          {isTr
            ? "Hesabınızı dilediğiniz an kalıcı olarak kapatabilir veya dondurabilirsiniz."
            : "You can close or permanently deactivate your account anytime."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer"
          onClick={onCloseAccountClick}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>{isTr ? "Hesabı Kapat..." : "Close Account..."}</span>
        </Button>
      </div>
    </div>
  );
}
