import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, or } from "drizzle-orm";
import { getSession } from "@/src/modules/auth/session";
import { getDb, schema } from "@/src/lib/db";
import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";
import { EMOJI_REGEX } from "@/src/lib/security/content-moderator";
import { ModerationService, ReportReason, REPORT_REASONS } from "@/src/modules/moderation/service";
import { hashEmailBlindIndex } from "@/src/lib/crypto";

const createReportSchema = (isEn: boolean) =>
  z.object({
    targetType: z.enum(["listing", "profile", "offer", "general"]),
    targetIdentifier: z
      .string()
      .min(
        1,
        isEn ? "Target identifier or URL is required." : "Hedef kimliği veya bağlantısı zorunludur."
      ),
    reasonCode: z
      .string()
      .min(
        1,
        isEn ? "Please select a reason for reporting." : "Lütfen bir bildirim nedeni seçiniz."
      ),
    details: z
      .string()
      .min(
        10,
        isEn
          ? "Please provide at least 10 characters of explanation."
          : "Lütfen en az 10 karakterlik detaylı bir açıklama yazınız."
      )
      .max(
        2000,
        isEn
          ? "Explanation cannot exceed 2000 characters."
          : "Açıklama en fazla 2000 karakter olabilir."
      )
      .refine((val) => !EMOJI_REGEX.test(val), {
        message: isEn
          ? "Emojis are not permitted in report descriptions."
          : "Bildirim açıklamasında emoji kullanılamaz.",
      }),
    locale: z.enum(["tr", "en"]).optional(),
  });

const REASON_MAP: Record<string, string> = {
  SPAM_OR_SCAM: "SCAM_FRAUD",
  OFF_PLATFORM_ABUSE: "HARASSMENT_ABUSE",
  IP_VIOLATION: "INTELLECTUAL_PROPERTY",
  PROHIBITED_CONTENT: "PROHIBITED_SERVICE",
};

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const headerLocale = req.headers.get("x-locale");
  const isEnHeader = headerLocale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "report",
    limit: 5,
    windowMs: 10 * 60 * 1000,
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
        { error: isEnHeader ? "Unauthorized. Please sign in." : "Giriş yapmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const body = await req.json();
    isEn = body?.locale === "en" || isEnHeader;
    const data = createReportSchema(isEn).parse(body);

    const cleanIdentifier = data.targetIdentifier.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      cleanIdentifier
    );

    let targetId: string | null = null;
    const db = getDb();

    if (isUuid) {
      targetId = cleanIdentifier;
    } else {
      // Resolve slug or handle from database
      if (data.targetType === "listing") {
        const slug = cleanIdentifier.split("/").filter(Boolean).pop() || cleanIdentifier;
        const [listing] = await db
          .select({ id: schema.listings.id })
          .from(schema.listings)
          .where(eq(schema.listings.slug, slug))
          .limit(1);
        if (listing) {
          targetId = listing.id;
        }
      } else if (data.targetType === "profile") {
        const rawHandle = cleanIdentifier.split("/").filter(Boolean).pop() || cleanIdentifier;
        const handle = rawHandle.replace(/^@/, "");
        const emailHmac = hashEmailBlindIndex(cleanIdentifier.toLowerCase().trim());
        const [user] = await db
          .select({ id: schema.users.id })
          .from(schema.users)
          .innerJoin(schema.profiles, eq(schema.users.id, schema.profiles.userId))
          .where(
            or(
              eq(schema.profiles.handle, handle),
              eq(schema.users.emailHmac, emailHmac),
              eq(schema.users.email, cleanIdentifier)
            )
          )
          .limit(1);
        if (user) {
          targetId = user.id;
        }
      }
    }

    if (!targetId) {
      if (data.targetType === "general") {
        targetId = "00000000-0000-0000-0000-000000000000";
      } else {
        return NextResponse.json(
          {
            error: isEn
              ? "Reported target not found. Please provide a valid project link or username."
              : "Bildirilen hedef bulunamadı. Lütfen geçerli bir ilan bağlantısı veya kullanıcı adı giriniz.",
          },
          { status: 400 }
        );
      }
    }

    const canonicalReason = (REASON_MAP[data.reasonCode] || data.reasonCode) as ReportReason;
    if (!REPORT_REASONS.includes(canonicalReason)) {
      return NextResponse.json(
        { error: isEn ? "Invalid report reason code." : "Geçersiz bildirim nedeni kodu." },
        { status: 400 }
      );
    }

    const detailsPrefix = `[Hedef: ${data.targetIdentifier}] `;
    const combinedDetails = detailsPrefix + data.details;
    const finalDetails =
      combinedDetails.length > 2000 ? combinedDetails.slice(0, 2000) : combinedDetails;

    try {
      await ModerationService.submitReport(session.userId, {
        targetType: data.targetType,
        targetId: targetId || cleanIdentifier,
        reasonCode: canonicalReason,
        details: finalDetails,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === "CANNOT_REPORT_SELF") {
          return NextResponse.json(
            {
              error: isEn
                ? "You cannot submit a report against your own listing, profile, or proposal."
                : "Kendi ilanınızı, profilinizi veya teklifinizi şikayet edemezsiniz.",
            },
            { status: 400 }
          );
        }
        if (err.message === "DUPLICATE_REPORT") {
          return NextResponse.json(
            {
              error: isEn
                ? "You already have an active report under review for this item."
                : "Bu içerik hakkında inceleme aşamasında olan aktif bir şikayetiniz bulunmaktadır.",
            },
            { status: 400 }
          );
        }
      }
      if (process.env.NODE_ENV === "production") {
        console.error("Failed to persist report:", err);
        return NextResponse.json(
          {
            error: isEn
              ? "Database error while saving report."
              : "Bildirim kaydedilirken bir veritabanı hatası oluştu.",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: isEn
          ? "Your report has been submitted to Operis security team. It will be reviewed promptly."
          : "Bildiriminiz Operis güvenlik ekibine başarıyla iletildi. En kısa sürede incelenecektir.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    let message = isEn
      ? "Failed to submit report."
      : "Bildirim iletilemedi.";
    if (err instanceof z.ZodError) {
      const fallbackMsg = isEn ? "Invalid form data." : "Form verileri geçersiz.";
      message = err.issues[0]?.message || fallbackMsg;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
