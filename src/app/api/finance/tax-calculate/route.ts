import { NextResponse } from "next/server";
import {
  calculateFreelanceTax,
  generateContractTaxMarkdownTable,
  generateContractTaxHtmlTable,
  TaxCalculationInput,
  CalculationDirection,
  ClientTaxType,
  InvoiceDocumentType,
  VatWithholdingFraction,
} from "@/src/modules/finance/tax-calculator";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function POST(req: Request) {
  const isEnHeader = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "finance:tax-calculate",
    subject: normalizeIp(ip),
    limit: 60, // 60 queries per minute
    windowMs: 60 * 1000,
    isEn: isEnHeader,
  });

  if (!access.allowed) {
    return access.response;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawAmount = typeof body?.amount === "number" ? body.amount : parseFloat(String(body?.amount || 0));

    if (isNaN(rawAmount) || rawAmount < 0) {
      return NextResponse.json(
        {
          error: isEnHeader
            ? "A valid positive calculation amount is required."
            : "Geçerli ve pozitif bir hesaplama tutarı girilmelidir.",
        },
        { status: 400 }
      );
    }

    const direction: CalculationDirection =
      body?.direction === "GROSS_TO_NET" ? "GROSS_TO_NET" : "NET_TO_GROSS";

    const clientType: ClientTaxType =
      body?.clientType === "INDIVIDUAL" ? "INDIVIDUAL" : "CORPORATE";

    let documentType: InvoiceDocumentType = "SMM";
    if (body?.documentType === "E_FATURA") {
      documentType = "E_FATURA";
    } else if (body?.documentType === "GIDER_PUSULASI") {
      documentType = "GIDER_PUSULASI";
    }

    let vatWithholding: VatWithholdingFraction = "NONE";
    if (body?.vatWithholding === "9_10") {
      vatWithholding = "9_10";
    } else if (body?.vatWithholding === "5_10") {
      vatWithholding = "5_10";
    }

    const currency: string =
      typeof body?.currency === "string" && body.currency.trim()
        ? body.currency.trim().toUpperCase()
        : "TRY";

    const input: TaxCalculationInput = {
      amount: rawAmount,
      direction,
      clientType,
      documentType,
      currency,
      vatWithholding,
    };

    const calculation = calculateFreelanceTax(input);
    const isTr = !isEnHeader && body?.locale !== "en";
    const markdownTable = generateContractTaxMarkdownTable(calculation, isTr);
    const htmlTable = generateContractTaxHtmlTable(calculation, isTr);

    return NextResponse.json({
      success: true,
      calculation,
      markdownTable,
      htmlTable,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Calculation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
