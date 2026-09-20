import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import {
  evaluateProposalPitch,
  generateProposalEnhancement,
  type ListingContext,
  type ProposalDraft,
} from "@/src/modules/ai/pitch-doctor";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";
import { getDb, schema } from "@/src/lib/db";
import { eq } from "drizzle-orm";
import { inMemoryListings } from "@/src/modules/listings/service";

export async function POST(req: Request) {
  const headerLocale = req.headers.get("x-locale");

  try {
    const session = await getSession();
    const body = await req.json();
    const locale = headerLocale || body?.locale || "tr";
    const isEn = locale === "en";

    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const ip = getClientIp(req);
    const access = await evaluateSecurityAccessAsync({
      ip,
      purpose: "ai:proposal-pitch-doctor",
      subject: `${session.userId}:${normalizeIp(ip)}`,
      limit: 30, // 30 evaluations per minute
      windowMs: 60 * 1000,
      isEn,
    });
    if (!access.allowed) {
      return access.response;
    }

    const {
      listingId,
      message,
      proposedBudgetMin,
      proposedBudgetMax,
      proposedCurrency,
      proposedTimelineValue,
      proposedTimelineUnit,
      fallbackListing,
    } = body || {};

    let listingContext: ListingContext = {
      id: listingId,
      title: fallbackListing?.title || (isEn ? "Project Opportunity" : "Proje Fırsatı"),
      summary: fallbackListing?.summary || "",
      scope: fallbackListing?.scope || "",
      tags: fallbackListing?.tags || [],
      budgetMin: fallbackListing?.budgetMin ?? null,
      budgetMax: fallbackListing?.budgetMax ?? null,
      budgetCurrency: fallbackListing?.budgetCurrency ?? null,
      budgetMode: fallbackListing?.budgetMode ?? null,
      timelineValue: fallbackListing?.timelineValue ?? null,
      timelineUnit: fallbackListing?.timelineUnit ?? null,
      targetDate: fallbackListing?.targetDate ?? null,
    };

    if (listingId) {
      try {
        const db = getDb();
        const [listingRow] = await db
          .select({
            id: schema.listings.id,
            title: schema.listings.title,
            summary: schema.listings.summary,
            scope: schema.listings.scope,
            tags: schema.listings.tags,
            budgetMin: schema.listings.budgetMin,
            budgetMax: schema.listings.budgetMax,
            budgetCurrency: schema.listings.budgetCurrency,
            budgetMode: schema.listings.budgetMode,
            timelineValue: schema.listings.timelineValue,
            timelineUnit: schema.listings.timelineUnit,
            targetDate: schema.listings.targetDate,
          })
          .from(schema.listings)
          .where(eq(schema.listings.id, listingId))
          .limit(1);

        if (listingRow) {
          listingContext = {
            id: listingRow.id,
            title: listingRow.title,
            summary: listingRow.summary,
            scope: listingRow.scope,
            tags: listingRow.tags,
            budgetMin: listingRow.budgetMin,
            budgetMax: listingRow.budgetMax,
            budgetCurrency: listingRow.budgetCurrency,
            budgetMode: listingRow.budgetMode,
            timelineValue: listingRow.timelineValue,
            timelineUnit: listingRow.timelineUnit,
            targetDate: listingRow.targetDate,
          };
        }
      } catch {
        // Fallback for tests or memory environments
        if (process.env.VITEST && inMemoryListings.length > 0) {
          const found = inMemoryListings.find((l) => l.id === listingId);
          if (found) {
            listingContext = {
              id: found.id,
              title: found.title,
              summary: found.summary,
              scope: found.scope,
              tags: found.tags,
              budgetMin: found.budgetMin,
              budgetMax: found.budgetMax,
              budgetCurrency: found.budgetCurrency,
              budgetMode: found.budgetMode,
              timelineValue: found.timelineValue,
              timelineUnit: found.timelineUnit,
              targetDate: found.targetDate,
            };
          }
        }
      }
    }

    const proposalDraft: ProposalDraft = {
      message: String(message || ""),
      proposedBudgetMin,
      proposedBudgetMax,
      proposedCurrency,
      proposedTimelineValue: proposedTimelineValue ? Number(proposedTimelineValue) : null,
      proposedTimelineUnit,
    };

    const evaluation = evaluateProposalPitch(listingContext, proposalDraft, locale);
    const enhancement = generateProposalEnhancement(listingContext, proposalDraft, locale);

    return NextResponse.json(
      {
        success: true,
        evaluation,
        enhancement,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const locale = headerLocale || "tr";
    const isEn = locale === "en";
    let message = isEn ? "Evaluation failed" : "Değerlendirme başarısız oldu";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
