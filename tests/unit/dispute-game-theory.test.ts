import { describe, it, expect } from "vitest";
import { ShapleyDisputeSolver } from "@/src/modules/ai/dispute-game-theory";

describe("ShapleyDisputeSolver - Cooperative Game Theory & Axiomatic Fairness", () => {
  it("satisfies the Efficiency Axiom: allocations always sum to 100%", () => {
    const testCases = [
      { contractorClaimPercent: 70, clientClaimPercent: 10 },
      { contractorClaimPercent: 40, clientClaimPercent: 40 },
      { contractorClaimPercent: 15, clientClaimPercent: 65 },
      { contractorClaimPercent: 90, clientClaimPercent: 0 },
      { contractorClaimPercent: 0, clientClaimPercent: 100 },
    ];

    for (const tc of testCases) {
      const res = ShapleyDisputeSolver.solve(tc);
      expect(res.freelancerEntitlementPercent + res.clientRefundPercent).toBe(100);
    }
  });

  it("satisfies the Symmetry Axiom: identical standalone claims receive identical shares", () => {
    const res = ShapleyDisputeSolver.solve({
      contractorClaimPercent: 30,
      clientClaimPercent: 30,
    });

    expect(res.freelancerEntitlementPercent).toBe(50);
    expect(res.clientRefundPercent).toBe(50);
    expect(res.unallocatedSurplusPercent).toBe(40);
  });

  it("allocates 100% to contractor when client has zero counter-claim and contractor delivered full scope", () => {
    const res = ShapleyDisputeSolver.solve({
      contractorClaimPercent: 100,
      clientClaimPercent: 0,
    });

    expect(res.freelancerEntitlementPercent).toBe(100);
    expect(res.clientRefundPercent).toBe(0);
  });

  it("allocates 100% refund to client when contractor performed zero work", () => {
    const res = ShapleyDisputeSolver.solve({
      contractorClaimPercent: 0,
      clientClaimPercent: 100,
    });

    expect(res.freelancerEntitlementPercent).toBe(0);
    expect(res.clientRefundPercent).toBe(100);
  });

  it("generates Turkish and English legal summaries explaining the surplus split", () => {
    const res = ShapleyDisputeSolver.solve({
      contractorClaimPercent: 60,
      clientClaimPercent: 20,
    });

    expect(res.freelancerEntitlementPercent).toBe(70);
    expect(res.clientRefundPercent).toBe(30);
    expect(res.gameTheorySummaryTr).toContain("Kooperatif Oyun Teorisi (Shapley Değeri)");
    expect(res.gameTheorySummaryEn).toContain("Cooperative Game Theory (Shapley Value)");
  });
});
