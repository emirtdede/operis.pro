"use client";

import { useState } from "react";
import { Dialog } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { ShieldAlert, Plus, Clock, DollarSign, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { ChangeRequestReason } from "@/src/modules/contracts/types";
import { CHANGE_REASON_LABELS } from "@/src/modules/contracts/addendum-generator";

export interface CreateChangeRequestInitialData {
  title?: string;
  description?: string;
  reason?: ChangeRequestReason;
  additionalBudget?: number;
  additionalDays?: number;
}

export interface CreateChangeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagementId: string;
  currency?: string;
  locale?: string;
  initialData?: CreateChangeRequestInitialData | null;
  onSuccess: () => void;
}

export function CreateChangeRequestModal({
  isOpen,
  onClose,
  engagementId,
  currency = "TRY",
  locale = "tr",
  initialData,
  onSuccess,
}: CreateChangeRequestModalProps) {
  const isTr = locale !== "en";

  const [title, setTitle] = useState(initialData?.title || "");
  const [reason, setReason] = useState<ChangeRequestReason>(
    initialData?.reason || "CLIENT_REQUESTED"
  );
  const [description, setDescription] = useState(initialData?.description || "");
  const [additionalBudget, setAdditionalBudget] = useState<string>(
    initialData?.additionalBudget !== undefined ? String(initialData.additionalBudget) : "0"
  );
  const [additionalDays, setAdditionalDays] = useState<string>(
    initialData?.additionalDays !== undefined ? String(initialData.additionalDays) : "0"
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initialData when modal opens
  const prevIsOpen = useState(isOpen);
  if (isOpen && !prevIsOpen[0]) {
    prevIsOpen[1](true);
    if (initialData) {
      setTitle(initialData.title || "");
      if (initialData.reason) setReason(initialData.reason);
      setDescription(initialData.description || "");
      if (initialData.additionalBudget !== undefined) {
        setAdditionalBudget(String(initialData.additionalBudget));
      }
      if (initialData.additionalDays !== undefined) {
        setAdditionalDays(String(initialData.additionalDays));
      }
    }
  } else if (!isOpen && prevIsOpen[0]) {
    prevIsOpen[1](false);
  }

  const resetForm = () => {
    setTitle("");
    setReason("CLIENT_REQUESTED");
    setDescription("");
    setAdditionalBudget("0");
    setAdditionalDays("0");
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (trimmedTitle.length < 5) {
      setErrorMessage(
        isTr
          ? "Talep başlığı en az 5 karakter olmalıdır."
          : "Title must be at least 5 characters long."
      );
      return;
    }

    if (trimmedDesc.length < 20) {
      setErrorMessage(
        isTr
          ? "Kapsam açıklaması en az 20 karakter olmalı ve yapılacak ilave işleri madde madde içermelidir."
          : "Description must be at least 20 characters and detail the deliverables."
      );
      return;
    }

    const budgetNum = Math.max(0, parseFloat(additionalBudget) || 0);
    const daysNum = Math.max(0, parseInt(additionalDays, 10) || 0);

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/work/${engagementId}/change-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          title: trimmedTitle,
          description: trimmedDesc,
          reason,
          additionalBudget: budgetNum,
          currency,
          additionalDays: daysNum,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error ||
            (isTr ? "Değişiklik talebi oluşturulamadı." : "Failed to create change request.")
        );
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bir hata oluştu";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const budgetNum = parseFloat(additionalBudget) || 0;
  const daysNum = parseInt(additionalDays, 10) || 0;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={isTr ? "Yeni Değişiklik Talebi (Scope Shield)" : "New Change Request (Scope Shield)"}
      className="max-w-2xl"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                {isTr
                  ? "Yeni Değişiklik Talebi (Scope Shield)"
                  : "New Change Request (Scope Shield)"}
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {isTr
                  ? "TBK m. 470/480 kapsamında sözleşmeye resmi zeyilname (ek protokol) ekler."
                  : "Generates a legally binding contract addendum under TBK Art. 470/480."}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
              {isTr ? "Değişiklik / İlave Kapsam Başlığı *" : "Change Request Title *"}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                isTr
                  ? "Örn: Çoklu Para Birimi (Multi-Currency) & Stripe Entegrasyonu"
                  : "e.g., Multi-Currency & Stripe Gateway Integration"
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
              {isTr ? "Kapsam Genişleme / Değişiklik Gerekçesi *" : "Origin / Reason of Change *"}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ChangeRequestReason)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-amber-500/50"
            >
              <option value="CLIENT_REQUESTED">
                {CHANGE_REASON_LABELS["CLIENT_REQUESTED"]?.[isTr ? "tr" : "en"] ||
                  "Client Requested"}
              </option>
              <option value="TECHNICAL_NECESSITY">
                {CHANGE_REASON_LABELS["TECHNICAL_NECESSITY"]?.[isTr ? "tr" : "en"] ||
                  "Technical Necessity"}
              </option>
              <option value="SCOPE_DISCOVERY">
                {CHANGE_REASON_LABELS["SCOPE_DISCOVERY"]?.[isTr ? "tr" : "en"] || "Scope Discovery"}
              </option>
              <option value="UNFORESEEN_COMPLICATION">
                {CHANGE_REASON_LABELS["UNFORESEEN_COMPLICATION"]?.[isTr ? "tr" : "en"] ||
                  "Unforeseen Complication"}
              </option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
              {isTr
                ? "İlave Kapsam ve Kabul Kriterleri (Madde Madde) *"
                : "Scope Delta & Acceptance Criteria *"}
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isTr
                  ? "- Stripe Checkout API entegrasyonu tamamlanacak.\n- Webhook imza doğrulama mekanizması kurulacak.\n- USD ve EUR kur çevirisi test edilecek."
                  : "- Stripe Checkout API integration\n- Webhook signature validation\n- USD/EUR currency conversion tests"
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-amber-500/50 resize-y"
            />
          </div>

          {/* Cost & Timeline Impact Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                {isTr ? `İlave Bedel (${currency})` : `Additional Fee (${currency})`}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={additionalBudget}
                  onChange={(e) => setAdditionalBudget(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-amber-500/50"
                />
                <DollarSign className="w-4 h-4 text-[var(--color-text-tertiary)] absolute left-3 top-3" />
              </div>
              <span className="text-[10px] text-[var(--color-text-tertiary)] mt-1 block">
                {isTr ? "Ek ücret talep edilmiyorsa 0 bırakın." : "Leave 0 if no additional fee."}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                {isTr ? "İlave Teslimat Süresi (Gün)" : "Additional Timeline (Days)"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={additionalDays}
                  onChange={(e) => setAdditionalDays(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-amber-500/50"
                />
                <Clock className="w-4 h-4 text-[var(--color-text-tertiary)] absolute left-3 top-3" />
              </div>
              <span className="text-[10px] text-[var(--color-text-tertiary)] mt-1 block">
                {isTr ? "Takvim uzatılmayacaksa 0 bırakın." : "Leave 0 if schedule unchanged."}
              </span>
            </div>
          </div>

          {/* Impact Preview Card */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>{isTr ? "Sözleşme Etki Simülasyonu" : "Contract Impact Simulation"}</span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {isTr ? (
                <>
                  Bu değişiklik onaylandığında ana sözleşmeye{" "}
                  <strong className="text-[var(--color-text-primary)]">
                    +{budgetNum.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {currency}
                  </strong>{" "}
                  ek bedel ve{" "}
                  <strong className="text-[var(--color-text-primary)]">
                    +{daysNum} takvim günü
                  </strong>{" "}
                  teslimat süresi eklenecek, resmi <strong>Zeyilname (Ek Protokol)</strong>{" "}
                  düzenlenecektir.
                </>
              ) : (
                <>
                  Once approved, this adds{" "}
                  <strong className="text-[var(--color-text-primary)]">
                    +{budgetNum.toFixed(2)} {currency}
                  </strong>{" "}
                  and <strong className="text-[var(--color-text-primary)]">+{daysNum} days</strong>{" "}
                  to the contract baseline with an official Addendum.
                </>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {isTr ? "Vazgeç" : "Cancel"}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="gap-2 bg-amber-600 hover:bg-amber-500 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isTr ? "Talebi Gönder" : "Submit Request"}</span>
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
