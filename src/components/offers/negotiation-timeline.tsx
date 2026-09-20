"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Clock,
  Banknote,
  Calendar,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  AlertCircle,
  RotateCcw,
  Check,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../ui/button";
import { CounterOfferModal } from "./counter-offer-modal";
import { NegotiationTimelineDto } from "@/src/modules/offers/service";

interface NegotiationTimelineModalProps {
  offerId: string;
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
  onOfferUpdated?: () => void;
}

function getErrorMessage(err: unknown, defaultMessage: string): string {
  if (err instanceof Error) return err.message;
  return defaultMessage;
}

function formatDurationUnit(unit: string | null | undefined, isTr: boolean): string {
  if (!unit) return "";
  if (unit === "WEEKS") return isTr ? "Hafta" : "Weeks";
  return unit;
}

function getStepMarkerClass(isPending: boolean, isAccepted: boolean, isRejected: boolean): string {
  if (isPending) return "bg-blue-500 ring-4 ring-blue-500/20";
  if (isAccepted) return "bg-emerald-500";
  if (isRejected) return "bg-red-500";
  return "bg-slate-700";
}

function getProposalCardClass(isPending: boolean, isAccepted: boolean): string {
  if (isPending) return "bg-blue-950/20 border-blue-600/40 shadow-lg shadow-blue-900/10";
  if (isAccepted) return "bg-emerald-950/20 border-emerald-600/40";
  return "bg-slate-900/60 border-slate-800";
}

function getProposalAuthorBadge(isByViewer: boolean, isTr: boolean): string {
  if (isByViewer) return isTr ? "(Siz İlettiniz)" : "(By You)";
  return isTr ? "(Karşı Taraf İletti)" : "(By Counterparty)";
}

function getProposalBadgeClass(
  isPending: boolean,
  isAccepted: boolean,
  isRejected: boolean,
  isWithdrawn: boolean
): string {
  if (isPending) return "bg-blue-500/20 text-blue-300 border border-blue-500/30";
  if (isAccepted) return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
  if (isRejected) return "bg-red-500/20 text-red-300 border border-red-500/30";
  if (isWithdrawn) return "bg-amber-500/20 text-amber-300 border border-amber-500/30";
  return "bg-slate-800 text-slate-400";
}

function getProposalStatusLabel(
  isPending: boolean,
  isAccepted: boolean,
  isRejected: boolean,
  isWithdrawn: boolean,
  isTr: boolean
): string {
  if (isPending) return isTr ? "Bekliyor" : "Pending";
  if (isAccepted) return isTr ? "Kabul Edildi" : "Accepted";
  if (isRejected) return isTr ? "Reddedildi" : "Rejected";
  if (isWithdrawn) return isTr ? "Geri Çekildi" : "Withdrawn";
  return isTr ? "Geçersiz Kılındı" : "Superseded";
}

function getRejectButtonLabel(isActionLoading: boolean, isTr: boolean): string {
  if (isActionLoading) return isTr ? "Reddediliyor..." : "Rejecting...";
  return isTr ? "Reddet ve Sonlandır" : "Reject & End";
}

export function NegotiationTimelineModal({
  offerId,
  isOpen,
  onClose,
  locale = "tr",
  onOfferUpdated,
}: NegotiationTimelineModalProps) {
  const isTr = locale === "tr";
  const [data, setData] = useState<NegotiationTimelineDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Sub-modal for creating counter-offer
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);

  // Reject confirmation note dialog
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const fetchTimeline = useCallback(async () => {
    if (!offerId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/offers/${offerId}/counter`);
      if (!res.ok) {
        throw new Error(isTr ? "Pazarlık geçmişi yüklenemedi." : "Failed to load negotiation timeline.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(getErrorMessage(err, isTr ? "Hata oluştu." : "An error occurred."));
    } finally {
      setIsLoading(false);
    }
  }, [offerId, isTr]);

  useEffect(() => {
    if (isOpen && offerId) {
      fetchTimeline();
    }
  }, [isOpen, offerId, fetchTimeline]);

  if (!isOpen) return null;

  const handleAccept = async (counterProposalId: string, expectedRound?: number) => {
    setActionLoading("accept");
    setError(null);
    try {
      const res = await fetch(`/api/offers/${offerId}/counter/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counterProposalId, expectedRound }),
      });
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || (isTr ? "Karşı teklif kabul edilemedi." : "Failed to accept counter-offer."));
      }
      await fetchTimeline();
      if (onOfferUpdated) onOfferUpdated();
    } catch (err: unknown) {
      setError(getErrorMessage(err, isTr ? "İşlem başarısız oldu." : "Operation failed."));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (counterProposalId: string) => {
    setActionLoading("reject");
    setError(null);
    try {
      const res = await fetch(`/api/offers/${offerId}/counter/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counterProposalId, rejectionNote: rejectNote }),
      });
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || (isTr ? "Karşı teklif reddedilemedi." : "Failed to reject counter-offer."));
      }
      setShowRejectConfirm(false);
      await fetchTimeline();
      if (onOfferUpdated) onOfferUpdated();
    } catch (err: unknown) {
      setError(getErrorMessage(err, isTr ? "İşlem başarısız oldu." : "Operation failed."));
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdraw = async (counterProposalId: string) => {
    setActionLoading("withdraw");
    setError(null);
    try {
      const res = await fetch(`/api/offers/${offerId}/counter/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counterProposalId }),
      });
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || (isTr ? "Karşı teklif geri çekilemedi." : "Failed to withdraw counter-offer."));
      }
      await fetchTimeline();
      if (onOfferUpdated) onOfferUpdated();
    } catch (err: unknown) {
      setError(getErrorMessage(err, isTr ? "İşlem başarısız oldu." : "Operation failed."));
    } finally {
      setActionLoading(null);
    }
  };

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return isTr ? "Süresi doldu" : "Expired";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return isTr ? `${hours} saat ${mins} dk kaldı` : `${hours}h ${mins}m left`;
  };

  const activeProposal = data?.activeProposal;
  const currentRound = data?.offer.counterRound || 0;

  const renderTimelineBody = () => {
    if (isLoading) {
      return (
        <div className="py-12 text-center text-slate-400 text-sm">
          {isTr ? "Pazarlık geçmişi yükleniyor..." : "Loading negotiation timeline..."}
        </div>
      );
    }
    if (error) {
      return (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        {/* Visual Negotiation Stepper (Approved Touch #1) */}
        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-800 space-y-6">
          {/* Initial Offer Step */}
          <div className="relative">
            <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-slate-700 border-2 border-[#121620]" />
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">
                  {isTr ? "İlk Teklif (Başlangıç)" : "Initial Proposal (Starting Point)"}
                </span>
                <span className="text-[11px]">{isTr ? "Teklif Veren" : "Freelancer"}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-200">
                <span className="flex items-center gap-1 text-slate-300">
                  <Banknote className="h-3.5 w-3.5 text-slate-400" />
                  {data?.offer.budgetMin} - {data?.offer.budgetMax} {data?.offer.budgetCurrency}
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {data?.offer.estimatedDurationValue}{" "}
                  {formatDurationUnit(data?.offer.estimatedDurationUnit, isTr)}
                </span>
              </div>
              {data?.offer.initialMessage && (
                <p className="text-xs text-slate-400 line-clamp-2 italic pt-1 border-t border-slate-800/60">
                  &ldquo;{data.offer.initialMessage}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Counter Offer Rounds */}
          {data?.history && data.history.length > 0 ? (
            data.history.map((cp) => {
              const isPending = cp.status === "PENDING" && !cp.isExpired;
              const isAccepted = cp.status === "ACCEPTED";
              const isRejected = cp.status === "REJECTED";
              const isWithdrawn = cp.status === "WITHDRAWN";

              return (
                <div key={cp.id} className="relative">
                  {/* Step Marker */}
                  <div
                    className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full border-2 border-[#121620] ${getStepMarkerClass(
                      isPending,
                      isAccepted,
                      isRejected
                    )}`}
                  />

                  <div
                    className={`p-4 rounded-xl border space-y-3 transition-all ${getProposalCardClass(
                      isPending,
                      isAccepted
                    )}`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          {isTr ? `${cp.round}. Tur Karşı Teklif` : `Round ${cp.round} Counter-Offer`}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {getProposalAuthorBadge(Boolean(cp.isByViewer), isTr)}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${getProposalBadgeClass(
                          isPending,
                          isAccepted,
                          isRejected,
                          isWithdrawn
                        )}`}
                      >
                        {getProposalStatusLabel(
                          isPending,
                          isAccepted,
                          isRejected,
                          isWithdrawn,
                          isTr
                        )}
                      </span>
                    </div>

                    {/* Terms Overview */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-200">
                      <span className="flex items-center gap-1.5 text-blue-300">
                        <Banknote className="h-3.5 w-3.5 text-blue-400" />
                        {cp.budgetMin} - {cp.budgetMax} {cp.budgetCurrency}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {cp.estimatedDurationValue}{" "}
                        {formatDurationUnit(cp.estimatedDurationUnit, isTr)}
                      </span>
                    </div>

                    {/* Message Note */}
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                      {cp.message}
                    </p>

                    {/* Interactive Action Bar (If Active Pending Proposal) */}
                    {isPending && (
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80">
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-400" />
                          <span>{formatTimeRemaining(cp.timeRemainingMs)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Recipient Actions */}
                          {!cp.isByViewer && data.isViewerTurn && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAccept(cp.id, cp.round)}
                                disabled={actionLoading !== null}
                                className="h-7 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 shadow-sm"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                {isTr ? "Kabul Et" : "Accept"}
                              </Button>

                              {data.canCounter && (
                                <Button
                                  size="sm"
                                  onClick={() => setIsCounterModalOpen(true)}
                                  disabled={actionLoading !== null}
                                  className="h-7 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3 shadow-sm"
                                >
                                  <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                                  {isTr ? "Karşı Teklif Sun" : "Counter"}
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowRejectConfirm(true)}
                                disabled={actionLoading !== null}
                                className="h-7 border-red-800/60 text-red-400 hover:bg-red-950/30 text-xs px-2.5"
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                {isTr ? "Reddet" : "Reject"}
                              </Button>
                            </>
                          )}

                          {/* Proposer Actions */}
                          {cp.isByViewer && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleWithdraw(cp.id)}
                              disabled={actionLoading !== null}
                              className="h-7 border-amber-800/60 text-amber-400 hover:bg-amber-950/30 text-xs px-2.5"
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              {isTr ? "Geri Çek" : "Withdraw"}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-4 text-xs text-slate-500 italic">
              {isTr
                ? "Henüz bir karşı teklif iletilmedi. İlk karşı teklifi vererek pazarlık sürecini başlatabilirsiniz."
                : "No counter-offers submitted yet. You can submit one to begin negotiation."}
            </div>
          )}
        </div>

        {/* If it is viewer's turn and no active pending counter or can initiate */}
        {data?.isViewerTurn && !activeProposal && data.canCounter && (
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/40 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">
                {isTr ? "Pazarlık Sırası Sizde" : "It's Your Turn to Counter"}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isTr
                  ? "Bütçe ve süre için karşı teklif sunarak süreci ilerletebilirsiniz."
                  : "Submit a revised budget and timeline to negotiate."}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCounterModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
              {isTr ? "Karşı Teklif Ver" : "Submit Counter-Offer"}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-label={isTr ? "Pazarlık ve Karşı Teklif Döngüsü" : "Negotiation & Counter-Offer Cycle"}
      >
        <div className="bg-[#121620] border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {isTr ? "Karşı Teklif & Pazarlık Döngüsü" : "Counter-Offer & Negotiation Cycle"}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {isTr ? `Tur ${currentRound} / 6` : `Round ${currentRound} / 6`}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isTr
                    ? "İki taraf arasında şeffaf, zaman kısıtlı ve adil dönüşümlü teklif süreci."
                    : "Transparent, time-bounded alternating proposal cycle."}
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

          {/* Turn & Status Alert Banner */}
          {data && (
            <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/30">
              <div className="flex items-center gap-2">
                {data.isViewerTurn ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {isTr ? "Sıra Sizde" : "Your Turn"}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    {isTr ? "Karşı Tarafın Yanıtı Bekleniyor" : "Waiting for Counterparty"}
                  </span>
                )}

                {activeProposal && !activeProposal.isExpired && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                    <span>{formatTimeRemaining(activeProposal.timeRemainingMs)}</span>
                  </span>
                )}
              </div>

              {data.offer.status === "ACCEPTED" && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isTr ? "Pazarlık Anlaşmayla Tamamlandı" : "Negotiation Accepted"}
                </span>
              )}
              {data.offer.status === "REJECTED" && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5" />
                  {isTr ? "Pazarlık Sonlandırıldı" : "Negotiation Ended"}
                </span>
              )}
            </div>
          )}

          {/* Scrollable Stepper Timeline */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
            {renderTimelineBody()}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/60">
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              {isTr ? "Garantili & Adli Kayıtlı Anlaşma" : "Guaranteed & Audit-logged"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs px-4"
            >
              {isTr ? "Kapat" : "Close"}
            </Button>
          </div>
        </div>
      </div>

      {/* Reject Confirmation Dialog */}
      {showRejectConfirm && activeProposal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141824] border border-red-900/50 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-red-400">
              <XCircle className="h-5 w-5" />
              <h4 className="text-sm font-bold text-white">
                {isTr ? "Karşı Teklifi Reddet" : "Reject Counter-Offer"}
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isTr
                ? "Bu karşı teklifi reddettiğinizde teklif süreci ve görüşme tamamen sonlandırılacaktır. Devam etmek istiyor musunuz?"
                : "Rejecting this counter-offer will terminate the proposal negotiation completely. Do you want to proceed?"}
            </p>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {isTr ? "Ret Gerekçesi (Opsiyonel)" : "Rejection Reason (Optional)"}
              </label>
              <textarea
                rows={2}
                maxLength={300}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder={isTr ? "Pazarlığın neden sonlandırıldığını belirtebilirsiniz..." : "Specify reason..."}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectConfirm(false)}
                className="border-slate-700 text-slate-300 text-xs"
              >
                {isTr ? "Vazgeç" : "Cancel"}
              </Button>
              <Button
                size="sm"
                onClick={() => handleReject(activeProposal.id)}
                disabled={actionLoading !== null}
                className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs"
              >
                {getRejectButtonLabel(actionLoading === "reject", isTr)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Counter Offer Modal Sub-dialog */}
      {isCounterModalOpen && (
        <CounterOfferModal
          offerId={offerId}
          isOpen={isCounterModalOpen}
          onClose={() => setIsCounterModalOpen(false)}
          onSuccess={async () => {
            setIsCounterModalOpen(false);
            await fetchTimeline();
            if (onOfferUpdated) onOfferUpdated();
          }}
          currentRound={currentRound}
          initialBudgetCurrency={data?.offer.budgetCurrency || "TRY"}
          currentBudgetMin={activeProposal ? activeProposal.budgetMin : data?.offer.budgetMin}
          currentBudgetMax={activeProposal ? activeProposal.budgetMax : data?.offer.budgetMax}
          currentDurationValue={
            activeProposal ? activeProposal.estimatedDurationValue : data?.offer.estimatedDurationValue
          }
          currentDurationUnit={
            activeProposal ? activeProposal.estimatedDurationUnit : data?.offer.estimatedDurationUnit
          }
          locale={locale}
        />
      )}
    </>
  );
}
