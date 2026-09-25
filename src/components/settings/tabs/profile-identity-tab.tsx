"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  User,
  AtSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Plus,
  Trash2,
  Globe,
  Sparkles,
  Camera,
  UploadCloud,
  ShieldCheck,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { TextInput } from "@/src/components/ui/text-input";
import { Badge } from "@/src/components/ui/badge";
import { ProfileLinkItem } from "../types";
import { getPlatformConfig } from "@/src/components/profile/platform-icons";

export interface ProfileIdentityTabProps {
  initialDisplayName: string;
  initialHandle: string;
  initialHeadline: string;
  initialAbout: string;
  initialAvatarUrl: string;
  initialLinks: ProfileLinkItem[];
  locale: string;
  saving: boolean;
  onSaveProfile: (fields: Record<string, unknown>) => Promise<void>;
  onSaveLinks: (links: ProfileLinkItem[]) => Promise<void>;
}

interface PlatformOption {
  value: string;
  label: string;
  placeholder: string;
  defaultLabel: string;
}

interface PlatformGroup {
  group: string;
  items: PlatformOption[];
}

export function ProfileIdentityTab({
  initialDisplayName,
  initialHandle,
  initialHeadline,
  initialAbout,
  initialAvatarUrl,
  initialLinks,
  locale,
  saving,
  onSaveProfile,
  onSaveLinks,
}: ProfileIdentityTabProps) {
  const isTr = locale === "tr";

  // Form states
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [handle, setHandle] = useState(initialHandle);
  const [headline, setHeadline] = useState(initialHeadline);
  const [about, setAbout] = useState(initialAbout);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [links, setLinks] = useState<ProfileLinkItem[]>(initialLinks || []);

  // Avatar upload states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [avatarUploadSuccess, setAvatarUploadSuccess] = useState<string | null>(null);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // New link states
  const [newLinkType, setNewLinkType] = useState("github");
  const [newLinkLabel, setNewLinkLabel] = useState("GitHub");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  // Handle checking state
  const [handleStatus, setHandleStatus] = useState<{
    checking: boolean;
    available?: boolean;
    isCurrent?: boolean;
    message?: string;
  }>({ checking: false, available: true, isCurrent: true });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Rich Platform Registry Categorization
  const platformGroups: PlatformGroup[] = [
    {
      group: isTr ? "Geliştirici & Kod" : "Developer & Code",
      items: [
        { value: "github", label: "GitHub", placeholder: "https://github.com/kullaniciadi", defaultLabel: "GitHub" },
        { value: "gitlab", label: "GitLab", placeholder: "https://gitlab.com/kullaniciadi", defaultLabel: "GitLab" },
        { value: "stackoverflow", label: "Stack Overflow", placeholder: "https://stackoverflow.com/users/...", defaultLabel: "Stack Overflow" },
        { value: "devto", label: "Dev.to", placeholder: "https://dev.to/kullaniciadi", defaultLabel: "Dev.to" },
        { value: "codepen", label: "CodePen", placeholder: "https://codepen.io/kullaniciadi", defaultLabel: "CodePen" },
        { value: "huggingface", label: "Hugging Face", placeholder: "https://huggingface.co/kullaniciadi", defaultLabel: "Hugging Face" },
        { value: "kaggle", label: "Kaggle", placeholder: "https://kaggle.com/kullaniciadi", defaultLabel: "Kaggle" },
      ],
    },
    {
      group: isTr ? "Tasarım & Kreatif" : "Design & Creative",
      items: [
        { value: "figma", label: "Figma", placeholder: "https://figma.com/@kullaniciadi", defaultLabel: "Figma" },
        { value: "dribbble", label: "Dribbble", placeholder: "https://dribbble.com/kullaniciadi", defaultLabel: "Dribbble" },
        { value: "behance", label: "Behance", placeholder: "https://behance.net/kullaniciadi", defaultLabel: "Behance" },
        { value: "artstation", label: "ArtStation", placeholder: "https://artstation.com/kullaniciadi", defaultLabel: "ArtStation" },
        { value: "sketchfab", label: "Sketchfab", placeholder: "https://sketchfab.com/kullaniciadi", defaultLabel: "Sketchfab" },
      ],
    },
    {
      group: isTr ? "Profesyonel & Ağ" : "Professional & Community",
      items: [
        { value: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/kullaniciadi", defaultLabel: "LinkedIn" },
        { value: "x", label: "X (Twitter)", placeholder: "https://x.com/kullaniciadi", defaultLabel: "X (Twitter)" },
        { value: "discord", label: "Discord", placeholder: "https://discord.gg/davet veya kullanıcı adı", defaultLabel: "Discord" },
        { value: "telegram", label: "Telegram", placeholder: "https://t.me/kullaniciadi", defaultLabel: "Telegram" },
        { value: "instagram", label: "Instagram", placeholder: "https://instagram.com/kullaniciadi", defaultLabel: "Instagram" },
        { value: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/905xxxxxxxxx", defaultLabel: "WhatsApp" },
      ],
    },
    {
      group: isTr ? "Yayın & Medya" : "Media & Publications",
      items: [
        { value: "medium", label: "Medium", placeholder: "https://medium.com/@kullaniciadi", defaultLabel: "Medium" },
        { value: "substack", label: "Substack", placeholder: "https://kullaniciadi.substack.com", defaultLabel: "Substack" },
        { value: "youtube", label: "YouTube", placeholder: "https://youtube.com/@kanal", defaultLabel: "YouTube" },
        { value: "vimeo", label: "Vimeo", placeholder: "https://vimeo.com/kullaniciadi", defaultLabel: "Vimeo" },
        { value: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/...", defaultLabel: "Spotify" },
        { value: "soundcloud", label: "SoundCloud", placeholder: "https://soundcloud.com/kullaniciadi", defaultLabel: "SoundCloud" },
      ],
    },
    {
      group: isTr ? "Web & Özel Bağlantı" : "Web & Custom Link",
      items: [
        { value: "website", label: isTr ? "Kişisel Web Sitesi" : "Personal Website", placeholder: "https://websiteniz.com", defaultLabel: isTr ? "Web Sitesi" : "Website" },
        { value: "portfolio", label: isTr ? "Portfolyo / Demo" : "Portfolio / Showcase", placeholder: "https://portfolyonuz.com", defaultLabel: isTr ? "Portfolyo" : "Portfolio" },
        { value: "custom", label: isTr ? "Özel Bağlantı" : "Custom Link", placeholder: "https://...", defaultLabel: isTr ? "Özel Bağlantı" : "Custom Link" },
      ],
    },
  ];

  const defaultFallbackPlatform: PlatformOption = {
    value: "github",
    label: "GitHub",
    placeholder: "https://github.com/kullaniciadi",
    defaultLabel: "GitHub",
  };

  // Helper to find selected platform details
  const allPlatformItems = platformGroups.flatMap((g) => g.items);
  const selectedPlatform: PlatformOption =
    allPlatformItems.find((item) => item.value === newLinkType) ?? defaultFallbackPlatform;

  // Handle platform change with smart label update
  const handlePlatformChange = (typeVal: string) => {
    setNewLinkType(typeVal);
    const plat = allPlatformItems.find((item) => item.value === typeVal);
    if (plat) {
      if (
        !newLinkLabel ||
        allPlatformItems.some((p) => p.defaultLabel === newLinkLabel)
      ) {
        setNewLinkLabel(plat.defaultLabel);
      }
    }
  };

  // Avatar file upload handler
  const handleAvatarFileSelect = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarUploadError(
        isTr
          ? "Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WebP, AVIF, HEIC)."
          : "Please select an image file (PNG, JPG, WebP, AVIF, HEIC)."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarUploadError(
        isTr ? "Dosya boyutu 5 MB sınırını aşamaz." : "File size cannot exceed 5MB."
      );
      return;
    }

    setAvatarUploadError(null);
    setAvatarUploadSuccess(null);
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        headers: { "x-locale": locale },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isTr ? "Fotoğraf yüklenemedi." : "Upload failed."));
      }

      setAvatarUrl(data.avatarUrl);
      setAvatarUploadSuccess(
        isTr
          ? "Profil fotoğrafınız başarıyla güncellendi!"
          : "Profile picture updated successfully!"
      );
      setTimeout(() => setAvatarUploadSuccess(null), 4000);
    } catch (err: unknown) {
      setAvatarUploadError(
        err instanceof Error ? err.message : isTr ? "Fotoğraf yüklenemedi." : "Upload failed."
      );
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Remove avatar handler
  const handleRemoveAvatar = () => {
    setAvatarUrl("");
    setAvatarUploadSuccess(
      isTr ? "Profil fotoğrafı kaldırıldı (Baş harfler kullanılacak)." : "Avatar removed (Initials will be shown)."
    );
    setTimeout(() => setAvatarUploadSuccess(null), 3000);
  };

  // Check handle availability on change
  useEffect(() => {
    const trimmed = handle.toLowerCase().trim();
    if (!trimmed) {
      setHandleStatus({
        checking: false,
        available: false,
        message: isTr ? "Kullanıcı adı boş bırakılamaz." : "Handle cannot be empty.",
      });
      return;
    }

    if (trimmed === initialHandle.toLowerCase().trim()) {
      setHandleStatus({
        checking: false,
        available: true,
        isCurrent: true,
        message: isTr ? "Mevcut kullanıcı adınız." : "Your current handle.",
      });
      return;
    }

    setHandleStatus({ checking: true });

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profile/check-handle?handle=${encodeURIComponent(trimmed)}`, {
          headers: { "x-locale": locale },
        });
        const data = await res.json();
        setHandleStatus({
          checking: false,
          available: Boolean(data.available),
          isCurrent: Boolean(data.isCurrent),
          message: data.message,
        });
      } catch {
        setHandleStatus({
          checking: false,
          available: false,
          message: isTr ? "Kontrol edilemedi." : "Failed to verify handle.",
        });
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [handle, initialHandle, isTr, locale]);

  // Handle Add Link
  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;

    let formattedUrl = newLinkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const defaultLabel = newLinkLabel.trim() || selectedPlatform.defaultLabel;

    const updatedLinks = [
      ...links,
      {
        type: newLinkType,
        label: defaultLabel,
        url: formattedUrl,
        sortOrder: links.length + 1,
      },
    ];

    setLinks(updatedLinks);
    setNewLinkUrl("");
    onSaveLinks(updatedLinks);
  };

  const handleRemoveLink = (index: number) => {
    const updated = links.filter((_, i) => i !== index);
    setLinks(updated);
    onSaveLinks(updated);
  };

  // Submit Profile Info
  const handleSaveIdentity = async () => {
    if (handleStatus.available === false && !handleStatus.isCurrent) {
      return;
    }

    await onSaveProfile({
      displayName: displayName.trim(),
      handle: handle.toLowerCase().trim(),
      headline: headline.trim() || null,
      about: about.trim() || null,
      avatarUrl: avatarUrl.trim() || null,
    });
  };

  const publicProfileUrl = `/${locale}/u/${handle.toLowerCase().trim() || initialHandle}`;

  return (
    <div className="space-y-8">
      {/* 1. Header & Live Preview Card */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            <span>{isTr ? "Profil ve Genel Kimlik" : "Profile & Public Identity"}</span>
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            {isTr
              ? "Operis topluluğunda ve iş ilanlarında diğer kullanıcıların gördüğü açık profilinizi özelleştirin."
              : "Customize how your public identity and credentials appear across the Operis platform."}
          </p>
        </div>

        {/* Live Mini Profile Preview Card */}
        <div className="p-4 sm:p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600/20 to-indigo-600/30 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-inner">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-blue-400">
                  {displayName.slice(0, 2).toUpperCase() || "OP"}
                </span>
              )}
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-[var(--color-text-primary)] truncate">
                  {displayName || (isTr ? "İsimsiz Kullanıcı" : "Unnamed User")}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border-blue-500/20 shrink-0"
                >
                  @{handle || initialHandle}
                </Badge>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)] truncate max-w-md">
                {headline ||
                  (isTr
                    ? "Henüz bir profesyonel ünvan eklenmedi."
                    : "No professional headline added yet.")}
              </p>
            </div>
          </div>

          <Link href={publicProfileUrl} target="_blank" className="shrink-0 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs w-full sm:w-auto justify-center">
              <span>{isTr ? "Genel Profili Aç" : "View Public Profile"}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Profil Fotoğrafı Alanı */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <Camera className="h-4 w-4 text-blue-400" />
            <span>{isTr ? "Profil Fotoğrafı" : "Profile Photo"}</span>
          </label>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{isTr ? "Güvenli Depolama • Maks. 5 MB" : "Secure Storage • Max 5 MB"}</span>
          </div>
        </div>

        {/* Interactive Avatar Upload Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingAvatar(true);
          }}
          onDragLeave={() => setIsDraggingAvatar(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingAvatar(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleAvatarFileSelect(file);
          }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isDraggingAvatar
              ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
              : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 hover:border-blue-500/40"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Clickable Large Avatar with Camera Sheen */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600/10 to-indigo-600/20 border-2 border-blue-500/30 flex items-center justify-center shrink-0 cursor-pointer shadow-lg group transition-transform active:scale-95"
              title={isTr ? "Fotoğraf yüklemek için tıklayın" : "Click to upload photo"}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-extrabold text-blue-400">
                  {displayName.slice(0, 2).toUpperCase() || "OP"}
                </span>
              )}

              {/* Hover / Uploading Overlay */}
              <div
                className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 text-white text-[11px] font-semibold transition-opacity ${
                  uploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                    <span className="text-[10px] text-center px-1">
                      {isTr ? "Yükleniyor..." : "Uploading..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5 text-white" />
                    <span>{isTr ? "Değiştir" : "Change"}</span>
                  </>
                )}
              </div>
            </div>

            {/* Upload Controls & Information */}
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div>
                <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                  {isTr ? "Profil Fotoğrafınızı Güncelleyin" : "Update Profile Picture"}
                </h4>
                <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed mt-0.5">
                  {isTr
                    ? "Yüklediğiniz fotoğraf profilinizde ve tekliflerinizde en net kalitede görüntülenecek şekilde otomatik olarak optimize edilir."
                    : "Your photo is automatically optimized for crisp, high-quality display across your profile and proposals."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/heic"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarFileSelect(file);
                  }}
                />

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="gap-1.5 text-xs h-9 px-3.5 rounded-xl cursor-pointer shadow-sm shadow-blue-500/20"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {uploadingAvatar
                      ? isTr
                        ? "Fotoğraf Yükleniyor..."
                        : "Uploading Photo..."
                      : isTr
                      ? "Fotoğraf Yükle"
                      : "Upload Photo"}
                  </span>
                </Button>

                {avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="gap-1.5 text-xs h-9 px-3 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{isTr ? "Fotoğrafı Kaldır" : "Remove Photo"}</span>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="gap-1.5 text-xs h-9 px-3 rounded-xl text-[var(--color-text-secondary)] cursor-pointer"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span>{isTr ? "Harici URL ile Belirt" : "Use External URL"}</span>
                </Button>
              </div>

              {/* Status Feedback Banners */}
              {avatarUploadSuccess && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl animate-in fade-in">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>{avatarUploadSuccess}</span>
                </div>
              )}

              {avatarUploadError && (
                <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl animate-in fade-in">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{avatarUploadError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Optional Expandable External URL Input */}
          {showUrlInput && (
            <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] space-y-1.5 animate-in fade-in duration-200">
              <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] block">
                {isTr ? "Doğrudan Harici Resim Bağlantısı (Avatar URL)" : "Direct Image Link (Avatar URL)"}
              </label>
              <TextInput
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... veya https://lh3.googleusercontent.com/..."
                className="text-xs font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Kullanıcı Adı (Handle / Özel Profil URL'si) */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <AtSign className="h-4 w-4 text-cyan-400" />
            <span>
              {isTr ? "Kullanıcı Adı (Handle / Özel Profil URL'si)" : "Username (Handle / Vanity URL)"}
            </span>
          </label>

          {/* Durum Rozeti */}
          {handleStatus.checking ? (
            <Badge variant="outline" className="text-[10px] gap-1 bg-amber-500/10 text-amber-400 border-amber-500/20">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{isTr ? "Kontrol ediliyor..." : "Checking..."}</span>
            </Badge>
          ) : handleStatus.isCurrent ? (
            <Badge variant="outline" className="text-[10px] gap-1 bg-blue-500/10 text-blue-400 border-blue-500/20">
              <CheckCircle2 className="h-3 w-3" />
              <span>{handleStatus.message}</span>
            </Badge>
          ) : handleStatus.available ? (
            <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3" />
              <span>{handleStatus.message}</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] gap-1 bg-red-500/10 text-red-400 border-red-500/20">
              <AlertCircle className="h-3 w-3" />
              <span>{handleStatus.message}</span>
            </Badge>
          )}
        </div>

        <div className="flex items-center rounded-xl bg-surface border border-[var(--color-border-subtle)] px-3.5 py-2 text-xs focus-within:border-blue-500 transition-colors">
          <span className="text-[var(--color-text-tertiary)] font-mono select-none mr-1.5">
            operis.pro/{locale}/u/
          </span>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
            maxLength={30}
            placeholder="kullaniciadi"
            className="w-full bg-transparent outline-none font-bold text-[var(--color-text-primary)]"
          />
        </div>

        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          {isTr
            ? "Yalnızca küçük harfler, rakamlar, tire ve alt çizgi kullanılabilir (3-30 karakter). Kullanıcı adınızı değiştirdiğinizde mevcut linkleriniz yeni adresinize yönlendirilir."
            : "Only lowercase letters, numbers, hyphens, and underscores (3-30 chars). Changing your handle updates your public URL."}
        </p>
      </div>

      {/* 4. Ad Soyad & Profesyonel Ünvan */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[var(--color-text-primary)] block">
              {isTr ? "Ad Soyad (Görünen İsim)" : "Display Name"}
            </label>
            <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
              {displayName.length}/80
            </span>
          </div>
          <TextInput
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={80}
            placeholder={isTr ? "Örn: Emir Dede" : "e.g. Emir Dede"}
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[var(--color-text-primary)] block">
              {isTr ? "Profesyonel Ünvan (Headline)" : "Headline"}
            </label>
            <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
              {headline.length}/140
            </span>
          </div>
          <TextInput
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            maxLength={140}
            placeholder={isTr ? "Örn: Senior Full Stack Architect & Tech Lead" : "e.g. Senior Full Stack Architect"}
            className="text-xs"
          />
        </div>
      </div>

      {/* 5. Hakkında & Uzmanlık Biyografisi */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--color-text-primary)] block">
            {isTr ? "Hakkında & Uzmanlık Biyografisi" : "About & Bio"}
          </label>
          <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
            {about.length}/1000
          </span>
        </div>
        <textarea
          rows={4}
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          maxLength={1000}
          placeholder={
            isTr
              ? "10+ yıldır ölçeklenebilir web ve dağıtık mimariler geliştiriyorum. Rust, TypeScript, Go ve cloud mimarilerinde uzmanım..."
              : "10+ years of experience building scalable distributed web applications..."
          }
          className="w-full rounded-2xl bg-surface border border-[var(--color-border-subtle)] p-3 text-xs text-[var(--color-text-primary)] outline-none focus:border-blue-500 transition-colors leading-relaxed"
        />
      </div>

      {/* 6. Sosyal & Profesyonel Bağlantılar (Genişletilmiş Platformlar & Düzgün Buton) */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-emerald-400" />
            <span>{isTr ? "Sosyal & Profesyonel Bağlantılar" : "Professional & Social Links"}</span>
          </label>
          <span className="text-[11px] text-[var(--color-text-tertiary)] font-mono">
            {links.length}/15 {isTr ? "bağlantı" : "links"}
          </span>
        </div>

        {/* Mevcut Linkler Listesi */}
        {links.length > 0 ? (
          <div className="space-y-2">
            {links.map((link, idx) => {
              const platform = getPlatformConfig(link.type, link.url);
              const PlatformIcon = platform.icon;

              return (
                <div
                  key={link.id || idx}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 hover:border-blue-500/30 transition-all text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1.5 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] shrink-0">
                      <PlatformIcon className="h-4 w-4 text-blue-400" />
                    </span>
                    <span className="font-bold text-[var(--color-text-primary)] shrink-0">
                      {link.label}:
                    </span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--color-text-tertiary)] hover:text-blue-400 truncate font-mono text-[11px] transition-colors"
                    >
                      {link.url}
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveLink(idx)}
                    className="p-1.5 hover:text-red-400 text-[var(--color-text-tertiary)] hover:bg-red-500/10 rounded-lg transition-colors shrink-0 cursor-pointer"
                    title={isTr ? "Bağlantıyı Kaldır" : "Remove Link"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/10 text-center">
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {isTr
                ? "Henüz eklenmiş bir profesyonel bağlantı bulunmuyor. Aşağıdan GitHub, LinkedIn, X, Portfolyo veya özel bir bağlantı ekleyebilirsiniz."
                : "No professional links added yet. Add GitHub, LinkedIn, X, Portfolio or custom links below."}
            </p>
          </div>
        )}

        {/* Yeni Link Ekleme Formu - Düzgün, Simetrik ve Genişletilmiş */}
        {links.length < 15 && (
          <div className="p-4 sm:p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/20 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-blue-400" />
                <span>{isTr ? "Yeni Bağlantı Ekle" : "Add New Link"}</span>
              </span>
              <span className="text-[10px] text-[var(--color-text-tertiary)]">
                {isTr ? "Özel isim ve URL desteği" : "Custom label & URL support"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* 1. Platform Seçimi */}
              <div className="w-full sm:w-36 md:w-40 shrink-0">
                <select
                  value={newLinkType}
                  onChange={(e) => handlePlatformChange(e.target.value)}
                  className="w-full h-10 rounded-xl bg-surface border border-[var(--color-border-subtle)] px-3 text-xs font-medium text-[var(--color-text-primary)] outline-none focus:border-blue-500 cursor-pointer transition-colors"
                >
                  {platformGroups.map((group) => (
                    <optgroup key={group.group} label={group.group}>
                      {group.items.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* 2. Özel Etiket / Başlık */}
              <div className="w-full sm:w-28 md:w-32 shrink-0">
                <input
                  type="text"
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  maxLength={40}
                  placeholder={
                    newLinkType === "custom"
                      ? isTr
                        ? "Özel Başlık"
                        : "Custom Label"
                      : isTr
                      ? "Etiket"
                      : "Label"
                  }
                  className="w-full h-10 rounded-xl bg-surface border border-[var(--color-border-subtle)] px-3 text-xs text-[var(--color-text-primary)] outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* 3. URL Girişi */}
              <div className="w-full flex-1 min-w-0">
                <input
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLink();
                    }
                  }}
                  placeholder={selectedPlatform.placeholder}
                  className="w-full h-10 rounded-xl bg-surface border border-[var(--color-border-subtle)] px-3 text-xs font-mono text-[var(--color-text-primary)] outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* 4. Ekle Butonu */}
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleAddLink}
                disabled={!newLinkUrl.trim()}
                className="h-10 px-4 rounded-xl gap-1.5 font-bold text-xs shrink-0 cursor-pointer shadow-sm shadow-blue-500/20"
              >
                <Plus className="h-4 w-4" />
                <span>{isTr ? "Ekle" : "Add"}</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 7. Kaydet Butonu */}
      <div className="pt-6 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-3">
        <Button
          onClick={handleSaveIdentity}
          disabled={saving || (handleStatus.available === false && !handleStatus.isCurrent)}
          className="cursor-pointer gap-2 h-11 px-6 rounded-xl font-bold text-sm shadow-md shadow-blue-500/20"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{isTr ? "Kaydediliyor..." : "Saving..."}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>{isTr ? "Kimlik Bilgilerini Kaydet" : "Save Identity Changes"}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
