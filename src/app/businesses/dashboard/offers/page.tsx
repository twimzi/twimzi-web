"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock3,
  Edit3,
  Gift,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Business = {
  id: string;
  business_name: string;
};

type Offer = {
  id: string;
  business_id: string;
  category_id: string | null;
  cover_media_id: string | null;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  coupon_code: string | null;
  offer_type: string;
  discount_type: string | null;
  discount_value: number | null;
  minimum_order_amount: number | null;
  maximum_discount_amount: number | null;
  redemption_limit: number | null;
  redemption_count: number | null;
  per_user_limit: number | null;
  start_at: string;
  end_at: string;
  visibility: string | null;
  status: string;
  priority: number | null;
  is_featured: boolean | null;
  terms_conditions: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_active: boolean;
};

type OfferForm = {
  title: string;
  slug: string;
  short_description: string;
  description: string;
  coupon_code: string;
  offer_type: string;
  discount_type: string;
  discount_value: string;
  minimum_order_amount: string;
  maximum_discount_amount: string;
  redemption_limit: string;
  per_user_limit: string;
  start_at: string;
  end_at: string;
  visibility: string;
  terms_conditions: string;
  priority: string;
  is_featured: boolean;
  is_active: boolean;
};

const emptyForm: OfferForm = {
  title: "",
  slug: "",
  short_description: "",
  description: "",
  coupon_code: "",
  offer_type: "discount",
  discount_type: "percentage",
  discount_value: "0",
  minimum_order_amount: "",
  maximum_discount_amount: "",
  redemption_limit: "0",
  per_user_limit: "1",
  start_at: "",
  end_at: "",
  visibility: "public",
  terms_conditions: "",
  priority: "0",
  is_featured: false,
  is_active: true,
};

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
}

function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDiscount(offer: Offer) {
  if (offer.discount_value === null) {
    return "Offer";
  }

  if (offer.discount_type === "percentage") {
    return `${offer.discount_value}% OFF`;
  }

  if (offer.discount_type === "fixed") {
    return `₹${offer.discount_value} OFF`;
  }

  return String(offer.discount_value);
}

function getOfferStatus(offer: Offer) {
  const now = Date.now();
  const start = new Date(offer.start_at).getTime();
  const end = new Date(offer.end_at).getTime();

  if (!offer.is_active) {
    return "inactive";
  }

  if (offer.status === "draft") {
    return "draft";
  }

  if (end < now) {
    return "expired";
  }

  if (start > now) {
    return "scheduled";
  }

  if (offer.status === "active") {
    return "active";
  }

  return offer.status;
}

function statusLabel(status: string) {
  switch (status) {
    case "active":
      return "Active";
    case "scheduled":
      return "Scheduled";
    case "expired":
      return "Expired";
    case "draft":
      return "Draft";
    case "inactive":
      return "Inactive";
    default:
      return status;
  }
}

function statusClass(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700";
    case "scheduled":
      return "bg-blue-50 text-blue-700";
    case "expired":
      return "bg-red-50 text-red-700";
    case "draft":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function toLocalDateTimeInput(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return local.toISOString().slice(0, 16);
}

function localDateTimeToIso(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default function BusinessOffersDashboardPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [form, setForm] = useState<OfferForm>(emptyForm);

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
          throw new Error("Please sign in to manage your offers.");
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

        const { data: offerData, error: offersError } = await supabase.rpc(
          "get_business_offers",
          {
            p_business_id: businessData.id,
          },
        );

        if (offersError) {
          throw offersError;
        }

        if (cancelled) {
          return;
        }

        setBusiness(businessData);
        setOffers((offerData ?? []) as Offer[]);
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load your offers.",
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

  async function loadOffers(businessId: string) {
    const supabase = createSupabaseBrowserClient();

    const { data, error: offersError } = await supabase.rpc(
      "get_business_offers",
      {
        p_business_id: businessId,
      },
    );

    if (offersError) {
      throw offersError;
    }

    setOffers((data ?? []) as Offer[]);
  }

  const filteredOffers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return offers;
    }

    return offers.filter((offer) =>
      [
        offer.title,
        offer.slug,
        offer.short_description,
        offer.description,
        offer.coupon_code,
        offer.offer_type,
        offer.status,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [offers, search]);

  function openCreateModal() {
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    setEditingOffer(null);
    setForm({
      ...emptyForm,
      start_at: toLocalDateTimeInput(now.toISOString()),
      end_at: toLocalDateTimeInput(end.toISOString()),
    });
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function openEditModal(offer: Offer) {
    setEditingOffer(offer);

    setForm({
      title: offer.title ?? "",
      slug: offer.slug ?? "",
      short_description: offer.short_description ?? "",
      description: offer.description ?? "",
      coupon_code: offer.coupon_code ?? "",
      offer_type: offer.offer_type ?? "discount",
      discount_type: offer.discount_type ?? "percentage",
      discount_value:
        offer.discount_value === null ? "0" : String(offer.discount_value),
      minimum_order_amount:
        offer.minimum_order_amount === null
          ? ""
          : String(offer.minimum_order_amount),
      maximum_discount_amount:
        offer.maximum_discount_amount === null
          ? ""
          : String(offer.maximum_discount_amount),
      redemption_limit:
        offer.redemption_limit === null
          ? "0"
          : String(offer.redemption_limit),
      per_user_limit:
        offer.per_user_limit === null ? "1" : String(offer.per_user_limit),
      start_at: toLocalDateTimeInput(offer.start_at),
      end_at: toLocalDateTimeInput(offer.end_at),
      visibility: offer.visibility ?? "public",
      terms_conditions: offer.terms_conditions ?? "",
      priority: offer.priority === null ? "0" : String(offer.priority),
      is_featured: Boolean(offer.is_featured),
      is_active: offer.is_active,
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
    setEditingOffer(null);
    setForm(emptyForm);
  }

  function updateForm<K extends keyof OfferForm>(
    field: K,
    value: OfferForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleTitleChange(value: string) {
    setForm((current) => ({
      ...current,
      title: value,
      slug: editingOffer || current.slug ? current.slug : createSlug(value),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!business) {
      setError("Business profile not found.");
      return;
    }

    if (!form.title.trim()) {
      setError("Offer title is required.");
      return;
    }

    if (!form.slug.trim()) {
      setError("Offer slug is required.");
      return;
    }

    const startIso = localDateTimeToIso(form.start_at);
    const endIso = localDateTimeToIso(form.end_at);

    if (!startIso || !endIso) {
      setError("Start and end dates are required.");
      return;
    }

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setError("End date must be after start date.");
      return;
    }

    if (toNumber(form.discount_value, -1) < 0) {
      setError("Discount value cannot be negative.");
      return;
    }

    if (form.discount_type === "percentage" && toNumber(form.discount_value) > 100) {
      setError("Percentage discount cannot exceed 100%.");
      return;
    }

    if (toNumber(form.minimum_order_amount, -1) < 0) {
      setError("Minimum order amount cannot be negative.");
      return;
    }

    if (toNumber(form.maximum_discount_amount, -1) < 0) {
      setError("Maximum discount amount cannot be negative.");
      return;
    }

    if (toNumber(form.redemption_limit, -1) < 0) {
      setError("Redemption limit cannot be negative.");
      return;
    }

    if (toNumber(form.per_user_limit, 0) < 1) {
      setError("Per-user limit must be at least 1.");
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

      if (editingOffer) {
        const { error: updateError } = await supabase
          .from("offers")
          .update({
            title: form.title.trim(),
            slug: form.slug.trim(),
            short_description: form.short_description.trim() || null,
            description: form.description.trim() || null,
            coupon_code: form.coupon_code.trim() || null,
            offer_type: form.offer_type,
            discount_type: form.discount_type || null,
            discount_value: toNullableNumber(form.discount_value) ?? 0,
            minimum_order_amount: toNullableNumber(
              form.minimum_order_amount,
            ),
            maximum_discount_amount: toNullableNumber(
              form.maximum_discount_amount,
            ),
            redemption_limit: toNullableNumber(form.redemption_limit),
            per_user_limit: toNumber(form.per_user_limit, 1),
            start_at: startIso,
            end_at: endIso,
            visibility: form.visibility,
            status: "draft",
            priority: toNumber(form.priority, 0),
            is_featured: form.is_featured,
            is_active: form.is_active,
            terms_conditions: form.terms_conditions.trim() || null,
            updated_by: user.id,
          })
          .eq("id", editingOffer.id)
          .eq("business_id", business.id);

        if (updateError) {
          throw updateError;
        }

        setSuccess("Offer updated successfully.");
      } else {
        const { error: insertError } = await supabase.from("offers").insert({
          business_id: business.id,
          title: form.title.trim(),
          slug: form.slug.trim(),
          short_description: form.short_description.trim() || null,
          description: form.description.trim() || null,
          coupon_code: form.coupon_code.trim() || null,
          offer_type: form.offer_type,
          discount_type: form.discount_type || null,
          discount_value: toNullableNumber(form.discount_value) ?? 0,
          minimum_order_amount: toNullableNumber(form.minimum_order_amount),
          maximum_discount_amount: toNullableNumber(
            form.maximum_discount_amount,
          ),
          redemption_limit: toNullableNumber(form.redemption_limit),
          per_user_limit: toNumber(form.per_user_limit, 1),
          start_at: startIso,
          end_at: endIso,
          visibility: form.visibility,
          status: "draft",
          priority: toNumber(form.priority, 0),
          is_featured: form.is_featured,
          is_active: form.is_active,
          terms_conditions: form.terms_conditions.trim() || null,
          created_by: user.id,
          updated_by: user.id,
        });

        if (insertError) {
          throw insertError;
        }

        setSuccess("Offer created successfully.");
      }

      await loadOffers(business.id);

      setModalOpen(false);
      setEditingOffer(null);
      setForm(emptyForm);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save the offer.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(offer: Offer) {
    if (!business || deletingId) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${offer.title}"? This offer will be removed from your offer list.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(offer.id);
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
        .from("offers")
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
          status: "expired",
          updated_by: user.id,
        })
        .eq("id", offer.id)
        .eq("business_id", business.id);

      if (deleteError) {
        throw deleteError;
      }

      await loadOffers(business.id);
      setSuccess("Offer deleted successfully.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete the offer.",
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
          <Gift className="mx-auto h-10 w-10 text-slate-400" />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Business profile required
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {error ??
              "Create or activate your business profile before managing offers."}
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
                <Gift className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Offers
                </h1>

                <p className="text-sm text-slate-600">
                  Manage offers for {business.business_name}.
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
            Add Offer
          </button>
        </div>

        {(error || success) && !modalOpen && (
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
                Total Offers
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {offers.length}
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search offers..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>
        </section>

        {filteredOffers.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Gift className="h-7 w-7 text-slate-500" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              {search ? "No offers found" : "No offers yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              {search
                ? "Try a different offer title, coupon code, or description."
                : "Create an offer to promote a discount or special deal for your customers."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Add Offer
              </button>
            )}
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Offer
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Discount
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Validity
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Redemptions
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
                  {filteredOffers.map((offer) => {
                    const currentStatus = getOfferStatus(offer);

                    return (
                      <tr
                        key={offer.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {offer.title}
                            </p>

                            {offer.short_description && (
                              <p className="mt-0.5 max-w-sm truncate text-xs text-slate-500">
                                {offer.short_description}
                              </p>
                            )}

                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {offer.coupon_code && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                  {offer.coupon_code}
                                </span>
                              )}

                              {offer.is_featured && (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-900">
                            {formatDiscount(offer)}
                          </p>

                          {offer.minimum_order_amount !== null && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              Min. order{" "}
                              {formatDiscount({
                                ...offer,
                                discount_value: offer.minimum_order_amount,
                                discount_type: "fixed",
                              })}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-700">
                            {formatDate(offer.start_at)}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            to {formatDate(offer.end_at)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-900">
                            {offer.redemption_count ?? 0}
                            {offer.redemption_limit
                              ? ` / ${offer.redemption_limit}`
                              : ""}
                          </p>

                          <p className="text-xs text-slate-500">
                            {offer.per_user_limit ?? 1} per user
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                              currentStatus,
                            )}`}
                          >
                            {statusLabel(currentStatus)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(offer)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                              aria-label={`Edit ${offer.title}`}
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleDelete(offer)}
                              disabled={deletingId === offer.id}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Delete ${offer.title}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {filteredOffers.map((offer) => {
                const currentStatus = getOfferStatus(offer);

                return (
                  <article key={offer.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-slate-900">
                          {offer.title}
                        </h2>

                        {offer.coupon_code && (
                          <p className="mt-0.5 text-xs font-medium text-slate-500">
                            Code: {offer.coupon_code}
                          </p>
                        )}
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(
                          currentStatus,
                        )}`}
                      >
                        {statusLabel(currentStatus)}
                      </span>
                    </div>

                    {offer.short_description && (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {offer.short_description}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Discount</p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">
                          {formatDiscount(offer)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Redemptions</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900">
                          {offer.redemption_count ?? 0}
                          {offer.redemption_limit
                            ? ` / ${offer.redemption_limit}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>
                        {formatDate(offer.start_at)} —{" "}
                        {formatDate(offer.end_at)}
                      </span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(offer)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(offer)}
                        disabled={deletingId === offer.id}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-modal-title"
        >
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="offer-modal-title"
                  className="text-lg font-bold text-slate-900"
                >
                  {editingOffer ? "Edit Offer" : "Add Offer"}
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  {editingOffer
                    ? "Update your offer information."
                    : "Create a promotional offer for your customers."}
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
                    htmlFor="offer_title"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Offer Title *
                  </label>

                  <input
                    id="offer_title"
                    value={form.title}
                    onChange={(event) => handleTitleChange(event.target.value)}
                    placeholder="e.g. Monsoon Service Discount"
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="offer_slug"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Slug *
                  </label>

                  <input
                    id="offer_slug"
                    value={form.slug}
                    onChange={(event) =>
                      updateForm("slug", event.target.value)
                    }
                    placeholder="monsoon-service-discount"
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="coupon_code"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Coupon Code
                  </label>

                  <input
                    id="coupon_code"
                    value={form.coupon_code}
                    onChange={(event) =>
                      updateForm("coupon_code", event.target.value)
                    }
                    placeholder="e.g. MONSOON20"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm uppercase text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="offer_type"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Offer Type
                  </label>

                  <select
                    id="offer_type"
                    value={form.offer_type}
                    onChange={(event) =>
                      updateForm("offer_type", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="discount">Discount</option>
                    <option value="coupon">Coupon</option>
                    <option value="promotion">Promotion</option>
                    <option value="deal">Deal</option>
                    <option value="cashback">Cashback</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="discount_type"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Discount Type
                  </label>

                  <select
                    id="discount_type"
                    value={form.discount_type}
                    onChange={(event) =>
                      updateForm("discount_type", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="discount_value"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Discount Value
                  </label>

                  <input
                    id="discount_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount_value}
                    onChange={(event) =>
                      updateForm("discount_value", event.target.value)
                    }
                    placeholder="20"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="minimum_order_amount"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Minimum Order Amount
                  </label>

                  <input
                    id="minimum_order_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minimum_order_amount}
                    onChange={(event) =>
                      updateForm(
                        "minimum_order_amount",
                        event.target.value,
                      )
                    }
                    placeholder="Optional"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="maximum_discount_amount"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Maximum Discount
                  </label>

                  <input
                    id="maximum_discount_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.maximum_discount_amount}
                    onChange={(event) =>
                      updateForm(
                        "maximum_discount_amount",
                        event.target.value,
                      )
                    }
                    placeholder="Optional"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="redemption_limit"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Redemption Limit
                  </label>

                  <input
                    id="redemption_limit"
                    type="number"
                    min="0"
                    step="1"
                    value={form.redemption_limit}
                    onChange={(event) =>
                      updateForm("redemption_limit", event.target.value)
                    }
                    placeholder="0 = unlimited"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="per_user_limit"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Per User Limit
                  </label>

                  <input
                    id="per_user_limit"
                    type="number"
                    min="1"
                    step="1"
                    value={form.per_user_limit}
                    onChange={(event) =>
                      updateForm("per_user_limit", event.target.value)
                    }
                    placeholder="1"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="start_at"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Starts *
                  </label>

                  <input
                    id="start_at"
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(event) =>
                      updateForm("start_at", event.target.value)
                    }
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="end_at"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Ends *
                  </label>

                  <input
                    id="end_at"
                    type="datetime-local"
                    value={form.end_at}
                    onChange={(event) =>
                      updateForm("end_at", event.target.value)
                    }
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="visibility"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Visibility
                  </label>

                  <select
                    id="visibility"
                    value={form.visibility}
                    onChange={(event) =>
                      updateForm("visibility", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="followers">Followers</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="priority"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Priority
                  </label>

                  <input
                    id="priority"
                    type="number"
                    step="1"
                    value={form.priority}
                    onChange={(event) =>
                      updateForm("priority", event.target.value)
                    }
                    placeholder="0"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
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
                    placeholder="Short offer summary"
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
                    placeholder="Detailed offer description"
                    rows={4}
                    className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="terms_conditions"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Terms & Conditions
                  </label>

                  <textarea
                    id="terms_conditions"
                    value={form.terms_conditions}
                    onChange={(event) =>
                      updateForm("terms_conditions", event.target.value)
                    }
                    placeholder="Offer terms, exclusions, redemption conditions..."
                    rows={4}
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
                      Active Offer
                    </span>

                    <span className="mt-0.5 block text-xs text-slate-500">
                      Keep the offer enabled.
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
                      Featured Offer
                    </span>

                    <span className="mt-0.5 block text-xs text-slate-500">
                      Mark this offer as featured for future discovery
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
                      {editingOffer ? "Update Offer" : "Create Offer"}
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