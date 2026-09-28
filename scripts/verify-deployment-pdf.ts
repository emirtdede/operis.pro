import { chromium } from "@playwright/test";
import { SESSION_COOKIE_NAME } from "../src/modules/auth/session";
/**
 * Operis — Post-Deployment PDF Runtime & Contract Fallback Smoke Verification Script
 *
 * Verifies that the deployed contract endpoint responds with HTTP 200 and valid PDF MIME type
 * or verified client-side print fallback in the target deployment environment.
 *
 * Rejects 401, 403, and 404 responses as strict failures to ensure unauthenticated or non-existent
 * stubs cannot falsely pass the deployment quality gate.
 *
 * Usage:
 *   pnpm tsx scripts/verify-deployment-pdf.ts --url <DEPLOYMENT_URL> --contract-id <ID> --token <AUTH_TOKEN>
 */

interface VerificationOptions {
  baseUrl: string;
  contractId: string;
  authToken: string;
}

function parseCliArgs(): VerificationOptions {
  const args = process.argv.slice(2);
  let baseUrl = process.env.APP_URL || "";
  let contractId = process.env.SMOKE_CONTRACT_ID || "";
  let authToken = process.env.SMOKE_AUTH_TOKEN || "";

  for (let i = 0; i < args.length; i++) {
    const nextArg = args[i + 1];
    if (args[i] === "--url" && nextArg) {
      baseUrl = nextArg;
      i++;
    } else if (args[i] === "--contract-id" && nextArg) {
      contractId = nextArg;
      i++;
    } else if (args[i] === "--token" && nextArg) {
      authToken = nextArg;
      i++;
    }
  }

  if (!baseUrl) {
    throw new Error("APP_URL or --url is required; no implicit localhost deployment target.");
  }

  if (!contractId || !authToken) {
    console.error("✗ [PDF Verification FAILED] Missing required target contract parameters.");
    console.error(
      "  Usage: pnpm tsx scripts/verify-deployment-pdf.ts --url <URL> --contract-id <ID> --token <SESSION_TOKEN>"
    );
    console.error("  Alternatively set SMOKE_CONTRACT_ID and SMOKE_AUTH_TOKEN in environment.");
    console.error(
      "  Fail-closed: A valid existing contract and authenticated session are required to verify production PDF generation."
    );
    process.exit(1);
  }

  const target = new URL(baseUrl);
  if (
    target.protocol !== "https:" &&
    !(target.protocol === "http:" && ["localhost", "127.0.0.1"].includes(target.hostname))
  )
    throw new Error("Use HTTPS for remote deployments.");
  if (target.username || target.password || target.search || target.hash || target.pathname !== "/")
    throw new Error("Deployment URL must be an origin without credentials, path or query.");
  return { baseUrl: baseUrl.replace(/\/$/, ""), contractId, authToken };
}

async function verifyPdfEndpoint() {
  const options = parseCliArgs();
  const targetUrl = `${options.baseUrl}/api/work/${encodeURIComponent(options.contractId)}/contract/pdf?lang=bilingual&download=true`;

  console.info(`[Smoke Test] Probing contract PDF endpoint: ${targetUrl}`);

  const headers: Record<string, string> = {
    Accept: "application/pdf, text/html",
    "x-locale": "tr",
    Authorization: `Bearer ${options.authToken}`,
    Cookie: `${SESSION_COOKIE_NAME}=${options.authToken}`,
  };

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(60000),
    });

    console.info(`[Smoke Test] Received HTTP Status: ${response.status}`);

    // Strictly fail if authentication, authorization, or contract existence failed
    if (response.status === 401) {
      throw new Error(
        `Authentication failed (401 Unauthorized). The provided session token is invalid or expired.`
      );
    }
    if (response.status === 403) {
      throw new Error(
        `Authorization failed (403 Forbidden). The session user is not a participant of this contract.`
      );
    }
    if (response.status === 404) {
      throw new Error(
        `Contract not found (404 Not Found). The contract ID '${options.contractId}' does not exist.`
      );
    }

    if (response.status !== 200) {
      const errText = await response.text().catch(() => "");
      throw new Error(
        `Unexpected HTTP status code: ${response.status} ${response.statusText}. Response body: ${errText.slice(0, 300)}`
      );
    }

    const contentType = response.headers.get("content-type") || "";
    const pdfFallback = response.headers.get("x-pdf-fallback");
    const sha256 = response.headers.get("x-contract-sha256");

    // 1. Direct Vector PDF Delivery
    if (contentType.includes("application/pdf")) {
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength < 1024) {
        throw new Error(
          `Generated PDF is suspiciously small (${buffer.byteLength} bytes). Expected valid vector contract document.`
        );
      }

      const header = Buffer.from(buffer.slice(0, 5)).toString("utf-8");
      if (!header.startsWith("%PDF-")) {
        throw new Error(`Invalid PDF magic header received: ${header}`);
      }

      console.info(
        `✓ [PDF Runtime Verified] Direct vector PDF stream verified successfully (${buffer.byteLength} bytes).`
      );
      if (sha256) {
        console.info(`✓ [Integrity] Contract SHA-256 seal present: ${sha256}`);
      }
      process.exit(0);
    }

    // 2. High-Fidelity Client-Side Print Fallback
    if (contentType.includes("text/html") && pdfFallback === "client-print") {
      const htmlText = await response.text();
      if (!htmlText.includes("window.print()") || htmlText.length < 1024) {
        throw new Error(
          `HTML print fallback response is incomplete (${htmlText.length} bytes) or missing window.print() directive.`
        );
      }

      const browser = await chromium.launch({ headless: true });
      try {
        const page = await browser.newPage();
        // Render the exact response with its CSP. Stub print to avoid an OS dialog.
        await page.addInitScript(() => {
          (window as Window & { __printCalled?: boolean }).__printCalled = false;
          window.print = () => {
            (window as Window & { __printCalled?: boolean }).__printCalled = true;
          };
        });
        await page.route("**/*", async (route) => {
          if (route.request().url() === targetUrl) {
            // fetch() already decompressed the body; do not replay stale wire metadata.
            const replayHeaders = Object.fromEntries(response.headers);
            delete replayHeaders["content-encoding"];
            delete replayHeaders["content-length"];
            await route.fulfill({
              status: 200,
              headers: replayHeaders,
              body: htmlText,
            });
          } else await route.abort();
        });
        await page.goto(targetUrl, { waitUntil: "load" });
        await page.waitForFunction(
          () => (window as Window & { __printCalled?: boolean }).__printCalled === true,
          {},
          { timeout: 10000 }
        );
        if ((await page.locator("body").innerText()).trim().length < 100)
          throw new Error("Printable contract body is missing");
        const printed = await page.pdf({ format: "A4" });
        if (printed.length < 1024) throw new Error("Print rendering produced an empty PDF");
      } finally {
        await browser.close();
      }
      console.info(
        `✓ [PDF Fallback Verified] Client-side high-fidelity print fallback verified successfully (${htmlText.length} characters).`
      );
      if (sha256) {
        console.info(`✓ [Integrity] Contract SHA-256 seal present: ${sha256}`);
      }
      process.exit(0);
    }

    throw new Error(
      `Unrecognized response format: Content-Type="${contentType}", X-PDF-Fallback="${pdfFallback}". Expected application/pdf or verified client-print fallback.`
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`✗ [Smoke Test FAILED]: ${errorMsg}`);
    process.exit(1);
  }
}

verifyPdfEndpoint();
