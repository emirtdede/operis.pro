import { cache } from "react";
import {
  type ListingWizardInput,
  type UpdateListingInput,
} from "./wizard/schema";
import {
  ListingCloneService,
  ListingCrudService,
  ListingLifecycleService,
  ListingSearchService,
} from "./services";
import { type ClonedListingData } from "./services/types";

// Re-export all types, in-memory stores, and sub-services for backward compatibility
export * from "./services";

/**
 * ListingService - Facade service delegating domain concerns to specialized sub-services:
 * - ListingCrudService: publishing, updating, deleting, owner retrieval, view/click metrics, revisions
 * - ListingLifecycleService: reactivation, deactivation, automated expiration, radar/category follow notifications
 * - ListingSearchService: full-text multi-criteria search with ranking
 * - ListingCloneService: extracting sanitized template data for re-posting
 */
export class ListingService {
  /**
   * Publishes a new listing inside a database transaction.
   * Enforces 7-day lifecycle: activeUntil = now + 7 days, activationSeq = 1.
   */
  static async publishListing(
    userId: string,
    rawInput: ListingWizardInput
  ): Promise<{ id: string; slug: string }> {
    return ListingCrudService.publishListing(
      userId,
      rawInput,
      ListingService.dispatchRadarNotifications,
      ListingService.dispatchCategoryFollowNotifications
    );
  }

  /**
   * Dispatches notifications to developers whose radar tracked skills match the listing tags.
   */
  static async dispatchRadarNotifications(
    listingId: string,
    title: string,
    slug: string,
    tags: string[],
    ownerUserId: string,
    activationSeq: number = 1
  ): Promise<string[]> {
    return ListingLifecycleService.dispatchRadarNotifications(
      listingId,
      title,
      slug,
      tags,
      ownerUserId,
      activationSeq
    );
  }

  /**
   * Dispatches notifications to users following the category of the published listing.
   */
  static async dispatchCategoryFollowNotifications(
    listingId: string,
    categoryId: string,
    title: string,
    slug: string,
    ownerUserId: string,
    excludeUserIds: string[] = [],
    activationSeq: number = 1,
    budgetDetails?: {
      budgetMode?: string;
      budgetCurrency?: string;
      budgetMin?: string | null;
      budgetMax?: string | null;
      summary?: string | null;
      tags?: string[];
    }
  ): Promise<string[]> {
    return ListingLifecycleService.dispatchCategoryFollowNotifications(
      listingId,
      categoryId,
      title,
      slug,
      ownerUserId,
      excludeUserIds,
      activationSeq,
      budgetDetails
    );
  }

  /**
   * Reactivates an inactive listing for another 7-day window.
   */
  static async reactivateListing(userId: string, listingId: string): Promise<void> {
    return ListingLifecycleService.reactivateListing(
      userId,
      listingId,
      ListingService.dispatchRadarNotifications,
      ListingService.dispatchCategoryFollowNotifications
    );
  }

  /**
   * Retrieves sanitized data from an existing listing owned by the user for duplication / quick repost.
   */
  static async getListingCloneData(userId: string, listingId: string): Promise<ClonedListingData> {
    return ListingCloneService.getListingCloneData(userId, listingId);
  }

  /**
   * Deactivates an active listing manually by owner.
   */
  static async deactivateListing(userId: string, listingId: string): Promise<void> {
    return ListingLifecycleService.deactivateListing(userId, listingId);
  }

  /**
   * Deletes an eligible listing (DRAFT, INACTIVE_EXPIRED, INACTIVE_OWNER).
   */
  static async deleteListing(userId: string, listingId: string): Promise<void> {
    return ListingCrudService.deleteListing(userId, listingId);
  }

  /**
   * Automated background job: Expires all active listings whose activeUntil <= now.
   */
  static async expireListingsJob(referenceTime: Date = new Date()): Promise<number> {
    return ListingLifecycleService.expireListingsJob(referenceTime);
  }

  /**
   * Scans for active listings expiring in the next 24 hours and sends a warning notification.
   */
  static async notifyExpiringListings(referenceTime: Date = new Date()): Promise<number> {
    return ListingLifecycleService.notifyExpiringListings(referenceTime);
  }

  /**
   * Fetches listings owned by a user, filtered by status tab for the dashboard.
   * Wrapped in React.cache() for request-scoped deduplication across layouts and server components.
   */
  static getOwnerListings = cache(async (userId: string, statusTab?: string) => {
    return ListingCrudService.getOwnerListings(userId, statusTab);
  });

  /**
   * Updates an existing listing and records an immutable revision snapshot.
   */
  static async updateListing(
    userId: string,
    listingId: string,
    rawUpdates: UpdateListingInput
  ): Promise<void> {
    return ListingCrudService.updateListing(userId, listingId, rawUpdates);
  }

  /**
   * Increments the view count for a listing atomically.
   */
  static async incrementListingViews(listingId: string): Promise<{ viewCount: number }> {
    return ListingCrudService.incrementListingViews(listingId);
  }

  /**
   * Tracks a click on a listing card atomically.
   */
  static async trackListingClick(listingId: string): Promise<{ clickCount: number }> {
    return ListingCrudService.trackListingClick(listingId);
  }

  /**
   * Full-Text Search for listings across title, summary, and tags with relevance scoring.
   */
  static async searchListingsFullText(
    query: string,
    limit: number = 20,
    options?: {
      viewerUserId?: string;
      locale?: "tr" | "en";
    }
  ) {
    return ListingSearchService.searchListingsFullText(query, limit, options);
  }

  /**
   * Fetches versioned revisions for a listing with permission evaluation.
   */
  static async getListingRevisions(
    viewerUserId: string | null,
    listingId?: string,
    userRole?: string
  ) {
    return ListingCrudService.getListingRevisions(viewerUserId, listingId, userRole);
  }
}
