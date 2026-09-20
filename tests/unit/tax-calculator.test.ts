import { describe, it, expect, vi } from "vitest";
import {
  calculateFreelanceTax,
  roundCurrency,
  parseBudgetAmount,
  generateContractTaxMarkdownTable,
  generateContractTaxHtmlTable,
  TaxCalculationInput,
} from "@/src/modules/finance/tax-calculator";
import { POST as taxCalculateApi } from "@/src/app/api/finance/tax-calculate/route";

vi.mock("@/src/lib/security/rate-limit", () => ({
  getClientIp: vi.fn(() => "127.0.0.1"),
  normalizeIp: vi.fn(() => "127.0.0.1"),
  evaluateSecurityAccessAsync: vi.fn().mockResolvedValue({ allowed: true }),
}));

describe("Freelance Tax & Withholding Calculator Engine (GVK 94 & SMM)", () => {
  describe("Net to Gross Calculations (Netten Brüte)", () => {
    it("calculates statutory corporate SMM for 50.000 TL net take-home correctly", () => {
      // Net = 50.000 TL, Withholding = 20%
      // Gross = 50.000 / 0.80 = 62.500 TL
      // Stopaj (20%) = 12.500 TL
      // KDV (20%) = 12.500 TL
      // Total Cash in Bank (Net + KDV) = 62.500 TL
      // Total Client Cost (Gross + KDV) = 75.000 TL
      const input: TaxCalculationInput = {
        amount: 50000,
        direction: "NET_TO_GROSS",
        clientType: "CORPORATE",
        documentType: "SMM",
        currency: "TRY",
      };

      const result = calculateFreelanceTax(input);

      expect(result.grossAmount).toBe(62500);
      expect(result.withholdingRate).toBe(0.2);
      expect(result.withholdingAmount).toBe(12500);
      expect(result.netTakeHome).toBe(50000);
      expect(result.vatRate).toBe(0.2);
      expect(result.vatTotalAmount).toBe(12500);
      expect(result.totalCashToFreelancer).toBe(62500);
      expect(result.totalCostToClient).toBe(75000);
      expect(result.netCostToClient).toBe(62500);
      expect(result.proposalNoteTr).toContain("62.500,00 ₺ Brüt");
      expect(result.proposalNoteTr).toContain("12.500,00 ₺");
      expect(result.disclaimerTr).toContain("GVK m. 94");
    });

    it("calculates individual client (no withholding) SMM correctly", () => {
      // For individual clients: Stopaj = 0%
      // Gross = Net = 50.000 TL
      // KDV = 10.000 TL
      // Total Cash in Bank = 60.000 TL
      // Client Cost = 60.000 TL
      const input: TaxCalculationInput = {
        amount: 50000,
        direction: "NET_TO_GROSS",
        clientType: "INDIVIDUAL",
        documentType: "SMM",
        currency: "TRY",
      };

      const result = calculateFreelanceTax(input);

      expect(result.grossAmount).toBe(50000);
      expect(result.withholdingRate).toBe(0);
      expect(result.withholdingAmount).toBe(0);
      expect(result.netTakeHome).toBe(50000);
      expect(result.vatTotalAmount).toBe(10000);
      expect(result.totalCashToFreelancer).toBe(60000);
      expect(result.totalCostToClient).toBe(60000);
    });

    it("calculates commercial e-Invoice (Şahıs/LTD şirketi) with 0% stopaj and 20% VAT", () => {
      // E-Invoice has no GVK 94 withholding
      const input: TaxCalculationInput = {
        amount: 80000,
        direction: "NET_TO_GROSS",
        clientType: "CORPORATE",
        documentType: "E_FATURA",
        currency: "TRY",
      };

      const result = calculateFreelanceTax(input);

      expect(result.grossAmount).toBe(80000);
      expect(result.withholdingAmount).toBe(0);
      expect(result.vatTotalAmount).toBe(16000);
      expect(result.totalCashToFreelancer).toBe(96000);
      expect(result.totalCostToClient).toBe(96000);
    });

    it("calculates Expense Note (Gider Pusulası) with 10% withholding and 0% VAT", () => {
      // Net = 45.000 TL, Withholding = 10%
      // Gross = 45.000 / 0.90 = 50.000 TL
      // Stopaj = 5.000 TL, KDV = 0
      const input: TaxCalculationInput = {
        amount: 45000,
        direction: "NET_TO_GROSS",
        clientType: "CORPORATE",
        documentType: "GIDER_PUSULASI",
        currency: "TRY",
      };

      const result = calculateFreelanceTax(input);

      expect(result.grossAmount).toBe(50000);
      expect(result.withholdingRate).toBe(0.1);
      expect(result.withholdingAmount).toBe(5000);
      expect(result.vatRate).toBe(0);
      expect(result.vatTotalAmount).toBe(0);
      expect(result.totalCashToFreelancer).toBe(45000);
      expect(result.totalCostToClient).toBe(50000);
    });
  });

  describe("Gross to Net Calculations (Brütten Nete)", () => {
    it("computes exact deductions from 100.000 TL gross proposal", () => {
      // Gross = 100.000 TL
      // Stopaj (20%) = 20.000 TL
      // Net Take-Home = 80.000 TL
      // KDV (20%) = 20.000 TL
      // Bank Cash = 100.000 TL
      // Total Cost to Client = 120.000 TL
      const input: TaxCalculationInput = {
        amount: 100000,
        direction: "GROSS_TO_NET",
        clientType: "CORPORATE",
        documentType: "SMM",
        currency: "TRY",
      };

      const result = calculateFreelanceTax(input);

      expect(result.grossAmount).toBe(100000);
      expect(result.withholdingAmount).toBe(20000);
      expect(result.netTakeHome).toBe(80000);
      expect(result.vatTotalAmount).toBe(20000);
      expect(result.totalCashToFreelancer).toBe(100000);
      expect(result.totalCostToClient).toBe(120000);
    });
  });

  describe("Partial VAT Withholding (KDV Tevkifatı 9/10 Danışmanlık)", () => {
    it("handles 9/10 consulting VAT withholding correctly", () => {
      // Gross = 100.000 TL
      // Total VAT = 20.000 TL
      // Client Withholds 9/10 of VAT = 18.000 TL (Client pays directly to tax office via KDV-2)
      // Freelancer Receives 1/10 of VAT = 2.000 TL
      // Freelancer Net = 80.000 TL (after 20.000 TL stopaj)
      // Total Cash to Freelancer = 80.000 + 2.000 = 82.000 TL
      const input: TaxCalculationInput = {
        amount: 100000,
        direction: "GROSS_TO_NET",
        clientType: "CORPORATE",
        documentType: "SMM",
        vatWithholding: "9_10",
      };

      const result = calculateFreelanceTax(input);

      expect(result.vatTotalAmount).toBe(20000);
      expect(result.vatWithheldByClient).toBe(18000);
      expect(result.vatPayableToFreelancer).toBe(2000);
      expect(result.totalCashToFreelancer).toBe(82000);
      expect(result.totalCostToClient).toBe(120000);
    });
  });

  describe("Precision, Cents & Edge Cases", () => {
    it("guarantees zero cent drift on fractional numbers", () => {
      // 17.333,33 net
      const input: TaxCalculationInput = {
        amount: 17333.33,
        direction: "NET_TO_GROSS",
        clientType: "CORPORATE",
        documentType: "SMM",
      };

      const result = calculateFreelanceTax(input);

      // Verify exact arithmetic invariant: Gross - Withholding === Net
      expect(roundCurrency(result.grossAmount - result.withholdingAmount)).toBe(
        result.netTakeHome
      );
      // Verify exact arithmetic invariant: Net + VAT payable === Total cash to freelancer
      expect(
        roundCurrency(result.netTakeHome + result.vatPayableToFreelancer)
      ).toBe(result.totalCashToFreelancer);
    });

    it("handles zero, negative, or invalid amounts gracefully without throwing", () => {
      const resultZero = calculateFreelanceTax({
        amount: 0,
        direction: "NET_TO_GROSS",
        clientType: "CORPORATE",
        documentType: "SMM",
      });

      expect(resultZero.grossAmount).toBe(0);
      expect(resultZero.netTakeHome).toBe(0);
      expect(resultZero.totalCostToClient).toBe(0);

      const resultNegative = calculateFreelanceTax({
        amount: -5000,
        direction: "NET_TO_GROSS",
        clientType: "CORPORATE",
        documentType: "SMM",
      });

      expect(resultNegative.grossAmount).toBe(0);
    });

    it("formats disclaimers and notes in English when requested", () => {
      const result = calculateFreelanceTax({
        amount: 25000,
        direction: "NET_TO_GROSS",
        clientType: "CORPORATE",
        documentType: "SMM",
        currency: "USD",
      });

      expect(result.proposalNoteEn).toContain("Tax & Withholding Notice");
      expect(result.proposalNoteEn).toContain("$");
      expect(result.disclaimerEn).toContain("Art. 94");
    });
  });

  describe("Budget String Parser (parseBudgetAmount)", () => {
    it("parses Turkish formatted numbers with dot as thousand separator", () => {
      const res = parseBudgetAmount("75.000 TL");
      expect(res).not.toBeNull();
      expect(res?.numericAmount).toBe(75000);
      expect(res?.currency).toBe("TRY");
    });

    it("parses comma-separated or plain integers", () => {
      const res1 = parseBudgetAmount("50,000 TRY");
      expect(res1?.numericAmount).toBe(50000);
      expect(res1?.currency).toBe("TRY");

      const res2 = parseBudgetAmount("100000");
      expect(res2?.numericAmount).toBe(100000);
      expect(res2?.currency).toBe("TRY");
    });

    it("parses fractional currencies (e.g. 62.500,50 ₺)", () => {
      const res = parseBudgetAmount("62.500,50 ₺");
      expect(res?.numericAmount).toBe(62500.5);
      expect(res?.currency).toBe("TRY");
    });

    it("detects USD and EUR symbols and codes", () => {
      const resUsd = parseBudgetAmount("$10,000");
      expect(resUsd?.numericAmount).toBe(10000);
      expect(resUsd?.currency).toBe("USD");

      const resEur = parseBudgetAmount("5.500 €");
      expect(resEur?.numericAmount).toBe(5500);
      expect(resEur?.currency).toBe("EUR");
    });

    it("returns null for non-numeric or empty strings", () => {
      expect(parseBudgetAmount("Görüşülecektir")).toBeNull();
      expect(parseBudgetAmount("")).toBeNull();
      expect(parseBudgetAmount(null)).toBeNull();
      expect(parseBudgetAmount(undefined)).toBeNull();
    });
  });

  describe("Contract Tax Table Generators", () => {
    it("generates markdown table with all statutory rows", () => {
      const calc = calculateFreelanceTax({
        amount: 50000,
        direction: "NET_TO_GROSS",
        clientType: "CORPORATE",
        documentType: "SMM",
        currency: "TRY",
      });

      const mdTable = generateContractTaxMarkdownTable(calc, true);
      expect(mdTable).toContain("1. Kararlaştırılan Brüt Hizmet Bedeli");
      expect(mdTable).toContain("62.500,00 ₺");
      expect(mdTable).toContain("2. GVK m. 94/2-b Stopaj Tevkifatı");
      expect(mdTable).toContain("-12.500,00 ₺");
      expect(mdTable).toContain("3. Net Serbest Meslek Kazancı");
      expect(mdTable).toContain("50.000,00 ₺");
      expect(mdTable).toContain("5. Banka Havalesi ile Yükleniciye Ödenecek");
      expect(mdTable).toContain("6. İş Sahibinin Toplam Nakit Maliyeti");
      expect(mdTable).toContain("75.000,00 ₺");
    });

    it("generates English markdown table", () => {
      const calc = calculateFreelanceTax({
        amount: 50000,
        direction: "NET_TO_GROSS",
        clientType: "CORPORATE",
        documentType: "SMM",
        currency: "USD",
      });

      const mdTableEn = generateContractTaxMarkdownTable(calc, false);
      expect(mdTableEn).toContain("1. Agreed Gross Service Fee");
      expect(mdTableEn).toContain("2. Income Tax Withholding (GVK Art. 94)");
      expect(mdTableEn).toContain("3. Net Professional Earnings");
      expect(mdTableEn).toContain("$");
    });

    it("generates styled HTML table for print/PDF", () => {
      const calc = calculateFreelanceTax({
        amount: 60000,
        direction: "GROSS_TO_NET",
        clientType: "CORPORATE",
        documentType: "SMM",
        currency: "TRY",
      });

      const html = generateContractTaxHtmlTable(calc, true);
      expect(html).toContain("YASAL VERGİ VE ÖDEME DAĞILIM TABLOSU (GVK m. 94 & KDVK)");
      expect(html).toContain("RESMİ HESAPLAMA");
      expect(html).toContain("60.000,00 ₺");
      expect(html).toContain("table");
    });
  });

  describe("Tax Calculation REST API Endpoint (POST /api/finance/tax-calculate)", () => {
    it("handles valid POST calculation and returns 200 with breakdown", async () => {
      const req = new Request("http://localhost:3000/api/finance/tax-calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 50000,
          direction: "NET_TO_GROSS",
          clientType: "CORPORATE",
          documentType: "SMM",
          currency: "TRY",
        }),
      });

      const res = await taxCalculateApi(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.calculation.grossAmount).toBe(62500);
      expect(json.calculation.withholdingAmount).toBe(12500);
      expect(json.calculation.netTakeHome).toBe(50000);
      expect(json.markdownTable).toBeDefined();
      expect(json.htmlTable).toBeDefined();
    });

    it("rejects invalid or negative amount with 400 Bad Request", async () => {
      const req = new Request("http://localhost:3000/api/finance/tax-calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: "invalid-number",
        }),
      });

      const res = await taxCalculateApi(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toBeDefined();
    });
  });

  describe("TaxMath - Exact Integer Cents (Kuruş) Invariants", () => {
    it("guarantees Gross = Net + Withholding with zero penny discrepancy across odd numbers", () => {
      const oddAmounts = [123.45, 999.99, 12500.33, 47891.17, 33333.33];
      for (const amount of oddAmounts) {
        const calc = calculateFreelanceTax({
          amount,
          direction: "NET_TO_GROSS",
          clientType: "CORPORATE",
          documentType: "SMM",
          currency: "TRY",
        });

        // Exact sum invariant
        const diff = Math.abs(calc.grossAmount - (calc.netTakeHome + calc.withholdingAmount));
        expect(diff).toBeLessThanOrEqual(0.0001);

        // Total client cost invariant
        const costDiff = Math.abs(
          calc.totalCostToClient - (calc.grossAmount + (calc.vatTotalAmount || 0))
        );
        expect(costDiff).toBeLessThanOrEqual(0.0001);
      }
    });
  });
});
