import type { Metadata } from "next";
import Link from "next/link";

import BusinessPostCard from "@/components/business/business-post-card";
import CommunityStories, { type CommunityStory } from "@/components/community/community-stories";
import CommunityCreateAction from "@/components/community/community-create-action";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Business = {
  id: string;
  business_name: string;
  slug: string | null;
  public_handle: string | null;
  business_type: string | null;
  is_featured: boolean;
  priority_score: number;
};

type BusinessPost = {
  id: string;
  business_id: string;
  category_id: string | null;
  post_type: string | null;
  title: string | null;
  slug: string | null;
  short_description: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_featured: boolean;
  is_pinned: boolean;
  published_at: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  save_count: number;
  imageUrl?: string | null;
};

type SearchParams = {
  q?: string;
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export const metadata: Metadata = {
  title: "Community | Twimzi",
  description:
    "Discover the latest updates, announcements, offers and posts from local businesses on Twimzi.",
};

async function getBusinesses(search: string): Promise<Business[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_public_businesses", {
    p_search: search || null,
    p_limit: 24,
    p_offset: 0,
  });

  if (error || !data) {
    return [];
  }

  return data as Business[];
}

async function getBusinessPosts(
  businessId: string,
): Promise<BusinessPost[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc(
    "get_public_business_posts",
    {
      p_business_id: businessId,
      p_limit: 8,
      p_offset: 0,
    },
  );

  if (error || !data) {
    return [];
  }

  return data as BusinessPost[];
}

async function getCommunityStories(): Promise<CommunityStory[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_business_stories", {
    p_limit: 24,
  });

  if (error || !data) return [];

  const rows = data as Array<{
    id: string;
    caption: string | null;
    media_object_path: string | null;
    media_mime_type: string | null;
    business_name: string;
    business_slug: string | null;
    business_id: string;
    created_at: string;
  }>;

  return rows.flatMap((story) => {
    if (!story.media_object_path || !story.media_mime_type?.startsWith("image/")) {
      return [];
    }

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

async function getCommunityPosts(
  search: string,
): Promise<BusinessPost[]> {
  const supabase = await createSupabaseServerClient();
  const businesses = await getBusinesses(search);

  if (businesses.length === 0) {
    return [];
  }

  const results = await Promise.all(
    businesses.map(async (business) => {
      const posts = await getBusinessPosts(business.id);

      return posts.map((post) => ({
        ...post,
        business_name: business.business_name,
        business_slug: business.slug,
        business_public_handle: business.public_handle,
        business_type: business.business_type,
      }));
    }),
  );

  const posts = results.flat() as BusinessPost[];

  const uniquePosts = Array.from(
    new Map(posts.map((post) => [post.id, post])).values(),
  );

  const postIds = uniquePosts.map((post) => post.id);
  const { data: mediaLinks } = postIds.length
    ? await supabase
        .from("business_post_media")
        .select("post_id, media_id, sort_order, is_active")
        .in("post_id", postIds)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const mediaIds = [...new Set((mediaLinks ?? []).map((link) => link.media_id).filter((id): id is string => Boolean(id)))];
  const { data: publicMedia } = mediaIds.length
    ? await supabase
        .from("media")
        .select("id, object_path, mime_type, is_public")
        .in("id", mediaIds)
        .eq("is_public", true)
    : { data: [] };

  const mediaById = new Map((publicMedia ?? []).map((media) => [media.id, media]));
  const firstImageByPost = new Map<string, string>();

  for (const link of mediaLinks ?? []) {
    if (firstImageByPost.has(link.post_id) || !link.media_id) continue;
    const media = mediaById.get(link.media_id);
    if (!media?.object_path || !media.mime_type?.startsWith("image/")) continue;
    firstImageByPost.set(
      link.post_id,
      `https://twimzi-media.twimziofficial.workers.dev/media/${media.object_path}`,
    );
  }

  return uniquePosts
    .map((post) => ({ ...post, imageUrl: firstImageByPost.get(post.id) ?? null }))
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) {
        return a.is_pinned ? -1 : 1;
      }

      if (a.is_featured !== b.is_featured) {
        return a.is_featured ? -1 : 1;
      }

      const dateA = new Date(
        a.published_at || a.created_at,
      ).getTime();

      const dateB = new Date(
        b.published_at || b.created_at,
      ).getTime();

      return dateB - dateA;
    })
    .slice(0, 48);
}

export default async function CommunityPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const search = params.q?.trim() || "";

  const [posts, stories] = await Promise.all([getCommunityPosts(search), getCommunityStories()]);

  return (
    <main className="twimzi-community-page min-h-screen bg-[#F7F8FC]">
      <section className="relative isolate overflow-hidden border-b border-[#E7EAF3] bg-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-[#0D9488]/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#F97316]/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.24] [background-image:radial-gradient(#0D9488_0.7px,transparent_0.7px)] [background-size:24px_24px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-9 sm:px-6 sm:pb-10 sm:pt-12 lg:px-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#E7D8FF] bg-white/85 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#087F75] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#0D9488] to-[#F97316]" />
                Twimzi Community
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#020D3A] sm:text-4xl lg:text-[2.75rem]">
                Your community, <span className="bg-gradient-to-r from-[#0D9488] via-[#0D9488] to-[#F97316] bg-clip-text text-transparent">in the loop.</span>
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-[#53627E] sm:text-lg">
                Discover updates, announcements, offers and stories shared by businesses around you.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-center">
              <form method="get" className="flex min-w-0 flex-1 gap-2 rounded-2xl border border-[#E2E8F3] bg-white p-1.5 shadow-[0_8px_30px_rgba(29,54,100,0.06)] lg:w-[390px] lg:flex-none">
                <input
                  type="search"
                  name="q"
                  defaultValue={search}
                  placeholder="Search businesses..."
                  aria-label="Search businesses"
                  className="h-11 min-w-0 flex-1 rounded-xl border-0 bg-transparent px-3 text-sm text-[#020D3A] outline-none placeholder:text-[#94A3B8] focus:ring-0"
                />
                <button type="submit" className="h-11 shrink-0 rounded-xl bg-gradient-to-r from-[#0D9488] via-[#0D9488] to-[#F97316] px-5 text-sm font-bold text-white shadow-sm transition hover:brightness-105">
                  Search
                </button>
                {search && (
                  <Link href="/community" className="inline-flex h-11 items-center rounded-xl px-3 text-sm font-semibold text-[#64748B] transition hover:bg-[#F3F7FF] hover:text-[#0D9488]">
                    Clear
                  </Link>
                )}
              </form>
              <div className="shrink-0">
                <CommunityCreateAction />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-10">
          <div className="min-w-0">
            <div className="mb-8 rounded-3xl border border-[#E5EAF4] bg-white p-5 shadow-[0_10px_34px_rgba(27,49,88,0.045)] sm:p-6">
              <CommunityStories stories={stories} />
            </div>

            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0D9488]">Community feed</p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#020D3A]">Latest from businesses</h2>
                <p className="mt-1 text-sm leading-6 text-[#64748B]">Public updates and conversations from across Twimzi.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#DCE8FF] bg-[#F1F6FF] px-3.5 py-2 text-xs font-bold text-[#0D9488]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0D9488]" />
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </span>
            </div>

            {posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <BusinessPostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-[#CBD6E8] bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F0E4FF] to-[#E4F8FF] text-[#0D9488]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-7 w-7" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#020D3A]">No community posts found</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">
                  {search
                    ? "Try another business search or clear the search to explore the latest posts."
                    : "Business updates and community posts will appear here as businesses publish them."}
                </p>
                {search && (
                  <Link href="/community" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-[#0D9488] to-[#0D9488] px-5 py-3 text-sm font-bold text-white transition hover:brightness-105">
                    Explore all posts
                  </Link>
                )}
              </div>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-3xl border border-[#E4E9F3] bg-white shadow-[0_12px_36px_rgba(27,49,88,0.06)]">
              <div className="h-1.5 bg-gradient-to-r from-[#0D9488] via-[#0D9488] to-[#F97316]" />
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#0D9488]">Made for local discovery</p>
                <h2 className="mt-2 text-xl font-extrabold leading-tight text-[#020D3A]">Good things happen when businesses share.</h2>
                <p className="mt-2 text-sm leading-6 text-[#64748B]">Follow stories, explore business updates and keep up with offers from your community.</p>
                <div className="mt-5 flex items-center justify-between border-t border-[#EEF1F7] pt-4">
                  <span className="text-sm font-semibold text-[#344365]">Explore the feed</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F6FF] text-[#0D9488]" aria-hidden="true">→</span>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-[#E4E9F3] bg-gradient-to-br from-[#F8F1FF] via-white to-[#FFF7F0] p-5">
              <p className="text-sm font-bold text-[#020D3A]">Have something to share?</p>
              <p className="mt-1 text-sm leading-6 text-[#64748B]">Publish a business update or add a story for your audience.</p>
              <div className="mt-4">
                <CommunityCreateAction />
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}