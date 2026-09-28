import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { RunbookService, SaveRunbookInput } from "@/src/modules/engagements/runbook-service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidEngagementId(id: string): boolean {
  if (UUID_REGEX.test(id)) return true;
  if (
    (Boolean(process.env.VITEST) || process.env.NODE_ENV !== "production") &&
    (id.startsWith("eng-test-") || id.startsWith("eng-demo-"))
  ) {
    return true;
  }
  return false;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    if (!isValidEngagementId(engagementId)) {
      return NextResponse.json(
        { error: isEn ? "Invalid project identifier." : "Geçersiz proje kimliği." },
        { status: 400 }
      );
    }

    const result = await RunbookService.getRunbook(engagementId, session.userId);

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : "";
    if (rawMessage.toLowerCase().includes("forbidden")) {
      return NextResponse.json(
        { error: isEn ? "Access denied." : "Bu projeye erişim yetkiniz bulunmamaktadır." },
        { status: 403 }
      );
    }
    if (rawMessage.toLowerCase().includes("not found")) {
      return NextResponse.json(
        { error: isEn ? "Project not found." : "Proje bulunamadı." },
        { status: 404 }
      );
    }
    console.error("[Runbook API GET] Internal error:", err);
    return NextResponse.json(
      { error: isEn ? "Failed to fetch project runbook." : "Proje devir kılavuzu yüklenemedi." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    if (!isValidEngagementId(engagementId)) {
      return NextResponse.json(
        { error: isEn ? "Invalid project identifier." : "Geçersiz proje kimliği." },
        { status: 400 }
      );
    }

    const body = (await req.json()) as SaveRunbookInput;
    const result = await RunbookService.saveRunbook(engagementId, body, session.userId);

    return NextResponse.json({
      success: true,
      runbook: result.runbook,
      sha256Seal: result.sha256Seal,
      message: isEn ? result.messageEn : result.messageTr,
    });
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : "";
    if (
      rawMessage.includes("tespit edildi") ||
      rawMessage.includes("Security Warning") ||
      rawMessage.includes("SECRET")
    ) {
      return NextResponse.json(
        { error: "SECRET_LEAKAGE_DETECTED", message: rawMessage },
        { status: 422 }
      );
    }
    if (rawMessage.toLowerCase().includes("forbidden")) {
      return NextResponse.json(
        { error: isEn ? "Access denied." : "Bu projeyi değiştirme yetkiniz bulunmamaktadır." },
        { status: 403 }
      );
    }
    if (rawMessage.toLowerCase().includes("not found")) {
      return NextResponse.json(
        { error: isEn ? "Project not found." : "Proje bulunamadı." },
        { status: 404 }
      );
    }
    console.error("[Runbook API POST] Internal error:", err);
    return NextResponse.json(
      { error: isEn ? "Failed to save project runbook." : "Proje devir kılavuzu kaydedilemedi." },
      { status: 500 }
    );
  }
}
