import { NextResponse } from "next/server";
import { eq, desc, and, isNull, sql } from "drizzle-orm";
import { getSession } from "@/src/modules/auth/session";
import { getDb, schema } from "@/src/lib/db";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isEn = req.headers.get("x-locale") === "en" || searchParams.get("locale") === "en";

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 1), 50);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);
    const unreadOnly = searchParams.get("unread") === "true";

    const db = getDb();
    const whereConditions = [eq(schema.notifications.userId, session.userId)];
    if (unreadOnly) {
      whereConditions.push(isNull(schema.notifications.readAt));
    }

    // Accurate unread count for the authenticated user
    const unreadResults = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.notifications)
      .where(
        and(eq(schema.notifications.userId, session.userId), isNull(schema.notifications.readAt))
      );
    const unreadCount = Number(unreadResults[0]?.count ?? 0);

    // Total matching items
    const totalResults = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.notifications)
      .where(and(...whereConditions));
    const totalCount = Number(totalResults[0]?.count ?? 0);

    // Paginated rows directly from DB
    const rows = await db
      .select()
      .from(schema.notifications)
      .where(and(...whereConditions))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(
      {
        notifications: rows,
        totalCount,
        unreadCount,
        hasMore: offset + rows.length < totalCount,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    let message = isEn
      ? "Failed to fetch notifications."
      : "Bildirimler alınamadı.";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const headerLocale = req.headers.get("x-locale");
  const isEnHeader = headerLocale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "notif:action",
    subject: normalizeIp(ip),
    limit: 60,
    windowMs: 60 * 1000,
    isEn: isEnHeader,
  });
  if (!access.allowed) {
    return access.response;
  }

  let isEn = isEnHeader;
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEnHeader ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const body = await req.json();
    if (body?.locale === "en") isEn = true;

    const db = getDb();

    if (body.action === "markAllRead") {
      await db
        .update(schema.notifications)
        .set({ readAt: new Date() })
        .where(
          and(eq(schema.notifications.userId, session.userId), isNull(schema.notifications.readAt))
        );
    } else if (body.notificationId && typeof body.notificationId === "string") {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        body.notificationId
      );
      if (isUuid) {
        await db
          .update(schema.notifications)
          .set({ readAt: new Date() })
          .where(
            and(
              eq(schema.notifications.id, body.notificationId),
              eq(schema.notifications.userId, session.userId)
            )
          );
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    let message = isEn
      ? "Failed to update notification."
      : "Bildirim güncellenemedi.";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
