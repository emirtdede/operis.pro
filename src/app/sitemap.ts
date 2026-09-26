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
import { SEED_CATEGORIES } from "@/db/seeds/categories";

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
    let priority = 0.5;
    let changeFrequency: "hourly" | "daily" | "weekly" | "monthly" = "monthly";

    if (key === "listings") {
      priority = 0.9;
      changeFrequency = "hourly";
    } else if (key === "categories") {
      priority = 0.85;
      changeFrequency = "daily";
    } else if (key === "register") {
      priority = 0.8;
      changeFrequency = "weekly";
    } else if (key === "login") {
      priority = 0.75;
      changeFrequency = "weekly";
    } else if (key === "about" || key === "newListing") {
      priority = 0.7;
      changeFrequency = "weekly";
    }

    entries.push({
      url: `${baseUrl}${ROUTE_MAP[key].tr}`,
      lastModified: now,
      changeFrequency,
      priority,
    });
    entries.push({
      url: `${baseUrl}${ROUTE_MAP[key].en}`,
      lastModified: now,
      changeFrequency,
      priority,
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

  // 110 Category landing routes (zero DB overhead, verified seeds)
  for (const cat of SEED_CATEGORIES) {
    entries.push({
      url: `${baseUrl}/tr/kategori/${cat.key}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    });
    entries.push({
      url: `${baseUrl}/en/category/${cat.key}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
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
