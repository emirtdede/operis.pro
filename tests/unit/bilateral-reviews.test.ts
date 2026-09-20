import { describe, it, expect } from "vitest";
import { ReviewService } from "@/src/modules/reviews/service";
import {
  calculateBayesianRating,
  calculateRawAverage,
  calculateRatingDistribution,
  calculateGenerosityIndex,
} from "@/src/modules/reviews/bayesian";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";

describe("Bilateral Review System (Çift Taraflı Puanlama & Yorum)", () => {
  describe("Bayesian Smoothed Rating Algorithm & Generosity Index", () => {
    it("returns 0 Bayesian rating when no reviews exist (v = 0)", () => {
      const bayesian = calculateBayesianRating([]);
      expect(bayesian).toBe(0);
    });

    it("dampens single extreme reviews (v = 1) using prior confidence (m = 3, C = 4.5)", () => {
      // Single 5-star review: (1 * 5 + 3 * 4.5) / (1 + 3) = (5 + 13.5) / 4 = 18.5 / 4 = 4.625 => rounds to 4.6
      const single5 = calculateBayesianRating([5]);
      expect(single5).toBe(4.6);

      // Single 1-star review: (1 * 1 + 3 * 4.5) / (1 + 3) = (1 + 13.5) / 4 = 14.5 / 4 = 3.625 => rounds to 3.6
      // Prevents malicious revenge 1-star bomb from plummeting user immediately to 1.0
      const single1 = calculateBayesianRating([1]);
      expect(single1).toBe(3.6);
    });

    it("converges toward true mean as sample size increases", () => {
      // 20 reviews with 5.0: (20 * 5 + 3 * 4.5) / 23 = 113.5 / 23 = 4.93 => rounds to 4.9
      const twentyReviews = Array(20).fill(5);
      const score20 = calculateBayesianRating(twentyReviews);
      expect(score20).toBe(4.9);

      // 50 reviews with 5.0: (50 * 5 + 13.5) / 53 = 263.5 / 53 = 4.97 => rounds to 5.0
      const fiftyReviews = Array(50).fill(5);
      const score50 = calculateBayesianRating(fiftyReviews);
      expect(score50).toBe(5.0);
    });

    it("calculates raw arithmetic average and rating distribution accurately", () => {
      const ratings = [5, 5, 4, 3, 5, 2, 1, 5];
      const avg = calculateRawAverage(ratings);
      expect(avg).toBe(3.8);

      const dist = calculateRatingDistribution(ratings);
      expect(dist[5]).toBe(4);
      expect(dist[4]).toBe(1);
      expect(dist[3]).toBe(1);
      expect(dist[2]).toBe(1);
      expect(dist[1]).toBe(1);
    });

    it("computes Rater Generosity Index to track constructive rating behavior", () => {
      // High giver: avg 5.0
      const generous = calculateGenerosityIndex([5, 5, 5]);
      expect(generous).toBe(5.0);

      // Critical giver: avg 3.0
      const strict = calculateGenerosityIndex([3, 3, 3]);
      expect(strict).toBe(3.0);

      // Empty giver
      const empty = calculateGenerosityIndex([]);
      expect(empty).toBe(0);
    });
  });

  describe("Validation & Content Security", () => {
    it("rejects comments shorter than 20 characters", async () => {
      await expect(
        ReviewService.createReview({
          engagementId: "eng-demo-validation-1",
          authorUserId: "u-newuser-1",
          overallRating: 5,
          communicationRating: 5,
          qualityRating: 5,
          comment: "Harika iş!", // 10 chars
        })
      ).rejects.toThrow("REVIEW_TOO_SHORT");
    });

    it("rejects comments longer than 1000 characters", async () => {
      const longComment = "A".repeat(1001);
      await expect(
        ReviewService.createReview({
          engagementId: "eng-demo-validation-2",
          authorUserId: "u-newuser-2",
          overallRating: 5,
          communicationRating: 5,
          qualityRating: 5,
          comment: longComment,
        })
      ).rejects.toThrow("REVIEW_TOO_LONG");
    });

    it("strictly prohibits emojis in professional reviews", async () => {
      await expect(
        ReviewService.createReview({
          engagementId: "eng-demo-validation-3",
          authorUserId: "u-newuser-3",
          overallRating: 5,
          communicationRating: 5,
          qualityRating: 5,
          comment: "Harika bir çalışma oldu, Next.js mimarisini çok temiz kurdu 🚀👏",
        })
      ).rejects.toThrow("EMOJIS_FORBIDDEN");
    });

    it("rejects invalid star ratings outside 1-5 range", async () => {
      await expect(
        ReviewService.createReview({
          engagementId: "eng-demo-validation-4",
          authorUserId: "u-newuser-4",
          overallRating: 6,
          communicationRating: 5,
          qualityRating: 5,
          comment: "Bu geçerli uzunlukta bir test değerlendirme yorumudur.",
        })
      ).rejects.toThrow("INVALID_RATING_OVERALL");

      await expect(
        ReviewService.createReview({
          engagementId: "eng-demo-validation-5",
          authorUserId: "u-newuser-5",
          overallRating: 5,
          communicationRating: 0,
          qualityRating: 5,
          comment: "Bu geçerli uzunlukta bir test değerlendirme yorumudur.",
        })
      ).rejects.toThrow("INVALID_RATING_COMMUNICATION");
    });

    it("rejects inappropriate content and profanity", async () => {
      await expect(
        ReviewService.createReview({
          engagementId: "eng-demo-validation-6",
          authorUserId: "u-newuser-6",
          overallRating: 1,
          communicationRating: 1,
          qualityRating: 1,
          comment: "Bu adam tam bir aptal ve şerefsiz biri.",
        })
      ).rejects.toThrow("INAPPROPRIATE_CONTENT");
    });
  });

  describe("Double-Blind Simultaneous Reveal Protocol", () => {
    const testEngId = "eng-doubleblind-test-99";

    it("keeps first submission sealed and hides counterparty content", async () => {
      // First party submits (DEFAULT_USER)
      const reviewA = await ReviewService.createReview({
        engagementId: testEngId,
        authorUserId: DEFAULT_USER.id,
        overallRating: 5,
        communicationRating: 5,
        qualityRating: 5,
        comment: "Müşteri ile iletişim mükemmeldi, tüm revizyonlar net şekilde paylaşıldı.",
        tags: ["Hızlı Yanıt", "Net Brifing"],
      });

      expect(reviewA.isRevealed).toBe(false);
      expect(reviewA.revealedAt).toBeNull();

      // Check engagement review status from User A's perspective
      const statusA = await ReviewService.getEngagementReviewStatus(testEngId, DEFAULT_USER.id);
      expect(statusA.userReviewed).toBe(true);
      expect(statusA.counterpartyReviewed).toBe(false);
      expect(statusA.isRevealed).toBe(false);
      expect(statusA.userReview).toBeDefined();
      expect(statusA.counterpartyReview).toBeNull(); // Sealed!

      // Check status from User B's perspective (hasn't submitted yet)
      const statusB = await ReviewService.getEngagementReviewStatus(testEngId, "u-techcorp-1");
      expect(statusB.userReviewed).toBe(false);
      expect(statusB.counterpartyReviewed).toBe(true);
      expect(statusB.isRevealed).toBe(false);
      expect(statusB.userReview).toBeNull();
      expect(statusB.counterpartyReview).toBeNull(); // User B CANNOT see User A's review yet!
    });

    it("simultaneously reveals both reviews when second party submits", async () => {
      // Second party submits (u-techcorp-1)
      const reviewB = await ReviewService.createReview({
        engagementId: testEngId,
        authorUserId: "u-techcorp-1",
        overallRating: 5,
        communicationRating: 5,
        qualityRating: 5,
        comment: "Geliştirici projeyi zamanından önce ve sıfır hatayla teslim etti.",
        tags: ["Tertemiz Kod", "Erken Teslim"],
        endorsedSkills: ["Next.js", "TypeScript"],
      });

      expect(reviewB.isRevealed).toBe(true);
      expect(reviewB.revealedAt).not.toBeNull();

      // Check engagement review status for both parties
      const statusA = await ReviewService.getEngagementReviewStatus(testEngId, DEFAULT_USER.id);
      expect(statusA.isRevealed).toBe(true);
      expect(statusA.counterpartyReview).not.toBeNull();
      expect(statusA.counterpartyReview?.comment).toContain("Geliştirici projeyi zamanından önce");
      expect(statusA.counterpartyReview?.endorsedSkills).toContain("Next.js");

      const statusB = await ReviewService.getEngagementReviewStatus(testEngId, "u-techcorp-1");
      expect(statusB.isRevealed).toBe(true);
      expect(statusB.counterpartyReview).not.toBeNull();
      expect(statusB.counterpartyReview?.comment).toContain("Müşteri ile iletişim mükemmeldi");
    });

    it("prevents duplicate reviews for the same engagement", async () => {
      await expect(
        ReviewService.createReview({
          engagementId: testEngId,
          authorUserId: DEFAULT_USER.id,
          overallRating: 4,
          communicationRating: 4,
          qualityRating: 4,
          comment: "İkinci kez aynı projeyi puanlamaya çalışıyorum.",
        })
      ).rejects.toThrow("DUPLICATE_REVIEW");
    });
  });

  describe("Dual Public Profile Visibility (Received vs Given)", () => {
    it("returns both received reviews and given reviews for public profile", async () => {
      const summary = await ReviewService.getReviewsForUser(DEFAULT_USER.id);

      expect(summary).toBeDefined();
      expect(summary.bayesianScore).toBeGreaterThan(0);
      expect(summary.receivedReviewsCount).toBeGreaterThan(0);
      expect(summary.receivedReviews.length).toBeGreaterThan(0);

      // Verify received review fields
      const firstReceived = summary.receivedReviews[0];
      expect(firstReceived).toBeDefined();
      expect(firstReceived!.overallRating).toBeGreaterThanOrEqual(1);
      expect(firstReceived!.overallRating).toBeLessThanOrEqual(5);
      expect(firstReceived!.comment.length).toBeGreaterThanOrEqual(20);

      // Verify given reviews exist for dual transparency
      expect(summary.givenReviews.length).toBeGreaterThan(0);
      expect(summary.givenReviewsCount).toBeGreaterThan(0);
      expect(summary.generosityIndex).toBeGreaterThan(0);
    });
  });

  describe("Auto-Reveal on 14-Day Review Window Expiration", () => {
    it("auto reveals expired pending reviews", async () => {
      const count = await ReviewService.autoRevealExpiredReviews();
      expect(typeof count).toBe("number");
    });
  });

  describe("Mandatory Review Enforcement Checks", () => {
    it("checks pending mandatory reviews for a user", async () => {
      const pendingList = await ReviewService.checkPendingMandatoryReviews(DEFAULT_USER.id);
      expect(Array.isArray(pendingList)).toBe(true);
    });
  });
});
