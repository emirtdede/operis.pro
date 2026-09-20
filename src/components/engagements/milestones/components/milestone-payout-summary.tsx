import { FileCheck2, DollarSign } from "lucide-react";

interface MilestonePayoutSummaryProps {
  deliverablesPercent: number;
  paymentPercent: number;
  isTr: boolean;
}

export function MilestonePayoutSummary({
  deliverablesPercent,
  paymentPercent,
  isTr,
}: MilestonePayoutSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Deliverable Progress */}
      <div className="p-3.5 rounded-2xl bg-[var(--color-surface-hover)]/40 border border-[var(--color-border-subtle)] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
            <FileCheck2 className="h-3.5 w-3.5 text-blue-400" />
            {isTr ? "Teslimat & İlerleme Oranı" : "Deliverable Progress"}
          </span>
          <span className="font-mono font-bold text-blue-400">%{deliverablesPercent}</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${deliverablesPercent}%` }}
          />
        </div>
      </div>

      {/* Payment Progress */}
      <div className="p-3.5 rounded-2xl bg-[var(--color-surface-hover)]/40 border border-[var(--color-border-subtle)] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            {isTr ? "Hakediş & Tahsilat Oranı" : "Payment & Receipt Ledger"}
          </span>
          <span className="font-mono font-bold text-emerald-400">%{paymentPercent}</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${paymentPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
