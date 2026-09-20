import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/src/modules/auth/session";

export async function POST(req: Request) {
  const isEn = req.headers.get("x-locale") === "en";
  const allowQuickLogin =
    (process.env.ALLOW_DEMO_CREDENTIALS === "true" ||
      process.env.ENABLE_DEMO_LOGIN === "true" ||
      process.env.VITEST !== undefined ||
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "test") &&
    process.env.NODE_ENV !== "production";

  if (!allowQuickLogin) {
    return NextResponse.json(
      {
        error: isEn
          ? "Quick demo login is disabled."
          : "Hızlı demo girişi bu ortamda devre dışıdır.",
      },
      { status: 403 }
    );
  }

  try {
    let body: { email?: string; role?: string } = {};
    try {
      body = await req.json();
    } catch {
      // empty body
    }

    const ROLE_DEFAULT_EMAILS: Record<string, string> = {
      freelancer: "freelancer@operis.pro",
      admin: "admin@operis.pro",
    };
    const targetEmail =
      body.email ||
      (body.role ? ROLE_DEFAULT_EMAILS[body.role] : undefined) ||
      DEFAULT_USER.email;

    let userRecord = {
      id: DEFAULT_USER.id,
      email: DEFAULT_USER.email,
      role: DEFAULT_USER.role,
      status: DEFAULT_USER.status,
      emailVerified: DEFAULT_USER.emailVerified,
      phoneVerified: DEFAULT_USER.phoneVerified,
      profile: DEFAULT_USER.profile,
    };

    try {
      const db = getDb();
      const rows = await db
        .select({
          user: schema.users,
          profile: schema.profiles,
        })
        .from(schema.users)
        .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
        .where(eq(schema.users.email, targetEmail))
        .limit(1);

      if (rows[0]) {
        const u = rows[0].user;
        const p = rows[0].profile;
        userRecord = {
          id: u.id,
          email: u.email,
          role: u.role as typeof DEFAULT_USER.role,
          status: u.status as typeof DEFAULT_USER.status,
          emailVerified: u.emailVerified,
          phoneVerified: true,
          profile: p
            ? {
                handle: p.handle,
                displayName: p.displayName,
                about: p.about || "",
                avatarUrl: p.avatarUrl,
                showLocation: p.showLocation,
                revealPhoneAfterMatch: p.revealPhoneAfterMatch,
                locale: p.locale,
                theme: p.theme,
                trackedSkills: p.trackedSkills,
              }
            : DEFAULT_USER.profile,
        };
      }
    } catch {
      // Fall back to DEFAULT_USER in offline unit tests
    }

    const sessionToken = createSessionToken({
      id: userRecord.id,
      email: userRecord.email,
      role: userRecord.role,
      status: userRecord.status,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: userRecord,
      },
      { status: 200 }
    );

    // Set secure session cookie (7 days matching token expiration)
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Quick login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
