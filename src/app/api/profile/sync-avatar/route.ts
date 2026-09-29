import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { getDb, schema } from "@/src/lib/db";
import { eq } from "drizzle-orm";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";
import { SecurityAuditService } from "@/src/modules/security/audit-service";

export async function POST(req: Request) {
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    // Rate Limiting: Max 2 sync requests per 60 seconds per user
    const ip = getClientIp(req);
    const access = await evaluateSecurityAccessAsync({
      ip,
      purpose: "profile:sync-avatar",
      subject: `${session.userId}:${normalizeIp(ip)}`,
      limit: 2,
      windowMs: 60 * 1000,
      isEn,
    });
    if (!access.allowed) {
      return access.response;
    }

    const db = getDb();
    const [userRecord] = await db
      .select({
        id: schema.users.id,
        clerkUserId: schema.users.clerkUserId,
      })
      .from(schema.users)
      .where(eq(schema.users.id, session.userId))
      .limit(1);

    if (!userRecord) {
      return NextResponse.json(
        { error: isEn ? "User not found" : "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    let avatarUrl: string | null = null;

    // Fetch authoritative image URL from Clerk / Google OAuth
    if (process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      try {
        const { currentUser, clerkClient } = await import("@clerk/nextjs/server");
        const clerkUser = await currentUser().catch(() => null);

        if (clerkUser?.imageUrl) {
          avatarUrl = clerkUser.imageUrl;
        } else if (userRecord.clerkUserId) {
          const client = await clerkClient();
          const fetchedUser = await client.users.getUser(userRecord.clerkUserId);
          avatarUrl = fetchedUser?.imageUrl || null;
        }
      } catch (clerkErr) {
        console.warn("[sync-avatar] Clerk user fetch failed:", clerkErr);
      }
    }

    // Persist to profiles
    await db
      .update(schema.profiles)
      .set({
        avatarUrl: avatarUrl || null,
        avatarSource: "oauth",
        updatedAt: new Date(),
      })
      .where(eq(schema.profiles.userId, session.userId));

    await SecurityAuditService.logEvent({
      eventType: "PROFILE_UPDATED",
      userId: session.userId,
      riskMetadata: {
        action: "sync_avatar_google",
        avatarUrlProvided: Boolean(avatarUrl),
      },
    });

    return NextResponse.json(
      {
        success: true,
        avatarUrl,
        message: isEn
          ? "Profile picture successfully synchronized with Google."
          : "Profil fotoğrafınız Google hesabınızla başarıyla eşitlendi.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[Profile Sync Avatar Error]:", err);
    return NextResponse.json(
      {
        error: isEn
          ? "Failed to sync profile picture from Google."
          : "Google profil fotoğrafı eşitlenirken bir hata oluştu.",
      },
      { status: 500 }
    );
  }
}
