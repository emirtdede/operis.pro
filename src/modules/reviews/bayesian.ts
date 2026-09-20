/**
 * Bayesian Smoothed Rating & Statistical Metrics
 *
 * Implements the standard Bayesian Shrinkage formula (IMDb / TrueSkill baseline):
 *   WR = (v / (v + m)) * R + (m / (v + m)) * C
 *
 * Where:
 *   - v: Number of completed ratings
 *   - m: Prior confidence weight (default: 3)
 *   - R: Arithmetic mean of ratings
 *   - C: Global platform prior mean (default: 4.5)
 */

export const BAYESIAN_CONFIDENCE_THRESHOLD = 3;
export const BAYESIAN_PLATFORM_PRIOR = 4.5;

export function calculateBayesianRating(
  ratings: number[],
  m = BAYESIAN_CONFIDENCE_THRESHOLD,
  C = BAYESIAN_PLATFORM_PRIOR
): number {
  if (!ratings || ratings.length === 0) {
    return 0;
  }

  const v = ratings.length;
  const sum = ratings.reduce((acc, curr) => acc + curr, 0);
  const R = sum / v;

  const weightedRating = (v / (v + m)) * R + (m / (v + m)) * C;
  return Math.round(weightedRating * 10) / 10;
}

export function calculateRawAverage(ratings: number[]): number {
  if (!ratings || ratings.length === 0) {
    return 0;
  }
  const sum = ratings.reduce((acc, curr) => acc + curr, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

export function calculateRatingDistribution(ratings: number[]): {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
} {
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (!ratings || ratings.length === 0) return dist;

  for (const r of ratings) {
    const clamped = Math.min(5, Math.max(1, Math.round(r))) as 1 | 2 | 3 | 4 | 5;
    dist[clamped] += 1;
  }

  return dist;
}

/**
 * Signature Touch 1: Rater Generosity Index
 * Measures the average score a user awards to their counterparties.
 * High scores indicate constructive, supportive partners.
 */
export function calculateGenerosityIndex(givenRatings: number[]): number {
  if (!givenRatings || givenRatings.length === 0) {
    return 0;
  }
  const sum = givenRatings.reduce((acc, curr) => acc + curr, 0);
  return Math.round((sum / givenRatings.length) * 10) / 10;
}
