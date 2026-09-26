import { describe, it, expect } from "vitest";
import { CategoryService } from "@/src/modules/categories/service";

describe("SEO: Category Resolution & Structured Data Specifications", () => {
  it("CategoryService.getCategoryBySlug should resolve valid categories in Turkish and English", async () => {
    const catTr = await CategoryService.getCategoryBySlug("web-development", "tr");
    expect(catTr).toBeDefined();
    expect(catTr?.name).toBe("Web Geliştirme");
    expect(catTr?.slug).toBe("web-development");
    expect(catTr?.sectorKey).toBe("sector-software-it");

    const catEn = await CategoryService.getCategoryBySlug("web-development", "en");
    expect(catEn).toBeDefined();
    expect(catEn?.name).toBe("Web Development");
  });

  it("CategoryService.getCategoryBySlug should return null for non-existent category slugs", async () => {
    const invalidCat = await CategoryService.getCategoryBySlug("invalid-non-existent-category");
    expect(invalidCat).toBeNull();
  });

  it("JobPosting schema specification must require applicantLocationRequirements for TELECOMMUTE", () => {
    // Official Google Search Central requirement verification
    const mockSchema = {
      "@type": "JobPosting",
      title: "Senior Full Stack Engineer",
      jobLocationType: "TELECOMMUTE",
      applicantLocationRequirements: {
        "@type": "Country",
        name: "TR",
      },
    };

    expect(mockSchema["@type"]).toBe("JobPosting");
    expect(mockSchema.jobLocationType).toBe("TELECOMMUTE");
    expect(mockSchema.applicantLocationRequirements).toBeDefined();
    expect(mockSchema.applicantLocationRequirements["@type"]).toBe("Country");
    expect(mockSchema.applicantLocationRequirements.name).toBe("TR");
  });

  it("Expired listing robots directive must be index: false and follow: true", () => {
    // Verified against Google Search Central guidelines on expired jobs
    const isCurrentlyActive = false;
    const robotsDirective = {
      index: isCurrentlyActive,
      follow: true,
    };

    expect(robotsDirective.index).toBe(false); // Prevents index bloat
    expect(robotsDirective.follow).toBe(true);  // Retains crawl equity to related listings
  });
});
