"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Edit3,
  Package,
  Plus,
  UploadCloud,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { siteConfig } from "@/config/site";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Business = {
  id: string;
  business_name: string;
};

type Product = {
  id: string;
  business_id: string;
  product_code: string;
  product_name: string;
  sku: string | null;
  brand: string | null;
  model: string | null;
  short_description: string | null;
  description: string | null;
  selling_price: number | null;
  mrp: number | null;
  cost_price: number | null;
  stock_quantity: number | null;
  minimum_stock: number | null;
  thumbnail_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type ProductForm = {
  product_name: string;
  product_code: string;
  sku: string;
  brand: string;
  model: string;
  selling_price: string;
  mrp: string;
  cost_price: string;
  stock_quantity: string;
  minimum_stock: string;
  thumbnail_url: string;
  short_description: string;
  description: string;
  is_active: boolean;
  is_featured: boolean;
};

const emptyForm: ProductForm = {
  product_name: "",
  product_code: "",
  sku: "",
  brand: "",
  model: "",
  selling_price: "",
  mrp: "",
  cost_price: "",
  stock_quantity: "0",
  minimum_stock: "0",
  thumbnail_url: "",
  short_description: "",
  description: "",
  is_active: true,
  is_featured: false,
};

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPrice(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function BusinessProductsDashboardPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createSupabaseBrowserClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          throw new Error("Please sign in to manage your products.");
        }

        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .select("id, business_name")
          .eq("owner_profile_id", user.id)
          .eq("is_active", true)
          .is("deleted_at", null)
          .limit(1)
          .maybeSingle();

        if (businessError) {
          throw businessError;
        }

        if (!businessData) {
          throw new Error(
            "No active business profile was found for your account.",
          );
        }

        const { data: productData, error: productsError } = await supabase
          .from("products")
          .select(
            "id, business_id, product_code, product_name, sku, brand, model, short_description, description, selling_price, mrp, cost_price, stock_quantity, minimum_stock, thumbnail_url, is_active, is_featured, created_at, updated_at, deleted_at",
          )
          .eq("business_id", businessData.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (productsError) {
          throw productsError;
        }

        if (cancelled) {
          return;
        }

        setBusiness(businessData);
        setProducts(productData ?? []);
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load your products.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadProducts(businessId: string) {
    const supabase = createSupabaseBrowserClient();

    const { data, error: productsError } = await supabase
      .from("products")
      .select(
        "id, business_id, product_code, product_name, sku, brand, model, short_description, description, selling_price, mrp, cost_price, stock_quantity, minimum_stock, thumbnail_url, is_active, is_featured, created_at, updated_at, deleted_at",
      )
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (productsError) {
      throw productsError;
    }

    setProducts(data ?? []);
  }

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) =>
      [
        product.product_name,
        product.product_code,
        product.sku,
        product.brand,
        product.model,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [products, search]);

  function openCreateModal() {
    setEditingProduct(null);
    setForm(emptyForm);
    setProductImage(null);
    setProductImagePreview("");
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setProductImage(null);
    setProductImagePreview(product.thumbnail_url ?? "");
    setForm({
      product_name: product.product_name ?? "",
      product_code: product.product_code ?? "",
      sku: product.sku ?? "",
      brand: product.brand ?? "",
      model: product.model ?? "",
      selling_price:
        product.selling_price === null ? "" : String(product.selling_price),
      mrp: product.mrp === null ? "" : String(product.mrp),
      cost_price:
        product.cost_price === null ? "" : String(product.cost_price),
      stock_quantity:
        product.stock_quantity === null
          ? "0"
          : String(product.stock_quantity),
      minimum_stock:
        product.minimum_stock === null
          ? "0"
          : String(product.minimum_stock),
      thumbnail_url: product.thumbnail_url ?? "",
      short_description: product.short_description ?? "",
      description: product.description ?? "",
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingProduct(null);
    setForm(emptyForm);
    setProductImage(null);
    setProductImagePreview("");
  }

  function updateForm<K extends keyof ProductForm>(
    field: K,
    value: ProductForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleProductImageChange(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Product image must be 10 MB or smaller.");
      return;
    }
    setError(null);
    setProductImage(file);
    setProductImagePreview((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  }

  function clearProductImage() {
    setProductImage(null);
    setProductImagePreview((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return "";
    });
  }

  async function uploadProductImage(
    supabase: ReturnType<typeof createSupabaseBrowserClient>,
    productId: string,
    userId: string,
  ) {
    if (!productImage || !business) return;

    const formData = new FormData();
    formData.append("business_id", business.id);
    formData.append("product_id", productId);
    formData.append("kind", "product");
    formData.append("file", productImage);
    formData.append("alt_text", `${form.product_name.trim()} product image`);

    const { data, error: functionError } = await supabase.functions.invoke(
      "upload-media",
      { body: formData },
    );

    if (functionError) {
      throw new Error(
        functionError.message?.trim() || "Unable to upload the product image.",
      );
    }
    if (!data?.success || !data?.media?.object_path) {
      throw new Error(data?.error || "Unable to upload the product image.");
    }

    const publicUrl =
      data.media.public_url ||
      `${siteConfig.media.publicUrl}/${String(data.media.object_path)
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`;

    const { error: imageUpdateError } = await supabase
      .from("products")
      .update({
        thumbnail_url: publicUrl,
        image_count: 1,
        updated_by: userId,
      })
      .eq("id", productId)
      .eq("business_id", business.id);

    if (imageUpdateError) throw imageUpdateError;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!business) {
      setError("Business profile not found.");
      return;
    }

    if (!form.product_name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!form.product_code.trim()) {
      setError("Product code is required.");
      return;
    }

    const sellingPrice = toNullableNumber(form.selling_price);
    if (sellingPrice === null || sellingPrice < 0) {
      setError("Selling price is required and must be 0 or greater.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createSupabaseBrowserClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const payload = {
        business_id: business.id,
        product_name: form.product_name.trim(),
        product_code: form.product_code.trim(),
        sku: form.sku.trim() || null,
        brand: form.brand.trim() || null,
        model: form.model.trim() || null,
        selling_price: sellingPrice,
        mrp: toNullableNumber(form.mrp),
        cost_price: toNullableNumber(form.cost_price),
        stock_quantity: toNullableNumber(form.stock_quantity) ?? 0,
        minimum_stock: toNullableNumber(form.minimum_stock) ?? 0,
        thumbnail_url: form.thumbnail_url.trim() || null,
        short_description: form.short_description.trim() || null,
        description: form.description.trim() || null,
        is_active: form.is_active,
        is_featured: form.is_featured,
        updated_by: user.id,
      };

      let productId = editingProduct?.id ?? "";

      if (editingProduct) {
        const { error: updateError } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProduct.id)
          .eq("business_id", business.id);

        if (updateError) throw updateError;
      } else {
        const { data: createdProduct, error: insertError } = await supabase
          .from("products")
          .insert({ ...payload, created_by: user.id })
          .select("id")
          .single();

        if (insertError) throw insertError;
        productId = createdProduct.id;
      }

      if (productImage && productId) {
        setSuccess("Product saved. Uploading image...");
        await uploadProductImage(supabase, productId, user.id);
      }

      setSuccess(
        editingProduct
          ? "Product updated successfully."
          : "Product created successfully.",
      );

      await loadProducts(business.id);

      setModalOpen(false);
      setEditingProduct(null);
      setForm(emptyForm);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save the product.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: Product) {
    if (!business || deletingId) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${product.product_name}"? This product will be removed from your active product list.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(product.id);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createSupabaseBrowserClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const { error: deleteError } = await supabase
        .from("products")
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
          updated_by: user.id,
        })
        .eq("id", product.id)
        .eq("business_id", business.id);

      if (deleteError) {
        throw deleteError;
      }

      await loadProducts(business.id);
      setSuccess("Product deleted successfully.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete the product.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-56 rounded-lg bg-slate-200" />
            <div className="h-24 rounded-2xl bg-white shadow-sm" />
            <div className="h-96 rounded-2xl bg-white shadow-sm" />
          </div>
        </div>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Package className="mx-auto h-10 w-10 text-slate-400" />
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Business profile required
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {error ??
              "Create or activate your business profile before managing products."}
          </p>
          <Link
            href="/add-business"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add Business
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/businesses/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Package className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Products
                </h1>
                <p className="text-sm text-slate-600">
                  Manage products for {business.business_name}.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>

        {(error || success) && (
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
            role="alert"
          >
            {error ? (
              <X className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{error ?? success}</span>
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Products
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {products.length}
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>
        </section>

        {filteredProducts.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Package className="h-7 w-7 text-slate-500" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              {search ? "No products found" : "No products yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              {search
                ? "Try a different product name, code, SKU, brand, or model."
                : "Add your first product to start building your business catalog."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            )}
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Product
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Code / SKU
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Price
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Stock
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                            {product.thumbnail_url ? (
                              <Image
                                src={product.thumbnail_url}
                                alt=""
                                width={44}
                                height={44}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {product.product_name}
                            </p>

                            {(product.brand || product.model) && (
                              <p className="truncate text-xs text-slate-500">
                                {[product.brand, product.model]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </p>
                            )}

                            {product.is_featured && (
                              <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-900">
                          {product.product_code}
                        </p>
                        <p className="text-xs text-slate-500">
                          {product.sku || "No SKU"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatPrice(product.selling_price)}
                        </p>

                        {product.mrp !== null &&
                          product.selling_price !== null &&
                          product.mrp > product.selling_price && (
                            <p className="text-xs text-slate-400 line-through">
                              {formatPrice(product.mrp)}
                            </p>
                          )}
                      </td>

                      <td className="px-5 py-4">
                        <p
                          className={`text-sm font-semibold ${
                            (product.stock_quantity ?? 0) <=
                            (product.minimum_stock ?? 0)
                              ? "text-amber-600"
                              : "text-slate-900"
                          }`}
                        >
                          {product.stock_quantity ?? 0}
                        </p>

                        <p className="text-xs text-slate-500">
                          Min {product.minimum_stock ?? 0}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            product.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                            aria-label={`Edit ${product.product_name}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(product)}
                            disabled={deletingId === product.id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Delete ${product.product_name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {filteredProducts.map((product) => (
                <article key={product.id} className="p-4">
                  <div className="flex gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {product.thumbnail_url ? (
                        <Image
                          src={product.thumbnail_url}
                          alt=""
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold text-slate-900">
                            {product.product_name}
                          </h2>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {product.product_code}
                            {product.sku ? ` • ${product.sku}` : ""}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            product.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-500">Price</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-900">
                            {formatPrice(product.selling_price)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">Stock</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-900">
                            {product.stock_quantity ?? 0}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDelete(product)}
                          disabled={deletingId === product.id}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
        >
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="product-modal-title"
                  className="text-lg font-bold text-slate-900"
                >
                  {editingProduct ? "Edit Product" : "Add Product"}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {editingProduct
                    ? "Update your product information."
                    : "Add a product to your business catalog."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto px-5 py-5 sm:px-6"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="product_name"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Product Name *
                  </label>
                  <input
                    id="product_name"
                    value={form.product_name}
                    onChange={(event) =>
                      updateForm("product_name", event.target.value)
                    }
                    placeholder="e.g. Rotavator Blade"
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="product_code"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Product Code *
                  </label>
                  <input
                    id="product_code"
                    value={form.product_code}
                    onChange={(event) =>
                      updateForm("product_code", event.target.value)
                    }
                    placeholder="e.g. RB-001"
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sku"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    SKU
                  </label>
                  <input
                    id="sku"
                    value={form.sku}
                    onChange={(event) => updateForm("sku", event.target.value)}
                    placeholder="Optional SKU"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="brand"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Brand
                  </label>
                  <input
                    id="brand"
                    value={form.brand}
                    onChange={(event) =>
                      updateForm("brand", event.target.value)
                    }
                    placeholder="Brand name"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="model"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Model
                  </label>
                  <input
                    id="model"
                    value={form.model}
                    onChange={(event) =>
                      updateForm("model", event.target.value)
                    }
                    placeholder="Model name / number"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="selling_price"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Selling Price
                  </label>
                  <input
                    id="selling_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.selling_price}
                    onChange={(event) =>
                      updateForm("selling_price", event.target.value)
                    }
                    placeholder="0.00"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="mrp"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    MRP
                  </label>
                  <input
                    id="mrp"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.mrp}
                    onChange={(event) =>
                      updateForm("mrp", event.target.value)
                    }
                    placeholder="0.00"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cost_price"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Cost Price
                  </label>
                  <input
                    id="cost_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost_price}
                    onChange={(event) =>
                      updateForm("cost_price", event.target.value)
                    }
                    placeholder="0.00"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="stock_quantity"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Stock Quantity
                  </label>
                  <input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock_quantity}
                    onChange={(event) =>
                      updateForm("stock_quantity", event.target.value)
                    }
                    placeholder="0"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="minimum_stock"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Minimum Stock
                  </label>
                  <input
                    id="minimum_stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.minimum_stock}
                    onChange={(event) =>
                      updateForm("minimum_stock", event.target.value)
                    }
                    placeholder="0"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="product-image" className="text-sm font-semibold text-slate-700">
                      Product Image
                    </label>
                    {productImagePreview ? (
                      <button type="button" onClick={clearProductImage} className="text-xs font-semibold text-red-600 hover:text-red-700">
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <label
                    htmlFor="product-image"
                    className="group relative flex min-h-48 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-slate-400"
                  >
                    {productImagePreview ? (
                      <Image
                        src={productImagePreview}
                        alt="Product preview"
                        fill
                        unoptimized={productImagePreview.startsWith("blob:")}
                        className="object-contain p-4"
                      />
                    ) : (
                      <div className="text-center">
                        <UploadCloud className="mx-auto h-9 w-9 text-slate-500" />
                        <p className="mt-2 text-sm font-semibold text-slate-700">Upload product image</p>
                        <p className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP · 10 MB max</p>
                      </div>
                    )}
                    <input
                      id="product-image"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        handleProductImageChange(event.target.files?.[0]);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>

                  <p className="mt-1.5 text-xs text-slate-500">
                    Upload one primary image for this product. It will be stored in the existing Twimzi media system.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="short_description"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Short Description
                  </label>
                  <input
                    id="short_description"
                    value={form.short_description}
                    onChange={(event) =>
                      updateForm("short_description", event.target.value)
                    }
                    placeholder="Short product summary"
                    maxLength={500}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="description"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="Detailed product description"
                    rows={5}
                    className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      updateForm("is_active", event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Active Product
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Allow this product to appear as active in your catalog.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(event) =>
                      updateForm("is_featured", event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Featured Product
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Mark this product as featured for future discovery
                      placements.
                    </span>
                  </span>
                </label>
              </div>

              {error && (
                <div
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {editingProduct ? "Update Product" : "Create Product"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}