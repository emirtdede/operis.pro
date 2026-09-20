"use client";

import React, { useState } from "react";
import { Dialog } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { TextArea } from "@/src/components/ui/text-area";
import { AlertCircle } from "lucide-react";
import { getErrorMessage, getLoadingButtonLabel } from "./modal-helpers";

export interface AboutEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAbout: string;
  locale: string;
  onSave: (about: string) => Promise<void>;
}

export function AboutEditModal({
  isOpen,
  onClose,
  initialAbout,
  locale,
  onSave,
}: AboutEditModalProps) {
  const isTr = locale === "tr";
  const [about, setAbout] = useState(initialAbout);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSave(about.trim());
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
      title={isTr ? "Hakkında / Biyografi Düzenle" : "Edit About"}
      description={
        isTr
          ? "Deneyiminizi, uzmanlık alanlarınızı ve yaklaşımınızı anlatan profesyonel bir özet yazın."
          : "Write a summary of your experience, focus areas, and engineering background."
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
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
              {isTr ? "Biyografi" : "Bio"}
            </label>
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              {about.length}/1000
            </span>
          </div>
          <TextArea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={6}
            maxLength={1000}
            placeholder={
              isTr
                ? "Kendinizden, uzmanlaştığınız mimarilerden ve çalışma felsefenizden bahsedin..."
                : "Describe your professional background, architectures you specialize in, and work philosophy..."
            }
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            {isTr ? "Vazgeç" : "Cancel"}
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={loading}>
            {getLoadingButtonLabel(loading, "Kaydet", "Save", "Kaydediliyor...", "Saving...", isTr)}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
