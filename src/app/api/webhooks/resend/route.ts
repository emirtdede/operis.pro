import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { ResendPoolService } from "@/src/modules/email/resend-pool-service";

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string;
    bounce?: {
      message?: string;
    };
  };
}

function verifySvixSignature(
  payload: string,
  headers: {
    id: string | null;
    timestamp: string | null;
    signature: string | null;
  },
  secret: string
): boolean {
  if (!headers.id || !headers.timestamp || !headers.signature) {
    return false;
  }

  // Prevent replay attacks (5 minute tolerance)
  const ts = parseInt(headers.timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(ts) || Math.abs(now - ts) > 300) {
    return false;
  }

  let secretKey: Buffer;
  try {
    secretKey = secret.startsWith("whsec_")
      ? Buffer.from(secret.slice(6), "base64")
      : Buffer.from(secret, "utf-8");
  } catch {
    secretKey = Buffer.from(secret, "utf-8");
  }

  const toSign = `${headers.id}.${headers.timestamp}.${payload}`;
  const computed = crypto.createHmac("sha256", secretKey).update(toSign).digest("base64");

  const signatures = headers.signature.split(" ");
  for (const sig of signatures) {
    const parts = sig.split(",");
    const signatureValue = (parts.length === 2 ? parts[1] : parts[0]) || "";
    const computedBuf = Buffer.from(computed);
    const sigBuf = Buffer.from(signatureValue);
    if (computedBuf.length === sigBuf.length && crypto.timingSafeEqual(computedBuf, sigBuf)) {
      return true;
    }
  }

  return false;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        { error: "RESEND_WEBHOOK_SECRET is not configured" },
        { status: 400 }
      );
    }

    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Missing signature headers" }, { status: 401 });
    }

    const isValid = verifySvixSignature(
      rawBody,
      { id: svixId, timestamp: svixTimestamp, signature: svixSignature },
      webhookSecret
    );

    if (!isValid) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as ResendWebhookPayload;
    const eventType = payload.type;
    const recipients = payload.data?.to || [];

    if (eventType === "email.bounced" || eventType === "email.complained") {
      const reason = payload.data?.bounce?.message || eventType;
      const status = eventType === "email.bounced" ? "bounced" : "complained";
      await Promise.all(
        recipients.map((email) => ResendPoolService.handleBounceOrComplaint(email, status, reason))
      );
    }

    return NextResponse.json({ received: true, type: eventType });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook processing error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
