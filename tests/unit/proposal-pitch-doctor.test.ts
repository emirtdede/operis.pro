import { describe, it, expect, vi } from "vitest";
import {
  evaluateProposalPitch,
  generateProposalEnhancement,
  extractTechnicalKeywords,
  type ListingContext,
  type ProposalDraft,
} from "@/src/modules/ai/pitch-doctor";

vi.mock("@/src/modules/auth/session", () => ({
  getSession: vi.fn().mockResolvedValue({
    userId: "usr_pitch_doctor_test_123",
    role: "SPECIALIST",
    email: "dev@operis.pro",
  }),
}));

vi.mock("@/src/lib/security/rate-limit", () => ({
  evaluateSecurityAccessAsync: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  normalizeIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

describe("Operis AI Proposal Pitch Doctor Suite", () => {
  const sampleListing: ListingContext = {
    id: "lst_sample_123",
    title: "Next.js ve PostgreSQL ile Gerçek Zamanlı E-Ticaret Paneli",
    summary: "B2B müşterilerimiz için yüksek performanslı yönetim paneli geliştirilecek.",
    scope: "Next.js 15, PostgreSQL, Redis ve Docker kullanılacak. REST API ve WebSocket entegrasyonu gereklidir.",
    tags: ["Next.js", "PostgreSQL", "Redis", "Docker", "TypeScript"],
    timelineValue: 3,
    timelineUnit: "WEEKS",
  };

  describe("extractTechnicalKeywords", () => {
    it("should extract normalized technical keywords from tags and description", () => {
      const keywords = extractTechnicalKeywords(
        "Modern React, Node.js ve PostgreSQL mimarisi üzerine kurulu sistem.",
        ["Docker", "TypeScript"]
      );

      expect(keywords).toContain("react");
      expect(keywords).toContain("nodejs");
      expect(keywords).toContain("postgresql");
      expect(keywords).toContain("docker");
      expect(keywords).toContain("typescript");
    });
  });

  describe("evaluateProposalPitch — Weak Proposal Detection", () => {
    it("should penalize lazy one-liner cliches like 'Ben yaparım, iletişime geçin'", () => {
      const weakDraft: ProposalDraft = {
        message: "Ben yaparım, detayları konuşalım. İletişime geçin hallederim.",
      };

      const result = evaluateProposalPitch(sampleListing, weakDraft, "tr");

      expect(result.overallScore).toBeLessThan(50);
      expect(result.tier).toBe("weak");
      expect(result.redFlags.length).toBeGreaterThan(0);
      expect(result.redFlags.some((rf) => rf.includes("Ben yaparım") || rf.includes("İletişime geçin"))).toBe(true);

      const professionalismDim = result.dimensions.find((d) => d.id === "professionalism");
      expect(professionalismDim?.status).toBe("critical");

      const milestoneDim = result.dimensions.find((d) => d.id === "milestones");
      expect(milestoneDim?.score).toBeLessThanOrEqual(20);
    });

    it("should identify missing technologies from the listing", () => {
      const draftWithoutTech: ProposalDraft = {
        message: "Merhaba, projenizi inceledim. Benzer birçok panel geliştirdim, zamanında teslim ederim.",
        proposedTimelineValue: 2,
        proposedTimelineUnit: "WEEKS",
      };

      const result = evaluateProposalPitch(sampleListing, draftWithoutTech, "tr");
      expect(result.analyzedKeywords.missingTech.length).toBeGreaterThan(0);
      expect(result.analyzedKeywords.missingTech).toContain("postgresql");
      expect(result.analyzedKeywords.missingTech).toContain("redis");
    });
  });

  describe("evaluateProposalPitch — Strong Winning Proposal", () => {
    it("should award high scores (85+) to comprehensive proposals with architecture and milestones", () => {
      const winningDraft: ProposalDraft = {
        message: `Merhaba, projeniz için Next.js ve PostgreSQL tabanlı güvenli bir mimari kurgulayabilirim.
Veri akışında Redis önbellekleme ve Docker konteynerizasyon kullanarak performansı optimize edeceğiz.

1. Aşama: Veritabanı şeması, PostgreSQL indeksleri ve API kontratları (Hafta 1)
2. Aşama: Next.js UI bileşenleri, Redis cache ve yetkilendirme katmanı (Hafta 2)
3. Aşama: Docker dağıtımı, yük testleri ve canlıya alma (Hafta 3)

Hemen başlayabilirim ve 3 hafta içerisinde projenizi eksiksiz teslim edebilirim.`,
        proposedTimelineValue: 3,
        proposedTimelineUnit: "WEEKS",
        proposedBudgetMin: 45000,
        proposedBudgetMax: 50000,
        proposedCurrency: "TRY",
      };

      const result = evaluateProposalPitch(sampleListing, winningDraft, "tr");

      expect(result.overallScore).toBeGreaterThanOrEqual(85);
      expect(result.tier).toBe("top_tier");
      expect(result.redFlags.length).toBe(0);
      expect(result.strengths.length).toBeGreaterThan(1);

      const archDim = result.dimensions.find((d) => d.id === "architecture");
      expect(archDim?.score).toBeGreaterThanOrEqual(80);

      const milestoneDim = result.dimensions.find((d) => d.id === "milestones");
      expect(milestoneDim?.score).toBeGreaterThanOrEqual(80);

      const timelineDim = result.dimensions.find((d) => d.id === "timeline");
      expect(timelineDim?.score).toBeGreaterThanOrEqual(80);
    });
  });

  describe("generateProposalEnhancement", () => {
    it("should generate concrete architectural snippets and 3-phase delivery roadmap", () => {
      const weakDraft: ProposalDraft = {
        message: "İlanınızla ilgileniyorum.",
        proposedTimelineValue: 2,
        proposedTimelineUnit: "WEEKS",
      };

      const enhancement = generateProposalEnhancement(sampleListing, weakDraft, "tr");

      expect(enhancement.suggestedArchitectureSnippet).toContain("Teknik Mimari");
      expect(enhancement.suggestedArchitectureSnippet).toContain("Next.js");
      expect(enhancement.suggestedMilestonesSnippet).toContain("Şeffaf Teslimat Yol Haritası");
      expect(enhancement.suggestedMilestonesSnippet).toContain("Aşama 1");
      expect(enhancement.suggestedMilestonesSnippet).toContain("Aşama 2");
      expect(enhancement.suggestedMilestonesSnippet).toContain("Aşama 3");
      expect(enhancement.suggestedTimelineSnippet).toContain("2 hafta");
      expect(enhancement.fullEnhancedMessage).toContain("Aşama 1");
    });

    it("should support English localization cleanly", () => {
      const weakDraft: ProposalDraft = {
        message: "I am interested in this role.",
        proposedTimelineValue: 4,
        proposedTimelineUnit: "WEEKS",
      };

      const enhancement = generateProposalEnhancement(sampleListing, weakDraft, "en");

      expect(enhancement.suggestedArchitectureSnippet).toContain("Proposed Technical Architecture");
      expect(enhancement.suggestedMilestonesSnippet).toContain("Structured Delivery Milestones");
      expect(enhancement.suggestedMilestonesSnippet).toContain("Phase 1");
      expect(enhancement.suggestedTimelineSnippet).toContain("Timeline Commitment");
    });
  });

  describe("API Route POST /api/ai/proposal-pitch-doctor", () => {
    it("should return evaluation and enhancement for authenticated requests", async () => {
      const { POST: pitchDoctorRoute } = await import("@/src/app/api/ai/proposal-pitch-doctor/route");

      const request = new Request("http://localhost:3000/api/ai/proposal-pitch-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: "lst_sample_123",
          message: "Ben yaparım, iletişime geçin.",
          fallbackListing: {
            title: "Next.js & Postgres Projesi",
            tags: ["Next.js", "PostgreSQL"],
          },
        }),
      });

      const response = await pitchDoctorRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.evaluation).toBeDefined();
      expect(data.evaluation.overallScore).toBeLessThan(50);
      expect(data.enhancement).toBeDefined();
      expect(data.enhancement.suggestedMilestonesSnippet).toBeDefined();
    });
  });
});
