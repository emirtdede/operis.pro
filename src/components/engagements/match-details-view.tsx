"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  FileText,
  MessageCircle,
  Calendar,
  Mail,
  Layers,
  Award,
  Send,
  ShieldCheck,
  Quote,
  XCircle,
  AlertTriangle,
  X,
  Phone,
  Video,
  ExternalLink,
  Bell,
  Clock,
  Moon,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { AvatarInitials } from "../ui/avatar-initials";
import { ContractDraftModal } from "./contract-draft-modal";
import { getLocalizedProfilePath } from "@/src/lib/i18n/routes";

function SlackIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

function TeamsIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.5 7.5a2 2 0 1 0-2-2 2 2 0 0 0 2 2zm-8-1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 11.5 6.5zm8 2h-2a1.5 1.5 0 0 0-.5.09V7.5a2.5 2.5 0 0 0-2.5-2.5h-6A2.5 2.5 0 0 0 6 7.5v8A2.5 2.5 0 0 0 8.5 18h6a2.5 2.5 0 0 0 2.5-2.5v-1.09a1.5 1.5 0 0 0 .5.09h2a2.5 2.5 0 0 0 2.5-2.5v-1.5a2.5 2.5 0 0 0-2.5-2.5zm-5 7a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 6.5 14v-6A1.5 1.5 0 0 1 8 6.5h5A1.5 1.5 0 0 1 14.5 8v6.5zm5-2a1.5 1.5 0 0 1-1.5 1.5h-1V9.5h1a1.5 1.5 0 0 1 1.5 1.5z" />
    </svg>
  );
}
import { EMOJI_REGEX, validateContentAppropriateness } from "@/src/lib/security/content-moderator";

export interface MatchDetailsViewProps {
  engagementId: string;
  listingTitle: string;
  category: string;
  matchedAt: string | Date;
  status: string;
  offerMessage: string;
  budgetLabel: string | null;
  timelineLabel: string | null;
  counterparty: {
    userId: string;
    displayName: string;
    handle: string;
    email: string;
    phone: string | null;
    preferredContactChannel?: string | null;
    timeZone?: string | null;
    city?: string | null;
  };
  currentUser?: {
    displayName?: string;
    email?: string;
  };
  currentUserId: string;
  ownerUserId: string;
  isCompleted: boolean;
  userCompletionStatus?: string | null;
  counterpartyCompletionStatus?: string | null;
  initialEndorsements?: Array<{
    id: string;
    authorUserId: string;
    recipientUserId: string;
    content: string;
    projectTitleSnapshot?: string;
    createdAt: Date | string;
    authorDisplayName?: string;
  }>;
  locale: string;
}

export function getCounterpartyLocalTime(timeZone?: string | null, locale = "tr") {
  const tz = timeZone || "Europe/Istanbul";
  try {
    const now = new Date();
    const timeStr = new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);

    const hourNum = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        hour12: false,
      }).format(now),
      10
    );

    const isNight = hourNum >= 22 || hourNum < 8;
    const isBusiness = hourNum >= 9 && hourNum < 19;

    return {
      tz,
      timeStr,
      hourNum,
      isNight,
      isBusiness,
    };
  } catch {
    return {
      tz: "Europe/Istanbul",
      timeStr: "--:--",
      hourNum: 12,
      isNight: false,
      isBusiness: true,
    };
  }
}

export function MatchDetailsView({
  engagementId,
  listingTitle,
  category,
  matchedAt,
  status,
  offerMessage,
  budgetLabel,
  timelineLabel,
  counterparty,
  currentUser,
  currentUserId,
  ownerUserId,
  isCompleted,
  userCompletionStatus,
  counterpartyCompletionStatus,
  initialEndorsements = [],
  locale,
}: MatchDetailsViewProps) {
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

  const counterpartyTime = getCounterpartyLocalTime(counterparty.timeZone, locale);

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
      setPingFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : isTr
              ? "Dürtme başarısız."
              : "Ping failed.",
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

  const existingMyEndorsement = endorsements.find((e) => e.authorUserId === currentUserId);

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

  const matchedDateStr = new Date(matchedAt).toLocaleDateString(isTr ? "tr-TR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Instant Handshake Action URLs
  const cleanPhone = counterparty.phone
    ? counterparty.phone.replace(/[^0-9+]/g, "").replace(/^\+/, "")
    : null;

  // 1. WhatsApp
  const waText = encodeURIComponent(
    isTr
      ? `Merhaba ${counterparty.displayName}, Operis üzerinden '${listingTitle}' ilanımızda eşleştik. İlan detaylarını ve başlangıç takvimini görüşmek isterim.`
      : `Hello ${counterparty.displayName}, we matched on Operis for '${listingTitle}'. I would like to discuss listing details and timeline.`
  );
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : null;

  // 2. Google Meet & Calendar
  const meetTitle = encodeURIComponent(
    isTr
      ? `Operis Tanışma & Proje Başlangıcı: ${listingTitle}`
      : `Operis Kickoff Meeting: ${listingTitle}`
  );
  const meetDetails = encodeURIComponent(
    isTr
      ? `Operis üzerindeki '${listingTitle}' ilanımız için 30 dakikalık tanışma ve başlangıç toplantısı.\n\nİş Ortağı: ${counterparty.displayName} (${counterparty.email})\nReferans: OPR-ENG-${engagementId.slice(0, 8).toUpperCase()}`
      : `Kickoff meeting for '${listingTitle}' listing on Operis.\n\nCounterparty: ${counterparty.displayName} (${counterparty.email})\nReference: OPR-ENG-${engagementId.slice(0, 8).toUpperCase()}`
  );
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${meetTitle}&details=${meetDetails}${
    counterparty.email && counterparty.email !== "—"
      ? `&add=${encodeURIComponent(counterparty.email)}`
      : ""
  }`;

  // 3. Zoom
  const zoomStartUrl = "https://zoom.us/start/videomeeting";
  const zoomInviteText = isTr
    ? `Operis Video Toplantısı Daveti: '${listingTitle}'\nReferans: OPR-ENG-${engagementId.slice(0, 8).toUpperCase()}\nİş Ortağı: ${counterparty.displayName}\nLütfen Zoom bağlantınızı iletiniz veya bu linkten anlık odaya katılınız: ${zoomStartUrl}`
    : `Operis Video Meeting Invite: '${listingTitle}'\nReference: OPR-ENG-${engagementId.slice(0, 8).toUpperCase()}\nCounterparty: ${counterparty.displayName}\nPlease share your Zoom link or join instant room: ${zoomStartUrl}`;

  // 4. Microsoft Teams
  const teamsMessage = isTr
    ? `Merhaba ${counterparty.displayName}, Operis üzerinden '${listingTitle}' ilanımızda eşleştik. Görüşmeyi buradan sürdürebiliriz.`
    : `Hello ${counterparty.displayName}, we matched on Operis for '${listingTitle}'. We can coordinate here.`;
  const teamsChatUrl =
    counterparty.email && counterparty.email !== "—"
      ? `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(
          counterparty.email
        )}&message=${encodeURIComponent(teamsMessage)}`
      : null;

  // 5. Slack
  const slackAppUrl =
    counterparty.email && counterparty.email !== "—"
      ? `https://slack.com/app_redirect?channel=${encodeURIComponent(counterparty.email)}`
      : null;
  const slackInviteText = isTr
    ? `Merhaba ${counterparty.displayName},\nOperis üzerinden '${listingTitle}' ilanımızda eşleştik.\nSlack Connect veya doğrudan mesaj için e-posta adresim: ${currentUser?.email || "Operis İş Ortağınız"}\nReferans: OPR-ENG-${engagementId.slice(0, 8).toUpperCase()}`
    : `Hello ${counterparty.displayName},\nWe matched on Operis for '${listingTitle}'.\nTo connect on Slack Connect or direct message, my email is: ${currentUser?.email || "Your Operis Counterparty"}\nReference: OPR-ENG-${engagementId.slice(0, 8).toUpperCase()}`;

  // 6. Corporate Email
  const emailSubject = encodeURIComponent(
    isTr ? `Operis İlan Eşleşmesi: ${listingTitle}` : `Operis Listing Match: ${listingTitle}`
  );
  const emailBody = encodeURIComponent(
    isTr
      ? `Merhaba ${counterparty.displayName},\n\nOperis üzerinden '${listingTitle}' ilanımızda eşleştik.\n\nİlan detaylarını, teknik mimariyi ve teslimat aşamalarını netleştirmek adına iletişime geçmek istedim.\n\nİyi çalışmalar dilerim.`
      : `Hello ${counterparty.displayName},\n\nWe successfully matched on Operis for '${listingTitle}'.\n\nI would like to connect to coordinate scope, technical requirements, and delivery milestones.\n\nBest regards.`
  );
  const mailUrl =
    counterparty.email && counterparty.email !== "—"
      ? `mailto:${counterparty.email}?subject=${emailSubject}&body=${emailBody}`
      : null;

  // 7. Phone Call
  const telUrl = cleanPhone ? `tel:${cleanPhone}` : null;

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
      setCancelFeedback(
        err instanceof Error
          ? err.message
          : isTr
            ? "İptal işleminde hata oluştu"
            : "Error cancelling engagement"
      );
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
      setEndorsementFeedback(
        err instanceof Error
          ? err.message
          : isTr
            ? "Tavsiye kaydedilemedi."
            : "Failed to record endorsement."
      );
    } finally {
      setIsSubmittingEndorsement(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header Container */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="secondary">{category}</Badge>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
            <Badge
              variant={
                completed
                  ? "primary"
                  : currentStatus === "CANCELLED"
                    ? "outline"
                    : currentStatus === "DISPUTED"
                      ? "outline"
                      : currentStatus === "COMPLETION_PENDING"
                        ? "secondary"
                        : "outline"
              }
              className={
                currentStatus === "CANCELLED"
                  ? "border-rose-500/40 text-rose-400 bg-rose-500/10"
                  : ""
              }
            >
              {completed
                ? isTr
                  ? "Tamamlandı"
                  : "Completed"
                : currentStatus === "CANCELLED"
                  ? isTr
                    ? "İptal Edildi"
                    : "Cancelled"
                  : currentStatus === "DISPUTED"
                    ? isTr
                      ? "Uyuşmazlık Bildirildi"
                      : "Disputed"
                    : currentStatus === "COMPLETION_PENDING"
                      ? isTr
                        ? "Onay Bekleniyor"
                        : "Completion Pending"
                      : isTr
                        ? "Eşleşti / Aktif"
                        : "Matched"}
            </Badge>
            <span>{matchedDateStr}</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
          {listingTitle}
        </h1>
      </div>

      {/* Cancelled Banner */}
      {currentStatus === "CANCELLED" && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 sm:p-7 shadow-sm space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
            <XCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>
              {isTr ? "Bu İş Birliği İptal Edildi" : "This Collaboration Has Been Cancelled"}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">
            {isTr
              ? "Bu iş birliği taraflardan biri tarafından iptal edilmiştir. İlgili ilan 'Yayında Değil' statüsüne alınmıştır. İlan sahibi paneline girerek ilanı güncelleyebilir veya tek tıkla yeniden yayına alabilir."
              : "This engagement was cancelled by one of the participants. The listing was moved to inactive. The listing owner can edit or reactivate the listing from their dashboard."}
          </p>
        </div>
      )}

      {/* Bilateral Contract Draft Banner */}
      <div className="rounded-3xl border border-blue-500/25 bg-gradient-to-r from-blue-500/10 via-[var(--color-surface-base)] to-blue-500/5 p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>
              {isTr
                ? "1-Tıkla Resmi Hizmet & Fikri Mülkiyet Devir Sözleşmesi"
                : "1-Click Service & IP Transfer Contract"}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
            {isTr
              ? "Operis emanet havuzu tutmaz; 5846 sayılı FSEK ve 6325 sayılı doğrudan arabuluculuk maddeleriyle hukuki zırh sunar. Tek tıkla resmi sözleşmenizi PDF olarak kaydedip yazdırabilirsiniz."
              : "Operis takes zero commission and operates zero escrow. Review and print your official bilateral contract with full IP transfer and mediation clauses."}
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setContractModalOpen(true)}
          className="gap-2 shrink-0 shadow-md shadow-blue-500/15"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          <span>{isTr ? "Resmi PDF Sözleşmesi Oluştur" : "Generate Official PDF"}</span>
        </Button>
      </div>

      {/* Lightweight 3-Step Milestone Schedule Recommendation */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--color-text-primary)]">
            <Layers className="h-4.5 w-4.5 text-blue-400" aria-hidden="true" />
            <span>
              {isTr
                ? "Tavsiye Edilen 3 Kademeli Avans ve Kilometre Çizelgesi"
                : "Recommended 3-Step Milestone & Advance Schedule"}
            </span>
          </div>
          <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
            {isTr ? "Güvenli İş Birliği Modeli" : "Safe Collaboration Model"}
          </span>
        </div>

        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {isTr
            ? "Platform emanet para tutmaz; ancak serbest çalışanın emeğini, işverenin de teslimatını korumak için aşağıdaki 3 adımlı ödeme çizelgesi tavsiye edilir:"
            : "Platform holds no escrow; following this 3-tier milestone schedule eliminates non-payment and non-delivery risks:"}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>{isTr ? "1. Aşama" : "Phase 1"}</span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 font-mono">%30</span>
            </div>
            <div className="font-semibold text-xs text-[var(--color-text-primary)]">
              {isTr ? "Tasarım ve Mimari Onayı" : "Design & Architecture Approval"}
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-normal">
              {isTr
                ? "Altyapı şablonları ve mimari onaylandığında %30 avans ödenir."
                : "30% initial advance once project architecture and UI are agreed."}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-blue-400">
              <span>{isTr ? "2. Aşama" : "Phase 2"}</span>
              <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 font-mono">%40</span>
            </div>
            <div className="font-semibold text-xs text-[var(--color-text-primary)]">
              {isTr ? "Fonksiyonel Demo ve Test" : "Functional Demo & Testing"}
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-normal">
              {isTr
                ? "Çalışan prototip ve test sürümü sunulduğunda %40 ara ödeme yapılır."
                : "40% interim payment upon milestone demo and functional test."}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-purple-400">
              <span>{isTr ? "3. Aşama" : "Phase 3"}</span>
              <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 font-mono">%30</span>
            </div>
            <div className="font-semibold text-xs text-[var(--color-text-primary)]">
              {isTr ? "Kaynak Kod & FSEK Devri" : "Source Code & IP Transfer"}
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-normal">
              {isTr
                ? "Canlıya alma, kod teslimi ve FSEK mülkiyet devriyle son %30 ödenir."
                : "Final 30% payment upon complete source code handover and deployment."}
            </p>
          </div>
        </div>
      </div>

      {/* Counterparty Contact & Instant Handshake Kit */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              {isTr ? "Eşleşilen Taraf ve İletişim Kanalları" : "Counterparty & Contact Channels"}
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {isTr
                ? "Sürtünmesiz doğrudan iletişim için hazır araçlar."
                : "Frictionless direct communication power tools."}
            </p>
          </div>
        </div>

        {/* Counterparty profile snippet with Live Timezone & Availability Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40">
          <div className="flex items-center gap-4">
            <AvatarInitials name={counterparty.displayName} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={getLocalizedProfilePath(counterparty.handle, locale)}
                  className="text-base font-semibold text-[var(--color-text-primary)] hover:text-blue-400 transition-colors"
                >
                  {counterparty.displayName}
                </Link>
                <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
                  @{counterparty.handle}
                </span>
              </div>
              {counterparty.city && (
                <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                  📍 {counterparty.city}
                </div>
              )}
            </div>
          </div>

          {/* Live Timezone & Availability Pill */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                counterpartyTime.isNight
                  ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
                  : counterpartyTime.isBusiness
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-300"
              }`}
            >
              {counterpartyTime.isNight ? (
                <Moon className="h-3.5 w-3.5 shrink-0 text-purple-400" aria-hidden="true" />
              ) : (
                <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
              )}
              <span className="font-mono font-bold">{counterpartyTime.timeStr}</span>
              <span className="text-[11px] opacity-75">({counterpartyTime.tz})</span>
              <span className="opacity-40">•</span>
              <span className="font-medium">
                {counterpartyTime.isNight
                  ? isTr
                    ? "🌙 Gece / Mesai Dışı"
                    : "🌙 Night / Off-Hours"
                  : counterpartyTime.isBusiness
                    ? isTr
                      ? "🟢 Aktif Çalışma Saatleri"
                      : "🟢 Active Hours"
                    : isTr
                      ? "🟡 Akşam Saatleri"
                      : "🟡 Evening Hours"}
              </span>
            </div>
          </div>
        </div>

        {/* Instant Handshake Kit (1-Tıkla İletişim & Toplantı Paketi - 7 Kanal) */}
        <div className="rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-500/10 via-[var(--color-surface-hover)] to-transparent p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-xs text-blue-400">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>
                  {isTr
                    ? "Eşleşme Sonrası 1-Tıkla İletişim & Toplantı Paketi (7 Kanal)"
                    : "Instant 1-Click Communication & Meeting Suite (7 Channels)"}
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "Sıfır platform sansürü — doğrudan dilediğiniz kanaldan tek tıkla başlayın"
                  : "Zero platform censorship — connect directly via any channel in one click"}
              </p>
            </div>

            {/* Quick Ping Trigger Button */}
            <div className="shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPingModalOpen(true)}
                disabled={pingCooldown > 0}
                className={`gap-1.5 text-xs font-semibold h-8.5 px-3 rounded-xl cursor-pointer transition-all ${
                  pingCooldown > 0
                    ? "opacity-75 bg-zinc-800/60 border-zinc-700 text-zinc-400 cursor-not-allowed"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/60 shadow-sm shadow-amber-500/10"
                }`}
              >
                <Bell className={`h-3.5 w-3.5 ${pingCooldown > 0 ? "text-zinc-400" : "text-amber-400 animate-bounce"}`} aria-hidden="true" />
                <span>
                  {pingCooldown > 0
                    ? `${isTr ? "Dürtme Beklemede" : "Ping Cooldown"} (${Math.floor(pingCooldown / 60)}:${(pingCooldown % 60).toString().padStart(2, "0")})`
                    : isTr
                      ? "Hafif Dürtme Gönder"
                      : "Send Quick Ping"}
                </span>
              </Button>
            </div>
          </div>

          {/* 7 Core Channels Grid with Preferred Priority */}
          {(() => {
            const preferredKey = counterparty.preferredContactChannel?.toLowerCase().trim() || "any";

            const renderBadge = () => (
              <span className="absolute -top-2.5 -right-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold text-[9px] shadow-sm flex items-center gap-0.5 tracking-tight z-10 animate-pulse">
                ⭐ {isTr ? "Tercih Edilen" : "Preferred"}
              </span>
            );

            const channels = [
              {
                key: "whatsapp",
                node: waUrl ? (
                  <a
                    key="whatsapp"
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] ${
                      preferredKey === "whatsapp" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
                    }`}
                  >
                    {preferredKey === "whatsapp" && renderBadge()}
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{isTr ? "Hızlı WhatsApp" : "Quick WhatsApp"}</span>
                    <ExternalLink className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
                  </a>
                ) : (
                  <button
                    key="whatsapp"
                    type="button"
                    onClick={() => {
                      handleCopy(decodeURIComponent(waText), "wa");
                      alert(isTr ? "WhatsApp mesaj taslağı panoya kopyalandı." : "WhatsApp draft copied to clipboard.");
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all ${
                      preferredKey === "whatsapp" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
                    }`}
                  >
                    {preferredKey === "whatsapp" && renderBadge()}
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {copiedField === "wa" ? (isTr ? "Kopyalandı!" : "Copied!") : isTr ? "WhatsApp Taslağı" : "WhatsApp Draft"}
                    </span>
                    <Copy className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
                  </button>
                ),
              },
              {
                key: "meet",
                node: (
                  <a
                    key="meet"
                    href={calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] ${
                      preferredKey === "meet" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
                    }`}
                  >
                    {preferredKey === "meet" && renderBadge()}
                    <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{isTr ? "Google Meet Daveti" : "Google Meet Invite"}</span>
                    <ExternalLink className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
                  </a>
                ),
              },
              {
                key: "zoom",
                node: (
                  <a
                    key="zoom"
                    href={zoomStartUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] ${
                      preferredKey === "zoom" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
                    }`}
                  >
                    {preferredKey === "zoom" && renderBadge()}
                    <Video className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{isTr ? "Zoom Toplantısı" : "Zoom Meeting"}</span>
                    <ExternalLink className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
                  </a>
                ),
              },
              {
                key: "teams",
                node: teamsChatUrl ? (
                  <a
                    key="teams"
                    href={teamsChatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#5059C9] hover:bg-[#434bb5] text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] ${
                      preferredKey === "teams" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
                    }`}
                  >
                    {preferredKey === "teams" && renderBadge()}
                    <TeamsIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">Microsoft Teams</span>
                    <ExternalLink className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
                  </a>
                ) : (
                  <button
                    key="teams"
                    type="button"
                    onClick={() => {
                      handleCopy(decodeURIComponent(teamsMessage), "teams");
                      alert(isTr ? "Teams mesaj taslağı kopyalandı." : "Teams message draft copied.");
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#5059C9]/80 hover:bg-[#5059C9] text-white text-xs font-semibold shadow-sm transition-all ${
                      preferredKey === "teams" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
                    }`}
                  >
                    {preferredKey === "teams" && renderBadge()}
                    <TeamsIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {copiedField === "teams" ? (isTr ? "Kopyalandı!" : "Copied!") : "Teams Sohbet"}
                    </span>
                    <Copy className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
                  </button>
                ),
              },
              {
                key: "slack",
                node: slackAppUrl ? (
                  <a
                    key="slack"
                    href={slackAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#4A154B] hover:bg-[#3d113e] text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] ${
                      preferredKey === "slack" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
                    }`}
                  >
                    {preferredKey === "slack" && renderBadge()}
                    <SlackIcon className="h-4 w-4 shrink-0 text-[#ECB22E]" />
                    <span className="truncate">{isTr ? "Slack ile Bağlan" : "Open in Slack"}</span>
                    <ExternalLink className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
                  </a>
                ) : (
                  <button
                    key="slack"
                    type="button"
                    onClick={() => {
                      handleCopy(slackInviteText, "slack");
                      alert(isTr ? "Slack davet şablonu kopyalandı." : "Slack invite copied.");
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#4A154B]/80 hover:bg-[#4A154B] text-white text-xs font-semibold shadow-sm transition-all ${
                      preferredKey === "slack" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
                    }`}
                  >
                    {preferredKey === "slack" && renderBadge()}
                    <SlackIcon className="h-4 w-4 shrink-0 text-[#ECB22E]" />
                    <span className="truncate">
                      {copiedField === "slack" ? (isTr ? "Kopyalandı!" : "Copied!") : isTr ? "Slack Daveti" : "Slack Invite"}
                    </span>
                    <Copy className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
                  </button>
                ),
              },
              {
                key: "email",
                node: mailUrl ? (
                  <a
                    key="email"
                    href={mailUrl}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] ${
                      preferredKey === "email" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
                    }`}
                  >
                    {preferredKey === "email" && renderBadge()}
                    <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{isTr ? "Kurumsal E-Posta" : "Draft Email"}</span>
                    <ExternalLink className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
                  </a>
                ) : (
                  <button
                    key="email"
                    type="button"
                    disabled
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] text-xs font-medium border border-[var(--color-border-subtle)] opacity-60 cursor-not-allowed ${
                      preferredKey === "email" ? "relative ring-2 ring-amber-400" : ""
                    }`}
                  >
                    {preferredKey === "email" && renderBadge()}
                    <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{isTr ? "E-Posta Belirtilmedi" : "No Email"}</span>
                  </button>
                ),
              },
              {
                key: "phone",
                node: telUrl ? (
                  <a
                    key="phone"
                    href={telUrl}
                    onClick={(e) => {
                      if (counterpartyTime.isNight) {
                        e.preventDefault();
                        setShowNightCallModal(true);
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] ${
                      preferredKey === "phone" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
                    }`}
                  >
                    {preferredKey === "phone" && renderBadge()}
                    <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {isTr ? "Telefonla Ara" : "Call Directly"}
                      {counterpartyTime.isNight ? " 🌙" : ""}
                    </span>
                    <ExternalLink className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
                  </a>
                ) : (
                  <button
                    key="phone"
                    type="button"
                    disabled
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] text-xs font-medium border border-[var(--color-border-subtle)] opacity-60 cursor-not-allowed ${
                      preferredKey === "phone" ? "relative ring-2 ring-amber-400" : ""
                    }`}
                  >
                    {preferredKey === "phone" && renderBadge()}
                    <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{isTr ? "Telefon Belirtilmedi" : "No Phone"}</span>
                  </button>
                ),
              },
            ];

            const sortedChannels = [...channels].sort((a, b) => {
              if (a.key === preferredKey) return -1;
              if (b.key === preferredKey) return 1;
              return 0;
            });

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {sortedChannels.map((c) => c.node)}
              </div>
            );
          })()}

          {/* Quick Copy Action Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--color-border-subtle)]/70 text-xs">
            <span className="text-[var(--color-text-secondary)] font-medium mr-1">
              {isTr ? "Hızlı Şablon Kopyala:" : "Quick Copy Templates:"}
            </span>
            <button
              type="button"
              onClick={() => {
                handleCopy(decodeURIComponent(waText), "wa");
                alert(isTr ? "WhatsApp taslağı kopyalandı." : "WhatsApp draft copied.");
              }}
              className="px-2.5 py-1 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              {copiedField === "wa" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>WhatsApp / DM Mesajı</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleCopy(zoomInviteText, "zoom");
                alert(isTr ? "Zoom davet şablonu kopyalandı." : "Zoom invite copied.");
              }}
              className="px-2.5 py-1 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              {copiedField === "zoom" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>Zoom Davet Şablonu</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleCopy(slackInviteText, "slack");
                alert(isTr ? "Slack davet şablonu kopyalandı." : "Slack invite copied.");
              }}
              className="px-2.5 py-1 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              {copiedField === "slack" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>Slack Davet Metni</span>
            </button>
          </div>
        </div>

        {/* Contact details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Email Channel */}
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
                {isTr ? "Doğrulanmış E-Posta (Temel İletişim)" : "Verified Email"}
              </span>
              <a
                href={`mailto:${counterparty.email}`}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline break-all transition-colors"
              >
                {counterparty.email}
              </a>
            </div>
            {counterparty.email && counterparty.email !== "—" && (
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(counterparty.email, "email")}
                  className="gap-1.5 text-xs h-8 cursor-pointer"
                  aria-label={
                    copiedField === "email"
                      ? isTr
                        ? "E-posta kopyalandı"
                        : "Email copied"
                      : isTr
                        ? "E-postayı kopyala"
                        : "Copy email"
                  }
                >
                  {copiedField === "email" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                      <span className="text-emerald-400 font-medium">
                        {isTr ? "Kopyalandı" : "Copied"}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy
                        className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]"
                        aria-hidden="true"
                      />
                      <span>{isTr ? "E-Postayı Kopyala" : "Copy Email"}</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Phone Channel */}
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
                {isTr ? "Telefon / WhatsApp" : "Phone / Messaging"}
              </span>
              {counterparty.phone ? (
                <a
                  href={`tel:${counterparty.phone}`}
                  className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                >
                  {counterparty.phone}
                </a>
              ) : (
                <span className="text-xs text-[var(--color-text-tertiary)] italic">
                  {isTr
                    ? "Telefon paylaşımı kullanıcı tarafından etkinleştirilmemiş."
                    : "Phone sharing was disabled by user in settings."}
                </span>
              )}
            </div>
            {counterparty.phone && (
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(counterparty.phone!, "phone")}
                  className="gap-1.5 text-xs h-8 cursor-pointer"
                  aria-label={
                    copiedField === "phone"
                      ? isTr
                        ? "Telefon kopyalandı"
                        : "Phone copied"
                      : isTr
                        ? "Telefonu kopyala"
                        : "Copy phone"
                  }
                >
                  {copiedField === "phone" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                      <span className="text-emerald-400 font-medium">
                        {isTr ? "Kopyalandı" : "Copied"}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy
                        className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]"
                        aria-hidden="true"
                      />
                      <span>{isTr ? "Numarayı Kopyala" : "Copy Phone"}</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agreed Offer Proposal Summary */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
          {isTr ? "Kabul Edilen Teklif Detayları" : "Accepted Proposal Details"}
        </h2>

        {(budgetLabel || timelineLabel) && (
          <div className="flex flex-wrap items-center gap-6 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border-subtle)] pb-3">
            {budgetLabel && (
              <div>
                <strong>{isTr ? "Önerilen Bütçe:" : "Budget:"}</strong> {budgetLabel}
              </div>
            )}
            {timelineLabel && (
              <div>
                <strong>{isTr ? "Tahmini Süre:" : "Timeline:"}</strong> {timelineLabel}
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/70 p-5 text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
          {offerMessage}
        </div>
      </div>

      {/* 3-Step Direct Payment & Dispute Safety Card */}
      <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/5 backdrop-blur-xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          <span>
            {isTr
              ? "Operis Komisyonsuz İş Birliği & Güvenlik Protokolü"
              : "Zero-Commission Collaboration & Safety Protocol"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="space-y-1.5 p-3.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
            <span className="text-xs font-bold text-[var(--color-text-primary)] block">
              {isTr ? "1. Doğrudan Banka Havalesi" : "1. Direct Bank Transfer"}
            </span>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "Ödemeleri platform araya girmeden, doğrudan karşı tarafın IBAN adresine açıklama yazarak iletin."
                : "Transfer funds directly via bank wire/IBAN without intermediary platform escrow holds."}
            </p>
          </div>
          <div className="space-y-1.5 p-3.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
            <span className="text-xs font-bold text-[var(--color-text-primary)] block">
              {isTr ? "2. Resmi Sözleşme Taslağı" : "2. Official Contract Draft"}
            </span>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "Haklarınızı güvenceye almak için yukarıdaki 'Sözleşme Taslağı' butonundaki yasal şablonu kullanın."
                : "Protect your IP and deliverables using the legal draft template provided in the header."}
            </p>
          </div>
          <div className="space-y-1.5 p-3.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
            <span className="text-xs font-bold text-[var(--color-text-primary)] block">
              {isTr ? "3. Karşılıklı Tamamlama" : "3. Bilateral Confirmation"}
            </span>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "İş teslim edildiğinde ve ödeme alındığında aşağıdaki butondan karşılıklı tamamlama teyidi verin."
                : "Once work is delivered and payment settled, submit bilateral completion confirmation below."}
            </p>
          </div>
        </div>
      </div>

      {/* Bilateral Mutual Completion Section */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
          {isTr ? "İş Tamamlanma Teyidi" : "Mutual Completion Confirmation"}
        </h2>

        {feedback && (
          <div className="rounded-lg bg-[var(--color-surface-hover)] p-4 text-xs text-[var(--color-text-primary)] font-medium">
            {feedback}
          </div>
        )}

        {currentStatus === "CANCELLED" ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
            {isTr
              ? "İş birliği iptal edildiğinden tamamlama ve uyuşmazlık onayları devre dışı bırakılmıştır."
              : "Completion and dispute confirmation actions are disabled because this engagement has been cancelled."}
          </div>
        ) : completed ? (
          <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-4 text-xs text-[var(--color-text-secondary)]">
            {isTr
              ? "Her iki taraf da işin tamamlandığını onaylamıştır. Bu proje genel profillerinizde başarıyla tamamlanan iş olarak listelenmektedir."
              : "Both parties have confirmed completion. This project is now published under completed work on your public profiles."}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "Proje bittiğinde her iki taraf da onay verdiğinde süreç tamamlanmış sayılır ve profilinize işlenir."
                : "When the work is done, both parties must confirm for the project to be verified on your profile."}
            </p>

            {counterpartyCompletionStatus === "MARKED_COMPLETE" && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 w-fit">
                <Check className="h-3.5 w-3.5" />
                <span>
                  {isTr
                    ? `${counterparty.displayName} tamamlandı onayını verdi. Sizin onayınız bekleniyor.`
                    : `${counterparty.displayName} confirmed completion. Awaiting your confirmation.`}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={myMark === "MARKED_COMPLETE" ? "secondary" : "primary"}
                onClick={handleMarkComplete}
                disabled={isLoading || myMark === "MARKED_COMPLETE"}
                className="gap-2"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>
                  {myMark === "MARKED_COMPLETE"
                    ? isTr
                      ? "Tamamlandı Olarak İşaretlendi"
                      : "Marked Complete"
                    : isTr
                      ? "İşi Tamamlandı Olarak Onayla"
                      : "Confirm Work as Completed"}
                </span>
              </Button>

              <Button
                variant="ghost"
                onClick={handleDispute}
                disabled={isLoading || myMark === "DISPUTES_COMPLETION"}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                {isTr ? "İş Tamamlanmadı (Uyuşmazlık)" : "Work Incomplete (Dispute)"}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setCancelModalOpen(true)}
                disabled={isLoading}
                className="text-xs text-[var(--color-text-tertiary)] hover:text-rose-400 gap-1.5 cursor-pointer ml-auto"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>{isTr ? "İş Birliğini İptal Et" : "Cancel Engagement"}</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bilateral Verified Endorsement Section (Topluluk Tavsiye Notları) */}
      {completed && (
        <div className="rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/5 via-[var(--color-surface-base)] to-transparent backdrop-blur-xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3">
            <div className="flex items-center gap-2 font-bold text-base text-[var(--color-text-primary)]">
              <Award className="h-5 w-5 text-amber-400" aria-hidden="true" />
              <span>
                {isTr ? "Doğrulanmış Topluluk Tavsiye Mektubu" : "Verified Community Endorsement"}
              </span>
            </div>
            <span className="text-xs text-amber-400 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
              {isTr
                ? "Sıfır Yıldız Puanı / %100 Gerçek Yorum"
                : "Zero Star Revenge / 100% Real Vouch"}
            </span>
          </div>

          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Manipülatif yıldız puanlamaları yerine, başarıyla tamamlanan iş birliğinize ilişkin 1 paragraflık doğrulanmış tavsiye mektubu bırakın. Bu mektup iş ortağınızın profilinde kalıcı bir güven kanıtı olarak sergilenir."
              : "Instead of revenge star ratings, leave a verified 1-paragraph testimonial letter for your collaboration. It is displayed permanently on your partner's public profile."}
          </p>

          {endorsementFeedback && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-[var(--color-text-primary)] font-medium">
              {endorsementFeedback}
            </div>
          )}

          {existingMyEndorsement ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  {isTr ? "Tavsiye Notunuz Yayınlandı" : "Your Endorsement is Published"}
                </span>
                <span className="text-[10px] text-[var(--color-text-tertiary)]">
                  {new Date(existingMyEndorsement.createdAt).toLocaleDateString(
                    isTr ? "tr-TR" : "en-US"
                  )}
                </span>
              </div>
              <div className="relative pl-6 text-xs text-[var(--color-text-primary)] leading-relaxed italic border-l-2 border-emerald-500/40 my-2">
                <Quote className="h-3.5 w-3.5 text-emerald-400/50 absolute -left-1.5 -top-1" />"
                {existingMyEndorsement.content}"
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitEndorsement} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                  {isTr
                    ? `${counterparty.displayName} için 1 Paragraflık Tavsiye Notu (20 - 500 Karakter)`
                    : `1-Paragraph Recommendation for ${counterparty.displayName} (20 - 500 Chars)`}
                </label>
                <textarea
                  value={endorsementText}
                  onChange={(e) => setEndorsementText(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder={
                    isTr
                      ? `${counterparty.displayName} ile projemizde çalıştık, API mimarisini taahhüt ettiği tarihten önce sıfır hatayla teslim etti...`
                      : `Worked with ${counterparty.displayName} on our project, delivered the core architecture ahead of schedule with zero defects...`
                  }
                  className="w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-3 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all resize-none"
                />
                <div className="flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)] px-1 mt-1">
                  <span>
                    {isTr
                      ? "Platform kuralları gereği emoji kullanılamaz."
                      : "Emojis are prohibited."}
                  </span>
                  <span className={endorsementText.length > 500 ? "text-red-400 font-bold" : ""}>
                    {endorsementText.length} / 500
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmittingEndorsement || endorsementText.trim().length < 20}
                className="gap-2 bg-amber-600 hover:bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-500/20"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {isSubmittingEndorsement
                    ? isTr
                      ? "Kaydediliyor..."
                      : "Submitting..."
                    : isTr
                      ? "Doğrulanmış Tavsiye Notunu Yayınla"
                      : "Publish Verified Vouch"}
                </span>
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Contract Modal */}
      <ContractDraftModal
        isOpen={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        engagementId={engagementId}
        listingTitle={listingTitle}
        category={category}
        matchedAt={matchedAt}
        offerMessage={offerMessage}
        budgetLabel={budgetLabel}
        timelineLabel={timelineLabel}
        counterparty={counterparty}
        currentUser={currentUser || { displayName: undefined, email: undefined }}
        isOwner={ownerUserId === currentUserId}
        locale={locale}
      />

      {/* Cancel Engagement Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3 shrink-0">
              <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm sm:text-base">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h3>{isTr ? "İş Birliğini İptal Et" : "Cancel Engagement"}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCancelModalOpen(false);
                  setCancelFeedback(null);
                }}
                className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                aria-label={isTr ? "Kapat" : "Close"}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-4 pr-1">
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "Bu işlemi onayladığınızda iş birliği sonlandırılacak ve ilan 'Yayında Değil' statüsüne alınacaktır. İlan sahibi dilediği zaman ilanı panelinden tekrar yayına alabilir."
                  : "Confirming this will terminate the collaboration and move the listing to inactive. The listing owner can reactivate it from their dashboard at any time."}
              </p>

              {cancelFeedback && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300 font-medium">
                  {cancelFeedback}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                  {isTr ? "İptal Gerekçesi (Opsiyonel)" : "Cancellation Reason (Optional)"}
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder={
                    isTr
                      ? "Örn: Zamanlama uyuşmazlığı, karşılıklı mutabakat vb."
                      : "e.g. Timeline mismatch, mutual agreement, etc."
                  }
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-3 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border-subtle)] shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCancelModalOpen(false);
                  setCancelFeedback(null);
                }}
                disabled={isCancelling}
              >
                {isTr ? "Vazgeç" : "Keep Active"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCancelEngagement}
                disabled={isCancelling}
                className="bg-rose-600 hover:bg-rose-500 border-rose-600 text-white font-semibold cursor-pointer"
              >
                {isCancelling
                  ? isTr
                    ? "İptal Ediliyor..."
                    : "Cancelling..."
                  : isTr
                    ? "Evet, İptal Et"
                    : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Ping Modal */}
      {pingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3 shrink-0">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm sm:text-base">
                <Bell className="h-5 w-5 shrink-0" />
                <h3>{isTr ? "Platform İçi Hafif Dürtme Gönder" : "Send In-Platform Quick Ping"}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPingModalOpen(false);
                  setPingFeedback(null);
                }}
                className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                aria-label={isTr ? "Kapat" : "Close"}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-4 pr-1">
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "Eşleştiğiniz tarafa platform içi bildirim zili üzerinden saygılı ve hazır bir hatırlatma iletin. Taciz ve spam'i önlemek için gönderim sonrası 15 dakikalık bekleme süresi (cooldown) uygulanır."
                  : "Send a polite, pre-composed reminder to counterparty's in-app notification bell. A 15-minute anti-spam cooldown applies after each ping."}
              </p>

              {pingFeedback && (
                <div
                  className={`rounded-xl border p-3 text-xs font-medium ${
                    pingFeedback.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                  }`}
                >
                  {pingFeedback.message}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                  {isTr ? "Dürtme Şablonu Seçin" : "Select Ping Template"}
                </label>
                <div className="space-y-2">
                  {[
                    {
                      key: "whatsapp" as const,
                      icon: MessageCircle,
                      title: isTr ? "WhatsApp Mesajı İletildi" : "WhatsApp Message Sent",
                      text: isTr
                        ? "WhatsApp üzerinden mesaj ilettim, müsait olduğunuzda kontrol edebilir misiniz?"
                        : "I sent you a WhatsApp message, could you please check when available?",
                    },
                    {
                      key: "meeting" as const,
                      icon: Video,
                      title: isTr ? "Toplantı Daveti Gönderildi" : "Meeting Invite Sent",
                      text: isTr
                        ? "Google Meet / Zoom toplantı daveti gönderdim, takviminizi bekliyorum."
                        : "I sent a Google Meet / Zoom invite, awaiting your schedule.",
                    },
                    {
                      key: "email" as const,
                      icon: Mail,
                      title: isTr ? "E-Posta Notları Paylaşıldı" : "Email Notes Sent",
                      text: isTr
                        ? "Kurumsal e-posta ile proje başlangıç notlarını paylaştım."
                        : "I shared the project kickoff notes via corporate email.",
                    },
                    {
                      key: "ready" as const,
                      icon: ShieldCheck,
                      title: isTr ? "Görüşmeye Hazırım" : "Ready to Connect",
                      text: isTr
                        ? "Proje başlangıcı ve sonraki adımlar için görüşmeye hazırım."
                        : "I am ready to connect for project kickoff and next steps.",
                    },
                  ].map((tpl) => {
                    const isSelected = pingTemplate === tpl.key;
                    const Icon = tpl.icon;
                    return (
                      <button
                        key={tpl.key}
                        type="button"
                        onClick={() => setPingTemplate(tpl.key)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/10 text-[var(--color-text-primary)] shadow-sm shadow-amber-500/10"
                            : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-semibold text-xs text-[var(--color-text-primary)] mb-1">
                          <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-amber-400" : "text-[var(--color-text-tertiary)]"}`} />
                          <span>{tpl.title}</span>
                          {isSelected && (
                            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                              {isTr ? "Seçildi" : "Selected"}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed italic">
                          &ldquo;{tpl.text}&rdquo;
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border-subtle)] shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPingModalOpen(false);
                  setPingFeedback(null);
                }}
                disabled={isPinging}
              >
                {isTr ? "Vazgeç" : "Cancel"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendPing}
                disabled={isPinging}
                className="bg-amber-600 hover:bg-amber-500 border-amber-600 text-white font-semibold cursor-pointer shadow-md shadow-amber-600/20"
              >
                {isPinging
                  ? isTr
                    ? "İletiliyor..."
                    : "Sending..."
                  : isTr
                    ? "Dürtme Bildirimini Gönder"
                    : "Send Ping Notification"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Late Night Call Courtesy Notice Modal */}
      {showNightCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden rounded-2xl border border-purple-500/30 bg-[var(--color-surface-base)] p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3 shrink-0">
              <div className="flex items-center gap-2.5 text-purple-400 font-bold text-sm sm:text-base">
                <Moon className="h-5 w-5 shrink-0" />
                <h3>{isTr ? "Gece Araması Nezaket Uyarısı" : "Night Call Courtesy Notice"}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNightCallModal(false)}
                className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                aria-label={isTr ? "Kapat" : "Close"}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="py-3 space-y-3">
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {isTr ? (
                  <>
                    Karşı tarafın yerel saati şu an <strong className="text-purple-300 font-mono">{counterpartyTime.timeStr}</strong> ({counterpartyTime.tz}) ve gece/dinlenme saatlerindedir.
                    <br /><br />
                    Doğrudan telefon araması yerine <strong className="text-white">WhatsApp</strong> veya <strong className="text-white">Kurumsal E-Posta</strong> ile mesaj bırakmanız tavsiye edilir.
                  </>
                ) : (
                  <>
                    Counterparty&apos;s local time is currently <strong className="text-purple-300 font-mono">{counterpartyTime.timeStr}</strong> ({counterpartyTime.tz}) (Night / Resting hours).
                    <br /><br />
                    We recommend leaving a message via <strong className="text-white">WhatsApp</strong> or <strong className="text-white">Email</strong> instead of placing an urgent phone call.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border-subtle)] shrink-0">
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowNightCallModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                >
                  {isTr ? "WhatsApp Aç" : "Open WhatsApp"}
                </a>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNightCallModal(false);
                  if (telUrl) {
                    window.location.href = telUrl;
                  }
                }}
                className="text-xs border-purple-500/40 text-purple-300 hover:bg-purple-500/10 cursor-pointer"
              >
                {isTr ? "Yine de Ara" : "Call Anyway"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
