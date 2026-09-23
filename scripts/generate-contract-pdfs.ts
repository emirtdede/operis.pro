import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const DIR = path.resolve(process.cwd(), "docs", "sozlesme-ornekleri");

async function generateAllPdfs() {
  if (!fs.existsSync(DIR)) {
    console.error("Hedef klasör bulunamadı:", DIR);
    process.exit(1);
  }

  const htmlFiles = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".html"))
    .sort();

  console.info(`🚀 Toplam ${htmlFiles.length} adet sözleşme HTML dosyasından resmi A4 vektörel PDF üretiliyor...`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=medium"],
  });

  const page = await browser.newPage({
    viewport: { width: 1200, height: 1600 },
  });

  async function processFile(i: number): Promise<void> {
    if (i >= htmlFiles.length) return;
    const htmlFile = htmlFiles[i];
    if (!htmlFile) {
      await processFile(i + 1);
      return;
    }
    const pdfFile = htmlFile.replace(/\.html$/, ".pdf");
    const htmlPath = path.join(DIR, htmlFile);
    const pdfPath = path.join(DIR, pdfFile);

    console.info(`[${i + 1}/${htmlFiles.length}] PDF'e dönüştürülüyor: ${pdfFile}...`);

    const fileUrl = `file:///${htmlPath.replace(/\\/g, "/")}`;
    await page.goto(fileUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.emulateMedia({ media: "print" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "12mm",
        bottom: "16mm",
        left: "12mm",
        right: "12mm",
      },
    });

    fs.writeFileSync(pdfPath, pdfBuffer);
    await processFile(i + 1);
  }

  await processFile(0);

  await browser.close();
  console.info(`\n✅ BAŞARILI: ${htmlFiles.length} adet resmi PDF dosyası '${DIR}' klasörüne kaydedildi!`);
}

generateAllPdfs().catch((err) => {
  console.error("PDF oluşturma hatası:", err);
  process.exit(1);
});
