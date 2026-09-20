"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Locale } from "@/src/lib/i18n/config";
import { NotificationItem } from "@/src/components/layout/notification-popover";

interface RealtimeNotificationsOptions {
  locale: Locale;
  enabled?: boolean;
}

interface BroadcastMsg {
  type: "NEW_NOTIFICATION" | "MARK_READ" | "MARK_ALL_READ";
  notification?: NotificationItem;
  notificationId?: string;
}

export function useRealtimeNotifications({ locale, enabled = true }: RealtimeNotificationsOptions) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRinging, setIsRinging] = useState(false);
  const [liveToast, setLiveToast] = useState<NotificationItem | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const triggerRing = useCallback(() => {
    setIsRinging(true);
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    ringTimeoutRef.current = setTimeout(() => {
      setIsRinging(false);
    }, 1200);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?limit=50&locale=${locale}`, {
        headers: { "x-locale": locale },
      });
      if (res.ok) {
        const data = await res.json();
        const items: NotificationItem[] = data.notifications || [];
        setNotifications(items);
        setUnreadCount(data.unreadCount ?? items.filter((n) => !n.readAt).length);
      }
    } catch {
      // Handled gracefully
    }
  }, [locale]);

  // Handle incoming new notification
  const handleIncomingNotification = useCallback(
    (item: NotificationItem, fromBroadcast = false) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === item.id)) return prev;
        return [item, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
      triggerRing();
      setLiveToast(item);

      // Broadcast to other open browser tabs
      if (!fromBroadcast && broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage({
            type: "NEW_NOTIFICATION",
            notification: item,
          } as BroadcastMsg);
        } catch {
          // Channel closed or not supported
        }
      }
    },
    [triggerRing]
  );

  // Cross-tab synchronization via BroadcastChannel
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    const channel = new BroadcastChannel("operis_notifications");
    broadcastChannelRef.current = channel;

    channel.onmessage = (event: MessageEvent<BroadcastMsg>) => {
      const msg = event.data;
      if (!msg || !msg.type) return;

      if (msg.type === "NEW_NOTIFICATION" && msg.notification) {
        handleIncomingNotification(msg.notification, true);
      } else if (msg.type === "MARK_READ" && msg.notificationId) {
        const id = msg.notificationId;
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      } else if (msg.type === "MARK_ALL_READ") {
        const nowIso = new Date().toISOString();
        setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? nowIso })));
        setUnreadCount(0);
      }
    };

    return () => {
      channel.close();
      broadcastChannelRef.current = null;
    };
  }, [handleIncomingNotification]);

  // Connect to SSE Stream
  const connectSSE = useCallback(() => {
    if (!enabled || typeof window === "undefined" || !("EventSource" in window)) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const es = new EventSource("/api/notifications/stream");
      eventSourceRef.current = es;

      es.onopen = () => {
        retryCountRef.current = 0;
      };

      es.addEventListener("notification", (event: MessageEvent) => {
        try {
          const item: NotificationItem = JSON.parse(event.data);
          if (item && item.id) {
            handleIncomingNotification(item);
          }
        } catch {
          // Ignore malformed JSON
        }
      });

      es.onerror = () => {
        if (es.readyState === EventSource.CLOSED) {
          es.close();
          eventSourceRef.current = null;

          // Reconnection backoff: 2s, 4s, 8s, up to 30s
          const backoff = Math.min(2000 * Math.pow(1.5, retryCountRef.current), 30000);
          retryCountRef.current += 1;

          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (document.visibilityState === "visible") {
              connectSSE();
            }
          }, backoff);
        }
      };
    } catch {
      // Fallback
    }
  }, [enabled, handleIncomingNotification]);

  // Initial fetch and SSE lifecycle
  useEffect(() => {
    if (!enabled) return;

    fetchNotifications();
    connectSSE();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
        if (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED) {
          connectSSE();
        }
      }
    };

    // Fallback polling interval (45s) for extra resilience
    const fallbackPoll = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
      }
    }, 45000);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
      }
      clearInterval(fallbackPoll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, fetchNotifications, connectSSE]);

  const markAllRead = useCallback(async () => {
    const nowIso = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? nowIso })));
    setUnreadCount(0);

    // Broadcast
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type: "MARK_ALL_READ" });
      } catch {
        // Ignore
      }
    }

    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({ action: "markAllRead", locale }),
      });
    } catch {
      // Handled gracefully
    }
  }, [locale]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));

      // Broadcast
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage({
            type: "MARK_READ",
            notificationId,
          });
        } catch {
          // Ignore
        }
      }

      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-locale": locale },
          body: JSON.stringify({ notificationId, locale }),
        });
      } catch {
        // Handled gracefully
      }
    },
    [locale]
  );

  const dismissToast = useCallback(() => {
    setLiveToast(null);
  }, []);

  return {
    notifications,
    unreadCount,
    isRinging,
    liveToast,
    dismissToast,
    markAllRead,
    markAsRead,
    fetchNotifications,
  };
}
