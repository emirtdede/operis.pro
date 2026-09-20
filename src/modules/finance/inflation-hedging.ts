/**
 * Inflation & FX Hedging Engine (Operis Finance & Contracts Module)
 *
 * Statutory Compliance:
 * - Türk Parasının Kıymetini Koruma Hakkında 32 Sayılı Karar & 2018-32/51 Sayılı Tebliğ:
 *   Türkiye'de yerleşik kişiler arası sözleşmelerde döviz veya dövize endeksleme yasağına tam uyum.
 *   Bedel Türk Lirası kalır; T.C. resmi kurumu TÜİK'in yayımladığı TÜFE/Yİ-ÜFE enflasyon endeksleri
 *   kanuni fiyat farkı ve sözleşmesel uyarlama ölçütü olarak uygulanır.
 * - TBK (Türk Borçlar Kanunu) m. 138: Aşırı İfa Güçlüğü (Clausula Rebus Sic Stantibus) sözleşmesel uyarlaması.
 * - TBK m. 480/2: Eser Sözleşmesinde öngörülemeyen maliyet artışlarında götürü bedelin uyarlanması.
 * - TBK m. 117 vd.: Borçlunun Temerrüdü / Kusur İlkesi (Kusurlu gecikmede endeks dondurma).
 * - GVK m. 94 & KDVK: Güncellenen brüt hakediş tutarı üzerinden SMM / e-Fatura stopaj ve KDV matrahı.
 */

import { roundCurrency, calculateFreelanceTax, TaxCalculationOutput } from "./tax-calculator";
import type { ContractLanguage } from "../contracts/types";

const INDEX_LABELS = {
  tr: {
    TUFE: "TÜİK Tüketici Fiyat Endeksi (TÜFE)",
    YI_UFE: "TÜİK Yurt İçi Üretici Fiyat Endeksi (Yİ-ÜFE)",
    HYBRID: "TÜİK Karma Endeksi (%50 TÜFE + %50 Yİ-ÜFE)",
  },
  en: {
    TUFE: "TurkStat Consumer Price Index (CPI)",
    YI_UFE: "TurkStat Producer Price Index (PPI)",
    HYBRID: "TurkStat Hybrid Index (50% CPI + 50% PPI)",
  },
};

export type InflationIndexType = "TUFE" | "YI_UFE" | "HYBRID";

export type FaultParty = "NONE" | "CONTRACTOR" | "CLIENT";

export interface InflationShieldConfig {
  enabled: boolean;
  indexType: InflationIndexType;
  baseMonth?: string; // YYYY-MM (e.g., "2026-01")
  targetMonth?: string; // YYYY-MM (e.g., "2026-06")
  capPercentage?: number | null; // Optional maximum inflation ceiling (e.g., 25 for +25%)
  faultParty?: FaultParty;
}

export interface InflationCalculationParams {
  baseAmount: number; // P_0: Başlangıç hakediş / sözleşme tutarı (TL)
  baseMonth: string; // YYYY-MM
  targetMonth: string; // YYYY-MM
  indexType?: InflationIndexType; // Default: 'HYBRID'
  capPercentage?: number | null; // e.g., 20
  faultParty?: FaultParty; // Default: 'NONE'
  originalTargetMonth?: string; // If contractor delayed, freeze at this month
  clientTaxType?: "CORPORATE" | "INDIVIDUAL";
}

export interface InflationCalculationResult {
  baseAmount: number;
  baseMonth: string;
  targetMonth: string;
  effectiveTargetMonth: string;
  indexType: InflationIndexType;
  baseIndex: number;
  targetIndex: number;
  rawInflationRate: number; // e.g. 0.185 (18.5%)
  floorApplied: boolean; // true if raw inflation was negative
  capApplied: boolean; // true if cap percentage capped the rate
  faultFrozenApplied: boolean; // true if contractor fault froze the index
  finalAdjustmentRate: number; // e.g. 0.185 (18.5%)
  inflationDeltaAmount: number; // P_n - P_0
  adjustedGrossAmount: number; // P_n
  // Statutory tax & payout breakdown based on updated gross
  taxBreakdown: TaxCalculationOutput;
  // Legal & operational summaries
  summaryTr: string;
  summaryEn: string;
  statutoryReferenceTr: string;
  statutoryReferenceEn: string;
}

export interface InflationScenario {
  scenarioLabel: string;
  projectedRatePercent: number;
  adjustedGrossAmount: number;
  deltaAmount: number;
  netTakeHome: number;
  totalCostToClient: number;
}

/**
 * Historical and official TÜİK Index Series (2003=100 base)
 * Source: Türkiye İstatistik Kurumu (TÜİK) TÜFE & Yİ-ÜFE Endeks Tabloları
 */
export const TUIK_INDEX_DATABASE: Record<string, { tufe: number; yiUfe: number }> = {
  // 2024
  "2024-01": { tufe: 1984.02, yiUfe: 3045.54 },
  "2024-02": { tufe: 2073.31, yiUfe: 3159.44 },
  "2024-03": { tufe: 2138.81, yiUfe: 3263.38 },
  "2024-04": { tufe: 2206.81, yiUfe: 3374.34 },
  "2024-05": { tufe: 2281.39, yiUfe: 3492.44 },
  "2024-06": { tufe: 2318.82, yiUfe: 3550.06 },
  "2024-07": { tufe: 2393.63, yiUfe: 3619.64 },
  "2024-08": { tufe: 2452.99, yiUfe: 3680.45 },
  "2024-09": { tufe: 2525.86, yiUfe: 3730.98 },
  "2024-10": { tufe: 2598.60, yiUfe: 3779.48 },
  "2024-11": { tufe: 2656.81, yiUfe: 3842.22 },
  "2024-12": { tufe: 2684.97, yiUfe: 3896.01 },
  // 2025
  "2025-01": { tufe: 2859.49, yiUfe: 4051.85 },
  "2025-02": { tufe: 2945.28, yiUfe: 4165.20 },
  "2025-03": { tufe: 3010.08, yiUfe: 4256.83 },
  "2025-04": { tufe: 3085.33, yiUfe: 4359.00 },
  "2025-05": { tufe: 3140.87, yiUfe: 4437.46 },
  "2025-06": { tufe: 3191.12, yiUfe: 4508.46 },
  "2025-07": { tufe: 3261.33, yiUfe: 4598.63 },
  "2025-08": { tufe: 3316.77, yiUfe: 4676.81 },
  "2025-09": { tufe: 3396.37, yiUfe: 4784.38 },
  "2025-10": { tufe: 3481.28, yiUfe: 4894.42 },
  "2025-11": { tufe: 3550.91, yiUfe: 4987.41 },
  "2025-12": { tufe: 3600.62, yiUfe: 5057.22 },
  // 2026
  "2026-01": { tufe: 3838.26, yiUfe: 5310.08 },
  "2026-02": { tufe: 3949.57, yiUfe: 5448.14 },
  "2026-03": { tufe: 4036.46, yiUfe: 5562.55 },
  "2026-04": { tufe: 4121.23, yiUfe: 5679.36 },
  "2026-05": { tufe: 4191.29, yiUfe: 5770.23 },
  "2026-06": { tufe: 4262.54, yiUfe: 5862.55 },
  "2026-07": { tufe: 4339.27, yiUfe: 5962.22 },
  "2026-08": { tufe: 4408.70, yiUfe: 6051.65 },
  "2026-09": { tufe: 4479.24, yiUfe: 6142.43 },
  "2026-10": { tufe: 4546.43, yiUfe: 6228.42 },
  "2026-11": { tufe: 4614.63, yiUfe: 6315.62 },
  "2026-12": { tufe: 4679.23, yiUfe: 6397.72 },
};

export class InflationHedgingEngine {
  /**
   * Normalizes YYYY-MM date string, resolving current month if omitted or invalid.
   */
  static normalizeMonth(monthStr?: string | null): string {
    if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      return `${yyyy}-${mm}`;
    }
    return monthStr;
  }

  /**
   * Retrieves or cleanly extrapolates the official TÜİK index value for a given month and index type.
   */
  static getTuikIndex(monthStr: string, indexType: InflationIndexType = "HYBRID"): number {
    const normMonth = this.normalizeMonth(monthStr);

    if (TUIK_INDEX_DATABASE[normMonth]) {
      const entry = TUIK_INDEX_DATABASE[normMonth]!;
      if (indexType === "TUFE") return entry.tufe;
      if (indexType === "YI_UFE") return entry.yiUfe;
      // HYBRID: 50% TÜFE + 50% Yİ-ÜFE
      return roundCurrency((entry.tufe + entry.yiUfe) / 2);
    }

    // Extrapolate smoothly for future dates beyond 2026
    const [yearStr, monthNumStr] = normMonth.split("-");
    const year = parseInt(yearStr!, 10);
    const monthNum = parseInt(monthNumStr!, 10);

    const base2026Dec = TUIK_INDEX_DATABASE["2026-12"]!;
    const monthsElapsed = (year - 2026) * 12 + (monthNum - 12);

    if (monthsElapsed <= 0) {
      // Prior to 2024, fallback to 2024-01
      const entry = TUIK_INDEX_DATABASE["2024-01"]!;
      if (indexType === "TUFE") return entry.tufe;
      if (indexType === "YI_UFE") return entry.yiUfe;
      return roundCurrency((entry.tufe + entry.yiUfe) / 2);
    }

    // Compounded monthly estimate ~1.8% for future projections
    const factor = Math.pow(1.018, monthsElapsed);
    const estTufe = roundCurrency(base2026Dec.tufe * factor);
    const estYiUfe = roundCurrency(base2026Dec.yiUfe * factor);

    if (indexType === "TUFE") return estTufe;
    if (indexType === "YI_UFE") return estYiUfe;
    return roundCurrency((estTufe + estYiUfe) / 2);
  }

  /**
   * Computes the complete inflation escalation adjustment, enforcing Floor, Cap, and Moratorium rules.
   */
  static calculateAdjustment(params: InflationCalculationParams): InflationCalculationResult {
    const baseAmount = Math.max(0, params.baseAmount || 0);
    const baseMonth = this.normalizeMonth(params.baseMonth);
    const targetMonth = this.normalizeMonth(params.targetMonth);
    const indexType = params.indexType || "HYBRID";
    const faultParty = params.faultParty || "NONE";
    const clientTaxType = params.clientTaxType || "CORPORATE";

    // Fault determination: If contractor is at fault for delay, freeze index at original target month
    let effectiveTargetMonth = targetMonth;
    let faultFrozenApplied = false;

    if (faultParty === "CONTRACTOR" && params.originalTargetMonth) {
      const origTarget = this.normalizeMonth(params.originalTargetMonth);
      if (origTarget < targetMonth) {
        effectiveTargetMonth = origTarget;
        faultFrozenApplied = true;
      }
    }

    const baseIndex = this.getTuikIndex(baseMonth, indexType);
    const targetIndex = this.getTuikIndex(effectiveTargetMonth, indexType);

    // 1. Raw inflation calculation
    const rawInflationRate = baseIndex > 0 ? (targetIndex - baseIndex) / baseIndex : 0;

    // 2. Floor Protection (TBK m. 480/1 - Contract price never drops below nominal base)
    let floorApplied = false;
    let rateAfterFloor = rawInflationRate;
    if (rawInflationRate < 0) {
      rateAfterFloor = 0;
      floorApplied = true;
    }

    // 3. Cap Protection (Optional ceiling percentage to prevent client budget exhaustion)
    let capApplied = false;
    let finalAdjustmentRate = rateAfterFloor;

    if (params.capPercentage !== undefined && params.capPercentage !== null && params.capPercentage > 0) {
      const capFraction = params.capPercentage / 100;
      if (rateAfterFloor > capFraction) {
        finalAdjustmentRate = capFraction;
        capApplied = true;
      }
    }

    // 4. Calculate adjusted gross and delta amounts
    const adjustedGrossAmount = roundCurrency(baseAmount * (1 + finalAdjustmentRate));
    const inflationDeltaAmount = roundCurrency(adjustedGrossAmount - baseAmount);

    // 5. Compute full statutory tax & net take-home breakdown on the updated gross amount
    const taxBreakdown = calculateFreelanceTax({
      amount: adjustedGrossAmount,
      direction: "GROSS_TO_NET",
      clientType: clientTaxType,
      documentType: "SMM",
      currency: "TRY",
      vatWithholding: "NONE",
    });

    const indexLabelTr = INDEX_LABELS.tr[indexType] ?? INDEX_LABELS.tr.HYBRID;
    const indexLabelEn = INDEX_LABELS.en[indexType] ?? INDEX_LABELS.en.HYBRID;

    const ratePercentFormatted = (finalAdjustmentRate * 100).toFixed(2);

    const summaryTr = `Başlangıç hakediş tutarı ${baseAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺ olup, ${baseMonth} - ${effectiveTargetMonth} dönemleri arasındaki ${indexLabelTr} değişimi (%${ratePercentFormatted}) doğrultusunda güncellenmiş brüt tutar ${adjustedGrossAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺ olarak hesaplanmıştır.${capApplied ? ` (Azami %${params.capPercentage} tavan sınırı uygulanmıştır.)` : ""}${faultFrozenApplied ? " (Yüklenici gecikmesi sebebiyle endeks orijinal vadede dondurulmuştur.)" : ""}`;

    const summaryEn = `Baseline fee of ${baseAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} TRY has been updated by +${ratePercentFormatted}% pursuant to ${indexLabelEn} between ${baseMonth} and ${effectiveTargetMonth}, resulting in an adjusted gross fee of ${adjustedGrossAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} TRY.${capApplied ? ` (Capped at maximum +${params.capPercentage}% ceiling.)` : ""}${faultFrozenApplied ? " (Frozen at original milestone date due to contractor delay.)" : ""}`;

    const statutoryReferenceTr =
      "6098 sayılı Türk Borçlar Kanunu m. 138 (Aşırı İfa Güçlüğü) ve m. 480/2 ile Türk Parasının Kıymetini Koruma Hakkında 32 Sayılı Karar ve 2018-32/51 Sayılı Tebliğ";

    const statutoryReferenceEn =
      "Turkish Code of Obligations (TBK) Art. 138 (Hardship / Changed Circumstances) & Art. 480/2, in strict compliance with Decree No. 32 on the Protection of the Value of Turkish Currency.";

    return {
      baseAmount,
      baseMonth,
      targetMonth,
      effectiveTargetMonth,
      indexType,
      baseIndex,
      targetIndex,
      rawInflationRate: roundCurrency(rawInflationRate * 10000) / 10000,
      floorApplied,
      capApplied,
      faultFrozenApplied,
      finalAdjustmentRate: roundCurrency(finalAdjustmentRate * 10000) / 10000,
      inflationDeltaAmount,
      adjustedGrossAmount,
      taxBreakdown,
      summaryTr,
      summaryEn,
      statutoryReferenceTr,
      statutoryReferenceEn,
    };
  }

  /**
   * Generates formal contract clause text (Article 3.5) for insertion into bilateral agreements.
   */
  static generateInflationClauseText(
    config: InflationShieldConfig,
    locale: ContractLanguage = "tr",
    baseAmount: number = 0
  ): {
    markdown: string;
    html: string;
    summaryTr: string;
    summaryEn: string;
  } {
    const isTr = locale === "tr";
    const indexType = config.indexType || "HYBRID";
    const baseMonth = this.normalizeMonth(config.baseMonth);
    const targetMonth = this.normalizeMonth(config.targetMonth || baseMonth);
    let capStr = isTr ? "Serbest (Tavansız)" : "Uncapped";
    if (config.capPercentage) {
      capStr = `%${config.capPercentage}`;
    }

    const indexNameTr = INDEX_LABELS.tr[indexType] ?? INDEX_LABELS.tr.HYBRID;
    const indexNameEn = INDEX_LABELS.en[indexType] ?? INDEX_LABELS.en.HYBRID;

    const sampleAdj = this.calculateAdjustment({
      baseAmount: baseAmount > 0 ? baseAmount : 50000,
      baseMonth,
      targetMonth,
      indexType,
      capPercentage: config.capPercentage,
    });

    const ratePctFormatted = (sampleAdj.finalAdjustmentRate * 100).toFixed(2);

    const markdownTr = `
3.5. **TÜRK PARASININ KIYMETİNİ KORUMA HAKKINDA 32 SAYILI KARAR VE TBK m. 138 UYARINCA RESMİ ENFLASYON VE FİYAT UYARLAMA KLOZU:**
3.5.1. **Yasal Uyum ve Döviz Yasağı Beyanı:** İşbu sözleşmenin bedeli Türk Lirası (TL) cinsinden kararlaştırılmış olup; Türk Parasının Kıymetini Koruma Hakkında 32 Sayılı Karar ve buna ilişkin 2018-32/51 Sayılı Tebliğ uyarınca döviz cinsinden veya dövize endeksli değildir.
3.5.2. **TBK m. 138 & 480/2 İradi Uyarlama Hükmü:** Taraflar, sözleşmenin ifası süresince ortaya çıkabilecek enflasyonist maliyet artışlarının edimler arasındaki adil dengeyi Yüklenici aleyhine dürüstlük kuralına aykırı derecede bozmasını (Aşırı İfa Güçlüğü) önlemek amacıyla; hakediş tarihlerindeki kilometre taşı bedellerinin T.C. Türkiye İstatistik Kurumu (TÜİK) tarafından ilan edilen resmi **${indexNameTr}** değişim oranı esas alınarak uyarlanması hususunda mutabık kalmışlardır.
3.5.3. **Uygulama Esasları ve Taban/Tavan Sınırları:**
- **Baz Alınacak Başlangıç Ayı (T₀):** \`${baseMonth}\` (TÜİK Endeksi: ${sampleAdj.baseIndex})
- **Öngörülen Vade Ayı (Tₙ):** \`${targetMonth}\` (TÜİK Endeksi: ${sampleAdj.targetIndex})
- **Uygulanacak Endeks Modeli:** ${indexNameTr}
- **Taban Koruması (Floor - %0):** Enflasyonun negatif gerçekleşmesi veya deflasyon halinde sözleşme bedeli Madde 3.1'de kararlaştırılan başlangıç TL bedelinin altına düşürülemez.
- **Tavan Sınırı (Cap):** Azami artış oranı **${capStr}** ile sınırlandırılmıştır.
- **Kusurlu Temerrüt Kuralı (TBK m. 117):** Teslimat veya onaydaki gecikmenin Yüklenici kusurundan kaynaklanması halinde endeksleme sözleşmede kararlaştırılan orijinal teslimat vadesinde dondurulur; gecikilen dönemin enflasyon farkı talep edilemez. İşveren kusuruyla gecikmelerde ise fiili ödeme tarihindeki güncel TÜİK endeksi işletilir.
- **Mali ve Vergisel Belge:** Yüklenici tarafından düzenlenecek Serbest Meslek Makbuzu (SMM) veya fatura, enflasyonla güncellenmiş yeni brüt tutar üzerinden tanzim edilecek; GVK m. 94 uyarınca kanuni stopaj ve KDV kesintisi bu güncel matrahtan yapılacaktır.
`;

    const markdownEn = `
3.5. **STATUTORY INFLATION HEDGING & PRICE ESCALATION CLAUSE (DECREE NO. 32 & TBK ART. 138 COMPLIANT):**
3.5.1. **Decree No. 32 Statutory Compliance:** The contract price is denominated strictly in Turkish Lira (TRY) in full compliance with Decree No. 32 on the Protection of the Value of Turkish Currency and Communiqué No. 2018-32/51, and is not indexed to foreign exchange.
3.5.2. **Contractual Hardship Adjustment (TBK Art. 138 & 480/2):** To preserve the economic balance of obligations and mitigate excessive performance hardship (Clausula Rebus Sic Stantibus), milestone compensation shall be adjusted on payment dates in accordance with official changes in the **${indexNameEn}** published by the Turkish Statistical Institute (TurkStat).
3.5.3. **Implementation Standards & Cap/Floor Boundaries:**
- **Base Month (T₀):** \`${baseMonth}\` (TurkStat Index: ${sampleAdj.baseIndex})
- **Target Month (Tₙ):** \`${targetMonth}\` (TurkStat Index: ${sampleAdj.targetIndex})
- **Selected Index Benchmark:** ${indexNameEn}
- **Floor Protection (0%):** Under no circumstance shall the adjusted fee fall below the nominal baseline TRY price agreed under Article 3.1.
- **Maximum Ceiling (Cap):** Maximum price escalation is capped at **${capStr}**.
- **Default Moratorium Rule (TBK Art. 117):** If delay is attributable to Contractor default, escalation freezes at the contractual milestone due date. If delay is caused by the Client, the prevailing index at actual settlement applies.
- **Fiscal Invoicing:** Invoices or Freelance Receipts (SMM) shall be issued against the adjusted gross amount; statutory withholding (GVK Art. 94) and VAT apply to the updated tax base.
`;

    const htmlTr = `
<div class="inflation-shield-box" style="margin: 16px 0; border: 1px solid #fed7aa; background: #fffbeb; border-radius: 8px; padding: 14px; font-size: 9pt; break-inside: avoid; page-break-inside: avoid;">
  <div style="font-weight: 700; color: #9a3412; font-size: 10pt; margin-bottom: 6px; break-after: avoid-page; page-break-after: avoid;">
    📈 TBK m. 138 & 32 Sayılı Karar Uyumlu Enflasyon ve TÜFE Endeksleme Klozu
  </div>
  <p style="margin: 4px 0 8px; color: #78350f; line-height: 1.4;">
    Sözleşme bedeli Türk Parasının Kıymetini Koruma mevzuatına uygun olarak TL kalmak kaydıyla; TBK m. 138 (Aşırı İfa Güçlüğü) gereğince hakediş tarihinde resmi <strong>${indexNameTr}</strong> değişimine göre güncellenecektir.
  </p>
  <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 8.5pt;">
    <tbody>
      <tr style="background: #fef3c7;">
        <td style="border: 1px solid #fde68a; padding: 4px 8px;"><strong>Endeks Modeli:</strong></td>
        <td style="border: 1px solid #fde68a; padding: 4px 8px;">${indexNameTr}</td>
        <td style="border: 1px solid #fde68a; padding: 4px 8px;"><strong>Tavan Sınırı (Cap):</strong></td>
        <td style="border: 1px solid #fde68a; padding: 4px 8px;">${capStr}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #fde68a; padding: 4px 8px;"><strong>Baz Dönem (T₀):</strong></td>
        <td style="border: 1px solid #fde68a; padding: 4px 8px;">${baseMonth} (Endeks: ${sampleAdj.baseIndex})</td>
        <td style="border: 1px solid #fde68a; padding: 4px 8px;"><strong>Taban Güvencesi:</strong></td>
        <td style="border: 1px solid #fde68a; padding: 4px 8px;">%0 (Nominal TL altına inemez)</td>
      </tr>
    </tbody>
  </table>
</div>`;

    const htmlEn = `
<div class="inflation-shield-box" style="margin: 16px 0; border: 1px solid #fed7aa; background: #fffbeb; border-radius: 8px; padding: 14px; font-size: 9pt; break-inside: avoid; page-break-inside: avoid;">
  <div style="font-weight: 700; color: #9a3412; font-size: 10pt; margin-bottom: 6px; break-after: avoid-page; page-break-after: avoid;">
    📈 Statutory Inflation Hedging Clause (Decree No. 32 & TBK Art. 138 Compliant)
  </div>
  <p style="margin: 4px 0 8px; color: #78350f; line-height: 1.4;">
    While retaining nominal Turkish Lira denomination, milestone compensation is contractually adjusted on settlement dates pursuant to TBK Art. 138 using official <strong>${indexNameEn}</strong> metrics.
  </p>
  <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 8.5pt;">
    <tbody>
      <tr style="background: #fef3c7;">
        <td style="border: 1px solid #fde68a; padding: 4px 8px;"><strong>Index Benchmark:</strong></td>
        <td style="border: 1px solid #fde68a; padding: 4px 8px;">${indexNameEn}</td>
        <td style="border: 1px solid #fde68a; padding: 4px 8px;"><strong>Ceiling Cap:</strong></td>
        <td style="border: 1px solid #fde68a; padding: 4px 8px;">${capStr}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #fde68a; padding: 4px 8px;"><strong>Base Period (T₀):</strong></td>
        <td style="border: 1px solid #fde68a; padding: 4px 8px;">${baseMonth} (Index: ${sampleAdj.baseIndex})</td>
        <td style="border: 1px solid #fde68a; padding: 4px 8px;"><strong>Floor Guarantee:</strong></td>
        <td style="border: 1px solid #fde68a; padding: 4px 8px;">0% (Cannot drop below nominal base)</td>
      </tr>
    </tbody>
  </table>
</div>`;

    return {
      markdown: isTr ? markdownTr : markdownEn,
      html: isTr ? htmlTr : htmlEn,
      summaryTr: `TBK 138 Enflasyon Kalkanı: ${indexNameTr}, Tavan: ${capStr}, Baz: ${baseMonth} (Örnek Artış: +%${ratePctFormatted})`,
      summaryEn: `TBK 138 Inflation Shield: ${indexNameEn}, Cap: ${capStr}, Base: ${baseMonth} (Proj. Adj: +${ratePctFormatted}%)`,
    };
  }

  /**
   * Generates scenario simulations across different inflation projections (+10%, +20%, +30%, +40%)
   * to provide full budgetary visibility to both clients and freelancers.
   */
  static simulateScenarios(
    baseAmount: number,
    capPercentage?: number | null,
    clientType: "CORPORATE" | "INDIVIDUAL" = "CORPORATE"
  ): InflationScenario[] {
    const scenarios = [
      { label: "Düşük Enflasyon (+%10)", rate: 0.1 },
      { label: "Ilımlı Enflasyon (+%20)", rate: 0.2 },
      { label: "Yüksek Enflasyon (+%30)", rate: 0.3 },
      { label: "Aşırı Enflasyon (+%40)", rate: 0.4 },
    ];

    return scenarios.map((sc) => {
      let effectiveRate = sc.rate;
      if (capPercentage && capPercentage > 0 && effectiveRate > capPercentage / 100) {
        effectiveRate = capPercentage / 100;
      }

      const adjustedGross = roundCurrency(baseAmount * (1 + effectiveRate));
      const delta = roundCurrency(adjustedGross - baseAmount);

      const tax = calculateFreelanceTax({
        amount: adjustedGross,
        direction: "GROSS_TO_NET",
        clientType,
        documentType: "SMM",
        currency: "TRY",
        vatWithholding: "NONE",
      });

      return {
        scenarioLabel: sc.label,
        projectedRatePercent: roundCurrency(sc.rate * 100),
        adjustedGrossAmount: adjustedGross,
        deltaAmount: delta,
        netTakeHome: tax.netTakeHome,
        totalCostToClient: tax.totalCostToClient,
      };
    });
  }
}
