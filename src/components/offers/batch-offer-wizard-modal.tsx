"use client";

import { useState, useEffect } from "react";
import {
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { TextArea } from "../ui/text-area";
import { TextInput } from "../ui/text-input";
import { Select } from "../ui/select";
import { Badge } from "../ui/badge";
import { EMOJI_REGEX, validateContentAppropriateness } from "@/src/lib/security/content-moderator";

export interface BatchListingTarget {
  id: string;
  slug: string;
  title: string;
  categoryName: string;
  budgetMin: string | null;
  budgetMax: string | null;
  budgetCurrency: string | null;
  ownerDisplayName: string;
}

export interface BatchOfferWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedListings: BatchListingTarget[];
  locale: string;
  onRemoveListing?: (id: string) => void;
  onSuccess?: () => void;
}

interface BatchResultItem {
  listingId: string;
  status: "SUCCESS" | "FAILED";
  offerId?: string;
  code?: string;
  message?: string;
}

function getBatchSubmitButtonLabel(isSubmitting: boolean, count: number, isTr: boolean): string {
  if (isSubmitting) {
    return isTr ? "Teklifler İletiliyor..." : "Transmitting Proposals...";
  }
  return isTr ? `${count} Teklifi Gönder` : `Submit ${count} Proposals`;
}

function getResultDeliveryNote(isSuccess: boolean, fallbackMsg: string | undefined, isTr: boolean): string {
  if (isSuccess) {
    return isTr ? "AES-256 şifreli olarak ilan sahibine iletildi" : "Securely delivered to client";
  }
  return fallbackMsg || "";
}

function getResultStatusLabel(isSuccess: boolean, isTr: boolean): string {
  if (isSuccess) {
    return isTr ? "Başarılı" : "Success";
  }
  return isTr ? "Hata" : "Failed";
}

export function BatchOfferWizardModal({
  isOpen,
  onClose,
  selectedListings,
  locale,
  onRemoveListing,
  onSuccess,
}: BatchOfferWizardModalProps) {
  const isTr = locale === "tr";

  // Steps: 1 = Review & Configure, 2 = Capacity Acknowledgment, 3 = Results Receipt
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Template message with dynamic placeholders
  const [commonMessage, setCommonMessage] = useState(
    isTr
      ? "Merhaba {{ilan_sahibi}}, '{{ilan_basligi}}' ilanınızın teknik gereksinimlerini inceledim. {{kategori}} alanındaki tecrübem ve referanslarımla ilanınızda hedeflenen teslimatı takviminde yüksek kalitede gerçekleştirebilirim."
      : "Hello {{owner_name}}, I have reviewed the technical requirements for '{{project_title}}'. With my experience in {{category}} and proven background, I can deliver your project with high quality on schedule."
  );
  const [budgetCurrency, setBudgetCurrency] = useState(isTr ? "TRY" : "USD");
  const [budgetMin, setBudgetMin] = useState(isTr ? "15000" : "500");
  const [budgetMax, setBudgetMax] = useState(isTr ? "35000" : "1500");
  const [timelineValue, setTimelineValue] = useState("2");
  const [timelineUnit, setTimelineUnit] = useState<"DAYS" | "WEEKS" | "MONTHS">("WEEKS");

  // Mode: "common" (single smart template) or "custom" (per-project customization)
  const [mode, setMode] = useState<"common" | "custom">("common");
  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});
  const [activeTabListingId, setActiveTabListingId] = useState<string>(
    selectedListings[0]?.id || ""
  );
  const effectiveActiveTabId = selectedListings.some((l) => l.id === activeTabListingId)
    ? activeTabListingId
    : selectedListings[0]?.id || "";

  // Template presets integration
  const [availableTemplates, setAvailableTemplates] = useState<
    Array<{
      id: string;
      name: string;
      message: string;
      budgetCurrency?: string | null;
      budgetMin?: string | null;
      budgetMax?: string | null;
      estimatedDurationValue?: number | null;
      estimatedDurationUnit?: "DAYS" | "WEEKS" | "MONTHS" | null;
    }>
  >([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    async function loadPresets() {
      try {
        const res = await fetch(`/api/offers/templates?locale=${locale}`, {
          headers: { "x-locale": locale },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.templates && data.templates.length > 0) {
            setAvailableTemplates(data.templates);
            return;
          }
        }
      } catch {
        // Fallback
      }
      setAvailableTemplates([
        {
          id: "default-1",
          name: isTr ? "Standart Teklif" : "Standard Offer",
          message: isTr
            ? "Merhaba {{ilan_sahibi}}, '{{proje_basligi}}' projenizin teknik gereksinimlerini inceledim. {{kategori}} alanındaki tecrübem ve referanslarımla projenizi hedeflenen takvimde yüksek kalitede teslim edebilirim."
            : "Hello {{owner_name}}, I have reviewed the technical requirements for '{{project_title}}'. With my experience in {{category}} and proven background, I can deliver your project with high quality on schedule.",
          budgetCurrency: isTr ? "TRY" : "USD",
          budgetMin: isTr ? "15000" : "500",
          budgetMax: isTr ? "35000" : "1500",
          estimatedDurationValue: 2,
          estimatedDurationUnit: "WEEKS",
        },
        {
          id: "default-2",
          name: isTr ? "Hızlı Danışmanlık" : "Fast Advisory",
          message: isTr
            ? "Merhaba, '{{proje_basligi}}' projeniz için doğrudan mimari ve geliştirme desteği sunabilirim. Gereksinimleri hızla netleştirip başlayabiliriz."
            : "Hello, I can provide direct architectural guidance and development support for '{{project_title}}'. We can quickly clarify the requirements and begin immediately.",
          budgetCurrency: isTr ? "TRY" : "USD",
          budgetMin: isTr ? "5000" : "250",
          budgetMax: isTr ? "15000" : "600",
          estimatedDurationValue: 1,
          estimatedDurationUnit: "WEEKS",
        },
      ]);
    }
    loadPresets();
  }, [isOpen, locale, isTr]);

  // Step 2: Capacity check
  const [capacityAgreed, setCapacityAgreed] = useState(false);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [results, setResults] = useState<BatchResultItem[]>([]);
  const [submittedTargets, setSubmittedTargets] = useState<BatchListingTarget[]>([]);
  const [succeededCount, setSucceededCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  // Prepare custom message defaults if switching to custom mode
  const getListingMessage = (listing: BatchListingTarget) => {
    if (mode === "custom" && customMessages[listing.id]) {
      return customMessages[listing.id] ?? "";
    }
    let text = commonMessage;
    text = text.replace(/\{\{ilan_basligi\}\}/g, listing.title);
    text = text.replace(/\{\{proje_basligi\}\}/g, listing.title);
    text = text.replace(/\{\{project_title\}\}/g, listing.title);
    text = text.replace(/\{\{kategori\}\}/g, listing.categoryName);
    text = text.replace(/\{\{category\}\}/g, listing.categoryName);
    text = text.replace(
      /\{\{ilan_sahibi\}\}/g,
      listing.ownerDisplayName || (isTr ? "İlan Sahibi" : "Listing Owner")
    );
    text = text.replace(
      /\{\{owner_name\}\}/g,
      listing.ownerDisplayName || (isTr ? "İlan Sahibi" : "Listing Owner")
    );
    return text;
  };

  const handleCustomMessageChange = (listingId: string, val: string) => {
    setCustomMessages((prev) => ({ ...prev, [listingId]: val }));
  };

  // Submission handler
  const handleBatchSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    setSubmittedTargets([...selectedListings]);

    try {
      const parsedDuration =
        timelineValue && !isNaN(parseInt(timelineValue, 10)) ? parseInt(timelineValue, 10) : null;

      const items = selectedListings.map((listing) => {
        const msg = getListingMessage(listing);
        return {
          listingId: listing.id,
          message: msg.trim(),
          budgetCurrency: budgetMin || budgetMax ? budgetCurrency : null,
          budgetMin: budgetMin || null,
          budgetMax: budgetMax || null,
          estimatedDurationValue: parsedDuration,
          estimatedDurationUnit: parsedDuration ? timelineUnit : null,
        };
      });

      const idempotencyKey =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `batch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      const res = await fetch("/api/offers/batch-submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
          "x-locale": locale,
        },
        body: JSON.stringify({
          items,
          idempotencyKey,
          capacityConfirmed: capacityAgreed,
        }),
      });

      const data = await res.json();
      if (!res.ok && !data.results) {
        throw new Error(
          data.error || (isTr ? "Toplu teklif iletilemedi." : "Failed to submit batch offers.")
        );
      }

      setResults(data.results || []);
      setSucceededCount(data.succeededCount || 0);
      setFailedCount(data.failedCount || 0);
      setStep(3);
    } catch (err: unknown) {
      const defaultErr = isTr
        ? "Toplu işlem sırasında bir hata oluştu."
        : "An error occurred during batch submission.";
      setSubmitError(err instanceof Error ? err.message : defaultErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToStep2 = () => {
    setStep1Error(null);

    // Validate messages
    for (const listing of selectedListings) {
      const msg = getListingMessage(listing);
      if (msg.trim().length < 50) {
        setStep1Error(
          isTr
            ? `"${listing.title}" projesi için teklif mesajı en az 50 karakter olmalıdır.`
            : `Offer message for "${listing.title}" must be at least 50 characters.`
        );
        return;
      }

      if (EMOJI_REGEX.test(msg)) {
        setStep1Error(
          isTr
            ? `"${listing.title}" projesi için teklif mesajı emoji içeremez. Lütfen profesyonel metin kullanınız.`
            : `Offer message for "${listing.title}" cannot contain emojis. Please use plain text.`
        );
        return;
      }

      if (!validateContentAppropriateness(msg).isValid) {
        setStep1Error(
          isTr
            ? `"${listing.title}" projesi için teklif mesajınız topluluk kurallarına aykırı ifadeler içermektedir.`
            : `Offer message for "${listing.title}" contains inappropriate or prohibited language.`
        );
        return;
      }
    }

    // Validate budgets
    const minVal = budgetMin ? parseFloat(budgetMin) : null;
    const maxVal = budgetMax ? parseFloat(budgetMax) : null;

    if ((minVal !== null && minVal < 0) || (maxVal !== null && maxVal < 0)) {
      setStep1Error(
        isTr ? "Bütçe tutarları sıfırdan küçük olamaz." : "Budget amounts cannot be negative."
      );
      return;
    }

    if (minVal !== null && maxVal !== null && minVal > maxVal) {
      setStep1Error(
        isTr
          ? "Minimum bütçe, maksimum bütçeden büyük olamaz."
          : "Minimum budget cannot exceed maximum budget."
      );
      return;
    }

    // Validate timeline
    if (timelineValue && parseInt(timelineValue, 10) <= 0) {
      setStep1Error(
        isTr ? "Tahmini süre en az 1 olmalıdır." : "Estimated duration must be at least 1."
      );
      return;
    }

    setStep(2);
  };

  const handleClose = () => {
    if (succeededCount > 0 && onSuccess) {
      onSuccess();
    }
    setStep(1);
    setCapacityAgreed(false);
    setStep1Error(null);
    setSubmitError(null);
    setResults([]);
    setSubmittedTargets([]);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={isTr ? "Toplu Teklif Sihirbazı" : "Batch Offer Wizard"}
      description={
        isTr
          ? `Seçilen ${selectedListings.length} ilana güvenli ve kişiselleştirilmiş teklif iletin.`
          : `Submit secure, personalized proposals to ${selectedListings.length} selected listings.`
      }
      className="max-w-2xl"
    >
      <div className="space-y-5 py-1">
        {/* Step 1: Review & Configure */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Selected Listings Chips Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-blue-400" />
                  {isTr ? "Seçili İlanlar" : "Selected Listings"} ({selectedListings.length})
                </span>
                <span className="text-[10px] text-[var(--color-text-tertiary)]">
                  {isTr ? "Maksimum 5 İlan" : "Max 5 Listings"}
                </span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto p-1">
                {selectedListings.map((l) => (
                  <div
                    key={l.id}
                    className="p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px] px-1.5 py-0"
                        >
                          {l.categoryName}
                        </Badge>
                        <span className="font-semibold text-[var(--color-text-primary)] truncate block">
                          {l.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--color-text-tertiary)]">
                        {isTr ? "İlan Sahibi:" : "Client:"} {l.ownerDisplayName}
                      </span>
                    </div>

                    {onRemoveListing && selectedListings.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (effectiveActiveTabId === l.id) {
                            const remaining = selectedListings.filter((x) => x.id !== l.id);
                            setActiveTabListingId(remaining[0]?.id || "");
                          }
                          onRemoveListing(l.id);
                        }}
                        className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title={isTr ? "İlanı Çıkar" : "Remove Listing"}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mode Selector (Common Smart Template vs Per-Listing) */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-xs">
              <button
                type="button"
                onClick={() => setMode("common")}
                className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === "common"
                    ? "bg-[var(--color-surface-base)] text-[var(--color-text-primary)] shadow-sm font-semibold"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>{isTr ? "Akıllı Ortak Şablon" : "Smart Common Template"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("custom");
                  if (!activeTabListingId && selectedListings[0]) {
                    setActiveTabListingId(selectedListings[0].id);
                  }
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === "custom"
                    ? "bg-[var(--color-surface-base)] text-[var(--color-text-primary)] shadow-sm font-semibold"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <span>{isTr ? "İlana Özel Düzenle" : "Customize Per Listing"}</span>
              </button>
            </div>

            {/* Template Body Configuration */}
            {mode === "common" ? (
              <div className="space-y-2">
                {availableTemplates.length > 0 && (
                  <div className="space-y-1.5 pb-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
                        {isTr ? "Hazır Teklif Şablonları:" : "Proposal Presets:"}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-tertiary)]">
                        {isTr ? "1-Tıkla Uygula" : "1-Click Apply"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {availableTemplates.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            setSelectedTemplateId(tpl.id);
                            setCommonMessage(tpl.message);
                            if (tpl.budgetCurrency) setBudgetCurrency(tpl.budgetCurrency);
                            if (tpl.budgetMin) setBudgetMin(tpl.budgetMin);
                            if (tpl.budgetMax) setBudgetMax(tpl.budgetMax);
                            if (tpl.estimatedDurationValue)
                              setTimelineValue(String(tpl.estimatedDurationValue));
                            if (tpl.estimatedDurationUnit)
                              setTimelineUnit(tpl.estimatedDurationUnit);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                            selectedTemplateId === tpl.id
                              ? "bg-blue-500/15 border-blue-500/40 text-blue-400 font-semibold"
                              : "bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                          }`}
                        >
                          {tpl.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-[var(--color-text-primary)]">
                    {isTr ? "Ortak Teklif Mesajı" : "Common Proposal Message"}
                  </label>
                  <span className="text-[10px] text-blue-400">
                    {isTr
                      ? "{{ilan_basligi}}, {{kategori}}, {{ilan_sahibi}} otomatik uyarlanır"
                      : "{{project_title}}, {{category}}, {{owner_name}} are auto-injected"}
                  </span>
                </div>
                <TextArea
                  value={commonMessage}
                  onChange={(e) => setCommonMessage(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Tabs for each project */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {selectedListings.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setActiveTabListingId(l.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-all border ${
                        effectiveActiveTabId === l.id
                          ? "bg-blue-500/15 border-blue-500/40 text-blue-400 font-semibold"
                          : "bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {l.title.slice(0, 18)}...
                    </button>
                  ))}
                </div>

                {/* Textarea for active project */}
                {selectedListings.map(
                  (l) =>
                    effectiveActiveTabId === l.id && (
                      <div key={l.id} className="space-y-1.5">
                        <div className="text-xs font-medium text-[var(--color-text-primary)]">
                          {l.title}
                        </div>
                        <TextArea
                          value={getListingMessage(l)}
                          onChange={(e) => handleCustomMessageChange(l.id, e.target.value)}
                          rows={4}
                          required
                        />
                      </div>
                    )
                )}
              </div>
            )}

            {/* Commercial Specs (Budget & Timeline) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                  {isTr ? "Genel Bütçe Aralığı" : "General Budget Range"}
                </label>
                <div className="flex items-center gap-1.5">
                  <Select
                    value={budgetCurrency}
                    onChange={(e) => setBudgetCurrency(e.target.value)}
                    options={[
                      { value: "TRY", label: "TRY" },
                      { value: "USD", label: "USD" },
                      { value: "EUR", label: "EUR" },
                      { value: "GBP", label: "GBP" },
                    ]}
                    className="w-24 shrink-0 text-xs"
                  />
                  <TextInput
                    type="number"
                    placeholder="Min"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="text-xs"
                  />
                  <span className="text-[var(--color-text-tertiary)]">-</span>
                  <TextInput
                    type="number"
                    placeholder="Max"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                  {isTr ? "Tahmini Süre" : "Estimated Duration"}
                </label>
                <div className="flex items-center gap-1.5">
                  <TextInput
                    type="number"
                    placeholder="2"
                    value={timelineValue}
                    onChange={(e) => setTimelineValue(e.target.value)}
                    className="text-xs"
                  />
                  <Select
                    value={timelineUnit}
                    onChange={(e) => setTimelineUnit(e.target.value as "DAYS" | "WEEKS" | "MONTHS")}
                    options={[
                      { value: "DAYS", label: isTr ? "Gün" : "Days" },
                      { value: "WEEKS", label: isTr ? "Hafta" : "Weeks" },
                      { value: "MONTHS", label: isTr ? "Ay" : "Months" },
                    ]}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Step 1 Error Box */}
            {step1Error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{step1Error}</span>
              </div>
            )}

            {/* Step 1 Actions */}
            <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
              <Button variant="secondary" size="md" onClick={handleClose}>
                {isTr ? "İptal" : "Cancel"}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleProceedToStep2}
                className="flex items-center gap-2 font-semibold"
              >
                <span>{isTr ? "İleri: Kapasite Onayı" : "Next: Workload Confirmation"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Capacity & Legal Confirmation */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  {isTr ? "Aşırı Taahhüt ve İş Gücü Uyarısı" : "Capacity & Workload Notice"}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? `Seçtiğiniz ${selectedListings.length} ilanın tamamı ilan sahipleri tarafından aynı gün kabul edilebilir. Operis doğrudan eşleştirme platformu olduğundan, kabul edilen tekliflerdeki teslimat takvimi ve teknik gereksinimleri eksiksiz karşılama sorumluluğu tamamen teklif sahibine aittir.`
                  : `All ${selectedListings.length} selected projects could potentially be accepted concurrently. You must ensure you have adequate bandwidth to honor all deliverables.`}
              </p>
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={capacityAgreed}
                onChange={(e) => setCapacityAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-xs text-[var(--color-text-primary)] leading-relaxed font-medium">
                {isTr
                  ? `Seçilen ${selectedListings.length} ilanın tümü kabul edildiğinde teslimat takvimini ve taahhütlerimi eksiksiz yerine getirebilecek kapasiteye ve zamana sahip olduğumu beyan ederim.`
                  : `I certify that I have the technical capacity and availability to fulfill all ${selectedListings.length} projects if accepted.`}
              </span>
            </label>

            {submitError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {submitError}
              </div>
            )}

            <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setStep(1)}
                className="flex items-center gap-2"
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{isTr ? "Geri" : "Back"}</span>
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleBatchSubmit}
                disabled={!capacityAgreed || isSubmitting}
                className="flex items-center gap-2 font-semibold shadow-lg shadow-blue-500/20"
              >
                <Send className="h-4 w-4" />
                <span>{getBatchSubmitButtonLabel(isSubmitting, selectedListings.length, isTr)}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Receipt Summary (Envelope Results) */}
        {step === 3 && (
          <div className="space-y-5 py-2">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 border border-blue-500/25 text-blue-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                {isTr ? "Toplu Teklif İşlem Özeti" : "Batch Submission Summary"}
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {isTr
                  ? `${succeededCount} teklif başarıyla iletildi, ${failedCount} teklif hata aldı.`
                  : `${succeededCount} proposals submitted successfully, ${failedCount} failed.`}
              </p>
            </div>

            {/* Results breakdown per listing */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {results.map((r) => {
                const targetListing = (
                  submittedTargets.length > 0 ? submittedTargets : selectedListings
                ).find((l) => l.id === r.listingId);
                const isSuccess = r.status === "SUCCESS";
                return (
                  <div
                    key={r.listingId}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      isSuccess
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                        : "bg-red-500/5 border-red-500/20 text-red-400"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isSuccess ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--color-text-primary)] truncate">
                          {targetListing?.title || r.listingId}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-tertiary)]">
                          {getResultDeliveryNote(isSuccess, r.message || r.code, isTr)}
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant={isSuccess ? "success" : "danger"}
                      className="text-[10px] shrink-0"
                    >
                      {getResultStatusLabel(isSuccess, isTr)}
                    </Badge>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[var(--color-border-subtle)]">
              <Button variant="primary" size="md" onClick={handleClose} className="w-full">
                {isTr ? "Tamamla ve Kapat" : "Complete and Close"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
