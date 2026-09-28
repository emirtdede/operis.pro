import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ListingService } from "@/src/modules/listings/service";
import { handleApiError } from "@/src/lib/api/error-response";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    return handleApiError(
      err,
      {
        en: "Failed to load listing clone data",
        tr: "İlan klonlama verisi yüklenemedi",
      },
      {
        isEn,
        logPrefix: "[Listing Clone Data GET Error]",
        status: 500,
        allowedMessages: {
          "Listing not found": {
            en: "Listing not found or you are not authorized to clone this listing.",
            tr: "İlan bulunamadı veya bu ilanı klonlama yetkiniz yok.",
            status: 403,
          },
          "not authorized": {
            en: "Listing not found or you are not authorized to clone this listing.",
            tr: "İlan bulunamadı veya bu ilanı klonlama yetkiniz yok.",
            status: 403,
          },
        },
      }
    );
  }
}
