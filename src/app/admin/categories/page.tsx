"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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

export default function AdminCategoriesPage() {
  const supabase = createSupabaseBrowserClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCategories = useCallback(async () => {
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
        throw new Error(
          "You do not have permission to access this page.",
        );
      }

      const { data, error: categoryError } = await supabase.rpc(
        "admin_get_categories",
        {
          p_search: submittedSearch.trim() || null,
          p_limit: 100,
          p_offset: 0,
        },
      );

      if (categoryError) {
        throw categoryError;
      }

      setCategories((data ?? []) as Category[]);
    } catch (err) {
      setCategories([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load categories.",
      );
    } finally {
      setLoading(false);
    }
  }, [submittedSearch, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCategories();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadCategories]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(search);
  }

  function clearSearch() {
    setSearch("");
    setSubmittedSearch("");
  }

  const statistics = useMemo(() => {
    return {
      total: categories.length,
      active: categories.filter((category) => category.is_active).length,
      inactive: categories.filter((category) => !category.is_active).length,
      featured: categories.filter((category) => category.is_featured).length,
      searchable: categories.filter(
        (category) => category.is_searchable,
      ).length,
      root: categories.filter((category) => !category.parent_id).length,
      child: categories.filter((category) => category.parent_id).length,
    };
  }, [categories]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Categories
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Review the category structure used across Twimzi.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {statistics.total}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active</p>

          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {statistics.active}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Inactive</p>

          <p className="mt-2 text-2xl font-semibold text-slate-700">
            {statistics.inactive}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Featured</p>

          <p className="mt-2 text-2xl font-semibold text-amber-700">
            {statistics.featured}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Searchable</p>

          <p className="mt-2 text-2xl font-semibold text-blue-700">
            {statistics.searchable}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Root / Child</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {statistics.root} / {statistics.child}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="flex-1">
            <label htmlFor="category-search" className="sr-only">
              Search categories
            </label>

            <input
              id="category-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search category name, code, slug or description..."
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

      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadCategories()}
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
              Category Directory
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Root categories appear before their child categories.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadCategories()}
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
                className="h-20 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">
              C
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No categories found
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {submittedSearch
                ? "No categories match your search."
                : "There are currently no categories available."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Parent</th>
                    <th className="px-5 py-3">Order</th>
                    <th className="px-5 py-3">Features</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Updated</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {categories.map((category) => (
                    <tr
                      key={category.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="max-w-sm px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-500">
                            {category.category_name
                              ?.charAt(0)
                              .toUpperCase() || "C"}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">
                              {category.category_name || "Unnamed"}
                            </p>

                            <p className="mt-1 truncate text-xs text-slate-500">
                              {category.slug || "No slug"}
                            </p>
                          </div>
                        </div>
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
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            Root
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {category.sort_order ?? 0}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {category.is_featured && (
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                              Featured
                            </span>
                          )}

                          {category.is_searchable && (
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                              Searchable
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            category.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {category.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                        {formatDate(category.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {categories.map((category) => (
                <div key={category.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-500">
                        {category.category_name
                          ?.charAt(0)
                          .toUpperCase() || "C"}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-900">
                          {category.category_name || "Unnamed"}
                        </h3>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {category.slug || "No slug"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        category.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {category.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400">Code</p>
                      <p className="mt-1 font-mono text-slate-700">
                        {category.category_code || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Sort Order</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {category.sort_order ?? 0}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Parent</p>
                      <p className="mt-1 font-mono text-slate-700">
                        {category.parent_id
                          ? truncateId(category.parent_id)
                          : "Root"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Updated</p>
                      <p className="mt-1 text-slate-700">
                        {formatDate(category.updated_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {category.is_featured && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        Featured
                      </span>
                    )}

                    {category.is_searchable && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        Searchable
                      </span>
                    )}
                  </div>

                  {category.description && (
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {category.description}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
              Showing {categories.length} categor
              {categories.length === 1 ? "y" : "ies"}.
            </div>
          </>
        )}
      </div>
    </div>
  );
}