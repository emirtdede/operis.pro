import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/src/modules/auth/session";
import { ProfileService } from "@/src/modules/profiles/service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";
import { SecurityAuditService } from "@/src/modules/security/audit-service";

export async function POST(req: Request) {
  const headerLocale = req.headers.get("x-locale");
  const ip = getClientIp(req);

  try {
    const session = await getSession();
    const body = await req.json();
    const locale = headerLocale || body.locale || "tr";
    const isEn = locale === "en";

    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const access = await evaluateSecurityAccessAsync({
      ip,
      purpose: "profile:links",
      subject: `${session.userId}:${normalizeIp(ip)}`,
      limit: 30,
      windowMs: 60 * 1000,
      isEn,
    });
    if (!access.allowed) {
      return access.response;
    }

    if (!Array.isArray(body?.links)) {
      return NextResponse.json(
        {
          error: isEn
            ? "Invalid links payload. Expected an array of links."
            : "Geçersiz bağlantı verisi. Bağlantılar bir dizi (array) olmalıdır.",
        },
        { status: 400 }
      );
    }

    const links = body.links;
    await ProfileService.updateLinks(session.userId, links);

    // Log user audit event
    await SecurityAuditService.logEvent({
      userId: session.userId,
      eventType: "LINKS_UPDATED",
      ipAddress: ip,
      userAgent: req.headers.get("user-agent"),
      riskMetadata: {
        linkCount: links.length,
      },
    });

    // Revalidate paths
    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/tr/settings");
      revalidatePath("/en/settings");
      const p = await ProfileService.getProfileByUserId(session.userId);
      if (p?.handle) {
        revalidatePath(`/tr/u/${p.handle}`);
        revalidatePath(`/en/u/${p.handle}`);
      }
    } catch {
      // Non-fatal
    }

    return NextResponse.json(
      {
        success: true,
        message: isEn ? "Links saved successfully." : "Bağlantılar kaydedildi.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const locale = headerLocale || "tr";
    const isEn = locale === "en";
    let message = isEn ? "Failed to save links" : "Bağlantılar kaydedilemedi";
    if (err instanceof z.ZodError) {
      const fallbackFormat = isEn ? "Invalid link format." : "Geçersiz bağlantı formatı.";
      message = err.issues[0]?.message || fallbackFormat;
    } else if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const PUT = POST;

