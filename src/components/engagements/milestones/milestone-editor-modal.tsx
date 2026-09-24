"use client";

import { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { CustomMilestoneInputItem, MilestoneDto } from "@/src/modules/engagements/milestone-service";
import { MilestoneDeliverableUrlType } from "@/src/modules/engagements/milestone-synthesizer";

interface MilestoneEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagementId: string;
  initialMilestones: MilestoneDto[];
  totalBudget: number;
  currency: string;
  locale?: string;
  onSuccess: () => void;
}

function getSaveMilestonesButtonLabel(isSubmitting: boolean, isTr: boolean): string {
  if (isSubmitting) {
    return isTr ? "Kaydediliyor..." : "Saving...";
  }
  return isTr ? "Planı Kaydet & Yansıt" : "Save Plan";
}

export function MilestoneEditorModal({
  isOpen,
  onClose,
  engagementId,
  initialMilestones,
  totalBudget,
  currency,
  locale = "tr",
  onSuccess,
}: MilestoneEditorModalProps) {
  const isTr = locale === "tr";

  const [items, setItems] = useState<CustomMilestoneInputItem[]>(() => {
    if (initialMilestones && initialMilestones.length > 0) {
      return initialMilestones.map((m) => ({
        sequenceNumber: m.sequenceNumber,
        title: m.title,
        description: m.description,
        deliverableCriteria: m.deliverableCriteria || "",
        percentage: m.percentage,
        amount: m.amount,
        currency: m.currency,
        deliverableUrlType: m.deliverableUrlType || "CODE_REPO",
      }));
    }
    return [
      {
        sequenceNumber: 1,
        title: isTr ? "Mimari ve İskelet Kurulumu" : "Architecture & Scaffolding",
        description: isTr ? "Veritabanı şeması ve başlangıç ortamı" : "Initial schema and setup",
        deliverableCriteria: isTr ? "Çalışır durumdaki iskelet repo" : "Runnable starter repo",
        percentage: 30,
        amount: Math.round(totalBudget * 0.3),
        currency,
        deliverableUrlType: "CODE_REPO",
      },
      {
        sequenceNumber: 2,
        title: isTr ? "Çekirdek Geliştirme & Demo" : "Core Development & Demo",
        description: isTr ? "Ana fonksiyonlar ve ara entegrasyonlar" : "Core features and integrations",
        deliverableCriteria: isTr ? "Test edilebilir çalışan demo linki" : "Interactive demo URL",
        percentage: 40,
        amount: Math.round(totalBudget * 0.4),
        currency,
        deliverableUrlType: "STAGING_URL",
      },
      {
        sequenceNumber: 3,
        title: isTr ? "Kapanış, Testler & Kod Devri" : "Final Delivery & Handover",
        description: isTr ? "Canlıya alma, temiz repo ve FSEK devri" : "Production cutover and IP transfer",
        deliverableCriteria: isTr ? "Eksiksiz repo ve canlı doğrulama" : "Full repo handover and sign-off",
        percentage: 30,
        amount: Math.round(totalBudget * 0.3),
        currency,
        deliverableUrlType: "DOC_WORKSPACE",
      },
    ];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalPercentage = items.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0);
  const isHundredPercent = Math.abs(totalPercentage - 100) < 0.05;

  const handlePercentageChange = (index: number, newPercent: number) => {
    const updated = [...items];
    const item = updated[index];
    if (!item) return;

    item.percentage = newPercent;
    item.amount = Math.round((totalBudget * (newPercent / 100)) * 100) / 100;
    setItems(updated);
  };

  const handleFieldChange = <K extends keyof CustomMilestoneInputItem>(
    index: number,
    field: K,
    val: CustomMilestoneInputItem[K]
  ) => {
    const updated = [...items];
    const item = updated[index];
    if (!item) return;

    item[field] = val;
    setItems(updated);
  };

  const handleAddItem = () => {
    const nextSeq = items.length + 1;
    const remainingPercent = Math.max(0, 100 - totalPercentage);
    setItems([
      ...items,
      {
        sequenceNumber: nextSeq,
        title: isTr ? `${nextSeq}. Aşama: Özel Teslimat` : `Phase ${nextSeq}: Custom Deliverable`,
        description: isTr ? "Kapsam ve gereksinim açıklaması" : "Scope details",
        deliverableCriteria: "",
        percentage: remainingPercent > 0 ? remainingPercent : 10,
        amount: Math.round((totalBudget * ((remainingPercent > 0 ? remainingPercent : 10) / 100)) * 100) / 100,
        currency,
        deliverableUrlType: "CODE_REPO",
      },
    ]);
  };

  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) {
      setErrorMsg(isTr ? "En az 1 aşama bulunmalıdır." : "At least 1 milestone is required.");
      return;
    }
    const filtered = items.filter((_, idx) => idx !== index);
    // Re-index sequence numbers
    const reindexed = filtered.map((item, idx) => ({
      ...item,
      sequenceNumber: idx + 1,
    }));
    setItems(reindexed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHundredPercent) {
      setErrorMsg(
        isTr
          ? `Toplam yüzde tam olarak %100 olmalıdır. Şu anki toplam: %${totalPercentage.toFixed(1)}`
          : `Total percentage must equal 100%. Current total: ${totalPercentage.toFixed(1)}%`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/work/${engagementId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({ milestones: items }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update milestones");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating milestones";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {isTr ? "Süreç & Hakediş Planını Özelleştir" : "Customize Milestone Plan"}
              </h2>
              <p className="text-xs text-slate-400">
                {isTr
                  ? `Toplam Bütçe: ${totalBudget.toLocaleString("tr-TR")} ${currency} | Sınırsız aşama & esnek yüzdelik`
                  : `Total Budget: ${totalBudget.toLocaleString("en-US")} ${currency}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Milestone Items List */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3 relative group transition-all hover:border-slate-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold flex items-center justify-center border border-indigo-500/30">
                      {item.sequenceNumber}
                    </span>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleFieldChange(index, "title", e.target.value)}
                      placeholder={isTr ? "Aşama Başlığı" : "Milestone Title"}
                      className="bg-transparent text-xs font-bold text-white border-b border-transparent focus:border-indigo-500 focus:outline-none px-1 py-0.5"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Percentage input */}
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                      <span className="text-[10px] text-slate-400 font-semibold">%</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        step="0.5"
                        value={item.percentage}
                        onChange={(e) => handlePercentageChange(index, parseFloat(e.target.value) || 0)}
                        className="w-12 bg-transparent text-xs font-mono font-bold text-indigo-300 text-right focus:outline-none"
                        required
                      />
                    </div>

                    {/* Calculated Amount */}
                    <span className="text-xs font-mono text-emerald-400 font-semibold w-24 text-right">
                      {item.amount.toLocaleString("tr-TR")} {currency}
                    </span>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(index)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title={isTr ? "Aşamayı Sil" : "Delete"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleFieldChange(index, "description", e.target.value)}
                    placeholder={isTr ? "Aşama Detayı ve Kapsamı" : "Milestone Description"}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    required
                  />

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.deliverableCriteria || ""}
                      onChange={(e) => handleFieldChange(index, "deliverableCriteria", e.target.value)}
                      placeholder={isTr ? "Beklenen Teslimat Çıktısı (Örn: Figma, PR)" : "Expected Deliverable Criteria"}
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />

                    <select
                      value={item.deliverableUrlType || "CODE_REPO"}
                      onChange={(e) => handleFieldChange(index, "deliverableUrlType", e.target.value as MilestoneDeliverableUrlType)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none"
                    >
                      <option value="CODE_REPO">{isTr ? "Repo" : "Repo"}</option>
                      <option value="STAGING_URL">{isTr ? "Canlı Link" : "Staging"}</option>
                      <option value="DESIGN_PROTOTYPE">{isTr ? "Figma/Tasarım" : "Figma"}</option>
                      <option value="DOC_WORKSPACE">{isTr ? "Doküman" : "Doc"}</option>
                      <option value="OTHER">{isTr ? "Diğer" : "Other"}</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Item Button */}
          <button
            type="button"
            onClick={handleAddItem}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500/60 bg-slate-900/40 hover:bg-slate-900 text-xs text-indigo-400 font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{isTr ? "Yeni Aşama / Kilometre Taşı Ekle" : "Add New Milestone"}</span>
          </button>

          {/* Total Percentage Gauge */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {isTr ? "Toplam Hakediş Dağılımı:" : "Total Allocation:"}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`font-mono font-bold text-sm ${
                  isHundredPercent ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                %{totalPercentage.toFixed(1)} / %100
              </span>
              {isHundredPercent ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-400" />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              {isTr ? "Vazgeç" : "Cancel"}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting || !isHundredPercent}
              className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25"
            >
              <span>{getSaveMilestonesButtonLabel(isSubmitting, isTr)}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
