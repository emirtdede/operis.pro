import { describe, it, expect, vi } from "vitest";
import {
  PrdArchitectService,
  type PrdArchitectInput,
} from "@/src/modules/ai/prd-architect";
import { POST } from "@/src/app/api/ai/prd-architect/route";

vi.mock("@/src/modules/auth/session", () => ({
  getSession: vi.fn().mockResolvedValue({
    userId: "usr_prd_client_123",
    role: "CLIENT",
    email: "employer@operis.pro",
  }),
}));

vi.mock("@/src/lib/security/rate-limit", () => ({
  evaluateSecurityAccessAsync: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  normalizeIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

describe("Operis AI Project Scope & PRD Architect Engine", () => {
  describe("Domain Archetype Classification", () => {
    it("should classify On-Demand Delivery & Taxi apps from vague Turkish briefs", () => {
      const analysis = PrdArchitectService.analyzeProjectDomain(
        "Bana Getir/Uber gibi uygulama lazım",
        "Kullanıcılar kurye çağırıp harita üzerinden anlık takip etsin, bütçe 5.000 TL"
      );

      expect(analysis.domainType).toBe("ON_DEMAND_DELIVERY_TAXI");
      expect(analysis.complexityScore).toBeGreaterThanOrEqual(8);
      expect(analysis.detectedFeatures.length).toBeGreaterThan(0);
    });

    it("should classify E-Commerce Marketplace projects", () => {
      const analysis = PrdArchitectService.analyzeProjectDomain(
        "Trendyol benzeri pazaryeri",
        "Çok satıcılı pazaryeri, satıcı komisyonu, sepet ve iyzico ödeme entegrasyonu"
      );

      expect(analysis.domainType).toBe("E_COMMERCE_MARKETPLACE");
      expect(analysis.complexityScore).toBeGreaterThanOrEqual(7);
    });

    it("should classify B2B SaaS Dashboard systems", () => {
      const analysis = PrdArchitectService.analyzeProjectDomain(
        "B2B Şirket İçi CRM ve Fatura Yönetim Paneli",
        "Müşteriler için analitik dashboard, rol tabanlı yetkilendirme ve CSV dışa aktarım"
      );

      expect(analysis.domainType).toBe("SAAS_B2B_DASHBOARD");
      expect(analysis.complexityScore).toBeGreaterThanOrEqual(6);
    });

    it("should classify AI Agent and Automation applications", () => {
      const analysis = PrdArchitectService.analyzeProjectDomain(
        "Müşteri Hizmetleri AI Chatbot & Agent",
        "OpenAI API ve LangChain ile otomatik yanıt veren zeki müşteri temsilcisi asistanı"
      );

      expect(analysis.domainType).toBe("AI_AGENT_AUTOMATION");
      expect(analysis.complexityScore).toBeGreaterThanOrEqual(7);
    });

    it("should fallback gracefully to GENERAL_CUSTOM for ambiguous inputs", () => {
      const analysis = PrdArchitectService.analyzeProjectDomain(
        "Basit bir web sayfası",
        "Kurumsal şirket tanıtım sitesi, hakkımızda ve iletişim formu"
      );

      expect(analysis.domainType).toBe("GENERAL_CUSTOM");
      expect(analysis.complexityScore).toBeLessThanOrEqual(5);
    });
  });

  describe("Agile User Stories Generation (INVEST Model)", () => {
    it("should generate structured user stories with P0, P1, P2 priorities in Turkish", () => {
      const analysis = PrdArchitectService.analyzeProjectDomain(
        "Getir Benzeri Hızlı Teslimat",
        "Kurye ve müşteri uygulaması"
      );
      const stories = PrdArchitectService.generateUserStories(analysis, "tr");

      expect(stories.length).toBeGreaterThanOrEqual(3);
      const p0Stories = stories.filter((s) => s.priority === "P0");
      expect(p0Stories.length).toBeGreaterThan(0);

      stories.forEach((story) => {
        expect(story.id).toMatch(/^us-\d+$/i);
        expect(story.role.length).toBeGreaterThan(0);
        expect(story.want.length).toBeGreaterThan(0);
        expect(story.soThat.length).toBeGreaterThan(0);
      });
    });

    it("should generate structured user stories in English when locale is 'en'", () => {
      const analysis = PrdArchitectService.analyzeProjectDomain(
        "Uber-like ride hailing app",
        "Riders and drivers live matching"
      );
      const stories = PrdArchitectService.generateUserStories(analysis, "en");

      expect(stories.length).toBeGreaterThanOrEqual(3);
      expect(stories[0]?.role).toMatch(/Rider|Passenger|Customer/i);
    });
  });

  describe("Testable Acceptance Criteria (Given/When/Then)", () => {
    it("should produce clear acceptance criteria with test scenarios", () => {
      const analysis = PrdArchitectService.analyzeProjectDomain(
        "Pazaryeri E-Ticaret",
        "Sanal pos ve sepet entegrasyonu"
      );
      const criteria = PrdArchitectService.generateAcceptanceCriteria(analysis, "tr");

      expect(criteria.length).toBeGreaterThanOrEqual(3);
      criteria.forEach((criterion) => {
        expect(criterion.id).toMatch(/^ac-\d+$/i);
        expect(criterion.category.length).toBeGreaterThan(0);
        expect(criterion.description.length).toBeGreaterThan(20);
      });
    });
  });

  describe("Third-Party API & Infrastructure Integrations Detection", () => {
    it("should automatically detect Payment, Maps, SMS OTP, and Cache for Mobility/Delivery apps", () => {
      const analysis = PrdArchitectService.analyzeProjectDomain(
        "Getir & Uber benzeri taksi çağırma",
        "Canlı konum takibi ve kredi kartıyla anlık ödeme"
      );
      const integrations = PrdArchitectService.detectRequiredIntegrations(analysis, "tr");

      const categories = integrations.map((i) => i.category);
      expect(categories).toContain("PAYMENT");
      expect(categories).toContain("MAPS_LOCATION");
      expect(categories).toContain("SMS_AUTH");
      expect(categories).toContain("DATABASE_CACHE");

      const maps = integrations.find((i) => i.category === "MAPS_LOCATION");
      expect(maps?.serviceExample).toMatch(/Google Maps|Mapbox/);
    });

    it("should detect Storage and Payment for E-Commerce Marketplace apps", () => {
      const analysis = PrdArchitectService.analyzeProjectDomain(
        "Çok Satıcılı Pazaryeri",
        "Ürün fotoğrafları yükleme ve satıcı hakediş ödemeleri"
      );
      const integrations = PrdArchitectService.detectRequiredIntegrations(analysis, "tr");

      const categories = integrations.map((i) => i.category);
      expect(categories).toContain("PAYMENT");
      expect(categories).toContain("MEDIA_STORAGE");
    });
  });

  describe("Parametric Market Budget & 3-Phase Roadmap", () => {
    it("should counter unrealistic 5.000 TL expectations for complex Uber/Getir apps with realistic market range", () => {
      const analysis = PrdArchitectService.analyzeProjectDomain(
        "Getir Benzeri Uygulama",
        "Canlı kurye haritası, ödeme ve bildirimler"
      );
      const estimate = PrdArchitectService.estimateMarketBudgetAndPhases(analysis, "tr");

      // Complex Uber/Getir applications cannot be done for 5.000 TL; benchmark should be 50k+ TL
      expect(estimate.minBudget).toBeGreaterThanOrEqual(50000);
      expect(estimate.maxBudget).toBeGreaterThan(estimate.minBudget);
      expect(estimate.estimatedWeeksMin).toBeGreaterThanOrEqual(4);

      // Verify 3 Phases
      expect(estimate.phases.length).toBe(3);
      const sumPercentage = estimate.phases.reduce((acc, p) => acc + p.percentage, 0);
      expect(sumPercentage).toBe(100);

      expect(estimate.phases[0]?.deliverables.length).toBeGreaterThan(0);
      expect(estimate.phases[1]?.deliverables.length).toBeGreaterThan(0);
      expect(estimate.phases[2]?.deliverables.length).toBeGreaterThan(0);
    });
  });

  describe("Full Markdown PRD Document Generation", () => {
    it("should synthesize a complete GitHub-flavored Markdown PRD with all standard sections", () => {
      const input: PrdArchitectInput = {
        title: "Bana Uber Gibi Taksi Çağırma Uygulaması Lazım",
        summary: "Müşteri ve şoför mobil uygulaması, harita üzerinden canlı takip ve kredi kartı ile otomatik ödeme.",
        locale: "tr",
      };

      const markdown = PrdArchitectService.synthesizeFullPrdMarkdown(input);

      expect(markdown).toContain("# ÜRÜN GEREKSİNİMLERİ DOKÜMANI (PRD)");
      expect(markdown).toContain("## 1. Proje Özeti ve Kapsam Çerçevesi");
      expect(markdown).toContain("## 2. Kullanıcı Hikayeleri (User Stories)");
      expect(markdown).toContain("## 3. Kabul Kriterleri (Acceptance Criteria)");
      expect(markdown).toContain("## 4. Gerekli Dış Servisler ve Altyapı Entegrasyonları");
      expect(markdown).toContain("## 5. Tavsiye Edilen 3 Aşamalı Teslimat Çizelgesi");
      expect(markdown).toContain("## 6. Piyasa Maliyet ve Süre Öngörüsü");
    });
  });

  describe("POST /api/ai/prd-architect Endpoint", () => {
    it("should process valid brief and return complete PRD synthesis", async () => {
      const req = new Request("http://localhost/api/ai/prd-architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Uber Gibi Taksi Çağırma",
          summary: "Mobil uygulama üzerinden şoför eşleştirme ve harita takibi",
          locale: "tr",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.result).toBeDefined();
      expect(json.result.analysis.domainType).toBe("ON_DEMAND_DELIVERY_TAXI");
      expect(json.result.userStories.length).toBeGreaterThanOrEqual(3);
      expect(json.result.acceptanceCriteria.length).toBeGreaterThanOrEqual(3);
      expect(json.result.integrations.length).toBeGreaterThanOrEqual(2);
      expect(json.result.marketEstimate.minBudget).toBeGreaterThanOrEqual(40000);
      expect(json.result.synthesizedPrdMarkdown).toContain("# ÜRÜN GEREKSİNİMLERİ DOKÜMANI (PRD)");
    });

    it("should return 400 if title and summary are both blank", async () => {
      const req = new Request("http://localhost/api/ai/prd-architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "",
          summary: "",
          locale: "tr",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });
});
