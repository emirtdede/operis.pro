"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/src/components/ui/button";
import {
  ShieldAlert,
  Plus,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Search,
} from "lucide-react";
import {
  ChangeRequestRecord,
  ChangeRequestSummaryDto,
} from "@/src/modules/engagements/change-request-service";
import { CHANGE_REASON_LABELS } from "@/src/modules/contracts/addendum-generator";
import {
  CreateChangeRequestModal,
  CreateChangeRequestInitialData,
} from "./create-change-request-modal";
import { AddendumViewerModal } from "./addendum-viewer-modal";
import { ScopeSentinelEngine } from "@/src/modules/engagements/scope-sentinel/scope-sentinel-engine";
import { ScopeSentinelResult } from "@/src/modules/engagements/scope-sentinel/scope-sentinel-types";

export interface ScopeShieldPortalProps {
  engagementId: string;
  currentUserId: string;
  isOwner: boolean;
  listingTitle?: string;
  technicalScopeSummary?: string;
  locale?: string;
  currency?: string;
}

function getActionSuccessMessage(action: "APPROVE" | "REJECT", isTr: boolean): string {
  if (action === "APPROVE") {
    return isTr
      ? "Değişiklik talebi onaylandı! Resmi Sözleşme Zeyilnamesi otomatik tanzim edildi."
      : "Change request approved! Official contract addendum has been executed.";
  }
  return isTr
    ? "Değişiklik talebi reddedildi. Ana sözleşme orijinal kapsamıyla devam ediyor."
    : "Change request rejected. Master contract continues unchanged.";
}

function getSentinelToggleButtonLabel(isOpen: boolean, isTr: boolean): string {
  if (isOpen) {
    return isTr ? "Kapat" : "Hide";
  }
  return isTr ? "Test Et" : "Open";
}

function getChangeRequestStatusBadgeClass(
  isApproved: boolean,
  isRejected: boolean,
  isCancelled: boolean
): string {
  if (isApproved) {
    return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
  }
  if (isRejected) {
    return "bg-rose-500/20 text-rose-300 border border-rose-500/30";
  }
  if (isCancelled) {
    return "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30";
  }
  return "bg-amber-500/20 text-amber-300 border border-amber-500/30";
}

function getChangeRequestStatusLabel(
  isApproved: boolean,
  isRejected: boolean,
  isCancelled: boolean,
  isTr: boolean
): string {
  if (isApproved) return isTr ? "Onaylandı" : "Approved";
  if (isRejected) return isTr ? "Reddedildi" : "Rejected";
  if (isCancelled) return isTr ? "İptal Edildi" : "Cancelled";
  return isTr ? "Beklemede" : "Pending";
}

function getScheduleImpactLabel(days: number, isTr: boolean): string {
  if (days > 0) {
    return isTr ? `+${days} gün ilave takvim` : `+${days}d schedule impact`;
  }
  return isTr ? "Aynı Takvim" : "Same schedule";
}

export function ScopeShieldPortal({
  engagementId,
  currentUserId,
  isOwner: _isOwner,
  listingTitle,
  technicalScopeSummary,
  locale = "tr",
  currency = "TRY",
}: ScopeShieldPortalProps) {
  const isTr = locale !== "en";

  const [summary, setSummary] = useState<ChangeRequestSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedAddendum, setSelectedAddendum] = useState<ChangeRequestRecord | null>(null);
  const [rejectingCrId, setRejectingCrId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [historyOpen, setHistoryOpen] = useState(true);

  // Scope Sentinel Interactive Tester State
  const [sentinelOpen, setSentinelOpen] = useState(false);
  const [sentinelText, setSentinelText] = useState("");
  const [sentinelResult, setSentinelResult] = useState<ScopeSentinelResult | null>(null);
  const [initialAddendumData, setInitialAddendumData] =
    useState<CreateChangeRequestInitialData | null>(null);

  const handleRunSentinel = () => {
    if (!sentinelText.trim()) return;
    const result = ScopeSentinelEngine.analyze({
      candidateText: sentinelText,
      baseline: {
        listingTitle: listingTitle || "Proje Kapsamı",
        technicalScopeSummary: technicalScopeSummary || "",
        approvedAddendums: summary?.changeRequests
          ?.filter((c) => c.status === "APPROVED")
          .map((c) => ({ title: c.title, description: c.description })),
      },
      currency,
      locale: isTr ? "tr" : "en",
    });
    setSentinelResult(result);
  };

  const fetchChangeRequests = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/work/${engagementId}/change-requests`, {
        headers: { "x-locale": locale },
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoading(false);
    }
  }, [engagementId, locale]);

  useEffect(() => {
    fetchChangeRequests();
  }, [fetchChangeRequests]);

  const handleRespond = async (crId: string, action: "APPROVE" | "REJECT") => {
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/work/${engagementId}/change-requests/${crId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          action,
          rejectionReason: action === "REJECT" ? rejectionReason.trim() : undefined,
          locale,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isTr ? "İşlem başarısız oldu." : "Action failed."));
      }

      setRejectingCrId(null);
      setRejectionReason("");
      setSuccessMessage(getActionSuccessMessage(action, isTr));

      await fetchChangeRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "İşlem sırasında hata oluştu";
      setErrorMessage(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (crId: string) => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/work/${engagementId}/change-requests/${crId}/cancel`, {
        method: "POST",
        headers: { "x-locale": locale },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isTr ? "İptal edilemedi." : "Failed to cancel."));
      }
      await fetchChangeRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "İptal işleminde hata";
      setErrorMessage(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCr = summary?.pendingRequest;
  const isRequester = pendingCr?.requesterUserId === currentUserId;
  const isReviewer = pendingCr?.reviewerUserId === currentUserId;

  return (
    <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-[var(--color-surface-base)] to-amber-500/5 p-6 sm:p-7 shadow-sm space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>
              {isTr ? "Kapsam Koruma Kalkanı (Scope Shield)" : "Scope Shield & Change Requests"}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-[10px] font-semibold border border-amber-500/25">
              TBK m. 480/2
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
            {isTr
              ? "Proje başladıktan sonra talep edilen ilave işleri (Scope Creep) resmi sözleşme zeyilnamesine dönüştürür. Sözleşmesiz bedava çalışmayı ve uyuşmazlıkları önler."
              : "Prevents uncompensated scope creep by formalizing amendments into legally binding addendums."}
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          disabled={Boolean(pendingCr) || isLoading}
          onClick={() => setCreateModalOpen(true)}
          className="gap-2 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isTr ? "Yeni Değişiklik Talebi" : "New Change Request"}</span>
        </Button>
      </div>

      {/* Cumulative Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-4 space-y-1">
          <div className="text-[11px] text-[var(--color-text-tertiary)] font-medium">
            {isTr ? "Onaylanan Zeyilnameler" : "Approved Addendums"}
          </div>
          <div className="text-lg font-bold text-[var(--color-text-primary)] font-mono">
            {summary?.approvedAddendumsCount || 0}{" "}
            <span className="text-xs text-[var(--color-text-tertiary)] font-normal font-sans">
              {isTr ? "adet" : "executed"}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
          <div className="text-[11px] text-emerald-400 font-medium">
            {isTr ? "İlave Bütçe (Kümülatif)" : "Cumulative Extra Budget"}
          </div>
          <div className="text-lg font-bold text-emerald-300 font-mono">
            +
            {(summary?.totalApprovedBudget || 0).toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
            })}{" "}
            <span className="text-xs">{summary?.currency || currency}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-1">
          <div className="text-[11px] text-blue-400 font-medium">
            {isTr ? "İlave Teslimat Süresi" : "Cumulative Extra Timeline"}
          </div>
          <div className="text-lg font-bold text-blue-300 font-mono">
            +{summary?.totalApprovedDays || 0}{" "}
            <span className="text-xs text-[var(--color-text-secondary)] font-sans">
              {isTr ? "takvim günü" : "days"}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Active PENDING Request Card */}
      {pendingCr && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 space-y-4 animate-in slide-in-from-top-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-[11px] animate-pulse">
                {isTr ? "⏳ Onay Bekleyen Değişiklik Talebi" : "⏳ Pending Change Request"}
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
                #{pendingCr.sequenceNumber}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono">
                +
                {Number(pendingCr.additionalBudget).toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                })}{" "}
                {pendingCr.currency}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 font-mono">
                +{pendingCr.additionalDays} {isTr ? "gün" : "d"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
              {pendingCr.title}
            </h4>
            <div className="text-[11px] text-[var(--color-text-secondary)] font-medium">
              {CHANGE_REASON_LABELS[pendingCr.reason]?.[isTr ? "tr" : "en"] || pendingCr.reason}
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-base)]/80 p-3 rounded-xl border border-[var(--color-border-subtle)] whitespace-pre-wrap leading-relaxed">
              {pendingCr.description}
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-amber-500/20">
            {isReviewer && (
              <>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {isTr
                    ? "Talebi onaylarsanız sözleşme zeyilnamesi imzalanmış sayılır."
                    : "Approving will execute the contract addendum."}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => setRejectingCrId(pendingCr.id)}
                    className="text-xs border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{isTr ? "Reddet" : "Reject"}</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleRespond(pendingCr.id, "APPROVE")}
                    className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{isTr ? "Onayla & Zeyilnameyi İmzala" : "Approve & Execute"}</span>
                  </Button>
                </div>
              </>
            )}

            {isRequester && (
              <>
                <div className="text-xs text-amber-300/90 italic">
                  {isTr
                    ? "Talebiniz muhataba iletildi; inceleme ve onay bekleniyor."
                    : "Your request was submitted; awaiting counterparty review."}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => handleCancel(pendingCr.id)}
                  className="text-xs border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{isTr ? "Talebi Geri Çek" : "Withdraw Request"}</span>
                </Button>
              </>
            )}

            {!isReviewer && !isRequester && (
              <div className="text-xs text-[var(--color-text-tertiary)] italic">
                {isTr
                  ? "Talebin muhatap tarafından değerlendirilmesi bekleniyor."
                  : "Awaiting review."}
              </div>
            )}
          </div>

          {/* Rejection Reason Form (Inline) */}
          {rejectingCrId === pendingCr.id && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2 mt-2">
              <label className="block text-xs font-semibold text-rose-300">
                {isTr ? "Reddetme Gerekçesi (Zorunlu Değil)" : "Rejection Reason (Optional)"}
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={
                  isTr
                    ? "Örn: Mevcut takvimde ek iş için uygun zaman bulunmuyor."
                    : "e.g., Timeline constraint"
                }
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-base)] border border-rose-500/30 text-xs text-[var(--color-text-primary)] focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectingCrId(null)}
                  className="text-xs"
                >
                  {isTr ? "Vazgeç" : "Cancel"}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => handleRespond(pendingCr.id, "REJECT")}
                  className="text-xs bg-rose-600 hover:bg-rose-500 text-white"
                >
                  {isTr ? "Reddi Onayla" : "Confirm Rejection"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Scope Creep Sentinel Live Tester & Addendum Drafter */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-[var(--color-surface-hover)] to-transparent p-4 sm:p-5 space-y-3">
        <div
          className="flex items-center justify-between gap-2 cursor-pointer"
          onClick={() => setSentinelOpen((p) => !p)}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <span>
                  {isTr
                    ? "Akıllı Kapsam Kayması Gözlemcisi (AI Scope Sentinel)"
                    : "AI Scope Creep Sentinel"}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">
                  TBK m. 480/2
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                {isTr
                  ? "Sohbetten gelen talepleri veya aklınızdaki yeni özellikleri yapıştırın; sözleşme kapsamı dışındaysa anında süre/bütçe çıkarıp zeyilname hazırlasın."
                  : "Paste any message or new feature to check against Article 2 scope and generate instant Addendums."}
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className="text-xs gap-1">
            {sentinelOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            <span>{getSentinelToggleButtonLabel(sentinelOpen, isTr)}</span>
          </Button>
        </div>

        {sentinelOpen && (
          <div className="pt-2 space-y-3 border-t border-[var(--color-border-subtle)] animate-in fade-in">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
                {isTr ? "Denetlenecek Talep / Mesaj Metni:" : "Request / Message Text to Analyze:"}
              </label>
              <textarea
                rows={2}
                value={sentinelText}
                onChange={(e) => setSentinelText(e.target.value)}
                placeholder={
                  isTr
                    ? "Örn: Şuraya da küçük bir ödeme entegrasyonu ekleyiverelim, müşteriler kartla ödesin..."
                    : "e.g. Can we also integrate a payment gateway for credit cards..."
                }
                className="w-full p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleRunSentinel}
                disabled={!sentinelText.trim()}
                className="gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isTr ? "Kapsamı Denetle" : "Analyze Scope"}</span>
              </Button>
              {sentinelResult && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSentinelResult(null);
                    setSentinelText("");
                  }}
                  className="text-[11px]"
                >
                  {isTr ? "Temizle" : "Clear"}
                </Button>
              )}
            </div>

            {sentinelResult && (
              <div className="animate-in fade-in duration-200">
                {sentinelResult.isScopeCreep ? (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-amber-300">
                          {isTr
                            ? "⚠️ Kapsam Dışı Ek İş Tespit Edildi (Scope Creep)"
                            : "⚠️ Out-of-Scope Addition Detected"}
                        </div>
                        <p className="text-xs text-amber-200 leading-relaxed">
                          {isTr
                            ? sentinelResult.warningCardMessageTr
                            : sentinelResult.warningCardMessageEn}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-500/20">
                      <div className="text-[11px] text-amber-300/80">
                        {isTr ? "Güven Skoru: " : "Confidence: "}%{sentinelResult.confidence} &bull;{" "}
                        {isTr ? "Dayanak: TBK m. 480/2" : "Basis: TBK Art. 480/2"}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (sentinelResult.quickAddendumDraft) {
                            setInitialAddendumData(sentinelResult.quickAddendumDraft);
                            setCreateModalOpen(true);
                          }
                        }}
                        className="gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {isTr ? "Tek Tıkla Resmi Zeyilname Başlat" : "1-Click Draft Addendum"}
                        </span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 flex items-center gap-2.5 text-emerald-300 text-xs">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>
                      {isTr
                        ? "✅ Kapsam İçi / Normal Revizyon: Bu talep sözleşmedeki mevcut Madde 2 ve teslimat hedefleri dahilinde görünüyor."
                        : "✅ In-Scope / Normal Revision: This request aligns with existing Article 2 specifications."}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Change Requests History Accordion */}
      {summary && summary.changeRequests.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setHistoryOpen((prev) => !prev)}
            className="w-full flex items-center justify-between text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors py-1 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>
                {isTr
                  ? "Tüm Değişiklik Talepleri ve Zeyilnameler"
                  : "All Change Requests & Addendums"}{" "}
                ({summary.changeRequests.length})
              </span>
            </div>
            {historyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {historyOpen && (
            <div className="space-y-2.5 pt-1">
              {summary.changeRequests.map((cr) => {
                const isApproved = cr.status === "APPROVED";
                const isRejected = cr.status === "REJECTED";
                const isCancelled = cr.status === "CANCELLED";

                return (
                  <div
                    key={cr.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 hover:border-amber-500/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getChangeRequestStatusBadgeClass(
                            isApproved,
                            isRejected,
                            isCancelled
                          )}`}
                        >
                          {getChangeRequestStatusLabel(
                            isApproved,
                            isRejected,
                            isCancelled,
                            isTr
                          )}
                        </span>
                        <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                          #{cr.sequenceNumber} &bull; {cr.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)] font-mono">
                        <span>
                          +
                          {Number(cr.additionalBudget).toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          {cr.currency}
                        </span>
                        <span>&bull;</span>
                        <span>
                          +{cr.additionalDays} {isTr ? "gün" : "d"}
                        </span>
                        <span>&bull;</span>
                        <span className="text-[var(--color-text-tertiary)]">
                          {getScheduleImpactLabel(cr.additionalDays, isTr)}
                        </span>
                        {cr.rejectionReason && (
                          <>
                            <span>&bull;</span>
                            <span className="text-rose-400 italic">
                              {isTr ? "Gerekçe: " : "Reason: "}
                              {cr.rejectionReason}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {isApproved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAddendum(cr)}
                        className="text-xs gap-1.5 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isTr ? "Zeyilnameyi İncele / PDF" : "View Addendum / PDF"}</span>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <CreateChangeRequestModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setInitialAddendumData(null);
        }}
        engagementId={engagementId}
        currency={currency}
        locale={locale}
        initialData={initialAddendumData}
        onSuccess={() => {
          fetchChangeRequests();
          setSuccessMessage(
            isTr
              ? "Değişiklik talebi muhataba başarıyla iletildi."
              : "Change request submitted to counterparty."
          );
        }}
      />

      {/* Addendum Viewer Modal */}
      <AddendumViewerModal
        isOpen={Boolean(selectedAddendum)}
        onClose={() => setSelectedAddendum(null)}
        changeRequest={selectedAddendum}
        locale={locale}
      />
    </div>
  );
}
