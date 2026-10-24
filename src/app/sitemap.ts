import type { MetadataRoute } from "next";

import { createClient } from "@supabase/supabase-js";
import { siteConfig } from "@/config/site";

export const revalidate = 3600;

const routes = [
  "/", "/about", "/contact", "/explore", "/businesses", "/products",
  "/services", "/offers", "/community", "/blog", "/add-business", "/privacy-policy",
  "/terms-and-conditions", "/acceptable-use", "/community-guidelines",
  "/business-terms", "/marketplace-policy", "/user-content-policy",
  "/intellectual-property-policy", "/messaging-policy", "/data-deletion-policy",
  "/grievance-redressal", "/cookie-policy", "/refund-policy", "/shipping-policy",
  "/disclaimer",
];

const highPriorityRoutes = new Set([
  "/", "/businesses", "/products", "/services", "/offers", "/community", "/blog",
]);

type PublicBusiness = {
  id: string;
  slug: string | null;
  updated_at: string | null;
};

type BusinessLocation = {
  business_id: string;
  city: string;
  state: string;
};

type PublicCategory = {
  id: string;
  category_name: string;
  slug: string | null;
};

function slugPart(value: string): string {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
}

function getCategorySlug(category: PublicCategory): string {
  return slugPart(category.slug?.trim() || category.category_name);
}

function getLocationSlug(location: BusinessLocation): string {
  return `${slugPart(location.city)}-${slugPart(location.state)}`;
}

function createPublicSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: now,
    changeFrequency: highPriorityRoutes.has(route) ? "daily" : "monthly",
    priority: route === "/" ? 1 : highPriorityRoutes.has(route) ? 0.8 : 0.5,
  }));

  const businessPages: MetadataRoute.Sitemap = [];
  const blogPages: MetadataRoute.Sitemap = [];
  const categoryPages: MetadataRoute.Sitemap = [];
  const locationCounts = new Map<string, number>();

  try {
    const supabase = createPublicSupabaseClient();
    const { data: blogPosts, error: blogError } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1000);

    if (blogError) {
      console.error("Failed to load published blog posts for sitemap:", blogError);
    } else {
      for (const post of blogPosts ?? []) {
        if (!post.slug) continue;
        const modifiedValue = post.updated_at ?? post.published_at;
        const modified = modifiedValue ? new Date(modifiedValue) : now;
        blogPages.push({
          url: `${siteConfig.url}/blog/${encodeURIComponent(post.slug)}`,
          lastModified: Number.isNaN(modified.getTime()) ? now : modified,
          changeFrequency: "monthly",
          priority: 0.65,
        });
      }
    }

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
        if (identifier) {
          const modified = business.updated_at ? new Date(business.updated_at) : now;
          businessPages.push({
            url: `${siteConfig.url}/businesses/${encodeURIComponent(identifier)}`,
            lastModified: Number.isNaN(modified.getTime()) ? now : modified,
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }

      if (businesses.length < pageSize) break;
      offset += pageSize;
    }

    const { data: locationData, error: locationError } =
      await supabase.rpc("get_public_business_locations");

    if (locationError) {
      console.error("Failed to load public locations for sitemap:", locationError);
    } else {
      for (const location of (locationData ?? []) as BusinessLocation[]) {
        const slug = getLocationSlug(location);
        locationCounts.set(slug, (locationCounts.get(slug) ?? 0) + 1);
      }
    }

    const { data: categoryData, error: categoryError } =
      await supabase.rpc("get_public_categories");

    if (categoryError) {
      console.error("Failed to load categories for sitemap:", categoryError);
    } else {
      for (const category of (categoryData ?? []) as PublicCategory[]) {
        const slug = getCategorySlug(category);
        if (!category.id || !slug) continue;

        const { data, error } = await supabase.rpc("get_public_businesses_by_category", {
          p_category_id: category.id,
          p_search: null,
          p_limit: 1,
          p_offset: 0,
        });

        if (!error && data && data.length > 0) {
          categoryPages.push({
            url: `${siteConfig.url}/businesses/category/${encodeURIComponent(slug)}`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.6,
          });
        }
      }
    }
  } catch (error) {
    console.error("Unable to generate dynamic sitemap entries:", error);
  }

  const locationPages: MetadataRoute.Sitemap = [...locationCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([slug]) => ({
      url: `${siteConfig.url}/businesses/location/${encodeURIComponent(slug)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  return [...staticPages, ...blogPages, ...businessPages, ...categoryPages, ...locationPages];
}
