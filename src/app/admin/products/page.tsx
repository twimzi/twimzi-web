import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type Product = {
  id: string;
  business_id: string;
  business_name: string | null;
  product_code: string | null;
  sku: string | null;
  product_name: string | null;
  slug: string | null;
  brand: string | null;
  model: string | null;
  selling_price: number | null;
  mrp: number | null;
  stock_quantity: number | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type SearchParams = {
  q?: string;
};

function formatDate(value: string | null) {
  if (!value) return "â€”";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatNumber(value: number | null) {
  if (value === null || value === undefined) return "â€”";

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPrice(value: number | null) {
  if (value === null || value === undefined) return "â€”";

  return `â‚¹${formatNumber(value)}`;
}

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          Product Management
        </p>

        <h1 className="mt-1 text-3xl font-extrabold">
          Products
        </h1>

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Please sign in to access product administration.
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
          Product Management
        </p>

        <h1 className="mt-1 text-3xl font-extrabold">
          Products
        </h1>

        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          You do not have permission to access product administration.
        </div>
      </div>
    );
  }

  const { data, error } = await supabase.rpc("admin_get_products", {
    p_search: search || null,
    p_business_id: null,
    p_limit: 100,
    p_offset: 0,
  });

  const products = (data ?? []) as Product[];

  const activeCount = products.filter(
    (product) => product.is_active,
  ).length;

  const featuredCount = products.filter(
    (product) => product.is_featured,
  ).length;

  const outOfStockCount = products.filter(
    (product) =>
      product.stock_quantity !== null &&
      product.stock_quantity <= 0,
  ).length;

  return (
    <div className="pb-12">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/admin/businesses"
            className="text-sm font-semibold text-[var(--color-primary)]"
          >
            â† Business Management
          </Link>

          <p className="mt-5 text-sm font-semibold text-[var(--color-primary)]">
            Product Management
          </p>

          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            Products
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Manage products across the Twimzi business marketplace.
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
            placeholder="Search product, SKU, brand, business..."
            className="w-full min-w-0 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] sm:w-[360px]"
          />

          <button
            type="submit"
            className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            Search
          </button>

          {search ? (
            <Link
              href="/admin/products"
              className="flex items-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-bold hover:bg-slate-50"
            >
              Clear
            </Link>
          ) : null}
        </form>
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-bold">
            Unable to load products.
          </p>

          <p className="mt-1 text-xs opacity-80">
            {error.message}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Products Loaded"
              value={products.length}
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
              label="Out of Stock"
              value={outOfStockCount}
            />
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <h2 className="font-extrabold">
                  Product Catalogue
                </h2>

                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Showing up to 100 products
                  {search ? ` matching "${search}"` : ""}.
                </p>
              </div>

              <span className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-bold">
                {products.length}
              </span>
            </div>

            {products.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-bold">
                  No products found
                </p>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {search
                    ? "Try another search."
                    : "No products are currently available."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1250px] w-full text-left text-sm">
                  <thead className="border-b bg-[var(--color-surface)]">
                    <tr>
                      {[
                        "Product",
                        "Business",
                        "Code / SKU",
                        "Brand / Model",
                        "Selling Price",
                        "MRP",
                        "Stock",
                        "Status",
                        "Created",
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
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b last:border-0 hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold">
                            {product.product_name ||
                              "Unnamed product"}
                          </p>

                          {product.slug ? (
                            <p className="mt-1 max-w-[220px] truncate text-xs text-[var(--color-text-muted)]">
                              /{product.slug}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[200px] truncate font-semibold">
                            {product.business_name || "â€”"}
                          </p>

                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            {product.business_id}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p>
                            {product.product_code || "â€”"}
                          </p>

                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            SKU: {product.sku || "â€”"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p>
                            {product.brand || "â€”"}
                          </p>

                          {product.model ? (
                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                              {product.model}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {formatPrice(product.selling_price)}
                        </td>

                        <td className="px-5 py-4">
                          {formatPrice(product.mrp)}
                        </td>

                        <td className="px-5 py-4">
                          {formatNumber(product.stock_quantity)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-col items-start gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                                product.is_active
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-slate-50 text-slate-600"
                              }`}
                            >
                              {product.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>

                            {product.is_featured ? (
                              <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
                                Featured
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-500">
                          {formatDate(product.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
