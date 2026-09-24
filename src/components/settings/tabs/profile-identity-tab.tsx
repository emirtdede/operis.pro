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

  // New link state
  const [newLinkType, setNewLinkType] = useState("github");
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  // Handle checking state
  const [handleStatus, setHandleStatus] = useState<{
    checking: boolean;
    available?: boolean;
    isCurrent?: boolean;
    message?: string;
  }>({ checking: false, available: true, isCurrent: true });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    const defaultLabel =
      newLinkLabel.trim() ||
      (newLinkType === "github"
        ? "GitHub"
        : newLinkType === "linkedin"
        ? "LinkedIn"
        : newLinkType === "twitter"
        ? "X / Twitter"
        : isTr
        ? "Kişisel Web Sitesi"
        : "Website");

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
    setNewLinkLabel("");
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
      {/* Header */}
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

      {/* Profil Önizleme Kartı */}
      <div className="p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-blue-400">
                {displayName.slice(0, 2).toUpperCase() || "OP"}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--color-text-primary)]">
                {displayName || (isTr ? "İsimsiz Kullanıcı" : "Unnamed User")}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border-blue-500/20">
                @{handle || initialHandle}
              </Badge>
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
              {headline || (isTr ? "Henüz bir profesyonel ünvan eklenmedi." : "No professional headline added yet.")}
            </p>
          </div>
        </div>

        <Link href={publicProfileUrl} target="_blank">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <span>{isTr ? "Genel Profili Aç" : "View Public Profile"}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* 1. Kullanıcı Adı (Handle) Alanı */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <AtSign className="h-4 w-4 text-cyan-400" />
            <span>{isTr ? "Kullanıcı Adı (Handle / Özel Profil URL'si)" : "Username (Handle / Vanity URL)"}</span>
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

        <div className="flex items-center rounded-xl bg-surface border border-[var(--color-border-subtle)] px-3 py-2 text-xs focus-within:border-blue-500 transition-colors">
          <span className="text-[var(--color-text-tertiary)] font-mono select-none mr-1">
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

      {/* 2. Görünen İsim & Ünvan */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--color-text-primary)] block">
            {isTr ? "Ad Soyad (Görünen İsim)" : "Display Name"}
          </label>
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
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
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

      {/* 3. Profil Resmi (Avatar URL) */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
        <label className="text-xs font-bold text-[var(--color-text-primary)] block">
          {isTr ? "Profil Resmi Bağlantısı (Avatar URL)" : "Avatar URL"}
        </label>
        <TextInput
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://images.unsplash.com/... veya https://lh3.googleusercontent.com/..."
          className="text-xs font-mono"
        />
        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          {isTr
            ? "Güvenli bir HTTPS resim adresi giriniz. Doğrudan Google profil resminiz veya özel portfolyo fotoğrafınız kullanılabilir."
            : "Enter a secure HTTPS image link. You can use your Google photo or custom URL."}
        </p>
      </div>

      {/* 4. Biyografi & Hakkında */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--color-text-primary)] block">
            {isTr ? "Hakkında & Uzmanlık Biyografisi" : "About & Bio"}
          </label>
          <span className="text-[10px] text-[var(--color-text-tertiary)]">
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
          className="w-full rounded-2xl bg-surface border border-[var(--color-border-subtle)] p-3 text-xs text-[var(--color-text-primary)] outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* 5. Profesyonel Bağlantılar */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3">
        <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
          <Globe className="h-4 w-4 text-emerald-400" />
          <span>{isTr ? "Sosyal & Profesyonel Bağlantılar" : "Professional & Social Links"}</span>
        </label>

        {/* Mevcut Linkler Listesi */}
        {links.length > 0 ? (
          <div className="space-y-2">
            {links.map((link, idx) => (
              <div
                key={link.id || idx}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {(() => {
                    const platform = getPlatformConfig(link.type, link.url);
                    const PlatformIcon = platform.icon;
                    return <PlatformIcon className="h-4 w-4 shrink-0 text-blue-400" />;
                  })()}
                  <span className="font-semibold text-[var(--color-text-primary)] truncate">
                    {link.label}:
                  </span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--color-text-tertiary)] hover:text-blue-400 truncate font-mono text-[11px]"
                  >
                    {link.url}
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveLink(idx)}
                  className="p-1 hover:text-red-400 text-[var(--color-text-tertiary)] transition-colors shrink-0 cursor-pointer"
                  title={isTr ? "Bağlantıyı Kaldır" : "Remove Link"}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-[var(--color-text-tertiary)] italic">
            {isTr
              ? "Henüz eklenmiş bir profesyonel bağlantı bulunmuyor."
              : "No professional links added yet."}
          </p>
        )}

        {/* Yeni Link Ekleme Formu */}
        {links.length < 10 && (
          <div className="p-3 rounded-2xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/20 space-y-3">
            <span className="text-[11px] font-bold text-[var(--color-text-secondary)] block">
              {isTr ? "+ Yeni Bağlantı Ekle" : "+ Add New Link"}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={newLinkType}
                onChange={(e) => setNewLinkType(e.target.value)}
                className="rounded-xl bg-surface border border-[var(--color-border-subtle)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="github">GitHub</option>
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">X (Twitter)</option>
                <option value="website">{isTr ? "Web Sitesi" : "Website"}</option>
                <option value="portfolio">{isTr ? "Portfolyo" : "Portfolio"}</option>
                <option value="dribbble">Dribbble</option>
                <option value="behance">Behance</option>
              </select>

              <TextInput
                value={newLinkLabel}
                onChange={(e) => setNewLinkLabel(e.target.value)}
                placeholder={isTr ? "Etiket (örn: Kişisel Blog)" : "Label (e.g. Blog)"}
                className="text-xs"
              />

              <div className="flex gap-2">
                <TextInput
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="text-xs font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLink}
                  disabled={!newLinkUrl.trim()}
                  className="shrink-0 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Kaydet Butonu */}
      <div className="pt-6 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-3">
        <Button
          onClick={handleSaveIdentity}
          disabled={saving || (handleStatus.available === false && !handleStatus.isCurrent)}
          className="cursor-pointer gap-2"
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
