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
  "/add-business",
  "/login",
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

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: now,
    changeFrequency:
      route === "/" ||
      route === "/businesses" ||
      route === "/products" ||
      route === "/services" ||
      route === "/offers"
        ? "daily"
        : "monthly",
    priority:
      route === "/"
        ? 1
        : route === "/businesses" ||
            route === "/products" ||
            route === "/services" ||
            route === "/offers"
          ? 0.8
          : 0.5,
  }));
}