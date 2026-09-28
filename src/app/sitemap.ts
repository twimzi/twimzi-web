import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

const routes = [
  "/",
  "/about",
  "/contact",
  "/explore",
  "/businesses",
  "/products",
  "/services",
  "/offers",
  "/community",
  "/add-business",
  "/privacy-policy",
  "/terms-and-conditions",
  "/acceptable-use",
  "/community-guidelines",
  "/business-terms",
  "/marketplace-policy",
  "/user-content-policy",
  "/intellectual-property-policy",
  "/messaging-policy",
  "/data-deletion-policy",
  "/grievance-redressal",
  "/cookie-policy",
  "/refund-policy",
  "/shipping-policy",
  "/disclaimer",
];

const highPriorityRoutes = new Set([
  "/",
  "/businesses",
  "/products",
  "/services",
  "/offers",
  "/community",
]);

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: now,
    changeFrequency: highPriorityRoutes.has(route) ? "daily" : "monthly",
    priority:
      route === "/"
        ? 1
        : highPriorityRoutes.has(route)
          ? 0.8
          : 0.5,
  }));
}