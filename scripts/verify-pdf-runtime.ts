/**
 * Operis — Headless Chromium & Vector PDF Runtime Verification Utility
 *
 * Verifies that the headless Chromium browser runtime is operational for
 * server-side vector PDF generation in the deployment artifact.
 *
 * Usage:
 *   pnpm tsx scripts/verify-pdf-runtime.ts [--strict]
 */

import { VectorPdfEngine } from "../src/lib/pdf/vector-pdf-engine";

async function main() {
  const allowFallback = process.argv.includes("--allow-fallback");
  const isStrict = !allowFallback;

  console.info("[PDF Runtime] Probing headless Chromium availability...");

  const sampleHtml = `
    <!DOCTYPE html>
    <html lang="tr">
      <head>
        <meta charset="utf-8">
        <title>Runtime Test</title>
        <style>body { font-family: sans-serif; padding: 20px; }</style>
      </head>
      <body>
        <h1>Operis Sözleşme Test Belgesi</h1>
        <p>Headless Chromium PDF motoru doğrulama çıktısı.</p>
      </body>
    </html>
  `;

  try {
    const startTime = Date.now();
    const pdfBuffer = await VectorPdfEngine.generateVectorPdf(
      sampleHtml,
      `test-probe-${Date.now()}`
    );
    const elapsedMs = Date.now() - startTime;

    if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length < 100) {
      throw new Error(
        `Generated PDF buffer is invalid or unexpectedly small (${pdfBuffer.length} bytes)`
      );
    }

    // Verify PDF header %PDF-
    const header = pdfBuffer.subarray(0, 5).toString("utf-8");
    if (!header.startsWith("%PDF-")) {
      throw new Error(
        `Generated buffer does not start with valid PDF magic header (received: ${header})`
      );
    }

    console.info(
      `✓ [PDF Runtime OK] Chromium vector PDF generation succeeded in ${elapsedMs}ms (${pdfBuffer.length} bytes).`
    );
    process.exit(0);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    if (isStrict) {
      console.error(
        `✗ [PDF Runtime FAILED] Chromium is not operational in this environment: ${errorMessage}`
      );
      process.exit(1);
    } else {
      console.warn(
        `ℹ [PDF Runtime NOTICE] Headless Chromium is not available in current environment: ${errorMessage}`
      );
      console.warn(
        "ℹ Operis contracts will gracefully use high-fidelity client-side print fallback (X-PDF-Fallback: client-print)."
      );
      process.exit(0);
    }
  }
}

main();
