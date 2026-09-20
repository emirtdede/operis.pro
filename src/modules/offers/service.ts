import {
  type AcceptCounterOfferInput,
  type BatchSubmitOffersInput,
  type CreateCounterOfferInput,
  type OfferTemplateInput,
  type RejectCounterOfferInput,
  type RejectOfferInput,
  type SubmitOfferInput,
  type UpdateOfferInput,
  type WithdrawCounterOfferInput,
} from "./validation";
import {
  CounterOfferService,
  OfferCreationService,
  OfferLifecycleService,
  OfferQueryService,
  SquadOfferService,
} from "./services";
import {
  type BatchOfferResponse,
  type CounterProposalDto,
  type NegotiationTimelineDto,
  type OfferTemplateDto,
  type ReceivedOfferDto,
  type SentOfferDto,
  type SquadMemberDto,
} from "./services/types";

// Re-export all types, in-memory stores, and services for backward compatibility
export * from "./services/types";
export * from "./services";

/**
 * OfferService - Facade service delegating business logic to modular sub-services:
 * - OfferCreationService: offer submission, idempotency, fraud check
 * - OfferLifecycleService: update, withdraw, auto-cancel, reject
 * - CounterOfferService: counter negotiation FSM, accept, reject, withdraw, timeline
 * - SquadOfferService: squad consortium members, batch offer submissions
 * - OfferQueryService: sent/received offers query, single offer retrieval, templates, revisions
 */
export class OfferService {
  /**
   * Submits a new offer for an active listing.
   */
  static async submitOffer(offerorUserId: string, rawInput: SubmitOfferInput) {
    return OfferCreationService.submitOffer(offerorUserId, rawInput);
  }

  /**
   * Updates an existing offer before acceptance.
   */
  static async updateOffer(offerorUserId: string, rawInput: UpdateOfferInput) {
    return OfferLifecycleService.updateOffer(offerorUserId, rawInput);
  }

  /**
   * Withdraws a pending offer by the offeror.
   */
  static async withdrawOffer(offerorUserId: string, offerId: string) {
    return OfferLifecycleService.withdrawOffer(offerorUserId, offerId);
  }

  /**
   * Auto-cancels an offer that has remained stale/unresolved.
   */
  static async autoCancelStaleOffer(offerId: string) {
    return OfferLifecycleService.autoCancelStaleOffer(offerId);
  }

  /**
   * Rejects an offer by the listing owner.
   */
  static async rejectOffer(listingOwnerUserId: string, rawInput: RejectOfferInput) {
    return OfferLifecycleService.rejectOffer(listingOwnerUserId, rawInput);
  }

  /**
   * Retrieves offers submitted by the current user with listing details.
   */
  static async getSentOffers(
    offerorUserId: string,
    statusFilter?: string
  ): Promise<SentOfferDto[]> {
    return OfferQueryService.getSentOffers(offerorUserId, statusFilter);
  }

  /**
   * Retrieves offers received for a listing owned by the current user.
   */
  static async getReceivedOffers(
    listingOwnerUserId: string,
    listingId?: string
  ): Promise<ReceivedOfferDto[]> {
    return OfferQueryService.getReceivedOffers(listingOwnerUserId, listingId);
  }

  /**
   * Securely gets an offer by ID, verifying viewer permissions.
   */
  static async getOfferById(viewerUserId: string, offerId: string) {
    return OfferQueryService.getOfferById(viewerUserId, offerId);
  }

  /**
   * Retrieves squad consortium members for a specific offer.
   */
  static async getOfferSquadMembers(offerId: string): Promise<SquadMemberDto[]> {
    return SquadOfferService.getOfferSquadMembers(offerId);
  }

  /**
   * Submits batch proposals across multiple listings with envelope response format.
   */
  static async batchSubmitOffers(
    offerorUserId: string,
    rawInput: BatchSubmitOffersInput,
    locale?: string
  ): Promise<BatchOfferResponse> {
    return SquadOfferService.batchSubmitOffers(
      offerorUserId,
      rawInput,
      locale,
      OfferService.submitOffer
    );
  }

  /**
   * Retrieves quick offer templates for a user.
   */
  static getUserOfferTemplates(userId: string, locale?: string): OfferTemplateDto[] {
    return OfferQueryService.getUserOfferTemplates(userId, locale);
  }

  /**
   * Creates or updates a quick offer template for a user.
   */
  static saveOfferTemplate(userId: string, rawInput: OfferTemplateInput): OfferTemplateDto {
    return OfferQueryService.saveOfferTemplate(userId, rawInput);
  }

  /**
   * Deletes a quick offer template for a user.
   */
  static deleteOfferTemplate(userId: string, templateId: string): boolean {
    return OfferQueryService.deleteOfferTemplate(userId, templateId);
  }

  /**
   * Retrieves quick offer templates with database persistence.
   */
  static async getUserOfferTemplatesAsync(
    userId: string,
    locale?: string
  ): Promise<OfferTemplateDto[]> {
    return OfferQueryService.getUserOfferTemplatesAsync(userId, locale);
  }

  /**
   * Saves or updates a quick offer template with database persistence.
   */
  static async saveOfferTemplateAsync(
    userId: string,
    rawInput: OfferTemplateInput
  ): Promise<OfferTemplateDto> {
    return OfferQueryService.saveOfferTemplateAsync(userId, rawInput);
  }

  /**
   * Deletes a quick offer template from database and memory.
   */
  static async deleteOfferTemplateAsync(userId: string, templateId: string): Promise<boolean> {
    return OfferQueryService.deleteOfferTemplateAsync(userId, templateId);
  }

  /**
   * Fetches revision history for a specific offer.
   */
  static async getOfferRevisions(viewerUserIdOrOfferId: string, offerId?: string) {
    return OfferQueryService.getOfferRevisions(viewerUserIdOrOfferId, offerId);
  }

  /**
   * Cleans up expired idempotency keys older than reference time.
   */
  static async cleanupExpiredIdempotencyKeys(referenceTime: Date = new Date()): Promise<number> {
    return OfferCreationService.cleanupExpiredIdempotencyKeys(referenceTime);
  }

  /**
   * Submits a counter offer in a negotiation round.
   */
  static async submitCounterOffer(
    actorUserId: string,
    rawInput: CreateCounterOfferInput
  ): Promise<CounterProposalDto> {
    return CounterOfferService.submitCounterOffer(actorUserId, rawInput);
  }

  /**
   * Accepts a counter offer proposal and transitions offer to ACCEPTED.
   */
  static async acceptCounterOffer(actorUserId: string, rawInput: AcceptCounterOfferInput) {
    return CounterOfferService.acceptCounterOffer(actorUserId, rawInput);
  }

  /**
   * Rejects a counter offer proposal.
   */
  static async rejectCounterOffer(actorUserId: string, rawInput: RejectCounterOfferInput) {
    return CounterOfferService.rejectCounterOffer(actorUserId, rawInput);
  }

  /**
   * Withdraws an active counter offer.
   */
  static async withdrawCounterOffer(actorUserId: string, rawInput: WithdrawCounterOfferInput) {
    return CounterOfferService.withdrawCounterOffer(actorUserId, rawInput);
  }

  /**
   * Retrieves negotiation timeline and status flags for an offer.
   */
  static async getCounterNegotiationTimeline(
    offerId: string,
    viewerUserId: string
  ): Promise<NegotiationTimelineDto> {
    return CounterOfferService.getCounterNegotiationTimeline(offerId, viewerUserId);
  }
}
