import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ProductActions } from "@/components/admin/product-actions";
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
  page?: string;
};

const PRODUCTS_PER_PAGE = 25;
const PRODUCTS_FETCH_LIMIT = PRODUCTS_PER_PAGE + 1;
const PRODUCTS_MAX_PAGE = 10000;

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

async function updateProduct(formData: FormData) {
  "use server";

  const productId = String(formData.get("product_id") ?? "").trim();
  const productName = String(formData.get("product_name") ?? "").trim();
  const productCode = String(formData.get("product_code") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const sellingPrice = String(formData.get("selling_price") ?? "").trim();
  const mrp = String(formData.get("mrp") ?? "").trim();
  const stock = String(formData.get("stock_quantity") ?? "").trim();
  const isFeatured = formData.get("is_featured") === "true";
  const isActive = formData.get("is_active") === "true";

  if (!productId) {
    throw new Error("Product ID is required.");
  }
  if (!productName) {
    throw new Error("Product name is required.");
  }
  if (!productCode) {
    throw new Error("Product code is required.");
  }
  if (!sellingPrice) {
    throw new Error("Selling price is required.");
  }

  const parsedSellingPrice = Number(sellingPrice);
  if (!Number.isFinite(parsedSellingPrice) || parsedSellingPrice < 0) {
    throw new Error("Selling price must be a valid non-negative number.");
  }

  let parsedMrp: number | null = null;
  if (mrp !== "") {
    parsedMrp = Number(mrp);
    if (!Number.isFinite(parsedMrp) || parsedMrp < 0) {
      throw new Error("MRP must be a valid non-negative number.");
    }
  }

  let parsedStock: number | null = null;
  if (stock !== "") {
    parsedStock = Number(stock);
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      throw new Error("Stock quantity must be a valid non-negative number.");
    }
  }

  const supabase = await requireSuperAdmin();

  const { error } = await supabase.rpc("admin_update_product", {
    p_product_id: productId,
    p_product_name: productName,
    p_product_code: productCode,
    p_sku: sku || null,
    p_slug: slug || null,
    p_brand: brand || null,
    p_model: model || null,
    p_selling_price: parsedSellingPrice,
    p_mrp: parsedMrp,
    p_stock_quantity: parsedStock,
    p_is_featured: isFeatured,
    p_is_active: isActive,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/products");
}

async function deleteProduct(formData: FormData) {
  "use server";

  const productId = String(formData.get("product_id") ?? "").trim();

  if (!productId) {
    throw new Error("Product ID is required.");
  }

  const supabase = await requireSuperAdmin();

  const { error } = await supabase.rpc("admin_delete_product", {
    p_product_id: productId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/products");
}

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const page = parsePageParam(params.page, PRODUCTS_MAX_PAGE);
  const offset = (page - 1) * PRODUCTS_PER_PAGE;

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

        <h1 className="mt-1 text-3xl font-extrabold">Products</h1>

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

        <h1 className="mt-1 text-3xl font-extrabold">Products</h1>

        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          You do not have permission to access product administration.
        </div>
      </div>
    );
  }

  const { data, error } = await supabase.rpc("admin_get_products", {
    p_search: search || null,
    p_business_id: null,
    p_limit: PRODUCTS_FETCH_LIMIT,
    p_offset: offset,
  });

  const fetchedProducts = (data ?? []) as Product[];
  const hasNextPage = fetchedProducts.length > PRODUCTS_PER_PAGE;
  const products = hasNextPage ? fetchedProducts.slice(0, PRODUCTS_PER_PAGE) : fetchedProducts;

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
            ← Business Management
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
          <p className="font-bold">Unable to load products.</p>

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
                  Showing page {page} ({products.length} products)
                  {search ? ` matching "${search}"` : ""}.
                </p>
              </div>

              <span className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-bold">
                {products.length}
              </span>
            </div>

            {products.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-bold">No products found</p>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {search
                    ? "Try another search."
                    : "No products are currently available."}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-[1400px] w-full text-left text-sm">
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
                            {product.business_name || "—"}
                          </p>

                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            {product.business_id}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p>
                            {product.product_code || "—"}
                          </p>

                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            SKU: {product.sku || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p>{product.brand || "—"}</p>

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

                        <td className="px-5 py-4">
                          <ProductActions
                            product={product}
                            onUpdate={updateProduct}
                            onDelete={deleteProduct}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-[var(--color-border)] px-5 py-4 flex items-center justify-between">
                <p className="text-xs text-[var(--color-text-muted)]">
                  Page {page} ({products.length} products)
                </p>

                <div className="flex items-center gap-2">
                  {page > 1 ? (
                    <Link
                      href={`/admin/products?${search ? `q=${encodeURIComponent(search)}&` : ''}page=${page - 1}`}
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
                      href={`/admin/products?${search ? `q=${encodeURIComponent(search)}&` : ''}page=${page + 1}`}
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