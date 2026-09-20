"use client";

import { useState } from "react";
import {
  Star,
  ShieldCheck,
  Award,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  Check,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { EMOJI_REGEX } from "@/src/lib/security/content-moderator";
import { ReviewDto } from "@/src/modules/reviews/types";

export interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagementId: string;
  counterpartyName: string;
  projectTitle: string;
  counterpartyRole: "EMPLOYER" | "FREELANCER";
  availableSkills?: string[];
  locale?: string;
  onSuccess?: (review: ReviewDto) => void;
}

const PRESET_TAGS_TR = [
  "Zamanında Teslimat",
  "Net İletişim",
  "Yüksek Kod Kalitesi",
  "Çözüm Odaklı",
  "Profesyonel Yaklaşım",
  "Hızlı Yanıt",
  "Tavsiye Ederim",
];

const PRESET_TAGS_EN = [
  "On-time Delivery",
  "Clear Communication",
  "High Code Quality",
  "Solution-Oriented",
  "Professional Conduct",
  "Quick Responses",
  "Highly Recommended",
];

function getOverallRatingDescription(rating: number, isTr: boolean): string {
  if (rating === 5) return isTr ? "Mükemmel iş birliği" : "Exceptional";
  if (rating >= 4) return isTr ? "Çok başarılı" : "Very Good";
  if (rating >= 3) return isTr ? "Orta / Yeterli" : "Satisfactory";
  return isTr ? "Beklenti altı" : "Needs Improvement";
}

function getCommunicationRatingDescription(rating: number, isTr: boolean): string {
  if (rating === 5) return isTr ? "Hızlı, şeffaf ve saygılı" : "Prompt & transparent";
  return isTr ? "Standart iletişim" : "Standard communication";
}

function getQualityRatingLabel(counterpartyRole: string, isTr: boolean): string {
  if (counterpartyRole === "EMPLOYER") {
    return isTr ? "Ödeme & Kapsam Doğruluğu" : "Payment & Scope Accuracy";
  }
  return isTr ? "İş Kalitesi & Taahhüt Uyumu" : "Quality & Scope Delivery";
}

function getQualityRatingDescription(rating: number, isTr: boolean): string {
  if (rating === 5) return isTr ? "Sıfır hata, eksiksiz taahhüt" : "Flawless delivery";
  return isTr ? "Makul seviye" : "Reasonable";
}

function getCharCountColorClass(charCount: number): string {
  if (charCount > 1000) return "text-rose-400 font-bold";
  if (charCount >= 20) return "text-emerald-400";
  return "text-[var(--color-text-tertiary)]";
}

export function ReviewSubmissionModal({
  isOpen,
  onClose,
  engagementId,
  counterpartyName,
  projectTitle,
  counterpartyRole,
  availableSkills = [],
  locale = "tr",
  onSuccess,
}: ReviewSubmissionModalProps) {
  const isTr = locale === "tr";

  const [overallRating, setOverallRating] = useState<number>(5);
  const [communicationRating, setCommunicationRating] = useState<number>(5);
  const [qualityRating, setQualityRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [endorsedSkills, setEndorsedSkills] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const presetTags = isTr ? PRESET_TAGS_TR : PRESET_TAGS_EN;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const toggleSkill = (skill: string) => {
    if (endorsedSkills.includes(skill)) {
      setEndorsedSkills(endorsedSkills.filter((s) => s !== skill));
    } else {
      setEndorsedSkills([...endorsedSkills, skill]);
    }
  };

  const hasEmoji = EMOJI_REGEX.test(comment);
  const charCount = comment.trim().length;
  const isTooShort = charCount < 20;
  const isTooLong = charCount > 1000;
  const canSubmit = !isSubmitting && !isTooShort && !isTooLong && !hasEmoji;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/work/${engagementId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          overallRating,
          communicationRating,
          qualityRating,
          comment: comment.trim(),
          tags: selectedTags,
          endorsedSkills,
          locale,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Değerlendirme kaydedilemedi.");
      }

      if (onSuccess && data.review) {
        onSuccess(data.review);
      }
      onClose();
    } catch (err: unknown) {
      const defaultErr = isTr
        ? "Değerlendirme gönderilirken beklenmedik bir hata oluştu."
        : "An unexpected error occurred while submitting review.";
      setErrorMessage(err instanceof Error ? err.message : defaultErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarSelector = (
    value: number,
    onChange: (v: number) => void,
    label: string,
    description: string
  ) => {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[var(--color-text-primary)]">{label}</span>
          <span className="text-[var(--color-text-tertiary)] font-mono font-medium">
            {value} / 5
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="p-1 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors focus:outline-none cursor-pointer"
              aria-label={`${star} star`}
            >
              <Star
                className={`h-6 w-6 transition-all ${
                  star <= value
                    ? "text-amber-400 fill-amber-400 scale-105"
                    : "text-[var(--color-border-subtle)] hover:text-amber-400/50"
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-[11px] text-[var(--color-text-secondary)] italic">
            {description}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl my-8 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                  {isTr ? "İş Birliği Değerlendirmesi & Puanlama" : "Rate & Review Collaboration"}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] truncate max-w-md">
                  {counterpartyName} &bull; {projectTitle}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Double-Blind Information Alert */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-blue-400">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>{isTr ? "Kör Eşzamanlı Açıklama Protokolü" : "Double-Blind Reveal Protocol"}</span>
          </div>
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Verdiğiniz puan ve yazdığınız yorum, karşı taraf da kendi değerlendirmesini tamamlayana veya 14 günlük yasal süre dolana kadar tamamen gizli tutulur. Misilleme ve şantaj riski olmadan dürüstçe değerlendirebilirsiniz."
              : "Your ratings and comments remain hidden until both parties submit their review or 14 days elapse. This eliminates retaliatory reviews and extortion."}
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star Ratings */}
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 p-4 space-y-4">
            {renderStarSelector(
              overallRating,
              setOverallRating,
              isTr ? "Genel Memnuniyet Puanı" : "Overall Satisfaction",
              getOverallRatingDescription(overallRating, isTr)
            )}

            {renderStarSelector(
              communicationRating,
              setCommunicationRating,
              isTr ? "İletişim & Ulaşılabilirlik" : "Communication & Availability",
              getCommunicationRatingDescription(communicationRating, isTr)
            )}

            {renderStarSelector(
              qualityRating,
              setQualityRating,
              getQualityRatingLabel(counterpartyRole, isTr),
              getQualityRatingDescription(qualityRating, isTr)
            )}
          </div>

          {/* Preset Characteristic Tags */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] block">
              {isTr ? "Öne Çıkan Nitelikler (Çoklu Seçim)" : "Key Highlights (Optional)"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presetTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-[11px] px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:border-blue-500/40"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skill Endorsement Tags (Signature Touch 2) */}
          {availableSkills.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>
                  {isTr
                    ? "Doğrulanmış Yetenekleri Onayla (Profilinde Rozete Dönüşür)"
                    : "Endorse Skills (Shown as Verified Badges on Profile)"}
                </span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableSkills.map((skill) => {
                  const isEndorsed = endorsedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                        isEndorsed
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/40 font-medium"
                          : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {isEndorsed && <Check className="h-3 w-3" />}
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-[var(--color-text-primary)]">
                {isTr ? "Doğrulanmış İş Yorumu" : "Verified Review Comment"}
              </label>
              <span
                className={`font-mono text-[11px] ${getCharCountColorClass(charCount)}`}
              >
                {charCount} / 1000 {isTooShort && `(Min 20)`}
              </span>
            </div>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isTr
                  ? `${counterpartyName} ile projedeki çalışma deneyiminizi, teknik yaklaşımını ve iletişimi özetleyin...`
                  : `Summarize your collaboration experience, technical approach, and communication with ${counterpartyName}...`
              }
              className="w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-3 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
            />
            {hasEmoji && (
              <p className="text-[11px] text-rose-400 font-medium">
                {isTr
                  ? "Platform güvenlik kuralları gereği değerlendirmelerde emoji kullanılamaz."
                  : "Emojis are prohibited in verified reviews."}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {isTr ? "Vazgeç" : "Cancel"}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!canSubmit}
              className="gap-1.5"
            >
              {isSubmitting ? (
                <span>{isTr ? "Mühürleniyor..." : "Submitting..."}</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isTr ? "Değerlendirmeyi Mühürle & Gönder" : "Seal & Submit Review"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
