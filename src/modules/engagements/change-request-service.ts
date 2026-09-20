import { eq, asc } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { NotificationService } from "@/src/modules/notifications/service";
import { EngagementService } from "./service";
import {
  AddendumGeneratorService,
} from "@/src/modules/contracts/addendum-generator";
import { ContractGeneratorService } from "@/src/modules/contracts/generator";
import {
  ContractParty,
  ChangeRequestReason,
  AddendumGeneratorInput,
} from "@/src/modules/contracts/types";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";

export type ChangeRequestRecord = typeof schema.engagementChangeRequests.$inferSelect;

export interface CreateChangeRequestInput {
  engagementId: string;
  requesterUserId: string;
  title: string;
  description: string;
  reason: ChangeRequestReason;
  additionalBudget: number;
  currency?: string;
  additionalDays: number;
}

export interface RespondChangeRequestInput {
  changeRequestId: string;
  userId: string;
  action: "APPROVE" | "REJECT";
  rejectionReason?: string;
  locale?: "tr" | "en";
}

export interface ChangeRequestSummaryDto {
  totalApprovedBudget: number;
  totalApprovedDays: number;
  approvedAddendumsCount: number;
  currency: string;
  pendingRequest: ChangeRequestRecord | null;
  changeRequests: ChangeRequestRecord[];
}

// In-memory fallback map for Vitest and local demo environments
export const inMemoryChangeRequests = new Map<string, ChangeRequestRecord[]>();

// Initialize demo addendum for eng-demo-101
const demoCrId = "cr-demo-101";
const demoDate = new Date("2026-08-10T11:00:00Z");
inMemoryChangeRequests.set("eng-demo-101", [
  {
    id: demoCrId,
    engagementId: "eng-demo-101",
    requesterUserId: "u-techcorp-1",
    reviewerUserId: DEFAULT_USER.id,
    sequenceNumber: 1,
    title: "Çoklu Para Birimi (Multi-Currency) & Stripe Entegrasyonu",
    description:
      "Uluslararası ödemeler için Stripe checkout altyapısının kurulması, webhook güvenliğinin sağlanması ve EUR/USD kur dönüşüm mekanizmasının eklenmesi.",
    reason: "CLIENT_REQUESTED",
    additionalBudget: "12000.00",
    currency: "TRY",
    additionalDays: 4,
    status: "APPROVED",
    rejectionReason: null,
    respondedAt: new Date("2026-08-11T09:30:00Z"),
    parentContractSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    addendumSha256: AddendumGeneratorService.calculateSha256(
      "OPR-ADDENDUM-ENGDEMO1-01|Stripe Entegrasyonu|12000.00|4"
    ),
    addendumContentMarkdown: `# SÖZLEŞME ZEYİLNAMESİ (EK PROTOKOL NO: 01)\n**Zeyilname Ref:** \`OPR-ADDENDUM-ENGDEMO1-01\`\nStripe ve çoklu para birimi kapsamı ana sözleşmeye dahil edilmiştir.`,
    createdAt: demoDate,
    updatedAt: new Date("2026-08-11T09:30:00Z"),
  },
]);

export class ChangeRequestService {
  /**
   * Helper to retrieve engagement party contacts for legal contract generation.
   */
  private static async getParties(
    viewerUserId: string,
    engagementDetails: NonNullable<Awaited<ReturnType<typeof EngagementService.getEngagementDetails>>>
  ): Promise<{
    client: ContractParty;
    contractor: ContractParty;
    listingTitle: string;
  }> {
    const { engagement, listing, counterpartyContact } = engagementDetails;
    const isOwner = viewerUserId === engagement.ownerUserId;

    let viewerParty: ContractParty = {
      displayName: isOwner ? "İş Sahibi" : "Yüklenici",
      email: isOwner ? "employer@operis.dev" : "freelancer@operis.dev",
      phone: null,
      handle: isOwner ? "isveren" : "uzman",
      role: isOwner ? "CLIENT" : "CONTRACTOR",
    };

    if (viewerUserId === DEFAULT_USER.id) {
      viewerParty = {
        displayName: DEFAULT_USER.profile.displayName,
        email: DEFAULT_USER.email,
        phone: "+905329998877",
        handle: DEFAULT_USER.profile.handle,
        role: isOwner ? "CLIENT" : "CONTRACTOR",
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
            role: isOwner ? "CLIENT" : "CONTRACTOR",
          };
        }
      } catch {
        // fallback
      }
    }

    const counterpartyParty: ContractParty = counterpartyContact
      ? {
          displayName: counterpartyContact.displayName,
          email: counterpartyContact.email,
          phone: counterpartyContact.phone,
          handle: counterpartyContact.handle,
          city: counterpartyContact.city ?? null,
          role: isOwner ? "CONTRACTOR" : "CLIENT",
        }
      : {
          displayName: isOwner ? "Yüklenici" : "İş Sahibi",
          email: isOwner ? "freelancer@operis.dev" : "employer@operis.dev",
          phone: null,
          handle: isOwner ? "uzman" : "isveren",
          role: isOwner ? "CONTRACTOR" : "CLIENT",
        };

    const client = isOwner ? viewerParty : counterpartyParty;
    const contractor = isOwner ? counterpartyParty : viewerParty;

    return {
      client,
      contractor,
      listingTitle: listing?.title || engagement.listingTitleSnapshot || "Yazılım Hizmeti",
    };
  }

  /**
   * Creates a formal Change Request (Scope Shield trigger) for an active engagement.
   */
  static async createChangeRequest(input: CreateChangeRequestInput): Promise<ChangeRequestRecord> {
    const details = await EngagementService.getEngagementDetails(input.requesterUserId, input.engagementId);
    if (!details) {
      throw new Error("ENGAGEMENT_NOT_FOUND");
    }

    const { engagement } = details;
    if (engagement.status === "CANCELLED") {
      throw new Error("ENGAGEMENT_NOT_ACTIVE");
    }

    const isOwner = engagement.ownerUserId === input.requesterUserId;
    const isFreelancer = engagement.freelancerUserId === input.requesterUserId;
    if (!isOwner && !isFreelancer) {
      throw new Error("UNAUTHORIZED_USER");
    }

    const reviewerUserId = isOwner ? engagement.freelancerUserId : engagement.ownerUserId;

    // Validate inputs
    const trimmedTitle = (input.title || "").trim();
    const trimmedDesc = (input.description || "").trim();
    if (trimmedTitle.length < 5 || trimmedTitle.length > 160) {
      throw new Error("INVALID_TITLE_LENGTH");
    }
    if (trimmedDesc.length < 20) {
      throw new Error("INVALID_DESCRIPTION_LENGTH");
    }

    const additionalBudget = Math.max(0, Number(input.additionalBudget) || 0);
    const additionalDays = Math.max(0, Math.floor(Number(input.additionalDays) || 0));
    const currency = (input.currency || "TRY").toUpperCase();

    // Check if there is already a PENDING change request
    const existingList = await this.getRecords(input.engagementId);
    const hasPending = existingList.some((cr) => cr.status === "PENDING");
    if (hasPending) {
      throw new Error("ACTIVE_CHANGE_REQUEST_EXISTS");
    }

    const nextSeq = existingList.length > 0
      ? Math.max(...existingList.map((cr) => cr.sequenceNumber)) + 1
      : 1;

    const isMock =
      Boolean(process.env.VITEST) ||
      input.engagementId === "eng-demo-101" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.engagementId);

    const now = new Date();
    const newRecordId = `cr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    let savedRecord: ChangeRequestRecord;

    if (isMock) {
      savedRecord = {
        id: newRecordId,
        engagementId: input.engagementId,
        requesterUserId: input.requesterUserId,
        reviewerUserId,
        sequenceNumber: nextSeq,
        title: trimmedTitle,
        description: trimmedDesc,
        reason: input.reason,
        additionalBudget: additionalBudget.toFixed(2),
        currency,
        additionalDays,
        status: "PENDING",
        rejectionReason: null,
        respondedAt: null,
        parentContractSha256: null,
        addendumSha256: null,
        addendumContentMarkdown: null,
        createdAt: now,
        updatedAt: now,
      };

      const current = inMemoryChangeRequests.get(input.engagementId) || [];
      current.push(savedRecord);
      inMemoryChangeRequests.set(input.engagementId, current);
    } else {
      try {
        const db = getDb();
        const rows = await db
          .insert(schema.engagementChangeRequests)
          .values({
            engagementId: input.engagementId,
            requesterUserId: input.requesterUserId,
            reviewerUserId,
            sequenceNumber: nextSeq,
            title: trimmedTitle,
            description: trimmedDesc,
            reason: input.reason,
            additionalBudget: additionalBudget.toFixed(2),
            currency,
            additionalDays,
            status: "PENDING",
            rejectionReason: null,
            respondedAt: null,
            parentContractSha256: null,
            addendumSha256: null,
            addendumContentMarkdown: null,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        if (!rows[0]) {
          throw new Error("DATABASE_ERROR");
        }
        savedRecord = rows[0];
      } catch {
        savedRecord = {
          id: newRecordId,
          engagementId: input.engagementId,
          requesterUserId: input.requesterUserId,
          reviewerUserId,
          sequenceNumber: nextSeq,
          title: trimmedTitle,
          description: trimmedDesc,
          reason: input.reason,
          additionalBudget: additionalBudget.toFixed(2),
          currency,
          additionalDays,
          status: "PENDING",
          rejectionReason: null,
          respondedAt: null,
          parentContractSha256: null,
          addendumSha256: null,
          addendumContentMarkdown: null,
          createdAt: now,
          updatedAt: now,
        };
        const current = inMemoryChangeRequests.get(input.engagementId) || [];
        current.push(savedRecord);
        inMemoryChangeRequests.set(input.engagementId, current);
      }
    }

    // Send notification to reviewer
    try {
      await NotificationService.createNotification(
        reviewerUserId,
        "CHANGE_REQUEST_CREATED",
        "engagement",
        input.engagementId,
        {
          title: "🛡️ Yeni Değişiklik Talebi (Scope Shield)",
          message: `${isOwner ? "İşveren" : "Uzman"} "${trimmedTitle}" başlıklı resmi bir değişiklik talebi iletti. İnceleyip onaylayabilir veya reddedebilirsiniz.`,
          actionUrl: `/tr/calisma-alani/${input.engagementId}`,
        }
      );
    } catch {
      // Non-blocking notification
    }

    return savedRecord;
  }

  /**
   * Internal helper to fetch all records for an engagement.
   */
  private static async getRecords(engagementId: string): Promise<ChangeRequestRecord[]> {
    const isMock =
      Boolean(process.env.VITEST) ||
      engagementId === "eng-demo-101" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(engagementId);

    if (isMock) {
      return [...(inMemoryChangeRequests.get(engagementId) || [])].sort(
        (a, b) => a.sequenceNumber - b.sequenceNumber
      );
    }

    try {
      const db = getDb();
      return await db
        .select()
        .from(schema.engagementChangeRequests)
        .where(eq(schema.engagementChangeRequests.engagementId, engagementId))
        .orderBy(asc(schema.engagementChangeRequests.sequenceNumber));
    } catch {
      return [...(inMemoryChangeRequests.get(engagementId) || [])].sort(
        (a, b) => a.sequenceNumber - b.sequenceNumber
      );
    }
  }

  /**
   * Retrieves all change requests and cumulative stats for an engagement.
   */
  static async getChangeRequests(
    _viewerUserId: string,
    engagementId: string
  ): Promise<ChangeRequestSummaryDto> {
    const records = await this.getRecords(engagementId);

    let totalApprovedBudget = 0;
    let totalApprovedDays = 0;
    let approvedAddendumsCount = 0;
    let currency = "TRY";
    let pendingRequest: ChangeRequestRecord | null = null;

    for (const cr of records) {
      if (cr.status === "APPROVED") {
        totalApprovedBudget += Number(cr.additionalBudget) || 0;
        totalApprovedDays += Number(cr.additionalDays) || 0;
        approvedAddendumsCount += 1;
        if (cr.currency) currency = cr.currency;
      } else if (cr.status === "PENDING") {
        pendingRequest = cr;
      }
    }

    return {
      totalApprovedBudget,
      totalApprovedDays,
      approvedAddendumsCount,
      currency,
      pendingRequest,
      changeRequests: records,
    };
  }

  /**
   * Responds to a pending change request: APPROVE (creates Addendum) or REJECT.
   */
  static async respondChangeRequest(
    input: RespondChangeRequestInput
  ): Promise<ChangeRequestRecord> {
    const isMock =
      Boolean(process.env.VITEST) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.changeRequestId);

    let record: ChangeRequestRecord | null = null;

    if (isMock) {
      for (const [_, list] of inMemoryChangeRequests) {
        const found = list.find((cr) => cr.id === input.changeRequestId);
        if (found) {
          record = found;
          break;
        }
      }
    } else {
      try {
        const db = getDb();
        const rows = await db
          .select()
          .from(schema.engagementChangeRequests)
          .where(eq(schema.engagementChangeRequests.id, input.changeRequestId))
          .limit(1);
        record = rows[0] ?? null;
      } catch {
        for (const [_, list] of inMemoryChangeRequests) {
          const found = list.find((cr) => cr.id === input.changeRequestId);
          if (found) {
            record = found;
            break;
          }
        }
      }
    }

    if (!record) {
      throw new Error("CHANGE_REQUEST_NOT_FOUND");
    }

    if (record.status !== "PENDING") {
      throw new Error("CHANGE_REQUEST_NOT_PENDING");
    }

    if (record.reviewerUserId !== input.userId) {
      if (record.requesterUserId === input.userId) {
        throw new Error("CANNOT_APPROVE_OWN_REQUEST");
      }
      throw new Error("UNAUTHORIZED_REVIEWER");
    }

    const now = new Date();

    if (input.action === "REJECT") {
      const trimmedReason = (input.rejectionReason || "").trim() || "Muhatap tarafından talep onaylanmadı.";
      record.status = "REJECTED";
      record.rejectionReason = trimmedReason;
      record.respondedAt = now;
      record.updatedAt = now;

      if (!isMock) {
        try {
          const db = getDb();
          await db
            .update(schema.engagementChangeRequests)
            .set({
              status: "REJECTED",
              rejectionReason: trimmedReason,
              respondedAt: now,
              updatedAt: now,
            })
            .where(eq(schema.engagementChangeRequests.id, record.id));
        } catch {
          // fallback
        }
      }

      // Notify requester
      try {
        await NotificationService.createNotification(
          record.requesterUserId,
          "CHANGE_REQUEST_REJECTED",
          "engagement",
          record.engagementId,
          {
            title: "Değişiklik Talebi Reddedildi",
            message: `"${record.title}" başlıklı değişiklik talebi reddedildi. Ana sözleşmeniz hiçbir cezai şart olmaksızın orijinal kapsamıyla yürürlüktedir.`,
            actionUrl: `/tr/calisma-alani/${record.engagementId}`,
          }
        );
      } catch {
        // non-blocking
      }

      return record;
    }

    // APPROVE -> Build official Addendum
    const details = await EngagementService.getEngagementDetails(input.userId, record.engagementId);
    if (!details) {
      throw new Error("ENGAGEMENT_NOT_FOUND");
    }

    const partyInfo = await this.getParties(input.userId, details);
    const engagementShort = record.engagementId.replace(/-/g, "").slice(0, 8).toUpperCase();
    const parentContractRef = `OPR-CONTR-${engagementShort}`;

    // Look for previous addendum SHA-256 for cryptographic chaining
    const allRecords = await this.getRecords(record.engagementId);
    const previousApproved = allRecords
      .filter((cr) => cr.status === "APPROVED" && cr.sequenceNumber < record!.sequenceNumber)
      .sort((a, b) => b.sequenceNumber - a.sequenceNumber);

    const parentContractSha256 =
      previousApproved[0]?.addendumSha256 ||
      ContractGeneratorService.calculateSha256(
        `OPERIS-MASTER-CONTRACT|${parentContractRef}|${details.engagement.id}|${details.engagement.matchedAt}`
      );

    const addendumInput: AddendumGeneratorInput = {
      engagementId: record.engagementId,
      sequenceNumber: record.sequenceNumber,
      parentContractRef,
      parentContractSha256,
      listingTitle: partyInfo.listingTitle,
      client: partyInfo.client,
      contractor: partyInfo.contractor,
      title: record.title,
      description: record.description,
      reason: record.reason as ChangeRequestReason,
      additionalBudget: Number(record.additionalBudget) || 0,
      currency: record.currency,
      additionalDays: record.additionalDays,
      matchedAt: details.engagement.matchedAt,
      locale: input.locale || "tr",
    };

    const generatedAddendum = AddendumGeneratorService.generateAddendum(addendumInput);

    record.status = "APPROVED";
    record.respondedAt = now;
    record.parentContractSha256 = parentContractSha256;
    record.addendumSha256 = generatedAddendum.addendumSha256;
    record.addendumContentMarkdown = generatedAddendum.markdown;
    record.updatedAt = now;

    if (!isMock) {
      try {
        const db = getDb();
        await db
          .update(schema.engagementChangeRequests)
          .set({
            status: "APPROVED",
            respondedAt: now,
            parentContractSha256,
            addendumSha256: generatedAddendum.addendumSha256,
            addendumContentMarkdown: generatedAddendum.markdown,
            updatedAt: now,
          })
          .where(eq(schema.engagementChangeRequests.id, record.id));
      } catch {
        // fallback
      }
    }

    // Notify requester
    try {
      await NotificationService.createNotification(
        record.requesterUserId,
        "CHANGE_REQUEST_APPROVED",
        "engagement",
        record.engagementId,
        {
          title: "🎉 Değişiklik Talebi Onaylandı (Zeyilname Tanzim Edildi)",
          message: `"${record.title}" başlıklı talebiniz onaylandı. TBK m. 470/480 uyumlu Sözleşme Zeyilnamesi (Ek Protokol) otomatik üretildi.`,
          actionUrl: `/tr/calisma-alani/${record.engagementId}`,
        }
      );
    } catch {
      // non-blocking
    }

    return record;
  }

  /**
   * Allows the requester to cancel their own pending change request.
   */
  static async cancelChangeRequest(
    userId: string,
    changeRequestId: string
  ): Promise<ChangeRequestRecord> {
    const isMock =
      Boolean(process.env.VITEST) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(changeRequestId);

    let record: ChangeRequestRecord | null = null;

    if (isMock) {
      for (const [_, list] of inMemoryChangeRequests) {
        const found = list.find((cr) => cr.id === changeRequestId);
        if (found) {
          record = found;
          break;
        }
      }
    } else {
      try {
        const db = getDb();
        const rows = await db
          .select()
          .from(schema.engagementChangeRequests)
          .where(eq(schema.engagementChangeRequests.id, changeRequestId))
          .limit(1);
        record = rows[0] ?? null;
      } catch {
        for (const [_, list] of inMemoryChangeRequests) {
          const found = list.find((cr) => cr.id === changeRequestId);
          if (found) {
            record = found;
            break;
          }
        }
      }
    }

    if (!record) {
      throw new Error("CHANGE_REQUEST_NOT_FOUND");
    }

    if (record.requesterUserId !== userId) {
      throw new Error("UNAUTHORIZED_USER");
    }

    if (record.status !== "PENDING") {
      throw new Error("CHANGE_REQUEST_NOT_PENDING");
    }

    const now = new Date();
    record.status = "CANCELLED";
    record.updatedAt = now;

    if (!isMock) {
      try {
        const db = getDb();
        await db
          .update(schema.engagementChangeRequests)
          .set({
            status: "CANCELLED",
            updatedAt: now,
          })
          .where(eq(schema.engagementChangeRequests.id, record.id));
      } catch {
        // fallback
      }
    }

    return record;
  }
}
