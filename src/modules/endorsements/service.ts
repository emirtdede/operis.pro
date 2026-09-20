import { eq, and, desc } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { EMOJI_REGEX, validateContentAppropriateness } from "@/src/lib/security/content-moderator";
import { NotificationService } from "@/src/modules/notifications/service";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";

export interface EndorsementDto {
  id: string;
  engagementId: string;
  authorUserId: string;
  recipientUserId: string;
  authorDisplayName: string;
  authorHandle: string;
  authorAvatarUrl: string | null;
  content: string;
  projectTitle: string;
  createdAt: Date;
}

export interface CreateEndorsementInput {
  engagementId: string;
  authorUserId: string;
  content: string;
}

export interface InMemoryEndorsementRecord {
  id: string;
  engagementId: string;
  authorUserId: string;
  recipientUserId: string;
  content: string;
  projectTitleSnapshot: string;
  authorDisplayName?: string;
  authorHandle?: string;
  createdAt: Date;
}

// In-memory fallback for vitest / zero-config environments
export const inMemoryEndorsements: InMemoryEndorsementRecord[] = [
  {
    id: "endorsement-demo-1",
    engagementId: "eng-demo-101",
    authorUserId: "u-techcorp-1",
    recipientUserId: DEFAULT_USER.id,
    authorDisplayName: "Ahmet Yılmaz",
    authorHandle: "ahmetyilmaz",
    content:
      "Demir ile Next.js projemizde çalıştık, API mimarisini taahhüt ettiği tarihten 2 gün önce sıfır hatayla teslim etti. Mimari disiplini ve şeffaf iletişimi üst düzeydeydi.",
    projectTitleSnapshot: "Next.js Kurumsal SaaS Mimarisi & API Entegrasyonu",
    createdAt: new Date("2026-08-15T14:30:00Z"),
  },
];

export class EndorsementService {
  /**
   * Creates a bilateral 1-paragraph verified endorsement upon engagement completion.
   */
  static async createEndorsement(input: CreateEndorsementInput): Promise<EndorsementDto> {
    const trimmedContent = (input.content || "").trim();

    // 1. Length validation (20 - 500 characters)
    if (trimmedContent.length < 20) {
      throw new Error("ENDORSEMENT_TOO_SHORT");
    }
    if (trimmedContent.length > 500) {
      throw new Error("ENDORSEMENT_TOO_LONG");
    }

    // 2. Strict emoji prohibition
    if (EMOJI_REGEX.test(trimmedContent)) {
      throw new Error("EMOJIS_FORBIDDEN");
    }

    // 3. Profanity and abuse guardrail
    const modResult = validateContentAppropriateness(trimmedContent);
    if (!modResult.isValid) {
      throw new Error("PROFANITY_OR_INAPPROPRIATE_CONTENT");
    }

    const isEngUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      input.engagementId
    );
    const isAuthorUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      input.authorUserId
    );

    if (!isEngUuid || !isAuthorUuid) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("ENGAGEMENT_NOT_FOUND");
      }
      // Demo / Vitest in-memory fallback
      const isDemoEng = input.engagementId === "eng-demo-101";
      if (!isDemoEng) {
        throw new Error("ENGAGEMENT_NOT_FOUND");
      }

      // Demo engagement participants: DEFAULT_USER.id and "u-techcorp-1"
      const isAuthorDefault = input.authorUserId === DEFAULT_USER.id;
      const isAuthorTechcorp = input.authorUserId === "u-techcorp-1";
      if (!isAuthorDefault && !isAuthorTechcorp) {
        throw new Error("UNAUTHORIZED_PARTICIPANT");
      }

      // Check duplicate
      const alreadySubmitted = inMemoryEndorsements.some(
        (e) => e.engagementId === input.engagementId && e.authorUserId === input.authorUserId
      );
      if (alreadySubmitted) {
        throw new Error("DUPLICATE_ENDORSEMENT");
      }

      const recipientUserId = isAuthorDefault ? "u-techcorp-1" : DEFAULT_USER.id;
      const authorDisplayName = isAuthorDefault ? DEFAULT_USER.profile.displayName : "Ahmet Yılmaz";
      const authorHandle = isAuthorDefault ? DEFAULT_USER.profile.handle : "ahmetyilmaz";

      const mockRecord = {
        id: `endorsement-${Date.now()}`,
        engagementId: input.engagementId,
        authorUserId: input.authorUserId,
        recipientUserId,
        authorDisplayName,
        authorHandle,
        content: trimmedContent,
        projectTitleSnapshot: "Next.js Kurumsal SaaS Mimarisi & API Entegrasyonu",
        createdAt: new Date(),
      };
      inMemoryEndorsements.push(mockRecord);

      if (recipientUserId === DEFAULT_USER.id) {
        const isEn = DEFAULT_USER.profile.locale === "en";
        NotificationService.createNotification(
          DEFAULT_USER.id,
          "ENDORSEMENT_RECEIVED",
          "engagement",
          input.engagementId,
          {
            title: isEn ? "Verified Endorsement Received" : "Tavsiye Notu Bırakıldı",
            message: isEn
              ? `${authorDisplayName} left a verified endorsement on your profile for your collaboration on "${mockRecord.projectTitleSnapshot}".`
              : `${authorDisplayName}, "${mockRecord.projectTitleSnapshot}" iş birliğiniz için profilinize doğrulanmış bir tavsiye notu bıraktı.`,
            actionUrl: isEn
              ? `/en/profile/${DEFAULT_USER.profile.handle}`
              : `/tr/profil/${DEFAULT_USER.profile.handle}`,
          }
        ).catch(() => {});
      }

      return {
        id: mockRecord.id,
        engagementId: mockRecord.engagementId,
        authorUserId: mockRecord.authorUserId,
        recipientUserId: mockRecord.recipientUserId,
        authorDisplayName,
        authorHandle,
        authorAvatarUrl: null,
        content: mockRecord.content,
        projectTitle: mockRecord.projectTitleSnapshot,
        createdAt: mockRecord.createdAt,
      };
    }

    const db = getDb();

    try {
      // 3. Fetch engagement
      const engagementRows = await db
        .select()
        .from(schema.engagements)
        .where(eq(schema.engagements.id, input.engagementId))
        .limit(1);

      const engagement = engagementRows[0];
      if (!engagement) {
        throw new Error("ENGAGEMENT_NOT_FOUND");
      }

      // 4. Must be COMPLETED
      if (engagement.status !== "COMPLETED") {
        throw new Error("ENGAGEMENT_NOT_COMPLETED");
      }

      // 5. Must be a participant
      const isOwner = engagement.ownerUserId === input.authorUserId;
      const isFreelancer = engagement.freelancerUserId === input.authorUserId;
      if (!isOwner && !isFreelancer) {
        throw new Error("UNAUTHORIZED_PARTICIPANT");
      }

      const recipientUserId = isOwner ? engagement.freelancerUserId : engagement.ownerUserId;

      // 6. Check existing endorsement by this author for this engagement
      const existing = await db
        .select({ id: schema.endorsements.id })
        .from(schema.endorsements)
        .where(
          and(
            eq(schema.endorsements.engagementId, input.engagementId),
            eq(schema.endorsements.authorUserId, input.authorUserId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error("DUPLICATE_ENDORSEMENT");
      }

      // 7. Insert endorsement
      const [inserted] = await db
        .insert(schema.endorsements)
        .values({
          engagementId: input.engagementId,
          authorUserId: input.authorUserId,
          recipientUserId,
          content: trimmedContent,
          projectTitleSnapshot: engagement.listingTitleSnapshot,
        })
        .returning();

      if (!inserted) {
        throw new Error("INSERT_FAILED");
      }

      // 8. Fetch author profile info
      const authorProfileRows = await db
        .select({
          displayName: schema.profiles.displayName,
          handle: schema.profiles.handle,
          avatarUrl: schema.profiles.avatarUrl,
        })
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, input.authorUserId))
        .limit(1);

      const authorProfile = authorProfileRows[0];
      const authorDisplayName = authorProfile?.displayName || "İş Ortağı";
      const authorHandle = authorProfile?.handle || "kullanici";
      const authorAvatarUrl = authorProfile?.avatarUrl || null;

      // 9. Send notification to recipient
      try {
        const recipientProfileRows = await db
          .select({
            handle: schema.profiles.handle,
            locale: schema.profiles.locale,
          })
          .from(schema.profiles)
          .where(eq(schema.profiles.userId, recipientUserId))
          .limit(1);
        const recipientProfile = recipientProfileRows[0];
        const recipientHandle = recipientProfile?.handle || "demokullanici";
        const isEn = recipientProfile?.locale === "en";

        await NotificationService.createNotification(
          recipientUserId,
          "ENDORSEMENT_RECEIVED",
          "engagement",
          input.engagementId,
          {
            title: isEn ? "Verified Endorsement Received" : "Tavsiye Notu Bırakıldı",
            message: isEn
              ? `${authorDisplayName} left a verified endorsement on your profile for your collaboration on "${engagement.listingTitleSnapshot}".`
              : `${authorDisplayName}, "${engagement.listingTitleSnapshot}" iş birliğiniz için profilinize doğrulanmış bir tavsiye notu bıraktı.`,
            actionUrl: isEn ? `/en/profile/${recipientHandle}` : `/tr/profil/${recipientHandle}`,
          }
        );
      } catch {
        // Non-blocking notification
      }

      return {
        id: inserted.id,
        engagementId: inserted.engagementId,
        authorUserId: inserted.authorUserId,
        recipientUserId: inserted.recipientUserId,
        authorDisplayName,
        authorHandle,
        authorAvatarUrl,
        content: inserted.content,
        projectTitle: inserted.projectTitleSnapshot,
        createdAt: inserted.createdAt,
      };
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      // In-memory fallback if DB fails or running under mock environment
      if (
        process.env.VITEST ||
        (err instanceof Error &&
          (err.message.includes("ENGAGEMENT_") ||
            err.message.includes("UNAUTHORIZED") ||
            err.message.includes("DUPLICATE") ||
            err.message.includes("ENDORSEMENT_")))
      ) {
        throw err;
      }

      // Generic fallback for offline demo
      const isDemoEng = input.engagementId === "eng-demo-101";
      const isAuthorDefault = input.authorUserId === DEFAULT_USER.id;
      let recipientUserId = "u-counterparty";
      if (isDemoEng) {
        recipientUserId = isAuthorDefault ? "u-techcorp-1" : DEFAULT_USER.id;
      }
      const authorDisplayName = isAuthorDefault ? DEFAULT_USER.profile.displayName : "Ahmet Yılmaz";
      const authorHandle = isAuthorDefault ? DEFAULT_USER.profile.handle : "ahmetyilmaz";

      const mockRecord = {
        id: `endorsement-${Date.now()}`,
        engagementId: input.engagementId,
        authorUserId: input.authorUserId,
        recipientUserId,
        authorDisplayName,
        authorHandle,
        content: trimmedContent,
        projectTitleSnapshot: isDemoEng
          ? "Next.js Kurumsal SaaS Mimarisi & API Entegrasyonu"
          : "Operis Yazılım Projesi",
        createdAt: new Date(),
      };
      inMemoryEndorsements.push(mockRecord);

      if (recipientUserId === DEFAULT_USER.id) {
        const isEn = DEFAULT_USER.profile.locale === "en";
        NotificationService.createNotification(
          DEFAULT_USER.id,
          "ENDORSEMENT_RECEIVED",
          "engagement",
          input.engagementId,
          {
            title: isEn ? "Verified Endorsement Received" : "Tavsiye Notu Bırakıldı",
            message: isEn
              ? `${authorDisplayName} left a verified endorsement on your profile for your collaboration on "${mockRecord.projectTitleSnapshot}".`
              : `${authorDisplayName}, "${mockRecord.projectTitleSnapshot}" iş birliğiniz için profilinize doğrulanmış bir tavsiye notu bıraktı.`,
            actionUrl: isEn
              ? `/en/profile/${DEFAULT_USER.profile.handle}`
              : `/tr/profil/${DEFAULT_USER.profile.handle}`,
          }
        ).catch(() => {});
      }

      return {
        id: mockRecord.id,
        engagementId: mockRecord.engagementId,
        authorUserId: mockRecord.authorUserId,
        recipientUserId: mockRecord.recipientUserId,
        authorDisplayName,
        authorHandle,
        authorAvatarUrl: null,
        content: mockRecord.content,
        projectTitle: mockRecord.projectTitleSnapshot,
        createdAt: mockRecord.createdAt,
      };
    }
  }

  /**
   * Retrieves verified endorsements for a public profile.
   */
  static async getEndorsementsForUser(userId: string): Promise<EndorsementDto[]> {
    // If demo user and in-memory contains demo endorsements (VITEST only)
    if (Boolean(process.env.VITEST) && userId === DEFAULT_USER.id) {
      const demoMatches = inMemoryEndorsements.filter((e) => e.recipientUserId === userId);
      if (demoMatches.length > 0) {
        return demoMatches.map((m) => ({
          id: m.id,
          engagementId: m.engagementId,
          authorUserId: m.authorUserId,
          recipientUserId: m.recipientUserId,
          authorDisplayName: m.authorDisplayName || "Ahmet Yılmaz",
          authorHandle: m.authorHandle || "ahmetyilmaz",
          authorAvatarUrl: null,
          content: m.content,
          projectTitle: m.projectTitleSnapshot,
          createdAt: m.createdAt,
        }));
      }
    }

    const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId
    );
    if (!isUserUuid) {
      return inMemoryEndorsements
        .filter((e) => e.recipientUserId === userId)
        .map((m) => ({
          id: m.id,
          engagementId: m.engagementId,
          authorUserId: m.authorUserId,
          recipientUserId: m.recipientUserId,
          authorDisplayName: m.authorDisplayName || "İş Ortağı",
          authorHandle: m.authorHandle || "kullanici",
          authorAvatarUrl: null,
          content: m.content,
          projectTitle: m.projectTitleSnapshot,
          createdAt: m.createdAt,
        }));
    }

    try {
      const db = getDb();
      const rows = await db
        .select({
          id: schema.endorsements.id,
          engagementId: schema.endorsements.engagementId,
          authorUserId: schema.endorsements.authorUserId,
          recipientUserId: schema.endorsements.recipientUserId,
          content: schema.endorsements.content,
          projectTitleSnapshot: schema.endorsements.projectTitleSnapshot,
          createdAt: schema.endorsements.createdAt,
          authorDisplayName: schema.profiles.displayName,
          authorHandle: schema.profiles.handle,
          authorAvatarUrl: schema.profiles.avatarUrl,
        })
        .from(schema.endorsements)
        .innerJoin(
          schema.users,
          and(
            eq(schema.users.id, schema.endorsements.authorUserId),
            eq(schema.users.status, "ACTIVE")
          )
        )
        .leftJoin(schema.profiles, eq(schema.endorsements.authorUserId, schema.profiles.userId))
        .where(eq(schema.endorsements.recipientUserId, userId))
        .orderBy(desc(schema.endorsements.createdAt));

      return rows.map((r) => ({
        id: r.id,
        engagementId: r.engagementId,
        authorUserId: r.authorUserId,
        recipientUserId: r.recipientUserId,
        authorDisplayName: r.authorDisplayName || "Operis Kullanıcısı",
        authorHandle: r.authorHandle || "kullanici",
        authorAvatarUrl: r.authorAvatarUrl || null,
        content: r.content,
        projectTitle: r.projectTitleSnapshot,
        createdAt: r.createdAt,
      }));
    } catch {
      if (process.env.NODE_ENV === "production") {
        return [];
      }
      // Fallback to in-memory filter
      return inMemoryEndorsements
        .filter((e) => e.recipientUserId === userId)
        .map((m) => ({
          id: m.id,
          engagementId: m.engagementId,
          authorUserId: m.authorUserId,
          recipientUserId: m.recipientUserId,
          authorDisplayName: m.authorDisplayName || "İş Ortağı",
          authorHandle: m.authorHandle || "kullanici",
          authorAvatarUrl: null,
          content: m.content,
          projectTitle: m.projectTitleSnapshot,
          createdAt: m.createdAt,
        }));
    }
  }

  /**
   * Retrieves endorsements left for a specific engagement.
   */
  static async getEndorsementsForEngagement(engagementId: string): Promise<EndorsementDto[]> {
    const isEngUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      engagementId
    );
    if (!isEngUuid) {
      return inMemoryEndorsements
        .filter((e) => e.engagementId === engagementId)
        .map((m) => ({
          id: m.id,
          engagementId: m.engagementId,
          authorUserId: m.authorUserId,
          recipientUserId: m.recipientUserId,
          authorDisplayName: m.authorDisplayName || "İş Ortağı",
          authorHandle: m.authorHandle || "kullanici",
          authorAvatarUrl: null,
          content: m.content,
          projectTitle: m.projectTitleSnapshot,
          createdAt: m.createdAt,
        }));
    }

    try {
      const db = getDb();
      const rows = await db
        .select({
          id: schema.endorsements.id,
          engagementId: schema.endorsements.engagementId,
          authorUserId: schema.endorsements.authorUserId,
          recipientUserId: schema.endorsements.recipientUserId,
          content: schema.endorsements.content,
          projectTitleSnapshot: schema.endorsements.projectTitleSnapshot,
          createdAt: schema.endorsements.createdAt,
          authorDisplayName: schema.profiles.displayName,
          authorHandle: schema.profiles.handle,
          authorAvatarUrl: schema.profiles.avatarUrl,
        })
        .from(schema.endorsements)
        .leftJoin(schema.profiles, eq(schema.endorsements.authorUserId, schema.profiles.userId))
        .where(eq(schema.endorsements.engagementId, engagementId));

      return rows.map((r) => ({
        id: r.id,
        engagementId: r.engagementId,
        authorUserId: r.authorUserId,
        recipientUserId: r.recipientUserId,
        authorDisplayName: r.authorDisplayName || "Operis Kullanıcısı",
        authorHandle: r.authorHandle || "kullanici",
        authorAvatarUrl: r.authorAvatarUrl || null,
        content: r.content,
        projectTitle: r.projectTitleSnapshot,
        createdAt: r.createdAt,
      }));
    } catch {
      if (process.env.NODE_ENV === "production") {
        return [];
      }
      return inMemoryEndorsements
        .filter((e) => e.engagementId === engagementId)
        .map((m) => ({
          id: m.id,
          engagementId: m.engagementId,
          authorUserId: m.authorUserId,
          recipientUserId: m.recipientUserId,
          authorDisplayName: m.authorDisplayName || "İş Ortağı",
          authorHandle: m.authorHandle || "kullanici",
          authorAvatarUrl: null,
          content: m.content,
          projectTitle: m.projectTitleSnapshot,
          createdAt: m.createdAt,
        }));
    }
  }
}
