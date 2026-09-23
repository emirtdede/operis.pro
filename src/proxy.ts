import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { locales } from "./lib/i18n/config";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: false, // Handled explicitly below for 100% deterministic user requirement
});

/**
 * Parses Accept-Language header according to RFC 9110 quality values (q-factor).
 * Returns true only if Turkish (tr) is the user's primary/highest preference.
 */
function isTurkishPreferred(acceptLanguage: string | null): boolean {
  if (!acceptLanguage || acceptLanguage.trim().length === 0) {
    return false;
  }

  const preferences = acceptLanguage
    .split(",")
    .map((part) => {
      const [lang, qPart] = part.trim().split(";");
      const q = qPart ? parseFloat(qPart.replace("q=", "")) : 1.0;
      return {
        lang: (lang || "").trim().toLowerCase(),
        q: isNaN(q) ? 1.0 : q,
      };
    })
    .filter((item) => item.lang.length > 0)
    .sort((a, b) => b.q - a.q);

  if (preferences.length === 0) {
    return false;
  }

  const top = preferences[0];
  return Boolean(top && top.lang.startsWith("tr"));
}

const TR_EXACT_REDIRECTS: Record<string, string> = {
  "/tr/categories": "/tr/kategoriler",
  "/tr/listings": "/tr/ilanlar",
  "/tr/listings/new": "/tr/ilanlar/yeni",
  "/tr/login": "/tr/giris",
  "/tr/register": "/tr/kayit",
  "/tr/dashboard": "/tr/panel/ilanlarim",
  "/tr/panel": "/tr/panel/ilanlarim",
  "/tr/dashboard/listings": "/tr/panel/ilanlarim",
  "/tr/panel/ilanlar": "/tr/panel/ilanlarim",
  "/tr/dashboard/offers/received": "/tr/panel/teklifler/gelen",
  "/tr/panel/teklifler/gelenler": "/tr/panel/teklifler/gelen",
  "/tr/dashboard/offers/sent": "/tr/panel/teklifler/gonderilen",
  "/tr/panel/teklifler/gonderilenler": "/tr/panel/teklifler/gonderilen",
  "/tr/panel/teklifler/giden": "/tr/panel/teklifler/gonderilen",
  "/tr/panel/teklifler/gidenler": "/tr/panel/teklifler/gonderilen",
  "/tr/dashboard/saved": "/tr/panel/kaydedilenler",
  "/tr/panel/kaydedilen": "/tr/panel/kaydedilenler",
  "/tr/dashboard/work": "/tr/panel/aktif-isler",
  "/tr/panel/aktif": "/tr/panel/aktif-isler",
  "/tr/panel/projeler": "/tr/panel/aktif-isler",
  "/tr/panel/projelerim": "/tr/panel/aktif-isler",
  "/tr/dashboard/settings": "/tr/ayarlar",
  "/tr/panel/ayarlar": "/tr/ayarlar",
  "/tr/dashboard/security": "/tr/panel/guvenlik",
  "/tr/guvenlik": "/tr/panel/guvenlik",
  "/tr/dashboard/notifications": "/tr/panel/bildirimler",
  "/tr/bildirimler": "/tr/panel/bildirimler",
  "/tr/dashboard/categories": "/tr/panel/kategorilerim",
  "/tr/kategorilerim": "/tr/panel/kategorilerim",
  "/tr/legal/terms": "/tr/yasal/kullanim-kosullari",
  "/tr/legal/privacy": "/tr/yasal/gizlilik-ve-kvkk",
  "/tr/legal/matching-disclaimer": "/tr/yasal/eslestirme-ve-sorumluluk-reddi",
  "/tr/legal/acceptable-use": "/tr/yasal/kabul-edilebilir-kullanim",
  "/tr/legal/cookies": "/tr/yasal/cerez-politikasi",
  "/tr/legal/contact": "/tr/yasal/iletisim",
  "/tr/legal/intellectual-property": "/tr/yasal/fikri-mulkiyet-ve-telif",
  "/tr/legal/consent": "/tr/yasal/acik-riza-metni",
  "/tr/legal/dispute-resolution": "/tr/yasal/uyusmazlik-cozumu",
  "/tr/legal": "/tr/yasal",
  "/tr/brand": "/tr/marka",
  "/tr/forgot-password": "/tr/sifremi-unuttum",
  "/tr/reset-password": "/tr/sifre-sifirla",
  "/tr/help": "/tr/yardim",
  "/tr/about": "/tr/hakkimizda",
  "/tr/contact": "/tr/iletisim",
  "/tr/report": "/tr/sikayet-bildir",
  "/tr/unauthorized": "/tr/yetkisiz",
};

function baseProxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Root route: Intelligent Locale Detection & Preference Persistence
  if (pathname === "/" || pathname === "") {
    // Check saved cookie preferences first
    const cookieLocale =
      request.cookies.get("NEXT_LOCALE")?.value || request.cookies.get("fp_locale")?.value;

    let targetLocale: "tr" | "en";

    if (cookieLocale === "tr" || cookieLocale === "en") {
      targetLocale = cookieLocale;
    } else {
      // First-time visit: inspect Accept-Language header
      const acceptLanguage = request.headers.get("accept-language");
      if (isTurkishPreferred(acceptLanguage)) {
        targetLocale = "tr";
      } else {
        // Different language or undetected: ALWAYS default to English
        targetLocale = "en";
      }
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${targetLocale}`;
    return NextResponse.redirect(redirectUrl, 302);
  }

  // 1.5 Feed to Unified Listings Hub: Permanent 301 Redirect
  if (pathname === "/tr/feed" || pathname === "/tr/akis") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/tr/ilanlar";
    if (!redirectUrl.searchParams.has("view")) {
      redirectUrl.searchParams.set("view", "stream");
    }
    return NextResponse.redirect(redirectUrl, 301);
  }

  if (pathname === "/en/feed") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/en/listings";
    if (!redirectUrl.searchParams.has("view")) {
      redirectUrl.searchParams.set("view", "stream");
    }
    return NextResponse.redirect(redirectUrl, 301);
  }

  // 2. 301 Permanent Redirects for legacy English paths requested under /tr
  const exactRedirect = TR_EXACT_REDIRECTS[pathname];
  if (exactRedirect) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = exactRedirect;
    return NextResponse.redirect(redirectUrl, 301);
  }

  // Dynamic legacy redirects under /tr
  if (pathname.startsWith("/tr/u/")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname.replace("/tr/u/", "/tr/profil/");
    return NextResponse.redirect(redirectUrl, 301);
  }

  if (pathname.startsWith("/tr/work/")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname.replace("/tr/work/", "/tr/calisma-alani/");
    return NextResponse.redirect(redirectUrl, 301);
  }

  if (pathname.startsWith("/tr/listings/") && pathname !== "/tr/listings/new") {
    const redirectUrl = request.nextUrl.clone();
    if (pathname.endsWith("/edit")) {
      redirectUrl.pathname = pathname
        .replace("/tr/listings/", "/tr/ilanlar/")
        .replace(/\/edit$/, "/duzenle");
    } else {
      redirectUrl.pathname = pathname.replace("/tr/listings/", "/tr/ilanlar/");
    }
    return NextResponse.redirect(redirectUrl, 301);
  }

  // Dynamic canonical redirects under /en
  if (pathname.startsWith("/en/u/")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname.replace("/en/u/", "/en/profile/");
    return NextResponse.redirect(redirectUrl, 301);
  }

  if (pathname.startsWith("/en/work/")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname.replace("/en/work/", "/en/workspace/");
    return NextResponse.redirect(redirectUrl, 301);
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/sso-callback")
  ) {
    return NextResponse.next();
  }

  // 3. Process localized request with next-intl
  return intlMiddleware(request);
}

import { clerkMiddleware } from "@clerk/nextjs/server";

const clerkHandler = clerkMiddleware(async (_auth, req) => {
  return baseProxy(req);
});

export async function proxy(request: NextRequest, event?: NextFetchEvent) {
  if (
    event &&
    !process.env.VITEST &&
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ) {
    return clerkHandler(request, event);
  }
  return baseProxy(request);
}

export default proxy;

export const config = {
  // Match internationalized pathnames, API routes for Clerk auth, excluding admin, static files, and assets
  matcher: ["/", "/(tr|en)/:path*", "/((?!admin|_next|_vercel|.*\\..*).*)"],
};
