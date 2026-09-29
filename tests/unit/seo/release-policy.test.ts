import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateMetadata as generateListingsMetadata } from "@/src/app/[locale]/listings/page";
import { generateMetadata as generateLoginMetadata } from "@/src/app/[locale]/login/page";
import { generateMetadata as generateRegisterMetadata } from "@/src/app/[locale]/register/page";
import { metadata as dashboardMetadata } from "@/src/app/[locale]/dashboard/layout";
import { notifyListingIndexNow } from "@/src/lib/seo/indexnow";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("SEO release policy", () => {
  it("indexes only the unfiltered listings catalog", async () => {
    const root = await generateListingsMetadata({
      params: Promise.resolve({ locale: "tr" }),
      searchParams: Promise.resolve({}),
    });
    const filtered = await generateListingsMetadata({
      params: Promise.resolve({ locale: "tr" }),
      searchParams: Promise.resolve({ q: "react", category: "web-development" }),
    });

    expect(root.robots).toMatchObject({ index: true, follow: true });
    expect(filtered.robots).toMatchObject({ index: false, follow: true });
    expect(filtered.alternates?.canonical).toBe("https://operis.pro/tr/ilanlar");
  });

  it("keeps authentication and dashboard routes out of the index", async () => {
    const [login, register] = await Promise.all([
      generateLoginMetadata({ params: Promise.resolve({ locale: "tr" }) }),
      generateRegisterMetadata({ params: Promise.resolve({ locale: "en" }) }),
    ]);

    expect(login.robots).toMatchObject({ index: false, follow: true });
    expect(register.robots).toMatchObject({ index: false, follow: true });
    expect(dashboardMetadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("does not emit structured data on private workspaces or deprecated SearchAction data", () => {
    const workspaceSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/[locale]/work/[id]/page.tsx"),
      "utf8"
    );
    const homeSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/[locale]/page.tsx"),
      "utf8"
    );

    expect(workspaceSource).not.toContain("<JsonLd");
    expect(workspaceSource).not.toContain('"@type": "BreadcrumbList"');
    expect(homeSource).not.toContain('"@type": "SearchAction"');

    const dashboardRoot = path.join(process.cwd(), "src/app/[locale]/dashboard");
    const dashboardPages = fs
      .readdirSync(dashboardRoot, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx"));
    for (const entry of dashboardPages) {
      const source = fs.readFileSync(path.join(entry.parentPath, entry.name), "utf8");
      expect(source).not.toContain("<JsonLd");
    }
  });

  it("uses an hourly salary unit only for hourly listings and provides a dynamic OG image", () => {
    const listingSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/[locale]/listings/[slug]/page.tsx"),
      "utf8"
    );
    const ogImagePath = path.join(
      process.cwd(),
      "src/app/[locale]/listings/[slug]/opengraph-image.tsx"
    );

    expect(listingSource).toContain('listing.budgetMode.startsWith("HOURLY_")');
    expect(listingSource).toContain('unitText: "HOUR"');
    expect(listingSource).not.toContain('unitText: "PROJECT"');
    expect(fs.existsSync(ogImagePath)).toBe(true);
  });

  it("submits both localized listing URLs to IndexNow in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "https://operis.pro");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 202 }));

    const result = notifyListingIndexNow("ornek-ilan");
    expect(result).toBeDefined();
    await result;

    const request = fetchMock.mock.calls[0];
    expect(request?.[0]).toBe("https://api.indexnow.org/indexnow");
    const body = JSON.parse(String((request?.[1] as RequestInit | undefined)?.body));
    expect(body.urlList).toEqual([
      "https://operis.pro/tr/ilanlar/ornek-ilan",
      "https://operis.pro/en/listings/ornek-ilan",
    ]);
  });
});
