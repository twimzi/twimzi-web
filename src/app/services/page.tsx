import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, Search, Store, Wrench } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Services | Twimzi",
  description:
    "Discover services from professionals, home service providers, shops, and local businesses on Twimzi.",
};

type Service = {
  id: string;
  business_id: string;
  business_name: string | null;
  business_slug: string | null;
  service_code: string | null;
  service_name: string | null;
  slug: string | null;
  short_description: string | null;
  description: string | null;
  duration_minutes: number | null;
  price: number | null;
  booking_required: boolean | null;
  home_service_available: boolean | null;
  service_radius_km: number | null;
  is_featured: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type SearchParams = {
  q?: string;
};

function formatPrice(value: number | null) {
  if (value === null || value === undefined) {
    return "Contact for price";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDuration(value: number | null) {
  if (!value || value <= 0) {
    return null;
  }

  if (value < 60) {
    return `${value} min`;
  }

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function getInitial(name: string | null) {
  return (name?.trim().charAt(0) || "S").toUpperCase();
}

function getBusinessHref(service: Service) {
  return service.business_slug
    ? `/businesses/${service.business_slug}`
    : "/businesses";
}

function ServiceCard({ service }: { service: Service }) {
  const name = service.service_name?.trim() || "Unnamed Service";

  const description =
    service.short_description?.trim() ||
    service.description?.trim() ||
    "No service description available.";

  const duration = formatDuration(service.duration_minutes);

  return (
    <article className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40 hover:shadow-[var(--shadow-md)]">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[var(--color-secondary)]">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-4xl font-bold text-[var(--color-text-muted)] shadow-sm transition group-hover:scale-105">
          {getInitial(service.service_name)}
        </div>

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {service.is_featured ? (
            <span className="rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-xs font-bold text-[var(--color-text)] backdrop-blur">
              Featured
            </span>
          ) : null}

          {service.home_service_available ? (
            <span className="rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-xs font-bold text-white">
              Home Service
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-base font-bold leading-6 text-[var(--color-text)]">
              {name}
            </h2>

            {service.service_code ? (
              <p className="mt-1 text-xs font-medium text-[var(--color-text-muted)]">
                {service.service_code}
              </p>
            ) : null}
          </div>

          <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-text-muted)]" />
        </div>

        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-[var(--color-text-muted)]">
          {description}
        </p>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-base font-extrabold text-[var(--color-text)]">
              {formatPrice(service.price)}
            </p>

            {duration ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <Clock3 className="h-3.5 w-3.5" />
                {duration}
              </p>
            ) : null}
          </div>

          {service.booking_required ? (
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text)]">
              Booking available
            </span>
          ) : null}
        </div>

        {service.home_service_available &&
        service.service_radius_km !== null ? (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Home service within {service.service_radius_km} km
          </p>
        ) : null}

        <div className="mt-4 border-t border-[var(--color-border)] pt-4">
          <Link
            href={getBusinessHref(service)}
            className="flex items-center justify-between gap-3 text-sm font-semibold text-[var(--color-text)] transition group-hover:text-[var(--color-primary)]"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Store className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />

              <span className="truncate">
                {service.business_name || "View Business"}
              </span>
            </span>

            <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_public_services", {
    p_search: search || null,
    p_limit: 60,
    p_offset: 0,
  });

  const services = (data ?? []) as Service[];

  const featuredServices = services.filter(
    (service) => service.is_featured === true,
  );

  const regularServices = services.filter(
    (service) => service.is_featured !== true,
  );

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[var(--color-background)]">
      <section className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)]">
              <Wrench className="h-4 w-4" />
              Service Discovery
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
              Discover Services on Twimzi
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-muted)] sm:text-lg">
              Find professionals, home service providers, specialists, and
              local businesses offering services near you.
            </p>
          </div>

          <form
            method="get"
            className="mt-8 flex w-full max-w-3xl flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-muted)]" />

              <input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Search services, professionals, businesses..."
                className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white pl-11 pr-4 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                aria-label="Search services"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Search className="h-4 w-4" />
              Search
            </button>

            {search ? (
              <Link
                href="/services"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-5 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                Clear
              </Link>
            ) : null}
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            <p className="font-bold">Unable to load services.</p>
            <p className="mt-1">Please try again in a moment.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-muted)]">
                  {services.length}{" "}
                  {services.length === 1 ? "service" : "services"} found
                </p>

                <h2 className="mt-1 text-xl font-bold text-[var(--color-text)]">
                  {search ? `Results for “${search}”` : "Latest Services"}
                </h2>
              </div>

              <Link
                href="/businesses"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)]"
              >
                <Store className="h-4 w-4" />
                Browse Businesses
              </Link>
            </div>

            {services.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-secondary)] text-[var(--color-text-muted)]">
                  <Search className="h-6 w-6" />
                </div>

                <h2 className="mt-4 text-lg font-bold text-[var(--color-text)]">
                  No services found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
                  {search
                    ? "Try a different service name, professional, or keyword."
                    : "There are no public services available yet."}
                </p>

                {search ? (
                  <Link
                    href="/services"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                  >
                    View all services
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="mt-8 space-y-10">
                {featuredServices.length > 0 ? (
                  <section>
                    <div className="mb-4 flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-[var(--color-text-muted)]" />

                      <h2 className="text-lg font-bold text-[var(--color-text)]">
                        Featured Services
                      </h2>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {featuredServices.map((service) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                {regularServices.length > 0 ? (
                  <section>
                    {featuredServices.length > 0 ? (
                      <div className="mb-4">
                        <h2 className="text-lg font-bold text-[var(--color-text)]">
                          More Services
                        </h2>
                      </div>
                    ) : null}

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {regularServices.map((service) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}