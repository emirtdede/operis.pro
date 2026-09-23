import { eq, asc, and } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { MilestoneSynthesizer } from "../milestone-synthesizer";
import { PaymentHandshakeEngine } from "../payment-handshake/payment-handshake-engine";
import { IpAssignmentDeedEngine } from "../ip-assignment/ip-assignment-engine";
import { MilestoneAuthHelper } from "./milestone-auth";
import {
  type MilestoneDto,
  type MilestonePlanResult,
  type UpdateDeliverableInput,
  type CustomMilestoneInputItem,
  type HandshakeAuditEntry,
  type TransferChannel,
  type PaymentSettlementCertificate,
  type IpAssignmentDeed,
  type DeliverableStatus,
  type MilestoneDeliverableUrlType,
  type PaymentLedgerStatus,
  inMemoryMilestones,
  calculateSha256Seal,
  computeMilestoneMetrics,
} from "./types";

export class MilestoneStatusService {
  /**
   * Retrieves or auto-synthesizes the milestone roadmap for an active engagement.
   */
  static async getMilestones(
    engagementId: string,
    currentUserId: string
  ): Promise<MilestonePlanResult> {
    await MilestoneAuthHelper.assertAccess(engagementId, null, currentUserId, "PARTICIPANT");

    const isMock =
      engagementId.startsWith("eng-test-") ||
      engagementId.startsWith("eng-demo-");

    if (isMock) {
      let list = inMemoryMilestones.get(engagementId);
      if (!list || list.length === 0) {
        // Auto-synthesize default roadmap
        const synthesized = MilestoneSynthesizer.synthesizeMilestonesForListing({
          title: "Fullstack Web & API Projesi",
          scope: "Next.js frontend ve PostgreSQL veritabanı mimarisi",
          totalBudget: 40000,
          currency: "TRY",
        });

        list = synthesized.map((s) => ({
          id: `m-mock-${engagementId}-${s.sequenceNumber}`,
          engagementId,
          sequenceNumber: s.sequenceNumber,
          title: s.titleTr,
          description: s.descriptionTr,
          deliverableCriteria: s.deliverableCriteriaTr,
          percentage: s.percentage,
          amount: s.amount,
          currency: s.currency,
          targetDate: null,
          deliverableStatus: "NOT_STARTED",
          deliverableNote: null,
          deliverableUrl: null,
          deliverableUrlType: s.suggestedUrlType,
          submittedAt: null,
          acceptedAt: null,
          paymentStatus: "UNPAID",
          paymentReference: null,
          paymentReceiptUrl: null,
          invoiceNumber: null,
          paidMarkedAt: null,
          paidConfirmedAt: null,
          sha256Seal: null,
        }));
        inMemoryMilestones.set(engagementId, list);
      }

      const isParticipant = !currentUserId.includes("outsider");
      const maskedList = list.map((m) => ({
        ...m,
        deliverableUrl: isParticipant ? m.deliverableUrl : null,
      }));

      const res = computeMilestoneMetrics(maskedList, isParticipant, isParticipant);
      res.engagementId = engagementId;
      return res;
    }

    const db = getDb();
    // 1. Fetch engagement and verify participant access
    const [engagement] = await db
      .select()
      .from(schema.engagements)
      .where(eq(schema.engagements.id, engagementId))
      .limit(1);

    if (!engagement) {
      throw new Error("Engagement not found");
    }

    const isOwner = engagement.ownerUserId === currentUserId;
    const isFreelancer = engagement.freelancerUserId === currentUserId;

    // 2. Fetch existing milestones using correct engagementId foreign key
    const existing = await db
      .select()
      .from(schema.engagementMilestones)
      .where(eq(schema.engagementMilestones.engagementId, engagementId))
      .orderBy(asc(schema.engagementMilestones.sequenceNumber));

    if (existing.length > 0) {
      const mapped: MilestoneDto[] = existing.map((m) => {
        const auditTrail: HandshakeAuditEntry[] = Array.isArray(m.auditTrailJson)
          ? (m.auditTrailJson as unknown as HandshakeAuditEntry[])
          : [];
        const declEntry = [...auditTrail].reverse().find((a) => a.action === "PAYMENT_DECLARED");
        const dispEntry = [...auditTrail].reverse().find((a) => a.action === "PAYMENT_DISPUTED");
        const senderBank = (declEntry?.metadata?.senderBank as string) || null;
        const transferChannel =
          (declEntry?.metadata?.transferChannel as string) ||
          (m.paymentReference ? "FAST" : null);
        const transferDate = (declEntry?.metadata?.transferDate as string) || null;
        const transferTime = (declEntry?.metadata?.transferTime as string) || null;
        const disputeReason = (dispEntry?.metadata?.disputeReason as string) || null;
        const disputeNote = (dispEntry?.metadata?.disputeNote as string) || null;
        const timingGuidance = transferChannel
          ? PaymentHandshakeEngine.getTimingGuidance(
              transferChannel as TransferChannel,
              parseFloat(m.amount)
            )
          : null;

        let settlementCert: PaymentSettlementCertificate | null = null;
        if (m.paymentStatus === "CONFIRMED_PAID") {
          settlementCert = PaymentHandshakeEngine.generateSettlementCertificate({
            engagementId,
            milestoneId: m.id,
            milestoneSequence: m.sequenceNumber,
            milestoneTitle: m.title,
            amount: parseFloat(m.amount),
            currency: m.currency,
            payerUserId: engagement.ownerUserId,
            senderBank: senderBank || "BANK_TRANSFER",
            transferChannel: (transferChannel as TransferChannel) || "FAST",
            referenceNumber: m.paymentReference || "N/A",
            declaredAt: m.paidMarkedAt
              ? new Date(m.paidMarkedAt).toISOString()
              : new Date().toISOString(),
            declarationSeal: (declEntry?.metadata?.seal as string) || m.sha256Seal || "DECL_SEAL",
            payeeUserId: engagement.freelancerUserId,
            invoiceNumber: m.invoiceNumber || undefined,
            confirmedAt: m.paidConfirmedAt
              ? new Date(m.paidConfirmedAt).toISOString()
              : new Date().toISOString(),
            confirmationSeal: m.sha256Seal || "CONF_SEAL",
            dualSeal: m.sha256Seal || "DUAL_SEAL",
          });
        }

        return {
          id: m.id,
          engagementId: m.engagementId,
          sequenceNumber: m.sequenceNumber,
          title: m.title,
          description: m.description,
          deliverableCriteria: m.deliverableCriteria,
          percentage: parseFloat(m.percentage),
          amount: parseFloat(m.amount),
          currency: m.currency,
          targetDate: m.targetDate,
          deliverableStatus: m.deliverableStatus as DeliverableStatus,
          deliverableNote: m.deliverableNote,
          deliverableUrl: m.deliverableUrl,
          deliverableUrlType: m.deliverableUrlType as MilestoneDeliverableUrlType | null,
          submittedAt: m.submittedAt ? new Date(m.submittedAt).toISOString() : null,
          acceptedAt: m.acceptedAt ? new Date(m.acceptedAt).toISOString() : null,
          paymentStatus: m.paymentStatus as PaymentLedgerStatus,
          paymentReference: m.paymentReference,
          paymentReceiptUrl: m.paymentReceiptUrl,
          invoiceNumber: m.invoiceNumber,
          paidMarkedAt: m.paidMarkedAt ? new Date(m.paidMarkedAt).toISOString() : null,
          paidConfirmedAt: m.paidConfirmedAt ? new Date(m.paidConfirmedAt).toISOString() : null,
          sha256Seal: m.sha256Seal,
          senderBank,
          transferChannel,
          transferDate,
          transferTime,
          disputeReason,
          disputeNote,
          dualSeal: m.paymentStatus === "CONFIRMED_PAID" ? m.sha256Seal : null,
          settlementCertificate: settlementCert,
          timingGuidance,
          auditTrail,
          ipAssignmentDeed: (() => {
            const confEntry = auditTrail?.find(
              (a) => a.action === "PAYMENT_CONFIRMED" && a.metadata?.ipDeed
            );
            if (confEntry?.metadata?.ipDeed) {
              return confEntry.metadata.ipDeed as IpAssignmentDeed;
            }
            if (m.paymentStatus === "CONFIRMED_PAID") {
              return IpAssignmentDeedEngine.generateDeed({
                engagementId,
                listingTitle: m.title || "Yazılım / Teknoloji Projesi",
                milestoneId: m.id,
                milestoneSequence: m.sequenceNumber,
                milestoneTitle: m.title,
                milestoneDescription: m.description,
                amount: parseFloat(m.amount),
                currency: m.currency,
                repositoryUrl: m.deliverableUrlType === "CODE_REPO" ? m.deliverableUrl : undefined,
                gitCommitHash: null,
                deliverableUrl: m.deliverableUrl,
                deliverableUrlType: m.deliverableUrlType,
                artifactSha256: m.sha256Seal,
                paymentReference: m.paymentReference,
                paymentDualSeal: m.sha256Seal || "DUAL_SEAL",
                settlementCertificateId:
                  settlementCert?.certificateId || `CERT-SETTLE-${m.id.slice(0, 8)}`,
                invoiceNumber: m.invoiceNumber || undefined,
                settledAt: m.paidConfirmedAt
                  ? new Date(m.paidConfirmedAt).toISOString()
                  : new Date().toISOString(),
                assignorUserId: engagement.freelancerUserId,
                assignorName: "Yüklenici Yazılımcı",
                assignorEmail: "yazilimci@operis.pro",
                assigneeUserId: engagement.ownerUserId,
                assigneeName: "İşveren Şirket",
                assigneeEmail: "isveren@operis.pro",
              });
            }
            return null;
          })(),
          gitCommitHash: null,
        };
      });

      return computeMilestoneMetrics(mapped, isOwner, isFreelancer);
    }

    // 3. If empty, synthesize from listing
    const [listing] = await db
      .select()
      .from(schema.listings)
      .where(eq(schema.listings.id, engagement.listingId))
      .limit(1);

    const [offer] = await db
      .select()
      .from(schema.offers)
      .where(eq(schema.offers.id, engagement.acceptedOfferId))
      .limit(1);

    const rawBudget = offer?.budgetMax ?? listing?.budgetMax;
    const totalBudget = rawBudget ? parseFloat(rawBudget) : 30000;
    const currency = offer?.budgetCurrency || listing?.budgetCurrency || "TRY";

    const synthesized = MilestoneSynthesizer.synthesizeMilestonesForListing({
      title: listing?.title || engagement.listingTitleSnapshot,
      scope: listing?.scope,
      tags: listing?.tags,
      totalBudget,
      currency,
    });

    const toInsert = synthesized.map((s) => ({
      engagementId,
      sequenceNumber: s.sequenceNumber,
      title: s.titleTr,
      description: s.descriptionTr,
      deliverableCriteria: s.deliverableCriteriaTr,
      percentage: s.percentage.toString(),
      amount: s.amount.toString(),
      currency: s.currency,
      deliverableStatus: "NOT_STARTED",
      paymentStatus: "UNPAID",
      deliverableUrlType: s.suggestedUrlType,
      auditTrailJson: [
        {
          action: "SYNTHESIZED_INITIAL_PLAN",
          actorUserId: currentUserId,
          timestamp: new Date().toISOString(),
        },
      ],
    }));

    const insertedRows = await db
      .insert(schema.engagementMilestones)
      .values(toInsert)
      .returning();

    const mappedInserted: MilestoneDto[] = insertedRows.map((m) => ({
      id: m.id,
      engagementId: m.engagementId,
      sequenceNumber: m.sequenceNumber,
      title: m.title,
      description: m.description,
      deliverableCriteria: m.deliverableCriteria,
      percentage: parseFloat(m.percentage),
      amount: parseFloat(m.amount),
      currency: m.currency,
      targetDate: m.targetDate,
      deliverableStatus: m.deliverableStatus as DeliverableStatus,
      deliverableNote: m.deliverableNote,
      deliverableUrl: m.deliverableUrl,
      deliverableUrlType: m.deliverableUrlType as MilestoneDeliverableUrlType | null,
      submittedAt: null,
      acceptedAt: null,
      paymentStatus: m.paymentStatus as PaymentLedgerStatus,
      paymentReference: null,
      paymentReceiptUrl: null,
      invoiceNumber: null,
      paidMarkedAt: null,
      paidConfirmedAt: null,
      sha256Seal: null,
    }));

    return computeMilestoneMetrics(mappedInserted, isOwner, isFreelancer);
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
    await MilestoneAuthHelper.assertAccess(engagementId, null, userId, "CLIENT");

    if (!items || items.length === 0) {
      throw new Error("En az 1 adet kilometre taşı tanımlanmalıdır.");
    }

    // 1. Strict 100% percentage validation (tolerance 0.05)
    const totalPercentage = items.reduce((sum, item) => sum + item.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.05) {
      throw new Error(
        `Kilometre taşı yüzdelerinin toplamı %100 olmalıdır. Mevcut toplam: %${totalPercentage.toFixed(2)}`
      );
    }

    const isMock =
      engagementId.startsWith("eng-test-") ||
      engagementId.startsWith("eng-demo-");

    if (isMock) {
      const mapped: MilestoneDto[] = items.map((item, idx) => ({
        id: `m-mock-${engagementId}-${idx + 1}`,
        engagementId,
        sequenceNumber: idx + 1,
        title: item.title,
        description: item.description,
        deliverableCriteria: item.deliverableCriteria || null,
        percentage: item.percentage,
        amount: item.amount,
        currency: item.currency || "TRY",
        targetDate: item.targetDate || null,
        deliverableStatus: "NOT_STARTED",
        deliverableNote: null,
        deliverableUrl: null,
        deliverableUrlType: item.deliverableUrlType || "CODE_REPO",
        submittedAt: null,
        acceptedAt: null,
        paymentStatus: "UNPAID",
        paymentReference: null,
        paymentReceiptUrl: null,
        invoiceNumber: null,
        paidMarkedAt: null,
        paidConfirmedAt: null,
        sha256Seal: calculateSha256Seal({
          engagementId,
          seq: idx + 1,
          title: item.title,
          amount: item.amount,
          actor: userId,
        }),
      }));

      inMemoryMilestones.set(engagementId, mapped);

      return {
        success: true,
        milestones: mapped,
        messageTr: "Süreç ve hakediş planı başarıyla güncellendi.",
        messageEn: "Milestone plan updated successfully.",
      };
    }

    const db = getDb();

    // Check if any existing milestones are already paid
    const existingList = await db
      .select({
        id: schema.engagementMilestones.id,
        paymentStatus: schema.engagementMilestones.paymentStatus,
      })
      .from(schema.engagementMilestones)
      .where(eq(schema.engagementMilestones.engagementId, engagementId));

    const hasPaidMilestones = existingList.some(
      (m) => m.paymentStatus === "MARKED_PAID" || m.paymentStatus === "CONFIRMED_PAID"
    );
    if (hasPaidMilestones) {
      throw new Error(
        "Ödemesi yapılmış veya teyit edilmiş hakedişler varken hakediş planı yeniden düzenlenemez."
      );
    }

    // Delete existing and replace using correct engagementId foreign key
    await db
      .delete(schema.engagementMilestones)
      .where(eq(schema.engagementMilestones.engagementId, engagementId));

    const toInsert = items.map((item, idx) => {
      const seal = calculateSha256Seal({
        engagementId,
        sequenceNumber: idx + 1,
        title: item.title,
        amount: item.amount,
        percentage: item.percentage,
        userId,
        clientIp,
      });

      return {
        engagementId,
        sequenceNumber: idx + 1,
        title: item.title,
        description: item.description,
        deliverableCriteria: item.deliverableCriteria || null,
        percentage: item.percentage.toString(),
        amount: item.amount.toString(),
        currency: item.currency || "TRY",
        targetDate: item.targetDate || null,
        deliverableStatus: "NOT_STARTED",
        deliverableUrlType: item.deliverableUrlType || "CODE_REPO",
        paymentStatus: "UNPAID",
        auditTrailJson: [
          {
            action: "PLAN_UPDATED",
            actorUserId: userId,
            timestamp: new Date().toISOString(),
            ip: clientIp,
          },
        ],
        sha256Seal: seal,
      };
    });

    const insertedRows = await db
      .insert(schema.engagementMilestones)
      .values(toInsert)
      .returning();

    const resultMapped: MilestoneDto[] = insertedRows.map((m) => ({
      id: m.id,
      engagementId: m.engagementId,
      sequenceNumber: m.sequenceNumber,
      title: m.title,
      description: m.description,
      deliverableCriteria: m.deliverableCriteria,
      percentage: parseFloat(m.percentage),
      amount: parseFloat(m.amount),
      currency: m.currency,
      targetDate: m.targetDate,
      deliverableStatus: m.deliverableStatus as DeliverableStatus,
      deliverableNote: null,
      deliverableUrl: null,
      deliverableUrlType: m.deliverableUrlType as MilestoneDeliverableUrlType | null,
      submittedAt: null,
      acceptedAt: null,
      paymentStatus: m.paymentStatus as PaymentLedgerStatus,
      paymentReference: null,
      paymentReceiptUrl: null,
      invoiceNumber: null,
      paidMarkedAt: null,
      paidConfirmedAt: null,
      sha256Seal: m.sha256Seal,
    }));

    return {
      success: true,
      milestones: resultMapped,
      messageTr: "Süreç ve hakediş planı başarıyla güncellendi.",
      messageEn: "Milestone plan updated successfully.",
    };
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
    await MilestoneAuthHelper.assertAccess(engagementId, milestoneId, userId, "CONTRACTOR");

    const isMock =
      engagementId.startsWith("eng-test-") ||
      engagementId.startsWith("eng-demo-");

    if (isMock) {
      const list = inMemoryMilestones.get(engagementId) || [];
      const m = list.find(
        (item) => item.id === milestoneId || item.sequenceNumber.toString() === milestoneId
      );
      if (!m) throw new Error("Milestone not found");

      m.deliverableStatus = input.status;
      if (input.deliverableNote !== undefined) m.deliverableNote = input.deliverableNote;
      if (input.deliverableUrl !== undefined) m.deliverableUrl = input.deliverableUrl;
      if (input.deliverableUrlType !== undefined) m.deliverableUrlType = input.deliverableUrlType;
      const extractedCommit =
        input.gitCommitHash || IpAssignmentDeedEngine.extractCommitHashFromUrl(input.deliverableUrl);
      if (extractedCommit) m.gitCommitHash = extractedCommit;
      if (input.status === "SUBMITTED") m.submittedAt = new Date().toISOString();

      m.sha256Seal = calculateSha256Seal({
        milestoneId: m.id,
        action: input.status,
        url: m.deliverableUrl,
        userId,
        timestamp: new Date().toISOString(),
      });

      return { success: true, milestone: m };
    }

    const db = getDb();
    const updateData: Partial<typeof schema.engagementMilestones.$inferInsert> = {
      deliverableStatus: input.status,
      updatedAt: new Date(),
    };
    if (input.deliverableNote !== undefined) updateData.deliverableNote = input.deliverableNote;
    if (input.deliverableUrl !== undefined) updateData.deliverableUrl = input.deliverableUrl;
    if (input.deliverableUrlType !== undefined)
      updateData.deliverableUrlType = input.deliverableUrlType;
    if (input.status === "SUBMITTED") updateData.submittedAt = new Date();

    const [updated] = await db
      .update(schema.engagementMilestones)
      .set(updateData)
      .where(
        and(
          eq(schema.engagementMilestones.id, milestoneId),
          eq(schema.engagementMilestones.engagementId, engagementId)
        )
      )
      .returning();

    if (!updated) throw new Error("Milestone not found");

    return {
      success: true,
      milestone: {
        id: updated.id,
        engagementId: updated.engagementId,
        sequenceNumber: updated.sequenceNumber,
        title: updated.title,
        description: updated.description,
        deliverableCriteria: updated.deliverableCriteria,
        percentage: parseFloat(updated.percentage),
        amount: parseFloat(updated.amount),
        currency: updated.currency,
        targetDate: updated.targetDate,
        deliverableStatus: updated.deliverableStatus as DeliverableStatus,
        deliverableNote: updated.deliverableNote,
        deliverableUrl: updated.deliverableUrl,
        deliverableUrlType: updated.deliverableUrlType as MilestoneDeliverableUrlType | null,
        submittedAt: updated.submittedAt ? new Date(updated.submittedAt).toISOString() : null,
        acceptedAt: updated.acceptedAt ? new Date(updated.acceptedAt).toISOString() : null,
        paymentStatus: updated.paymentStatus as PaymentLedgerStatus,
        paymentReference: updated.paymentReference,
        paymentReceiptUrl: updated.paymentReceiptUrl,
        invoiceNumber: updated.invoiceNumber,
        paidMarkedAt: updated.paidMarkedAt ? new Date(updated.paidMarkedAt).toISOString() : null,
        paidConfirmedAt: updated.paidConfirmedAt
          ? new Date(updated.paidConfirmedAt).toISOString()
          : null,
        sha256Seal: updated.sha256Seal,
      },
    };
  }

  /**
   * Employer accepts a submitted deliverable for a milestone.
   */
  static async acceptDeliverable(
    engagementId: string,
    milestoneId: string,
    userId: string
  ): Promise<{ success: boolean; milestone: MilestoneDto }> {
    await MilestoneAuthHelper.assertAccess(engagementId, milestoneId, userId, "CLIENT");

    const isMock =
      engagementId.startsWith("eng-test-") ||
      engagementId.startsWith("eng-demo-");

    if (isMock) {
      const list = inMemoryMilestones.get(engagementId) || [];
      const m = list.find(
        (item) => item.id === milestoneId || item.sequenceNumber.toString() === milestoneId
      );
      if (!m) throw new Error("Milestone not found");

      m.deliverableStatus = "ACCEPTED";
      m.acceptedAt = new Date().toISOString();
      m.sha256Seal = calculateSha256Seal({
        milestoneId: m.id,
        action: "DELIVERABLE_ACCEPTED",
        userId,
        timestamp: m.acceptedAt,
      });

      return { success: true, milestone: m };
    }

    const db = getDb();
    const acceptedAt = new Date();
    const [updated] = await db
      .update(schema.engagementMilestones)
      .set({
        deliverableStatus: "ACCEPTED",
        acceptedAt,
        updatedAt: acceptedAt,
      })
      .where(
        and(
          eq(schema.engagementMilestones.id, milestoneId),
          eq(schema.engagementMilestones.engagementId, engagementId)
        )
      )
      .returning();

    if (!updated) throw new Error("Milestone not found");

    return {
      success: true,
      milestone: {
        id: updated.id,
        engagementId: updated.engagementId,
        sequenceNumber: updated.sequenceNumber,
        title: updated.title,
        description: updated.description,
        deliverableCriteria: updated.deliverableCriteria,
        percentage: parseFloat(updated.percentage),
        amount: parseFloat(updated.amount),
        currency: updated.currency,
        targetDate: updated.targetDate,
        deliverableStatus: updated.deliverableStatus as DeliverableStatus,
        deliverableNote: updated.deliverableNote,
        deliverableUrl: updated.deliverableUrl,
        deliverableUrlType: updated.deliverableUrlType as MilestoneDeliverableUrlType | null,
        submittedAt: updated.submittedAt ? new Date(updated.submittedAt).toISOString() : null,
        acceptedAt: updated.acceptedAt ? new Date(updated.acceptedAt).toISOString() : null,
        paymentStatus: updated.paymentStatus as PaymentLedgerStatus,
        paymentReference: updated.paymentReference,
        paymentReceiptUrl: updated.paymentReceiptUrl,
        invoiceNumber: updated.invoiceNumber,
        paidMarkedAt: updated.paidMarkedAt ? new Date(updated.paidMarkedAt).toISOString() : null,
        paidConfirmedAt: updated.paidConfirmedAt
          ? new Date(updated.paidConfirmedAt).toISOString()
          : null,
        sha256Seal: updated.sha256Seal,
      },
    };
  }
}
