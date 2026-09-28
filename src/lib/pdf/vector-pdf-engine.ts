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

interface CacheEntry {
  buffer: Buffer;
  createdAt: number;
}

const MAX_CACHED_PDFS = 50;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL
const MAX_CONCURRENT_PDF_JOBS = 3;

let activePdfJobs = 0;
const pdfWaitQueue: Array<() => void> = [];

async function acquirePdfSlot(): Promise<() => void> {
  if (activePdfJobs < MAX_CONCURRENT_PDF_JOBS) {
    activePdfJobs++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      activePdfJobs--;
      const next = pdfWaitQueue.shift();
      if (next) next();
    };
  }

  return new Promise<() => void>((resolve) => {
    pdfWaitQueue.push(() => {
      activePdfJobs++;
      let released = false;
      resolve(() => {
        if (released) return;
        released = true;
        activePdfJobs--;
        const next = pdfWaitQueue.shift();
        if (next) next();
      });
    });
  });
}

export class VectorPdfEngine {
  private static cachedPdfMap = new Map<string, CacheEntry>();

  private static pruneCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cachedPdfMap.entries()) {
      if (now - entry.createdAt > CACHE_TTL_MS) {
        this.cachedPdfMap.delete(key);
      }
    }

    if (this.cachedPdfMap.size >= MAX_CACHED_PDFS) {
      // Evict oldest entries
      const oldestKeys = Array.from(this.cachedPdfMap.entries())
        .sort((a, b) => a[1].createdAt - b[1].createdAt)
        .slice(0, 10)
        .map(([k]) => k);

      for (const k of oldestKeys) {
        this.cachedPdfMap.delete(k);
      }
    }
  }

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
      if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
        return cached.buffer;
      }
    }

    const releaseSlot = await acquirePdfSlot();
    try {
      // Dynamic import to support environments gracefully without breaking serverless webpack bundle
      const pkgName = "@playwright/test";
      const { chromium } = await import(/* webpackIgnore: true */ pkgName).catch(() => ({
        chromium: null,
      }));

      if (!chromium || typeof chromium.launch !== "function") {
        throw new Error("Headless Chromium is not available in serverless execution environment.");
      }

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
          this.pruneCache();
          this.cachedPdfMap.set(cacheKey, {
            buffer: pdfBuffer,
            createdAt: Date.now(),
          });
        }

        return pdfBuffer;
      } finally {
        await browser.close();
      }
    } finally {
      releaseSlot();
    }
  }

  /**
   * Clears in-memory PDF cache
   */
  static clearCache(): void {
    this.cachedPdfMap.clear();
  }
}
