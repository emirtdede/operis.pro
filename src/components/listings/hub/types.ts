import type { FeedListingItem } from "@/src/modules/listings/feed/service";
import type { CategoryDto } from "@/src/modules/categories/service";
import type { AvailabilityStatus } from "@/src/modules/profiles/services/availability.service";

export interface CurrentUserProfileBrief {
  userId: string;
  displayName: string;
  handle: string;
  headline?: string | null;
  avatarUrl?: string | null;
  availabilityStatus: AvailabilityStatus;
  isAvailableForHire: boolean;
  isActivelyHiring: boolean;
  isCompanyVerified: boolean;
  roles?: string[];
  trackedSkills?: string[];
}

export interface UnifiedListingsHubProps {
  initialItems: FeedListingItem[];
  initialCursor: string | null;
  initialHasMore: boolean;
  initialMode: "following" | "all";
  initialView: "stream" | "catalog";
  categorySlug?: string;
  searchQuery?: string;
  categories: CategoryDto[];
  hasFollowedCategories?: boolean;
  locale: string;
  isAuthenticated: boolean;
  basePath: string;
  currentUserProfile?: CurrentUserProfileBrief | null;
}

export interface QuickOfferTarget {
  id: string;
  slug: string;
  title: string;
  categoryName: string;
  budgetMin: string | null;
  budgetMax: string | null;
  budgetCurrency: string | null;
  ownerDisplayName: string;
}

export interface FullModalListing {
  id: string;
  title: string;
}

export interface TrendingTagItem {
  tag: string;
  count: number;
  category: string;
}

export function getTrendTagBadgeLabel(idx: number, isTr: boolean): string {
  if (idx === 0) {
    return isTr ? "Trend" : "Trending";
  }
  if (idx === 1) {
    return isTr ? "Popüler" : "Popular";
  }
  return isTr ? "Talep Yüksek" : "High Demand";
}
