import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { EngagementService } from "@/src/modules/engagements/service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";
import { z } from "zod";

const cancelSchema = z.object({
  reason: z.string().max(500).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isEn = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  try {
    const access = await evaluateSecurityAccessAsync({
      ip,
      purpose: "work:cancel",
      subject: normalizeIp(ip),
      limit: 20,
      windowMs: 60 * 1000,
      isEn,
    });

    if (!access.allowed) {
      return access.response;
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = cancelSchema.parse(body);

    const result = await EngagementService.cancelEngagement(session.userId, id, parsed.reason);

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to cancel engagement";
    let errorMessage = msg;
    if (msg === "CANNOT_CANCEL_DISPUTED_ENGAGEMENT") {
      errorMessage = isEn
        ? "Projects in dispute review cannot be cancelled unilaterally. Please await admin arbitration."
        : "İnceleme/ihtilaf sürecindeki projeler tek taraflı iptal edilemez. Lütfen yönetici hakemlik kararını bekleyin.";
    } else if (msg === "Cannot cancel an already completed engagement") {
      errorMessage = isEn
        ? "Cannot cancel an already completed engagement."
        : "Tamamlanmış bir iş ortaklığı iptal edilemez.";
    }

    return NextResponse.json({ error: errorMessage, code: msg }, { status: 400 });
  }
}
