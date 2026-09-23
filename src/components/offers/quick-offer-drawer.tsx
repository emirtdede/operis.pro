"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Zap,
  Sparkles,
  SlidersHorizontal,
  Check,
  AlertCircle,
  ArrowRight,
  BookmarkPlus,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import { TextArea } from "../ui/text-area";
import { TextInput } from "../ui/text-input";
import { Select } from "../ui/select";
import { Badge } from "../ui/badge";
import { EMOJI_REGEX, validateContentAppropriateness } from "@/src/lib/security/content-moderator";

export interface QuickOfferDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    id: string;
    slug: string;
    title: string;
    categoryName: string;
    budgetMin: string | null;
    budgetMax: string | null;
    budgetCurrency: string | null;
    ownerDisplayName: string;
  };
  locale: string;
  onOpenFullModal?: (initialData?: {
    message: string;
    budgetCurrency: string;
    budgetMin: string;
    budgetMax: string;
    timelineValue: string;
    timelineUnit: "DAYS" | "WEEKS" | "MONTHS";
  }) => void;
  onSuccess?: () => void;
}

interface TemplateItem {
  id: string;
  name: string;
  message: string;
  budgetCurrency?: string | null;
  budgetMin?: string | null;
  budgetMax?: string | null;
  estimatedDurationValue?: number | null;
  estimatedDurationUnit?: "DAYS" | "WEEKS" | "MONTHS" | null;
}

function getPresetButtonTitle(messageLength: number, isTr: boolean): string {
  if (messageLength < 50) {
    return isTr
      ? "Şablon kaydetmek için en az 50 karakter yazınız"
      : "Write at least 50 characters to save as preset";
  }
  return isTr ? "Bu teklifi yeni şablon olarak kaydet" : "Save this offer as new preset";
}

function getSubmitOfferLabel(isSubmitting: boolean, isTr: boolean): string {
  if (isSubmitting) {
    return isTr ? "İletiliyor..." : "Submitting...";
  }
  return isTr ? "Teklifi İlet" : "Send Proposal";
}

function getSaveTemplateLabel(isSaving: boolean, isTr: boolean): string {
  if (isSaving) {
    return isTr ? "Kaydediliyor..." : "Saving...";
  }
  return isTr ? "Kaydet" : "Save";
}

const getDefaultTemplates = (isTr: boolean): TemplateItem[] => [
  {
    id: "default-1",
    name: isTr ? "Standart Teklif" : "Standard Offer",
    message: isTr
      ? "Merhaba {{ilan_sahibi}}, '{{ilan_basligi}}' ilanınızı detaylıca inceledim. {{kategori}} alanındaki teknik tecrübem ve referanslarımla kaliteli ve zamanında teslimat sağlayabilirim."
      : "Hello {{owner_name}}, I have carefully reviewed the technical requirements for '{{project_title}}'. With my experience in {{category}} and relevant reference work, I can ensure high-quality delivery within your target timeline.",
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
      ? "Merhaba, '{{ilan_basligi}}' ilanınız için doğrudan mimari ve geliştirme desteği sunabilirim. Gereksinimleri hızla netleştirip başlayabiliriz."
      : "Hello, I can provide direct architectural guidance and development support for '{{project_title}}'. We can quickly clarify the requirements and begin immediately.",
    budgetCurrency: isTr ? "TRY" : "USD",
    budgetMin: isTr ? "5000" : "250",
    budgetMax: isTr ? "15000" : "600",
    estimatedDurationValue: 1,
    estimatedDurationUnit: "WEEKS",
  },
];

export function QuickOfferDrawer({
  isOpen,
  onClose,
  listing,
  locale,
  onOpenFullModal,
  onSuccess,
}: QuickOfferDrawerProps) {
  const isTr = locale === "tr";
  const [templates, setTemplates] = useState<TemplateItem[]>(() => getDefaultTemplates(isTr));
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default-1");

  const [message, setMessage] = useState("");
  const [budgetCurrency, setBudgetCurrency] = useState(isTr ? "TRY" : "USD");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [timelineValue, setTimelineValue] = useState("2");
  const [timelineUnit, setTimelineUnit] = useState<"DAYS" | "WEEKS" | "MONTHS">("WEEKS");

  // Save template state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateSaveName, setTemplateSaveName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateSaveError, setTemplateSaveError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const hasUserEditedRef = useRef(false);

  // Apply template with dynamic interpolation
  const applyTemplate = useCallback(
    (tpl: TemplateItem) => {
      setSelectedTemplateId(tpl.id);
      let interpolated = tpl.message;
      interpolated = interpolated.replace(/\{\{ilan_basligi\}\}/g, listing.title);
      interpolated = interpolated.replace(/\{\{proje_basligi\}\}/g, listing.title);
      interpolated = interpolated.replace(/\{\{project_title\}\}/g, listing.title);
      interpolated = interpolated.replace(/\{\{kategori\}\}/g, listing.categoryName);
      interpolated = interpolated.replace(/\{\{category\}\}/g, listing.categoryName);
      interpolated = interpolated.replace(
        /\{\{ilan_sahibi\}\}/g,
        listing.ownerDisplayName || (isTr ? "İlan Sahibi" : "Listing Owner")
      );
      interpolated = interpolated.replace(
        /\{\{owner_name\}\}/g,
        listing.ownerDisplayName || (isTr ? "İlan Sahibi" : "Listing Owner")
      );

      setMessage(interpolated);

      if (tpl.budgetCurrency) setBudgetCurrency(tpl.budgetCurrency);
      if (tpl.budgetMin) setBudgetMin(tpl.budgetMin);
      if (tpl.budgetMax) setBudgetMax(tpl.budgetMax);
      if (tpl.estimatedDurationValue) setTimelineValue(String(tpl.estimatedDurationValue));
      if (tpl.estimatedDurationUnit) setTimelineUnit(tpl.estimatedDurationUnit);
    },
    [listing, isTr]
  );

  // Load templates from API or fallback to localized defaults
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch(`/api/offers/templates?locale=${locale}`, {
          headers: {
            "x-locale": locale,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.templates && data.templates.length > 0) {
            setTemplates(data.templates);
            if (!hasUserEditedRef.current) {
              applyTemplate(data.templates[0]);
            }
            return;
          }
        }
      } catch {
        // Fallback to localized defaults
      }
      const fallbackDefaults = getDefaultTemplates(isTr);
      setTemplates(fallbackDefaults);
      const firstDefault = fallbackDefaults[0];
      if (!hasUserEditedRef.current && firstDefault) {
        applyTemplate(firstDefault);
      }
    }
    if (isOpen) {
      hasUserEditedRef.current = false;
      setIsSuccess(false);
      setError(null);
      setBudgetCurrency(isTr ? "TRY" : "USD");
      loadTemplates();
    }
  }, [isOpen, locale, isTr, applyTemplate]);

  // Save current proposal as new template
  const handleSaveAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateSaveName.trim()) return;
    setIsSavingTemplate(true);
    setTemplateSaveError(null);
    try {
      const res = await fetch("/api/offers/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          name: templateSaveName.trim(),
          message: message.trim(),
          budgetCurrency: budgetMin || budgetMax ? budgetCurrency : null,
          budgetMin: budgetMin || null,
          budgetMax: budgetMax || null,
          estimatedDurationValue: timelineValue ? parseInt(timelineValue, 10) : null,
          estimatedDurationUnit: timelineValue ? timelineUnit : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (isTr ? "Şablon kaydedilemedi." : "Failed to save template.")
        );
      }
      setShowSaveModal(false);
      setTemplateSaveName("");
      // Refresh templates
      const updatedRes = await fetch(`/api/offers/templates?locale=${locale}`, {
        headers: { "x-locale": locale },
      });
      if (updatedRes.ok) {
        const d = await updatedRes.json();
        if (d.templates) {
          setTemplates(d.templates);
          if (data.template?.id) {
            setSelectedTemplateId(data.template.id);
          }
        }
      }
    } catch (err: unknown) {
      setTemplateSaveError(err instanceof Error ? err.message : "Error");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (tplId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/offers/templates?id=${tplId}`, {
        method: "DELETE",
        headers: { "x-locale": locale },
      });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== tplId));
        const firstTemplate = templates[0];
        if (selectedTemplateId === tplId && firstTemplate) {
          applyTemplate(firstTemplate);
        }
      }
    } catch {
      // ignore
    }
  };

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (message.trim().length < 50) {
      setError(
        isTr
          ? "Teklif mesajı en az 50 karakter olmalıdır."
          : "Offer proposal must be at least 50 characters."
      );
      return;
    }

    if (EMOJI_REGEX.test(message)) {
      setError(
        isTr
          ? "Teklif mesajı emoji içeremez. Lütfen profesyonel metin kullanınız."
          : "Offer message cannot contain emojis. Please use plain text."
      );
      return;
    }

    if (!validateContentAppropriateness(message).isValid) {
      setError(
        isTr
          ? "Teklif mesajınız topluluk kurallarına aykırı ifadeler içermektedir."
          : "Offer message contains inappropriate or prohibited language."
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

    const parsedDuration =
      timelineValue && !isNaN(parseInt(timelineValue, 10)) && parseInt(timelineValue, 10) > 0
        ? parseInt(timelineValue, 10)
        : null;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/offers/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          listingId: listing.id,
          message: message.trim(),
          budgetCurrency: budgetMin || budgetMax ? budgetCurrency : null,
          budgetMin: budgetMin || null,
          budgetMax: budgetMax || null,
          estimatedDurationValue: parsedDuration,
          estimatedDurationUnit: parsedDuration ? timelineUnit : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isTr ? "Teklif gönderilemedi." : "Failed to submit offer."));
      }

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const defaultErr = isTr
        ? "Teklif iletilemedi. Lütfen tekrar deneyin."
        : "Failed to submit offer. Please try again.";
      setError(err instanceof Error ? err.message : defaultErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchToFull = () => {
    onClose();
    if (onOpenFullModal) {
      onOpenFullModal({
        message,
        budgetCurrency,
        budgetMin,
        budgetMax,
        timelineValue,
        timelineUnit,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200 flex justify-end">
      <div
        className="relative w-full max-w-lg bg-[var(--color-surface-base)] border-l border-[var(--color-border-subtle)] shadow-2xl flex flex-col h-full transform transition-transform ease-out duration-300 animate-in slide-in-from-right"
        role="dialog"
        aria-modal="true"
        aria-label={isTr ? "Hızlı Teklif Çekmecesi" : "Quick Offer Drawer"}
      >
        {/* Header */}
        <div className="p-5 border-b border-[var(--color-border-subtle)] flex items-center justify-between bg-[var(--color-surface-base)]/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-500">
              <Zap className="h-4 w-4 fill-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <span>{isTr ? "Hızlı Teklif Ver" : "Quick Proposal"}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                  1-Click
                </span>
              </h2>
              <p className="text-xs text-[var(--color-text-tertiary)] truncate max-w-xs sm:max-w-sm">
                {listing.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            aria-label={isTr ? "Kapat" : "Close"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-[var(--color-text-secondary)]">
          {isSuccess ? (
            <div className="py-12 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                <Check className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                {isTr ? "Teklif Başarıyla İletildi!" : "Proposal Submitted Successfully!"}
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto leading-relaxed">
                {isTr
                  ? `"${listing.title}" ilanına teklifiniz AES-256 şifreli olarak ilan sahibine ulaştırıldı.`
                  : `Your proposal for "${listing.title}" was securely transmitted to the listing owner.`}
              </p>
              <div className="pt-4">
                <Button variant="primary" size="md" onClick={onClose} className="w-full">
                  {isTr ? "Kapat" : "Close"}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Target Project Summary Mini-Card */}
              <div className="p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/60 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <Badge
                    variant="secondary"
                    className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]"
                  >
                    {listing.categoryName}
                  </Badge>
                  <span className="text-[var(--color-text-tertiary)]">
                    {isTr ? "İlan Sahibi:" : "Owner:"}{" "}
                    <strong className="text-[var(--color-text-primary)] font-medium">
                      {listing.ownerDisplayName}
                    </strong>
                  </span>
                </div>
                <div className="text-xs font-semibold text-[var(--color-text-primary)] line-clamp-1">
                  {listing.title}
                </div>
              </div>

              {/* Template Chips Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    {isTr ? "Hazır Teklif Şablonları" : "Proposal Presets"}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-tertiary)]">
                    {isTr ? "Dinamik Yer Tutuculu" : "With Placeholders"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {templates.map((tpl) => {
                    const isCustom = !tpl.id.startsWith("default-");
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => {
                          applyTemplate(tpl);
                          hasUserEditedRef.current = false;
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                          selectedTemplateId === tpl.id
                            ? "bg-blue-500/15 border-blue-500/40 text-blue-400 font-semibold"
                            : "bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        }`}
                      >
                        <span>{tpl.name}</span>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                            title={isTr ? "Şablonu Sil" : "Delete Preset"}
                            className="text-[var(--color-text-tertiary)] hover:text-red-400 p-0.5 rounded transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setShowSaveModal(true)}
                    disabled={message.length < 50}
                    title={getPresetButtonTitle(message.length, isTr)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs border border-dashed border-blue-500/40 text-blue-400 hover:bg-blue-500/10 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" />
                    <span>{isTr ? "+ Şablon Yap" : "+ Save Preset"}</span>
                  </button>
                </div>
              </div>

              {/* Proposal Message Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-[var(--color-text-primary)]">
                    {isTr ? "Teklif Açıklaması" : "Proposal Message"}
                  </label>
                  <span
                    className={`text-[10px] ${
                      message.length < 50
                        ? "text-amber-500 font-medium"
                        : "text-[var(--color-text-tertiary)]"
                    }`}
                  >
                    {message.length} / 3000 {isTr ? "(En az 50)" : "(Min 50)"}
                  </span>
                </div>
                <TextArea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    hasUserEditedRef.current = true;
                  }}
                  rows={5}
                  placeholder={
                    isTr
                      ? "İlan sahibine uzmanlığınızı ve yaklaşımınızı anlatan net mesaj..."
                      : "Describe your approach and technical capability..."
                  }
                  required
                />
              </div>

              {/* Commercial Specs (Budget & Timeline) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {isTr ? "Bütçe Aralığı" : "Budget Range"}
                  </label>
                  <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-1.5">
                    <Select
                      value={budgetCurrency}
                      onChange={(e) => setBudgetCurrency(e.target.value)}
                      options={[
                        { value: "TRY", label: "TRY" },
                        { value: "USD", label: "USD" },
                        { value: "EUR", label: "EUR" },
                        { value: "GBP", label: "GBP" },
                      ]}
                      className="w-full xs:w-24 shrink-0 text-xs"
                    />
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <TextInput
                        type="number"
                        min="0"
                        placeholder="Min"
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(e.target.value)}
                        className="text-xs flex-1 min-w-0"
                      />
                      <span className="text-[var(--color-text-tertiary)] shrink-0">-</span>
                      <TextInput
                        type="number"
                        min="0"
                        placeholder="Max"
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(e.target.value)}
                        className="text-xs flex-1 min-w-0"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {isTr ? "Tahmini Süre" : "Estimated Timeline"}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <TextInput
                      type="number"
                      min="1"
                      placeholder="2"
                      value={timelineValue}
                      onChange={(e) => setTimelineValue(e.target.value)}
                      className="text-xs"
                    />
                    <Select
                      value={timelineUnit}
                      onChange={(e) =>
                        setTimelineUnit(e.target.value as "DAYS" | "WEEKS" | "MONTHS")
                      }
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

              {/* Error Box */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Fallback to Full Modal Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSwitchToFull}
                  className="w-full py-2 px-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 hover:bg-[var(--color-surface-hover)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400" />
                  <span>
                    {isTr ? "Gelişmiş Moda Geç (Tam Modal)" : "Switch to Detailed Proposal"}
                  </span>
                  <ArrowRight className="h-3 w-3 text-[var(--color-text-tertiary)]" />
                </button>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="w-1/3">
                  {isTr ? "Vazgeç" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-2/3 font-semibold flex items-center justify-center gap-2"
                  disabled={isSubmitting || message.trim().length < 50}
                >
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  <span>{getSubmitOfferLabel(isSubmitting, isTr)}</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
        >
          <form
            onSubmit={handleSaveAsTemplate}
            className="relative w-full max-w-sm rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                {isTr ? "Yeni Teklif Şablonu Kaydet" : "Save as Offer Preset"}
              </h3>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)]">
              {isTr
                ? "Mevcut teklif metniniz ve ticari şartlarınız gelecekteki ilanlara hızlı teklif verebilmeniz için hesabınıza kaydedilecektir."
                : "Your current message and terms will be saved to your account for one-click reuse."}
            </p>

            {templateSaveError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {templateSaveError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                {isTr ? "Şablon Adı" : "Preset Name"}
              </label>
              <TextInput
                value={templateSaveName}
                onChange={(e) => setTemplateSaveName(e.target.value)}
                placeholder={isTr ? "Örn: React & Next.js İlanları" : "e.g., Full Stack Web Apps"}
                required
                className="text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSaveModal(false)}
                disabled={isSavingTemplate}
              >
                {isTr ? "Vazgeç" : "Cancel"}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSavingTemplate || !templateSaveName.trim()}
              >
                {getSaveTemplateLabel(isSavingTemplate, isTr)}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
