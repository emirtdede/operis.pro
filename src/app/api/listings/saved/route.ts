import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { SavedListingService } from "@/src/modules/listings/saved-service";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter =
      (searchParams.get("statusFilter") as "all" | "active" | "closed") || "all";
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 100), 1), 200);
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

    const items = await SavedListingService.getSavedListings(session.userId, {
      statusFilter,
      limit,
      offset,
    });

    return NextResponse.json({
      items,
      total: items.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { listingId, notes } = body;

    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json(
        { error: "INVALID_BODY: listingId string is required." },
        { status: 400 }
      );
    }

    const result = await SavedListingService.toggleSave(
      session.userId,
      listingId,
      typeof notes === "string" ? notes : undefined
    );

    return NextResponse.json({
      success: true,
      saved: result.saved,
      id: result.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to toggle saved listing";
    const status =
      message.includes("MAX_SAVED_LIMIT_REACHED") ||
      message.includes("LISTING_NOT_FOUND") ||
      message.includes("INVALID_ARGUMENTS")
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
