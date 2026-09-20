import { NextResponse } from "next/server";
import { ReviewService } from "@/src/modules/reviews/service";
import { ProfileService } from "@/src/modules/profiles/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let targetUserId = id;

    // Check if `id` is a handle rather than a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      const profile = await ProfileService.getPublicProfileByHandle(id);
      if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }
      targetUserId = profile.userId;
    }

    const reviewsSummary = await ReviewService.getReviewsForUser(targetUserId);
    return NextResponse.json({ success: true, reviewsSummary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch reviews";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
