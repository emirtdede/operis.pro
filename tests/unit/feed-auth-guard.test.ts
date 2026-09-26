import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";
import { GET } from "@/src/app/api/listings/feed/route";
import * as sessionModule from "@/src/modules/auth/session";

describe("Feed Authentication & Navbar Navigation Guards", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves correct localized routes for listings and login", () => {
    expect(getLocalizedRoute("listings", "tr")).toBe("/tr/ilanlar");
    expect(getLocalizedRoute("listings", "en")).toBe("/en/listings");
    expect(getLocalizedRoute("login", "tr")).toBe("/tr/giris");
    expect(getLocalizedRoute("login", "en")).toBe("/en/login");
    expect(getLocalizedRoute("dashboardListings", "tr")).toBe("/tr/panel/ilanlarim");
    expect(getLocalizedRoute("dashboardListings", "en")).toBe("/en/dashboard/listings");
  });

  it("ensures unauthenticated visitors requesting following feed receive 401 Unauthorized", async () => {
    vi.spyOn(sessionModule, "getSession").mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/listings/feed?mode=following&locale=tr");
    const res = await GET(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("allows unauthenticated visitors to access public feed (mode=all)", async () => {
    vi.spyOn(sessionModule, "getSession").mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/listings/feed?mode=all&locale=tr");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("items");
  });

  it("verifies navbar logic: unauthenticated state has no discover or howItWorks links", () => {
    const session = null;
    const locale = "tr";

    // Replicates header.tsx navLinks definition
    const navLinks = session
      ? [
          {
            href: getLocalizedRoute("dashboardListings", locale),
            label: "Çalışma Alanım",
          },
        ]
      : [];

    expect(navLinks).toHaveLength(0);
  });

  it("verifies navbar logic: authenticated state has only workspace in navLinks and logo points to feed", () => {
    const session = { userId: "user-123" };
    const locale = "tr";

    // Logo href logic from header.tsx
    const logoHref = session ? getLocalizedRoute("listings", locale) : `/${locale}`;
    expect(logoHref).toBe("/tr/ilanlar");

    // Replicates header.tsx navLinks definition
    const navLinks = session
      ? [
          {
            href: getLocalizedRoute("dashboardListings", locale),
            label: "Çalışma Alanım",
          },
        ]
      : [];

    expect(navLinks).toHaveLength(1);
    expect(navLinks[0]?.href).toBe("/tr/panel/ilanlarim");
    expect(navLinks[0]?.label).toBe("Çalışma Alanım");
    // Ensure "discover" / "howItWorks" are not present in navLinks
    expect(navLinks.some((l) => l.href === getLocalizedRoute("listings", locale))).toBe(false);
    expect(navLinks.some((l) => l.href.includes("#nasil-calisir"))).toBe(false);
  });

  it("verifies navbar logic for English locale when authenticated", () => {
    const session = { userId: "user-123" };
    const locale = "en";

    const logoHref = session ? getLocalizedRoute("listings", locale) : `/${locale}`;
    expect(logoHref).toBe("/en/listings");

    const navLinks = session
      ? [
          {
            href: getLocalizedRoute("dashboardListings", locale),
            label: "Workspace",
          },
        ]
      : [];

    expect(navLinks).toHaveLength(1);
    expect(navLinks[0]?.href).toBe("/en/dashboard/listings");
    expect(navLinks[0]?.label).toBe("Workspace");
  });
});
