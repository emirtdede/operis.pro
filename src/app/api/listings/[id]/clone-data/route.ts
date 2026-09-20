import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ListingService } from "@/src/modules/listings/service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "listing:clone-data",
    subject: normalizeIp(ip),
    limit: 20,
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
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const data = await ListingService.getListingCloneData(session.userId, id);

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: unknown) {
    let message = isEn
      ? "Failed to load listing clone data"
      : "İlan klonlama verisi yüklenemedi";
    if (err instanceof Error) {
      message = err.message;
    }

    const isAuthError =
      message.includes("Listing not found") || message.includes("not authorized");

    if (isAuthError) {
      message = isEn
        ? "Listing not found or you are not authorized to clone this listing."
        : "İlan bulunamadı veya bu ilanı klonlama yetkiniz yok.";
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
