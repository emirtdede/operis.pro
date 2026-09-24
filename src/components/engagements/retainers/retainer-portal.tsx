"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Repeat,
  Clock,
  Zap,
  FileText,
  Plus,
  CheckCircle2,
  DollarSign,
  X,
  Printer,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { RetainerProposalModal } from "./retainer-proposal-modal";
import type {
  RetainerDetailsResult,
  RetainerPeriodMetrics,
} from "@/src/modules/engagements/retainer-service";

interface RetainerPortalProps {
  engagementId: string;
  listingTitle: string;
  currentUserId: string;
  isCompleted: boolean;
  locale?: string;
  defaultCurrency?: string;
}

function getPercentUsedColorClass(percent: number): string {
  if (percent > 90) return "bg-rose-500";
  if (percent > 70) return "bg-amber-500";
  return "bg-indigo-500";
}

export function RetainerPortal({
  engagementId,
  listingTitle,
  currentUserId: _currentUserId,
  isCompleted: _isCompleted,
  locale = "tr",
  defaultCurrency = "TRY",
}: RetainerPortalProps) {
  const isTr = locale === "tr";

  const [data, setData] = useState<RetainerDetailsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);

  // Hour logging state
  const [logHoursVal, setLogHoursVal] = useState("2");
  const [logTaskDesc, setLogTaskDesc] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [logFeedback, setLogFeedback] = useState<string | null>(null);

  // Action state (activation/cancellation)
  const [isActioning, setIsActioning] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [copiedContract, setCopiedContract] = useState(false);

  const fetchRetainer = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/work/${engagementId}/retainer`, {
        headers: { "x-locale": locale },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // non-blocking
    } finally {
      setIsLoading(false);
    }
  }, [engagementId, locale]);

  useEffect(() => {
    fetchRetainer();
  }, [fetchRetainer]);

  const handleActivate = async () => {
    if (!data?.retainer) return;
    setIsActioning(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/work/${engagementId}/retainer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({ action: "ACTIVATE" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Activation failed");
      setActionFeedback(isTr ? "Sözleşme başarıyla yürürlüğe girdi!" : "Agreement activated successfully!");
      fetchRetainer();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error activating agreement";
      setActionFeedback(msg);
    } finally {
      setIsActioning(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm(isTr ? "Aylık bakım sözleşmesini cari ay sonunda sonlandırmak istediğinize emin misiniz?" : "Are you sure you want to cancel the retainer at the end of the billing period?")) {
      return;
    }

    setIsActioning(true);
    try {
      const res = await fetch(`/api/work/${engagementId}/retainer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({ action: "CANCEL" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Cancellation failed");
      fetchRetainer();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Cancellation failed");
    } finally {
      setIsActioning(false);
    }
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.retainer) return;
    setIsLogging(true);
    setLogFeedback(null);

    try {
      const res = await fetch(`/api/work/${engagementId}/retainer/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({
          retainerId: data.retainer.id,
          hours: parseFloat(logHoursVal) || 0,
          taskDescription: logTaskDesc.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to log hours");

      setLogHoursVal("1");
      setLogTaskDesc("");
      setLogModalOpen(false);
      fetchRetainer();
    } catch (err: unknown) {
      setLogFeedback(err instanceof Error ? err.message : "Hour logging error");
    } finally {
      setIsLogging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-indigo-500/20 bg-indigo-950/10 p-6 sm:p-7 animate-pulse space-y-3">
        <div className="h-5 bg-indigo-900/30 rounded w-1/3"></div>
        <div className="h-4 bg-indigo-900/20 rounded w-2/3"></div>
      </div>
    );
  }

  const retainer = data?.retainer;
  const activePeriod: RetainerPeriodMetrics | null = data?.activePeriod || null;
  const sla = data?.sla;

  // STATE A: NO RETAINER YET (Invitation Banner)
  if (!retainer) {
    return (
      <>
        <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-[var(--color-surface-base)] to-slate-950 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all hover:border-indigo-500/50">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Repeat className="h-4 w-4 shrink-0" />
              <span>
                {isTr
                  ? "1-Tıkla Aylık Düzenli Bakım & SLA Sözleşmesi Başlat"
                  : "1-Click Monthly Retainer & SLA Agreement"}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                TBK m. 502 / m. 470
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
              {isTr
                ? "Proje teslimi sonrası teknik borç birikmesini önleyin; ayda sabit saat havuzu veya altyapı yönetimiyle sisteminizi SLA güvencesine alın. Düzenli aylık gelir elde edin."
                : "Prevent technical debt post-delivery. Lock in a monthly hours pool or server maintenance agreement under guaranteed SLA response times."}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => setProposalModalOpen(true)}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-semibold shadow-md shadow-indigo-600/25"
            >
              <Repeat className="h-4 w-4" />
              <span>{isTr ? "Aylık Bakım Teklifi Oluştur" : "Propose Retainer"}</span>
            </Button>
          </div>
        </div>

        <RetainerProposalModal
          isOpen={proposalModalOpen}
          onClose={() => setProposalModalOpen(false)}
          engagementId={engagementId}
          listingTitle={listingTitle}
          defaultCurrency={defaultCurrency}
          locale={locale}
          onSuccess={fetchRetainer}
        />
      </>
    );
  }

  // STATE B: PROPOSAL PENDING (Confirmation by Counterparty)
  if (retainer.status === "PROPOSED") {
    return (
      <div className="rounded-3xl border border-amber-500/40 bg-amber-950/20 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Clock className="h-4 w-4 animate-pulse" />
              <span>
                {isTr
                  ? "Aylık Bakım & SLA Teklifi Onay Bekliyor"
                  : "Monthly Retainer Proposal Pending Approval"}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {isTr
                ? `${parseFloat(retainer.monthlyPrice).toLocaleString("tr-TR")} ${retainer.currency} / Ay bedelle sunulan sözleşme karşı tarafın onayını beklemektedir.`
                : `Retainer agreement proposed for ${parseFloat(retainer.monthlyPrice).toLocaleString("tr-TR")} ${retainer.currency}/mo.`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(() => {
              let activateButtonText = isTr ? "Sözleşmeyi Onayla ve Yürürlüğe Al" : "Confirm & Activate";
              if (isActioning) {
                activateButtonText = isTr ? "İmzalanıyor..." : "Activating...";
              }
              return (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleActivate}
                  disabled={isActioning}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{activateButtonText}</span>
                </Button>
              );
            })()}
          </div>
        </div>

        {actionFeedback && (
          <div className="text-xs text-amber-300 font-medium">{actionFeedback}</div>
        )}
      </div>
    );
  }

  // STATE C: ACTIVE OR CANCELLED RETAINER
  const isHourly = retainer.planType === "HOURLY_POOL";
  const hoursUsed = activePeriod?.hoursLogged ?? 0;
  const hoursTotal = activePeriod?.availableHours ?? retainer.includedHours;
  const percentUsed = hoursTotal > 0 ? Math.min(100, Math.round((hoursUsed / hoursTotal) * 100)) : 0;

  let retainerStatusBadgeText = isTr ? "FESHEDİLDİ" : "CANCELLED";
  if (retainer.status === "ACTIVE") {
    retainerStatusBadgeText = isTr ? "🟢 AKTİF BAKIM" : "🟢 ACTIVE SLA";
  }

  let quotaCardTitle = isTr ? "Hizmet Tipi" : "Service Model";
  if (isHourly) {
    quotaCardTitle = isTr ? "Aylık Saat Kotası" : "Hours Quota";
  }

  let logHoursButtonText = isTr ? "Saati Kaydet" : "Submit Hours";
  if (isLogging) {
    logHoursButtonText = isTr ? "Kaydediliyor..." : "Saving...";
  }

  return (
    <>
      <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 via-[var(--color-surface-base)] to-slate-950 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
                <Repeat className="h-4 w-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <span>{isTr ? "Aylık Düzenli Bakım & SLA Masası" : "Monthly Retainer & SLA Hub"}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    retainer.status === "ACTIVE"
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                  }`}
                >
                  {retainerStatusBadgeText}
                </span>
              </h2>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {isTr
                ? `Sözleşme No: OPR-RET-${engagementId.slice(0, 8).toUpperCase()} | TBK m. 502 / m. 470 Sürekli Bakım`
                : `Agreement Ref: OPR-RET-${engagementId.slice(0, 8).toUpperCase()}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setContractModalOpen(true)}
              className="gap-1.5 text-xs text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/10"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{isTr ? "SLA Sözleşmesini İncele" : "View Agreement"}</span>
            </Button>

            {retainer.status === "ACTIVE" && isHourly && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setLogModalOpen(true)}
                className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/20"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{isTr ? "Saat & Aktivite Logla" : "Log Hours"}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Hours / Scope Usage */}
          <div className="p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                {quotaCardTitle}
              </span>
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
            </div>

            {isHourly ? (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-extrabold font-mono text-[var(--color-text-primary)]">
                    {hoursUsed} / {hoursTotal}
                  </span>
                  <span className="text-xs font-mono text-indigo-400 font-semibold">
                    %{percentUsed} {isTr ? "kullanıldı" : "used"}
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${percentUsed}%` }}
                    className={`h-full transition-all duration-300 ${getPercentUsedColorClass(percentUsed)}`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)] pt-1">
                  <span>{isTr ? `Kalan: ${activePeriod?.remainingHours ?? 0} saat` : `Remaining: ${activePeriod?.remainingHours ?? 0}h`}</span>
                  {activePeriod && activePeriod.overageHours > 0 && (
                    <span className="text-rose-400 font-bold">
                      +{activePeriod.overageHours} {isTr ? "saat aşım" : "h overage"}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="font-semibold text-sm text-[var(--color-text-primary)]">
                  {isTr ? "Sabit Altyapı Bakımı" : "Fixed Scope Maintenance"}
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                  {retainer.scopeDescription}
                </p>
              </div>
            )}
          </div>

          {/* Card 2: SLA Response Time Guarantee */}
          <div className="p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                {isTr ? "SLA Müdahale Süresi" : "SLA Response Guarantee"}
              </span>
              <Zap className="h-3.5 w-3.5 text-amber-400" />
            </div>

            <div className="font-semibold text-sm text-[var(--color-text-primary)]">
              {sla?.labelTr || "Standart SLA"}
            </div>

            <div className="space-y-1 text-xs text-[var(--color-text-secondary)] pt-1">
              <div className="flex items-center justify-between">
                <span className="text-rose-400 font-medium">P1 (Kritik Kesinti):</span>
                <span className="font-mono text-[var(--color-text-primary)]">&le; {sla?.p1CriticalResponseHours} saat</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-medium">P2 (Major Hata):</span>
                <span className="font-mono text-[var(--color-text-primary)]">&le; {sla?.p2MajorResponseHours} saat</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-400 font-medium">P3 (Normal Talep):</span>
                <span className="font-mono text-[var(--color-text-primary)]">&le; {sla?.p3MinorResponseDays} iş günü</span>
              </div>
            </div>
          </div>

          {/* Card 3: Billing & Tax Payout */}
          <div className="p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  {isTr ? "Cari Dönem Hakedişi" : "Current Billing Cycle"}
                </span>
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              </div>

              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-extrabold font-mono text-emerald-400">
                  {activePeriod ? activePeriod.totalAmount.toLocaleString("tr-TR") : parseFloat(retainer.monthlyPrice).toLocaleString("tr-TR")} {retainer.currency}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-mono">
                  {activePeriod ? `Dönem #${activePeriod.periodIndex}` : "Aylık"}
                </span>
              </div>

              {activePeriod?.taxDetails && (
                <div className="pt-2 border-t border-[var(--color-border-subtle)] text-[10px] text-[var(--color-text-tertiary)] flex items-center justify-between">
                  <span>%20 Stopaj: <strong className="text-amber-400">{activePeriod.taxDetails.withholdingAmount.toLocaleString("tr-TR")}</strong></span>
                  <span>Banka: <strong className="text-emerald-400">{activePeriod.taxDetails.totalCashToFreelancer.toLocaleString("tr-TR")}</strong></span>
                </div>
              )}
            </div>

            {retainer.status === "ACTIVE" && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isActioning}
                className="text-[10px] text-rose-400 hover:underline pt-2 text-left cursor-pointer transition-colors"
              >
                {isTr ? "Aylık Sözleşmeyi Feshet (15 Gün İhbar)" : "Cancel Retainer (15d Notice)"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contract Viewer Modal */}
      {contractModalOpen && retainer.contractMarkdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in">
          <div className="bg-[#12151e] border border-indigo-500/30 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isTr ? "Resmi Sürekli Bakım & SLA Sözleşmesi" : "Official Retainer & SLA Contract"}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    Mühür: {retainer.sha256Seal?.slice(0, 24)}... (HMK m. 193)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(retainer.contractMarkdown || "");
                    setCopiedContract(true);
                    setTimeout(() => setCopiedContract(false), 2000);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Kopyala"
                >
                  {copiedContract ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Yazdır"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setContractModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto font-sans text-xs leading-relaxed space-y-3 whitespace-pre-wrap select-text">
              {retainer.contractMarkdown}
            </div>
          </div>
        </div>
      )}

      {/* Hour Logging Modal */}
      {logModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in">
          <div className="bg-[#12151e] border border-indigo-500/30 rounded-3xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Clock className="h-4 w-4 text-indigo-400" />
                <span>{isTr ? "Saat & Aktivite Kaydet" : "Log Retainer Hours"}</span>
              </div>
              <button
                type="button"
                onClick={() => setLogModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {logFeedback && (
              <div className="text-xs text-rose-400 p-2 rounded-lg bg-rose-950/20 border border-rose-800">
                {logFeedback}
              </div>
            )}

            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  {isTr ? "Çalışma Süresi (Saat)" : "Hours Spent"}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={logHoursVal}
                  onChange={(e) => setLogHoursVal(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  {isTr ? "Tamamlanan Görev / Hata Giderme Açıklaması" : "Task Description"}
                </label>
                <textarea
                  rows={3}
                  value={logTaskDesc}
                  onChange={(e) => setLogTaskDesc(e.target.value)}
                  placeholder={isTr ? "Örn: Next.js 15 sürüm güncellemesi ve Redis bağlantı optimizasyonu tamamlandı." : "Describe work performed..."}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLogModalOpen(false)}
                  disabled={isLogging}
                >
                  {isTr ? "Vazgeç" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isLogging}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
                >
                  {logHoursButtonText}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
