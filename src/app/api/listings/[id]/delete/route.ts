import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ListingService } from "@/src/modules/listings/service";
import { handleApiError } from "@/src/lib/api/error-response";
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
    return handleApiError(
      err,
      {
        en: "Failed to delete listing",
        tr: "İlan silinemedi",
      },
      {
        isEn,
        logPrefix: "[Listing Delete POST Error]",
        status: 500,
        allowedMessages: {
          "Listing not found": {
            en: "Listing not found or you are not authorized.",
            tr: "İlan bulunamadı veya bu işlem için yetkiniz yok.",
            status: 404,
          },
          "not authorized": {
            en: "Listing not found or you are not authorized.",
            tr: "İlan bulunamadı veya bu işlem için yetkiniz yok.",
            status: 403,
          },
          "bu işlem için yetkiniz yok": {
            en: "Listing not found or you are not authorized.",
            tr: "İlan bulunamadı veya bu işlem için yetkiniz yok.",
            status: 403,
          },
          "Cannot delete listing in": {
            en: "Matched or completed listings cannot be deleted.",
            tr: "Eşleşmiş veya tamamlanmış ilanlar silinemez.",
            status: 400,
          },
        },
      }
    );
  }
}
