import { NextRequest, NextResponse } from "next/server";
import { TrendingSearchService } from "@/src/lib/search/trending-service";
import { getSeedTrending } from "@/src/lib/search/trending-constants";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLocale = searchParams.get("locale");
    const locale = rawLocale === "en" ? "en" : "tr";

    const trending = await TrendingSearchService.getTopTrending(locale);

    return NextResponse.json(
      { trending },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("[TrendingSearch API Error]", error);
    const { searchParams } = new URL(request.url);
    const rawLocale = searchParams.get("locale");
    const locale = rawLocale === "en" ? "en" : "tr";
    return NextResponse.json({
      trending: getSeedTrending(locale),
    });
  }
}

export async function POST(request: NextRequest) {
  const isEn = request.headers.get("x-locale") === "en";
  const ip = getClientIp(request);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "search:trending:post",
    subject: normalizeIp(ip),
    limit: 30,
    windowMs: 60 * 1000,
    isEn,
  });

  if (!access.allowed) {
    return access.response;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === "string" ? body.query : "";
    const locale = body.locale === "en" ? "en" : "tr";

    const recorded = await TrendingSearchService.recordSearch(query, locale);

    return NextResponse.json({ success: recorded });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
