import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import BusinessFollowButton from "@/components/business/business-follow-button";
import BusinessPostCard from "@/components/business/business-post-card";
import { MessageBusinessButton } from "@/components/messaging/message-business-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";

type Business = {
  id: string;
  business_code: string;
  business_name: string;
  slug: string | null;
  description: string | null;
  business_type: string | null;
  business_type_id: string | null;
  logo_media_id: string | null;
  cover_media_id: string | null;
  website: string | null;
  established_year: number | null;
  verification_status: string;
  business_status: string;
  average_rating: number | null;
  total_reviews: number;
  total_followers: number;
  total_views: number;
  public_handle: string | null;
  share_url: string | null;
  profile_completion: number;
  is_featured: boolean;
  featured_until: string | null;
  boost_until: string | null;
  priority_score: number;
  created_at: string;
  updated_at: string;
};

type BusinessMedia = {
  logo_bucket_name: string | null;
  logo_object_path: string | null;
  logo_mime_type: string | null;
  logo_is_public: boolean | null;
  logo_width: number | null;
  logo_height: number | null;
  cover_bucket_name: string | null;
  cover_object_path: string | null;
  cover_mime_type: string | null;
  cover_is_public: boolean | null;
  cover_width: number | null;
  cover_height: number | null;
};

type Product = {
  id: string;
  business_id: string;
  category_id: string | null;
  product_code: string | null;
  product_name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  brand: string | null;
  model: string | null;
  selling_price: number | null;
  mrp: number | null;
  stock_quantity: number | null;
  is_featured: boolean;
  thumbnail_url: string | null;
  image_count: number | null;
  created_at: string;
  updated_at: string;
};

type Service = {
  id: string;
  business_id: string;
  category_id: string | null;
  service_code: string | null;
  service_name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  duration_minutes: number | null;
  price: number | null;
  booking_required: boolean;
  home_service_available: boolean;
  service_radius_km: number | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
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

type PostComment = {
  id: string;
  post_id: string;
  parent_comment_id: string | null;
  comment: string;
  is_edited: boolean;
  is_pinned: boolean;
  like_count: number;
  reply_count: number;
  created_at: string;
};

type Offer = Record<string, unknown>;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    post?: string;
  }>;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function formatPrice(value: number | null): string | null {
  if (value === null) {
    return null;
  }

  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDuration(minutes: number | null): string | null {
  if (minutes === null || minutes <= 0) {
    return null;
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (remaining === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remaining} min`;
}

function formatDate(value: unknown): string | null {
  const dateValue = asString(value);

  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatOfferValue(offer: Offer): string | null {
  const discountType = asString(offer.discount_type);
  const discountValue = asNumber(offer.discount_value);

  if (discountValue === null) {
    return null;
  }

  if (discountType === "percentage") {
    return `${discountValue}% OFF`;
  }

  if (
    discountType === "fixed" ||
    discountType === "amount" ||
    discountType === "flat"
  ) {
    return `₹${discountValue.toLocaleString("en-IN")} OFF`;
  }

  return `${discountValue}`;
}

function getStoragePublicUrl(
  supabaseUrl: string,
  bucketName: string | null,
  objectPath: string | null,
  isPublic: boolean | null,
): string | null {
  if (!bucketName || !objectPath || isPublic !== true) {
    return null;
  }

  const encodedPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(
    bucketName,
  )}/${encodedPath}`;
}

async function getBusiness(slug: string): Promise<Business | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_public_businesses", {
    p_search: null,
    p_limit: 100,
    p_offset: 0,
  });

  if (error || !data) {
    return null;
  }

  const normalizedSlug = slug.trim().toLowerCase();

  return (
    (data as Business[]).find((business) => {
      const id = business.id.toLowerCase();
      const businessSlug = business.slug?.trim().toLowerCase() ?? "";
      const publicHandle =
        business.public_handle?.trim().toLowerCase() ?? "";

      return (
        id === normalizedSlug ||
        businessSlug === normalizedSlug ||
        publicHandle === normalizedSlug
      );
    }) ?? null
  );
}

async function getBusinessMedia(
  businessId: string,
): Promise<BusinessMedia | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_public_business_media", {
    p_business_id: businessId,
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0] as BusinessMedia;
}

async function getProducts(businessId: string): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc(
    "get_public_business_products",
    {
      p_business_id: businessId,
      p_limit: 24,
      p_offset: 0,
    },
  );

  return error || !data ? [] : (data as Product[]);
}

async function getServices(businessId: string): Promise<Service[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc(
    "get_public_business_services",
    {
      p_business_id: businessId,
      p_limit: 24,
      p_offset: 0,
    },
  );

  return error || !data ? [] : (data as Service[]);
}

async function getOffers(businessId: string): Promise<Offer[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_active_offers", {
    p_business_id: businessId,
  });

  return error || !data ? [] : (data as Offer[]);
}

async function getPosts(businessId: string): Promise<BusinessPost[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc(
    "get_public_business_posts",
    {
      p_business_id: businessId,
      p_limit: 24,
      p_offset: 0,
    },
  );

  return error || !data ? [] : (data as BusinessPost[]);
}

async function getPostComments(postId: string): Promise<PostComment[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc(
    "get_public_business_post_comments",
    {
      p_post_id: postId,
      p_limit: 100,
      p_offset: 0,
    },
  );

  return error || !data ? [] : (data as PostComment[]);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusiness(slug);

  if (!business) {
    return {
      title: "Business Not Found | Twimzi",
    };
  }

  const description =
    business.description?.trim() ||
    `${business.business_name} on Twimzi — discover products, services, offers and business information.`;

  const businessPath = `/businesses/${business.slug || business.id}`;
  const canonicalUrl = new URL(businessPath, siteConfig.url).toString();

  return {
    title: `${business.business_name} | Twimzi`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${business.business_name} | Twimzi`,
      description,
      url: canonicalUrl,
      type: "website",
    },
  };
}

export default async function BusinessDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { post: selectedPostId } = await searchParams;

  const business = await getBusiness(slug);

  if (!business) {
    notFound();
  }

  const [media, products, services, offers, posts] = await Promise.all([
    getBusinessMedia(business.id),
    getProducts(business.id),
    getServices(business.id),
    getOffers(business.id),
    getPosts(business.id),
  ]);

  const selectedPost =
    selectedPostId && posts.length > 0
      ? posts.find((post) => post.id === selectedPostId) ?? null
      : null;

  const comments = selectedPost
    ? await getPostComments(selectedPost.id)
    : [];

  const website = asString(business.website);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const logoUrl = supabaseUrl
    ? getStoragePublicUrl(
        supabaseUrl,
        media?.logo_bucket_name ?? null,
        media?.logo_object_path ?? null,
        media?.logo_is_public ?? null,
      )
    : null;

  const coverUrl = supabaseUrl
    ? getStoragePublicUrl(
        supabaseUrl,
        media?.cover_bucket_name ?? null,
        media?.cover_object_path ?? null,
        media?.cover_is_public ?? null,
      )
    : null;

  const businessHref = `/businesses/${business.slug || business.id}`;
  const canonicalUrl = new URL(businessHref, siteConfig.url).toString();

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": canonicalUrl,
    name: business.business_name,
    url: canonicalUrl,
    description:
      business.description?.trim() ||
      `${business.business_name} on Twimzi — discover products, services, offers and business information.`,
  };

  if (logoUrl) {
    structuredData.image = logoUrl;
    structuredData.logo = logoUrl;
  }

  if (website) {
    structuredData.sameAs = [website];
  }

  if (business.established_year) {
    structuredData.foundingDate = String(business.established_year);
  }

  if (
    business.average_rating !== null &&
    Number.isFinite(Number(business.average_rating)) &&
    business.total_reviews > 0
  ) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(business.average_rating).toFixed(1),
      reviewCount: business.total_reviews,
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <main className="min-h-screen bg-slate-50">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="relative h-56 overflow-hidden sm:h-72 lg:h-80">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={`${business.business_name} cover`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-[linear-gradient(120deg,#020d3a_0%,#1879fd_48%,#8e07fb_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(5,205,252,0.35),transparent_35%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(142,7,251,0.35),transparent_35%)]" />
            </>
          )}

          {coverUrl && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
          )}
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-20 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:-mt-24 sm:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-white shadow-lg sm:h-36 sm:w-36">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={`${business.business_name} logo`}
                      width={144}
                      height={144}
                      priority
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image
                      src="/twimzi-mark.png"
                      alt="Twimzi"
                      width={96}
                      height={96}
                      priority
                      className="h-20 w-20 object-contain sm:h-24 sm:w-24"
                    />
                  )}
                </div>

                <div className="pb-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {business.is_featured && (
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                        Featured
                      </span>
                    )}

                    {business.verification_status === "verified" && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl font-bold tracking-tight text-[#020D3A] sm:text-4xl">
                    {business.business_name}
                  </h1>

                  {business.business_type && (
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      {business.business_type}
                    </p>
                  )}

                  <p className="mt-1 text-sm text-slate-400">
                    {business.business_code}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <BusinessFollowButton businessId={business.id} />

                <MessageBusinessButton businessId={business.id} />

                {website && (
                  <a
                    href={
                      website.startsWith("http://") ||
                      website.startsWith("https://")
                        ? website
                        : `https://${website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-[#020D3A] transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {/* SELECTED POST */}
            {selectedPost && (
              <section
                id="post"
                className="scroll-mt-24 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-7"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#1879FD]">
                      Community Post
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-[#020D3A]">
                      {selectedPost.title || "Business Update"}
                    </h2>
                  </div>

                  <Link
                    href={`${businessHref}#community`}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    All Posts
                  </Link>
                </div>

                <div className="mt-6">
                  <BusinessPostCard post={selectedPost} />
                </div>

                {/* COMMENTS */}
                <section
                  id="comments"
                  className="mt-6 scroll-mt-24 rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#020D3A]">
                        Comments
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {comments.length}{" "}
                        {comments.length === 1 ? "comment" : "comments"}
                      </p>
                    </div>
                  </div>

                  {comments.length > 0 ? (
                    <div className="mt-5 divide-y divide-slate-200">
                      {comments.map((comment) => (
                        <article
                          key={comment.id}
                          className="py-4 first:pt-0 last:pb-0"
                        >
                          <div className="flex gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-[#1879FD]">
                              T
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-[#020D3A]">
                                  Twimzi User
                                </span>

                                {formatDate(comment.created_at) && (
                                  <span className="text-xs text-slate-400">
                                    {formatDate(comment.created_at)}
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                                {comment.comment}
                              </p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl bg-white px-5 py-8 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-lg">
                        💬
                      </div>

                      <p className="mt-3 text-sm font-semibold text-[#020D3A]">
                        No comments yet
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        There are no comments on this post yet.
                      </p>
                    </div>
                  )}
                </section>
              </section>
            )}

            {/* ABOUT */}
            {!selectedPost && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-[#020D3A]">
                  About Business
                </h2>

                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {business.description ||
                    "This business has not added a description yet."}
                </p>
              </section>
            )}

            {/* COMMUNITY */}
            {!selectedPost && posts.length > 0 && (
              <section
                id="community"
                className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#020D3A]">
                      Latest Posts
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Updates and community content from this business
                    </p>
                  </div>

                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                    {posts.length}
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  {posts.map((post) => (
                    <BusinessPostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}

            {/* PRODUCTS */}
            {products.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#020D3A]">
                      Products
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Products offered by this business
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1879FD]">
                    {products.length}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => {
                    const price = formatPrice(product.selling_price);
                    const mrp = formatPrice(product.mrp);

                    return (
                      <article
                        key={product.id}
                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                      >
                        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-100">
                          {product.thumbnail_url ? (
                            <Image
                              src={product.thumbnail_url}
                              alt={product.product_name}
                              width={600}
                              height={450}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="text-4xl font-bold text-slate-300">
                              T
                            </div>
                          )}

                          {product.is_featured && (
                            <span className="absolute left-3 top-3 rounded-full bg-purple-600 px-2.5 py-1 text-[11px] font-bold text-white">
                              Featured
                            </span>
                          )}
                        </div>

                        <div className="p-4">
                          <h3 className="line-clamp-2 font-bold text-[#020D3A]">
                            {product.product_name}
                          </h3>

                          {(product.brand || product.model) && (
                            <p className="mt-1 text-xs text-slate-400">
                              {[product.brand, product.model]
                                .filter(Boolean)
                                .join(" • ")}
                            </p>
                          )}

                          {product.short_description && (
                            <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">
                              {product.short_description}
                            </p>
                          )}

                          <div className="mt-4 flex items-end gap-2">
                            {price && (
                              <span className="text-lg font-bold text-[#1879FD]">
                                {price}
                              </span>
                            )}

                            {mrp &&
                              product.mrp !== product.selling_price && (
                                <span className="text-xs text-slate-400 line-through">
                                  {mrp}
                                </span>
                              )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SERVICES */}
            {services.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#020D3A]">
                      Services
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Services provided by this business
                    </p>
                  </div>

                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                    {services.length}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {services.map((service) => {
                    const price = formatPrice(service.price);
                    const duration = formatDuration(
                      service.duration_minutes,
                    );

                    return (
                      <article
                        key={service.id}
                        className="rounded-2xl border border-slate-200 p-5 transition hover:border-purple-200 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-[#020D3A]">
                              {service.service_name}
                            </h3>

                            {service.service_code && (
                              <p className="mt-1 text-xs text-slate-400">
                                {service.service_code}
                              </p>
                            )}
                          </div>

                          {service.is_featured && (
                            <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-bold text-purple-700">
                              Featured
                            </span>
                          )}
                        </div>

                        {service.short_description && (
                          <p className="mt-3 text-sm leading-6 text-slate-500">
                            {service.short_description}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          {price && (
                            <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#1879FD]">
                              {price}
                            </span>
                          )}

                          {duration && (
                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                              {duration}
                            </span>
                          )}

                          {service.booking_required && (
                            <span className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
                              Booking Required
                            </span>
                          )}

                          {service.home_service_available && (
                            <span className="rounded-lg bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700">
                              Home Service
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* OFFERS */}
            {offers.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#020D3A]">
                      Active Offers
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Current offers from this business
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {offers.length}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {offers.map((offer, index) => {
                    const title =
                      asString(offer.title) ||
                      asString(offer.offer_title) ||
                      "Special Offer";

                    const description =
                      asString(offer.short_description) ||
                      asString(offer.description);

                    const discount = formatOfferValue(offer);

                    const endDate =
                      formatDate(offer.end_at) ||
                      formatDate(offer.end_date);

                    return (
                      <article
                        key={asString(offer.id) ?? `offer-${index}`}
                        className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:shadow-md"
                      >
                        {discount && (
                          <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                            {discount}
                          </span>
                        )}

                        <h3 className="mt-3 font-bold text-[#020D3A]">
                          {title}
                        </h3>

                        {description && (
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {description}
                          </p>
                        )}

                        {endDate && (
                          <p className="mt-4 text-xs font-medium text-slate-400">
                            Valid until {endDate}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* EMPTY */}
            {!selectedPost &&
              products.length === 0 &&
              services.length === 0 &&
              offers.length === 0 &&
              posts.length === 0 && (
                <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                    ✦
                  </div>

                  <h2 className="mt-4 text-lg font-bold text-[#020D3A]">
                    Business profile is being built
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Products, services, offers and posts will appear here
                    when this business adds them.
                  </p>
                </section>
              )}
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#020D3A]">
                Business Overview
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-[#1879FD]">
                    {business.total_followers.toLocaleString("en-IN")}
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Followers
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-[#8E07FB]">
                    {business.total_views.toLocaleString("en-IN")}
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Views
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-[#05CDFC]">
                    {business.average_rating !== null
                      ? Number(business.average_rating).toFixed(1)
                      : "—"}
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Rating
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-[#020D3A]">
                    {business.profile_completion}%
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Profile
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#020D3A]">
                Business Information
              </h2>

              <div className="mt-5 space-y-4">
                {business.established_year && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Established
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {business.established_year}
                    </p>
                  </div>
                )}

                {business.public_handle && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Twimzi Handle
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[#1879FD]">
                      @{business.public_handle}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Business ID
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                    {business.business_code}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
      </main>
    </>
  );
}