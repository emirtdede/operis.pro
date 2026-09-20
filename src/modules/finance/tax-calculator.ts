/**
 * Freelance Tax & Withholding Calculator Engine (Operis Finance Module)
 *
 * Turkish Tax Legislation Compliance:
 * - GVK (Gelir Vergisi Kanunu) m. 94/2-b: Serbest Meslek Kazançlarında %20 Gelir Vergisi Tevkifatı (Stopaj).
 * - KDVK (Katma Değer Vergisi Kanunu): Serbest Meslek ve Bilişim Hizmetlerinde %20 Genel KDV Oranı.
 * - KDV Genel Uygulama Tebliği: Kısmi KDV Tevkifatı (9/10 Danışmanlık veya 5/10 Bakım/Onarım - Belirlenmiş Alıcılar).
 * - VUK (Vergi Usul Kanunu): Kuruş ve yuvarlama standartları.
 */

export type ClientTaxType = "CORPORATE" | "INDIVIDUAL";

export type InvoiceDocumentType = "SMM" | "E_FATURA" | "GIDER_PUSULASI";

import type { SoftwareExportConfig, SoftwareExportEvaluation } from "./software-export-types";
import { SoftwareExportEngine } from "./software-export-engine";
import { TaxMath } from "./tax-math";

const CURRENCY_SYMBOLS: Record<string, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
};

export function resolveCurrencySymbol(currency: string | null | undefined): string {
  if (!currency) return "₺";
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

export type CalculationDirection = "NET_TO_GROSS" | "GROSS_TO_NET";

export type VatWithholdingFraction = "NONE" | "9_10" | "5_10";

export interface TaxCalculationInput {
  amount: number;
  direction: CalculationDirection;
  clientType: ClientTaxType;
  documentType: InvoiceDocumentType;
  currency?: string; // Default: 'TRY'
  vatWithholding?: VatWithholdingFraction; // Default: 'NONE'
  isSoftwareExport?: boolean; // Default: auto-detected if currency is FX (USD, EUR, etc.)
  exportConfig?: SoftwareExportConfig | null;
}

export interface TaxCalculationOutput {
  targetAmount: number;
  direction: CalculationDirection;
  clientType: ClientTaxType;
  documentType: InvoiceDocumentType;
  currency: string;
  isSoftwareExport?: boolean;
  softwareExportEvaluation?: SoftwareExportEvaluation | null;
  // Core financial values (rounded to 2 decimal places)
  grossAmount: number; // Brüt Sözleşme / Fatura Bedeli
  withholdingRate: number; // Stopaj Oranı (örn: 0.20 veya 0)
  withholdingAmount: number; // Stopaj Tutarı (Müşterinin muhtasar ile devlete ödeyeceği)
  netTakeHome: number; // Freelancer'ın cebine kalan net kazanç (Brüt - Stopaj)
  vatRate: number; // KDV Oranı (örn: 0.20 veya 0)
  vatTotalAmount: number; // Toplam KDV Tutarı
  vatWithheldByClient: number; // Alıcı şirketin tevkif ettiği KDV payı
  vatPayableToFreelancer: number; // Freelancer'a ödenen KDV payı
  totalCashToFreelancer: number; // Freelancer banka hesabına geçen toplam havale (Net + KDV)
  totalCostToClient: number; // İşverenin toplam nakit çıkışı (Brüt + KDV)
  netCostToClient: number; // İşverenin net maliyeti (KDV indirimi sonrası = Brüt)
  // Convenience aliases
  vatAmount?: number;
  netCashInHand?: number;
  invoiceTotal?: number;
  // Clarification notes & disclaimers
  disclaimerTr: string;
  disclaimerEn: string;
  proposalNoteTr: string;
  proposalNoteEn: string;
}

/**
 * Deterministically rounds a financial value to two decimal places (kuruş).
 * Avoids IEEE-754 floating point precision issues.
 */
export function roundCurrency(value: number): number {
  if (!Number.isFinite(value) || isNaN(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates statutory tax breakdown for Turkish freelance engagements.
 */
export function calculateFreelanceTax(input: TaxCalculationInput): TaxCalculationOutput {
  const currency = input.currency || "TRY";
  const rawAmount = Math.max(0, input.amount || 0);
  const amount = roundCurrency(rawAmount);
  const direction = input.direction;
  const clientType = input.clientType;
  const documentType = input.documentType;
  const vatWithholding = input.vatWithholding || "NONE";
  const isExport = Boolean(
    input.isSoftwareExport === true || (input.exportConfig && input.exportConfig.enabled)
  );

  // Determine Withholding (Stopaj) rate
  // For cross-border software export, foreign clients have no GVK 94 withholding obligation in Turkey (0%).
  // SMM: 20% if client is corporate; 0% if individual (nihai tüketici)
  // E_FATURA (Commercial company): 0% stopaj regardless of client
  // GIDER_PUSULASI (Unregistered individual): 10% (GVK 94/13) or 20%
  let withholdingRate = 0;
  if (isExport) {
    withholdingRate = 0;
  } else if (documentType === "SMM") {
    withholdingRate = clientType === "CORPORATE" ? 0.2 : 0;
  } else if (documentType === "E_FATURA") {
    withholdingRate = 0;
  } else if (documentType === "GIDER_PUSULASI") {
    withholdingRate = clientType === "CORPORATE" ? 0.1 : 0;
  }

  // Determine VAT (KDV) rate
  // For software export: 0% VAT (3065 s. KDVK m. 11/1-a Kod 302)
  // SMM and E_FATURA: 20%
  // GIDER_PUSULASI: 0% (KDV mükellefiyeti yoktur)
  let vatRate = 0.2;
  if (isExport || documentType === "GIDER_PUSULASI") {
    vatRate = 0;
  }

  let grossKurus = 0n;
  let netKurus = 0n;
  let withholdingKurus = 0n;

  const inputKurus = TaxMath.toKurus(amount);

  if (direction === "NET_TO_GROSS") {
    netKurus = inputKurus;
    if (withholdingRate >= 1) {
      grossKurus = netKurus;
      withholdingKurus = 0n;
    } else if (withholdingRate > 0) {
      const res = TaxMath.grossFromNetKurus(netKurus, withholdingRate);
      grossKurus = res.grossKurus;
      withholdingKurus = res.withholdingKurus;
    } else {
      grossKurus = netKurus;
      withholdingKurus = 0n;
    }
  } else {
    grossKurus = inputKurus;
    const res = TaxMath.netFromGrossKurus(grossKurus, withholdingRate);
    netKurus = res.netTakeHomeKurus;
    withholdingKurus = res.withholdingKurus;
  }

  // Calculate VAT with exact kuruş tevkifat split
  let vatFraction: "NONE" | "9_10" | "5_10" = "NONE";
  if (vatWithholding === "9_10" || vatWithholding === "5_10") {
    vatFraction = vatWithholding;
  }
  const vatRes = TaxMath.calcVatBreakdownKurus(grossKurus, vatRate, vatFraction);

  const totalCashKurus = netKurus + vatRes.vatPayableToFreelancerKurus;
  const totalCostKurus = grossKurus + vatRes.vatTotalKurus;

  // Convert exact kuruş values to 2-decimal rounded outputs
  const grossAmount = TaxMath.fromKurus(grossKurus);
  const withholdingAmount = TaxMath.fromKurus(withholdingKurus);
  const netTakeHome = TaxMath.fromKurus(netKurus);
  const vatTotalAmount = TaxMath.fromKurus(vatRes.vatTotalKurus);
  const vatWithheldByClient = TaxMath.fromKurus(vatRes.vatWithheldByClientKurus);
  const vatPayableToFreelancer = TaxMath.fromKurus(vatRes.vatPayableToFreelancerKurus);
  const totalCashToFreelancer = TaxMath.fromKurus(totalCashKurus);
  const totalCostToClient = TaxMath.fromKurus(totalCostKurus);
  const netCostToClient = grossAmount; // Client offsets VAT in their KDV return

  // Format currency symbol
  const symbol = resolveCurrencySymbol(currency);

  // Format numbers for strings (TR: 1.234,56)
  const fmt = (val: number) =>
    val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Generate official proposal note
  let proposalNoteTr = "";
  let proposalNoteEn = "";

  if (isExport) {
    proposalNoteTr = `[Yazılım Hizmet İhracatı Şerhi: İşbu teklif ${fmt(grossAmount)} ${symbol} Net Bedel üzerinden sunulmuş olup, 3065 sayılı KDVK m. 11/1-a (GİB İstisna Kodu 302) kapsamında %0 KDV ile faturalandırılacaktır. 193 sayılı GVK m. 89/13 uyarınca dövizin Türkiye'deki banka hesabına transfer edilmesi şartıyla kazancın %100'ü gelir/kurumlar vergisinden indirilecektir.]`;
    proposalNoteEn = `[Software Export Notice: This proposal is submitted at ${fmt(grossAmount)} ${symbol} Net, qualifying for 0% VAT under Statutory Exemption Code 302 (KDVK Art. 11/1-a). 100% of repatriated earnings are eligible for statutory income/corporate tax deduction under GVK Art. 89/13.]`;
  } else if (clientType === "CORPORATE" && withholdingRate > 0) {
    proposalNoteTr = `[Bütçe ve Stopaj Şerhi: İşbu teklif ${fmt(grossAmount)} ${symbol} Brüt tutar üzerinden sunulmuş olup, kurumsal müşteri için %${Math.round(
      withholdingRate * 100
    )} stopaj kesintisi (${fmt(withholdingAmount)} ${symbol}) sonrası net ${fmt(
      netTakeHome
    )} ${symbol} hakediş esasına dayanmaktadır. %${Math.round(
      vatRate * 100
    )} KDV (${fmt(vatTotalAmount)} ${symbol}) ayrıca faturalandırılacaktır.]`;

    proposalNoteEn = `[Tax & Withholding Notice: This proposal is submitted at ${fmt(
      grossAmount
    )} ${symbol} Gross, yielding a net fee of ${fmt(netTakeHome)} ${symbol} after ${Math.round(
      withholdingRate * 100
    )}% corporate withholding tax (${fmt(withholdingAmount)} ${symbol}). ${Math.round(
      vatRate * 100
    )}% VAT (${fmt(vatTotalAmount)} ${symbol}) is billed additionally.]`;
  } else {
    proposalNoteTr = `[Bütçe Şerhi: İşbu teklif ${fmt(grossAmount)} ${symbol} bedel üzerinden sunulmuş olup, %${Math.round(
      vatRate * 100
    )} KDV (${fmt(vatTotalAmount)} ${symbol}) dahil toplam tahsilat ${fmt(
      totalCashToFreelancer
    )} ${symbol}'dir.]`;

    proposalNoteEn = `[Budget Notice: This proposal is submitted for ${fmt(
      grossAmount
    )} ${symbol} service fee; total collection including ${Math.round(
      vatRate * 100
    )}% VAT (${fmt(vatTotalAmount)} ${symbol}) is ${fmt(totalCashToFreelancer)} ${symbol}.]`;
  }

  // Generate explanatory disclaimer
  let disclaimerTr = `Bireysel müşteriler için stopaj kesintisi uygulanmaz. Hesabınıza ${fmt(
    totalCashToFreelancer
  )} ${symbol} yatar (${fmt(vatTotalAmount)} ${symbol} KDV emanet vergi hariç net hakedişiniz ${fmt(
    netTakeHome
  )} ${symbol}'dir).`;

  if (isExport) {
    disclaimerTr = `Yurt dışı mukimi müşteriye verilen ve münhasıran yurt dışında yararlanılan yazılım hizmetlerinde KDV oranı %0'dır (GİB İstisna Kodu 302). Stopaj kesintisi uygulanmaz. Hasılatın tamamının Türkiye'deki bankalara getirilmesi durumunda 193 sayılı GVK m. 89/13 uyarınca kazancınızın %100'ü gelir/kurumlar vergisinden indirilir. Cebinize kalan net harcanabilir kazancınız ${fmt(netTakeHome)} ${symbol}'dir.`;
  } else if (clientType === "CORPORATE" && withholdingRate > 0) {
    disclaimerTr = `GVK m. 94 uyarınca kurumsal şirket ${fmt(withholdingAmount)} ${symbol} stopajı sizin adınıza muhtasar beyanname ile devlete öder. Banka hesabınıza ${fmt(
      totalCashToFreelancer
    )} ${symbol} yatar; ancak bunun ${fmt(
      vatPayableToFreelancer
    )} ${symbol} tutarındaki KDV kısmı emanettir ve 1 No.lu KDV beyannameniz ile devlete iletilecektir. Cebinize kalan net harcanabilir kazancınız ${fmt(
      netTakeHome
    )} ${symbol}'dir.`;
  }

  let disclaimerEn = `No withholding tax applies to individual clients. Total receipt is ${fmt(
    totalCashToFreelancer
  )} ${symbol} (net fee of ${fmt(netTakeHome)} ${symbol} plus ${fmt(
    vatTotalAmount
  )} ${symbol} VAT).`;

  if (isExport) {
    disclaimerEn = `Software engineering delivered to a non-resident foreign client for extraterritorial use qualifies for 0% VAT under GİB Code 302. No Turkish withholding tax applies. Repatriating proceeds into Turkish bank accounts allows 100% deduction under GVK Art. 89/13. Net take-home is ${fmt(netTakeHome)} ${symbol}.`;
  } else if (clientType === "CORPORATE" && withholdingRate > 0) {
    disclaimerEn = `Under GVK Art. 94, the corporate client pays ${fmt(
      withholdingAmount
    )} ${symbol} withholding directly to the tax revenue office on your behalf. Your bank receives ${fmt(
      totalCashToFreelancer
    )} ${symbol}; the ${fmt(
      vatPayableToFreelancer
    )} ${symbol} VAT portion must be remitted via your VAT return. Your net spendable earnings are ${fmt(
      netTakeHome
    )} ${symbol}.`;
  }

  const softwareExportEvaluation = isExport
    ? SoftwareExportEngine.evaluateExportEligibility(
        input.exportConfig || SoftwareExportEngine.getDefaultConfig(currency),
        currency,
        input.exportConfig?.clientCountryCode || "US",
        grossAmount
      )
    : null;

  return {
    targetAmount: amount,
    direction,
    clientType,
    documentType,
    currency,
    isSoftwareExport: isExport,
    softwareExportEvaluation,
    grossAmount,
    withholdingRate,
    withholdingAmount,
    netTakeHome,
    vatRate,
    vatTotalAmount,
    vatWithheldByClient,
    vatPayableToFreelancer,
    totalCashToFreelancer,
    totalCostToClient,
    netCostToClient,
    vatAmount: vatTotalAmount,
    netCashInHand: netTakeHome,
    invoiceTotal: totalCostToClient,
    disclaimerTr,
    disclaimerEn,
    proposalNoteTr,
    proposalNoteEn,
  };
}

/**
 * Robustly parses a budget label string (e.g. "75.000 TL", "50,000 TRY", "62.500,00 ₺", "$5,000", "100000")
 * into a numeric value and currency code. Returns null if no valid number is present.
 */
export function parseBudgetAmount(
  budgetStr: string | null | undefined
): { numericAmount: number; currency: string } | null {
  if (!budgetStr || typeof budgetStr !== "string") return null;
  const trimmed = budgetStr.trim();
  if (!trimmed) return null;

  // Detect currency
  let currency = "TRY";
  if (trimmed.includes("$") || trimmed.toUpperCase().includes("USD")) {
    currency = "USD";
  } else if (trimmed.includes("€") || trimmed.toUpperCase().includes("EUR")) {
    currency = "EUR";
  } else if (trimmed.includes("£") || trimmed.toUpperCase().includes("GBP")) {
    currency = "GBP";
  }

  // Remove currency signs, letters, and extraneous spaces
  const cleaned = trimmed.replace(/[^0-9.,]/g, "");
  if (!cleaned) return null;

  let numericVal = 0;
  if (cleaned.includes(".") && cleaned.includes(",")) {
    const dotIdx = cleaned.indexOf(".");
    const commaIdx = cleaned.indexOf(",");
    if (dotIdx < commaIdx) {
      // 75.000,50
      const standard = cleaned.replace(/\./g, "").replace(",", ".");
      numericVal = parseFloat(standard);
    } else {
      // 75,000.50
      const standard = cleaned.replace(/,/g, "");
      numericVal = parseFloat(standard);
    }
  } else if (cleaned.includes(".")) {
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      // Multiple dots: e.g. "1.000.000" -> thousand separators
      numericVal = parseFloat(cleaned.replace(/\./g, ""));
    } else if (parts[1] && parts[1].length === 3) {
      // Single dot followed by exactly 3 digits: e.g. "75.000" -> thousand separator in TR
      numericVal = parseFloat(cleaned.replace(/\./g, ""));
    } else {
      numericVal = parseFloat(cleaned);
    }
  } else if (cleaned.includes(",")) {
    const parts = cleaned.split(",");
    if (parts.length > 2) {
      numericVal = parseFloat(cleaned.replace(/,/g, ""));
    } else if (parts[1] && parts[1].length === 3) {
      numericVal = parseFloat(cleaned.replace(/,/g, ""));
    } else {
      numericVal = parseFloat(cleaned.replace(",", "."));
    }
  } else {
    numericVal = parseFloat(cleaned);
  }

  if (isNaN(numericVal) || numericVal <= 0) return null;
  return { numericAmount: roundCurrency(numericVal), currency };
}

/**
 * Generates an official statutory tax breakdown table in Markdown format for TBK m. 470 contracts.
 */
export function generateContractTaxMarkdownTable(
  output: TaxCalculationOutput,
  isTr: boolean = true
): string {
  const symbol = resolveCurrencySymbol(output.currency);

  const fmt = (val: number) =>
    val.toLocaleString(isTr ? "tr-TR" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (isTr) {
    return [
      `| Yasal Dayanak & Finansal Kalem | Oran / Statü | Tutar | Hukuki ve Mali Hüküm |`,
      `| :--- | :--- | :--- | :--- |`,
      `| **1. Kararlaştırılan Brüt Hizmet Bedeli** | Sözleşme Esası | **${fmt(output.grossAmount)} ${symbol}** | Taraflarca mutabık kalınan brüt hakediş bedeli. |`,
      `| **2. GVK m. 94/2-b Stopaj Tevkifatı** | %${Math.round(output.withholdingRate * 100)} | **-${fmt(output.withholdingAmount)} ${symbol}** | İş Sahibi tarafından doğrudan muhtasar beyanname ile vergi dairesine ödenir. |`,
      `| **3. Net Serbest Meslek Kazancı** | Net Hakediş | **${fmt(output.netTakeHome)} ${symbol}** | Yüklenicinin brüt bedelden stopaj düşüldükten sonraki net kazancı. |`,
      `| **4. Katma Değer Vergisi (KDVK)** | %${Math.round(output.vatRate * 100)} | **+${fmt(output.vatTotalAmount)} ${symbol}** | Yükleniciye emaneten ödenir; 1 No.lu KDV beyannamesi ile devlete iletilir. |`,
      `| **5. Banka Havalesi ile Yükleniciye Ödenecek** | Net + KDV | **${fmt(output.totalCashToFreelancer)} ${symbol}** | İş Sahibi tarafından Yüklenici banka hesabına havale/EFT yapılacak tutar. |`,
      `| **6. İş Sahibinin Toplam Nakit Maliyeti** | Brüt + KDV | **${fmt(output.totalCostToClient)} ${symbol}** | Banka havalesi + Muhtasar vergi dairesi stopajı toplam nakit çıkışı. |`,
    ].join("\n");
  }

  return [
    `| Statutory Item & Reference | Rate / Basis | Amount | Tax & Settlement Notice |`,
    `| :--- | :--- | :--- | :--- |`,
    `| **1. Agreed Gross Service Fee** | Contract Basis | **${fmt(output.grossAmount)} ${symbol}** | Bilaterally agreed gross contractual consideration. |`,
    `| **2. Income Tax Withholding (GVK Art. 94)** | ${Math.round(output.withholdingRate * 100)}% | **-${fmt(output.withholdingAmount)} ${symbol}** | Remitted directly to tax office by Client via withholding return. |`,
    `| **3. Net Professional Earnings** | Net Entitlement | **${fmt(output.netTakeHome)} ${symbol}** | Contractor net earnings after statutory tax withholding. |`,
    `| **4. Value Added Tax (VAT)** | ${Math.round(output.vatRate * 100)}% | **+${fmt(output.vatTotalAmount)} ${symbol}** | Fiduciary payment to Contractor; remitted via statutory VAT return. |`,
    `| **5. Direct Bank Wire Settlement** | Net + VAT | **${fmt(output.totalCashToFreelancer)} ${symbol}** | Total cash wired directly into Contractor bank account. |`,
    `| **6. Total Client Cash Outflow** | Gross + VAT | **${fmt(output.totalCostToClient)} ${symbol}** | Direct wire settlement + tax revenue withholding remittance. |`,
  ].join("\n");
}

/**
 * Generates an official statutory tax breakdown table in clean HTML format for printable PDF contracts.
 */
export function generateContractTaxHtmlTable(
  output: TaxCalculationOutput,
  isTr: boolean = true
): string {
  const symbol = resolveCurrencySymbol(output.currency);

  const fmt = (val: number) =>
    val.toLocaleString(isTr ? "tr-TR" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (isTr) {
    return `
<div class="tax-breakdown-table" style="margin: 14px 0; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; break-inside: avoid; page-break-inside: avoid;">
  <div style="background-color: #f1f5f9; padding: 8px 12px; font-weight: 700; font-size: 11px; color: #0f172a; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; break-after: avoid-page; page-break-after: avoid;">
    <span>YASAL VERGİ VE ÖDEME DAĞILIM TABLOSU (GVK m. 94 & KDVK)</span>
    <span style="font-family: monospace; color: #0284c7;">RESMİ HESAPLAMA</span>
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 11px; line-height: 1.4;">
    <thead style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
      <tr>
        <th style="padding: 6px 10px; text-align: left; color: #475569;">Finansal Kalem</th>
        <th style="padding: 6px 10px; text-align: center; color: #475569;">Oran</th>
        <th style="padding: 6px 10px; text-align: right; color: #475569;">Tutar</th>
        <th style="padding: 6px 10px; text-align: left; color: #475569;">Açıklama</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
        <td style="padding: 6px 10px; font-weight: 600; color: #0f172a;">1. Brüt Hizmet Bedeli</td>
        <td style="padding: 6px 10px; text-align: center; color: #64748b;">Brüt</td>
        <td style="padding: 6px 10px; text-align: right; font-weight: 700; font-family: monospace; color: #0f172a;">${fmt(output.grossAmount)} ${symbol}</td>
        <td style="padding: 6px 10px; color: #64748b;">Sözleşmede kararlaştırılan brüt bedel</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: #fffbeb;">
        <td style="padding: 6px 10px; font-weight: 600; color: #b45309;">2. GVK m. 94/2-b Stopaj Tevkifatı</td>
        <td style="padding: 6px 10px; text-align: center; color: #b45309;">%${Math.round(output.withholdingRate * 100)}</td>
        <td style="padding: 6px 10px; text-align: right; font-weight: 700; font-family: monospace; color: #b45309;">-${fmt(output.withholdingAmount)} ${symbol}</td>
        <td style="padding: 6px 10px; color: #92400e;">İş Sahibi muhtasar ile doğrudan vergi dairesine öder</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f0fdf4;">
        <td style="padding: 6px 10px; font-weight: 600; color: #15803d;">3. Net Serbest Meslek Kazancı</td>
        <td style="padding: 6px 10px; text-align: center; color: #15803d;">Net</td>
        <td style="padding: 6px 10px; text-align: right; font-weight: 700; font-family: monospace; color: #15803d;">${fmt(output.netTakeHome)} ${symbol}</td>
        <td style="padding: 6px 10px; color: #166534;">Yüklenicinin harcanabilir net kazancı (Brüt - Stopaj)</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: #eff6ff;">
        <td style="padding: 6px 10px; font-weight: 600; color: #1d4ed8;">4. Katma Değer Vergisi (KDV)</td>
        <td style="padding: 6px 10px; text-align: center; color: #1d4ed8;">%${Math.round(output.vatRate * 100)}</td>
        <td style="padding: 6px 10px; text-align: right; font-weight: 700; font-family: monospace; color: #1d4ed8;">+${fmt(output.vatTotalAmount)} ${symbol}</td>
        <td style="padding: 6px 10px; color: #1e40af;">Yükleniciye emanet ödenir; KDV-1 ile devlete iletilir</td>
      </tr>
      <tr style="border-bottom: 1px solid #cbd5e1; background-color: #f8fafc;">
        <td style="padding: 8px 10px; font-weight: 700; color: #0f172a;">5. Banka Havalesi ile Ödenecek Tutar</td>
        <td style="padding: 8px 10px; text-align: center; font-weight: 600;">Net + KDV</td>
        <td style="padding: 8px 10px; text-align: right; font-weight: 700; font-family: monospace; font-size: 12px; color: #0f172a;">${fmt(output.totalCashToFreelancer)} ${symbol}</td>
        <td style="padding: 8px 10px; font-weight: 600; color: #334155;">İş Sahibinin Yüklenici IBAN'ına göndereceği nakit</td>
      </tr>
      <tr style="background-color: #f1f5f9;">
        <td style="padding: 6px 10px; font-weight: 600; color: #475569;">6. İş Sahibinin Toplam Maliyeti</td>
        <td style="padding: 6px 10px; text-align: center; color: #64748b;">Brüt + KDV</td>
        <td style="padding: 6px 10px; text-align: right; font-weight: 700; font-family: monospace; color: #475569;">${fmt(output.totalCostToClient)} ${symbol}</td>
        <td style="padding: 6px 10px; color: #64748b;">Banka Havalesi + Vergi Dairesi Stopajı</td>
      </tr>
    </tbody>
  </table>
</div>
`;
  }

  return `
<div class="tax-breakdown-table" style="margin: 14px 0; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; break-inside: avoid; page-break-inside: avoid;">
  <div style="background-color: #f1f5f9; padding: 8px 12px; font-weight: 700; font-size: 11px; color: #0f172a; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; break-after: avoid-page; page-break-after: avoid;">
    <span>STATUTORY TAX & PAYMENT BREAKDOWN TABLE</span>
    <span style="font-family: monospace; color: #0284c7;">OFFICIAL SETTLEMENT</span>
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 11px; line-height: 1.4;">
    <thead style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
      <tr>
        <th style="padding: 6px 10px; text-align: left; color: #475569;">Financial Item</th>
        <th style="padding: 6px 10px; text-align: center; color: #475569;">Rate</th>
        <th style="padding: 6px 10px; text-align: right; color: #475569;">Amount</th>
        <th style="padding: 6px 10px; text-align: left; color: #475569;">Notice</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
        <td style="padding: 6px 10px; font-weight: 600; color: #0f172a;">1. Agreed Gross Service Fee</td>
        <td style="padding: 6px 10px; text-align: center; color: #64748b;">Gross</td>
        <td style="padding: 6px 10px; text-align: right; font-weight: 700; font-family: monospace; color: #0f172a;">${fmt(output.grossAmount)} ${symbol}</td>
        <td style="padding: 6px 10px; color: #64748b;">Contractually agreed gross consideration</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: #fffbeb;">
        <td style="padding: 6px 10px; font-weight: 600; color: #b45309;">2. Income Tax Withholding (GVK 94)</td>
        <td style="padding: 6px 10px; text-align: center; color: #b45309;">${Math.round(output.withholdingRate * 100)}%</td>
        <td style="padding: 6px 10px; text-align: right; font-weight: 700; font-family: monospace; color: #b45309;">-${fmt(output.withholdingAmount)} ${symbol}</td>
        <td style="padding: 6px 10px; color: #92400e;">Remitted directly to tax office by Client</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f0fdf4;">
        <td style="padding: 6px 10px; font-weight: 600; color: #15803d;">3. Net Professional Earnings</td>
        <td style="padding: 6px 10px; text-align: center; color: #15803d;">Net</td>
        <td style="padding: 6px 10px; text-align: right; font-weight: 700; font-family: monospace; color: #15803d;">${fmt(output.netTakeHome)} ${symbol}</td>
        <td style="padding: 6px 10px; color: #166534;">Contractor net take-home earnings (Gross - Tax)</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: #eff6ff;">
        <td style="padding: 6px 10px; font-weight: 600; color: #1d4ed8;">4. Value Added Tax (VAT)</td>
        <td style="padding: 6px 10px; text-align: center; color: #1d4ed8;">${Math.round(output.vatRate * 100)}%</td>
        <td style="padding: 6px 10px; text-align: right; font-weight: 700; font-family: monospace; color: #1d4ed8;">+${fmt(output.vatTotalAmount)} ${symbol}</td>
        <td style="padding: 6px 10px; color: #1e40af;">Fiduciary payment; remitted via VAT return</td>
      </tr>
      <tr style="border-bottom: 1px solid #cbd5e1; background-color: #f8fafc;">
        <td style="padding: 8px 10px; font-weight: 700; color: #0f172a;">5. Direct Bank Wire Settlement</td>
        <td style="padding: 8px 10px; text-align: center; font-weight: 600;">Net + VAT</td>
        <td style="padding: 8px 10px; text-align: right; font-weight: 700; font-family: monospace; font-size: 12px; color: #0f172a;">${fmt(output.totalCashToFreelancer)} ${symbol}</td>
        <td style="padding: 8px 10px; font-weight: 600; color: #334155;">Net cash wired to Contractor IBAN account</td>
      </tr>
      <tr style="background-color: #f1f5f9;">
        <td style="padding: 6px 10px; font-weight: 600; color: #475569;">6. Total Client Cash Outflow</td>
        <td style="padding: 6px 10px; text-align: center; color: #64748b;">Gross + VAT</td>
        <td style="padding: 6px 10px; text-align: right; font-weight: 700; font-family: monospace; color: #475569;">${fmt(output.totalCostToClient)} ${symbol}</td>
        <td style="padding: 6px 10px; color: #64748b;">Direct Wire + Tax Withholding Remittance</td>
      </tr>
    </tbody>
  </table>
</div>
`;
}
