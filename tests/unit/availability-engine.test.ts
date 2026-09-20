import { describe, it, expect } from "vitest";
import { resolveDynamicAvailability } from "@/src/modules/profiles/service";

describe("Dynamic Availability & Workload Status Engine", () => {
  it("defaults to AVAILABLE_NOW with 40 hours/week when fields are omitted", () => {
    const res = resolveDynamicAvailability({});

    expect(res.effectiveStatus).toBe("AVAILABLE_NOW");
    expect(res.hoursPerWeek).toBe(40);
    expect(res.availableFromDate).toBeNull();
    expect(res.notice).toBeNull();
    expect(res.isStale).toBe(false);
  });

  it("retains PARTIALLY_AVAILABLE with specified weekly hours", () => {
    const res = resolveDynamicAvailability({
      status: "PARTIALLY_AVAILABLE",
      hoursPerWeek: 15,
      notice: "Hafta sonları ve akşamları müsaitim",
      updatedAt: new Date(),
    });

    expect(res.effectiveStatus).toBe("PARTIALLY_AVAILABLE");
    expect(res.hoursPerWeek).toBe(15);
    expect(res.notice).toBe("Hafta sonları ve akşamları müsaitim");
    expect(res.isStale).toBe(false);
  });

  it("remains BUSY when availableFromDate is in the future", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14); // 14 days from now

    const res = resolveDynamicAvailability({
      status: "BUSY",
      availableFromDate: futureDate,
      hoursPerWeek: 0,
      updatedAt: new Date(),
    });

    expect(res.effectiveStatus).toBe("BUSY");
    expect(res.availableFromDate).toBe(futureDate.toISOString().slice(0, 10));
  });

  it("auto-elevates to AVAILABLE_NOW when availableFromDate has passed (time-decay transition)", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3); // 3 days ago

    const res = resolveDynamicAvailability({
      status: "BUSY",
      availableFromDate: pastDate,
      hoursPerWeek: 35,
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });

    // Auto-decay rule: Expired BUSY status dynamically reports AVAILABLE_NOW
    expect(res.effectiveStatus).toBe("AVAILABLE_NOW");
    expect(res.hoursPerWeek).toBe(35);
  });

  it("auto-elevates to AVAILABLE_NOW when availableFromDate is today", () => {
    const today = new Date();

    const res = resolveDynamicAvailability({
      status: "BUSY",
      availableFromDate: today,
      hoursPerWeek: 40,
    });

    expect(res.effectiveStatus).toBe("AVAILABLE_NOW");
  });

  it("detects stale availability status when updatedAt is older than 45 days", () => {
    const fiftyDaysAgo = new Date(Date.now() - 50 * 24 * 60 * 60 * 1000);

    const res = resolveDynamicAvailability({
      status: "AVAILABLE_NOW",
      hoursPerWeek: 40,
      updatedAt: fiftyDaysAgo,
    });

    expect(res.isStale).toBe(true);
  });

  it("reports not stale when updatedAt is recent (e.g. 10 days ago)", () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

    const res = resolveDynamicAvailability({
      status: "AVAILABLE_NOW",
      hoursPerWeek: 40,
      updatedAt: tenDaysAgo,
    });

    expect(res.isStale).toBe(false);
  });

  it("handles string date format for availableFromDate properly", () => {
    const dateStr = "2026-11-20";

    const res = resolveDynamicAvailability({
      status: "BUSY",
      availableFromDate: dateStr,
    });

    expect(res.availableFromDate).toBe("2026-11-20");
    // If future date, stays BUSY
    const isFuture = new Date(dateStr).getTime() > Date.now();
    expect(res.effectiveStatus).toBe(isFuture ? "BUSY" : "AVAILABLE_NOW");
  });
});
