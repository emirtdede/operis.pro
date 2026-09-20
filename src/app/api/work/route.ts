import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { EngagementService } from "@/src/modules/engagements/service";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = (searchParams.get("role") as "all" | "owner" | "freelancer") || "all";
    const status =
      (searchParams.get("status") as "all" | "active" | "completed" | "cancelled") || "all";
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100);
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

    const items = await EngagementService.getUserEngagements(session.userId, {
      role,
      status,
      limit,
      offset,
    });

    return NextResponse.json({
      items,
      total: items.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch engagements";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
