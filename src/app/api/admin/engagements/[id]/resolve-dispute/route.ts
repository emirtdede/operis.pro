import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/src/modules/admin/auth-guard";
import { AdminService } from "@/src/modules/admin/service";
import { handleApiError } from "@/src/lib/api/error-response";

const resolveDisputeSchema = z.object({
  decision: z.enum(["FORCE_COMPLETE", "FORCE_CANCEL"]),
  notes: z.string().max(1000).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminSession();
  if (!auth.isAdmin || !auth.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing engagement ID" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { decision, notes } = resolveDisputeSchema.parse(body);

    const result = await AdminService.resolveEngagementDispute(
      auth.session.userId,
      id,
      decision,
      notes
    );

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }
    return handleApiError(err, "Failed to arbitrate engagement dispute", {
      logPrefix: "[Admin Resolve Dispute POST Error]",
      status: 500,
    });
  }
}
