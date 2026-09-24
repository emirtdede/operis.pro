"use client";

import { useState, useMemo } from "react";
import {
  X,
  ArrowRightLeft,
  Clock,
  Banknote,
  Calendar,
  AlertTriangle,
  Sparkles,
  Zap,
  Target,
  Layers,
  Send,
  Calculator,
} from "lucide-react";
import { Button } from "../ui/button";
import { validateContentAppropriateness } from "@/src/lib/security/content-moderator";
import { TaxCalculatorWidget } from "../finance/tax-calculator-widget";

interface CounterOfferModalProps {
  offerId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentRound?: number;
  initialBudgetCurrency?: string;
  currentBudgetMin?: string | number | null;
  currentBudgetMax?: string | number | null;
  currentDurationValue?: number | null;
  currentDurationUnit?: string | null;
  listingTitle?: string;
  locale?: string;
}

function formatDurationUnit(unit: string | null | undefined, isTr: boolean): string {
  if (unit === "WEEKS") {
    return isTr ? "Hafta" : "Weeks";
  }
  return unit || "";
}

function getBudgetDeltaBadgeClass(percent: number): string {
  if (percent > 0) {
    return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
  }
  if (percent < 0) {
    return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
  }
  return "bg-slate-800 text-slate-300";
}

const PRESET_REASON_CHIPS = [
  {
    id: "budget",
    icon: Target,
    label: "🎯 Bütçe Uyumu",
    labelEn: "🎯 Budget Alignment",
    text: "Proje bütçe aralığı ve kaynak optimizasyonu doğrultusunda revize teklifimi sunuyorum.",
    textEn: "I am submitting my revised proposal in line with the project budget range and resource optimization.",
  },
  {
    id: "speed",
    icon: Zap,
    label: "⚡ Hızlı Teslimat",
    labelEn: "⚡ Fast Delivery",
    text: "Daha yoğun sprint ve hızlandırılmış teslimat takvimi gözetilerek süre ve bütçe dengelendi.",
    textEn: "Timeline and budget have been balanced for a more intensive sprint and accelerated delivery.",
  },
  {
    id: "scope",
    icon: Layers,
    label: "📐 Kapsam Dengesi",
    labelEn: "📐 Scope Balance",
    text: "İlan teknik gereksinimlerini eksiksiz karşılayacak teslimat adımları doğrultusunda güncellendi.",
    textEn: "Updated in accordance with delivery milestones that will completely satisfy the project requirements.",
  },
];

export function CounterOfferModal({
  offerId,
  isOpen,
  onClose,
  onSuccess,
  currentRound = 0,
  initialBudgetCurrency = "TRY",
  currentBudgetMin,
  currentBudgetMax,
  currentDurationValue,
  currentDurationUnit = "WEEKS",
  listingTitle,
  locale = "tr",
}: CounterOfferModalProps) {
  const isTr = locale === "tr";
  const nextRound = currentRound + 1;

  const [budgetMin, setBudgetMin] = useState(
    currentBudgetMin !== undefined && currentBudgetMin !== null ? String(currentBudgetMin) : ""
  );
  const [budgetMax, setBudgetMax] = useState(
    currentBudgetMax !== undefined && currentBudgetMax !== null ? String(currentBudgetMax) : ""
  );
  const [durationValue, setDurationValue] = useState(
    currentDurationValue ? String(currentDurationValue) : "2"
  );
  const [durationUnit, setDurationUnit] = useState<"DAYS" | "WEEKS" | "MONTHS">(
    (currentDurationUnit as "DAYS" | "WEEKS" | "MONTHS") || "WEEKS"
  );
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTaxCalculator, setShowTaxCalculator] = useState(false);

  // Delta calculation: Budget comparison
  const budgetDeltaPercent = useMemo(() => {
    const curMax = parseFloat(String(currentBudgetMax || 0));
    const newMax = parseFloat(budgetMax);
    if (!curMax || !newMax || isNaN(curMax) || isNaN(newMax)) return null;
    const diff = ((newMax - curMax) / curMax) * 100;
    return Math.round(diff);
  }, [currentBudgetMax, budgetMax]);

  // Delta calculation: Duration comparison
  const durationDelta = useMemo(() => {
    const curVal = Number(currentDurationValue || 0);
    const newVal = Number(durationValue || 0);
    if (!curVal || !newVal || durationUnit !== currentDurationUnit) return null;
    const diff = newVal - curVal;
    return diff;
  }, [currentDurationValue, currentDurationUnit, durationValue, durationUnit]);

  // Anti-leak validation
  const moderationCheck = useMemo(() => {
    if (!message.trim()) return { isValid: true };
    return validateContentAppropriateness(message);
  }, [message]);

  if (!isOpen) return null;

  const handleApplyPreset = (text: string) => {
    setMessage((prev) => {
      if (!prev.trim()) return text;
      return `${prev}\n${text}`;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numMin = parseFloat(budgetMin);
    const numMax = parseFloat(budgetMax);

    if (isNaN(numMin) || numMin <= 0 || isNaN(numMax) || numMax <= 0) {
      setError(isTr ? "Lütfen geçerli bir bütçe aralığı giriniz." : "Please enter a valid budget range.");
      return;
    }

    if (numMin > numMax) {
      setError(
        isTr
          ? "Minimum bütçe maksimum bütçeden büyük olamaz."
          : "Minimum budget cannot exceed maximum budget."
      );
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setError(
        isTr
          ? "Karşı teklif notu en az 10 karakter olmalıdır."
          : "Counter-offer note must be at least 10 characters."
      );
      return;
    }

    if (!moderationCheck.isValid) {
      setError(
        isTr
          ? "Karşı teklif notunuz telefon, e-posta veya doğrudan iletişim bilgisi içeremez."
          : "Your note cannot contain direct contact information such as phone or email."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/offers/${offerId}/counter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetMin: String(numMin),
          budgetMax: String(numMax),
          estimatedDurationValue: parseInt(durationValue, 10),
          estimatedDurationUnit: durationUnit,
          message: message.trim(),
          expectedRound: nextRound,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isTr ? "Karşı teklif gönderilemedi." : "Failed to send counter-offer."));
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      let errMsg = isTr ? "Bir hata oluştu." : "An error occurred.";
      if (err instanceof Error) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const unspecifiedBudgetLabel = isTr ? "Belirtilmemiş" : "Not specified";

  let taxCalculatorToggleLabel = isTr ? "Stopaj Hesapla" : "Calculate Tax";
  if (showTaxCalculator) {
    taxCalculatorToggleLabel = isTr ? "Hesaplayıcıyı Gizle" : "Hide Calculator";
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={isTr ? "Karşı Teklif & Pazarlık" : "Counter-Offer & Negotiation"}
    >
      <div className="bg-[#121620] border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {isTr ? "Karşı Teklif Sun & Pazarlık" : "Submit Counter-Offer"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {isTr ? `Tur ${nextRound} / 6` : `Round ${nextRound} / 6`}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {listingTitle || (isTr ? "İlan Teklifi" : "Listing Proposal")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label={isTr ? "Kapat" : "Close"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* Rule Notification / 48h TTL Banner */}
          <div className="rounded-xl p-3.5 bg-blue-950/30 border border-blue-800/40 text-blue-200 text-xs flex items-start gap-2.5">
            <Clock className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold">
                {isTr ? "48 Saatlik Karşılıklı Yanıt Süresi:" : "48-Hour Response Window:"}
              </span>{" "}
              {isTr
                ? "Karşı teklif iletildiğinde sıra diğer tarafa geçer. Karşı tarafın yanıt vermesi veya yeni bir teklif sunması için 48 saat süresi bulunur."
                : "Once submitted, the turn passes to the counterparty with a 48-hour response timer."}
            </div>
          </div>

          {/* Current vs Counter Comparison Banner */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                {isTr ? "Mevcut Teklif" : "Current Proposal"}
              </span>
              <div className="font-bold text-slate-200">
                {currentBudgetMin && currentBudgetMax
                  ? `${currentBudgetMin} - ${currentBudgetMax} ${initialBudgetCurrency}`
                  : unspecifiedBudgetLabel}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {currentDurationValue} {formatDurationUnit(currentDurationUnit, isTr)}
              </div>
            </div>

            <div className="border-l border-slate-800 pl-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-blue-400 uppercase tracking-wider">
                  {isTr ? "Yeni Teklifiniz" : "Your Counter-Offer"}
                </span>
                {budgetDeltaPercent !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${getBudgetDeltaBadgeClass(budgetDeltaPercent)}`}
                  >
                    {budgetDeltaPercent > 0 ? `+${budgetDeltaPercent}%` : `${budgetDeltaPercent}%`}
                  </span>
                )}
              </div>
              <div className="font-bold text-blue-300">
                {budgetMin && budgetMax
                  ? `${budgetMin} - ${budgetMax} ${initialBudgetCurrency}`
                  : "—"}
              </div>
              <div className="text-xs text-blue-400/80 mt-0.5 flex items-center gap-1.5">
                <span>
                  {durationValue} {formatDurationUnit(durationUnit, isTr)}
                </span>
                {durationDelta !== null && durationDelta !== 0 && (
                  <span className="text-[10px] text-slate-400">
                    ({durationDelta > 0 ? `+${durationDelta}` : `${durationDelta}`})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Budget Range Inputs */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Banknote className="h-4 w-4 text-slate-400" />
                <span>
                  {isTr
                    ? `Revize Bütçe Aralığı (${initialBudgetCurrency})`
                    : `Revised Budget Range (${initialBudgetCurrency})`}
                </span>
              </label>
              <button
                type="button"
                onClick={() => setShowTaxCalculator((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>
                  {taxCalculatorToggleLabel}
                </span>
              </button>
            </div>

            {showTaxCalculator && (
              <div className="pt-1 pb-2">
                <TaxCalculatorWidget
                  initialAmount={budgetMax || budgetMin || "50000"}
                  currency={initialBudgetCurrency}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder={isTr ? "Min Tutar" : "Min Amount"}
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder={isTr ? "Maks Tutar" : "Max Amount"}
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              {isTr
                ? `Para birimi teklif ilk açılışındaki ${initialBudgetCurrency} olarak kilitlidir.`
                : `Currency is locked to the original proposal currency (${initialBudgetCurrency}).`}
            </p>
          </div>

          {/* Delivery Timeline Inputs */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              {isTr ? "Revize Teslimat Süresi" : "Revised Delivery Timeline"}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="1"
                max="52"
                required
                value={durationValue}
                onChange={(e) => setDurationValue(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value as "DAYS" | "WEEKS" | "MONTHS")}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              >
                <option value="DAYS">{isTr ? "Gün" : "Days"}</option>
                <option value="WEEKS">{isTr ? "Hafta" : "Weeks"}</option>
                <option value="MONTHS">{isTr ? "Ay" : "Months"}</option>
              </select>
            </div>
          </div>

          {/* Quick Preset Reason Chips (Approved Touch #2) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                {isTr ? "Hızlı Gerekçe Şablonları (Tek Tıkla Ekle)" : "Quick Reason Presets (One-Click Insert)"}
              </label>
              <span className="text-[10px] text-slate-500">
                {isTr ? "Dokun ve ekle" : "Click to apply"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_REASON_CHIPS.map((chip) => {
                const Icon = chip.icon;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleApplyPreset(isTr ? chip.text : chip.textEn)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-blue-500/50 transition-all active:scale-95"
                  >
                    <Icon className="h-3.5 w-3.5 text-blue-400" />
                    <span>{isTr ? chip.label : chip.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Negotiation Message Note */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                {isTr ? "Pazarlık Notu & Gerekçe" : "Negotiation Note & Reason"}
              </label>
              <span
                className={`text-[10px] ${
                  message.length > 900 ? "text-amber-400" : "text-slate-500"
                }`}
              >
                {message.length} / 1000
              </span>
            </div>
            <textarea
              required
              rows={3}
              minLength={10}
              maxLength={1000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isTr
                  ? "Bütçe ve süre revizyonunuzun gerekçesini ve teslimat beklentilerinizi belirtiniz..."
                  : "Explain the rationale for your revised budget/timeline and delivery expectations..."
              }
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl p-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
            {/* Anti-leak Warning */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>
                {isTr
                  ? "Topluluk kuralları gereği telefon, e-posta, WhatsApp veya sosyal medya bilgisi paylaşmak yasaktır."
                  : "Direct contact info (phone, email, messaging links) is prohibited by platform policies."}
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl p-3 bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs px-4"
            >
              {isTr ? "Vazgeç" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !moderationCheck.isValid}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 shadow-lg shadow-blue-600/20"
            >
              {isSubmitting ? (
                <span>{isTr ? "İletiliyor..." : "Submitting..."}</span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  {isTr ? "Karşı Teklifi İlet" : "Send Counter-Offer"}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
