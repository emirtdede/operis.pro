import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { HandoverService } from "@/src/modules/engagements/handover-service";
import { handleApiError } from "@/src/lib/api/error-response";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isEnHeader = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:handover:get",
    subject: normalizeIp(ip),
    limit: 120,
    windowMs: 60 * 1000,
    isEn: isEnHeader,
  });

  if (!access.allowed) {
    return access.response;
  }

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEnHeader ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const url = new URL(req.url);
    const lang = url.searchParams.get("lang") === "en" ? "en" : "tr";

    const handoverData = await HandoverService.getHandover(session.userId, id, lang);
    if (!handoverData) {
      return NextResponse.json(
        {
          error: isEnHeader
            ? "Engagement not found or unauthorized."
            : "İş birliği bulunamadı veya erişim yetkiniz yok.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ...handoverData,
    });
  } catch (error: unknown) {
    return handleApiError(
      error,
      {
        en: "Failed to load handover details",
        tr: "Devir teslim detayları alınamadı",
      },
      { isEn: isEnHeader, logPrefix: "[Handover GET Error]", status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isEnHeader = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:handover:action",
    subject: normalizeIp(ip),
    limit: 30,
    windowMs: 60 * 1000,
    isEn: isEnHeader,
  });

  if (!access.allowed) {
    return access.response;
  }

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEnHeader ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const action = body.action as "SUBMIT" | "ACCEPT" | "REVISION";
    const lang = (body.lang === "en" ? "en" : "tr") as "tr" | "en";

    if (!action || !["SUBMIT", "ACCEPT", "REVISION"].includes(action)) {
      return NextResponse.json(
        { error: isEnHeader ? "Invalid handover action." : "Geçersiz teslimat aksiyonu." },
        { status: 400 }
      );
    }

    if (action === "SUBMIT") {
      const { repositoryUrl, commitHash, liveUrl, documentationNotes, accessChecklist } = body;

      if (!repositoryUrl) {
        return NextResponse.json(
          {
            error: isEnHeader
              ? "Repository URL is required."
              : "Kaynak kod deposu URL'si zorunludur.",
          },
          { status: 400 }
        );
      }

      await HandoverService.submitHandover(session.userId, {
        engagementId: id,
        repositoryUrl,
        commitHash,
        liveUrl,
        documentationNotes: documentationNotes || "",
        accessChecklist: accessChecklist || {
          dnsTransferred: false,
          hostingTransferred: false,
          adminAccountsTransferred: false,
          apiKeysTransferred: false,
        },
      });

      const updated = await HandoverService.getHandover(session.userId, id, lang);
      return NextResponse.json({
        success: true,
        message: isEnHeader
          ? "Deliverables submitted successfully. 7-business-day inspection window has started."
          : "Teslimat başarıyla gerçekleştirildi. TBK m. 474 uyarınca 7 iş günü yasal muayene süreci başladı.",
        ...updated,
      });
    }

    if (action === "ACCEPT") {
      await HandoverService.acceptHandover(session.userId, id);
      const updated = await HandoverService.getHandover(session.userId, id, lang);
      return NextResponse.json({
        success: true,
        message: isEnHeader
          ? "Deliverables accepted and official handover protocol sealed."
          : "Teslimat onaylandı. Resmi İş Teslim-Tesellüm ve Kabul Tutanağı yürürlüğe girdi.",
        ...updated,
      });
    }

    if (action === "REVISION") {
      const { revisionNotes } = body;
      if (!revisionNotes || typeof revisionNotes !== "string" || revisionNotes.trim().length < 10) {
        return NextResponse.json(
          {
            error: isEnHeader
              ? "A detailed defect/revision note (at least 10 chars) is required."
              : "En az 10 karakter uzunluğunda detaylı ayıp/revizyon açıklaması girilmelidir.",
          },
          { status: 400 }
        );
      }

      await HandoverService.requestRevision(session.userId, {
        engagementId: id,
        revisionNotes,
      });

      const updated = await HandoverService.getHandover(session.userId, id, lang);
      return NextResponse.json({
        success: true,
        message: isEnHeader
          ? "Revision notice has been sent to contractor."
          : "Revizyon ve ayıp inceleme bildirimi yükleniciye iletildi.",
        ...updated,
      });
    }

    return NextResponse.json({ error: "Unhandled action" }, { status: 400 });
  } catch (error: unknown) {
    return handleApiError(
      error,
      {
        en: "Handover action failed",
        tr: "Devir teslim işlemi gerçekleştirilemedi",
      },
      {
        isEn: isEnHeader,
        logPrefix: "[Handover POST Error]",
        status: 500,
        allowedMessages: {
          UNAUTHORIZED: { en: "Unauthorized", tr: "Yetkisiz erişim", status: 403 },
          NOT_FOUND: { en: "Handover not found", tr: "Kayıt bulunamadı", status: 404 },
          VALIDATION_ERROR: { en: "Validation error", tr: "Doğrulama hatası", status: 400 },
          INSPECTION_PERIOD_EXPIRED: {
            en: "Inspection period expired",
            tr: "İnceleme süresi doldu",
            status: 400,
          },
          INVALID_STATE: { en: "Invalid handover state", tr: "Geçersiz devir durumu", status: 400 },
        },
      }
    );
  }
}
