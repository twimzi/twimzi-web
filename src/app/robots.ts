import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = [
    "/admin/",
    "/api/",
    "/auth/",
    "/businesses/dashboard/",
    "/add-business",
    "/messages/",
    "/login",
    "/register",
    "/forgot-password",
    "/update-password",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
      // Explicitly document access for major answer/search crawlers.
      // These rules do not override the private-path restrictions above.
      {
        userAgent: ["GPTBot", "OAI-SearchBot"],
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
