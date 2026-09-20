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
    purpose: "work:handover:export",
    subject: normalizeIp(ip),
    limit: 60,
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
    const format = url.searchParams.get("format") || "markdown";

    const handoverData = await HandoverService.getHandover(session.userId, id, lang);
    if (!handoverData || !handoverData.protocol) {
      return NextResponse.json(
        { error: isEnHeader ? "Handover protocol not found or not submitted yet." : "Teslim tutanağı henüz oluşturulmamış veya erişim yetkiniz yok." },
        { status: 404 }
      );
    }

    const { protocol } = handoverData;

    if (format === "html") {
      return new Response(protocol.htmlContent, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    // Default: Markdown attachment
    const filename = `Operis_Teslim_Tutanagi_${protocol.protocolRef}.md`;
    return new Response(protocol.markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
