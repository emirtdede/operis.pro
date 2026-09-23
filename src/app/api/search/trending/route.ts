import { NextRequest, NextResponse } from "next/server";
import { TrendingSearchService } from "@/src/lib/search/trending-service";
import { getSeedTrending } from "@/src/lib/search/trending-constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "tr";

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
    const locale = searchParams.get("locale") || "tr";
    // Return locale-safe fallback seeds if anything fails
    return NextResponse.json({
      trending: getSeedTrending(locale),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === "string" ? body.query : "";
    const locale = typeof body.locale === "string" ? body.locale : "tr";

    const recorded = await TrendingSearchService.recordSearch(query, locale);

    return NextResponse.json({ success: recorded });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
