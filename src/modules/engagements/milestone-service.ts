import {
  type TransferChannel,
  type SupportedBank,
  type PaymentDisputeReason,
  type DeclarePaymentInput,
  type ConfirmPaymentInput,
  type DisputePaymentInput,
  type PaymentSettlementCertificate,
  type PaymentTimingGuidance,
  type HandshakeAuditEntry,
  type IpAssignmentDeed,
  type DeliverableStatus,
  type PaymentLedgerStatus,
  type MilestoneAuditEntry,
  type MilestoneDto,
  type MilestonePlanResult,
  type UpdateDeliverableInput,
  type MarkPaymentInput,
  type CustomMilestoneInputItem,
  inMemoryMilestones,
  calculateSha256Seal,
  MilestoneStatusService,
  MilestonePayoutService,
  MilestoneEvidenceService,
} from "./milestones";

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
  DeliverableStatus,
  PaymentLedgerStatus,
  MilestoneAuditEntry,
  MilestoneDto,
  MilestonePlanResult,
  UpdateDeliverableInput,
  MarkPaymentInput,
  CustomMilestoneInputItem,
};

export { inMemoryMilestones };

export class MilestoneService {
  /**
   * Generates a 64-character SHA-256 seal for milestone audit state.
   */
  static calculateSha256Seal(data: Record<string, unknown>): string {
    return calculateSha256Seal(data);
  }

  /**
   * Retrieves or auto-synthesizes the milestone roadmap for an active engagement.
   */
  static async getMilestones(
    engagementId: string,
    currentUserId: string
  ): Promise<MilestonePlanResult> {
    return MilestoneStatusService.getMilestones(engagementId, currentUserId);
  }

  /**
   * Initializes or updates the entire milestone plan (CRUD), strictly validating 100% percentage sum.
   */
  static async updateMilestonePlan(
    engagementId: string,
    items: CustomMilestoneInputItem[],
    userId: string,
    clientIp = "127.0.0.1"
  ): Promise<{
    success: boolean;
    milestones: MilestoneDto[];
    messageTr: string;
    messageEn: string;
  }> {
    return MilestoneStatusService.updateMilestonePlan(engagementId, items, userId, clientIp);
  }

  /**
   * Updates deliverable progress by freelancer (e.g. IN_PROGRESS or SUBMITTED with proof link).
   */
  static async updateDeliverable(
    engagementId: string,
    milestoneId: string,
    input: UpdateDeliverableInput,
    userId: string
  ): Promise<{ success: boolean; milestone: MilestoneDto }> {
    return MilestoneStatusService.updateDeliverable(engagementId, milestoneId, input, userId);
  }

  /**
   * Employer accepts a submitted deliverable for a milestone.
   */
  static async acceptDeliverable(
    engagementId: string,
    milestoneId: string,
    userId: string
  ): Promise<{ success: boolean; milestone: MilestoneDto }> {
    return MilestoneStatusService.acceptDeliverable(engagementId, milestoneId, userId);
  }

  /**
   * Employer marks payment as dispatched (bilateral handshake declaration).
   */
  static async markPayment(
    engagementId: string,
    milestoneId: string,
    input: MarkPaymentInput,
    userId: string
  ): Promise<{ success: boolean; milestone: MilestoneDto }> {
    return MilestonePayoutService.markPayment(engagementId, milestoneId, input, userId);
  }

  /**
   * Reverts marked payment if marked in error.
   */
  static async revertPayment(
    engagementId: string,
    milestoneId: string,
    userId: string
  ): Promise<{ success: boolean; milestone: MilestoneDto }> {
    return MilestonePayoutService.revertPayment(engagementId, milestoneId, userId);
  }

  /**
   * Freelancer confirms receipt of bank transfer and provides SMM / Invoice number.
   * Produces cryptographic dual-seal and bilateral settlement certificate (TBK m. 132 / FSEK m. 48).
   */
  static async confirmPayment(
    engagementId: string,
    milestoneId: string,
    input: ConfirmPaymentInput,
    userId: string
  ): Promise<{ success: boolean; milestone: MilestoneDto }> {
    return MilestonePayoutService.confirmPayment(engagementId, milestoneId, input, userId);
  }

  /**
   * Specialist disputes payment (funds not arrived, amount mismatch, etc.).
   */
  static async disputePayment(
    engagementId: string,
    milestoneId: string,
    input: DisputePaymentInput,
    userId: string
  ): Promise<{ success: boolean; milestone: MilestoneDto }> {
    return MilestonePayoutService.disputePayment(engagementId, milestoneId, input, userId);
  }

  /**
   * Retrieves the Bilateral Proof of Settlement and Debt Discharge Certificate (İtfa & İbraname).
   */
  static async getSettlementCertificate(
    engagementId: string,
    milestoneId: string,
    userId: string
  ): Promise<PaymentSettlementCertificate | null> {
    return MilestonePayoutService.getSettlementCertificate(engagementId, milestoneId, userId);
  }

  /**
   * Retrieves the official FSEK m. 48-52 Certificate of IP Assignment for a completed milestone.
   */
  static async getIpAssignmentDeed(
    engagementId: string,
    milestoneId: string,
    userId: string
  ): Promise<IpAssignmentDeed | null> {
    return MilestoneEvidenceService.getIpAssignmentDeed(engagementId, milestoneId, userId);
  }

  /**
   * Aggregates all FSEK IP Assignment Deeds across all completed milestones of an engagement.
   * Useful for investor due diligence, M&A audit, or comprehensive export.
   */
  static async getEngagementIpDeeds(
    engagementId: string,
    userId: string
  ): Promise<IpAssignmentDeed[]> {
    return MilestoneEvidenceService.getEngagementIpDeeds(engagementId, userId);
  }
}
