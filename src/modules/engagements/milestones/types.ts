import crypto from "node:crypto";
import { MilestoneDeliverableUrlType } from "../milestone-synthesizer";
import {
  TransferChannel,
  SupportedBank,
  PaymentDisputeReason,
  DeclarePaymentInput,
  ConfirmPaymentInput,
  DisputePaymentInput,
  PaymentSettlementCertificate,
  PaymentTimingGuidance,
  HandshakeAuditEntry,
} from "../payment-handshake/payment-handshake-types";
import { IpAssignmentDeed } from "../ip-assignment/ip-assignment-types";

export type {
  TransferChannel,
  SupportedBank,
  PaymentDisputeReason,
  DeclarePaymentInput,
  ConfirmPaymentInput,
  DisputePaymentInput,
  PaymentSettlementCertificate,
  PaymentTimingGuidance,
  HandshakeAuditEntry,
  IpAssignmentDeed,
};

export type DeliverableStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "ACCEPTED";
export type PaymentLedgerStatus = "UNPAID" | "MARKED_PAID" | "CONFIRMED_PAID" | "DISPUTED_PAID";

export interface MilestoneAuditEntry {
  action: string;
  actorUserId: string;
  timestamp: string;
  note?: string;
  ip?: string;
}

export interface MilestoneDto {
  id: string;
  engagementId: string;
  sequenceNumber: number;
  title: string;
  description: string;
  deliverableCriteria: string | null;
  percentage: number;
  amount: number;
  currency: string;
  targetDate: string | null;
  deliverableStatus: DeliverableStatus;
  deliverableNote: string | null;
  deliverableUrl: string | null;
  deliverableUrlType: MilestoneDeliverableUrlType | null;
  submittedAt: string | null;
  acceptedAt: string | null;
  paymentStatus: PaymentLedgerStatus;
  paymentReference: string | null;
  paymentReceiptUrl: string | null;
  invoiceNumber: string | null;
  paidMarkedAt: string | null;
  paidConfirmedAt: string | null;
  sha256Seal: string | null;
  // Bilateral Payment Handshake Enrichment
  senderBank?: string | null;
  transferChannel?: string | null;
  transferDate?: string | null;
  transferTime?: string | null;
  disputeReason?: string | null;
  disputeNote?: string | null;
  dualSeal?: string | null;
  settlementCertificate?: PaymentSettlementCertificate | null;
  timingGuidance?: PaymentTimingGuidance | null;
  auditTrail?: HandshakeAuditEntry[] | null;
  // Formal FSEK m. 48-52 IP Assignment Deed
  gitCommitHash?: string | null;
  ipAssignmentDeed?: IpAssignmentDeed | null;
}

export interface MilestonePlanResult {
  engagementId: string;
  milestones: MilestoneDto[];
  totalAmount: number;
  currency: string;
  deliverablesProgressPercent: number; // 0 - 100
  paymentProgressPercent: number; // 0 - 100
  allDeliverablesAccepted: boolean;
  allPaymentsConfirmed: boolean;
  isOwner: boolean;
  isFreelancer: boolean;
  canManage: boolean;
}

export interface UpdateDeliverableInput {
  status: "IN_PROGRESS" | "SUBMITTED" | "NOT_STARTED";
  deliverableNote?: string;
  deliverableUrl?: string;
  deliverableUrlType?: MilestoneDeliverableUrlType;
  gitCommitHash?: string;
  clientIp?: string;
}

export interface MarkPaymentInput {
  paymentReference?: string;
  paymentReceiptUrl?: string;
  senderBank?: SupportedBank | string;
  transferChannel?: TransferChannel;
  declaredAmount?: number;
  currency?: string;
  transferDate?: string;
  transferTime?: string;
  senderAccountName?: string;
  notes?: string;
  clientIp?: string;
}

export interface CustomMilestoneInputItem {
  sequenceNumber: number;
  title: string;
  description: string;
  deliverableCriteria?: string;
  percentage: number;
  amount: number;
  currency?: string;
  targetDate?: string;
  deliverableUrlType?: MilestoneDeliverableUrlType;
}

// In-memory fallback for test & mock environments
export const inMemoryMilestones = new Map<string, MilestoneDto[]>();

export function calculateSha256Seal(data: Record<string, unknown>): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(data), "utf8")
    .digest("hex");
}

export function computeMilestoneMetrics(
  milestones: MilestoneDto[],
  isOwner: boolean,
  isFreelancer: boolean
): MilestonePlanResult {
  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
  const currency = milestones[0]?.currency || "TRY";

  // Deliverable progress: ACCEPTED counts 100%, SUBMITTED counts 70%, IN_PROGRESS counts 30%
  const totalPoints = milestones.length * 100;
  let currentPoints = 0;
  let confirmedPaidAmount = 0;

  for (const m of milestones) {
    if (m.deliverableStatus === "ACCEPTED") currentPoints += 100;
    else if (m.deliverableStatus === "SUBMITTED") currentPoints += 70;
    else if (m.deliverableStatus === "IN_PROGRESS") currentPoints += 30;

    if (m.paymentStatus === "CONFIRMED_PAID") {
      confirmedPaidAmount += m.amount;
    } else if (m.paymentStatus === "MARKED_PAID") {
      confirmedPaidAmount += m.amount * 0.9;
    }
  }

  const deliverablesProgressPercent =
    totalPoints > 0 ? Math.min(100, Math.round((currentPoints / totalPoints) * 100)) : 0;
  const paymentProgressPercent =
    totalAmount > 0 ? Math.min(100, Math.round((confirmedPaidAmount / totalAmount) * 100)) : 0;

  const allDeliverablesAccepted =
    milestones.length > 0 && milestones.every((m) => m.deliverableStatus === "ACCEPTED");
  const allPaymentsConfirmed =
    milestones.length > 0 && milestones.every((m) => m.paymentStatus === "CONFIRMED_PAID");

  return {
    engagementId: milestones[0]?.engagementId || "",
    milestones,
    totalAmount: Math.round(totalAmount * 100) / 100,
    currency,
    deliverablesProgressPercent,
    paymentProgressPercent,
    allDeliverablesAccepted,
    allPaymentsConfirmed,
    isOwner,
    isFreelancer,
    canManage: isOwner || isFreelancer,
  };
}
