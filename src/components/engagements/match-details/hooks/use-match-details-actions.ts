"use client";

import { useState, useEffect } from "react";
import { EMOJI_REGEX, validateContentAppropriateness } from "@/src/lib/security/content-moderator";
import { type EndorsementItem } from "../types";

export interface UseMatchDetailsActionsParams {
  engagementId: string;
  status: string;
  isCompleted: boolean;
  userCompletionStatus?: string | null;
  initialEndorsements?: EndorsementItem[];
  locale: string;
  currentUserId: string;
}

export function useMatchDetailsActions({
  engagementId,
  status,
  isCompleted,
  userCompletionStatus,
  initialEndorsements = [],
  locale,
}: UseMatchDetailsActionsParams) {
  const isTr = locale === "tr";
  const [currentStatus, setCurrentStatus] = useState(status);
  const [completed, setCompleted] = useState(isCompleted);
  const [myMark, setMyMark] = useState(userCompletionStatus ?? "NOT_MARKED");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<
    "email" | "phone" | "wa" | "zoom" | "teams" | "slack" | null
  >(null);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  // Quick Ping state
  const [pingModalOpen, setPingModalOpen] = useState(false);
  const [pingTemplate, setPingTemplate] = useState<"whatsapp" | "meeting" | "email" | "ready">("whatsapp");
  const [isPinging, setIsPinging] = useState(false);
  const [pingCooldown, setPingCooldown] = useState(0);
  const [pingFeedback, setPingFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Night call courtesy notice state
  const [showNightCallModal, setShowNightCallModal] = useState(false);

  useEffect(() => {
    if (pingCooldown <= 0) return;
    const timer = setInterval(() => {
      setPingCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [pingCooldown]);

  const handleSendPing = async () => {
    setIsPinging(true);
    setPingFeedback(null);
    try {
      const res = await fetch(`/api/work/${engagementId}/ping`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({ templateKey: pingTemplate, locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error ||
            (isTr
              ? "Dürtme bildirimi gönderilemedi."
              : "Failed to send ping notification.")
        );
      }
      setPingCooldown(900); // 15 minutes
      setPingFeedback({
        type: "success",
        message:
          isTr
            ? "Hafif dürtme bildirimi karşı tarafın ziline anında iletildi!"
            : "Quick ping notification has been delivered to counterparty's notification bell!",
      });
      setTimeout(() => {
        setPingModalOpen(false);
        setPingFeedback(null);
      }, 2000);
    } catch (err: unknown) {
      let pingErrMsg = isTr ? "Dürtme başarısız." : "Ping failed.";
      if (err instanceof Error) {
        pingErrMsg = err.message;
      }
      setPingFeedback({
        type: "error",
        message: pingErrMsg,
      });
    } finally {
      setIsPinging(false);
    }
  };

  // Endorsements state
  const [endorsements, setEndorsements] = useState(initialEndorsements);
  const [endorsementText, setEndorsementText] = useState("");
  const [isSubmittingEndorsement, setIsSubmittingEndorsement] = useState(false);
  const [endorsementFeedback, setEndorsementFeedback] = useState<string | null>(null);

  const handleCopy = async (
    text: string,
    field: "email" | "phone" | "wa" | "zoom" | "teams" | "slack"
  ) => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const handleMarkComplete = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/work/${engagementId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({ action: "MARKED_COMPLETE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Completion action failed");

      setMyMark("MARKED_COMPLETE");
      if (data.completed) {
        setCompleted(true);
        setCurrentStatus("COMPLETED");
        setFeedback(
          isTr
            ? "Her iki taraf da tamamlanmayı onayladı! Proje artık profilinizde tamamlanmış iş olarak görünecektir."
            : "Both parties have confirmed completion! This project will now appear on your public profile."
        );
      } else if (data.disputed) {
        setCurrentStatus("DISPUTED");
        setFeedback(
          isTr
            ? "Tamamlama itirazı mevcut. Durumu karşı tarafla doğrudan iletişim kurarak çözebilirsiniz."
            : "A completion dispute exists. Please coordinate directly with your counterparty."
        );
      } else {
        setCurrentStatus("COMPLETION_PENDING");
        setFeedback(
          isTr
            ? "Tamamlandı olarak işaretlediniz. Karşı taraf da onayladığında proje tamamlanmış olarak kaydedilecektir."
            : "You marked the project as complete. Once the other party confirms, it will be finalized."
        );
      }
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Error marking complete");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispute = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/work/${engagementId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({ action: "DISPUTES_COMPLETION" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dispute action failed");

      setMyMark("DISPUTES_COMPLETION");
      setCurrentStatus("DISPUTED");
      setFeedback(
        isTr
          ? "İşin henüz tamamlanmadığını belirttiniz. Durumu karşı tarafla doğrudan iletişim kurarak çözebilirsiniz."
          : "You indicated that the work is not complete. Please coordinate directly with your counterparty."
      );
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Error reporting dispute");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEngagement = async () => {
    setIsCancelling(true);
    setCancelFeedback(null);
    try {
      const res = await fetch(`/api/work/${engagementId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({ reason: cancelReason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (isTr ? "İş birliği iptal edilemedi" : "Failed to cancel engagement")
        );
      }

      setCurrentStatus("CANCELLED");
      setCancelModalOpen(false);
      setFeedback(
        isTr
          ? "İş birliği iptal edildi. İlan 'Yayında Değil' statüsüne geçirildi; ilan sahibi panelinden ilanı yeniden yayına alabilir."
          : "Engagement has been cancelled. The listing was moved to inactive; the owner can reactivate it from their dashboard."
      );
    } catch (err: unknown) {
      let cancelErrMsg = isTr
        ? "İptal işleminde hata oluştu"
        : "Error cancelling engagement";
      if (err instanceof Error) {
        cancelErrMsg = err.message;
      }
      setCancelFeedback(cancelErrMsg);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubmitEndorsement = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = endorsementText.trim();
    if (!cleanText) return;

    if (cleanText.length < 20) {
      setEndorsementFeedback(
        isTr
          ? "Tavsiye notu en az 20 karakter olmalıdır."
          : "Endorsement must be at least 20 characters."
      );
      return;
    }

    if (EMOJI_REGEX.test(cleanText)) {
      setEndorsementFeedback(
        isTr
          ? "Tavsiye notu emoji içeremez. Lütfen profesyonel metin kullanınız."
          : "Endorsement cannot contain emojis. Please use plain text."
      );
      return;
    }

    if (!validateContentAppropriateness(cleanText).isValid) {
      setEndorsementFeedback(
        isTr
          ? "Tavsiye notunuz topluluk kurallarına aykırı veya uygunsuz ifadeler içeriyor."
          : "Endorsement contains inappropriate or prohibited language."
      );
      return;
    }

    setIsSubmittingEndorsement(true);
    setEndorsementFeedback(null);

    try {
      const res = await fetch(`/api/work/${engagementId}/endorse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({ content: cleanText, locale }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (isTr ? "Tavsiye notu kaydedilemedi." : "Failed to record endorsement.")
        );
      }

      setEndorsements((prev) => [...prev, data.endorsement]);
      setEndorsementText("");
      setEndorsementFeedback(
        isTr
          ? "Doğrulanmış tavsiye mektubunuz başarıyla kaydedildi ve iş ortağınızın profiline işlendi!"
          : "Your verified endorsement has been recorded and published on your counterparty's profile!"
      );
    } catch (err: unknown) {
      let endorseErrMsg = isTr
        ? "Tavsiye kaydedilemedi."
        : "Failed to record endorsement.";
      if (err instanceof Error) {
        endorseErrMsg = err.message;
      }
      setEndorsementFeedback(endorseErrMsg);
    } finally {
      setIsSubmittingEndorsement(false);
    }
  };

  return {
    isTr,
    currentStatus,
    completed,
    myMark,
    isLoading,
    feedback,
    copiedField,
    contractModalOpen,
    setContractModalOpen,
    cancelModalOpen,
    setCancelModalOpen,
    cancelReason,
    setCancelReason,
    isCancelling,
    cancelFeedback,
    setCancelFeedback,
    pingModalOpen,
    setPingModalOpen,
    pingTemplate,
    setPingTemplate,
    isPinging,
    pingCooldown,
    pingFeedback,
    setPingFeedback,
    showNightCallModal,
    setShowNightCallModal,
    endorsements,
    endorsementText,
    setEndorsementText,
    isSubmittingEndorsement,
    endorsementFeedback,
    handleSendPing,
    handleCopy,
    handleMarkComplete,
    handleDispute,
    handleCancelEngagement,
    handleSubmitEndorsement,
  };
}
