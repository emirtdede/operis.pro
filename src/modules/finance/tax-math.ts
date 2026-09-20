/**
 * Operis FinTech Exact Integer Math Engine (Kuruş Tabanlı Finansal Aritmetik)
 *
 * Replaces IEEE-754 floating-point inaccuracies (e.g. 0.1 + 0.2 !== 0.3) with
 * deterministic, cent/kuruş-based integer arithmetic.
 * Ensures zero-penny discrepancies in statutory tax equations (VUK & GVK standards).
 *
 * Invariants Guaranteed:
 * - Gross = Net + Withholding (GrossKurus === NetTakeHomeKurus + WithholdingKurus)
 * - Total Cost = Gross + VAT (TotalCostKurus === GrossKurus + VatTotalKurus)
 */

export class TaxMath {
  /**
   * Converts a float/number currency into integer kuruş (cents).
   * e.g. 12500.50 -> 1250050n
   */
  static toKurus(amount: number): bigint {
    if (!Number.isFinite(amount) || isNaN(amount) || amount <= 0) return 0n;
    // Multiplied by 100 with Math.round to avoid float drift (e.g. 19.99 * 100 = 1998.9999999999998)
    return BigInt(Math.round(amount * 100));
  }

  /**
   * Converts integer kuruş (cents) back into standard 2-decimal number.
   * e.g. 1250050n -> 12500.50
   */
  static fromKurus(kurus: bigint): number {
    const num = Number(kurus);
    return Math.round(num) / 100;
  }

  /**
   * Computes percentage with Banker's Rounding (Round Half-to-Even) in integer kuruş.
   * @param baseKurus Amount in kuruş (e.g. 100000n = 1000 TL)
   * @param rate Rate as fraction (e.g. 0.20 for 20%)
   */
  static calcRatioKurus(baseKurus: bigint, rate: number): bigint {
    if (baseKurus <= 0n || rate <= 0) return 0n;
    // Rate scaled by 10,000 for precision (basis points / four decimals)
    const rateScaled = BigInt(Math.round(rate * 10000));
    const raw = baseKurus * rateScaled;
    // Division with rounding: (raw + 5000n) / 10000n
    const quotient = raw / 10000n;
    const remainder = raw % 10000n;

    if (remainder > 5000n) {
      return quotient + 1n;
    } else if (remainder === 5000n) {
      // Half-even: round to nearest even number
      return quotient % 2n === 0n ? quotient : quotient + 1n;
    }
    return quotient;
  }

  /**
   * Solves Gross from Net take-home with exact kuruş balance:
   * Gross - Withholding = Net
   * Gross * (1 - withholdingRate) = Net
   * Gross = Net / (1 - withholdingRate)
   */
  static grossFromNetKurus(
    netKurus: bigint,
    withholdingRate: number
  ): {
    grossKurus: bigint;
    withholdingKurus: bigint;
  } {
    if (netKurus <= 0n) return { grossKurus: 0n, withholdingKurus: 0n };
    if (withholdingRate <= 0) return { grossKurus: netKurus, withholdingKurus: 0n };

    const divisorBps = BigInt(Math.round((1 - withholdingRate) * 10000));
    const grossRaw = (netKurus * 10000n + divisorBps / 2n) / divisorBps;

    const withholding = this.calcRatioKurus(grossRaw, withholdingRate);
    // Strict invariant enforcement: Gross = Net + Withholding
    const balancedGross = netKurus + withholding;

    return {
      grossKurus: balancedGross,
      withholdingKurus: withholding,
    };
  }

  /**
   * Solves Net take-home from Gross with exact kuruş balance:
   * Net = Gross - Withholding
   */
  static netFromGrossKurus(
    grossKurus: bigint,
    withholdingRate: number
  ): {
    netTakeHomeKurus: bigint;
    withholdingKurus: bigint;
  } {
    if (grossKurus <= 0n) return { netTakeHomeKurus: 0n, withholdingKurus: 0n };
    if (withholdingRate <= 0) return { netTakeHomeKurus: grossKurus, withholdingKurus: 0n };

    const withholding = this.calcRatioKurus(grossKurus, withholdingRate);
    // Invariant: Net = Gross - Withholding
    const netTakeHome = grossKurus - withholding;

    return {
      netTakeHomeKurus: netTakeHome,
      withholdingKurus: withholding,
    };
  }

  /**
   * Calculates VAT Breakdown with exact kuruş tevkifat split (5/10 or 9/10).
   */
  static calcVatBreakdownKurus(
    grossKurus: bigint,
    vatRate: number,
    withholdingFraction: "NONE" | "9_10" | "5_10" = "NONE"
  ): {
    vatTotalKurus: bigint;
    vatWithheldByClientKurus: bigint;
    vatPayableToFreelancerKurus: bigint;
  } {
    if (grossKurus <= 0n || vatRate <= 0) {
      return {
        vatTotalKurus: 0n,
        vatWithheldByClientKurus: 0n,
        vatPayableToFreelancerKurus: 0n,
      };
    }

    const vatTotal = this.calcRatioKurus(grossKurus, vatRate);
    let vatWithheld = 0n;

    if (withholdingFraction === "9_10") {
      // 9/10 of VAT withheld by client
      vatWithheld = (vatTotal * 9n + 5n) / 10n;
    } else if (withholdingFraction === "5_10") {
      // 5/10 of VAT withheld by client
      vatWithheld = (vatTotal * 5n + 5n) / 10n;
    }

    // Invariant: vatPayableToFreelancer = vatTotal - vatWithheld
    const vatPayable = vatTotal - vatWithheld;

    return {
      vatTotalKurus: vatTotal,
      vatWithheldByClientKurus: vatWithheld,
      vatPayableToFreelancerKurus: vatPayable,
    };
  }
}
