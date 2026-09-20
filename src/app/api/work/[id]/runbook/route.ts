import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { RunbookService, SaveRunbookInput } from "@/src/modules/engagements/runbook-service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isEn = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:runbook:get",
    subject: normalizeIp(ip),
    limit: 120,
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

    const { id: engagementId } = await params;
    const result = await RunbookService.getRunbook(engagementId, session.userId);

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch project runbook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isEn = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:runbook:post",
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

    const { id: engagementId } = await params;
    const body = (await req.json()) as SaveRunbookInput;

    const result = await RunbookService.saveRunbook(engagementId, body, session.userId);

    return NextResponse.json({
      success: true,
      runbook: result.runbook,
      sha256Seal: result.sha256Seal,
      message: isEn ? result.messageEn : result.messageTr,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save project runbook";
    if (message.includes("tespit edildi") || message.includes("Security Warning") || message.includes("SECRET")) {
      return NextResponse.json({ error: "SECRET_LEAKAGE_DETECTED", message }, { status: 422 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
