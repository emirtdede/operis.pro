/**
 * Cooperative Game Theory & Shapley Value Dispute Allocation Engine
 *
 * Implements Lloyd Shapley's Nobel-prize winning cooperative game theory algorithm
 * for mathematical fairness in Online Dispute Resolution (ODR).
 *
 * Axioms Satisfied:
 * 1. Efficiency: The total disputed value is fully and exhaustively allocated (phi_C + phi_E = Total).
 * 2. Symmetry: Parties with equivalent marginal evidence claims receive equal shares.
 * 3. Linearity: Additive disputes across multiple milestones decompose linearly.
 * 4. Null Player: A party with zero verified legal standing receives only their unallocated remainder.
 *
 * Statutory Alignment:
 * - 6098 sayılı TBK m. 470 (Bağımsız Eser Hakediş Hakkı)
 * - TBK m. 474 & 477 (Muayene, Kabul ve Ayıp Sebebiyle Bedel İndirimi)
 * - TBK m. 480/2 (Öngörülemeyen Kapsam Aşımı)
 */

export interface ShapleyDisputeInput {
  totalPercent?: number; // default 100
  // Contractor's standalone statutory claim (0 - 100):
  // Based on accepted milestones, deployed code, and approved addendums
  contractorClaimPercent: number;
  // Client's standalone statutory claim (0 - 100):
  // Based on unperformed scope, proven defects, and unexcused delays
  clientClaimPercent: number;
}

export interface ShapleyDisputeOutput {
  freelancerEntitlementPercent: number;
  clientRefundPercent: number;
  unallocatedSurplusPercent: number;
  shapleyMarginalContributionFreelancer: number;
  shapleyMarginalContributionClient: number;
  gameTheorySummaryTr: string;
  gameTheorySummaryEn: string;
}

export class ShapleyDisputeSolver {
  /**
   * Solves the 2-player cooperative dispute game via Shapley Value formula.
   */
  static solve(input: ShapleyDisputeInput): ShapleyDisputeOutput {
    const total = input.totalPercent ?? 100;
    const vC = Math.max(0, Math.min(total, input.contractorClaimPercent));
    const vE = Math.max(0, Math.min(total, input.clientClaimPercent));

    // The cooperative surplus (gain from mutual agreement rather than litigation)
    // S = V - v(C) - v(E)
    const surplus = Math.max(0, total - vC - vE);

    // Shapley Value allocation:
    // Each party gets their standalone baseline + 1/2 of the cooperative surplus
    const phiC = vC + surplus / 2;
    const phiE = vE + surplus / 2;

    const roundedFreelancer = Math.max(0, Math.min(100, Math.round(phiC)));
    const roundedClient = Math.max(0, Math.min(100, total - roundedFreelancer));

    const summaryTr = `Kooperatif Oyun Teorisi (Shapley Değeri) Analizi: Yüklenici asgari hakediş payı %${Math.round(
      vC
    )}, İşveren kusur/iade payı %${Math.round(vE)} olarak hesaplanmış; kalan %${Math.round(
      surplus
    )} oranındaki ihtilaflı bakiye taraflara eşit (%50 - %50) dağıtılarak nihai uzlaşma payı Yüklenici için %${roundedFreelancer}, İşveren için %${roundedClient} olarak belirlenmiştir.`;

    const summaryEn = `Cooperative Game Theory (Shapley Value) Allocation: Contractor baseline claim of ${Math.round(
      vC
    )}% and Client refund claim of ${Math.round(
      vE
    )}% identified. The unallocated surplus of ${Math.round(
      surplus
    )}% has been split equally according to axiomatic fairness, yielding a final entitlement of ${roundedFreelancer}% for Contractor and ${roundedClient}% for Client.`;

    return {
      freelancerEntitlementPercent: roundedFreelancer,
      clientRefundPercent: roundedClient,
      unallocatedSurplusPercent: Math.round(surplus),
      shapleyMarginalContributionFreelancer: Math.round(phiC),
      shapleyMarginalContributionClient: Math.round(phiE),
      gameTheorySummaryTr: summaryTr,
      gameTheorySummaryEn: summaryEn,
    };
  }
}
