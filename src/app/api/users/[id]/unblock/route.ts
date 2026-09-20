import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ModerationService } from "@/src/modules/moderation/service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(req);
  const isEn = req.headers.get("x-locale") === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "user:unblock",
    subject: normalizeIp(ip),
    limit: 30,
    windowMs: 60 * 1000,
    isEn,
  });

  if (!access.allowed) {
    return access.response;
  }

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return NextResponse.json(
        { error: isEn ? "Invalid user ID." : "Geçersiz kullanıcı kimliği." },
        { status: 400 }
      );
    }

    await ModerationService.unblockUser(session.userId, id);

    return NextResponse.json(
      {
        success: true,
        message: isEn ? "User unblocked successfully." : "Kullanıcının engeli kaldırıldı.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    let message = isEn
      ? "Failed to unblock user."
      : "Kullanıcının engeli kaldırılamadı.";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
