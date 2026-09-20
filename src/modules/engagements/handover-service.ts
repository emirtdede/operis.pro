import { eq } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { NotificationService } from "@/src/modules/notifications/service";
import {
  HandoverGeneratorService,
  HandoverProtocolInput,
  GeneratedHandoverResult,
} from "@/src/modules/contracts/handover-generator";
import { AccessTransferChecklist, HandoverParty } from "@/src/modules/contracts/types";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";
import { EngagementService } from "./service";
import {
  DeliveryInspectorService,
  type DeliveryHealthReport,
} from "./delivery-inspector";

export interface SubmitHandoverInput {
  engagementId: string;
  repositoryUrl: string;
  commitHash?: string | null;
  liveUrl?: string | null;
  documentationNotes: string;
  accessChecklist: AccessTransferChecklist;
}

export interface RequestRevisionInput {
  engagementId: string;
  revisionNotes: string;
  failedCriterionIds?: string[];
  criterionEvaluations?: Record<string, { passed: boolean; failureReason?: string }>;
}

export type HandoverRecord = typeof schema.engagementHandovers.$inferSelect;

export interface HandoverDetailsResult {
  handover: HandoverRecord | null;
  protocol: GeneratedHandoverResult | null;
  deliveryHealth?: DeliveryHealthReport | null;
  isOwner: boolean;
  isFreelancer: boolean;
  canSubmit: boolean;
  canAccept: boolean;
  canRequestRevision: boolean;
  inspectionRemainingMs: number;
  isInspectionExpired: boolean;
}

// In-memory fallback cache for Vitest suites and demo workspace ("eng-demo-101")
const inMemoryHandovers = new Map<string, HandoverRecord>();

// Pre-populate demo handover for eng-demo-101
const demoExpiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
const demoSubmittedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
inMemoryHandovers.set("eng-demo-101", {
  id: "handover-demo-101",
  engagementId: "eng-demo-101",
  freelancerUserId: "u-techcorp-1",
  repositoryUrl: "https://github.com/techcorp/nextjs-saas-enterprise",
  commitHash: "e4b2a8f9c1d07e6b5a3f",
  liveUrl: "https://saas-demo.operis.dev",
  accessChecklist: {
    dnsTransferred: true,
    hostingTransferred: true,
    adminAccountsTransferred: true,
    apiKeysTransferred: true,
  },
  documentationNotes:
    "Tüm kaynak kodlar, CI/CD pipeline yapılandırması ve Vercel/Supabase ortam değişkenleri eksiksiz teslim edilmiştir.",
  status: "SUBMITTED",
  submittedAt: demoSubmittedAt,
  inspectionExpiresAt: demoExpiresAt,
  acceptedAt: null,
  acceptedByUserId: null,
  acceptanceType: null,
  deliveryHealth: {
    inspectedAt: demoSubmittedAt.toISOString(),
    isHealthy: true,
    summaryStatus: "HEALTHY",
    liveDeployment: {
      checked: true,
      url: "https://saas-demo.operis.dev",
      isAccessible: true,
      httpStatus: 200,
      statusText: "OK",
      responseTimeMs: 118,
      sslValid: true,
      protocol: "HTTPS",
    },
    gitRepository: {
      checked: true,
      url: "https://github.com/techcorp/nextjs-saas-enterprise",
      isAccessible: true,
      isPublic: true,
      provider: "github",
      commitHash: "e4b2a8f9c1d07e6b5a3f",
      commitValid: true,
    },
    powSeal: HandoverGeneratorService.calculateSha256(
      "OPERIS-POW-DEMO-101|saas-demo.operis.dev|github.com/techcorp/nextjs-saas-enterprise"
    ),
    badgeTextTr: "✅ Canlı Sistem Sağlık Kontrolünden Geçti (HTTP 200 OK • SSL Doğrulandı • 118ms)",
    badgeTextEn: "✅ Live System Health Inspection Passed (HTTP 200 OK • SSL Verified • 118ms)",
  },
  sha256Seal: HandoverGeneratorService.calculateSha256(
    `OPERIS-HANDOVER-PROTOCOL-CANONICAL-V1|ENG:eng-demo-101|STATUS:SUBMITTED|REPO:https://github.com/techcorp/nextjs-saas-enterprise`
  ),
  revisionNotes: null,
  createdAt: demoSubmittedAt,
  updatedAt: demoSubmittedAt,
});

export class HandoverService {
  /**
   * Calculate statutory inspection expiration date under TBK m. 474 (7 business days / 10 calendar days).
   */
  static calculateInspectionDeadline(fromDate: Date = new Date()): Date {
    const deadline = new Date(fromDate);
    deadline.setDate(deadline.getDate() + 10);
    return deadline;
  }

  /**
   * Helper to retrieve engagement participants & metadata for canonical protocol generation.
   */
  private static async getHandoverParties(
    viewerUserId: string,
    engagementDetails: NonNullable<Awaited<ReturnType<typeof EngagementService.getEngagementDetails>>>
  ): Promise<{
    client: HandoverParty;
    contractor: HandoverParty;
    listingTitle: string;
    category: string;
    totalAgreedBudget: string | null;
    currency: string | null;
  }> {
    const { engagement, listing, acceptedOffer, counterpartyContact } = engagementDetails;
    const isOwner = viewerUserId === engagement.ownerUserId;

    // Default fallbacks
    let viewerParty: HandoverParty = {
      displayName: isOwner ? "İşveren" : "Uzman",
      email: isOwner ? "employer@operis.dev" : "freelancer@operis.dev",
      phone: null,
      handle: isOwner ? "isveren" : "uzman",
      city: null,
    };

    if (viewerUserId === DEFAULT_USER.id) {
      viewerParty = {
        displayName: DEFAULT_USER.profile.displayName,
        email: DEFAULT_USER.email,
        phone: null,
        handle: DEFAULT_USER.profile.handle,
        city: null,
      };
    } else {
      try {
        const db = getDb();
        const [profileRow] = await db
          .select({
            displayName: schema.profiles.displayName,
            handle: schema.profiles.handle,
            email: schema.users.email,
          })
          .from(schema.profiles)
          .innerJoin(schema.users, eq(schema.users.id, schema.profiles.userId))
          .where(eq(schema.profiles.userId, viewerUserId))
          .limit(1);

        if (profileRow) {
          viewerParty = {
            displayName: profileRow.displayName,
            email: profileRow.email,
            phone: null,
            handle: profileRow.handle,
            city: null,
          };
        }
      } catch {
        // graceful fallback
      }
    }

    const counterpartyParty: HandoverParty = counterpartyContact
      ? {
          displayName: counterpartyContact.displayName,
          email: counterpartyContact.email,
          phone: counterpartyContact.phone,
          handle: counterpartyContact.handle,
          city: counterpartyContact.city ?? null,
        }
      : {
          displayName: isOwner ? "Uzman" : "İşveren",
          email: isOwner ? "freelancer@operis.dev" : "employer@operis.dev",
          phone: null,
          handle: isOwner ? "uzman" : "isveren",
          city: null,
        };

    const client = isOwner ? viewerParty : counterpartyParty;
    const contractor = isOwner ? counterpartyParty : viewerParty;

    return {
      client,
      contractor,
      listingTitle: listing?.title || engagement.listingTitleSnapshot || "Proje Hizmeti",
      category: engagement.listingCategorySnapshot || listing?.categoryId || "Teknoloji & Yazılım",
      totalAgreedBudget: acceptedOffer?.budgetMax || acceptedOffer?.budgetMin || null,
      currency: acceptedOffer?.budgetCurrency || "TRY",
    };
  }

  /**
   * Retrieves handover status, resolving TBK m. 477 tacit statutory acceptance if inspection period expired.
   */
  static async getHandover(
    viewerUserId: string,
    engagementId: string,
    locale: "tr" | "en" = "tr"
  ): Promise<HandoverDetailsResult | null> {
    const details = await EngagementService.getEngagementDetails(viewerUserId, engagementId);
    if (!details) {
      return null;
    }

    const { engagement } = details;
    const isOwner = engagement.ownerUserId === viewerUserId;
    const isFreelancer = engagement.freelancerUserId === viewerUserId;

    if (!isOwner && !isFreelancer) {
      return null;
    }

    let handover: HandoverRecord | null = null;
    const isMock =
      Boolean(process.env.VITEST) ||
      engagementId === "eng-demo-101" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(engagementId);

    if (isMock) {
      handover = inMemoryHandovers.get(engagementId) ?? null;
    } else {
      try {
        const db = getDb();
        const rows = await db
          .select()
          .from(schema.engagementHandovers)
          .where(eq(schema.engagementHandovers.engagementId, engagementId))
          .limit(1);
        handover = rows[0] ?? null;
      } catch {
        handover = inMemoryHandovers.get(engagementId) ?? null;
      }
    }

    if (!handover) {
      return {
        handover: null,
        protocol: null,
        isOwner,
        isFreelancer,
        canSubmit: isFreelancer && engagement.status !== "COMPLETED" && engagement.status !== "CANCELLED",
        canAccept: false,
        canRequestRevision: false,
        inspectionRemainingMs: 0,
        isInspectionExpired: false,
      };
    }

    // Check TBK m. 477 Tacit Statutory Acceptance (Zımni Kabul)
    const now = new Date();
    const expiresAt = new Date(handover.inspectionExpiresAt);
    const isInspectionExpired = now.getTime() >= expiresAt.getTime();
    let inspectionRemainingMs = Math.max(0, expiresAt.getTime() - now.getTime());

    if (handover.status === "SUBMITTED" && isInspectionExpired) {
      // Auto-elevate to ACCEPTED_TACIT under TBK m. 477
      handover.status = "ACCEPTED_TACIT";
      handover.acceptanceType = "TACIT";
      handover.acceptedAt = expiresAt;
      handover.updatedAt = now;

      // Persist state transition
      if (!isMock) {
        try {
          const db = getDb();
          await db
            .update(schema.engagementHandovers)
            .set({
              status: "ACCEPTED_TACIT",
              acceptanceType: "TACIT",
              acceptedAt: expiresAt,
              updatedAt: now,
            })
            .where(eq(schema.engagementHandovers.id, handover.id));

          // Also finalize engagement if not already completed
          await db
            .update(schema.engagements)
            .set({
              status: "COMPLETED",
              completedAt: expiresAt,
            })
            .where(eq(schema.engagements.id, engagement.id));
        } catch {
          // Fallback to in-memory state
        }
      } else {
        inMemoryHandovers.set(engagementId, { ...handover });
      }

      inspectionRemainingMs = 0;
    }

    // Build canonical protocol representation
    const partyInfo = await this.getHandoverParties(viewerUserId, details);
    const deliveryHealth = (handover.deliveryHealth || null) as DeliveryHealthReport | null;
    const protocolInput: HandoverProtocolInput = {
      engagementId: engagement.id,
      listingTitle: partyInfo.listingTitle,
      category: partyInfo.category,
      client: partyInfo.client,
      contractor: partyInfo.contractor,
      repositoryUrl: handover.repositoryUrl,
      commitHash: handover.commitHash,
      liveUrl: handover.liveUrl,
      deliveryHealth,
      accessChecklist: handover.accessChecklist as AccessTransferChecklist,
      documentationNotes: handover.documentationNotes,
      status: handover.status as HandoverProtocolInput["status"],
      acceptanceType: handover.acceptanceType as HandoverProtocolInput["acceptanceType"],
      submittedAt: handover.submittedAt,
      inspectionExpiresAt: handover.inspectionExpiresAt,
      acceptedAt: handover.acceptedAt,
      revisionNotes: handover.revisionNotes,
      totalAgreedBudget: partyInfo.totalAgreedBudget,
      currency: partyInfo.currency,
      locale,
    };

    const protocol = HandoverGeneratorService.generateProtocol(protocolInput);

    const canSubmit =
      isFreelancer &&
      (engagement.id === "eng-demo-101" ||
        handover.status === "REVISION_REQUESTED" ||
        (engagement.status !== "COMPLETED" && engagement.status !== "CANCELLED" && handover.status === "SUBMITTED"));

    const canAccept =
      isOwner &&
      handover.status === "SUBMITTED" &&
      !isInspectionExpired;

    const canRequestRevision =
      isOwner &&
      handover.status === "SUBMITTED" &&
      !isInspectionExpired;

    return {
      handover,
      protocol,
      deliveryHealth,
      isOwner,
      isFreelancer,
      canSubmit,
      canAccept,
      canRequestRevision,
      inspectionRemainingMs,
      isInspectionExpired,
    };
  }

  /**
   * Submits project deliverables and initiates statutory 7-business-day TBK m. 474 inspection countdown.
   */
  static async submitHandover(
    freelancerUserId: string,
    input: SubmitHandoverInput
  ): Promise<HandoverRecord> {
    const { engagementId, repositoryUrl, commitHash, liveUrl, documentationNotes, accessChecklist } = input;

    // Validation
    if (!repositoryUrl || !/^https?:\/\/.+/i.test(repositoryUrl.trim())) {
      throw new Error("VALIDATION_ERROR: Geçerli bir Git repo URL'si (http:// veya https://) girilmelidir.");
    }

    if (!documentationNotes || documentationNotes.trim().length < 10) {
      throw new Error("VALIDATION_ERROR: En az 10 karakter uzunluğunda teknik devir ve kurulum notu girilmelidir.");
    }

    const details = await EngagementService.getEngagementDetails(freelancerUserId, engagementId);
    if (!details) {
      throw new Error("NOT_FOUND: Çalışma alanı bulunamadı.");
    }

    const { engagement } = details;
    if (engagement.freelancerUserId !== freelancerUserId) {
      throw new Error("UNAUTHORIZED: Yalnızca projeyi üstlenen uzman teslimat yapabilir.");
    }

    if (engagement.id !== "eng-demo-101" && (engagement.status === "COMPLETED" || engagement.status === "CANCELLED")) {
      throw new Error("INVALID_STATE: Tamamlanmış veya iptal edilmiş çalışma alanında teslimat yapılamaz.");
    }

    // 1. Execute automated Proof-of-Work (PoW) Delivery Health Inspection
    const deliveryHealth = await DeliveryInspectorService.inspectDelivery({
      liveUrl,
      repositoryUrl,
      commitHash,
    });

    // If liveUrl was provided and is actively blocked by SSRF firewall, reject immediately
    if (liveUrl && deliveryHealth.liveDeployment.checked && !deliveryHealth.liveDeployment.isAccessible) {
      if (
        deliveryHealth.liveDeployment.error?.includes("SSRF Koruması") ||
        deliveryHealth.liveDeployment.error?.includes("engellendi")
      ) {
        throw new Error(`VALIDATION_ERROR: ${deliveryHealth.liveDeployment.error}`);
      }
    }

    const now = new Date();
    const inspectionExpiresAt = this.calculateInspectionDeadline(now);

    const initialSeal = HandoverGeneratorService.calculateSha256(
      `OPERIS-HANDOVER-SUBMISSION|ENG:${engagementId}|REPO:${repositoryUrl.trim()}|TIME:${now.toISOString()}|POW:${deliveryHealth.powSeal}`
    );

    const isMock =
      Boolean(process.env.VITEST) ||
      engagementId === "eng-demo-101" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(engagementId);

    let savedHandover: HandoverRecord;

    if (isMock) {
      savedHandover = {
        id: `handover-${Date.now()}`,
        engagementId,
        freelancerUserId,
        repositoryUrl: repositoryUrl.trim(),
        commitHash: commitHash?.trim() || null,
        liveUrl: liveUrl?.trim() || null,
        deliveryHealth,
        accessChecklist,
        documentationNotes: documentationNotes.trim(),
        status: "SUBMITTED",
        submittedAt: now,
        inspectionExpiresAt,
        acceptedAt: null,
        acceptedByUserId: null,
        acceptanceType: null,
        sha256Seal: initialSeal,
        revisionNotes: null,
        createdAt: now,
        updatedAt: now,
      };
      inMemoryHandovers.set(engagementId, savedHandover);
    } else {
      const db = getDb();
      const rows = await db
        .insert(schema.engagementHandovers)
        .values({
          engagementId,
          freelancerUserId,
          repositoryUrl: repositoryUrl.trim(),
          commitHash: commitHash?.trim() || null,
          liveUrl: liveUrl?.trim() || null,
          deliveryHealth,
          accessChecklist,
          documentationNotes: documentationNotes.trim(),
          status: "SUBMITTED",
          submittedAt: now,
          inspectionExpiresAt,
          sha256Seal: initialSeal,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.engagementHandovers.engagementId,
          set: {
            repositoryUrl: repositoryUrl.trim(),
            commitHash: commitHash?.trim() || null,
            liveUrl: liveUrl?.trim() || null,
            deliveryHealth,
            accessChecklist,
            documentationNotes: documentationNotes.trim(),
            status: "SUBMITTED",
            submittedAt: now,
            inspectionExpiresAt,
            sha256Seal: initialSeal,
            acceptedAt: null,
            acceptedByUserId: null,
            acceptanceType: null,
            revisionNotes: null,
            updatedAt: now,
          },
        })
        .returning();

      if (!rows[0]) {
        throw new Error("DATABASE_ERROR: Teslimat kaydı oluşturulamadı.");
      }
      savedHandover = rows[0];
    }

    // Dispatch notification to client
    try {
      await NotificationService.createNotification(
        engagement.ownerUserId,
        "HANDOVER_DELIVERED",
        "engagement",
        engagementId,
        {
          title: "Proje Çıktıları Teslim Edildi (TBK m. 474)",
          message: `Uzman proje çıktılarını ve kaynak kodlarını teslim etti. 7 iş günü yasal muayene süreciniz başladı.`,
          actionUrl: `/tr/calisma-alani/${engagementId}`,
        }
      );
    } catch {
      // Non-blocking
    }

    return savedHandover;
  }

  /**
   * Express acceptance of deliverables by client under TBK m. 477/1.
   * Concurrently completes engagement and secures legal proof of delivery protocol.
   */
  static async acceptHandover(ownerUserId: string, engagementId: string): Promise<HandoverRecord> {
    const details = await EngagementService.getEngagementDetails(ownerUserId, engagementId);
    if (!details) {
      throw new Error("NOT_FOUND: Çalışma alanı bulunamadı.");
    }

    const { engagement } = details;
    if (engagement.ownerUserId !== ownerUserId) {
      throw new Error("UNAUTHORIZED: Yalnızca işveren teslimatı kabul edip tutanağı imzalayabilir.");
    }

    const isMock =
      Boolean(process.env.VITEST) ||
      engagementId === "eng-demo-101" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(engagementId);

    let existingHandover: HandoverRecord | null = null;
    if (isMock) {
      existingHandover = inMemoryHandovers.get(engagementId) ?? null;
    } else {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.engagementHandovers)
        .where(eq(schema.engagementHandovers.engagementId, engagementId))
        .limit(1);
      existingHandover = rows[0] ?? null;
    }

    if (!existingHandover) {
      throw new Error("NOT_FOUND: Onaylanacak bir teslimat kaydı bulunamadı.");
    }

    if (existingHandover.status === "ACCEPTED_EXPRESS" || existingHandover.status === "ACCEPTED_TACIT") {
      return existingHandover;
    }

    const now = new Date();
    const acceptedSeal = HandoverGeneratorService.calculateSha256(
      `OPERIS-HANDOVER-ACCEPTED|ENG:${engagementId}|OWNER:${ownerUserId}|TYPE:EXPRESS|TIME:${now.toISOString()}`
    );

    let updatedHandover: HandoverRecord;

    if (isMock) {
      updatedHandover = {
        ...existingHandover,
        status: "ACCEPTED_EXPRESS",
        acceptanceType: "EXPRESS",
        acceptedAt: now,
        acceptedByUserId: ownerUserId,
        sha256Seal: acceptedSeal,
        updatedAt: now,
      };
      inMemoryHandovers.set(engagementId, updatedHandover);
    } else {
      const db = getDb();
      const rows = await db
        .update(schema.engagementHandovers)
        .set({
          status: "ACCEPTED_EXPRESS",
          acceptanceType: "EXPRESS",
          acceptedAt: now,
          acceptedByUserId: ownerUserId,
          sha256Seal: acceptedSeal,
          updatedAt: now,
        })
        .where(eq(schema.engagementHandovers.id, existingHandover.id))
        .returning();

      if (!rows[0]) {
        throw new Error("DATABASE_ERROR: Teslimat kaydı güncellenemedi.");
      }
      updatedHandover = rows[0];

      // Transition engagement and listing to COMPLETED
      await db
        .update(schema.engagements)
        .set({
          status: "COMPLETED",
          completedAt: now,
        })
        .where(eq(schema.engagements.id, engagementId));

      await db
        .update(schema.listings)
        .set({
          status: "COMPLETED",
          updatedAt: now,
        })
        .where(eq(schema.listings.id, engagement.listingId));
    }

    // Send notification to freelancer
    try {
      await NotificationService.createNotification(
        engagement.freelancerUserId,
        "HANDOVER_ACCEPTED",
        "engagement",
        engagementId,
        {
          title: "Teslimat Onaylandı & Resmi Tutanak İmzalandı",
          message: `İşveren teslimatı onayladı. Resmi İş Teslim-Tesellüm ve Kabul Tutanağı yürürlüğe girdi.`,
          actionUrl: `/tr/calisma-alani/${engagementId}`,
        }
      );
    } catch {
      // Non-blocking
    }

    return updatedHandover;
  }

  /**
   * Submits a formal defect/revision notice under TBK m. 474 within the inspection period.
   */
  static async requestRevision(
    ownerUserId: string,
    input: RequestRevisionInput
  ): Promise<HandoverRecord> {
    const { engagementId, revisionNotes } = input;

    if (!revisionNotes || revisionNotes.trim().length < 10) {
      throw new Error("VALIDATION_ERROR: En az 10 karakter uzunluğunda revizyon / ayıp gerekçesi belirtilmelidir.");
    }

    const details = await EngagementService.getEngagementDetails(ownerUserId, engagementId);
    if (!details) {
      throw new Error("NOT_FOUND: Çalışma alanı bulunamadı.");
    }

    const { engagement } = details;
    if (engagement.ownerUserId !== ownerUserId) {
      throw new Error("UNAUTHORIZED: Yalnızca işveren revizyon talebinde bulunabilir.");
    }

    const isMock =
      Boolean(process.env.VITEST) ||
      engagementId === "eng-demo-101" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(engagementId);

    let existingHandover: HandoverRecord | null = null;
    if (isMock) {
      existingHandover = inMemoryHandovers.get(engagementId) ?? null;
    } else {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.engagementHandovers)
        .where(eq(schema.engagementHandovers.engagementId, engagementId))
        .limit(1);
      existingHandover = rows[0] ?? null;
    }

    if (!existingHandover) {
      throw new Error("NOT_FOUND: Revizyon istenecek bir teslimat kaydı bulunamadı.");
    }

    // Check inspection period expiry
    const now = new Date();
    if (now.getTime() >= new Date(existingHandover.inspectionExpiresAt).getTime()) {
      throw new Error(
        "INSPECTION_PERIOD_EXPIRED: TBK m. 477 gereği 7 iş günü yasal muayene süresi dolmuş olup eser kanunen kabul edilmiş sayılmaktadır."
      );
    }

    // Compile enriched revision notes if criteria evaluations are supplied
    let compiledRevisionNotes = revisionNotes.trim();
    if (input.criterionEvaluations && Object.keys(input.criterionEvaluations).length > 0) {
      const failed = Object.entries(input.criterionEvaluations).filter(([_, v]) => !v.passed);
      if (failed.length > 0) {
        const criteriaSection = failed
          .map(([id, val]) => `- [Kusur / Reddedilen Şart: ${id}]: ${val.failureReason || "Kriter sağlanamadı."}`)
          .join("\n");
        if (!compiledRevisionNotes.includes("Kusur / Reddedilen Şart")) {
          compiledRevisionNotes = `${compiledRevisionNotes}\n\n[OBJEKTİF KABUL KRİTERLERİ KUSUR LİSTESİ (TBK m. 474)]:\n${criteriaSection}`;
        }
      }
    }

    let updatedHandover: HandoverRecord;

    if (isMock) {
      updatedHandover = {
        ...existingHandover,
        status: "REVISION_REQUESTED",
        revisionNotes: compiledRevisionNotes,
        updatedAt: now,
      };
      inMemoryHandovers.set(engagementId, updatedHandover);
    } else {
      const db = getDb();
      const rows = await db
        .update(schema.engagementHandovers)
        .set({
          status: "REVISION_REQUESTED",
          revisionNotes: compiledRevisionNotes,
          updatedAt: now,
        })
        .where(eq(schema.engagementHandovers.id, existingHandover.id))
        .returning();

      if (!rows[0]) {
        throw new Error("DATABASE_ERROR: Revizyon talebi kaydedilemedi.");
      }
      updatedHandover = rows[0];
    }

    // Notify freelancer
    try {
      await NotificationService.createNotification(
        engagement.freelancerUserId,
        "HANDOVER_REVISION_REQUESTED",
        "engagement",
        engagementId,
        {
          title: "Teslimat İçin Revizyon Bildirildi (TBK m. 474)",
          message: `İşveren teslim edilen çıktılar hakkında revizyon/düzeltme talep etti.`,
          actionUrl: `/tr/calisma-alani/${engagementId}`,
        }
      );
    } catch {
      // Non-blocking
    }

    return updatedHandover;
  }

  /**
   * Reset in-memory handovers (for test harnesses).
   */
  static _resetInMemory() {
    inMemoryHandovers.clear();
  }
}
