import { describe, it, expect, beforeEach } from "vitest";
import {
  SecretLeakageDetector,
  parseEnvExampleText,
  RunbookSynthesizer,
} from "@/src/modules/engagements/runbook-synthesizer";
import {
  RunbookService,
  inMemoryRunbooks,
} from "@/src/modules/engagements/runbook-service";
import { RunbookGeneratorService } from "@/src/modules/contracts/runbook-generator";

describe("SecretLeakageDetector", () => {
  it("detects live AWS access keys and blocks them", () => {
    const leakedText = `AWS_ACCESS_KEY_ID=${["AKIA", "IOSFODNN7EXAMPLE"].join("")}`;
    const result = SecretLeakageDetector.scanForSecrets(leakedText);
    expect(result.hasSecretLeakage).toBe(true);
    expect(result.leakedCategory).toContain("AWS Access Key");
  });

  it("detects live Stripe secret keys and blocks them", () => {
    const leakedText = `STRIPE_SECRET_KEY=${["sk", "live", "51AbcDefGhIjKlMnOpQrStUvWxYz12345"].join("_")}`;
    const result = SecretLeakageDetector.scanForSecrets(leakedText);
    expect(result.hasSecretLeakage).toBe(true);
    expect(result.leakedCategory).toContain("Stripe Live Secret Key");
  });

  it("detects GitHub personal access tokens", () => {
    const leakedText = `GITHUB_TOKEN=${["ghp", "Abcdefghijklmnopqrstuvwxyz0123456789"].join("_")}`;
    const result = SecretLeakageDetector.scanForSecrets(leakedText);
    expect(result.hasSecretLeakage).toBe(true);
    expect(result.leakedCategory).toContain("GitHub Personal Access Token");
  });

  it("detects Resend API keys", () => {
    const leakedText = `RESEND_API_KEY=${["re", "12345678", "abcdefghijklmnopqrstuvwxyz"].join("_")}`;
    const result = SecretLeakageDetector.scanForSecrets(leakedText);
    expect(result.hasSecretLeakage).toBe(true);
    expect(result.leakedCategory).toContain("Resend Live API Key");
  });

  it("detects private SSH/RSA keys", () => {
    const leakedText = "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...\n-----END RSA PRIVATE KEY-----";
    const result = SecretLeakageDetector.scanForSecrets(leakedText);
    expect(result.hasSecretLeakage).toBe(true);
    expect(result.leakedCategory).toContain("Private Key");
  });

  it("allows safe benign placeholders and mock examples", () => {
    const safeText = `
      DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myapp_dev
      NEXT_PUBLIC_APP_URL=http://localhost:3000
      STRIPE_SECRET_KEY=sk_test_placeholder_key_for_development_only
      AWS_REGION=eu-central-1
      NODE_ENV=development
    `;
    const result = SecretLeakageDetector.scanForSecrets(safeText);
    expect(result.hasSecretLeakage).toBe(false);
  });
});

describe("parseEnvExampleText", () => {
  it("parses raw .env.example text into categorized RunbookEnvVar array", () => {
    const rawEnv = `
# [Database]
# Connection string for PostgreSQL database
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"

# [Authentication]
# Secret token for signing JWT sessions (required)
NEXTAUTH_SECRET=changeme_minimum_32_chars_random_string

# [External APIs]
# Optional Slack webhook for notifications
SLACK_WEBHOOK_URL=
    `;

    const parsed = parseEnvExampleText(rawEnv);
    expect(parsed.length).toBe(3);

    const dbVar = parsed.find((v) => v.key === "DATABASE_URL");
    expect(dbVar).toBeDefined();
    expect(dbVar?.secretCategory).toBe("DATABASE");
    expect(dbVar?.sampleValue).toBe("postgresql://user:pass@localhost:5432/mydb");

    const authVar = parsed.find((v) => v.key === "NEXTAUTH_SECRET");
    expect(authVar).toBeDefined();
    expect(authVar?.secretCategory).toBe("AUTH");
    expect(authVar?.isRequired).toBe(true);

    const slackVar = parsed.find((v) => v.key === "SLACK_WEBHOOK_URL");
    expect(slackVar).toBeDefined();
    expect(slackVar?.isRequired).toBe(true);
  });

  it("handles empty or commented-only content gracefully", () => {
    const emptyParsed = parseEnvExampleText("");
    expect(emptyParsed).toEqual([]);

    const commentsOnly = parseEnvExampleText("# Just a comment\n# Another comment");
    expect(commentsOnly).toEqual([]);
  });
});

describe("RunbookSynthesizer", () => {
  it("synthesizes comprehensive blueprint for Web / SaaS projects", () => {
    const runbook = RunbookSynthesizer.synthesizeDefaultRunbook({
      title: "Next.js & Supabase Enterprise Portal",
      categoryKey: "web-development",
      sectorKey: "software-dev",
    });

    expect(runbook.architectureSummary).toContain("Web");
    expect(runbook.environmentVariables.length).toBeGreaterThanOrEqual(4);
    expect(runbook.buildAndRunSteps.length).toBeGreaterThanOrEqual(4);
    expect(runbook.thirdPartyServices.length).toBeGreaterThanOrEqual(2);
    expect(runbook.disasterRecoverySteps.length).toBeGreaterThanOrEqual(3);
  });

  it("synthesizes specialized blueprint for Mobile App projects", () => {
    const runbook = RunbookSynthesizer.synthesizeDefaultRunbook({
      title: "React Native & Expo iOS/Android App",
      categoryKey: "mobile-development",
      sectorKey: "mobile",
    });

    expect(runbook.architectureSummary).toContain("Mobil");
    expect(runbook.buildAndRunSteps.some((s) => s.command.includes("ios") || s.command.includes("android") || s.command.includes("pod"))).toBe(true);
  });

  it("synthesizes specialized blueprint for AI & Data projects", () => {
    const runbook = RunbookSynthesizer.synthesizeDefaultRunbook({
      title: "LLM RAG Pipeline & Vector DB Microservice",
      categoryKey: "ai-llm",
      sectorKey: "ai-data",
    });

    expect(runbook.architectureSummary).toContain("Yapay Zeka");
    expect(runbook.environmentVariables.some((e) => e.key.includes("OPENAI") || e.key.includes("MODEL"))).toBe(true);
  });

  it("synthesizes specialized blueprint for UI/UX Design projects", () => {
    const runbook = RunbookSynthesizer.synthesizeDefaultRunbook({
      title: "Mobile Banking Design System & Figma Token Vault",
      categoryKey: "ui-ux",
      sectorKey: "design-creative",
    });

    expect(runbook.architectureSummary).toContain("UI/UX");
    expect(runbook.thirdPartyServices.some((s) => s.serviceName.includes("Figma"))).toBe(true);
  });
});

describe("RunbookService", () => {
  const testEngagementId = "eng-test-service-202";
  const testUserId = "user-dev-001";

  beforeEach(() => {
    inMemoryRunbooks.delete(testEngagementId);
  });

  it("getRunbook retrieves auto-synthesized runbook when not existing", async () => {
    const result = await RunbookService.getRunbook(testEngagementId, testUserId);
    expect(result).toBeDefined();
    expect(result.runbook.engagementId).toBe(testEngagementId);
    expect(result.runbook.status).toBe("DRAFT");
    expect(result.runbook.environmentVariables.length).toBeGreaterThan(0);
    expect(result.completenessScore).toBeGreaterThanOrEqual(60);
  });

  it("saveRunbook saves draft successfully and updates completeness score", async () => {
    const initial = await RunbookService.getRunbook(testEngagementId, testUserId);
    const saveResult = await RunbookService.saveRunbook(
      testEngagementId,
      {
        architectureSummary: `${initial.runbook.architectureSummary} - Updated production spec`,
        environmentVariables: [
          {
            key: "DATABASE_URL",
            description: "Postgres production pooler connection string",
            isRequired: true,
            secretCategory: "DATABASE",
            sampleValue: "postgresql://postgres:sample_password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres",
          },
        ],
        buildAndRunSteps: [
          {
            stepNumber: 1,
            title: "Dependencies",
            command: "pnpm install --frozen-lockfile",
            environment: "PRODUCTION",
            description: "Install locked dependencies",
          },
        ],
        thirdPartyServices: [
          {
            serviceName: "Supabase",
            category: "Database & Auth",
            purpose: "Database & Authentication",
            dashboardUrl: "https://supabase.com/dashboard",
            credentialsTransferred: true,
          },
        ],
        disasterRecoverySteps: [
          {
            priority: "CRITICAL",
            scenario: "Database Corruption or Data Loss",
            procedure: "Restore snapshot from Supabase daily PITR backup panel.",
            verificationCommand: "curl https://api.operis.pro/health",
          },
        ],
        backupSchedule: {
          frequency: "Daily automated PITR backup",
          backupScriptOrCommand: "supabase db dump",
          storageLocation: "AWS S3 Frankfurt",
          restoreProcedure: "supabase db restore",
        },
        emergencyContact: {
          name: "Lead Engineer",
          email: "dev@example.com",
          notes: "Business hours Mon-Fri",
        },
        publish: false,
      },
      testUserId
    );

    expect(saveResult.success).toBe(true);
    expect(saveResult.runbook.status).toBe("DRAFT");
    expect(saveResult.runbook.environmentVariables[0]?.key).toBe("DATABASE_URL");
  });

  it("saveRunbook rejects payload containing live secrets and throws error", async () => {
    const initial = await RunbookService.getRunbook(testEngagementId, testUserId);

    await expect(
      RunbookService.saveRunbook(
        testEngagementId,
        {
          architectureSummary: initial.runbook.architectureSummary,
          environmentVariables: [
            {
              key: "AWS_ACCESS_KEY_ID",
              description: "Live access key",
              isRequired: true,
              secretCategory: "OTHER",
              sampleValue: "AKIAIOSFODNN7EXAMPLE",
            },
          ],
          buildAndRunSteps: initial.runbook.buildAndRunSteps,
          thirdPartyServices: initial.runbook.thirdPartyServices,
          disasterRecoverySteps: initial.runbook.disasterRecoverySteps,
          backupSchedule: initial.runbook.backupSchedule,
          publish: false,
        },
        testUserId
      )
    ).rejects.toThrow("AWS Access Key ID");
  });

  it("publishRunbook creates SHA-256 seal and transitions status to PUBLISHED", async () => {
    const initial = await RunbookService.getRunbook(testEngagementId, testUserId);

    const publishResult = await RunbookService.saveRunbook(
      testEngagementId,
      {
        architectureSummary: initial.runbook.architectureSummary,
        environmentVariables: initial.runbook.environmentVariables,
        buildAndRunSteps: initial.runbook.buildAndRunSteps,
        thirdPartyServices: initial.runbook.thirdPartyServices,
        disasterRecoverySteps: initial.runbook.disasterRecoverySteps,
        backupSchedule: initial.runbook.backupSchedule,
        emergencyContact: initial.runbook.emergencyContact,
        publish: true,
      },
      testUserId
    );

    expect(publishResult.success).toBe(true);
    expect(publishResult.runbook.status).toBe("PUBLISHED");
    expect(publishResult.runbook.sha256Seal).toBeDefined();
    expect(publishResult.runbook.sha256Seal?.length).toBe(64);
    expect(publishResult.runbook.publishedAt).toBeDefined();
  });

  it("calculateCompleteness accurately computes score and grade", () => {
    const dummyRunbook = RunbookSynthesizer.synthesizeDefaultRunbook({
      title: "Test System",
    });

    const completeness = RunbookService.calculateCompleteness(dummyRunbook);
    expect(completeness.score).toBeGreaterThan(0);
    expect(completeness.score).toBeLessThanOrEqual(100);
    expect(["A+", "B", "C"]).toContain(completeness.grade);
  });
});

describe("RunbookGeneratorService", () => {
  it("generates structured Markdown runbook with SHA-256 seal and tables", () => {
    const runbook = RunbookSynthesizer.synthesizeDefaultRunbook({
      title: "E-Commerce Microservices Platform",
    });

    const generated = RunbookGeneratorService.generateRunbook({
      engagementId: "eng-gen-test-01",
      listingTitle: "E-Commerce Microservices Platform",
      clientName: "İşveren Firma",
      contractorName: "Yazılım Uzmanı",
      status: "PUBLISHED",
      version: 1,
      architectureSummary: runbook.architectureSummary,
      environmentVariables: runbook.environmentVariables,
      buildAndRunSteps: runbook.buildAndRunSteps,
      thirdPartyServices: runbook.thirdPartyServices,
      disasterRecoverySteps: runbook.disasterRecoverySteps,
      backupSchedule: runbook.backupSchedule,
      publishedAt: new Date().toISOString(),
    });

    expect(generated.markdown).toContain("PROJE DEVİR VE İŞLETİM KILAVUZU");
    expect(generated.markdown).toContain("HMK M. 193");
    expect(generated.markdown).toContain("ÇEVRE DEĞİŞKENLERİ SÖZLÜĞÜ (.env.example)");
    expect(generated.markdown).toContain("BAŞLATMA VE DERLEME KOMUTLARI");
    expect(generated.markdown).toContain("YEDEKLEME VE ACİL FELAKET KURTARMA");
    expect(generated.sha256Seal).toBeDefined();
    expect(generated.sha256Seal.length).toBe(64);
  });

  it("generates printable, beautiful HTML runbook document", () => {
    const runbook = RunbookSynthesizer.synthesizeDefaultRunbook({
      title: "E-Commerce Microservices Platform",
    });

    const generated = RunbookGeneratorService.generateRunbook({
      engagementId: "eng-gen-test-02",
      listingTitle: "E-Commerce Microservices Platform",
      clientName: "İşveren Firma",
      contractorName: "Yazılım Uzmanı",
      status: "PUBLISHED",
      version: 1,
      architectureSummary: runbook.architectureSummary,
      environmentVariables: runbook.environmentVariables,
      buildAndRunSteps: runbook.buildAndRunSteps,
      thirdPartyServices: runbook.thirdPartyServices,
      disasterRecoverySteps: runbook.disasterRecoverySteps,
      backupSchedule: runbook.backupSchedule,
    });

    expect(generated.htmlContent).toContain("<!DOCTYPE html>");
    expect(generated.htmlContent).toContain("Operis Runbook");
    expect(generated.htmlContent).toContain("HMK m. 193");
    expect(generated.htmlContent).toContain("Proje Devir ve İşletim Kılavuzu");
  });

  it("blocks outsiders from saving or updating runbooks with Forbidden error (BOLA protection)", async () => {
    const input = {
      architectureSummary: "Malicious attacker modification",
      environmentVariables: [],
      buildAndRunSteps: [],
      thirdPartyServices: [],
      disasterRecoverySteps: [],
      backupSchedule: { frequency: "DAILY" as const },
      publish: false,
    };

    // Outsider attempt on mock engagement
    await expect(
      RunbookService.saveRunbook("eng-test-bola-01", input, "user-outsider-999")
    ).rejects.toThrow("Forbidden. You are not a participant in this engagement.");
  });
});

