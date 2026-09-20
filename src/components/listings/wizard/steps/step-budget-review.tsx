import type { Dispatch, SetStateAction } from "react";
import {
  ShieldCheck,
  Coins,
  TrendingUp,
  Loader2,
  Calculator,
  Clock,
  Sparkles,
  Eye,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { TextInput } from "@/src/components/ui/text-input";
import { Select } from "@/src/components/ui/select";
import { Checkbox } from "@/src/components/ui/checkbox";
import type { MarketBenchmarkResult } from "@/src/modules/categories/benchmark-service";
import type { calculateFreelanceTax } from "@/src/modules/finance/tax-calculator";
import {
  getBudgetMinPlaceholder,
  getTaxToggleLabel,
  getTimelineDescription,
} from "../types";

export interface StepBudgetReviewProps {
  isTr: boolean;
  benchmark: MarketBenchmarkResult | null;
  isBenchmarkLoading: boolean;
  budgetMode: string;
  setBudgetMode: (mode: string) => void;
  budgetCurrency: string;
  setBudgetCurrency: (currency: string) => void;
  budgetMin: string;
  setBudgetMin: (val: string) => void;
  budgetMax: string;
  setBudgetMax: (val: string) => void;
  showEmployerTaxBreakdown: boolean;
  setShowEmployerTaxBreakdown: Dispatch<SetStateAction<boolean>>;
  employerTaxPreview: ReturnType<typeof calculateFreelanceTax> | null;
  timelineMode: string;
  setTimelineMode: (mode: string) => void;
  timelineValue: string;
  setTimelineValue: (val: string) => void;
  timelineUnit: string;
  setTimelineUnit: (unit: string) => void;
  targetDate: string;
  setTargetDate: (val: string) => void;
  title: string;
  summary: string;
  setIsPreviewModalOpen: (isOpen: boolean) => void;
  ackDirectRelationship: boolean;
  setAckDirectRelationship: (val: boolean) => void;
  ackNoPlatformPayment: boolean;
  setAckNoPlatformPayment: (val: boolean) => void;
  ackSevenDayExpiry: boolean;
  setAckSevenDayExpiry: (val: boolean) => void;
  ackProhibitedContent: boolean;
  setAckProhibitedContent: (val: boolean) => void;
}

export function StepBudgetReview({
  isTr,
  benchmark,
  isBenchmarkLoading,
  budgetMode,
  setBudgetMode,
  budgetCurrency,
  setBudgetCurrency,
  budgetMin,
  setBudgetMin,
  budgetMax,
  setBudgetMax,
  showEmployerTaxBreakdown,
  setShowEmployerTaxBreakdown,
  employerTaxPreview,
  timelineMode,
  setTimelineMode,
  timelineValue,
  setTimelineValue,
  timelineUnit,
  setTimelineUnit,
  targetDate,
  setTargetDate,
  title,
  summary,
  setIsPreviewModalOpen,
  ackDirectRelationship,
  setAckDirectRelationship,
  ackNoPlatformPayment,
  setAckNoPlatformPayment,
  ackSevenDayExpiry,
  setAckSevenDayExpiry,
  ackProhibitedContent,
  setAckProhibitedContent,
}: StepBudgetReviewProps) {
  const budgetGridColsClass =
    budgetMode === "RANGE" ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2";

  const emptyTitleText = isTr ? "(Başlık henüz girilmedi)" : "(No title entered)";
  const emptySummaryText = isTr ? "(Kısa özet henüz girilmedi)" : "(No summary entered)";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <span>
            {isTr ? "3. Bütçe, Süreç ve Yasal Beyanlar" : "3. Budget, Timeline & Terms"}
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
          {isTr
            ? "Bütçe ve zaman planınızı belirleyin, platform kurallarını onaylayarak ilanınızı yayımlayın."
            : "Specify budget, estimated delivery, and confirm platform terms."}
        </p>
      </div>

      {/* Budget & Timeline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Budget Box */}
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-primary)]">
            <Coins className="h-4 w-4 text-emerald-400" />
            <span>{isTr ? "Bütçe Yapısı" : "Budget Structure"}</span>
          </div>

          {/* Market Benchmark Guidance Helper (Real statistical data, zero-mock policy) */}
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-[11px] text-cyan-300">
                <TrendingUp className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>{isTr ? "Piyasa Referans Rehberi (Son 30 Gün)" : "Market Rate Benchmark (Last 30 Days)"}</span>
              </div>
              {isBenchmarkLoading && (
                <Loader2 className="h-3 w-3 text-cyan-400 animate-spin shrink-0" />
              )}
              {benchmark?.hasBenchmark && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  {benchmark.sampleCount} {isTr ? "eşleşme" : "matches"} • IQR P25-P75
                </span>
              )}
            </div>

            <div className="text-[var(--color-text-secondary)] text-[11px] leading-relaxed">
              {benchmark?.hasBenchmark ? (
                <p className="text-[var(--color-text-primary)] font-medium">
                  {isTr ? benchmark.messageTr : benchmark.messageEn}
                </p>
              ) : (
                <div className="space-y-0.5 text-[var(--color-text-tertiary)]">
                  <p>
                    {isTr
                      ? (benchmark?.messageTr || "Bu kategoride son 30 günde henüz yeterli eşleşme verisi oluşmadı.")
                      : (benchmark?.messageEn || "Insufficient matched project data in this category for the last 30 days.")}
                  </p>
                  <p className="text-[10px] opacity-75">
                    {isTr
                      ? "Operis sıfır yapay veri politikası uygular; referans aralıklar sadece kabul edilen gerçek tekliflerle hesaplanır."
                      : "Operis enforces a zero-mock policy; benchmarks only activate from verified accepted proposals."}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={budgetMode === "RANGE" ? "primary" : "secondary"}
              onClick={() => setBudgetMode("RANGE")}
            >
              {isTr ? "Aralık" : "Range"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={budgetMode === "FIXED" ? "primary" : "secondary"}
              onClick={() => setBudgetMode("FIXED")}
            >
              {isTr ? "Sabit" : "Fixed"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={budgetMode === "NEGOTIABLE" ? "primary" : "secondary"}
              onClick={() => setBudgetMode("NEGOTIABLE")}
            >
              {isTr ? "Görüşülür" : "Open"}
            </Button>
          </div>

          {budgetMode !== "NEGOTIABLE" && (
            <div className={`grid gap-2 pt-1 ${budgetGridColsClass}`}>
              <Select
                value={budgetCurrency}
                onChange={(e) => setBudgetCurrency(e.target.value)}
                options={[
                  { value: "TRY", label: "TRY (₺)" },
                  { value: "USD", label: "USD ($)" },
                  { value: "EUR", label: "EUR (€)" },
                  { value: "GBP", label: "GBP (£)" },
                ]}
              />
              <TextInput
                type="number"
                placeholder={getBudgetMinPlaceholder(budgetMode, isTr)}
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
              />
              {budgetMode === "RANGE" && (
                <TextInput
                  type="number"
                  placeholder={isTr ? "Maks Tutar" : "Max"}
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                />
              )}
            </div>
          )}

          {/* Employer Tax & Cost Guidance */}
          {budgetMode !== "NEGOTIABLE" && (budgetMin || budgetMax) && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowEmployerTaxBreakdown((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-300 hover:bg-cyan-500/15 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <Calculator className="h-3.5 w-3.5 text-cyan-400" />
                  {isTr ? "Kurumsal Şirket Maliyet & Stopaj Rehberi" : "Corporate Cost & Tax Estimator"}
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {getTaxToggleLabel(showEmployerTaxBreakdown, isTr)}
                </span>
              </button>

              {showEmployerTaxBreakdown && employerTaxPreview && (
                <div className="mt-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-3 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]">
                      <span className="text-[var(--color-text-tertiary)] block text-[10px]">
                        {isTr ? "Freelancer Net Hakediş:" : "Freelancer Net:"}
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        {employerTaxPreview.netTakeHome.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {budgetCurrency}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]">
                      <span className="text-[var(--color-text-tertiary)] block text-[10px]">
                        {isTr ? "Muhtasar Stopaj (%20):" : "Withholding (20%):"}
                      </span>
                      <span className="font-mono font-bold text-amber-400">
                        {employerTaxPreview.withholdingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {budgetCurrency}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]">
                      <span className="text-[var(--color-text-tertiary)] block text-[10px]">
                        {isTr ? "KDV (%20 İndirilebilir):" : "Deductible VAT (20%):"}
                      </span>
                      <span className="font-mono font-bold text-blue-400">
                        {employerTaxPreview.vatTotalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {budgetCurrency}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]">
                      <span className="text-[var(--color-text-tertiary)] block text-[10px]">
                        {isTr ? "Şirket Toplam Nakit Çıkışı:" : "Total Cash Outflow:"}
                      </span>
                      <span className="font-mono font-bold text-cyan-300">
                        {employerTaxPreview.totalCostToClient.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {budgetCurrency}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-[var(--color-text-tertiary)] leading-relaxed">
                    {isTr
                      ? "GVK m. 94 uyarınca %20 stopaj devlete şirketinizce muhtasar ile ödenir; KDV ise 1 No.lu KDV beyannamenizde indirim konusu yapılır. Net şirket maliyetiniz brüt bütçedir."
                      : "Under GVK Art. 94, 20% withholding is remitted on your corporate return, and VAT is deductible. Net cost to company equals the gross fee."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timeline Box */}
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-primary)]">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span>{isTr ? "Zaman Planı" : "Timeline Plan"}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={timelineMode === "DURATION_ESTIMATE" ? "primary" : "secondary"}
              onClick={() => setTimelineMode("DURATION_ESTIMATE")}
            >
              {isTr ? "Süre" : "Duration"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={timelineMode === "SPECIFIC_DATE" ? "primary" : "secondary"}
              onClick={() => setTimelineMode("SPECIFIC_DATE")}
            >
              {isTr ? "Tarih" : "Target Date"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={timelineMode === "FLEXIBLE" ? "primary" : "secondary"}
              onClick={() => setTimelineMode("FLEXIBLE")}
            >
              {isTr ? "Esnek" : "Flexible"}
            </Button>
          </div>

          {timelineMode === "DURATION_ESTIMATE" && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <TextInput
                type="number"
                placeholder="2"
                value={timelineValue}
                onChange={(e) => setTimelineValue(e.target.value)}
              />
              <Select
                value={timelineUnit}
                onChange={(e) => setTimelineUnit(e.target.value)}
                options={[
                  { value: "DAYS", label: isTr ? "Gün" : "Days" },
                  { value: "WEEKS", label: isTr ? "Hafta" : "Weeks" },
                  { value: "MONTHS", label: isTr ? "Ay" : "Months" },
                ]}
              />
            </div>
          )}

          {timelineMode === "SPECIFIC_DATE" && (
            <div className="pt-1">
              <TextInput
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          )}

          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            {getTimelineDescription(timelineMode, isTr)}
          </p>
        </div>
      </div>

      {/* Quick Preview Card */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="font-bold text-blue-400 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            <span>
              {isTr ? "İlan Özeti & Canlı Görünüm" : "Listing Summary & Live Preview"}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setIsPreviewModalOpen(true)}
            className="text-xs h-7 px-2.5 gap-1.5 border-blue-500/30 text-blue-300 hover:text-white"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{isTr ? "İlanı Canlı Önizle" : "Live Preview Card"}</span>
          </Button>
        </div>
        <div className="text-[var(--color-text-primary)] font-semibold truncate">
          {title || emptyTitleText}
        </div>
        <div className="text-[var(--color-text-secondary)] line-clamp-2">
          {summary || emptySummaryText}
        </div>
      </div>

      {/* 4 Mandatory Declarations */}
      <div className="space-y-3 pt-1">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {isTr ? "Zorunlu Yasal Beyanlar" : "Mandatory Platform Declarations"}
        </div>

        <Checkbox
          label={
            isTr
              ? "Tüm müzakere, sözleşme ve çalışma süreçlerinin doğrudan serbest çalışan ile yürütüleceğini kabul ediyorum."
              : "I understand that all negotiation, contract, and delivery terms are handled directly with the freelancer."
          }
          checked={ackDirectRelationship}
          onChange={(e) => setAckDirectRelationship(e.target.checked)}
          required
        />
        <Checkbox
          label={
            isTr
              ? "İlanın gizli bilgi, ticari sır veya doğrudan iletişim bilgisi (telefon, e-posta vb.) içermediğini onaylıyorum."
              : "I confirm that this listing contains no confidential secrets, trade secrets, or direct contact information."
          }
          checked={ackNoPlatformPayment}
          onChange={(e) => setAckNoPlatformPayment(e.target.checked)}
          required
        />
        <Checkbox
          label={
            isTr
              ? "Bu ilanın 7 gün boyunca yayında kalacağını, 7 gün sonunda otomatik olarak pasif hale geleceğini onaylıyorum."
              : "I acknowledge that this listing will remain active for 7 days and will expire automatically unless renewed."
          }
          checked={ackSevenDayExpiry}
          onChange={(e) => setAckSevenDayExpiry(e.target.checked)}
          required
        />
        <Checkbox
          label={
            isTr
              ? "İlanın platform kurallarına ve yürürlükteki mevzuata uygun olduğunu, yasaklı veya sahte içerik barındırmadığını taahhüt ediyorum."
              : "I declare that this project complies with platform acceptable use rules and applicable laws."
          }
          checked={ackProhibitedContent}
          onChange={(e) => setAckProhibitedContent(e.target.checked)}
          required
        />
      </div>
    </div>
  );
}
