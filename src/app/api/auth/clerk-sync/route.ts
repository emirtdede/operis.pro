import { z } from "zod";
import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { ClerkSyncService } from "@/src/modules/auth/clerk-sync-service";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/src/modules/auth/session";
import { SecurityAuditService } from "@/src/modules/security/audit-service";

const syncBodySchema = z.object({
  totpCode: z.string().optional(),
  legalConsent: z
    .object({
      accepted: z.boolean(),
      locale: z.string().optional(),
      documentVersions: z.record(z.string()).optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  const isTr = req.headers.get("x-locale") !== "en";

  let rawBody: unknown = {};
  try {
    rawBody = await req.json();
  } catch {
    /* Body is optional. */
  }
  const parsedBody = syncBodySchema.safeParse(rawBody);
  if (!parsedBody.success)
    return NextResponse.json({ error: "Invalid sync request" }, { status: 400 });
  const body = parsedBody.data;

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
              (e: {
                id: string;
                emailAddress: string;
                verification?: { status?: string } | null;
              }) => e.id === user.primaryEmailAddressId
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

    const db = getDb();
    const { isClerkSessionRevokedOrObsolete } = await import("@/src/modules/auth/clerk-revocation");
    const [priorUser] = await db
      .select({
        id: schema.users.id,
        authVersion: schema.users.authVersion,
        sessionsInvalidBefore: schema.users.sessionsInvalidBefore,
      })
      .from(schema.users)
      .where(eq(schema.users.clerkUserId, targetClerkUserId))
      .limit(1);
    if (
      await isClerkSessionRevokedOrObsolete({
        userId: priorUser?.id || "",
        clerkUserId: targetClerkUserId,
        clerkSessionId: clerkAuth.sessionId,
        currentAuthVersion: priorUser?.authVersion ?? 1,
        sessionsInvalidBefore: priorUser?.sessionsInvalidBefore,
      })
    )
      return NextResponse.json(
        { error: "Session revoked", code: "SESSION_REVOKED" },
        { status: 401 }
      );

    const legalConsent = body.legalConsent;

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

    const [dbUser] = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        role: schema.users.role,
        status: schema.users.status,
        authVersion: schema.users.authVersion,
        twoFactorEnabled: schema.users.twoFactorEnabled,
        twoFactorSecret: schema.users.twoFactorSecret,
        twoFactorBackupCodes: schema.users.twoFactorBackupCodes,
        updatedAt: schema.users.updatedAt,
        sessionsInvalidBefore: schema.users.sessionsInvalidBefore,
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

    // R02: Invalidate obsolete or un-revoked remote Clerk sessions
    const tokenIatSec =
      typeof clerkAuth.sessionClaims?.iat === "number" ? clerkAuth.sessionClaims.iat : null;

    const isObsoleteSession = await isClerkSessionRevokedOrObsolete({
      userId: dbUser.id,
      clerkSessionId: clerkAuth.sessionId,
      currentAuthVersion: dbUser.authVersion ?? 1,
      clerkUserId: targetClerkUserId,
      sessionsInvalidBefore: dbUser.sessionsInvalidBefore,
      tokenIatSec,
    });

    if (isObsoleteSession) {
      await SecurityAuditService.logEvent({
        userId: dbUser.id,
        eventType: "LOGIN_FAILED",
        riskMetadata: {
          endpoint: "/api/auth/clerk-sync",
          reason: "obsolete_remote_clerk_session",
          tokenIatSec,
          clerkSessionId: clerkAuth.sessionId,
        },
      });

      return NextResponse.json(
        {
          error: isTr
            ? "Oturum süresi dolmuş veya güvenlik bilgileri güncellenmiş. Lütfen yeniden giriş yapın."
            : "Session is obsolete or security credentials were changed. Please sign in again.",
          code: "SESSION_REVOKED",
        },
        { status: 401 }
      );
    }

    // R01: Enforce local 2FA challenge if enabled on user account
    let isTwoFactorVerified = false;
    if (dbUser.twoFactorEnabled) {
      const rawTotp = body?.totpCode?.trim();
      if (!rawTotp) {
        return NextResponse.json(
          {
            success: false,
            requires2FA: true,
            message: isTr
              ? "İki aşamalı doğrulama kodu (TOTP) gereklidir."
              : "Two-factor authentication code is required.",
          },
          { status: 403 }
        );
      }

      const cleanTotp = rawTotp.replace(/\s+/g, "");
      const { verifyTotpCode, decryptTotpSecret, verifyAndConsumeBackupCode } =
        await import("@/src/modules/auth/totp");
      let isValidTotp = false;

      if (/^\d{6}$/.test(cleanTotp) && dbUser.twoFactorSecret) {
        isValidTotp = verifyTotpCode(
          decryptTotpSecret(dbUser.id, dbUser.twoFactorSecret),
          cleanTotp
        );
      } else if (cleanTotp.length >= 8 && Array.isArray(dbUser.twoFactorBackupCodes)) {
        const { hashBackupCode } = await import("@/src/modules/auth/totp");
        const targetHash = hashBackupCode(cleanTotp);

        try {
          if (typeof db.transaction === "function") {
            await db.transaction(async (tx) => {
              const [lockedUser] = await tx
                .select({
                  twoFactorBackupCodes: schema.users.twoFactorBackupCodes,
                })
                .from(schema.users)
                .where(eq(schema.users.id, dbUser.id))
                .for("update");

              const codes = (lockedUser?.twoFactorBackupCodes || []) as string[];
              const backupResult = verifyAndConsumeBackupCode(cleanTotp, codes);

              if (backupResult.isValid) {
                const updated = await tx
                  .update(schema.users)
                  .set({
                    twoFactorBackupCodes: backupResult.remainingHashedCodes,
                    updatedAt: new Date(),
                  })
                  .where(eq(schema.users.id, dbUser.id))
                  .returning({ id: schema.users.id });

                if (updated && updated.length === 1) {
                  isValidTotp = true;
                }
              }
            });
          } else {
            // Atomic CAS consumption: only succeeds if the target code is currently in the array
            const backupResult = verifyAndConsumeBackupCode(
              cleanTotp,
              dbUser.twoFactorBackupCodes as string[]
            );
            if (backupResult.isValid) {
              const updatedRows = await db
                .update(schema.users)
                .set({
                  twoFactorBackupCodes: backupResult.remainingHashedCodes,
                  updatedAt: new Date(),
                })
                .where(
                  and(
                    eq(schema.users.id, dbUser.id),
                    sql`${targetHash} = ANY(${schema.users.twoFactorBackupCodes})`
                  )
                )
                .returning({ id: schema.users.id });

              if (updatedRows && updatedRows.length === 1) {
                isValidTotp = true;
              } else {
                // Concurrency conflict: code consumed by another parallel request
                isValidTotp = false;
              }
            }
          }
        } catch (dbErr) {
          console.error("[Clerk Sync] Backup code atomic consumption failure:", dbErr);
          return NextResponse.json(
            {
              error: isTr
                ? "Kurtarma kodu işlenirken veritabanı güvenlik hatası oluştu. Lütfen tekrar deneyiniz."
                : "Database security error while processing recovery code. Please try again.",
            },
            { status: 503 }
          );
        }
      }

      if (!isValidTotp) {
        return NextResponse.json(
          {
            error: isTr
              ? "Geçersiz 2FA doğrulama kodu veya kurtarma kodu."
              : "Invalid two-factor code or recovery code.",
          },
          { status: 400 }
        );
      }

      isTwoFactorVerified = true;
    }

    const [freshUser] = await db
      .select({ authVersion: schema.users.authVersion, status: schema.users.status })
      .from(schema.users)
      .where(eq(schema.users.id, dbUser.id))
      .limit(1);
    if (
      !freshUser ||
      freshUser.status !== "ACTIVE" ||
      freshUser.authVersion !== dbUser.authVersion
    ) {
      return NextResponse.json(
        { error: "Session security state changed", code: "SESSION_REVOKED" },
        { status: 401 }
      );
    }

    // Generate signed Operis session token with verified twoFactor status
    const sessionToken = createSessionToken({
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      status: dbUser.status,
      authVersion: dbUser.authVersion,
      twoFactorVerified: isTwoFactorVerified,
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
    if (err instanceof Error && err.message === "CLERK_VERIFICATION_UNAVAILABLE") {
      return NextResponse.json({ error: "Session verification unavailable" }, { status: 503 });
    }
    console.error("[Clerk Sync] Unexpected synchronization error:", err);
    return NextResponse.json(
      {
        error: isTr
          ? "Oturum senkronizasyonu sırasında bir hata oluştu."
          : "An error occurred during session synchronization.",
      },
      { status: 500 }
    );
  }
}
