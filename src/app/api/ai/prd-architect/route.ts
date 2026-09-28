import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { PrdArchitectService, type PrdArchitectInput } from "@/src/modules/ai/prd-architect";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function POST(req: Request) {
  const headerLocale = req.headers.get("x-locale");
  let locale: "tr" | "en" = headerLocale === "en" ? "en" : "tr";

  try {
    const session = await getSession(req);
    const body = await req.json().catch(() => ({}));
    if (body?.locale === "en" || body?.locale === "tr") {
      locale = body.locale;
    }
    const isEn = locale === "en";

    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const ip = getClientIp(req);
    const access = await evaluateSecurityAccessAsync({
      ip,
      purpose: "ai:prd-architect",
      subject: `${session.userId}:${normalizeIp(ip)}`,
      limit: 30, // 30 syntheses per minute
      windowMs: 60 * 1000,
      isEn,
    });
    if (!access.allowed) {
      return access.response;
    }

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const summary = typeof body?.summary === "string" ? body.summary.trim() : "";
    const categorySlug =
      typeof body?.categorySlug === "string" ? body.categorySlug.trim() : undefined;
    const tags = Array.isArray(body?.tags)
      ? body.tags.filter((t: unknown) => typeof t === "string")
      : undefined;

    if (!title && !summary) {
      return NextResponse.json(
        {
          error: isEn
            ? "Please provide at least a project title or summary."
            : "Lütfen en az bir proje başlığı veya özeti girin.",
        },
        { status: 400 }
      );
    }

    const input: PrdArchitectInput = {
      title,
      summary,
      categorySlug,
      tags,
      locale,
    };

    const result = PrdArchitectService.architectProjectPrd(input);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: unknown) {
    console.error("[PRD Architect API] Internal Error:", err);
    return NextResponse.json(
      {
        error:
          locale === "en"
            ? "An error occurred while generating the project PRD."
            : "Proje PRD belgesi oluşturulurken bir hata meydana geldi.",
      },
      { status: 500 }
    );
  }
}
