import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Package, Store, Tag } from "lucide-react";
import { notFound } from "next/navigation";

import { StructuredData } from "@/components/seo/structured-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
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

function getDiscountPercent(product: Product) {
  if (
    product.selling_price === null ||
    product.mrp === null ||
    product.mrp <= product.selling_price ||
    product.mrp <= 0
  ) {
    return null;
  }

  return Math.round(
    ((product.mrp - product.selling_price) / product.mrp) * 100,
  );
}

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_public_products", {
    p_search: slug,
    p_limit: 60,
    p_offset: 0,
  });

  if (error || !data) {
    return null;
  }

  const products = data as Product[];

  return (
    products.find(
      (product) =>
        typeof product.slug === "string" &&
        product.slug.toLowerCase() === slug.toLowerCase(),
    ) ?? null
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found | Twimzi",
    };
  }

  const name = product.product_name?.trim() || "Product";
  const business = product.business_name?.trim();

  const description =
    product.short_description?.trim() ||
    product.description?.trim() ||
    `${name}${business ? ` from ${business}` : ""} on Twimzi.`;

  return {
    title: `${name} | Twimzi`,
    description,
    alternates: {
      canonical: `https://www.twimzi.com/products/${product.slug}`,
    },
    openGraph: {
      title: `${name} | Twimzi`,
      description,
      type: "website",
      url: `https://www.twimzi.com/products/${product.slug}`,
      images: product.thumbnail_url ? [{ url: product.thumbnail_url }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const name = product.product_name?.trim() || "Unnamed Product";
  const description =
    product.description?.trim() ||
    product.short_description?.trim() ||
    "No product description available.";

  const shortDescription =
    product.short_description?.trim() ||
    "Discover this product from a local business on Twimzi.";

  const discountPercent = getDiscountPercent(product);

  const businessHref = product.business_slug
    ? `/businesses/${product.business_slug}`
    : "/businesses";

  const productUrl = `https://www.twimzi.com/products/${product.slug}`;

  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url: productUrl,
    ...(product.thumbnail_url ? { image: [product.thumbnail_url] } : {}),
    ...(product.brand
      ? {
          brand: {
            "@type": "Brand",
            name: product.brand,
          },
        }
      : {}),
    ...(product.model ? { model: product.model } : {}),
    ...(product.product_code ? { sku: product.product_code } : {}),
    ...(product.selling_price !== null
      ? {
          offers: {
            "@type": "Offer",
            url: productUrl,
            priceCurrency: "INR",
            price: product.selling_price,
            availability:
              product.stock_quantity === null || product.stock_quantity > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
          },
        }
      : {}),
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <StructuredData data={productSchema} />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-square overflow-hidden bg-slate-100 sm:aspect-[4/3]">
              {product.thumbnail_url ? (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url("${product.thumbnail_url.replace(
                      /"/g,
                      '\\"',
                    )}")`,
                  }}
                  role="img"
                  aria-label={name}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm">
                    <Package className="h-14 w-14" />
                  </div>
                </div>
              )}

              {product.is_featured ? (
                <div className="absolute left-4 top-4 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white">
                  Featured
                </div>
              ) : null}

              {discountPercent !== null ? (
                <div className="absolute right-4 top-4 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">
                  {discountPercent}% OFF
                </div>
              ) : null}
            </div>

            {product.image_count && product.image_count > 1 ? (
              <div className="border-t border-slate-100 px-5 py-3 text-xs font-medium text-slate-500">
                {product.image_count} images
              </div>
            ) : null}
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Package className="h-4 w-4" />
              Product
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {name}
            </h1>

            {product.product_code ? (
              <p className="mt-2 text-sm font-medium text-slate-400">
                Product code: {product.product_code}
              </p>
            ) : null}

            <p className="mt-5 text-base leading-7 text-slate-600">
              {shortDescription}
            </p>

            <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                <span className="text-3xl font-extrabold text-slate-950">
                  {formatPrice(product.selling_price)}
                </span>

                {discountPercent !== null && product.mrp !== null ? (
                  <>
                    <span className="text-base text-slate-400 line-through">
                      {formatPrice(product.mrp)}
                    </span>

                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      Save {discountPercent}%
                    </span>
                  </>
                ) : null}
              </div>

              {product.stock_quantity !== null ? (
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                      product.stock_quantity > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>

                  <span
                    className={
                      product.stock_quantity > 0
                        ? "font-semibold text-emerald-700"
                        : "font-semibold text-red-700"
                    }
                  >
                    {product.stock_quantity > 0
                      ? "In stock"
                      : "Out of stock"}
                  </span>
                </div>
              ) : null}
            </div>

            {(product.brand || product.model) && (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {product.brand ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium text-slate-400">Brand</p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {product.brand}
                    </p>
                  </div>
                ) : null}

                {product.model ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium text-slate-400">Model</p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {product.model}
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={businessHref}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <Store className="h-4 w-4" />
                View Business
              </Link>

              <Link
                href="/products"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
              >
                <Package className="h-4 w-4" />
                More Products
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-slate-500" />
              <h2 className="text-xl font-bold text-slate-950">
                Product Details
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
                  Sold by
                </p>

                <p className="truncate text-base font-bold text-slate-950">
                  {product.business_name || "Business"}
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