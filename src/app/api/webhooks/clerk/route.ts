import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ClerkSyncService } from "@/src/modules/auth/clerk-sync-service";
import { SecurityAuditService } from "@/src/modules/security/audit-service";
import { getEnv } from "@/src/config/env";

export async function POST(req: Request) {
  const env = getEnv();
  const secret = env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Clerk webhook signing secret not configured" },
      { status: 500 }
    );
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing Svix verification headers" }, { status: 400 });
  }

  const body = await req.text();

  const wh = new Webhook(secret);
  let evt: {
    type: string;
    data: {
      id?: string;
      first_name?: string | null;
      last_name?: string | null;
      image_url?: string | null;
      primary_email_address_id?: string | null;
      email_addresses?: Array<{
        id: string;
        email_address: string;
        verification?: { status?: string };
      }>;
    };
  };

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as unknown as typeof evt;
  } catch (err) {
    console.error("Error verifying Clerk webhook:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const eventType = evt.type;

    if (eventType === "user.created" || eventType === "user.updated") {
      const data = evt.data;
      const primaryEmailId = data.primary_email_address_id;
      const primaryEmailObj =
        data.email_addresses?.find((e) => e.id === primaryEmailId) || data.email_addresses?.[0];
      const email = primaryEmailObj?.email_address;

      if (data.id && email) {
        await ClerkSyncService.syncClerkUser({
          clerkUserId: data.id,
          email,
          firstName: data.first_name,
          lastName: data.last_name,
          avatarUrl: data.image_url,
          emailVerified: primaryEmailObj?.verification?.status === "verified",
        });

        await SecurityAuditService.logEvent({
          eventType: "LOGIN_SUCCESS",
          riskMetadata: {
            provider: "clerk",
            clerkUserId: data.id,
            eventType,
          },
        });
      }
    } else if (eventType === "user.deleted") {
      if (evt.data?.id) {
        await ClerkSyncService.deleteClerkUser(evt.data.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process Clerk webhook event";
    console.error("[ClerkWebhook] Error processing event:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
