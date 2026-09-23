import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  RetainerService,
  inMemoryRetainers,
  inMemoryRetainerPeriods,
} from "@/src/modules/engagements/retainer-service";

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

describe("WP-19 to WP-22: Smart Retainer Remediation Suite", () => {
  const engagementId = "eng-test-remediation-101";
  const freelancerId = "u-freelancer-ret-1";
  const clientId = "u-client-1";

  beforeEach(() => {
    inMemoryRetainers.clear();
    inMemoryRetainerPeriods.clear();
  });

  describe("WP-19: Duplicate Activation Prevention & Idempotency", () => {
    it("prevents double activation and rejects activating an already ACTIVE retainer", async () => {
      // 1. Propose
      await RetainerService.proposeRetainer({
        engagementId,
        requesterUserId: freelancerId,
        planType: "HOURLY_POOL",
        monthlyPrice: 20000,
        currency: "TRY",
        includedHours: 20,
        overageHourlyRate: 1200,
        rolloverPolicy: "MAX_25_PERCENT",
        scopeDescription: "Mobil ve Web mimarisi sürekli bakım desteği",
      });

      // 2. Client activates
      const act1 = await RetainerService.activateRetainer(engagementId, clientId);
      expect(act1.success).toBe(true);
      expect(act1.retainer.status).toBe("ACTIVE");

      // Verify period 1 exists
      const periods1 = inMemoryRetainerPeriods.get(act1.retainer.id) || [];
      expect(periods1).toHaveLength(1);
      expect(periods1[0]?.periodIndex).toBe(1);

      // 3. Second activation attempt must fail
      await expect(
        RetainerService.activateRetainer(engagementId, clientId)
      ).rejects.toThrow("Yalnızca teklif aşamasındaki sözleşmeler onaylanabilir.");

      // Ensure periods list did not duplicate
      const periodsAfter = inMemoryRetainerPeriods.get(act1.retainer.id) || [];
      expect(periodsAfter).toHaveLength(1);
    });

    it("rejects activating a CANCELLED retainer", async () => {
      await RetainerService.proposeRetainer({
        engagementId,
        requesterUserId: freelancerId,
        planType: "FIXED_MAINTENANCE",
        monthlyPrice: 15000,
        scopeDescription: "Altyapı bakımı",
      });

      await RetainerService.activateRetainer(engagementId, clientId);
      await RetainerService.cancelRetainer(engagementId, clientId);

      await expect(
        RetainerService.activateRetainer(engagementId, clientId)
      ).rejects.toThrow("Yalnızca teklif aşamasındaki sözleşmeler onaylanabilir.");
    });
  });

  describe("WP-20: Period Rollover and Unused Hours Rollover", () => {
    it("automatically rolls over expired period and transfers unused hours under MAX_25_PERCENT", async () => {
      // Setup retainer with MAX_25_PERCENT policy (includedHours: 20 -> max rollover: 5 hours)
      await RetainerService.proposeRetainer({
        engagementId,
        requesterUserId: freelancerId,
        planType: "HOURLY_POOL",
        monthlyPrice: 20000,
        currency: "TRY",
        includedHours: 20,
        overageHourlyRate: 1000,
        rolloverPolicy: "MAX_25_PERCENT",
        scopeDescription: "Aylık bakım havuzu",
      });

      const act = await RetainerService.activateRetainer(engagementId, clientId);
      const retainerId = act.retainer.id;

      // Log 10 hours in month 1
      await RetainerService.logHours({
        retainerId,
        engagementId,
        userId: freelancerId,
        hours: 10,
        taskDescription: "Ay 1: API optimizasyonu",
      });

      // Simulate Month 1 expiration by backdating Period 1 endDate to yesterday
      const periods = inMemoryRetainerPeriods.get(retainerId);
      expect(periods).toBeDefined();
      const firstPeriod = periods![0]!;
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const thirtyDaysAgo = new Date(Date.now() - 31 * 86400000).toISOString().slice(0, 10);
      firstPeriod.startDate = thirtyDaysAgo;
      firstPeriod.endDate = yesterday;

      // Log hours now in Month 2: triggers rollover
      const logMonth2 = await RetainerService.logHours({
        retainerId,
        engagementId,
        userId: freelancerId,
        hours: 3,
        taskDescription: "Ay 2: Veritabanı indexleme",
      });

      expect(logMonth2.period.periodIndex).toBe(2);
      expect(logMonth2.period.startDate).toBe(yesterday);
      expect(parseFloat(logMonth2.period.hoursLogged)).toBe(3);

      // Unused in month 1 was (20 - 10) = 10 hours.
      // Max allowed rollover = 20 * 0.25 = 5 hours.
      expect(logMonth2.metrics.rolloverHours).toBe(5);
      expect(logMonth2.metrics.availableHours).toBe(25); // 20 + 5
      expect(logMonth2.metrics.remainingHours).toBe(22); // 25 - 3
    });
  });

  describe("WP-21: Immutable Work Log Records and Atomic Tracking", () => {
    it("persists immutable work log details with user, task, hours, and date", async () => {
      await RetainerService.proposeRetainer({
        engagementId,
        requesterUserId: freelancerId,
        planType: "HOURLY_POOL",
        monthlyPrice: 15000,
        scopeDescription: "Görev logu doğrulama testi",
      });

      const act = await RetainerService.activateRetainer(engagementId, clientId);
      const retainerId = act.retainer.id;

      // Log task 1
      await RetainerService.logHours({
        retainerId,
        engagementId,
        userId: freelancerId,
        hours: 2.5,
        taskDescription: "Sentry hata takibi entegrasyonu",
        date: "2026-09-20",
      });

      // Log task 2
      const log2 = await RetainerService.logHours({
        retainerId,
        engagementId,
        userId: freelancerId,
        hours: 4.0,
        taskDescription: "Redis connection pool ayarları",
        date: "2026-09-21",
      });

      const period = log2.period;
      expect(parseFloat(period.hoursLogged)).toBe(6.5);

      const logs = (period as any).workLogsJson as Array<any>;
      expect(logs).toHaveLength(2);

      expect(logs[0].hours).toBe(2.5);
      expect(logs[0].taskDescription).toBe("Sentry hata takibi entegrasyonu");
      expect(logs[0].date).toBe("2026-09-20");
      expect(logs[0].userId).toBe(freelancerId);

      expect(logs[1].hours).toBe(4.0);
      expect(logs[1].taskDescription).toBe("Redis connection pool ayarları");
      expect(logs[1].date).toBe("2026-09-21");
      expect(logs[1].userId).toBe(freelancerId);
    });
  });

  describe("WP-22: Cancellation Notice Window Enforcement", () => {
    it("calculates effectiveCancellationAt and allows logging hours during notice period but blocks after expiration", async () => {
      await RetainerService.proposeRetainer({
        engagementId,
        requesterUserId: freelancerId,
        planType: "HOURLY_POOL",
        monthlyPrice: 18000,
        cancellationNoticeDays: 15,
        scopeDescription: "İhbar süresi testi",
      });

      const act = await RetainerService.activateRetainer(engagementId, clientId);
      const retainerId = act.retainer.id;

      // Cancel retainer
      const cancelRes = await RetainerService.cancelRetainer(engagementId, clientId);
      expect(cancelRes.success).toBe(true);

      const retainer = inMemoryRetainers.get(engagementId)!;
      expect(retainer.status).toBe("CANCELLED");
      expect(retainer.effectiveCancellationAt).toBeDefined();
      expect(new Date(retainer.effectiveCancellationAt!).getTime()).toBeGreaterThan(Date.now());

      // While within notice period, freelancer can still log hours for the current cycle
      const logWithinNotice = await RetainerService.logHours({
        retainerId,
        engagementId,
        userId: freelancerId,
        hours: 3,
        taskDescription: "İhbar süresi içinde tamamlanan son teslimat",
      });
      expect(logWithinNotice.success).toBe(true);
      expect(parseFloat(logWithinNotice.period.hoursLogged)).toBe(3);

      // Now simulate notice period has expired
      retainer.effectiveCancellationAt = new Date(Date.now() - 3600000); // 1 hour ago

      await expect(
        RetainerService.logHours({
          retainerId,
          engagementId,
          userId: freelancerId,
          hours: 2,
          taskDescription: "İhbar süresi dolduktan sonraki geçersiz kayıt",
        })
      ).rejects.toThrow("Bakım sözleşmesi feshedilmiştir; ihbar süresi veya dönem sonu dolduktan sonra saat kaydedilemez.");
    });
  });
});
