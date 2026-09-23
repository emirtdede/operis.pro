import { eq, and, inArray } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { NotificationService } from "@/src/modules/notifications/service";
import { PaymentHandshakeEngine } from "../payment-handshake/payment-handshake-engine";
import { IpAssignmentDeedEngine } from "../ip-assignment/ip-assignment-engine";
import { MilestoneAuthHelper } from "./milestone-auth";
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
    const authResult = await MilestoneAuthHelper.assertAccess(
      engagementId,
      milestoneId,
      userId,
      "CLIENT"
    );

    if (
      authResult.engagement.status === "COMPLETED" ||
      authResult.engagement.status === "CANCELLED"
    ) {
      throw new Error("Kapalı veya iptal edilmiş iş üzerinde ödeme işlemi yapılamaz.");
    }

    const isMock =
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

      if (m.paymentStatus === "CONFIRMED_PAID") {
        throw new Error(
          "Bu hakedişin ödemesi zaten kesinleşmiştir; tekrar ödeme bildirimi yapılamaz."
        );
      }

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
      .where(
        and(
          eq(schema.engagementMilestones.id, milestoneId),
          eq(schema.engagementMilestones.engagementId, engagementId)
        )
      )
      .limit(1);

    if (!existing) throw new Error("Milestone not found");

    if (existing.paymentStatus === "CONFIRMED_PAID") {
      throw new Error(
        "Bu hakedişin ödemesi zaten kesinleşmiştir; tekrar ödeme bildirimi yapılamaz."
      );
    }

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
      .where(
        and(
          eq(schema.engagementMilestones.id, milestoneId),
          eq(schema.engagementMilestones.engagementId, engagementId),
          inArray(schema.engagementMilestones.paymentStatus, ["UNPAID", "DISPUTED_PAID"])
        )
      )
      .returning();

    if (!updated) {
      throw new Error("Hakediş bulunamadı veya ödeme durumu bildirim için uygun değil.");
    }

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
    const authResult = await MilestoneAuthHelper.assertAccess(
      engagementId,
      milestoneId,
      userId,
      "CLIENT"
    );

    if (
      authResult.engagement.status === "COMPLETED" ||
      authResult.engagement.status === "CANCELLED"
    ) {
      throw new Error("Kapalı veya iptal edilmiş iş üzerinde ödeme işlemi yapılamaz.");
    }

    const isMock =
      engagementId.startsWith("eng-test-") ||
      engagementId.startsWith("eng-demo-");

    if (isMock) {
      const list = inMemoryMilestones.get(engagementId) || [];
      const m = list.find(
        (item) => item.id === milestoneId || item.sequenceNumber.toString() === milestoneId
      );
      if (!m) throw new Error("Milestone not found");

      if (m.paymentStatus === "CONFIRMED_PAID") {
        throw new Error("Kesinleşmiş (onaylanmış) ödeme geri alınamaz.");
      }
      if (m.paymentStatus === "UNPAID") {
        throw new Error("Ödeme bildirimi yapılmamış bir hakediş geri alınamaz.");
      }

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
      .where(
        and(
          eq(schema.engagementMilestones.id, milestoneId),
          eq(schema.engagementMilestones.engagementId, engagementId)
        )
      )
      .limit(1);

    if (!existing) throw new Error("Milestone not found");

    if (existing.paymentStatus === "CONFIRMED_PAID") {
      throw new Error("Kesinleşmiş (onaylanmış) ödeme geri alınamaz.");
    }
    if (existing.paymentStatus === "UNPAID") {
      throw new Error("Ödeme bildirimi yapılmamış bir hakediş geri alınamaz.");
    }

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
      .where(
        and(
          eq(schema.engagementMilestones.id, milestoneId),
          eq(schema.engagementMilestones.engagementId, engagementId),
          eq(schema.engagementMilestones.paymentStatus, "MARKED_PAID")
        )
      )
      .returning();

    if (!updated) {
      throw new Error("Hakediş bulunamadı veya geri alınabilecek bir ödeme bildirimi yok.");
    }

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
    const authResult = await MilestoneAuthHelper.assertAccess(
      engagementId,
      milestoneId,
      userId,
      "CONTRACTOR"
    );

    if (authResult.engagement.status === "CANCELLED") {
      throw new Error("İptal edilmiş iş üzerinde ödeme teyidi yapılamaz.");
    }

    const isMock =
      engagementId.startsWith("eng-test-") ||
      engagementId.startsWith("eng-demo-");

    if (isMock) {
      const list = inMemoryMilestones.get(engagementId) || [];
      const m = list.find(
        (item) => item.id === milestoneId || item.sequenceNumber.toString() === milestoneId
      );
      if (!m) throw new Error("Milestone not found");

      if (m.paymentStatus === "CONFIRMED_PAID") {
        return { success: true, milestone: m };
      }
      if (m.paymentStatus === "UNPAID") {
        throw new Error("İşveren henüz ödeme bildirimi yapmamıştır; ödeme teyit edilemez.");
      }

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
        payerUserId: authResult.engagement.ownerUserId,
        senderBank: m.senderBank || "GARANTI_BBVA",
        transferChannel: (m.transferChannel as TransferChannel) || "FAST",
        referenceNumber: m.paymentReference || "REF-BANK",
        declaredAt: m.paidMarkedAt || new Date().toISOString(),
        declarationSeal,
        payeeUserId: authResult.engagement.freelancerUserId,
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
        assignorUserId: authResult.engagement.freelancerUserId,
        assignorName: "Yüklenici Uzman",
        assignorEmail: "uzman@operis.pro",
        assigneeUserId: authResult.engagement.ownerUserId,
        assigneeName: "İşveren Müşteri",
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
          certificate: cert,
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
      .where(
        and(
          eq(schema.engagementMilestones.id, milestoneId),
          eq(schema.engagementMilestones.engagementId, engagementId)
        )
      )
      .limit(1);

    if (!existing) throw new Error("Milestone not found");

    if (existing.paymentStatus === "CONFIRMED_PAID") {
      return {
        success: true,
        milestone: {
          id: existing.id,
          engagementId: existing.engagementId,
          sequenceNumber: existing.sequenceNumber,
          title: existing.title,
          description: existing.description,
          deliverableCriteria: existing.deliverableCriteria,
          percentage: parseFloat(existing.percentage),
          amount: parseFloat(existing.amount),
          currency: existing.currency,
          targetDate: existing.targetDate,
          deliverableStatus: existing.deliverableStatus as DeliverableStatus,
          deliverableNote: existing.deliverableNote,
          deliverableUrl: existing.deliverableUrl,
          deliverableUrlType: existing.deliverableUrlType as MilestoneDeliverableUrlType | null,
          submittedAt: existing.submittedAt ? new Date(existing.submittedAt).toISOString() : null,
          acceptedAt: existing.acceptedAt ? new Date(existing.acceptedAt).toISOString() : null,
          paymentStatus: existing.paymentStatus as PaymentLedgerStatus,
          paymentReference: existing.paymentReference,
          paymentReceiptUrl: existing.paymentReceiptUrl,
          invoiceNumber: existing.invoiceNumber,
          paidMarkedAt: existing.paidMarkedAt ? new Date(existing.paidMarkedAt).toISOString() : null,
          paidConfirmedAt: existing.paidConfirmedAt
            ? new Date(existing.paidConfirmedAt).toISOString()
            : null,
          sha256Seal: existing.sha256Seal,
        },
      };
    }

    if (existing.paymentStatus === "UNPAID") {
      throw new Error("İşveren henüz ödeme bildirimi yapmamıştır; ödeme teyit edilemez.");
    }

    // WP-13: Resolve true participant identities from engagements and users/profiles
    const userRows = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        displayName: schema.profiles.displayName,
      })
      .from(schema.users)
      .leftJoin(schema.profiles, eq(schema.users.id, schema.profiles.userId))
      .where(
        inArray(schema.users.id, [
          authResult.engagement.ownerUserId,
          authResult.engagement.freelancerUserId,
        ])
      );

    const ownerUser = userRows.find((u) => u.id === authResult.engagement.ownerUserId);
    const freelancerUser = userRows.find((u) => u.id === authResult.engagement.freelancerUserId);

    const employerName = ownerUser?.displayName || "İşveren";
    const employerEmail = ownerUser?.email || "isveren@operis.pro";
    const freelancerName = freelancerUser?.displayName || "Yüklenici";
    const freelancerEmail = freelancerUser?.email || "yuklenici@operis.pro";

    const declarationSeal = existing.sha256Seal || "LEGACY_SEAL";
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

    const declEntry = [...existingAudit].reverse().find((a) => a.action === "PAYMENT_DECLARED");
    const senderBank = (declEntry?.metadata?.senderBank as string) || "BANK_TRANSFER";
    const transferChannel = (declEntry?.metadata?.transferChannel as TransferChannel) || "FAST";
    const referenceNumber =
      existing.paymentReference || (declEntry?.metadata?.referenceNumber as string) || "N/A";
    const declaredAt = existing.paidMarkedAt
      ? new Date(existing.paidMarkedAt).toISOString()
      : (declEntry?.timestamp as string) || paidConfirmedAt.toISOString();

    const cert = PaymentHandshakeEngine.generateSettlementCertificate({
      engagementId,
      milestoneId: existing.id,
      milestoneSequence: existing.sequenceNumber,
      milestoneTitle: existing.title,
      amount: parseFloat(existing.amount),
      currency: existing.currency,
      payerUserId: authResult.engagement.ownerUserId,
      senderBank,
      transferChannel,
      referenceNumber,
      declaredAt,
      declarationSeal,
      payeeUserId: authResult.engagement.freelancerUserId,
      invoiceNumber: input.invoiceNumber || undefined,
      confirmedAt: paidConfirmedAt.toISOString(),
      confirmationSeal,
      dualSeal,
    });

    const ipDeed = IpAssignmentDeedEngine.generateDeed({
      engagementId,
      listingTitle: existing.title || "Yazılım / Teknoloji Projesi",
      milestoneId: existing.id,
      milestoneSequence: existing.sequenceNumber,
      milestoneTitle: existing.title,
      milestoneDescription: existing.description,
      amount: parseFloat(existing.amount),
      currency: existing.currency,
      repositoryUrl:
        existing.deliverableUrlType === "CODE_REPO" ? existing.deliverableUrl : undefined,
      gitCommitHash: null,
      deliverableUrl: existing.deliverableUrl,
      deliverableUrlType: existing.deliverableUrlType,
      artifactSha256: dualSeal,
      paymentReference: referenceNumber,
      paymentDualSeal: dualSeal,
      settlementCertificateId: cert.certificateId,
      invoiceNumber: input.invoiceNumber || undefined,
      settledAt: paidConfirmedAt.toISOString(),
      assignorUserId: authResult.engagement.freelancerUserId,
      assignorName: freelancerName,
      assignorEmail: freelancerEmail,
      assigneeUserId: authResult.engagement.ownerUserId,
      assigneeName: employerName,
      assigneeEmail: employerEmail,
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
        certificate: cert,
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
      .where(
        and(
          eq(schema.engagementMilestones.id, milestoneId),
          eq(schema.engagementMilestones.engagementId, engagementId),
          inArray(schema.engagementMilestones.paymentStatus, ["MARKED_PAID", "DISPUTED_PAID"])
        )
      )
      .returning();

    if (!updated) {
      throw new Error(
        "Hakediş bulunamadı veya teyit edilebilecek durumda değil (yalnızca MARKED_PAID durumundaki hakedişler teyit edilebilir)."
      );
    }

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
    const authResult = await MilestoneAuthHelper.assertAccess(
      engagementId,
      milestoneId,
      userId,
      "CONTRACTOR"
    );

    if (
      authResult.engagement.status === "COMPLETED" ||
      authResult.engagement.status === "CANCELLED"
    ) {
      throw new Error("Kapalı veya iptal edilmiş iş üzerinde ödeme işlemi yapılamaz.");
    }

    const isMock =
      engagementId.startsWith("eng-test-") ||
      engagementId.startsWith("eng-demo-");

    if (isMock) {
      const list = inMemoryMilestones.get(engagementId) || [];
      const m = list.find(
        (item) => item.id === milestoneId || item.sequenceNumber.toString() === milestoneId
      );
      if (!m) throw new Error("Milestone not found");

      if (m.paymentStatus === "CONFIRMED_PAID") {
        throw new Error("Kesinleşmiş (onaylanmış) ödeme için itiraz bildirilemez.");
      }
      if (m.paymentStatus === "UNPAID") {
        throw new Error("Bildirilmemiş ödeme için itiraz yapılamaz.");
      }

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
      .where(
        and(
          eq(schema.engagementMilestones.id, milestoneId),
          eq(schema.engagementMilestones.engagementId, engagementId)
        )
      )
      .limit(1);

    if (!existing) throw new Error("Milestone not found");

    if (existing.paymentStatus === "CONFIRMED_PAID") {
      throw new Error("Kesinleşmiş (onaylanmış) ödeme için itiraz bildirilemez.");
    }
    if (existing.paymentStatus === "UNPAID") {
      throw new Error("Bildirilmemiş ödeme için itiraz yapılamaz.");
    }

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
        seal: disputeSeal,
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
      .where(
        and(
          eq(schema.engagementMilestones.id, milestoneId),
          eq(schema.engagementMilestones.engagementId, engagementId),
          eq(schema.engagementMilestones.paymentStatus, "MARKED_PAID")
        )
      )
      .returning();

    if (!updated) {
      throw new Error(
        "Hakediş bulunamadı veya itiraz edilebilecek bir ödeme bildirimi yok."
      );
    }

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
    const authResult = await MilestoneAuthHelper.assertAccess(
      engagementId,
      milestoneId,
      userId,
      "PARTICIPANT"
    );

    const isMock =
      engagementId.startsWith("eng-test-") ||
      engagementId.startsWith("eng-demo-");

    if (isMock) {
      const list = inMemoryMilestones.get(engagementId) || [];
      const m = list.find(
        (item) => item.id === milestoneId || item.sequenceNumber.toString() === milestoneId
      );
      if (!m || m.paymentStatus !== "CONFIRMED_PAID") return null;

      if (m.settlementCertificate) return m.settlementCertificate;

      const auditTrail = m.auditTrail || [];
      const confEntry = auditTrail.find(
        (a) => a.action === "PAYMENT_CONFIRMED" && a.metadata?.certificate
      );
      if (confEntry?.metadata?.certificate) {
        return confEntry.metadata.certificate as PaymentSettlementCertificate;
      }

      // Dynamically construct if not already stored (legacy mock)
      const declarationSeal = m.sha256Seal || "LEGACY_SEAL";
      const cert = PaymentHandshakeEngine.generateSettlementCertificate({
        engagementId,
        milestoneId: m.id,
        milestoneSequence: m.sequenceNumber,
        milestoneTitle: m.title,
        amount: m.amount,
        currency: m.currency,
        payerUserId: authResult.engagement.ownerUserId,
        senderBank: m.senderBank || "BANK_TRANSFER",
        transferChannel: (m.transferChannel as TransferChannel) || "FAST",
        referenceNumber: m.paymentReference || "N/A",
        declaredAt: m.paidMarkedAt || new Date().toISOString(),
        declarationSeal,
        payeeUserId: authResult.engagement.freelancerUserId,
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
      .where(
        and(
          eq(schema.engagementMilestones.id, milestoneId),
          eq(schema.engagementMilestones.engagementId, engagementId)
        )
      )
      .limit(1);

    if (!milestone || milestone.paymentStatus !== "CONFIRMED_PAID") return null;

    // WP-13: Return stored immutable certificate snapshot from audit trail if present
    const auditTrail: HandshakeAuditEntry[] = Array.isArray(milestone.auditTrailJson)
      ? (milestone.auditTrailJson as unknown as HandshakeAuditEntry[])
      : [];
    const confEntry = auditTrail.find(
      (a) => a.action === "PAYMENT_CONFIRMED" && a.metadata?.certificate
    );
    if (confEntry?.metadata?.certificate) {
      return confEntry.metadata.certificate as PaymentSettlementCertificate;
    }

    // Fallback: reconstruct using true engagement parties and audit entry bank info
    const declEntry = [...auditTrail].reverse().find((a) => a.action === "PAYMENT_DECLARED");
    const senderBank = (declEntry?.metadata?.senderBank as string) || "BANK_TRANSFER";
    const transferChannel = (declEntry?.metadata?.transferChannel as TransferChannel) || "FAST";
    const referenceNumber =
      milestone.paymentReference || (declEntry?.metadata?.referenceNumber as string) || "N/A";
    const declaredAt = milestone.paidMarkedAt
      ? new Date(milestone.paidMarkedAt).toISOString()
      : (declEntry?.timestamp as string) || new Date().toISOString();

    return PaymentHandshakeEngine.generateSettlementCertificate({
      engagementId,
      milestoneId: milestone.id,
      milestoneSequence: milestone.sequenceNumber,
      milestoneTitle: milestone.title,
      amount: parseFloat(milestone.amount),
      currency: milestone.currency,
      payerUserId: authResult.engagement.ownerUserId,
      senderBank,
      transferChannel,
      referenceNumber,
      declaredAt,
      declarationSeal: milestone.sha256Seal || "SEAL",
      payeeUserId: authResult.engagement.freelancerUserId,
      invoiceNumber: milestone.invoiceNumber || undefined,
      confirmedAt: milestone.paidConfirmedAt
        ? new Date(milestone.paidConfirmedAt).toISOString()
        : new Date().toISOString(),
      confirmationSeal: milestone.sha256Seal || "SEAL",
      dualSeal: milestone.sha256Seal || "SEAL",
    });
  }
}
