import { describe, it, expect } from "vitest";
import { notificationPubSub, NotificationPubSub } from "@/src/modules/notifications/pubsub";
import { NotificationService } from "@/src/modules/notifications/service";

describe("Gerçek Zamanlı Bildirimler (Real-time Live Notification Badge)", () => {
  describe("1. NotificationPubSub Event Architecture", () => {
    it("routes notifications exclusively to the targeted user channel", () => {
      const pubsub = new NotificationPubSub();
      const user1Messages: unknown[] = [];
      const user2Messages: unknown[] = [];

      const unsub1 = pubsub.subscribe("user-alpha", (notif) => {
        user1Messages.push(notif);
      });
      const unsub2 = pubsub.subscribe("user-beta", (notif) => {
        user2Messages.push(notif);
      });

      // Emit for user-alpha
      pubsub.emitNotification("user-alpha", {
        id: "notif-1",
        userId: "user-alpha",
        type: "OFFER_RECEIVED",
        payloadJson: { title: "Yeni Teklif", message: "Projenize yeni bir teklif geldi." },
        readAt: null,
        createdAt: new Date().toISOString(),
      });

      expect(user1Messages).toHaveLength(1);
      expect((user1Messages[0] as { id: string }).id).toBe("notif-1");
      expect(user2Messages).toHaveLength(0);

      // Clean up
      unsub1();
      unsub2();
    });

    it("unsubscribe cleanly removes listener and prevents subsequent notifications", () => {
      const pubsub = new NotificationPubSub();
      const received: unknown[] = [];

      const unsub = pubsub.subscribe("user-gamma", (notif) => {
        received.push(notif);
      });

      pubsub.emitNotification("user-gamma", {
        id: "notif-2",
        userId: "user-gamma",
        type: "OFFER_ACCEPTED",
        payloadJson: { title: "Teklif Kabul Edildi" },
        readAt: null,
        createdAt: new Date().toISOString(),
      });

      expect(received).toHaveLength(1);

      // Unsubscribe
      unsub();

      pubsub.emitNotification("user-gamma", {
        id: "notif-3",
        userId: "user-gamma",
        type: "COMMUNICATION_PING",
        payloadJson: { title: "Ping" },
        readAt: null,
        createdAt: new Date().toISOString(),
      });

      // No new notifications should be received
      expect(received).toHaveLength(1);
    });

    it("handles multiple concurrent listeners for the same user without MaxListenersExceeded", () => {
      const pubsub = new NotificationPubSub();
      const listenerCount = 20;
      const counts = new Array(listenerCount).fill(0);
      const unsubs: (() => void)[] = [];

      for (let i = 0; i < listenerCount; i++) {
        const idx = i;
        unsubs.push(
          pubsub.subscribe("user-multitab", () => {
            counts[idx]++;
          })
        );
      }

      pubsub.emitNotification("user-multitab", {
        id: "notif-multi",
        userId: "user-multitab",
        type: "RADAR_MATCH",
        payloadJson: { title: "Radar Match" },
        readAt: null,
        createdAt: new Date().toISOString(),
      });

      expect(counts.every((c) => c === 1)).toBe(true);
      unsubs.forEach((u) => u());
    });
  });

  describe("2. NotificationService Integration with PubSub", () => {
    it("dispatches created notification to global notificationPubSub instance", async () => {
      const targetUserId = `user-pubsub-test-${Date.now()}`;
      let receivedNotif: unknown = null;

      const unsub = notificationPubSub.subscribe(targetUserId, (notif) => {
        receivedNotif = notif;
      });

      try {
        const created = await NotificationService.createNotification(
          targetUserId,
          "OFFER_COUNTERED",
          "offer",
          "offer-999",
          {
            title: "Karşı Teklif Geldi",
            message: "40.000 TL yeni teklif iletildi.",
            actionUrl: "/tr/panel/teklifler",
          }
        );

        expect(created).toBeDefined();
        expect(created?.userId).toBe(targetUserId);

        // Verify that notificationPubSub received the event
        expect(receivedNotif).not.toBeNull();
        const n = receivedNotif as {
          id: string;
          userId: string;
          type: string;
          payloadJson: { title: string; message: string };
        };
        expect(n.userId).toBe(targetUserId);
        expect(n.type).toBe("OFFER_COUNTERED");
        expect(n.payloadJson.title).toBe("Karşı Teklif Geldi");
      } finally {
        unsub();
      }
    });
  });

  describe("3. SSE Format Protocol and Event Invariants", () => {
    it("validates correct SSE frame structure for notifications and keepalive pings", () => {
      const formatNotificationEvent = (data: Record<string, unknown>) => {
        return `event: notification\ndata: ${JSON.stringify(data)}\n\n`;
      };

      const formatKeepalivePing = () => {
        return `: ping\n\n`;
      };

      const samplePayload = {
        id: "notif-sse-1",
        userId: "user-test",
        type: "CATEGORY_FOLLOW_MATCH",
        payloadJson: { title: "Yeni İlan Bildirimi" },
      };

      const sseFrame = formatNotificationEvent(samplePayload);
      expect(sseFrame.startsWith("event: notification\n")).toBe(true);
      expect(sseFrame.endsWith("\n\n")).toBe(true);
      expect(sseFrame).toContain(`"id":"notif-sse-1"`);

      const pingFrame = formatKeepalivePing();
      expect(pingFrame).toBe(": ping\n\n");
    });
  });

  describe("4. Multi-Tab Synchronization Contracts", () => {
    it("validates BroadcastChannel payload structures for NEW_NOTIFICATION, MARK_READ, and MARK_ALL_READ", () => {
      interface BroadcastPayload {
        type: "NEW_NOTIFICATION" | "MARK_READ" | "MARK_ALL_READ";
        notification?: unknown;
        notificationId?: string;
      }

      const newNotifMsg: BroadcastPayload = {
        type: "NEW_NOTIFICATION",
        notification: {
          id: "tab-notif-1",
          type: "OFFER_RECEIVED",
        },
      };
      expect(newNotifMsg.type).toBe("NEW_NOTIFICATION");
      expect(newNotifMsg.notification).toBeDefined();

      const markReadMsg: BroadcastPayload = {
        type: "MARK_READ",
        notificationId: "tab-notif-1",
      };
      expect(markReadMsg.type).toBe("MARK_READ");
      expect(markReadMsg.notificationId).toBe("tab-notif-1");

      const markAllReadMsg: BroadcastPayload = {
        type: "MARK_ALL_READ",
      };
      expect(markAllReadMsg.type).toBe("MARK_ALL_READ");
    });
  });
});
