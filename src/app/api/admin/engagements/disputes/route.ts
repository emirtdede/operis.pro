import { NextResponse } from "next/server";
import { getAdminSession } from "@/src/modules/admin/auth-guard";
import { AdminService } from "@/src/modules/admin/service";

export async function GET(req: Request) {
  try {
    const auth = await getAdminSession();
    if (!auth.isAdmin || !auth.session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const data = await AdminService.getDisputedEngagements({ page, limit, status, search });
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("[API_ADMIN_DISPUTES_ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
