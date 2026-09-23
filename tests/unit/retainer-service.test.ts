import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  RetainerService,
  inMemoryRetainers,
  inMemoryRetainerPeriods,
} from "@/src/modules/engagements/retainer-service";
import { GET as retainerGetHandler, POST as retainerPostHandler } from "@/src/app/api/work/[id]/retainer/route";
import { POST as logHoursPostHandler } from "@/src/app/api/work/[id]/retainer/log/route";

vi.mock("@/src/modules/auth/session", () => ({
  getSession: vi.fn().mockResolvedValue({
    userId: "u-freelancer-ret-1",
    role: "SPECIALIST",
    email: "freelancer@operis.pro",
    status: "ACTIVE",
  }),
}));

vi.mock("@/src/lib/security/rate-limit", () => ({
  evaluateSecurityAccessAsync: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  normalizeIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

describe("🔄 Smart Retainer & Recurring Maintenance Agreement Suite (TBK m. 502 / m. 470)", () => {
  beforeEach(() => {
    inMemoryRetainers.clear();
    inMemoryRetainerPeriods.clear();
  });

  describe("1. SLA Specifications & Response Times", () => {
    it("should return standard business hours SLA commitments", () => {
      const sla = RetainerService.getSlaDetails("STANDARD");
      expect(sla.tier).toBe("STANDARD");
      expect(sla.p1CriticalResponseHours).toBe(4);
      expect(sla.p2MajorResponseHours).toBe(24);
      expect(sla.p3MinorResponseDays).toBe(3);
      expect(sla.supportHoursTr).toContain("09:00 - 18:00");
    });

    it("should return 24/7 priority enterprise SLA commitments", () => {
      const sla = RetainerService.getSlaDetails("ENTERPRISE");
      expect(sla.tier).toBe("ENTERPRISE");
      expect(sla.p1CriticalResponseHours).toBe(1);
      expect(sla.p2MajorResponseHours).toBe(8);
      expect(sla.p3MinorResponseDays).toBe(1);
      expect(sla.supportHoursTr).toContain("24 Saat");
    });
  });

  describe("2. Rollover & Overage Mathematics", () => {
    it("should enforce 'Use it or lose it' (NO_ROLLOVER) policy with 0 rollover hours", () => {
      const metrics = RetainerService.calculatePeriodMetrics({
        planType: "HOURLY_POOL",
        monthlyPrice: 15000,
        currency: "TRY",
        includedHours: 20,
        overageHourlyRate: 1000,
        rolloverPolicy: "NO_ROLLOVER",
        hoursLogged: 12,
        previousUnusedHours: 8,
      });

      expect(metrics.rolloverHours).toBe(0);
      expect(metrics.availableHours).toBe(20);
      expect(metrics.remainingHours).toBe(8);
      expect(metrics.overageHours).toBe(0);
      expect(metrics.totalAmount).toBe(15000);
    });

    it("should cap rollover at 25% of included hours under MAX_25_PERCENT policy", () => {
      const metrics = RetainerService.calculatePeriodMetrics({
        planType: "HOURLY_POOL",
        monthlyPrice: 20000,
        currency: "TRY",
        includedHours: 20, // 25% cap = 5 hours
        overageHourlyRate: 1200,
        rolloverPolicy: "MAX_25_PERCENT",
        hoursLogged: 10,
        previousUnusedHours: 12, // More than 5 hours unused, should be capped at 5
      });

      expect(metrics.rolloverHours).toBe(5);
      expect(metrics.availableHours).toBe(25); // 20 + 5
      expect(metrics.remainingHours).toBe(15);
      expect(metrics.overageHours).toBe(0);
    });

    it("should accurately bill overage hours with hourly surcharge", () => {
      const metrics = RetainerService.calculatePeriodMetrics({
        planType: "HOURLY_POOL",
        monthlyPrice: 10000,
        currency: "TRY",
        includedHours: 10,
        overageHourlyRate: 1500,
        rolloverPolicy: "NO_ROLLOVER",
        hoursLogged: 14, // 4 hours overage
      });

      expect(metrics.availableHours).toBe(10);
      expect(metrics.remainingHours).toBe(0);
      expect(metrics.overageHours).toBe(4);
      expect(metrics.overagePrice).toBe(6000); // 4 * 1500
      expect(metrics.totalAmount).toBe(16000); // 10000 + 6000
    });

    it("should calculate exact GVK m. 94/2-b stopaj and KDV tax breakdown on total period bill", () => {
      const metrics = RetainerService.calculatePeriodMetrics({
        planType: "HOURLY_POOL",
        monthlyPrice: 50000,
        currency: "TRY",
        includedHours: 25,
        overageHourlyRate: 2000,
        rolloverPolicy: "NO_ROLLOVER",
        hoursLogged: 25,
      });

      expect(metrics.totalAmount).toBe(50000);
      expect(metrics.taxDetails.grossAmount).toBe(50000);
      expect(metrics.taxDetails.withholdingAmount).toBe(10000); // %20 stopaj
      expect(metrics.taxDetails.netTakeHome).toBe(40000); // %80 net
      expect(metrics.taxDetails.vatTotalAmount).toBe(10000); // %20 KDV
      expect(metrics.taxDetails.totalCashToFreelancer).toBe(50000); // Net + KDV
    });
  });

  describe("3. Legal Contract Generation & HMK m. 193 Seal", () => {
    it("should generate TBK m. 502 / m. 470 contract with independent contractor status and 64-char SHA-256 seal", () => {
      const { markdown, sha256Seal } = RetainerService.generateRetainerContractMarkdown({
        engagementId: "eng-test-contract",
        contractorName: "Ahmet Yılmaz",
        clientName: "TechCorp A.Ş.",
        planType: "HOURLY_POOL",
        monthlyPrice: 25000,
        currency: "TRY",
        includedHours: 20,
        overageHourlyRate: 1500,
        rolloverPolicy: "NO_ROLLOVER",
        slaTier: "STANDARD",
        scopeDescription: "Next.js ve PostgreSQL altyapı bakımı",
        cancellationNoticeDays: 15,
      });

      expect(markdown).toContain("TBK m. 502 / m. 470");
      expect(markdown).toContain("4857 sayılı İş Kanunu kapsamında bir iş/hizmet akdi doğurmadığını");
      expect(markdown).toContain("HMK m. 193");
      expect(markdown).toContain("25.000 TRY / Ay");
      expect(sha256Seal).toHaveLength(64);
    });
  });

  describe("4. Lifecycle Management & In-Memory State", () => {
    it("should handle complete flow: propose -> activate -> log hours -> cancel", async () => {
      const engagementId = "eng-test-lifecycle-1";

      // 1. Propose
      const prop = await RetainerService.proposeRetainer({
        engagementId,
        requesterUserId: "u-freelancer-ret-1",
        planType: "HOURLY_POOL",
        monthlyPrice: 18000,
        currency: "TRY",
        includedHours: 15,
        overageHourlyRate: 1200,
        scopeDescription: "Sunucu izleme ve API entegrasyon desteği",
      });

      expect(prop.success).toBe(true);
      expect(prop.retainer.status).toBe("PROPOSED");

      // 2. Activate
      const act = await RetainerService.activateRetainer(engagementId, "u-client-1");
      expect(act.success).toBe(true);
      expect(act.retainer.status).toBe("ACTIVE");
      expect(act.sha256Seal).toBeDefined();

      // 3. Log hours
      const log = await RetainerService.logHours({
        retainerId: act.retainer.id,
        userId: "u-freelancer-ret-1",
        hours: 5,
        taskDescription: "Docker container optimizasyonu tamamlandı.",
      });
      expect(log.success).toBe(true);
      expect(parseFloat(log.period.hoursLogged)).toBe(5);

      // 4. Cancel
      const cancel = await RetainerService.cancelRetainer(engagementId, "u-client-1");
      expect(cancel.success).toBe(true);
      const details = await RetainerService.getRetainerDetails(engagementId, "u-freelancer-ret-1");
      expect(details.retainer?.status).toBe("CANCELLED");
    });
  });

  describe("5. REST API Route Handlers", () => {
    it("should validate and reject non-positive monthlyPrice", async () => {
      const req = new NextRequest("http://localhost:3000/api/work/eng-test-api/retainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PROPOSE",
          monthlyPrice: 0,
          scopeDescription: "Valid description but invalid price",
        }),
      });

      const res = await retainerPostHandler(req, {
        params: Promise.resolve({ id: "eng-test-api" }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Aylık ücret sıfırdan büyük olmalıdır");
    });

    it("should successfully propose and fetch retainer via REST endpoints", async () => {
      const engagementId = "eng-test-api-2";

      // Propose via POST
      const postReq = new NextRequest(`http://localhost:3000/api/work/${engagementId}/retainer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PROPOSE",
          planType: "HOURLY_POOL",
          monthlyPrice: 20000,
          currency: "TRY",
          includedHours: 20,
          scopeDescription: "Post-release bugfixing and database indexing",
        }),
      });
      const postRes = await retainerPostHandler(postReq, {
        params: Promise.resolve({ id: engagementId }),
      });
      expect(postRes.status).toBe(200);

      // Fetch via GET
      const getReq = new NextRequest(`http://localhost:3000/api/work/${engagementId}/retainer`);
      const getRes = await retainerGetHandler(getReq, {
        params: Promise.resolve({ id: engagementId }),
      });
      expect(getRes.status).toBe(200);
      const data = await getRes.json();
      expect(data.retainer).toBeDefined();
      expect(data.retainer.status).toBe("PROPOSED");
      expect(parseFloat(data.retainer.monthlyPrice)).toBe(20000);
    });

    it("should validate hours and reject empty task descriptions in /api/work/[id]/retainer/log", async () => {
      const req = new NextRequest("http://localhost:3000/api/work/eng-test-api-2/retainer/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          retainerId: "ret-123",
          hours: -2,
          taskDescription: "",
        }),
      });

      const res = await logHoursPostHandler(req, {
        params: Promise.resolve({ id: "eng-test-api-2" }),
      });
      expect(res.status).toBe(400);
    });
  });
});
