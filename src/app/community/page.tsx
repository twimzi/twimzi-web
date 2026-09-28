import type { Metadata } from "next";
import Link from "next/link";

import BusinessPostCard from "@/components/business/business-post-card";
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

async function getCommunityPosts(
  search: string,
): Promise<BusinessPost[]> {
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

  return uniquePosts
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

  const posts = await getCommunityPosts(search);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1879FD]">
              Twimzi Community
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#020D3A] sm:text-4xl">
              Discover what local businesses are sharing
            </h1>

            <p className="mt-4 text-base leading-7 text-slate-600">
              Explore business updates, announcements, offers, news and
              other public posts from businesses on Twimzi.
            </p>
          </div>

          <form
            method="get"
            className="mt-7 flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Search businesses..."
              aria-label="Search businesses"
              className="h-12 flex-1 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1879FD] focus:ring-4 focus:ring-blue-100"
            />

            <button
              type="submit"
              className="h-12 rounded-2xl bg-[#1879FD] px-6 text-sm font-semibold text-white transition hover:bg-[#1268df]"
            >
              Search
            </button>

            {search && (
              <Link
                href="/community"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Clear
              </Link>
            )}
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#020D3A]">
              Latest from businesses
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Public business content from across Twimzi.
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1879FD]">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
        </div>

        {posts.length > 0 ? (
          <div className="space-y-5">
            {posts.map((post) => (
              <BusinessPostCard
                key={post.id}
                post={post}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#1879FD]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
                />
              </svg>
            </div>

            <h3 className="mt-5 text-lg font-bold text-[#020D3A]">
              No community posts found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {search
                ? "Try another business search or clear the search to explore the latest posts."
                : "Business updates and community posts will appear here as businesses publish them."}
            </p>

            {search && (
              <Link
                href="/community"
                className="mt-6 inline-flex rounded-xl bg-[#1879FD] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1268df]"
              >
                Explore all posts
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  );
}