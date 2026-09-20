"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MilestoneDto,
  MilestonePlanResult,
  TransferChannel,
  PaymentDisputeReason,
  PaymentSettlementCertificate,
} from "@/src/modules/engagements/milestone-service";
import { MilestoneDeliverableUrlType } from "@/src/modules/engagements/milestone-synthesizer";
import type { IpAssignmentDeed } from "@/src/modules/engagements/ip-assignment/ip-assignment-types";

export function useMilestoneTracker(engagementId: string, locale: string = "tr") {
  const [data, setData] = useState<MilestonePlanResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editorModalOpen, setEditorModalOpen] = useState(false);

  // Deliverable submit modal state
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneDto | null>(null);
  const [deliverableModalOpen, setDeliverableModalOpen] = useState(false);
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [deliverableUrlType, setDeliverableUrlType] =
    useState<MilestoneDeliverableUrlType>("CODE_REPO");
  const [deliverableNote, setDeliverableNote] = useState("");
  const [gitCommitHash, setGitCommitHash] = useState("");
  const [isSubmittingDeliverable, setIsSubmittingDeliverable] = useState(false);

  // Payment marking modal state (Employer)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const [senderBank, setSenderBank] = useState<string>("GARANTI_BBVA");
  const [transferChannel, setTransferChannel] = useState<TransferChannel>("FAST");
  const [transferDate, setTransferDate] = useState<string>("");
  const [transferTime, setTransferTime] = useState<string>("");
  const [isMarkingPayment, setIsMarkingPayment] = useState(false);

  // Payment confirm modal state (Freelancer)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  // Payment dispute modal state (Freelancer)
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState<PaymentDisputeReason>("FUNDS_NOT_RECEIVED");
  const [disputeNote, setDisputeNote] = useState("");
  const [isDisputingPayment, setIsDisputingPayment] = useState(false);

  // Settlement Certificate modal state
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] =
    useState<PaymentSettlementCertificate | null>(null);
  const [copiedCertificate, setCopiedCertificate] = useState(false);

  // FSEK IP Assignment Deed modal state
  const [ipDeedModalOpen, setIpDeedModalOpen] = useState(false);
  const [selectedIpDeed, setSelectedIpDeed] = useState<IpAssignmentDeed | null>(null);
  const [copiedIpDeed, setCopiedIpDeed] = useState(false);
  const [isLoadingIpDeed, setIsLoadingIpDeed] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);

  const fetchMilestones = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/work/${engagementId}/milestones`, {
        headers: { "x-locale": locale },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoading(false);
    }
  }, [engagementId, locale]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const handleOpenDeliverableModal = (m: MilestoneDto) => {
    setSelectedMilestone(m);
    setDeliverableUrl(m.deliverableUrl || "");
    setDeliverableUrlType(m.deliverableUrlType || "CODE_REPO");
    setDeliverableNote(m.deliverableNote || "");
    setGitCommitHash(m.gitCommitHash || "");
    setActionError(null);
    setDeliverableModalOpen(true);
  };

  const handleSubmitDeliverable = async (status: "IN_PROGRESS" | "SUBMITTED") => {
    if (!selectedMilestone) return;
    setIsSubmittingDeliverable(true);
    setActionError(null);

    try {
      const res = await fetch(
        `/api/work/${engagementId}/milestones/${selectedMilestone.id}/deliverable`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-locale": locale },
          body: JSON.stringify({
            status,
            deliverableUrl,
            deliverableUrlType,
            deliverableNote,
            gitCommitHash,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update deliverable");

      setDeliverableModalOpen(false);
      fetchMilestones();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating deliverable";
      setActionError(msg);
    } finally {
      setIsSubmittingDeliverable(false);
    }
  };

  const handleAcceptDeliverable = async (m: MilestoneDto) => {
    try {
      const res = await fetch(`/api/work/${engagementId}/milestones/${m.id}/deliverable`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({ action: "ACCEPT" }),
      });
      if (!res.ok) throw new Error("Accept failed");
      fetchMilestones();
    } catch {
      // Non-blocking
    }
  };

  const handleOpenPaymentModal = (m: MilestoneDto) => {
    setSelectedMilestone(m);
    setPaymentReference(m.paymentReference || "");
    setSenderBank(m.senderBank || "GARANTI_BBVA");
    setTransferChannel((m.transferChannel as TransferChannel) || "FAST");
    setTransferDate(m.transferDate || new Date().toISOString().slice(0, 10));
    setTransferTime(m.transferTime || new Date().toTimeString().slice(0, 5));
    setActionError(null);
    setPaymentModalOpen(true);
  };

  const handleMarkPayment = async () => {
    if (!selectedMilestone) return;
    setIsMarkingPayment(true);
    setActionError(null);

    try {
      const res = await fetch(
        `/api/work/${engagementId}/milestones/${selectedMilestone.id}/payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-locale": locale },
          body: JSON.stringify({
            action: "MARK_PAID",
            paymentReference,
            senderBank,
            transferChannel,
            transferDate,
            transferTime,
            declaredAmount: selectedMilestone.amount,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to mark payment");

      setPaymentModalOpen(false);
      fetchMilestones();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error marking payment";
      setActionError(msg);
    } finally {
      setIsMarkingPayment(false);
    }
  };

  const handleRevertPayment = async (m: MilestoneDto) => {
    try {
      const res = await fetch(`/api/work/${engagementId}/milestones/${m.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({ action: "REVERT_PAID" }),
      });
      if (!res.ok) throw new Error("Revert failed");
      fetchMilestones();
    } catch {
      // Non-blocking
    }
  };

  const handleOpenConfirmModal = (m: MilestoneDto) => {
    setSelectedMilestone(m);
    setInvoiceNumber(m.invoiceNumber || "");
    setActionError(null);
    setConfirmModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedMilestone) return;
    setIsConfirmingPayment(true);
    setActionError(null);

    try {
      const res = await fetch(
        `/api/work/${engagementId}/milestones/${selectedMilestone.id}/payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-locale": locale },
          body: JSON.stringify({
            action: "CONFIRM_PAID",
            invoiceNumber,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to confirm payment");

      setConfirmModalOpen(false);
      fetchMilestones();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error confirming payment";
      setActionError(msg);
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handleOpenDisputeModal = (m: MilestoneDto) => {
    setSelectedMilestone(m);
    setDisputeReason("FUNDS_NOT_RECEIVED");
    setDisputeNote("");
    setActionError(null);
    setDisputeModalOpen(true);
  };

  const handleDisputePayment = async () => {
    if (!selectedMilestone) return;
    setIsDisputingPayment(true);
    setActionError(null);

    try {
      const res = await fetch(
        `/api/work/${engagementId}/milestones/${selectedMilestone.id}/payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-locale": locale },
          body: JSON.stringify({
            action: "DISPUTE_PAID",
            disputeReason,
            disputeNote,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to dispute payment");

      setDisputeModalOpen(false);
      fetchMilestones();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error disputing payment";
      setActionError(msg);
    } finally {
      setIsDisputingPayment(false);
    }
  };

  const handleViewCertificate = async (m: MilestoneDto) => {
    if (m.settlementCertificate) {
      setSelectedCertificate(m.settlementCertificate);
      setCertificateModalOpen(true);
      return;
    }

    try {
      const res = await fetch(`/api/work/${engagementId}/milestones/${m.id}/payment`, {
        headers: { "x-locale": locale },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.certificate) {
          setSelectedCertificate(json.certificate);
          setCertificateModalOpen(true);
        }
      }
    } catch {
      // Non-blocking
    }
  };

  const handleViewIpDeed = async (m: MilestoneDto) => {
    if (m.ipAssignmentDeed) {
      setSelectedIpDeed(m.ipAssignmentDeed);
      setIpDeedModalOpen(true);
      return;
    }

    setIsLoadingIpDeed(true);
    try {
      const res = await fetch(`/api/work/${engagementId}/milestones/${m.id}/ip-deed`, {
        headers: { "x-locale": locale },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.deed) {
          setSelectedIpDeed(json.deed);
          setIpDeedModalOpen(true);
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingIpDeed(false);
    }
  };

  return {
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
    setActionError,
  };
}
