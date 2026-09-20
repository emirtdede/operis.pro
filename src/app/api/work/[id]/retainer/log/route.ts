import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { RetainerService } from "@/src/modules/engagements/retainer-service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isEn = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:retainer:log_hours",
    subject: normalizeIp(ip),
    limit: 60,
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

    const { id: _engagementId } = await params;
    const body = await req.json();
    const { retainerId, hours, taskDescription } = body;

    if (!retainerId) {
      return NextResponse.json(
        { error: isEn ? "Retainer ID is required." : "Sözleşme ID zorunludur." },
        { status: 400 }
      );
    }

    if (!hours || typeof hours !== "number" || hours <= 0) {
      return NextResponse.json(
        { error: isEn ? "Hours must be a positive number." : "Çalışma saati pozitif bir sayı olmalıdır." },
        { status: 400 }
      );
    }

    if (!taskDescription || taskDescription.trim().length < 5) {
      return NextResponse.json(
        { error: isEn ? "Task description must be at least 5 characters." : "Görev açıklaması en az 5 karakter olmalıdır." },
        { status: 400 }
      );
    }

    const result = await RetainerService.logHours({
      retainerId,
      userId: session.userId,
      hours,
      taskDescription: taskDescription.trim(),
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to log hours";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
