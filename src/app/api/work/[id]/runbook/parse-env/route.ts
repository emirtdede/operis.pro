import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { parseEnvExampleText, SecretLeakageDetector } from "@/src/modules/engagements/runbook-synthesizer";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function POST(
  req: Request,
  _context: { params: Promise<{ id: string }> }
) {
  const isEn = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:runbook:parse-env:post",
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

    const body = await req.json();
    const rawText = body.rawText || body.envText || "";

    // Security Anti-Leak Scan on raw input
    const scan = SecretLeakageDetector.scanForSecrets(rawText);
    if (scan.hasSecretLeakage) {
      return NextResponse.json(
        {
          error: "SECRET_LEAKAGE_DETECTED",
          message: isEn ? scan.warningEn : scan.warningTr,
          category: scan.leakedCategory,
        },
        { status: 422 }
      );
    }

    const parsedVars = parseEnvExampleText(rawText);

    return NextResponse.json({
      success: true,
      variables: parsedVars,
      environmentVariables: parsedVars,
      count: parsedVars.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to parse environment variables";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
