import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/src/modules/auth/session";
import { CategoryService } from "@/src/modules/categories/service";
import { handleApiError } from "@/src/lib/api/error-response";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

const alertPreferencesSchema = z.object({
  categoryId: z.string().min(1, "Invalid category ID"),
  emailAlerts: z.boolean().optional(),
  minBudget: z.number().int().nonnegative().nullable().optional(),
  locale: z.enum(["tr", "en"]).optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const headerLocale = req.headers.get("x-locale");
  const isEnHeader = headerLocale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "cat:alerts",
    subject: normalizeIp(ip),
    limit: 30,
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
    isEn = body?.locale === "en" || isEnHeader;
    const { categoryId, emailAlerts, minBudget } = alertPreferencesSchema.parse(body);

    const result = await CategoryService.updateAlertPreferences(session.userId, categoryId, {
      emailAlerts,
      minBudget,
    });

    return NextResponse.json({ success: true, preferences: result }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const fallbackMsg = isEn ? "Invalid alert parameters." : "Geçersiz alarm parametreleri.";
      return NextResponse.json({ error: err.issues[0]?.message || fallbackMsg }, { status: 400 });
    }

    return handleApiError(
      err,
      {
        en: "Failed to update category alert preferences.",
        tr: "Kategori alarm tercihleri güncellenemedi.",
      },
      { isEn, logPrefix: "[Category Alerts POST Error]", status: 500 }
    );
  }
}
