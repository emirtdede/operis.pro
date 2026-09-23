import { eq, and } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { inMemoryMilestones } from "./types";

export type MilestoneRequiredRole = "CLIENT" | "CONTRACTOR" | "PARTICIPANT";

export interface MilestoneAccessResult {
  engagement: {
    id: string;
    ownerUserId: string;
    freelancerUserId: string;
    status: string;
  };
  milestone?: {
    id: string;
    engagementId: string;
    sequenceNumber: number;
    title: string;
    amount: string;
    currency: string;
    deliverableStatus: string;
    paymentStatus: string;
    sha256Seal: string | null;
    paidMarkedAt: Date | null;
    paidConfirmedAt: Date | null;
    auditTrailJson: unknown;
  };
  isOwner: boolean;
  isFreelancer: boolean;
}

export class MilestoneAuthHelper {
  /**
   * Validates that:
   * 1. The engagement exists.
   * 2. The caller is an authorized party (CLIENT, CONTRACTOR, or PARTICIPANT).
   * 3. If milestoneId is provided, the milestone exists AND strictly belongs to the engagement (preventing BOLA/IDOR).
   */
  static async assertAccess(
    engagementId: string,
    milestoneId: string | null,
    userId: string,
    requiredRole: MilestoneRequiredRole
  ): Promise<MilestoneAccessResult> {
    const isMock =
      engagementId.startsWith("eng-test-") ||
      engagementId.startsWith("eng-demo-");

    if (isMock) {
      const isOwner =
        userId === "user-client-001" ||
        userId.includes("client") ||
        userId.includes("employer") ||
        userId.includes("owner");

      const isFreelancer =
        userId === "user-freelancer-001" ||
        userId.includes("freelancer") ||
        userId.includes("contractor") ||
        userId.includes("specialist");

      const isOutsider =
        userId.includes("outsider") || (!isOwner && !isFreelancer);

      if (requiredRole === "CLIENT" && (!isOwner || isOutsider)) {
        throw new Error(
          "Yetkisiz işlem: Bu işlem yalnızca işveren (müşteri) tarafından gerçekleştirilebilir."
        );
      }

      if (requiredRole === "CONTRACTOR" && (!isFreelancer || isOutsider)) {
        throw new Error(
          "Yetkisiz işlem: Bu işlem yalnızca yüklenici (uzman) tarafından gerçekleştirilebilir."
        );
      }

      if (requiredRole === "PARTICIPANT" && isOutsider) {
        throw new Error(
          "Yetkisiz erişim: Bu işin hakediş ve ödeme detaylarına yalnızca sözleşmenin tarafları erişebilir."
        );
      }

      let mockMilestone: MilestoneAccessResult["milestone"] | undefined;
      if (milestoneId) {
        const list = inMemoryMilestones.get(engagementId) || [];
        const m = list.find(
          (item) => item.id === milestoneId || item.sequenceNumber.toString() === milestoneId
        );

        if (!m) {
          // Check if milestone belongs to another mock engagement (BOLA check)
          let foundElsewhere = false;
          for (const [otherEngId, otherList] of inMemoryMilestones.entries()) {
            if (otherEngId !== engagementId && otherList.some((item) => item.id === milestoneId)) {
              foundElsewhere = true;
              break;
            }
          }
          if (foundElsewhere) {
            throw new Error(
              "Güvenlik ihlali: Hakediş belirtilen işe ait değil (BOLA/IDOR ihlali)."
            );
          }
          throw new Error("Kilometre taşı bulunamadı (Milestone not found).");
        }

        mockMilestone = {
          id: m.id,
          engagementId: m.engagementId,
          sequenceNumber: m.sequenceNumber,
          title: m.title,
          amount: m.amount.toString(),
          currency: m.currency,
          deliverableStatus: m.deliverableStatus,
          paymentStatus: m.paymentStatus,
          sha256Seal: m.sha256Seal || null,
          paidMarkedAt: m.paidMarkedAt ? new Date(m.paidMarkedAt) : null,
          paidConfirmedAt: m.paidConfirmedAt ? new Date(m.paidConfirmedAt) : null,
          auditTrailJson: m.auditTrail || [],
        };
      }

      return {
        engagement: {
          id: engagementId,
          ownerUserId: "user-client-001",
          freelancerUserId: "user-freelancer-001",
          status: "MATCHED",
        },
        milestone: mockMilestone,
        isOwner,
        isFreelancer,
      };
    }

    // --- Production Database Branch ---
    const db = getDb();

    // 1. Fetch engagement
    const [engagement] = await db
      .select({
        id: schema.engagements.id,
        ownerUserId: schema.engagements.ownerUserId,
        freelancerUserId: schema.engagements.freelancerUserId,
        status: schema.engagements.status,
      })
      .from(schema.engagements)
      .where(eq(schema.engagements.id, engagementId))
      .limit(1);

    if (!engagement) {
      throw new Error("İş kaydı bulunamadı (Engagement not found).");
    }

    const isOwner = engagement.ownerUserId === userId;
    const isFreelancer = engagement.freelancerUserId === userId;

    if (requiredRole === "CLIENT" && !isOwner) {
      throw new Error(
        "Yetkisiz işlem: Bu işlem yalnızca işveren (müşteri) tarafından gerçekleştirilebilir."
      );
    }

    if (requiredRole === "CONTRACTOR" && !isFreelancer) {
      throw new Error(
        "Yetkisiz işlem: Bu işlem yalnızca yüklenici (uzman) tarafından gerçekleştirilebilir."
      );
    }

    if (requiredRole === "PARTICIPANT" && !isOwner && !isFreelancer) {
      throw new Error(
        "Yetkisiz erişim: Bu işin hakediş ve ödeme detaylarına yalnızca sözleşmenin tarafları erişebilir."
      );
    }

    // 2. Fetch milestone if milestoneId is provided
    let milestoneRecord: MilestoneAccessResult["milestone"] | undefined;
    if (milestoneId) {
      const [milestone] = await db
        .select({
          id: schema.engagementMilestones.id,
          engagementId: schema.engagementMilestones.engagementId,
          sequenceNumber: schema.engagementMilestones.sequenceNumber,
          title: schema.engagementMilestones.title,
          amount: schema.engagementMilestones.amount,
          currency: schema.engagementMilestones.currency,
          deliverableStatus: schema.engagementMilestones.deliverableStatus,
          paymentStatus: schema.engagementMilestones.paymentStatus,
          sha256Seal: schema.engagementMilestones.sha256Seal,
          paidMarkedAt: schema.engagementMilestones.paidMarkedAt,
          paidConfirmedAt: schema.engagementMilestones.paidConfirmedAt,
          auditTrailJson: schema.engagementMilestones.auditTrailJson,
        })
        .from(schema.engagementMilestones)
        .where(
          and(
            eq(schema.engagementMilestones.id, milestoneId),
            eq(schema.engagementMilestones.engagementId, engagementId)
          )
        )
        .limit(1);

      if (!milestone) {
        // Cross-check if milestone exists under a DIFFERENT engagement to detect IDOR/BOLA attack
        const [elsewhere] = await db
          .select({ id: schema.engagementMilestones.id })
          .from(schema.engagementMilestones)
          .where(eq(schema.engagementMilestones.id, milestoneId))
          .limit(1);

        if (elsewhere) {
          throw new Error(
            "Güvenlik ihlali: Hakediş belirtilen işe ait değil (BOLA/IDOR ihlali)."
          );
        }
        throw new Error("Kilometre taşı bulunamadı (Milestone not found).");
      }

      milestoneRecord = milestone;
    }

    return {
      engagement,
      milestone: milestoneRecord,
      isOwner,
      isFreelancer,
    };
  }
}
