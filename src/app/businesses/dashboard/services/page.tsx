"use client";

import {
  ArrowLeft,
  Check,
  Clock3,
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Business = {
  id: string;
  business_name: string;
};

type Service = {
  id: string;
  business_id: string;
  service_code: string;
  service_name: string;
  slug: string | null;
  short_description: string | null;
  description: string | null;
  duration_minutes: number | null;
  price: number | null;
  booking_required: boolean;
  home_service_available: boolean;
  service_radius_km: number | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type ServiceForm = {
  service_name: string;
  service_code: string;
  slug: string;
  short_description: string;
  description: string;
  duration_minutes: string;
  price: string;
  booking_required: boolean;
  home_service_available: boolean;
  service_radius_km: string;
  is_featured: boolean;
  is_active: boolean;
};

const emptyForm: ServiceForm = {
  service_name: "",
  service_code: "",
  slug: "",
  short_description: "",
  description: "",
  duration_minutes: "",
  price: "",
  booking_required: false,
  home_service_available: false,
  service_radius_km: "",
  is_featured: false,
  is_active: true,
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

function formatDuration(value: number | null) {
  if (value === null || value === undefined || value <= 0) {
    return "—";
  }

  if (value < 60) {
    return `${value} min`;
  }

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  if (minutes === 0) {
    return `${hours} hr${hours === 1 ? "" : "s"}`;
  }

  return `${hours} hr ${minutes} min`;
}

export default function BusinessServicesDashboardPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);

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
          throw new Error("Please sign in to manage your services.");
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

        const { data: serviceData, error: servicesError } = await supabase
          .from("services")
          .select(
            "id, business_id, service_code, service_name, slug, short_description, description, duration_minutes, price, booking_required, home_service_available, service_radius_km, is_featured, is_active, created_at, updated_at, deleted_at",
          )
          .eq("business_id", businessData.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (servicesError) {
          throw servicesError;
        }

        if (cancelled) {
          return;
        }

        setBusiness(businessData);
        setServices(serviceData ?? []);
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load your services.",
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

  async function loadServices(businessId: string) {
    const supabase = createSupabaseBrowserClient();

    const { data, error: servicesError } = await supabase
      .from("services")
      .select(
        "id, business_id, service_code, service_name, slug, short_description, description, duration_minutes, price, booking_required, home_service_available, service_radius_km, is_featured, is_active, created_at, updated_at, deleted_at",
      )
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (servicesError) {
      throw servicesError;
    }

    setServices(data ?? []);
  }

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return services;
    }

    return services.filter((service) =>
      [
        service.service_name,
        service.service_code,
        service.slug,
        service.short_description,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [services, search]);

  function openCreateModal() {
    setEditingService(null);
    setForm(emptyForm);
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function openEditModal(service: Service) {
    setEditingService(service);

    setForm({
      service_name: service.service_name ?? "",
      service_code: service.service_code ?? "",
      slug: service.slug ?? "",
      short_description: service.short_description ?? "",
      description: service.description ?? "",
      duration_minutes:
        service.duration_minutes === null
          ? ""
          : String(service.duration_minutes),
      price: service.price === null ? "" : String(service.price),
      booking_required: service.booking_required,
      home_service_available: service.home_service_available,
      service_radius_km:
        service.service_radius_km === null
          ? ""
          : String(service.service_radius_km),
      is_featured: service.is_featured,
      is_active: service.is_active,
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
    setEditingService(null);
    setForm(emptyForm);
  }

  function updateForm<K extends keyof ServiceForm>(
    field: K,
    value: ServiceForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!business) {
      setError("Business profile not found.");
      return;
    }

    if (!form.service_name.trim()) {
      setError("Service name is required.");
      return;
    }

    if (!form.service_code.trim()) {
      setError("Service code is required.");
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
        service_name: form.service_name.trim(),
        service_code: form.service_code.trim(),
        slug: form.slug.trim() || null,
        short_description: form.short_description.trim() || null,
        description: form.description.trim() || null,
        duration_minutes: toNullableNumber(form.duration_minutes),
        price: toNullableNumber(form.price),
        booking_required: form.booking_required,
        home_service_available: form.home_service_available,
        service_radius_km: toNullableNumber(form.service_radius_km),
        is_featured: form.is_featured,
        is_active: form.is_active,
        updated_by: user.id,
      };

      if (editingService) {
        const { error: updateError } = await supabase
          .from("services")
          .update(payload)
          .eq("id", editingService.id)
          .eq("business_id", business.id);

        if (updateError) {
          throw updateError;
        }

        setSuccess("Service updated successfully.");
      } else {
        const { error: insertError } = await supabase
          .from("services")
          .insert({
            ...payload,
            created_by: user.id,
          });

        if (insertError) {
          throw insertError;
        }

        setSuccess("Service created successfully.");
      }

      await loadServices(business.id);

      setModalOpen(false);
      setEditingService(null);
      setForm(emptyForm);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save the service.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(service: Service) {
    if (!business || deletingId) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${service.service_name}"? This service will be removed from your active service list.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(service.id);
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
        .from("services")
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
          updated_by: user.id,
        })
        .eq("id", service.id)
        .eq("business_id", business.id);

      if (deleteError) {
        throw deleteError;
      }

      await loadServices(business.id);
      setSuccess("Service deleted successfully.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete the service.",
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
          <Clock3 className="mx-auto h-10 w-10 text-slate-400" />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Business profile required
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {error ??
              "Create or activate your business profile before managing services."}
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
                <Clock3 className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Services
                </h1>

                <p className="text-sm text-slate-600">
                  Manage services for {business.business_name}.
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
            Add Service
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
                Total Services
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {services.length}
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search services..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>
        </section>

        {filteredServices.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Clock3 className="h-7 w-7 text-slate-500" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              {search ? "No services found" : "No services yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              {search
                ? "Try a different service name, code, slug, or description."
                : "Add your first service to start building your business service catalog."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Add Service
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
                      Service
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Code
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Price
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Duration
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
                  {filteredServices.map((service) => (
                    <tr
                      key={service.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {service.service_name}
                          </p>

                          {service.short_description && (
                            <p className="mt-0.5 max-w-sm truncate text-xs text-slate-500">
                              {service.short_description}
                            </p>
                          )}

                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {service.is_featured && (
                              <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                Featured
                              </span>
                            )}

                            {service.booking_required && (
                              <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                Booking
                              </span>
                            )}

                            {service.home_service_available && (
                              <span className="inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
                                Home Service
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-900">
                        {service.service_code}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        {formatPrice(service.price)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {formatDuration(service.duration_minutes)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            service.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {service.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(service)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                            aria-label={`Edit ${service.service_name}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(service)}
                            disabled={deletingId === service.id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Delete ${service.service_name}`}
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
              {filteredServices.map((service) => (
                <article key={service.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-slate-900">
                        {service.service_name}
                      </h2>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {service.service_code}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        service.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {service.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {service.short_description && (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {service.short_description}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Price</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        {formatPrice(service.price)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Duration</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        {formatDuration(service.duration_minutes)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {service.is_featured && (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                        Featured
                      </span>
                    )}

                    {service.booking_required && (
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                        Booking
                      </span>
                    )}

                    {service.home_service_available && (
                      <span className="rounded-full bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-700">
                        Home Service
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(service)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDelete(service)}
                      disabled={deletingId === service.id}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
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
          aria-labelledby="service-modal-title"
        >
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="service-modal-title"
                  className="text-lg font-bold text-slate-900"
                >
                  {editingService ? "Edit Service" : "Add Service"}
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  {editingService
                    ? "Update your service information."
                    : "Add a service to your business profile."}
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
                    htmlFor="service_name"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Service Name *
                  </label>

                  <input
                    id="service_name"
                    value={form.service_name}
                    onChange={(event) =>
                      updateForm("service_name", event.target.value)
                    }
                    placeholder="e.g. AC Repair"
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="service_code"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Service Code *
                  </label>

                  <input
                    id="service_code"
                    value={form.service_code}
                    onChange={(event) =>
                      updateForm("service_code", event.target.value)
                    }
                    placeholder="e.g. AC-001"
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="slug"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Slug
                  </label>

                  <input
                    id="slug"
                    value={form.slug}
                    onChange={(event) =>
                      updateForm("slug", event.target.value)
                    }
                    placeholder="ac-repair"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Price
                  </label>

                  <input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      updateForm("price", event.target.value)
                    }
                    placeholder="0.00"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="duration_minutes"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Duration (minutes)
                  </label>

                  <input
                    id="duration_minutes"
                    type="number"
                    min="0"
                    step="1"
                    value={form.duration_minutes}
                    onChange={(event) =>
                      updateForm("duration_minutes", event.target.value)
                    }
                    placeholder="60"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="service_radius_km"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Home Service Radius (km)
                  </label>

                  <input
                    id="service_radius_km"
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.service_radius_km}
                    onChange={(event) =>
                      updateForm("service_radius_km", event.target.value)
                    }
                    placeholder="10"
                    disabled={!form.home_service_available}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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
                    placeholder="Short service summary"
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
                    placeholder="Detailed service description"
                    rows={5}
                    className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.booking_required}
                    onChange={(event) =>
                      updateForm("booking_required", event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Booking Required
                    </span>

                    <span className="mt-0.5 block text-xs text-slate-500">
                      Indicate that customers need to book this service.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.home_service_available}
                    onChange={(event) => {
                      updateForm(
                        "home_service_available",
                        event.target.checked,
                      );

                      if (!event.target.checked) {
                        updateForm("service_radius_km", "");
                      }
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Home Service Available
                    </span>

                    <span className="mt-0.5 block text-xs text-slate-500">
                      Customers can receive this service at their location.
                    </span>
                  </span>
                </label>

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
                      Active Service
                    </span>

                    <span className="mt-0.5 block text-xs text-slate-500">
                      Keep this service active in your catalog.
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
                      Featured Service
                    </span>

                    <span className="mt-0.5 block text-xs text-slate-500">
                      Mark this service as featured for future discovery
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
                      {editingService ? "Update Service" : "Create Service"}
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