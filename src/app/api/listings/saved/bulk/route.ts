import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { SavedListingService } from "@/src/modules/listings/saved-service";
import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const access = await evaluateSecurityAccessAsync({
      ip,
      purpose: "listings:saved:bulk",
      subject: session.userId,
      limit: 30,
      windowMs: 60 * 1000,
    });
    if (!access.allowed) {
      return access.response;
    }

    const body = await req.json().catch(() => ({}));
    const { listingIds } = body;

    if (!Array.isArray(listingIds) || listingIds.length === 0) {
      return NextResponse.json(
        { error: "INVALID_BODY: listingIds array is required." },
        { status: 400 }
      );
    }

    const result = await SavedListingService.bulkUnsave(session.userId, listingIds);

    return NextResponse.json({
      success: true,
      removedCount: result.removedCount,
      listingIds: result.listingIds,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to bulk unsave listings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
