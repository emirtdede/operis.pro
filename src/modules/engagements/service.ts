import { cache } from "react";
import {
  type CounterpartyContactInfo,
  EngagementLifecycleService,
  EngagementHandoverService,
  EngagementQueryService,
} from "./services";

export type { CounterpartyContactInfo };

export class EngagementService {
  /**
   * Accepts an offer on an active listing.
   * Atomic multi-table state transition:
   * 1. Locks offer and listing rows to prevent race conditions.
   * 2. Verifies user accounts are ACTIVE and offer lifecycle matches listing.
   * 3. Marks selected offer ACCEPTED.
   * 4. Transitions listing to MATCHED.
   * 5. Rejects all other pending offers with REJECTED_OTHER_SELECTED.
   * 6. Creates the engagement record with immutable listing title and category snapshots.
   */
  static async acceptOffer(ownerUserId: string, offerId: string) {
    return EngagementLifecycleService.acceptOffer(ownerUserId, offerId);
  }

  /**
   * Retrieves match details with counterparty contact disclosure.
   * Strictly verifies participant authorization (IDOR protection).
   */
  static async getEngagementDetails(viewerUserId: string, engagementId: string) {
    return EngagementQueryService.getEngagementDetails(viewerUserId, engagementId);
  }

  /**
   * Bilateral mutual completion flow.
   * Both parties must mark complete for engagement to transition to COMPLETED.
   */
  static async markCompletion(
    userId: string,
    engagementId: string,
    status: "MARKED_COMPLETE" | "DISPUTES_COMPLETION"
  ) {
    return EngagementHandoverService.markCompletion(userId, engagementId, status);
  }

  /**
   * Cancels an active engagement.
   * Only participants (owner or freelancer) can cancel an engagement that is not already COMPLETED or CANCELLED.
   */
  static async cancelEngagement(userId: string, engagementId: string, reason?: string) {
    return EngagementLifecycleService.cancelEngagement(userId, engagementId, reason);
  }

  /**
   * T-03: Resolves a DISPUTED engagement by administrative arbitration.
   */
  static async resolveDisputeByAdmin(
    adminUserId: string,
    engagementId: string,
    decision: "FORCE_COMPLETE" | "FORCE_CANCEL",
    notes?: string
  ) {
    return EngagementHandoverService.resolveDisputeByAdmin(
      adminUserId,
      engagementId,
      decision,
      notes
    );
  }

  /**
   * Retrieves all engagements for a user (either as employer or freelancer)
   * with counterparty profiles, listing information, and completion status.
   * Wrapped in React.cache() for request-scoped deduplication across layouts and server components.
   */
  static getUserEngagements = cache(async (
    userId: string,
    options: {
      role?: "all" | "owner" | "freelancer";
      status?: "all" | "active" | "completed" | "cancelled";
      limit?: number;
      offset?: number;
    } = {}
  ) => {
    return EngagementQueryService.getUserEngagements(userId, options);
  });
}
