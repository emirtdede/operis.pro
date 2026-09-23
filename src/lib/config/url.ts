/**
 * Centralized Base URL resolution for Operis application.
 * Ensures consistent canonical URLs, sitemaps, emails, and JSON-LD structured data
 * across local development, CI/staging, Vercel preview deployments, and production.
 */

export function getBaseUrl(): string {
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
