"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Dialog } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { TextInput } from "@/src/components/ui/text-input";
import { AlertCircle, Plus, ChevronRight } from "lucide-react";
import { getErrorMessage, getLoadingButtonLabel } from "./modal-helpers";

export interface SkillsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSkills: string[];
  locale: string;
  onSave: (skills: string[]) => Promise<void>;
}

export function SkillsEditModal({
  isOpen,
  onClose,
  initialSkills,
  locale,
  onSave,
}: SkillsEditModalProps) {
  const isTr = locale === "tr";
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const popularSuggestions = [
    "Next.js",
    "TypeScript",
    "React",
    "Tailwind CSS",
    "PostgreSQL",
    "Go",
    "Python",
    "Flutter",
    "Docker",
    "Node.js",
    "UI/UX",
    "Figma",
  ];

  const addSkill = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (skills.length >= 5) {
      setError(
        isTr
          ? "En fazla 5 teknoloji seçebilirsiniz."
          : "You can select up to 5 technologies."
      );
      return;
    }
    if (skills.includes(trimmed)) return;
    setSkills([...skills, trimmed]);
    setInputVal("");
    setError(null);
  };

  const removeSkill = (name: string) => {
    setSkills(skills.filter((s) => s !== name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSave(skills);
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
      title={isTr ? "Teknoloji Radarı & Beceriler" : "Tech Stack Radar"}
      description={
        isTr
          ? "Aktif olarak uzmanlaştığınız ve projelerde kullandığınız en fazla 5 ana teknolojiyi seçin."
          : "Select up to 5 core technologies you actively work with."
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
              {isTr ? "Seçilen Teknolojiler" : "Selected Technologies"} ({skills.length}/5)
            </label>
          </div>
          <div className="flex flex-wrap gap-2 p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] min-h-[52px]">
            {skills.length === 0 && (
              <span className="text-xs text-[var(--color-text-tertiary)] italic">
                {isTr ? "Henüz teknoloji eklenmemiş." : "No technologies added yet."}
              </span>
            )}
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
              >
                <span>{s}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(s)}
                  className="hover:text-red-400 transition-colors ml-0.5 cursor-pointer"
                  title="Kaldır"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
            {isTr ? "Teknoloji veya Beceri Ekle" : "Add Skill"}
          </label>
          <div className="flex gap-2">
            <TextInput
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill(inputVal);
                }
              }}
              placeholder={isTr ? "Örn: Rust, GraphQL, Kubernetes..." : "e.g. Rust, GraphQL, Kubernetes..."}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addSkill(inputVal)}
              disabled={!inputVal.trim() || skills.length >= 5}
            >
              <Plus className="h-4 w-4" />
              <span>{isTr ? "Ekle" : "Add"}</span>
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[var(--color-text-tertiary)] mb-1.5">
            {isTr ? "Popüler Teknolojilerden Seçin:" : "Popular Technologies:"}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {popularSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addSkill(s)}
                disabled={skills.includes(s) || skills.length >= 5}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  skills.includes(s)
                    ? "border-cyan-500/20 bg-cyan-500/5 text-cyan-400/40 cursor-not-allowed"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:border-cyan-500/40 hover:text-cyan-400"
                }`}
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] pt-2 border-t border-[var(--color-border-subtle)]/60">
          <span>{isTr ? "Kapsamlı beceri ve müsaitlik tercihleri:" : "Full skills and availability preferences:"}</span>
          <Link
            href={isTr ? "/tr/ayarlar?tab=work" : "/en/settings?tab=work"}
            onClick={onClose}
            className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
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
            {getLoadingButtonLabel(loading, "Kaydet", "Save", "Kaydediliyor...", "Saving...", isTr)}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
