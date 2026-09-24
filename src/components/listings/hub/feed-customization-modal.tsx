"use client";

import { useEffect } from "react";
import {
  X,
  RotateCcw,
  Sliders,
  User,
  Tags,
  Bookmark,
  TrendingUp,
  Sparkles,
  PlusCircle,
  Check,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import type { FeedCustomizationSettings } from "./use-feed-customization";

export interface FeedCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FeedCustomizationSettings;
  updateSettings: (newSettings: Partial<FeedCustomizationSettings>) => void;
  resetSettings: () => void;
  isTr: boolean;
}

export function FeedCustomizationModal({
  isOpen,
  onClose,
  settings,
  updateSettings,
  resetSettings,
  isTr,
}: FeedCustomizationModalProps) {
  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feed-customization-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-2xl p-6 sm:p-7 space-y-6 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Sliders className="h-4 w-4" />
              </span>
              <h2
                id="feed-customization-title"
                className="text-lg font-bold text-[var(--color-text-primary)]"
              >
                {isTr ? "Akış Panellerini Özelleştir" : "Customize Feed Panels"}
              </h2>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {isTr
                ? "Sağ ve sol panellerdeki widget'ları tercihinize göre açıp kapatın."
                : "Toggle widgets in the left and right panels according to your workflow."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            aria-label={isTr ? "Kapat" : "Close"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-6 overflow-y-auto pr-1 flex-1">
          {/* Section: Sol Panel (Left Panel) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <span>{isTr ? "Sol Panel Bileşenleri" : "Left Panel Widgets"}</span>
            </h3>

            <div className="space-y-2">
              {/* Profile Card Toggle */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-surface/50 hover:bg-surface/80 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-[var(--color-text-secondary)]" />
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {isTr ? "Mini Profil & Canlı Müsaitlik" : "Mini Profile & Live Status"}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-tertiary)]">
                      {isTr ? "Avatarınız, unvanınız ve tek tıkla müsaitlik durumu" : "Your avatar, headline and status toggle"}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showProfileCard}
                  onChange={(e) => updateSettings({ showProfileCard: e.target.checked })}
                  className="h-4 w-4 rounded-md accent-blue-600 cursor-pointer"
                />
              </label>

              {/* Workspace Shortcuts Toggle - Placed directly below Profile Card */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-surface/50 hover:bg-surface/80 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Bookmark className="h-4 w-4 text-purple-400" />
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {isTr ? "Çalışma Alanı Kısayolları" : "Workspace Shortcuts"}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-tertiary)]">
                      {isTr ? "İlanlarım, tekliflerim ve kaydedilenler linkleri" : "Links to my listings, offers & bookmarks"}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showWorkspaceShortcuts}
                  onChange={(e) => updateSettings({ showWorkspaceShortcuts: e.target.checked })}
                  className="h-4 w-4 rounded-md accent-blue-600 cursor-pointer"
                />
              </label>

              {/* Followed Categories Toggle */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-surface/50 hover:bg-surface/80 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Tags className="h-4 w-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {isTr ? "Takip Ettiğim Kategoriler" : "Followed Specializations"}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-tertiary)]">
                      {isTr ? "Takip ettiğiniz kategorilerin hızlı filtre listesi" : "Fast filter list of your followed categories"}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showFollowedCategories}
                  onChange={(e) => updateSettings({ showFollowedCategories: e.target.checked })}
                  className="h-4 w-4 rounded-md accent-blue-600 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Section: Sağ Panel (Right Panel) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <span>{isTr ? "Sağ Panel Bileşenleri" : "Right Panel Widgets"}</span>
            </h3>

            <div className="space-y-2">
              {/* Publish CTA Toggle (Projeniz mi Var? - Positioned at top) */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-surface/50 hover:bg-surface/80 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <PlusCircle className="h-4 w-4 text-indigo-400" />
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {isTr ? "İlan Yayınla Hızlı Kartı (Projeniz mi Var?)" : "Publish Listing Action Card"}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-tertiary)]">
                      {isTr ? "Sağ panelde en üstte hızlı ilan verme çağrısı" : "Top card shortcut to create new listings"}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showPublishCta}
                  onChange={(e) => updateSettings({ showPublishCta: e.target.checked })}
                  className="h-4 w-4 rounded-md accent-blue-600 cursor-pointer"
                />
              </label>

              {/* Trending Tech Toggle */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-surface/50 hover:bg-surface/80 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {isTr ? "Gündemdeki Teknolojiler" : "Trending Technologies"}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-tertiary)]">
                      {isTr ? "Gerçek arama ve etkileşim trendlerine dayalı piyasa nabzı" : "Real user search & interaction market pulse"}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showTrendingTech}
                  onChange={(e) => updateSettings({ showTrendingTech: e.target.checked })}
                  className="h-4 w-4 rounded-md accent-blue-600 cursor-pointer"
                />
              </label>

              {/* Suggested Categories Toggle */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-surface/50 hover:bg-surface/80 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {isTr ? "Önerilen Alanlar" : "Suggested Specializations"}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-tertiary)]">
                      {isTr ? "Bireysel ilgi ve arama geçmişinize özel kategori önerileri" : "Personalized category recommendations based on your activity"}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showSuggestedCategories}
                  onChange={(e) => updateSettings({ showSuggestedCategories: e.target.checked })}
                  className="h-4 w-4 rounded-md accent-blue-600 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Section: Varsayılan Akış Tercihi */}
          <div className="space-y-3 pt-2 border-t border-[var(--color-border-subtle)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
              {isTr ? "Varsayılan Akış Modu" : "Default Feed Mode"}
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ defaultFeedMode: "all" })}
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  settings.defaultFeedMode === "all"
                    ? "bg-blue-500/15 text-blue-400 border-blue-500/40 shadow-xs"
                    : "bg-surface/50 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-surface"
                }`}
              >
                <span>{isTr ? "Tüm İlanlar" : "All Listings"}</span>
                {settings.defaultFeedMode === "all" && <Check className="h-4 w-4 text-blue-400" />}
              </button>

              <button
                type="button"
                onClick={() => updateSettings({ defaultFeedMode: "following" })}
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  settings.defaultFeedMode === "following"
                    ? "bg-blue-500/15 text-blue-400 border-blue-500/40 shadow-xs"
                    : "bg-surface/50 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-surface"
                }`}
              >
                <span>{isTr ? "Sana Özel (Takip)" : "For You (Following)"}</span>
                {settings.defaultFeedMode === "following" && <Check className="h-4 w-4 text-blue-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--color-border-subtle)] shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={resetSettings}
            className="text-xs gap-1.5 text-[var(--color-text-tertiary)] hover:text-red-400 hover:border-red-500/30"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{isTr ? "Varsayılana Sıfırla" : "Reset to Default"}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
            className="text-xs px-5 shadow-xs font-bold"
          >
            <span>{isTr ? "Tamam & Kaydet" : "Done & Save"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
