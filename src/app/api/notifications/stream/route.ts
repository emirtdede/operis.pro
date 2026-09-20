import { and, eq, gt } from "drizzle-orm";
import { getSession } from "@/src/modules/auth/session";
import { getDb, schema } from "@/src/lib/db";
import { notificationPubSub, RealtimeNotificationPayload } from "@/src/modules/notifications/pubsub";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session?.userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.userId;
  const encoder = new TextEncoder();
  const sentIds = new Set<string>();

  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;

      const safeEnqueue = (chunk: string) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Stream already closed or broken pipe
          doCleanup();
        }
      };

      const sendNotification = (notification: RealtimeNotificationPayload) => {
        if (sentIds.has(notification.id)) return;
        sentIds.add(notification.id);
        if (sentIds.size > 100) {
          const first = sentIds.values().next().value;
          if (first) sentIds.delete(first);
        }
        safeEnqueue(`event: notification\ndata: ${JSON.stringify(notification)}\n\n`);
      };

      // 1. Send connected event
      safeEnqueue(`event: connected\ndata: ${JSON.stringify({ status: "connected", userId })}\n\n`);

      // 2. Subscribe to in-memory PubSub for instant local notifications
      const unsubscribe = notificationPubSub.subscribe(userId, (notif) => {
        sendNotification(notif);
      });

      // 3. Keepalive ping every 15 seconds to prevent gateway/proxy timeouts
      const pingInterval = setInterval(() => {
        safeEnqueue(`: ping\n\n`);
      }, 15000);

      // 4. Lightweight DB check every 4 seconds for cross-worker / Inngest background job notifications
      let lastSeenDate = new Date();
      const dbPollInterval = setInterval(async () => {
        if (isClosed) return;
        try {
          const db = getDb();
          const rows = await db
            .select()
            .from(schema.notifications)
            .where(
              and(
                eq(schema.notifications.userId, userId),
                gt(schema.notifications.createdAt, lastSeenDate)
              )
            )
            .orderBy(schema.notifications.createdAt);

          for (const row of rows) {
            if (row.createdAt > lastSeenDate) {
              lastSeenDate = row.createdAt;
            }
            sendNotification({
              id: row.id,
              userId: row.userId,
              type: row.type,
              payloadJson: (row.payloadJson as Record<string, unknown>) || {},
              readAt: row.readAt ? row.readAt.toISOString() : null,
              createdAt: row.createdAt.toISOString(),
            });
          }
        } catch {
          // Non-critical; fallback to next poll
        }
      }, 4000);

      const doCleanup = () => {
        if (isClosed) return;
        isClosed = true;
        clearInterval(pingInterval);
        clearInterval(dbPollInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Ignore
        }
      };

      cleanup = doCleanup;

      // Handle client abort
      req.signal.addEventListener("abort", () => {
        doCleanup();
      });
    },
    cancel() {
      if (cleanup) cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
