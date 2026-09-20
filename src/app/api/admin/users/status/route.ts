import { NextResponse } from "next/server";
import { getAdminSession } from "@/src/modules/admin/auth-guard";
import { AdminService } from "@/src/modules/admin/service";
import { z } from "zod";

const updateUserStatusSchema = z.object({
  targetUserId: z.string().min(1),
  action: z.enum(["SUSPEND", "ACTIVATE", "DELETE", "WARN", "UNSUSPEND"]),
  reason: z.string().min(1).default("Admin status update"),
});

export async function POST(req: Request) {
  const auth = await getAdminSession();
  if (!auth.isAdmin || !auth.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { targetUserId, action, reason } = updateUserStatusSchema.parse(body);

    if (action === "DELETE") {
      const { PrivacyService } = await import("@/src/modules/privacy/service");
      const { getDb, schema } = await import("@/src/lib/db");
      const { eq } = await import("drizzle-orm");
      const db = getDb();

      const [adminUser] = await db
        .select({ role: schema.users.role })
        .from(schema.users)
        .where(eq(schema.users.id, auth.session.userId))
        .limit(1);

      const [targetUser] = await db
        .select({ role: schema.users.role, status: schema.users.status })
        .from(schema.users)
        .where(eq(schema.users.id, targetUserId))
        .limit(1);

      if (!targetUser) {
        return NextResponse.json({ error: "Target user not found" }, { status: 404 });
      }

      const ROLE_HIERARCHY: Record<string, number> = {
        USER: 1,
        MODERATOR: 2,
        ADMIN: 3,
        SECURITY_ADMIN: 4,
      };

      const adminRank = ROLE_HIERARCHY[adminUser?.role || "MODERATOR"] || 1;
      const targetRank = ROLE_HIERARCHY[targetUser.role || "USER"] || 1;

      if (targetRank >= adminRank) {
        return NextResponse.json(
          {
            error:
              "INSUFFICIENT_ROLE_HIERARCHY: Yetki seviyeniz hedef kullanıcının hesabını silmek için yetersizdir.",
          },
          { status: 403 }
        );
      }

      await PrivacyService.deleteAccount(
        targetUserId,
        `Admin Silme İşlemi (${auth.session.userId}): ${reason}`
      );

      try {
        await db.insert(schema.adminAuditLog).values({
          adminUserId: auth.session.userId,
          action: "USER_ACCOUNT_ADMIN_DELETED",
          targetType: "user",
          targetId: targetUserId,
          reasonCode: "ADMIN_ACCOUNT_PURGE",
          safeSummary: reason || "Admin permanently deleted user account",
        });
      } catch {
        // non-blocking
      }

      return NextResponse.json({
        success: true,
        message: "User account has been permanently deleted/anonymized.",
        action: "DELETE",
      });
    }

    let mappedAction: "SUSPEND" | "UNSUSPEND" | "WARN" = "WARN";
    if (action === "ACTIVATE" || action === "UNSUSPEND") {
      mappedAction = "UNSUSPEND";
    } else if (action === "SUSPEND") {
      mappedAction = "SUSPEND";
    }

    const updatedUser = await AdminService.moderateUser(
      auth.session.userId,
      targetUserId,
      mappedAction,
      reason
    );

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update user status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
