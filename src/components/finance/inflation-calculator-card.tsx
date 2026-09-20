"use client";

import { useState, useMemo } from "react";
import {
  InflationHedgingEngine,
  InflationIndexType,
  FaultParty,
  InflationCalculationResult,
} from "@/src/modules/finance/inflation-hedging";
import {
  TrendingUp,
  ShieldCheck,
  Calendar,
  Percent,
  Copy,
  Check,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "../ui/button";
import { TextInput } from "../ui/text-input";

export interface InflationCalculatorCardProps {
  initialAmount?: number;
  initialBaseMonth?: string;
  initialTargetMonth?: string;
  initialIndexType?: InflationIndexType;
  initialCap?: number | null;
  currency?: string;
  locale?: string;
  compactMode?: boolean;
  onApplyToContract?: (config: {
    enabled: boolean;
    indexType: InflationIndexType;
    baseMonth: string;
    targetMonth: string;
    capPercentage: number | null;
  }) => void;
  onClose?: () => void;
}

const MONTH_OPTIONS = [
  { value: "2026-01", labelTr: "Ocak 2026", labelEn: "January 2026" },
  { value: "2026-02", labelTr: "Şubat 2026", labelEn: "February 2026" },
  { value: "2026-03", labelTr: "Mart 2026", labelEn: "March 2026" },
  { value: "2026-04", labelTr: "Nisan 2026", labelEn: "April 2026" },
  { value: "2026-05", labelTr: "Mayıs 2026", labelEn: "May 2026" },
  { value: "2026-06", labelTr: "Haziran 2026", labelEn: "June 2026" },
  { value: "2026-07", labelTr: "Temmuz 2026", labelEn: "July 2026" },
  { value: "2026-08", labelTr: "Ağustos 2026", labelEn: "August 2026" },
  { value: "2026-09", labelTr: "Eylül 2026", labelEn: "September 2026" },
  { value: "2026-10", labelTr: "Ekim 2026", labelEn: "October 2026" },
  { value: "2026-11", labelTr: "Kasım 2026", labelEn: "November 2026" },
  { value: "2026-12", labelTr: "Aralık 2026", labelEn: "December 2026" },
];

function getCapToggleButtonLabel(useCap: boolean, isTr: boolean): string {
  if (useCap) {
    return isTr ? "Tavansız Yap" : "Remove Cap";
  }
  return isTr ? "Tavan Ekle" : "Add Cap";
}

function getFreezeToggleButtonLabel(isContractorDelayed: boolean, isTr: boolean): string {
  if (isContractorDelayed) {
    return isTr ? "❄️ Endeks Donduruldu" : "❄️ Index Frozen";
  }
  return isTr ? "Dondurmayı Simüle Et" : "Simulate Freeze";
}

export function InflationCalculatorCard({
  initialAmount = 50000,
  initialBaseMonth = "2026-01",
  initialTargetMonth = "2026-06",
  initialIndexType = "HYBRID",
  initialCap = 25,
  currency = "TRY",
  locale = "tr",
  compactMode = false,
  onApplyToContract,
  onClose,
}: InflationCalculatorCardProps) {
  const isTr = locale === "tr";

  const [amountStr, setAmountStr] = useState(String(initialAmount));
  const [baseMonth, setBaseMonth] = useState(initialBaseMonth);
  const [targetMonth, setTargetMonth] = useState(initialTargetMonth);
  const [indexType, setIndexType] = useState<InflationIndexType>(initialIndexType);
  const [useCap, setUseCap] = useState(initialCap !== null && initialCap !== undefined);
  const [capValueStr, setCapValueStr] = useState(initialCap ? String(initialCap) : "20");
  const [isContractorDelayed, setIsContractorDelayed] = useState(false);
  const [copiedClause, setCopiedClause] = useState(false);
  const [activeTab, setActiveTab] = useState<"calculation" | "scenarios">("calculation");

  const numericAmount = useMemo(() => {
    const cleaned = amountStr.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [amountStr]);

  const numericCap = useMemo(() => {
    if (!useCap) return null;
    const parsed = parseFloat(capValueStr.replace(/[^0-9.]/g, ""));
    return isNaN(parsed) || parsed <= 0 ? null : parsed;
  }, [useCap, capValueStr]);

  const result: InflationCalculationResult = useMemo(() => {
    return InflationHedgingEngine.calculateAdjustment({
      baseAmount: numericAmount,
      baseMonth,
      targetMonth,
      indexType,
      capPercentage: numericCap,
      faultParty: isContractorDelayed ? ("CONTRACTOR" as FaultParty) : ("NONE" as FaultParty),
      originalTargetMonth: baseMonth,
    });
  }, [numericAmount, baseMonth, targetMonth, indexType, numericCap, isContractorDelayed]);

  const scenarios = useMemo(() => {
    return InflationHedgingEngine.simulateScenarios(numericAmount, numericCap, "CORPORATE");
  }, [numericAmount, numericCap]);

  const handleCopyClause = async () => {
    const clause = InflationHedgingEngine.generateInflationClauseText(
      {
        enabled: true,
        indexType,
        baseMonth,
        targetMonth,
        capPercentage: numericCap,
      },
      isTr ? "tr" : "en",
      numericAmount
    );

    try {
      await navigator.clipboard.writeText(clause.markdown);
      setCopiedClause(true);
      setTimeout(() => setCopiedClause(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleApply = () => {
    if (onApplyToContract) {
      onApplyToContract({
        enabled: true,
        indexType,
        baseMonth,
        targetMonth,
        capPercentage: numericCap,
      });
    }
  };

  return (
    <div
      className={`rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/5 via-[var(--color-surface-base)] to-[var(--color-surface-base)] shadow-2xl overflow-hidden backdrop-blur-md transition-all ${
        compactMode ? "p-4 space-y-4" : "p-6 space-y-6"
      }`}
    >
      {/* Header Banner */}
      <div className="flex items-start justify-between gap-3 border-b border-amber-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-[var(--color-text-primary)]">
                {isTr ? "TBK 138 & 32 Sayılı Karar Enflasyon Kalkanı" : "Statutory Inflation Hedging Shield"}
              </h3>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                {isTr ? "Resmi TÜİK Endeksli" : "TurkStat Indexed"}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {isTr
                ? "Döviz yasağına tam uyumlu; hakedişleri enflasyona karşı koruyan yasal fiyat uyarlama motoru."
                : "Decree 32 compliant; contractual price escalation protecting milestone fees against inflation."}
            </p>
          </div>
        </div>

        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            ✕
          </Button>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("calculation")}
          className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
            activeTab === "calculation"
              ? "bg-[var(--color-surface-base)] text-[var(--color-text-primary)] shadow-sm font-semibold text-amber-400"
              : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          {isTr ? "📊 Dinamik Hakediş Hesabı" : "📊 Dynamic Fee Calculation"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("scenarios")}
          className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
            activeTab === "scenarios"
              ? "bg-[var(--color-surface-base)] text-[var(--color-text-primary)] shadow-sm font-semibold text-amber-400"
              : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          {isTr ? "🔮 Senaryo Projeksiyonu" : "🔮 Scenario Projections"}
        </button>
      </div>

      {activeTab === "calculation" ? (
        <div className="space-y-5">
          {/* Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--color-text-secondary)] flex items-center gap-1">
                <span>{isTr ? "Başlangıç Bedeli (TL)" : "Base Milestone Fee"}</span>
              </label>
              <TextInput
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="50000"
                className="font-mono text-xs font-semibold"
              />
            </div>

            {/* Base Month */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--color-text-secondary)] flex items-center gap-1">
                <Calendar className="h-3 w-3 text-amber-400" />
                <span>{isTr ? "Sözleşme Baz Ayı (T₀)" : "Base Month (T₀)"}</span>
              </label>
              <select
                value={baseMonth}
                onChange={(e) => setBaseMonth(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-2.5 py-2 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {isTr ? m.labelTr : m.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Month */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--color-text-secondary)] flex items-center gap-1">
                <Calendar className="h-3 w-3 text-orange-400" />
                <span>{isTr ? "Hakediş Vade Ayı (Tₙ)" : "Handover Month (Tₙ)"}</span>
              </label>
              <select
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-2.5 py-2 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {isTr ? m.labelTr : m.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Cap Setting */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
                  {isTr ? "Tavan Sınırı (Cap)" : "Ceiling Cap"}
                </label>
                <button
                  type="button"
                  onClick={() => setUseCap(!useCap)}
                  className="text-[10px] text-amber-400 hover:underline font-medium"
                >
                  {getCapToggleButtonLabel(useCap, isTr)}
                </button>
              </div>
              {useCap ? (
                <div className="relative">
                  <TextInput
                    value={capValueStr}
                    onChange={(e) => setCapValueStr(e.target.value)}
                    placeholder="20"
                    className="font-mono text-xs pr-6"
                  />
                  <span className="absolute right-2 top-2 text-xs text-[var(--color-text-tertiary)]">%</span>
                </div>
              ) : (
                <div className="py-2 px-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-xs text-[var(--color-text-tertiary)] italic">
                  {isTr ? "Sınırsız (Serbest Enflasyon)" : "Uncapped Escalation"}
                </div>
              )}
            </div>
          </div>

          {/* Index Type Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
              {isTr ? "Resmi Endeks Modeli Tercihi" : "Official Index Model Benchmark"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIndexType("HYBRID")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  indexType === "HYBRID"
                    ? "border-amber-500 bg-amber-500/10 text-amber-300 font-semibold shadow-sm"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:border-amber-500/40"
                }`}
              >
                <div className="font-bold flex items-center justify-between text-xs">
                  <span>⚖️ {isTr ? "Karma Endeks (Tavsiye)" : "Hybrid (Recommended)"}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 font-mono">%50-%50</span>
                </div>
                <p className="text-[10px] opacity-80 mt-1">
                  {isTr ? "TÜFE (Geçim) + Yİ-ÜFE (Sunucu/Altyapı) dengesi." : "Balanced mix of CPI and PPI."}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIndexType("TUFE")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  indexType === "TUFE"
                    ? "border-amber-500 bg-amber-500/10 text-amber-300 font-semibold shadow-sm"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:border-amber-500/40"
                }`}
              >
                <div className="font-bold text-xs">🛒 {isTr ? "TÜİK TÜFE (Tüketici)" : "TurkStat CPI"}</div>
                <p className="text-[10px] opacity-80 mt-1">
                  {isTr ? "Yazılımcının bireysel yaşam ve emek maliyeti." : "Consumer living and labor expenses."}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIndexType("YI_UFE")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  indexType === "YI_UFE"
                    ? "border-amber-500 bg-amber-500/10 text-amber-300 font-semibold shadow-sm"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:border-amber-500/40"
                }`}
              >
                <div className="font-bold text-xs">🏭 {isTr ? "TÜİK Yİ-ÜFE (Üretici)" : "TurkStat PPI"}</div>
                <p className="text-[10px] opacity-80 mt-1">
                  {isTr ? "Donanım, enerji ve kurumsal girdi maliyetleri." : "Hardware, energy and operational inputs."}
                </p>
              </button>
            </div>
          </div>

          {/* Fault / Moratorium Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-3 text-xs">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-400 shrink-0" />
              <div>
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {isTr ? "TBK m. 117 Temerrüt Kuralı (Kusurlu Gecikme)" : "TBK Art. 117 Moratorium Default Rule"}
                </span>
                <p className="text-[10px] text-[var(--color-text-secondary)]">
                  {isTr
                    ? "Yüklenici teslimatı kendi kusuruyla geciktirirse endeks orijinal vadede dondurulur."
                    : "If delay is caused by contractor default, index escalation is frozen at original due date."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsContractorDelayed(!isContractorDelayed)}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                isContractorDelayed
                  ? "bg-rose-500 text-white shadow-sm"
                  : "bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {getFreezeToggleButtonLabel(isContractorDelayed, isTr)}
            </button>
          </div>

          {/* Core Results Display */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Percent className="h-4 w-4" />
                {isTr ? "Hesaplanan Yasal Enflasyon Değişimi:" : "Calculated Statutory Rate:"}
              </span>
              <div className="flex items-center gap-2">
                {result.capApplied && (
                  <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    🛡️ {isTr ? `Tavan (%${numericCap}) Uygulandı` : `Capped at %${numericCap}`}
                  </span>
                )}
                {result.floorApplied && (
                  <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    🛡️ {isTr ? "Taban (%0) Korundu" : "0% Floor Protected"}
                  </span>
                )}
                <span className="font-mono font-extrabold text-base sm:text-lg text-amber-400">
                  +{(result.finalAdjustmentRate * 100).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Financial Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-500/20">
              <div className="space-y-0.5">
                <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold">
                  {isTr ? "Başlangıç Hakediş Bedeli" : "Baseline Contract Fee"}
                </span>
                <div className="font-mono text-sm font-bold text-[var(--color-text-secondary)]">
                  {result.baseAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {currency}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-amber-400 uppercase font-semibold">
                  {isTr ? "Enflasyon / Endeks Farkı" : "Inflation Escalation Delta"}
                </span>
                <div className="font-mono text-sm font-bold text-amber-400">
                  +{result.inflationDeltaAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {currency}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                  {isTr ? "Güncellenmiş Yeni Brüt Bedel" : "Adjusted New Gross Fee"}
                </span>
                <div className="font-mono text-base font-extrabold text-emerald-400">
                  {result.adjustedGrossAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {currency}
                </div>
              </div>
            </div>

            {/* Itemized Tax Breakdown */}
            <div className="pt-2 border-t border-amber-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                <span className="text-[10px] text-[var(--color-text-tertiary)] block">
                  {isTr ? "Stopaj Tevkifatı (%20)" : "Withholding Tax (20%)"}
                </span>
                <span className="font-mono font-bold text-rose-400 text-[11px]">
                  -{result.taxBreakdown.withholdingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                <span className="text-[10px] text-[var(--color-text-tertiary)] block">
                  {isTr ? "Net Ele Geçen (Brüt-Stopaj)" : "Net Freelancer Take-Home"}
                </span>
                <span className="font-mono font-bold text-emerald-400 text-[11px]">
                  {result.taxBreakdown.netTakeHome.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                <span className="text-[10px] text-[var(--color-text-tertiary)] block">
                  {isTr ? "KDV (%20) Emanet" : "VAT (20%)"}
                </span>
                <span className="font-mono font-bold text-blue-400 text-[11px]">
                  +{result.taxBreakdown.vatTotalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                <span className="text-[10px] text-[var(--color-text-tertiary)] block">
                  {isTr ? "Banka Havalesi (Net+KDV)" : "Bank Transfer Amount"}
                </span>
                <span className="font-mono font-bold text-[var(--color-text-primary)] text-[11px]">
                  {result.taxBreakdown.totalCashToFreelancer.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Scenarios View */
        <div className="space-y-4">
          <p className="text-xs text-[var(--color-text-secondary)]">
            {isTr
              ? "Gelecek dönemdeki olası enflasyon oranlarına göre hakediş ve maliyet simülasyonu:"
              : "Projected milestone fee adjustments across hypothetical future inflation scenarios:"}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]">
                  <th className="py-2 px-3">{isTr ? "Enflasyon Senaryosu" : "Scenario"}</th>
                  <th className="py-2 px-3">{isTr ? "Efektif Artış" : "Effective Rate"}</th>
                  <th className="py-2 px-3">{isTr ? "Yeni Brüt Hakediş" : "Adjusted Gross"}</th>
                  <th className="py-2 px-3">{isTr ? "Fark (Delta)" : "Delta Amount"}</th>
                  <th className="py-2 px-3">{isTr ? "Net Ele Geçen" : "Net Take-Home"}</th>
                  <th className="py-2 px-3">{isTr ? "İşveren Toplamı" : "Client Total"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)] font-mono">
                {scenarios.map((sc) => (
                  <tr key={sc.scenarioLabel} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="py-2.5 px-3 font-sans font-semibold text-[var(--color-text-primary)]">
                      {sc.scenarioLabel}
                    </td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">
                      +{sc.projectedRatePercent}%
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">
                      {sc.adjustedGrossAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-2.5 px-3 text-amber-400">
                      +{sc.deltaAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-2.5 px-3 text-[var(--color-text-secondary)]">
                      {sc.netTakeHome.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-2.5 px-3 text-[var(--color-text-primary)]">
                      {sc.totalCostToClient.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--color-border-subtle)] text-xs">
        <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-tertiary)]">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{isTr ? "TBK 138 & 32 Sayılı Karar Koruması Aktif" : "TBK 138 & Decree 32 Protection Active"}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyClause}
            className="text-xs flex items-center gap-1.5"
          >
            {copiedClause ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>{isTr ? "Kloz Kopyalandı" : "Clause Copied"}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>{isTr ? "Sözleşme Klozunu Kopyala" : "Copy Clause"}</span>
              </>
            )}
          </Button>

          {onApplyToContract && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleApply}
              className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5"
            >
              <span>{isTr ? "Sözleşmeye Ekle (Madde 3.5)" : "Apply to Contract"}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
