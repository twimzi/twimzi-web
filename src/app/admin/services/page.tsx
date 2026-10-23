import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { ServiceActions } from "@/components/admin/service-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Service = {
  id: string;
  business_id: string;
  business_name: string | null;
  service_code: string | null;
  service_name: string | null;
  slug: string | null;
  short_description: string | null;
  duration_minutes: number | null;
  price: number | null;
  booking_required: boolean | null;
  home_service_available: boolean | null;
  service_radius_km: number | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type SearchParams = {
  q?: string;
  page?: string;
};

const SERVICES_PER_PAGE = 25;
const SERVICES_FETCH_LIMIT = SERVICES_PER_PAGE + 1;
const SERVICES_MAX_PAGE = 10000;

function parsePageParam(
  value: string | undefined,
  maxPage: number
): number {
  const normalized = value?.trim() ?? "";

  if (!/^\d+$/.test(normalized)) return 1;

  const parsed = Number(normalized);

  if (parsed < 1) return 1;
  if (!Number.isSafeInteger(parsed) || parsed > maxPage) {
    return maxPage;
  }

  return parsed;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatNumber(value: number | null) {
  if (value === null || value === undefined) return "—";

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPrice(value: number | null) {
  if (value === null || value === undefined) return "—";

  return `₹${formatNumber(value)}`;
}

async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase.rpc("is_super_admin");

  if (error || data !== true) {
    redirect("/");
  }

  return supabase;
}

async function updateService(formData: FormData) {
  "use server";

  const serviceId = String(formData.get("service_id") ?? "").trim();
  const serviceName = String(formData.get("service_name") ?? "").trim();
  const serviceCode = String(formData.get("service_code") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("short_description") ?? "").trim();
  const duration = String(formData.get("duration_minutes") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim();
  const bookingRequired = formData.get("booking_required") === "true";
  const homeService = formData.get("home_service_available") === "true";
  const radius = String(formData.get("service_radius_km") ?? "").trim();
  const isFeatured = formData.get("is_featured") === "true";
  const isActive = formData.get("is_active") === "true";

  if (!serviceId) {
    throw new Error("Service ID is required.");
  }
  if (!serviceName) {
    throw new Error("Service name is required.");
  }
  if (!serviceCode) {
    throw new Error("Service code is required.");
  }
  if (!price) {
    throw new Error("Price is required.");
  }

  const parsedPrice = Number(price);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    throw new Error("Price must be a valid non-negative number.");
  }

  let parsedDuration: number | null = null;
  if (duration !== "") {
    parsedDuration = Number(duration);
    if (!Number.isFinite(parsedDuration) || parsedDuration < 0) {
      throw new Error("Duration must be a valid non-negative number.");
    }
  }

  let parsedRadius: number | null = null;
  if (radius !== "") {
    parsedRadius = Number(radius);
    if (!Number.isFinite(parsedRadius) || parsedRadius < 0) {
      throw new Error("Service radius must be a valid non-negative number.");
    }
  }

  const supabase = await requireSuperAdmin();

  const { error } = await supabase.rpc("admin_update_service", {
    p_service_id: serviceId,
    p_service_name: serviceName,
    p_service_code: serviceCode,
    p_slug: slug || null,
    p_short_description: description || null,
    p_duration_minutes: parsedDuration,
    p_price: parsedPrice,
    p_booking_required: bookingRequired,
    p_home_service_available: homeService,
    p_service_radius_km: parsedRadius,
    p_is_featured: isFeatured,
    p_is_active: isActive,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/services");
}

async function deleteService(formData: FormData) {
  "use server";

  const serviceId = String(formData.get("service_id") ?? "").trim();

  if (!serviceId) {
    throw new Error("Service ID is required.");
  }

  const supabase = await requireSuperAdmin();

  const { error } = await supabase.rpc("admin_delete_service", {
    p_service_id: serviceId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/services");
}

export default async function AdminServices({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const page = parsePageParam(params.page, SERVICES_MAX_PAGE);
  const offset = (page - 1) * SERVICES_PER_PAGE;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          Service Management
        </p>

        <h1 className="mt-1 text-3xl font-extrabold">
          Services
        </h1>

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Please sign in to access service administration.
        </div>
      </div>
    );
  }

  const { data: isSuperAdmin, error: authError } =
    await supabase.rpc("is_super_admin");

  if (authError || isSuperAdmin !== true) {
    return (
      <div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          Service Management
        </p>

        <h1 className="mt-1 text-3xl font-extrabold">
          Services
        </h1>

        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          You do not have permission to access service administration.
        </div>
      </div>
    );
  }

  const { data, error } = await supabase.rpc("admin_get_services", {
    p_search: search || null,
    p_business_id: null,
    p_limit: SERVICES_FETCH_LIMIT,
    p_offset: offset,
  });

  const fetchedServices = (data ?? []) as Service[];
  const hasNextPage = fetchedServices.length > SERVICES_PER_PAGE;
  const services = hasNextPage ? fetchedServices.slice(0, SERVICES_PER_PAGE) : fetchedServices;

  const activeCount = services.filter(
    (service) => service.is_active,
  ).length;

  const featuredCount = services.filter(
    (service) => service.is_featured,
  ).length;

  const bookingCount = services.filter(
    (service) => service.booking_required,
  ).length;

  const homeServiceCount = services.filter(
    (service) => service.home_service_available,
  ).length;

  return (
    <div className="pb-12">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/admin/businesses"
            className="text-sm font-semibold text-[var(--color-primary)]"
          >
            ← Business Management
          </Link>

          <p className="mt-5 text-sm font-semibold text-[var(--color-primary)]">
            Service Management
          </p>

          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            Services
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Manage services across the Twimzi business marketplace.
          </p>
        </div>

        <form
          method="get"
          className="flex w-full gap-2 lg:w-auto"
        >
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search service or business..."
            className="w-full min-w-0 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] sm:w-[340px]"
          />

          <button
            type="submit"
            className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            Search
          </button>

          {search ? (
            <Link
              href="/admin/services"
              className="flex items-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-bold hover:bg-slate-50"
            >
              Clear
            </Link>
          ) : null}
        </form>
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-bold">Unable to load services.</p>

          <p className="mt-1 text-xs opacity-80">
            {error.message}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Services Loaded"
              value={services.length}
            />

            <StatCard
              label="Active"
              value={activeCount}
            />

            <StatCard
              label="Featured"
              value={featuredCount}
            />

            <StatCard
              label="Booking Required"
              value={bookingCount}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
              <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                Home Service
              </p>

              <p className="mt-1 text-2xl font-extrabold">
                {homeServiceCount}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
              <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                Catalogue Size
              </p>

              <p className="mt-1 text-2xl font-extrabold">
                {services.length}
              </p>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <h2 className="font-extrabold">
                  Service Catalogue
                </h2>

                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Showing page {page} ({services.length} services)
                  {search ? ` matching "${search}"` : ""}.
                </p>
              </div>

              <span className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-bold">
                {services.length}
              </span>
            </div>

            {services.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-bold">
                  No services found
                </p>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {search
                    ? "Try another search."
                    : "No services are currently available."}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-[1400px] w-full text-left text-sm">
                  <thead className="border-b bg-[var(--color-surface)]">
                    <tr>
                      {[
                        "Service",
                        "Business",
                        "Code",
                        "Price",
                        "Duration",
                        "Booking",
                        "Home Service",
                        "Radius",
                        "Status",
                        "Created",
                        "Actions",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-5 py-4 font-bold"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {services.map((service) => (
                      <tr
                        key={service.id}
                        className="border-b last:border-0 hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold">
                            {service.service_name ||
                              "Unnamed service"}
                          </p>

                          {service.short_description ? (
                            <p className="mt-1 max-w-[230px] truncate text-xs text-[var(--color-text-muted)]">
                              {service.short_description}
                            </p>
                          ) : null}

                          {service.slug ? (
                            <p className="mt-1 max-w-[230px] truncate text-xs text-slate-400">
                              /{service.slug}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[210px] truncate font-semibold">
                            {service.business_name || "—"}
                          </p>

                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            {service.business_id}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          {service.service_code || "—"}
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {formatPrice(service.price)}
                        </td>

                        <td className="px-5 py-4">
                          {service.duration_minutes !== null
                            ? `${formatNumber(
                                service.duration_minutes,
                              )} min`
                            : "—"}
                        </td>

                        <td className="px-5 py-4">
                          {service.booking_required ? (
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                              Required
                            </span>
                          ) : (
                            <span className="text-slate-500">
                              No
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {service.home_service_available ? (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                              Available
                            </span>
                          ) : (
                            <span className="text-slate-500">
                              No
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {service.service_radius_km !== null
                            ? `${formatNumber(
                                service.service_radius_km,
                              )} km`
                            : "—"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-col items-start gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                                service.is_active
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-slate-50 text-slate-600"
                              }`}
                            >
                              {service.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>

                            {service.is_featured ? (
                              <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
                                Featured
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-500">
                          {formatDate(service.created_at)}
                        </td>

                        <td className="px-5 py-4">
                          <ServiceActions
                            service={service}
                            onUpdate={updateService}
                            onDelete={deleteService}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-[var(--color-border)] px-5 py-4 flex items-center justify-between">
                <p className="text-xs text-[var(--color-text-muted)]">
                  Page {page} ({services.length} services)
                </p>

                <div className="flex items-center gap-2">
                  {page > 1 ? (
                    <Link
                      href={`/admin/services?${search ? `q=${encodeURIComponent(search)}&` : ''}page=${page - 1}`}
                      className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                      aria-label="Previous page"
                    >
                      Previous
                    </Link>
                  ) : (
                    <span
                      className="rounded-xl border border-transparent bg-[var(--color-surface)] px-3 py-2 text-xs font-bold text-[var(--color-text-muted)] cursor-not-allowed"
                      aria-label="Previous page"
                      aria-disabled="true"
                    >
                      Previous
                    </span>
                  )}

                  {hasNextPage ? (
                    <Link
                      href={`/admin/services?${search ? `q=${encodeURIComponent(search)}&` : ''}page=${page + 1}`}
                      className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                      aria-label="Next page"
                    >
                      Next
                    </Link>
                  ) : (
                    <span
                      className="rounded-xl border border-transparent bg-[var(--color-surface)] px-3 py-2 text-xs font-bold text-[var(--color-text-muted)] cursor-not-allowed"
                      aria-label="Next page"
                      aria-disabled="true"
                    >
                      Next
                    </span>
                  )}
                </div>
              </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
      <p className="text-xs font-semibold text-[var(--color-text-muted)]">
        {label}
      </p>

      <p className="mt-1 text-2xl font-extrabold">
        {value}
      </p>
    </div>
  );
}