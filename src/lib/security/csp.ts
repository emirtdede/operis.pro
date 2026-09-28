export function createContentSecurityPolicy(nonce: string, isProduction: boolean): string {
  const scriptSrcDirectives = [
    "'self'",
    ...(isProduction ? [] : ["'unsafe-eval'"]),
    `'nonce-${nonce}'`,
    "https://*.clerk.accounts.dev",
    "https://*.clerk.com",
    "https://clerk.operis.pro",
    "https://challenges.cloudflare.com",
    "https://static.cloudflareinsights.com",
    "https://eu.i.posthog.com",
    "https://eu-assets.i.posthog.com",
  ].join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSrcDirectives}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: https://img.clerk.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.r2.cloudflarestorage.com https://r2.operis.pro https://*.clerk.accounts.dev https://clerk.operis.pro https://api.clerk.com https://cloudflareinsights.com https://eu.i.posthog.com https://eu-assets.i.posthog.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.ingest.us.sentry.io",
    "worker-src 'self' blob:",
    "frame-src 'self' https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}
