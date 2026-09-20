import crypto from "node:crypto";

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface InMemListing {
  id: string;
  ownerUserId: string;
  slug: string;
  status: string;
  categoryId: string;
  title: string;
  summary: string;
  scope: string;
  answersJson: unknown;
  tags: string[];
  budgetMode: string;
  budgetCurrency: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  timelineMode: string;
  targetDate: string | null;
  timelineValue: number | null;
  timelineUnit: string | null;
  activationSeq: number;
  viewCount: number;
  clickCount: number;
  firstPublishedAt: Date;
  lastActivatedAt: Date;
  activeUntil: Date | null;
}

export const inMemoryListings: InMemListing[] = [];

export const inMemoryExpiringNotified = new Set<string>();

export function generateSlug(title: string): string {
  // Convert Turkish characters to ASCII equivalents
  const trMap: Record<string, string> = {
    ç: "c",
    Ç: "c",
    ğ: "g",
    Ğ: "g",
    ı: "i",
    İ: "i",
    ö: "o",
    Ö: "o",
    ş: "s",
    Ş: "s",
    ü: "u",
    Ü: "u",
  };

  const normalized = title
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (m) => trMap[m] || m)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

  const suffix = crypto.randomBytes(3).toString("hex");
  return `${normalized || "proje"}-${suffix}`;
}

export interface ListingCardDto {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: { id: string; key: string };
  status: string;
  budgetMode: string;
  budgetCurrency: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  timelineMode: string;
  targetDate: string | null;
  timelineValue: number | null;
  timelineUnit: string | null;
  firstPublishedAt: Date | null;
  lastActivatedAt: Date | null;
  activeUntil: Date | null;
  activationSeq: number;
  viewCount: number;
  clickCount: number;
  owner: {
    displayName: string;
    handle: string;
  };
}

export interface ClonedListingData {
  sourceListingId: string;
  sourceTitle: string;
  categoryId: string;
  title: string;
  summary: string;
  scope: string;
  tags: string[];
  budgetMode: string;
  budgetCurrency: string;
  budgetMin: string;
  budgetMax: string;
  timelineMode: string;
  timelineValue: string;
  timelineUnit: string;
  targetDate: string | null;
  answers: Record<string, unknown>;
  projectType?: string;
  projectStage?: string;
  workPreference?: string;
  preferredLanguage?: string;
  customNotes?: string;
}

/**
 * Validates budget consistency according to canonical budget modes (Fixes B22).
 */
export function validateBudgetConsistency(
  budgetMode: string,
  budgetMin: number | string | null | undefined,
  budgetMax: number | string | null | undefined
): { min: string | null; max: string | null } {
  const minNum =
    budgetMin !== undefined && budgetMin !== null && budgetMin !== "" ? Number(budgetMin) : null;
  const maxNum =
    budgetMax !== undefined && budgetMax !== null && budgetMax !== "" ? Number(budgetMax) : null;

  if (budgetMode === "NEGOTIABLE" || budgetMode === "REQUEST_GUIDANCE") {
    return { min: null, max: null };
  }

  if (budgetMode === "FIXED_RANGE" || budgetMode === "HOURLY_RANGE") {
    if (
      minNum === null ||
      maxNum === null ||
      isNaN(minNum) ||
      isNaN(maxNum) ||
      !Number.isFinite(minNum) ||
      !Number.isFinite(maxNum) ||
      minNum <= 0 ||
      maxNum <= 0 ||
      maxNum > 999999999.99
    ) {
      throw new Error("Please specify valid positive numbers for both minimum and maximum budget.");
    }
    if (minNum > maxNum) {
      throw new Error("Minimum budget cannot exceed maximum budget.");
    }
    return { min: String(minNum), max: String(maxNum) };
  }

  if (budgetMode === "FIXED_EXACT" || budgetMode === "HOURLY_EXACT") {
    if (minNum !== null && maxNum !== null && minNum !== maxNum) {
      throw new Error("Exact budget mode requires minimum and maximum amounts to be equal.");
    }
    const exact = minNum ?? maxNum;
    if (
      exact === null ||
      isNaN(exact) ||
      !Number.isFinite(exact) ||
      exact <= 0 ||
      exact > 999999999.99
    ) {
      throw new Error("Please specify a valid positive budget amount.");
    }
    return { min: String(exact), max: String(exact) };
  }

  let minRes: string | null = null;
  if (minNum !== null && Number.isFinite(minNum) && minNum > 0) {
    minRes = String(minNum);
  }
  let maxRes: string | null = null;
  if (maxNum !== null && Number.isFinite(maxNum) && maxNum > 0) {
    maxRes = String(maxNum);
  }

  return {
    min: minRes,
    max: maxRes,
  };
}
