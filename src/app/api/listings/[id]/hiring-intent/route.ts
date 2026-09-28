import { NextResponse } from "next/server";
import { HiringIntentService } from "@/src/modules/listings/hiring-intent/hiring-intent-service";
import { handleApiError } from "@/src/lib/api/error-response";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(req);
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") || "tr";
  const isEn = lang === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "listing:hiring-intent",
    subject: normalizeIp(ip),
    limit: 60,
    windowMs: 60 * 1000,
    isEn,
  });
  if (!access.allowed) {
    return access.response;
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: isEn ? "Listing ID required" : "İlan ID gereklidir" },
        { status: 400 }
      );
    }

    const breakdown = await HiringIntentService.getListingHiringIntent(id, lang);

    return NextResponse.json({
      success: true,
      hiringIntent: breakdown,
    });
  } catch (error: unknown) {
    return handleApiError(
      error,
      {
        en: "Error fetching hiring intent",
        tr: "İşe alım niyeti analizi alınamadı",
      },
      {
        isEn,
        logPrefix: "[Listing Hiring Intent GET Error]",
        status: 500,
        allowedMessages: {
          bulunamadı: {
            en: "Listing not found",
            tr: "İlan bulunamadı",
            status: 404,
          },
          "not found": {
            en: "Listing not found",
            tr: "İlan bulunamadı",
            status: 404,
          },
        },
      }
    );
  }
}
