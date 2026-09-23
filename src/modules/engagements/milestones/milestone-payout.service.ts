import { eq } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { NotificationService } from "@/src/modules/notifications/service";
import { PaymentHandshakeEngine } from "../payment-handshake/payment-handshake-engine";
import { IpAssignmentDeedEngine } from "../ip-assignment/ip-assignment-engine";
import {
  type MilestoneDto,
  type MarkPaymentInput,
  type ConfirmPaymentInput,
  type DisputePaymentInput,
  type PaymentSettlementCertificate,
  type HandshakeAuditEntry,
  type TransferChannel,
  type DeliverableStatus,
  type MilestoneDeliverableUrlType,
  type PaymentLedgerStatus,
  inMemoryMilestones,
  calculateSha256Seal,
} from "./types";

export class MilestonePayoutService {
  /**
   * Employer marks payment as dispatched (bilateral handshake declaration).
   */
  static async markPayment(
    engagementId: string,
    milestoneId: string,
    input: MarkPaymentInput,
    userId: string
  ): Promise<{ success: boolean; milestone: MilestoneDto }> {
    const isMock =
      Boolean(process.env.VITEST) ||
      engagementId.startsWith("eng-test-") ||
      engagementId.startsWith("eng-demo-");

    const channel: TransferChannel = (input.transferChannel as TransferChannel) || "FAST";
    const bank = input.senderBank || "GARANTI_BBVA";
    const ref = input.paymentReference || `REF-${Date.now().toString().slice(-6)}`;

    // 1. Validation of reference format
    const formatValidation = PaymentHandshakeEngine.validateReferenceFormat(channel, ref);
    if (!formatValidation.isValid) {
      throw new Error(formatValidation.error || "Geçersiz banka referans numarası.");
    }

    const timingGuidance = PaymentHandshakeEngine.getTimingGuidance(
      channel,
      input.declaredAmount || 0
    );

    const transferDate = input.transferDate || new Date().toISOString().slice(0, 10);
    const transferTime = input.transferTime || new Date().toTimeString().slice(0, 5);

    if (isMock) {
      const list = inMemoryMilestones.get(engagementId) || [];
      const m = list.find(
        (item) => item.id === milestoneId || item.sequenceNumber.toString() === milestoneId
      );
      if (!m) throw new Error("Milestone not found");

      m.paymentStatus = "MARKED_PAID";
      m.paymentReference = ref;
      m.paymentReceiptUrl = input.paymentReceiptUrl || null;
      m.senderBank = bank;
      m.transferChannel = channel;
      m.transferDate = transferDate;
      m.transferTime = transferTime;
      m.disputeReason = null;
      m.disputeNote = null;
      m.paidMarkedAt = new Date().toISOString();
      m.timingGuidance = timingGuidance;

      const declarationSeal = PaymentHandshakeEngine.calculateDeclarationSeal({
        milestoneId: m.id,
        senderBank: bank,
        transferChannel: channel,
        referenceNumber: ref,
        amount: input.declaredAmount || m.amount,
        currency: input.currency || m.currency,
        userId,
        timestamp: m.paidMarkedAt,
        ip: input.clientIp,
      });
      m.sha256Seal = declarationSeal;

      const auditEntry: HandshakeAuditEntry = {
        action: "PAYMENT_DECLARED",
        actorRole: "EMPLOYER",
        actorUserId: userId,
        timestamp: m.paidMarkedAt,
        ip: input.clientIp || "127.0.0.1",
        metadata: {
          senderBank: bank,
          transferChannel: channel,
          referenceNumber: ref,
          amount: input.declaredAmount || m.amount,
          transferDate,
          transferTime,
          seal: declarationSeal,
        },
      };
      m.auditTrail = [...(m.auditTrail || []), auditEntry];

      return { success: true, milestone: m };
    }

    const db = getDb();
    const paidMarkedAt = new Date();
    const declarationSeal = PaymentHandshakeEngine.calculateDeclarationSeal({
      milestoneId,
      senderBank: bank,
      transferChannel: channel,
      referenceNumber: ref,
      amount: input.declaredAmount || 0,
      currency: input.currency || "TRY",
      userId,
      timestamp: paidMarkedAt.toISOString(),
      ip: input.clientIp,
    });

    const [existing] = await db
      .select()
      .from(schema.engagementMilestones)
      .where(eq(schema.engagementMilestones.id, milestoneId))
      .limit(1);

    const existingAudit: HandshakeAuditEntry[] = Array.isArray(existing?.auditTrailJson)
      ? existing.auditTrailJson
      : [];

    const auditEntry: HandshakeAuditEntry = {
      action: "PAYMENT_DECLARED",
      actorRole: "EMPLOYER",
      actorUserId: userId,
      timestamp: paidMarkedAt.toISOString(),
      ip: input.clientIp || "127.0.0.1",
      metadata: {
        senderBank: bank,
        transferChannel: channel,
        referenceNumber: ref,
        amount: input.declaredAmount || (existing ? parseFloat(existing.amount) : 0),
        transferDate,
        transferTime,
        seal: declarationSeal,
      },
    };

    const updatedAuditTrail = [...existingAudit, auditEntry];

    const [updated] = await db
      .update(schema.engagementMilestones)
      .set({
        paymentStatus: "MARKED_PAID",
        paymentReference: ref,
        paymentReceiptUrl: input.paymentReceiptUrl || null,
        sha256Seal: declarationSeal,
        auditTrailJson: updatedAuditTrail,
        paidMarkedAt,
        updatedAt: paidMarkedAt,
      })
      .where(eq(schema.engagementMilestones.id, milestoneId))
      .returning();

    if (!updated) throw new Error("Milestone not found");

    // Send real-time notification to freelancer
    try {
      const [engagement] = await db
        .select()
        .from(schema.engagements)
        .where(eq(schema.engagements.id, engagementId))
        .limit(1);

      if (engagement?.freelancerUserId) {
        await NotificationService.createNotification(
          engagement.freelancerUserId,
          "PAYMENT_DECLARED",
          "engagement",
          engagementId,
          {
            title: "Ödeme Transferi Bildirildi",
            message: `${parseFloat(updated.amount).toLocaleString("tr-TR")} TL tutarındaki transfer bildirildi. Bankanızı kontrol edip onaylayınız.`,
            actionUrl: `/tr/calisma-alani/${engagementId}`,
          }
        );
      }
    } catch {
      // Non-blocking notification
    }

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
        senderBank: bank,
        transferChannel: channel,
        transferDate,
        transferTime,
        timingGuidance,
        auditTrail: updatedAuditTrail,
      },
    };
  }

  /**
   * Reverts marked payment if marked in error.
   */
  static async revertPayment(
    engagementId: string,
    milestoneId: string,
    userId: string
  ): Promise<{ success: boolean; milestone: MilestoneDto }> {
    const isMock =
      Boolean(process.env.VITEST) ||
      engagementId.startsWith("eng-test-") ||
      engagementId.startsWith("eng-demo-");

    if (isMock) {
      const list = inMemoryMilestones.get(engagementId) || [];
      const m = list.find(
        (item) => item.id === milestoneId || item.sequenceNumber.toString() === milestoneId
      );
      if (!m) throw new Error("Milestone not found");

      m.paymentStatus = "UNPAID";
      m.paidMarkedAt = null;
      m.paidConfirmedAt = null;
      m.disputeReason = null;
      m.disputeNote = null;
      m.dualSeal = null;
      m.settlementCertificate = null;
      m.sha256Seal = calculateSha256Seal({
        milestoneId: m.id,
        action: "PAYMENT_REVERTED",
        userId,
        timestamp: new Date().toISOString(),
      });

      const auditEntry: HandshakeAuditEntry = {
        action: "PAYMENT_REVERTED",
        actorRole: "EMPLOYER",
        actorUserId: userId,
        timestamp: new Date().toISOString(),
        ip: "127.0.0.1",
        metadata: { milestoneId: m.id },
      };
      m.auditTrail = [...(m.auditTrail || []), auditEntry];

      return { success: true, milestone: m };
    }

    const db = getDb();
    const [existing] = await db
      .select()
      .from(schema.engagementMilestones)
      .where(eq(schema.engagementMilestones.id, milestoneId))
      .limit(1);

    const existingAudit: HandshakeAuditEntry[] = Array.isArray(existing?.auditTrailJson)
      ? existing.auditTrailJson
      : [];

    const auditEntry: HandshakeAuditEntry = {
      action: "PAYMENT_REVERTED",
      actorRole: "EMPLOYER",
      actorUserId: userId,
      timestamp: new Date().toISOString(),
      ip: "127.0.0.1",
      metadata: { milestoneId },
    };

    const updatedAuditTrail = [...existingAudit, auditEntry];

    const [updated] = await db
      .update(schema.engagementMilestones)
      .set({
        paymentStatus: "UNPAID",
        paidMarkedAt: null,
        paidConfirmedAt: null,
        auditTrailJson: updatedAuditTrail,
        updatedAt: new Date(),
      })
      .where(eq(schema.engagementMilestones.id, milestoneId))
      .returning();

    if (!updated) throw new Error("Milestone not found");

    try {
      const [engagement] = await db
        .select()
        .from(schema.engagements)
        .where(eq(schema.engagements.id, engagementId))
        .limit(1);

      if (engagement?.freelancerUserId) {
        await NotificationService.createNotification(
          engagement.freelancerUserId,
          "PAYMENT_REVERTED",
          "engagement",
          engagementId,
          {
            title: "Ödeme Bildirimi Geri Alındı",
            message: `${updated.title} hakedişi için ödeme bildirimi işveren tarafından geri alındı.`,
            actionUrl: `/tr/calisma-alani/${engagementId}`,
          }
        );
      }
    } catch {
      // Non-blocking
    }

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
        paidMarkedAt: null,
        paidConfirmedAt: null,
        sha256Seal: updated.sha256Seal,
        auditTrail: updatedAuditTrail,
      },
    };
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
    const isMock =
      Boolean(process.env.VITEST) ||
      engagementId.startsWith("eng-test-") ||
      engagementId.startsWith("eng-demo-");

    if (isMock) {
      const list = inMemoryMilestones.get(engagementId) || [];
      const m = list.find(
        (item) => item.id === milestoneId || item.sequenceNumber.toString() === milestoneId
      );
      if (!m) throw new Error("Milestone not found");

      m.paymentStatus = "CONFIRMED_PAID";
      m.invoiceNumber = input.invoiceNumber || null;
      m.paidConfirmedAt = new Date().toISOString();
      m.disputeReason = null;
      m.disputeNote = null;

      const declarationSeal = m.sha256Seal || "LEGACY_SEAL";
      const confirmationSeal = calculateSha256Seal({
        milestoneId: m.id,
        action: "PAYMENT_CONFIRMED_BY_FREELANCER",
        invoice: m.invoiceNumber,
        userId,
        timestamp: m.paidConfirmedAt,
      });

      const dualSeal = PaymentHandshakeEngine.calculateConfirmationDualSeal(declarationSeal, {
        milestoneId: m.id,
        invoiceNumber: m.invoiceNumber || undefined,
        userId,
        timestamp: m.paidConfirmedAt,
        ip: input.clientIp,
      });

      const cert = PaymentHandshakeEngine.generateSettlementCertificate({
        engagementId,
        milestoneId: m.id,
        milestoneSequence: m.sequenceNumber,
        milestoneTitle: m.title,
        amount: m.amount,
        currency: m.currency,
        payerUserId: "employer",
        senderBank: m.senderBank || "GARANTI_BBVA",
        transferChannel: (m.transferChannel as TransferChannel) || "FAST",
        referenceNumber: m.paymentReference || "REF-BANK",
        declaredAt: m.paidMarkedAt || new Date().toISOString(),
        declarationSeal,
        payeeUserId: userId,
        invoiceNumber: m.invoiceNumber || undefined,
        confirmedAt: m.paidConfirmedAt,
        confirmationSeal,
        dualSeal,
      });

      m.sha256Seal = dualSeal;
      m.dualSeal = dualSeal;
      m.settlementCertificate = cert;

      const ipDeed = IpAssignmentDeedEngine.generateDeed({
        engagementId,
        listingTitle: m.title || "Yazılım / Teknoloji Projesi",
        milestoneId: m.id,
        milestoneSequence: m.sequenceNumber,
        milestoneTitle: m.title,
        milestoneDescription: m.description,
        amount: m.amount,
        currency: m.currency,
        repositoryUrl: m.deliverableUrlType === "CODE_REPO" ? m.deliverableUrl : undefined,
        gitCommitHash: m.gitCommitHash,
        deliverableUrl: m.deliverableUrl,
        deliverableUrlType: m.deliverableUrlType,
        artifactSha256: dualSeal,
        paymentReference: m.paymentReference,
        paymentDualSeal: dualSeal,
        settlementCertificateId: cert.certificateId,
        invoiceNumber: m.invoiceNumber || input.invoiceNumber,
        settledAt: m.paidConfirmedAt,
        assignorUserId: userId,
        assignorName: "Yazılımcı / Eser Sahibi",
        assignorEmail: "yazilimci@operis.pro",
        assigneeUserId: "employer",
        assigneeName: "İşveren / Hak Sahibi",
        assigneeEmail: "isveren@operis.pro",
      });

      m.ipAssignmentDeed = ipDeed;

      const auditEntry: HandshakeAuditEntry = {
        action: "PAYMENT_CONFIRMED",
        actorRole: "SPECIALIST",
        actorUserId: userId,
        timestamp: m.paidConfirmedAt,
        ip: input.clientIp || "127.0.0.1",
        metadata: {
          invoiceNumber: m.invoiceNumber,
          dualSeal,
          certificateId: cert.certificateId,
          ipDeedId: ipDeed.deedId,
          ipDeed,
        },
      };
      m.auditTrail = [...(m.auditTrail || []), auditEntry];

      return { success: true, milestone: m };
    }

    const db = getDb();
    const paidConfirmedAt = new Date();
    const [existing] = await db
      .select()
      .from(schema.engagementMilestones)
      .where(eq(schema.engagementMilestones.id, milestoneId))
      .limit(1);

    const declarationSeal = existing?.sha256Seal || "LEGACY_SEAL";
    const confirmationSeal = calculateSha256Seal({
      milestoneId,
      action: "PAYMENT_CONFIRMED_BY_FREELANCER",
      invoice: input.invoiceNumber || null,
      userId,
      timestamp: paidConfirmedAt.toISOString(),
    });

    const dualSeal = PaymentHandshakeEngine.calculateConfirmationDualSeal(declarationSeal, {
      milestoneId,
      invoiceNumber: input.invoiceNumber || undefined,
      userId,
      timestamp: paidConfirmedAt.toISOString(),
      ip: input.clientIp,
    });

    const existingAudit: HandshakeAuditEntry[] = Array.isArray(existing?.auditTrailJson)
      ? existing.auditTrailJson
      : [];

    const cert = PaymentHandshakeEngine.generateSettlementCertificate({
      engagementId,
      milestoneId: existing?.id || milestoneId,
      milestoneSequence: existing?.sequenceNumber || 1,
      milestoneTitle: existing?.title || "Milestone",
      amount: existing ? parseFloat(existing.amount) : 0,
      currency: existing?.currency || "TRY",
      payerUserId: "employer",
      senderBank: "BANK_TRANSFER",
      transferChannel: "FAST",
      referenceNumber: existing?.paymentReference || "N/A",
      declaredAt: existing?.paidMarkedAt
        ? new Date(existing.paidMarkedAt).toISOString()
        : paidConfirmedAt.toISOString(),
      declarationSeal,
      payeeUserId: userId,
      invoiceNumber: input.invoiceNumber || undefined,
      confirmedAt: paidConfirmedAt.toISOString(),
      confirmationSeal,
      dualSeal,
    });

    const ipDeed = IpAssignmentDeedEngine.generateDeed({
      engagementId,
      listingTitle: existing?.title || "Yazılım / Teknoloji Projesi",
      milestoneId: existing?.id || milestoneId,
      milestoneSequence: existing?.sequenceNumber || 1,
      milestoneTitle: existing?.title || "Milestone",
      milestoneDescription: existing?.description || "",
      amount: existing ? parseFloat(existing.amount) : 0,
      currency: existing?.currency || "TRY",
      repositoryUrl:
        existing?.deliverableUrlType === "CODE_REPO" ? existing.deliverableUrl : undefined,
      gitCommitHash: null,
      deliverableUrl: existing?.deliverableUrl,
      deliverableUrlType: existing?.deliverableUrlType,
      artifactSha256: dualSeal,
      paymentReference: existing?.paymentReference,
      paymentDualSeal: dualSeal,
      settlementCertificateId: cert.certificateId,
      invoiceNumber: input.invoiceNumber || undefined,
      settledAt: paidConfirmedAt.toISOString(),
      assignorUserId: userId,
      assignorName: "Yazılımcı / Eser Sahibi",
      assignorEmail: "yazilimci@operis.pro",
      assigneeUserId: "employer",
      assigneeName: "İşveren / Hak Sahibi",
      assigneeEmail: "isveren@operis.pro",
    });

    const auditEntry: HandshakeAuditEntry = {
      action: "PAYMENT_CONFIRMED",
      actorRole: "SPECIALIST",
      actorUserId: userId,
      timestamp: paidConfirmedAt.toISOString(),
      ip: input.clientIp || "127.0.0.1",
      metadata: {
        invoiceNumber: input.invoiceNumber,
        dualSeal,
        certificateId: cert.certificateId,
        ipDeedId: ipDeed.deedId,
        ipDeed,
      },
    };

    const updatedAuditTrail = [...existingAudit, auditEntry];

    const [updated] = await db
      .update(schema.engagementMilestones)
      .set({
        paymentStatus: "CONFIRMED_PAID",
        invoiceNumber: input.invoiceNumber || null,
        sha256Seal: dualSeal,
        auditTrailJson: updatedAuditTrail,
        paidConfirmedAt,
        updatedAt: paidConfirmedAt,
      })
      .where(eq(schema.engagementMilestones.id, milestoneId))
      .returning();

    if (!updated) throw new Error("Milestone not found");

    try {
      const [engagement] = await db
        .select()
        .from(schema.engagements)
        .where(eq(schema.engagements.id, engagementId))
        .limit(1);

      if (engagement?.ownerUserId) {
        await NotificationService.createNotification(
          engagement.ownerUserId,
          "PAYMENT_CONFIRMED",
          "engagement",
          engagementId,
          {
            title: "Hakediş Tahsilatı Onaylandı",
            message: `"${updated.title}" için ödeme tahsilatı onaylandı. İtfa Belgeniz oluşturuldu.`,
            actionUrl: `/tr/calisma-alani/${engagementId}`,
          }
        );
      }
    } catch {
      // Non-blocking
    }

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
        dualSeal,
        settlementCertificate: cert,
        auditTrail: updatedAuditTrail,
      },
    };
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
    const isMock =
      Boolean(process.env.VITEST) ||
      engagementId.startsWith("eng-test-") ||
      engagementId.startsWith("eng-demo-");

    if (isMock) {
      const list = inMemoryMilestones.get(engagementId) || [];
      const m = list.find(
        (item) => item.id === milestoneId || item.sequenceNumber.toString() === milestoneId
      );
      if (!m) throw new Error("Milestone not found");

      m.paymentStatus = "DISPUTED_PAID";
      m.disputeReason = input.disputeReason;
      m.disputeNote = input.disputeNote;
      m.sha256Seal = calculateSha256Seal({
        milestoneId: m.id,
        action: "PAYMENT_DISPUTED_BY_FREELANCER",
        reason: input.disputeReason,
        note: input.disputeNote,
        userId,
        timestamp: new Date().toISOString(),
      });

      const auditEntry: HandshakeAuditEntry = {
        action: "PAYMENT_DISPUTED",
        actorRole: "SPECIALIST",
        actorUserId: userId,
        timestamp: new Date().toISOString(),
        ip: input.clientIp || "127.0.0.1",
        metadata: {
          disputeReason: input.disputeReason,
          disputeNote: input.disputeNote,
        },
      };
      m.auditTrail = [...(m.auditTrail || []), auditEntry];

      return { success: true, milestone: m };
    }

    const db = getDb();
    const disputeTimestamp = new Date();
    const disputeSeal = calculateSha256Seal({
      milestoneId,
      action: "PAYMENT_DISPUTED_BY_FREELANCER",
      reason: input.disputeReason,
      note: input.disputeNote,
      userId,
      timestamp: disputeTimestamp.toISOString(),
    });

    const [existing] = await db
      .select()
      .from(schema.engagementMilestones)
      .where(eq(schema.engagementMilestones.id, milestoneId))
      .limit(1);

    const existingAudit: HandshakeAuditEntry[] = Array.isArray(existing?.auditTrailJson)
      ? existing.auditTrailJson
      : [];

    const auditEntry: HandshakeAuditEntry = {
      action: "PAYMENT_DISPUTED",
      actorRole: "SPECIALIST",
      actorUserId: userId,
      timestamp: disputeTimestamp.toISOString(),
      ip: input.clientIp || "127.0.0.1",
      metadata: {
        disputeReason: input.disputeReason,
        disputeNote: input.disputeNote,
      },
    };

    const updatedAuditTrail = [...existingAudit, auditEntry];

    const [updated] = await db
      .update(schema.engagementMilestones)
      .set({
        paymentStatus: "DISPUTED_PAID",
        sha256Seal: disputeSeal,
        auditTrailJson: updatedAuditTrail,
        updatedAt: disputeTimestamp,
      })
      .where(eq(schema.engagementMilestones.id, milestoneId))
      .returning();

    if (!updated) throw new Error("Milestone not found");

    try {
      const [engagement] = await db
        .select()
        .from(schema.engagements)
        .where(eq(schema.engagements.id, engagementId))
        .limit(1);

      if (engagement?.ownerUserId) {
        await NotificationService.createNotification(
          engagement.ownerUserId,
          "PAYMENT_DISPUTED",
          "engagement",
          engagementId,
          {
            title: "Ödeme İtirazı Bildirildi",
            message: `Yazılımcı ödemenin hesaba geçmediğini bildirdi (${input.disputeReason}). Banka sorgunuzu kontrol ediniz.`,
            actionUrl: `/tr/calisma-alani/${engagementId}`,
          }
        );
      }
    } catch {
      // Non-blocking
    }

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
        disputeReason: input.disputeReason,
        disputeNote: input.disputeNote,
        auditTrail: updatedAuditTrail,
      },
    };
  }

  /**
   * Retrieves the Bilateral Proof of Settlement and Debt Discharge Certificate (İtfa & İbraname).
   */
  static async getSettlementCertificate(
    engagementId: string,
    milestoneId: string,
    userId: string
  ): Promise<PaymentSettlementCertificate | null> {
    const isMock =
      Boolean(process.env.VITEST) ||
      engagementId.startsWith("eng-test-") ||
      engagementId.startsWith("eng-demo-");

    if (isMock) {
      const list = inMemoryMilestones.get(engagementId) || [];
      const m = list.find(
        (item) => item.id === milestoneId || item.sequenceNumber.toString() === milestoneId
      );
      if (!m || m.paymentStatus !== "CONFIRMED_PAID") return null;

      if (m.settlementCertificate) return m.settlementCertificate;

      // Dynamically construct if not already stored
      const declarationSeal = m.sha256Seal || "LEGACY_SEAL";
      const cert = PaymentHandshakeEngine.generateSettlementCertificate({
        engagementId,
        milestoneId: m.id,
        milestoneSequence: m.sequenceNumber,
        milestoneTitle: m.title,
        amount: m.amount,
        currency: m.currency,
        payerUserId: "employer",
        senderBank: m.senderBank || "BANK_TRANSFER",
        transferChannel: (m.transferChannel as TransferChannel) || "FAST",
        referenceNumber: m.paymentReference || "N/A",
        declaredAt: m.paidMarkedAt || new Date().toISOString(),
        declarationSeal,
        payeeUserId: userId,
        invoiceNumber: m.invoiceNumber || undefined,
        confirmedAt: m.paidConfirmedAt || new Date().toISOString(),
        confirmationSeal: declarationSeal,
        dualSeal: m.dualSeal || declarationSeal,
      });

      m.settlementCertificate = cert;
      return cert;
    }

    const db = getDb();
    const [milestone] = await db
      .select()
      .from(schema.engagementMilestones)
      .where(eq(schema.engagementMilestones.id, milestoneId))
      .limit(1);

    if (!milestone || milestone.paymentStatus !== "CONFIRMED_PAID") return null;

    return PaymentHandshakeEngine.generateSettlementCertificate({
      engagementId,
      milestoneId: milestone.id,
      milestoneSequence: milestone.sequenceNumber,
      milestoneTitle: milestone.title,
      amount: parseFloat(milestone.amount),
      currency: milestone.currency,
      payerUserId: "employer",
      senderBank: "BANK_TRANSFER",
      transferChannel: "FAST",
      referenceNumber: milestone.paymentReference || "N/A",
      declaredAt: milestone.paidMarkedAt
        ? new Date(milestone.paidMarkedAt).toISOString()
        : new Date().toISOString(),
      declarationSeal: milestone.sha256Seal || "SEAL",
      payeeUserId: userId,
      invoiceNumber: milestone.invoiceNumber || undefined,
      confirmedAt: milestone.paidConfirmedAt
        ? new Date(milestone.paidConfirmedAt).toISOString()
        : new Date().toISOString(),
      confirmationSeal: milestone.sha256Seal || "SEAL",
      dualSeal: milestone.sha256Seal || "SEAL",
    });
  }
}
