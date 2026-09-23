import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ListingService,
  inMemoryListings,
} from "@/src/modules/listings/service";
import { GET } from "@/src/app/api/listings/[id]/clone-data/route";
import * as sessionModule from "@/src/modules/auth/session";
import * as rateLimitModule from "@/src/lib/security/rate-limit";

describe("Listing Duplicate & Quick Re-post Engine", () => {
  const OWNER_ID = "11111111-1111-1111-1111-111111111111";
  const STRANGER_ID = "99999999-9999-9999-9999-999999999999";

  const createMockSession = (userId: string, email: string): sessionModule.SessionPayload => ({
    type: "SESSION",
    userId,
    email,
    role: "USER",
    status: "ACTIVE",
    authVersion: 1,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 86400000,
  });

  beforeEach(() => {
    inMemoryListings.length = 0;
    vi.restoreAllMocks();
    vi.spyOn(rateLimitModule, "evaluateSecurityAccessAsync").mockResolvedValue({
      allowed: true,
    } as unknown as Awaited<ReturnType<typeof rateLimitModule.evaluateSecurityAccessAsync>>);
  });

  describe("ListingService.getListingCloneData", () => {
    it("successfully extracts and sanitizes clone data from an owned active listing", async () => {
      const listingId = "listing-clone-001";
      inMemoryListings.push({
        id: listingId,
        ownerUserId: OWNER_ID,
        slug: "nextjs-e-ticaret-sitesi-abc123",
        categoryId: "cat-uuid-001",
        status: "ACTIVE",
        title: "Next.js E-Ticaret Sitesi",
        summary: "Modern headless e-ticaret platformu",
        scope: "### 1. Kapsam\nStripe ve sepet entegrasyonu.",
        tags: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
        budgetMode: "RANGE",
        budgetCurrency: "TRY",
        budgetMin: "25000",
        budgetMax: "45000",
        timelineMode: "DURATION_ESTIMATE",
        targetDate: "2025-01-01", // Past historical date
        timelineValue: 3,
        timelineUnit: "WEEKS",
        activationSeq: 2,
        viewCount: 150,
        clickCount: 45,
        firstPublishedAt: new Date("2025-01-01"),
        lastActivatedAt: new Date("2025-01-10"),
        activeUntil: new Date("2025-01-17"),
        answersJson: {
          projectType: "new_build",
          projectStage: "requirements_ready",
          workPreference: "REMOTE",
          preferredLanguage: "tr",
          customNotes: "Özel tasarım Figma dosyası teslim edilecektir.",
          framework: "Next.js 15",
        },
      });

      const cloneData = await ListingService.getListingCloneData(OWNER_ID, listingId);

      expect(cloneData).toBeDefined();
      expect(cloneData.sourceListingId).toBe(listingId);
      expect(cloneData.sourceTitle).toBe("Next.js E-Ticaret Sitesi");
      expect(cloneData.title).toBe("Next.js E-Ticaret Sitesi");
      expect(cloneData.summary).toBe("Modern headless e-ticaret platformu");
      expect(cloneData.scope).toContain("Stripe ve sepet entegrasyonu.");
      expect(cloneData.tags).toEqual(["Next.js", "React", "TypeScript", "Tailwind CSS"]);
      expect(cloneData.budgetMode).toBe("RANGE");
      expect(cloneData.budgetCurrency).toBe("TRY");
      expect(cloneData.budgetMin).toBe("25000");
      expect(cloneData.budgetMax).toBe("45000");
      expect(cloneData.timelineValue).toBe("3");
      expect(cloneData.timelineUnit).toBe("WEEKS");

      // Critical Invariant: Past targetDate MUST be stripped to null
      expect(cloneData.targetDate).toBeNull();

      // Answers and parsed preferences
      expect(cloneData.projectType).toBe("new_build");
      expect(cloneData.projectStage).toBe("requirements_ready");
      expect(cloneData.workPreference).toBe("REMOTE");
      expect(cloneData.preferredLanguage).toBe("tr");
      expect(cloneData.customNotes).toBe("Özel tasarım Figma dosyası teslim edilecektir.");
      expect(cloneData.answers["framework"]).toBe("Next.js 15");
    });

    it("enforces strict IDOR security: prevents unauthorized users from cloning another owner's listing", async () => {
      const listingId = "listing-private-002";
      inMemoryListings.push({
        id: listingId,
        ownerUserId: OWNER_ID,
        slug: "gizli-proje-xyz999",
        categoryId: "cat-uuid-002",
        status: "ACTIVE",
        title: "Gizli Kurumsal Proje",
        summary: "Özel müşteri projesi",
        scope: "Gizli kapsam detayları",
        tags: ["Backend", "PostgreSQL"],
        budgetMode: "FIXED_EXACT",
        budgetCurrency: "TRY",
        budgetMin: "50000",
        budgetMax: "50000",
        timelineMode: "DURATION_ESTIMATE",
        targetDate: null,
        timelineValue: 4,
        timelineUnit: "WEEKS",
        activationSeq: 1,
        viewCount: 10,
        clickCount: 2,
        firstPublishedAt: new Date(),
        lastActivatedAt: new Date(),
        activeUntil: new Date(),
        answersJson: {},
      });

      // Attempt to clone using STRANGER_ID
      await expect(
        ListingService.getListingCloneData(STRANGER_ID, listingId)
      ).rejects.toThrow("Listing not found or you are not authorized.");
    });

    it("supports cloning from any lifecycle status (INACTIVE_EXPIRED, COMPLETED, MATCHED)", async () => {
      const completedListingId = "listing-completed-003";
      inMemoryListings.push({
        id: completedListingId,
        ownerUserId: OWNER_ID,
        slug: "tamamlanan-mobil-app-111",
        categoryId: "cat-uuid-003",
        status: "COMPLETED", // Successfully completed engagement
        title: "Mobil Uygulama Faz 1",
        summary: "Flutter ile geliştirilen MVP",
        scope: "Faz 1 tamamlandı, Faz 2 için klonlanacak",
        tags: ["Flutter", "Dart", "Firebase"],
        budgetMode: "RANGE",
        budgetCurrency: "TRY",
        budgetMin: "40000",
        budgetMax: "70000",
        timelineMode: "DURATION_ESTIMATE",
        targetDate: null,
        timelineValue: 1,
        timelineUnit: "MONTHS",
        activationSeq: 1,
        viewCount: 300,
        clickCount: 90,
        firstPublishedAt: new Date("2024-06-01"),
        lastActivatedAt: new Date("2024-06-01"),
        activeUntil: new Date("2024-06-08"),
        answersJson: { projectType: "new_build" },
      });

      const cloneData = await ListingService.getListingCloneData(OWNER_ID, completedListingId);
      expect(cloneData).toBeDefined();
      expect(cloneData.title).toBe("Mobil Uygulama Faz 1");
      expect(cloneData.scope).toContain("Faz 2 için klonlanacak");
      expect(cloneData.targetDate).toBeNull();
    });

    it("rejects non-existent or deleted listings", async () => {
      await expect(
        ListingService.getListingCloneData(OWNER_ID, "non-existent-listing-id")
      ).rejects.toThrow("Listing not found or you are not authorized.");
    });
  });

  describe("API Route GET /api/listings/[id]/clone-data", () => {
    it("returns 401 Unauthorized when unauthenticated", async () => {
      vi.spyOn(sessionModule, "getSession").mockResolvedValue(null);

      const req = new Request("http://localhost:3000/api/listings/test-id/clone-data", {
        headers: { "x-locale": "tr" },
      });

      const res = await GET(req, { params: Promise.resolve({ id: "test-id" }) });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Yetkisiz erişim");
    });

    it("returns 403 Forbidden when caller is not the owner", async () => {
      vi.spyOn(sessionModule, "getSession").mockResolvedValue(
        createMockSession(STRANGER_ID, "stranger@example.com")
      );

      inMemoryListings.push({
        id: "owned-by-someone-else",
        ownerUserId: OWNER_ID,
        slug: "baskasinin-ilani",
        categoryId: "cat-1",
        status: "ACTIVE",
        title: "Başkasına Ait İlan",
        summary: "Özet",
        scope: "Kapsam",
        tags: ["React"],
        budgetMode: "RANGE",
        budgetCurrency: "TRY",
        budgetMin: "10000",
        budgetMax: "20000",
        timelineMode: "DURATION_ESTIMATE",
        targetDate: null,
        timelineValue: 2,
        timelineUnit: "WEEKS",
        activationSeq: 1,
        viewCount: 0,
        clickCount: 0,
        firstPublishedAt: new Date(),
        lastActivatedAt: new Date(),
        activeUntil: new Date(),
        answersJson: {},
      });

      const req = new Request("http://localhost:3000/api/listings/owned-by-someone-else/clone-data", {
        headers: { "x-locale": "tr" },
      });

      const res = await GET(req, { params: Promise.resolve({ id: "owned-by-someone-else" }) });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("klonlama yetkiniz yok");
    });

    it("returns 200 OK with sanitized clone data when authorized owner requests clone", async () => {
      vi.spyOn(sessionModule, "getSession").mockResolvedValue(
        createMockSession(OWNER_ID, "owner@example.com")
      );

      const targetId = "valid-owned-listing";
      inMemoryListings.push({
        id: targetId,
        ownerUserId: OWNER_ID,
        slug: "valid-owned-listing-slug",
        categoryId: "cat-web",
        status: "INACTIVE_EXPIRED",
        title: "Klonlanacak İlan",
        summary: "Özet bilgi",
        scope: "Detaylı kapsam maddeleri",
        tags: ["Node.js", "PostgreSQL"],
        budgetMode: "RANGE",
        budgetCurrency: "TRY",
        budgetMin: "30000",
        budgetMax: "60000",
        timelineMode: "DURATION_ESTIMATE",
        targetDate: "2024-01-01",
        timelineValue: 2,
        timelineUnit: "WEEKS",
        activationSeq: 1,
        viewCount: 50,
        clickCount: 12,
        firstPublishedAt: new Date("2024-01-01"),
        lastActivatedAt: new Date("2024-01-01"),
        activeUntil: new Date("2024-01-08"),
        answersJson: {
          projectType: "new_build",
        },
      });

      const req = new Request(`http://localhost:3000/api/listings/${targetId}/clone-data`, {
        headers: { "x-locale": "tr" },
      });

      const res = await GET(req, { params: Promise.resolve({ id: targetId }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.title).toBe("Klonlanacak İlan");
      expect(data.data.targetDate).toBeNull();
      expect(data.data.budgetMin).toBe("30000");
    });
  });
});
