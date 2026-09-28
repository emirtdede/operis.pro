import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { EngagementService } from "@/src/modules/engagements/service";
import { handleApiError } from "@/src/lib/api/error-response";

export async function GET(req: Request) {
  const isEn = req.headers.get("x-locale") === "en";

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
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
    return handleApiError(
      err,
      {
        en: "Failed to fetch engagements",
        tr: "İş birlikleri listelenemedi",
      },
      { isEn, logPrefix: "[Work Route GET Error]", status: 500 }
    );
  }
}
