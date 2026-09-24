"use client";

import { useState } from "react";
import {
  X,
  Repeat,
  Clock,
  ShieldCheck,
  Zap,
  Calculator,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { calculateFreelanceTax } from "@/src/modules/finance/tax-calculator";
import type {
  RetainerPlanType,
  RolloverPolicy,
  SlaTier,
} from "@/src/modules/engagements/retainer-service";

interface RetainerProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagementId: string;
  listingTitle: string;
  defaultCurrency?: string;
  locale?: string;
  onSuccess: () => void;
}

function getRetainerSubmitButtonLabel(isSubmitting: boolean, isTr: boolean): string {
  if (isSubmitting) {
    return isTr ? "Teklif Hazırlanıyor..." : "Proposing...";
  }
  return isTr ? "Aylık Bakım Teklifini İlet (1-Tıkla)" : "Send Retainer Proposal";
}

export function RetainerProposalModal({
  isOpen,
  onClose,
  engagementId,
  listingTitle: _listingTitle,
  defaultCurrency = "TRY",
  locale = "tr",
  onSuccess,
}: RetainerProposalModalProps) {
  const isTr = locale === "tr";

  const [planType, setPlanType] = useState<RetainerPlanType>("HOURLY_POOL");
  const [monthlyPrice, setMonthlyPrice] = useState("15000");
  const [currency] = useState(defaultCurrency);
  const [includedHours, setIncludedHours] = useState("20");
  const [overageHourlyRate, setOverageHourlyRate] = useState("1000");
  const [rolloverPolicy, setRolloverPolicy] = useState<RolloverPolicy>("NO_ROLLOVER");
  const [slaTier, setSlaTier] = useState<SlaTier>("STANDARD");
  const [scopeDescription, setScopeDescription] = useState(
    isTr
      ? "Sürekli teknik bakım, sunucu altyapı güncellemeleri, güvenlik yamaları ve periyodik bugfix desteği."
      : "Ongoing technical maintenance, server infrastructure updates, security patches, and periodic bugfix support."
  );
  const [cancellationNoticeDays, setCancellationNoticeDays] = useState("15");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const numPrice = parseFloat(monthlyPrice) || 0;
  const taxBreakdown = calculateFreelanceTax({
    amount: numPrice,
    direction: "GROSS_TO_NET",
    clientType: "CORPORATE",
    documentType: "SMM",
    currency,
    vatWithholding: "NONE",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numPrice <= 0) {
      setErrorMsg(isTr ? "Geçerli bir aylık ücret giriniz." : "Enter a valid monthly fee.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/work/${engagementId}/retainer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          action: "PROPOSE",
          planType,
          monthlyPrice: numPrice,
          currency,
          includedHours: planType === "HOURLY_POOL" ? parseInt(includedHours, 10) || 0 : 0,
          overageHourlyRate: planType === "HOURLY_POOL" ? parseFloat(overageHourlyRate) || 0 : 0,
          rolloverPolicy,
          slaTier,
          scopeDescription,
          cancellationNoticeDays: parseInt(cancellationNoticeDays, 10) || 15,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isTr ? "Teklif oluşturulamadı." : "Failed to propose retainer."));
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
      <div className="bg-[#12151e] border border-indigo-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-0 text-slate-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Repeat className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isTr ? "Aylık Düzenli Bakım & SLA Sözleşmesi Teklifi" : "Monthly Retainer & SLA Agreement Proposal"}</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  TBK m. 502 / m. 470
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTr
                  ? "Proje teslimi sonrası sürekli gelir ve garantili teknik destek protokolü."
                  : "Post-delivery recurring revenue and guaranteed support protocol."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Model Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {isTr ? "1. Hizmet ve Bakım Modeli" : "1. Service & Maintenance Model"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlanType("HOURLY_POOL")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  planType === "HOURLY_POOL"
                    ? "border-indigo-500 bg-indigo-500/15 text-white shadow-md shadow-indigo-500/15"
                    : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-indigo-300">
                    <Clock className="h-3.5 w-3.5" />
                    {isTr ? "Aylık Saat Havuzu" : "Hourly Retainer Pool"}
                  </span>
                  {planType === "HOURLY_POOL" && <CheckCircle2 className="h-4 w-4 text-indigo-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {isTr
                    ? "Her ay sabit saat rezervasyonu (örn: 20 saat). Aşım durumunda ek saat ücreti uygulanır."
                    : "Reserved monthly hours pool. Extra hours billed at predefined rate."}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPlanType("FIXED_MAINTENANCE")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  planType === "FIXED_MAINTENANCE"
                    ? "border-indigo-500 bg-indigo-500/15 text-white shadow-md shadow-indigo-500/15"
                    : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-indigo-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {isTr ? "Sabit Altyapı Bakımı" : "Fixed Scope Maintenance"}
                  </span>
                  {planType === "FIXED_MAINTENANCE" && <CheckCircle2 className="h-4 w-4 text-indigo-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {isTr
                    ? "Saat sınırı olmaksızın sunucu uptime, güvenlik yamaları ve kesinti önleme taahhüdü."
                    : "Uncapped hours covering uptime, security patches, and SLA continuity."}
                </p>
              </button>
            </div>
          </div>

          {/* Pricing & Hours Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {isTr ? "Aylık Sabit Hizmet Bedeli" : "Monthly Retainer Fee"} ({currency})
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="15000"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">{currency}</span>
              </div>
            </div>

            {planType === "HOURLY_POOL" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {isTr ? "Aylık Rezerve Edilen Saat" : "Included Monthly Hours"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    max="160"
                    value={includedHours}
                    onChange={(e) => setIncludedHours(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="20"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">{isTr ? "Saat" : "Hours"}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {isTr ? "Fesih İhbar Süresi" : "Cancellation Notice"}
                </label>
                <select
                  value={cancellationNoticeDays}
                  onChange={(e) => setCancellationNoticeDays(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="15">{isTr ? "15 Takvim Günü Önce" : "15 Calendar Days"}</option>
                  <option value="30">{isTr ? "30 Takvim Günü Önce" : "30 Calendar Days"}</option>
                </select>
              </div>
            )}
          </div>

          {/* Overage and Rollover Configuration if Hourly Pool */}
          {planType === "HOURLY_POOL" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {isTr ? "Kota Aşım Saat Ücreti" : "Overage Hourly Rate"} ({currency})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={overageHourlyRate}
                    onChange={(e) => setOverageHourlyRate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="1000"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">{currency}/saat</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {isTr ? "Kullanılmayan Saat Kuralı (Rollover)" : "Rollover Policy"}
                </label>
                <select
                  value={rolloverPolicy}
                  onChange={(e) => setRolloverPolicy(e.target.value as RolloverPolicy)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="NO_ROLLOVER">
                    {isTr ? "❌ Devretmez (Use it or lose it - Tavsiye Edilen)" : "❌ No Rollover (Use it or lose it)"}
                  </option>
                  <option value="MAX_25_PERCENT">
                    {isTr ? "🔄 Azami %25 Devreder (1 Ay Geçerli)" : "🔄 Max 25% Rollover (Valid for 1 Month)"}
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* SLA Tier Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>{isTr ? "2. Hizmet Seviyesi Taahhüdü (SLA)" : "2. Service Level Agreement (SLA)"}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSlaTier("STANDARD")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  slaTier === "STANDARD"
                    ? "border-blue-500 bg-blue-500/15 text-white"
                    : "border-slate-800 bg-slate-900/60 text-slate-400"
                }`}
              >
                <div className="font-bold text-xs text-blue-400 mb-1">
                  {isTr ? "Standart SLA (Mesai İçi)" : "Standard SLA"}
                </div>
                <div className="text-[11px] text-slate-300 space-y-0.5">
                  <div>• P1 (Kritik Kesinti): &le; 4 saat</div>
                  <div>• P2 (Major Hata): &le; 24 saat</div>
                  <div>• P3 (Normal Talep): &le; 3 iş günü</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSlaTier("ENTERPRISE")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  slaTier === "ENTERPRISE"
                    ? "border-amber-500 bg-amber-500/15 text-white shadow-md shadow-amber-500/10"
                    : "border-slate-800 bg-slate-900/60 text-slate-400"
                }`}
              >
                <div className="font-bold text-xs text-amber-400 mb-1">
                  {isTr ? "Enterprise SLA (7/24 Kesintisiz)" : "Enterprise SLA (24/7)"}
                </div>
                <div className="text-[11px] text-slate-300 space-y-0.5">
                  <div>• P1 (Kritik Kesinti): &le; 1 saat (7/24)</div>
                  <div>• P2 (Major Hata): &le; 8 saat</div>
                  <div>• P3 (Normal Talep): &le; 1 iş günü</div>
                </div>
              </button>
            </div>
          </div>

          {/* Scope Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {isTr ? "3. Aylık Bakım Kapsam ve Sınırları" : "3. Scope Description & Boundaries"}
            </label>
            <textarea
              rows={2}
              value={scopeDescription}
              onChange={(e) => setScopeDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          {/* Live GVK & KDV Tax Simulator Breakdown Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Calculator className="h-3.5 w-3.5" />
                {isTr ? "Aylık Yasal Vergi & Net Hakediş Dağılımı" : "Monthly Tax & Net Breakdown"}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">GVK m. 94/2-b</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">{isTr ? "Brüt Bedel" : "Gross"}</span>
                <span className="font-mono font-bold text-white">
                  {taxBreakdown.grossAmount.toLocaleString("tr-TR")} {currency}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">{isTr ? "%20 Stopaj" : "%20 Withholding"}</span>
                <span className="font-mono font-bold text-amber-400">
                  {taxBreakdown.withholdingAmount.toLocaleString("tr-TR")} {currency}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">{isTr ? "%20 KDV" : "%20 VAT"}</span>
                <span className="font-mono font-bold text-blue-400">
                  {taxBreakdown.vatTotalAmount.toLocaleString("tr-TR")} {currency}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
                <span className="text-emerald-300 block text-[10px] font-semibold">{isTr ? "Banka Havalesi" : "Net Payout"}</span>
                <span className="font-mono font-bold text-emerald-400">
                  {taxBreakdown.totalCashToFreelancer.toLocaleString("tr-TR")} {currency}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
              disabled={isSubmitting}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25"
            >
              <Repeat className="h-4 w-4" />
              <span>
                {getRetainerSubmitButtonLabel(isSubmitting, isTr)}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
