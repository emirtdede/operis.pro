import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ContractSigningService } from "@/src/modules/contracts/contract-signing-service";
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
    purpose: "contract:package",
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
    const format = url.searchParams.get("format") || "json";

    const { packageDetails } = await ContractSigningService.getOrInitPackage(id, session.userId);

    if (format === "markdown" && packageDetails.compiledMarkdown) {
      return new NextResponse(packageDetails.compiledMarkdown, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="operis-signed-package-${id.slice(0, 8)}.md"`,
        },
      });
    }

    if (format === "html" && packageDetails.compiledHtml) {
      return new NextResponse(packageDetails.compiledHtml, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    return NextResponse.json({
      success: true,
      package: packageDetails,
    });
  } catch (err: unknown) {
    let message = isEnHeader
      ? "Failed to retrieve contract package."
      : "Sözleşme paketi alınamadı.";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
