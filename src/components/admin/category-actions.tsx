"use client";

import { useState } from "react";

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
};

type Props = {
  category: Category;
  categories: Category[];
  onChanged: () => void;
};

export function CategoryActions({
  category,
  categories,
  onChanged,
}: Props) {
  const supabase = createSupabaseBrowserClient();

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(category.category_name ?? "");
  const [code, setCode] = useState(category.category_code ?? "");
  const [slug, setSlug] = useState(category.slug ?? "");
  const [description, setDescription] = useState(
    category.description ?? "",
  );
  const [iconName, setIconName] = useState(
    category.icon_name ?? "",
  );
  const [parentId, setParentId] = useState(
    category.parent_id ?? "",
  );
  const [sortOrder, setSortOrder] = useState(
    String(category.sort_order ?? 0),
  );
  const [featured, setFeatured] = useState(
    category.is_featured,
  );
  const [searchable, setSearchable] = useState(
    category.is_searchable,
  );
  const [active, setActive] = useState(category.is_active);
  const [seoTitle, setSeoTitle] = useState(
    category.seo_title ?? "",
  );
  const [seoDescription, setSeoDescription] = useState(
    category.seo_description ?? "",
  );

  function resetForm() {
    setName(category.category_name ?? "");
    setCode(category.category_code ?? "");
    setSlug(category.slug ?? "");
    setDescription(category.description ?? "");
    setIconName(category.icon_name ?? "");
    setParentId(category.parent_id ?? "");
    setSortOrder(String(category.sort_order ?? 0));
    setFeatured(category.is_featured);
    setSearchable(category.is_searchable);
    setActive(category.is_active);
    setSeoTitle(category.seo_title ?? "");
    setSeoDescription(category.seo_description ?? "");
    setError("");
  }

  function openEditor() {
    resetForm();
    setEditing(true);
  }

  function closeEditor() {
    if (saving) return;

    resetForm();
    setEditing(false);
  }

  async function saveCategory() {
    setError("");

    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    if (!code.trim()) {
      setError("Category code is required.");
      return;
    }

    const parsedSortOrder = Number.parseInt(
      sortOrder || "0",
      10,
    );

    if (!Number.isFinite(parsedSortOrder)) {
      setError("Sort order must be a valid number.");
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase.rpc(
        "admin_update_category",
        {
          p_category_id: category.id,
          p_parent_id: parentId || null,
          p_category_code: code.trim(),
          p_category_name: name.trim(),
          p_slug: slug.trim() || null,
          p_description: description.trim() || null,
          p_icon_name: iconName.trim() || null,
          p_image_media_id: category.image_media_id,
          p_sort_order: parsedSortOrder,
          p_is_featured: featured,
          p_is_searchable: searchable,
          p_seo_title: seoTitle.trim() || null,
          p_seo_description: seoDescription.trim() || null,
          p_is_active: active,
        },
      );

      if (updateError) {
        throw updateError;
      }

      setEditing(false);
      onChanged();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update category.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory() {
    if (deleting) return;

    const confirmed = window.confirm(
      `Delete "${category.category_name || "this category"}"?\n\nThe category will be soft-deleted and removed from active administration.`,
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const { error: deleteError } = await supabase.rpc(
        "admin_delete_category",
        {
          p_category_id: category.id,
        },
      );

      if (deleteError) {
        throw deleteError;
      }

      onChanged();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete category.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const availableParents = categories.filter(
    (item) =>
      item.id !== category.id &&
      item.is_active &&
      !isDescendant(item.id, category.id, categories),
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={openEditor}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => void deleteCategory()}
          disabled={deleting}
          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {error && !editing ? (
        <p className="mt-2 max-w-xs text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center">
            <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Category Management
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Edit Category
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Update the existing category without creating a
                    duplicate.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditor}
                  disabled={saving}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
                {error ? (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Category Name"
                    required
                    value={name}
                    onChange={setName}
                  />

                  <Field
                    label="Category Code"
                    required
                    value={code}
                    onChange={setCode}
                  />

                  <Field
                    label="Slug"
                    value={slug}
                    onChange={setSlug}
                  />

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Parent Category
                    </label>

                    <select
                      value={parentId}
                      onChange={(event) =>
                        setParentId(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    >
                      <option value="">Root Category</option>

                      {availableParents.map((parent) => (
                        <option
                          key={parent.id}
                          value={parent.id}
                        >
                          {parent.category_name || "Unnamed"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Field
                    label="Icon Name"
                    value={iconName}
                    onChange={setIconName}
                    placeholder="e.g. factory"
                  />

                  <Field
                    label="Sort Order"
                    type="number"
                    value={sortOrder}
                    onChange={setSortOrder}
                  />
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    rows={4}
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    placeholder="Category description..."
                  />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Toggle
                    label="Active"
                    checked={active}
                    onChange={setActive}
                  />

                  <Toggle
                    label="Featured"
                    checked={featured}
                    onChange={setFeatured}
                  />

                  <Toggle
                    label="Searchable"
                    checked={searchable}
                    onChange={setSearchable}
                  />
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      SEO Title
                    </label>

                    <input
                      value={seoTitle}
                      onChange={(event) =>
                        setSeoTitle(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      SEO Description
                    </label>

                    <textarea
                      value={seoDescription}
                      onChange={(event) =>
                        setSeoDescription(event.target.value)
                      }
                      rows={3}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditor}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void saveCategory()}
                  disabled={saving}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required ? (
          <span className="ml-1 text-red-500">*</span>
        ) : null}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300"
      />
    </label>
  );
}

function isDescendant(
  candidateId: string,
  categoryId: string,
  categories: Category[],
): boolean {
  let current = categories.find(
    (item) => item.id === candidateId,
  );

  const visited = new Set<string>();

  while (current?.parent_id) {
    if (visited.has(current.id)) {
      return false;
    }

    visited.add(current.id);

    if (current.parent_id === categoryId) {
      return true;
    }

    current = categories.find(
      (item) => item.id === current?.parent_id,
    );
  }

  return false;
}