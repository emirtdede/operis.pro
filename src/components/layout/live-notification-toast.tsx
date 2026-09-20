"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Bell,
  Inbox,
  Send,
  Handshake,
  ShieldAlert,
  Clock,
  Sparkles,
  Radar,
  Award,
  ArrowRight,
  FileCheck2,
} from "lucide-react";
import { Locale } from "@/src/lib/i18n/config";
import { NotificationItem } from "./notification-popover";
import { ConfettiCanvas } from "../ui/confetti-canvas";

interface LiveNotificationToastProps {
  notification: NotificationItem | null;
  locale: Locale;
  onDismiss: () => void;
  onSelect: (item: NotificationItem) => void;
}

function getToastIcon(type: string) {
  switch (type) {
    case "CONTRACT_PACKAGE_SIGNED":
    case "CONTRACT_PACKAGE_FULLY_EXECUTED":
      return <FileCheck2 className="h-4 w-4 text-emerald-400 animate-pulse" aria-hidden="true" />;
    case "OFFER_RECEIVED":
    case "OFFER_UPDATED":
    case "OFFER_COUNTERED":
      return <Inbox className="h-4 w-4 text-purple-400" aria-hidden="true" />;
    case "OFFER_ACCEPTED":
    case "MATCHED":
      return <Handshake className="h-4 w-4 text-emerald-400" aria-hidden="true" />;
    case "OFFER_REJECTED":
    case "OFFER_WITHDRAWN":
      return <Send className="h-4 w-4 text-amber-400" aria-hidden="true" />;
    case "SECURITY_EVENT":
      return <ShieldAlert className="h-4 w-4 text-rose-400" aria-hidden="true" />;
    case "LISTING_EXPIRING_SOON":
      return <Clock className="h-4 w-4 text-amber-400" aria-hidden="true" />;
    case "MODERATION_ACTION":
      return <Sparkles className="h-4 w-4 text-cyan-400" aria-hidden="true" />;
    case "RADAR_MATCH":
    case "CATEGORY_FOLLOW_MATCH":
      return <Radar className="h-4 w-4 text-cyan-400 animate-pulse" aria-hidden="true" />;
    case "ENDORSEMENT_RECEIVED":
    case "REVIEWS_REVEALED":
    case "REVIEW_PENDING_COUNTERPARTY":
      return <Award className="h-4 w-4 text-amber-400" aria-hidden="true" />;
    default:
      return <Bell className="h-4 w-4 text-blue-400" aria-hidden="true" />;
  }
}

export function LiveNotificationToast({
  notification,
  locale,
  onDismiss,
  onSelect,
}: LiveNotificationToastProps) {
  const isTr = locale === "tr";
  const [progress, setProgress] = useState(100);
  const [mounted, setMounted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const isContractEvent =
    notification?.type === "CONTRACT_PACKAGE_SIGNED" ||
    notification?.type === "CONTRACT_PACKAGE_FULLY_EXECUTED";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isContractEvent) {
      setShowConfetti(true);
    }
  }, [isContractEvent, notification?.id]);

  useEffect(() => {
    if (!notification) return;

    setProgress(100);
    const duration = 6000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [notification, onDismiss]);

  if (!notification || !mounted) return null;

  const payload = notification.payloadJson || {};
  const title = payload.title || (isTr ? "Yeni Bildirim" : "New Notification");
  const message =
    payload.message || (isTr ? "Yeni bir güncelleme aldınız." : "You have received an update.");

  return createPortal(
    <>
      {showConfetti && <ConfettiCanvas onComplete={() => setShowConfetti(false)} />}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-5 right-5 z-[9999] max-w-sm w-[calc(100vw-2.5rem)] rounded-2xl border shadow-2xl backdrop-blur-2xl p-3.5 animate-in slide-in-from-bottom-5 fade-in duration-300 transition-all overflow-hidden ${
          isContractEvent
            ? "border-emerald-500/50 ring-1 ring-emerald-500/30"
            : "border-blue-500/30"
        }`}
        style={{
          backgroundColor: isContractEvent
            ? "color-mix(in srgb, var(--color-surface-base) 90%, #064e3b 10%)"
            : "color-mix(in srgb, var(--color-surface-base) 92%, #1e293b 8%)",
          boxShadow: isContractEvent
            ? "0 20px 40px -15px rgba(16, 185, 129, 0.3), 0 0 0 1px rgba(16, 185, 129, 0.35)"
            : "0 20px 40px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.25)",
        }}
      >
        {/* Top progress bar */}
        <div
          className={`absolute top-0 left-0 h-0.5 transition-all duration-75 ease-linear ${
            isContractEvent
              ? "bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400"
              : "bg-gradient-to-r from-blue-500 to-indigo-500"
          }`}
          style={{ width: `${progress}%` }}
        />

        <div className="flex items-start gap-3">
          <div className="shrink-0 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 mt-0.5">
            {getToastIcon(notification.type)}
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                {title}
              </h4>
              <span className="text-[10px] text-blue-400 font-mono shrink-0 font-medium">
                {isTr ? "CANLI" : "LIVE"}
              </span>
            </div>

            <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 line-clamp-2 leading-relaxed">
              {message}
            </p>

            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelect(notification)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors shadow-xs cursor-pointer"
              >
                <span>{isTr ? "İncele" : "Review"}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="px-2 py-1 rounded-lg text-[11px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
              >
                {isTr ? "Kapat" : "Dismiss"}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer -mt-1 -mr-1"
            aria-label={isTr ? "Kapat" : "Close"}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
