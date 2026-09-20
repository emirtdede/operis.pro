import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GET as runbookGetHandler,
  POST as runbookPostHandler,
} from "@/src/app/api/work/[id]/runbook/route";
import { POST as parseEnvPostHandler } from "@/src/app/api/work/[id]/runbook/parse-env/route";
import { GET as exportGetHandler } from "@/src/app/api/work/[id]/runbook/export/route";
import { inMemoryRunbooks } from "@/src/modules/engagements/runbook-service";
import * as sessionModule from "@/src/modules/auth/session";

vi.mock("@/src/modules/auth/session", () => ({
  getSession: vi.fn().mockResolvedValue({
    userId: "user-dev-999",
    role: "SPECIALIST",
    email: "developer@operis.pro",
    status: "ACTIVE",
    type: "specialist",
    authVersion: 1,
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000,
  } as any),
}));

vi.mock("@/src/lib/security/rate-limit", () => ({
  evaluateSecurityAccessAsync: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  normalizeIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

describe("Project Runbook & Architecture Vault API Routes", () => {
  const engagementId = "eng-test-runbook-routes-101";

  beforeEach(() => {
    inMemoryRunbooks.delete(engagementId);
    vi.spyOn(sessionModule, "getSession").mockResolvedValue({
      userId: "user-dev-999",
      role: "SPECIALIST",
      email: "developer@operis.pro",
      status: "ACTIVE",
      type: "specialist",
      authVersion: 1,
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    } as any);
  });

  it("GET /api/work/[id]/runbook returns synthesized runbook and completeness metrics", async () => {
    const req = new Request(`http://localhost/api/work/${engagementId}/runbook`);
    const res = await runbookGetHandler(req, {
      params: Promise.resolve({ id: engagementId }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.runbook).toBeDefined();
    expect(json.runbook.engagementId).toBe(engagementId);
    expect(json.completenessScore).toBeDefined();
    expect(json.completenessScore).toBeGreaterThan(0);
  });

  it("GET /api/work/[id]/runbook rejects unauthenticated access with 401", async () => {
    vi.spyOn(sessionModule, "getSession").mockResolvedValueOnce(null as any);

    const req = new Request(`http://localhost/api/work/${engagementId}/runbook`);
    const res = await runbookGetHandler(req, {
      params: Promise.resolve({ id: engagementId }),
    });

    expect(res.status).toBe(401);
  });

  it("POST /api/work/[id]/runbook saves draft successfully", async () => {
    const req = new Request(`http://localhost/api/work/${engagementId}/runbook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        architectureSummary: "Next.js 15 Fullstack SaaS on PostgreSQL and Vercel",
        environmentVariables: [
          {
            key: "DATABASE_URL",
            description: "Postgres connection string",
            isRequired: true,
            secretCategory: "DATABASE",
            sampleValue: "postgresql://postgres:postgres@localhost:5432/mydb",
          },
        ],
        buildAndRunSteps: [
          {
            stepNumber: 1,
            title: "Install",
            command: "pnpm install",
            environment: "LOCAL",
            description: "Install locked dependencies",
          },
        ],
        thirdPartyServices: [
          {
            serviceName: "Supabase",
            category: "Database & Auth",
            purpose: "Auth & DB",
            dashboardUrl: "https://supabase.com",
            credentialsTransferred: true,
          },
        ],
        disasterRecoverySteps: [
          {
            priority: "HIGH",
            scenario: "Cold start failure",
            procedure: "Verify environment variables and restart container.",
          },
        ],
        backupSchedule: {
          frequency: "DAILY",
        },
        publish: false,
      }),
    });

    const res = await runbookPostHandler(req, {
      params: Promise.resolve({ id: engagementId }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.runbook.status).toBe("DRAFT");
    expect(json.runbook.environmentVariables.length).toBe(1);
  });

  it("POST /api/work/[id]/runbook blocks live secret leakage with 422", async () => {
    const req = new Request(`http://localhost/api/work/${engagementId}/runbook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        architectureSummary: "Testing secret blocker with AWS access key",
        environmentVariables: [
          {
            key: "AWS_ACCESS_KEY_ID",
            description: "Production AWS key",
            isRequired: true,
            secretCategory: "OTHER",
            sampleValue: "AKIAIOSFODNN7EXAMPLE",
          },
        ],
        buildAndRunSteps: [],
        thirdPartyServices: [],
        disasterRecoverySteps: [],
        backupSchedule: { frequency: "DAILY" },
        publish: false,
      }),
    });

    const res = await runbookPostHandler(req, {
      params: Promise.resolve({ id: engagementId }),
    });

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe("SECRET_LEAKAGE_DETECTED");
  });

  it("POST /api/work/[id]/runbook/parse-env parses raw string and blocks secrets", async () => {
    // 1. Safe parsing test
    const safeReq = new Request(`http://localhost/api/work/${engagementId}/runbook/parse-env`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        envText: `
# [Database]
# Local postgres pooler
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mydb
        `,
      }),
    });

    const safeRes = await parseEnvPostHandler(safeReq, {
      params: Promise.resolve({ id: engagementId }),
    });

    expect(safeRes.status).toBe(200);
    const safeJson = await safeRes.json();
    expect(safeJson.success).toBe(true);
    expect(safeJson.variables.length).toBe(1);
    expect(safeJson.variables[0].key).toBe("DATABASE_URL");

    // 2. Leaked key test
    const leakedReq = new Request(`http://localhost/api/work/${engagementId}/runbook/parse-env`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        envText: `\nSTRIPE_SECRET_KEY=${["sk", "live", "51AbcDefGhIjKlMnOpQrStUvWxYz12345"].join("_")}\n`,
      }),
    });

    const leakedRes = await parseEnvPostHandler(leakedReq, {
      params: Promise.resolve({ id: engagementId }),
    });

    expect(leakedRes.status).toBe(422);
    const leakedJson = await leakedRes.json();
    expect(leakedJson.error).toBe("SECRET_LEAKAGE_DETECTED");
  });

  it("GET /api/work/[id]/runbook/export exports markdown, html and json files", async () => {
    // 1. Markdown Export
    const mdReq = new Request(`http://localhost/api/work/${engagementId}/runbook/export?format=markdown`);
    const mdRes = await exportGetHandler(mdReq, {
      params: Promise.resolve({ id: engagementId }),
    });

    expect(mdRes.status).toBe(200);
    expect(mdRes.headers.get("Content-Type")).toContain("text/markdown");
    const mdContent = await mdRes.text();
    expect(mdContent).toContain("Proje Devir Kılavuzu");

    // 2. HTML Export
    const htmlReq = new Request(`http://localhost/api/work/${engagementId}/runbook/export?format=html`);
    const htmlRes = await exportGetHandler(htmlReq, {
      params: Promise.resolve({ id: engagementId }),
    });

    expect(htmlRes.status).toBe(200);
    expect(htmlRes.headers.get("Content-Type")).toContain("text/html");
    const htmlContent = await htmlRes.text();
    expect(htmlContent).toContain("<!DOCTYPE html>");

    // 3. JSON Export
    const jsonReq = new Request(`http://localhost/api/work/${engagementId}/runbook/export?format=json`);
    const jsonRes = await exportGetHandler(jsonReq, {
      params: Promise.resolve({ id: engagementId }),
    });

    expect(jsonRes.status).toBe(200);
    const jsonBody = await jsonRes.json();
    expect(jsonBody.runbookRef).toBeDefined();
    expect(jsonBody.sha256Seal).toBeDefined();
  });
});
