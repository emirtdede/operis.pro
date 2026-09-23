import { cache } from "react";
import { and, eq, inArray, ne, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { NotificationService } from "@/src/modules/notifications/service";
import { CategoryService } from "@/src/modules/categories/service";
import { inMemoryListings } from "@/src/modules/listings/services/types";
import { inMemoryReceivedOffers, inMemorySentOffers } from "@/src/modules/offers/service";

export interface DashboardTabCounts {
  listings: number;
  savedListings: number;
  activeEngagements: number;
  sentOffers: number;
  receivedOffers: number;
  notifications: number;
  categories: number;
}

export class DashboardCountsService {
  /**
   * Retrieves aggregate count metrics for all dashboard tabs in parallel.
   * Performs lightweight, index-accelerated COUNT(*) queries instead of fetching full entity rows.
   * Wrapped in React.cache() for automatic request-scoped deduplication across layout and child pages.
   */
  static getTabCounts = cache(async (userId: string): Promise<DashboardTabCounts> => {
    let db;
    try {
      db = getDb();
    } catch {
      return DashboardCountsService.getFallbackCounts(userId);
    }

    const [
      listingsRes,
      savedRes,
      engagementsRes,
      sentOffersRes,
      receivedOffersRes,
      unreadNotifications,
      followedCategories,
    ] = await Promise.allSettled([
      // 1. Listings count (owner, non-deleted)
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.listings)
        .where(and(eq(schema.listings.ownerUserId, userId), ne(schema.listings.status, "DELETED"))),

      // 2. Saved listings count
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.savedListings)
        .where(eq(schema.savedListings.userId, userId)),

      // 3. Active engagements count (MATCHED or COMPLETION_PENDING)
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.engagements)
        .where(
          and(
            or(
              eq(schema.engagements.ownerUserId, userId),
              eq(schema.engagements.freelancerUserId, userId)
            ),
            inArray(schema.engagements.status, ["MATCHED", "COMPLETION_PENDING"])
          )
        ),

      // 4. Sent offers count
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.offers)
        .where(eq(schema.offers.offerorUserId, userId)),

      // 5. Received offers count (offers on user's non-deleted listings)
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.offers)
        .innerJoin(schema.listings, eq(schema.offers.listingId, schema.listings.id))
        .where(
          and(
            eq(schema.listings.ownerUserId, userId),
            ne(schema.listings.status, "DELETED")
          )
        ),

      // 6. Unread notifications count
      NotificationService.getUnreadCount(userId),

      // 7. Followed categories count
      CategoryService.getFollowedCount(userId),
    ]);

    const counts: DashboardTabCounts = {
      listings:
        listingsRes.status === "fulfilled" && listingsRes.value[0]
          ? Number(listingsRes.value[0].count)
          : inMemoryListings.filter((l) => l.ownerUserId === userId && l.status !== "DELETED").length,
      savedListings:
        savedRes.status === "fulfilled" && savedRes.value[0]
          ? Number(savedRes.value[0].count)
          : 0,
      activeEngagements:
        engagementsRes.status === "fulfilled" && engagementsRes.value[0]
          ? Number(engagementsRes.value[0].count)
          : 0,
      sentOffers:
        sentOffersRes.status === "fulfilled" && sentOffersRes.value[0]
          ? Number(sentOffersRes.value[0].count)
          : inMemorySentOffers.filter((o) => o.offer.offerorUserId === userId).length,
      receivedOffers:
        receivedOffersRes.status === "fulfilled" && receivedOffersRes.value[0]
          ? Number(receivedOffersRes.value[0].count)
          : inMemoryReceivedOffers.filter((o) => o.listing.ownerUserId === userId).length,
      notifications:
        unreadNotifications.status === "fulfilled" ? Number(unreadNotifications.value) : 0,
      categories:
        followedCategories.status === "fulfilled" ? Number(followedCategories.value) : 0,
    };

    return counts;
  });

  private static getFallbackCounts(userId: string): DashboardTabCounts {
    return {
      listings: inMemoryListings.filter((l) => l.ownerUserId === userId && l.status !== "DELETED").length,
      savedListings: 0,
      activeEngagements: 0,
      sentOffers: inMemorySentOffers.filter((o) => o.offer.offerorUserId === userId).length,
      receivedOffers: inMemoryReceivedOffers.filter((o) => o.listing.ownerUserId === userId).length,
      notifications: 0,
      categories: 0,
    };
  }
}
