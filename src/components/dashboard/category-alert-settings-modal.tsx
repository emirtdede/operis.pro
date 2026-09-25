"use client";

import { useState } from "react";
import { X, Bell, BellOff, DollarSign, Check, Loader2, Zap } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { CategoryDto } from "@/src/modules/categories/service";

export interface CategoryAlertSettingsModalProps {
  category: CategoryDto;
  locale: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: { emailAlerts: boolean; minBudget: number | null }) => void;
}

const BUDGET_PRESETS = [
  { value: null, labelTr: "Tüm Bütçeler", labelEn: "All Budgets" },
  { value: 10000, labelTr: "10.000 ₺ ve Üzeri", labelEn: "10,000 ₺ and Above" },
  { value: 25000, labelTr: "25.000 ₺ ve Üzeri", labelEn: "25,000 ₺ and Above" },
  { value: 50000, labelTr: "50.000 ₺ ve Üzeri", labelEn: "50,000 ₺ and Above" },
];

export function CategoryAlertSettingsModal({
  category,
  locale,
  isOpen,
  onClose,
  onSaved,
}: CategoryAlertSettingsModalProps) {
  const isTr = locale === "tr";
  const [emailAlerts, setEmailAlerts] = useState<boolean>(category.emailAlerts ?? true);
  const [minBudget, setMinBudget] = useState<number | null>(category.minBudget ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/categories/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: category.id,
          emailAlerts,
          minBudget,
          locale,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isTr ? "Kaydedilemedi." : "Failed to save."));
      }

      onSaved({ emailAlerts, minBudget });
      onClose();
    } catch (err: unknown) {
      const fallback = isTr ? "Bir hata oluştu." : "An error occurred.";
      setError(err instanceof Error ? err.message : fallback);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--color-border-subtle)] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-wider">
              <Bell className="h-3 w-3" aria-hidden="true" />
              <span>{category.name}</span>
            </div>
            <h2 id="alert-settings-title" className="text-lg font-bold text-[var(--color-text-primary)]">
              {isTr ? "Canlı İlan Alarmı Ayarları" : "Job Alert Preferences"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors p-1 rounded-lg hover:bg-white/5"
            aria-label={isTr ? "Kapat" : "Close"}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Setting 1: Email Toggle */}
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-white/5 hover:border-blue-500/30 transition-colors cursor-pointer">
            <div className="space-y-0.5 pr-3">
              <span className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                {emailAlerts ? (
                  <Bell className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                ) : (
                  <BellOff className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                )}
                <span>{isTr ? "E-posta Bildirimleri" : "Email Notifications"}</span>
              </span>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {isTr
                  ? "Yeni bir ilan yayınlandığında anlık e-posta ile haberdar ol."
                  : "Receive instant email alerts when new projects are published."}
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="h-5 w-5 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500/30 cursor-pointer"
            />
          </label>
        </div>

        {/* Setting 2: Minimum Budget Filter */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
            <span>{isTr ? "Minimum Bütçe Filtresi" : "Minimum Budget Threshold"}</span>
          </label>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {isTr
              ? "Yalnızca belirlediğiniz tutarın üzerindeki yüksek bütçeli ilanlar için alarm tetiklensin."
              : "Only trigger alerts for projects meeting your target budget criteria."}
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {BUDGET_PRESETS.map((preset) => {
              const isSelected = minBudget === preset.value;
              return (
                <button
                  key={preset.value === null ? "all" : preset.value}
                  type="button"
                  onClick={() => setMinBudget(preset.value)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer text-left ${
                    isSelected
                      ? "bg-blue-500/15 border-blue-500 text-blue-300 shadow-sm"
                      : "bg-white/5 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-white/20"
                  }`}
                >
                  <span>{isTr ? preset.labelTr : preset.labelEn}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Info Note on Frequency Capping */}
        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-[11px] text-blue-300/80 leading-relaxed flex items-start gap-2">
          <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            {isTr
              ? "Operis akıllı alarm motoru, e-posta kutunuzun dolmasını önlemek için 4 saatlik kayan pencerede maksimum 3 e-posta alarmı iletir. Uygulama içi bildirimleriniz eksiksiz gelmeye devam eder."
              : "Operis anti-storm engine limits alerts to a maximum of 3 emails per 4-hour window to keep your inbox clean. In-app alerts remain uncapped."}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--color-border-subtle)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={saving}
          >
            {isTr ? "İptal" : "Cancel"}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-2 min-w-[100px]"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                <span>{isTr ? "Kaydediliyor..." : "Saving..."}</span>
              </>
            ) : (
              <span>{isTr ? "Değişiklikleri Kaydet" : "Save Preferences"}</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
