import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ReviewService } from "@/src/modules/reviews/service";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pending = await ReviewService.checkPendingMandatoryReviews(session.userId);
    return NextResponse.json({ success: true, pending, hasPending: pending.length > 0 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to check pending reviews";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
