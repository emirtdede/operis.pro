export type ReviewAuthorRole = "EMPLOYER" | "FREELANCER";

export interface ReviewDto {
  id: string;
  engagementId: string;
  authorUserId: string;
  recipientUserId: string;
  authorRole: ReviewAuthorRole;
  overallRating: number;
  communicationRating: number;
  qualityRating: number;
  comment: string;
  tags: string[];
  endorsedSkills: string[];
  isRevealed: boolean;
  revealedAt: Date | null;
  reviewWindowExpiresAt: Date;
  createdAt: Date;
  projectTitleSnapshot?: string;
  authorDisplayName?: string;
  authorHandle?: string;
  authorAvatarUrl?: string | null;
  recipientDisplayName?: string;
  recipientHandle?: string;
  recipientAvatarUrl?: string | null;
}

export interface CreateReviewInput {
  engagementId: string;
  authorUserId: string;
  overallRating: number;
  communicationRating: number;
  qualityRating: number;
  comment: string;
  tags?: string[];
  endorsedSkills?: string[];
}

export interface UserReviewsSummaryDto {
  userId: string;
  receivedReviewsCount: number;
  rawAverageRating: number;
  bayesianScore: number;
  communicationAvg: number;
  qualityAvg: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  receivedReviews: ReviewDto[];
  givenReviewsCount: number;
  generosityIndex: number;
  givenReviews: ReviewDto[];
}

export interface PendingMandatoryReviewDto {
  engagementId: string;
  projectTitle: string;
  counterpartyName: string;
  counterpartyHandle: string;
  counterpartyRole: ReviewAuthorRole;
  completedAt: Date;
  reviewWindowExpiresAt: Date;
  daysRemaining: number;
}

export interface EngagementReviewStatusDto {
  engagementId: string;
  isCompleted: boolean;
  userReviewed: boolean;
  counterpartyReviewed: boolean;
  isRevealed: boolean;
  userReview: ReviewDto | null;
  counterpartyReview: ReviewDto | null;
  reviewWindowExpiresAt: Date | null;
  canReview: boolean;
}
