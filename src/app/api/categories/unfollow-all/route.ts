import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { CategoryService } from "@/src/modules/categories/service";
import { handleApiError } from "@/src/lib/api/error-response";
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
    return handleApiError(
      err,
      {
        en: "Failed to unfollow all categories.",
        tr: "Kategori takipleri kaldırılamadı.",
      },
      { isEn, logPrefix: "[Category Unfollow All POST Error]", status: 500 }
    );
  }
}
