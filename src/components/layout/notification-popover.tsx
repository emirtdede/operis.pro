"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Inbox,
  Send,
  Handshake,
  CheckCheck,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Radar,
  Award,
  FileCheck2,
} from "lucide-react";
import { getLocalizedRoute, getAlternateLocalePath } from "@/src/lib/i18n/routes";
import { Locale } from "@/src/lib/i18n/config";
import { useRealtimeNotifications } from "@/src/hooks/use-realtime-notifications";
import { LiveNotificationToast } from "./live-notification-toast";

export interface NotificationItem {
  id: string;
  type: string;
  payloadJson: {
    title?: string;
    message?: string;
    actionUrl?: string;
    [key: string]: unknown;
  };
  readAt: string | Date | null;
  createdAt: string | Date;
}

interface NotificationPopoverProps {
  locale: Locale;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function formatRelativeTime(dateStr: string | Date, isTr: boolean): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return isTr ? "Az önce" : "Just now";
  if (diffMin < 60) return isTr ? `${diffMin} dk önce` : `${diffMin}m ago`;
  if (diffHours < 24) return isTr ? `${diffHours} sa önce` : `${diffHours}h ago`;
  if (diffDays === 1) return isTr ? "Dün" : "Yesterday";
  if (diffDays < 7) return isTr ? `${diffDays} gün önce` : `${diffDays}d ago`;

  return date.toLocaleDateString(isTr ? "tr-TR" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "CONTRACT_PACKAGE_SIGNED":
    case "CONTRACT_PACKAGE_FULLY_EXECUTED":
      return <FileCheck2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />;
    case "OFFER_RECEIVED":
    case "OFFER_UPDATED":
    case "OFFER_COUNTERED":
      return <Inbox className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />;
    case "OFFER_ACCEPTED":
    case "MATCHED":
      return <Handshake className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />;
    case "OFFER_REJECTED":
    case "OFFER_WITHDRAWN":
      return <Send className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />;
    case "SECURITY_EVENT":
      return <ShieldAlert className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />;
    case "LISTING_EXPIRING_SOON":
      return <Clock className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />;
    case "MODERATION_ACTION":
      return <Sparkles className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />;
    case "RADAR_MATCH":
    case "CATEGORY_FOLLOW_MATCH":
      return <Radar className="h-3.5 w-3.5 text-cyan-400 animate-pulse" aria-hidden="true" />;
    case "ENDORSEMENT_RECEIVED":
    case "REVIEWS_REVEALED":
    case "REVIEW_PENDING_COUNTERPARTY":
      return <Award className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />;
    default:
      return <Bell className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />;
  }
}

export function NotificationPopover({
  locale,
  isOpen,
  onToggle,
  onClose,
}: NotificationPopoverProps) {
  const isTr = locale === "tr";
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isRinging,
    liveToast,
    dismissToast,
    markAllRead,
    markAsRead,
    fetchNotifications,
  } = useRealtimeNotifications({ locale });

  const [displayedCount, setDisplayedCount] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // When dropdown opens, reset displayed count to 5 and sync最新
  useEffect(() => {
    if (isOpen) {
      setDisplayedCount(5);
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Infinite scroll handler inside notification list
  const handleScroll = () => {
    const el = listRef.current;
    if (!el || isLoadingMore) return;

    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    if (nearBottom && displayedCount < notifications.length) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setDisplayedCount((prev) => Math.min(prev + 5, notifications.length));
        setIsLoadingMore(false);
      }, 250);
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.readAt) {
      markAsRead(item.id);
    }
    if (liveToast?.id === item.id) {
      dismissToast();
    }

    onClose();
    if (item.payloadJson?.actionUrl) {
      const targetUrl = isTr
        ? item.payloadJson.actionUrl
        : getAlternateLocalePath(item.payloadJson.actionUrl, "en");
      router.push(targetUrl);
    }
  };

  const visibleNotifications = notifications.slice(0, displayedCount);
  const hasMore = displayedCount < notifications.length;

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={onToggle}
        className={`relative px-2.5 py-1 rounded-xl transition-all cursor-pointer focus:outline-none flex flex-col items-center justify-center gap-0.5 ${
          isOpen
            ? "text-[var(--color-text-primary)] bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] shadow-xs"
            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border border-transparent hover:border-[var(--color-border-subtle)]"
        }`}
        title={isTr ? "Bildirimler" : "Notifications"}
        aria-label={isTr ? "Bildirim Menüsü" : "Notifications Menu"}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="relative flex items-center justify-center">
          <Bell
            className={`h-4 w-4 transition-transform ${isRinging ? "animate-bell-ring text-blue-400" : ""}`}
            aria-hidden="true"
          />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-2.5 w-2.5"
              aria-label={isTr ? `${unreadCount} okunmamış bildirim` : `${unreadCount} unread`}
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 animate-badge-glow ring-2 ring-[var(--color-surface-base)]" />
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium leading-tight whitespace-nowrap select-none">
          {isTr ? "Bildirim" : "Alerts"}
        </span>
      </button>

      {/* Notification Dropdown Popover */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-[var(--color-border-subtle)] shadow-2xl backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 duration-150 z-50 overflow-hidden text-xs"
          style={{
            backgroundColor: "var(--color-surface-base)",
            borderColor: "var(--color-border-subtle)",
            boxShadow:
              "0 20px 40px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--color-border-subtle)",
          }}
          role="region"
          aria-label={isTr ? "Bildirim Listesi" : "Notifications List"}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--color-border-subtle)]"
            style={{ backgroundColor: "var(--color-surface-hover)" }}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[var(--color-text-primary)]">
                {isTr ? "Bildirimler" : "Notifications"}
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold text-[10px]">
                  {unreadCount} {isTr ? "Yeni" : "New"}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="h-3 w-3 text-blue-400" aria-hidden="true" />
                <span>{isTr ? "Tümünü Oku" : "Mark Read"}</span>
              </button>
            )}
          </div>

          {/* Scrollable Notification List (Initial 5, load more on scroll) */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="max-h-[340px] overflow-y-auto divide-y divide-[var(--color-border-subtle)] overscroll-contain"
            tabIndex={0}
            role="feed"
            aria-busy={isLoadingMore}
          >
            {visibleNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-2">
                <div className="mx-auto h-9 w-9 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-text-tertiary)]">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </div>
                <p className="font-medium text-[var(--color-text-secondary)]">
                  {isTr ? "Yeni bildiriminiz yok" : "No new notifications"}
                </p>
                <p className="text-[11px] text-[var(--color-text-tertiary)] max-w-xs mx-auto">
                  {isTr
                    ? "Teklifleriniz veya projelerinizle ilgili tüm güncellemeler anlık olarak burada listelenir."
                    : "All project and proposal updates will appear right here in real time."}
                </p>
              </div>
            ) : (
              visibleNotifications.map((item) => {
                const isUnread = !item.readAt;
                const title =
                  item.payloadJson?.title || (isTr ? "Operis Bildirimi" : "Operis Alert");
                const message = item.payloadJson?.message || "";
                const timeAgo = formatRelativeTime(item.createdAt, isTr);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3 transition-colors cursor-pointer flex items-start gap-3 select-none ${
                      isUnread
                        ? "bg-blue-500/[0.06] hover:bg-blue-500/[0.10]"
                        : "hover:bg-[var(--color-surface-hover)] opacity-85 hover:opacity-100"
                    }`}
                    role="article"
                  >
                    {/* Notification Type Icon */}
                    <div className="h-7 w-7 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                      {getNotificationIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-semibold text-xs text-[var(--color-text-primary)] truncate">
                            {title}
                          </span>
                          {isUnread && (
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0"
                              aria-label={isTr ? "Okunmamış" : "Unread"}
                            />
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--color-text-tertiary)] shrink-0">
                          {timeAgo}
                        </span>
                      </div>

                      {message && (
                        <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                          {message}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Loading Indicator when scrolling */}
            {isLoadingMore && (
              <div className="py-2.5 text-center text-[11px] text-[var(--color-text-tertiary)] flex items-center justify-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <span>{isTr ? "Daha fazla yükleniyor..." : "Loading more..."}</span>
              </div>
            )}

            {/* All Loaded Indicator */}
            {!hasMore && notifications.length > 5 && (
              <div className="py-2 text-center text-[10px] text-[var(--color-text-tertiary)] opacity-70">
                {isTr ? "Tüm bildirimler yüklendi" : "All notifications loaded"}
              </div>
            )}
          </div>

          {/* Sticky Pinned Footer: "Tüm Bildirimleri Göster" */}
          <div
            className="border-t border-[var(--color-border-subtle)] p-2"
            style={{ backgroundColor: "var(--color-surface-hover)" }}
          >
            <Link
              href={getLocalizedRoute("dashboardNotifications", locale)}
              onClick={onClose}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors cursor-pointer"
            >
              <span>{isTr ? "Tüm Bildirimleri Göster" : "View All Notifications"}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      {/* Floating Real-time Toast Notification Preview */}
      <LiveNotificationToast
        notification={liveToast}
        locale={locale}
        onDismiss={dismissToast}
        onSelect={handleNotificationClick}
      />
    </div>
  );
}
