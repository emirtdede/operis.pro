import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { CategoryService } from "@/src/modules/categories/service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const isEn = req.headers.get("x-locale") === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "cat:unfollow-all",
    subject: normalizeIp(ip),
    limit: 15,
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

    await CategoryService.unfollowAll(session.userId);
    return NextResponse.json(
      {
        success: true,
        message: isEn ? "Unfollowed all categories." : "Tüm kategorilerin takibi bırakıldı.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    let message = isEn
      ? "Failed to unfollow all categories."
      : "Kategori takipleri kaldırılamadı.";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
