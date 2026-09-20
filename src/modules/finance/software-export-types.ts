/**
 * Cross-Border Software Export, GVK 89/13 & KDVK 11/1-a Incentive Types (EK-5)
 *
 * Statutory Compliance:
 * - 193 Sayılı Gelir Vergisi Kanunu (GVK) m. 89/13: Yurt Dışına Verilen Yazılım, Tasarım ve Veri Hizmetlerinde Kazanç İndirimi
 * - 7491 Sayılı Kanun m. 8 & 1 Ocak 2026 Cumhurbaşkanı Kararı (11257 s.): %100 Kazanç İndirimi ve Dövizin Türkiye'ye Getirilmesi Şartı
 * - 5520 Sayılı Kurumlar Vergisi Kanunu (KVK) m. 10/1-ğ: Kurumlar Vergisi Mükellefi Şirketler İçin %100 İndirim
 * - 3065 Sayılı Katma Değer Vergisi Kanunu (KDVK) m. 11/1-a & m. 12/2: Hizmet İhracatı KDV Tam İstisnası (%0 KDV)
 * - Gelir İdaresi Başkanlığı (GİB) e-Fatura / e-SMM İstisna Kodu: 302 - Hizmet İhracatı
 * - 6100 Sayılı HMK m. 193: Münhasır Delil Sözleşmesi ve Vergi Tevsik Kayıtları
 */

export type ExportEligibilityStatus =
  | "ELIGIBLE_FULL_INCENTIVE"
  | "DOMESTIC_STANDARD_TAX"
  | "COMPLIANCE_DEFICIT_WARNING"
  | "FULLY_ELIGIBLE"
  | "CONDITIONALLY_ELIGIBLE"
  | "NON_COMPLIANT";

export type ForeignRemittanceChannel =
  | "SWIFT_WIRE"
  | "PAYONEER_TO_TR_BANK"
  | "WISE_TO_TR_BANK"
  | "DIRECT_SEPA_TO_TR_IBAN"
  | "WISE"
  | "PAYONEER"
  | "STRIPE"
  | "OTHER_LEGAL_FX_REMITTANCE";

export interface SoftwareExportChecklistItem {
  id: string;
  labelTr: string;
  labelEn: string;
  satisfied: boolean;
  requiredForVatExemption: boolean;
  requiredForIncomeTaxIncentive: boolean;
  legalReference: string;
  guidanceTr: string;
  guidanceEn: string;
}

export interface SoftwareExportConfig {
  enabled: boolean;
  clientCountryCode?: string;
  clientCountryName?: string;
  clientCountry?: string;
  clientHasNoPermanentEstablishmentInTr?: boolean;
  isForeignEntity?: boolean;
  exclusiveForeignUtilizationAffirmed?: boolean;
  isServiceUtilizedAbroad?: boolean;
  foreignCurrencyRemittanceWarranted?: boolean;
  repatriationDeclared?: boolean;
  remittanceChannel?: ForeignRemittanceChannel;
  invoiceCurrency?: string;
  invoiceTaxExemptionCode?: string;
  gvkIncentivePercentage?: number;
  vatRate?: number;
  bankName?: string;
  ibanLastFour?: string;
}

export interface SoftwareExportEvaluation {
  isEligible: boolean;
  status: ExportEligibilityStatus;
  isEligibleForFullTaxDeduction: boolean;
  isEligibleForVatZero: boolean;
  taxDeductionRate: number;
  vatRate: number;
  withholdingRate: number;
  gibInvoiceExemptionCode: string | null;
  currency: string;
  amount: number;
  gibVatExemptionCode: string;
  gibExemptionTitleTr: string;
  gibExemptionTitleEn: string;
  gvkExemptionRate: number;
  effectiveTaxRateEstimate: number;
  taxSavingsEstimate: number;
  invoiceNoteTr: string;
  invoiceNoteEn: string;
  bankRemittanceDeclarationTr: string;
  bankRemittanceDeclarationEn: string;
  checklist: SoftwareExportChecklistItem[];
  missingRequirements: string[];
  statutoryBasisTr: string;
  statutoryBasisEn: string;
  auditProtectionPointsTr: string[];
  auditProtectionPointsEn: string[];
  warningsTr: string[];
  warningsEn: string[];
  summaryTr: string;
  summaryEn: string;
}
