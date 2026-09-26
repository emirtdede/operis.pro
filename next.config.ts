import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isProduction = process.env.NODE_ENV === "production";

const scriptSrcDirectives = [
  "'self'",
  ...(isProduction ? [] : ["'unsafe-eval'"]),
  "'unsafe-inline'",
  "https://*.clerk.accounts.dev",
  "https://*.clerk.com",
  "https://clerk.operis.pro",
  "https://challenges.cloudflare.com",
  "https://static.cloudflareinsights.com",
  "https://eu.i.posthog.com",
  "https://eu-assets.i.posthog.com",
].join(" ");

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
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
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      // 100% Turkish Slugs -> Internal App Router handlers
      { source: "/tr/kategoriler", destination: "/tr/categories" },
      { source: "/tr/akis", destination: "/tr/feed" },
      { source: "/tr/ilanlar", destination: "/tr/listings" },
      { source: "/tr/ilanlar/yeni", destination: "/tr/listings/new" },
      { source: "/tr/ilanlar/:slug/duzenle", destination: "/tr/listings/:slug/edit" },
      { source: "/tr/ilanlar/:slug", destination: "/tr/listings/:slug" },
      { source: "/tr/giris", destination: "/tr/login" },
      { source: "/tr/kayit", destination: "/tr/register" },
      { source: "/tr/sifremi-unuttum", destination: "/tr/forgot-password" },
      { source: "/tr/sifre-sifirla", destination: "/tr/reset-password" },
      { source: "/tr/profil/:handle", destination: "/tr/u/:handle" },
      { source: "/tr/panel", destination: "/tr/dashboard/listings" },
      { source: "/tr/panel/ilanlarim", destination: "/tr/dashboard/listings" },
      { source: "/tr/panel/ilanlar", destination: "/tr/dashboard/listings" },
      { source: "/tr/panel/teklifler/gelen", destination: "/tr/dashboard/offers/received" },
      { source: "/tr/panel/teklifler/gelenler", destination: "/tr/dashboard/offers/received" },
      { source: "/tr/panel/teklifler/gonderilen", destination: "/tr/dashboard/offers/sent" },
      { source: "/tr/panel/teklifler/gonderilenler", destination: "/tr/dashboard/offers/sent" },
      { source: "/tr/panel/teklifler/giden", destination: "/tr/dashboard/offers/sent" },
      { source: "/tr/panel/teklifler/gidenler", destination: "/tr/dashboard/offers/sent" },
      { source: "/tr/panel/aktif-isler", destination: "/tr/dashboard/work" },
      { source: "/tr/panel/aktif", destination: "/tr/dashboard/work" },
      { source: "/tr/panel/projelerim", destination: "/tr/dashboard/work" },
      { source: "/tr/panel/kaydedilenler", destination: "/tr/dashboard/saved" },
      { source: "/tr/panel/kaydedilen", destination: "/tr/dashboard/saved" },
      { source: "/tr/panel/ayarlar", destination: "/tr/settings" },
      { source: "/tr/ayarlar", destination: "/tr/settings" },
      { source: "/tr/panel/guvenlik", destination: "/tr/settings?tab=security" },
      { source: "/tr/guvenlik", destination: "/tr/settings?tab=security" },
      { source: "/tr/panel/bildirimler", destination: "/tr/dashboard/notifications" },
      { source: "/tr/bildirimler", destination: "/tr/dashboard/notifications" },
      { source: "/tr/panel/kategorilerim", destination: "/tr/dashboard/categories" },
      { source: "/tr/kategorilerim", destination: "/tr/dashboard/categories" },
      { source: "/tr/calisma-alani/:id", destination: "/tr/work/:id" },
      { source: "/tr/yasal", destination: "/tr/legal" },
      { source: "/tr/yasal/:slug", destination: "/tr/legal/:slug" },
      { source: "/tr/marka", destination: "/tr/brand" },
      { source: "/tr/yardim", destination: "/tr/help" },
      { source: "/tr/hakkimizda", destination: "/tr/about" },
      { source: "/tr/iletisim", destination: "/tr/contact" },
      { source: "/tr/sikayet-bildir", destination: "/tr/report" },
      { source: "/tr/ihlal-bildirimi", destination: "/tr/report" },
      { source: "/tr/yetkisiz", destination: "/tr/unauthorized" },

      // 100% English Slug Aliases -> Internal App Router handlers
      { source: "/en/dashboard", destination: "/en/dashboard/listings" },
      { source: "/en/profile/:handle", destination: "/en/u/:handle" },
      { source: "/en/workspace/:id", destination: "/en/work/:id" },
      { source: "/en/dashboard/settings", destination: "/en/settings" },
      { source: "/en/security", destination: "/en/settings?tab=security" },
      { source: "/en/dashboard/security", destination: "/en/settings?tab=security" },
      { source: "/en/notifications", destination: "/en/dashboard/notifications" },
    ];
  },
};

export default withNextIntl(nextConfig);
