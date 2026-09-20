import { type IpAssignmentDeed } from "./types";
import { MilestoneStatusService } from "./milestone-status.service";

export class MilestoneEvidenceService {
  /**
   * Retrieves the official FSEK m. 48-52 Certificate of IP Assignment for a completed milestone.
   */
  static async getIpAssignmentDeed(
    engagementId: string,
    milestoneId: string,
    userId: string
  ): Promise<IpAssignmentDeed | null> {
    const plan = await MilestoneStatusService.getMilestones(engagementId, userId);
    if (!plan.isOwner && !plan.isFreelancer) {
      throw new Error(
        "Yetkisiz erişim: Fikri Mülkiyet Devir Senedi yalnızca sözleşmenin tarafları tarafından görüntülenebilir."
      );
    }
    const m = plan.milestones.find(
      (item) => item.id === milestoneId || item.sequenceNumber.toString() === milestoneId
    );
    if (!m || m.paymentStatus !== "CONFIRMED_PAID") {
      return null;
    }
    return m.ipAssignmentDeed || null;
  }

  /**
   * Aggregates all FSEK IP Assignment Deeds across all completed milestones of an engagement.
   * Useful for investor due diligence, M&A audit, or comprehensive export.
   */
  static async getEngagementIpDeeds(
    engagementId: string,
    userId: string
  ): Promise<IpAssignmentDeed[]> {
    const plan = await MilestoneStatusService.getMilestones(engagementId, userId);
    if (!plan.isOwner && !plan.isFreelancer) {
      throw new Error(
        "Yetkisiz erişim: Fikri Mülkiyet Devir Senetleri yalnızca sözleşmenin tarafları tarafından görüntülenebilir."
      );
    }
    return plan.milestones
      .filter((m) => m.paymentStatus === "CONFIRMED_PAID" && m.ipAssignmentDeed)
      .map((m) => m.ipAssignmentDeed!);
  }
}
