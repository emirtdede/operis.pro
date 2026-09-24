"use client";

import {
  Sliders,
  Globe,
  Moon,
  Clock,
  MessageSquare,
  Mail,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";

export interface AccountSettingsTabProps {
  email?: string;
  emailVerified?: boolean;
  prefLocale: string;
  theme: string;
  timeZone: string;
  contactChannel: string;
  locale: string;
  onPrefLocaleChange: (val: string) => void;
  onThemeChange: (val: string) => void;
  onTimeZoneChange: (val: string) => void;
  onContactChannelChange: (val: string) => void;
}

export function AccountSettingsTab({
  email,
  emailVerified,
  prefLocale,
  theme,
  timeZone,
  contactChannel,
  locale,
  onPrefLocaleChange,
  onThemeChange,
  onTimeZoneChange,
  onContactChannelChange,
}: AccountSettingsTabProps) {
  const isTr = locale === "tr";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Sliders className="h-5 w-5 text-blue-500" />
          <span>{isTr ? "Hesap ve Bölgesel Tercihler" : "Account & Regional Preferences"}</span>
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          {isTr
            ? "Platform arayüzü, sistem e-postaları, saat dilimi ve bağlı hesaplarınızı yönetin."
            : "Manage your interface localization, connected social accounts, and communication preferences."}
        </p>
      </div>

      {/* 1. Birincil E-posta ve Kimlik */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3">
        <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Mail className="h-4 w-4 text-blue-400" />
          <span>{isTr ? "Birincil E-posta Adresi" : "Primary Email Address"}</span>
        </label>
        <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30">
          <div>
            <span className="text-xs font-mono font-bold text-[var(--color-text-primary)]">
              {email || "kullanici@operis.pro"}
            </span>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
              {isTr
                ? "Sözleşme, güvenlik ve sistem bildirimleri bu adrese iletilir."
                : "Contract notifications and security alerts are dispatched to this inbox."}
            </p>
          </div>
          {emailVerified ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>{isTr ? "Doğrulandı" : "Verified"}</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>{isTr ? "Doğrulanmamış" : "Unverified"}</span>
            </Badge>
          )}
        </div>
      </div>

      {/* 2. Bağlı Hesaplar (Google OAuth) */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3">
        <label className="text-xs font-bold text-[var(--color-text-primary)] block">
          {isTr ? "Bağlı Sosyal Hesaplar (OAuth 2.0)" : "Connected Accounts (OAuth 2.0)"}
        </label>
        <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                Google ile Giriş
              </span>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">
                {email || "Google OAuth ile bağlı"}
              </span>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
            {isTr ? "Aktif & Bağlı" : "Connected"}
          </Badge>
        </div>
      </div>

      {/* 3. Arayüz Dili */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Globe className="h-4 w-4 text-cyan-400" />
            <span>{isTr ? "Arayüz Dili" : "Interface Language"}</span>
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
            ? "Platform arayüzü, sözleşmeler ve sistem e-postaları bu dilde görüntülenecektir."
            : "The platform interface and transactional emails will be localized in this language."}
        </p>
      </div>

      {/* 4. Görsel Tema */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
        <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Moon className="h-4 w-4 text-purple-400" />
          <span>{isTr ? "Görsel Tema" : "Theme"}</span>
        </label>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { id: "dark", label: isTr ? "Koyu (Dark)" : "Dark" },
            { id: "light", label: isTr ? "Açık (Light)" : "Light" },
            { id: "system", label: isTr ? "Sistem (Auto)" : "System" },
          ].map((t) => {
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onThemeChange(t.id)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/15 text-blue-400"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Saat Dilimi */}
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
            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
          </select>
        </div>
      </div>

      {/* 6. Tercih Edilen İletişim Kanalı */}
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
        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          {isTr
            ? "Müşteriler teklif kabul edildikten sonra ilk görüşmeyi bu kanal üzerinden başlatacaktır."
            : "Clients will initiate onboarding communication through this preferred channel."}
        </p>
      </div>
    </div>
  );
}
