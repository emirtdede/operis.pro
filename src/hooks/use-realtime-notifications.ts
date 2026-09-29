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
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const lastEventIdRef = useRef<string | null>(null);
  const snapshotWatermarkRef = useRef<bigint | null>(null);
  const incomingItemsRef = useRef(new Map<string, NotificationItem>());
  const fetchGenerationRef = useRef(0);

  const triggerRing = useCallback(() => {
    setIsRinging(true);
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    ringTimeoutRef.current = setTimeout(() => {
      setIsRinging(false);
    }, 1200);
  }, []);

  const fetchNotifications = useCallback(async () => {
    const generation = ++fetchGenerationRef.current;
    try {
      const res = await fetch(`/api/notifications?limit=50&locale=${locale}`, {
        headers: { "x-locale": locale },
      });
      if (res.ok) {
        const data = await res.json();
        if (generation !== fetchGenerationRef.current) return;
        const items: NotificationItem[] = data.notifications || [];
        items.forEach((it) => {
          if (it?.id) seenNotificationIdsRef.current.add(it.id);
        });
        if (!lastEventIdRef.current && typeof data.streamCursor === "string") {
          lastEventIdRef.current = data.streamCursor;
        }
        const sequence =
          typeof data.streamCursor === "string" ? data.streamCursor.split(".").at(-1) : undefined;
        const watermark = sequence && /^\d+$/.test(sequence) ? BigInt(sequence) : null;
        snapshotWatermarkRef.current = watermark;
        const newer: NotificationItem[] = [];
        for (const [id, item] of incomingItemsRef.current) {
          if (
            watermark !== null &&
            item.streamSequence &&
            /^\d+$/.test(item.streamSequence) &&
            BigInt(item.streamSequence) > watermark
          ) {
            newer.push(item);
          } else {
            incomingItemsRef.current.delete(id);
          }
        }
        setNotifications([
          ...newer.filter((n) => !items.some((item) => item.id === n.id)),
          ...items,
        ]);
        setUnreadCount(
          (data.unreadCount ?? items.filter((n) => !n.readAt).length) +
            newer.filter((n) => !n.readAt).length
        );
      }
    } catch {
      // Handled gracefully
    }
  }, [locale]);

  // Handle incoming new notification
  const handleIncomingNotification = useCallback(
    (item: NotificationItem, fromBroadcast = false) => {
      if (!item || !item.id) return;
      const cached = incomingItemsRef.current.get(item.id);
      if (cached?.readAt && !item.readAt) item = { ...item, readAt: cached.readAt };
      incomingItemsRef.current.set(item.id, item);

      const isAlreadySeen = seenNotificationIdsRef.current.has(item.id);
      seenNotificationIdsRef.current.add(item.id);
      // The snapshot count covers every row up to its watermark, including rows
      // outside its latest-50 page that may subsequently arrive during replay.
      const isIncludedInSnapshot =
        snapshotWatermarkRef.current !== null &&
        typeof item.streamSequence === "string" &&
        /^\d+$/.test(item.streamSequence) &&
        BigInt(item.streamSequence) <= snapshotWatermarkRef.current;

      setNotifications((prev) => {
        if (prev.some((n) => n.id === item.id)) return prev;
        return [item, ...prev];
      });

      // Deduplicate: Only increment unread count, ring, and show toast if not previously seen and unread
      if (!isAlreadySeen && !isIncludedInSnapshot && !item.readAt) {
        setUnreadCount((prev) => prev + 1);
        triggerRing();
        setLiveToast(item);
      }

      // Broadcast to other open browser tabs
      if (!fromBroadcast && !isAlreadySeen && broadcastChannelRef.current) {
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

  const applyReadLocally = useCallback((notificationId?: string) => {
    // A request started before this read change must not restore its older count
    // or unread rows. Later snapshots can still merge newer cached notifications.
    fetchGenerationRef.current += 1;
    const nowIso = new Date().toISOString();
    for (const [id, item] of incomingItemsRef.current) {
      if (!notificationId || notificationId === id) {
        incomingItemsRef.current.set(id, { ...item, readAt: item.readAt ?? nowIso });
      }
    }
    setNotifications((prev) =>
      prev.map((item) =>
        !notificationId || notificationId === item.id
          ? { ...item, readAt: item.readAt ?? nowIso }
          : item
      )
    );
    setUnreadCount((prev) => (notificationId ? Math.max(prev - 1, 0) : 0));
  }, []);

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
        applyReadLocally(msg.notificationId);
      } else if (msg.type === "MARK_ALL_READ") {
        applyReadLocally();
      }
    };

    return () => {
      channel.close();
      broadcastChannelRef.current = null;
    };
  }, [handleIncomingNotification, applyReadLocally]);

  // Connect to SSE Stream
  const connectSSE = useCallback(() => {
    if (!enabled || typeof window === "undefined" || !("EventSource" in window)) return;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const streamUrl = lastEventIdRef.current
        ? `/api/notifications/stream?lastEventId=${encodeURIComponent(lastEventIdRef.current)}`
        : "/api/notifications/stream";
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      const reconnect = () => {
        if (eventSourceRef.current !== es) return;
        // Native EventSource remembers even rejected frames. Always replace it
        // so reconnection uses only the last cursor accepted by this hook.
        es.close();
        eventSourceRef.current = null;
        const backoff = Math.min(2000 * Math.pow(1.5, retryCountRef.current), 30000);
        retryCountRef.current += 1;

        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          if (document.visibilityState === "visible") connectSSE();
        }, backoff);
      };

      es.onopen = () => {
        retryCountRef.current = 0;
      };

      es.addEventListener("notification", (event: MessageEvent) => {
        if (eventSourceRef.current !== es) return;
        try {
          const item: NotificationItem = JSON.parse(event.data);
          if (!item || typeof item.id !== "string" || !item.id) {
            reconnect();
            return;
          }
          handleIncomingNotification(item);
          if (event.lastEventId) lastEventIdRef.current = event.lastEventId;
        } catch {
          reconnect();
        }
      });

      es.onerror = reconnect;
    } catch {
      // Fallback
    }
  }, [enabled, handleIncomingNotification]);

  // Initial fetch and SSE lifecycle
  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    void fetchNotifications().then(() => {
      if (!disposed) connectSSE();
    });

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
      disposed = true;
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
    applyReadLocally();

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
  }, [locale, applyReadLocally]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      applyReadLocally(notificationId);

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
    [locale, applyReadLocally]
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
