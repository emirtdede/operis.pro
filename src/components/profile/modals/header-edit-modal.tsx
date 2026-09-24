"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Dialog } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { TextInput } from "@/src/components/ui/text-input";
import { AlertCircle, Camera, Upload, RotateCcw, ChevronRight } from "lucide-react";
import {
  getErrorMessage,
  getLoadingButtonLabel,
  getAvatarSourceBadgeLabel,
  getUploadingPhotoLabel,
} from "./modal-helpers";

export interface HeaderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDisplayName: string;
  initialHeadline: string;
  initialAvatarUrl: string;
  initialAvatarSource?: "oauth" | "custom" | "none";
  locale: string;
  onSave: (data: {
    displayName: string;
    headline: string;
    avatarUrl: string;
    avatarSource?: "oauth" | "custom" | "none";
  }) => Promise<void>;
}

export function HeaderEditModal({
  isOpen,
  onClose,
  initialDisplayName,
  initialHeadline,
  initialAvatarUrl,
  initialAvatarSource = "oauth",
  locale,
  onSave,
}: HeaderEditModalProps) {
  const isTr = locale === "tr";
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [headline, setHeadline] = useState(initialHeadline);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [avatarSource, setAvatarSource] = useState<"oauth" | "custom" | "none">(initialAvatarSource);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(isTr ? "Lütfen geçerli bir görsel dosyası seçin." : "Please select a valid image file.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Client-side canvas compression to WebP (max 400x400)
      const compressedBlob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          const maxDim = 400;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context initialization failed"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("WebP compression failed"));
              }
            },
            "image/webp",
            0.85
          );
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Image decoding failed"));
        };
        img.src = objectUrl;
      });

      // 2. Request Presigned URL from API
      const presignedRes = await fetch("/api/upload/avatar/presigned-url", {
        method: "POST",
        headers: { "x-locale": locale },
      });

      if (!presignedRes.ok) {
        const data = await presignedRes.json().catch(() => ({}));
        const fallbackMsg = isTr ? "Yükleme izni alınamadı." : "Failed to obtain upload token.";
        throw new Error(data.error || fallbackMsg);
      }

      const { uploadUrl, publicUrl } = await presignedRes.json();

      // 3. Direct upload to Cloudflare R2
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/webp" },
        body: compressedBlob,
      });

      if (!uploadRes.ok) {
        throw new Error(isTr ? "Görsel depolama sunucusuna yüklenemedi." : "Upload to storage failed.");
      }

      setAvatarUrl(publicUrl);
      setAvatarSource("custom");
    } catch (err: unknown) {
      setError(getErrorMessage(err, isTr ? "Fotoğraf yüklenemedi" : "Upload failed"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRevertToOauth = () => {
    setAvatarSource("oauth");
    setAvatarUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim().length < 2) {
      setError(
        isTr
          ? "Görünen ad en az 2 karakter olmalıdır."
          : "Display name must be at least 2 characters."
      );
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSave({
        displayName: displayName.trim(),
        headline: headline.trim(),
        avatarUrl: avatarUrl.trim(),
        avatarSource,
      });
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, isTr ? "Kaydedilemedi" : "Save failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isTr ? "Profil Başlığını Düzenle" : "Edit Profile Intro"}
      description={
        isTr
          ? "Adınız, unvanınız ve profil fotoğrafınızı güncelleyin."
          : "Update your name, headline, and profile image."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
            {isTr ? "Ad & Soyad" : "Display Name"} *
          </label>
          <TextInput
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={80}
            required
            placeholder={isTr ? "Örn: Emir Dede" : "e.g. Emir Dede"}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
              {isTr ? "Unvan / Mesleki Başlık (Headline)" : "Headline"}
            </label>
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              {headline.length}/140
            </span>
          </div>
          <TextInput
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            maxLength={140}
            placeholder={
              isTr
                ? "Örn: Kıdemli Full-Stack Mimar & Girişimci"
                : "e.g. Senior Full-Stack Architect & Founder"
            }
          />
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">
            {isTr
              ? "Profilinizde ve ilanlarda adınızın hemen altında görünecek tek cümlelik tanıtım."
              : "A single sentence summary displayed right below your name."}
          </p>
        </div>

        {/* Avatar Management Section */}
        <div className="space-y-2 p-3.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5 text-purple-400" />
              <span>{isTr ? "Profil Fotoğrafı" : "Profile Picture"}</span>
            </label>
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400 font-medium">
              {getAvatarSourceBadgeLabel(avatarSource, isTr)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || loading}
              className="inline-flex items-center gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{getUploadingPhotoLabel(uploading, isTr)}</span>
            </Button>

            {avatarSource === "custom" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRevertToOauth}
                disabled={uploading || loading}
                className="inline-flex items-center gap-1.5 text-xs text-sky-400 border-sky-500/30 hover:bg-sky-500/10"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{isTr ? "Google Resmime Dön" : "Revert to Google Photo"}</span>
              </Button>
            )}
          </div>

          <div className="pt-2 border-t border-[var(--color-border-subtle)]/60">
            <label className="block text-[11px] text-[var(--color-text-tertiary)] mb-1">
              {isTr ? "Veya doğrudan resim linki girin:" : "Or provide a direct image link:"}
            </label>
            <TextInput
              type="url"
              value={avatarUrl}
              onChange={(e) => {
                setAvatarUrl(e.target.value);
                if (e.target.value.trim().length > 0) setAvatarSource("custom");
              }}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] pt-2 border-t border-[var(--color-border-subtle)]/60">
          <span>{isTr ? "Kullanıcı adı, dil ve tema için:" : "For username, language, and theme:"}</span>
          <Link
            href={isTr ? "/tr/ayarlar?tab=identity" : "/en/settings?tab=identity"}
            onClick={onClose}
            className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
          >
            <span>{isTr ? "Hesap Ayarlarına Git" : "Go to Account Settings"}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading || uploading}>
            {isTr ? "Vazgeç" : "Cancel"}
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={loading || uploading}>
            {getLoadingButtonLabel(loading, "Değişiklikleri Kaydet", "Save Changes", "Kaydediliyor...", "Saving...", isTr)}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
