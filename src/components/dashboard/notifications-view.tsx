"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Inbox, Send, Handshake, CheckCheck, Mail, Compass, Search, X } from "lucide-react";
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

function getNotificationTitle(item: NotificationItem, isTr: boolean): string {
  if (item.payloadJson?.title) {
    return String(item.payloadJson.title);
  }
  if (item.type === "COMMUNICATION_PING") {
    const listingTitle = item.payloadJson?.listingTitle;
    if (isTr) {
      return `İletişim Dürtmesi: ${listingTitle || "Proje Çalışma Alanı"}`;
    }
    return `Project Ping: ${listingTitle || "Workspace"}`;
  }
  return isTr ? "Operis Bildirimi" : "Operis Alert";
}

export function NotificationsView({ initialNotifications, locale }: NotificationsViewProps) {
  const isTr = locale === "tr";
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const query = searchQuery.trim().toLowerCase();
  const filtered = notifications.filter((n) => {
    if (filter === "unread" && n.readAt) return false;
    if (query) {
      const title = getNotificationTitle(n, isTr).toLowerCase();
      const rawMessage = String(n.payloadJson?.message || n.payloadJson?.messageText || "").toLowerCase();
      const type = n.type.toLowerCase();
      if (!title.includes(query) && !rawMessage.includes(query) && !type.includes(query)) {
        return false;
      }
    }
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
        window.dispatchEvent(
          new CustomEvent("operis:badge-update", {
            detail: { key: "notifications", value: 0 },
          })
        );
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
        window.dispatchEvent(
          new CustomEvent("operis:badge-update", {
            detail: { key: "notifications", delta: -1 },
          })
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
        window.dispatchEvent(
          new CustomEvent("operis:badge-update", {
            detail: { key: "notifications", delta: -1 },
          })
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

  const isUnreadFilter = filter === "unread";
  let emptyTitle: string;
  let emptyDescription: string;

  if (isUnreadFilter) {
    emptyTitle = isTr ? "Okunmamış Bildiriminiz Yok" : "No Unread Notifications";
    emptyDescription = isTr
      ? "Tüm bildirimlerinizi okudunuz. Önceki bildirimlerinizi görmek için 'Tümü' sekmesine geçebilirsiniz."
      : "You're all caught up! Switch to 'All' to review previous updates.";
  } else {
    emptyTitle = isTr ? "Henüz Bir Bildiriminiz Yok" : "No Notifications Yet";
    emptyDescription = isTr
      ? "İlanlarınıza teklif geldiğinde, teklifleriniz sonuçlandığında veya takip ettiğiniz kategorilerde yeni ilanlar yayınlandığında burada listelenir."
      : "When you receive offers or matching updates, they will be listed here.";
  }

  return (
    <div className="space-y-6">
      {/* Action Header: Search Input + Filter Tabs + Mark All Read */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4">
        {/* Full-width Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isTr ? "Bildirimlerde ara..." : "Search notifications..."}
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all truncate"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              aria-label={isTr ? "Aramayı Temizle" : "Clear Search"}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Right side controls: Tabs & Mark All Read */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
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
              className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
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
              className="gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isTr ? "Tümünü Okundu İşaretle" : "Mark All as Read"}</span>
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        query ? (
          <EmptyState
            variant="card"
            icon={<Search className="h-7 w-7 text-blue-400" />}
            title={isTr ? "Aramanızla Eşleşen Bildirim Bulunamadı" : "No Matching Notifications Found"}
            description={
              isTr
                ? `"${searchQuery}" aramasıyla eşleşen herhangi bir bildirim bulunamadı.`
                : `No notifications matched your search "${searchQuery}".`
            }
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="cursor-pointer"
              >
                {isTr ? "Aramayı Temizle" : "Clear Search"}
              </Button>
            }
          />
        ) : (
          <EmptyState
            variant="card"
            icon={<Bell className="h-7 w-7 text-blue-400" />}
            title={emptyTitle}
            description={emptyDescription}
            action={
              filter === "unread" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setFilter("all")}
                  className="cursor-pointer"
                >
                  {isTr ? "Tüm Bildirimleri Göster" : "View All Notifications"}
                </Button>
              ) : (
                <Link href={isTr ? "/tr/ilanlar" : "/en/listings"}>
                  <Button variant="shimmer" size="md" className="gap-2 shadow-lg shadow-blue-500/15">
                    <Compass className="h-4 w-4" />
                    <span>{isTr ? "İlanları Keşfet" : "Explore Listings"}</span>
                  </Button>
                </Link>
              )
            }
          />
        )
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isUnread = !item.readAt;
            const dateStr = new Date(item.createdAt).toLocaleString(isTr ? "tr-TR" : "en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            });

            const title = getNotificationTitle(item, isTr);
            const rawMessage = item.payloadJson?.message || item.payloadJson?.messageText || "";
            const message = String(rawMessage);
            const rawUrl = item.payloadJson?.actionUrl || item.payloadJson?.workspacePath;
            const rawActionUrl = rawUrl ? String(rawUrl) : null;
            let actionUrl: string | null = null;
            if (rawActionUrl) {
              actionUrl = isTr ? rawActionUrl : getAlternateLocalePath(rawActionUrl, "en");
            }

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
