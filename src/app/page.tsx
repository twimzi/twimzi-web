import { BusinessSections } from "@/components/home/business-sections";
import { BusinessCta } from "@/components/home/business-cta";
import {
  HeroSection,
  type HeroInterestingItem,
} from "@/components/home/hero-section";
import { CategorySection } from "@/components/home/category-section";
import { DiscoverySection } from "@/components/home/discovery-section";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AndroidAppSection } from "@/components/home/android-app-section";

type Business = {
  id: string;
  business_name: string;
  slug: string | null;
  description: string | null;
  business_type: string | null;
  average_rating: number | null;
  total_followers: number | null;
  total_views: number | null;
  is_featured: boolean | null;
  featured_until: string | null;
  created_at: string;
};

type Category = {
  id: string;
  parent_id: string | null;
  category_code: string;
  category_name: string;
  slug: string | null;
  description: string | null;
  icon_name: string | null;
  image_media_id: string | null;
  sort_order: number | null;
  is_featured: boolean;
};

type Offer = {
  id: string;
  business_id: string;
  title: string;
  short_description: string | null;
  slug: string | null;
  created_at: string;
};

type Post = {
  id: string;
  business_id: string;
  title: string;
  short_description: string | null;
  slug: string | null;
  published_at: string | null;
  created_at: string;
};

export default async function Home() {
  const supabase = await createSupabaseServerClient();

  const [
    { data: businessData },
    { data: categoriesData, error: categoriesError },
    { data: offersData },
  ] = await Promise.all([
    supabase.rpc("get_public_businesses", {
      p_search: null,
      p_limit: 50,
      p_offset: 0,
    }),
    supabase.rpc("get_public_categories"),
    supabase
      .from("offers")
      .select(
        "id,business_id,title,short_description,slug,created_at",
      )
      .eq("is_active", true)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const businesses = (businessData ?? []) as Business[];
  const categories = (categoriesData ?? []) as Category[];
  const offers = (offersData ?? []) as Offer[];

  const featured = businesses
    .filter((business) => business.is_featured === true)
    .slice(0, 6);

  const latest = [...businesses]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime(),
    )
    .slice(0, 6);

  const businessMap = new Map(
    businesses.map((business) => [business.id, business]),
  );

  const postResults = await Promise.all(
    latest.slice(0, 3).map(async (business) => {
      const { data: posts } = await supabase.rpc(
        "get_public_business_posts",
        {
          p_business_id: business.id,
          p_limit: 1,
          p_offset: 0,
        },
      );

      return (posts ?? []) as Post[];
    }),
  );

  const posts = postResults
    .flat()
    .sort(
      (a, b) =>
        new Date(b.published_at ?? b.created_at).getTime() -
        new Date(a.published_at ?? a.created_at).getTime(),
    );

  const interestingItems: HeroInterestingItem[] = [];

  const newestBusiness = latest[0];

  if (newestBusiness) {
    interestingItems.push({
      icon: "🏪",
      type: "New on Twimzi",
      title: newestBusiness.business_name,
      description:
        newestBusiness.description ||
        "Just joined the Twimzi business network.",
      href: newestBusiness.slug
        ? `/businesses/${newestBusiness.slug}`
        : `/businesses/${newestBusiness.id}`,
    });
  }

  const featuredBusiness = featured[0];

  if (featuredBusiness) {
    interestingItems.push({
      icon: "⭐",
      type: "Featured Business",
      title: featuredBusiness.business_name,
      description:
        featuredBusiness.description ||
        "A business currently highlighted on Twimzi.",
      href: featuredBusiness.slug
        ? `/businesses/${featuredBusiness.slug}`
        : `/businesses/${featuredBusiness.id}`,
    });
  }

  const latestOffer = offers[0];

  if (latestOffer) {
    const offerBusiness = businessMap.get(latestOffer.business_id);

    interestingItems.push({
      icon: "🔥",
      type: "Latest Offer",
      title: latestOffer.title,
      description:
        latestOffer.short_description ||
        offerBusiness?.business_name ||
        "Discover this local offer.",
      href: latestOffer.slug
        ? `/offers/${latestOffer.slug}`
        : "/offers",
    });
  }

  const latestPost = posts[0];

  if (latestPost) {
    const postBusiness = businessMap.get(latestPost.business_id);

    interestingItems.push({
      icon: "📢",
      type: "Latest Update",
      title: latestPost.title,
      description:
        latestPost.short_description ||
        postBusiness?.business_name ||
        "Latest update from a local business.",
      href: postBusiness?.slug
        ? `/businesses/${postBusiness.slug}`
        : postBusiness
          ? `/businesses/${postBusiness.id}`
          : "/community",
    });
  }

  while (interestingItems.length < 4) {
    const fallbacks: HeroInterestingItem[] = [
      {
        icon: "🏪",
        type: "Discover",
        title: "Local Businesses",
        description: "Find businesses around you.",
        href: "/businesses",
      },
      {
        icon: "🔥",
        type: "Explore",
        title: "Local Offers",
        description: "Discover offers from local businesses.",
        href: "/offers",
      },
      {
        icon: "🛍️",
        type: "Marketplace",
        title: "Products",
        description: "Browse products from local sellers.",
        href: "/products",
      },
      {
        icon: "🛠️",
        type: "Services",
        title: "Local Services",
        description: "Find professionals and service providers.",
        href: "/services",
      },
    ];

    const fallback = fallbacks[interestingItems.length];

    if (fallback) {
      interestingItems.push(fallback);
    } else {
      break;
    }
  }

  return (
    <>
      <HeroSection interestingItems={interestingItems} />

      <CategorySection
        categories={categories}
        error={Boolean(categoriesError)}
      />

      <BusinessSections
        featured={featured}
        latest={latest}
      />

      <DiscoverySection businesses={businesses} />

      <AndroidAppSection />

      <BusinessCta />
    </>
  );
}