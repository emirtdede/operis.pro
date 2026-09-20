"use client";

import { useState } from "react";
import { Flag, X, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "../ui/button";

interface ContextualReportModalProps {
  targetType: "listing" | "profile" | "offer";
  targetIdentifier: string;
  targetTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
}

const REPORT_REASONS = [
  {
    value: "SCAM_FRAUD",
    tr: "Dolandırıcılık veya Sahte İlan/Profil",
    en: "Scam, Fraud or Fake Listing/Profile",
  },
  {
    value: "HARASSMENT_ABUSE",
    tr: "Hakaret, Tehdit veya Taciz",
    en: "Harassment, Threats or Abuse",
  },
  { value: "SPAM", tr: "İstenmeyen İleti / Spam Tanıtım", en: "Spam or Irrelevant Promotion" },
  {
    value: "PRIVACY_EXPOSURE",
    tr: "Gizlilik İhlali / İzin Dışı İletişim Bilgisi",
    en: "Privacy Violation / Contact Info Leak",
  },
  {
    value: "INTELLECTUAL_PROPERTY",
    tr: "Telif Hakkı veya Fikri Mülkiyet İhlali",
    en: "Intellectual Property / Copyright",
  },
  {
    value: "PROHIBITED_SERVICE",
    tr: "Yasaklanmış İçerik veya Hizmet",
    en: "Prohibited Content or Service",
  },
  { value: "OTHER", tr: "Diğer İhlaller", en: "Other Violations" },
];
function getReportSubmitButtonLabel(isSubmitting: boolean, isTr: boolean): string {
  if (isSubmitting) {
    return isTr ? "İletiliyor..." : "Submitting...";
  }
  return isTr ? "Şikayeti İlet" : "Submit Report";
}

export function ContextualReportModal({
  targetType,
  targetIdentifier,
  targetTitle,
  isOpen,
  onClose,
  locale = "tr",
}: ContextualReportModalProps) {
  const isTr = locale === "tr";
  const [reasonCode, setReasonCode] = useState(REPORT_REASONS[0]?.value || "SCAM_FRAUD");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = details.trim();
    if (trimmed.length < 10) {
      setError(
        isTr
          ? "Lütfen inceleme ekibimiz için en az 10 karakterlik bir açıklama yazınız."
          : "Please provide at least 10 characters explaining the issue."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          targetType,
          targetIdentifier,
          reasonCode,
          details: trimmed,
          locale,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (isTr ? "Bildirim iletilemedi." : "Failed to submit report.")
        );
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setDetails("");
        onClose();
      }, 2500);
    } catch (err: unknown) {
      const fallback = isTr ? "Bir hata oluştu." : "An error occurred.";
      setError(err instanceof Error ? err.message : fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 sm:p-7 shadow-2xl overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors z-10 cursor-pointer"
          aria-label={isTr ? "Kapat" : "Close"}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 shrink-0 pb-3 border-b border-[var(--color-border-subtle)]/60 pr-8">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              {isTr ? "Uygunsuz Davranış / İhlal Bildir" : "Report Violation / Abuse"}
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] truncate max-w-[220px] sm:max-w-xs">
              {targetTitle ? `"${targetTitle}"` : `@${targetIdentifier}`}
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3 flex-1 overflow-y-auto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {isTr ? "Bildiriminiz Alındı" : "Report Received"}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-xs mx-auto leading-relaxed">
              {isTr
                ? "İnceleme ekibimiz bildirimi değerlendirecek ve gerekirse işlem yapacaktır. Güvenli ekosistem için teşekkür ederiz."
                : "Our moderation team will review your report and take appropriate action. Thank you for keeping Operis safe."}
            </p>
            <div className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                {isTr ? "Kapat" : "Close"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden pt-2">
            <div className="overflow-y-auto space-y-3.5 pr-1 py-1 overscroll-contain">
              {error && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  {isTr ? "Bildirim Nedeni" : "Reason for Report"}
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {isTr ? r.tr : r.en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  {isTr ? "Açıklama ve Detaylar" : "Explanation & Details"}
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder={
                    isTr
                      ? "Lütfen karşılaştığınız ihlali, yanıltıcı ifadeleri veya şüpheli davranışı kısaca açıklayınız..."
                      : "Please explain the violation or suspicious behavior you encountered..."
                  }
                  className="w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-3 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none leading-relaxed"
                />
                <div className="text-[10px] text-right text-[var(--color-text-tertiary)]">
                  {details.length} / 2000
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/50 p-2.5 text-[11px] text-[var(--color-text-tertiary)] leading-relaxed">
                {isTr
                  ? "Asılsız veya kötü niyetli bildirimler sistem tarafından filtrelenir. Bildiriminiz gizli tutulacak ve karşı tarafla paylaşılmayacaktır."
                  : "Reports are handled confidentially and are never revealed to the reported party."}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border-subtle)]/60 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {isTr ? "İptal" : "Cancel"}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              >
                <Flag className="h-3.5 w-3.5 mr-1" />
                {getReportSubmitButtonLabel(isSubmitting, isTr)}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
