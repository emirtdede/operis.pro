/**
 * Cross-Border Software Export & Tax Incentive Engine (GVK 89/13 & KDVK 11/1-a)
 *
 * Statutory & Jurisprudential Compliance:
 * - 193 Sayılı Gelir Vergisi Kanunu (GVK) m. 89/13
 * - 7491 Sayılı Kanun m. 8 & 1 Ocak 2026 Cumhurbaşkanı Kararı (11257 s.): %100 Kazanç İndirimi
 * - 5520 Sayılı Kurumlar Vergisi Kanunu (KVK) m. 10/1-ğ
 * - 3065 Sayılı Katma Değer Vergisi Kanunu (KDVK) m. 11/1-a & m. 12/2 (Hizmet İhracatı)
 * - Gelir İdaresi Başkanlığı (GİB) e-Fatura / e-SMM İstisna Kodu: 302 - Hizmet İhracatı
 * - 6100 Sayılı Hukuk Muhakemeleri Kanunu (HMK) m. 193 (Münhasır Delil Sözleşmesi)
 */

import type {
  ExportEligibilityStatus,
  SoftwareExportChecklistItem,
  SoftwareExportConfig,
  SoftwareExportEvaluation,
} from "./software-export-types";
import { roundCurrency } from "./tax-calculator";

export class SoftwareExportEngine {
  /**
   * Returns a standard baseline configuration for cross-border software export.
   */
  static getDefaultConfig(
    _currency = "USD",
    clientCountry = "US"
  ): SoftwareExportConfig {
    return {
      enabled: true,
      clientCountryCode: clientCountry.toUpperCase(),
      clientCountryName: clientCountry === "US" ? "United States" : clientCountry,
      clientCountry: clientCountry === "US" ? "United States" : clientCountry,
      clientHasNoPermanentEstablishmentInTr: true,
      isForeignEntity: true,
      exclusiveForeignUtilizationAffirmed: true,
      isServiceUtilizedAbroad: true,
      foreignCurrencyRemittanceWarranted: true,
      repatriationDeclared: true,
      remittanceChannel: "SWIFT_WIRE",
      invoiceCurrency: "USD",
      invoiceTaxExemptionCode: "302",
      gvkIncentivePercentage: 100,
      vatRate: 0,
      bankName: "T.C. Ziraat Bankası / İlgili Banka",
    };
  }

  /**
   * Checks if a currency indicates cross-border foreign exchange.
   */
  static isForeignCurrency(currency?: string | null): boolean {
    if (!currency) return false;
    const upper = currency.toUpperCase().trim();
    return upper !== "TRY" && upper !== "TL" && upper !== "₺";
  }

  /**
   * Evaluates eligibility for GVK 89/13 100% income tax deduction and KDVK 11/1-a zero-VAT exemption.
   */
  static evaluateExportEligibility(
    config: SoftwareExportConfig,
    currency = "USD",
    clientCountry = "US",
    amount = 10000
  ): SoftwareExportEvaluation {
    const country = config.clientCountry || config.clientCountryCode || clientCountry || "US";
    const countryUpper = country.toUpperCase();
    const isForeignCountry = countryUpper !== "TR" && countryUpper !== "TURKEY" && countryUpper !== "TÜRKİYE";

    const isForeignEntity = config.isForeignEntity ?? config.clientHasNoPermanentEstablishmentInTr ?? true;
    const isServiceUtilizedAbroad = config.isServiceUtilizedAbroad ?? config.exclusiveForeignUtilizationAffirmed ?? true;
    const repatriationDeclared = config.repatriationDeclared ?? config.foreignCurrencyRemittanceWarranted ?? true;

    const checklist: SoftwareExportChecklistItem[] = [
      {
        id: "foreign_client",
        labelTr: "Hizmet Alanın Yurt Dışında Mukim Olması",
        labelEn: "Non-Resident Foreign Client Status",
        satisfied: isForeignCountry && isForeignEntity,
        requiredForVatExemption: true,
        requiredForIncomeTaxIncentive: true,
        legalReference: "KDVK m. 12/2 & GVK m. 89/13",
        guidanceTr: "Müşterinin kanuni ve iş merkezinin Türkiye dışında olması, Türkiye'de daimi temsilci/şubesi bulunmaması gerekir.",
        guidanceEn: "The client must be a bona fide foreign entity without permanent establishments in Turkey.",
      },
      {
        id: "qualifying_activity",
        labelTr: "Hizmetin Bilişim / Yazılım / Tasarım Niteliğinde Olması",
        labelEn: "Qualifying Technology / Software Engineering Service",
        satisfied: true,
        requiredForVatExemption: true,
        requiredForIncomeTaxIncentive: true,
        legalReference: "GVK m. 89/13 & KVK m. 10/1-ğ",
        guidanceTr: "Yazılım, mimari, veri analizi, ürün testi veya arayüz tasarımı GVK 89/13 kapsamında münhasır teşvik alanıdır.",
        guidanceEn: "Software development, system design, QA, and data analysis qualify for 100% tax incentives.",
      },
      {
        id: "exclusive_foreign_use",
        labelTr: "Hizmetten Münhasıran Yurt Dışında Yararlanılması",
        labelEn: "Exclusive Foreign Utilization & Deployment",
        satisfied: isServiceUtilizedAbroad,
        requiredForVatExemption: true,
        requiredForIncomeTaxIncentive: true,
        legalReference: "3065 s. KDVK m. 11/1-a & m. 12/2 (Kod 302)",
        guidanceTr: "Yazılımın Türkiye pazarındaki kullanıcılara değil, yurt dışı operasyonlara hizmet etmesi zorunludur.",
        guidanceEn: "The software must be deployed and consumed strictly outside the Turkish domestic market.",
      },
      {
        id: "fx_repatriation",
        labelTr: "Döviz Hasılatının Türkiye'deki Bankalara Getirilmesi",
        labelEn: "Foreign Currency Remittance to Turkish Banks",
        satisfied: repatriationDeclared,
        requiredForVatExemption: false,
        requiredForIncomeTaxIncentive: true,
        legalReference: "7491 s. Kanun m. 8 & 2026 Cumhurbaşkanı Kararı (11257 s.)",
        guidanceTr: "Yurt dışı hasılatının tamamı yıllık beyanname verilme süresine kadar Türkiye'deki banka hesabına transfer edilmelidir.",
        guidanceEn: "100% of foreign currency earnings must be repatriated to Turkish banks prior to annual tax filing.",
      },
    ];

    const warningsTr: string[] = [];
    const warningsEn: string[] = [];

    if (!isForeignCountry) {
      warningsTr.push("Müşteri ülkesi Türkiye olarak seçilmiştir. Hizmet ihracatı istisnası uygulanamaz.");
      warningsEn.push("Client country is set to Turkey; cross-border export exemption does not apply.");
    }
    if (!isForeignEntity) {
      warningsTr.push("Müşterinin Türkiye'de işyeri veya şubesi bulunması halinde hizmet ihracatı KDV istisnası uygulanamaz.");
      warningsEn.push("Client having permanent presence in Turkey jeopardizes VAT export exemption.");
    }
    if (!isServiceUtilizedAbroad) {
      warningsTr.push("Hizmetten münhasıran Türkiye dışında faydalanıldığı sözleşmede teyit edilmelidir (Aksi halde %20 KDV cezası riski).");
      warningsEn.push("Exclusive foreign consumption must be certified to prevent retroactive VAT assessment.");
    }
    if (!repatriationDeclared) {
      warningsTr.push("Döviz bedeli Türkiye'deki banka hesabına getirilmezse GVK 89/13 %100 kazanç indirimi hakkı kaybedilir.");
      warningsEn.push("Failure to repatriate foreign exchange revokes statutory GVK 89/13 100% deduction.");
    }

    let status: ExportEligibilityStatus = "FULLY_ELIGIBLE";
    if (!isForeignCountry || !isForeignEntity || !isServiceUtilizedAbroad) {
      status = "NON_COMPLIANT";
    } else if (!repatriationDeclared) {
      status = "CONDITIONALLY_ELIGIBLE";
    } else {
      status = "FULLY_ELIGIBLE";
    }

    const isEligibleForVatZero = isForeignCountry && isForeignEntity && isServiceUtilizedAbroad;
    const isEligibleForFullTaxDeduction = isEligibleForVatZero && repatriationDeclared;

    const normalTaxBurden = roundCurrency(amount * 0.40);
    const exportTaxBurden = isEligibleForFullTaxDeduction ? 0 : normalTaxBurden;
    const taxSavingsEstimate = roundCurrency(normalTaxBurden - exportTaxBurden);

    let summaryTr = "";
    let summaryEn = "";

    if (status === "FULLY_ELIGIBLE") {
      summaryTr = `Tam Uyumlu Yazılım İhracatı Rejimi: %0 KDV (GİB İstisna Kodu 302) ve GVK 89/13 uyarınca %100 gelir vergisi indirimi şartları eksiksiz sağlanmıştır. Yıllık beyannamede vergi matrahından tam indirim uygulanabilir.`;
      summaryEn = `Fully Compliant Software Export: 0% VAT (GİB Code 302) and 100% Tax Deduction under GVK Art. 89/13 fully certified. Foreign earnings qualify for comprehensive statutory tax exemption.`;
    } else if (status === "CONDITIONALLY_ELIGIBLE") {
      summaryTr = `Şartlı Yazılım İhracatı: KDV %0 uygulanabilir; ancak GVK 89/13 %100 kazanç indirimi için döviz bedelinin yıllık gelir vergisi beyannamesi verilme tarihine kadar Türkiye'deki banka hesabına transferi zorunludur.`;
      summaryEn = `Conditionally Eligible: 0% VAT applies; 100% GVK Art. 89/13 tax deduction requires repatriation of proceeds to Turkish banks prior to annual tax filing.`;
    } else {
      summaryTr = `Yurt İçi Standart Vergi Rejimi / Uyumsuzluk: Hizmet Türkiye içinde tüketildiğinden veya alıcı yurt içi yerleşik olduğundan hizmet ihracatı istisnası uygulanamaz.`;
      summaryEn = `Domestic Standard Tax Regime: Deliverables are consumed in Turkey or recipient is domestic; export tax incentives do not apply.`;
    }

    const gibVatExemptionCode = "302";
    const gibExemptionTitleTr = "302 - Hizmet İhracatı (3065 s. KDVK m. 11/1-a & m. 12/2)";
    const gibExemptionTitleEn = "302 - Export of Services (VAT Law No. 3065 Art. 11/1-a)";

    const invoiceNote = this.generateInvoiceNote({
      currency,
      clientCountry: countryUpper,
    });

    const bankDeclaration = this.generateBankRemittanceDeclaration({
      currency,
      amount,
      clientCountry: countryUpper,
      remittanceChannel: config.remittanceChannel,
      bankName: config.bankName,
    });

    return {
      isEligible: isEligibleForFullTaxDeduction,
      status,
      isEligibleForFullTaxDeduction,
      isEligibleForVatZero,
      taxDeductionRate: isEligibleForFullTaxDeduction ? (config.gvkIncentivePercentage || 100) : 0,
      vatRate: isEligibleForVatZero ? 0 : 20,
      withholdingRate: isEligibleForVatZero ? 0 : 20,
      gibInvoiceExemptionCode: isEligibleForVatZero ? "302" : null,
      currency,
      amount,
      gibVatExemptionCode,
      gibExemptionTitleTr,
      gibExemptionTitleEn,
      gvkExemptionRate: isEligibleForFullTaxDeduction ? 100 : 0,
      effectiveTaxRateEstimate: isEligibleForFullTaxDeduction ? 0 : 35,
      taxSavingsEstimate,
      invoiceNoteTr: invoiceNote.tr,
      invoiceNoteEn: invoiceNote.en,
      bankRemittanceDeclarationTr: bankDeclaration.tr,
      bankRemittanceDeclarationEn: bankDeclaration.en,
      checklist,
      missingRequirements: warningsTr,
      statutoryBasisTr: "193 s. GVK m. 89/13, 3065 s. KDVK m. 11/1-a, 7491 s. Kanun & 2026/11257 s. CK",
      statutoryBasisEn: "Income Tax Law (GVK) Art. 89/13, VAT Law (KDVK) Art. 11/1-a, Law No. 7491 & Decree 11257",
      auditProtectionPointsTr: [
        "Sözleşmede 'Hizmetten münhasıran Türkiye dışında faydalanılmıştır' klozunun açıkça yer alması",
        "GİB e-Fatura / e-SMM üzerinde '302 - Hizmet İhracatı' istisna kodunun ve yasal şerhin bulunması",
        "Döviz transferinin banka dekontu / DAB ile tevsik edilmesi ve beyanname tarihine kadar getirilmesi",
        "Operis platformunun HMK m. 193 adli delil mührü ve SHA-256 Merkle root teyidi",
      ],
      auditProtectionPointsEn: [
        "Explicit contractual certification of exclusive foreign consumption barring retroactive VAT",
        "Official GİB Tax Exemption Code 302 and statutory reference cited on invoice",
        "Foreign currency repatriation documented via bank confirmation letters prior to tax return deadline",
        "HMK Art. 193 cryptographic timestamp and SHA-256 Merkle root verification",
      ],
      warningsTr,
      warningsEn,
      summaryTr,
      summaryEn,
    };
  }

  /**
   * Generates official GİB-compliant statutory invoice description text.
   */
  static generateInvoiceNote(
    paramsOrConfig?: any,
    locale?: string
  ): any {
    const tr = `3065 sayılı Katma Değer Vergisi Kanunu m. 11/1-a ve m. 12/2 uyarınca "GİB İSTİSNA KODU: 302 - Hizmet İhracatı" istisna kodu kapsamında KDV'den istisnadır (KDV Oranı: %0, Stopaj Kesintisi: %0). İşbu yazılım geliştirme ve teknoloji hizmeti münhasıran yurt dışındaki müşteri için üretilmiş ve Türkiye dışında faydalanılmıştır. 193 sayılı Gelir Vergisi Kanunu'nun 89/13. maddesi (7491 sayılı Kanun) ve 5520 sayılı KVK m. 10/1-ğ hükümleri uyarınca döviz hasılatının yasal süresinde Türkiye'deki bankalara getirilmesi şartıyla kazancın %100'ü vergi matrahından indirilecektir.`;

    const en = `VAT EXEMPT (VAT Rate: 0%, Withholding: 0%) pursuant to Value Added Tax Law (KDVK) Art. 11/1-a & 12/2 under EXEMPTION CODE: 302 (Cross-Border Service Export). Software engineering deliverables are rendered to a non-resident foreign client and exclusively consumed outside the Republic of Turkey. In accordance with Income Tax Law (GVK) Art. 89/13 (Law No. 7491) and Corporate Tax Law Art. 10/1-ğ, 100% of export income is deductible from taxable income upon repatriation of foreign exchange to Turkish banks.`;

    if (locale === "tr") return tr;
    if (locale === "en") return en;
    if (typeof paramsOrConfig === "string") {
      return paramsOrConfig === "en" ? en : tr;
    }
    return { tr, en };
  }

  /**
   * Generates formal bank repatriation and tax inspection declaration letter.
   */
  static generateBankRemittanceDeclaration(
    paramsOrConfig?: any,
    locale?: string,
    clientName?: string,
    contractorName?: string,
    budgetLabel?: string
  ): any {
    let client = clientName || "[Yabancı Müşteri Adı]";
    let contractor = contractorName || "[Yüklenici / Yazılımcı Adı]";
    let amt = budgetLabel || "10,000 USD";
    let rawBank = "ZİRAAT BANKASI";
    let country = "United States";
    let ref = "OPR-CONTR-EXPO";

    if (paramsOrConfig && typeof paramsOrConfig === "object") {
      if (paramsOrConfig.clientName) client = paramsOrConfig.clientName;
      if (paramsOrConfig.contractorName) contractor = paramsOrConfig.contractorName;
      if (paramsOrConfig.budgetLabel) amt = paramsOrConfig.budgetLabel;
      if (paramsOrConfig.amount) amt = `${paramsOrConfig.amount} ${paramsOrConfig.currency || "USD"}`;
      if (paramsOrConfig.bankName) {
        rawBank = paramsOrConfig.bankName.replace(/^T\.C\.\s*/i, "").replace(/\s*\/.*$/, "").trim() || "ZİRAAT BANKASI";
      }
      if (paramsOrConfig.clientCountry || paramsOrConfig.clientCountryName) {
        country = paramsOrConfig.clientCountry || paramsOrConfig.clientCountryName;
      }
      if (paramsOrConfig.contractRef) ref = paramsOrConfig.contractRef;
    }

    const tr = `T.C. ${rawBank.toLocaleUpperCase("tr-TR")} / İLGİLİ ŞUBE MÜDÜRLÜĞÜ'NE VE İLGİLİ VERGİ DAİRESİ BAŞKANLIĞI'NA

KONU: 193 sayılı GVK 89/13 ve 3065 sayılı KDVK m. 11/1-a Kapsamında Yazılım Hizmet İhracatı Bedeli Döviz Tevsik Dilekçesi

Şubeniz nezdinde bulunan döviz hesabıma yurt dışında mukim ${client} (${country}) firmasından intikal eden / edecek olan ${amt} tutarındaki transfer bedeli; taraflar arasında akdedilen ${ref} referanslı Bağımsız Yazılım ve Teknoloji Hizmet Sözleşmesi tahtında ifa edilen yazılım geliştirme hizmet ihracatı karşılığıdır.

İşbu bedel;
1. 3065 sayılı KDVK m. 11/1-a ve m. 12/2 uyarınca münhasıran yurt dışında faydalanılan "302 - Hizmet İhracatı" istisnasına tabidir (%0 KDV).
2. 7491 sayılı Kanun m. 8 ve 2026/11257 sayılı Cumhurbaşkanı Kararı uyarınca 193 sayılı GVK 89/13 (ve KVK m. 10/1-ğ) kapsamında %100 kazanç indirimine hak kazanılması amacıyla Türkiye'deki banka sistemine intikal ettirilmiştir.
3. Hizmet ihracatı bedeli olduğundan TCMB İhracat Genelgesi ve ilgili mevzuat uyarınca zorunlu döviz bozdurma (İBKB) oranlarından muaftır; Döviz Alım Belgesi (DAB) / döviz dekontunun tarafıma tevsik amacıyla verilmesini arz ederim.

Gereğini ve kayıtlarınıza hizmet ihracatı bedeli olarak işlenmesini saygılarımla arz ederim.

Beyan Eden: ${contractor}
Tarih: ${new Date().toLocaleDateString("tr-TR")}`;

    const en = `TO: ${rawBank.toUpperCase()} BRANCH MANAGEMENT & RELEVANT TAX ADMINISTRATION

SUBJECT: Declaration of Foreign Currency Remittance for Software Services Export under GVK 89/13 & KDVK Art. 11/1-a

The wire remittance of ${amt} received from ${client} (${country}) represents export proceeds for bespoke software engineering services executed pursuant to Smart Services Agreement Ref: ${ref}.

This transaction certifies:
1. Full exemption from VAT (0% VAT) under Statutory Exemption Code 302 (Law No. 3065 Art. 11/1-a).
2. Repatriation of foreign revenues into Turkish banking system satisfying Law No. 7491 and Presidential Decree No. 11257 for 100% income tax deduction under GVK Art. 89/13.
3. CBRT Export Circular compliance: exempt from mandatory currency surrender quotas.

Declarant: ${contractor}
Date: ${new Date().toLocaleDateString("en-US")}`;

    if (locale === "tr") return tr;
    if (locale === "en") return en;
    if (typeof paramsOrConfig === "string") {
      return paramsOrConfig === "en" ? en : tr;
    }
    return { tr, en };
  }

  /**
   * Generates the official bilingual Markdown contract addendum (EK-5: Cross-Border Software Export & Tax Protocol).
   */
  static generateExportAnnexMarkdown(
    config: SoftwareExportConfig,
    locale: "tr" | "en" = "tr",
    clientName = "İş Sahibi (Yabancı Müşteri)",
    contractorName = "Yüklenici (Türkiye Mukimi Yazılımcı)",
    _currency = "USD",
    _amount = 0
  ): string {
    const isTr = locale === "tr";
    const country = config.clientCountry || config.clientCountryCode || "US";

    const channelDisplayTr: Record<string, string> = {
      SWIFT_WIRE: "Doğrudan Bankalararası SWIFT Transferi",
      PAYONEER_TO_TR_BANK: "Payoneer / Platform Bakiyesinden Türk Bankasına Transfer",
      WISE_TO_TR_BANK: "Wise / Uluslararası Fintech Üzerinden Türk IBAN'ına Transfer",
      DIRECT_SEPA_TO_TR_IBAN: "Doğrudan SEPA / Uluslararası Döviz Transferi",
      WISE: "Wise / Uluslararası Fintech Üzerinden Transfer",
      PAYONEER: "Payoneer Platformu Üzerinden Transfer",
      STRIPE: "Stripe Connect / Payout ile Türk Bankasına Transfer",
      OTHER_LEGAL_FX_REMITTANCE: "Diğer Yasal Döviz Transfer Kanalları",
    };

    const channelDisplayEn: Record<string, string> = {
      SWIFT_WIRE: "Direct Interbank SWIFT Wire Transfer",
      PAYONEER_TO_TR_BANK: "Payoneer / Platform Balance to Turkish Bank Account",
      WISE_TO_TR_BANK: "Wise / International Remittance to Turkish IBAN",
      DIRECT_SEPA_TO_TR_IBAN: "Direct SEPA / Foreign Currency Wire",
      WISE: "Wise International Remittance",
      PAYONEER: "Payoneer Platform Remittance",
      STRIPE: "Stripe Connect / Remittance to Turkish Bank",
      OTHER_LEGAL_FX_REMITTANCE: "Other Lawful Foreign Currency Remittance",
    };

    const channelTr = channelDisplayTr[config.remittanceChannel || "SWIFT_WIRE"] || "SWIFT Transferi";
    const channelEn = channelDisplayEn[config.remittanceChannel || "SWIFT_WIRE"] || "SWIFT Wire";

    if (isTr) {
      return `# EK-5: YAZILIM İHRACATI %100 GELİR VERGİSİ İNDİRİMİ VE KDV İSTİSNASI ŞARTNAMESİ
**Mevzuat Dayanağı:** 193 sayılı Gelir Vergisi Kanunu m. 89/13 (7491 s. Kanun & 2026/11257 s. Cumhurbaşkanı Kararı), 5520 sayılı Kurumlar Vergisi Kanunu m. 10/1-ğ, 3065 sayılı Katma Değer Vergisi Kanunu m. 11/1-a & m. 12/2 (Hizmet İhracatı), 6100 sayılı HMK m. 193

İşbu Şartname; İş Sahibi (${clientName}) ile Yüklenici (${contractorName}) arasındaki ana sözleşmenin ayrılmaz bir parçası olup taraflar arasındaki yazılım ve teknoloji hizmetlerinin sınır ötesi ihracat rejimine uygunluğunu, vergi muafiyet şartlarını ve tarafların yasal mükellefiyetlerini düzenler.

---

### MADDE 1: HUKUKİ MEVZUAT DAYANAĞI VE TEŞVİK KAPSAMI
1.1. **%100 Gelir Vergisi İndirimi (GVK m. 89/13):** Türkiye'de yerleşik Yüklenici tarafından, kanuni ve iş merkezi Türkiye'de bulunmayan, Türkiye'de herhangi bir daimi temsilciliği veya şubesi olmayan İş Sahibi'ne münhasıran yurt dışında faydalanılmak üzere verilen yazılım, tasarım, veri analizi ve teknoloji hizmetlerinden elde edilen kazancın **%100'ü** (tamamı), 7491 sayılı Kanun ve 2026/11257 sayılı Cumhurbaşkanı Kararı uyarınca gelir vergisi matrahından indirilir.
1.2. **Kurumlar Vergisi İndirimi (KVK m. 10/1-ğ):** Yüklenici'nin sermaye şirketi (Ltd./A.Ş.) olması halinde aynı şartlarla elde edilen hasılat kurum kazancından %100 oranında indirilir.

---

### MADDE 2: MÜNHASIRAN YURT DIŞINDA FAYDALANMA GÜVENCESİ (KDVK m. 11/1-a & 12/2)
2.1. İş Sahibi (${clientName}), işbu sözleşme kapsamında teslim edilen yazılım, kaynak kodları, mimari altyapı ve ilgili dijital çıktıların Türkiye Cumhuriyeti sınırları içindeki kişi veya kurumlara yönelik olmadığını; **münhasıran yurt dışındaki (${country}) ticari faaliyetlerinde, sunucularında ve küresel operasyonlarında kullanılacağını** gayrikabili rücu kabul, beyan ve taahhüt eder.
2.2. Bu beyan; Katma Değer Vergisi Genel Uygulama Tebliği uyarınca hizmet ihracatı sayılmanın zorunlu yasal şartı olup, vergi idaresinin geçmişe dönük olası KDV tarhiyatlarına ve vergi ziyaı cezalarına karşı kesin delil (HMK m. 193) teşkil eder.

---

### MADDE 3: %0 KDV VE GİB E-FATURA İSTİSNA KODU (KOD 302)
3.1. Hizmet bedeli üzerinden 3065 sayılı KDVK m. 11/1-a uyarınca **%0 KDV (KDV İstisnası)** uygulanacaktır.
3.2. Yüklenici tarafından düzenlenecek e-Fatura veya e-Serbest Meslek Makbuzunda (e-SMM); Gelir İdaresi Başkanlığı'nın resmi **"302 - Hizmet İhracatı (3065 sayılı KDVK m. 11/1-a)"** istisna kodu kullanılacak ve faturanın açıklama hanesine yasal istisna şerhi işlenecektir.
3.3. İş Sahibi yabancı mükellef olduğundan Türkiye içi stopaj (tevkifat) kesintisi uygulanmaz.

---

### MADDE 4: DÖVİZ BEDELİNİN TEVSİKİ VE TÜRKİYE'YE TRANSFERİ
4.1. GVK m. 89/13'teki %100 vergi teşvikinden faydalanılabilmesi için hizmet bedelinin tamamının, ilgili takvim yılına ait yıllık gelir/kurumlar vergisi beyannamesinin verilmesi gereken tarihe kadar Türkiye'deki bankalara transfer edilmesi zorunludur.
4.2. **Kararlaştırılan Transfer Kanalı:** ${channelTr}
4.3. Yurt dışından gelen döviz transferleri, Türkiye Cumhuriyet Merkez Bankası (TCMB) İhracat Genelgesi uyarınca hizmet ihracatı sayıldığından zorunlu döviz bozdurma (İBKB) kotasından muaftır. Banka tarafından düzenlenecek Döviz Alım Belgesi (DAB) ve hesap dekontu resmi tevsik edici belge niteliğindedir.

---

### MADDE 5: 6100 SAYILI HMK m. 193 UYARINCA ADLİ VE MALİ DELİL NİTELİĞİ
İşbu şartname ve Operis platformu tarafından üretilen SHA-256 dijital mühürlü kayıtlar, T.C. Hazine ve Maliye Bakanlığı Vergi Denetim Kurulu, Gelir İdaresi Başkanlığı ve adli merciler nezdinde 6100 sayılı Hukuk Muhakemeleri Kanunu m. 193 ve m. 199 anlamında kesin delil sözleşmesi hükmündedir.`;
    }

    return `# ANNEX-5: 100% CROSS-BORDER SOFTWARE EXPORT TAX INCENTIVE & ZERO-VAT PROTOCOL
**Statutory Authorities:** Turkish Income Tax Law (GVK) Art. 89/13 (Law No. 7491 & Presidential Decree No. 11257), Corporate Tax Law (KVK) Art. 10/1-ğ, Value Added Tax Law (KDVK) Art. 11/1-a & 12/2 (Export of Services), Code of Civil Procedure (HMK) Art. 193

This Addendum constitutes an integral exhibit to the principal contract, governing cross-border software export certification, 0% VAT issuance, and 100% tax deduction prerequisites.

---

### ARTICLE 1: STATUTORY EXEMPTION & 100% INCOME TAX DEDUCTION
1.1. **100% Tax Deduction (GVK Art. 89/13):** Software engineering, architecture, QA, and technological deliverables executed by Turkish resident Contractor for non-resident Client (${clientName}) lacking any permanent establishment in Turkey qualify for **100% deduction from taxable income** pursuant to Law No. 7491 and Decree No. 11257.
1.2. **Corporate Deductions (KVK Art. 10/1-ğ):** If Contractor operates as an incorporated entity, qualifying export revenues are deducted at 100% from corporate taxable profit.

---

### ARTICLE 2: EXCLUSIVE FOREIGN CONSUMPTION & UTILIZATION (KDVK Art. 11/1-a)
2.1. The Client irrevocably covenants that deliverables are commissioned strictly for operations outside the Republic of Turkey (${country}), with zero commercial consumption within the Turkish domestic territory.
2.2. This contractual certification bars retroactive domestic VAT claims and tax penalties under Turkish Tax Procedure Code.

---

### ARTICLE 3: ZERO-RATED VAT & GİB EXEMPTION CODE 302
3.1. Invoicing shall be rendered at **0% VAT** under statutory export regime.
3.2. Contractor's statutory tax invoice shall cite Tax Authority Exemption Code **"302 - Export of Services (KDVK Art. 11/1-a)"**.
3.3. No domestic Turkish tax withholding applies to foreign non-resident remittances.

---

### ARTICLE 4: CURRENCY REPATRIATION & REVENUE PROOF
4.1. 100% of foreign proceeds must be remitted to the Contractor's Turkish bank account prior to annual tax filing deadlines.
4.2. **Designated Remittance Channel:** ${channelEn}
4.3. Proceeds remain exempt from mandatory central bank currency surrender quotas pursuant to CBRT Export Circulars.

---

### ARTICLE 5: BINDING FORENSIC EVIDENCE (HMK Art. 193)
Digital records, SHA-256 Merkle root hashes, and bank remittance records generated hereunder constitute conclusive evidentiary exhibits pursuant to HMK Art. 193 and Art. 199.`;
  }

  /**
   * Generates clean HTML presentation of EK-5 for official print and executive preview.
   */
  static generateExportAnnexHtml(
    config: SoftwareExportConfig,
    locale: "tr" | "en" = "tr"
  ): string {
    const isTr = locale === "tr";
    const country = config.clientCountry || config.clientCountryCode || "US";

    return `
  <div style="margin: 20px 0; border: 1px solid #0d9488; background: #f0fdfa; border-radius: 8px; padding: 14px; page-break-inside: avoid;">
    <div style="font-weight: 700; color: #0f766e; font-size: 10pt; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
      <span>🌍 ${
        isTr
          ? "EK-5: Yazılım İhracatı %100 Vergi İndirimi ve %0 KDV Şartnamesi (GVK 89/13 & KDVK 11/1-a)"
          : "ANNEX-5: Cross-Border Software Export 100% Tax Incentive & Zero-VAT Protocol"
      }</span>
      <span style="background: #ccfbf1; color: #0f766e; padding: 2px 8px; border-radius: 4px; font-size: 8pt; font-family: monospace;">GİB Kod 302</span>
    </div>
    <div style="font-size: 8.5pt; color: #115e59; margin-bottom: 10px; line-height: 1.5;">
      ${
        isTr
          ? "7491 sayılı Kanun ve 2026/11257 sayılı Cumhurbaşkanı Kararı uyarınca kazancın %100'ü gelir/kurumlar vergisinden indirilir. KDVK 11/1-a uyarınca faturada %0 KDV hesaplanır."
          : "Pursuant to Law No. 7491 and Decree No. 11257, 100% of export revenues are deductible from taxable income, and invoiced at 0% VAT."
      }
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 8px;">
      <tbody>
        <tr style="border-bottom: 1px solid #99f6e4;">
          <td style="padding: 4px 6px; font-weight: 600; width: 35%;">${isTr ? "Müşteri Mukim Ülke" : "Client Country"}:</td>
          <td style="padding: 4px 6px;">${country} (Yurt Dışı / Non-Resident)</td>
        </tr>
        <tr style="border-bottom: 1px solid #99f6e4;">
          <td style="padding: 4px 6px; font-weight: 600;">${isTr ? "Faydalanma Yeri" : "Place of Utilization"}:</td>
          <td style="padding: 4px 6px;">${isTr ? "Münhasıran Yurt Dışı (KDVK 11/1-a & 12/2)" : "Exclusively Outside Turkey (Export of Services)"}</td>
        </tr>
        <tr style="border-bottom: 1px solid #99f6e4;">
          <td style="padding: 4px 6px; font-weight: 600;">${isTr ? "GİB e-Fatura / e-SMM Kodu" : "Tax Exemption Code"}:</td>
          <td style="padding: 4px 6px;"><strong>302 - Hizmet İhracatı</strong> (%0 KDV & %0 Stopaj)</td>
        </tr>
        <tr>
          <td style="padding: 4px 6px; font-weight: 600;">${isTr ? "Döviz Tevsiki & HMK 193" : "FX Repatriation & Evidentiary Proof"}:</td>
          <td style="padding: 4px 6px;">${isTr ? "Beyanname süresine kadar bankaya intikal ettirilecektir (Kesin Delil)." : "Repatriation to Turkish bank verified prior to annual tax filing."}</td>
        </tr>
      </tbody>
    </table>
  </div>`;
  }
}
