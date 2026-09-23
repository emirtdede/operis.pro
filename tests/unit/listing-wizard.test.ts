import { describe, it, expect } from "vitest";
import { listingWizardSchema } from "@/src/modules/listings/wizard/schema";

describe("Listing Wizard Schema & Content Quality Rules", () => {
  const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const validListing = {
    categoryId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    tags: ["typescript", "nextjs", "postgresql"],
    title: "Next.js ve PostgreSQL Tabanlı SaaS Uygulaması Geliştirme",
    summary:
      "Modern bir teknoloji platformu için ölçeklenebilir, güvenli ve performanslı web uygulaması geliştirilmesi işi.",
    scope:
      "Bu proje kapsamında Next.js App Router ve TypeScript kullanılarak kurumsal standartlarda bir SaaS platformu inşa edilecektir. " +
      "Kullanıcı yönetimi, oturum güvenliği, PostgreSQL veritabanı şeması ve Drizzle ORM entegrasyonu tamamlanacaktır. " +
      "Arayüz Tailwind CSS ile geliştirilecek ve WCAG 2.2 AA erişilebilirlik standartlarına tam uyumlu olacaktır.",
    projectType: "new_build" as const,
    projectStage: "requirements_ready" as const,
    answers: { webAppType: "saas_webapp" },
    timelineMode: "SPECIFIC_DATE" as const,
    targetDate: futureDate,
    budgetMode: "FIXED_RANGE" as const,
    budgetCurrency: "TRY",
    budgetMin: 30000,
    budgetMax: 50000,
    workPreference: "REMOTE" as const,
    preferredLanguage: "tr" as const,
    noSecretsConfirmed: true as const,
    acceptableUseConfirmed: true as const,
    expiryAcknowledged: true as const,
    matchingRoleAcknowledged: true as const,
  };

  it("accepts a well-formed, compliant listing wizard submission", () => {
    const result = listingWizardSchema.safeParse(validListing);
    expect(result.success).toBe(true);
  });

  it("rejects all-caps title spam (§54 content quality rule)", () => {
    const allCaps = {
      ...validListing,
      title: "ACİL YETİŞMİŞ KIDEMLİ FRONTEND GELİŞTİRİCİ ARANIYOR HEMEN",
    };
    const result = listingWizardSchema.safeParse(allCaps);
    expect(result.success).toBe(false);
  });

  it("rejects title shorter than 20 characters", () => {
    const shortTitle = {
      ...validListing,
      title: "Kısa başlık",
    };
    const result = listingWizardSchema.safeParse(shortTitle);
    expect(result.success).toBe(false);
  });

  it("rejects scope shorter than 200 characters", () => {
    const shortScope = {
      ...validListing,
      scope: "Bu proje çok basittir, hızlıca yapılıp bitirilecektir.",
    };
    const result = listingWizardSchema.safeParse(shortScope);
    expect(result.success).toBe(false);
  });

  it("rejects emojis in title, summary, scope, or tags", () => {
    const withEmojiInTitle = {
      ...validListing,
      title: "Next.js Geliştiricisi Aranıyor 🚀🚀🚀",
    };
    expect(listingWizardSchema.safeParse(withEmojiInTitle).success).toBe(false);

    const withEmojiInTags = {
      ...validListing,
      tags: ["react", "frontend🔥"],
    };
    expect(listingWizardSchema.safeParse(withEmojiInTags).success).toBe(false);
  });

  it("rejects invalid budget ranges where minimum exceeds maximum", () => {
    const invertedBudget = {
      ...validListing,
      budgetMin: 50000,
      budgetMax: 20000,
    };
    expect(listingWizardSchema.safeParse(invertedBudget).success).toBe(false);
  });

  it("rejects target dates in the past", () => {
    const pastDate = {
      ...validListing,
      targetDate: "2020-01-01",
    };
    expect(listingWizardSchema.safeParse(pastDate).success).toBe(false);
  });

  it("rejects submission if required review confirmations are missing", () => {
    const missingConfirmation = {
      ...validListing,
      expiryAcknowledged: false,
    };
    expect(listingWizardSchema.safeParse(missingConfirmation).success).toBe(false);
  });
});

describe("Sector and Category Cascading & Search Logic", () => {
  it("verifies all sectors in SEED_SECTORS have valid keys and translations", async () => {
    const { SEED_SECTORS } = await import("@/db/seeds/categories");
    expect(SEED_SECTORS.length).toBeGreaterThanOrEqual(10);
    for (const s of SEED_SECTORS) {
      expect(s.key).toMatch(/^sector-/);
      expect(s.translations.tr.name).toBeDefined();
      expect(s.translations.en.name).toBeDefined();
    }
  });

  it("filters categories accurately when a sector is selected", async () => {
    const { SEED_CATEGORIES } = await import("@/db/seeds/categories");
    const softwareCats = SEED_CATEGORIES.filter((c) => c.sectorKey === "sector-software-it");
    expect(softwareCats.length).toBeGreaterThan(0);
    expect(softwareCats.some((c) => c.key === "web-development")).toBe(true);

    const aiCats = SEED_CATEGORIES.filter((c) => c.sectorKey === "sector-ai-data");
    expect(aiCats.length).toBeGreaterThan(0);
    expect(aiCats.some((c) => c.key === "web-development")).toBe(false);
  });

  it("normalizes Turkish characters correctly for fast type-ahead search", () => {
    function normalizeTurkish(text: string): string {
      return text
        .replace(/İ/g, "i")
        .replace(/I/g, "i")
        .replace(/ı/g, "i")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    }

    const sectorName = "Yazılım ve Bilişim Teknolojileri";
    const query1 = "yazilim";
    const query2 = "bilisim";
    const query3 = "YAZILIM";

    expect(normalizeTurkish(sectorName).includes(normalizeTurkish(query1))).toBe(true);
    expect(normalizeTurkish(sectorName).includes(normalizeTurkish(query2))).toBe(true);
    expect(normalizeTurkish(sectorName).includes(normalizeTurkish(query3))).toBe(true);

    const aiSectorName = "Yapay Zeka, Veri ve Otomasyon";
    expect(normalizeTurkish(aiSectorName).includes(normalizeTurkish("yapay"))).toBe(true);
    expect(normalizeTurkish(aiSectorName).includes(normalizeTurkish("otomasyon"))).toBe(true);
  });
});

