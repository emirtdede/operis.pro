import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { ClerkSyncService } from "@/src/modules/auth/clerk-sync-service";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/src/modules/auth/session";
import { SecurityAuditService } from "@/src/modules/security/audit-service";

export async function POST(req: Request) {
  const isTr = req.headers.get("x-locale") !== "en";

  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.json(
      { error: isTr ? "Clerk kimlik doğrulama yapılandırılmamış." : "Clerk auth not configured." },
      { status: 503 }
    );
  }

  try {
    const { auth, currentUser, clerkClient } = await import("@clerk/nextjs/server");
    const clerkAuth = await auth();

    // STRICT: Under NO circumstances should body.clerkUserId or body.email supply identity.
    // The session MUST originate from a cryptographically verified server-side Clerk session.
    if (!clerkAuth?.userId) {
      await SecurityAuditService.logEvent({
        eventType: "LOGIN_FAILED",
        riskMetadata: {
          endpoint: "/api/auth/clerk-sync",
          reason: "no_active_clerk_session",
        },
      });

      return NextResponse.json(
        { error: isTr ? "Aktif bir oturum bulunamadı." : "No active session found." },
        { status: 401 }
      );
    }

    const targetClerkUserId = clerkAuth.userId;

    let email: string | null = null;
    let emailVerified = false;
    let firstName: string | null = null;
    let lastName: string | null = null;
    let avatarUrl: string | null = null;

    // Fetch authoritative user profile directly from Clerk server API
    try {
      const clerkUser = await currentUser();
      if (clerkUser) {
        const primaryEmailObj =
          clerkUser.emailAddresses?.find(
            (e: { id: string; emailAddress: string; verification?: { status?: string } | null }) =>
              e.id === clerkUser.primaryEmailAddressId
          ) || clerkUser.emailAddresses?.[0];

        if (primaryEmailObj) {
          email = primaryEmailObj.emailAddress;
          emailVerified = primaryEmailObj.verification?.status === "verified";
        }
        firstName = clerkUser.firstName;
        lastName = clerkUser.lastName;
        avatarUrl = clerkUser.imageUrl;
      }
    } catch {
      // Fallback to clerkClient if currentUser() fails in context
    }

    if (!email) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(targetClerkUserId);
        if (user) {
          const primaryEmailObj =
            user.emailAddresses?.find(
              (e: { id: string; emailAddress: string; verification?: { status?: string } | null }) =>
                e.id === user.primaryEmailAddressId
            ) || user.emailAddresses?.[0];

          if (primaryEmailObj) {
            email = primaryEmailObj.emailAddress;
            emailVerified = primaryEmailObj.verification?.status === "verified";
          }
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

    if (!emailVerified) {
      await SecurityAuditService.logEvent({
        eventType: "LOGIN_FAILED",
        riskMetadata: {
          endpoint: "/api/auth/clerk-sync",
          clerkUserId: targetClerkUserId,
          reason: "unverified_email",
        },
      });

      return NextResponse.json(
        {
          error: isTr
            ? "E-posta adresiniz henüz doğrulanmamış. Lütfen e-postanızı doğrulayın."
            : "Your email address is not verified. Please verify your email before proceeding.",
        },
        { status: 403 }
      );
    }

    let legalConsent:
      | { accepted: boolean; locale?: string; documentVersions?: Record<string, string> }
      | undefined;
    try {
      const body = await req.json();
      if (body?.legalConsent && typeof body.legalConsent === "object") {
        legalConsent = {
          accepted: Boolean(body.legalConsent.accepted),
          locale: typeof body.legalConsent.locale === "string" ? body.legalConsent.locale : undefined,
          documentVersions:
            typeof body.legalConsent.documentVersions === "object"
              ? body.legalConsent.documentVersions
              : undefined,
        };
      }
    } catch {
      // Body is optional in clerk-sync route
    }

    // Sync Clerk user with PostgreSQL database using strictly verified server data
    const syncResult = await ClerkSyncService.syncClerkUser({
      clerkUserId: targetClerkUserId,
      email,
      firstName,
      lastName,
      avatarUrl,
      emailVerified: true,
      legalConsent,
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
      await SecurityAuditService.logEvent({
        userId: dbUser?.id,
        eventType: "LOGIN_FAILED",
        riskMetadata: {
          endpoint: "/api/auth/clerk-sync",
          reason: "inactive_account",
          status: dbUser?.status,
        },
      });

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

    await SecurityAuditService.logEvent({
      userId: dbUser.id,
      eventType: "LOGIN_SUCCESS",
      riskMetadata: {
        provider: "clerk",
        clerkUserId: targetClerkUserId,
      },
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
