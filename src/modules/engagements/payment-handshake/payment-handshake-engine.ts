import crypto from "node:crypto";
import {
  TransferChannel,
  PaymentSettlementCertificate,
  PaymentTimingGuidance,
} from "./payment-handshake-types";

export class PaymentHandshakeEngine {
  /**
   * Maximum transaction limit for TCMB FAST transfers (TRY).
   */
  static readonly FAST_LIMIT_TRY = 100_000;

  /**
   * Validates the bank reference number format depending on the payment channel.
   */
  static validateReferenceFormat(
    channel: TransferChannel,
    refNo: string
  ): { isValid: boolean; error?: string; warning?: string } {
    const trimmed = (refNo || "").trim();
    if (!trimmed) {
      return {
        isValid: false,
        error: "Ödeme referansı veya transfer açıklaması boş bırakılamaz.",
      };
    }

    if (trimmed.length < 6) {
      return {
        isValid: false,
        error: "Ödeme referans numarası en az 6 karakter olmalıdır.",
      };
    }

    // Special channel specific heuristics
    if (channel === "FAST") {
      if (trimmed.length < 8) {
        return {
          isValid: true,
          warning:
            "TCMB FAST referans kodları genellikle 24-32 hanelidir; girdiğiniz referans kısa görünüyor, lütfen kontrol edin.",
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Checks if current time is outside Turkish Banking EFT hours (09:00 - 17:00 on weekdays, UTC+3).
   */
  static isOutsideEftHours(date: Date = new Date()): boolean {
    // Convert to Turkey Time (UTC+3)
    const utcHours = date.getUTCHours();
    const turkeyHours = (utcHours + 3) % 24;
    const turkeyDay = (date.getUTCDay() + Math.floor((utcHours + 3) / 24)) % 7;

    // 0 is Sunday, 6 is Saturday
    const isWeekend = turkeyDay === 0 || turkeyDay === 6;
    const isOutsideHours = turkeyHours < 9 || turkeyHours >= 17;

    return isWeekend || isOutsideHours;
  }

  /**
   * Computes human-friendly timing guidance and warning cards based on transfer channel,
   * Turkish banking settlement hours, and amount limits.
   */
  static getTimingGuidance(
    channel: TransferChannel,
    amount: number,
    date: Date = new Date()
  ): PaymentTimingGuidance {
    const isOutside = this.isOutsideEftHours(date);

    if (channel === "FAST") {
      const isOverLimit = amount > this.FAST_LIMIT_TRY;
      return {
        isOutsideHours: false,
        channel,
        slaHours: 4,
        warningTr: isOverLimit
          ? `TCMB FAST üst limiti ${this.FAST_LIMIT_TRY.toLocaleString("tr-TR")} TL'dir. Tutar bu limitin üzerinde olduğu için bankanız işlemi standart EFT olarak sıraya almış olabilir.`
          : undefined,
        warningEn: isOverLimit
          ? `TCMB FAST transaction limit is ${this.FAST_LIMIT_TRY.toLocaleString("en-US")} TRY. Amounts above this may be queued as standard EFT by your bank.`
          : undefined,
        expectedSettlementTr: "FAST ile transfer 7/24 saniyeler içinde hesaba geçer.",
        expectedSettlementEn: "FAST transfers settle 24/7 within seconds.",
      };
    }

    if (channel === "EFT") {
      return {
        isOutsideHours: isOutside,
        channel,
        slaHours: isOutside ? 72 : 24,
        warningTr: isOutside
          ? "TCMB EFT mesai saatleri (Hafta içi 09:00 - 17:00) dışındasınız. Transferiniz bankanız tarafından ilk iş günü saat 09:00'da işleme alınacaktır. Yazılımcının onay süresi buna göre ayarlanmıştır."
          : undefined,
        warningEn: isOutside
          ? "You are outside Central Bank EFT hours (Weekdays 09:00 - 17:00 UTC+3). Your transfer will be processed on the next business day at 09:00."
          : undefined,
        expectedSettlementTr: isOutside
          ? "İlk iş günü 09:00 - 10:30 arasında hesaba geçmesi beklenir."
          : "Mesai saatleri içinde ortalama 15-45 dakika içinde hesaba geçer.",
        expectedSettlementEn: isOutside
          ? "Expected to settle between 09:00 - 10:30 on the next business day."
          : "Expected to settle within 15-45 minutes during business hours.",
      };
    }

    // HAVALE / SWIFT / OTHER
    return {
      isOutsideHours: false,
      channel,
      slaHours: channel === "SWIFT" ? 96 : 12,
      expectedSettlementTr:
        channel === "HAVALE"
          ? "Aynı banka içi havale 7/24 anında hesaba geçer."
          : "Uluslararası SWIFT transferleri 1-3 iş günü sürebilir.",
      expectedSettlementEn:
        channel === "HAVALE"
          ? "Intra-bank transfers settle instantly 24/7."
          : "International SWIFT transfers typically take 1-3 business days.",
    };
  }

  /**
   * Generates a deterministic SHA-256 seal for the Employer's payment declaration.
   */
  static calculateDeclarationSeal(data: {
    milestoneId: string;
    senderBank: string;
    transferChannel: string;
    referenceNumber: string;
    amount: number;
    currency: string;
    userId: string;
    timestamp: string;
    ip?: string;
  }): string {
    const payload = JSON.stringify({
      milestoneId: data.milestoneId,
      senderBank: data.senderBank,
      channel: data.transferChannel,
      ref: data.referenceNumber.trim().toUpperCase(),
      amount: data.amount,
      currency: data.currency.toUpperCase(),
      userId: data.userId,
      timestamp: data.timestamp,
      ip: data.ip || "unknown",
    });

    return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
  }

  /**
   * Generates a dual-chained SHA-256 seal linking the Employer's declaration and Specialist's confirmation.
   */
  static calculateConfirmationDualSeal(
    declarationSeal: string,
    data: {
      milestoneId: string;
      invoiceNumber?: string;
      userId: string;
      timestamp: string;
      ip?: string;
    }
  ): string {
    const payload = JSON.stringify({
      declarationSeal,
      milestoneId: data.milestoneId,
      invoice: (data.invoiceNumber || "").trim().toUpperCase(),
      userId: data.userId,
      timestamp: data.timestamp,
      ip: data.ip || "unknown",
    });

    return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
  }

  /**
   * Generates the official Bilateral Proof of Settlement and Debt Discharge Certificate (İtfa & İbraname).
   */
  static generateSettlementCertificate(params: {
    engagementId: string;
    milestoneId: string;
    milestoneSequence: number;
    milestoneTitle: string;
    amount: number;
    currency: string;
    payerUserId: string;
    senderBank: string;
    transferChannel: TransferChannel;
    referenceNumber: string;
    declaredAt: string;
    declarationSeal: string;
    payeeUserId: string;
    invoiceNumber?: string;
    confirmedAt: string;
    confirmationSeal: string;
    dualSeal: string;
  }): PaymentSettlementCertificate {
    const certificateId = `CERT-SETTLE-${params.milestoneId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const legalDischargeClauseTr =
      "Taraflar, yukarıda dökümü yapılan hakediş tutarının banka transferi vasıtasıyla eksiksiz ödendiğini ve tahsil edildiğini; anılan aşama kapsamındaki edimler ve mali haklar bakımından Türk Borçlar Kanunu m. 132 ve FSEK m. 48 uyarınca birbirlerini gayrikabili rücu ibra ettiklerini beyan ve teyit ederler.";

    const legalDischargeClauseEn =
      "The parties hereby declare and confirm that the milestone fee outlined above has been settled and received in full via direct bank transfer, and mutually release and discharge each other from any further financial claims regarding this completed milestone.";

    const legalEvidentiaryClauseTr =
      "İşbu elektronik mutabakat ve kriptografik çift mühür (dual-seal), 6100 sayılı Hukuk Muhakemeleri Kanunu m. 193 uyarınca taraflar arasında bağlayıcı münhasır delil sözleşmesi niteliğindedir. İşveren borcunu ödediğini, yazılımcı ise tahsilatı eksiksiz yaptığını gayrikabili rücu kabul eder.";

    const legalEvidentiaryClauseEn =
      "This digital record and cryptographic dual-seal constitute binding exclusive evidence under Article 193 of the Code of Civil Procedure (HMK). The employer irrecoverably acknowledges full settlement, and the specialist confirms irrevocable collection.";

    return {
      certificateId,
      engagementId: params.engagementId,
      milestoneId: params.milestoneId,
      milestoneSequence: params.milestoneSequence,
      milestoneTitle: params.milestoneTitle,
      amount: params.amount,
      currency: params.currency,
      payer: {
        userId: params.payerUserId,
        senderBank: params.senderBank,
        transferChannel: params.transferChannel,
        referenceNumber: params.referenceNumber,
        declaredAt: params.declaredAt,
        declarationSeal: params.declarationSeal,
      },
      payee: {
        userId: params.payeeUserId,
        invoiceNumber: params.invoiceNumber,
        confirmedAt: params.confirmedAt,
        confirmationSeal: params.confirmationSeal,
      },
      dualSeal: params.dualSeal,
      legalDischargeClauseTr,
      legalDischargeClauseEn,
      legalEvidentiaryClauseTr,
      legalEvidentiaryClauseEn,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Renders the Certificate as a clean, printable legal Markdown document.
   */
  static formatSettlementCertificateMarkdown(cert: PaymentSettlementCertificate): string {
    return `# OPERIS TAHKİKAT VE İTFA BELGESİ (PROOF OF SETTLEMENT)
**Belge ID:** \`${cert.certificateId}\`  
**Oluşturulma Tarihi:** ${new Date(cert.createdAt).toLocaleString("tr-TR")}

---

### 1. Hakediş ve Proje Bilgileri
- **Sözleşme/İş Birliği ID:** \`${cert.engagementId}\`
- **Aşama (Milestone):** #${cert.milestoneSequence} - ${cert.milestoneTitle}
- **Mutabık Kalınan Tutar:** **${cert.amount.toLocaleString("tr-TR")} ${cert.currency}**

### 2. Ödeyen (İşveren) Beyan ve Banka Dökümü
- **İşveren Kullanıcı ID:** \`${cert.payer.userId}\`
- **Gönderen Banka:** ${cert.payer.senderBank}
- **Transfer Kanalı:** ${cert.payer.transferChannel}
- **Banka Referans / FAST Sorgu No:** \`${cert.payer.referenceNumber}\`
- **Ödeme Beyan Zamanı:** ${new Date(cert.payer.declaredAt).toLocaleString("tr-TR")}
- **Beyan SHA-256 İmzası:** \`${cert.payer.declarationSeal}\`

### 3. Alıcı (Yazılımcı) Tahsilat Onayı
- **Yazılımcı Kullanıcı ID:** \`${cert.payee.userId}\`
- **Fatura / e-SMM Numarası:** ${cert.payee.invoiceNumber ? `\`${cert.payee.invoiceNumber}\`` : "Serbest Meslek Makbuzu / Muafiyet"}
- **Tahsilat Teyit Zamanı:** ${new Date(cert.payee.confirmedAt).toLocaleString("tr-TR")}
- **Teyit SHA-256 İmzası:** \`${cert.payee.confirmationSeal}\`

---

### 4. Kriptografik Çift Mühür (Bilateral Dual-Seal)
\`\`\`
SHA256: ${cert.dualSeal}
\`\`\`

### 5. Yasal Hüküm ve İbraname (TBK m. 132 / FSEK m. 48)
> ${cert.legalDischargeClauseTr}
> 
> *${cert.legalDischargeClauseEn}*

### 6. HMK m. 193 Münhasır Delil Sözleşmesi Hükmü
> ${cert.legalEvidentiaryClauseTr}
> 
> *${cert.legalEvidentiaryClauseEn}*
`;
  }
}
