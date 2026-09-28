import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ResendPoolService } from "@/src/modules/email/resend-pool-service";
import { handleApiError } from "@/src/lib/api/error-response";

export async function GET(req: Request) {
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const consent = await ResendPoolService.getUserConsentStatus(session.userId);
    return NextResponse.json({ consent }, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to fetch marketing consent status",
        tr: "Pazarlama izni durumu alınamadı",
      },
      { isEn, logPrefix: "[Marketing Consent GET Error]", status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as { consent?: boolean };
    if (typeof body.consent !== "boolean") {
      return NextResponse.json(
        { error: isEn ? "Consent boolean is required" : "Onay değeri zorunludur" },
        { status: 400 }
      );
    }

    if (body.consent) {
      let email = session.email;
      if (!email) {
        const { getDb, schema } = await import("@/src/lib/db");
        const { eq } = await import("drizzle-orm");
        const db = getDb();
        const [u] = await db
          .select({ email: schema.users.email })
          .from(schema.users)
          .where(eq(schema.users.id, session.userId))
          .limit(1);
        email = u?.email || "";
      }

      if (!email) {
        return NextResponse.json(
          { error: isEn ? "User email not found" : "Kullanıcı e-posta adresi bulunamadı" },
          { status: 400 }
        );
      }

      const result = await ResendPoolService.optInUser(session.userId, email);
      return NextResponse.json({
        success: true,
        hasConsent: true,
        status: result.status,
      });
    } else {
      await ResendPoolService.optOutUser(session.userId);
      return NextResponse.json({
        success: true,
        hasConsent: false,
        status: "OPTED_OUT",
      });
    }
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to update marketing consent status",
        tr: "Pazarlama izni durumu güncellenemedi",
      },
      { isEn, logPrefix: "[Marketing Consent POST Error]", status: 500 }
    );
  }
}
