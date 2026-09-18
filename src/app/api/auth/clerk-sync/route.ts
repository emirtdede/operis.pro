import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { ClerkSyncService } from "@/src/modules/auth/clerk-sync-service";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/src/modules/auth/session";

export async function POST(req: Request) {
  const isTr = req.headers.get("x-locale") !== "en";

  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.json(
      { error: isTr ? "Clerk kimlik doğrulama yapılandırılmamış." : "Clerk auth not configured." },
      { status: 503 }
    );
  }

  try {
    let body: { clerkUserId?: string; email?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }

    const { auth, currentUser, clerkClient } = await import("@clerk/nextjs/server");
    const clerkAuth = await auth();

    const targetClerkUserId = clerkAuth?.userId || body.clerkUserId;

    if (!targetClerkUserId) {
      return NextResponse.json(
        { error: isTr ? "Aktif bir oturum bulunamadı." : "No active session found." },
        { status: 401 }
      );
    }

    let email = body.email;
    let firstName: string | null = null;
    let lastName: string | null = null;
    let avatarUrl: string | null = null;

    try {
      const clerkUser = await currentUser();
      if (clerkUser) {
        email =
          clerkUser.emailAddresses?.find((e: { id: string; emailAddress: string }) => e.id === clerkUser.primaryEmailAddressId)
            ?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || email;
        firstName = clerkUser.firstName;
        lastName = clerkUser.lastName;
        avatarUrl = clerkUser.imageUrl;
      }
    } catch {
      // Fallback if currentUser() fails
    }

    if (!email) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(targetClerkUserId);
        if (user) {
          email =
            user.emailAddresses?.find((e: { id: string; emailAddress: string }) => e.id === user.primaryEmailAddressId)?.emailAddress ||
            user.emailAddresses?.[0]?.emailAddress;
          firstName = user.firstName;
          lastName = user.lastName;
          avatarUrl = user.imageUrl;
        }
      } catch {
        // Ignore fallback error
      }
    }

    if (!email) {
      return NextResponse.json(
        {
          error: isTr
            ? "Oturuma ait geçerli bir e-posta adresi alınamadı."
            : "Could not retrieve email for this session.",
        },
        { status: 400 }
      );
    }

    // Sync Clerk user with PostgreSQL database
    const syncResult = await ClerkSyncService.syncClerkUser({
      clerkUserId: targetClerkUserId,
      email,
      firstName,
      lastName,
      avatarUrl,
      emailVerified: true,
    });

    const db = getDb();
    const [dbUser] = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        role: schema.users.role,
        status: schema.users.status,
        authVersion: schema.users.authVersion,
      })
      .from(schema.users)
      .where(eq(schema.users.id, syncResult.userId))
      .limit(1);

    if (!dbUser || dbUser.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error: isTr
            ? "Hesabınız aktif durumda değil. Lütfen destek ile iletişime geçin."
            : "Your account is not active. Please contact support.",
        },
        { status: 403 }
      );
    }

    // Generate signed Operis session token
    const sessionToken = createSessionToken({
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      status: dbUser.status,
      authVersion: dbUser.authVersion,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
          handle: syncResult.handle,
          displayName: syncResult.displayName,
        },
      },
      { status: 200 }
    );

    // Issue HTTP-only cookie matching the session lifetime
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Session synchronization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
