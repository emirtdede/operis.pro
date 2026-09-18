"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Inbox, Send, Handshake, CheckCheck, Mail } from "lucide-react";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { getAlternateLocalePath } from "@/src/lib/i18n/routes";

export interface NotificationItem {
  id: string;
  type: string;
  payloadJson: Record<string, unknown>;
  readAt: string | Date | null;
  createdAt: string | Date;
}

export interface NotificationsViewProps {
  initialNotifications: NotificationItem[];
  locale: string;
}

export function NotificationsView({ initialNotifications, locale }: NotificationsViewProps) {
  const isTr = locale === "tr";
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.readAt;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({ action: "markAllRead", locale }),
      });
      if (res.ok) {
        const now = new Date();
        setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || now })));
      }
    } catch {
      // ignore
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleNotificationClick = async (id: string, isUnread: boolean) => {
    if (!isUnread) return;
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({ notificationId: id, locale }),
      });
      if (res.ok) {
        const now = new Date().toISOString();
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt || now } : n))
        );
      }
    } catch {
      // ignore
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({ notificationId: id, locale }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
        );
      }
    } catch {
      // Fallback
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "OFFER_RECEIVED":
      case "OFFER_UPDATED":
        return <Inbox className="h-4 w-4 text-purple-400" />;
      case "OFFER_ACCEPTED":
      case "MATCHED":
        return <Handshake className="h-4 w-4 text-emerald-400" />;
      case "OFFER_REJECTED":
        return <Send className="h-4 w-4 text-amber-400" />;
      case "COMMUNICATION_PING":
        return <Bell className="h-4 w-4 text-sky-400" />;
      default:
        return <Bell className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] font-semibold shadow-sm"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {isTr ? "Tümü" : "All"} ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === "unread"
                ? "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] font-semibold shadow-sm"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {isTr ? "Okunmamış" : "Unread"} ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            isLoading={isMarkingAll}
            className="gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isTr ? "Tümünü Okundu İşaretle" : "Mark All as Read"}</span>
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-8 sm:p-12 text-center shadow-sm">
          <EmptyState
            title={isTr ? "Henüz Bir Bildiriminiz Yok" : "No Notifications Yet"}
            description={
              isTr
                ? "İlanlarınıza teklif geldiğinde, teklifleriniz sonuçlandığında veya takip ettiğiniz kategorilerde yeni ilanlar yayınlandığında burada listelenir."
                : "When you receive offers or matching updates, they will be listed here."
            }
            action={
              <Link href={isTr ? "/tr/ilanlar" : "/en/listings"}>
                <Button variant="secondary" size="md">
                  {isTr ? "İlanları Keşfet" : "Explore Listings"}
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isUnread = !item.readAt;
            const dateStr = new Date(item.createdAt).toLocaleString(isTr ? "tr-TR" : "en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            });

            const title = String(
              item.payloadJson?.title ||
                (item.type === "COMMUNICATION_PING"
                  ? isTr
                    ? `💬 İletişim Dürtmesi: ${item.payloadJson?.listingTitle || "Proje Çalışma Alanı"}`
                    : `💬 Project Ping: ${item.payloadJson?.listingTitle || "Workspace"}`
                  : isTr
                    ? "Operis Bildirimi"
                    : "Operis Alert")
            );
            const message = item.payloadJson?.message
              ? String(item.payloadJson.message)
              : item.payloadJson?.messageText
                ? String(item.payloadJson.messageText)
                : "";
            const rawActionUrl = item.payloadJson?.actionUrl
              ? String(item.payloadJson.actionUrl)
              : item.payloadJson?.workspacePath
                ? String(item.payloadJson.workspacePath)
                : null;
            const actionUrl = rawActionUrl
              ? isTr
                ? rawActionUrl
                : getAlternateLocalePath(rawActionUrl, "en")
              : null;

            return (
              <div
                key={item.id}
                onClick={() => isUnread && handleMarkSingleRead(item.id)}
                className={`rounded-2xl border p-4 sm:p-5 transition-all duration-300 flex items-start gap-4 ${
                  isUnread
                    ? "border-blue-500/30 bg-blue-500/[0.04] shadow-sm"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 opacity-80 hover:opacity-100"
                }`}
              >
                <div className="h-9 w-9 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-xs sm:text-sm text-[var(--color-text-primary)]">
                        {title}
                      </h3>
                      {isUnread && (
                        <span
                          className="h-2 w-2 rounded-full bg-blue-500 shrink-0"
                          aria-label="Yeni"
                        />
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--color-text-tertiary)] shrink-0">
                      {dateStr}
                    </span>
                  </div>

                  {message && (
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {message}
                    </p>
                  )}

                  {actionUrl && (
                    <div className="pt-2">
                      <Link
                        href={actionUrl}
                        onClick={() => handleNotificationClick(item.id, isUnread)}
                      >
                        <Button variant="secondary" size="sm" className="text-xs h-7 px-3">
                          {isTr ? "Detayları Görüntüle →" : "View Details →"}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-[var(--color-text-secondary)]">
          <Mail className="h-4 w-4 text-blue-400 shrink-0" aria-hidden="true" />
          <span>
            {isTr
              ? "E-posta bildirimleri ve bülten tercihlerinizi dilediğiniz zaman hesap ayarlarından değiştirebilirsiniz."
              : "You can manage your email notifications and newsletter preferences anytime from account settings."}
          </span>
        </div>
        <Link
          href={isTr ? "/tr/panel/ayarlar" : "/en/dashboard/settings"}
          className="font-medium text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
        >
          {isTr ? "Ayarlara Git →" : "Go to Settings →"}
        </Link>
      </div>
    </div>
  );
}
