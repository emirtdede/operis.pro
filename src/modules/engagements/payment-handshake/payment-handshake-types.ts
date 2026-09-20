/**
 * Bilateral Payment Handshake Protocol Types
 * Zero-custodial escrow, peer-to-peer bank transfer handshake & settlement audit trail.
 */

export type TransferChannel = "FAST" | "EFT" | "HAVALE" | "SWIFT" | "OTHER";

export type SupportedBank =
  | "GARANTI_BBVA"
  | "IS_BANKASI"
  | "YAPI_KREDI"
  | "AKBANK"
  | "ZIRAAT"
  | "VAKIFBANK"
  | "HALKBANK"
  | "QNB"
  | "ENPARA"
  | "DENIZBANK"
  | "TEB"
  | "KUVEYT_TURK"
  | "PAPARA"
  | "OTHER";

export type PaymentHandshakeStatus =
  | "UNPAID"
  | "PAYMENT_DECLARED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_DISPUTED";

export type PaymentDisputeReason =
  | "FUNDS_NOT_RECEIVED"
  | "AMOUNT_MISMATCH"
  | "WRONG_IBAN_TARGET"
  | "SUSPECTED_INVALID_RECEIPT"
  | "OTHER";

export interface DeclarePaymentInput {
  senderBank: SupportedBank | string;
  transferChannel: TransferChannel;
  referenceNumber: string;
  declaredAmount?: number;
  currency?: string;
  transferDate?: string;
  transferTime?: string;
  senderAccountName?: string;
  paymentReceiptUrl?: string;
  notes?: string;
  clientIp?: string;
  expectedSettlementAt?: string;
  settlementWindowNote?: string;
}

export interface ConfirmPaymentInput {
  invoiceNumber?: string;
  confirmationNote?: string;
  clientIp?: string;
}

export interface DisputePaymentInput {
  disputeReason: PaymentDisputeReason;
  disputeNote: string;
  clientIp?: string;
}

export interface HandshakeAuditEntry {
  action: "PAYMENT_DECLARED" | "PAYMENT_CONFIRMED" | "PAYMENT_DISPUTED" | "PAYMENT_REVERTED";
  actorRole: "EMPLOYER" | "SPECIALIST" | "SYSTEM";
  actorUserId: string;
  timestamp: string;
  ip?: string;
  metadata: Record<string, unknown>;
}

export interface PaymentTimingGuidance {
  isOutsideHours: boolean;
  channel: TransferChannel;
  warningTr?: string;
  warningEn?: string;
  expectedSettlementTr: string;
  expectedSettlementEn: string;
  slaHours: number;
}

export interface PaymentSettlementCertificate {
  certificateId: string;
  engagementId: string;
  milestoneId: string;
  milestoneSequence: number;
  milestoneTitle: string;
  amount: number;
  currency: string;
  payer: {
    userId: string;
    senderBank: string;
    transferChannel: TransferChannel;
    referenceNumber: string;
    declaredAt: string;
    declarationSeal: string;
  };
  payee: {
    userId: string;
    invoiceNumber?: string;
    confirmedAt: string;
    confirmationSeal: string;
  };
  dualSeal: string;
  legalDischargeClauseTr: string;
  legalDischargeClauseEn: string;
  legalEvidentiaryClauseTr: string;
  legalEvidentiaryClauseEn: string;
  createdAt: string;
}

