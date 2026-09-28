import { NextResponse } from "next/server";
import { getAdminSession } from "@/src/modules/admin/auth-guard";
import { AdminService } from "@/src/modules/admin/service";
import { z } from "zod";
import { handleApiError } from "@/src/lib/api/error-response";

const updateListingStatusSchema = z.object({
  listingId: z.string().min(1),
  action: z.enum(["HIDE", "UNHIDE", "DEACTIVATE"]),
  reason: z.string().min(1).default("Admin moderation"),
});

export async function POST(req: Request) {
  const auth = await getAdminSession();
  if (!auth.isAdmin || !auth.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { listingId, action, reason } = updateListingStatusSchema.parse(body);

    const updatedListing = await AdminService.moderateListing(
      auth.session.userId,
      listingId,
      action,
      reason
    );

    return NextResponse.json({ success: true, listing: updatedListing });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }
    return handleApiError(err, "Failed to update listing status", {
      logPrefix: "[Admin Listing Status POST Error]",
      status: 500,
    });
  }
}
