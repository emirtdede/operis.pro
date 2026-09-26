import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/src/lib/config/url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  const privateAndDisallowedPaths = [
    "/dashboard/",
    "/*/dashboard/",
    "/panel/",
    "/*/panel/",
    "/messages/",
    "/*/messages/",
    "/mesajlar/",
    "/*/mesajlar/",
    "/work/",
    "/*/work/",
    "/workspace/",
    "/*/workspace/",
    "/calisma-alani/",
    "/*/calisma-alani/",
    "/settings/",
    "/*/settings/",
    "/ayarlar/",
    "/*/ayarlar/",
    "/admin/",
    "/api/",
    "/*?*q=*",
    "/*?*search=*",
  ];

  return {
    rules: [
      {
        userAgent: "OAI-SearchBot",
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: privateAndDisallowedPaths,
      },
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
        disallow: privateAndDisallowedPaths,
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: privateAndDisallowedPaths,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
