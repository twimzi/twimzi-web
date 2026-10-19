import type { MetadataRoute } from "next";

import { createSupabaseServerClient } from "@/lib/supabase/server";
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

type PublicBusiness = {
  id: string;
  slug: string | null;
  updated_at: string | null;
};

type PublicCategory = {
  id: string;
  category_name: string;
  slug: string | null;
};

function getCategorySlug(category: PublicCategory): string {
  return category.slug?.trim() ||
    category.category_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = routes.map((route) => ({
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

  const businessPages: MetadataRoute.Sitemap = [];
  const categoryPages: MetadataRoute.Sitemap = [];

  try {
    const supabase = await createSupabaseServerClient();
    const pageSize = 100;
    let offset = 0;

    while (true) {
      const { data, error } = await supabase.rpc("get_public_businesses", {
        p_search: null,
        p_limit: pageSize,
        p_offset: offset,
      });

      if (error || !data) {
        console.error("Failed to load businesses for sitemap:", error);
        break;
      }

      const businesses = data as PublicBusiness[];

      for (const business of businesses) {
        const identifier = business.slug?.trim() || business.id;
        if (!identifier) continue;

        const lastModified = business.updated_at
          ? new Date(business.updated_at)
          : now;

        businessPages.push({
          url: `${siteConfig.url}/businesses/${encodeURIComponent(identifier)}`,
          lastModified: Number.isNaN(lastModified.getTime()) ? now : lastModified,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }

      if (businesses.length < pageSize) break;
      offset += pageSize;
    }

    const { data: categoryData, error: categoryError } =
      await supabase.rpc("get_public_categories");

    if (categoryError) {
      console.error("Failed to load categories for sitemap:", categoryError);
    } else {
      const categories = (categoryData ?? []) as PublicCategory[];

      for (const category of categories) {
        const slug = getCategorySlug(category);
        if (!category.id || !slug) continue;

        const { data, error } = await supabase.rpc(
          "get_public_businesses_by_category",
          {
            p_category_id: category.id,
            p_search: null,
            p_limit: 1,
            p_offset: 0,
          },
        );

        if (error || !data || data.length === 0) continue;

        categoryPages.push({
          url: `${siteConfig.url}/businesses/category/${encodeURIComponent(slug)}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  } catch (error) {
    console.error("Unable to generate dynamic sitemap entries:", error);
  }

  return [...staticPages, ...businessPages, ...categoryPages];
}
