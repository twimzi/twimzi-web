import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Package, Search, Store, Tag } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Products | Twimzi",
  description:
    "Discover products from manufacturers, traders, wholesalers, dealers, and local businesses on Twimzi.",
};

type Product = {
  id: string;
  business_id: string;
  business_name: string | null;
  business_slug: string | null;
  product_code: string | null;
  product_name: string | null;
  slug: string | null;
  short_description: string | null;
  description: string | null;
  brand: string | null;
  model: string | null;
  selling_price: number | null;
  mrp: number | null;
  stock_quantity: number | null;
  is_featured: boolean | null;
  thumbnail_url: string | null;
  image_count: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type SearchParams = {
  q?: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPrice(value: number | null) {
  if (value === null || value === undefined) {
    return "Contact for price";
  }

  return `₹${formatNumber(value)}`;
}

function getProductInitial(productName: string | null) {
  return (productName?.trim().charAt(0) || "P").toUpperCase();
}

function getBusinessHref(product: Product) {
  if (!product.business_slug) {
    return "/businesses";
  }

  return `/businesses/${product.business_slug}`;
}

function ProductCard({ product }: { product: Product }) {
  const name = product.product_name?.trim() || "Unnamed Product";

  const description =
    product.short_description?.trim() ||
    product.description?.trim() ||
    "No product description available.";

  const hasDiscount =
    product.selling_price !== null &&
    product.mrp !== null &&
    product.mrp > product.selling_price;

  const discountPercent = hasDiscount
    ? Math.round(
        ((product.mrp! - product.selling_price!) / product.mrp!) * 100,
      )
    : 0;

  return (
    <article className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40 hover:shadow-[var(--shadow-md)]">
      <Link
        href={getBusinessHref(product)}
        className="block"
        aria-label={`View ${product.business_name || "business"} profile`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-secondary)]">
          {product.thumbnail_url ? (
            <div
              className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105"
              style={{
                backgroundImage: `url("${product.thumbnail_url.replace(/"/g, '\\"')}")`,
              }}
              role="img"
              aria-label={name}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-secondary)]">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-3xl font-bold text-[var(--color-text-muted)] shadow-sm">
                {getProductInitial(product.product_name)}
              </div>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {product.is_featured ? (
              <span className="rounded-full border border-white/50 bg-white/90 px-2.5 py-1 text-xs font-bold text-[var(--color-text)] backdrop-blur">
                Featured
              </span>
            ) : null}

            {discountPercent > 0 ? (
              <span className="rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-xs font-bold text-white">
                {discountPercent}% off
              </span>
            ) : null}
          </div>

          {product.image_count && product.image_count > 1 ? (
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
              {product.image_count} photos
            </span>
          ) : null}
        </div>
      </Link>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-base font-bold leading-6 text-[var(--color-text)]">
              {name}
            </h2>

            {product.brand || product.model ? (
              <p className="mt-1 line-clamp-1 text-xs font-medium text-[var(--color-text-muted)]">
                {[product.brand, product.model].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>

          <Package className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-text-muted)]" />
        </div>

        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-[var(--color-text-muted)]">
          {description}
        </p>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-base font-extrabold text-[var(--color-text)]">
              {formatPrice(product.selling_price)}
            </p>

            {hasDiscount ? (
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)] line-through">
                {formatPrice(product.mrp)}
              </p>
            ) : null}
          </div>

          {product.stock_quantity !== null ? (
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                product.stock_quantity > 0
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {product.stock_quantity > 0 ? "In stock" : "Out of stock"}
            </span>
          ) : null}
        </div>

        <div className="mt-4 border-t border-[var(--color-border)] pt-4">
          <Link
            href={getBusinessHref(product)}
            className="flex items-center justify-between gap-3 text-sm font-semibold text-[var(--color-text)] transition group-hover:text-[var(--color-primary)]"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Store className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />

              <span className="truncate">
                {product.business_name || "View Business"}
              </span>
            </span>

            <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_public_products", {
    p_search: search || null,
    p_limit: 60,
    p_offset: 0,
  });

  const products = (data ?? []) as Product[];

  const featuredProducts = products.filter(
    (product) => product.is_featured === true,
  );

  const regularProducts = products.filter(
    (product) => product.is_featured !== true,
  );

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[var(--color-background)]">
      <section className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)]">
              <Package className="h-4 w-4" />
              Product Discovery
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
              Discover Products on Twimzi
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-muted)] sm:text-lg">
              Find products from manufacturers, traders, wholesalers, dealers,
              and local businesses.
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
                placeholder="Search products, brands, models..."
                className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white pl-11 pr-4 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                aria-label="Search products"
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
                href="/products"
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
            <p className="font-bold">Unable to load products.</p>
            <p className="mt-1">Please try again in a moment.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-muted)]">
                  {products.length}{" "}
                  {products.length === 1 ? "product" : "products"} found
                </p>

                <h2 className="mt-1 text-xl font-bold text-[var(--color-text)]">
                  {search ? `Results for “${search}”` : "Latest Products"}
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

            {products.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-secondary)] text-[var(--color-text-muted)]">
                  <Search className="h-6 w-6" />
                </div>

                <h2 className="mt-4 text-lg font-bold text-[var(--color-text)]">
                  No products found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
                  {search
                    ? "Try a different product name, brand, model, or keyword."
                    : "There are no public products available yet."}
                </p>

                {search ? (
                  <Link
                    href="/products"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                  >
                    View all products
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="mt-8 space-y-10">
                {featuredProducts.length > 0 ? (
                  <section>
                    <div className="mb-4 flex items-center gap-2">
                      <Tag className="h-5 w-5 text-[var(--color-text-muted)]" />

                      <h2 className="text-lg font-bold text-[var(--color-text)]">
                        Featured Products
                      </h2>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {featuredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </section>
                ) : null}

                {regularProducts.length > 0 ? (
                  <section>
                    {featuredProducts.length > 0 ? (
                      <div className="mb-4">
                        <h2 className="text-lg font-bold text-[var(--color-text)]">
                          More Products
                        </h2>
                      </div>
                    ) : null}

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {regularProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
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