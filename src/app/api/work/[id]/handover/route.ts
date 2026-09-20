import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { HandoverService } from "@/src/modules/engagements/handover-service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: isEnHeader ? "Engagement not found or unauthorized." : "İş birliği bulunamadı veya erişim yetkiniz yok." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ...handoverData,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      const {
        repositoryUrl,
        commitHash,
        liveUrl,
        documentationNotes,
        accessChecklist,
      } = body;

      if (!repositoryUrl) {
        return NextResponse.json(
          { error: isEnHeader ? "Repository URL is required." : "Kaynak kod deposu URL'si zorunludur." },
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
    const message = error instanceof Error ? error.message : "Internal error";
    if (message.includes("UNAUTHORIZED")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes("NOT_FOUND")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes("VALIDATION_ERROR") || message.includes("INSPECTION_PERIOD_EXPIRED") || message.includes("INVALID_STATE")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
