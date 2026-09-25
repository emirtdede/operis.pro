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
    const timeRange = (searchParams.get("timeRange") as "all" | "24h" | "3d" | "7d") || undefined;
    const last24Hours = searchParams.get("last24Hours") === "true" || timeRange === "24h";
    const budgetSpecific = searchParams.get("budgetSpecific") === "true";
    const budgetType = (searchParams.get("budgetType") as "all" | "fixed" | "hourly" | "open") || undefined;
    const minBudgetRaw = searchParams.get("minBudget");
    const minBudget = minBudgetRaw ? Number(minBudgetRaw) : undefined;
    const maxBudgetRaw = searchParams.get("maxBudget");
    const maxBudget = maxBudgetRaw ? Number(maxBudgetRaw) : undefined;
    const currency = searchParams.get("currency") || undefined;
    const timelineScope = (searchParams.get("timelineScope") as "all" | "short" | "medium" | "long" | "flexible") || undefined;
    const companyVerifiedOnly =
      searchParams.get("companyVerifiedOnly") === "true" ||
      searchParams.get("companyVerified") === "true";
    const tagsParam = searchParams.get("tags");
    const tags = tagsParam
      ? tagsParam
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

    const budgetMode = searchParams.get("budgetMode") as
      | "SPECIFIED"
      | "OPEN_OFFER"
      | "UNSPECIFIED"
      | null;
    const timelineMode = searchParams.get("timelineMode") as
      | "TARGET_DATE"
      | "ESTIMATED_DURATION"
      | "FLEXIBLE"
      | "IN_NEGOTIATION"
      | null;

    const session = await getSession();
    if (mode === "following" && !session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      timeRange,
      budgetSpecific: budgetSpecific || undefined,
      budgetType,
      minBudget: typeof minBudget === "number" && !isNaN(minBudget) ? minBudget : undefined,
      maxBudget: typeof maxBudget === "number" && !isNaN(maxBudget) ? maxBudget : undefined,
      currency,
      timelineScope,
      companyVerifiedOnly: companyVerifiedOnly || undefined,
      tags,
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
