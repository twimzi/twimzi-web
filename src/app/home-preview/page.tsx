import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CategorySection } from "@/components/home/category-section";
import { BusinessSections } from "@/components/home/business-sections";
import { BusinessCta } from "@/components/home/business-cta";
import { AndroidAppSection } from "@/components/home/android-app-section";
import { HomePreviewHero } from "@/components/home/home-preview-hero";
import CommunityStories, { type CommunityStory } from "@/components/community/community-stories";

export const metadata: Metadata = {
  title: "Homepage V2 Preview | Twimzi",
  description: "Private design preview of the proposed Twimzi homepage.",
  robots: { index: false, follow: false },
};

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

async function getPreviewStories(): Promise<CommunityStory[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_business_stories", { p_limit: 12 });
  if (error || !data) return [];

  return (data as Array<{
    id: string;
    caption: string | null;
    media_object_path: string | null;
    media_mime_type: string | null;
    business_name: string;
    business_slug: string | null;
    business_id: string;
    created_at: string;
  }>).flatMap((story) => {
    if (!story.media_object_path || !story.media_mime_type?.startsWith("image/")) return [];
    return [{
      id: story.id,
      caption: story.caption,
      imageUrl: `https://twimzi-media.twimziofficial.workers.dev/media/${story.media_object_path}`,
      businessName: story.business_name,
      businessUrl: story.business_slug ? `/businesses/${story.business_slug}` : `/businesses/${story.business_id}`,
      createdAt: story.created_at,
    }];
  });
}

export default async function HomePreviewPage() {
  const supabase = await createSupabaseServerClient();
  const [
    { data: businessData },
    { data: categoryData, error: categoryError },
    stories,
  ] = await Promise.all([
    supabase.rpc("get_public_businesses", { p_search: null, p_limit: 50, p_offset: 0 }),
    supabase.rpc("get_public_categories"),
    getPreviewStories(),
  ]);

  const businesses = (businessData ?? []) as Business[];
  const categories = (categoryData ?? []) as Category[];
  const featured = businesses.filter((business) => business.is_featured === true).slice(0, 6);
  const latest = [...businesses]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-[#D9ECE9] bg-[#F0FAF8] px-4 py-2 text-center text-xs font-semibold tracking-wide text-[#087F75]">
        HOMEPAGE V2 PREVIEW · Your existing homepage is unchanged
      </div>
      <HomePreviewHero />
      <div className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <CommunityStories stories={stories} />
      </div>
      <CategorySection categories={categories} error={Boolean(categoryError)} />
      <BusinessSections featured={featured} latest={latest} />
      <section className="bg-[#F7FAFA] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0D9488]">Business intelligence</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#14243D]">Ideas to move your business forward</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">Explore practical guides, industry updates and opportunities from the Twimzi business network.</p>
            </div>
            <Link href="/news" className="text-sm font-bold text-[#0D9488] hover:underline">Explore business news →</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/news" className="rounded-2xl border border-[#E2E8F0] bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <span className="text-2xl">📰</span><h3 className="mt-4 text-lg font-bold text-[#14243D]">Business news</h3><p className="mt-2 text-sm leading-6 text-[#64748B]">Keep up with policy, trade, manufacturing and MSME developments.</p>
            </a>
            <Link href="/blog" className="rounded-2xl border border-[#E2E8F0] bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <span className="text-2xl">📚</span><h3 className="mt-4 text-lg font-bold text-[#14243D]">Growth guides</h3><p className="mt-2 text-sm leading-6 text-[#64748B]">Practical resources for starting, managing and growing a business.</p>
            </a>
            <Link href="/offers" className="rounded-2xl border border-[#E2E8F0] bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <span className="text-2xl">🏷️</span><h3 className="mt-4 text-lg font-bold text-[#14243D]">Business offers</h3><p className="mt-2 text-sm leading-6 text-[#64748B]">Discover current offers shared by businesses on Twimzi.</p>
            </a>
          </div>
        </div>
      </section>
      <BusinessCta />
      <AndroidAppSection />
      <footer className="border-t border-[#E2E8F0] bg-[#F8FAFC] py-8 text-center text-sm text-[#64748B]">
        Twimzi · Discover Businesses. Find Suppliers. Grow Together.
      </footer>
    </main>
  );
}
