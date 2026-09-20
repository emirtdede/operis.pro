import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { RunbookService } from "@/src/modules/engagements/runbook-service";
import { RunbookGeneratorService } from "@/src/modules/contracts/runbook-generator";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "markdown";
  const lang = (url.searchParams.get("lang") || "tr") as "tr" | "en";
  const isEn = lang === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:runbook:export:get",
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
    const { runbook } = await RunbookService.getRunbook(engagementId, session.userId);

    const generated = RunbookGeneratorService.generateRunbook({
      engagementId,
      listingTitle: "Proje Devir Kılavuzu",
      clientName: "İşveren",
      contractorName: "Yüklenici",
      status: runbook.status,
      version: runbook.version,
      architectureSummary: runbook.architectureSummary,
      environmentVariables: runbook.environmentVariables,
      buildAndRunSteps: runbook.buildAndRunSteps,
      thirdPartyServices: runbook.thirdPartyServices,
      disasterRecoverySteps: runbook.disasterRecoverySteps,
      backupSchedule: runbook.backupSchedule,
      emergencyContact: runbook.emergencyContact,
      publishedAt: runbook.publishedAt,
      locale: lang,
    });

    const engagementShort = engagementId.slice(0, 8);

    if (format === "json") {
      return new NextResponse(JSON.stringify(generated, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="operis-runbook-${engagementShort}.json"`,
        },
      });
    }

    if (format === "html") {
      return new NextResponse(generated.htmlContent, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    // Default: Markdown attachment
    return new NextResponse(generated.markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="operis-runbook-${engagementShort}.md"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to export runbook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
