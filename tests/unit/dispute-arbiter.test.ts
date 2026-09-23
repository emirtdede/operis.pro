import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  DisputeArbiterService,
  type DisputeAnalysisInput,
} from "@/src/modules/ai/dispute-arbiter";
import { GET as adminReportRouteHandler } from "@/src/app/api/admin/engagements/[id]/dispute-report/route";
import { GET as workReportRouteHandler } from "@/src/app/api/work/[id]/dispute-report/route";

vi.mock("@/src/modules/admin/auth-guard", () => ({
  getAdminSession: vi.fn().mockResolvedValue({
    isAuthenticated: true,
    isAdmin: true,
    session: {
      userId: "admin-1",
      role: "ADMIN",
      status: "ACTIVE",
    },
  }),
}));

vi.mock("@/src/modules/auth/session", () => ({
  getSession: vi.fn().mockResolvedValue({
    userId: "u-freelancer-1",
    role: "SPECIALIST",
    email: "freelancer@operis.pro",
    status: "ACTIVE",
  }),
}));

describe("⚖️ Operis AI Dispute Arbiter & Evidence Analyzer Suite", () => {
  describe("Algorithmic Arbitration & Scoring Engine", () => {
    it("should award FORCE_COMPLETE (>85% freelancer entitlement) for healthy delivery with deemed acceptance", () => {
      const now = new Date();
      const pastSubmission = new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000); // 12 days ago (> 10 calendar days)

      const input: DisputeAnalysisInput = {
        engagementId: "eng-test-complete",
        listingTitle: "Fullstack SaaS Dashboard",
        category: "FULL_STACK",
        matchedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        agreedBudgetLabel: "60.000 TL",
        agreedTimelineLabel: "20 Gün",
        handover: {
          repositoryUrl: "https://github.com/developer/saas-dashboard",
          commitHash: "a1b2c3d4e5f67890",
          liveUrl: "https://saas-dashboard.vercel.app",
          submittedAt: pastSubmission,
          inspectionExpiresAt: new Date(pastSubmission.getTime() + 10 * 24 * 60 * 60 * 1000),
          status: "SUBMITTED",
          deliveryHealth: {
            inspectedAt: new Date().toISOString(),
            isHealthy: true,
            summaryStatus: "HEALTHY",
            liveDeployment: {
              checked: true,
              url: "https://saas-dashboard.vercel.app",
              isAccessible: true,
              httpStatus: 200,
              statusText: "OK",
              responseTimeMs: 145,
              sslValid: true,
            },
            gitRepository: {
              checked: true,
              url: "https://github.com/developer/saas-dashboard",
              isAccessible: true,
              provider: "github",
              commitHash: "a1b2c3d4e5f67890",
              commitValid: true,
            },
            powSeal: "a".repeat(64),
            badgeTextTr: "Doğrulandı",
            badgeTextEn: "Verified",
          },
        },
      };

      const report = DisputeArbiterService.analyzeDispute(input);

      expect(report.freelancerEntitlementPercent).toBeGreaterThanOrEqual(85);
      expect(report.clientRefundPercent).toBeLessThanOrEqual(15);
      expect(report.verdictRecommendation).toBe("FORCE_COMPLETE");
      expect(report.evidenceSummary.repositoryDelivered).toBe(true);
      expect(report.evidenceSummary.powSealVerified).toBe(true);
      expect(report.statutoryLegalGroundsTr.some((g) => g.includes("TBK m. 474 & 477"))).toBe(true);
    });

    it("should award FORCE_CANCEL (>75% client refund) when deliverables are missing and demo server crashed", () => {
      const matchedDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 days ago

      const input: DisputeAnalysisInput = {
        engagementId: "eng-test-crashed",
        listingTitle: "E-Commerce Backend API",
        category: "BACKEND",
        matchedAt: matchedDate,
        agreedBudgetLabel: "45.000 TL",
        agreedTimelineLabel: "14 Gün", // overdue by 26 days
        handover: {
          repositoryUrl: null,
          liveUrl: "https://crashed-service.fly.dev",
          status: "SUBMITTED",
          deliveryHealth: {
            inspectedAt: new Date().toISOString(),
            isHealthy: false,
            summaryStatus: "UNHEALTHY",
            liveDeployment: {
              checked: true,
              url: "https://crashed-service.fly.dev",
              isAccessible: false,
              httpStatus: 500,
              statusText: "Internal Server Error",
              responseTimeMs: 3200,
              sslValid: false,
            },
            gitRepository: {
              checked: true,
              url: "",
              isAccessible: false,
              provider: "other",
            },
            powSeal: "fail00000",
            badgeTextTr: "Hata",
            badgeTextEn: "Error",
          },
        },
      };

      const report = DisputeArbiterService.analyzeDispute(input);

      expect(report.clientRefundPercent).toBeGreaterThanOrEqual(75);
      expect(report.freelancerEntitlementPercent).toBeLessThanOrEqual(25);
      expect(report.verdictRecommendation).toBe("FORCE_CANCEL");
      expect(report.identifiedBreaches.some((b) => b.party === "CONTRACTOR" && b.clause.includes("Madde 2"))).toBe(true);
      expect(report.identifiedBreaches.some((b) => b.party === "CONTRACTOR" && b.clause.includes("Madde 7"))).toBe(true);
    });

    it("should detect unauthorized Scope Creep (Madde 4.3 / TBK m. 480/2) in client chat messages", () => {
      const input: DisputeAnalysisInput = {
        engagementId: "eng-test-scope-creep",
        listingTitle: "Mobile CRM App",
        category: "MOBILE",
        matchedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        handover: {
          repositoryUrl: "https://github.com/dev/crm-mobile",
          status: "SUBMITTED",
        },
        messages: [
          {
            senderRole: "CLIENT",
            content: "Lütfen sözleşme dışı 4 yeni sayfa ve ilave ödeme ekranı ekleyin, aksi halde onay vermeyeceğim.",
            createdAt: new Date(),
          },
        ],
      };

      const report = DisputeArbiterService.analyzeDispute(input);

      const scopeBreach = report.identifiedBreaches.find(
        (b) => b.party === "CLIENT" && b.clause.includes("Madde 4.3")
      );
      expect(scopeBreach).toBeDefined();
      expect(scopeBreach?.severity).toBe("CRITICAL");
      expect(scopeBreach?.evidenceSnippet).toContain("4 yeni sayfa ve ilave ödeme ekranı ekleyin");
      expect(report.freelancerEntitlementPercent).toBeGreaterThanOrEqual(60);
    });

    it("should detect excessive revision requests beyond Madde 4.3 limit (cap of 2)", () => {
      const input: DisputeAnalysisInput = {
        engagementId: "eng-test-revisions",
        listingTitle: "Design & Landing Page",
        category: "FRONTEND",
        matchedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        handover: {
          repositoryUrl: "https://github.com/dev/landing",
          status: "REVISION_REQUESTED",
          revisionNotes: "4. tur revizyon talebi: buton renkleri ve tipografi yeniden değişsin.",
        },
        revisionRoundsCount: 4,
      };

      const report = DisputeArbiterService.analyzeDispute(input);

      const revBreach = report.identifiedBreaches.find(
        (b) => b.party === "CLIENT" && b.clause.includes("Madde 4.3") && b.titleTr.includes("Revizyon")
      );
      expect(revBreach).toBeDefined();
      expect(report.evidenceSummary.revisionRoundsCount).toBeGreaterThanOrEqual(3);
    });

    it("should properly clamp ratios to [0, 100] and ensure sum is strictly 100%", () => {
      const reportExtreme = DisputeArbiterService.analyzeDispute({
        engagementId: "eng-clamp",
        listingTitle: "Edge Case Testing",
        category: "OTHER",
        matchedAt: new Date(),
      });

      expect(reportExtreme.freelancerEntitlementPercent).toBeGreaterThanOrEqual(0);
      expect(reportExtreme.freelancerEntitlementPercent).toBeLessThanOrEqual(100);
      expect(reportExtreme.clientRefundPercent).toBeGreaterThanOrEqual(0);
      expect(reportExtreme.clientRefundPercent).toBeLessThanOrEqual(100);
      expect(reportExtreme.freelancerEntitlementPercent + reportExtreme.clientRefundPercent).toBe(100);
    });

    it("should generate comprehensive bilingual executive reports (TR and EN)", () => {
      const report = DisputeArbiterService.analyzeDispute({
        engagementId: "eng-bilingual",
        listingTitle: "Cloud Architecture Setup",
        category: "DEVOPS",
        matchedAt: new Date(),
        handover: {
          repositoryUrl: "https://github.com/dev/cloud-infra",
          commitHash: "11223344",
          deliveryHealth: {
            inspectedAt: new Date().toISOString(),
            isHealthy: true,
            summaryStatus: "HEALTHY",
            liveDeployment: {
              checked: true,
              url: "https://cloud-infra.operis.internal",
              isAccessible: true,
              httpStatus: 200,
              statusText: "OK",
              responseTimeMs: 80,
              sslValid: true,
            },
            gitRepository: {
              checked: true,
              url: "https://github.com/dev/cloud-infra",
              isAccessible: true,
              provider: "github",
              commitHash: "11223344",
              commitValid: true,
            },
            powSeal: "b".repeat(64),
            badgeTextTr: "Doğrulandı",
            badgeTextEn: "Verified",
          },
        },
      });

      expect(report.markdownReportTr).toContain("# ⚖️ OPERİS AI TARAFSIZ TAHKİM VE DELİL RAPORU");
      expect(report.markdownReportTr).toContain("PROOF-OF-WORK");
      expect(report.markdownReportEn).toContain("# ⚖️ OPERIS NEUTRAL ARBITRATION & SETTLEMENT REPORT");
      expect(report.markdownReportEn).toContain("Recommended Verdict");
    });
  });

  describe("API Route Handlers", () => {
    it("should allow admin to fetch dispute arbitration report via /api/admin/engagements/[id]/dispute-report", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/engagements/eng-dispute-test/dispute-report");
      const res = await adminReportRouteHandler(req, {
        params: Promise.resolve({ id: "eng-dispute-test" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.report).toBeDefined();
      expect(data.report.engagementId).toBe("eng-dispute-test");
      expect(data.report.freelancerEntitlementPercent).toBeGreaterThanOrEqual(0);
    });

    it("should allow authenticated participant to fetch report via /api/work/[id]/dispute-report", async () => {
      const req = new NextRequest("http://localhost:3000/api/work/eng-dispute-test/dispute-report");
      const res = await workReportRouteHandler(req, {
        params: Promise.resolve({ id: "eng-dispute-test" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.report).toBeDefined();
      expect(data.report.engagementId).toBe("eng-dispute-test");
    });
  });
});
