"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { TextArea } from "../ui/text-area";
import { TextInput } from "../ui/text-input";
import { Select } from "../ui/select";
import { EMOJI_REGEX, validateContentAppropriateness } from "@/src/lib/security/content-moderator";
import { TaxCalculatorWidget } from "../finance/tax-calculator-widget";
import { Calculator, Sparkles } from "lucide-react";
import { ProposalPitchDoctorCard } from "./proposal-pitch-doctor-card";
import { SquadBuilderSection, SquadMemberDraft } from "./squad/squad-builder-section";
import { SquadRevenueEngine } from "@/src/modules/offers/squad-engine";
import { formatCurrency } from "@/src/lib/i18n/formatters";
import type { Locale } from "@/src/lib/i18n/config";

export interface SubmitOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  locale: string;
  offerId?: string;
  initialData?: {
    message?: string;
    budgetCurrency?: string;
    budgetMin?: string;
    budgetMax?: string;
    timelineValue?: string;
    timelineUnit?: "DAYS" | "WEEKS" | "MONTHS";
    isSquadOffer?: boolean;
    squadTitle?: string;
    squadMembers?: SquadMemberDraft[];
  };
  onSuccess?: (updatedData?: {
    message: string;
    budgetCurrency?: string | null;
    budgetMin?: string | null;
    budgetMax?: string | null;
    estimatedDurationValue?: number | null;
    estimatedDurationUnit?: string | null;
  }) => void;
}

function getDialogTitle(isEditing: boolean, isTr: boolean): string {
  if (isEditing) {
    return isTr ? "Teklifi Düzenle" : "Edit Proposal";
  }
  return isTr ? "Gizli Teklif Ver" : "Submit Private Offer";
}

function getDialogDescription(isEditing: boolean, listingTitle: string, isTr: boolean): string {
  if (isEditing) {
    return isTr
      ? `"${listingTitle}" ilanına sunduğunuz teklif parametrelerini güncelleyin.`
      : `Update your proposal parameters for "${listingTitle}".`;
  }
  return isTr
    ? `"${listingTitle}" başlıklı ilana teklifinizi iletin. Teklifiniz yalnızca ilan sahibine açıktır.`
    : `Send your proposal for "${listingTitle}". Your offer is private and visible only to the listing owner.`;
}

function getSuccessMessage(isEditing: boolean, isTr: boolean): string {
  if (isEditing) {
    return isTr
      ? "Teklifiniz başarıyla güncellendi ve revizyon kaydedildi."
      : "Your proposal has been successfully updated and recorded.";
  }
  return isTr
    ? "Teklifiniz başarıyla ilan sahibine iletildi. İlan sahibi teklifinizi değerlendirdikten sonra size bildirim gelecektir."
    : "Your offer has been submitted to the listing owner. You will be notified when they review it.";
}

function getPitchDoctorToggleLabel(show: boolean, isTr: boolean): string {
  if (show) {
    return isTr ? "Asistanı Gizle" : "Hide Assistant";
  }
  return isTr
    ? "Operis AI: Teklifi Değerlendir & Güçlendir"
    : "Operis AI: Review & Enhance Pitch";
}

function getTaxCalculatorToggleLabel(show: boolean, isTr: boolean): string {
  if (show) {
    return isTr ? "Hesaplayıcıyı Gizle" : "Hide Calculator";
  }
  return isTr ? "Stopaj & SMM Hesaplayıcı" : "Tax & SMM Calculator";
}

function getSubmitButtonLabel(isEditing: boolean, isTr: boolean): string {
  if (isEditing) {
    return isTr ? "Değişiklikleri Kaydet" : "Save Changes";
  }
  return isTr ? "Teklifi Gönder" : "Send Offer";
}

export function SubmitOfferModal({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  locale,
  offerId,
  initialData,
  onSuccess,
}: SubmitOfferModalProps) {
  const isTr = locale === "tr";
  const isEditing = Boolean(offerId);
  const [message, setMessage] = useState(initialData?.message ?? "");
  const [budgetCurrency, setBudgetCurrency] = useState(
    initialData?.budgetCurrency ?? (isTr ? "TRY" : "USD")
  );
  const [budgetMin, setBudgetMin] = useState(initialData?.budgetMin ?? "");
  const [budgetMax, setBudgetMax] = useState(initialData?.budgetMax ?? "");
  const [timelineValue, setTimelineValue] = useState(initialData?.timelineValue ?? "");
  const [timelineUnit, setTimelineUnit] = useState<"DAYS" | "WEEKS" | "MONTHS">(
    initialData?.timelineUnit ?? "WEEKS"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showTaxCalculator, setShowTaxCalculator] = useState(false);
  const [showPitchDoctor, setShowPitchDoctor] = useState(false);
  const [isSquadOffer, setIsSquadOffer] = useState(initialData?.isSquadOffer ?? false);
  const [squadTitle, setSquadTitle] = useState(initialData?.squadTitle ?? "");
  const [squadMembers, setSquadMembers] = useState<SquadMemberDraft[]>(
    initialData?.squadMembers ?? []
  );

  useEffect(() => {
    if (isOpen) {
      setShowPitchDoctor(false);
      if (initialData) {
        if (initialData.message !== undefined) setMessage(initialData.message);
        if (initialData.budgetCurrency !== undefined) setBudgetCurrency(initialData.budgetCurrency);
        if (initialData.budgetMin !== undefined) setBudgetMin(initialData.budgetMin);
        if (initialData.budgetMax !== undefined) setBudgetMax(initialData.budgetMax);
        if (initialData.timelineValue !== undefined) setTimelineValue(initialData.timelineValue);
        if (initialData.timelineUnit !== undefined) setTimelineUnit(initialData.timelineUnit);
        if (initialData.isSquadOffer !== undefined) setIsSquadOffer(initialData.isSquadOffer);
        if (initialData.squadTitle !== undefined) setSquadTitle(initialData.squadTitle);
        if (initialData.squadMembers !== undefined) setSquadMembers(initialData.squadMembers);
      }
      setSuccess(false);
      setError(null);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (message.trim().length < 50) {
      setError(
        isTr
          ? "Teklif açıklaması en az 50 karakter olmalıdır."
          : "Offer proposal must be at least 50 characters."
      );
      return;
    }

    if (EMOJI_REGEX.test(message)) {
      setError(
        isTr
          ? "Teklif açıklaması emoji içeremez. Lütfen profesyonel metin kullanınız."
          : "Offer proposal cannot contain emojis. Please use plain text."
      );
      return;
    }

    if (!validateContentAppropriateness(message).isValid) {
      setError(
        isTr
          ? "Teklif açıklamanız topluluk kurallarına aykırı ifadeler içermektedir."
          : "Offer proposal contains inappropriate or prohibited language."
      );
      return;
    }

    if ((budgetMin && parseFloat(budgetMin) < 0) || (budgetMax && parseFloat(budgetMax) < 0)) {
      setError(
        isTr ? "Bütçe tutarları sıfırdan küçük olamaz." : "Budget amounts cannot be negative."
      );
      return;
    }

    if (budgetMin && budgetMax && parseFloat(budgetMin) > parseFloat(budgetMax)) {
      setError(
        isTr
          ? "Minimum bütçe, maksimum bütçeden büyük olamaz."
          : "Minimum budget cannot exceed maximum budget."
      );
      return;
    }

    if (timelineValue && parseInt(timelineValue, 10) <= 0) {
      setError(isTr ? "Tahmini süre en az 1 olmalıdır." : "Estimated duration must be at least 1.");
      return;
    }

    if (isSquadOffer) {
      if (squadMembers.length < 2) {
        setError(
          isTr
            ? "Çevik ekip (kolektif) teklifi en az 2 üyeden oluşmalıdır."
            : "Squad proposal must include at least 2 team members."
        );
        return;
      }
      const validation = SquadRevenueEngine.validateSquadDistribution(squadMembers);
      if (!validation.isValid) {
        setError(
          validation.error ||
            (isTr ? "Hakediş dağılımı geçersizdir." : "Invalid squad distribution.")
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const endpoint = isEditing ? `/api/offers/${offerId}/update` : "/api/offers/submit";
      const payload = isEditing
        ? {
            message,
            budgetCurrency: budgetMin || budgetMax ? budgetCurrency : null,
            budgetMin: budgetMin || null,
            budgetMax: budgetMax || null,
            estimatedDurationValue: timelineValue ? parseInt(timelineValue, 10) : null,
            estimatedDurationUnit: timelineValue ? timelineUnit : null,
            isSquadOffer,
            squadTitle: isSquadOffer ? squadTitle || null : null,
            squadMembers: isSquadOffer ? squadMembers : undefined,
          }
        : {
            listingId,
            message,
            budgetCurrency: budgetMin || budgetMax ? budgetCurrency : null,
            budgetMin: budgetMin || null,
            budgetMax: budgetMax || null,
            estimatedDurationValue: timelineValue ? parseInt(timelineValue, 10) : null,
            estimatedDurationUnit: timelineValue ? timelineUnit : null,
            isSquadOffer,
            squadTitle: isSquadOffer ? squadTitle || null : null,
            squadMembers: isSquadOffer ? squadMembers : undefined,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (isEditing ? "Failed to update offer" : "Failed to submit offer")
        );
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess({
          message,
          budgetCurrency: budgetMin || budgetMax ? budgetCurrency : null,
          budgetMin: budgetMin || null,
          budgetMax: budgetMax || null,
          estimatedDurationValue: timelineValue ? parseInt(timelineValue, 10) : null,
          estimatedDurationUnit: timelineValue ? timelineUnit : null,
        });
      }
    } catch (err: unknown) {
      let defaultErr = isTr
        ? "Teklif gönderilemedi. Lütfen tekrar deneyin."
        : "Could not submit offer. Please try again.";
      if (isEditing) {
        defaultErr = isTr
          ? "Teklif güncellenemedi. Lütfen tekrar deneyin."
          : "Could not update offer. Please try again.";
      }
      setError(err instanceof Error ? err.message : defaultErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={getDialogTitle(Boolean(isEditing), isTr)}
      description={getDialogDescription(Boolean(isEditing), listingTitle, isTr)}
      className="max-w-2xl"
    >
      {success ? (
        <div className="space-y-5 py-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm text-[var(--color-text-primary)] leading-relaxed">
            {getSuccessMessage(Boolean(isEditing), isTr)}
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              setSuccess(false);
              onClose();
            }}
            className="w-full font-semibold"
          >
            {isTr ? "Tamam" : "Done"}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                {isTr ? "Teklif açıklaması" : "Proposal message"}
              </label>
              <button
                type="button"
                onClick={() => setShowPitchDoctor((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold transition-all px-2.5 py-1 rounded-lg border cursor-pointer ${
                  showPitchDoctor
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-xs"
                    : "bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-400 hover:text-indigo-300 border-indigo-500/25"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 fill-indigo-400/30 text-indigo-400" />
                <span>{getPitchDoctorToggleLabel(showPitchDoctor, isTr)}</span>
              </button>
            </div>

            {showPitchDoctor && (
              <div className="pt-1 pb-1">
                <ProposalPitchDoctorCard
                  listingId={listingId}
                  listingTitle={listingTitle}
                  proposalMessage={message}
                  proposedBudgetMin={budgetMin}
                  proposedBudgetMax={budgetMax}
                  proposedCurrency={budgetCurrency}
                  proposedTimelineValue={timelineValue}
                  proposedTimelineUnit={timelineUnit}
                  locale={locale}
                  onClose={() => setShowPitchDoctor(false)}
                  onApplyEnhancement={(enhancedText) => {
                    setMessage(enhancedText);
                  }}
                />
              </div>
            )}

            <TextArea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isTr
                  ? "Bu ilan için uzmanlığınızı, yaklaşımınızı ve yapabileceklerinizi detaylıca açıklayın (en az 50 karakter)..."
                  : "Explain your experience, approach, and how you will deliver this project (minimum 50 characters)..."
              }
              minLength={50}
              maxLength={3000}
              showCount
              required
              rows={5}
            />
          </div>

          {/* Budget section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                {isTr ? "Önerilen Bütçe (İsteğe Bağlı)" : "Proposed Budget (Optional)"}
              </label>
              <button
                type="button"
                onClick={() => setShowTaxCalculator((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>{getTaxCalculatorToggleLabel(showTaxCalculator, isTr)}</span>
              </button>
            </div>

            {showTaxCalculator && (
              <div className="pt-1 pb-2">
                <TaxCalculatorWidget
                  initialAmount={budgetMax || budgetMin || "50000"}
                  currency={budgetCurrency}
                  locale={locale}
                  compactMode
                  onClose={() => setShowTaxCalculator(false)}
                  onApplyToProposal={(grossAmount, proposalNote) => {
                    setBudgetMin(String(grossAmount));
                    setBudgetMax(String(grossAmount));
                    if (proposalNote && !message.includes("[Bütçe")) {
                      setMessage((prev) => (prev ? `${prev}\n\n${proposalNote}` : proposalNote));
                    }
                    setShowTaxCalculator(false);
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_1fr] gap-3">
              <Select
                label={isTr ? "Para Birimi" : "Currency"}
                value={budgetCurrency}
                onChange={(e) => setBudgetCurrency(e.target.value)}
                options={[
                  { value: "TRY", label: "TRY (₺)" },
                  { value: "USD", label: "USD ($)" },
                  { value: "EUR", label: "EUR (€)" },
                  { value: "GBP", label: "GBP (£)" },
                ]}
                className="w-full"
              />
              <TextInput
                type="number"
                min="0"
                label={isTr ? "Minimum Tutar (En Az)" : "Minimum Amount"}
                placeholder={isTr ? "Örn: 15000" : "e.g. 15000"}
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
              />
              <TextInput
                type="number"
                min="0"
                label={isTr ? "Maksimum Tutar (En Çok)" : "Maximum Amount"}
                placeholder={isTr ? "Örn: 35000" : "e.g. 35000"}
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
              />
            </div>

            {(budgetMin || budgetMax) && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
                <span className="text-blue-300/80 font-medium">
                  {isTr ? "Öngörülen Teklif:" : "Proposed Budget:"}
                </span>
                <span className="font-semibold text-blue-200">
                  {budgetMin && budgetMax
                    ? budgetMin === budgetMax
                      ? `${formatCurrency(parseFloat(budgetMin) || 0, budgetCurrency, (locale as Locale) || "tr")} (${isTr ? "Sabit Tutar" : "Fixed"})`
                      : `${formatCurrency(parseFloat(budgetMin) || 0, budgetCurrency, (locale as Locale) || "tr")} – ${formatCurrency(parseFloat(budgetMax) || 0, budgetCurrency, (locale as Locale) || "tr")} aralığında`
                    : budgetMin
                    ? `${isTr ? "En az" : "At least"} ${formatCurrency(parseFloat(budgetMin) || 0, budgetCurrency, (locale as Locale) || "tr")}`
                    : `${isTr ? "En çok" : "At most"} ${formatCurrency(parseFloat(budgetMax) || 0, budgetCurrency, (locale as Locale) || "tr")}`}
                </span>
              </div>
            )}
          </div>

          {/* Timeline section */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
              {isTr ? "Tahmini Süre (İsteğe Bağlı)" : "Estimated Timeline (Optional)"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <TextInput
                type="number"
                min="1"
                placeholder={isTr ? "Süre (örn: 2)" : "Duration (e.g. 2)"}
                value={timelineValue}
                onChange={(e) => setTimelineValue(e.target.value)}
              />
              <Select
                value={timelineUnit}
                onChange={(e) => setTimelineUnit(e.target.value as "DAYS" | "WEEKS" | "MONTHS")}
                options={[
                  { value: "DAYS", label: isTr ? "Gün" : "Days" },
                  { value: "WEEKS", label: isTr ? "Hafta" : "Weeks" },
                  { value: "MONTHS", label: isTr ? "Ay" : "Months" },
                ]}
              />
            </div>
          </div>

          {/* Squad / Agile Consortium Section */}
          <SquadBuilderSection
            enabled={isSquadOffer}
            onToggle={setIsSquadOffer}
            squadTitle={squadTitle}
            onTitleChange={setSquadTitle}
            members={squadMembers}
            onChangeMembers={setSquadMembers}
            totalBudget={parseFloat(budgetMax || budgetMin || "0") || undefined}
            currency={budgetCurrency}
            locale={locale}
          />

          {/* Statutory disclaimer */}
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Operis kar amacı gütmeyen, ücretsiz bir platformdur; ticari risk almaz ve para tutmaz. Teklifiniz kabul edildiğinde karşı tarafla doğrudan anlaşır ve kendi bağımsız sözleşmenizi yürütürsünüz."
              : "Operis is a non-profit, zero-commission network; we assume zero commercial risk and hold no funds. Upon acceptance, counterparties agree directly and manage their own independent contracts."}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              {isTr ? "İptal" : "Cancel"}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="font-semibold"
              isLoading={isSubmitting}
            >
              {getSubmitButtonLabel(Boolean(isEditing), isTr)}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
