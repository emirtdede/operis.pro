import { and, eq, gt, asc } from "drizzle-orm";
import { getSession } from "@/src/modules/auth/session";
import { getDb, schema } from "@/src/lib/db";
import { notificationPubSub } from "@/src/modules/notifications/pubsub";
import {
  decodeNotificationCursor,
  encodeNotificationCursor,
} from "@/src/modules/notifications/stream-cursor";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session?.userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.userId;
  const db = getDb();
  let cursor = "0";
  const lastEventId =
    req.headers.get("last-event-id") || new URL(req.url).searchParams.get("lastEventId");
  try {
    if (lastEventId) {
      const decoded = decodeNotificationCursor(lastEventId, userId);
      if (decoded !== null) cursor = decoded;
      else if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastEventId)
      ) {
        const [old] = await db
          .select({ sequence: schema.notifications.streamSequence })
          .from(schema.notifications)
          .where(
            and(eq(schema.notifications.id, lastEventId), eq(schema.notifications.userId, userId))
          )
          .limit(1);
        if (!old) return Response.json({ error: "Invalid cursor" }, { status: 400 });
        cursor = old.sequence;
      } else return Response.json({ error: "Invalid cursor" }, { status: 400 });
      const [counter] = await db
        .select()
        .from(schema.notificationStreamCounters)
        .where(eq(schema.notificationStreamCounters.userId, userId))
        .limit(1);
      if (BigInt(cursor) > BigInt(counter?.lastSequence || "0"))
        return Response.json({ error: "Invalid cursor" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Notification storage unavailable" }, { status: 503 });
  }
  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false,
        running = false,
        requested = false;
      let unsubscribe = () => {};
      const timers: {
        ping?: ReturnType<typeof setInterval>;
        poll?: ReturnType<typeof setInterval>;
        lifetime?: ReturnType<typeof setTimeout>;
      } = {};
      cleanup = () => {
        if (closed) return;
        closed = true;
        unsubscribe();
        clearInterval(timers.ping);
        clearInterval(timers.poll);
        clearTimeout(timers.lifetime);
        req.signal.removeEventListener("abort", cleanup);
        try {
          controller.close();
        } catch {
          /* Already cancelled. */
        }
      };
      const enqueue = (frame: string) => {
        if (closed) return false;
        try {
          controller.enqueue(encoder.encode(frame));
          return true;
        } catch {
          cleanup();
          return false;
        }
      };
      const drain = async () => {
        requested = true;
        if (running || closed) return;
        running = true;
        try {
          do {
            requested = false;
            while (!closed) {
              const rows = await db
                .select()
                .from(schema.notifications)
                .where(
                  and(
                    eq(schema.notifications.userId, userId),
                    gt(schema.notifications.streamSequence, cursor)
                  )
                )
                .orderBy(asc(schema.notifications.streamSequence))
                .limit(100);
              for (const row of rows) {
                const id = encodeNotificationCursor(userId, row.streamSequence);
                if (
                  !enqueue(
                    `id: ${id}\nevent: notification\ndata: ${JSON.stringify({ ...row, createdAt: row.createdAt.toISOString(), readAt: row.readAt?.toISOString() || null })}\n\n`
                  )
                )
                  break;
                cursor = row.streamSequence;
              }
              if (rows.length < 100) break;
            }
          } while (requested && !closed);
        } catch {
          enqueue("event: retry\ndata: {}\n\n");
        } finally {
          running = false;
        }
      };
      // PubSub is only a wakeup; persisted rows are the sole delivery source.
      unsubscribe = notificationPubSub.subscribe(userId, () => {
        void drain();
      });
      enqueue(`event: connected\ndata: ${JSON.stringify({ status: "connected", userId })}\n\n`);
      timers.ping = setInterval(() => enqueue(": ping\n\n"), 15000);
      timers.poll = setInterval(() => {
        void drain();
      }, 3000);
      timers.lifetime = setTimeout(cleanup, 45000);
      req.signal.addEventListener("abort", cleanup, { once: true });
      if (req.signal.aborted) cleanup();
      else void drain();
    },
    cancel() {
      cleanup();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
