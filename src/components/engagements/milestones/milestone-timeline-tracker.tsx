"use client";

import { Layers, Settings2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { MilestoneEditorModal } from "./milestone-editor-modal";
import { useMilestoneTracker } from "./hooks/use-milestone-tracker";
import { MilestonePayoutSummary } from "./components/milestone-payout-summary";
import { MilestoneTimelineNode } from "./components/milestone-timeline-node";
import { MilestoneEvidenceViewer } from "./components/milestone-evidence-viewer";
import { MilestoneDisputeTrigger } from "./components/milestone-dispute-trigger";

interface MilestoneTimelineTrackerProps {
  engagementId: string;
  currentUserId: string;
  locale?: string;
}

export function MilestoneTimelineTracker({
  engagementId,
  currentUserId: _currentUserId,
  locale = "tr",
}: MilestoneTimelineTrackerProps) {
  const isTr = locale === "tr";

  const {
    data,
    isLoading,
    fetchMilestones,
    editorModalOpen,
    setEditorModalOpen,
    selectedMilestone,
    deliverableModalOpen,
    setDeliverableModalOpen,
    deliverableUrl,
    setDeliverableUrl,
    deliverableUrlType,
    setDeliverableUrlType,
    deliverableNote,
    setDeliverableNote,
    gitCommitHash,
    setGitCommitHash,
    isSubmittingDeliverable,
    handleOpenDeliverableModal,
    handleSubmitDeliverable,
    handleAcceptDeliverable,
    paymentModalOpen,
    setPaymentModalOpen,
    paymentReference,
    setPaymentReference,
    senderBank,
    setSenderBank,
    transferChannel,
    setTransferChannel,
    transferDate,
    setTransferDate,
    transferTime,
    setTransferTime,
    isMarkingPayment,
    handleOpenPaymentModal,
    handleMarkPayment,
    handleRevertPayment,
    confirmModalOpen,
    setConfirmModalOpen,
    invoiceNumber,
    setInvoiceNumber,
    isConfirmingPayment,
    handleOpenConfirmModal,
    handleConfirmPayment,
    disputeModalOpen,
    setDisputeModalOpen,
    disputeReason,
    setDisputeReason,
    disputeNote,
    setDisputeNote,
    isDisputingPayment,
    handleOpenDisputeModal,
    handleDisputePayment,
    certificateModalOpen,
    setCertificateModalOpen,
    selectedCertificate,
    copiedCertificate,
    setCopiedCertificate,
    handleViewCertificate,
    ipDeedModalOpen,
    setIpDeedModalOpen,
    selectedIpDeed,
    copiedIpDeed,
    setCopiedIpDeed,
    isLoadingIpDeed,
    handleViewIpDeed,
    actionError,
  } = useMilestoneTracker(engagementId, locale);

  if (isLoading && !data) {
    return (
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 animate-pulse space-y-4">
        <div className="h-6 w-1/3 bg-slate-800 rounded-lg" />
        <div className="h-16 w-full bg-slate-800/60 rounded-xl" />
      </div>
    );
  }

  const milestones = data?.milestones || [];
  const deliverablesPercent = data?.deliverablesProgressPercent || 0;
  const paymentPercent = data?.paymentProgressPercent || 0;

  return (
    <>
      <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-[var(--color-surface-base)] to-slate-950 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <span>
                  {isTr ? "Süreç & Hakediş Zaman Çizelgesi" : "Milestone Progress & Payment Ledger"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {milestones.length} {isTr ? "Aşama" : "Phases"}
                </span>
              </h2>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {isTr
                ? "İlana özel teslimat adımları, canlı proje takibi ve emanetsiz hakediş teyit defteri (TBK m. 470 / HMK m. 193)."
                : "Deliverable checkpoints, private progress tracking and zero-escrow payment ledger."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditorModalOpen(true)}
              className="gap-1.5 text-xs text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/10 cursor-pointer"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>{isTr ? "Aşama Planını Özelleştir" : "Customize Roadmap"}</span>
            </Button>
          </div>
        </div>

        {/* Progress Gauges */}
        <MilestonePayoutSummary
          deliverablesPercent={deliverablesPercent}
          paymentPercent={paymentPercent}
          isTr={isTr}
        />

        {/* Milestones Vertical Timeline List */}
        <div className="space-y-4">
          {milestones.map((m) => (
            <MilestoneTimelineNode
              key={m.id}
              milestone={m}
              isTr={isTr}
              isLoadingIpDeed={isLoadingIpDeed}
              onOpenDeliverableModal={handleOpenDeliverableModal}
              onAcceptDeliverable={handleAcceptDeliverable}
              onOpenPaymentModal={handleOpenPaymentModal}
              onRevertPayment={handleRevertPayment}
              onOpenConfirmModal={handleOpenConfirmModal}
              onOpenDisputeModal={handleOpenDisputeModal}
              onViewCertificate={handleViewCertificate}
              onViewIpDeed={handleViewIpDeed}
            />
          ))}
        </div>
      </div>

      {/* MODAL 1: Customize Milestones Plan */}
      <MilestoneEditorModal
        isOpen={editorModalOpen}
        onClose={() => setEditorModalOpen(false)}
        engagementId={engagementId}
        initialMilestones={milestones}
        totalBudget={data?.totalAmount || 30000}
        currency={data?.currency || "TRY"}
        locale={locale}
        onSuccess={fetchMilestones}
      />

      {/* Deliverable & IP Deed Modals */}
      <MilestoneEvidenceViewer
        deliverableModalOpen={deliverableModalOpen}
        selectedMilestone={selectedMilestone}
        deliverableUrl={deliverableUrl}
        setDeliverableUrl={setDeliverableUrl}
        deliverableUrlType={deliverableUrlType}
        setDeliverableUrlType={setDeliverableUrlType}
        gitCommitHash={gitCommitHash}
        setGitCommitHash={setGitCommitHash}
        deliverableNote={deliverableNote}
        setDeliverableNote={setDeliverableNote}
        isSubmittingDeliverable={isSubmittingDeliverable}
        actionError={actionError}
        onSubmitDeliverable={handleSubmitDeliverable}
        onCloseDeliverableModal={() => setDeliverableModalOpen(false)}
        ipDeedModalOpen={ipDeedModalOpen}
        selectedIpDeed={selectedIpDeed}
        copiedIpDeed={copiedIpDeed}
        setCopiedIpDeed={setCopiedIpDeed}
        onCloseIpDeedModal={() => setIpDeedModalOpen(false)}
        isTr={isTr}
      />

      {/* Payment & Dispute Modals */}
      <MilestoneDisputeTrigger
        isTr={isTr}
        actionError={actionError}
        paymentModalOpen={paymentModalOpen}
        setPaymentModalOpen={setPaymentModalOpen}
        selectedMilestone={selectedMilestone}
        senderBank={senderBank}
        setSenderBank={setSenderBank}
        transferChannel={transferChannel}
        setTransferChannel={setTransferChannel}
        transferDate={transferDate}
        setTransferDate={setTransferDate}
        transferTime={transferTime}
        setTransferTime={setTransferTime}
        paymentReference={paymentReference}
        setPaymentReference={setPaymentReference}
        isMarkingPayment={isMarkingPayment}
        onMarkPayment={handleMarkPayment}
        confirmModalOpen={confirmModalOpen}
        setConfirmModalOpen={setConfirmModalOpen}
        invoiceNumber={invoiceNumber}
        setInvoiceNumber={setInvoiceNumber}
        isConfirmingPayment={isConfirmingPayment}
        onConfirmPayment={handleConfirmPayment}
        disputeModalOpen={disputeModalOpen}
        setDisputeModalOpen={setDisputeModalOpen}
        disputeReason={disputeReason}
        setDisputeReason={setDisputeReason}
        disputeNote={disputeNote}
        setDisputeNote={setDisputeNote}
        isDisputingPayment={isDisputingPayment}
        onDisputePayment={handleDisputePayment}
        certificateModalOpen={certificateModalOpen}
        setCertificateModalOpen={setCertificateModalOpen}
        selectedCertificate={selectedCertificate}
        copiedCertificate={copiedCertificate}
        setCopiedCertificate={setCopiedCertificate}
      />
    </>
  );
}
