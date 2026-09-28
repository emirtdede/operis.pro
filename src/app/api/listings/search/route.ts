import { NextResponse } from "next/server";
import { ListingService } from "@/src/modules/listings/service";
import { getSession } from "@/src/modules/auth/session";
import { handleApiError } from "@/src/lib/api/error-response";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const { searchParams } = new URL(req.url);
  const locale = (searchParams.get("locale") || "tr") as "tr" | "en";
  const isEn = locale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "listing:search",
    subject: normalizeIp(ip),
    limit: 60,
    windowMs: 60 * 1000,
    isEn,
  });
  if (!access.allowed) {
    return access.response;
  }

  try {
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    if (!q) {
      return NextResponse.json({ items: [] });
    }

    const session = await getSession().catch(() => null);
    const results = await ListingService.searchListingsFullText(q, 6, {
      viewerUserId: session?.userId,
      locale,
    });

    return NextResponse.json({
      items: results.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        categoryName: item.categoryName,
        tags: item.tags,
        budgetMode: item.budgetMode,
        budgetMin: item.budgetMin,
        budgetMax: item.budgetMax,
        budgetCurrency: item.budgetCurrency,
      })),
    });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Search failed",
        tr: "Arama başarısız oldu",
      },
      { isEn, logPrefix: "[Listings Search GET Error]", status: 500 }
    );
  }
}
