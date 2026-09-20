import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/src/modules/auth/session";
import { ListingService } from "@/src/modules/listings/service";
import { updateListingInputSchema } from "@/src/modules/listings/wizard/schema";
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
    purpose: "listing:update",
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
    const body = await req.json();
    const validated = updateListingInputSchema.parse(body);

    await ListingService.updateListing(session.userId, id, validated);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    let message = isEn
      ? "Failed to update listing"
      : "İlan güncellenemedi";
    if (err instanceof z.ZodError) {
      const fallbackMsg = isEn ? "Form validation error" : "Form doğrulama hatası";
      message = err.issues[0]?.message || fallbackMsg;
    } else if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
