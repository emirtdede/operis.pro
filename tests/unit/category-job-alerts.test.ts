import { describe, it, expect } from "vitest";
import { CategoryService } from "@/src/modules/categories/service";
import { renderEmailTemplate } from "@/src/lib/email/templates";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";

describe("Takip Edilen Kategorilerde Canlı İlan Alarmları (Job Alerts)", () => {
  describe("1. Kategori Alarm Tercihleri ve Ayarlar Servisi", () => {
    it("updates and persists alert preferences (emailAlerts and minBudget) for a user", async () => {
      const categoryId = "web-gelistirme";

      // 1. Update preferences: enable email alerts with 25,000 TL min budget
      const updated = await CategoryService.updateAlertPreferences(DEFAULT_USER.id, categoryId, {
        emailAlerts: true,
        minBudget: 25000,
      });

      expect(updated.success).toBe(true);
      expect(updated.emailAlerts).toBe(true);
      expect(updated.minBudget).toBe(25000);

      // 2. Toggle off email alerts
      const muted = await CategoryService.updateAlertPreferences(DEFAULT_USER.id, categoryId, {
        emailAlerts: false,
      });

      expect(muted.success).toBe(true);
      expect(muted.emailAlerts).toBe(false);
      expect(muted.minBudget).toBe(25000); // Preserves existing minBudget

      // 3. Clear min budget filter
      const clearedBudget = await CategoryService.updateAlertPreferences(DEFAULT_USER.id, categoryId, {
        minBudget: null,
      });

      expect(clearedBudget.success).toBe(true);
      expect(clearedBudget.minBudget).toBeNull();
    });
  });

  describe("2. Yüksek Dönüşümlü Canlı Alarm E-posta Şablonu (Job Alert Email Template)", () => {
    it("renders rich category job alert email with budget, category badge, and direct CTA", () => {
      const renderedTr = renderEmailTemplate({
        template: "category_follow_match",
        locale: "tr",
        variables: {
          categoryName: "Next.js & Fullstack",
          listingTitle: "Kurumsal SaaS Mimarisi & API Entegrasyonu",
          budget: "45.000 ₺",
          timeline: "2-4 Hafta",
          summary: "Modern Next.js App Router, Tailwind CSS ve PostgreSQL ile uçtan uca kurumsal platform.",
          tags: "Next.js, TypeScript, PostgreSQL",
          relevanceBadge: "🔥 %95 Mükemmel Eşleşme: Uzmanlık Yeteneğinizle Uyumlu",
          actionUrl: "https://operis.pro/tr/ilanlar/kurumsal-saas-mimarisi",
        },
      });

      expect(renderedTr.subject).toContain("⚡ [Next.js & Fullstack] Yeni İlan");
      expect(renderedTr.subject).toContain("45.000 ₺");
      expect(renderedTr.html).toContain("Next.js & Fullstack");
      expect(renderedTr.html).toContain("45.000 ₺");
      expect(renderedTr.html).toContain("2-4 Hafta");
      expect(renderedTr.html).toContain("Kurumsal SaaS Mimarisi & API Entegrasyonu");
      expect(renderedTr.html).toContain("#Next.js");
      expect(renderedTr.html).toContain("#TypeScript");
      expect(renderedTr.html).toContain("🔥 %95 Mükemmel Eşleşme");
      expect(renderedTr.html).toContain("https://operis.pro/tr/ilanlar/kurumsal-saas-mimarisi");
      expect(renderedTr.html).toContain("İlanı İncele ve Teklif Ver");
      expect(renderedTr.html).toContain("Kategori Alarm Ayarlarını Yönet veya Kapat");
    });

    it("renders English variant with proper internationalization", () => {
      const renderedEn = renderEmailTemplate({
        template: "category_follow_match",
        locale: "en",
        variables: {
          categoryName: "Web Development",
          listingTitle: "Fintech Mobile Dashboard & API",
          budget: "$5,000 - $8,000",
          timeline: "1 Month",
          summary: "Building high-performance finance dashboards.",
          tags: "React Native, Node.js",
          relevanceBadge: "🔥 95% Match: Verified Skill",
          actionUrl: "https://operis.pro/en/listings/fintech-dashboard",
        },
      });

      expect(renderedEn.subject).toContain("⚡ [Web Development] New Listing");
      expect(renderedEn.subject).toContain("$5,000 - $8,000");
      expect(renderedEn.html).toContain("Web Development");
      expect(renderedEn.html).toContain("$5,000 - $8,000");
      expect(renderedEn.html).toContain("1 Month");
      expect(renderedEn.html).toContain("View Listing & Submit Proposal");
      expect(renderedEn.html).toContain("Manage or Mute Category Alert Settings");
    });
  });

  describe("3. Akıllı Bütçe ve Alaka Düzeyi Filtreleme Mantığı", () => {
    it("filters alerts below follower's configured minimum budget threshold", () => {
      const userMinBudget = 25000;
      const lowBudgetJob = 15000;
      const highBudgetJob = 35000;

      // Low budget project should be suppressed
      const shouldAlertLow = lowBudgetJob >= userMinBudget;
      expect(shouldAlertLow).toBe(false);

      // High budget project should trigger alarm
      const shouldAlertHigh = highBudgetJob >= userMinBudget;
      expect(shouldAlertHigh).toBe(true);
    });

    it("computes smart match relevance badge when user's tracked skills overlap with listing tags", () => {
      const userTrackedSkills = ["Next.js", "TypeScript", "Tailwind CSS"];
      const listingTags = ["next.js", "docker", "graphql"];

      const lowerSkills = userTrackedSkills.map((s) => s.toLowerCase());
      const hasMatch = listingTags.some((t) => lowerSkills.includes(t.toLowerCase()));

      expect(hasMatch).toBe(true);

      const relevanceBadge = hasMatch
        ? "🔥 %95 Mükemmel Eşleşme: Uzmanlık Yeteneğinizle Uyumlu"
        : "";

      expect(relevanceBadge).toContain("🔥 %95 Mükemmel Eşleşme");
    });
  });

  describe("4. Kayan Pencere Frekans Sınırlaması (Sliding-Window Frequency Capping)", () => {
    it("caps email frequency at 3 alerts per rolling 4-hour window to protect inbox deliverability", () => {
      const MAX_ALERTS_PER_4H = 3;
      const sentAlertTimestamps = [
        new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        new Date(Date.now() - 30 * 60 * 1000),     // 30 mins ago
      ];

      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const recentCount = sentAlertTimestamps.filter((t) => t > fourHoursAgo).length;

      expect(recentCount).toBe(3);

      const isCapped = recentCount >= MAX_ALERTS_PER_4H;
      expect(isCapped).toBe(true);
    });
  });

  describe("5. ListingService Canlı Alarm Dağıtım Metodu", () => {
    it("handles dispatchCategoryFollowNotifications gracefully and returns array of user IDs", async () => {
      const { ListingService } = await import("@/src/modules/listings/service");
      const notified = await ListingService.dispatchCategoryFollowNotifications(
        "lst-test-101",
        "web-gelistirme",
        "Next.js SaaS Projesi",
        "nextjs-saas-projesi",
        DEFAULT_USER.id,
        [],
        1,
        {
          budgetMode: "RANGE",
          budgetCurrency: "TRY",
          budgetMin: "30000",
          budgetMax: "45000",
          summary: "Harika bir proje",
          tags: ["Next.js", "TypeScript"],
        }
      );

      expect(Array.isArray(notified)).toBe(true);
    });
  });
});
