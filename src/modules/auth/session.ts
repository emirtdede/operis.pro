import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getEnv } from "@/src/config/env";

export const SESSION_COOKIE_NAME = "fp_session";
const SESSION_EXPIRY_DAYS = 7;

export interface SessionPayload {
  type: "SESSION";
  userId: string;
  email: string;
  role: string;
  status: string;
  authVersion: number;
  createdAt: number;
  expiresAt: number;
}

function getSessionKey(secret: string): Buffer {
  return crypto.createHmac("sha256", secret).update("operis_session_token_v1").digest();
}

/**
 * Creates a signed session token: base64(payload).hex(signature)
 */
export function createSessionToken(user: {
  id: string;
  email: string;
  role: string;
  status: string;
  authVersion?: number;
}): string {
  const env = getEnv();
  const now = Date.now();
  const expiresAt = now + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  const validVersion =
    typeof user.authVersion === "number" &&
    Number.isInteger(user.authVersion) &&
    user.authVersion >= 1
      ? user.authVersion
      : 1;

  const payload: SessionPayload = {
    type: "SESSION",
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    authVersion: validVersion,
    createdAt: now,
    expiresAt,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signingKey = getSessionKey(env.AUTH_SECRET);
  const signature = crypto.createHmac("sha256", signingKey).update(payloadB64).digest("hex");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a signed session token and returns the payload if valid and not expired.
 * Strictly verifies token type === "SESSION" and dedicated derived signing key.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    if (!payloadB64 || !signature) return null;

    const env = getEnv();
    const signingKey = getSessionKey(env.AUTH_SECRET);
    const expectedSignature = crypto
      .createHmac("sha256", signingKey)
      .update(payloadB64)
      .digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expectedBuf = Buffer.from(expectedSignature, "hex");
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    );

    if (
      payload.type !== "SESSION" ||
      !payload.userId ||
      !payload.expiresAt ||
      typeof payload.authVersion !== "number" ||
      !Number.isInteger(payload.authVersion) ||
      payload.authVersion < 1
    ) {
      return null;
    }

    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE_SECONDS = SESSION_EXPIRY_DAYS * 24 * 60 * 60;

/**
 * Validates session token and re-verifies user status against database (suspension/revocation/deletion check).
 */
export async function getVerifiedSession(explicitToken?: string): Promise<SessionPayload | null> {
  let token = explicitToken;
  if (!token) {
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
      if (sessionCookie?.value) {
        token = sessionCookie.value;
      }
    } catch {
      // In test runners or background contexts outside Next.js request scope, cookies() throws
    }
  }

  if (!token && (process.env.NODE_ENV === "test" || process.env.VITEST)) {
    token = process.env.__TEST_SESSION_TOKEN;
  }

  if (!token) {
    // Bridge Clerk authentication if fp_session is not present
    if (
      !process.env.VITEST &&
      process.env.CLERK_SECRET_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ) {
      try {
        const { auth, currentUser } = await import("@clerk/nextjs/server");
        const clerkAuth = await auth();
        if (clerkAuth?.userId) {
          const { getDb, schema } = await import("@/src/lib/db");
          const { eq } = await import("drizzle-orm");
          const db = getDb();
          let [dbUser] = await db
            .select({
              id: schema.users.id,
              email: schema.users.email,
              role: schema.users.role,
              status: schema.users.status,
              authVersion: schema.users.authVersion,
            })
            .from(schema.users)
            .where(eq(schema.users.clerkUserId, clerkAuth.userId))
            .limit(1);

          if (!dbUser) {
            const clerkUser = await currentUser();
            if (clerkUser) {
              const primaryEmail =
                clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)
                  ?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress;
              if (primaryEmail) {
                const { ClerkSyncService } = await import("./clerk-sync-service");
                const syncResult = await ClerkSyncService.syncClerkUser({
                  clerkUserId: clerkUser.id,
                  email: primaryEmail,
                  firstName: clerkUser.firstName,
                  lastName: clerkUser.lastName,
                  avatarUrl: clerkUser.imageUrl,
                  emailVerified: true,
                });
                [dbUser] = await db
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
              }
            }
          }

          if (dbUser && dbUser.status === "ACTIVE") {
            const payload: SessionPayload = {
              type: "SESSION",
              userId: dbUser.id,
              email: dbUser.email,
              role: dbUser.role,
              status: dbUser.status,
              authVersion: dbUser.authVersion ?? 1,
              createdAt: Date.now(),
              expiresAt: Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
            };
            return payload;
          }
        }
      } catch {
        // Outside request context or Clerk auth unavailable
      }
    }
    return null;
  }

  const session = verifySessionToken(token);
  if (!session) return null;

  try {
    const { getDb, schema } = await import("@/src/lib/db");
    const { eq } = await import("drizzle-orm");
    const db = getDb();
    const userRows = await db
      .select({
        status: schema.users.status,
        role: schema.users.role,
        authVersion: schema.users.authVersion,
        updatedAt: schema.users.updatedAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, session.userId))
      .limit(1);

    if (userRows.length === 0) {
      // If user row not in DB, check if it's a known active demo user in non-production
      if (process.env.NODE_ENV !== "production") {
        const { DEFAULT_USER } = await import("@/src/modules/auth/demo-user");
        if (session.userId === DEFAULT_USER.id) {
          if (DEFAULT_USER.status !== "ACTIVE") return null;
          return {
            ...session,
            role: DEFAULT_USER.role,
            status: DEFAULT_USER.status,
            authVersion: DEFAULT_USER.authVersion ?? 1,
          };
        }
      }
      return null;
    }

    const dbUser = userRows[0];
    if (!dbUser || dbUser.status !== "ACTIVE") return null;

    // Strictly enforce authVersion matching current database authVersion (R01)
    const expectedAuthVersion = dbUser.authVersion ?? 1;
    if (session.authVersion !== expectedAuthVersion) {
      return null;
    }

    return {
      ...session,
      role: dbUser.role,
      status: dbUser.status,
      authVersion: dbUser.authVersion,
    };
  } catch {
    // If DB check fails in non-production or test environments, check demo user status or return signed session
    if (process.env.NODE_ENV !== "production" || process.env.VITEST) {
      try {
        const { DEFAULT_USER } = await import("@/src/modules/auth/demo-user");
        if (session.userId === DEFAULT_USER.id && DEFAULT_USER.status !== "ACTIVE") {
          return null;
        }
      } catch {
        // Ignore demo user lookup error
      }
      if (session.status !== "ACTIVE") return null;
      return session;
    }
    return null;
  }
}

/**
 * Atomically increments a user's authVersion to invalidate all previously issued sessions (R01).
 * Optionally accepts a transaction runner to be executed within caller's atomic transaction.
 */
export async function bumpUserAuthVersion(userId: string, tx?: unknown): Promise<number | null> {
  try {
    const { getDb, schema } = await import("@/src/lib/db");
    const { eq, sql } = await import("drizzle-orm");
    const db = getDb();
    const client = (tx as ReturnType<typeof getDb>) || db;
    const [updated] = await client
      .update(schema.users)
      .set({
        authVersion: sql`${schema.users.authVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId))
      .returning({ authVersion: schema.users.authVersion });

    return updated?.authVersion ?? null;
  } catch {
    return null;
  }
}

/**
 * Gets the current authenticated session with active database status and role verification.
 * Optionally extracts session token from Request cookies or Authorization header.
 */
export async function getSession(reqOrToken?: Request | string): Promise<SessionPayload | null> {
  if (typeof reqOrToken === "string") {
    return getVerifiedSession(reqOrToken);
  }
  if (reqOrToken && typeof (reqOrToken as Request).headers?.get === "function") {
    const cookieHeader = (reqOrToken as Request).headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
      if (match) {
        return getVerifiedSession(match[1]);
      }
    }
    const authHeader = (reqOrToken as Request).headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      return getVerifiedSession(authHeader.slice(7));
    }
  }
  return getVerifiedSession();
}
