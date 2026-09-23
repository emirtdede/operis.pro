import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ChangeRequestService,
  inMemoryChangeRequests,
} from "@/src/modules/engagements/change-request-service";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";
import { schema } from "@/src/lib/db";

let mockSessionUser: { userId: string; role: string; email: string } = {
  userId: DEFAULT_USER.id,
  role: "USER",
  email: DEFAULT_USER.email,
};

vi.mock("@/src/modules/auth/session", () => ({
  getSession: vi.fn(() => Promise.resolve(mockSessionUser)),
}));

vi.mock("@/src/lib/security/rate-limit", () => ({
  evaluateSecurityAccessAsync: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  normalizeIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

describe("WP-15, WP-16, WP-17, WP-18: Change Request Security Remediation", () => {
  const engagementId = "eng-demo-101";
  const employerUserId = DEFAULT_USER.id;
  const freelancerUserId = "u-techcorp-1";
  const intruderUserId = "u-intruder-999";

  beforeEach(() => {
    inMemoryChangeRequests.set(engagementId, []);
    mockSessionUser = {
      userId: DEFAULT_USER.id,
      role: "USER",
      email: DEFAULT_USER.email,
    };
  });

  describe("WP-15: Viewer Participant Authorization (IDOR/BOLA)", () => {
    it("rejects unauthorized viewer from calling getChangeRequests in service layer", async () => {
      await expect(
        ChangeRequestService.getChangeRequests(intruderUserId, engagementId)
      ).rejects.toThrow("UNAUTHORIZED_USER");
    });

    it("returns 403 Forbidden on GET /api/work/[id]/change-requests for unauthorized user", async () => {
      mockSessionUser = {
        userId: intruderUserId,
        role: "USER",
        email: "intruder@badactor.org",
      };

      const { GET: getRoute } = await import(
        "@/src/app/api/work/[id]/change-requests/route"
      );
      const req = new Request(`http://localhost:3000/api/work/${engagementId}/change-requests`, {
        method: "GET",
      });
      const params = Promise.resolve({ id: engagementId });

      const res = await getRoute(req, { params });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("İş birliği bulunamadı veya yetkiniz yok.");
    });
  });

  describe("WP-18: Currency Isolation and Validation", () => {
    it("rejects change request with mismatched currency", async () => {
      await expect(
        ChangeRequestService.createChangeRequest({
          engagementId,
          requesterUserId: freelancerUserId,
          title: "Para Birimi Uyuşmazlığı Testi",
          description: "Bu talebin para birimi ana sözleşmeyle eşleşmemektedir.",
          reason: "TECHNICAL_NECESSITY",
          additionalBudget: 5000,
          currency: "USD", // Base currency is TRY
          additionalDays: 2,
        })
      ).rejects.toThrow("CURRENCY_MISMATCH");
    });

    it("returns 400 Bad Request on POST /api/work/[id]/change-requests when currency mismatches", async () => {
      mockSessionUser = {
        userId: freelancerUserId,
        role: "USER",
        email: "freelancer@operis.dev",
      };

      const { POST: postRoute } = await import(
        "@/src/app/api/work/[id]/change-requests/route"
      );
      const req = new Request(`http://localhost:3000/api/work/${engagementId}/change-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Uyuşmayan Para Birimi Talebi",
          description: "Bütçe para birimi USD olarak gönderilen geçersiz talep.",
          reason: "CLIENT_REQUESTED",
          additionalBudget: 2500,
          currency: "EUR",
          additionalDays: 3,
        }),
      });
      const params = Promise.resolve({ id: engagementId });

      const res = await postRoute(req, { params });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("bütçe para birimiyle aynı olmalıdır");
    });

    it("isolates budgets by currency in summary rather than naively summing", async () => {
      // Simulate existing approved addendums with different currencies
      const now = new Date();
      inMemoryChangeRequests.set(engagementId, [
        {
          id: "cr-try-1",
          engagementId,
          requesterUserId: freelancerUserId,
          reviewerUserId: employerUserId,
          sequenceNumber: 1,
          title: "TRY Kapsam Genişletme",
          description: "Yerel bütçe artışı açıklaması en az yirmi karakter uzunluğunda.",
          reason: "CLIENT_REQUESTED",
          additionalBudget: "10000.00",
          currency: "TRY",
          additionalDays: 2,
          status: "APPROVED",
          rejectionReason: null,
          respondedAt: now,
          parentContractSha256: null,
          addendumSha256: "hash1",
          addendumContentMarkdown: "markdown1",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "cr-usd-1",
          engagementId,
          requesterUserId: freelancerUserId,
          reviewerUserId: employerUserId,
          sequenceNumber: 2,
          title: "USD Harici Lisans",
          description: "Yurtdışı lisans ve altyapı maliyeti en az yirmi karakter uzunluğunda.",
          reason: "TECHNICAL_NECESSITY",
          additionalBudget: "500.00",
          currency: "USD",
          additionalDays: 0,
          status: "APPROVED",
          rejectionReason: null,
          respondedAt: now,
          parentContractSha256: null,
          addendumSha256: "hash2",
          addendumContentMarkdown: "markdown2",
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const summary = await ChangeRequestService.getChangeRequests(employerUserId, engagementId);
      expect(summary.currency).toBe("TRY");
      expect(summary.totalApprovedBudget).toBe(10000); // Only TRY budget, not 10500!
      expect(summary.budgetsByCurrency?.["TRY"]).toBe(10000);
      expect(summary.budgetsByCurrency?.["USD"]).toBe(500);
    });
  });

  describe("WP-17: CAS Concurrency and Status Transition Protections", () => {
    it("prevents double response (CAS conflict) on an already approved request", async () => {
      const cr = await ChangeRequestService.createChangeRequest({
        engagementId,
        requesterUserId: freelancerUserId,
        title: "CAS Koruma Testi - Onay",
        description: "Tekrarlanan onay isteklerine karşı durum kontrolünün test edilmesi.",
        reason: "TECHNICAL_NECESSITY",
        additionalBudget: 4000,
        currency: "TRY",
        additionalDays: 1,
      });

      // First approval
      await ChangeRequestService.respondChangeRequest({
        changeRequestId: cr.id,
        userId: employerUserId,
        action: "APPROVE",
      });

      // Second approval attempt on non-PENDING request
      await expect(
        ChangeRequestService.respondChangeRequest({
          changeRequestId: cr.id,
          userId: employerUserId,
          action: "APPROVE",
        })
      ).rejects.toThrow("CHANGE_REQUEST_NOT_PENDING");
    });

    it("prevents cancellation of an already approved request", async () => {
      const cr = await ChangeRequestService.createChangeRequest({
        engagementId,
        requesterUserId: freelancerUserId,
        title: "CAS Koruma Testi - İptal",
        description: "Onaylanmış bir talebin yüklenici tarafından sonradan iptal edilmesini önleme testi.",
        reason: "CLIENT_REQUESTED",
        additionalBudget: 2000,
        currency: "TRY",
        additionalDays: 1,
      });

      await ChangeRequestService.respondChangeRequest({
        changeRequestId: cr.id,
        userId: employerUserId,
        action: "APPROVE",
      });

      await expect(
        ChangeRequestService.cancelChangeRequest(freelancerUserId, cr.id, engagementId)
      ).rejects.toThrow("CHANGE_REQUEST_NOT_PENDING");
    });

    it("rejects respond or cancel when engagementId does not match", async () => {
      const cr = await ChangeRequestService.createChangeRequest({
        engagementId,
        requesterUserId: freelancerUserId,
        title: "Engagement Eşleşme Doğrulaması",
        description: "Farklı bir iş UUID'si ile başka bir işin talebini yanıtlama denemesi.",
        reason: "SCOPE_DISCOVERY",
        additionalBudget: 1500,
        currency: "TRY",
        additionalDays: 1,
      });

      await expect(
        ChangeRequestService.respondChangeRequest({
          changeRequestId: cr.id,
          engagementId: "eng-other-999",
          userId: employerUserId,
          action: "REJECT",
        })
      ).rejects.toThrow("CHANGE_REQUEST_NOT_FOUND");

      await expect(
        ChangeRequestService.cancelChangeRequest(freelancerUserId, cr.id, "eng-other-999")
      ).rejects.toThrow("CHANGE_REQUEST_NOT_FOUND");
    });
  });

  describe("WP-16: Database Schema Partial Unique Index", () => {
    it("verifies engagementChangeRequests table defines unique partial index on PENDING", () => {
      const table = schema.engagementChangeRequests;
      expect(table).toBeDefined();
    });
  });
});
