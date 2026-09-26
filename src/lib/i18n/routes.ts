import { Locale } from "./config";

/**
 * 100% Localized Route Slugs Map
 * Defines standard slug definitions for Turkish and English routes.
 */
export const ROUTE_MAP = {
  home: {
    tr: "/tr",
    en: "/en",
  },
  feed: {
    tr: "/tr/akis",
    en: "/en/feed",
  },
  listings: {
    tr: "/tr/ilanlar",
    en: "/en/listings",
  },
  newListing: {
    tr: "/tr/ilanlar/yeni",
    en: "/en/listings/new",
  },
  categories: {
    tr: "/tr/kategoriler",
    en: "/en/categories",
  },
  login: {
    tr: "/tr/giris",
    en: "/en/login",
  },
  register: {
    tr: "/tr/kayit",
    en: "/en/register",
  },
  dashboard: {
    tr: "/tr/panel/ilanlarim",
    en: "/en/dashboard/listings",
  },
  dashboardListings: {
    tr: "/tr/panel/ilanlarim",
    en: "/en/dashboard/listings",
  },
  dashboardReceivedOffers: {
    tr: "/tr/panel/teklifler/gelen",
    en: "/en/dashboard/offers/received",
  },
  dashboardSentOffers: {
    tr: "/tr/panel/teklifler/gonderilen",
    en: "/en/dashboard/offers/sent",
  },
  dashboardSaved: {
    tr: "/tr/panel/kaydedilenler",
    en: "/en/dashboard/saved",
  },
  dashboardWork: {
    tr: "/tr/panel/aktif-isler",
    en: "/en/dashboard/work",
  },
  settings: {
    tr: "/tr/ayarlar",
    en: "/en/settings",
  },
  dashboardSettings: {
    tr: "/tr/ayarlar",
    en: "/en/settings",
  },
  dashboardSecurity: {
    tr: "/tr/ayarlar?tab=security",
    en: "/en/settings?tab=security",
  },
  dashboardNotifications: {
    tr: "/tr/panel/bildirimler",
    en: "/en/dashboard/notifications",
  },
  dashboardCategories: {
    tr: "/tr/panel/kategorilerim",
    en: "/en/dashboard/categories",
  },
  forgotPassword: {
    tr: "/tr/sifremi-unuttum",
    en: "/en/forgot-password",
  },
  resetPassword: {
    tr: "/tr/sifre-sifirla",
    en: "/en/reset-password",
  },
  help: {
    tr: "/tr/yardim",
    en: "/en/help",
  },
  about: {
    tr: "/tr/hakkimizda",
    en: "/en/about",
  },
  contact: {
    tr: "/tr/iletisim",
    en: "/en/contact",
  },
  report: {
    tr: "/tr/sikayet-bildir",
    en: "/en/report",
  },
  unauthorized: {
    tr: "/tr/yetkisiz",
    en: "/en/unauthorized",
  },
  legalCenter: {
    tr: "/tr/yasal",
    en: "/en/legal",
  },
  brand: {
    tr: "/tr/marka",
    en: "/en/brand",
  },
} as const;

export type RouteKey = keyof typeof ROUTE_MAP;

/**
 * Legal document slug mappings between internal keys and localized URL slugs.
 */
export const LEGAL_SLUGS: Record<string, { tr: string; en: string }> = {
  terms: {
    tr: "kullanim-kosullari",
    en: "terms",
  },
  privacy: {
    tr: "gizlilik-ve-kvkk",
    en: "privacy",
  },
  "matching-disclaimer": {
    tr: "eslestirme-ve-sorumluluk-reddi",
    en: "matching-disclaimer",
  },
  "acceptable-use": {
    tr: "kabul-edilebilir-kullanim",
    en: "acceptable-use",
  },
  cookies: {
    tr: "cerez-politikasi",
    en: "cookies",
  },
  contact: {
    tr: "iletisim",
    en: "contact",
  },
  "intellectual-property": {
    tr: "fikri-mulkiyet-ve-telif",
    en: "intellectual-property",
  },
  consent: {
    tr: "acik-riza-metni",
    en: "consent",
  },
  "dispute-resolution": {
    tr: "uyusmazlik-cozumu",
    en: "dispute-resolution",
  },
};

/**
 * Maps Turkish legal slug back to internal document key.
 */
export const TR_TO_INTERNAL_LEGAL_SLUG: Record<string, string> = {
  "kullanim-kosullari": "terms",
  "gizlilik-ve-kvkk": "privacy",
  "eslestirme-ve-sorumluluk-reddi": "matching-disclaimer",
  "kabul-edilebilir-kullanim": "acceptable-use",
  "cerez-politikasi": "cookies",
  iletisim: "contact",
  "fikri-mulkiyet-ve-telif": "intellectual-property",
  "acik-riza-metni": "consent",
  "uyusmazlik-cozumu": "dispute-resolution",
};

function normalizeLocale(locale: Locale | string): Locale {
  return String(locale).toLowerCase().startsWith("tr") ? "tr" : "en";
}

/**
 * Generates a localized path for standard routes.
 */
export function getLocalizedRoute(route: RouteKey, locale: Locale | string): string {
  const normLocale = normalizeLocale(locale);
  const entry = ROUTE_MAP[route];
  return entry ? entry[normLocale] : `/${normLocale}`;
}

/**
 * Generates a localized listing detail path.
 */
export function getLocalizedListingPath(slug: string, locale: Locale | string): string {
  return normalizeLocale(locale) === "tr" ? `/tr/ilanlar/${slug}` : `/en/listings/${slug}`;
}

/**
 * Generates a localized public profile path.
 */
export function getLocalizedProfilePath(handle: string, locale: Locale | string): string {
  return normalizeLocale(locale) === "tr" ? `/tr/profil/${handle}` : `/en/profile/${handle}`;
}

/**
 * Generates a localized workspace path.
 */
export function getLocalizedWorkspacePath(id: string, locale: Locale | string): string {
  return normalizeLocale(locale) === "tr" ? `/tr/calisma-alani/${id}` : `/en/workspace/${id}`;
}

/**
 * Generates a localized legal document path.
 */
export function getLocalizedLegalPath(docKey: string, locale: Locale | string): string {
  const normLocale = normalizeLocale(locale);
  const slugConfig = LEGAL_SLUGS[docKey];
  const slug = slugConfig ? slugConfig[normLocale] : docKey;
  return normLocale === "tr" ? `/tr/yasal/${slug}` : `/en/legal/${slug}`;
}

/**
 * Converts any current pathname to the target locale, preserving localized slugs.
 */
export function getAlternateLocalePath(pathname: string, targetLocale: Locale | string): string {
  const normTarget = normalizeLocale(targetLocale);
  // Normalize pathname without trailing slash
  const cleanPath = pathname.replace(/\/$/, "");

  // Home page switch
  if (cleanPath === "/tr" || cleanPath === "/en" || cleanPath === "") {
    return `/${normTarget}`;
  }

  // Check known standard routes
  for (const [, mapping] of Object.entries(ROUTE_MAP)) {
    if (cleanPath === mapping.tr || cleanPath === mapping.en) {
      return mapping[normTarget];
    }
  }

  // Check listings edit: /tr/ilanlar/:slug/duzenle or /en/listings/:slug/edit
  const trListingEditMatch = cleanPath.match(
    /^\/tr\/(?:ilanlar|listings)\/(.+)\/(?:duzenle|edit)$/
  );
  if (trListingEditMatch?.[1]) {
    return normTarget === "en"
      ? `/en/listings/${trListingEditMatch[1]}/edit`
      : `/tr/ilanlar/${trListingEditMatch[1]}/duzenle`;
  }
  const enListingEditMatch = cleanPath.match(
    /^\/en\/(?:listings|ilanlar)\/(.+)\/(?:edit|duzenle)$/
  );
  if (enListingEditMatch?.[1]) {
    return normTarget === "tr"
      ? `/tr/ilanlar/${enListingEditMatch[1]}/duzenle`
      : `/en/listings/${enListingEditMatch[1]}/edit`;
  }

  // Check listings detail: /tr/ilanlar/:slug or /en/listings/:slug
  const trListingMatch = cleanPath.match(/^\/tr\/(?:ilanlar|listings)\/(.+)$/);
  if (trListingMatch?.[1]) {
    return normTarget === "en"
      ? `/en/listings/${trListingMatch[1]}`
      : `/tr/ilanlar/${trListingMatch[1]}`;
  }
  const enListingMatch = cleanPath.match(/^\/en\/(?:listings|ilanlar)\/(.+)$/);
  if (enListingMatch?.[1]) {
    return normTarget === "tr"
      ? `/tr/ilanlar/${enListingMatch[1]}`
      : `/en/listings/${enListingMatch[1]}`;
  }

  // Check profile: /tr/profil/:handle or /en/profile/:handle or /en/u/:handle
  const trProfileMatch = cleanPath.match(/^\/tr\/(?:profil|u)\/(.+)$/);
  if (trProfileMatch?.[1]) {
    return normTarget === "en"
      ? `/en/profile/${trProfileMatch[1]}`
      : `/tr/profil/${trProfileMatch[1]}`;
  }
  const enProfileMatch = cleanPath.match(/^\/en\/(?:profile|u)\/(.+)$/);
  if (enProfileMatch?.[1]) {
    return normTarget === "tr"
      ? `/tr/profil/${enProfileMatch[1]}`
      : `/en/profile/${enProfileMatch[1]}`;
  }

  // Check workspace: /tr/calisma-alani/:id or /en/workspace/:id or /en/work/:id
  const trWorkMatch = cleanPath.match(/^\/tr\/(?:calisma-alani|work)\/(.+)$/);
  if (trWorkMatch?.[1]) {
    return normTarget === "en"
      ? `/en/workspace/${trWorkMatch[1]}`
      : `/tr/calisma-alani/${trWorkMatch[1]}`;
  }
  const enWorkMatch = cleanPath.match(/^\/en\/(?:workspace|work)\/(.+)$/);
  if (enWorkMatch?.[1]) {
    return normTarget === "tr"
      ? `/tr/calisma-alani/${enWorkMatch[1]}`
      : `/en/workspace/${enWorkMatch[1]}`;
  }

  // Check legal documents: /tr/yasal/:slug or /en/legal/:slug
  const trLegalMatch = cleanPath.match(/^\/tr\/yasal\/(.+)$/);
  if (trLegalMatch?.[1]) {
    const internalKey = TR_TO_INTERNAL_LEGAL_SLUG[trLegalMatch[1]] ?? trLegalMatch[1];
    return getLocalizedLegalPath(internalKey, normTarget);
  }
  const enLegalMatch = cleanPath.match(/^\/en\/legal\/(.+)$/);
  if (enLegalMatch?.[1]) {
    return getLocalizedLegalPath(enLegalMatch[1], normTarget);
  }

  // Fallback: simply replace locale prefix
  if (cleanPath.startsWith("/tr/")) {
    return cleanPath.replace(/^\/tr\//, `/${targetLocale}/`);
  }
  if (cleanPath.startsWith("/en/")) {
    return cleanPath.replace(/^\/en\//, `/${targetLocale}/`);
  }

  return `/${targetLocale}`;
}
