import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ListingService } from "@/src/modules/listings/service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(req);
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "listing:action",
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
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const { id } = await params;
    await ListingService.deleteListing(session.userId, id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    let message = isEn ? "Failed to delete listing" : "İlan silinemedi";
    if (err instanceof Error) {
      message = err.message;
    }

    if (!isEn) {
      if (message.includes("Listing not found") || message.includes("not authorized")) {
        message = "İlan bulunamadı veya bu işlem için yetkiniz yok.";
      } else if (message.includes("Cannot delete listing in")) {
        message = "Eşleşmiş veya tamamlanmış ilanlar silinemez.";
      }
    } else {
      if (message.includes("bu işlem için yetkiniz yok")) {
        message = "Listing not found or you are not authorized.";
      }
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
