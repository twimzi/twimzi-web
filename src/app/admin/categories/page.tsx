import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { CategoryActions } from "@/components/admin/category-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Category = {
  id: string;
  parent_id: string | null;
  category_code: string | null;
  category_name: string | null;
  slug: string | null;
  description: string | null;
  icon_name: string | null;
  image_media_id: string | null;
  sort_order: number | null;
  is_featured: boolean;
  is_searchable: boolean;
  seo_title: string | null;
  seo_description: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type SearchParams = {
  q?: string;
  page?: string;
};

const CATEGORIES_PER_PAGE = 50;
const CATEGORIES_FETCH_LIMIT = CATEGORIES_PER_PAGE + 1;
const CATEGORIES_MAX_PAGE = 10000;

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
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function truncateId(value: string | null) {
  if (!value) return "—";
  if (value.length <= 18) return value;

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
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

async function updateCategory(formData: FormData) {
  "use server";

  const categoryId = String(formData.get("category_id") ?? "").trim();
  const parentId = String(formData.get("parent_id") ?? "").trim();
  const categoryCode = String(formData.get("category_code") ?? "").trim();
  const categoryName = String(formData.get("category_name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const iconName = String(formData.get("icon_name") ?? "").trim();
  const imageMediaId = String(formData.get("image_media_id") ?? "").trim();
  const sortOrder = String(formData.get("sort_order") ?? "").trim();
  const isFeatured = formData.get("is_featured") === "true";
  const isSearchable = formData.get("is_searchable") === "true";
  const seoTitle = String(formData.get("seo_title") ?? "").trim();
  const seoDescription = String(formData.get("seo_description") ?? "").trim();
  const isActive = formData.get("is_active") === "true";

  if (!categoryId) {
    throw new Error("Category ID is required.");
  }
  if (!categoryName) {
    throw new Error("Category name is required.");
  }
  if (!categoryCode) {
    throw new Error("Category code is required.");
  }

  const parsedSortOrder = Number(sortOrder || "0");
  if (!Number.isFinite(parsedSortOrder) || parsedSortOrder < 0) {
    throw new Error("Sort order must be a valid non-negative number.");
  }

  const supabase = await requireSuperAdmin();

  const { error } = await supabase.rpc("admin_update_category", {
    p_category_id: categoryId,
    p_parent_id: parentId || null,
    p_category_code: categoryCode,
    p_category_name: categoryName,
    p_slug: slug || null,
    p_description: description || null,
    p_icon_name: iconName || null,
    p_image_media_id: imageMediaId || null,
    p_sort_order: parsedSortOrder,
    p_is_featured: isFeatured,
    p_is_searchable: isSearchable,
    p_seo_title: seoTitle || null,
    p_seo_description: seoDescription || null,
    p_is_active: isActive,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/categories");
}

async function deleteCategory(formData: FormData) {
  "use server";

  const categoryId = String(formData.get("category_id") ?? "").trim();

  if (!categoryId) {
    throw new Error("Category ID is required.");
  }

  const supabase = await requireSuperAdmin();

  const { error } = await supabase.rpc("admin_delete_category", {
    p_category_id: categoryId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/categories");
}

export default async function AdminCategories({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const page = parsePageParam(params.page, CATEGORIES_MAX_PAGE);
  const offset = (page - 1) * CATEGORIES_PER_PAGE;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          Administration
        </p>

        <h1 className="mt-1 text-3xl font-extrabold">Categories</h1>

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Please sign in to access category administration.
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
          Administration
        </p>

        <h1 className="mt-1 text-3xl font-extrabold">Categories</h1>

        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          You do not have permission to access category administration.
        </div>
      </div>
    );
  }

  const { data, error } = await supabase.rpc("admin_get_categories", {
    p_search: search || null,
    p_limit: CATEGORIES_FETCH_LIMIT,
    p_offset: offset,
  });

  const fetchedCategories = (data ?? []) as Category[];
  const hasNextPage = fetchedCategories.length > CATEGORIES_PER_PAGE;
  const categories = hasNextPage
    ? fetchedCategories.slice(0, CATEGORIES_PER_PAGE)
    : fetchedCategories;

  const activeCount = categories.filter((c) => c.is_active).length;
  const inactiveCount = categories.filter((c) => !c.is_active).length;
  const featuredCount = categories.filter((c) => c.is_featured).length;
  const searchableCount = categories.filter((c) => c.is_searchable).length;
  const rootCount = categories.filter((c) => !c.parent_id).length;
  const childCount = categories.filter((c) => c.parent_id).length;

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
            Category Management
          </p>

          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            Categories
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Manage the category structure used across Twimzi.
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
            placeholder="Search category name, code, slug or description..."
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
              href="/admin/categories"
              className="flex items-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-bold hover:bg-slate-50"
            >
              Clear
            </Link>
          ) : null}
        </form>
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-bold">Unable to load categories.</p>

          <p className="mt-1 text-xs opacity-80">
            {error.message}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-6">
            <StatCard label="Total" value={categories.length} />
            <StatCard
              label="Active"
              value={activeCount}
              valueClass="text-emerald-700"
            />
            <StatCard
              label="Inactive"
              value={inactiveCount}
            />
            <StatCard
              label="Featured"
              value={featuredCount}
              valueClass="text-amber-700"
            />
            <StatCard
              label="Searchable"
              value={searchableCount}
              valueClass="text-blue-700"
            />
            <StatCard
              label="Root / Child"
              value={`${rootCount} / ${childCount}`}
            />
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <h2 className="font-extrabold">
                  Category Directory
                </h2>

                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Showing page {page} ({categories.length} categories)
                  {search ? ` matching "${search}"` : ""}.
                </p>
              </div>

              <span className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-bold">
                {categories.length}
              </span>
            </div>

            {categories.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-bold">No categories found</p>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {search
                    ? "Try another search."
                    : "No categories are currently available."}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-[1250px] w-full text-left text-sm">
                    <thead className="border-b bg-[var(--color-surface)]">
                      <tr>
                        {[
                          "Category",
                          "Code",
                          "Parent",
                          "Order",
                          "Features",
                          "Status",
                          "Updated",
                          "Actions",
                        ].map((heading) => (
                          <th key={heading} className="px-5 py-4 font-bold">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {categories.map((category) => (
                        <tr
                          key={category.id}
                          className="border-b last:border-0 hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold">
                              {category.category_name || "Unnamed"}
                            </p>

                            {category.slug ? (
                              <p className="mt-1 max-w-[230px] truncate text-xs text-slate-400">
                                /{category.slug}
                              </p>
                            ) : null}
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-mono text-xs text-slate-500">
                              {category.category_code || "—"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            {category.parent_id ? (
                              <span className="font-mono text-xs text-slate-500">
                                {truncateId(category.parent_id)}
                              </span>
                            ) : (
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                Root
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {category.sort_order ?? 0}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {category.is_featured ? (
                                <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                                  Featured
                                </span>
                              ) : null}

                              {category.is_searchable ? (
                                <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                                  Searchable
                                </span>
                              ) : null}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                category.is_active
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-slate-50 text-slate-600"
                              }`}
                            >
                              {category.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-500">
                            {formatDate(category.updated_at)}
                          </td>

                          <td className="px-5 py-4">
                            <CategoryActions
                              category={category}
                              categories={categories}
                              onUpdate={updateCategory}
                              onDelete={deleteCategory}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-[var(--color-border)] px-5 py-4 flex items-center justify-between">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Page {page} ({categories.length} categories)
                  </p>

                  <div className="flex items-center gap-2">
                    {page > 1 ? (
                      <Link
                        href={`/admin/categories?${search ? `q=${encodeURIComponent(search)}&` : ""}page=${page - 1}`}
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
                        href={`/admin/categories?${search ? `q=${encodeURIComponent(search)}&` : ""}page=${page + 1}`}
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
  valueClass = "text-slate-900",
}: {
  label: string;
  value: number | string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
      <p className="text-xs font-semibold text-[var(--color-text-muted)]">
        {label}
      </p>

      <p className={`mt-1 text-2xl font-extrabold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}