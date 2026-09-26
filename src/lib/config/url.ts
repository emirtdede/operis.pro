/**
 * Centralized Base URL resolution for Operis application.
 * Ensures consistent canonical URLs, sitemaps, emails, and JSON-LD structured data
 * across local development, CI/staging, Vercel preview deployments, and production.
 */

export function getBaseUrl(): string {
  // In production, strictly enforce the canonical production domain.
  // Never leak Vercel deployment preview URLs (*.vercel.app) into canonical tags or sitemaps.
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    const prodUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
    return (prodUrl || "https://operis.pro").replace(/\/+$/, "");
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, "");
  }
  return "https://operis.pro";
}

/**
 * Returns an absolute URL by prefixing the resolved base URL.
 * Automatically handles leading and trailing slashes.
 */
export function getAbsoluteUrl(path: string = ""): string {
  const base = getBaseUrl();
  if (!path || path === "/") {
    return base;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Constructs a strict, normalized canonical URL.
 * Always resolves to the authoritative production domain (https://operis.pro)
 * to prevent duplicate indexation across staging, preview, and dev environments.
 */
export function constructCanonicalUrl(pathname: string = ""): string {
  const prodBase = (process.env.CANONICAL_BASE_URL || "https://operis.pro").replace(/\/+$/, "");
  // Strip any query string or hash if passed accidentally
  const firstPart = pathname.split("?")[0] ?? "";
  const cleanPathname = (firstPart.split("#")[0] ?? "").trim();
  if (!cleanPathname || cleanPathname === "/") {
    return prodBase;
  }
  const normalized = cleanPathname.startsWith("/") ? cleanPathname : `/${cleanPathname}`;
  return `${prodBase}${normalized.replace(/\/+$/, "")}`;
}
