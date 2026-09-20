export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUserItem {
  id: string;
  email: string;
  displayName: string;
  handle: string;
  role: string;
  status: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  listingsCount: number;
  offersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminListingItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  categoryName: string;
  categoryKey: string;
  ownerDisplayName: string;
  ownerHandle: string;
  ownerUserId: string;
  budgetMode: string;
  budgetFormatted: string;
  activationSeq: number;
  viewCount: number;
  clickCount: number;
  activeUntil: Date | null;
  createdAt: Date;
}

export interface AdminDisputeItem {
  id: string;
  listingId: string;
  listingTitle: string;
  listingSlug?: string | null;
  categoryKey: string;
  status: string;
  matchedAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
  ownerUserId: string;
  ownerDisplayName: string;
  ownerHandle: string;
  ownerMarkStatus: string | null;
  freelancerUserId: string;
  freelancerDisplayName: string;
  freelancerHandle: string;
  freelancerMarkStatus: string | null;
}

export interface AdminOfferItem {
  id: string;
  listingId: string;
  listingTitle: string;
  listingSlug: string;
  senderUserId: string;
  senderDisplayName: string;
  senderHandle: string;
  recipientUserId: string;
  recipientDisplayName: string;
  recipientHandle: string;
  status: string;
  rejectionReasonCode: string | null;
  budgetFormatted: string;
  estimatedDuration: string;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface AdminLogItem {
  id: string;
  category: "auth" | "business" | "audit" | "system";
  level: "INFO" | "WARN" | "ERROR" | "CRITICAL";
  action: string;
  actorId?: string;
  actorEmail?: string;
  targetId?: string;
  safeSummary: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface AdminAbuseItem {
  id: string;
  reporterUserId?: string;
  reporterDisplayName?: string;
  offenderUserId?: string;
  offenderDisplayName?: string;
  targetType: "listing" | "profile" | "offer" | "message" | "general";
  targetId: string;
  reasonCode: string;
  details: string;
  flaggedTerms?: string[];
  status: "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED";
  createdAt: Date;
}

export interface AdminThreatItem {
  id: string;
  threatType:
    | "BRUTE_FORCE"
    | "RATE_LIMIT_DDOS"
    | "INJECTION_PROBE"
    | "UNAUTHORIZED_PATH"
    | "TOKEN_FORGERY";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  sourceIp: string;
  targetEndpoint: string;
  attemptCount: number;
  status: "DETECTED" | "BLOCKED" | "MITIGATED" | "INVESTIGATING";
  riskScore: number;
  lastSeenAt: Date;
}

export const ROLE_HIERARCHY: Record<string, number> = {
  USER: 1,
  MODERATOR: 2,
  ADMIN: 3,
  SECURITY_ADMIN: 4,
};
