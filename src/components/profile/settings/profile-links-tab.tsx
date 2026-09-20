"use client";

import {
  Globe,
  Plus,
  Trash2,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { ProfileLinkItem } from "./profile-form-reducer";
import { getLinkTypes } from "./types";

export interface ProfileLinksTabProps {
  links: ProfileLinkItem[];
  newLinkType: string;
  newLinkLabel: string;
  newLinkUrl: string;
  locale: string;
  onNewLinkTypeChange: (val: string) => void;
  onNewLinkLabelChange: (val: string) => void;
  onNewLinkUrlChange: (val: string) => void;
  onAddLink: () => void;
  onRemoveLink: (index: number) => void;
}

export function ProfileLinksTab({
  links,
  newLinkType,
  newLinkLabel,
  newLinkUrl,
  locale,
  onNewLinkTypeChange,
  onNewLinkLabelChange,
  onNewLinkUrlChange,
  onAddLink,
  onRemoveLink,
}: ProfileLinksTabProps) {
  const isTr = locale === "tr";
  const linkTypes = getLinkTypes(isTr);

  let currentPlaceholder = "https://...";
  const matchedType = linkTypes.find((t) => t.value === newLinkType);
  if (matchedType?.placeholder) {
    currentPlaceholder = matchedType.placeholder;
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-7 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <span>{isTr ? "Sosyal & Portföy Bağlantıları" : "Social & Portfolio Links"}</span>
        </h2>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {links.length} / 10 {isTr ? "bağlantı" : "links"}
        </span>
      </div>

      {/* Existing links */}
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Globe className="h-4 w-4 text-blue-400 shrink-0" aria-hidden="true" />
                <span className="font-medium text-xs text-[var(--color-text-primary)]">
                  {link.label}
                </span>
                <span className="text-xs text-[var(--color-text-tertiary)] truncate max-w-[280px]">
                  {link.url}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveLink(idx)}
                className="text-red-400 hover:text-red-300 p-1 rounded-lg hover:bg-red-500/10 cursor-pointer transition-colors"
                title={isTr ? "Sil" : "Remove"}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Link Input Group */}
      {links.length < 10 && (
        <div className="p-4 rounded-xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 space-y-3">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            {isTr ? "+ Yeni Bağlantı Ekle" : "+ Add New Link"}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-3">
              <select
                value={newLinkType}
                onChange={(e) => onNewLinkTypeChange(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-blue-500"
              >
                {linkTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                placeholder={isTr ? "Etiket (Örn: GitHub)" : "Label (e.g. GitHub)"}
                value={newLinkLabel}
                onChange={(e) => onNewLinkLabelChange(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="sm:col-span-4">
              <input
                type="url"
                placeholder={currentPlaceholder}
                value={newLinkUrl}
                onChange={(e) => onNewLinkUrlChange(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onAddLink}
                className="w-full h-10 gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isTr ? "Ekle" : "Add"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
