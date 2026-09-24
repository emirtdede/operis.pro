"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Dialog } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { TextInput } from "@/src/components/ui/text-input";
import { AlertCircle, Plus, Trash2, ChevronRight } from "lucide-react";
import type { ProfileLinkItem } from "../profile-settings-form";
import { getErrorMessage, getLoadingButtonLabel } from "./modal-helpers";

export interface LinksEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLinks: ProfileLinkItem[];
  locale: string;
  onSave: (links: ProfileLinkItem[]) => Promise<void>;
}

export function LinksEditModal({
  isOpen,
  onClose,
  initialLinks,
  locale,
  onSave,
}: LinksEditModalProps) {
  const isTr = locale === "tr";
  const [links, setLinks] = useState<ProfileLinkItem[]>(initialLinks || []);
  const [newType, setNewType] = useState("github");
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableLinkTypes = [
    { value: "github", label: "GitHub (Yazılım / Kod)", placeholder: "https://github.com/..." },
    { value: "gitlab", label: "GitLab", placeholder: "https://gitlab.com/..." },
    { value: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
    { value: "behance", label: "Behance (Tasarım / UI)", placeholder: "https://behance.net/..." },
    { value: "dribbble", label: "Dribbble (Tasarım)", placeholder: "https://dribbble.com/..." },
    { value: "figma", label: "Figma (Prototip & Topluluk)", placeholder: "https://figma.com/@..." },
    { value: "artstation", label: "ArtStation (3D & Dijital Sanat)", placeholder: "https://artstation.com/..." },
    { value: "sketchfab", label: "Sketchfab (İnteraktif 3D Model)", placeholder: "https://sketchfab.com/..." },
    { value: "medium", label: "Medium (Yazı & Makale)", placeholder: "https://medium.com/@..." },
    { value: "substack", label: "Substack (Bülten & Analiz)", placeholder: "https://...substack.com" },
    { value: "youtube", label: "YouTube (Video & Showreel)", placeholder: "https://youtube.com/@..." },
    { value: "vimeo", label: "Vimeo (Video Prodüksiyon)", placeholder: "https://vimeo.com/..." },
    { value: "soundcloud", label: "SoundCloud (Ses & Müzik)", placeholder: "https://soundcloud.com/..." },
    { value: "spotify", label: "Spotify (Müzik & Podcast)", placeholder: "https://open.spotify.com/..." },
    { value: "kaggle", label: "Kaggle (Veri Bilimi & AI)", placeholder: "https://kaggle.com/..." },
    { value: "huggingface", label: "Hugging Face (Yapay Zeka & Model)", placeholder: "https://huggingface.co/..." },
    { value: "stackoverflow", label: "Stack Overflow", placeholder: "https://stackoverflow.com/users/..." },
    { value: "codepen", label: "CodePen", placeholder: "https://codepen.io/..." },
    { value: "devto", label: "Dev.to (Teknik Blog)", placeholder: "https://dev.to/..." },
    { value: "twitter", label: "X (Twitter)", placeholder: "https://x.com/..." },
    { value: "website", label: isTr ? "Kişisel Web Sitesi" : "Personal Website", placeholder: "https://..." },
    { value: "portfolio", label: isTr ? "Portfolyo / Canlı Demo" : "Portfolio / Live Demo", placeholder: "https://..." },
    { value: "other", label: isTr ? "Diğer Bağlantı" : "Other Link", placeholder: "https://..." },
  ];

  const handleAddLink = () => {
    if (!newUrl.trim()) {
      setError(isTr ? "Lütfen geçerli bir URL girin." : "Please enter a valid URL.");
      return;
    }
    if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
      setError(isTr ? "URL http:// veya https:// ile başlamalıdır." : "URL must start with http:// or https://");
      return;
    }
    if (links.length >= 10) {
      setError(isTr ? "En fazla 10 bağlantı ekleyebilirsiniz." : "Max 10 links allowed.");
      return;
    }

    const typeObj = availableLinkTypes.find((t) => t.value === newType);
    let label = newLabel.trim();
    if (!label) {
      label = typeObj ? typeObj.label : newType;
    }

    setLinks([...links, { type: newType, label, url: newUrl.trim() }]);
    setNewLabel("");
    setNewUrl("");
    setError(null);
  };

  const handleRemoveLink = (idx: number) => {
    setLinks(links.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSave(links);
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
      title={isTr ? "Portfolyo ve Dış Bağlantılar" : "Portfolio & Links"}
      description={
        isTr
          ? "GitHub, LinkedIn, Behance veya kişisel sitenizi profilinize bağlayın."
          : "Connect your GitHub, LinkedIn, Behance, or personal website."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)]">
            {isTr ? "Mevcut Bağlantılar" : "Current Links"} ({links.length}/10)
          </label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {links.length === 0 && (
              <div className="p-3 rounded-xl border border-[var(--color-border-subtle)] text-center text-xs text-[var(--color-text-tertiary)] italic">
                {isTr ? "Henüz eklenmiş bağlantı yok." : "No links added yet."}
              </div>
            )}
            {links.map((link, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]"
              >
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                    {link.type}
                  </span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                    {link.label}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-tertiary)] truncate max-w-[140px]">
                    {link.url}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(idx)}
                  className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Sil"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--color-border-subtle)] space-y-3">
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)]">
            {isTr ? "Yeni Bağlantı Ekle" : "Add New Link"}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full rounded-xl bg-surface border border-[var(--color-border-subtle)] px-3 py-2 text-xs text-[var(--color-text-primary)] outline-none focus:border-blue-500"
              >
                {availableLinkTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <TextInput
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder={isTr ? "Etiket (Opsiyonel)" : "Label (Optional)"}
              />
            </div>
            <div>
              <TextInput
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddLink}
            disabled={!newUrl.trim() || links.length >= 10}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            <span>{isTr ? "Listeye Ekle" : "Add to List"}</span>
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] pt-2 border-t border-[var(--color-border-subtle)]/60">
          <span>{isTr ? "Tüm bağlantıları toplu yönetin:" : "Manage all links in settings:"}</span>
          <Link
            href={isTr ? "/tr/ayarlar?tab=identity" : "/en/settings?tab=identity"}
            onClick={onClose}
            className="text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1"
          >
            <span>{isTr ? "Hesap Ayarları" : "Account Settings"}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            {isTr ? "Vazgeç" : "Cancel"}
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={loading}>
            {getLoadingButtonLabel(loading, "Bağlantıları Kaydet", "Save Links", "Kaydediliyor...", "Saving...", isTr)}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
