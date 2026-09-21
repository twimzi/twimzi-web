"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
  is_featured: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatPrice(value: number | null) {
  if (value === null || value === undefined) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDuration(minutes: number | null) {
  if (!minutes) return "—";

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return remaining > 0
    ? `${hours}h ${remaining}m`
    : `${hours}h`;
}

export default function AdminServicesPage() {
  const supabase = createSupabaseBrowserClient();

  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("You must be signed in.");
      }

      const { data: adminCheck, error: adminError } =
        await supabase.rpc("is_super_admin");

      if (adminError) {
        throw adminError;
      }

      if (!adminCheck) {
        setIsSuperAdmin(false);
        throw new Error(
          "You do not have permission to access this page.",
        );
      }

      setIsSuperAdmin(true);

      const { data, error: servicesError } = await supabase.rpc(
        "admin_get_services",
        {
          p_search: submittedSearch.trim() || null,
          p_business_id: null,
          p_limit: 100,
          p_offset: 0,
        },
      );

      if (servicesError) {
        throw servicesError;
      }

      setServices((data ?? []) as Service[]);
    } catch (err) {
      setServices([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load services.",
      );
    } finally {
      setLoading(false);
    }
  }, [submittedSearch, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadServices();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadServices]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(search);
  }

  function clearSearch() {
    setSearch("");
    setSubmittedSearch("");
  }

  if (!isSuperAdmin && !loading && error.includes("permission")) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Services
          </h1>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Services
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage services published by businesses on Twimzi.
          </p>
        </div>

        <Link
          href="/services"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          View Public Services
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Services Loaded</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {services.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Featured</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {featuredCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Booking Required</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {bookingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Home Service</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {homeServiceCount}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 md:flex-row"
        >
          <div className="flex-1">
            <label htmlFor="service-search" className="sr-only">
              Search services
            </label>

            <input
              id="service-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by service, code, slug, description or business..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Search
          </button>

          {submittedSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {error && !error.includes("permission") && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadServices()}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Service Directory
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Showing up to 100 services.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadServices()}
            disabled={loading}
            className="self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">
              S
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No services found
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {submittedSearch
                ? "No services match your search criteria."
                : "There are currently no services available to display."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">Service</th>
                    <th className="px-5 py-3">Business</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Duration</th>
                    <th className="px-5 py-3">Options</th>
                    <th className="px-5 py-3">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {services.map((service) => (
                    <tr
                      key={service.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {service.service_name ||
                              "Unnamed service"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {service.service_code ||
                              service.slug ||
                              service.id}
                          </p>

                          {service.short_description && (
                            <p className="mt-1 max-w-sm truncate text-xs text-slate-400">
                              {service.short_description}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/businesses/${service.business_id}`}
                          className="font-medium text-slate-700 hover:text-slate-900 hover:underline"
                        >
                          {service.business_name ||
                            "Unknown business"}
                        </Link>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {formatPrice(service.price)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {formatDuration(service.duration_minutes)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {service.is_featured && (
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                              Featured
                            </span>
                          )}

                          {service.booking_required && (
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                              Booking
                            </span>
                          )}

                          {service.home_service_available && (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                              Home
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDate(service.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {services.map((service) => (
                <div key={service.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {service.service_name ||
                          "Unnamed service"}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {service.service_code ||
                          service.slug ||
                          service.id}
                      </p>
                    </div>

                    {service.is_featured && (
                      <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                        Featured
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/admin/businesses/${service.business_id}`}
                    className="mt-3 block text-sm font-medium text-slate-700 hover:text-slate-900 hover:underline"
                  >
                    {service.business_name ||
                      "Unknown business"}
                  </Link>

                  {service.short_description && (
                    <p className="mt-2 text-sm text-slate-500">
                      {service.short_description}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Price
                      </p>

                      <p className="mt-1 font-medium text-slate-900">
                        {formatPrice(service.price)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Duration
                      </p>

                      <p className="mt-1 font-medium text-slate-900">
                        {formatDuration(
                          service.duration_minutes,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {service.booking_required && (
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        Booking Required
                      </span>
                    )}

                    {service.home_service_available && (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        Home Service
                      </span>
                    )}

                    {service.service_radius_km !== null && (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        Radius: {service.service_radius_km} km
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-xs text-slate-400">
                    Created {formatDate(service.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}