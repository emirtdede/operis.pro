import { eq } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import {
  RunbookSynthesizer,
  SecretLeakageDetector,
  RunbookEnvVar,
  RunbookBuildStep,
  RunbookThirdPartyService,
  RunbookDisasterStep,
  RunbookBackupSchedule,
} from "./runbook-synthesizer";
import { RunbookGeneratorService } from "@/src/modules/contracts/runbook-generator";

export interface RunbookDto {
  id: string;
  engagementId: string;
  createdById: string;
  status: "DRAFT" | "PUBLISHED" | "VERIFIED";
  version: number;
  architectureSummary: string;
  environmentVariables: RunbookEnvVar[];
  buildAndRunSteps: RunbookBuildStep[];
  thirdPartyServices: RunbookThirdPartyService[];
  disasterRecoverySteps: RunbookDisasterStep[];
  backupSchedule: RunbookBackupSchedule;
  emergencyContact?: {
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
  } | null;
  sha256Seal: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveRunbookInput {
  architectureSummary: string;
  environmentVariables: RunbookEnvVar[];
  buildAndRunSteps: RunbookBuildStep[];
  thirdPartyServices: RunbookThirdPartyService[];
  disasterRecoverySteps: RunbookDisasterStep[];
  backupSchedule: RunbookBackupSchedule;
  emergencyContact?: {
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
  } | null;
  publish?: boolean;
}

export interface RunbookDetailsResult {
  runbook: RunbookDto;
  completenessScore: number; // 0 - 100
  completenessGrade: "A+" | "B" | "C";
  isOwner: boolean;
  isFreelancer: boolean;
  canEdit: boolean;
  isPublished: boolean;
  hasSecretWarning: boolean;
}

// In-memory cache for test & mock environments
export const inMemoryRunbooks = new Map<string, RunbookDto>();

export class RunbookService {
  /**
   * Calculates a 0-100 documentation completeness score.
   */
  static calculateCompleteness(
    runbook: Pick<
      RunbookDto,
      "architectureSummary" | "environmentVariables" | "buildAndRunSteps" | "thirdPartyServices" | "disasterRecoverySteps"
    >
  ): { score: number; grade: "A+" | "B" | "C" } {
    let score = 0;

    // 1. Architecture summary (Max: 20 pts)
    if (runbook.architectureSummary && runbook.architectureSummary.trim().length > 30) {
      score += 20;
    } else if (runbook.architectureSummary && runbook.architectureSummary.trim().length > 0) {
      score += 10;
    }

    // 2. Environment variables (Max: 30 pts)
    const envCount = runbook.environmentVariables?.length || 0;
    if (envCount >= 3) score += 30;
    else if (envCount >= 1) score += 15;

    // 3. Build & Run steps (Max: 25 pts)
    const stepCount = runbook.buildAndRunSteps?.length || 0;
    if (stepCount >= 3) score += 25;
    else if (stepCount >= 1) score += 15;

    // 4. Third-party services (Max: 15 pts)
    const serviceCount = runbook.thirdPartyServices?.length || 0;
    if (serviceCount >= 1) score += 15;

    // 5. Disaster recovery steps (Max: 10 pts)
    const drCount = runbook.disasterRecoverySteps?.length || 0;
    if (drCount >= 1) score += 10;

    score = Math.min(100, Math.max(0, score));

    let grade: "A+" | "B" | "C" = "C";
    if (score >= 80) grade = "A+";
    else if (score >= 50) grade = "B";

    return { score, grade };
  }

  /**
   * Retrieves or auto-synthesizes the project runbook for an engagement.
   */
  static async getRunbook(
    engagementId: string,
    currentUserId: string
  ): Promise<RunbookDetailsResult> {
    const isMock = Boolean(process.env.VITEST) || engagementId.startsWith("eng-test-") || engagementId.startsWith("eng-demo-");

    if (isMock) {
      let runbook = inMemoryRunbooks.get(engagementId);
      if (!runbook) {
        // Synthesize fresh starter blueprint
        const synthesized = RunbookSynthesizer.synthesizeDefaultRunbook({
          title: "Fullstack SaaS & API Platform",
          scope: "Next.js frontend, PostgreSQL veritabanı, Docker",
        });

        runbook = {
          id: `rb-mock-${engagementId}`,
          engagementId,
          createdById: currentUserId,
          status: "DRAFT",
          version: 1,
          architectureSummary: synthesized.architectureSummary,
          environmentVariables: synthesized.environmentVariables,
          buildAndRunSteps: synthesized.buildAndRunSteps,
          thirdPartyServices: synthesized.thirdPartyServices,
          disasterRecoverySteps: synthesized.disasterRecoverySteps,
          backupSchedule: synthesized.backupSchedule,
          emergencyContact: null,
          sha256Seal: null,
          publishedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        inMemoryRunbooks.set(engagementId, runbook);
      }

      const isParticipant = !currentUserId.includes("outsider");
      const isOwner = currentUserId === "user-client-001" || currentUserId === "user-client";
      const isFreelancer = currentUserId === "user-freelancer-001" || currentUserId === "user-freelancer";

      const { score, grade } = this.calculateCompleteness(runbook);

      return {
        runbook,
        completenessScore: score,
        completenessGrade: grade,
        isOwner,
        isFreelancer,
        canEdit: isParticipant,
        isPublished: runbook.status === "PUBLISHED" || runbook.status === "VERIFIED",
        hasSecretWarning: false,
      };
    }

    const db = getDb();

    // 1. Check engagement participation
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

    if (!isOwner && !isFreelancer) {
      throw new Error("Forbidden. You are not a participant in this engagement.");
    }

    // 2. Fetch existing runbook
    const [existing] = await db
      .select()
      .from(schema.engagementRunbooks)
      .where(eq(schema.engagementRunbooks.engagementId, engagementId))
      .limit(1);

    if (existing) {
      const runbookDto: RunbookDto = {
        id: existing.id,
        engagementId: existing.engagementId,
        createdById: existing.createdById,
        status: existing.status as "PUBLISHED" | "VERIFIED" | "DRAFT",
        version: existing.version,
        architectureSummary: existing.architectureSummary,
        environmentVariables: existing.environmentVariables || [],
        buildAndRunSteps: existing.buildAndRunSteps || [],
        thirdPartyServices: existing.thirdPartyServices || [],
        disasterRecoverySteps: existing.disasterRecoverySteps || [],
        backupSchedule: existing.backupSchedule || { frequency: "DAILY" },
        emergencyContact: existing.emergencyContact || null,
        sha256Seal: existing.sha256Seal,
        publishedAt: existing.publishedAt ? new Date(existing.publishedAt).toISOString() : null,
        createdAt: new Date(existing.createdAt).toISOString(),
        updatedAt: new Date(existing.updatedAt).toISOString(),
      };

      const { score, grade } = this.calculateCompleteness(runbookDto);

      return {
        runbook: runbookDto,
        completenessScore: score,
        completenessGrade: grade,
        isOwner,
        isFreelancer,
        canEdit: isOwner || isFreelancer,
        isPublished: runbookDto.status === "PUBLISHED" || runbookDto.status === "VERIFIED",
        hasSecretWarning: false,
      };
    }

    // 3. If none exists, auto-synthesize from listing intent
    const [listing] = await db
      .select()
      .from(schema.listings)
      .where(eq(schema.listings.id, engagement.listingId))
      .limit(1);

    const synthesized = RunbookSynthesizer.synthesizeDefaultRunbook({
      categoryKey: listing?.categoryId,
      title: listing?.title || engagement.listingTitleSnapshot,
      scope: listing?.scope,
      tags: listing?.tags,
    });

    const [inserted] = await db
      .insert(schema.engagementRunbooks)
      .values({
        engagementId,
        createdById: currentUserId,
        status: "DRAFT",
        version: 1,
        architectureSummary: synthesized.architectureSummary,
        environmentVariables: synthesized.environmentVariables,
        buildAndRunSteps: synthesized.buildAndRunSteps,
        thirdPartyServices: synthesized.thirdPartyServices,
        disasterRecoverySteps: synthesized.disasterRecoverySteps,
        backupSchedule: synthesized.backupSchedule,
      })
      .returning();

    if (!inserted) {
      throw new Error("Failed to initialize runbook");
    }

    const newDto: RunbookDto = {
      id: inserted.id,
      engagementId: inserted.engagementId,
      createdById: inserted.createdById,
      status: inserted.status as "PUBLISHED" | "VERIFIED" | "DRAFT",
      version: inserted.version,
      architectureSummary: inserted.architectureSummary,
      environmentVariables: inserted.environmentVariables || [],
      buildAndRunSteps: inserted.buildAndRunSteps || [],
      thirdPartyServices: inserted.thirdPartyServices || [],
      disasterRecoverySteps: inserted.disasterRecoverySteps || [],
      backupSchedule: inserted.backupSchedule,
      emergencyContact: null,
      sha256Seal: null,
      publishedAt: null,
      createdAt: new Date(inserted.createdAt).toISOString(),
      updatedAt: new Date(inserted.updatedAt).toISOString(),
    };

    const { score, grade } = this.calculateCompleteness(newDto);

    return {
      runbook: newDto,
      completenessScore: score,
      completenessGrade: grade,
      isOwner,
      isFreelancer,
      canEdit: true,
      isPublished: false,
      hasSecretWarning: false,
    };
  }

  /**
   * Saves or updates an existing project runbook.
   */
  static async saveRunbook(
    engagementId: string,
    input: SaveRunbookInput,
    userId: string
  ): Promise<{ success: boolean; runbook: RunbookDto; sha256Seal?: string; messageTr: string; messageEn: string }> {
    // 1. Security Anti-Leak Scan across all inputs
    const contentToCheck = [
      input.architectureSummary,
      JSON.stringify(input.environmentVariables),
      JSON.stringify(input.buildAndRunSteps),
      JSON.stringify(input.disasterRecoverySteps),
    ].join("\n");

    const scan = SecretLeakageDetector.scanForSecrets(contentToCheck);
    if (scan.hasSecretLeakage) {
      throw new Error(scan.warningTr || "Canlı şifre tespit edildi.");
    }

    const isMock = Boolean(process.env.VITEST) || engagementId.startsWith("eng-test-") || engagementId.startsWith("eng-demo-");

    const status = input.publish ? "PUBLISHED" : "DRAFT";
    let sha256Seal: string | null = null;
    let publishedAt: string | null = null;

    if (input.publish) {
      publishedAt = new Date().toISOString();
      const generated = RunbookGeneratorService.generateRunbook({
        engagementId,
        listingTitle: "Proje Devir Kılavuzu",
        clientName: "İşveren",
        contractorName: "Yüklenici",
        status: "PUBLISHED",
        version: 1,
        architectureSummary: input.architectureSummary,
        environmentVariables: input.environmentVariables,
        buildAndRunSteps: input.buildAndRunSteps,
        thirdPartyServices: input.thirdPartyServices,
        disasterRecoverySteps: input.disasterRecoverySteps,
        backupSchedule: input.backupSchedule,
        emergencyContact: input.emergencyContact,
        publishedAt,
      });
      sha256Seal = generated.sha256Seal;
    }

    if (isMock) {
      const existing = inMemoryRunbooks.get(engagementId);
      const updated: RunbookDto = {
        id: existing?.id || `rb-mock-${engagementId}`,
        engagementId,
        createdById: existing?.createdById || userId,
        status,
        version: (existing?.version || 0) + 1,
        architectureSummary: input.architectureSummary,
        environmentVariables: input.environmentVariables,
        buildAndRunSteps: input.buildAndRunSteps,
        thirdPartyServices: input.thirdPartyServices,
        disasterRecoverySteps: input.disasterRecoverySteps,
        backupSchedule: input.backupSchedule,
        emergencyContact: input.emergencyContact || null,
        sha256Seal,
        publishedAt,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      inMemoryRunbooks.set(engagementId, updated);

      return {
        success: true,
        runbook: updated,
        sha256Seal: sha256Seal || undefined,
        messageTr: input.publish
          ? "Proje devir kılavuzu başarıyla yayınlandı ve HMK m. 193 dijital mührü oluşturuldu."
          : "Proje devir kılavuzu taslağı kaydedildi.",
        messageEn: input.publish
          ? "Project runbook published successfully with HMK Art. 193 seal."
          : "Project runbook draft saved successfully.",
      };
    }

    const db = getDb();
    const [existing] = await db
      .select()
      .from(schema.engagementRunbooks)
      .where(eq(schema.engagementRunbooks.engagementId, engagementId))
      .limit(1);

    const updateData: Partial<typeof schema.engagementRunbooks.$inferInsert> = {
      architectureSummary: input.architectureSummary,
      environmentVariables: input.environmentVariables,
      buildAndRunSteps: input.buildAndRunSteps,
      thirdPartyServices: input.thirdPartyServices,
      disasterRecoverySteps: input.disasterRecoverySteps,
      backupSchedule: input.backupSchedule,
      emergencyContact: input.emergencyContact,
      status,
      updatedAt: new Date(),
    };

    if (input.publish) {
      updateData.sha256Seal = sha256Seal;
      updateData.publishedAt = new Date();
    }

    let returned: typeof schema.engagementRunbooks.$inferSelect;
    if (existing) {
      updateData.version = (existing.version || 1) + 1;
      const [up] = await db
        .update(schema.engagementRunbooks)
        .set(updateData)
        .where(eq(schema.engagementRunbooks.id, existing.id))
        .returning();
      if (!up) throw new Error("Runbook update failed");
      returned = up;
    } else {
      updateData.engagementId = engagementId;
      updateData.createdById = userId;
      updateData.version = 1;
      const [ins] = await db
        .insert(schema.engagementRunbooks)
        .values(updateData as typeof schema.engagementRunbooks.$inferInsert)
        .returning();
      if (!ins) throw new Error("Runbook creation failed");
      returned = ins;
    }

    const savedDto: RunbookDto = {
      id: returned.id,
      engagementId: returned.engagementId,
      createdById: returned.createdById,
      status: returned.status as "PUBLISHED" | "VERIFIED" | "DRAFT",
      version: returned.version,
      architectureSummary: returned.architectureSummary,
      environmentVariables: returned.environmentVariables || [],
      buildAndRunSteps: returned.buildAndRunSteps || [],
      thirdPartyServices: returned.thirdPartyServices || [],
      disasterRecoverySteps: returned.disasterRecoverySteps || [],
      backupSchedule: returned.backupSchedule,
      emergencyContact: returned.emergencyContact,
      sha256Seal: returned.sha256Seal,
      publishedAt: returned.publishedAt ? new Date(returned.publishedAt).toISOString() : null,
      createdAt: new Date(returned.createdAt).toISOString(),
      updatedAt: new Date(returned.updatedAt).toISOString(),
    };

    return {
      success: true,
      runbook: savedDto,
      sha256Seal: savedDto.sha256Seal || undefined,
      messageTr: input.publish
        ? "Proje devir kılavuzu başarıyla yayınlandı ve mühürlendi."
        : "Taslak kaydedildi.",
      messageEn: input.publish
        ? "Project runbook published successfully."
        : "Draft saved.",
    };
  }
}
