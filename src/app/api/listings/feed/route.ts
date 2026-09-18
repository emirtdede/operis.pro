import { NextRequest, NextResponse } from "next/server";
import { FeedService } from "@/src/modules/listings/feed/service";
import { getSession } from "@/src/modules/auth/session";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const category = searchParams.get("category");
    const search = searchParams.get("q");
    const mode = (searchParams.get("mode") === "following" ? "following" : "all") as
      "following" | "all";
    const locale = (searchParams.get("locale") === "en" ? "en" : "tr") as "tr" | "en";
    const last24Hours = searchParams.get("last24Hours") === "true";
    const budgetSpecific = searchParams.get("budgetSpecific") === "true";
    const budgetMode = searchParams.get("budgetMode") as
      "SPECIFIED" | "OPEN_OFFER" | "UNSPECIFIED" | null;
    const timelineMode = searchParams.get("timelineMode") as
      "TARGET_DATE" | "ESTIMATED_DURATION" | "FLEXIBLE" | "IN_NEGOTIATION" | null;
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const feedResult = await FeedService.getFeedListings({
      mode,
      categorySlugs: category
        ? category
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
      search: search || undefined,
      cursor: cursor || undefined,
      locale,
      userId: session?.userId,
      limit: 12,
      last24Hours: last24Hours || undefined,
      budgetSpecific: budgetSpecific || undefined,
      budgetMode: budgetMode || undefined,
      timelineMode: timelineMode || undefined,
    });

    return NextResponse.json(feedResult);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch listings feed" },
      { status: 500 }
    );
  }
}
