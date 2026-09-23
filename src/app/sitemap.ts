import type { MetadataRoute } from "next";
import { getDb, schema } from "@/src/lib/db";
import { sql } from "drizzle-orm";
import {
  LEGAL_SLUGS,
  ROUTE_MAP,
  getLocalizedListingPath,
  type RouteKey,
} from "@/src/lib/i18n/routes";
import { getBaseUrl } from "@/src/lib/config/url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  // Home
  entries.push({
    url: `${baseUrl}/tr`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 1.0,
  });
  entries.push({
    url: `${baseUrl}/en`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 1.0,
  });

  // Core static routes
  const staticKeys: RouteKey[] = [
    "feed",
    "listings",
    "newListing",
    "categories",
    "about",
    "contact",
    "help",
    "brand",
    "legalCenter",
    "login",
    "register",
    "report",
  ];
  for (const key of staticKeys) {
    entries.push({
      url: `${baseUrl}${ROUTE_MAP[key].tr}`,
      lastModified: now,
      changeFrequency: key === "feed" || key === "listings" ? "hourly" : "weekly",
      priority: key === "feed" || key === "listings" ? 0.9 : 0.6,
    });
    entries.push({
      url: `${baseUrl}${ROUTE_MAP[key].en}`,
      lastModified: now,
      changeFrequency: key === "feed" || key === "listings" ? "hourly" : "weekly",
      priority: key === "feed" || key === "listings" ? 0.9 : 0.6,
    });
  }

  // Legal routes
  for (const mapping of Object.values(LEGAL_SLUGS)) {
    entries.push({
      url: `${baseUrl}/tr/yasal/${mapping.tr}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    });
    entries.push({
      url: `${baseUrl}/en/legal/${mapping.en}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    });
  }

  // Active listings
  try {
    const db = getDb();
    const activeListings = await db
      .select({
        slug: schema.listings.slug,
        lastActivatedAt: schema.listings.lastActivatedAt,
      })
      .from(schema.listings)
      .where(sql`${schema.listings.status} = 'ACTIVE' AND ${schema.listings.activeUntil} > ${now}`)
      .limit(1000);

    for (const listing of activeListings) {
      const lastMod = listing.lastActivatedAt ? new Date(listing.lastActivatedAt) : now;
      entries.push({
        url: `${baseUrl}${getLocalizedListingPath(listing.slug, "tr")}`,
        lastModified: lastMod,
        changeFrequency: "daily",
        priority: 0.8,
      });
      entries.push({
        url: `${baseUrl}${getLocalizedListingPath(listing.slug, "en")}`,
        lastModified: lastMod,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  } catch {
    // Graceful fallback during static build without live database
  }

  return entries;
}
