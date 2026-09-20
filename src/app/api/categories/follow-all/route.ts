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
    purpose: "cat:follow-all",
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

    await CategoryService.followAll(session.userId);
    return NextResponse.json(
      {
        success: true,
        message: isEn ? "Followed all categories." : "Tüm kategoriler takip edildi.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    let message = isEn
      ? "Failed to follow all categories."
      : "Tüm kategoriler takip edilemedi.";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
