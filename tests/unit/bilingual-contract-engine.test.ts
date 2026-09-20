import { describe, it, expect } from "vitest";
import { ContractGeneratorService } from "@/src/modules/contracts/generator";
import { BilingualLayoutEngine } from "@/src/modules/contracts/bilingual-layout-engine";
import type { ContractGeneratorInput } from "@/src/modules/contracts/types";
import { VectorPdfEngine } from "@/src/lib/pdf/vector-pdf-engine";

describe("Bilingual Parallel-Column Contract & Vector PDF Engine", () => {
  const baseInput: ContractGeneratorInput = {
    engagementId: "eng-bilingual-test-12345678",
    listingTitle: "Cross-Border AI Agent Architecture & Full-Stack Platform",
    category: "Full-Stack Development",
    matchedAt: "2026-09-19T10:00:00Z",
    scopeSummary:
      "Next.js 16, TypeScript, Python FastAPI microservices, and autonomous LLM orchestration pipeline.",
    budgetLabel: "120.000 TL",
    timelineLabel: "6 Hafta / 6 Weeks",
    client: {
      displayName: "Global Horizon Tech Inc.",
      email: "legal@globalhorizon.io",
      phone: "+1 415 555 0199",
      role: "CLIENT",
      city: "San Francisco",
    },
    contractor: {
      displayName: "Emir T. Dede",
      email: "emir@operis.tech",
      phone: "+90 532 999 8877",
      role: "CONTRACTOR",
      city: "İstanbul",
    },
    locale: "bilingual",
  };

  it("generates synchronized bilingual clause pairs with full language parity", () => {
    const clauses = BilingualLayoutEngine.buildBilingualClauses(baseInput);

    expect(clauses.length).toBeGreaterThanOrEqual(10);

    for (const clause of clauses) {
      expect(clause.id).toBeDefined();
      expect(clause.titleTr).toBeTruthy();
      expect(clause.titleEn).toBeTruthy();
      expect(clause.bodyTr).toBeTruthy();
      expect(clause.bodyEn).toBeTruthy();
      // Ensure neither side is empty or undefined
      expect(clause.bodyTr.trim().length).toBeGreaterThan(10);
      expect(clause.bodyEn.trim().length).toBeGreaterThan(10);
    }
  });

  it("includes legal precedence clause defaulting to Turkish under TBK", () => {
    const result = ContractGeneratorService.generateContract({
      ...baseInput,
      locale: "bilingual",
      prevalenceLanguage: "tr",
    });

    expect(result.locale).toBe("bilingual");
    expect(result.prevalenceLanguage).toBe("tr");
    expect(result.markdown).toContain("HÜKÜM ÖNCELİĞİ");
    expect(result.markdown).toContain("TÜRKÇE METİN");
    expect(result.htmlContent).toContain("Resmi Hüküm Önceliği: TÜRKÇE METİN");
    expect(result.htmlContent).toContain("Prevalence: TURKISH VERSION");
  });

  it("supports English precedence clause when selected for foreign audit", () => {
    const result = ContractGeneratorService.generateContract({
      ...baseInput,
      locale: "bilingual",
      prevalenceLanguage: "en",
    });

    expect(result.prevalenceLanguage).toBe("en");
    expect(result.htmlContent).toContain("Official Prevalence: ENGLISH VERSION");
    expect(result.markdown).toContain("İNGİLİZCE METİN");
  });

  it("renders synchronized A4 CSS grid layout with page-break protection", () => {
    const result = ContractGeneratorService.generateContract({
      ...baseInput,
      locale: "bilingual",
    });

    expect(result.htmlContent).toContain("size: A4 portrait;");
    expect(result.htmlContent).toContain(".bilingual-row");
    expect(result.htmlContent).toContain("grid-template-columns: 1fr 1fr;");
    expect(result.htmlContent).toContain("break-inside: avoid;");
    expect(result.htmlContent).toContain(".col-tr");
    expect(result.htmlContent).toContain(".col-en");
    expect(result.htmlContent).toContain("OPERIS");
    expect(result.htmlContent).toContain("Bilingual Parallel-Column Legal Infrastructure");
  });

  it("produces deterministic canonical SHA-256 fingerprint for bilingual document", () => {
    const result1 = ContractGeneratorService.generateContract({
      ...baseInput,
      locale: "bilingual",
    });
    const result2 = ContractGeneratorService.generateContract({
      ...baseInput,
      locale: "bilingual",
    });

    expect(result1.sha256Fingerprint).toBeDefined();
    expect(result1.sha256Fingerprint).toHaveLength(64);
    expect(result1.sha256Fingerprint).toBe(result2.sha256Fingerprint);
    expect(result1.htmlContent).toContain(result1.sha256Fingerprint);
  });

  it("bilingual assets are also populated even if generating monolingual contract", () => {
    const trResult = ContractGeneratorService.generateContract({
      ...baseInput,
      locale: "tr",
    });

    expect(trResult.locale).toBe("tr");
    expect(trResult.bilingualHtmlContent).toBeDefined();
    expect(trResult.bilingualMarkdown).toBeDefined();
    expect(trResult.bilingualClauses).toBeDefined();
    expect(trResult.bilingualClauses!.length).toBeGreaterThanOrEqual(10);
  });

  it("includes squad consortium, DPA, AI governance and software export clauses in bilingual format", () => {
    const fullInput: ContractGeneratorInput = {
      ...baseInput,
      isSquadContract: true,
      squadTitle: "AI Architecture Guild",
      squadMembers: [
        {
          displayName: "Emir T. Dede",
          roleTitle: "Lead Architect",
          revenueSharePercentage: 60,
          isLead: true,
        },
        { displayName: "Can Yılmaz", roleTitle: "MLOps Engineer", revenueSharePercentage: 40 },
      ],
      dpaConfig: {
        enabled: true,
        accessLevel: "FULL_PRODUCTION_ACCESS",
        dataCategories: ["IDENTITY_CONTACT", "CUSTOMER_ACCOUNT_LOGS"],
        securityMeasures: ["TLS_ENCRYPTION", "AES256_AT_REST", "MFA_ACCESS"],
        subProcessorAllowed: false,
        breachNotificationHours: 24,
      },
      aiGovernanceConfig: {
        enabled: true,
        usageLevel: "HEAVY_AI_GENERATED",
        declaredTools: ["GITHUB_COPILOT", "CURSOR"],
        dataPrivacyTier: "ENTERPRISE_ZERO_RETENTION",
        humanInTheLoopAffirmed: true,
        copyleftFreeWarranted: true,
        zeroDataRetentionWarranted: true,
        strictDefectLiabilityAccepted: true,
        codeReviewToolUsed: true,
      },
      softwareExportConfig: {
        enabled: true,
        clientCountry: "United States",
        isForeignEntity: true,
        isServiceUtilizedAbroad: true,
        remittanceChannel: "SWIFT_WIRE",
        repatriationDeclared: true,
        invoiceCurrency: "USD",
      },
      cleanCodeConfig: {
        repositoryUrl: "https://github.com/operis/ai-agent",
        commitHash: "9a8b7c6d5e4f3a2b1c0d",
      },
    };

    const clauses = BilingualLayoutEngine.buildBilingualClauses(fullInput);
    const clauseIds = clauses.map((c) => c.id);

    expect(clauseIds).toContain("annex-2-dpa");
    expect(clauseIds).toContain("annex-4-ai-gov");
    expect(clauseIds).toContain("annex-5-software-export");
    expect(clauseIds).toContain("annex-6-clean-code");

    const squadClause = clauses.find((c) => c.id === "article-1-parties");
    expect(squadClause?.bodyTr).toContain("AI Architecture Guild");
    expect(squadClause?.bodyEn).toContain("AI Architecture Guild");
  });

  it("generates true vector PDF buffer with headless Chromium and handles cache", async () => {
    const result = ContractGeneratorService.generateContract({
      ...baseInput,
      locale: "bilingual",
    });

    const cacheKey = `test-pdf-${result.contractRef}`;
    const pdfBuffer = await VectorPdfEngine.generateVectorPdf(result.htmlContent, cacheKey);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);

    // Verify PDF header %PDF-1.4 or %PDF-
    const header = pdfBuffer.subarray(0, 5).toString("utf8");
    expect(header).toBe("%PDF-");

    // Test cached hit
    const cachedBuffer = await VectorPdfEngine.generateVectorPdf(result.htmlContent, cacheKey);
    expect(cachedBuffer).toBe(pdfBuffer);
  });
});
