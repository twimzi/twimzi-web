import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { siteConfig } from "@/config/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type Business = {
  id: string;
  owner_profile_id: string | null;
  business_code: string | null;
  business_name: string;
  legal_name: string | null;
  slug: string | null;
  public_handle: string | null;
  description: string | null;
  business_type: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  website: string | null;
  established_year: number | null;
  gst_number: string | null;
  pan_number: string | null;
  verification_status: string | null;
  business_status: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  total_followers: number | null;
  total_views: number | null;
  created_at: string | null;
  updated_at: string | null;
  is_active: boolean;
  is_featured: boolean;
  featured_until: string | null;
  boost_until: string | null;
  priority_score: number | null;
  profile_completion: number | null;
  qr_scan_count: number | null;
  business_card_download_count: number | null;
  logo_media_id: string | null;
  cover_media_id: string | null;
};

type Product = {
  id: string;
  product_code: string | null;
  sku: string | null;
  product_name: string;
  slug: string | null;
  selling_price: number | null;
  mrp: number | null;
  stock_quantity: number | null;
  is_active: boolean;
  is_featured: boolean;
};

type Service = {
  id: string;
  service_code: string | null;
  service_name: string;
  slug: string | null;
  price: number | null;
  duration_minutes: number | null;
  booking_required: boolean | null;
  home_service_available: boolean | null;
  is_featured: boolean;
};

type Post = {
  id: string;
  post_type: string | null;
  title: string | null;
  slug: string | null;
  short_description: string | null;
  is_featured: boolean;
  is_pinned: boolean;
  is_active: boolean;
  published_at: string | null;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
};

type Media = {
  logo_bucket_name: string | null;
  logo_object_path: string | null;
  logo_mime_type: string | null;
  logo_is_public: boolean | null;
  cover_bucket_name: string | null;
  cover_object_path: string | null;
  cover_mime_type: string | null;
  cover_is_public: boolean | null;
};

const STATUSES = [
  "draft",
  "pending",
  "approved",
  "rejected",
  "suspended",
] as const;

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatNumber(value: number | null) {
  return new Intl.NumberFormat("en-IN").format(value ?? 0);
}

function getStatusClass(status: string | null) {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";
    case "suspended":
      return "bg-slate-100 text-slate-700 border-slate-300";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function getMediaPublicUrl(path: string | null) {
  if (!path) return null;

  return `${siteConfig.media.publicUrl}/media/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/businesses");
  }

  const { data, error } = await supabase.rpc("is_super_admin");

  if (error || data !== true) {
    redirect("/admin");
  }

  return supabase;
}

async function changeStatus(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!id || !STATUSES.includes(status as (typeof STATUSES)[number])) {
    return;
  }

  const supabase = await requireSuperAdmin();

  await supabase.rpc("admin_set_business_status", {
    p_business_id: id,
    p_status: status,
  });

  revalidatePath("/admin/businesses");
  revalidatePath(`/admin/businesses/${id}`);
}

async function toggleFeatured(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const featured = String(formData.get("featured") ?? "") === "true";

  if (!id) return;

  const supabase = await requireSuperAdmin();

  const featuredUntil = featured
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  await supabase.rpc("admin_set_business_featured", {
    p_business_id: id,
    p_is_featured: featured,
    p_featured_until: featuredUntil,
  });

  revalidatePath("/admin/businesses");
  revalidatePath(`/admin/businesses/${id}`);
}

async function boostBusiness(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");

  if (!id) return;

  const supabase = await requireSuperAdmin();

  const boostUntil = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  await supabase.rpc("admin_set_business_boost", {
    p_business_id: id,
    p_boost_until: boostUntil,
  });

  revalidatePath("/admin/businesses");
  revalidatePath(`/admin/businesses/${id}`);
}

async function updatePriority(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const priority = Number(formData.get("priority") ?? 0);

  if (!id || !Number.isFinite(priority)) return;

  const supabase = await requireSuperAdmin();

  await supabase.rpc("admin_set_business_priority", {
    p_business_id: id,
    p_priority_score: Math.trunc(priority),
  });

  revalidatePath("/admin/businesses");
  revalidatePath(`/admin/businesses/${id}`);
}

export default async function AdminBusinessDetail({ params }: PageProps) {
  const { id } = await params;

  const supabase = await requireSuperAdmin();

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select(
      [
        "id",
        "owner_profile_id",
        "business_code",
        "business_name",
        "legal_name",
        "slug",
        "public_handle",
        "description",
        "business_type",
        "email",
        "phone",
        "whatsapp_number",
        "website",
        "established_year",
        "gst_number",
        "pan_number",
        "verification_status",
        "business_status",
        "average_rating",
        "total_reviews",
        "total_followers",
        "total_views",
        "created_at",
        "updated_at",
        "is_active",
        "is_featured",
        "featured_until",
        "boost_until",
        "priority_score",
        "profile_completion",
        "qr_scan_count",
        "business_card_download_count",
        "logo_media_id",
        "cover_media_id",
      ].join(","),
    )
    .eq("id", id)
    .maybeSingle();

  if (businessError || !business) {
    return (
      <div>
        <Link
          href="/admin/businesses"
          className="text-sm font-semibold text-[var(--color-primary)]"
        >
          ← Back to Businesses
        </Link>

        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Business not found or could not be loaded.
        </div>
      </div>
    );
  }

  const typedBusiness = business as unknown as Business;

  const [
    productsResult,
    servicesResult,
    postsResult,
    mediaResult,
    ownerResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id,product_code,sku,product_name,slug,selling_price,mrp,stock_quantity,is_active,is_featured",
      )
      .eq("business_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50),

    supabase
      .from("services")
      .select(
        "id,service_code,service_name,slug,price,duration_minutes,booking_required,home_service_available,is_featured",
      )
      .eq("business_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50),

    supabase
      .from("business_posts")
      .select(
        "id,post_type,title,slug,short_description,is_featured,is_pinned,is_active,published_at,like_count,comment_count,share_count",
      )
      .eq("business_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50),

    supabase.rpc("get_public_business_media", {
      p_business_id: id,
    }),

    typedBusiness.owner_profile_id
      ? supabase
          .from("profiles")
          .select(
            "id,full_name,email,phone,username,city,state,country,is_active",
          )
          .eq("id", typedBusiness.owner_profile_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const products = (productsResult.data ?? []) as Product[];
  const services = (servicesResult.data ?? []) as Service[];
  const posts = (postsResult.data ?? []) as Post[];
  const media = (mediaResult.data?.[0] ?? null) as Media | null;
  const owner = ownerResult.data;

  const logoUrl = media
    ? getMediaPublicUrl(media.logo_object_path)
    : null;

  const coverUrl = media
    ? getMediaPublicUrl(media.cover_object_path)
    : null;

  return (
    <div className="pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/businesses"
            className="text-sm font-semibold text-[var(--color-primary)]"
          >
            ← Back to Businesses
          </Link>

          <p className="mt-5 text-sm font-semibold text-[var(--color-primary)]">
            Business Management
          </p>

          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            {typedBusiness.business_name}
          </h1>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {typedBusiness.business_code ?? "No business code"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getStatusClass(
              typedBusiness.business_status,
            )}`}
          >
            {typedBusiness.business_status ?? "draft"}
          </span>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold capitalize text-slate-700">
            {typedBusiness.verification_status ?? "unverified"}
          </span>
        </div>
      </div>

      {coverUrl ? (
        <div className="relative mt-8 h-56 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-slate-100">
          <Image
            src={coverUrl}
            alt={`${typedBusiness.business_name} cover`}
            fill
            sizes="(max-width: 1024px) 100vw, 1200px"
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="mt-8 flex h-40 items-center justify-center rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[#020D3A] via-[#1879FD] to-[#8E07FB]">
          <span className="text-4xl font-black text-white">TWIMZI</span>
        </div>
      )}

      <div className="-mt-12 ml-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={`${typedBusiness.business_name} logo`}
            width={96}
            height={96}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span className="text-2xl font-black text-[var(--color-primary)]">
            {typedBusiness.business_name
              .split(/\s+/)
              .map((word) => word[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-extrabold">Business Information</h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Info label="Business Name" value={typedBusiness.business_name} />
            <Info label="Legal Name" value={typedBusiness.legal_name} />
            <Info label="Business Code" value={typedBusiness.business_code} />
            <Info label="Business Type" value={typedBusiness.business_type} />
            <Info label="Public Handle" value={typedBusiness.public_handle} />
            <Info label="Slug" value={typedBusiness.slug} />
            <Info label="Email" value={typedBusiness.email} />
            <Info label="Phone" value={typedBusiness.phone} />
            <Info label="WhatsApp" value={typedBusiness.whatsapp_number} />
            <Info label="Website" value={typedBusiness.website} />

            <Info
              label="Established Year"
              value={
                typedBusiness.established_year
                  ? String(typedBusiness.established_year)
                  : null
              }
            />

            <Info label="GST Number" value={typedBusiness.gst_number} />
            <Info label="PAN Number" value={typedBusiness.pan_number} />

            <Info
              label="Profile Completion"
              value={`${typedBusiness.profile_completion ?? 0}%`}
            />

            <Info
              label="Created"
              value={formatDate(typedBusiness.created_at)}
            />

            <Info
              label="Updated"
              value={formatDate(typedBusiness.updated_at)}
            />
          </div>

          {typedBusiness.description ? (
            <div className="mt-6 border-t border-[var(--color-border)] pt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                Description
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {typedBusiness.description}
              </p>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h2 className="text-lg font-extrabold">Admin Controls</h2>

          <div className="mt-5 space-y-5">
            <form action={changeStatus}>
              <input type="hidden" name="id" value={id} />

              <label
                htmlFor="status"
                className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]"
              >
                Business Status
              </label>

              <div className="mt-2 flex gap-2">
                <select
                  id="status"
                  name="status"
                  defaultValue={typedBusiness.business_status ?? "draft"}
                  className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
                >
                  Save
                </button>
              </div>
            </form>

            <div className="border-t border-[var(--color-border)] pt-5">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                Featured
              </p>

              <div className="mt-2 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold">
                    {typedBusiness.is_featured
                      ? "Featured"
                      : "Not Featured"}
                  </p>

                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {typedBusiness.featured_until
                      ? `Until ${formatDate(typedBusiness.featured_until)}`
                      : "No featured expiry"}
                  </p>
                </div>

                <form action={toggleFeatured}>
                  <input type="hidden" name="id" value={id} />

                  <input
                    type="hidden"
                    name="featured"
                    value={typedBusiness.is_featured ? "false" : "true"}
                  />

                  <button
                    type="submit"
                    className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-bold hover:bg-slate-50"
                  >
                    {typedBusiness.is_featured ? "Remove" : "Feature 30d"}
                  </button>
                </form>
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] pt-5">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                Boost
              </p>

              <div className="mt-2 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold">
                    {typedBusiness.boost_until
                      ? "Boost Active"
                      : "No Active Boost"}
                  </p>

                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {typedBusiness.boost_until
                      ? `Until ${formatDate(typedBusiness.boost_until)}`
                      : "Boost for 30 days"}
                  </p>
                </div>

                <form action={boostBusiness}>
                  <input type="hidden" name="id" value={id} />

                  <button
                    type="submit"
                    className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-bold hover:bg-slate-50"
                  >
                    Boost 30d
                  </button>
                </form>
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] pt-5">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                Priority Score
              </p>

              <form action={updatePriority} className="mt-2 flex gap-2">
                <input type="hidden" name="id" value={id} />

                <input
                  type="number"
                  name="priority"
                  defaultValue={typedBusiness.priority_score ?? 0}
                  min={0}
                  max={1000000}
                  className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
                />

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
                >
                  Update
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <h2 className="text-lg font-extrabold">Business Metrics</h2>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          <Metric
            label="Followers"
            value={formatNumber(typedBusiness.total_followers)}
          />

          <Metric
            label="Views"
            value={formatNumber(typedBusiness.total_views)}
          />

          <Metric
            label="Rating"
            value={String(typedBusiness.average_rating ?? 0)}
          />

          <Metric
            label="Reviews"
            value={formatNumber(typedBusiness.total_reviews)}
          />

          <Metric
            label="QR Scans"
            value={formatNumber(typedBusiness.qr_scan_count)}
          />

          <Metric
            label="Card Downloads"
            value={formatNumber(
              typedBusiness.business_card_download_count,
            )}
          />

          <Metric
            label="Priority"
            value={formatNumber(typedBusiness.priority_score)}
          />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <div>
          <h2 className="text-lg font-extrabold">Business Owner</h2>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Account connected to this business.
          </p>
        </div>

        {owner ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Name" value={owner.full_name} />
            <Info label="Username" value={owner.username} />
            <Info label="Email" value={owner.email} />
            <Info label="Phone" value={owner.phone} />
            <Info label="City" value={owner.city} />
            <Info label="State" value={owner.state} />
            <Info label="Country" value={owner.country} />

            <Info
              label="Account"
              value={owner.is_active ? "Active" : "Inactive"}
            />
          </div>
        ) : (
          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            No owner profile information is available.
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <div>
          <h2 className="text-lg font-extrabold">Products</h2>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {products.length} product
            {products.length === 1 ? "" : "s"} found.
          </p>
        </div>

        {products.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-[var(--color-surface)]">
                <tr>
                  {[
                    "Product",
                    "Code / SKU",
                    "Price",
                    "Stock",
                    "Active",
                    "Featured",
                  ].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-bold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b last:border-0"
                  >
                    <td className="px-4 py-3 font-semibold">
                      {product.product_name}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-500">
                      {product.product_code ?? "—"}
                      {product.sku ? ` / ${product.sku}` : ""}
                    </td>

                    <td className="px-4 py-3">
                      {product.selling_price != null
                        ? `₹${formatNumber(product.selling_price)}`
                        : "—"}
                    </td>

                    <td className="px-4 py-3">
                      {formatNumber(product.stock_quantity)}
                    </td>

                    <td className="px-4 py-3">
                      {product.is_active ? "Yes" : "No"}
                    </td>

                    <td className="px-4 py-3">
                      {product.is_featured ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="No products found." />
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <div>
          <h2 className="text-lg font-extrabold">Services</h2>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {services.length} service
            {services.length === 1 ? "" : "s"} found.
          </p>
        </div>

        {services.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-[var(--color-surface)]">
                <tr>
                  {[
                    "Service",
                    "Code",
                    "Price",
                    "Duration",
                    "Booking",
                    "Home Service",
                    "Featured",
                  ].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-bold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-semibold">
                      {service.service_name}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-500">
                      {service.service_code ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      {service.price != null
                        ? `₹${formatNumber(service.price)}`
                        : "—"}
                    </td>

                    <td className="px-4 py-3">
                      {service.duration_minutes
                        ? `${service.duration_minutes} min`
                        : "—"}
                    </td>

                    <td className="px-4 py-3">
                      {service.booking_required ? "Yes" : "No"}
                    </td>

                    <td className="px-4 py-3">
                      {service.home_service_available ? "Yes" : "No"}
                    </td>

                    <td className="px-4 py-3">
                      {service.is_featured ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="No services found." />
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <div>
          <h2 className="text-lg font-extrabold">Posts</h2>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {posts.length} post
            {posts.length === 1 ? "" : "s"} found.
          </p>
        </div>

        {posts.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-[var(--color-surface)]">
                <tr>
                  {[
                    "Title",
                    "Type",
                    "Published",
                    "Featured",
                    "Pinned",
                    "Likes",
                    "Comments",
                    "Shares",
                  ].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-bold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b last:border-0">
                    <td className="max-w-xs px-4 py-3 font-semibold">
                      {post.title ?? "Untitled"}

                      {post.short_description ? (
                        <div className="mt-1 truncate text-xs font-normal text-slate-500">
                          {post.short_description}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3 capitalize">
                      {post.post_type ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      {formatDate(post.published_at)}
                    </td>

                    <td className="px-4 py-3">
                      {post.is_featured ? "Yes" : "No"}
                    </td>

                    <td className="px-4 py-3">
                      {post.is_pinned ? "Yes" : "No"}
                    </td>

                    <td className="px-4 py-3">
                      {formatNumber(post.like_count)}
                    </td>

                    <td className="px-4 py-3">
                      {formatNumber(post.comment_count)}
                    </td>

                    <td className="px-4 py-3">
                      {formatNumber(post.share_count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="No posts found." />
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <h2 className="text-lg font-extrabold">Media</h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <MediaCard
            title="Logo"
            url={logoUrl}
            bucket={media?.logo_bucket_name}
            path={media?.logo_object_path}
            isPublic={media?.logo_is_public}
          />

          <MediaCard
            title="Cover"
            url={coverUrl}
            bucket={media?.cover_bucket_name}
            path={media?.cover_object_path}
            isPublic={media?.cover_is_public}
          />
        </div>
      </section>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value === null || value === undefined || value === ""
          ? "—"
          : String(value)}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[var(--color-surface)] p-4">
      <p className="text-xs font-semibold text-[var(--color-text-muted)]">
        {label}
      </p>

      <p className="mt-1 text-xl font-extrabold">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
      {text}
    </div>
  );
}

function MediaCard({
  title,
  url,
  bucket,
  path,
  isPublic,
}: {
  title: string;
  url: string | null;
  bucket?: string | null;
  path?: string | null;
  isPublic?: boolean | null;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
      <div className="relative h-56 bg-slate-100">
        {url ? (
          <Image
            src={url}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm font-semibold text-slate-400">
              No public {title.toLowerCase()} available
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] p-4">
        <p className="font-bold">{title}</p>

        <div className="mt-3 space-y-1 text-xs text-slate-500">
          <p>
            <span className="font-semibold">Bucket:</span>{" "}
            {bucket ?? "—"}
          </p>

          <p className="break-all">
            <span className="font-semibold">Path:</span>{" "}
            {path ?? "—"}
          </p>

          <p>
            <span className="font-semibold">Public:</span>{" "}
            {isPublic ? "Yes" : "No"}
          </p>
        </div>
      </div>
    </div>
  );
}