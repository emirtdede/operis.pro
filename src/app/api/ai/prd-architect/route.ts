import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import {
  PrdArchitectService,
  type PrdArchitectInput,
} from "@/src/modules/ai/prd-architect";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function POST(req: Request) {
  const headerLocale = req.headers.get("x-locale");

  try {
    const session = await getSession();
    const body = await req.json().catch(() => ({}));
    const locale = (headerLocale || body?.locale || "tr") as "tr" | "en";
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
    const categorySlug = typeof body?.categorySlug === "string" ? body.categorySlug.trim() : undefined;
    const tags = Array.isArray(body?.tags) ? body.tags.filter((t: unknown) => typeof t === "string") : undefined;

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
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
