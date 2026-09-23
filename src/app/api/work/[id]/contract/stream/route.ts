import { getSession } from "@/src/modules/auth/session";
import { EngagementService } from "@/src/modules/engagements/service";
import { ContractSigningService } from "@/src/modules/contracts/contract-signing-service";
import {
  notificationPubSub,
  RealtimeContractEvent,
} from "@/src/modules/notifications/pubsub";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id: engagementId } = await params;

    // Authorize: ensure user is client or contractor for this engagement
    const engagementData = await EngagementService.getEngagementDetails(
      session.userId,
      engagementId
    );
    if (!engagementData?.engagement) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    let cleanup: (() => void) | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;

        const safeEnqueue = (chunk: string) => {
          if (isClosed) return;
          try {
            controller.enqueue(encoder.encode(chunk));
          } catch {
            doCleanup();
          }
        };

        const sendEvent = (event: RealtimeContractEvent) => {
          safeEnqueue(`event: contract_event\ndata: ${JSON.stringify(event)}\n\n`);
        };

        // 1. Send initial connected event with current package state
        try {
          const { packageDetails } = await ContractSigningService.getOrInitPackage(
            engagementId,
            session.userId
          );
          safeEnqueue(
            `event: connected\ndata: ${JSON.stringify({
              status: "connected",
              engagementId,
              package: packageDetails,
              timestamp: new Date().toISOString(),
            })}\n\n`
          );
        } catch {
          safeEnqueue(
            `event: connected\ndata: ${JSON.stringify({
              status: "connected",
              engagementId,
              timestamp: new Date().toISOString(),
            })}\n\n`
          );
        }

        // 2. Subscribe to real-time contract events on this engagement channel
        const unsubscribe = notificationPubSub.subscribeContract(
          engagementId,
          (event) => {
            sendEvent(event);
          }
        );

        // 3. Keepalive ping every 15 seconds to avoid proxy/gateway drops
        const pingInterval = setInterval(() => {
          safeEnqueue(`: ping\n\n`);
        }, 15000);

        const doCleanup = () => {
          if (isClosed) return;
          isClosed = true;
          clearInterval(pingInterval);
          unsubscribe();
          try {
            controller.close();
          } catch {
            // Controller already closed
          }
        };

        cleanup = doCleanup;

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to initialize contract stream";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
