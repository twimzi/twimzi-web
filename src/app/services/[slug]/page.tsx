import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Clock3, Store, Wrench } from "lucide-react";
import { notFound } from "next/navigation";

import { StructuredData } from "@/components/seo/structured-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
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

async function getService(slug: string): Promise<Service | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_public_services", {
    p_search: slug,
    p_limit: 60,
    p_offset: 0,
  });

  if (error || !data) {
    return null;
  }

  const services = data as Service[];

  return (
    services.find(
      (service) =>
        typeof service.slug === "string" &&
        service.slug.toLowerCase() === slug.toLowerCase(),
    ) ?? null
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);

  if (!service) {
    return {
      title: "Service Not Found | Twimzi",
    };
  }

  const name = service.service_name?.trim() || "Service";
  const business = service.business_name?.trim();

  const description =
    service.short_description?.trim() ||
    service.description?.trim() ||
    `${name}${business ? ` from ${business}` : ""} on Twimzi.`;

  const canonicalUrl = `https://www.twimzi.com/services/${service.slug}`;

  return {
    title: `${name} | Twimzi`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${name} | Twimzi`,
      description,
      type: "website",
      url: canonicalUrl,
    },
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = await getService(slug);

  if (!service) {
    notFound();
  }

  const name = service.service_name?.trim() || "Unnamed Service";

  const description =
    service.description?.trim() ||
    service.short_description?.trim() ||
    "No service description available.";

  const shortDescription =
    service.short_description?.trim() ||
    "Discover this service from a local business on Twimzi.";

  const duration = formatDuration(service.duration_minutes);

  const businessHref = service.business_slug
    ? `/businesses/${service.business_slug}`
    : "/businesses";

  const serviceUrl = `https://www.twimzi.com/services/${service.slug}`;
  const serviceSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: serviceUrl,
    ...(service.business_name ? {
      provider: {
        "@type": "LocalBusiness",
        name: service.business_name,
        ...(service.business_slug ? { url: `https://www.twimzi.com/businesses/${service.business_slug}` } : {}),
      },
    } : {}),
    ...(service.price !== null ? {
      offers: {
        "@type": "Offer",
        url: serviceUrl,
        priceCurrency: "INR",
        price: service.price,
        availability: "https://schema.org/InStock",
      },
    } : {}),
    ...(service.duration_minutes && service.duration_minutes > 0 ? { duration: `PT${service.duration_minutes}M` } : {}),
    ...(service.service_code ? { identifier: service.service_code } : {}),
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <StructuredData data={serviceSchema} />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Services
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-square overflow-hidden bg-slate-100 sm:aspect-[4/3]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] bg-white text-slate-400 shadow-sm">
                  <Wrench className="h-16 w-16" />
                </div>
              </div>

              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                {service.is_featured ? (
                  <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white">
                    Featured
                  </span>
                ) : null}

                {service.home_service_available ? (
                  <span className="rounded-full border border-white/60 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-900 backdrop-blur">
                    Home Service
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Wrench className="h-4 w-4" />
              Service
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {name}
            </h1>

            {service.service_code ? (
              <p className="mt-2 text-sm font-medium text-slate-400">
                Service code: {service.service_code}
              </p>
            ) : null}

            <p className="mt-5 text-base leading-7 text-slate-600">
              {shortDescription}
            </p>

            <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-3xl font-extrabold text-slate-950">
                {formatPrice(service.price)}
              </p>

              {duration ? (
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Clock3 className="h-4 w-4" />
                  Duration: {duration}
                </div>
              ) : null}

              {service.booking_required ? (
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  Booking available
                </div>
              ) : null}

              {service.home_service_available ? (
                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">
                    Home service available
                  </span>

                  {service.service_radius_km !== null ? (
                    <span>
                      {" "}
                      within {service.service_radius_km} km.
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={businessHref}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <Store className="h-4 w-4" />
                View Business
              </Link>

              <Link
                href="/services"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
              >
                More Services
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-slate-500" />
              <h2 className="text-xl font-bold text-slate-950">
                Service Details
              </h2>
            </div>

            <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {description}
            </div>
          </article>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <Store className="h-5 w-5 text-slate-600" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">
                  Offered by
                </p>

                <p className="truncate text-base font-bold text-slate-950">
                  {service.business_name || "Business"}
                </p>
              </div>
            </div>

            <Link
              href={businessHref}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
            >
              Visit Business
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}