"use client";

import Link from "next/link";
import { ExternalLink, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  product_name: string | null;
  product_code: string | null;
  sku: string | null;
  slug: string | null;
  brand: string | null;
  model: string | null;
  selling_price: number | null;
  mrp: number | null;
  stock_quantity: number | null;
  is_featured: boolean;
  is_active: boolean;
};

export function ProductActions({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(product.product_name ?? "");
  const [code, setCode] = useState(product.product_code ?? "");
  const [sku, setSku] = useState(product.sku ?? "");
  const [slug, setSlug] = useState(product.slug ?? "");
  const [brand, setBrand] = useState(product.brand ?? "");
  const [model, setModel] = useState(product.model ?? "");
  const [sellingPrice, setSellingPrice] = useState(
    product.selling_price?.toString() ?? "",
  );
  const [mrp, setMrp] = useState(product.mrp?.toString() ?? "");
  const [stock, setStock] = useState(
    product.stock_quantity?.toString() ?? "",
  );
  const [featured, setFeatured] = useState(product.is_featured);
  const [active, setActive] = useState(product.is_active);

  async function save() {
    setSaving(true);
    setError("");

    const supabase = createSupabaseBrowserClient();

    const { error: saveError } = await supabase.rpc("admin_update_product", {
      p_product_id: product.id,
      p_product_name: name,
      p_product_code: code,
      p_sku: sku || null,
      p_slug: slug || null,
      p_brand: brand || null,
      p_model: model || null,
      p_selling_price: Number(sellingPrice),
      p_mrp: mrp ? Number(mrp) : null,
      p_stock_quantity: stock ? Number(stock) : null,
      p_is_featured: featured,
      p_is_active: active,
    });

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setOpen(false);
    window.location.reload();
  }

  async function remove() {
    if (!window.confirm(`Delete "${product.product_name ?? "this product"}"?`)) {
      return;
    }

    setDeleting(true);
    setError("");

    const supabase = createSupabaseBrowserClient();

    const { error: deleteError } = await supabase.rpc(
      "admin_delete_product",
      {
        p_product_id: product.id,
      },
    );

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }

    window.location.reload();
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {product.slug ? (
          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label={`Open ${product.product_name ?? "product"}`}
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setError("");
            setOpen(true);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          aria-label={`Edit ${product.product_name ?? "product"}`}
        >
          <Pencil className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => void remove()}
          disabled={deleting}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          aria-label={`Delete ${product.product_name ?? "product"}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-extrabold">Edit Product</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Update the existing product record.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <Field label="Product Name" value={name} onChange={setName} />
              <Field label="Product Code" value={code} onChange={setCode} />
              <Field label="SKU" value={sku} onChange={setSku} />
              <Field label="Slug" value={slug} onChange={setSlug} />
              <Field label="Brand" value={brand} onChange={setBrand} />
              <Field label="Model" value={model} onChange={setModel} />
              <Field
                label="Selling Price"
                value={sellingPrice}
                onChange={setSellingPrice}
                type="number"
              />
              <Field
                label="MRP"
                value={mrp}
                onChange={setMrp}
                type="number"
              />
              <Field
                label="Stock Quantity"
                value={stock}
                onChange={setStock}
                type="number"
              />

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(event) => setFeatured(event.target.checked)}
                />
                Featured
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(event) => setActive(event.target.checked)}
                />
                Active
              </label>
            </div>

            {error ? (
              <div className="mx-6 mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex justify-end gap-3 border-t bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
      />
    </label>
  );
}