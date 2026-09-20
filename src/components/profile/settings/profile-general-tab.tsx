"use client";

import {
  User,
  AtSign,
  Trash2,
  AlertCircle,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";
import { TextInput } from "@/src/components/ui/text-input";
import { TextArea } from "@/src/components/ui/text-area";

export interface ProfileGeneralTabProps {
  displayName: string;
  handle: string;
  about: string;
  avatarUrl: string;
  avatarPreviewError: boolean;
  locale: string;
  onDisplayNameChange: (val: string) => void;
  onHandleChange: (val: string) => void;
  onAboutChange: (val: string) => void;
  onAvatarUrlChange: (val: string) => void;
  onAvatarPreviewError: (error: boolean) => void;
}

export function ProfileGeneralTab({
  displayName,
  handle,
  about,
  avatarUrl,
  avatarPreviewError,
  locale,
  onDisplayNameChange,
  onHandleChange,
  onAboutChange,
  onAvatarUrlChange,
  onAvatarPreviewError,
}: ProfileGeneralTabProps) {
  const isTr = locale === "tr";

  const initials = (displayName || "DY")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "DY";

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-7 space-y-5">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
        <User className="h-4 w-4 text-blue-400" aria-hidden="true" />
        <span>{isTr ? "Temel Profil Bilgileri" : "Basic Profile Information"}</span>
      </h2>

      {/* Profil Resmi Ekleme / Önizleme Kartı */}
      <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Live Preview Avatar */}
          <div className="flex items-center gap-3 sm:flex-col sm:items-center shrink-0">
            <div className="h-16 w-16 rounded-full border-2 border-blue-500/30 bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-base overflow-hidden shadow-inner shrink-0">
              {avatarUrl.trim() && !avatarPreviewError ? (
                <img
                  src={avatarUrl.trim()}
                  alt={displayName || "Profil Resmi"}
                  className="w-full h-full object-cover rounded-full"
                  onError={() => onAvatarPreviewError(true)}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold tracking-wider sm:text-center">
              {isTr ? "Önizleme" : "Preview"}
            </span>
          </div>

          {/* Input & Açıklama */}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                <span>
                  {isTr ? "Profil Resmi Bağlantısı (URL)" : "Profile Picture Link (URL)"}
                </span>
              </label>
              {avatarUrl.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onAvatarUrlChange("");
                    onAvatarPreviewError(false);
                  }}
                  className="text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                  <span>{isTr ? "Resmi Kaldır" : "Remove Picture"}</span>
                </button>
              )}
            </div>

            <TextInput
              value={avatarUrl}
              onChange={(e) => onAvatarUrlChange(e.target.value)}
              placeholder="https://images.unsplash.com/... veya https://avatars.githubusercontent.com/..."
              startIcon={
                <LinkIcon
                  className="h-4 w-4 text-[var(--color-text-tertiary)]"
                  aria-hidden="true"
                />
              }
            />

            <p className="text-[11px] text-[var(--color-text-tertiary)] leading-normal">
              {isTr
                ? "Sistem güvenliği ve gizliliğiniz gereği sunucularımıza doğrudan görsel dosyası yüklenmez. GitHub, Gravatar, Unsplash veya diğer halka açık doğrudan görsel bağlantınızı (HTTPS) yapıştırabilirsiniz."
                : "For privacy and system security, image files are not stored on our servers. Paste any direct public HTTPS image URL from GitHub, Gravatar, Unsplash, or CDN."}
            </p>

            {avatarUrl.trim().length > 0 && avatarPreviewError && (
              <div className="text-[11px] text-amber-400/90 flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {isTr
                    ? "Görsel yüklenemedi. Lütfen doğrudan bir görsel URL'si (PNG, JPG, WebP) girdiğinizden emin olun."
                    : "Image failed to load. Please make sure the URL points directly to an image."}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextInput
          label={isTr ? "Görünen Adınız" : "Display Name"}
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder={isTr ? "Ad Soyad veya Takma Ad" : "Full Name or Alias"}
          required
          startIcon={<User className="h-4 w-4" aria-hidden="true" />}
        />

        <TextInput
          label={isTr ? "Kullanıcı Adı (Handle)" : "Username (Handle)"}
          value={handle}
          onChange={(e) => onHandleChange(e.target.value)}
          placeholder={isTr ? "kullaniciadi" : "username"}
          required
          startIcon={<AtSign className="h-4 w-4" aria-hidden="true" />}
        />
      </div>

      <TextArea
        label={isTr ? "Hakkınızda & Biyografi" : "About & Bio"}
        value={about}
        onChange={(e) => onAboutChange(e.target.value)}
        placeholder={
          isTr
            ? "Teknoloji deneyimleriniz, uzmanlık alanlarınız ve odaklandığınız projelerden bahsedin..."
            : "Describe your engineering experience, core tech stack, and focus..."
        }
        rows={4}
      />
    </div>
  );
}
