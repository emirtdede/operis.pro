import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/src/lib/config/url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: [
          "GPTBot",
          "PerplexityBot",
          "ClaudeBot",
          "Google-Extended",
          "Applebot-Extended",
          "CCBot",
        ],
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: [
          "/dashboard/",
          "/*/dashboard/",
          "/panel/",
          "/*/panel/",
          "/work/",
          "/*/work/",
          "/workspace/",
          "/*/workspace/",
          "/calisma-alani/",
          "/*/calisma-alani/",
          "/settings/",
          "/*/settings/",
          "/admin/",
          "/api/",
        ],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/*/dashboard/",
          "/panel/",
          "/*/panel/",
          "/work/",
          "/*/work/",
          "/workspace/",
          "/*/workspace/",
          "/calisma-alani/",
          "/*/calisma-alani/",
          "/settings/",
          "/*/settings/",
          "/admin/",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
