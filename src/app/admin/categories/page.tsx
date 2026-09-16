import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type Category = {
  id: string;
  parent_id: string | null;
  category_code: string;
  category_name: string;
  slug: string | null;
  description: string | null;
  icon_name: string | null;
  image_media_id: string | null;
  sort_order: number;
  is_featured: boolean;
  is_searchable: boolean;
  seo_title: string | null;
  seo_description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type SearchParams = {
  q?: string;
};

function formatDate(value: string | null) {
  if (!value) return "â€”";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "â€”";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(date);
}

export default async function AdminCategories({
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
          Catalogue Management
        </p>

        <h1 className="mt-1 text-3xl font-extrabold">
          Categories
        </h1>

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
          Catalogue Management
        </p>

        <h1 className="mt-1 text-3xl font-extrabold">
          Categories
        </h1>

        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          You do not have permission to access category administration.
        </div>
      </div>
    );
  }

  const { data, error } = await supabase.rpc("admin_get_categories", {
    p_search: search || null,
    p_limit: 100,
    p_offset: 0,
  });

  const categories = (data ?? []) as Category[];

  const activeCount = categories.filter(
    (category) => category.is_active,
  ).length;

  const featuredCount = categories.filter(
    (category) => category.is_featured,
  ).length;

  const searchableCount = categories.filter(
    (category) => category.is_searchable,
  ).length;

  const parentCount = categories.filter(
    (category) => category.parent_id === null,
  ).length;

  return (
    <div className="pb-12">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/admin"
            className="text-sm font-semibold text-[var(--color-primary)]"
          >
            â† Admin Dashboard
          </Link>

          <p className="mt-5 text-sm font-semibold text-[var(--color-primary)]">
            Catalogue Management
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
            placeholder="Search categories..."
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] sm:w-[300px]"
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
          <p className="font-bold">
            Unable to load categories.
          </p>

          <p className="mt-1 text-xs opacity-80">
            {error.message}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Categories Loaded"
              value={categories.length}
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
              label="Searchable"
              value={searchableCount}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div>
                <span className="text-[var(--color-text-muted)]">
                  Parent Categories
                </span>

                <span className="ml-2 font-extrabold">
                  {parentCount}
                </span>
              </div>

              <div>
                <span className="text-[var(--color-text-muted)]">
                  Subcategories
                </span>

                <span className="ml-2 font-extrabold">
                  {categories.length - parentCount}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <h2 className="font-extrabold">
                  Category Catalogue
                </h2>

                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Showing up to 100 categories
                  {search ? ` matching "${search}"` : ""}.
                </p>
              </div>

              <span className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-bold">
                {categories.length}
              </span>
            </div>

            {categories.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-bold">
                  No categories found
                </p>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {search
                    ? "Try another search."
                    : "No categories are currently available."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1250px] w-full text-left text-sm">
                  <thead className="border-b bg-[var(--color-surface)]">
                    <tr>
                      {[
                        "Category",
                        "Code",
                        "Parent",
                        "Sort",
                        "Featured",
                        "Searchable",
                        "Status",
                        "SEO",
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
                    {categories.map((category) => (
                      <tr
                        key={category.id}
                        className="border-b last:border-0 hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold">
                            {category.category_name}
                          </p>

                          {category.slug ? (
                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                              /{category.slug}
                            </p>
                          ) : null}

                          {category.description ? (
                            <p className="mt-1 max-w-[260px] truncate text-xs text-slate-400">
                              {category.description}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {category.category_code}
                        </td>

                        <td className="px-5 py-4">
                          {category.parent_id ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              Subcategory
                            </span>
                          ) : (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                              Parent
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {category.sort_order}
                        </td>

                        <td className="px-5 py-4">
                          {category.is_featured ? (
                            <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
                              Featured
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              No
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {category.is_searchable ? (
                            <span className="text-emerald-700 font-semibold">
                              Yes
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              No
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {category.is_active ? (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                              Inactive
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1 text-xs">
                            <span
                              className={
                                category.seo_title
                                  ? "font-semibold text-emerald-700"
                                  : "text-slate-400"
                              }
                            >
                              Title:{" "}
                              {category.seo_title
                                ? "Set"
                                : "Missing"}
                            </span>

                            <span
                              className={
                                category.seo_description
                                  ? "font-semibold text-emerald-700"
                                  : "text-slate-400"
                              }
                            >
                              Description:{" "}
                              {category.seo_description
                                ? "Set"
                                : "Missing"}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-500">
                          {formatDate(category.created_at)}
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
