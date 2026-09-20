import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ChangeRequestService,
  inMemoryChangeRequests,
} from "@/src/modules/engagements/change-request-service";
import { AddendumGeneratorService } from "@/src/modules/contracts/addendum-generator";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";
import { AddendumGeneratorInput } from "@/src/modules/contracts/types";

vi.mock("@/src/modules/auth/session", () => ({
  getSession: vi.fn().mockResolvedValue({
    userId: DEFAULT_USER.id,
    role: "USER",
    email: DEFAULT_USER.email,
  }),
}));

vi.mock("@/src/lib/security/rate-limit", () => ({
  evaluateSecurityAccessAsync: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  normalizeIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

describe("Scope Shield & Change Request Service (TBK m. 470 / m. 480/2)", () => {
  const engagementId = "eng-demo-101";
  const employerUserId = DEFAULT_USER.id;
  const freelancerUserId = "u-techcorp-1";

  beforeEach(() => {
    // Reset in-memory state before each test
    inMemoryChangeRequests.set(engagementId, []);
  });

  describe("AddendumGeneratorService", () => {
    it("generates canonical TBK m. 470 and m. 480/2 addendum with chained SHA-256 seal", () => {
      const parentSha = "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0";
      const input: AddendumGeneratorInput = {
        engagementId,
        sequenceNumber: 1,
        parentContractRef: "OPR-CONTR-ENGDEMO1",
        parentContractSha256: parentSha,
        listingTitle: "Next.js Kurumsal SaaS Platformu",
        client: {
          displayName: "Ahmet Yılmaz",
          email: "ahmet@techcorp.com",
          role: "CLIENT",
        },
        contractor: {
          displayName: "Demir Yazılım",
          email: "demir@operis.dev",
          role: "CONTRACTOR",
        },
        title: "Stripe Çoklu Para Birimi Entegrasyonu",
        description: "Stripe Checkout, Webhook dinleyicileri ve otomatik fatura oluşturma altyapısı.",
        reason: "CLIENT_REQUESTED",
        additionalBudget: 15000,
        currency: "TRY",
        additionalDays: 5,
        matchedAt: new Date("2026-08-01T10:00:00Z"),
        locale: "tr",
      };

      const result = AddendumGeneratorService.generateAddendum(input);

      expect(result.addendumRef).toBe("OPR-ADDENDUM-ENGDEMO1-01");
      expect(result.sequenceNumber).toBe(1);
      expect(result.parentContractRef).toBe("OPR-CONTR-ENGDEMO1");
      expect(result.parentContractSha256).toBe(parentSha);
      expect(result.addendumSha256).toHaveLength(64);
      expect(result.markdown).toContain("SÖZLEŞME ZEYİLNAMESİ (EK PROTOKOL NO: 01)");
      expect(result.markdown).toContain("TBK m. 470 vd. ve m. 480/2");
      expect(result.markdown).toContain("Stripe Çoklu Para Birimi Entegrasyonu");
      expect(result.markdown).toContain("+15.000,00 TRY");
      expect(result.markdown).toContain("+5 takvim günü");
      expect(result.htmlContent).toContain("<!DOCTYPE html>");
      expect(result.htmlContent).toContain(result.addendumSha256);
    });

    it("supports English locale for international contracts", () => {
      const input: AddendumGeneratorInput = {
        engagementId,
        sequenceNumber: 2,
        parentContractRef: "OPR-CONTR-ENGDEMO1",
        parentContractSha256: "parent-hash-xyz",
        listingTitle: "Global SaaS Architecture",
        client: { displayName: "John Doe", email: "john@example.com", role: "CLIENT" },
        contractor: { displayName: "Jane Dev", email: "jane@example.com", role: "CONTRACTOR" },
        title: "Docker Swarm Deployment",
        description: "Clustering and automated rolling update setup.",
        reason: "TECHNICAL_NECESSITY",
        additionalBudget: 2500,
        currency: "USD",
        additionalDays: 3,
        matchedAt: new Date("2026-08-01T10:00:00Z"),
        locale: "en",
      };

      const result = AddendumGeneratorService.generateAddendum(input);

      expect(result.addendumRef).toBe("OPR-ADDENDUM-ENGDEMO1-02");
      expect(result.markdown).toContain("CONTRACT ADDENDUM (AMENDMENT PROTOCOL NO: 02)");
      expect(result.markdown).toContain("Turkish Code of Obligations (TBK Art. 470");
      expect(result.markdown).toContain("+2,500.00 USD");
    });
  });

  describe("ChangeRequestService Lifecycle", () => {
    it("creates a change request with status PENDING and sequence number 1", async () => {
      const cr = await ChangeRequestService.createChangeRequest({
        engagementId,
        requesterUserId: freelancerUserId,
        title: "Webhook Güvenliği & HMAC Doğrulama",
        description: "Tüm webhook çağrıları için HMAC SHA-256 imza doğrulama kalkanı ve replay saldırı koruması.",
        reason: "TECHNICAL_NECESSITY",
        additionalBudget: 6000,
        currency: "TRY",
        additionalDays: 2,
      });

      expect(cr.id).toBeDefined();
      expect(cr.engagementId).toBe(engagementId);
      expect(cr.requesterUserId).toBe(freelancerUserId);
      expect(cr.reviewerUserId).toBe(employerUserId);
      expect(cr.status).toBe("PENDING");
      expect(cr.sequenceNumber).toBe(1);
      expect(Number(cr.additionalBudget)).toBe(6000);
      expect(cr.additionalDays).toBe(2);

      const summary = await ChangeRequestService.getChangeRequests(freelancerUserId, engagementId);
      expect(summary.pendingRequest?.id).toBe(cr.id);
      expect(summary.totalApprovedBudget).toBe(0);
      expect(summary.totalApprovedDays).toBe(0);
    });

    it("prevents creating a second change request while one is already PENDING", async () => {
      await ChangeRequestService.createChangeRequest({
        engagementId,
        requesterUserId: freelancerUserId,
        title: "İlk Değişiklik Talebi",
        description: "Kapsam açıklaması en az 20 karakter olacak şekilde yazılmıştır.",
        reason: "CLIENT_REQUESTED",
        additionalBudget: 3000,
        currency: "TRY",
        additionalDays: 1,
      });

      await expect(
        ChangeRequestService.createChangeRequest({
          engagementId,
          requesterUserId: employerUserId,
          title: "İkinci Çakışan Talep",
          description: "Bu talep reddedilmeli çünkü halihazırda bekleyen talep var.",
          reason: "SCOPE_DISCOVERY",
          additionalBudget: 5000,
          currency: "TRY",
          additionalDays: 2,
        })
      ).rejects.toThrow("ACTIVE_CHANGE_REQUEST_EXISTS");
    });

    it("prevents the requester from approving their own request", async () => {
      const cr = await ChangeRequestService.createChangeRequest({
        engagementId,
        requesterUserId: freelancerUserId,
        title: "Kendi Talebini Onaylama Denemesi",
        description: "Yüklenici kendi teklif ettiği ek bütçeyi tek taraflı onaylayamaz.",
        reason: "CLIENT_REQUESTED",
        additionalBudget: 10000,
        currency: "TRY",
        additionalDays: 3,
      });

      await expect(
        ChangeRequestService.respondChangeRequest({
          changeRequestId: cr.id,
          userId: freelancerUserId, // Requester attempting to review
          action: "APPROVE",
        })
      ).rejects.toThrow("CANNOT_APPROVE_OWN_REQUEST");
    });

    it("approving a change request executes a legally binding Addendum with SHA-256 seal", async () => {
      const cr = await ChangeRequestService.createChangeRequest({
        engagementId,
        requesterUserId: freelancerUserId,
        title: "Redis Cache Katmanı ve Hızlandırma",
        description: "Sorgu sürelerini 20ms altına çekmek için Redis distributed cache ve TTL yapılandırması.",
        reason: "TECHNICAL_NECESSITY",
        additionalBudget: 8000,
        currency: "TRY",
        additionalDays: 3,
      });

      const approved = await ChangeRequestService.respondChangeRequest({
        changeRequestId: cr.id,
        userId: employerUserId, // Reviewer approving
        action: "APPROVE",
        locale: "tr",
      });

      expect(approved.status).toBe("APPROVED");
      expect(approved.addendumSha256).toHaveLength(64);
      expect(approved.parentContractSha256).toBeDefined();
      expect(approved.addendumContentMarkdown).toContain("SÖZLEŞME ZEYİLNAMESİ (EK PROTOKOL NO: 01)");
      expect(approved.addendumContentMarkdown).toContain("+8.000,00 TRY");
      expect(approved.respondedAt).toBeInstanceOf(Date);

      // Verify summary reflects approved metrics
      const summary = await ChangeRequestService.getChangeRequests(employerUserId, engagementId);
      expect(summary.approvedAddendumsCount).toBe(1);
      expect(summary.totalApprovedBudget).toBe(8000);
      expect(summary.totalApprovedDays).toBe(3);
      expect(summary.pendingRequest).toBeNull();
    });

    it("rejecting a change request marks REJECTED and records the reason", async () => {
      const cr = await ChangeRequestService.createChangeRequest({
        engagementId,
        requesterUserId: freelancerUserId,
        title: "Mobil Uygulama Portu",
        description: "React Native ile iOS ve Android uygulamasının da bu projeye dahil edilmesi talebi.",
        reason: "CLIENT_REQUESTED",
        additionalBudget: 35000,
        currency: "TRY",
        additionalDays: 14,
      });

      const rejected = await ChangeRequestService.respondChangeRequest({
        changeRequestId: cr.id,
        userId: employerUserId,
        action: "REJECT",
        rejectionReason: "Mobil uygulama için ayrı bir ilan açılması daha uygun olacaktır.",
      });

      expect(rejected.status).toBe("REJECTED");
      expect(rejected.rejectionReason).toBe("Mobil uygulama için ayrı bir ilan açılması daha uygun olacaktır.");
      expect(rejected.addendumSha256).toBeNull();

      const summary = await ChangeRequestService.getChangeRequests(employerUserId, engagementId);
      expect(summary.approvedAddendumsCount).toBe(0);
      expect(summary.totalApprovedBudget).toBe(0);
      expect(summary.pendingRequest).toBeNull();
    });

    it("cancelling a change request allows requester to withdraw and re-submit", async () => {
      const cr = await ChangeRequestService.createChangeRequest({
        engagementId,
        requesterUserId: freelancerUserId,
        title: "Yanlışlıkla Açılan Talep",
        description: "Kapsam açıklaması yazıldı ancak parametreler yanlış girildi.",
        reason: "CLIENT_REQUESTED",
        additionalBudget: 1000,
        currency: "TRY",
        additionalDays: 1,
      });

      const cancelled = await ChangeRequestService.cancelChangeRequest(freelancerUserId, cr.id);
      expect(cancelled.status).toBe("CANCELLED");

      // Now a new change request can be submitted without collision
      const newCr = await ChangeRequestService.createChangeRequest({
        engagementId,
        requesterUserId: freelancerUserId,
        title: "Düzeltilmiş Doğru Talep",
        description: "Doğru kapsam açıklaması ve gerçekçi bütçe ile yeniden iletilmiştir.",
        reason: "CLIENT_REQUESTED",
        additionalBudget: 4000,
        currency: "TRY",
        additionalDays: 2,
      });

      expect(newCr.sequenceNumber).toBe(2);
      expect(newCr.status).toBe("PENDING");
    });

    it("aggregates multiple approved addendums cumulatively", async () => {
      // Addendum 1: 5,000 TRY, 2 days
      const cr1 = await ChangeRequestService.createChangeRequest({
        engagementId,
        requesterUserId: freelancerUserId,
        title: "Faz 1 İlave Özellik",
        description: "İlk ilave kapsam detayları madde madde belirtilmiştir.",
        reason: "CLIENT_REQUESTED",
        additionalBudget: 5000,
        currency: "TRY",
        additionalDays: 2,
      });
      await ChangeRequestService.respondChangeRequest({
        changeRequestId: cr1.id,
        userId: employerUserId,
        action: "APPROVE",
      });

      // Addendum 2: 7,500 TRY, 3 days
      const cr2 = await ChangeRequestService.createChangeRequest({
        engagementId,
        requesterUserId: employerUserId,
        title: "Faz 2 İlave Özellik",
        description: "İkinci ilave kapsam detayları madde madde belirtilmiştir.",
        reason: "TECHNICAL_NECESSITY",
        additionalBudget: 7500,
        currency: "TRY",
        additionalDays: 3,
      });
      await ChangeRequestService.respondChangeRequest({
        changeRequestId: cr2.id,
        userId: freelancerUserId,
        action: "APPROVE",
      });

      const summary = await ChangeRequestService.getChangeRequests(freelancerUserId, engagementId);
      expect(summary.approvedAddendumsCount).toBe(2);
      expect(summary.totalApprovedBudget).toBe(12500);
      expect(summary.totalApprovedDays).toBe(5);
      expect(summary.changeRequests).toHaveLength(2);
    });
  });

  describe("Change Request API Routes", () => {
    it("should handle GET /api/work/[id]/change-requests", async () => {
      const { GET: getRoute } = await import("@/src/app/api/work/[id]/change-requests/route");
      const req = new Request(`http://localhost:3000/api/work/${engagementId}/change-requests`);
      const params = Promise.resolve({ id: engagementId });

      const res = await getRoute(req, { params });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.changeRequests).toBeDefined();
    });

    it("should handle POST /api/work/[id]/change-requests", async () => {
      const { POST: postRoute } = await import("@/src/app/api/work/[id]/change-requests/route");
      const req = new Request(`http://localhost:3000/api/work/${engagementId}/change-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "API Üzerinden Değişiklik Talebi",
          description: "API rotası üzerinden oluşturulan kapsam detayı en az 20 karakterdir.",
          reason: "CLIENT_REQUESTED",
          additionalBudget: 4500,
          currency: "TRY",
          additionalDays: 2,
        }),
      });
      const params = Promise.resolve({ id: engagementId });

      const res = await postRoute(req, { params });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.changeRequest).toBeDefined();
      expect(data.changeRequest.status).toBe("PENDING");
      expect(Number(data.changeRequest.additionalBudget)).toBe(4500);
    });

    it("should handle POST /api/work/[id]/change-requests/[crId]/respond with APPROVE", async () => {
      // First create one
      const cr = await ChangeRequestService.createChangeRequest({
        engagementId,
        requesterUserId: freelancerUserId,
        title: "Onay Rota Testi",
        description: "Onaylama rotasını doğrulamak için açılan kapsam açıklaması.",
        reason: "TECHNICAL_NECESSITY",
        additionalBudget: 3000,
        currency: "TRY",
        additionalDays: 1,
      });

      const { POST: respondRoute } = await import(
        "@/src/app/api/work/[id]/change-requests/[crId]/respond/route"
      );
      const req = new Request(
        `http://localhost:3000/api/work/${engagementId}/change-requests/${cr.id}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "APPROVE", locale: "tr" }),
        }
      );
      const params = Promise.resolve({ id: engagementId, crId: cr.id });

      const res = await respondRoute(req, { params });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.changeRequest.status).toBe("APPROVED");
      expect(data.changeRequest.addendumSha256).toBeDefined();
    });

    it("should handle POST /api/work/[id]/change-requests/[crId]/cancel", async () => {
      // Create request where requester is DEFAULT_USER (session user in test)
      const cr = await ChangeRequestService.createChangeRequest({
        engagementId,
        requesterUserId: employerUserId, // DEFAULT_USER
        title: "İptal Rota Testi",
        description: "Kullanıcının kendi talebini iptal edebildiğini test eden açıklama.",
        reason: "SCOPE_DISCOVERY",
        additionalBudget: 2000,
        currency: "TRY",
        additionalDays: 1,
      });

      const { POST: cancelRoute } = await import(
        "@/src/app/api/work/[id]/change-requests/[crId]/cancel/route"
      );
      const req = new Request(
        `http://localhost:3000/api/work/${engagementId}/change-requests/${cr.id}/cancel`,
        {
          method: "POST",
        }
      );
      const params = Promise.resolve({ id: engagementId, crId: cr.id });

      const res = await cancelRoute(req, { params });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.changeRequest.status).toBe("CANCELLED");
    });
  });
});

