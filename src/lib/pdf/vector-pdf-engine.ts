export interface VectorPdfOptions {
  format?: "A4" | "Letter";
  printBackground?: boolean;
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
}

export class VectorPdfEngine {
  private static cachedPdfMap = new Map<string, Buffer>();

  /**
   * Generates an official vector PDF buffer from HTML content using headless Chromium.
   */
  static async generateVectorPdf(
    htmlContent: string,
    cacheKey?: string,
    options?: VectorPdfOptions
  ): Promise<Buffer> {
    if (cacheKey) {
      const cached = this.cachedPdfMap.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Dynamic import to support environments gracefully
    const { chromium } = await import("@playwright/test");

    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=medium"],
    });

    try {
      const page = await browser.newPage({
        viewport: { width: 1200, height: 1600 },
      });

      await page.setContent(htmlContent, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });

      // Emulate print media for exact @media print styling and page breaks
      await page.emulateMedia({ media: "print" });

      const pdfBuffer = await page.pdf({
        format: options?.format || "A4",
        printBackground: options?.printBackground ?? true,
        margin: options?.margin || {
          top: "12mm",
          bottom: "16mm",
          left: "12mm",
          right: "12mm",
        },
        preferCSSPageSize: true,
      });

      if (cacheKey) {
        this.cachedPdfMap.set(cacheKey, pdfBuffer);
      }

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  /**
   * Clears in-memory PDF cache
   */
  static clearCache(): void {
    this.cachedPdfMap.clear();
  }
}
