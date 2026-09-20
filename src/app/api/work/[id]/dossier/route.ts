import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { DossierService } from "@/src/modules/contracts/dossier-service";
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
    purpose: "work:dossier:export",
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
        {
          error: isEnHeader
            ? "Unauthorized. Please sign in."
            : "Oturum açmanız gerekmektedir.",
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const url = new URL(req.url);
    const lang = url.searchParams.get("lang") === "en" ? "en" : "tr";
    const format = url.searchParams.get("format") || "zip";

    const dossier = await DossierService.buildDossier({
      engagementId: id,
      requestingUserId: session.userId,
      locale: lang,
    });

    if (format === "html") {
      return new Response(dossier.unifiedHtml, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    if (format === "json") {
      return NextResponse.json({
        success: true,
        manifest: dossier.manifest,
      });
    }

    // Default: Binary .zip download
    const filename = `Operis_HMK193_Delil_Dosyasi_${dossier.manifest.dossierRef}.zip`;
    return new Response(new Uint8Array(dossier.zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to export evidentiary dossier";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
