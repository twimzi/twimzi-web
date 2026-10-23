"use client";

import Link from "next/link";
import { ExternalLink, Pencil, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";

type Service = {
  id: string;
  service_name: string | null;
  service_code: string | null;
  slug: string | null;
  short_description: string | null;
  duration_minutes: number | null;
  price: number | null;
  booking_required: boolean | null;
  home_service_available: boolean | null;
  service_radius_km: number | null;
  is_featured: boolean | null;
  is_active: boolean | null;
};

type Props = {
  service: Service;
  onUpdate: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
};

export function ServiceActions({ service, onUpdate, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(service.service_name ?? "");
  const [code, setCode] = useState(service.service_code ?? "");
  const [slug, setSlug] = useState(service.slug ?? "");
  const [description, setDescription] = useState(
    service.short_description ?? "",
  );
  const [duration, setDuration] = useState(
    service.duration_minutes == null ? "" : String(service.duration_minutes),
  );
  const [price, setPrice] = useState(
    service.price == null ? "" : String(service.price),
  );
  const [booking, setBooking] = useState(Boolean(service.booking_required));
  const [homeService, setHomeService] = useState(
    Boolean(service.home_service_available),
  );
  const [radius, setRadius] = useState(
    service.service_radius_km == null ? "" : String(service.service_radius_km),
  );
  const [featured, setFeatured] = useState(Boolean(service.is_featured));
  const [active, setActive] = useState(Boolean(service.is_active));

  function handleSave() {
    setError("");

    if (!name.trim()) {
      setError("Service name is required.");
      return;
    }
    if (!code.trim()) {
      setError("Service code is required.");
      return;
    }
    if (!price.trim()) {
      setError("Price is required.");
      return;
    }

    const formData = new FormData();
    formData.append("service_id", service.id);
    formData.append("service_name", name.trim());
    formData.append("service_code", code.trim());
    formData.append("slug", slug.trim() || "");
    formData.append("short_description", description.trim() || "");
    formData.append("duration_minutes", duration.trim() || "0");
    formData.append("price", price.trim());
    formData.append("booking_required", String(booking));
    formData.append("home_service_available", String(homeService));
    formData.append("service_radius_km", radius.trim() || "0");
    formData.append("is_featured", String(featured));
    formData.append("is_active", String(active));

    startTransition(async () => {
      try {
        await onUpdate(formData);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update service");
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${service.service_name ?? "this service"}"?`)) {
      return;
    }

    setDeleting(true);
    setError("");

    const formData = new FormData();
    formData.append("service_id", service.id);

    startTransition(async () => {
      try {
        await onDelete(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete service");
        setDeleting(false);
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {service.slug ? (
          <Link
            href={`/services/${service.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label={`Open ${service.service_name ?? "service"}`}
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
          aria-label={`Edit ${service.service_name ?? "service"}`}
        >
          <Pencil className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleting}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          aria-label={`Delete ${service.service_name ?? "service"}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-extrabold">Edit Service</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Update the existing service record.
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
              <Field label="Service Name" value={name} onChange={setName} />
              <Field label="Service Code" value={code} onChange={setCode} />
              <Field label="Slug" value={slug} onChange={setSlug} />

              <Field
                label="Short Description"
                value={description}
                onChange={setDescription}
              />

              <Field
                label="Duration (minutes)"
                value={duration}
                onChange={setDuration}
                type="number"
              />

              <Field
                label="Price"
                value={price}
                onChange={setPrice}
                type="number"
              />

              <Field
                label="Service Radius (km)"
                value={radius}
                onChange={setRadius}
                type="number"
              />

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={booking}
                  onChange={(event) => setBooking(event.target.checked)}
                />
                Booking Required
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={homeService}
                  onChange={(event) => setHomeService(event.target.checked)}
                />
                Home Service
              </label>

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
                onClick={() => void handleSave()}
                disabled={isPending}
                className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save Changes"}
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